# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v15 (`Stempeln-v15.macro`, Pixel) und Stempeln Mi v1 (`Stempeln-Mi-v1.macro`, Mi 9T), 26.10.2026

Stempelt in der Zeiterfassung „SUR SITE" (schaltet je nach Stand **ein oder aus**, bucht sofort, ohne Bestätigung –
Christof 26.10.2026). Von Hand starten. **Keine Ja/Nein-Abfrage mehr** (Christof 26.10.2026: „ganz raus") –
jeder Start stempelt.

**Adresse fest im Makro** (Christof 26.10.2026: „mach Makro jetzt mit der URL, später lösche ich das aus dem Repo"):
direkt die Stempelseite `…/webquartz/ux/clock`.

**Warum Chrome:** Die Seite zeigt hochkant nur „bitte drehen". Mit „Desktop-Website" klappt es hochkant.
Firefox merkt sich das nur pro Tab, Chrome pro Seite (bei Christof eingerichtet). Firefox bleibt Standard-Browser.

| # | Aktion | Wert |
|---|---|---|
| 1–7 | Log, Intent (Activity), Warten 7 s, Log, **gleicher Intent noch einmal**, Warten 6 s | VIEW `…/ux/clock`, Paket `com.android.chrome`, Extra `com.android.browser.application_id` = `macrodroid.stempeln` (immer derselbe Tab) |
| 5–10 | Log, wenn `debug`: Screenshot **A** | vor dem Tipp |
| 11–12 | Log, **Shell-Skript über Shizuku** `input tap X Y </dev/null >/dev/null 2>&1` (Pixel 70 567, Mi 68 522), Rückgabewert nach `Download/stempeln.txt` | `ShellScriptAction`: `m_script`, `useShizuku` true, `m_nonRoot` false, `blockNextAction` true, `timeoutSeconds` 10 (Felder aus Beispiel in BespredeL/MacroDroid; Shizuku-Modus geraten) |
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

Gelernt (v12, 26.10.2026): Screenshot A zeigte **Accueil** statt der Stempelseite (erstes Öffnen landete auf der
Startseite), der Tipp ging ins Leere; nach dem Neuladen war die Stempelseite da. Shizuku-Tipp also noch ungetestet.
Zweites Öffnen landete bisher immer auf der Stempelseite (Klick-Test 2a, v9–v12 Screenshot C) → v13 öffnet zweimal.
(Zeilennummern der Tabelle ab Aktion 8 um 3 verschoben.)

Gelernt (v13, 26.10.2026, 15:12): Stempelseite war offen (Screenshot A), Shizuku-`input tap` bucht trotzdem nicht.
Gemeinsam bei allen künstlichen Tipps: sie setzen höchstens den Fokus (blauer Rahmen), lösen aber nicht aus; Finger
und PC-Maus schon. → v14: nach dem Tipp **Enter-Taste** (`input keyevent 66`) – ein fokussierter `<button>` wird vom
Browser per Tastatur ausgelöst, unabhängig davon, wie die Seite Berührungen auswertet.

### Einrichten

1. Chrome einmalig: Seite öffnen, anmelden, ⋮ → „Desktopwebsite" (erledigt 26.10.2026).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v15.macro` (Pixel) bzw. `…/Stempeln-Mi-v1.macro` (Mi) laden → MacroDroid → ⋮ → **Import**,
   ältere „Stempeln"-Fassungen löschen.
3. MacroDroid → Variablen: **`debug`** = wahr (Screenshots an).
4. Ausführen = **echt stempeln** (ein oder aus).
5. Debuggen: MacroDroid → ☰ → **Makro-Log** und die Screenshots A/B/C in den Chat. **Nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

### Unsicher (v15 / Mi v1)

- v12–v14 buchten nicht, Christof sah keinen Tipp-Kreis. Ob `input tap` überhaupt lief, ist offen (MacroDroid führt
  Shell-Skripte stumm aus; Log 15:06 „Shizuku permission not granted" bei v12, später keine Meldung) → Shizuku-Test v1.
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

## Shizuku-Test v3 (`Shizuku-Test-v3.macro`, 26.10.2026)

**Stempelt nicht.**

Ergebnis v1 (15:24): Shizuku läuft (`uid=2000(shell)`, Gruppe `1004(input)`), aber `input tap` →
`cmd: Failure calling service input: Failed transaction (2147483646)` – **v12–v14 haben nie getippt.**

Ergebnis v2 (15:38): Pixel 8, **Android 17 (SDK 37)**. Aus dem Shizuku-Prozess scheitert **jeder** `cmd`-Dienst
(`input`, `settings`, `window`: Failed transaction), `service check input` findet den Dienst aber. Alle drei
Schreibweisen des Tipps scheitern gleich. **`/dev/input/event3` = `goodix_ts0`** (Touchscreen, `crw-rw---- root input`),
Protokoll B: `ABS_MT_SLOT` 0–9, `ABS_MT_TRACKING_ID`, `ABS_MT_POSITION_X` 0–1079, `ABS_MT_POSITION_Y` 0–2399
(= Bildschirmpixel), `ABS_MT_TOUCH_MAJOR`/`MINOR`, `ABS_MT_PRESSURE` 0–255, `BTN_TOUCH`, `BTN_TOOL_FINGER`.

v3: Tipp auf „Accueil" (94, 157) **direkt am Touchscreen-Treiber** per `sendevent /dev/input/event3`
(Slot 0, Tracking-ID, Position, Größe 40, Druck 80, `BTN_TOUCH`/`BTN_TOOL_FINGER` an, SYN – 0,1 s – Tracking-ID −1,
Tasten aus, SYN), Fehler je Befehl in `Download/shizuku-test3.txt`. Screenshot 2 zeigt die Startseite = es geht →
derselbe Tipp auf „SUR SITE" (70, 567). Sonst Schluss → halbautomatisch.

**Ergebnis v3 (15:45): `sendevent: /dev/input/event3: Permission denied`** bei jedem Befehl – trotz Gruppe `input`
blockiert Android (SELinux) das Schreiben auf den Touchscreen aus Shizuku. Seite blieb auf der Stempelseite.

## Fazit (26.10.2026)

Vollautomatisches Stempeln auf diesem Weg geht auf dem Pixel 8 mit Android 17 **nicht**:
- Tipps über die Bedienungshilfe (Klick, Geste, Fokus-Klick, Text-Klick) wählen „SUR SITE" höchstens an, lösen ihn
  aber nicht aus (Links wie „Accueil" schon). Bekanntes Muster bei Android-Chrome (Buttons vs. Links).
- Shizuku läuft (uid 2000), aber unter Android 17 scheitert daraus jeder `cmd`-Dienst (`input tap`, `input keyevent`,
  `settings`, `wm`: „Failed transaction"), und `sendevent` auf den Touchscreen wird verweigert.
- Nicht verfolgt: echtes `adb shell input tap` vom PC (bräuchte ständig einen verbundenen Rechner); direkter Aufruf
  der Stempel-Schnittstelle der Seite (Anmeldedaten/Token, fragil, evtl. gegen Firmenregeln).
- Vielleicht später: ein Shizuku-Update, das `cmd` unter Android 17 wieder erlaubt → dann `input tap` erneut testen
  (Shizuku-Test v3 zeigt es sofort).

Nächster Schritt: **halbautomatisch** – Makro öffnet die Stempelseite (später per GPS mit Hinweis), Christof tippt
„SUR SITE" selbst.

## Mi-Test v1 (`Mi-Test-v1.macro`, 26.10.2026) – zweites Handy

**Stempelt nicht.** Gerät: **Xiaomi Mi 9T (davinci), PixelOS 16.2 (Android 16), 1080 × 2340**, vermutlich gerootet.
Stempelseite dort (Chrome, Desktopwebsite, hochkant; Screenshot in Originalgröße vermessen): „Accueil" x 71–116,
y 107–119 → **94, 113**; „ENTRÉE/SORTIE HOME OFFICE" y 374–408; **„SUR SITE" x 38–99, y 517–527 → 68, 522**;
„HUB" ab x 158.

Ablauf (Shell-Skripte im **Root-Modus**: `m_nonRoot` false, `useShizuku` false):
1. Diagnose nach `Download/mi-test.txt`: `id` (**`uid=0` = Root**), Modell, Android, `wm size`, `/dev/input`,
   `getevent -lp`. Keine Datei = kein Root (oder Root-Abfrage abgelehnt).
2. Stempelseite zweimal öffnen, Screenshot 1 → `input tap 94 113` (Root) → Screenshot 2 (Startseite?).
3. Stempelseite wieder öffnen, Screenshot 3 → Tipp **direkt am Touchscreen** per `sendevent` (Gerät und Wertebereich
   werden aus `getevent -lp` gesucht und umgerechnet) → Screenshot 4 (Startseite?).
4. Startbildschirm, Chrome beenden.

Danach: Wirkt ein Weg auf „Accueil" → derselbe Weg auf „SUR SITE" (68, 522) als echter Test.

**Ergebnis Mi-Test v1 (22:57):** keine Root-Abfrage, keine Datei `mi-test.txt`, alle Screenshots zeigen die
Stempelseite → **kein Root** (PixelOS ohne Magisk/KernelSU), Root-Skripte scheiterten still.

## Mi-Test v2 (`Mi-Test-v2.macro`, 26.10.2026)

**Stempelt nicht.** Wie Mi-Test v1, aber alle Shell-Skripte über **Shizuku** (`useShizuku` true). Datei
`Download/mi-test2.txt`. Voraussetzung: Shizuku auf dem Mi eingerichtet und gestartet (Anleitung oben),
MacroDroid-Zugriff erlaubt. Erwartung: unter Android 16 läuft `input tap` aus Shizuku (am Pixel scheiterte es an
Android 17); `sendevent` vermutlich wieder „Permission denied".

**Ergebnis Mi-Test v2 (23:08):** Shizuku läuft (`uid=2000(shell)`), Android 16 – aber **derselbe Fehler wie am
Pixel**: `wm size` und `input tap` → „Failed transaction", `sendevent` auf `/dev/input/event2` (`goodix_ts`,
0–1079 × 0–2339) → „Permission denied". **Die Android-17-Erklärung war falsch.**

## Mi-Test v3 (`Mi-Test-v3.macro`, 26.10.2026)

**Stempelt nicht.** Neue Vermutung: Alle `cmd`-Befehle (`input`, `wm`, `settings`) reichen ihre Ausgabe-Kanäle an
den Systemdienst weiter. In allen Tests war die Ausgabe **direkt in eine Datei unter `/sdcard/Download`** umgeleitet –
diese Datei darf `system_server` nicht benutzen → Binder-Aufruf scheitert mit „Failed transaction". Befehle ohne
Systemdienst (`id`, `getevent`) liefen.

v3 schreibt nach `Download/mi-test3.txt`: `wm size` (A) mit Ausgabe in die Datei, (B) über eine Shell-Variable,
(C) nach `/dev/null`; dann `input tap 94 113` (Accueil) mit Ausgabe nach `/dev/null`, Rückgabewert in die Datei,
Screenshot 2. A scheitert, B/C klappen und Screenshot 2 zeigt die Startseite = Vermutung bestätigt → echter Test auf
„SUR SITE" (Mi: 68, 522), Skripte ohne Datei-Umleitung.

**Ergebnis Mi-Test v3 (23:12): Vermutung bestätigt.** `wm size` mit Ausgabe in die Datei → „Failed transaction",
über Variable → `rc=0 Physical size: 1080x2340`, nach `/dev/null` → `rc=0`. **`input tap 94 113` mit Ausgabe nach
`/dev/null` → `rc=0`, Screenshot 2 zeigt die Startseite.** Der Shizuku-Tipp funktioniert; alle früheren
Shizuku-Fehlschläge (Pixel v12–v14, Shizuku-Test v1/v2, Mi-Test v2) lagen an der Ausgabe-Umleitung in eine Datei
unter `/sdcard` (bzw. bei v12–v14 vermutlich an MacroDroids Ausgabe-Kanal – nie geprüft).
**Regel: `cmd`-Befehle (`input`, `wm`, `settings`, …) aus Shizuku immer mit `</dev/null >/dev/null 2>&1` oder über
`$(…)` aufrufen.** → Stempeln Mi v1 / Stempeln v15 (Pixel): echter Test auf „SUR SITE".
