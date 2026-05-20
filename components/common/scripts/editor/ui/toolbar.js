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
            <div class="toolbar-group">
                <button id="undoBtn" class="tool-btn">↩️ Отменить</button>
                <button id="redoBtn" class="tool-btn">↪️ Вернуть</button>
            </div>
            <div class="toolbar-group">
                <button id="slidesPanelBtn" class="tool-btn">📑 Слайды</button>
            </div>
            <div class="toolbar-actions">
                <button id="exitEditBtn" class="exit-btn">🚪 Выйти</button>
            </div>
        </div>
    `;

    document.body.appendChild(toolbar);

    document.getElementById('undoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.undo());
    });
    document.getElementById('redoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.redo());
    });
    document.getElementById('slidesPanelBtn')?.addEventListener('click', toggleSlidesPanel);
    document.getElementById('exitEditBtn')?.addEventListener('click', () => {
        import('../main.js').then(m => m.disableEditMode());
    });

    return toolbar;
}

export function hideToolbar() {
    if (toolbar) toolbar.remove();
    toolbar = null;
}