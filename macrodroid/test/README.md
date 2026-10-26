# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v9 (`Stempeln-v9.macro`, 26.10.2026)

Stempelt in der Zeiterfassung „SUR SITE" (schaltet je nach Stand **ein oder aus**, bucht sofort, ohne Bestätigung –
Christof 26.10.2026). Von Hand starten. **Keine Ja/Nein-Abfrage mehr** (Christof 26.10.2026: „ganz raus") –
jeder Start stempelt.

**Adresse fest im Makro** (Christof 26.10.2026: „mach Makro jetzt mit der URL, später lösche ich das aus dem Repo"):
direkt die Stempelseite `…/webquartz/ux/clock`.

**Warum Chrome:** Die Seite zeigt hochkant nur „bitte drehen". Mit „Desktop-Website" klappt es hochkant.
Firefox merkt sich das nur pro Tab, Chrome pro Seite (bei Christof eingerichtet). Firefox bleibt Standard-Browser.

| # | Aktion | Wert |
|---|---|---|
| 1–4 | Log, Intent (Activity), Warten 7 s | VIEW `…/ux/clock`, Paket `com.android.chrome`, Extra `com.android.browser.application_id` = `macrodroid.stempeln` (immer derselbe Tab) |
| 5–10 | Log, wenn `debug`: Screenshot **A** | vor der Geste |
| 11–13 | Log, UI-Interaktion **Geste 200 ms** auf **70, 567** (Start = Ende) = „SUR SITE", Warten 3 s | `action` 6, `type` „Gesture", `durationMs`, `startX`/`startY`/`endX`/`endY` |
| 14–18 | wenn `debug`: Screenshot **B** | 3 s nach der Geste (zeigt die Buchung noch **nicht**) |
| 19–21 | Log, gleicher Intent noch einmal, Warten 7 s | lädt die Seite im selben Tab neu |
| 22–26 | wenn `debug`: Screenshot **C** | **nach dem Neuladen: neue Buchung in der Agenda sichtbar?** |
| 27–33 | Log, Popup, Startbildschirm, Warten 1 s, Chrome beenden, Log | |

Stempelseite hochkant/Desktop in Chrome (Pixel 8, 1080 × 2400, Screenshot × 1,2): „SORTIE HOME OFFICE" y 419–454
(x 17–209), **„SUR SITE" ≈ 37–101 / 558–576 → Tipp 70, 567**, „HUB" ab x 158.

Gelernt (v3, 26.10.2026): Text-Klick mit Regex `(?i)^\s*tout voir\s*$` in Chrome lief laut Log, bewirkte aber nichts
(Screenshots A und B gleich). Ob Regex oder Chrome schuld ist, ist offen → Koordinaten. Die Screenshot-Aktion
(`TakeScreenshotAction`, `m_option` 0) speichert ohne Rückfrage, Magic Text `{fg_app_name}` geht („Chrome").

Gelernt (v4, 26.10.2026): Tipp auf 70, 567 war sichtbar, stempelte aber nicht. Vermutung: kam direkt nach dem
Schließen der Ja/Nein-Abfrage (MacroDroid-Fenster noch im Vordergrund) → v5 wartet 2 s und macht Screenshot B davor.

Gelernt (v5 + Klick-Test v1, 26.10.2026): Ein Tipp auf eine feste Stelle wirkt in Chrome (Klick-Test: „Accueil" →
Startseite), Klick über Text nicht. In v4/v5 kam der Tipp **nach** der Ja/Nein-Abfrage und wirkte nicht, obwohl der
Screenshot davor kein Fenster zeigte und der Tipp genau auf „SUR SITE" saß (Schrift x 38–99, y 562–572 im
Original-Screenshot). Vermutung: die Abfrage (MacroDroid-Activity) schluckt Tipps noch eine Weile unsichtbar →
v6 fragte zuerst und öffnete Chrome erst danach; v7 fragt gar nicht mehr.

Gelernt (v7, 26.10.2026): auch ohne Abfrage bucht der kurze Klick nicht (Screenshots vor/nach gleich). „SUR SITE" ist
ein normales `<button type="button">` (React, Klick-Listener am Knopf und an `div#main`). **Von Hand, hochkant, in
Chrome mit Desktop-Ansicht bucht es sofort** (Christof) → nicht die Seite, sondern der künstliche Kurz-Klick ist das
Problem → v8: Geste mit 150 ms Druckdauer.

Gelernt (v8, 26.10.2026): **Die Seite zeigt eine neue Buchung erst nach dem Neuladen** (auch nach einem Finger-Tipp
bleibt die Agenda gleich; der rote Strich in der Agenda ist nur die aktuelle Uhrzeit, kein Status). Sicher ohne
Buchung: v5 (13:22) und v7 (13:57). v8 (Geste 14:14:51) unklar: es gibt genau eine Buchung ← 14:15, Christof tippte
kurz danach auch von Hand. → v9: Geste 200 ms, danach Seite neu laden und Screenshot C.

### Einrichten

1. Chrome einmalig: Seite öffnen, anmelden, ⋮ → „Desktopwebsite" (erledigt 26.10.2026).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v9.macro` laden → MacroDroid → ⋮ → **Import**,
   ältere „Stempeln"-Fassungen löschen.
3. MacroDroid → Variablen: **`debug`** = wahr (Screenshots an).
4. Ausführen = **echt stempeln** (ein oder aus).
5. Debuggen: MacroDroid → ☰ → **Makro-Log** und die Screenshots A/B/C in den Chat. **Nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

### Unsicher (v9)

- Import der Geste klappt (26.10.2026). Offen: ob sie bucht – Screenshot C zeigt es. Ob der zweite Intent die Seite
  wirklich neu lädt (sonst C = B).
- Später: Start per GPS (Ankunft am Arbeitsort / Verlassen).

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
