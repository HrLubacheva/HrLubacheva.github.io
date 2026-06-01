#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import sys
import os

print("=" * 40)
print("  Сборка index.html (без минификации)")
print("=" * 40)
print()

# Запускаем build.py без аргументов
result = subprocess.run([sys.executable, "build.py"], capture_output=False)

print()
print("=" * 40)
print("  Готово!")
print("=" * 40)

# Пауза, чтобы окно не закрылось сразу
input("\nНажмите Enter для выхода...")