# Test-Makros (nicht Cupra)

Hier liegen Makros, die nichts mit Cupra-Ziel zu tun haben und nur zum Ausprobieren im öffentlichen Repo stehen.
Wenn sie laufen, zieht Christof sie in ein eigenes Repo um. **Nichts Persönliches in die Dateien** (Adressen,
Namen, Zugangsdaten): Solche Werte stehen nur in MacroDroid-Variablen auf dem Handy.

## Stempeln v1 (`Stempeln-v1.macro`, 26.10.2026)

Stempelt in der Zeiterfassung (Webseite, im Standard-Browser = Firefox) „SUR SITE". Von Hand starten.

| # | Aktion | Wert |
|---|---|---|
| 1 | Bildschirmdrehung erzwingen | **Querformat** (die Seite zeigt hochkant nur „bitte drehen") |
| 2 | Warten | 1 s |
| 3 | Webseite öffnen | `{v=zeit_url}` |
| 4 | Warten | 6 s |
| 5 | UI-Klick (Text, Regex) | `(?i)^\s*tout voir\s*$` – fehlt der Link, passiert nichts |
| 6 | Warten | 4 s |
| 7 | Variable `stempeln` setzen, mit Abfrage | „Ja, SUR SITE stempeln" / „Nein, nicht stempeln" |
| 8 | Wenn `stempeln` = wahr | |
| 9 | UI-Klick (Text, Regex) | `(?i)^\s*sur\s+site\s*$` (ohne Scrollen, Klick per Text) |
| 10 | Warten | 3 s |
| 11 | Popup | „Gestempelt: SUR SITE" |
| 12 | Sonst | |
| 13 | Popup | „Nicht gestempelt" |
| 14 | Ende Wenn | |
| 15 | Bildschirmdrehung erzwingen | **aus** (zurück hochkant, automatische Drehung ist bei Christof aus) |

Gemessen (Querformat 2400 × 1080, falls der Text-Klick nicht geht): „Tout voir" ≈ 1127, 434 auf der Startseite;
auf `…/ux/clock` ca. 500 px nach oben wischen, dann „SUR SITE" ≈ 295, 605 (direkt darüber liegt „SORTIE HOME OFFICE"!).

### Einrichten

1. `https://obitusde.github.io/cupra-ziel/macrodroid/test/Stempeln-v1.macro` laden → MacroDroid → ⋮ → **Import**.
2. MacroDroid → Variablen → **`zeit_url`** = Adresse der Startseite der Zeiterfassung eintragen (nur auf dem Handy).
3. **Prüfen:** Aktion 1 muss „Querformat" zeigen, Aktion 15 „Aus"/„nicht erzwingen". Die Nummern dieser Auswahl
   (`m_option` 2 und 0) sind geraten – wenn etwas anderes dasteht, von Hand umstellen und Bescheid geben.
4. Starten: in der Makro-Liste ⋮ → „Ausführen" (Testlauf) oder als Symbol auf den Startbildschirm
   (MacroDroid-Widget/Verknüpfung „Makro ausführen").
5. Erster Test mit **„Nein"**: zeigt, ob Drehen, Öffnen und „Tout voir" klappen, ohne zu stempeln.

### Unsicher (v1)

- JSON von `ForceScreenRotationAction` (Feld `m_option`) und `SetVariableAction` mit Abfrage stammen nicht aus
  einem echten Export, sondern aus der Ruby-Bibliothek `ruby-macrodroid` bzw. Beispielen in BespredeL/MacroDroid.
- Ob der Text-Klick in Firefox Links/Knöpfe findet (auch „SUR SITE" außerhalb des sichtbaren Bereichs) und ob
  MacroDroid `useRegex` beachtet. Trifft der Regex nichts, passiert nichts (kein falsches Stempeln).
- Später: Start per GPS (Ankunft am Arbeitsort).
