# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v5 (`Stempeln-v5.macro`, 26.10.2026)

Stempelt in der Zeiterfassung „SUR SITE". Von Hand starten.

**Adresse fest im Makro** (Christof 26.10.2026: „mach Makro jetzt mit der URL, später lösche ich das aus dem Repo"):
direkt die Stempelseite `…/webquartz/ux/clock` (Christof 26.10.2026: geht direkt auf).

**Warum Chrome:** Die Seite zeigt hochkant nur „bitte drehen". Mit „Desktop-Website" klappt es hochkant.
Firefox merkt sich das nur pro Tab (neuer Tab vom Makro = wieder mobil), Chrome pro Seite (bei Christof
26.10.2026 eingerichtet, öffnet direkt als Desktop). Firefox bleibt Standard-Browser. Drehen per
`ForceScreenRotationAction` (v1) hat nichts bewirkt → entfernt.

| # | Aktion | Wert |
|---|---|---|
| 1 | Log | `Stempeln v5 \| 1 Start, debug=…` |
| 2 | Intent (Activity) | VIEW, `…/ux/clock`, Paket `com.android.chrome`, Extra `com.android.browser.application_id` = `macrodroid.stempeln` (Chrome nimmt immer denselben Tab) |
| 3–5 | Log, Warten 7 s, Log | Vordergrund-App `{fg_app_name}` |
| 6–10 | Wenn `debug` | Screenshot **A** (Stempelseite) |
| 11 | Variable `stempeln` mit Abfrage | „Ja, SUR SITE stempeln" / „Nein, nicht stempeln" |
| 12 | Log | Antwort |
| 13 | Wenn `stempeln` | |
| 14–15 | Log, Warten 2 s | Abfrage-Fenster muss weg sein |
| 16–20 | Wenn `debug` | Screenshot **B** (vor dem Tipp) |
| 21–23 | Log, UI-Klick (x,y) **70, 567** = „SUR SITE", Warten 3 s | |
| 24–28 | Wenn `debug` | Screenshot **C** (nach SUR SITE) |
| 29–30 | Log, Popup | „Gestempelt: SUR SITE" |
| 31–33 | Sonst: Log, Popup | „Nicht gestempelt" |
| 34 | Ende Wenn | |
| 35–38 | Log, Startbildschirm, Warten 1 s, Hintergrundprozess beenden | Chrome |
| 39 | Log | `7 Ende` |

Stempelseite hochkant/Desktop in Chrome (Pixel 8, 1080 × 2400, Screenshot × 1,2): „SORTIE HOME OFFICE" y 419–454
(x 17–209), **„SUR SITE" ≈ 37–101 / 558–576 → Tipp 70, 567**, „HUB" ab x 158.

Gelernt (v3, 26.10.2026): Text-Klick mit Regex `(?i)^\s*tout voir\s*$` in Chrome lief laut Log, bewirkte aber nichts
(Screenshots A und B gleich). Ob Regex oder Chrome schuld ist, ist offen → Koordinaten. Die Screenshot-Aktion
(`TakeScreenshotAction`, `m_option` 0) speichert ohne Rückfrage, Magic Text `{fg_app_name}` geht („Chrome").

Gelernt (v4, 26.10.2026): Tipp auf 70, 567 war sichtbar, stempelte aber nicht. Vermutung: kam direkt nach dem
Schließen der Ja/Nein-Abfrage (MacroDroid-Fenster noch im Vordergrund) → v5 wartet 2 s und macht Screenshot B davor.

### Einrichten

1. Chrome einmalig: Seite öffnen, anmelden, ⋮ → „Desktopwebsite" (erledigt 26.10.2026).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v5.macro` laden → MacroDroid → ⋮ → **Import**,
   ältere „Stempeln"-Fassungen löschen.
3. MacroDroid → Variablen: **`debug`** = wahr (Screenshots an).
4. Ausführen (Makro-Liste ⋮ → „Ausführen"). Mit **„Ja"** wird echt gestempelt.
5. Debuggen: MacroDroid → ☰ → **Makro-Log** (Einträge „Stempeln v5 | …") und die Screenshots in den Chat.
   **Nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

### Unsicher (v5)

- („SUR SITE" bucht sofort, ohne Bestätigung – Christof 26.10.2026.)
- **v5-Test 26.10.2026 13:22:** Ablauf laut Log korrekt, Screenshot vor dem Tipp ohne Abfrage-Fenster, Tipp 70, 567
  ausgeführt – trotzdem keine Buchung (Bilder vor/nach gleich). Timing war es also nicht. `application_id` wirkt
  (Tab-Zahl blieb 5), Chrome beenden klappt. → Klick-Test v1.
- Ob Chrome mit `application_id` wirklich denselben Tab nimmt (Tab-Zahl darf nicht mehr steigen).
- Später: Start per GPS (Ankunft am Arbeitsort).

## Klick-Test v1 (`Klick-Test-v1.macro`, 26.10.2026)

**Stempelt nicht.** Klärt, wie MacroDroid in Chrome überhaupt etwas anklicken kann. Ziel ist nur der harmlose
Link „Accueil" (Brotkrume oben links auf der Stempelseite, wechselt zur Startseite).

1. Stempelseite öffnen (gleicher Intent wie Stempeln v5), 7 s, Screenshot 1a → **Tipp auf die Stelle 94, 157**
   (Text „Accueil" ≈ x 71–118, y 150–166), 4 s, Screenshot 1b.
2. Stempelseite erneut öffnen, 7 s, Screenshot 2a → **Klick über den Text `Accueil`** (ohne Regex, Einstellungen wie
   „Suche" im Cupra-Makro), 4 s, Screenshot 2b.
3. Startbildschirm, Chrome beenden. Popups zeigen, welcher Test gerade läuft.

Auswertung: Zeigt 1b bzw. 2b die Startseite (Kästen „Timbrer", „Mes indicateurs" …), funktioniert dieser Weg →
Stempeln v6 klickt „SUR SITE" genauso.
