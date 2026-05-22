import os
import hashlib
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

def content_hash(content):
    return hashlib.md5(content.encode()).hexdigest()[:8]

def build_css():
    common_css = read_css_files(os.path.join(COMMON_DIR, "css"))
    sections_css = read_css_files(os.path.join(SECTIONS_DIR, "css"))
    full_css = common_css + "\n" + sections_css
    with open("styles.css", "w", encoding="utf-8") as f:
        f.write(full_css)
    print("✅ styles.css")
    return full_css

def build_js():
    js_dir = os.path.join(COMMON_DIR, "js")
    full_js = read_js_files(js_dir)
    with open("scripts.js", "w", encoding="utf-8") as f:
        f.write(full_js)
    print("✅ scripts.js")
    return full_js

def build_page(css_hash, js_hash):
    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    sections_html = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)

    head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
    navbar = read_file(os.path.join(COMMON_DIR, "01_navbar.html"))
    footer = read_file(os.path.join(COMMON_DIR, "02_footer.html"))
    cookie = read_file(os.path.join(COMMON_DIR, "03_cookie-banner.html"))
    privacy = read_file(os.path.join(COMMON_DIR, "04_privacy-modal.html"))
    checklist = read_file(os.path.join(COMMON_DIR, "05_checklist-modal.html"))

    # Подставляем версию в подвал
    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    # Заменяем ссылки на CSS и JS на версионированные
    head = head.replace('<link rel="stylesheet" href="styles.css">', f'<link rel="stylesheet" href="styles.css?v={css_hash}">')
    # Если в head нет такой строки, просто вставим нужную перед </head>
    if '<link rel="stylesheet" href="styles.css?v=' not in head:
        head = head.replace('</head>', f'<link rel="stylesheet" href="styles.css?v={css_hash}">\n</head>')

    body_content = navbar + sections_html + footer + cookie + privacy + checklist
    script_tag = f'<script src="scripts.js?v={js_hash}" defer></script>'

    full_html = head + body_content + script_tag

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✅ index.html (с версионированием CSS/JS)")

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
    css_content = build_css()
    js_content = build_js()
    css_hash = content_hash(css_content)
    js_hash = content_hash(js_content)
    build_page(css_hash, js_hash)
    generate_sitemap()
    build_robots()