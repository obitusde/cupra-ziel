# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v3 (`Stempeln-v3.macro`, 26.10.2026)

Stempelt in der Zeiterfassung „SUR SITE". Von Hand starten.

**Adresse fest im Makro** (Christof 26.10.2026: „mach Makro jetzt mit der URL, später lösche ich das aus dem Repo"):
Startseite `…/webquartz/ux/home`. Keine Variable `zeit_url` mehr.

**Warum Chrome:** Die Seite zeigt hochkant nur „bitte drehen". Mit „Desktop-Website" klappt es hochkant.
Firefox merkt sich das nur pro Tab (neuer Tab vom Makro = wieder mobil), Chrome pro Seite (bei Christof
26.10.2026 eingerichtet, öffnet direkt als Desktop). Firefox bleibt Standard-Browser. Drehen per
`ForceScreenRotationAction` (v1) hat nichts bewirkt → entfernt.

| # | Aktion | Wert |
|---|---|---|
| 1 | Log | `Stempeln v3 \| 1 Start, debug=…` |
| 2 | Intent (Activity) | VIEW, Startseite, Paket `com.android.chrome` |
| 3–5 | Log, Warten 7 s, Log | Vordergrund-App `{fg_app_name}` |
| 6–10 | Wenn `debug` | Screenshot **A** (Startseite) |
| 11–14 | Log, UI-Klick (Text, Regex) `(?i)^\s*tout voir\s*$`, Warten 4 s, Log | |
| 15–19 | Wenn `debug` | Screenshot **B** (nach „Tout voir") |
| 20 | Variable `stempeln` mit Abfrage | „Ja, SUR SITE stempeln" / „Nein, nicht stempeln" |
| 21 | Log | Antwort |
| 22 | Wenn `stempeln` | |
| 23–25 | Log, UI-Klick (Text, Regex) `(?i)^\s*sur\s+site\s*$`, Warten 3 s | |
| 26–30 | Wenn `debug` | Screenshot **C** (nach SUR SITE) |
| 31–32 | Log, Popup | „Gestempelt: SUR SITE" |
| 33–35 | Sonst: Log, Popup | „Nicht gestempelt" |
| 36–37 | Ende Wenn, Log | `7 Ende` |

„Tout voir" gibt es in der Desktop-Ansicht der Startseite **fünfmal** (Timbrer, Corriger, Mon planning, Ma situation,
Demande d'absence). Erwartet: der Text-Klick nimmt den ersten = Kasten „Timbrer" (oben links). Screenshot B zeigt es.
Trifft er einen anderen, gibt es dort kein „SUR SITE" → es wird nichts gestempelt. Koordinate des richtigen Links
hochkant/Desktop: ≈ 481, 283 – **direkt darunter (ab y ≈ 326) liegt „TIMBRER SORTIE HOME OFFICE"**, daher Text statt Koordinate.

### Einrichten

1. Chrome einmalig: Seite öffnen, anmelden, ⋮ → „Desktopwebsite" (erledigt 26.10.2026).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v3.macro` laden → MacroDroid → ⋮ → **Import**,
   ältere „Stempeln"-Fassungen löschen.
3. MacroDroid → Variablen: **`debug`** = wahr (Screenshots an).
4. Ausführen (Makro-Liste ⋮ → „Ausführen"), erst mit **„Nein"**.
5. Debuggen: MacroDroid → ☰ → **Makro-Log** (Einträge „Stempeln v3 | …") und die Screenshots A/B in den Chat.
   **Nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

### Unsicher (v3)

- JSON von `LogAction` aus BespredeL/MacroDroid; `TakeScreenshotAction` (`m_option` 0 = auf Gerät speichern,
  `m_mechanismOption` 0) nur aus der Ruby-Bibliothek `ruby-macrodroid`. Fragt Android bei jedem Screenshot
  „Aufnahme starten?", in der Aktion eine andere Methode (Bedienungshilfe) wählen.
- `{fg_app_name}`/`{fg_app_package}` im Log (Magic Text).
- Ob der Text-Klick in Chrome „Tout voir" (welchen der fünf) und „SUR SITE" findet und ob `useRegex` beachtet wird. Trifft er nichts, passiert nichts.
- Später: Start per GPS (Ankunft am Arbeitsort).
