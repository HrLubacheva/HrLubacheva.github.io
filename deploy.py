#!/usr/bin/env python3
import subprocess
import sys
import os
from datetime import datetime

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"⚠️ Ошибка: {result.stderr}")
    return result

def main():
    print("=" * 60)
    print("🚀 Деплой на GitHub")
    print("=" * 60)
    print("\n1. Сборка index.html...")
    from build import build_page
    build_page(editor_mode=False)
    print("\n2. Сборка editor.html...")
    build_page(editor_mode=True)
    print("\n3. Добавление в Git...")
    run_cmd("git add .")
    commit_msg = f"Обновление {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    print(f"\n4. Коммит: {commit_msg}")
    run_cmd(f'git commit -m "{commit_msg}"')
    print("\n5. Отправка на GitHub...")
    push_result = run_cmd("git push origin main")
    if push_result.returncode == 0:
        print("\n✅ Деплой завершён! Через 1-2 минуты сайт обновится.")
    else:
        print("\n❌ Ошибка пуша. Попробуйте вручную: git push origin main")
    print("=" * 60)

if __name__ == "__main__":
    main()