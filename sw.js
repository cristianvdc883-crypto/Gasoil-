// Subí el número de versión cada vez que cambies index.html
const V = 'gasoil-shell-v5';
const OCR = 'gasoil-ocr'; // guarda el motor OCR y librerías externas; no se borra al actualizar
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

// Red con límite de 3 s (si hay señal, siempre la versión nueva); si no, lo guardado
const red = url => new Promise((ok, no) => {
  const t = setTimeout(() => no(new Error('timeout')), 3000);
  fetch(url, { cache: 'no-cache' }).then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); no(e); });
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const propio = new URL(e.request.url).origin === self.location.origin;
  if (propio) {
    e.respondWith(
      red(e.request.url)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(e.request, copy)); }
          return res;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => h || caches.match('index.html')))
    );
  } else {
    // Librerías externas (OCR, Supabase): caché primero
    e.respondWith(
      caches.match(e.request).then(hit =>
        hit || fetch(e.request).then(res => {
          if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(OCR).then(c => c.put(e.request, copy)); }
          return res;
        })
      )
    );
  }
});
