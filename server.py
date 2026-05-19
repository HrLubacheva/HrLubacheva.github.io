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
    """Находит первый свободный порт, начиная с указанного."""
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))   # пытаемся занять порт
                return port
            except OSError:          # порт занят — проверяем следующий
                port += 1
                if port - start_port > 100:
                    raise RuntimeError("Не удалось найти свободный порт")

def get_local_ip():
    """Определяет локальный IP-адрес компьютера в сети."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"   # если не удалось — возвращаем localhost

class Handler(http.server.SimpleHTTPRequestHandler):
    """Обработчик HTTP-запросов: при запросе главной страницы пересобирает index.html."""
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            build_index()   # обновляем index.html из компонентов
        return super().do_GET()

if __name__ == "__main__":
    port = get_free_port(START_PORT)
    local_ip = get_local_ip()
    print(f"\n🚀 Сервер запущен с поддержкой компонентов (сборка при каждом запросе)")
    print(f"🔗 Доступ по локальной сети: http://{local_ip}:{port}")
    print(f"🖥️  http://localhost:{port}")
    print("\n⏎ Ctrl+C для остановки.\n")
    webbrowser.open(f"http://localhost:{port}")   # автоматически открыть браузер
    with socketserver.TCPServer(("", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен.")
            sys.exit(0)