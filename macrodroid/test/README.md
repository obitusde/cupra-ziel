# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v4 (`Stempeln-v4.macro`, 26.10.2026)

Stempelt in der Zeiterfassung „SUR SITE". Von Hand starten.

**Adresse fest im Makro** (Christof 26.10.2026: „mach Makro jetzt mit der URL, später lösche ich das aus dem Repo"):
direkt die Stempelseite `…/webquartz/ux/clock` (Christof 26.10.2026: geht direkt auf).

**Warum Chrome:** Die Seite zeigt hochkant nur „bitte drehen". Mit „Desktop-Website" klappt es hochkant.
Firefox merkt sich das nur pro Tab (neuer Tab vom Makro = wieder mobil), Chrome pro Seite (bei Christof
26.10.2026 eingerichtet, öffnet direkt als Desktop). Firefox bleibt Standard-Browser. Drehen per
`ForceScreenRotationAction` (v1) hat nichts bewirkt → entfernt.

| # | Aktion | Wert |
|---|---|---|
| 1 | Log | `Stempeln v4 \| 1 Start, debug=…` |
| 2 | Intent (Activity) | VIEW, `…/ux/clock`, Paket `com.android.chrome` |
| 3–5 | Log, Warten 7 s, Log | Vordergrund-App `{fg_app_name}` |
| 6–10 | Wenn `debug` | Screenshot **A** (Stempelseite) |
| 11 | Variable `stempeln` mit Abfrage | „Ja, SUR SITE stempeln" / „Nein, nicht stempeln" |
| 12 | Log | Antwort |
| 13 | Wenn `stempeln` | |
| 14–16 | Log, UI-Klick (x,y) **70, 567** = „SUR SITE", Warten 3 s | |
| 17–21 | Wenn `debug` | Screenshot **B** (nach SUR SITE) |
| 22–23 | Log, Popup | „Gestempelt: SUR SITE" |
| 24–26 | Sonst: Log, Popup | „Nicht gestempelt" |
| 27–28 | Ende Wenn, Log | `7 Ende` |

Stempelseite hochkant/Desktop in Chrome (Pixel 8, 1080 × 2400, Screenshot × 1,2): „SORTIE HOME OFFICE" y 419–454
(x 17–209), **„SUR SITE" ≈ 37–101 / 558–576 → Tipp 70, 567**, „HUB" ab x 158.

Gelernt (v3, 26.10.2026): Text-Klick mit Regex `(?i)^\s*tout voir\s*$` in Chrome lief laut Log, bewirkte aber nichts
(Screenshots A und B gleich). Ob Regex oder Chrome schuld ist, ist offen → Koordinaten. Die Screenshot-Aktion
(`TakeScreenshotAction`, `m_option` 0) speichert ohne Rückfrage, Magic Text `{fg_app_name}` geht („Chrome").

### Einrichten

1. Chrome einmalig: Seite öffnen, anmelden, ⋮ → „Desktopwebsite" (erledigt 26.10.2026).
2. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v4.macro` laden → MacroDroid → ⋮ → **Import**,
   ältere „Stempeln"-Fassungen löschen.
3. MacroDroid → Variablen: **`debug`** = wahr (Screenshots an).
4. Ausführen (Makro-Liste ⋮ → „Ausführen"). Mit **„Ja"** wird echt gestempelt.
5. Debuggen: MacroDroid → ☰ → **Makro-Log** (Einträge „Stempeln v4 | …") und die Screenshots in den Chat.
   **Nie ins Repo** (Name, Zeiten).
6. Läuft alles: `debug` = falsch.

### Unsicher (v4)

- Ob der Tipp 70, 567 „SUR SITE" trifft (Layout nach dem Laden immer gleich, Seite oben).
- Später: Start per GPS (Ankunft am Arbeitsort).
