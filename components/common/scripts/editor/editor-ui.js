// components/common/scripts/editor/editor-ui.js
// Панели и UI редактора

(function() {
    'use strict';

    let propertyPanel = null;
    let formatToolbar = null;
    let resizeMarkers = [];
    let sizeIndicator = null;
    let isResizing = false;
    let resizeElement = null;
    let resizeHandle = null;
    let resizeStartX = 0, resizeStartY = 0;
    let resizeStartWidth = 0, resizeStartHeight = 0;

    const MIN_WIDTH = 40;
    const MIN_HEIGHT = 40;

    // ========== РЕСАЙЗ МАРКЕРЫ ==========
    window.showResizeMarkers = function(element) {
        window.hideResizeMarkers();
        if (!element) return;

        resizeElement = element;
        const rect = element.getBoundingClientRect();

        const handles = [
            { name: 'se', left: rect.left + rect.width - 8, top: rect.top + rect.height - 8, cursor: 'se-resize' },
            { name: 'sw', left: rect.left - 8, top: rect.top + rect.height - 8, cursor: 'sw-resize' },
            { name: 'ne', left: rect.left + rect.width - 8, top: rect.top - 8, cursor: 'ne-resize' },
            { name: 'nw', left: rect.left - 8, top: rect.top - 8, cursor: 'nw-resize' }
        ];

        handles.forEach(handle => {
            const marker = document.createElement('div');
            marker.className = 'resize-marker';
            marker.style.left = handle.left + 'px';
            marker.style.top = handle.top + 'px';
            marker.style.cursor = handle.cursor;
            marker.setAttribute('data-handle', handle.name);

            marker.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startResize(e, element, handle.name);
            });

            document.body.appendChild(marker);
            resizeMarkers.push(marker);
        });
    };

    window.hideResizeMarkers = function() {
        resizeMarkers.forEach(m => m.remove());
        resizeMarkers = [];
        if (sizeIndicator) {
            sizeIndicator.remove();
            sizeIndicator = null;
        }
        resizeElement = null;
    };

    function startResize(e, el, handle) {
        isResizing = true;
        resizeElement = el;
        resizeHandle = handle;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;

        const rect = el.getBoundingClientRect();
        resizeStartWidth = rect.width;
        resizeStartHeight = rect.height;

        sizeIndicator = document.createElement('div');
        sizeIndicator.className = 'size-indicator';
        document.body.appendChild(sizeIndicator);

        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
    }

    function onResize(e) {
        if (!isResizing || !resizeElement) return;

        const deltaX = e.clientX - resizeStartX;
        const deltaY = e.clientY - resizeStartY;
        let newWidth = resizeStartWidth;
        let newHeight = resizeStartHeight;

        if (resizeHandle.includes('e')) newWidth = resizeStartWidth + deltaX;
        if (resizeHandle.includes('w')) newWidth = resizeStartWidth - deltaX;
        if (resizeHandle.includes('s')) newHeight = resizeStartHeight + deltaY;
        if (resizeHandle.includes('n')) newHeight = resizeStartHeight - deltaY;

        newWidth = Math.max(MIN_WIDTH, newWidth);
        newHeight = Math.max(MIN_HEIGHT, newHeight);

        resizeElement.style.width = newWidth + 'px';
        resizeElement.style.height = newHeight + 'px';

        if (sizeIndicator) {
            sizeIndicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
            sizeIndicator.style.left = (e.clientX + 15) + 'px';
            sizeIndicator.style.top = (e.clientY - 30) + 'px';
        }

        window.showResizeMarkers(resizeElement);
    }

    function stopResize() {
        isResizing = false;
        if (sizeIndicator) {
            sizeIndicator.remove();
            sizeIndicator = null;
        }
        window.saveToHistory();
        window.showToast('✅ Размер изменён');
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
    }

    // ========== ФОРМАТИРОВАНИЕ ТЕКСТА ==========
    window.showFormatToolbar = function(element, rect) {
        window.hideFormatToolbar();

        formatToolbar = document.createElement('div');
        formatToolbar.className = 'format-toolbar';
        formatToolbar.style.left = rect.left + 'px';
        formatToolbar.style.top = (rect.top - 50) + 'px';
        formatToolbar.innerHTML = `
            <button data-cmd="bold" title="Жирный (Ctrl+B)"><b>Ж</b></button>
            <button data-cmd="italic" title="Курсив (Ctrl+I)"><i>К</i></button>
            <button data-cmd="underline" title="Подчёркнутый (Ctrl+U)"><u>Ч</u></button>
            <span class="separator"></span>
            <button data-cmd="justifyLeft" title="По левому краю">◀</button>
            <button data-cmd="justifyCenter" title="По центру">◀▶</button>
            <button data-cmd="justifyRight" title="По правому краю">▶</button>
            <span class="separator"></span>
            <button data-cmd="insertUnorderedList" title="Маркированный список">•</button>
            <button data-cmd="insertOrderedList" title="Нумерованный список">1.</button>
        `;

        formatToolbar.querySelectorAll('[data-cmd]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand(btn.dataset.cmd, false, null);
                element.focus();
                window.saveToHistory();
                window.showToast('✅ Форматирование применено');
            });
        });

        document.body.appendChild(formatToolbar);
    };

    window.hideFormatToolbar = function() {
        if (formatToolbar) {
            formatToolbar.remove();
            formatToolbar = null;
        }
    };

    // ========== ПАНЕЛЬ СВОЙСТВ ==========
    window.createPropertyPanel = function() {
        if (propertyPanel) return;

        propertyPanel = document.createElement('div');
        propertyPanel.className = 'property-panel';
        propertyPanel.innerHTML = `
            <div class="panel-header">
                <span>📐 Свойства блока</span>
                <button id="closePropertyPanel">✕</button>
            </div>
            <div class="panel-content">
                <div class="prop-group">
                    <label>📏 Ширина (px)</label>
                    <input type="number" id="propWidth" step="10" placeholder="auto">
                </div>
                <div class="prop-group">
                    <label>📏 Высота (px)</label>
                    <input type="number" id="propHeight" step="10" placeholder="auto">
                </div>
                <div class="prop-group">
                    <label>📐 Отступ внутри (padding)</label>
                    <input type="text" id="propPadding" placeholder="20px 15px">
                </div>
                <div class="prop-group">
                    <label>📐 Отступ снаружи (margin)</label>
                    <input type="text" id="propMargin" placeholder="10px 0">
                </div>
                <div class="prop-group">
                    <label>🎯 Выравнивание</label>
                    <select id="propAlign">
                        <option value="left">По левому краю</option>
                        <option value="center">По центру</option>
                        <option value="right">По правому краю</option>
                    </select>
                </div>
                <div class="prop-group">
                    <button id="propLockBtn" class="lock-prop-btn">🔒 Заблокировать</button>
                </div>
                <div class="prop-group">
                    <button id="propDuplicateBtn" class="duplicate-prop-btn">📋 Дублировать</button>
                </div>
                <div class="prop-group">
                    <button id="propDeleteBtn" class="delete-prop-btn">🗑️ Удалить</button>
                </div>
            </div>
        `;

        document.body.appendChild(propertyPanel);

        document.getElementById('closePropertyPanel')?.addEventListener('click', () => {
            propertyPanel.classList.remove('show');
        });

        // Применение изменений
        document.getElementById('propWidth')?.addEventListener('change', (e) => {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.width = e.target.value ? e.target.value + 'px' : '';
                window.saveToHistory();
            }
        });

        document.getElementById('propHeight')?.addEventListener('change', (e) => {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.height = e.target.value ? e.target.value + 'px' : '';
                window.saveToHistory();
            }
        });

        document.getElementById('propPadding')?.addEventListener('change', (e) => {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.padding = e.target.value;
                window.saveToHistory();
            }
        });

        document.getElementById('propMargin')?.addEventListener('change', (e) => {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.margin = e.target.value;
                window.saveToHistory();
            }
        });

        document.getElementById('propAlign')?.addEventListener('change', (e) => {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.textAlign = e.target.value;
                window.saveToHistory();
            }
        });

        document.getElementById('propLockBtn')?.addEventListener('click', () => {
            if (window.editorState.selectedElement) {
                window.toggleBlockLock(window.editorState.selectedElement);
            }
        });

        document.getElementById('propDuplicateBtn')?.addEventListener('click', () => {
            if (window.editorState.selectedElement && !window.isBlockLocked(window.editorState.selectedElement)) {
                const clone = window.editorState.selectedElement.cloneNode(true);
                clone.classList.remove('selected');
                window.editorState.selectedElement.parentNode.insertBefore(clone, window.editorState.selectedElement.nextSibling);
                window.saveToHistory();
                window.showToast('✅ Блок продублирован');
            }
        });

        document.getElementById('propDeleteBtn')?.addEventListener('click', () => {
            if (window.editorState.selectedElement && !window.isBlockLocked(window.editorState.selectedElement)) {
                if (confirm('Удалить этот блок?')) {
                    window.editorState.selectedElement.remove();
                    window.clearSelection();
                    propertyPanel.classList.remove('show');
                    window.saveToHistory();
                    window.showToast('✅ Блок удалён');
                }
            }
        });
    };

    window.showPropertyPanel = function(element) {
        if (!propertyPanel) window.createPropertyPanel();
        propertyPanel.classList.add('show');

        // Заполняем текущие значения
        document.getElementById('propWidth').value = parseInt(element.style.width) || '';
        document.getElementById('propHeight').value = parseInt(element.style.height) || '';
        document.getElementById('propPadding').value = element.style.padding || '';
        document.getElementById('propMargin').value = element.style.margin || '';
        document.getElementById('propAlign').value = element.style.textAlign || 'left';
    };

    window.hidePropertyPanel = function() {
        if (propertyPanel) propertyPanel.classList.remove('show');
    };

    window.log('✅ editor-ui.js загружен');
})();