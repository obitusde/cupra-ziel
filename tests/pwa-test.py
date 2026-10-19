# PWA-Test mit Playwright (Python) und nachgebautem Apps-Script-Dienst. Version 0.1.0 (19.10.2026)
# Aufruf: python3 tests/pwa-test.py . <ordner-fuer-screenshots>
import json, sys, threading, http.server, functools
from playwright.sync_api import sync_playwright
root = sys.argv[1]; out = sys.argv[2]
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
antwort = {"ok": True, "version": "0.1.0", "name": "Café am Markt", "lat": 51.386212, "lon": 7.778578,
  "adresse": "Hauptstraße 210, 58675 Hemer, Deutschland", "abstandM": 140,
  "varianten": [{"art": "Adresse", "text": "Hauptstraße 210, 58675 Hemer"}, {"art": "Name + Ort", "text": "Café am Markt, Hemer"},
                {"art": "Adresse mit Land", "text": "Hauptstraße 210, 58675 Hemer, Deutschland"}, {"art": "Koordinaten", "text": "51.386212, 7.778578"}]}
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, color_scheme="dark")
    ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:8765")
    pg = ctx.new_page()
    logs = []
    pg.on("console", lambda m: logs.append(m.text))
    pg.on("pageerror", lambda e: logs.append("PAGEERROR " + str(e)))
    seen = {}
    def handle(route):
        seen['url'] = route.request.url
        route.fulfill(status=200, content_type="application/json", body=json.dumps(antwort))
    pg.route("https://dienst.test/**", handle)
    text = "Café am Markt\nMarktplatz 3, 58675 Hemer\nhttps://maps.app.goo.gl/tnxVCVgAGfAzY39AA?g_st=ac"
    from urllib.parse import quote
    pg.goto("http://127.0.0.1:8765/?dienst=" + quote("https://dienst.test/exec") + "&text=" + quote(text))
    pg.wait_for_selector("#ergebnis:not([hidden])", timeout=5000)
    print("Haupt:", pg.inner_text("#ergHaupt"))
    print("Hinweis:", pg.inner_text("#ergHinweis"))
    print("Weitere:", pg.inner_text("#liste").replace("\n", " | "))
    print("Dienst-Aufruf:", seen.get('url', '')[:120])
    print("URL nach Start:", pg.url)
    pg.screenshot(path=out + "/ergebnis.png", full_page=True)
    pg.click("#knopfKopieren")
    pg.wait_for_timeout(300)
    print("Zwischenablage:", pg.evaluate("navigator.clipboard.readText()"))
    # Manifest + Fehlerfall
    print("Manifest share_target:", json.load(open(root + "/manifest.json"))["share_target"])
    pg2 = ctx.new_page()
    pg2.route("https://dienst.test/**", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": False, "fehler": "Kein Google-Maps-Link gefunden"})))
    pg2.goto("http://127.0.0.1:8765/?dienst=" + quote("https://dienst.test/exec") + "&text=" + quote("nur Text"))
    pg2.wait_for_timeout(800)
    print("Fehlerfall:", pg2.inner_text("#status"), "| Ergebnis sichtbar:", pg2.is_visible("#ergebnis"))
    pg3 = ctx.new_page(); pg3.goto("http://127.0.0.1:8765/"); pg3.wait_for_timeout(300)
    pg3.screenshot(path=out + "/start.png", full_page=True)
    print("Logs:", logs)
    b.close()
srv.shutdown()
