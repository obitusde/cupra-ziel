# Cupra-Ziel — Projektstand für Claude

**Stand 19.10.2026** · App (`index.html`) v0.1.0 · Apps Script (`apps-script/Code.js`) v0.1.0 · Action (`.github/workflows/apps-script.yml`) v1.0.0 · Service Worker (`sw.js`) v1.0.0

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
- myCupra öffnen: Paket **`com.cupra.mycupra`** (Play Store geprüft). Drei Methoden zum Testen (A Launcher-Intent, B `intent://…scheme=cupra`, C `cupra://`); die gewählte steht in `localStorage['cupra-ziel.methode']`. Das App-Schema `cupra://oauth-callback` stammt aus PyCupra.
- Kein Schlüssel am Web-Dienst (Repo ist öffentlich; Dienst nimmt nur Maps-Links, gibt nur Kartendaten zurück).

## 4. Zugänge

| Was | Wert |
|---|---|
| Repo | `obitusde/cupra-ziel` (öffentlich) |
| Pages | https://obitusde.github.io/cupra-ziel/ (Christof muss Pages einmal einschalten: Settings → Pages → Branch `main` / root) |
| Apps Script | legt die Action beim ersten Lauf an → `apps-script/.clasp.json` (scriptId), `apps-script/deployment-id.txt` |
| Web-App | `https://script.google.com/macros/s/<deployment-id>/exec` · `?test=1` Diagnose mit 3 Testlinks · `?link=…` |
| Secret `CLASPRC_JSON` | Inhalt von Christofs `~/.clasprc.json`, am 19.10.2026 per `gh secret set` gesetzt. **Nie ausgeben.** |

Erste Freigabe: Nach dem ersten Deploy muss Christof einmal die Web-App-URL (bzw. im Editor `testeLinks`) öffnen und Google die Berechtigungen (externe Anfragen) erlauben.

## 5. Routine

```bash
git checkout main && git pull --rebase      # die Action committet .clasp.json / deployment-id.txt
node --check apps-script/Code.js
for t in tests/test-*.js; do node "$t" || break; done
python3 tests/pwa-test.py . /tmp             # PWA headless mit nachgebautem Dienst (Playwright)
```
Veröffentlichen = committen und auf `main` pushen. Die Action läuft bei Änderungen an `apps-script/Code.js`, `appsscript.json`, `tests/` oder dem Workflow. Pages baut bei jedem Push.

## 6. Offene Tests (Christof, Pixel)

1. Web-App `?test=1` öffnen → lösen sich die 3 Links auf (EU-Zustimmungsseite)?
2. Welche Variante findet die myCupra-Suche (Adresse ohne Land / mit Land / Name + Ort)?
3. Welche Öffnen-Methode (A/B/C) startet myCupra sauber?
4. Erscheint Cupra-Ziel nach der Installation im Teilen-Menü von Google Maps, und was steht im geteilten Text (nur Link oder Name + Adresse + Link)?
