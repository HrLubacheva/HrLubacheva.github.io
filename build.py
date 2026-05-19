import os

# Папки с компонентами
COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"

def read_component(dir_path, name):
    """Читает содержимое файла компонента из указанной папки."""
    path = os.path.join(dir_path, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def build_index():
    """Собирает главную страницу из секций."""
    sections_order = [
        "hero.html", "roles.html", "services.html", "stats.html",
        "benefits.html", "process.html", "calculator.html", "quiz.html",
        "freebies.html", "calendar.html", "contacts.html"
    ]
    sections_content = []
    for section in sections_order:
        sections_content.append(read_component(SECTIONS_DIR, section))

    full_content = "\n".join(sections_content)

    parts = [
        read_component(COMMON_DIR, "_head.html"),
        read_component(COMMON_DIR, "navbar.html"),
        full_content,
        read_component(COMMON_DIR, "footer.html"),
        read_component("components", "scripts.html")   # ← исправлено: ищем в components/
    ]
    with open("index.html", "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print("✅ Собрано index.html")

if __name__ == "__main__":
    build_index()