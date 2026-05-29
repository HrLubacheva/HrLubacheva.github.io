import os
import re
import argparse
from datetime import datetime

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"

def read_file(path):
    """Читает файл, возвращает содержимое или пустую строку при ошибке."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"⚠️ Файл не найден: {path}")
        return ""

def read_files_by_ext(dir_path, ext):
    """Собирает содержимое всех файлов с заданным расширением из папки."""
    if not os.path.exists(dir_path):
        print(f"⚠️ Папка не найдена: {dir_path}")
        return ""
    files = sorted([f for f in os.listdir(dir_path) if f.endswith(ext)])
    if not files:
        print(f"⚠️ В {dir_path} нет файлов с расширением {ext}")
        return ""
    content = "\n".join(read_file(os.path.join(dir_path, f)) for f in files)
    print(f"📁 Загружено {len(files)} файлов {ext} из {dir_path}")
    return content

def process_includes_once(content, current_dir):
    """Однократно заменяет @@include('...') на содержимое файла."""
    pattern = r"@@include\('([^']+)'\)"
    def replace_include(match):
        filename = match.group(1)
        # Сначала ищем рядом с текущим файлом
        filepath = os.path.join(current_dir, filename)
        if not os.path.exists(filepath):
            # Если нет, ищем в общей папке components/common
            filepath = os.path.join(COMMON_DIR, filename)
        if os.path.exists(filepath):
            return read_file(filepath)
        else:
            print(f"⚠️ Include не найден: {filename} (искали в {current_dir} и {COMMON_DIR})")
            return ""
    return re.sub(pattern, replace_include, content)

def process_includes_recursive(content, current_dir, max_depth=5):
    """Рекурсивно обрабатывает все вложенные include."""
    for _ in range(max_depth):
        new_content = process_includes_once(content, current_dir)
        if new_content == content:
            break
        content = new_content
    else:
        print(f"⚠️ Достигнута максимальная глубина вложенности include ({max_depth})")
    return content

def minify_css(css):
    """Примитивная минификация CSS (удаление комментариев и лишних пробелов)."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'}\s+', '}', css)
    css = re.sub(r';\s+', ';', css)
    return css.strip()

def minify_js(js):
    """Примитивная минификация JS (удаление комментариев и лишних пробелов)."""
    js = re.sub(r'//.*?$', '', js, flags=re.MULTILINE)
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)
    js = re.sub(r'\s+', ' ', js)
    js = re.sub(r';\s+', ';', js)
    js = re.sub(r'\{\s+', '{', js)
    js = re.sub(r'\s+\}', '}', js)
    return js.strip()

def build_page(minify=False):
    print("🔨 Сборка index.html..." + (" (минификация включена)" if minify else ""))

    # Сборка CSS и JS
    full_css = read_files_by_ext(os.path.join(COMMON_DIR, "css"), ".css")
    full_js = read_files_by_ext(os.path.join(COMMON_DIR, "js"), ".js")

    if minify:
        full_css = minify_css(full_css)
        full_js = minify_js(full_js)

    # Сборка секций
    if not os.path.exists(SECTIONS_DIR):
        print(f"❌ Папка с секциями не найдена: {SECTIONS_DIR}")
        return
    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    if not section_files:
        print(f"❌ В {SECTIONS_DIR} нет HTML-файлов")
        return
    sections_html = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)
    print(f"📄 Загружено {len(section_files)} секций")

    # Чтение основных компонентов
    head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
    metatags_raw = read_file(os.path.join(COMMON_DIR, "01_metatags.html"))
    metatags = process_includes_recursive(metatags_raw, COMMON_DIR)
    navbar = read_file(os.path.join(COMMON_DIR, "03_navbar.html"))
    footer_raw = read_file(os.path.join(COMMON_DIR, "04_footer.html"))
    footer = process_includes_recursive(footer_raw, COMMON_DIR)
    cookie = read_file(os.path.join(COMMON_DIR, "06_cookie-banner.html"))
    privacy_modal = read_file(os.path.join(COMMON_DIR, "07_privacy-modal.html"))
    share_btn = read_file(os.path.join(COMMON_DIR, "08_share.html"))
    materials_modal = read_file(os.path.join(COMMON_DIR, "09_materials-modal.html"))

    # Подстановка версии в футер
    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    # Вставка метатегов в <head>
    if '</title>' in head:
        head = head.replace('</title>', f'</title>\n    {metatags}', 1)
    else:
        head = head.replace('</head>', f'{metatags}\n</head>', 1)
        print("⚠️ Тег </title> не найден, метатеги вставлены перед </head>")

    # Вставка CSS в <head>
    if '</head>' in head:
        head = head.replace('</head>', f'<style>\n{full_css}\n</style>\n</head>', 1)
    else:
        print("❌ Не найден </head>, стили не вставлены")
        return

    # Формирование тела документа
    body_content = navbar + sections_html + footer + cookie + privacy_modal + share_btn + materials_modal
    body_with_script = body_content + f'<script defer>\n{full_js}\n</script>'

    full_html = head + body_with_script

    # Запись итогового файла
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✅ index.html собран")

def generate_sitemap():
    """Генерирует sitemap.xml на основе существующих HTML-файлов."""
    print("🗺️ Генерация sitemap.xml...")
    today = datetime.now().strftime("%Y-%m-%d")
    base_url = "https://hrlubacheva.github.io"
    urls = [{"loc": "/", "priority": "1.0", "changefreq": "monthly"}]
    for file in os.listdir('.'):
        if file.endswith('.html') and file != 'index.html':
            urls.append({"loc": f"/{file}", "priority": "0.5", "changefreq": "yearly"})
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        sitemap += f'''    <url>
        <loc>{base_url}{u["loc"]}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{u["changefreq"]}</changefreq>
        <priority>{u["priority"]}</priority>
    </url>\n'''
    sitemap += '</urlset>'
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap)
    print("✅ sitemap.xml сгенерирован")

def build_robots():
    """Генерирует robots.txt."""
    print("🤖 Генерация robots.txt...")
    robots = """User-agent: *
Allow: /
Sitemap: https://hrlubacheva.github.io/sitemap.xml
"""
    with open("robots.txt", "w", encoding="utf-8") as f:
        f.write(robots)
    print("✅ robots.txt сгенерирован")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Сборка сайта")
    parser.add_argument("--minify", action="store_true", help="Минифицировать CSS и JS")
    args = parser.parse_args()

    build_page(minify=args.minify)
    generate_sitemap()
    build_robots()