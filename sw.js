// Service Worker v1779402257
// Автообновление: 2026-05-22 01:24:17

const CACHE_NAME = 'hr-site-v1779402257';
const OFFLINE_URL = '/';
const STORAGE_KEY = 'hr_user_id';

// Генерация или получение ID пользователя
async function getOrCreateUserId() {
    const cache = await caches.open(CACHE_NAME);
    let userId = await cache.match(STORAGE_KEY).then(r => r?.text());

    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        await cache.put(STORAGE_KEY, new Response(userId));
        console.log('[SW] ✅ Создан новый User ID:', userId);
    }

    return userId;
}

// Основные ресурсы для кеширования
const urlsToCache = [
  '/',
  '/styles-public.css',
  '/critical.css',
  '/components/common/scripts/core.js',
  '/components/common/scripts/calculator.js',
  '/components/common/scripts/quiz.js',
  '/components/common/scripts/modal.js',
  '/components/common/scripts/forms.js',
  '/components/common/scripts/animations.js',
  '/components/common/scripts/navigation.js',
  '/components/common/scripts/copy.js',
  '/components/common/scripts/cookie-consent.js',
  '/components/common/scripts/public-main.js',
  '/assets/images/img_1.jpg',
  '/assets/docs/checklist.pdf',
  '/assets/docs/training_program.pdf',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Дополнительные ресурсы
const additionalUrls = [
  '/styles-editor.css',
  '/components/common/scripts/editor/main.js'
];

// Установка
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      await getOrCreateUserId();

      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Кеширование основных ресурсов...');

      for (const url of urlsToCache) {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response);
            console.log(`[SW] ✅ Закеширован: ${url}`);
          } else {
            console.warn(`[SW] ⚠️ Не удалось: ${url} (status ${response.status})`);
          }
        } catch (err) {
          console.error(`[SW] ❌ Ошибка ${url}:`, err);
        }
      }

      setTimeout(async () => {
        const cache = await caches.open(CACHE_NAME);
        for (const url of additionalUrls) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[SW] ✅ Доп. ресурс: ${url}`);
            }
          } catch (err) {
            console.log(`[SW] Доп. ресурс пропущен: ${url}`);
          }
        }
      }, 3000);
    })()
  );

  self.skipWaiting();
});

// Активация
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const oldKeys = keys.filter(key => key !== CACHE_NAME && key.startsWith('hr-site-v'));

      await Promise.all(oldKeys.map(key => {
        console.log(`[SW] 🗑️ Удаляем: ${key}`);
        return caches.delete(key);
      }));

      console.log('[SW] ✅ Активирован');
    })()
  );

  event.waitUntil(clients.claim());

  (async () => {
    const userId = await getOrCreateUserId();
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'USER_ID',
        userId: userId
      });
    });
  })();
});

// Обработка запросов
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('mc.yandex.ru')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (err) {
          console.log('[SW] Офлайн-режим');
        }

        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return caches.match(OFFLINE_URL);
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      try {
        const userId = await getOrCreateUserId();
        const modifiedHeaders = new Headers(event.request.headers);
        modifiedHeaders.set('X-User-Id', userId);

        const modifiedRequest = new Request(event.request, {
          headers: modifiedHeaders
        });

        const networkResponse = await fetch(modifiedRequest);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (event.request.destination === 'image') {
          return new Response('', { status: 204 });
        }
        return new Response('Нет соединения', { status: 503 });
      }
    })()
  );
});

// Сообщения от страницы
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_USER_ID') {
    (async () => {
      const userId = await getOrCreateUserId();
      event.source.postMessage({
        type: 'USER_ID',
        userId: userId
      });
    })();
  }
});
