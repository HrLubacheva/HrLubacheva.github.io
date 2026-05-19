#!/usr/bin/env python3
import subprocess
import sys
from build import build_index

def run_cmd(cmd, check=True):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Ошибка: {cmd}\n{result.stderr}")
        sys.exit(result.returncode)
    return result

def main():
    print("🔄 Синхронизация с GitHub...")
    # 1. Скачиваем изменения из удалённого репозитория (автоматическое слияние)
    pull_result = run_cmd("git pull --no-edit", check=False)
    if pull_result.returncode != 0:
        print("⚠️ Не удалось выполнить git pull. Проверьте соединение или разрешите конфликты вручную.")
        sys.exit(pull_result.returncode)
    else:
        print("✅ git pull выполнен успешно.")

    # 2. Пересобираем index.html из компонентов (на случай, если компоненты обновились)
    print("🛠️ Пересборка index.html из компонентов...")
    build_index()

    print("🎉 Синхронизация завершена. Локальная версия сайта обновлена.")

if __name__ == "__main__":
    main()