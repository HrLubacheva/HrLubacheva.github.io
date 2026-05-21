/**
 * Editor Core Module
 * Управляет состоянием редактора, историей, выделением и блокировкой блоков
 *
 * @module editor-core
 */

(function() {
    'use strict';

    /**
     * Состояние редактора
     * @namespace editorState
     * @property {boolean} isEditMode - Режим редактирования активен
     * @property {HTMLElement|null} selectedElement - Выделенный элемент
     * @property {boolean} dragEnabled - Разрешено перетаскивание
     * @property {Array} history - История изменений
     * @property {number} historyIndex - Текущий индекс в истории
     * @property {boolean} isUndoRedo - Флаг операции undo/redo
     */
    window.editorState = {
        isEditMode: false,
        selectedElement: null,
        dragEnabled: true,
        history: [],
        historyIndex: -1,
        isUndoRedo: false
    };

    /**
     * Проверяет, является ли элемент защищённым (не должен редактироваться)
     * @param {HTMLElement} element - Проверяемый элемент
     * @returns {boolean} true если элемент защищён
     */
    window.isProtectedElement = function(element) {
        if (!element) return true;
        const protectedSelectors = [
            '.editor-toolbar', '.editor-toolbar *',
            '.resize-marker', '.format-toolbar', '.property-panel',
            '#editorToggleBtn', '.slides-panel', '.history-panel'
        ];
        for (const selector of protectedSelectors) {
            if (element.matches?.(selector) || element.closest?.(selector)) return true;
        }
        return false;
    };

    /**
     * Находит родительский блок с классом 'editable-block'
     * @param {HTMLElement} element - Стартовый элемент
     * @returns {HTMLElement|null} Блок или null
     */
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

    /**
     * Сохраняет текущее состояние DOM в историю
     */
    window.saveToHistory = function() {
        if (window.editorState.isUndoRedo) return;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            if (window.editorState.historyIndex < window.editorState.history.length - 1) {
                window.editorState.history = window.editorState.history.slice(0, window.editorState.historyIndex + 1);
            }
            var snapshot = { html: document.documentElement.outerHTML, timestamp: Date.now() };
            window.editorState.history.push(snapshot);
            if (window.editorState.history.length > 50) window.editorState.history.shift();
            window.editorState.historyIndex = window.editorState.history.length - 1;
        }, 100);
    };

    /**
     * Восстанавливает состояние из снимка
     * @param {Object} snapshot - Снимок состояния
     */
    function restoreSnapshot(snapshot) {
        if (!snapshot) return;
        window.editorState.isUndoRedo = true;
        var temp = document.createElement('div');
        temp.innerHTML = snapshot.html;
        var newBody = temp.querySelector('body');
        if (newBody) {
            document.body.innerHTML = newBody.innerHTML;
            document.body.querySelectorAll('script').forEach(function(oldScript) {
                var newScript = document.createElement('script');
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
        if (window.showToast) window.showToast('✅ Состояние восстановлено');
    }

    /**
     * Отменяет последнее действие (Ctrl+Z)
     */
    window.undo = function() {
        if (window.editorState.historyIndex <= 0) {
            if (window.showToast) window.showToast('⚠️ Нет действий для отмены');
            return;
        }
        window.editorState.historyIndex--;
        restoreSnapshot(window.editorState.history[window.editorState.historyIndex]);
    };

    /**
     * Возвращает отменённое действие (Ctrl+Y)
     */
    window.redo = function() {
        if (window.editorState.historyIndex >= window.editorState.history.length - 1) {
            if (window.showToast) window.showToast('⚠️ Нет действий для возврата');
            return;
        }
        window.editorState.historyIndex++;
        restoreSnapshot(window.editorState.history[window.editorState.historyIndex]);
    };

    /**
     * Снимает выделение с текущего блока
     */
    window.clearSelection = function() {
        if (window.editorState.selectedElement) {
            window.editorState.selectedElement.classList.remove('selected');
            window.editorState.selectedElement = null;
        }
        if (window.hideResizeMarkers) window.hideResizeMarkers();
        if (window.hideFormatToolbar) window.hideFormatToolbar();
    };

    /**
     * Выделяет указанный блок
     * @param {HTMLElement} element - Блок для выделения
     */
    window.selectElement = function(element) {
        if (!element || window.editorState.selectedElement === element) return;
        window.clearSelection();
        window.editorState.selectedElement = element;
        element.classList.add('selected');
        if (element.tagName === 'IMG' && window.showResizeMarkers) {
            window.showResizeMarkers(element);
        }
    };

    /**
     * Блокирует/разблокирует блок (запрещает редактирование)
     * @param {HTMLElement} element - Блок для блокировки
     */
    window.toggleBlockLock = function(element) {
        if (!element) return;
        var wasLocked = element.classList.contains('locked');
        if (wasLocked) {
            element.classList.remove('locked');
            if (window.showToast) window.showToast('🔓 Блок разблокирован');
        } else {
            element.classList.add('locked');
            if (element.classList.contains('selected')) {
                element.classList.remove('selected');
                window.clearSelection();
            }
            if (window.showToast) window.showToast('🔒 Блок заблокирован');
        }
        window.saveToHistory();
    };

    /**
     * Проверяет, заблокирован ли блок
     * @param {HTMLElement} element - Проверяемый блок
     * @returns {boolean}
     */
    window.isBlockLocked = function(element) {
        return element?.classList?.contains('locked') || false;
    };

    /**
     * Инициализирует систему истории (undo/redo)
     */
    window.initEditorHistory = function() {
        window.editorState.history = [];
        window.editorState.historyIndex = -1;
        window.saveToHistory();

        var observer = new MutationObserver(function() {
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

        document.addEventListener('keydown', function(e) {
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

        if (window.log) window.log('✅ editor-core: история инициализирована');
    };

    if (window.log) window.log('✅ editor-core.js загружен');
})();