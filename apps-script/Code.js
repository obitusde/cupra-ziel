/**
 * Cupra-Ziel — Apps Script (Web-Dienst)
 * Version 0.3.0 (19.10.2026)
 *
 * Nimmt einen geteilten Google-Maps-Link (oder Text mit Link) entgegen, löst ihn auf
 * und liefert Name, Koordinaten und eine Adresse, die in die Suche der myCupra-App passt.
 *
 * Aufrufe (doGet, Antwort immer JSON):
 *   ?link=<Maps-Link oder geteilter Text>   → { ok, version, name, lat, lon, adresse, varianten[], abstandM, … }
 *   ?test=1                                 → Diagnose mit den Testlinks aus TESTLINKS
 *   ?version=1                              → { ok, version }
 * doPost (Text-Körper mit JSON, braucht den Schlüssel aus einrichten()):
 *   { aktion: 'pruefen' | 'liste' | 'speichern' | 'loeschen', schluessel, fav?, id? }
 *
 * Link auflösen braucht keinen Schlüssel (nur öffentliche Kartendaten). Favoriten (Adressen, z. B.
 * Familie) liegen im Google Sheet „Cupra-Ziel Favoriten" und gehen nur mit dem Schlüssel – das Repo
 * und damit die Web-App-Adresse sind öffentlich. Schlüssel und Sheet-ID stehen in den Script
 * Properties (SCHLUESSEL, FAVORITEN_SHEET_ID), angelegt von einrichten() im Editor.
 *
 * Versionen:
 *   0.1.0  erste Fassung: Link auflösen (aus ladeplanung übernommen), Rückwärts-Geokodierung,
 *          Diagnose ?test=1 und Editor-Funktion testeLinks()
 *   0.2.0  Links ohne Koordinaten (Suchtext q=…, Plus Code, nur Name) werden über den Geocoder
 *          gesucht; Plus Codes werden in eine Straßenadresse umgewandelt (myCupra kennt keine
 *          Plus Codes); Fehler enthalten die aufgelöste URL (Testlink 3 vom 19.10.2026)
 *   0.3.0  Favoriten im Google Sheet: einrichten() legt Sheet + Schlüssel an, doPost mit
 *          pruefen/liste/speichern/loeschen (Christof 19.10.2026: „b in google sheets")
 */
const VERSION = '0.3.0';
const FAV_SPALTEN = ['id', 'Name', 'Adresse', 'Lat', 'Lon', 'Reihenfolge', 'Angelegt'];

/** Christofs Beispiel-Links vom 18.10.2026 (Hemer u. a.) für die Diagnose. */
const TESTLINKS = [
  'https://maps.app.goo.gl/53h3puNCPWGw6KsGA',
  'https://maps.app.goo.gl/i5bzsVVas1MLkhnMA',
  'https://maps.app.goo.gl/tnxVCVgAGfAzY39AA',
];

// ---------------------------------------------------------------------------
// Web-Zugriff
// ---------------------------------------------------------------------------

function doGet(e) {
  const p = (e && e.parameter) || {};
  let antwort;
  try {
    if (p.test) {
      antwort = { ok: true, version: VERSION, test: TESTLINKS.map(function (l) { return sicherAufloesen_(l); }) };
    } else if (p.link) {
      antwort = zielAusText_(p.link);
    } else {
      antwort = { ok: true, version: VERSION, hinweis: 'Parameter link=<Google-Maps-Link> fehlt' };
    }
  } catch (fehler) {
    antwort = { ok: false, version: VERSION, fehler: String(fehler && fehler.message || fehler) };
  }
  return ContentService.createTextOutput(JSON.stringify(antwort)).setMimeType(ContentService.MimeType.JSON);
}

/** Für den Editor: einmal ausführen → Google fragt nach den Berechtigungen, Ergebnis im Log. */
function testeLinks() {
  TESTLINKS.forEach(function (l) {
    Logger.log(JSON.stringify(sicherAufloesen_(l), null, 2));
  });
}

function sicherAufloesen_(link) {
  try { return zielAusText_(link); }
  catch (fehler) { return { ok: false, link: link, fehler: String(fehler && fehler.message || fehler) }; }
}

// ---------------------------------------------------------------------------
// Hauptablauf
// ---------------------------------------------------------------------------

/**
 * Text aus dem Teilen-Menü → Ziel.
 * Google Maps teilt je nach Ort „Name\nAdresse\nhttps://maps.app.goo.gl/…" oder nur den Link.
 */
function zielAusText_(text) {
  const link = linkAusText_(text);
  if (!link) throw new Error('Kein Google-Maps-Link gefunden');

  let aufgeloest = '';
  const ergebnis = {
    ok: true,
    version: VERSION,
    link: link,
    aufgeloest: '',
    name: '',
    lat: null,
    lon: null,
    adresse: '',
    abstandM: null,
    genauigkeit: '',
    quelle: '',
    varianten: [],
  };
  try {
    aufgeloest = folgeWeiterleitungen_(link);
    ergebnis.aufgeloest = aufgeloest;
    const info = werteMapsUrlAus_(aufgeloest);
    ergebnis.name = info.name || '';
    ergebnis.lat = info.lat;
    ergebnis.lon = info.lon;
    ergebnis.quelle = info.lat !== null ? 'Koordinaten im Link' : '';

    // Ohne Koordinaten: Adresse, Suchtext (q=…) oder Name über den Geocoder suchen
    if (info.lat === null) {
      const suche = info.adresse || info.suche || info.name;
      if (suche) {
        const vor = geokodiere_(suche);
        if (vor) {
          ergebnis.lat = vor.lat; ergebnis.lon = vor.lon;
          ergebnis.quelle = 'gesucht: ' + suche;
        }
        // Eine echte Adresse behalten; Plus Codes kennt myCupra nicht → später Straßenadresse suchen
        if (info.adresse && !istPlusCode_(info.adresse)) ergebnis.adresse = info.adresse;
        if (!ergebnis.name && info.suche && !istPlusCode_(info.suche)) ergebnis.name = info.suche;
      }
    }

    // Mit Koordinaten: nächste Adresse suchen
    if (ergebnis.lat !== null && !ergebnis.adresse) {
      const rueck = rueckwaerts_(ergebnis.lat, ergebnis.lon);
      if (rueck) {
        ergebnis.adresse = rueck.adresse;
        ergebnis.abstandM = Math.round(haversineM_(ergebnis.lat, ergebnis.lon, rueck.lat, rueck.lon));
        ergebnis.genauigkeit = rueck.genauigkeit;
        ergebnis.ort = rueck.ort;
      }
    }
  } catch (fehler) {
    return { ok: false, version: VERSION, link: link, aufgeloest: aufgeloest, fehler: String(fehler && fehler.message || fehler) };
  }

  ergebnis.varianten = varianten_(ergebnis);
  if (!ergebnis.varianten.length) {
    return { ok: false, version: VERSION, link: link, aufgeloest: aufgeloest, fehler: 'Keine Adresse gefunden' };
  }
  return ergebnis;
}

/** Plus Code wie „9QPH+FCP" oder „9QPH+FCP Hemer". */
function istPlusCode_(text) {
  return /(^|\s)[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}(\s|,|$)/i.test(String(text || ''));
}

/** Suchtexte für myCupra, beste zuerst. Welche myCupra annimmt, klärt der Handy-Test. */
function varianten_(z) {
  const liste = [];
  const dazu = function (art, text) {
    text = String(text || '').trim();
    if (text && !liste.some(function (v) { return v.text === text; })) liste.push({ art: art, text: text });
  };
  dazu('Adresse', ohneLand_(z.adresse));
  if (z.name && z.ort && !/^\d/.test(z.name) && z.name.indexOf(z.ort) < 0) dazu('Name + Ort', z.name + ', ' + z.ort);
  dazu('Adresse mit Land', z.adresse);
  if (z.lat !== null) dazu('Koordinaten', z.lat.toFixed(6) + ', ' + z.lon.toFixed(6));
  return liste;
}

function ohneLand_(adresse) {
  return String(adresse || '').replace(/,\s*(Deutschland|Schweiz|Suisse|Svizzera|Frankreich|France|Italien|Italia|Österreich|Germany|Switzerland)$/i, '');
}

// ---------------------------------------------------------------------------
// Link erkennen und auflösen (aus ladeplanung v0.23.0 übernommen)
// ---------------------------------------------------------------------------

function istMapsLink_(text) {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(text);
}

/** Erster Maps-Link in einem geteilten Text. */
function linkAusText_(text) {
  const kandidaten = String(text || '').match(/https?:\/\/[^\s"'<>]+/g) || [];
  for (let i = 0; i < kandidaten.length; i++) {
    if (istMapsLink_(kandidaten[i])) return kandidaten[i];
  }
  return '';
}

/**
 * Folgt Weiterleitungen einzeln (followRedirects: false) bis zu einer Maps-URL mit Inhalt.
 * Eine Zustimmungsseite von Google wird über ihren continue-Parameter übersprungen.
 */
function folgeWeiterleitungen_(url) {
  let aktuell = url;
  for (let schritt = 0; schritt < 6; schritt++) {
    if (/consent\.google\./.test(aktuell)) {
      const weiter = aktuell.match(/[?&]continue=([^&]+)/);
      if (!weiter) throw new Error('Google-Zustimmungsseite ohne Weiterleitung');
      aktuell = decodeURIComponent(weiter[1]);
      continue;
    }
    if (/\/maps\/(place|dir|search)\//.test(aktuell) || /!3d-?\d/.test(aktuell) || /[?&](q|query)=/.test(aktuell)) return aktuell;

    const antwort = UrlFetchApp.fetch(aktuell, { followRedirects: false, muteHttpExceptions: true });
    const code = antwort.getResponseCode();
    if (code < 300 || code >= 400) return aktuell;
    const kopf = antwort.getAllHeaders();
    const ziel = kopf.Location || kopf.location;
    if (!ziel) return aktuell;
    aktuell = Array.isArray(ziel) ? ziel[0] : ziel;
  }
  return aktuell;
}

/**
 * Liest Name und Koordinaten aus einer aufgelösten Maps-URL.
 * Vorrang: !3d<lat>!4d<lon> (exakter Ort), dann /maps/search/lat,lon, dann q=/query=, dann @lat,lon.
 * Ergebnis { name, lat, lon, adresse? }; lat/lon null, wenn nichts gefunden wurde.
 */
function werteMapsUrlAus_(url) {
  const u = String(url);
  let name = '';
  const mName = u.match(/\/maps\/place\/([^\/@?]+)/);
  if (mName) {
    try { name = decodeURIComponent(mName[1].replace(/\+/g, ' ')).trim(); } catch (e) { name = ''; }
  }
  // Abgelegte Markierung: Name ist nur eine Koordinate (51°23'10.4"N 7°46'42.9"E) → kein Name
  if (/^\d+°/.test(name) || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name)) name = '';

  const paare = [];
  const muster = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g;
  let treffer;
  while ((treffer = muster.exec(u)) !== null) paare.push(treffer);
  if (paare.length > 0) {
    const letztes = paare[paare.length - 1];
    return { name: name, lat: Number(letztes[1]), lon: Number(letztes[2]) };
  }

  const ersatz = u.match(/\/maps\/search\/(-?\d+\.\d+)(?:,|%2C)\s*(?:\+|%20)?(-?\d+\.\d+)/i)
    || u.match(/[?&](?:q|query)=(-?\d+\.\d+)(?:,|%2C)\s*(?:\+|%20)?(-?\d+\.\d+)/i)
    || u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ersatz) return { name: name, lat: Number(ersatz[1]), lon: Number(ersatz[2]) };

  // Suchtext statt Koordinaten: ?q=9QPH%2BFCP+Hemer oder ?q=Bahnhof+Morges
  const mSuche = u.match(/[?&](?:q|query)=([^&#]+)/i);
  if (mSuche) {
    let suche = '';
    try { suche = decodeURIComponent(mSuche[1].replace(/\+/g, ' ')).trim(); } catch (e) { suche = ''; }
    if (suche) return { name: name, lat: null, lon: null, suche: suche };
  }

  // Neueres Teilen-Format ohne Koordinaten: „Name, Straße Nr, PLZ Ort, Land"
  const teile = name.split(',');
  if (teile.length >= 2 && /\d/.test(name)) {
    const ersterIstAdresse = /\d/.test(teile[0]);
    return {
      name: ersterIstAdresse ? '' : teile[0].trim(),
      lat: null, lon: null,
      adresse: ersterIstAdresse ? name : teile.slice(1).join(',').trim(),
    };
  }
  return { name: name, lat: null, lon: null };
}

// ---------------------------------------------------------------------------
// Geokodierung (eingebauter Maps-Dienst, kein API-Schlüssel)
// ---------------------------------------------------------------------------

/** Nächste Adresse zu einem Punkt. Bevorzugt Ergebnisse mit Hausnummer bzw. Straße. */
function rueckwaerts_(lat, lon) {
  const antwort = Maps.newGeocoder().setLanguage('de').reverseGeocode(lat, lon);
  if (antwort.status !== 'OK' || !antwort.results || !antwort.results.length) return null;
  const bevorzugt = ['street_address', 'premise', 'subpremise', 'route', 'establishment', 'point_of_interest'];
  let bestes = null;
  for (let i = 0; i < bevorzugt.length && !bestes; i++) {
    bestes = antwort.results.find(function (r) { return r.types.indexOf(bevorzugt[i]) >= 0; }) || null;
  }
  bestes = bestes || antwort.results[0];
  return {
    adresse: bestes.formatted_address,
    lat: bestes.geometry.location.lat,
    lon: bestes.geometry.location.lng,
    genauigkeit: bestes.geometry.location_type,
    ort: ortAus_(bestes),
  };
}

function geokodiere_(adresse) {
  const antwort = Maps.newGeocoder().setLanguage('de').geocode(adresse);
  const erstes = antwort.status === 'OK' && antwort.results && antwort.results[0];
  if (!erstes) return null;
  return { lat: erstes.geometry.location.lat, lon: erstes.geometry.location.lng };
}

function ortAus_(ergebnis) {
  const teil = (ergebnis.address_components || []).find(function (c) {
    return c.types.indexOf('locality') >= 0 || c.types.indexOf('postal_town') >= 0;
  });
  return teil ? teil.long_name : '';
}

function haversineM_(lat1, lon1, lat2, lon2) {
  const r = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * r * Math.asin(Math.sqrt(a));
}


// ---------------------------------------------------------------------------
// Favoriten (Google Sheet, nur mit Schlüssel)
// ---------------------------------------------------------------------------

/**
 * Einmal im Editor ausführen: legt das Sheet „Cupra-Ziel Favoriten" und den Schlüssel an (falls noch
 * nicht vorhanden) und schreibt beides ins Log. Den Schlüssel in der App unter Einstellungen eintragen.
 */
function einrichten() {
  const eig = PropertiesService.getScriptProperties();
  let id = eig.getProperty('FAVORITEN_SHEET_ID');
  let datei = null;
  if (id) { try { datei = SpreadsheetApp.openById(id); } catch (e) { datei = null; } }
  if (!datei) {
    datei = SpreadsheetApp.create('Cupra-Ziel Favoriten');
    id = datei.getId();
    eig.setProperty('FAVORITEN_SHEET_ID', id);
  }
  favBlatt_(datei);
  let schluessel = eig.getProperty('SCHLUESSEL');
  if (!schluessel) {
    schluessel = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    eig.setProperty('SCHLUESSEL', schluessel);
  }
  Logger.log('Sheet: ' + datei.getUrl());
  Logger.log('Schlüssel für die App (Einstellungen): ' + schluessel);
  return { sheet: datei.getUrl(), schluessel: schluessel };
}

function doPost(e) {
  let antwort;
  try {
    const anfrage = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    antwort = favoritenAktion_(anfrage);
  } catch (fehler) {
    antwort = { ok: false, version: VERSION, fehler: String(fehler && fehler.message || fehler) };
  }
  return ContentService.createTextOutput(JSON.stringify(antwort)).setMimeType(ContentService.MimeType.JSON);
}

function favoritenAktion_(anfrage) {
  const eig = PropertiesService.getScriptProperties();
  const soll = eig.getProperty('SCHLUESSEL');
  if (!soll) return { ok: false, version: VERSION, fehler: 'Favoriten noch nicht eingerichtet (im Editor einrichten() ausführen)' };
  if (String(anfrage.schluessel || '') !== soll) return { ok: false, version: VERSION, fehler: 'Schlüssel falsch' };

  const aktion = anfrage.aktion;
  if (aktion === 'pruefen') return { ok: true, version: VERSION };

  const sperre = LockService.getScriptLock();
  sperre.waitLock(10000);
  try {
    const blatt = favBlatt_(SpreadsheetApp.openById(eig.getProperty('FAVORITEN_SHEET_ID')));
    if (aktion === 'liste') return { ok: true, version: VERSION, favoriten: favoritenLesen_(blatt) };
    if (aktion === 'speichern') {
      const fav = favSpeichern_(blatt, anfrage.fav || {});
      return { ok: true, version: VERSION, fav: fav, favoriten: favoritenLesen_(blatt) };
    }
    if (aktion === 'loeschen') {
      favLoeschen_(blatt, String(anfrage.id || ''));
      return { ok: true, version: VERSION, favoriten: favoritenLesen_(blatt) };
    }
    return { ok: false, version: VERSION, fehler: 'Unbekannte Aktion: ' + aktion };
  } finally {
    sperre.releaseLock();
  }
}

/** Blatt „Favoriten" mit Kopfzeile (legt es bei Bedarf an). */
function favBlatt_(datei) {
  let blatt = datei.getSheetByName('Favoriten');
  if (!blatt) {
    const erstes = datei.getSheets()[0];
    if (erstes && erstes.getLastRow() === 0) { erstes.setName('Favoriten'); blatt = erstes; }
    else blatt = datei.insertSheet('Favoriten');
  }
  if (blatt.getLastRow() === 0) {
    blatt.appendRow(FAV_SPALTEN);
    blatt.setFrozenRows(1);
  }
  return blatt;
}

/** Zeilen → [{ id, name, adresse, lat, lon, reihenfolge }], sortiert nach Reihenfolge, dann Name. */
function favoritenLesen_(blatt) {
  const werte = blatt.getDataRange().getValues();
  const kopf = werte[0] || [];
  const sp = function (n) { return kopf.indexOf(n); };
  const liste = [];
  for (let i = 1; i < werte.length; i++) {
    const z = werte[i];
    const adresse = String(z[sp('Adresse')] || '').trim();
    if (!adresse) continue;
    const lat = Number(z[sp('Lat')]), lon = Number(z[sp('Lon')]);
    liste.push({
      id: String(z[sp('id')] || ('z' + (i + 1))),
      name: String(z[sp('Name')] || '').trim() || adresse,
      adresse: adresse,
      lat: isFinite(lat) && z[sp('Lat')] !== '' ? lat : null,
      lon: isFinite(lon) && z[sp('Lon')] !== '' ? lon : null,
      reihenfolge: z[sp('Reihenfolge')] === '' || !isFinite(Number(z[sp('Reihenfolge')])) ? 999 : Number(z[sp('Reihenfolge')]),
    });
  }
  liste.sort(function (a, b) { return a.reihenfolge - b.reihenfolge || a.name.localeCompare(b.name, 'de'); });
  return liste;
}

/** Neuer Favorit oder Änderung (gleiche id). Gibt den gespeicherten Favoriten zurück. */
function favSpeichern_(blatt, fav) {
  const name = alsText_(fav.name);
  const adresse = alsText_(fav.adresse);
  if (!adresse) throw new Error('Adresse fehlt');
  const werte = blatt.getDataRange().getValues();
  const kopf = werte[0];
  const sp = function (n) { return kopf.indexOf(n); };
  const lat = fav.lat === null || fav.lat === undefined || fav.lat === '' ? '' : Number(fav.lat);
  const lon = fav.lon === null || fav.lon === undefined || fav.lon === '' ? '' : Number(fav.lon);

  for (let i = 1; i < werte.length; i++) {
    if (fav.id && String(werte[i][sp('id')]) === String(fav.id)) {
      const zeile = werte[i].slice();
      zeile[sp('Name')] = name || adresse;
      zeile[sp('Adresse')] = adresse;
      if (lat !== '') zeile[sp('Lat')] = lat;
      if (lon !== '') zeile[sp('Lon')] = lon;
      if (fav.reihenfolge !== undefined && fav.reihenfolge !== null && fav.reihenfolge !== '') zeile[sp('Reihenfolge')] = Number(fav.reihenfolge);
      blatt.getRange(i + 1, 1, 1, zeile.length).setValues([zeile]);
      return { id: String(fav.id), name: name || adresse, adresse: adresse };
    }
  }
  let hoechste = 0;
  for (let i = 1; i < werte.length; i++) hoechste = Math.max(hoechste, Number(werte[i][sp('Reihenfolge')]) || 0);
  const id = 'f' + Date.now().toString(36);
  const neu = [];
  neu[sp('id')] = id;
  neu[sp('Name')] = name || adresse;
  neu[sp('Adresse')] = adresse;
  neu[sp('Lat')] = lat;
  neu[sp('Lon')] = lon;
  neu[sp('Reihenfolge')] = hoechste + 1;
  neu[sp('Angelegt')] = new Date();
  for (let k = 0; k < kopf.length; k++) if (neu[k] === undefined) neu[k] = '';
  blatt.appendRow(neu);
  return { id: id, name: name || adresse, adresse: adresse };
}

function favLoeschen_(blatt, id) {
  const werte = blatt.getDataRange().getValues();
  const sp = werte[0].indexOf('id');
  for (let i = werte.length - 1; i >= 1; i--) {
    if (String(werte[i][sp]) === id) { blatt.deleteRow(i + 1); return true; }
  }
  throw new Error('Favorit nicht gefunden');
}

/** Text fürs Sheet: gekürzt, Formel-Zeichen am Anfang entschärft. */
function alsText_(wert) {
  let t = String(wert === undefined || wert === null ? '' : wert).replace(/\s+/g, ' ').trim().slice(0, 200);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}
