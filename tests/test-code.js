// Tests für apps-script/Code.js ohne Google: UrlFetchApp und Maps werden nachgebaut.
// Aufruf: node tests/test-code.js
// Version 0.2.0 (19.10.2026) – Fälle für Suchtext, Plus Code, Fehler mit URL
const fs = require('fs');
const path = require('path');

const quelle = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.js'), 'utf8');

// --- Nachbauten -------------------------------------------------------------
const weiterleitungen = {};          // url → Location
let rueckAntwort = null;             // Antwort für reverseGeocode
let vorAntwort = null;               // Antwort für geocode
const UrlFetchApp = {
  fetch(url) {
    const ziel = weiterleitungen[url];
    return {
      getResponseCode: () => (ziel ? 302 : 200),
      getAllHeaders: () => (ziel ? { Location: ziel } : {}),
    };
  },
};
const Maps = {
  newGeocoder() {
    return {
      setLanguage() { return this; },
      reverseGeocode() { return rueckAntwort; },
      geocode() { return vorAntwort; },
    };
  },
};
const ContentService = { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } };
const Logger = { log() {} };

const gs = new Function('UrlFetchApp', 'Maps', 'ContentService', 'Logger',
  quelle + '; return { werteMapsUrlAus_, linkAusText_, zielAusText_, varianten_, ohneLand_, folgeWeiterleitungen_, istPlusCode_, doGet, VERSION };')(
  UrlFetchApp, Maps, ContentService, Logger);

let fehler = 0;
const pruefe = (bedingung, text) => { if (!bedingung) { fehler++; console.log('FEHLER ' + text); } else { console.log('ok    ' + text); } };

// --- 1. URL-Auswertung -------------------------------------------------------
const ort = gs.werteMapsUrlAus_('https://www.google.com/maps/place/AMAG+Baden/@47.0393597,5.0221103,7z/data=!3m1!5s0x4790136ad4bbd9c9:0x24e369278b68a5ba!4m6!3m5!1s0x47901314810438b3:0x3238b97c1297aeac!8m2!3d47.4417298!4d8.2954185!16s%2Fg%2F11c59x9f0q?entry=tts');
pruefe(ort.name === 'AMAG Baden' && ort.lat === 47.4417298 && ort.lon === 8.2954185, '!3d/!4d hat Vorrang vor @, Name erkannt');

const pin = gs.werteMapsUrlAus_("https://www.google.com/maps/place/51%C2%B023'10.4%22N+7%C2%B046'42.9%22E/@51.3862,7.7785,17z/data=!3m1!4b1!4m4!3m3!8m2!3d51.386212!4d7.778578?entry=tts");
pruefe(pin.name === '' && pin.lat === 51.386212, 'Markierter Ort: Koordinaten statt Name');

const suche = gs.werteMapsUrlAus_('https://www.google.com/maps/search/51.386212,+7.778578?entry=tts');
pruefe(suche.lat === 51.386212 && suche.lon === 7.778578, '/maps/search/lat,+lon');

const q = gs.werteMapsUrlAus_('https://maps.google.com/?q=46.5110%2C6.4980');
pruefe(q.lat === 46.511 && q.lon === 6.498, 'q=lat%2Clon');

const adr = gs.werteMapsUrlAus_('https://www.google.com/maps/place/Bahnhof+Morges,+Place+de+la+Gare+1,+1110+Morges');
pruefe(adr.lat === null && adr.adresse === 'Place de la Gare 1, 1110 Morges' && adr.name === 'Bahnhof Morges', 'Format ohne Koordinaten → Adresse');

// --- 2. Geteilter Text --------------------------------------------------------
pruefe(gs.linkAusText_('Café Hemer\nHauptstr. 1, 58675 Hemer\nhttps://maps.app.goo.gl/abc123?g_st=ac') === 'https://maps.app.goo.gl/abc123?g_st=ac', 'Link aus mehrzeiligem Text');
pruefe(gs.linkAusText_('https://example.com/x https://maps.app.goo.gl/zz') === 'https://maps.app.goo.gl/zz', 'Fremder Link wird übersprungen');
pruefe(gs.linkAusText_('kein Link') === '', 'Ohne Link leer');

// --- 3. Ganzer Ablauf mit Weiterleitung und Rückwärts-Geokodierung ----------
weiterleitungen['https://maps.app.goo.gl/tnxVCVgAGfAzY39AA'] = 'https://consent.google.com/m?continue=' +
  encodeURIComponent('https://www.google.com/maps/search/51.386212,+7.778578?entry=tts');
rueckAntwort = {
  status: 'OK',
  results: [
    { types: ['plus_code'], formatted_address: '9QPH+FC Hemer, Deutschland', geometry: { location: { lat: 51.3862, lng: 7.7786 }, location_type: 'GEOMETRIC_CENTER' }, address_components: [] },
    { types: ['street_address'], formatted_address: 'Hauptstraße 210, 58675 Hemer, Deutschland',
      geometry: { location: { lat: 51.3864, lng: 7.7790 }, location_type: 'ROOFTOP' },
      address_components: [{ types: ['locality', 'political'], long_name: 'Hemer' }] },
  ],
};
const z = gs.zielAusText_('https://maps.app.goo.gl/tnxVCVgAGfAzY39AA?g_st=ac'.replace('?g_st=ac', ''));
pruefe(z.ok && z.lat === 51.386212, 'Kurzlink über Zustimmungsseite aufgelöst');
pruefe(z.adresse === 'Hauptstraße 210, 58675 Hemer, Deutschland', 'Straßenadresse vor Plus Code bevorzugt');
pruefe(z.varianten[0].text === 'Hauptstraße 210, 58675 Hemer', 'Erste Variante ohne Land: ' + JSON.stringify(z.varianten[0]));
pruefe(z.abstandM > 0 && z.abstandM < 100, 'Abstand berechnet: ' + z.abstandM + ' m');
pruefe(z.varianten.some(v => v.art === 'Koordinaten'), 'Koordinaten als Reserve-Variante');

// --- 3b. v0.2.0: Suchtext / Plus Code statt Koordinaten ----------------------
const qText = gs.werteMapsUrlAus_('https://maps.google.com/?q=9QPH%2BFCP+Hemer&entry=gps');
pruefe(qText.lat === null && qText.suche === '9QPH+FCP Hemer', 'q=Suchtext erkannt: ' + JSON.stringify(qText));
pruefe(gs.istPlusCode_('9QPH+FCP Hemer') && gs.istPlusCode_('9QPH+FCP') && !gs.istPlusCode_('Hauptstraße 2, 58675 Hemer'), 'Plus Code erkannt');

weiterleitungen['https://maps.app.goo.gl/plus'] = 'https://maps.google.com/?q=9QPH%2BFCP+Hemer,+Deutschland&entry=gps';
vorAntwort = { status: 'OK', results: [{ geometry: { location: { lat: 51.386212, lng: 7.778578 } } }] };
const zp = gs.zielAusText_('https://maps.app.goo.gl/plus');
pruefe(zp.ok && zp.lat === 51.386212 && /gesucht/.test(zp.quelle), 'Plus Code über Geocoder gesucht');
pruefe(zp.varianten[0].text === 'Hauptstraße 210, 58675 Hemer', 'Plus Code → Straßenadresse: ' + (zp.varianten[0] || {}).text);
pruefe(!zp.varianten.some(v => /\+/.test(v.text)), 'Kein Plus Code unter den Varianten');

weiterleitungen['https://maps.app.goo.gl/name'] = 'https://www.google.com/maps/place/Bahnhof+Morges/data=!4m2!3m1!1s0x0:0x1';
vorAntwort = { status: 'OK', results: [{ geometry: { location: { lat: 46.5110, lng: 6.4980 } } }] };
const zn = gs.zielAusText_('https://maps.app.goo.gl/name');
pruefe(zn.ok && zn.lat === 46.511 && zn.name === 'Bahnhof Morges', 'Nur Name → über Geocoder gesucht');

weiterleitungen['https://maps.app.goo.gl/leer'] = 'https://www.google.com/maps/data=!4m2';
vorAntwort = { status: 'ZERO_RESULTS', results: [] };
const zl = gs.zielAusText_('https://maps.app.goo.gl/leer');
pruefe(zl.ok === false && zl.aufgeloest === 'https://www.google.com/maps/data=!4m2', 'Fehler enthält die aufgelöste URL');

// --- 4. doGet ------------------------------------------------------------------
const roh = gs.doGet({ parameter: { link: 'nix' } });
const j = JSON.parse(roh.text);
pruefe(j.ok === false && /Kein Google-Maps-Link/.test(j.fehler), 'doGet meldet Fehler als JSON');
pruefe(JSON.parse(gs.doGet({ parameter: {} }).text).version === gs.VERSION, 'doGet ohne Parameter liefert Version');

pruefe(gs.ohneLand_('Rue X 1, 1110 Morges, Schweiz') === 'Rue X 1, 1110 Morges', 'Land entfernt');

console.log(fehler ? '\n' + fehler + ' Fehler' : '\nAlle Tests bestanden');
process.exit(fehler ? 1 : 0);
