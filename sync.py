#!/usr/bin/env python3
import subprocess
import sys
import re
import os
from build import build_index

def run_cmd(cmd, check=True):
    """Выполняет команду, возвращает результат."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Ошибка: {cmd}\n{result.stderr}")
        sys.exit(result.returncode)
    return result

def extract_section(html, section_name):
    """Извлекает содержимое секции из index.html."""
    patterns = {
        'hero': r'(<section>\s*<div class="container hero">.*?</div>\s*</section>)',
        'roles': r'(<section id="roles">.*?</section>)',
        'services': r'(<section class="section-light" id="services">.*?</section>)',
        'stats': r'(<section>\s*<div class="container">\s*<h2 class="section-title">Цифры, подтверждающие экспертизу</h2>.*?</div>\s*</section>)',
        'benefits': r'(<section class="section-dark" id="about">.*?</section>)',
        'process': r'(<section id="process">.*?</section>)',
        'calculator': r'(<section id="calculator">.*?</section>)',
        'quiz': r'(<section id="quiz">.*?</section>)',
        'freebies': r'(<section>\s*<div class="container">\s*<div class="checklist-card">.*?</div>\s*</div>\s*</section>)',
        'calendar': r'(<section id="calendar">.*?</section>)',
        'contacts': r'(<section class="section-dark" id="contacts">.*?</section>)'
    }
    pattern = patterns.get(section_name)
    if pattern:
        match = re.search(pattern, html, re.DOTALL)
        if match:
            return match.group(1).strip()
    return None

def ensure_dir(filepath):
    """Создаёт папку для файла, если её нет."""
    directory = os.path.dirname(filepath)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)
        print(f"📁 Создана папка: {directory}")

def sync_components():
    """Извлекает секции из index.html и сохраняет их в components/sections/"""
    index_path = "index.html"
    if not os.path.exists(index_path):
        print(f"❌ Файл {index_path} не найден. Сначала соберите сайт: python build.py")
        return False

    try:
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
    except Exception as e:
        print(f"❌ Ошибка чтения index.html: {e}")
        return False

    sections_dir = "components/sections"
    sections_map = {
        'hero': f'{sections_dir}/hero.html',
        'roles': f'{sections_dir}/roles.html',
        'services': f'{sections_dir}/services.html',
        'stats': f'{sections_dir}/stats.html',
        'benefits': f'{sections_dir}/benefits.html',
        'process': f'{sections_dir}/process.html',
        'calculator': f'{sections_dir}/calculator.html',
        'quiz': f'{sections_dir}/quiz.html',
        'freebies': f'{sections_dir}/freebies.html',
        'calendar': f'{sections_dir}/calendar.html',
        'contacts': f'{sections_dir}/contacts.html'
    }

    success_count = 0
    for name, filepath in sections_map.items():
        content = extract_section(html, name)
        if content:
            ensure_dir(filepath)
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"✅ Обновлён: {filepath}")
                success_count += 1
            except Exception as e:
                print(f"❌ Ошибка записи {filepath}: {e}")
        else:
            print(f"⚠️ Не найден в index.html: {name}")

    print(f"📊 Итог: обновлено {success_count} из {len(sections_map)} секций")
    return success_count > 0

def main():
    print("=" * 50)
    print("🔄 СИНХРОНИЗАЦИЯ С GITHUB")
    print("=" * 50)

    # 1. git pull
    print("\n1. Скачиваем изменения из удалённого репозитория...")
    pull_result = run_cmd("git pull --no-edit", check=False)
    if pull_result.returncode != 0:
        print("⚠️ Не удалось выполнить git pull. Проверьте соединение с интернетом.")
        # Не выходим, пробуем продолжить с локальным файлом
    else:
        print("✅ git pull выполнен успешно.")

    # 2. Извлечение компонентов из index.html
    print("\n2. Извлекаем компоненты из index.html...")
    if not sync_components():
        print("⚠️ Не удалось синхронизировать компоненты. Возможно, index.html отсутствует.")
        print("   Запустите сначала: python build.py")

    # 3. Пересборка index.html
    print("\n3. Пересобираем index.html из компонентов...")
    try:
        build_index()
        print("✅ Пересборка завершена.")
    except Exception as e:
        print(f"❌ Ошибка при пересборке: {e}")
        sys.exit(1)

    print("\n" + "=" * 50)
    print("🎉 СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА!")
    print("=" * 50)
    print("\nТеперь ваши локальные компоненты синхронизированы с сайтом.")
    print("Можете запустить: python server.py")

if __name__ == "__main__":
    main()