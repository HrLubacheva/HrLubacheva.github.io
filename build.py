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


def build_css():
    common_css = read_css_files(os.path.join(COMMON_DIR, "css"))
    sections_css = read_css_files(os.path.join(SECTIONS_DIR, "css"))
    with open("styles.css", "w", encoding="utf-8") as f:
        f.write(common_css + "\n" + sections_css)
    print("✅ styles.css")


def build_js():
    js_dir = os.path.join(COMMON_DIR, "js")
    files = sorted([f for f in os.listdir(js_dir) if f.endswith('.js')])
    js_content = "\n".join(read_file(os.path.join(js_dir, f)) for f in files)
    with open("scripts.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("✅ scripts.js")


def build_page():
    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    content = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)

    head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
    navbar = read_file(os.path.join(COMMON_DIR, "01_navbar.html"))
    footer = read_file(os.path.join(COMMON_DIR, "02_footer.html"))
    cookie = read_file(os.path.join(COMMON_DIR, "03_cookie-banner.html"))
    privacy = read_file(os.path.join(COMMON_DIR, "04_privacy-modal.html"))
    checklist = read_file(os.path.join(COMMON_DIR, "05_checklist-modal.html"))

    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    # Генерируем версию (timestamp) для обхода кэша
    cache_buster = datetime.now().strftime("%Y%m%d%H%M%S")

    # Добавляем версию к CSS и JS ссылкам
    head = head.replace('href="styles.css"', f'href="styles.css?v={cache_buster}"')

    full = "".join([head, navbar, content, footer, cookie, privacy, checklist,
                    f'<script src="scripts.js?v={cache_buster}" defer></script>'])
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full)
    print("✅ index.html")


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
    build_css()
    build_js()
    build_page()
    generate_sitemap()
    build_robots()