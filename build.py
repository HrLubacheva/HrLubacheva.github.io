import os
from datetime import datetime

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def read_css_files(dir_path):
    if not os.path.exists(dir_path):
        return ""
    files = sorted([f for f in os.listdir(dir_path) if f.endswith('.css')])
    return "\n".join(read_file(os.path.join(dir_path, f)) for f in files)

def read_js_files(dir_path):
    if not os.path.exists(dir_path):
        return ""
    files = sorted([f for f in os.listdir(dir_path) if f.endswith('.js')])
    return "\n".join(read_file(os.path.join(dir_path, f)) for f in files)

def build_inline_page():
    # Сборка CSS
    common_css = read_css_files(os.path.join(COMMON_DIR, "css"))
    sections_css = read_css_files(os.path.join(SECTIONS_DIR, "css"))
    full_css = common_css + "\n" + sections_css

    # Сборка JS
    js_dir = os.path.join(COMMON_DIR, "js")
    full_js = read_js_files(js_dir)

    # Сборка HTML-секций
    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    sections_html = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)

    head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
    navbar = read_file(os.path.join(COMMON_DIR, "01_navbar.html"))
    footer = read_file(os.path.join(COMMON_DIR, "02_footer.html"))
    cookie = read_file(os.path.join(COMMON_DIR, "03_cookie-banner.html"))
    privacy = read_file(os.path.join(COMMON_DIR, "04_privacy-modal.html"))
    checklist = read_file(os.path.join(COMMON_DIR, "05_checklist-modal.html"))

    # Вставляем версию в подвал
    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    # Удаляем ссылки на внешние CSS и JS (если они есть в head)
    head = head.replace('<link rel="stylesheet" href="styles.css">', '')
    # В head добавим встроенный CSS (вставляем после тега <style> или прямо в head)
    # Проще: сразу после открывающего <head> вставим <style>...</style>
    # И в конце body — <script>...</script>

    # Найдём позицию закрывающего </head>
    head_close_pos = head.find('</head>')
    if head_close_pos != -1:
        head = head[:head_close_pos] + f'<style>\n{full_css}\n</style>\n' + head[head_close_pos:]

    # Найдём позицию закрывающего </body>
    # Мы будем добавлять скрипт перед закрывающим </body> в конце сборки
    # Но проще: добавить в конец full_html, перед </body>

    # Собираем основное тело
    body_content = navbar + sections_html + footer + cookie + privacy + checklist

    # Вставляем скрипт перед </body>
    body_with_script = body_content + f'<script>\n{full_js}\n</script>'

    full_html = head + body_with_script

    # Записываем index.html
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✅ index.html (с встроенными CSS и JS)")

def generate_sitemap():
    today = datetime.now().strftime("%Y-%m-%d")
    sitemap_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://hrlubacheva.github.io/</loc>
        <lastmod>{today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>'''
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_content)
    print("✅ sitemap.xml")

def build_robots():
    robots_content = """User-agent: *
Allow: /
Sitemap: https://hrlubacheva.github.io/sitemap.xml
"""
    with open("robots.txt", "w", encoding="utf-8") as f:
        f.write(robots_content)
    print("✅ robots.txt")

if __name__ == "__main__":
    build_inline_page()
    generate_sitemap()
    build_robots()