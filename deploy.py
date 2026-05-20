#!/usr/bin/env python3
import subprocess
import sys
import os
from datetime import datetime
from build import build_index


def run_cmd(cmd, check=True):
    """Выполняет команду, возвращает результат."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Ошибка при выполнении: {cmd}\n{result.stderr}")
        sys.exit(result.returncode)
    return result


def main():
    print("=" * 60)
    print("🚀 Деплой на GitHub")
    print("=" * 60)

    print("\n1. Сборка index.html из компонентов...")
    build_index()

    print("\n2. Добавляем все изменения в Git...")
    run_cmd("git add .")

    # Проверяем, есть ли изменения
    status = run_cmd("git status --porcelain", check=False)
    if not status.stdout.strip():
        print("   Нет изменений для коммита.")
        # Создаём пустой коммит, чтобы триггерить деплой при необходимости
        run_cmd('git commit --allow-empty -m "Триггер деплоя"', check=False)
    else:
        commit_msg = f"Автообновление сайта {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        print(f"\n3. Создаём коммит: {commit_msg}")
        run_cmd(f'git commit -m "{commit_msg}"')

    print("\n4. Скачиваем свежие изменения из main...")
    pull_result = run_cmd("git pull origin main --no-rebase --no-edit", check=False)
    if pull_result.returncode != 0:
        print("   ⚠️ Не удалось выполнить git pull, продолжаем...")

    print("\n5. Отправляем изменения на GitHub в ветку main...")
    push_result = run_cmd("git push origin main", check=False)

    if push_result.returncode != 0:
        print("   ⚠️ Пробуем push с force...")
        run_cmd("git push --force-with-lease origin main", check=False)

    print("\n" + "=" * 60)
    print("✅ ГОТОВО! Сайт обновлён.")
    print("🌐 Через 1-2 минуты: https://hrlubacheva.github.io/")
    print("=" * 60)


if __name__ == "__main__":
    main()