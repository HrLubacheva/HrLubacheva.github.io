// ========== ГЛАВНЫЙ МОДУЛЬ РЕДАКТОРА ==========
import { state } from './core/state.js';
import { showToast } from './core/utils.js';
import { initHistory, saveToHistory } from './core/history.js';
import { createToolbar, hideToolbar } from './ui/toolbar.js';
import { createPropertyPanel } from './ui/property-panel.js';
import { createSlidesPanel } from './ui/panels.js';
import { selectElement, clearSelection } from './features/selection.js';
import { initDragDrop } from './features/dragndrop.js';
import { initTextEditing } from './features/text-edit.js';
import { duplicateSelectedBlock } from './actions/duplicate.js';
import { deleteSelectedBlock } from './actions/delete.js';

let toggleBtn = null;
let isInitialized = false;

export function initEditor() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('🎨 Запуск редактора...');

    // Создаём кнопку включения
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'editorToggle';
    toggleBtn.innerHTML = '✏️ Редактировать';
    toggleBtn.className = 'editor-toggle-btn';
    document.body.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => {
        if (state.isEditMode) {
            disableEditMode();
        } else {
            enableEditMode();
        }
    });

    // Глобальные горячие клавиши
    document.addEventListener('keydown', (e) => {
        if (!state.isEditMode) return;

        // Delete - удалить
        if (e.key === 'Delete') {
            e.preventDefault();
            deleteSelectedBlock();
        }
        // Ctrl+D - дублировать
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            duplicateSelectedBlock();
        }
    });
}

function enableEditMode() {
    state.isEditMode = true;
    toggleBtn.classList.add('active');
    toggleBtn.innerHTML = '🔴 Выйти';

    // Создаём интерфейс
    createToolbar();
    createPropertyPanel();
    createSlidesPanel();

    // Добавляем выделение для всех редактируемых элементов
    document.querySelectorAll('section, .role-card, .service-card, .benefit-card, .stat-item, .process-card, .quiz-card, .checklist-card, .calendar-card, .editor-text-block, .editor-photo-block, .editor-video-block, .editor-card-block, .editor-button-block, .editor-divider-block, p, h1, h2, h3, h4, h5, h6, img').forEach(el => {
        el.classList.add('editable-object');
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            // Не выделяем заблокированные
            if (el.classList.contains('locked')) return;
            selectElement(el);
        });
    });

    // Добавляем ПКМ контекстное меню для фото
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showImageContextMenu(e, img);
        });
    });

    // Инициализируем функции
    initDragDrop();
    initTextEditing();
    initHistory();

    // Сохраняем начальное состояние
    saveToHistory();

    showHint();
    showToast('✨ Режим редактирования включён');
}

export function disableEditMode() {
    state.isEditMode = false;
    toggleBtn.classList.remove('active');
    toggleBtn.innerHTML = '✏️ Редактировать';

    // Удаляем панели
    hideToolbar();
    document.querySelector('.property-panel')?.remove();
    document.querySelector('.slides-panel')?.remove();
    document.querySelector('.editor-hint')?.remove();
    document.querySelector('.editor-grid-overlay')?.remove();

    // Убираем выделение
    document.querySelectorAll('.editable-object').forEach(el => {
        el.classList.remove('editable-object', 'selected');
    });

    // Убираем contenteditable
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.removeAttribute('contenteditable');
    });

    clearSelection();
    showToast('✨ Режим редактирования выключен');
}

function showHint() {
    const hint = document.createElement('div');
    hint.className = 'editor-hint';
    hint.innerHTML = `
        <div class="hint-header">💡 Быстрые советы</div>
        <div class="hint-content">
            <div>✏️ <strong>Двойной клик</strong> — редактировать текст</div>
            <div>🖼️ <strong>ПКМ по фото</strong> — изменить форму/заменить</div>
            <div>📌 <strong>Перетаскивание</strong> — включите в настройках</div>
            <div>⌨️ <strong>Ctrl+Z/Y</strong> — отмена/возврат</div>
            <div>🗑️ <strong>Delete</strong> — удалить блок</div>
            <div>🔒 <strong>Замок</strong> — блокировка блока</div>
        </div>
    `;
    document.body.appendChild(hint);
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 500);
    }, 8000);
}

function showImageContextMenu(e, img) {
    const menu = document.createElement('div');
    menu.className = 'image-context-menu';
    Object.assign(menu.style, {
        position: 'fixed',
        top: e.clientY + 'px',
        left: e.clientX + 'px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        zIndex: '10020',
        overflow: 'hidden',
        minWidth: '180px'
    });
    menu.innerHTML = `
        <button data-action="shape">🔘 Изменить форму</button>
        <button data-action="replace">🔄 Заменить фото</button>
        <button data-action="crop">✂️ Обрезать</button>
        <button data-action="reset">⟳ Сбросить размер</button>
    `;

    menu.querySelectorAll('button').forEach(btn => {
        btn.style.cssText = 'display:block; width:100%; padding:10px 15px; border:none; background:white; text-align:left; cursor:pointer;';
        btn.addEventListener('mouseenter', () => btn.style.background = '#f0f0f0');
        btn.addEventListener('mouseleave', () => btn.style.background = 'white');
    });

    menu.querySelector('[data-action="shape"]').onclick = () => {
        import('./features/resize.js').then(m => {
            m.applyShapeToImage(img, prompt('Форма (circle, oval, square, rounded, hexagon, pentagon, none):', 'circle'));
        });
        menu.remove();
    };
    menu.querySelector('[data-action="replace"]').onclick = () => {
        const url = prompt('📷 Введите новый URL фото:', img.src);
        if (url) img.src = url;
        menu.remove();
    };
    menu.querySelector('[data-action="crop"]').onclick = () => {
        showToast('✂️ Функция обрезки в разработке');
        menu.remove();
    };
    menu.querySelector('[data-action="reset"]').onclick = () => {
        img.style.width = '';
        img.style.height = '';
        menu.remove();
        showToast('✅ Размер сброшен');
    };

    document.body.appendChild(menu);
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) menu.remove();
        document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

// Запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}

// ---------- Главная инициализация ----------
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация калькулятора
    if (typeof initCalculator === 'function') initCalculator();

    // Инициализация квиза
    if (typeof renderQuiz === 'function') renderQuiz();

    // Инициализация модалок
    if (typeof initModal === 'function') initModal();

    // Инициализация формы обратного звонка
    if (typeof initCallbackForm === 'function') initCallbackForm();

    // Инициализация анимаций
    if (typeof initAnimations === 'function') initAnimations();

    // Инициализация плавной прокрутки
    if (typeof initSmoothScroll === 'function') initSmoothScroll();

    // Инициализация копирования
    if (typeof initCopyButtons === 'function') initCopyButtons();

    console.log('✅ Сайт инициализирован');
});