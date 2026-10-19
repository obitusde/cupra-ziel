// Cupra-Ziel — Service Worker, Version 1.0.0 (19.10.2026)
// Nötig, damit Chrome die App installiert und ins Teilen-Menü aufnimmt.
// Immer zuerst das Netz (neue Versionen kommen sofort an), ohne Netz die zuletzt geladene Fassung.
// Anfragen an Apps Script (fremde Adresse) gehen unverändert durch.
const SPEICHER = 'cupra-ziel-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const speicher = await caches.open(SPEICHER);
    try {
      const antwort = await fetch(anfrage);
      if (antwort.ok) {
        const schluessel = new URL(anfrage.url);
        schluessel.search = ''; // eine Fassung je Datei, egal mit welchen Teilen-Parametern
        await speicher.put(schluessel.href, antwort.clone());
      }
      return antwort;
    } catch (fehler) {
      const alt = await speicher.match(anfrage, { ignoreSearch: true });
      if (alt) return alt;
      throw fehler;
    }
  })());
});
