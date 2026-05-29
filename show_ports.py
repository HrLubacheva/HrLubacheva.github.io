import subprocess
import re

try:
    import psutil
except ImportError:
    print("❌ Библиотека psutil не установлена.")
    print("   Установите её командой: pip install psutil")
    print("   Или запустите скрипт с правами администратора и выполните: pip install psutil")
    input("\nНажмите Enter для выхода...")
    exit(1)

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

    result = subprocess.run(['netstat', '-aon'], capture_output=True, text=True)
    lines = result.stdout.splitlines()

    for line in lines:
        if 'LISTENING' in line:
            parts = line.split()
            if len(parts) >= 4:
                protocol = parts[0]
                local_addr = parts[1]
                pid = parts[4]
                if pid.isdigit():
                    pid_int = int(pid)
                    proc_name = get_process_name(pid_int)
                    print(f"{protocol:<8} {local_addr:<25} {pid_int:>8} {proc_name:<30}")

    print("=" * 100)

if __name__ == "__main__":
    main()