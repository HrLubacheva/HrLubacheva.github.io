Отлично, создаём **документацию для себя** — чтобы вы всегда помнили, как устроен проект и как с ним работать.

Создайте файл `DOCUMENTATION.md` в корне проекта со следующим содержимым:

```markdown
# Документация сайта hrlubacheva.github.io

## Общая структура

```
├── components/               # Исходные компоненты сайта
│   ├── common/               # Общие части
│   │   ├── _head.html        # Заголовок, мета-теги, стили, скрипты
│   │   ├── navbar.html       # Навигационная панель
│   │   ├── footer.html       # Футер + баннер cookies + модалка политики
│   │   └── scripts/          # Все JavaScript файлы
│   ├── sections/             # Секции страницы (каждая в отдельном файле)
│   │   ├── hero.html
│   │   ├── roles.html
│   │   ├── services.html
│   │   ├── stats.html
│   │   ├── benefits.html
│   │   ├── process.html
│   │   ├── calculator.html
│   │   ├── quiz.html
│   │   ├── freebies.html
│   │   ├── calendar.html
│   │   └── contacts.html
│   ├── scripts-editor.html   # Подключаемые скрипты для editor.html
│   └── scripts-public.html   # Подключаемые скрипты для index.html
├── assets/                   # Статические файлы
│   ├── docs/                 # PDF-файлы (чек-лист, программа тренинга)
│   └── images/               # Изображения
├── styles-public.css         # Основные стили сайта
├── styles-editor.css         # Стили для редактора (панели инструментов)
├── critical.css              # Критический CSS (встраивается в head)
├── build.py                  # Скрипт сборки (генерирует index.html и editor.html)
├── deploy.py                 # Скрипт деплоя (git add, commit, push)
├── sync_from_index.py        # Синхронизация index.html → components/sections/
├── sw.js                     # Service Worker (генерируется build.py)
├── .gitignore                # Исключаемые из Git файлы
└── DOCUMENTATION.md          # Этот файл
```

## Режимы работы

### Режим 1: Редактирование через визуальный редактор (editor.html)

1. Откройте `editor.html` (локально через `python server.py` или на GitHub Pages).
2. Внесите изменения:
   - Кликните на блок → появятся маркеры изменения размера.
   - Двойной клик по тексту → редактирование.
   - Панель свойств → изменение ширины/высоты, цветов и т.д.
   - Панель слайдов → перемещение секций.
3. Нажмите **«Сохранить на GitHub»** → введите токен (если не сохранён).
4. Сайт обновится через 1–2 минуты.
5. **Важно:** после сохранения через редактор запустите синхронизацию, чтобы обновить компоненты:
   ```bash
   python sync_from_index.py
   ```

### Режим 2: Ручное редактирование компонентов (рекомендуется для крупных изменений)

1. Отредактируйте нужный файл в `components/sections/` или `components/common/`.
2. Запустите сборку:
   ```bash
   python build.py
   ```
3. Задеплойте:
   ```bash
   python deploy.py
   ```
   Или вручную:
   ```bash
   git add .
   git commit -m "Описание изменений"
   git push origin main
   ```

## Частые задачи

### Изменить текст в любой секции

- **Через редактор** (быстро, но потом нужно синхронизировать) → см. Режим 1.
- **Вручную** → найти соответствующий файл в `components/sections/`, отредактировать, пересобрать.

### Добавить новую секцию

1. Создать файл `components/sections/новая_секция.html`.
2. Добавить его имя в массив `sections_order` в `build.py`.
3. Запустить `python build.py`.

### Изменить email администратора для уведомлений

- В скрипте Google Apps Script: переменная `ADMIN_EMAIL` вверху файла.
- После изменения передеплойте веб-приложение и обновите `SCRIPT_URL` в `core.js`.

### Обновить PDF-файлы

1. Заменить файлы в `assets/docs/`.
2. Закоммитить и запушить.
3. Ссылки в письмах останутся те же (они ведут на эти файлы).

### Изменить стили

- Глобальные стили → `styles-public.css`.
- Только для редактора → `styles-editor.css`.
- Критический CSS (первый экран) → `critical.css` (после изменений пересобрать `build.py`, чтобы он встроил их в `_head.html`).

### Добавить новый JavaScript

- Для публичного сайта → добавить в `scripts-public.html`.
- Для редактора → добавить в `scripts-editor.html`.
- Файл скрипта положить в `components/common/scripts/`.

## Команды

| Команда | Что делает |
|---------|------------|
| `python build.py` | Пересобирает `index.html` и `editor.html` из компонентов |
| `python deploy.py` | Добавляет все изменения в Git, коммитит, пушит |
| `python sync_from_index.py` | Извлекает секции из `index.html` и сохраняет в `components/sections/` |
| `python server.py` | Запускает локальный сервер для разработки (на http://127.0.0.1:8080) |
| `git push origin main` | Загружает изменения на GitHub (после ручной сборки) |

## Важные замечания

- **Не смешивайте режимы** – если правили через редактор, обязательно запустите `sync_from_index.py`, прежде чем запускать `build.py`, иначе изменения из редактора потеряются.
- **GitHub токен** хранится в `localStorage` браузера. Для безопасности используйте отдельный токен с правами только на этот репозиторий.
- **Cookie consent** – выбор пользователя сохраняется в `localStorage`, повторный баннер не показывается.
- **Формы** отправляются в Google Sheets и дублируются на email администратору (если настроен Apps Script).
- **Service Worker** кеширует основные файлы, сайт доступен офлайн (первый раз нужно зайти в сети).

## Ссылки

- [Репозиторий](https://github.com/hrlubacheva/hrlubacheva.github.io)
- [Сайт](https://hrlubacheva.github.io)
- [Редактор](https://hrlubacheva.github.io/editor.html)
- [Google Sheets (данные)](https://docs.google.com/spreadsheets/d/...)
- [Google Apps Script (веб-приложение)](https://script.google.com/macros/s/.../exec)

## Контакты поддержки

- Telegram: [@HrLubacheva](https://t.me/HrLubacheva)
- Email: `hrlubacheva@mail.ru`

---
*Последнее обновление: март 2026*
```

Теперь у вас есть полная документация. Поместите её в корень проекта, закоммитьте и запушите. Она не влияет на работу сайта, но всегда будет под рукой.