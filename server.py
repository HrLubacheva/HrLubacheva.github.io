import http.server
import socketserver
import socket
import webbrowser
import os
import sys

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
START_PORT = 8080


def get_free_port(start_port):
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))
                return port
            except OSError:
                port += 1
                if port - start_port > 100:
                    raise RuntimeError("Не удалось найти свободный порт")


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


if __name__ == "__main__":
    port = get_free_port(START_PORT)
    local_ip = get_local_ip()

    print(f"\n🚀 Сервер запущен в папке: {DIRECTORY}")
    print(f"🔗 Доступ по локальной сети: http://{local_ip}:{port}")
    print(f"🖥️  Доступ на этом же компьютере: http://localhost:{port}")
    print("\n⏎ Нажмите Ctrl+C для остановки сервера.\n")

    webbrowser.open(f"http://localhost:{port}")

    with socketserver.TCPServer(("", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен.")
            sys.exit(0)