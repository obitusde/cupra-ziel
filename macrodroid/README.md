# MacroDroid-Makro „Cupra" – Ziel automatisch ans Auto senden

Stand 26.10.2026 · Makro **v7** (`Cupra-v7.macro`) · für **Pixel 8** (1080 × 2400), myCupra 2.15, Anzeige- und Schriftgröße Standard

Cupra-Ziel (und die Ladeplanung) rufen den Webhook `https://trigger.macrodroid.com/<Geräte-ID>/cupra?ziel=<Text>` auf.
Das Makro macht dann das, was man sonst von Hand tut:

| # | Aktion | Wert |
|---|---|---|
| 1 | Zwischenablage füllen | `{v=ziel}` |
| 2 | Intent (Activity) | `android.intent.action.VIEW`, Daten `cupra://map`, Paket `com.cupra.mycupra` |
| 3 | Warten | 3 s |
| 4 | UI-Interaktion Klick (Text) | `OK` → schließt „PARKPOSITION NICHT VERFÜGBAR" (kommt bei eingeschalteter Zündung); ohne Hinweis passiert nichts |
| 5 | Warten | 1 s |
| 6 | UI-Interaktion Klick (Text) | `Suche` → Suchfeld, Tastatur geht auf |
| 7 | Warten | 1 s |
| 8 | UI-Interaktion Klick (Text) | `OK` → falls der Hinweis erst später kam |
| 9 | Warten | 1 s |
| 10 | UI-Interaktion Klick (Text) | `Suche` noch einmal (Tastatur wieder öffnen, falls der Hinweis sie geschlossen hat) |
| 11 | Warten | 1 s |
| 12 | UI-Interaktion Klick (x,y) | **570, 1553** = Zwischenablage-Vorschlag über der Tastatur (Gboard) |
| 13 | Warten | 2 s |
| 14 | UI-Interaktion Klick (x,y) | **540, 470** = Mitte der ersten Trefferzeile |
| 15 | Warten | 2 s |
| 16 | UI-Interaktion Klick (x,y) | **540, 2260** = „AN DAS FAHRZEUG SENDEN" |
| 17 | Warten | 3 s (Bestätigung in der App) |
| 18 | Startbildschirm | |
| 19 | Warten | 1 s |
| 20 | Hintergrundprozess beenden | My CUPRA |
| 21 | Popup-Meldung | „Ziel gesendet: {v=ziel}" |

## Einrichten (neues Handy)

1. **MacroDroid** installieren, Bedienungshilfe für MacroDroid erlauben (fragt beim ersten UI-Klick).
2. Einmalig am PC (USB-Debugging an, Handy angesteckt), adb liegt z. B. unter `D:\Coding\geraete-pc-sync\tools\platform-tools\`:
   ```
   adb shell pm grant com.arlosoft.macrodroid android.permission.WRITE_SECURE_SETTINGS
   ```
3. `Cupra-v7.macro` aufs Handy laden → MacroDroid → ⋮ → **Import**. Ältere Fassungen ausschalten (alle hören auf `cupra`).
4. Im Makro beim Auslöser „Webhook (URL)" die Adresse kopieren und in **Cupra-Ziel → Einstellungen → MacroDroid-Webhook** eintragen.
   Die Adresse enthält die Geräte-ID → **nie ins Repo, nicht teilen.**
5. Test: Cupra-Ziel → Favorit antippen. Handy muss entsperrt sein, Bildschirm an, hochkant.

## Was gelernt wurde (19.10.2026)

- „Paste" von MacroDroid nimmt das myCupra-Suchfeld nicht an (läuft ohne Fehler, Feld bleibt leer).
- Klick per Text findet „Einfügen" (System-Popup nach Langdruck) und „AN DAS FAHRZEUG SENDEN" nicht → Koordinaten.
  Das Log meldet das nicht als Fehler; erkennen nur am Bildschirm (Tippstellen sind eingeblendet: `showTouchLocation`).
- Treffer-Klick bei y = 650 traf bei zweizeiligen Treffern („Beuler Weg 35" / „58809 Neuenrade") die **zweite** Zeile → 470.
- Koordinaten gelten nur für dieses Handy und dieses myCupra-Layout. Nach einem myCupra-Update oder bei anderer
  Anzeigegröße: Screenshot an der hängenden Stelle machen, Werte neu bestimmen (Screenshot-Pixel × 1,2 bei 900 px breiten Bildern).
- Datei-Format: JSON, Aktionen in `macro.m_actionList` (`m_classType`, `uiInteractionConfiguration.clickOption` 1 = Text,
  2 = Koordinaten `xyPoint`). Beim Ändern neue `m_GUID`/`m_SIGUID` vergeben und `m_name` hochzählen.

## Hinweis „PARKPOSITION NICHT VERFÜGBAR" (26.10.2026, v6)

- myCupra zeigt auf der Karte den Parkplatz des Autos. Bei eingeschalteter Zündung gibt es keinen Standort →
  Hinweis mit „OK", der die Karte verdeckt. Kommt also fast immer, wenn man im Auto sitzt.
- Der „OK"-Knopf liegt bei ca. **540, 1527**, fast auf dem Zwischenablage-Vorschlag (570, 1553): kam der Hinweis
  erst nach „Suche", traf v5 „OK" statt Einfügen → Suchfeld blieb leer.
- v6 klickt „OK" per Text (wie „Suche") vor und nach „Suche" und tippt danach „Suche" noch einmal.
  **Noch nicht getestet:** ob der Text-Klick „OK" findet. Wenn nicht: Screenshot mit Hinweis → auf Koordinaten umstellen.

## Senden-Knopf (26.10.2026, v7)

- Bei Zündung an (Detailblatt mit „0 min (0.0 km)", darunter weitere Knöpfe) reicht der Knopf von y ≈ 2172 bis 2296.
  v6 tippte mit 2296 genau auf den unteren Rand → nichts passierte. v7: **2260**, liegt auch noch im Bereich der
  ursprünglichen Einmessung (v3, Knopf um 2296), falls das Blatt ohne Zündung tiefer sitzt.
