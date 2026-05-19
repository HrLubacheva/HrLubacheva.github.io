#!/usr/bin/env python3
import subprocess
import sys
from datetime import datetime
from build import build_index

def run_cmd(cmd, check=True):
    """Выполняет команду в командной строке.
       Если check=True и команда завершилась с ошибкой, завершает скрипт."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Ошибка при выполнении: {cmd}\n{result.stderr}")
        sys.exit(result.returncode)
    return result

def main():
    print("1. Сборка index.html из компонентов...")
    build_index()

    print("2. Добавляем все изменения в Git...")
    run_cmd("git add .")

    # Проверяем, есть ли изменения для коммита
    status = run_cmd("git status --porcelain", check=False)
    if not status.stdout.strip():
        print("Нет изменений для коммита. Возможно, сайт уже актуален.")
    else:
        commit_msg = f"Автообновление сайта {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        print(f"3. Создаём коммит: {commit_msg}")
        run_cmd(f'git commit -m "{commit_msg}"')

    print("4. Отправляем изменения на GitHub...")
    run_cmd("git push")

    print("✅ Готово! Сайт обновлён. Через 1-2 минуты изменения появятся на https://hrlubacheva.github.io/")

if __name__ == "__main__":
    main()