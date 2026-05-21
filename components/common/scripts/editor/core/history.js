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
        state.historyIndex = state.history.length - 1;

        window.__editorHistory = state.history;
        window.__editorHistoryIndex = state.historyIndex;
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
        document.body.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) newScript.src = oldScript.src;
            else newScript.textContent = oldScript.textContent;
            document.body.appendChild(newScript);
            oldScript.remove();
        });
    }
    state.isUndoRedo = false;
    window.__editorHistory = state.history;
    window.__editorHistoryIndex = state.historyIndex;
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

export function initHistory() {
    state.history = [];
    state.historyIndex = -1;
    window.__editorHistory = state.history;
    window.__editorHistoryIndex = state.historyIndex;
    saveToHistory();

    const observer = new MutationObserver((mutations) => {
        if (!state.isEditMode) return;
        if (state.isUndoRedo) return;

        const relevant = mutations.some(m => {
            const target = m.target;
            if (target.closest?.('.editor-toolbar, .property-panel, .slides-panel, .history-panel, .format-toolbar, .resize-marker')) return false;
            if (target.classList?.contains('resize-marker')) return false;
            if (m.type === 'attributes' && m.attributeName === 'style') {
                const oldStyle = m.oldValue || '';
                const newStyle = target.style?.cssText || '';
                if (oldStyle.includes('outline') && newStyle.includes('outline')) return false;
                if (oldStyle.includes('position') && newStyle.includes('position')) return false;
                if (oldStyle.includes('flex') && newStyle.includes('flex')) return false;
            }
            return true;
        });

        if (relevant) saveToHistory();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true
    });

    document.addEventListener('keydown', (e) => {
        if (!state.isEditMode) return;
        if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); redo(); }
    });
}

window.restoreFromLocalHistory = (index) => {
    if (index >= 0 && index < state.history.length) {
        restoreSnapshot(state.history[index]);
    }
};