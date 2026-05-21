import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { toggleSlidesPanel } from './panels.js';

let toolbar = null;

// ---------- Перемещение выделенного блока вверх ----------
function moveSelectedBlockUp() {
    const selected = document.querySelector('.editable-block.selected');
    if (!selected) {
        showToast('⚠️ Сначала выделите блок (кликните на него)');
        return;
    }
    const parent = selected.parentNode;
    if (!parent) return;
    const children = Array.from(parent.children).filter(child => child.classList?.contains('editable-block'));
    const index = children.indexOf(selected);
    if (index <= 0) {
        showToast('⚠️ Блок уже первый');
        return;
    }
    parent.insertBefore(selected, children[index - 1]);
    saveToHistory();
    showToast('⬆️ Блок перемещён вверх');
    selected.classList.add('selected');
}

// ---------- Перемещение выделенного блока вниз ----------
function moveSelectedBlockDown() {
    const selected = document.querySelector('.editable-block.selected');
    if (!selected) {
        showToast('⚠️ Сначала выделите блок (кликните на него)');
        return;
    }
    const parent = selected.parentNode;
    if (!parent) return;
    const children = Array.from(parent.children).filter(child => child.classList?.contains('editable-block'));
    const index = children.indexOf(selected);
    if (index === -1 || index === children.length - 1) {
        showToast('⚠️ Блок уже последний');
        return;
    }
    parent.insertBefore(selected, children[index + 1].nextSibling);
    saveToHistory();
    showToast('⬇️ Блок перемещён вниз');
    selected.classList.add('selected');
}

// ---------- Дублирование выделенного блока ----------
function duplicateSelectedBlock() {
    const selected = document.querySelector('.editable-block.selected');
    if (!selected) {
        showToast('⚠️ Сначала выделите блок (кликните на него)');
        return;
    }
    if (selected.classList.contains('locked')) {
        showToast('🔒 Нельзя дублировать заблокированный блок');
        return;
    }
    const clone = selected.cloneNode(true);
    clone.classList.remove('selected');
    clone.querySelectorAll('.resize-marker, .block-hover-toolbar, .element-delete-btn, .element-lock-btn').forEach(el => el.remove());
    const left = parseFloat(selected.style.left) || 0;
    const top = parseFloat(selected.style.top) || 0;
    if (selected.style.position === 'absolute') {
        clone.style.left = (left + 30) + 'px';
        clone.style.top = (top + 30) + 'px';
    }
    selected.parentNode.insertBefore(clone, selected.nextSibling);
    saveToHistory();
    showToast('✅ Блок продублирован');
    selected.classList.remove('selected');
    clone.classList.add('selected');
    if (typeof window.showPropertyPanel === 'function') {
        window.showPropertyPanel(clone);
    }
}

// ---------- Удаление выделенного блока ----------
function deleteSelectedBlock() {
    const selected = document.querySelector('.editable-block.selected');
    if (!selected) {
        showToast('⚠️ Сначала выделите блок (кликните на него)');
        return;
    }
    if (selected.classList.contains('locked')) {
        showToast('🔒 Нельзя удалить заблокированный блок');
        return;
    }
    if (confirm('Удалить этот блок?')) {
        selected.remove();
        if (window.clearSelection) window.clearSelection();
        saveToHistory();
        showToast('✅ Блок удалён');
        const propertyPanel = document.querySelector('.property-panel');
        if (propertyPanel) propertyPanel.classList.remove('show');
    }
}

// ---------- Очистка GitHub токена ----------
function clearGitHubToken() {
    localStorage.removeItem('github_token_hrlubacheva');
    showToast('✅ GitHub токен очищен');
}

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
                    <button id="moveUpBtn" class="tool-btn" title="Переместить блок выше">⬆️ Вверх</button>
                    <button id="moveDownBtn" class="tool-btn" title="Переместить блок ниже">⬇️ Вниз</button>
                    <button id="duplicateBtn" class="tool-btn" title="Дублировать выделенный блок">📋 Дублировать</button>
                    <button id="deleteBtn" class="tool-btn" title="Удалить выделенный блок">🗑️ Удалить</button>
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
                    <button id="historyPanelBtn" class="tool-btn" title="История изменений">📜 История</button>
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
                    <div class="separator"></div>
                    <button id="clearTokenBtn" class="tool-btn" style="background: #ffc107; color: #333;">🗑️ Очистить токен</button>
                </div>
            </div>
            <div class="toolbar-actions">
                <button id="togglePanelsBtn" class="exit-btn">👁️ Скрыть панели</button>
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

    // Перемещение
    document.getElementById('moveUpBtn')?.addEventListener('click', moveSelectedBlockUp);
    document.getElementById('moveDownBtn')?.addEventListener('click', moveSelectedBlockDown);

    // Дублирование и удаление
    document.getElementById('duplicateBtn')?.addEventListener('click', duplicateSelectedBlock);
    document.getElementById('deleteBtn')?.addEventListener('click', deleteSelectedBlock);

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

    // Панели
    document.getElementById('slidesPanelBtn')?.addEventListener('click', toggleSlidesPanel);
    document.getElementById('historyPanelBtn')?.addEventListener('click', () => {
        import('./history-panel.js').then(m => m.toggleHistoryPanel());
    });
    document.getElementById('togglePanelsBtn')?.addEventListener('click', () => {
        import('../main.js').then(m => m.togglePanelsVisibility());
    });

    // Очистка токена
    document.getElementById('clearTokenBtn')?.addEventListener('click', clearGitHubToken);

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