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

def generate_sw():
    version = int(time.time())
    sw_content = f'''const CACHE_NAME = 'hr-site-v{version}';
const urlsToCache = [
  '/',
  '/styles.css',
  '/components/common/scripts/core.js',
  '/components/common/scripts/public-main.js',
  '/assets/images/img_1.jpg',
  '/assets/docs/checklist.pdf',
  '/assets/docs/training_program.pdf',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
];

self.addEventListener('install', event => {{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
}});

self.addEventListener('activate', event => {{
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {{
        if (key !== CACHE_NAME) return caches.delete(key);
      }})
    ))
  );
}});

self.addEventListener('fetch', event => {{
  event.respondWith(
    caches.match(event.request).then(response => {{
      if (response) return response;
      return fetch(event.request).then(networkResponse => {{
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {{
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {{
            cache.put(event.request, responseToCache);
          }});
        }}
        return networkResponse;
      }});
    }})
  );
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
    build_version = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    footer = footer.replace("{{VERSION}}", build_version)

    if editor_mode:
        scripts_content = read_component("components", "scripts-editor.html")
        out_file = "editor.html"
    else:
        scripts_content = read_component("components", "scripts-public.html")
        out_file = "index.html"

    parts = [head, navbar, full_content, footer, scripts_content]
    full_html = "".join(parts)

    if not editor_mode:
        full_html = minify_html(full_html)

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full_html)

    print(f"✅ Собрано {out_file}")

if __name__ == "__main__":
    generate_sw()
    build_page(editor_mode=False)
    build_page(editor_mode=True)