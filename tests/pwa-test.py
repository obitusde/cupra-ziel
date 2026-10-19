# PWA-Test mit Playwright (Python) und nachgebautem Apps-Script-Dienst. Version 0.4.0 (19.10.2026)
# 0.2.0: Name mitkopieren, Methode K, Version im Kopf, Service Worker
# 0.3.0: Favoriten (POST liste/speichern/loeschen/pruefen), Verlauf, Schnellzugriff ?oeffne=, Rückkehr ?zurueck=
# 0.4.0: „Ans Auto senden" über den MacroDroid-Webhook (nachgebaut), Doppeltipp-Sperre, kein Netz → kopieren;
#        Schnellzugriff nur noch Karte
# Aufruf: python3 tests/pwa-test.py . <ordner-fuer-screenshots>
import json, sys, threading, http.server, functools
from urllib.parse import quote, urlparse, parse_qs
from playwright.sync_api import sync_playwright

root = sys.argv[1]; out = sys.argv[2]
class Leise(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), functools.partial(Leise, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()

ANTWORT = {"ok": True, "version": "0.3.0", "name": "Café am Markt", "lat": 51.386212, "lon": 7.778578,
  "adresse": "Hauptstraße 210, 58675 Hemer, Deutschland", "abstandM": 140,
  "varianten": [{"art": "Adresse", "text": "Hauptstraße 210, 58675 Hemer"}, {"art": "Name + Ort", "text": "Café am Markt, Hemer"},
                {"art": "Adresse mit Land", "text": "Hauptstraße 210, 58675 Hemer, Deutschland"}, {"art": "Koordinaten", "text": "51.386212, 7.778578"}]}
SCHLUESSEL = "geheim123"
favs = [{"id": "f1", "name": "Büro Le Brassus", "adresse": "Route de France 16, 1348 Le Brassus", "lat": None, "lon": None, "reihenfolge": 1}]
anfragen = []

def dienst(route):
    req = route.request
    if req.method == "POST":
        d = json.loads(req.post_data or "{}"); anfragen.append(d)
        if d.get("schluessel") != SCHLUESSEL:
            body = {"ok": False, "fehler": "Schlüssel falsch"}
        elif d["aktion"] == "pruefen":
            body = {"ok": True}
        elif d["aktion"] == "liste":
            body = {"ok": True, "favoriten": favs}
        elif d["aktion"] == "speichern":
            f = d["fav"]
            alt = next((x for x in favs if x["id"] == f.get("id")), None)
            if alt: alt.update({k: f[k] for k in ("name", "adresse", "reihenfolge") if k in f})
            else: favs.append({"id": "f%d" % (len(favs) + 1), "name": f["name"] or f["adresse"], "adresse": f["adresse"], "lat": f.get("lat"), "lon": f.get("lon"), "reihenfolge": len(favs) + 1})
            favs.sort(key=lambda x: x["reihenfolge"])
            body = {"ok": True, "favoriten": favs}
        elif d["aktion"] == "loeschen":
            favs[:] = [x for x in favs if x["id"] != d["id"]]
            body = {"ok": True, "favoriten": favs}
        route.fulfill(status=200, content_type="application/json", body=json.dumps(body)); return
    route.fulfill(status=200, content_type="application/json", body=json.dumps(ANTWORT))

D = "?dienst=" + quote("https://dienst.test/exec")
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, color_scheme="dark")
    ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:8765")
    ctx.route("https://dienst.test/**", dienst)
    navigiert = []
    ctx.route("intent://**", lambda r: (navigiert.append(r.request.url), r.abort()))
    webhooks = []
    ctx.route("https://trigger.macrodroid.com/**", lambda r: (webhooks.append(r.request.url), r.fulfill(status=200, body="ok")))
    pg = ctx.new_page(); logs = []
    pg.on("pageerror", lambda e: logs.append("PAGEERROR " + str(e)))

    # 1. Ohne Schlüssel: Favoriten-Hinweis
    pg.goto("http://127.0.0.1:8765/" + D); pg.wait_for_timeout(400)
    print("Version:", pg.inner_text("#kopfVersion"), "| Favoriten-Hinweis:", pg.inner_text("#favHinweis"))

    # 2. Schlüssel eintragen
    pg.click("#einstellungen summary"); pg.fill("#schluessel", "falsch"); pg.click("#schluesselSpeichern"); pg.wait_for_timeout(300)
    print("Falscher Schlüssel:", pg.inner_text("#schluesselStatus"))
    pg.fill("#schluessel", SCHLUESSEL); pg.click("#schluesselSpeichern"); pg.wait_for_timeout(400)
    print("Richtiger Schlüssel:", pg.inner_text("#schluesselStatus"), "| Favoriten:", pg.inner_text("#favListe").replace("\n", " / "))

    # 3. Teilen → Ergebnis → Verlauf → Als Favorit
    text = "Café am Markt\nMarktplatz 3, 58675 Hemer\nhttps://maps.app.goo.gl/tnxVCVgAGfAzY39AA?g_st=ac"
    pg.goto("http://127.0.0.1:8765/" + D + "&text=" + quote(text))
    pg.wait_for_selector("#ergebnis:not([hidden])", timeout=5000)
    print("Haupt:", pg.inner_text("#ergHaupt"), "| Verlauf:", pg.inner_text("#verlaufListe").replace("\n", " / "))
    pg.click("#knopfFavorit"); pg.wait_for_timeout(200)
    print("Formular:", pg.input_value("#favName"), "|", pg.input_value("#favAdresse"))
    pg.fill("#favName", "Café Hemer"); pg.click("#favSpeichern"); pg.wait_for_timeout(400)
    print("Nach Speichern:", pg.inner_text("#favListe").replace("\n", " / "))
    pg.screenshot(path=out + "/favoriten.png", full_page=True)

    # 4. Favorit antippen → kopiert + myCupra (Karte)
    pg.click("#favListe .fav >> nth=1"); pg.wait_for_timeout(700)
    print("Zwischenablage:", pg.evaluate("navigator.clipboard.readText()"), "| geöffnet:", navigiert[-1][:60] if navigiert else "-")

    # 5. Bearbeiten: nach oben, löschen
    pg.click("#favBearbeiten"); pg.wait_for_timeout(100)
    pg.click("#favListe .favzeile >> nth=1 >> text=↑"); pg.wait_for_timeout(500)
    print("Nach ↑:", [f["name"] for f in favs])
    pg.click("#favListe .favzeile >> nth=1 >> text=✕"); pg.wait_for_timeout(400)
    print("Nach ✕:", [f["name"] for f in favs], "| Schlüssel nie in URL:", all("geheim" not in u for u in navigiert))

    # 6. Schnellzugriff + Rückkehr
    navigiert.clear()
    pg.goto("http://127.0.0.1:8765/" + D + "&oeffne=map"); pg.wait_for_timeout(500)
    print("Schnellzugriff:", pg.inner_text("#knopfSchnell"), "| automatisch geöffnet:", navigiert[-1][:50] if navigiert else "-")
    pg.goto("http://127.0.0.1:8765/" + D + "&zurueck=" + quote("S-map")); pg.wait_for_timeout(300)
    print("Rückkehr:", pg.inner_text("#status")[:80])
    pg.goto("http://127.0.0.1:8765/" + D + "&zurueck=M-K"); pg.wait_for_timeout(300)
    print("Rückkehr K:", pg.inner_text("#status")[:40])

    # 7. Ans Auto senden (Webhook)
    print("Ohne Webhook – Senden-Knopf versteckt:", pg.is_hidden("#knopfSenden"))
    pg.click("#einstellungen summary")
    pg.fill("#webhook", "https://example.com/x"); pg.click("#webhookSpeichern")
    print("Falscher Webhook:", pg.inner_text("#webhookStatus"))
    pg.fill("#webhook", " https://trigger.macrodroid.com/abc-123/cupra?ziel=alt "); pg.click("#webhookSpeichern")
    print("Webhook bereinigt:", pg.input_value("#webhook"), "|", pg.inner_text("#webhookStatus")[:40])
    pg.goto("http://127.0.0.1:8765/" + D + "&text=" + quote(text))
    pg.wait_for_selector("#ergebnis:not([hidden])", timeout=5000)
    navigiert.clear()
    print("Senden-Knopf sichtbar:", pg.is_visible("#knopfSenden"), "| Öffnen-Knopf Klasse:", pg.get_attribute("#knopfOeffnen", "class"))
    pg.click("#knopfSenden"); pg.wait_for_timeout(400)
    pg.click("#knopfSenden"); pg.wait_for_timeout(400)
    print("Webhook-Aufrufe (Doppeltipp → 1):", len(webhooks), "|", webhooks[-1] if webhooks else "-")
    print("Meldung:", pg.inner_text("#meldung"), "| kein Intent:", not navigiert)
    pg.reload(); pg.wait_for_timeout(500)                     # Sperre gilt 20 s im Speicher der Seite
    pg.click("#favListe .fav >> nth=0"); pg.wait_for_timeout(400)
    print("Favorit sendet:", webhooks[-1].split("?ziel=")[1] if len(webhooks) > 1 else "-", "|", pg.inner_text("#favHinweis"))
    # kein Netz zum Webhook → kopieren und öffnen
    ctx.unroute("https://trigger.macrodroid.com/**")
    ctx.route("https://trigger.macrodroid.com/**", lambda r: r.abort())
    pg.evaluate("window.cupraZiel.sendeAnsAuto('Teststraße 1, 1000 Lausanne')"); pg.wait_for_timeout(2200)
    print("Ohne Netz → Zwischenablage:", pg.evaluate("navigator.clipboard.readText()"), "| Intent:", navigiert[-1][:30] if navigiert else "-")
    pg.click("#einstellungen summary"); pg.fill("#webhook", ""); pg.click("#webhookSpeichern")
    print("Webhook entfernt:", pg.inner_text("#webhookStatus"), "| Senden versteckt:", pg.is_hidden("#knopfSenden"))

    # 8. Fehlerfall, Manifest
    pg2 = ctx.new_page()
    pg2.route("https://dienst.test/**", lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps({"ok": False, "fehler": "Kein Google-Maps-Link gefunden"})))
    pg2.goto("http://127.0.0.1:8765/" + D + "&text=" + quote("nur Text")); pg2.wait_for_timeout(600)
    print("Fehlerfall:", pg2.inner_text("#status"))
    m = json.load(open(root + "/manifest.json"))
    print("Manifest:", m["id"], "| Shortcuts:", [s["short_name"] for s in m["shortcuts"]])
    print("Fehler im Browser:", logs)
    b.close()
srv.shutdown()
