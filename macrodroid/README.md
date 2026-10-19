# MacroDroid-Makro „Cupra" – Ziel automatisch ans Auto senden

Stand 19.10.2026 · Makro **v5** (`Cupra-v5.macro`) · für **Pixel 8** (1080 × 2400), myCupra 2.15, Anzeige- und Schriftgröße Standard

Cupra-Ziel (und die Ladeplanung) rufen den Webhook `https://trigger.macrodroid.com/<Geräte-ID>/cupra?ziel=<Text>` auf.
Das Makro macht dann das, was man sonst von Hand tut:

| # | Aktion | Wert |
|---|---|---|
| 1 | Zwischenablage füllen | `{v=ziel}` |
| 2 | Intent (Activity) | `android.intent.action.VIEW`, Daten `cupra://map`, Paket `com.cupra.mycupra` |
| 3 | Warten | 2 s |
| 4 | UI-Interaktion Klick (Text) | `Suche` → Suchfeld, Tastatur geht auf |
| 5 | Warten | 1 s |
| 6 | UI-Interaktion Klick (x,y) | **570, 1553** = Zwischenablage-Vorschlag über der Tastatur (Gboard) |
| 7 | Warten | 2 s |
| 8 | UI-Interaktion Klick (x,y) | **540, 470** = Mitte der ersten Trefferzeile |
| 9 | Warten | 2 s |
| 10 | UI-Interaktion Klick (x,y) | **540, 2296** = „AN DAS FAHRZEUG SENDEN" |
| 11 | Warten | 3 s (Bestätigung in der App) |
| 12 | Startbildschirm | |
| 13 | Warten | 1 s |
| 14 | Hintergrundprozess beenden | My CUPRA |
| 15 | Popup-Meldung | „Ziel gesendet: {v=ziel}" |

## Einrichten (neues Handy)

1. **MacroDroid** installieren, Bedienungshilfe für MacroDroid erlauben (fragt beim ersten UI-Klick).
2. Einmalig am PC (USB-Debugging an, Handy angesteckt), adb liegt z. B. unter `D:\Coding\geraete-pc-sync\tools\platform-tools\`:
   ```
   adb shell pm grant com.arlosoft.macrodroid android.permission.WRITE_SECURE_SETTINGS
   ```
3. `Cupra-v5.macro` aufs Handy laden → MacroDroid → ⋮ → **Import**. Ältere Fassungen ausschalten (alle hören auf `cupra`).
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
