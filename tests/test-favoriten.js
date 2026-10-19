// Tests für die Favoriten in apps-script/Code.js (v0.3.0) mit nachgebautem Sheet.
// Aufruf: node tests/test-favoriten.js
// Version 0.1.0 (19.10.2026)
const fs = require('fs');
const path = require('path');

const quelle = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.js'), 'utf8');

// --- Nachbauten -------------------------------------------------------------
function neuesBlatt(name) {
  const zeilen = [];
  return {
    name, zeilen,
    getName: () => name,
    setName(n) { name = n; this.name = n; },
    getLastRow: () => zeilen.length,
    appendRow(z) { zeilen.push(z.slice()); },
    setFrozenRows() {},
    getDataRange() { return { getValues: () => zeilen.map(z => z.slice()) }; },
    getRange(r, c, nr, nc) { return { setValues(v) { zeilen[r - 1] = v[0].slice(); } }; },
    deleteRow(r) { zeilen.splice(r - 1, 1); },
  };
}
const dateien = {};
let zaehler = 0;
function neueDatei(titel) {
  const id = 'sheet' + (++zaehler);
  const blaetter = [neuesBlatt('Tabelle1')];
  const d = {
    titel, blaetter,
    getId: () => id,
    getUrl: () => 'https://docs.google.com/spreadsheets/d/' + id,
    getSheetByName: n => blaetter.find(b => b.name === n) || null,
    getSheets: () => blaetter,
    insertSheet(n) { const b = neuesBlatt(n); blaetter.push(b); return b; },
  };
  dateien[id] = d;
  return d;
}
const SpreadsheetApp = {
  create: t => neueDatei(t),
  openById: id => { if (!dateien[id]) throw new Error('nicht gefunden'); return dateien[id]; },
};
const eigenschaften = {};
const PropertiesService = { getScriptProperties: () => ({
  getProperty: k => (k in eigenschaften ? eigenschaften[k] : null),
  setProperty: (k, v) => { eigenschaften[k] = v; },
}) };
const LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
let uuid = 0;
const Utilities = { getUuid: () => 'abcd1234-ef56-7890-abcd-' + String(++uuid).padStart(12, '0') };
const ContentService = { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } };
const Logger = { log() {} };

const gs = new Function('SpreadsheetApp', 'PropertiesService', 'LockService', 'Utilities', 'ContentService', 'Logger', 'UrlFetchApp', 'Maps',
  quelle + '; return { einrichten, doPost, favoritenAktion_, alsText_, VERSION };')(
  SpreadsheetApp, PropertiesService, LockService, Utilities, ContentService, Logger, {}, {});

let fehler = 0;
const pruefe = (bedingung, text) => { if (!bedingung) { fehler++; console.log('FEHLER ' + text); } else { console.log('ok    ' + text); } };
const post = obj => JSON.parse(gs.doPost({ postData: { contents: JSON.stringify(obj) } }).text);

// --- 1. Vor dem Einrichten ---------------------------------------------------
pruefe(/nicht eingerichtet/.test(post({ aktion: 'liste', schluessel: 'x' }).fehler), 'Ohne einrichten() → Hinweis');

// --- 2. Einrichten -------------------------------------------------------------
const e1 = gs.einrichten();
pruefe(e1.schluessel && e1.schluessel.length === 20 && /^https:/.test(e1.sheet), 'einrichten() liefert Schlüssel und Sheet');
const datei = dateien[eigenschaften.FAVORITEN_SHEET_ID];
const blatt = datei.getSheetByName('Favoriten');
pruefe(blatt && blatt.zeilen[0].join('|') === 'id|Name|Adresse|Lat|Lon|Reihenfolge|Angelegt', 'Blatt „Favoriten" mit Kopfzeile (erstes Blatt umbenannt)');
const e2 = gs.einrichten();
pruefe(e2.schluessel === e1.schluessel && Object.keys(dateien).length === 1, 'Zweites einrichten() legt nichts neu an');
const S = e1.schluessel;

// --- 3. Schlüssel ----------------------------------------------------------------
pruefe(post({ aktion: 'liste', schluessel: 'falsch' }).fehler === 'Schlüssel falsch', 'Falscher Schlüssel abgelehnt');
pruefe(post({ aktion: 'pruefen', schluessel: S }).ok === true, 'pruefen mit richtigem Schlüssel');

// --- 4. Speichern, Liste, Ändern, Löschen ----------------------------------------
const a = post({ aktion: 'speichern', schluessel: S, fav: { name: 'Büro Le Brassus', adresse: 'Route de France 16, 1348 Le Brassus', lat: 46.58, lon: 6.21 } });
pruefe(a.ok && a.fav.id && a.favoriten.length === 1, 'Favorit gespeichert');
const b = post({ aktion: 'speichern', schluessel: S, fav: { name: '', adresse: 'Edmund-Weller-str. 2, 58675 Hemer' } });
pruefe(b.favoriten.length === 2 && b.fav.name === 'Edmund-Weller-str. 2, 58675 Hemer', 'Ohne Name → Adresse als Name');
pruefe(b.favoriten[0].name === 'Büro Le Brassus' && b.favoriten[1].reihenfolge === 2, 'Reihenfolge nach Anlegen');
const c = post({ aktion: 'speichern', schluessel: S, fav: { id: b.fav.id, name: 'Hemer', adresse: 'Edmund-Weller-str. 2, 58675 Hemer', reihenfolge: 0 } });
pruefe(c.favoriten.length === 2 && c.favoriten[0].name === 'Hemer', 'Umbenennen + Reihenfolge ändern (gleiche id)');
pruefe(blatt.zeilen.length === 3, 'Keine doppelte Zeile beim Ändern');
pruefe(post({ aktion: 'speichern', schluessel: S, fav: { name: 'x' } }).fehler === 'Adresse fehlt', 'Ohne Adresse abgelehnt');
const d = post({ aktion: 'loeschen', schluessel: S, id: a.fav.id });
pruefe(d.ok && d.favoriten.length === 1 && d.favoriten[0].name === 'Hemer', 'Löschen');
pruefe(/nicht gefunden/.test(post({ aktion: 'loeschen', schluessel: S, id: 'gibtsnicht' }).fehler), 'Löschen unbekannter id → Fehler');

// --- 5. Von Hand im Sheet gepflegte Zeile (ohne id, ohne Koordinaten) -----------
blatt.appendRow(['', 'Oma', 'Musterweg 1, 58809 Neuenrade', '', '', '', '']);
const l = post({ aktion: 'liste', schluessel: S });
const oma = l.favoriten.find(f => f.name === 'Oma');
pruefe(oma && oma.lat === null && oma.id === 'z' + blatt.zeilen.length, 'Handgepflegte Zeile ohne id/Koordinaten wird gelesen');

// --- 6. Formel-Schutz ---------------------------------------------------------------
pruefe(gs.alsText_('=HYPERLINK("x")') === "'=HYPERLINK(\"x\")", 'Formel am Anfang entschärft');
pruefe(gs.alsText_('  a   b ') === 'a b', 'Leerzeichen bereinigt');
pruefe(post({ aktion: 'quatsch', schluessel: S }).fehler === 'Unbekannte Aktion: quatsch', 'Unbekannte Aktion');

console.log(fehler ? '\n' + fehler + ' Fehler' : '\nAlle Tests bestanden');
process.exit(fehler ? 1 : 0);
