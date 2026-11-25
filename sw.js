// Service worker: la app funciona sin conexión una vez abierta con cobertura.
// Sube el número de versión cada vez que cambies archivos de la app.
const VERSION = 'v4';
const APP = 'aprov-app-' + VERSION;
const TILES = 'aprov-teselas';
const MAX_TILES = 3000;
const SHELL = [
  './', 'index.html', 'js/core.js', 'data/parcelas.json', 'data/plantilla.json', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL).then(() => Promise.all(CDN.map(u => c.add(u).catch(() => null)))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aprov-app-') && k !== APP).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function trimTiles() {
  const c = await caches.open(TILES); const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]);
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Teselas del mapa (PNOA / mapa base IGN). Las que pide el mapa salen primero de la caché:
  // las descargadas a propósito (aprov-offline, no se borran solas) o las ya vistas (aprov-teselas, máx. MAX_TILES).
  // Las descargas que hace la propia app (no son imágenes) van directas a la red.
  if (url.hostname === 'www.ign.es' && url.pathname.startsWith('/wmts/')) {
    if (req.destination !== 'image') return;
    e.respondWith(caches.match(req).then(async hit => {
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') { const c = await caches.open(TILES); c.put(req, res.clone()); trimTiles(); }
      return res;
    }));
    return;
  }
  // Ortofoto para el croquis (WMS): siempre de la red
  if (url.hostname === 'www.ign.es') return;
  // App y datos: primero red (para recibir actualizaciones), si falla, caché
  e.respondWith(fetch(req).then(res => {
    if (res.ok && (url.origin === location.origin || url.hostname === 'cdnjs.cloudflare.com')) { const cp = res.clone(); caches.open(APP).then(c => c.put(req, cp)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
