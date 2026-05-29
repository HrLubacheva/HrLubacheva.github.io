#!/usr/bin/env python3
import http.server
import socketserver
import socket
import webbrowser
import os
import sys
import subprocess
import re

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def find_pid_by_port(port):
    """Возвращает список PID процессов, слушающих указанный порт (любой интерфейс)."""
    pids = set()
    try:
        # Ищем строки, содержащие ':port' и 'LISTENING'
        result = subprocess.run(
            f'netstat -aon | findstr :{port} | findstr LISTENING',
            shell=True,
            capture_output=True,
            text=True
        )
        if result.returncode != 0 or not result.stdout.strip():
            return pids
        for line in result.stdout.strip().split('\n'):
            parts = line.split()
            if len(parts) >= 5:
                pid = parts[4]
                if pid.isdigit():
                    pids.add(int(pid))
    except Exception as e:
        print(f"⚠️ Ошибка при поиске процесса на порту {port}: {e}")
    return pids

def kill_process(pid):
    """Завершает процесс по PID."""
    try:
        result = subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Процесс PID {pid} успешно завершён.")
            return True
        else:
            print(f"❌ Не удалось завершить процесс PID {pid}. Запустите скрипт от имени администратора.")
            return False
    except Exception as e:
        print(f"❌ Ошибка при завершении процесса {pid}: {e}")
        return False

def ask_kill_all_python():
    """Спрашивает, хочет ли пользователь завершить все процессы python.exe."""
    answer = input("\n⚠️ Порт 8080 не определён как занятый, но возможно сервер висит. Завершить ВСЕ процессы python.exe? (y/N): ").strip().lower()
    if answer == 'y':
        killed = False
        try:
            result = subprocess.run('taskkill /F /IM python.exe', shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Все процессы python.exe завершены.")
                killed = True
            else:
                print("❌ Не удалось завершить процессы python.exe. Возможно, запустите от администратора.")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
        return killed
    return False

def main():
    # Проверка, что мы в корневой папке проекта
    if not os.path.exists("build.py") or not os.path.exists("components"):
        print("❌ Запустите скрипт из корневой папки проекта (где есть build.py и components).")
        sys.exit(1)

    # Сборка сайта
    print("🔨 Сборка сайта...")
    build_result = subprocess.run(["python", "build.py"], capture_output=True, text=True)
    if build_result.returncode != 0:
        print("❌ Ошибка при сборке сайта. Проверьте build.py.")
        print(build_result.stderr)
        sys.exit(1)
    print("✅ Сборка завершена.\n")

    # Освобождаем порт
    pids = find_pid_by_port(PORT)
    if pids:
        print(f"🔍 Найдены процессы, занимающие порт {PORT}: {pids}")
        for pid in pids:
            kill_process(pid)
        # Повторная проверка
        pids_after = find_pid_by_port(PORT)
        if pids_after:
            print(f"⚠️ Не удалось освободить порт. Попробуйте запустить скрипт от имени администратора.")
            sys.exit(1)
        else:
            print(f"✅ Порт {PORT} освобождён.")
    else:
        print(f"ℹ️ Порт {PORT} свободен (согласно netstat).")
        # Спрашиваем, не хочет ли пользователь убить все python.exe (на случай висячего процесса, который не показывает порт)
        answer = input("\n⚠️ Порт не занят, но если предыдущий сервер не закрыт корректно, он может висеть. Завершить все процессы python.exe? (y/N): ").strip().lower()
        if answer == 'y':
            ask_kill_all_python()
        else:
            print("Продолжаем без завершения python.exe.")

    # Запускаем сервер
    print(f"\n🚀 Запуск сервера на порту {PORT}...")
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        local_ip = get_local_ip()
        print(f"\n🚀 Сервер запущен в локальной сети:")
        print(f"   Локально:    http://127.0.0.1:{PORT}")
        print(f"   В сети:      http://{local_ip}:{PORT}")
        print("   Остановить: Ctrl+C\n")
        webbrowser.open(f"http://127.0.0.1:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")
            sys.exit(0)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == "__main__":
    main()