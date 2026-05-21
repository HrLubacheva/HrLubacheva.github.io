#!/usr/bin/env python3
import os
import re

def extract_section(html, section_name):
    patterns = {
        'hero': r'(<section class="section" data-section-type="hero">.*?</section>)',
        'roles': r'(<section class="section" data-section-type="roles" id="roles">.*?</section>)',
        'services': r'(<section class="section section-light" data-section-type="services" id="services">.*?</section>)',
        'stats': r'(<section>\s*<div class="container">\s*<h2 class="section-title">Цифры, подтверждающие экспертизу</h2>.*?</div>\s*</section>)',
        'benefits': r'(<section class="section-dark" id="about">.*?</section>)',
        'process': r'(<section id="process">.*?</section>)',
        'calculator': r'(<section id="calculator">.*?</section>)',
        'quiz': r'(<section id="quiz">.*?</section>)',
        'freebies': r'(<section>\s*<div class="container">\s*<div class="checklist-card">.*?</div>\s*</div>\s*</section>)',
        'calendar': r'(<section id="calendar">.*?</section>)',
        'contacts': r'(<section class="section-dark" id="contacts">.*?</section>)'
    }
    pattern = patterns.get(section_name)
    if pattern:
        match = re.search(pattern, html, re.DOTALL)
        return match.group(1).strip() if match else None
    return None

def sync_components():
    index_path = "index.html"
    if not os.path.exists(index_path):
        print("❌ index.html не найден")
        return False
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
    sections_dir = "components/sections"
    os.makedirs(sections_dir, exist_ok=True)
    sections_map = {
        'hero': f'{sections_dir}/hero.html',
        'roles': f'{sections_dir}/roles.html',
        'services': f'{sections_dir}/services.html',
        'stats': f'{sections_dir}/stats.html',
        'benefits': f'{sections_dir}/benefits.html',
        'process': f'{sections_dir}/process.html',
        'calculator': f'{sections_dir}/calculator.html',
        'quiz': f'{sections_dir}/quiz.html',
        'freebies': f'{sections_dir}/freebies.html',
        'calendar': f'{sections_dir}/calendar.html',
        'contacts': f'{sections_dir}/contacts.html'
    }
    success = 0
    for name, path in sections_map.items():
        content = extract_section(html, name)
        if content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✅ Обновлён: {path}")
            success += 1
        else:
            print(f"⚠️ Секция не найдена: {name}")
    print(f"📊 Синхронизировано {success} из {len(sections_map)} секций")
    return success > 0

if __name__ == "__main__":
    sync_components()