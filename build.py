import os
import re
import argparse
from datetime import datetime
from collections import OrderedDict

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"
PROCESSED_INCLUDES = set()  # для обнаружения циклов

def read_file(path):
    """Безопасное чтение файла с обработкой ошибок."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"⚠️ Файл не найден: {path}")
        return ""
    except Exception as e:
        print(f"❌ Ошибка чтения {path}: {e}")
        return ""

def read_files_by_ext(dir_path, ext):
    """Собирает содержимое файлов, отсортированных по числовому префиксу (XX_...)."""
    if not os.path.exists(dir_path):
        print(f"⚠️ Папка не найдена: {dir_path}")
        return ""
    files = [f for f in os.listdir(dir_path) if f.endswith(ext)]
    if not files:
        print(f"⚠️ В {dir_path} нет файлов с расширением {ext}")
        return ""

    # Сортировка по числовому префиксу (до первого подчёркивания)
    def extract_number(filename):
        match = re.match(r'^(\d+)', filename)
        return int(match.group(1)) if match else 9999

    files.sort(key=extract_number)
    content = "\n".join(read_file(os.path.join(dir_path, f)) for f in files)
    print(f"📁 Загружено {len(files)} файлов {ext} из {dir_path}")
    return content

def process_includes_once(content, current_dir, parent_file=None):
    """Однократно заменяет @@include('...') на содержимое файла с проверкой циклов."""
    pattern = r"@@include\('([^']+)'\)"
    def replace_include(match):
        filename = match.group(1)
        # Определяем полный путь к файлу
        filepath = os.path.join(current_dir, filename)
        if not os.path.exists(filepath):
            filepath = os.path.join(COMMON_DIR, filename)
        if not os.path.exists(filepath):
            print(f"⚠️ Include не найден: {filename} (искали в {current_dir} и {COMMON_DIR})")
            return ""

        # Проверка на циклическую зависимость
        if filepath in PROCESSED_INCLUDES:
            print(f"❌ Циклическая зависимость: {filename} уже включён (родитель: {parent_file})")
            return ""
        PROCESSED_INCLUDES.add(filepath)
        result = read_file(filepath)
        PROCESSED_INCLUDES.remove(filepath)
        return result

    return re.sub(pattern, replace_include, content)

def process_includes_recursive(content, current_dir, max_depth=5):
    """Рекурсивно обрабатывает все вложенные include с защитой от циклов."""
    for depth in range(max_depth):
        PROCESSED_INCLUDES.clear()
        new_content = process_includes_once(content, current_dir)
        if new_content == content:
            break
        content = new_content
    else:
        print(f"⚠️ Достигнута максимальная глубина вложенности include ({max_depth})")
    return content

def minify_css(css, keep_comments=False):
    """Безопасная минификация CSS (удаляет пробелы и комментарии, если не keep_comments)."""
    if not keep_comments:
        # Удаляем многострочные комментарии (оставляем те, что с ! или @license)
        def remove_comments(match):
            comment = match.group(0)
            if '@license' in comment or '/*!' in comment:
                return comment
            return ''
        css = re.sub(r'/\*.*?\*/', remove_comments, css, flags=re.DOTALL)
        # Удаляем однострочные комментарии (CSS не поддерживает //, но на всякий случай)
        css = re.sub(r'//.*?$', '', css, flags=re.MULTILINE)
    # Удаляем лишние пробелы и переводы строк
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'}\s+', '}', css)
    css = re.sub(r';\s+', ';', css)
    css = re.sub(r'\s*\{\s*', '{', css)
    css = re.sub(r'\s*\}\s*', '}', css)
    return css.strip()

def minify_js(js, keep_comments=False):
    """Безопасная минификация JS (удаляет комментарии, но не трогает строки)."""
    # Удаляем комментарии, не повреждая строки
    def remove_comments(text):
        in_string = False
        in_line_comment = False
        in_block_comment = False
        result = []
        i = 0
        while i < len(text):
            ch = text[i]
            if in_line_comment:
                if ch == '\n':
                    in_line_comment = False
                    result.append(ch)
                i += 1
                continue
            if in_block_comment:
                if ch == '*' and i+1 < len(text) and text[i+1] == '/':
                    in_block_comment = False
                    i += 2
                else:
                    i += 1
                continue
            if ch == '"' or ch == "'" or ch == '`':
                in_string = not in_string
                result.append(ch)
                i += 1
                continue
            if not in_string:
                if ch == '/' and i+1 < len(text) and text[i+1] == '/':
                    in_line_comment = True
                    i += 2
                    continue
                if ch == '/' and i+1 < len(text) and text[i+1] == '*':
                    in_block_comment = True
                    i += 2
                    continue
            result.append(ch)
            i += 1
        return ''.join(result)

    if not keep_comments:
        js = remove_comments(js)
    # Удаляем лишние пробелы
    js = re.sub(r'\s+', ' ', js)
    js = re.sub(r';\s+', ';', js)
    js = re.sub(r'\{\s+', '{', js)
    js = re.sub(r'\s+\}', '}', js)
    js = re.sub(r'\s+\)', ')', js)
    js = re.sub(r'\(\s+', '(', js)
    return js.strip()

def build_page(minify=False, keep_comments=False):
    start_time = datetime.now()
    print("🔨 Сборка index.html..." + (" (минификация включена)" if minify else ""))

    # Сборка CSS и JS
    full_css = read_files_by_ext(os.path.join(COMMON_DIR, "css"), ".css")
    full_js = read_files_by_ext(os.path.join(COMMON_DIR, "js"), ".js")

    if minify:
        print("🗜️ Минификация CSS...")
        full_css = minify_css(full_css, keep_comments)
        print("🗜️ Минификация JS...")
        full_js = minify_js(full_js, keep_comments)

    # Сборка секций
    if not os.path.exists(SECTIONS_DIR):
        print(f"❌ Папка с секциями не найдена: {SECTIONS_DIR}")
        return
    section_files = sorted([f for f in os.listdir(SECTIONS_DIR) if f.endswith('.html')])
    if not section_files:
        print(f"❌ В {SECTIONS_DIR} нет HTML-файлов")
        return
    sections_html = "\n".join(read_file(os.path.join(SECTIONS_DIR, f)) for f in section_files)
    print(f"📄 Загружено {len(section_files)} секций")

    # Чтение основных компонентов
    try:
        head = read_file(os.path.join(COMMON_DIR, "00_head.html"))
        metatags_raw = read_file(os.path.join(COMMON_DIR, "01_metatags.html"))
        navbar = read_file(os.path.join(COMMON_DIR, "03_navbar.html"))
        footer_raw = read_file(os.path.join(COMMON_DIR, "04_footer.html"))
        cookie = read_file(os.path.join(COMMON_DIR, "06_cookie-banner.html"))
        privacy_modal = read_file(os.path.join(COMMON_DIR, "07_privacy-modal.html"))
        share_btn = read_file(os.path.join(COMMON_DIR, "08_share.html"))
        materials_modal = read_file(os.path.join(COMMON_DIR, "09_materials-modal.html"))
    except Exception as e:
        print(f"❌ Критическая ошибка при чтении компонентов: {e}")
        return

    # Обработка include внутри компонентов
    metatags = process_includes_recursive(metatags_raw, COMMON_DIR)
    footer = process_includes_recursive(footer_raw, COMMON_DIR)

    # Подстановка версии в футер
    footer = footer.replace("{{VERSION}}", datetime.now().strftime("%d.%m.%Y %H:%M:%S"))

    # Вставка метатегов в <head>
    if not head:
        print("❌ Файл 00_head.html пуст или не прочитан")
        return
    if '</title>' in head:
        head = head.replace('</title>', f'</title>\n    {metatags}', 1)
    else:
        head = head.replace('</head>', f'{metatags}\n</head>', 1)
        print("⚠️ Тег </title> не найден, метатеги вставлены перед </head>")

    # Вставка CSS в <head>
    if '</head>' in head:
        head = head.replace('</head>', f'<style>\n{full_css}\n</style>\n</head>', 1)
    else:
        print("❌ Не найден </head>, стили не вставлены")
        return

    # Формирование тела документа
    body_content = navbar + sections_html + footer + cookie + privacy_modal + share_btn + materials_modal
    body_with_script = body_content + f'<script>\n{full_js}\n</script>'

    full_html = head + body_with_script

    # Запись итогового файла с обработкой ошибок
    try:
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(full_html)
        print("✅ index.html собран")
    except IOError as e:
        print(f"❌ Ошибка записи index.html: {e}")
        return

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"⏱️ Время сборки: {elapsed:.2f} сек")

def generate_sitemap():
    """Генерирует sitemap.xml на основе реальных страниц (игнорируя временные файлы)."""
    print("🗺️ Генерация sitemap.xml...")
    base_url = "https://hrlubacheva.github.io"
    today = datetime.now().strftime("%Y-%m-%d")

    # Список страниц, которые должны быть в sitemap
    pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "monthly"},
    ]
    # Добавляем только .html файлы, которые не являются служебными
    exclude = {"index.html", "privacy.html"}  # privacy.html не индексируем? можно добавить
    for file in os.listdir('.'):
        if file.endswith('.html') and file not in exclude and file != 'index.html':
            # Получаем дату последнего изменения файла
            try:
                mtime = os.path.getmtime(file)
                lastmod = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")
            except OSError:
                lastmod = today
            pages.append({
                "loc": f"/{file}",
                "priority": "0.5",
                "changefreq": "yearly",
                "lastmod": lastmod
            })

    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in pages:
        sitemap += f'''    <url>
        <loc>{base_url}{u["loc"]}</loc>
        <lastmod>{u.get("lastmod", today)}</lastmod>
        <changefreq>{u["changefreq"]}</changefreq>
        <priority>{u["priority"]}</priority>
    </url>\n'''
    sitemap += '</urlset>'

    try:
        with open("sitemap.xml", "w", encoding="utf-8") as f:
            f.write(sitemap)
        print("✅ sitemap.xml сгенерирован")
    except IOError as e:
        print(f"❌ Ошибка записи sitemap.xml: {e}")

def build_robots():
    """Генерирует robots.txt."""
    print("🤖 Генерация robots.txt...")
    robots = """User-agent: *
Allow: /
Sitemap: https://hrlubacheva.github.io/sitemap.xml
"""
    try:
        with open("robots.txt", "w", encoding="utf-8") as f:
            f.write(robots)
        print("✅ robots.txt сгенерирован")
    except IOError as e:
        print(f"❌ Ошибка записи robots.txt: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Сборка сайта")
    parser.add_argument("--minify", action="store_true", help="Минифицировать CSS и JS")
    parser.add_argument("--keep-comments", action="store_true", help="Сохранять комментарии (например, /*! или @license) при минификации")
    args = parser.parse_args()

    build_page(minify=args.minify, keep_comments=args.keep_comments)
    generate_sitemap()
    build_robots()