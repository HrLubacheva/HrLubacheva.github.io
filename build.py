#!/usr/bin/env python3
import os
import time

# Папки с компонентами
COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"
EDITOR_DIR = "components/common/scripts/editor"


def read_component(dir_path, name):
    """Читает содержимое файла компонента из указанной папки."""
    path = os.path.join(dir_path, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def ensure_editor_files():
    """Проверяет, что все файлы админ-панели на месте (новая структура)."""
    editor_files = [
        # core
        "core/config.js", "core/state.js", "core/history.js", "core/utils.js",
        # actions
        "actions/save.js", "actions/add.js", "actions/delete.js", "actions/duplicate.js",
        # blocks
        "blocks/base.js", "blocks/text-block.js", "blocks/photo-block.js", "blocks/video-block.js",
        "blocks/card-block.js", "blocks/button-block.js", "blocks/divider-block.js",
        # features
        "features/selection.js", "features/lock.js", "features/resize.js",
        "features/dragndrop.js", "features/text-edit.js",
        # ui
        "ui/toolbar.js", "ui/panels.js", "ui/property-panel.js", "ui/styles.css",
        # main
        "main.js"
    ]

    missing = []
    for f in editor_files:
        path = os.path.join(EDITOR_DIR, f)
        if not os.path.exists(path):
            missing.append(f)

    if missing:
        print(f"⚠️ ВНИМАНИЕ: Отсутствуют файлы админ-панели: {', '.join(missing)}")
        print("   Админ-панель может работать некорректно")
        return False
    print("✅ Все файлы админ-панели на месте")
    return True


def build_index():
    """Собирает главную страницу из компонентов."""
    sections_order = [
        "hero.html", "roles.html", "services.html", "stats.html",
        "benefits.html", "process.html", "calculator.html", "quiz.html",
        "freebies.html", "calendar.html", "contacts.html"
    ]
    sections_content = []

    for section in sections_order:
        section_path = os.path.join(SECTIONS_DIR, section)
        if os.path.exists(section_path):
            sections_content.append(read_component(SECTIONS_DIR, section))
        else:
            print(f"⚠️ Файл не найден: {section_path}")
            sections_content.append(f"<!-- Секция {section} не найдена -->")

    full_content = "\n".join(sections_content)

    # Проверяем наличие файлов компонентов
    head_path = os.path.join(COMMON_DIR, "_head.html")
    navbar_path = os.path.join(COMMON_DIR, "navbar.html")
    footer_path = os.path.join(COMMON_DIR, "footer.html")
    scripts_path = os.path.join("components", "scripts.html")

    parts = []

    if os.path.exists(head_path):
        parts.append(read_component(COMMON_DIR, "_head.html"))
    else:
        parts.append("<!-- _head.html не найден -->")
        print(f"⚠️ Файл не найден: {head_path}")

    if os.path.exists(navbar_path):
        parts.append(read_component(COMMON_DIR, "navbar.html"))
    else:
        parts.append("<!-- navbar.html не найден -->")
        print(f"⚠️ Файл не найден: {navbar_path}")

    parts.append(full_content)

    if os.path.exists(footer_path):
        parts.append(read_component(COMMON_DIR, "footer.html"))
    else:
        parts.append("<!-- footer.html не найден -->")
        print(f"⚠️ Файл не найден: {footer_path}")

    if os.path.exists(scripts_path):
        scripts_content = read_component("components", "scripts.html")
        # Добавляем версию для editor.js
        version = int(time.time())
        scripts_content = scripts_content.replace(
            'src="components/common/scripts/editor/main.js"',
            f'src="components/common/scripts/editor/main.js?v={version}"'
        )
        parts.append(scripts_content)
    else:
        parts.append("<!-- scripts.html не найден -->")
        print(f"⚠️ Файл не найден: {scripts_path}")

    # Создаём index.html
    with open("index.html", "w", encoding="utf-8") as f:
        f.write("\n".join(parts))

    print("✅ Собрано index.html")

    # Проверяем наличие файлов админ-панели
    ensure_editor_files()


if __name__ == "__main__":
    build_index()