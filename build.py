#!/usr/bin/env python3
import os
import re
import time
from sync import sync_components

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
    """Генерирует sw.js с уникальной версией на основе временной метки"""
    version = int(time.time())
    sw_content = f'''const CACHE_NAME = 'hr-site-v{version}';
const urlsToCache = [
  '/',
  '/styles.css',
  '/components/common/scripts/core.js',
  '/components/common/scripts/public-main.js',
  '/assets/images/img_1.jpg'
];

self.addEventListener('install', event => {{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
}});

self.addEventListener('fetch', event => {{
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
}});
'''
    with open("sw.js", "w", encoding="utf-8") as f:
        f.write(sw_content)
    print(f"✅ Сгенерирован sw.js (версия {version})")

def build_page(editor_mode=False):
    # Синхронизируем секции из index.html (если он существует)
    if os.path.exists("index.html"):
        sync_components()

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
    generate_sw()          # генерируем sw.js с новой версией
    build_page(editor_mode=False)
    build_page(editor_mode=True)