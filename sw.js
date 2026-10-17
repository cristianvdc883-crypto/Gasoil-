// Subí el número de versión cada vez que cambies index.html
const V = 'gasoil-shell-v4';
const OCR = 'gasoil-ocr'; // guarda el motor OCR; no se borra al actualizar
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('gasoil-shell-') && k !== V).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Caché primero; lo que no está se baja y se guarda (así queda el motor OCR y su idioma)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const propio = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit ||
      fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(propio ? V : OCR).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('index.html'))
    )
  );
});
