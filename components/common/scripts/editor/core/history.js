// ========== УПРАВЛЕНИЕ ИСТОРИЕЙ (UNDO/REDO) ==========
import { state } from './state.js';
import { showToast } from './utils.js';

let saveTimeout = null;

export function saveToHistory() {
    if (state.isUndoRedo) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
        }
        const snapshot = { html: document.documentElement.outerHTML, timestamp: Date.now() };
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        else state.historyIndex = state.history.length - 1;
        updateButtons();
    }, 100);
}

function restoreSnapshot(snapshot) {
    if (!snapshot) return;
    state.isUndoRedo = true;
    const temp = document.createElement('div');
    temp.innerHTML = snapshot.html;
    const newBody = temp.querySelector('body');
    if (newBody) {
        document.body.innerHTML = newBody.innerHTML;
        // Перезапустить скрипты
        document.body.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
            oldScript.remove();
        });
    }
    state.isUndoRedo = false;
    showToast('✅ Состояние восстановлено');
}

export function undo() {
    if (state.historyIndex <= 0) {
        showToast('⚠️ Нет действий для отмены');
        return;
    }
    state.historyIndex--;
    restoreSnapshot(state.history[state.historyIndex]);
}

export function redo() {
    if (state.historyIndex >= state.history.length - 1) {
        showToast('⚠️ Нет действий для возврата');
        return;
    }
    state.historyIndex++;
    restoreSnapshot(state.history[state.historyIndex]);
}

function updateButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = state.historyIndex >= state.history.length - 1;
}

export function initHistory() {
    state.history = [];
    state.historyIndex = -1;
    saveToHistory();
    const observer = new MutationObserver(() => {
        if (!state.isUndoRedo && state.isEditMode) saveToHistory();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    document.addEventListener('keydown', (e) => {
        if (!state.isEditMode) return;
        if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); redo(); }
    });
}