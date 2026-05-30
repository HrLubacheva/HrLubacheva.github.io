#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys
import time

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_free_port(start_port=8080):
    """Возвращает первый свободный порт, начиная с start_port."""
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                port += 1
                if port - start_port > 100:
                    raise RuntimeError("Не найден свободный порт в диапазоне +100")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    if not os.path.exists("build.py") or not os.path.exists("components"):
        print("❌ Запустите из корневой папки проекта")
        sys.exit(1)

    # Находим свободный порт
    port = get_free_port()
    local_ip = get_local_ip()

    # Пытаемся создать сервер на 127.0.0.1 (локальный)
    # Если вдруг порт занят между проверкой и созданием, перебираем дальше
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", port), Handler)
            break
        except OSError as e:
            if "Already in use" in str(e) or "10048" in str(e):
                port += 1
                print(f"⚠️ Порт {port-1} занят, пробуем {port}")
                continue
            else:
                raise
    else:
        print("❌ Не удалось найти свободный порт после нескольких попыток.")
        sys.exit(1)

    print(f"\n🚀 Сервер запущен:")
    print(f"   Локально:  http://127.0.0.1:{port}")
    if local_ip != "127.0.0.1":
        print(f"   По сети:   http://{local_ip}:{port}")
    print("💡 После изменений в компонентах выполните python build.py и обновите страницу")
    webbrowser.open(f"http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен")
        sys.exit(0)

if __name__ == "__main__":
    main()