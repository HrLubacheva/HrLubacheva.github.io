#!/usr/bin/env python3
import subprocess
import sys
import os
from datetime import datetime
from build import build_index


def run_cmd(cmd, check=True, env=None):
    """Выполняет команду, возвращает результат."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
    if check and result.returncode != 0:
        print(f"Ошибка при выполнении: {cmd}\n{result.stderr}")
        sys.exit(result.returncode)
    return result


def setup_git_credentials():
    """Настройка GitHub токена для аутентификации."""
    print("\n🔐 Настройка аутентификации GitHub...")

    # Проверяем, есть ли уже сохранённые credentials
    check_cmd = "git config --global credential.helper"
    result = run_cmd(check_cmd, check=False)

    if "wincred" not in result.stdout and "manager" not in result.stdout:
        print("   Настраиваем credential helper для Windows...")
        run_cmd("git config --global credential.helper wincred", check=False)

    # Проверяем remote URL
    remote_url = run_cmd("git config --get remote.origin.url", check=False).stdout.strip()

    if remote_url.startswith("https://"):
        print(f"   📡 Используется HTTPS: {remote_url}")
        print("   💡 GitHub больше не принимает пароли. Нужен Personal Access Token!")

        # Проверяем, есть ли уже токен в URL
        if "@" in remote_url and "github.com" in remote_url:
            print("   ✅ Токен уже встроен в URL")
            return True

        # Предлагаем ввести токен
        print("\n   ⚠️  ВАЖНО: Введите ваш GitHub Personal Access Token")
        print("   Как получить токен: https://github.com/settings/tokens")
        print("   Нужные права: repo (полный доступ)\n")

        token = input("   👉 Введите токен: ").strip()

        if token:
            # Обновляем remote URL с токеном
            username = "hrlubacheva"
            new_url = f"https://{username}:{token}@github.com/{username}/{username}.github.io.git"
            run_cmd(f"git remote set-url origin {new_url}")
            print("   ✅ Токен добавлен в remote URL")
            return True
        else:
            print("   ⚠️ Токен не введён, попробуем без него...")
            return False

    elif remote_url.startswith("git@"):
        print(f"   🔑 Используется SSH: {remote_url}")
        print("   Проверяем SSH ключи...")

        # Проверяем SSH подключение
        ssh_test = run_cmd("ssh -T git@github.com", check=False)
        if ssh_test.returncode == 0:
            print("   ✅ SSH подключение работает")
        else:
            print("   ⚠️ Проблема с SSH. Возможно, ключи не настроены")
            print("   Решение: переключитесь на HTTPS или настройте SSH ключи")

        return True

    return False


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

    # Настройка аутентификации
    setup_git_credentials()

    print("\n4. Скачиваем свежие изменения из main...")
    pull_result = run_cmd("git pull origin main --no-rebase --no-edit", check=False)
    if pull_result.returncode != 0:
        print("   ⚠️ Не удалось выполнить git pull, продолжаем...")
        if "Authentication failed" in pull_result.stderr:
            print("   ❌ Ошибка аутентификации! Проверьте токен или SSH ключи")

    print("\n5. Отправляем изменения на GitHub в ветку main...")
    push_result = run_cmd("git push origin main", check=False)

    if push_result.returncode != 0:
        print("   ⚠️ Обычный push не сработал, пробуем force push...")
        print("   Если запросит пароль - введите ТОКЕН, не пароль от GitHub!")
        push_result = run_cmd("git push --force-with-lease origin main", check=False)

        if push_result.returncode != 0:
            print("\n   ❌ PUSH НЕ УДАЛСЯ!")
            print("   Возможные причины:")
            print("   1. Неправильный токен (нужен Personal Access Token)")
            print("   2. Нет прав на запись в репозиторий")
            print("   3. Проблемы с сетью")
            print("\n   🔧 Решение:")
            print("   - Получите токен: https://github.com/settings/tokens")
            print("   - Права токена: repo, workflow")
            print("   - Затем запустите заново: python deploy.py")
            sys.exit(1)

    print("\n" + "=" * 60)
    print("✅ ГОТОВО! Сайт обновлён.")
    print("🌐 Через 1-2 минуты: https://hrlubacheva.github.io/")
    print("=" * 60)


if __name__ == "__main__":
    main()