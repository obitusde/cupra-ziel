# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v2 (`Stempeln-v2.macro`, 26.10.2026)

Stempelt in der Zeiterfassung „SUR SITE". Von Hand starten.

**Warum Chrome:** Die Seite zeigt hochkant nur „bitte drehen". Mit „Desktop-Website" klappt es hochkant
(Christof 26.10.2026). Firefox merkt sich das nur pro Tab (neuer Tab vom Makro = wieder mobil), Chrome pro Seite.
Firefox bleibt Standard-Browser, nur diese Seite öffnet das Makro gezielt in Chrome (`com.android.chrome`).
Drehen per `ForceScreenRotationAction` (v1) hat nichts bewirkt → entfernt.

| # | Aktion | Wert |
|---|---|---|
| 1 | Log | `Stempeln v2 \| 1 Start, debug=…` |
| 2 | Intent (Activity) | VIEW, Daten `{v=zeit_url}`, Paket `com.android.chrome` |
| 3–5 | Log, Warten 7 s, Log | Vordergrund-App `{fg_app_name}` |
| 6–10 | Wenn `debug` | Screenshot **A** (Seite geladen) |
| 11 | Variable `stempeln` mit Abfrage | „Ja, SUR SITE stempeln" / „Nein, nicht stempeln" |
| 12 | Log | Antwort |
| 13 | Wenn `stempeln` | |
| 14–16 | Log, UI-Klick (Text, Regex) `(?i)^\s*sur\s+site\s*$`, Warten 3 s | |
| 17–21 | Wenn `debug` | Screenshot **B** (nach SUR SITE) |
| 22–23 | Log, Popup | „Gestempelt: SUR SITE" |
| 24–26 | Sonst: Log, Popup | „Nicht gestempelt" |
| 27–28 | Ende Wenn, Log | `7 Ende` |

„Tout voir" entfällt: Auf der Startseite gibt es ihn in der Desktop-Ansicht fünfmal → `zeit_url` zeigt direkt auf
die Stempelseite (`…/webquartz/ux/clock`).

### Einrichten

1. **Chrome einmalig:** Stempelseite in Chrome öffnen und anmelden. Dann ⋮ → **„Desktopwebsite"** anhaken.
   Prüfen: Chrome → Einstellungen → Website-Einstellungen → Desktopwebsite: global **aus**, diese Seite als
   Ausnahme **an** (Chrome legt die Ausnahme beim Anhaken meist selbst an).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v2.macro` laden → MacroDroid → ⋮ → **Import**,
   „Stempeln v1" löschen oder ausschalten.
3. MacroDroid → Variablen: **`zeit_url`** = Adresse der Stempelseite (`…/ux/clock`), **`debug`** = wahr
   (Screenshots an). Der Import kann `zeit_url` wieder leeren → nachsehen.
4. Ausführen (Makro-Liste ⋮ → „Ausführen"), erst mit **„Nein"**.
5. Debuggen: MacroDroid → ☰ → **Makro-Log** (Einträge „Stempeln v2 | …") teilen oder abfotografieren, dazu die
   Screenshots (MacroDroid-Ordner bzw. Galerie → Screenshots). **Nur in den Chat, nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

Gemessen (Querformat, nicht mehr gebraucht): „Tout voir" ≈ 1127, 434; „SUR SITE" ≈ 295, 605 nach ca. 500 px Scrollen,
direkt darüber „SORTIE HOME OFFICE".

### Unsicher (v2)

- JSON von `LogAction` aus BespredeL/MacroDroid; `TakeScreenshotAction` (`m_option` 0 = auf Gerät speichern,
  `m_mechanismOption` 0) nur aus der Ruby-Bibliothek `ruby-macrodroid`. Fragt Android bei jedem Screenshot
  „Aufnahme starten?", in der Aktion eine andere Methode (Bedienungshilfe) wählen.
- `{v=zeit_url}` im Intent-Feld „Daten" (Magic Text) und `{fg_app_name}`/`{fg_app_package}` im Log.
- Ob der Text-Klick in Chrome „SUR SITE" findet und ob `useRegex` beachtet wird. Trifft er nichts, passiert nichts.
- Später: Start per GPS (Ankunft am Arbeitsort).
