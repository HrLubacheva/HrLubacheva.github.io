import psutil
import time

def print_processes():
    print("\n" + "=" * 80)
    print("СПИСОК АКТИВНЫХ ПРОЦЕССОВ")
    print("=" * 80)
    print(f"{'PID':>8} {'Имя процесса':<40} {'Память (MB)':>12} {'Статус':<10}")
    print("-" * 80)

    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'status']):
        try:
            pid = proc.info['pid']
            name = proc.info['name'][:40] or '?'
            mem_mb = proc.info['memory_info'].rss / (1024 * 1024) if proc.info['memory_info'] else 0
            status = proc.info['status']
            print(f"{pid:>8} {name:<40} {mem_mb:>12.1f} {status:<10}")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    print("=" * 80)
    print(f"Всего процессов: {len(psutil.pids())}")

if __name__ == "__main__":
    print_processes()
    input("\nНажмите Enter для выхода...")