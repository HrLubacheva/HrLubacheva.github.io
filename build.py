import os
from datetime import datetime
import re

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"


def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def process_includes(content, current_dir):
    """Рекурсивно заменяет @@include('file.html') на содержимое файла"""
    pattern = r"@@include\('([^']+)'\)"

    def replace_include(match):
        filename = match.group(1)
        filepath = os.path.join(current_dir, filename)
        if os.path.exists(filepath):
            return read_file(filepath)
        return match.group(0)

    while re.search(pattern, content):
        content = re.sub(pattern, replace_include, content)
    return content


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


def build_page():
    common_css = read_css_files(os.path.join(COMMON_DIR, "css"))
    full_css = common_css

    full_js = read_js_files(os.path.join(COMMON_DIR, "js"))

    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    sections_html = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)

    # Читаем все компоненты common
    head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
    metatags_raw = read_file(os.path.join(COMMON_DIR, "00_metatags.html"))

    # Обрабатываем @@include в метатегах
    metatags = process_includes(metatags_raw, COMMON_DIR)

    navbar = read_file(os.path.join(COMMON_DIR, "01_navbar.html"))
    footer = read_file(os.path.join(COMMON_DIR, "02_footer.html"))
    cookie = read_file(os.path.join(COMMON_DIR, "03_cookie-banner.html"))
    privacy = read_file(os.path.join(COMMON_DIR, "04_privacy-modal.html"))
    share = read_file(os.path.join(COMMON_DIR, "00_share.html"))
    materials_modal = read_file(os.path.join(COMMON_DIR, "06_materials-modal.html"))

    # Заменяем плейсхолдер версии в футере
    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    # Вставляем метатеги в head (после закрывающего </title>)
    title_close_pos = head.find('</title>')
    if title_close_pos != -1:
        head = head[:title_close_pos + 8] + '\n    ' + metatags + head[title_close_pos + 8:]
    else:
        head_close_pos = head.find('</head>')
        if head_close_pos != -1:
            head = head[:head_close_pos] + metatags + '\n' + head[head_close_pos:]

    # Вставляем стили в head перед </head>
    head_close_pos = head.find('</head>')
    if head_close_pos != -1:
        head = head[:head_close_pos] + f'<style>\n{full_css}\n</style>\n' + head[head_close_pos:]

    # Собираем body
    body_content = navbar + sections_html + footer + cookie + privacy + share + materials_modal
    body_with_script = body_content + f'<script defer>\n{full_js}\n</script>'

    full_html = head + body_with_script

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✅ index.html собран")


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
    <url>
        <loc>https://hrlubacheva.github.io/privacy.html</loc>
        <lastmod>{today}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
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