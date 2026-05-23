import os
import sys
from datetime import datetime

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"

def read_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"⚠️ Файл не найден: {path}")
        return ""

def read_css_files(dir_path):
    if not os.path.exists(dir_path):
        print(f"⚠️ Папка CSS не найдена: {dir_path}")
        return ""
    files = sorted([f for f in os.listdir(dir_path) if f.endswith('.css')])
    return "\n".join(read_file(os.path.join(dir_path, f)) for f in files)

def read_js_files(dir_path):
    if not os.path.exists(dir_path):
        print(f"⚠️ Папка JS не найдена: {dir_path}")
        return ""
    files = sorted([f for f in os.listdir(dir_path) if f.endswith('.js')])
    return "\n".join(read_file(os.path.join(dir_path, f)) for f in files)

def build_page():
    # Проверка наличия основных папок
    if not os.path.exists(COMMON_DIR):
        print(f"❌ Ошибка: папка {COMMON_DIR} не найдена")
        sys.exit(1)
    if not os.path.exists(SECTIONS_DIR):
        print(f"❌ Ошибка: папка {SECTIONS_DIR} не найдена")
        sys.exit(1)

    common_css = read_css_files(os.path.join(COMMON_DIR, "css"))
    full_css = common_css

    full_js = read_js_files(os.path.join(COMMON_DIR, "js"))

    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    if not section_files:
        print("❌ Ошибка: нет HTML-секций в папке components/sections/")
        sys.exit(1)
    sections_html = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)

    head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
    navbar = read_file(os.path.join(COMMON_DIR, "01_navbar.html"))
    footer = read_file(os.path.join(COMMON_DIR, "02_footer.html"))
    cookie = read_file(os.path.join(COMMON_DIR, "03_cookie-banner.html"))
    privacy = read_file(os.path.join(COMMON_DIR, "04_privacy-modal.html"))
    checklist = read_file(os.path.join(COMMON_DIR, "05_checklist-modal.html"))

    # Если какой-то из обязательных файлов пуст, предупредим, но продолжим
    if not head or not navbar or not footer:
        print("⚠️ Предупреждение: некоторые общие файлы (head/navbar/footer) пусты или отсутствуют")

    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    head = head.replace('<link rel="stylesheet" href="styles.css">', '')

    head_close_pos = head.find('</head>')
    if head_close_pos != -1:
        head = head[:head_close_pos] + f'<style>\n{full_css}\n</style>\n' + head[head_close_pos:]

    body_content = navbar + sections_html + footer + cookie + privacy + checklist
    body_with_script = body_content + f'<script defer>\n{full_js}\n</script>'

    full_html = head + body_with_script

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✅ index.html (все стили и скрипты встроены, скрипт с defer)")

def generate_sitemap():
    today = datetime.now().strftime("%Y-%m-%d")
    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://hrlubacheva.github.io/</loc>
        <lastmod>{today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>'''
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap)
    print("✅ sitemap.xml")

def build_robots():
    robots = """User-agent: *
Allow: /
Sitemap: https://hrlubacheva.github.io/sitemap.xml
"""
    with open("robots.txt", "w", encoding="utf-8") as f:
        f.write(robots)
    print("✅ robots.txt")

if __name__ == "__main__":
    build_page()
    generate_sitemap()
    build_robots()