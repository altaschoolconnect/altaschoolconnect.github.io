/* Alta School Connect — service worker
   The shell is cached so the app opens without a network.
   API calls are never cached: stale school lists and visit logs would be worse
   than an honest error message. */

const CACHE = 'alta-shell-v2';   // bumped so the old site's cache is dropped
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // a missing file must not block install
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Apps Script and Google Drive always go to the network
  if (url.includes('script.google.com') ||
      url.includes('script.googleusercontent.com') ||
      url.includes('drive.google.com')) {
    return;
  }

  if (e.request.method !== 'GET') return;

  // network first, so a redeploy reaches the phone on the next open
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
