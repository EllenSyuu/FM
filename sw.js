/*
 * FM Notebook service worker — makes the app work offline without ever serving stale code.
 *
 * - The app's own pages, scripts, styles and data: network first, so an update is picked up
 *   on the next open; the cached copy is used only when offline (or the network is slow).
 * - Fonts and images: cache first (they never change under the same name).
 * - Anything else (GitHub API for sync, other sites): not touched.
 *
 * Progress itself is never cached here: it lives in localStorage and the private Gist.
 */
const VERSION = 'fm-notebook-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'vendor/katex/katex.min.css',
  'vendor/katex/katex.min.js',
  'js/app.js',
  'js/art.js',
  'js/expr.js',
  'js/growth.js',
  'js/merge.js',
  'js/plan.js',
  'js/pwa.js',
  'js/srs.js',
  'js/stage.js',
  'js/store.js',
  'js/sync.js',
  'js/timeline.js',
  'data/kit.js',
  'data/syllabus.js',
  'data/t1-tvm.js',
  'data/t2-annuities.js',
  'data/t3-loans.js',
  'data/t4-bonds.js',
  'data/t5-alm.js',
  'assets/grain.png',
  'assets/favicon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'fonts/cormorant-garamond-latin-500-italic.woff2',
  'fonts/cormorant-garamond-latin-500-normal.woff2',
  'fonts/cormorant-garamond-latin-600-italic.woff2',
  'fonts/cormorant-garamond-latin-600-normal.woff2',
  'fonts/inter-latin-wght-italic.woff2',
  'fonts/inter-latin-wght-normal.woff2',
  'fonts/la-belle-aurore-latin-400-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const STATIC = /\.(woff2|png|svg|jpg)$/;

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (STATIC.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        hit =>
          hit ||
          fetch(req).then(res => {
            if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Network first, with a short timeout so a weak connection does not keep the app waiting.
  e.respondWith(
    new Promise(resolve => {
      let done = false;
      const fromCache = () =>
        caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || caches.match('index.html'));
      const t = setTimeout(() => {
        fromCache().then(hit => {
          if (hit && !done) {
            done = true;
            resolve(hit);
          }
        });
      }, 3500);
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? 'index.html' : req, copy));
          }
          if (!done) {
            done = true;
            clearTimeout(t);
            resolve(res);
          }
        })
        .catch(() =>
          fromCache().then(hit => {
            if (!done) {
              done = true;
              clearTimeout(t);
              resolve(hit || Response.error());
            }
          }),
        );
    }),
  );
});
