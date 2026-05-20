#!/usr/bin/env python3
import subprocess


def clear_token():
    print("🗑️ Очистка GitHub токена...")

    # Получаем текущий remote URL
    result = subprocess.run(
        "git config --get remote.origin.url",
        shell=True, capture_output=True, text=True
    )
    current_url = result.stdout.strip()

    if not current_url:
        print("⚠️ Удалённый репозиторий не настроен")
        return

    print(f"Текущий URL: {current_url}")

    if "https://" in current_url and "@" in current_url:
        # Удаляем токен из URL
        clean_url = "https://" + current_url.split("@")[-1]
        subprocess.run(f"git remote set-url origin {clean_url}", shell=True)
        print(f"✅ Новый URL: {clean_url}")
    else:
        print("✅ Токен не найден в URL")

    # Очищаем сохранённые credentials
    subprocess.run(
        'echo "url=https://github.com" | git credential reject',
        shell=True
    )
    print("✅ Учётные данные очищены")


if __name__ == "__main__":
    clear_token()