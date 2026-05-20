import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { toggleSlidesPanel } from './panels.js';

let toolbar = null;

export function createToolbar() {
    if (toolbar) return toolbar;

    toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
        <div class="toolbar-container">
            <div class="toolbar-section">
                <div class="toolbar-title">✏️ Редактор</div>
                <div class="toolbar-buttons">
                    <button id="undoBtn" class="tool-btn" title="Отменить (Ctrl+Z)">↩️ Отменить</button>
                    <button id="redoBtn" class="tool-btn" title="Вернуть (Ctrl+Y)">↪️ Вернуть</button>
                    <div class="separator"></div>
                    <button id="boldBtn" class="tool-btn" title="Жирный (Ctrl+B)"><b>Ж</b></button>
                    <button id="italicBtn" class="tool-btn" title="Курсив (Ctrl+I)"><i>К</i></button>
                    <button id="underlineBtn" class="tool-btn" title="Подчёркнутый (Ctrl+U)"><u>Ч</u></button>
                    <div class="separator"></div>
                    <button id="alignLeftBtn" class="tool-btn" title="По левому краю">◀</button>
                    <button id="alignCenterBtn" class="tool-btn" title="По центру">◀▶</button>
                    <button id="alignRightBtn" class="tool-btn" title="По правому краю">▶</button>
                    <div class="separator"></div>
                    <button id="listUlBtn" class="tool-btn" title="Маркированный список">• Список</button>
                    <button id="listOlBtn" class="tool-btn" title="Нумерованный список">1. Список</button>
                </div>
            </div>
            <div class="toolbar-section">
                <div class="toolbar-title">💾 Сохранение</div>
                <div class="toolbar-buttons">
                    <button id="saveToGitBtn" class="tool-btn save-btn" title="Сохранить на GitHub">💾 Сохранить на GitHub</button>
                </div>
            </div>
            <div class="toolbar-section">
                <div class="toolbar-title">📄 Навигация</div>
                <div class="toolbar-buttons">
                    <button id="slidesPanelBtn" class="tool-btn" title="Слайды (секции)">📑 Слайды</button>
                </div>
            </div>
            <div class="toolbar-section">
                <div class="toolbar-title">⚙️ Настройки</div>
                <div class="toolbar-buttons">
                    <label class="toggle-switch">
                        <input type="checkbox" id="dragToggle">
                        <span class="toggle-slider"></span>
                        <span>📌 Перетаскивание</span>
                    </label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="gridToggle">
                        <span class="toggle-slider"></span>
                        <span>📐 Сетка</span>
                    </label>
                </div>
            </div>
            <div class="toolbar-actions">
                <button id="exitEditBtn" class="exit-btn">🚪 Выйти</button>
            </div>
        </div>
    `;

    document.body.appendChild(toolbar);
    attachEvents();
    return toolbar;
}

function attachEvents() {
    // Отмена/Возврат
    document.getElementById('undoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.undo());
    });
    document.getElementById('redoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.redo());
    });

    // Форматирование текста
    document.getElementById('boldBtn')?.addEventListener('click', () => {
        document.execCommand('bold');
        saveToHistory();
        showToast('✅ Жирный текст');
    });
    document.getElementById('italicBtn')?.addEventListener('click', () => {
        document.execCommand('italic');
        saveToHistory();
        showToast('✅ Курсив');
    });
    document.getElementById('underlineBtn')?.addEventListener('click', () => {
        document.execCommand('underline');
        saveToHistory();
        showToast('✅ Подчёркнутый');
    });
    document.getElementById('alignLeftBtn')?.addEventListener('click', () => {
        document.execCommand('justifyLeft');
        saveToHistory();
        showToast('✅ Выравнивание по левому краю');
    });
    document.getElementById('alignCenterBtn')?.addEventListener('click', () => {
        document.execCommand('justifyCenter');
        saveToHistory();
        showToast('✅ Выравнивание по центру');
    });
    document.getElementById('alignRightBtn')?.addEventListener('click', () => {
        document.execCommand('justifyRight');
        saveToHistory();
        showToast('✅ Выравнивание по правому краю');
    });
    document.getElementById('listUlBtn')?.addEventListener('click', () => {
        document.execCommand('insertUnorderedList');
        saveToHistory();
        showToast('✅ Маркированный список');
    });
    document.getElementById('listOlBtn')?.addEventListener('click', () => {
        document.execCommand('insertOrderedList');
        saveToHistory();
        showToast('✅ Нумерованный список');
    });

    // Панель слайдов
    document.getElementById('slidesPanelBtn')?.addEventListener('click', toggleSlidesPanel);

    // Выход
    document.getElementById('exitEditBtn')?.addEventListener('click', () => {
        import('../main.js').then(m => m.disableEditMode());
    });

    // Перетаскивание
    document.getElementById('dragToggle')?.addEventListener('change', (e) => {
        state.dragEnabled = e.target.checked;
        showToast(state.dragEnabled ? '📌 Перетаскивание включено' : '📌 Перетаскивание выключено');
    });

    // Сетка
    let gridOverlay = null;
    document.getElementById('gridToggle')?.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (!gridOverlay) {
                gridOverlay = document.createElement('div');
                gridOverlay.className = 'editor-grid-overlay';
                document.body.appendChild(gridOverlay);
            }
            gridOverlay.style.display = 'block';
        } else if (gridOverlay) {
            gridOverlay.style.display = 'none';
        }
    });
}

export function hideToolbar() {
    if (toolbar) toolbar.remove();
    toolbar = null;
}