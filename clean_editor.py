#!/usr/bin/env python3
"""
Скрипт для полного удаления встроенного редактора из проекта
Перед запуском рекомендуется сделать бэкап!
"""

import os
import re
import shutil
from pathlib import Path

# ==================== НАСТРОЙКИ ====================
PROJECT_ROOT = Path(__file__).parent

# Файлы для удаления целиком
FILES_TO_DELETE = [
    "components/common/scripts/editor.js",
    "components/common/scripts/quiz-editor.js",
]

# Файлы, в которых нужно удалить строки
FILES_TO_CLEAN = {
    "components/scripts.html": [
        r'<script\s+src="components/common/scripts/editor\.js">\s*</script>',
        r'<script\s+src="components/common/scripts/quiz-editor\.js">\s*</script>',
    ],
    "components/common/scripts/main.js": [
        r'^\s*initEditor\(\s*\);\s*$',
    ],
    "styles.css": [
        # Блок .edit-mode-active (весь блок до следующего селектора)
        r'/\* Пунктирная граница[^*]*?\*/\s*\.edit-mode-active[^@]*?(?=\n/\*|\n@|\Z)',
        r'/\* Пунктирные рамки[^*]*?\*/\s*\.edit-mode-active[^@]*?(?=\n/\*|\n@|\Z)',
        r'/\* Редактор квиза[^*]*?\*/\s*\.quiz-edit-panel[^{]*?\{[^}]*\}[^@]*?(?=\n/\*|\n@|\Z)',
        # Очистка всех селекторов с .edit-mode-active (построчно, на всякий случай)
        r'^\s*\.edit-mode-active\s+[^{]*?\{[^}]*\}\s*\n?',
    ],
}

# Папки для бэкапа
BACKUP_DIR = PROJECT_ROOT / "_backup_before_clean"


# ==================== ФУНКЦИИ ====================
def backup_file(filepath):
    """Создаёт бэкап файла"""
    if not filepath.exists():
        return
    backup_path = BACKUP_DIR / filepath.relative_to(PROJECT_ROOT)
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(filepath, backup_path)
    print(f"   📦 Бэкап: {backup_path}")


def delete_file(filepath):
    """Удаляет файл"""
    full_path = PROJECT_ROOT / filepath
    if full_path.exists():
        backup_file(full_path)
        full_path.unlink()
        print(f"   ✅ Удалён: {filepath}")
        return True
    else:
        print(f"   ⚠️ Не найден: {filepath}")
        return False


def clean_file(filepath, patterns):
    """Удаляет строки по регулярным выражениям из файла"""
    full_path = PROJECT_ROOT / filepath
    if not full_path.exists():
        print(f"   ⚠️ Файл не найден: {filepath}")
        return False

    backup_file(full_path)

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for pattern in patterns:
        content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)
        # Дополнительная очистка от пустых строк
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Очищен: {filepath}")
        return True
    else:
        print(f"   ℹ️ Ничего не изменено: {filepath}")
        return False


def clean_main_js_alternative(full_path):
    """Специальная очистка main.js — удаляет строку с initEditor()"""
    if not full_path.exists():
        return False

    with open(full_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    removed = False
    for line in lines:
        if 'initEditor()' in line and '(' in line and ')' in line:
            if line.strip().startswith('//'):
                new_lines.append(line)
            else:
                # Закомментируем вместо удаления (безопаснее)
                new_lines.append(f'    // {line.strip()} // удалено редактором\n')
                removed = True
        else:
            new_lines.append(line)

    if removed:
        backup_file(full_path)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"   ✅ Очищен main.js (удалён вызов initEditor)")
        return True
    return False


def rebuild_site():
    """Пересобирает сайт через build.py"""
    build_script = PROJECT_ROOT / "build.py"
    if build_script.exists():
        print("\n🔨 Пересборка сайта...")
        import subprocess
        result = subprocess.run(
            [sys.executable, str(build_script)],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("   ✅ Сайт пересобран (index.html обновлён)")
            return True
        else:
            print(f"   ❌ Ошибка сборки: {result.stderr}")
            return False
    else:
        print("   ⚠️ build.py не найден, пересборка пропущена")
        return False


def create_backup_readme():
    """Создаёт README в папке бэкапа"""
    readme = BACKUP_DIR / "README.txt"
    readme.parent.mkdir(parents=True, exist_ok=True)
    readme.write_text(
        "Папка с бэкапами файлов до удаления редактора\n"
        "Создано: clean_editor.py\n"
        "Дата: " + __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n"
        "При восстановлении скопируйте файлы обратно в проект.\n"
    )


# ==================== ГЛАВНАЯ ФУНКЦИЯ ====================
def main():
    print("=" * 60)
    print("🧹 ОЧИСТКА ПРОЕКТА ОТ ВСТРОЕННОГО РЕДАКТОРА")
    print("=" * 60)
    print(f"📁 Проект: {PROJECT_ROOT}")
    print()

    # Создаём бэкап-папку
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    create_backup_readme()
    print(f"📦 Бэкапы будут сохранены в: {BACKUP_DIR}")
    print()

    # 1. Удаляем файлы редактора
    print("🗑️ Удаление файлов редактора:")
    for filepath in FILES_TO_DELETE:
        delete_file(filepath)

    # 2. Очищаем файлы от строк редактора
    print("\n🧹 Очистка файлов от строк редактора:")
    for filepath, patterns in FILES_TO_CLEAN.items():
        clean_file(filepath, patterns)

    # 3. Специальная очистка main.js (на всякий случай)
    print("\n🔧 Дополнительная очистка main.js:")
    main_js = PROJECT_ROOT / "components/common/scripts/main.js"
    clean_main_js_alternative(main_js)

    # 4. Пересобираем сайт
    print()
    rebuild_site()

    # 5. Итог
    print("\n" + "=" * 60)
    print("🎉 ГОТОВО!")
    print("=" * 60)
    print("\n✅ Что сделано:")
    print("   • Удалены editor.js и quiz-editor.js")
    print("   • Очищены scripts.html, main.js, styles.css")
    print("   • Пересобран index.html")
    print()
    print("⚠️ ВАЖНО:")
    print("   • Бэкап сохранён в папке _backup_before_clean")
    print("   • Запустите 'python server.py' для проверки")
    print("   • Убедитесь, что кнопки редактора исчезли")
    print("   • Ссылки должны работать нормально")
    print()
    print("📌 После проверки можно удалить папку _backup_before_clean")
    print("   или оставить на всякий случай.")


if __name__ == "__main__":
    import sys
    main()