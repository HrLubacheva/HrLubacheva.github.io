// components/common/scripts/editor/editor-main.js
// Главный файл редактора

(function() {
    'use strict';

    let isEditModeActive = false;
    let toolbar = null;

    // ========== СОХРАНЕНИЕ НА ЛОКАЛЬНЫЙ ФАЙЛ ==========
    window.saveToLocalFile = function() {
        try {
            const cleanHTML = document.documentElement.outerHTML;
            const blob = new Blob([cleanHTML], { type: 'text/html' });
            const link = document.createElement('a');
            const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.href = URL.createObjectURL(blob);
            link.download = `index_backup_${date}.html`;
            link.click();
            URL.revokeObjectURL(link.href);
            window.showToast('✅ Файл сохранён локально');
        } catch (err) {
            window.showToast('❌ Ошибка: ' + err.message);
        }
    };

    // ========== ТУЛБАР ==========
    function createToolbar() {
        if (toolbar) return;

        toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-container">
                <div class="toolbar-section">
                    <span class="toolbar-title">✏️ Редактор</span>
                    <button id="undoBtn" class="tool-btn" title="Отменить (Ctrl+Z)">↩️ Отменить</button>
                    <button id="redoBtn" class="tool-btn" title="Вернуть (Ctrl+Y)">↪️ Вернуть</button>
                </div>
                <div class="toolbar-section">
                    <span class="toolbar-title">💾 Сохранение</span>
                    <button id="saveLocalBtn" class="tool-btn save-btn" title="Сохранить локально">💾 Сохранить</button>
                </div>
                <div class="toolbar-section">
                    <span class="toolbar-title">⚙️ Настройки</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="dragToggle" checked>
                        <span class="toggle-slider"></span>
                        <span>📌 Перетаскивание</span>
                    </label>
                </div>
                <button id="exitEditorBtn" class="exit-btn" title="Выйти из редактора">✕ Выйти</button>
            </div>
        `;

        document.body.appendChild(toolbar);

        // Кнопки
        document.getElementById('undoBtn')?.addEventListener('click', () => window.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => window.redo());
        document.getElementById('saveLocalBtn')?.addEventListener('click', () => window.saveToLocalFile());
        document.getElementById('exitEditorBtn')?.addEventListener('click', () => disableEditMode());

        // Перетаскивание
        document.getElementById('dragToggle')?.addEventListener('change', (e) => {
            window.editorState.dragEnabled = e.target.checked;
            window.showToast(window.editorState.dragEnabled ? '📌 Перетаскивание включено' : '📌 Перетаскивание выключено');
        });
    }

    function removeToolbar() {
        if (toolbar) {
            toolbar.remove();
            toolbar = null;
        }
    }

    // ========== РЕЖИМ РЕДАКТИРОВАНИЯ ==========
    function makeBlocksEditable() {
        // Добавляем класс editable-block всем элементам, которые можно редактировать
        const selectors = [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li',
            '.role-card', '.service-card', '.benefit-card', '.process-card',
            '.stat-item', '.quiz-card', '.checklist-card', '.calendar-card',
            '.hero-content', '.hero-text', 'img', '.hero-image', '.small-note'
        ];
        document.querySelectorAll(selectors.join(',')).forEach(el => {
            el.classList.add('editable-block');
        });
    }

    function enableEditMode() {
        if (isEditModeActive) return;
        isEditModeActive = true;
        window.editorState.isEditMode = true;

        document.body.classList.add('block-edit-mode');
        makeBlocksEditable();
        createToolbar();
        window.createPropertyPanel();

        window.showToast('🎨 Режим редактирования включён');
        window.showToast('✏️ Клик — выделить блок | Двойной клик — редактировать текст');
    }

    function disableEditMode() {
        if (!isEditModeActive) return;
        isEditModeActive = false;
        window.editorState.isEditMode = false;

        document.body.classList.remove('block-edit-mode');
        removeToolbar();
        window.hidePropertyPanel();
        window.clearSelection();

        // Убираем contenteditable у всех элементов
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.contentEditable = 'false';
        });

        window.showToast('✨ Режим редактирования выключен');
    }

    function toggleEditMode() {
        if (isEditModeActive) {
            disableEditMode();
        } else {
            enableEditMode();
        }
    }

    // ========== ОБРАБОТЧИКИ ==========
    function handleClick(e) {
        if (!isEditModeActive) return;
        if (window.isProtectedElement(e.target)) return;

        const block = window.getBlock(e.target);
        if (block && !e.target.closest('.resize-marker') && !e.target.closest('.format-toolbar')) {
            e.preventDefault();
            e.stopPropagation();
            window.selectElement(block);
            window.showPropertyPanel(block);
        } else if (!e.target.closest('.resize-marker') && !e.target.closest('.format-toolbar')) {
            window.clearSelection();
            window.hidePropertyPanel();
        }
    }

    function handleDoubleClick(e) {
        if (!isEditModeActive) return;
        if (window.isProtectedElement(e.target)) return;

        // Находим текстовый элемент
        let textElement = e.target;
        const editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'DIV'];

        while (textElement && !editableTags.includes(textElement.tagName)) {
            textElement = textElement.parentElement;
        }

        if (textElement && !textElement.closest('.resize-marker, .format-toolbar')) {
            e.preventDefault();
            e.stopPropagation();
            window.clearSelection();
            makeTextEditable(textElement);
        }
    }

    function makeTextEditable(element) {
        if (!element || element.contentEditable === 'true') return;

        element.contentEditable = 'true';
        element.focus();

        const rect = element.getBoundingClientRect();
        window.showFormatToolbar(element, rect);

        element.addEventListener('blur', () => {
            element.contentEditable = 'false';
            window.hideFormatToolbar();
            window.saveToHistory();
            window.showToast('✅ Текст сохранён');
        }, { once: true });

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.execCommand('insertLineBreak');
            }
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                document.execCommand('bold');
            }
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                document.execCommand('italic');
            }
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                document.execCommand('underline');
            }
        });
    }

    // ========== КНОПКА ВКЛЮЧЕНИЯ РЕДАКТОРА ==========
    function addEditorToggleButton() {
        if (document.getElementById('editorToggleBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'editorToggleBtn';
        btn.innerHTML = '✏️ Редактировать сайт';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, #2D6A9F, #1D4D7A);
            color: white;
            border: none;
            border-radius: 40px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
        `;

        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        };
        btn.onclick = toggleEditMode;

        document.body.appendChild(btn);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initEditor() {
        window.log('🚀 Инициализация редактора...');

        window.initEditorHistory();

        document.addEventListener('click', handleClick);
        document.addEventListener('dblclick', handleDoubleClick);

        addEditorToggleButton();

        window.log('✅ Редактор инициализирован');
        window.log('💡 Нажмите кнопку "✏️ Редактировать сайт" в правом нижнем углу');
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditor);
    } else {
        initEditor();
    }
})();