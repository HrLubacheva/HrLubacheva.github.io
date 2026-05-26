// Пустой service worker для предотвращения ошибок 404
self.addEventListener('install', function(event) {
    self.skipWaiting();
});
self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});