#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import sys
import os

print("=" * 40)
print("  Сборка index.html С МИНИФИКАЦИЕЙ")
print("=" * 40)
print()

# Запускаем build.py с аргументами --minify --no-postcss
result = subprocess.run(
    [sys.executable, "build.py", "--minify", "--no-postcss"],
    capture_output=False
)

print()
print("=" * 40)
print("  Готово!")
print("=" * 40)

# Пауза, чтобы окно не закрылось сразу
input("\nНажмите Enter для выхода...")