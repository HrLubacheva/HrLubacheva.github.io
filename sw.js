const CACHE_NAME = 'hr-site-v1779360135';
const urlsToCache = [
  '/',
  '/styles.css',
  '/components/common/scripts/core.js',
  '/components/common/scripts/main.js',
  '/assets/images/img_1.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
