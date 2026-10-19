/**
 * Cupra-Ziel — Apps Script (Web-Dienst)
 * Version 0.1.0 (19.10.2026)
 *
 * Nimmt einen geteilten Google-Maps-Link (oder Text mit Link) entgegen, löst ihn auf
 * und liefert Name, Koordinaten und eine Adresse, die in die Suche der myCupra-App passt.
 *
 * Aufrufe (doGet, Antwort immer JSON):
 *   ?link=<Maps-Link oder geteilter Text>   → { ok, version, name, lat, lon, adresse, varianten[], abstandM, … }
 *   ?test=1                                 → Diagnose mit den Testlinks aus TESTLINKS
 *   ?version=1                              → { ok, version }
 *
 * Kein Schlüssel nötig: Der Dienst verarbeitet nur Google-Maps-Links und gibt nur öffentliche
 * Kartendaten zurück. Kontingent läuft über Christofs Google-Konto (UrlFetch + Geocoder).
 *
 * Versionen:
 *   0.1.0  erste Fassung: Link auflösen (aus ladeplanung übernommen), Rückwärts-Geokodierung,
 *          Diagnose ?test=1 und Editor-Funktion testeLinks()
 */
const VERSION = '0.1.0';

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

  const aufgeloest = folgeWeiterleitungen_(link);
  const info = werteMapsUrlAus_(aufgeloest);
  const ergebnis = {
    ok: true,
    version: VERSION,
    link: link,
    aufgeloest: aufgeloest,
    name: info.name || '',
    lat: info.lat,
    lon: info.lon,
    adresse: '',
    abstandM: null,
    genauigkeit: '',
    varianten: [],
  };

  // Ohne Koordinaten: Adresse aus dem Link vorwärts geokodieren
  if (info.lat === null && info.adresse) {
    const vor = geokodiere_(info.adresse);
    if (vor) { ergebnis.lat = vor.lat; ergebnis.lon = vor.lon; }
    ergebnis.adresse = info.adresse;
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

  ergebnis.varianten = varianten_(ergebnis);
  if (!ergebnis.varianten.length) throw new Error('Keine Adresse gefunden');
  return ergebnis;
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
