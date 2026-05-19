import http.server
import socketserver
import socket
import webbrowser
import os
import sys
from build import build_index

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
START_PORT = 8080

def get_free_port(start_port):
    """Находит свободный порт на интерфейсе localhost (127.0.0.1)."""
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                # Привязываемся только к localhost
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                port += 1
                if port - start_port > 100:
                    raise RuntimeError("Не удалось найти свободный порт на 127.0.0.1")

def get_local_ip():
    # Эта функция больше не нужна, так как сервер слушает только localhost
    # Можно удалить или оставить для совместимости, но в выводе не использовать.
    return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            build_index()
        return super().do_GET()

if __name__ == "__main__":
    port = get_free_port(START_PORT)
    # Запускаем сервер ТОЛЬКО на 127.0.0.1
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"\n🚀 Сервер запущен на http://127.0.0.1:{port}")
        print("🔒 Доступ только с этого компьютера (недоступен по локальной сети).")
        print("\n⏎ Ctrl+C для остановки.\n")
        webbrowser.open(f"http://127.0.0.1:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен.")
            sys.exit(0)