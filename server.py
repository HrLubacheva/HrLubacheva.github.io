#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys
from build import build_index
import time

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
START_PORT = 8080


def get_free_port(start_port):
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                port += 1
                if port - start_port > 100:
                    raise RuntimeError("Не удалось найти свободный порт на 127.0.0.1")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Добавляем заголовки против кэширования
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # При запросе главной страницы пересобираем index.html
        if self.path == "/" or self.path == "/index.html":
            print("🔄 Пересборка index.html...")
            try:
                build_index()
                print("✅ Пересборка завершена")
            except Exception as e:
                print(f"❌ Ошибка сборки: {e}")

        # Для JS файлов добавляем версию для обхода кэша
        if self.path.endswith('.js'):
            # Проверяем, есть ли уже ?v= в пути
            if '?v=' not in self.path:
                # Перенаправляем на версию с временной меткой
                timestamp = int(time.time())
                new_path = f"{self.path}?v={timestamp}"
                self.send_response(301)
                self.send_header('Location', new_path)
                self.end_headers()
                return

        try:
            return super().do_GET()
        except (ConnectionAbortedError, BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format, *args):
        print(f"📡 {args[0] if args else format}")


def main():
    # Проверяем, что мы в правильной директории
    if not os.path.exists("build.py") or not os.path.exists("components"):
        print("\n❌ Ошибка: Запустите скрипт из корневой папки проекта!")
        print("   cd C:\\TEST\\GIT\\hrLubacheva.github.io")
        sys.exit(1)

    # Первичная сборка
    print("🔨 Первичная сборка...")
    try:
        build_index()
    except Exception as e:
        print(f"⚠️ Ошибка при сборке: {e}")
        print("   Продолжаем, возможно файлы уже есть...")

    port = get_free_port(START_PORT)

    # Разрешаем переиспользование порта
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"\n🚀 Сервер запущен на http://127.0.0.1:{port}")
        print("🔒 Доступ только с этого компьютера (недоступен по локальной сети).")
        print("📁 Директория: " + DIRECTORY)
        print("\n💡 Советы:")
        print("   - Нажмите ✏️ Редактировать для включения админ-панели")
        print("   - Двойной клик по тексту для редактирования")
        print("   - ПКМ по фото для изменения формы")
        print("   - При обновлении страницы используйте Ctrl+F5 (полное обновление)")
        print("\n⏎ Ctrl+C для остановки.\n")

        webbrowser.open(f"http://127.0.0.1:{port}")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен.")
            sys.exit(0)


if __name__ == "__main__":
    main()