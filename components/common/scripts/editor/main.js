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

// Получить HTML без редактора (чистая версия сайта)
function getCleanHTML() {
    // Сохраняем текущий режим
    const wasEditMode = state.isEditMode;

    // Временно выключаем режим редактирования если он включён
    if (wasEditMode) {
        // Убираем классы редактора
        document.querySelectorAll('.editable-object').forEach(el => {
            el.classList.remove('editable-object', 'selected');
        });
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
        // Убираем кнопку редактора
        if (toggleBtn) toggleBtn.style.display = 'none';
    }

    // Клонируем документ
    const clone = document.documentElement.cloneNode(true);

    // Удаляем из клона все следы редактора
    const cloneDoc = clone;

    // Удаляем кнопку редактора
    const cloneToggle = cloneDoc.querySelector('#editorToggle');
    if (cloneToggle) cloneToggle.remove();

    // Удаляем панели редактора
    const cloneToolbar = cloneDoc.querySelector('.editor-toolbar');
    if (cloneToolbar) cloneToolbar.remove();

    const clonePropertyPanel = cloneDoc.querySelector('.property-panel');
    if (clonePropertyPanel) clonePropertyPanel.remove();

    const cloneSlidesPanel = cloneDoc.querySelector('.slides-panel');
    if (cloneSlidesPanel) cloneSlidesPanel.remove();

    const cloneHint = cloneDoc.querySelector('.editor-hint');
    if (cloneHint) cloneHint.remove();

    const cloneGrid = cloneDoc.querySelector('.editor-grid-overlay');
    if (cloneGrid) cloneGrid.remove();

    const cloneToast = cloneDoc.querySelector('.editor-toast');
    if (cloneToast) cloneToast.remove();

    // Убираем классы редактора со всех элементов
    cloneDoc.querySelectorAll('.editable-object').forEach(el => {
        el.classList.remove('editable-object', 'selected', 'locked');
    });

    // Убираем contenteditable
    cloneDoc.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.removeAttribute('contenteditable');
    });

    // Убираем кнопки удаления и блокировки
    cloneDoc.querySelectorAll('.element-delete-btn, .element-lock-btn, .resize-handle, .image-resize-handle, .resize-handles').forEach(el => {
        el.remove();
    });

    // Убираем модалки редактора
    cloneDoc.querySelectorAll('.editor-modal-overlay, .object-context-menu, .format-float-bar').forEach(el => {
        el.remove();
    });

    // Восстанавливаем режим
    if (wasEditMode) {
        if (toggleBtn) toggleBtn.style.display = 'flex';
    }

    return '<!DOCTYPE html>\n' + cloneDoc.outerHTML;
}

// Сохраняем оригинальную функцию saveToGitHub из actions/save.js
// Переопределяем её для сохранения чистой версии
async function saveCleanToGitHub() {
    const { saveToGitHub: originalSave } = await import('../actions/save.js');

    // Сохраняем оригинальный HTML
    const originalHTML = document.documentElement.outerHTML;

    // Подменяем на чистую версию
    const cleanHTML = getCleanHTML();

    // Временно подменяем document
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHTML;
    const tempDoc = tempDiv;

    // Сохраняем через оригинальную функцию с подменой
    try {
        // Используем fetch напрямую для сохранения чистой версии
        const { CONFIG } = await import('../core/config.js');
        const token = localStorage.getItem('github_token_hrlubacheva');

        if (!token) {
            showToast('❌ Нет токена GitHub');
            return;
        }

        const content = btoa(unescape(encodeURIComponent(cleanHTML)));

        let sha = null;
        const getUrl = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
        const getResponse = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }

        const updateResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Сохранение сайта ${new Date().toLocaleString()}`,
                content: content,
                sha: sha,
                branch: CONFIG.BRANCH
            })
        });

        if (updateResponse.ok) {
            showToast('✅ Сохранено! Сайт обновится через 1-2 минуты');
        } else {
            const error = await updateResponse.json();
            showToast('❌ Ошибка: ' + (error.message || 'Неизвестная ошибка'));
        }
    } catch (err) {
        showToast('⚠️ Ошибка: ' + err.message);
        // Скачиваем бекап чистой версии
        const blob = new Blob([cleanHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `index_backup_${new Date().toISOString().slice(0, 19)}.html`;
        link.click();
        showToast('📥 Бекап сохранён локально');
    }
}

export function initEditor() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('🎨 Запуск редактора...');

    // Создаём кнопку включения слева сверху
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'editorToggle';
    toggleBtn.innerHTML = '✏️ Редактировать';
    toggleBtn.className = 'editor-toggle-btn';

    // Стили для кнопки слева сверху
    toggleBtn.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10001;
        background: linear-gradient(135deg, #2D6A9F, #1D4D7A);
        color: white;
        border: none;
        border-radius: 40px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Inter', sans-serif;
    `;
    toggleBtn.onmouseenter = () => {
        toggleBtn.style.transform = 'scale(1.05)';
        toggleBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    };
    toggleBtn.onmouseleave = () => {
        toggleBtn.style.transform = 'scale(1)';
        toggleBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    };

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

        if (e.key === 'Delete') {
            e.preventDefault();
            deleteSelectedBlock();
        }
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
    toggleBtn.style.background = 'linear-gradient(135deg, #dc3545, #b02a37)';

    // Создаём интерфейс
    createToolbar();
    createPropertyPanel();
    createSlidesPanel();

    // Добавляем выделение для всех редактируемых элементов
    document.querySelectorAll('section, .role-card, .service-card, .benefit-card, .stat-item, .process-card, .quiz-card, .checklist-card, .calendar-card, .editor-text-block, .editor-photo-block, .editor-video-block, .editor-card-block, .editor-button-block, .editor-divider-block, p, h1, h2, h3, h4, h5, h6, img').forEach(el => {
        el.classList.add('editable-object');
        el.addEventListener('click', (e) => {
            e.stopPropagation();
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

    // Переопределяем сохранение на GitHub
    const saveBtn = document.getElementById('saveToGitBtn');
    if (saveBtn) {
        const oldClick = saveBtn.onclick;
        saveBtn.onclick = () => saveCleanToGitHub();
    }

    // Инициализируем функции
    initDragDrop();
    initTextEditing();
    initHistory();

    saveToHistory();
    showHint();
    showToast('✨ Режим редактирования включён');
}

export function disableEditMode() {
    state.isEditMode = false;
    toggleBtn.classList.remove('active');
    toggleBtn.innerHTML = '✏️ Редактировать';
    toggleBtn.style.background = 'linear-gradient(135deg, #2D6A9F, #1D4D7A)';

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
    hint.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 12px;
        max-width: 260px;
        font-family: 'Inter', sans-serif;
        transition: opacity 0.5s;
    `;
    hint.innerHTML = `
        <div style="font-weight:700; margin-bottom:10px;">💡 Быстрые советы</div>
        <div>✏️ <strong>Двойной клик</strong> — редактировать текст</div>
        <div>🖼️ <strong>ПКМ по фото</strong> — изменить форму/заменить</div>
        <div>📌 <strong>Перетаскивание</strong> — включите в настройках</div>
        <div>⌨️ <strong>Ctrl+Z/Y</strong> — отмена/возврат</div>
        <div>🗑️ <strong>Delete</strong> — удалить блок</div>
        <div>🔒 <strong>Замок</strong> — блокировка блока</div>
        <div>🎬 <strong>PowerPoint режим</strong> — создавайте слайды</div>
    `;
    document.body.appendChild(hint);
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 500);
    }, 10000);
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

// ---------- Главная инициализация сайта ----------
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initCalculator === 'function') initCalculator();
    if (typeof renderQuiz === 'function') renderQuiz();
    if (typeof initModal === 'function') initModal();
    if (typeof initCallbackForm === 'function') initCallbackForm();
    if (typeof initAnimations === 'function') initAnimations();
    if (typeof initSmoothScroll === 'function') initSmoothScroll();
    if (typeof initCopyButtons === 'function') initCopyButtons();
    console.log('✅ Сайт инициализирован');
});