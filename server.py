#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_free_port(start_port=8080):
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                port += 1
                if port - start_port > 100:
                    raise RuntimeError("Не найден свободный порт")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Отключаем кеширование для разработки
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    if not os.path.exists("build.py") or not os.path.exists("components"):
        print("❌ Запустите из корневой папки проекта")
        sys.exit(1)

    # Сборка страницы один раз
    print("📦 Первичная сборка...")
    try:
        from build import build_page
        build_page()   # только публичный сайт, редактор не собираем
        print("✅ Сборка завершена")
    except Exception as e:
        print(f"❌ Ошибка сборки: {e}")
        sys.exit(1)

    port = get_free_port()
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"\n🚀 Сервер запущен: http://127.0.0.1:{port}")
        print("💡 Файлы собраны один раз. При изменениях запустите сборку вручную: python build.py")
        webbrowser.open(f"http://127.0.0.1:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")
            sys.exit(0)

if __name__ == "__main__":
    main()