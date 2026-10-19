# Cupra-Ziel — Projektstand für Claude

**Stand 19.10.2026** · App (`index.html`) v0.1.2 · Apps Script (`apps-script/Code.js`) v0.2.0 · Action (`.github/workflows/apps-script.yml`) v1.0.1 · Service Worker (`sw.js`) v1.1.0

## 1. Nutzer und Arbeitsweise (unbedingt beachten)

- **Christof**, GitHub `obitusde`, wohnt bei Morges (CH). Handy **Google Pixel 8 (Android, Chrome)** – kein iPhone. Auto: **Cupra Born 2021**.
- Arbeitet mal am PC (Claude Code lokal, `D:\Coding\cupra-ziel` optional), mal am Handy (Claude in der Cloud). **GitHub `main` ist die einzige Wahrheit**, veröffentlicht wird **nur über `git push`**. Kein lokales `clasp push`/`deploy`.
- Will so wenig wie möglich selbst machen, **kein Terminal**. Unvermeidbar für ihn: Google-Freigaben, Handy-Tests.
- **Erst kurz high-level besprechen, dann bauen** (nach „los"/„ja"). Fragen als Text mit a/b/c, nicht als Multiple-Choice-Dialog.
- **Deutsch** in Oberfläche, Kommentaren, Commits. **Versionsnummer bei jeder Änderung** (Kopfkommentar + `VERSION`/`APP_VERSION`). Diagnostisch-iterativ, Unsicherheit ehrlich benennen. Er kann Diffs nicht prüfen → direkt auf `main` ok.

## 2. Was die App ist

Christof will Orte aus Google Maps ins **native Navi des Born** bringen. Direkt ans Auto senden geht nicht mehr:
- **PyCupra** (inoffizielle API) ist seit **8.6.2026 blockiert** (App-Check-Token, HTTP 403 bei Capabilities). Am 19.10.2026 mit Christofs Konto getestet: Login ok, danach 403.
- **Smartcar**: VW-Integration Europa (Mai 2026) nur Laden/Batterie/km, kein Send Destination; Free-Plan ohne Befehle.
- myCupra erscheint **nicht** im Teilen-Menü von Google Maps; die myCupra-Suche findet **keine Koordinaten und keine Plus Codes**, nur Adressen/Namen.

Deshalb: **Google Maps → Teilen → Cupra-Ziel** → App zeigt eine Adresse → **„Kopieren & myCupra öffnen"** → in myCupra **Karte → Suche → Einfügen → An Fahrzeug senden**.

## 3. Architektur

```
Google Maps (Teilen) ──text/url──► PWA (GitHub Pages, index.html, share_target GET)
                                     │  fetch ?link=<geteilter Text>
                                     ▼
                           Apps Script Web-App (ANYONE_ANONYMOUS, läuft als Christof)
                             • Kurzlink auflösen (followRedirects:false, Zustimmungsseite überspringen)
                             • Koordinaten/Name aus URL (!3d!4d, /maps/search/, q=, @)
                             • Maps.newGeocoder().reverseGeocode → Adresse, Abstand zum Punkt
                             ◄── JSON { ok, name, lat, lon, adresse, abstandM, varianten[] }
```
- Die PWA liest die Web-App-Adresse aus `apps-script/deployment-id.txt` (vom ersten Action-Lauf angelegt). Für Tests: `?dienst=<URL>`.
- Enthält der Teilen-Text eine Adresszeile (mit PLZ), hat sie Vorrang vor der Rückwärts-Suche.
- myCupra öffnen: Paket **`com.cupra.mycupra`** (Play Store geprüft). Methoden: **K `cupra://map` = Standard (direkt Karte)**, A Launcher-Intent mit Paket, B `cupra://oauth-callback` mit Paket (am 19.10.2026 bei Christof ok), C wie B ohne Paket; die gewählte steht in `localStorage['cupra-ziel.methode2']`.
- **myCupra-Deep-Links (APK 2.15.0 untersucht, 19.10.2026):** `es.seat.ola.app.MainActivity` nimmt `cupra://…` und `https://www.cupraofficial.com/mobile/…` (autoVerify). DeepLinkManager: Präfix `cupra:/` entfernen, Rest muss mit genau einem `/` beginnen → interne Route; nur `?navigation=modal` wird ausgewertet, **keine weiteren Parameter** (Adresse lässt sich nicht vorbelegen). Bekannte Routen u. a. `/map`, `/map/evroute`, `/destsync`, `/tourimport`, `/home`, `/splash`. Weitere Schemata: `cupra://enrollment-completed`, `cupra://parkandpay-success`.
- POI-Name: Schalter „Name mitkopieren" (Standard an, `localStorage['cupra-ziel.mitName']`) setzt „Name, Adresse" als Hauptvariante; Name = `name` aus dem Script oder erste Teilen-Zeile ohne PLZ/Plus Code.
- Updates: Manifest `manifest.json?v=…`, Service Worker `sw.js?v=…` (SW holt mit `cache: 'no-cache'`). Bei jeder Version die `?v=` mit hochzählen. Das App-Schema `cupra://oauth-callback` stammt aus PyCupra. **Nie in den Play Store:** jede Methode hat `S.browser_fallback_url` → `./?zurueck=<Methode>`, die App zeigt dann einen Hinweis. A landete am 19.10.2026 bei Christof im Play Store (Chrome öffnet nur Activities mit BROWSABLE, der Launcher hat das meist nicht).
- **Manifest-`id` muss `/cupra-ziel/` bleiben.** `"./"` wird vom Ursprung aus aufgelöst = `https://obitusde.github.io/` = id von Fotoschatz → Chrome meldete „bereits installiert", Öffnen scheiterte (19.10.2026).
- Links ohne Koordinaten (Suchtext `q=…`, Plus Code, nur Name) sucht das Script über den Geocoder (v0.2.0); Plus Codes werden in eine Straßenadresse umgewandelt. Fehlerantworten enthalten `aufgeloest`.
- Kein Schlüssel am Web-Dienst (Repo ist öffentlich; Dienst nimmt nur Maps-Links, gibt nur Kartendaten zurück).

## 4. Zugänge

| Was | Wert |
|---|---|
| Repo | `obitusde/cupra-ziel` (öffentlich) |
| Pages | https://obitusde.github.io/cupra-ziel/ (Christof muss Pages einmal einschalten: Settings → Pages → Branch `main` / root) |
| Apps Script | scriptId `1qnt4e9-EOZ2DA-HWfRkyU1TVeilJdHCYDT7nqplLCG5Sr4o1X1T4XFpQ` (am 19.10.2026 von der Action angelegt, `apps-script/.clasp.json`), Editor https://script.google.com/d/1qnt4e9-EOZ2DA-HWfRkyU1TVeilJdHCYDT7nqplLCG5Sr4o1X1T4XFpQ/edit |
| Web-App | Deployment-ID `AKfycbwRpVeFUoUoVfjENhinhW9zfR5EjWWRk4Nx0zxRBpldBBA0YKf4f7Xl_YwDO-Vq1wsB` (`apps-script/deployment-id.txt`), URL `https://script.google.com/macros/s/<ID>/exec` · `?test=1` Diagnose mit 3 Testlinks · `?link=…` |
| Secret `CLASPRC_JSON` | Inhalt von Christofs `~/.clasprc.json`, am 19.10.2026 per `gh secret set` gesetzt. **Nie ausgeben.** |

Erste Freigabe (am 19.10.2026 erteilt, `testeLinks` lief): Nach dem ersten Deploy muss Christof einmal die Web-App-URL (bzw. im Editor `testeLinks`) öffnen und Google die Berechtigungen (externe Anfragen) erlauben.

## 5. Routine

```bash
git checkout main && git pull --rebase      # die Action committet .clasp.json / deployment-id.txt
node --check apps-script/Code.js
for t in tests/test-*.js; do node "$t" || break; done
python3 tests/pwa-test.py . /tmp             # PWA headless mit nachgebautem Dienst (Playwright)
```
Veröffentlichen = committen und auf `main` pushen. Die Action läuft bei Änderungen an `apps-script/Code.js`, `appsscript.json`, `tests/` oder dem Workflow. Pages baut bei jedem Push.

## 6. Offene Tests (Christof, Pixel)

1. ~~Web-App `?test=1`~~ 19.10.2026: Links 1+2 ok (Edmund-Weller-str. 2, 58675 Hemer, ~40 m), Link 3 „Keine Adresse" → v0.2.0, erneut prüfen.
2. Welche Variante findet die myCupra-Suche (Name + Adresse / Adresse ohne Land / mit Land)? 19.10.2026: Adresse funktioniert ("sonst klappt alles"); Name + Adresse offen.
3. Öffnen: B klappte am 19.10.2026; K (`cupra://map`) ab v0.1.2 offen.
4. Erscheint Cupra-Ziel nach der Installation im Teilen-Menü von Google Maps, und was steht im geteilten Text (nur Link oder Name + Adresse + Link)?

## 7. Hinweise für die Cloud-Sitzung

- Die Cloud-Umgebung erreicht **script.google.com und obitusde.github.io nicht** (Proxy). Action-Status über die öffentliche API prüfen: `curl https://api.github.com/repos/obitusde/cupra-ziel/actions/runs?per_page=1`, Fehlertexte über `…/check-runs/<job-id>/annotations`.
- `gh` ist in der Cloud nicht angemeldet; Action neu starten = Änderung an einer überwachten Datei pushen.
