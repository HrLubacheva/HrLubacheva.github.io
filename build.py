import os

# Папки с компонентами
COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"
PAGES_DIR = "components/pages"
OUTPUT_FILE = "index.html"


def read_component(dir_path, name):
    path = os.path.join(dir_path, name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def build_page(output_filename, content_component_dir, content_component_name):
    """Собирает страницу из общих компонентов и уникального контента"""
    parts = [
        read_component(COMMON_DIR, "_head.html"),
        read_component(COMMON_DIR, "navbar.html"),
        read_component(content_component_dir, content_component_name),
        read_component(COMMON_DIR, "footer.html"),
        read_component(COMMON_DIR, "scripts.html")
    ]
    with open(output_filename, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"✅ Собрано {output_filename}")


def build_index():
    """Собирает главную страницу из секций"""
    sections_order = [
        "hero.html", "roles.html", "services.html", "stats.html",
        "cases.html", "benefits.html", "process.html", "calculator.html",
        "quiz.html", "freebies.html", "calendar.html", "faq.html",
        "certificates.html", "contacts.html"
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
        read_component(COMMON_DIR, "scripts.html")
    ]
    with open("index.html", "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print("✅ Собрано index.html")


def main():
    build_index()  # главная страница
    build_page("blog.html", PAGES_DIR, "blog-content.html")
    build_page("about.html", PAGES_DIR, "about-content.html")
    build_page("clients.html", PAGES_DIR, "clients-content.html")


if __name__ == "__main__":
    main()