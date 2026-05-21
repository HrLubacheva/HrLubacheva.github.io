// components/common/scripts/editor/editor-core.js
// Ядро редактора — работает с глобальными функциями из core.js

(function() {
    'use strict';

    // ========== СОСТОЯНИЕ РЕДАКТОРА ==========
    window.editorState = {
        isEditMode: false,
        selectedElement: null,
        dragEnabled: true,
        history: [],
        historyIndex: -1,
        isUndoRedo: false
    };

    // ========== ЗАЩИТА ЭЛЕМЕНТОВ ==========
    window.isProtectedElement = function(element) {
        if (!element) return true;
        const protectedSelectors = [
            '.editor-toolbar', '.editor-toolbar *',
            '.resize-marker', '.format-toolbar', '.property-panel',
            '#editorToggle', '.slides-panel', '.history-panel'
        ];
        for (const selector of protectedSelectors) {
            if (element.matches?.(selector) || element.closest?.(selector)) return true;
        }
        return false;
    };

    window.getBlock = function(element) {
        if (!element) return null;
        let current = element;
        while (current && current !== document.body) {
            if (current.classList?.contains('editable-block')) return current;
            current = current.parentElement;
        }
        return null;
    };

    // ========== ИСТОРИЯ (UNDO/REDO) ==========
    let saveTimeout = null;

    window.saveToHistory = function() {
        if (window.editorState.isUndoRedo) return;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (window.editorState.historyIndex < window.editorState.history.length - 1) {
                window.editorState.history = window.editorState.history.slice(0, window.editorState.historyIndex + 1);
            }
            const snapshot = { html: document.documentElement.outerHTML, timestamp: Date.now() };
            window.editorState.history.push(snapshot);
            if (window.editorState.history.length > 50) window.editorState.history.shift();
            window.editorState.historyIndex = window.editorState.history.length - 1;
        }, 100);
    };

    function restoreSnapshot(snapshot) {
        if (!snapshot) return;
        window.editorState.isUndoRedo = true;
        const temp = document.createElement('div');
        temp.innerHTML = snapshot.html;
        const newBody = temp.querySelector('body');
        if (newBody) {
            document.body.innerHTML = newBody.innerHTML;
            // Восстанавливаем скрипты
            document.body.querySelectorAll('script').forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                document.body.appendChild(newScript);
                oldScript.remove();
            });
        }
        window.editorState.isUndoRedo = false;
        window.showToast('✅ Состояние восстановлено');
    }

    window.undo = function() {
        if (window.editorState.historyIndex <= 0) {
            window.showToast('⚠️ Нет действий для отмены');
            return;
        }
        window.editorState.historyIndex--;
        restoreSnapshot(window.editorState.history[window.editorState.historyIndex]);
    };

    window.redo = function() {
        if (window.editorState.historyIndex >= window.editorState.history.length - 1) {
            window.showToast('⚠️ Нет действий для возврата');
            return;
        }
        window.editorState.historyIndex++;
        restoreSnapshot(window.editorState.history[window.editorState.historyIndex]);
    };

    // ========== ВЫДЕЛЕНИЕ БЛОКОВ ==========
    window.clearSelection = function() {
        if (window.editorState.selectedElement) {
            window.editorState.selectedElement.classList.remove('selected');
            window.editorState.selectedElement = null;
        }
        if (window.hideResizeMarkers) window.hideResizeMarkers();
        if (window.hideFormatToolbar) window.hideFormatToolbar();
    };

    window.selectElement = function(element) {
        if (!element || window.editorState.selectedElement === element) return;
        window.clearSelection();
        window.editorState.selectedElement = element;
        element.classList.add('selected');
        if (element.tagName === 'IMG' && window.showResizeMarkers) {
            window.showResizeMarkers(element);
        }
    };

    // ========== БЛОКИРОВКА БЛОКОВ ==========
    window.toggleBlockLock = function(element) {
        if (!element) return;
        const wasLocked = element.classList.contains('locked');
        if (wasLocked) {
            element.classList.remove('locked');
            window.showToast('🔓 Блок разблокирован');
        } else {
            element.classList.add('locked');
            if (element.classList.contains('selected')) {
                element.classList.remove('selected');
                window.clearSelection();
            }
            window.showToast('🔒 Блок заблокирован');
        }
        window.saveToHistory();
    };

    window.isBlockLocked = function(element) {
        return element?.classList?.contains('locked') || false;
    };

    // ========== ИНИЦИАЛИЗАЦИЯ ИСТОРИИ ==========
    window.initEditorHistory = function() {
        window.editorState.history = [];
        window.editorState.historyIndex = -1;
        window.saveToHistory();

        const observer = new MutationObserver(() => {
            if (window.editorState.isEditMode && !window.editorState.isUndoRedo) {
                window.saveToHistory();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        document.addEventListener('keydown', (e) => {
            if (!window.editorState.isEditMode) return;
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                window.undo();
            }
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                window.redo();
            }
        });

        window.log('✅ editor-core: история инициализирована');
    };

    window.log('✅ editor-core.js загружен');
})();