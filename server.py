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
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            build_index()
        try:
            return super().do_GET()
        except (ConnectionAbortedError, BrokenPipeError):
            # Клиент разорвал соединение – просто игнорируем (не выводим traceback)
            pass

if __name__ == "__main__":
    port = get_free_port(START_PORT)
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