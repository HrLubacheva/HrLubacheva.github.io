#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import sys
import os

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def show_menu():
    clear_screen()
    print("=" * 40)
    print("     СБОРКА САЙТА")
    print("=" * 40)
    print()
    print("1. Обычная сборка (без минификации)")
    print("2. Сборка с минификацией")
    print("3. Выход")
    print()
    return input("Выберите вариант (1-3): ").strip()

choice = show_menu()

if choice == "1":
    print("\n🔨 Запуск обычной сборки...\n")
    subprocess.run([sys.executable, "build.py"], capture_output=False)
    input("\nНажмите Enter для выхода...")
elif choice == "2":
    print("\n🔨 Запуск сборки с минификацией...\n")
    subprocess.run([sys.executable, "build.py", "--minify", "--no-postcss"], capture_output=False)
    input("\nНажмите Enter для выхода...")
elif choice == "3":
    print("\nДо свидания!")
else:
    print("\n❌ Неверный выбор. Нажмите Enter...")
    input()