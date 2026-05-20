// ========== РЕДАКТИРОВАНИЕ ТЕКСТА С СОХРАНЕНИЕМ ФОРМАТИРОВАНИЯ ==========
import { state } from './state.js';
import { showToast } from './utils.js';

let currentEditingElement = null;
let originalContent = '';

// Создаём панель форматирования
let formatToolbar = null;

function createFormatToolbar() {
    if (formatToolbar) return formatToolbar;

    formatToolbar = document.createElement('div');
    formatToolbar.className = 'format-toolbar';
    formatToolbar.innerHTML = `
        <button data-command="bold" title="Жирный"><b>Ж</b></button>
        <button data-command="italic" title="Курсив"><i>К</i></button>
        <button data-command="underline" title="Подчёркнутый"><u>Ч</u></button>
        <div class="separator"></div>
        <button data-command="justifyLeft" title="По левому краю">◀</button>
        <button data-command="justifyCenter" title="По центру">◀▶</button>
        <button data-command="justifyRight" title="По правому краю">▶</button>
        <div class="separator"></div>
        <button data-command="insertUnorderedList" title="Маркированный список">• Список</button>
        <button data-command="insertOrderedList" title="Нумерованный список">1. Список</button>
        <div class="separator"></div>
        <select id="fontSizeSelect" title="Размер шрифта">
            <option value="1">Мелкий</option>
            <option value="3" selected>Средний</option>
            <option value="5">Крупный</option>
            <option value="7">Очень крупный</option>
        </select>
        <input type="color" id="textColorInput" title="Цвет текста" value="#000000">
        <input type="color" id="bgColorInput" title="Цвет фона" value="#ffffff">
        <div class="separator"></div>
        <button data-command="createLink" title="Вставить ссылку">🔗 Ссылка</button>
        <button data-command="unlink" title="Удалить ссылку">🔗❌</button>
        <div class="separator"></div>
        <button id="saveFormatBtn" style="background:#28a745; color:white;">✅ Сохранить</button>
        <button id="cancelFormatBtn" style="background:#dc3545; color:white;">❌ Отмена</button>
    `;
    document.body.appendChild(formatToolbar);

    // Обработчики команд форматирования
    formatToolbar.querySelectorAll('[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            if (command === 'createLink') {
                const url = prompt('Введите URL:', 'https://');
                if (url) document.execCommand(command, false, url);
            } else if (command === 'unlink') {
                document.execCommand(command, false, null);
            } else {
                document.execCommand(command, false, null);
            }
            if (currentEditingElement) currentEditingElement.focus();
            updateToolbarState();
        });
    });

    // Размер шрифта
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', (e) => {
            document.execCommand('fontSize', false, e.target.value);
            if (currentEditingElement) currentEditingElement.focus();
        });
    }

    // Цвет текста
    const textColorInput = document.getElementById('textColorInput');
    if (textColorInput) {
        textColorInput.addEventListener('change', (e) => {
            document.execCommand('foreColor', false, e.target.value);
            if (currentEditingElement) currentEditingElement.focus();
        });
    }

    // Цвет фона
    const bgColorInput = document.getElementById('bgColorInput');
    if (bgColorInput) {
        bgColorInput.addEventListener('change', (e) => {
            document.execCommand('backColor', false, e.target.value);
            if (currentEditingElement) currentEditingElement.focus();
        });
    }

    // Сохранить
    document.getElementById('saveFormatBtn')?.addEventListener('click', () => {
        saveContent();
    });

    // Отмена
    document.getElementById('cancelFormatBtn')?.addEventListener('click', () => {
        cancelEdit();
    });

    return formatToolbar;
}

function updateToolbarState() {
    if (!formatToolbar) return;

    const commands = ['bold', 'italic', 'underline'];
    commands.forEach(cmd => {
        const btn = formatToolbar.querySelector(`[data-command="${cmd}"]`);
        if (btn) {
            if (document.queryCommandState(cmd)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

function showFormatToolbar(element, event) {
    const toolbar = createFormatToolbar();
    const rect = element.getBoundingClientRect();

    let top = rect.top - 50;
    let left = rect.left;

    if (top < 10) top = rect.bottom + 10;
    if (left + toolbar.offsetWidth > window.innerWidth) {
        left = window.innerWidth - toolbar.offsetWidth - 10;
    }
    if (left < 10) left = 10;

    toolbar.style.top = top + 'px';
    toolbar.style.left = left + 'px';
    toolbar.style.display = 'flex';
}

function hideFormatToolbar() {
    if (formatToolbar) {
        formatToolbar.style.display = 'none';
    }
}

function saveContent() {
    if (!currentEditingElement) return;

    // Сохраняем HTML с форматированием
    currentEditingElement.innerHTML = currentEditingElement.innerHTML;

    // Убираем режим редактирования
    currentEditingElement.removeAttribute('contenteditable');
    currentEditingElement.style.outline = '';
    currentEditingElement.style.minHeight = '';
    currentEditingElement.style.backgroundColor = '';

    showToast('✅ Текст сохранён с форматированием');

    currentEditingElement = null;
    hideFormatToolbar();
}

function cancelEdit() {
    if (!currentEditingElement) return;

    // Восстанавливаем исходное содержимое
    currentEditingElement.innerHTML = originalContent;

    // Убираем режим редактирования
    currentEditingElement.removeAttribute('contenteditable');
    currentEditingElement.style.outline = '';
    currentEditingElement.style.minHeight = '';
    currentEditingElement.style.backgroundColor = '';

    showToast('❌ Редактирование отменено');

    currentEditingElement = null;
    hideFormatToolbar();
}

export function createTextEditor(element) {
    // Если уже редактируем другой элемент, сохраняем его
    if (currentEditingElement) {
        saveContent();
    }

    currentEditingElement = element;
    originalContent = element.innerHTML;

    // Включаем режим редактирования
    element.setAttribute('contenteditable', 'true');
    element.style.outline = '2px solid #ff9800';
    element.style.backgroundColor = 'rgba(255,152,0,0.05)';
    element.style.minHeight = element.offsetHeight + 'px';

    // Фокусируемся и выделяем весь текст
    element.focus();

    // Выделяем весь текст для удобства
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Показываем панель форматирования
    showFormatToolbar(element);

    // Следим за изменениями и обновляем положение панели
    const onInput = () => {
        updateToolbarState();
        const rect = element.getBoundingClientRect();
        if (formatToolbar) {
            let top = rect.top - 50;
            if (top < 10) top = rect.bottom + 10;
            formatToolbar.style.top = top + 'px';
            formatToolbar.style.left = rect.left + 'px';
        }
    };

    const onKeyDown = (e) => {
        // Ctrl+Enter для сохранения
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            saveContent();
        }
        // Esc для отмены
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
        updateToolbarState();
    };

    const onBlur = () => {
        // Не сохраняем автоматически при потере фокуса
        // Пользователь должен нажать кнопку Сохранить
    };

    element.addEventListener('input', onInput);
    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('blur', onBlur);

    // Сохраняем обработчики для удаления
    element._editHandlers = { onInput, onKeyDown, onBlur };
}