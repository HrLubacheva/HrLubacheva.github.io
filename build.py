import os
import re
import subprocess
import argparse
from datetime import datetime
from collections import OrderedDict

COMMON_DIR = "components/common"
SECTIONS_DIR = "components/sections"
PROCESSED_INCLUDES = set()


def read_file(path):
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
    if not os.path.exists(dir_path):
        print(f"⚠️ Папка не найдена: {dir_path}")
        return ""
    files = [f for f in os.listdir(dir_path) if f.endswith(ext)]
    if not files:
        print(f"⚠️ В {dir_path} нет файлов с расширением {ext}")
        return ""

    def extract_number(filename):
        match = re.match(r'^(\d+)', filename)
        return int(match.group(1)) if match else 9999

    files.sort(key=extract_number)
    content = "\n".join(read_file(os.path.join(dir_path, f)) for f in files)
    print(f"📁 Загружено {len(files)} файлов {ext} из {dir_path}")
    return content


def process_includes_once(content, current_dir, parent_file=None):
    pattern = r"@@include\('([^']+)'\)"

    def replace_include(match):
        filename = match.group(1)
        filepath = os.path.join(current_dir, filename)
        if not os.path.exists(filepath):
            filepath = os.path.join(COMMON_DIR, filename)
        if not os.path.exists(filepath):
            print(f"⚠️ Include не найден: {filename}")
            return ""
        if filepath in PROCESSED_INCLUDES:
            print(f"❌ Циклическая зависимость: {filename}")
            return ""
        PROCESSED_INCLUDES.add(filepath)
        result = read_file(filepath)
        PROCESSED_INCLUDES.remove(filepath)
        return result

    return re.sub(pattern, replace_include, content)


def process_includes_recursive(content, current_dir, max_depth=5):
    for depth in range(max_depth):
        PROCESSED_INCLUDES.clear()
        new_content = process_includes_once(content, current_dir)
        if new_content == content:
            break
        content = new_content
    else:
        print(f"⚠️ Достигнута максимальная глубина вложенности include ({max_depth})")
    return content


def process_css_with_postcss(css_content, minify=False):
    """Обрабатывает CSS через PostCSS (Autoprefixer + опционально cssnano)"""
    temp_input = "temp_input.css"
    temp_output = "temp_output.css"

    try:
        # Сохраняем временный файл
        with open(temp_input, "w", encoding="utf-8") as f:
            f.write(css_content)

        # Запускаем PostCSS
        cmd = ["npx", "postcss", temp_input, "--output", temp_output]
        if minify:
            # Передаём переменную окружения для production режима
            env = os.environ.copy()
            env["NODE_ENV"] = "production"
            result = subprocess.run(cmd, capture_output=True, text=True, env=env)
        else:
            result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"⚠️ PostCSS warning: {result.stderr}")
            # Если PostCSS не сработал, возвращаем исходник
            return css_content

        # Читаем результат
        with open(temp_output, "r", encoding="utf-8") as f:
            processed_css = f.read()

        # Удаляем временные файлы
        os.remove(temp_input)
        os.remove(temp_output)

        print("✅ CSS обработан через PostCSS (Autoprefixer)")
        return processed_css

    except Exception as e:
        print(f"⚠️ Ошибка PostCSS: {e}, использую исходный CSS")
        # Чистим временные файлы если они есть
        for f in [temp_input, temp_output]:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except:
                    pass
        return css_content


def build_page(minify=False, keep_comments=False, use_postcss=True):
    start_time = datetime.now()
    print("🔨 Сборка index.html..." + (" (минификация включена)" if minify else ""))
    if use_postcss:
        print("🎨 Используется PostCSS (Autoprefixer)")

    # Сборка CSS и JS
    full_css = read_files_by_ext(os.path.join(COMMON_DIR, "css"), ".css")
    full_js = read_files_by_ext(os.path.join(COMMON_DIR, "js"), ".js")

    # Обработка CSS через PostCSS
    if use_postcss:
        full_css = process_css_with_postcss(full_css, minify)
    elif minify:
        # Fallback на старую минификацию (если не используем PostCSS)
        print("🗜️ Минификация CSS (без PostCSS)...")
        full_css = minify_css(full_css, keep_comments)

    if not use_postcss and minify:
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

    # Запись итогового файла
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
    print("🗺️ Генерация sitemap.xml...")
    base_url = "https://hrlubacheva.github.io"
    today = datetime.now().strftime("%Y-%m-%d")
    pages = [{"loc": "/", "priority": "1.0", "changefreq": "monthly"}]
    exclude = {"index.html", "privacy.html"}
    for file in os.listdir('.'):
        if file.endswith('.html') and file not in exclude and file != 'index.html':
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


# Старые функции минификации (оставляем как fallback)
def minify_css(css, keep_comments=False):
    if not keep_comments:
        def remove_comments(match):
            comment = match.group(0)
            if '@license' in comment or '/*!' in comment:
                return comment
            return ''

        css = re.sub(r'/\*.*?\*/', remove_comments, css, flags=re.DOTALL)
        css = re.sub(r'//.*?$', '', css, flags=re.MULTILINE)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'}\s+', '}', css)
    css = re.sub(r';\s+', ';', css)
    css = re.sub(r'\s*\{\s*', '{', css)
    css = re.sub(r'\s*\}\s*', '}', css)
    return css.strip()


def minify_js(js, keep_comments=False):
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
                if ch == '*' and i + 1 < len(text) and text[i + 1] == '/':
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
                if ch == '/' and i + 1 < len(text) and text[i + 1] == '/':
                    in_line_comment = True
                    i += 2
                    continue
                if ch == '/' and i + 1 < len(text) and text[i + 1] == '*':
                    in_block_comment = True
                    i += 2
                    continue
            result.append(ch)
            i += 1
        return ''.join(result)

    if not keep_comments:
        js = remove_comments(js)
    js = re.sub(r'\s+', ' ', js)
    js = re.sub(r';\s+', ';', js)
    js = re.sub(r'\{\s+', '{', js)
    js = re.sub(r'\s+\}', '}', js)
    js = re.sub(r'\s+\)', ')', js)
    js = re.sub(r'\(\s+', '(', js)
    return js.strip()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Сборка сайта")
    parser.add_argument("--minify", action="store_true", help="Минифицировать CSS и JS")
    parser.add_argument("--keep-comments", action="store_true", help="Сохранять комментарии при минификации")
    parser.add_argument("--no-postcss", action="store_true", help="Отключить PostCSS (использовать старую минификацию)")
    args = parser.parse_args()

    use_postcss = not args.no_postcss
    build_page(minify=args.minify, keep_comments=args.keep_comments, use_postcss=use_postcss)
    generate_sitemap()
    build_robots()