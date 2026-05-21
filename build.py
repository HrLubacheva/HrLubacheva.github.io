#!/usr/bin/env python3
import os
import re
import time
from datetime import datetime

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"


def read_component(dir_path, name):
    path = os.path.join(dir_path, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def minify_html(html):
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'>\s+<', '><', html)
    html = re.sub(r'\n\s*\n', '\n', html)
    html = re.sub(r'\s+=\s+', '=', html)
    return html.strip()


def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r';\s*}', '}', css)
    css = re.sub(r'{\s+', '{', css)
    css = re.sub(r'}\s+', '}', css)
    return css.strip()


def generate_sw():
    version = int(time.time())
    sw_content = f'''// Service Worker v{version}
// Автообновление: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

const CACHE_NAME = 'hr-site-v{version}';
const OFFLINE_URL = '/';
const STORAGE_KEY = 'hr_user_id';

// Генерация или получение ID пользователя
async function getOrCreateUserId() {{
    const cache = await caches.open(CACHE_NAME);
    let userId = await cache.match(STORAGE_KEY).then(r => r?.text());

    if (!userId) {{
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        await cache.put(STORAGE_KEY, new Response(userId));
        console.log('[SW] ✅ Создан новый User ID:', userId);
    }}

    return userId;
}}

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
self.addEventListener('install', event => {{
  event.waitUntil(
    (async () => {{
      await getOrCreateUserId();

      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Кеширование основных ресурсов...');

      for (const url of urlsToCache) {{
        try {{
          const response = await fetch(url, {{ cache: 'reload' }});
          if (response.ok) {{
            await cache.put(url, response);
            console.log(`[SW] ✅ Закеширован: ${{url}}`);
          }} else {{
            console.warn(`[SW] ⚠️ Не удалось: ${{url}} (status ${{response.status}})`);
          }}
        }} catch (err) {{
          console.error(`[SW] ❌ Ошибка ${{url}}:`, err);
        }}
      }}

      setTimeout(async () => {{
        const cache = await caches.open(CACHE_NAME);
        for (const url of additionalUrls) {{
          try {{
            const response = await fetch(url, {{ cache: 'reload' }});
            if (response.ok) {{
              await cache.put(url, response);
              console.log(`[SW] ✅ Доп. ресурс: ${{url}}`);
            }}
          }} catch (err) {{
            console.log(`[SW] Доп. ресурс пропущен: ${{url}}`);
          }}
        }}
      }}, 3000);
    }})()
  );

  self.skipWaiting();
}});

// Активация
self.addEventListener('activate', event => {{
  event.waitUntil(
    (async () => {{
      const keys = await caches.keys();
      const oldKeys = keys.filter(key => key !== CACHE_NAME && key.startsWith('hr-site-v'));

      await Promise.all(oldKeys.map(key => {{
        console.log(`[SW] 🗑️ Удаляем: ${{key}}`);
        return caches.delete(key);
      }}));

      console.log('[SW] ✅ Активирован');
    }})()
  );

  event.waitUntil(clients.claim());

  (async () => {{
    const userId = await getOrCreateUserId();
    const clients = await self.clients.matchAll();
    clients.forEach(client => {{
      client.postMessage({{
        type: 'USER_ID',
        userId: userId
      }});
    }});
  }})();
}});

// Обработка запросов
self.addEventListener('fetch', event => {{
  const url = new URL(event.request.url);

  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager') ||
      url.hostname.includes('mc.yandex.ru')) {{
    return;
  }}

  if (event.request.mode === 'navigate') {{
    event.respondWith(
      (async () => {{
        try {{
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {{
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }}
        }} catch (err) {{
          console.log('[SW] Офлайн-режим');
        }}

        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return caches.match(OFFLINE_URL);
      }})()
    );
    return;
  }}

  event.respondWith(
    (async () => {{
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      try {{
        const userId = await getOrCreateUserId();
        const modifiedHeaders = new Headers(event.request.headers);
        modifiedHeaders.set('X-User-Id', userId);

        const modifiedRequest = new Request(event.request, {{
          headers: modifiedHeaders
        }});

        const networkResponse = await fetch(modifiedRequest);
        if (networkResponse && networkResponse.status === 200) {{
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }}
        return networkResponse;
      }} catch (err) {{
        if (event.request.destination === 'image') {{
          return new Response('', {{ status: 204 }});
        }}
        return new Response('Нет соединения', {{ status: 503 }});
      }}
    }})()
  );
}});

// Сообщения от страницы
self.addEventListener('message', event => {{
  if (event.data === 'skipWaiting') {{
    self.skipWaiting();
  }}
  if (event.data?.type === 'GET_USER_ID') {{
    (async () => {{
      const userId = await getOrCreateUserId();
      event.source.postMessage({{
        type: 'USER_ID',
        userId: userId
      }});
    }})();
  }}
}});
'''
    with open("sw.js", "w", encoding="utf-8") as f:
        f.write(sw_content)
    print(f"✅ Сгенерирован sw.js (версия {version})")


def build_page(editor_mode=False):
    sections_order = [
        "hero.html", "roles.html", "services.html", "stats.html",
        "benefits.html", "process.html", "calculator.html", "quiz.html",
        "freebies.html", "calendar.html", "contacts.html"
    ]
    sections_content = []
    for section in sections_order:
        path = os.path.join(SECTIONS_DIR, section)
        if os.path.exists(path):
            sections_content.append(read_component(SECTIONS_DIR, section))
        else:
            sections_content.append(f"<!-- Секция {section} не найдена -->")
    full_content = "\n".join(sections_content)

    head = read_component(COMMON_DIR, "_head.html")
    navbar = read_component(COMMON_DIR, "navbar.html")
    footer = read_component(COMMON_DIR, "footer.html")
    cookie_banner = read_component(COMMON_DIR, "cookie-banner.html")
    privacy_modal = read_component(COMMON_DIR, "privacy-modal.html")

    build_version = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    footer = footer.replace("{{VERSION}}", build_version)

    critical_css_path = "critical.css"
    if os.path.exists(critical_css_path):
        with open(critical_css_path, "r", encoding="utf-8") as f:
            critical_css = f.read()
        critical_css = minify_css(critical_css)
        style_tag = f"<style>\n{critical_css}\n</style>"
        if "<style>" in head:
            head = re.sub(r'<style>.*?</style>', style_tag, head, flags=re.DOTALL)
        else:
            head = head.replace("</head>", f"{style_tag}\n</head>")
        print("✅ Критический CSS встроен в head")

    if editor_mode:
        scripts_content = read_component("components", "scripts-editor.html")
        out_file = "editor.html"
    else:
        scripts_content = read_component("components", "scripts-public.html")
        out_file = "index.html"

    parts = [head, navbar, full_content, footer, cookie_banner, privacy_modal, scripts_content]
    full_html = "".join(parts)

    if not editor_mode:
        full_html = minify_html(full_html)

    css_path = "styles-public.css"
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            css_content = f.read()
        css_content = minify_css(css_content)
        with open(css_path, "w", encoding="utf-8") as f:
            f.write(css_content)
        print("✅ Минифицирован styles-public.css")

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full_html)

    print(f"✅ Собрано {out_file}")


if __name__ == "__main__":
    generate_sw()
    build_page(editor_mode=False)
    build_page(editor_mode=True)