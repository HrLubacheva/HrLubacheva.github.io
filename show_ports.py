# show_ports.py
import subprocess
import re
import psutil  # требуется установка: pip install psutil
from collections import defaultdict

def get_process_name(pid):
    try:
        return psutil.Process(pid).name()
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return "N/A"

def main():
    print("\n" + "=" * 100)
    print("СПИСОК ВСЕХ АКТИВНЫХ ПОРТОВ (прослушивание)")
    print("=" * 100)
    print(f"{'Протокол':<8} {'Локальный адрес':<25} {'PID':>8} {'Имя процесса':<30}")
    print("-" * 100)

    # Выполняем netstat -aon
    result = subprocess.run(['netstat', '-aon'], capture_output=True, text=True)
    lines = result.stdout.splitlines()

    for line in lines:
        # Ищем строки с прослушиванием (LISTENING)
        if 'LISTENING' in line:
            parts = line.split()
            if len(parts) >= 4:
                protocol = parts[0]        # TCP или UDP
                local_addr = parts[1]      # адрес:порт
                pid = parts[4]             # PID
                if pid.isdigit():
                    pid_int = int(pid)
                    proc_name = get_process_name(pid_int)
                    print(f"{protocol:<8} {local_addr:<25} {pid_int:>8} {proc_name:<30}")

    print("=" * 100)
    print(f"Всего записей: (подсчитано в выводе)\n")

if __name__ == "__main__":
    main()