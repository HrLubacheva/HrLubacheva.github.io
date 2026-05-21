#!/usr/bin/env python3
"""
Синхронизация index.html → components/sections/
Извлекает секции из собранного файла и сохраняет их в исходные компоненты.
Запускать после редактирования через editor.html, перед пересборкой build.py.
"""

import os
import re
from bs4 import BeautifulSoup

SECTIONS_DIR = "components/sections"
INDEX_FILE = "index.html"

# Сопоставление ID секции с именем файла компонента
SECTION_MAP = {
    "hero": "hero.html",
    "roles": "roles.html",
    "services": "services.html",
    "stats": "stats.html",
    "about": "benefits.html",
    "process": "process.html",
    "calculator": "calculator.html",
    "quiz": "quiz.html",
    "freebies": "freebies.html",
    "calendar": "calendar.html",
    "contacts": "contacts.html",
}

def extract_sections_from_html(html_path):
    """Извлекает все секции <section id="..."> из HTML-файла и возвращает словарь {id: outer_html}"""
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    soup = BeautifulSoup(content, "html.parser")

    sections = {}
    for section in soup.find_all("section", id=True):
        section_id = section.get("id")
        if section_id in SECTION_MAP:
            sections[section_id] = str(section)
            print(f"  • Найдена секция #{section_id}")
        else:
            print(f"  ⚠️ Секция #{section_id} не входит в SECTION_MAP, пропущена")
    return sections

def save_section_to_file(section_id, html_content):
    """Сохраняет HTML секции в соответствующий файл компонента"""
    filename = SECTION_MAP.get(section_id)
    if not filename:
        print(f"  ❌ Нет файла для секции #{section_id}")
        return False
    filepath = os.path.join(SECTIONS_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"  ✅ Сохранено: {filepath}")
    return True

def main():
    print("=" * 60)
    print("🔄 Синхронизация index.html → components/sections/")
    print("=" * 60)

    if not os.path.exists(INDEX_FILE):
        print(f"❌ Файл {INDEX_FILE} не найден. Запустите build.py сначала.")
        return

    if not os.path.exists(SECTIONS_DIR):
        print(f"❌ Папка {SECTIONS_DIR} не найдена.")
        return

    print(f"\n📖 Читаем {INDEX_FILE}...")
    sections = extract_sections_from_html(INDEX_FILE)

    if not sections:
        print("⚠️ Не найдено ни одной секции из SECTION_MAP.")
        return

    print(f"\n💾 Сохраняем {len(sections)} секций...")
    for section_id, html in sections.items():
        save_section_to_file(section_id, html)

    print("\n✅ Синхронизация завершена. Теперь можно безопасно запускать build.py.")
    print("=" * 60)

if __name__ == "__main__":
    main()