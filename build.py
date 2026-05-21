#!/usr/bin/env python3
import os
import re
import time
from datetime import datetime

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"

# Кеширование для ускорения сборки
FILE_CACHE = {}


def get_mtime(filepath):
    try:
        return os.path.getmtime(filepath)
    except:
        return 0


def is_changed(filepath):
    current = get_mtime(filepath)
    cached = FILE_CACHE.get(filepath, 0)
    if current > cached:
        FILE_CACHE[filepath] = current
        return True
    return False


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


def minify_js(js):
    """Минификация JavaScript - ВРЕМЕННО ОТКЛЮЧЕНА (возвращаем как есть)"""
    # Возвращаем JS без изменений, чтобы не ломать код
    return js


def bundle_js(js_files, output_path):
    """Объединение JS файлов в один бандл (без минификации)"""
    if not js_files:
        return False

    bundled = []
    any_changed = False

    for js_file in js_files:
        if os.path.exists(js_file):
            if is_changed(js_file):
                any_changed = True
            with open(js_file, 'r', encoding='utf-8') as f:
                bundled.append(f.read())

    if bundled and any_changed:
        # Просто объединяем без минификации
        result = '\n'.join(bundled)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result)
        return True
    return False


def generate_sw():
    version = int(time.time())
    sw_content = f'''const CACHE_NAME = 'hr-site-v{version}';
const urlsToCache = [
  '/',
  '/styles-public.css',
  '/bundle-public.js',
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

    # Вставка критического CSS в head
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

    # Используем бандлы вместо отдельных скриптов
    if editor_mode:
        out_file = "editor.html"
        scripts_html = '<script src="bundle-editor.js"></script>'
    else:
        out_file = "index.html"
        scripts_html = '<script src="bundle-public.js"></script>'

    parts = [head, navbar, full_content, footer, scripts_html]
    full_html = "".join(parts)

    if not editor_mode:
        full_html = minify_html(full_html)

    # Минифицируем CSS файлы
    for css_path in ["styles-public.css", "styles-editor.css"]:
        if os.path.exists(css_path):
            with open(css_path, "r", encoding="utf-8") as f:
                css_content = f.read()
            css_content = minify_css(css_content)
            with open(css_path, "w", encoding="utf-8") as f:
                f.write(css_content)
            print(f"✅ Минифицирован {css_path}")

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full_html)

    print(f"✅ Собрано {out_file}")


if __name__ == "__main__":
    print("🔨 Запуск сборки...")
    start_time = time.time()

    # 1. Создаем JS бандлы
    print("\n📦 Создание JS бандлов...")

    # Бандл для публичной страницы
    public_js_files = [
        "components/common/scripts/core.js",
        "components/common/scripts/calculator.js",
        "components/common/scripts/quiz.js",
        "components/common/scripts/modal.js",
        "components/common/scripts/forms.js",
        "components/common/scripts/animations.js",
        "components/common/scripts/navigation.js",
        "components/common/scripts/copy.js",
        "components/common/scripts/cookie-consent.js",
        "components/common/scripts/public-main.js",
    ]

    if bundle_js(public_js_files, "bundle-public.js"):
        print("  ✅ bundle-public.js создан")
        size = os.path.getsize("bundle-public.js") / 1024
        print(f"     Размер: {size:.1f} KB")

    # Бандл для редактора
    editor_js_files = [
        "components/common/scripts/core.js",
        "components/common/scripts/calculator.js",
        "components/common/scripts/quiz.js",
        "components/common/scripts/modal.js",
        "components/common/scripts/forms.js",
        "components/common/scripts/animations.js",
        "components/common/scripts/navigation.js",
        "components/common/scripts/copy.js",
        "components/common/scripts/cookie-consent.js",
        "components/common/scripts/editor/main.js",
        "components/common/scripts/editor/core/config.js",
        "components/common/scripts/editor/core/state.js",
        "components/common/scripts/editor/core/utils.js",
        "components/common/scripts/editor/core/history.js",
        "components/common/scripts/editor/features/selection.js",
        "components/common/scripts/editor/features/lock.js",
        "components/common/scripts/editor/features/dragndrop.js",
        "components/common/scripts/editor/features/block-editor.js",
        "components/common/scripts/editor/ui/panels.js",
        "components/common/scripts/editor/ui/toolbar.js",
        "components/common/scripts/editor/ui/property-panel.js",
        "components/common/scripts/editor/ui/history-panel.js",
    ]

    if bundle_js(editor_js_files, "bundle-editor.js"):
        print("  ✅ bundle-editor.js создан")
        size = os.path.getsize("bundle-editor.js") / 1024
        print(f"     Размер: {size:.1f} KB")

    # 2. Генерируем Service Worker
    print("\n⚙️ Генерация Service Worker...")
    generate_sw()

    # 3. Собираем страницы
    print("\n📄 Сборка HTML страниц...")
    build_page(editor_mode=False)
    build_page(editor_mode=True)

    # 4. Итоги
    elapsed = time.time() - start_time
    print(f"\n✅ Сборка завершена за {elapsed:.2f} секунд")

    print("\n📊 Результаты сборки:")
    for f in ["index.html", "editor.html", "bundle-public.js", "bundle-editor.js",
              "styles-public.css", "styles-editor.css", "sw.js"]:
        if os.path.exists(f):
            size = os.path.getsize(f) / 1024
            print(f"  {f}: {size:.1f} KB")