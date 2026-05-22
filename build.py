#!/usr/bin/env python3
import os
from datetime import datetime

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"

def read_component(dir_path, name):
    path = os.path.join(dir_path, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def build_page(editor_mode=False):   # параметр добавлен для совместимости, но не используется
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
    scripts = read_component("components", "scripts-public.html")

    build_version = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    footer = footer.replace("{{VERSION}}", build_version)

    full_html = "".join([head, navbar, full_content, footer, cookie_banner, privacy_modal, scripts])

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✅ Собрано index.html (редактор выключен)")

if __name__ == "__main__":
    build_page()