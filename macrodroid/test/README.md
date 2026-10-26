# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v12 (`Stempeln-v12.macro`, 26.10.2026)

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
| 5–10 | Log, wenn `debug`: Screenshot **A** | vor dem Tipp |
| 11–12 | Log, **Shell-Skript über Shizuku** `input tap 70 567` | `ShellScriptAction`: `m_script`, `useShizuku` true, `m_nonRoot` false, `blockNextAction` true, `timeoutSeconds` 10 (Felder aus Beispiel in BespredeL/MacroDroid; Shizuku-Modus geraten) |
| 13–17 | Log, Warten 5 s, Log, gleicher Intent, Warten 7 s | Seite neu laden |
| 18–22 | wenn `debug`: Screenshot **C** | Agenda nach Neuladen |
| 23–28 | Log, Startbildschirm, Warten 1 s, Chrome beenden, Popup, Log | |

### Shizuku einrichten (einmalig, ohne PC)

1. Play Store: **Shizuku** installieren.
2. Einstellungen → System → Entwickleroptionen → **Kabelloses Debugging** an (Handy im WLAN).
3. Shizuku öffnen → „Über kabelloses Debugging starten" → **Kopplung**. Dann in „Kabelloses Debugging" →
   „Gerät über Kopplungscode koppeln" → den Code in die Shizuku-Benachrichtigung eingeben.
4. In Shizuku **Starten** → oben „Shizuku läuft".
5. MacroDroid fragt beim ersten Shell-Skript nach Shizuku-Zugriff → erlauben (oder in Shizuku unter
   „Autorisierte Anwendungen" MacroDroid einschalten).
6. **Nach jedem Neustart des Handys:** Shizuku öffnen → Starten (WLAN + Kabelloses Debugging nötig).

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

Gelernt (v9, 26.10.2026): Geste 200 ms bucht nicht (nach Neuladen keine neue Buchung). Ein Screenshot (14:17) zeigt
um „SUR SITE" den **Fokus-Rahmen** (x 18–120, y 551–585 → Tipp 70, 567 sitzt mittig): der künstliche Tipp wählt den
Knopf an, löst ihn aber nicht aus. → v10: danach „Klick auf aktuellen Fokus" (Bedienungshilfe-Klick).

Gelernt (v10, 26.10.2026): bucht auch nicht. **Neu durchdacht:** Gemeinsam ist v5–v10, dass Chrome 3–12 s nach dem
Tipp neu geladen (v9/v10, nach 3–4 s) oder beendet wurde (v5/v7/v8, nach ~10 s). v4 (12:09, Chrome blieb offen) und
v8 (Geste 14:14:51, Chrome erst 14:15:03 beendet) fallen zeitlich genau mit den Buchungen ← 12:09 und ← 14:15 zusammen,
die Christof seinem Finger zuschrieb (die Seite zeigt Buchungen erst nach Neuladen, er hat jeweils kurz danach von
Hand nachgetippt). Vermutung: „SUR SITE" holt erst den **Standort** (Horoquartz wirbt mit geolokalisiertem Stempeln)
und bucht erst danach; Neuladen/Beenden bricht das ab. Der Finger lässt die Seite offen. → v11: einfacher Tipp,
**60 s Chrome offen lassen**, erst dann neu laden.

Gelernt (v11, 26.10.2026): bucht auch nicht. Am PC mit der Maus erscheint die Buchung sofort → keine Wartezeit,
Standort-Vermutung falsch. Fazit: Tipps über die Bedienungshilfe (Klick, Geste, Fokus-Klick) lösen diesen Knopf
nicht aus, einen Link schon; Ursache von außen nicht feststellbar. → v12: Tipp über die System-Eingabe
(`input tap` per Shizuku), derselbe Weg wie ein Finger.

### Einrichten

1. Chrome einmalig: Seite öffnen, anmelden, ⋮ → „Desktopwebsite" (erledigt 26.10.2026).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v12.macro` laden → MacroDroid → ⋮ → **Import**,
   ältere „Stempeln"-Fassungen löschen.
3. MacroDroid → Variablen: **`debug`** = wahr (Screenshots an).
4. Ausführen = **echt stempeln** (ein oder aus).
5. Debuggen: MacroDroid → ☰ → **Makro-Log** und die Screenshots A/B/C in den Chat. **Nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

### Unsicher (v12)

- Ob der Import den Shizuku-Modus richtig setzt (Aktion muss „Shizuku" zeigen) und ob `input tap` bucht.
- Keine Horoquartz-App verfügbar (Christof). Fallback: halbautomatisch – Makro öffnet die Seite, Christof tippt.
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
