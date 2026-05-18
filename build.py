import os

COMPONENTS_DIR = "components"
OUTPUT_FILE = "index.html"

def read_component(name):
    path = os.path.join(COMPONENTS_DIR, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def build_index():
    parts = [
        read_component("_head.html"),
        read_component("navbar.html"),
        read_component("hero.html"),
        read_component("roles.html"),
        read_component("services.html"),
        read_component("stats.html"),
        read_component("benefits.html"),
        read_component("process.html"),
        read_component("calculator.html"),
        read_component("quiz.html"),
        read_component("freebies.html"),
        read_component("calendar.html"),
        read_component("contacts.html"),
        read_component("footer.html"),
        read_component("scripts.html")
    ]
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"✅ Собрано {OUTPUT_FILE}")

if __name__ == "__main__":
    build_index()