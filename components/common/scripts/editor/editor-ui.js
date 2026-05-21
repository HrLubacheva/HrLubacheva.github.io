/**
 * Editor UI Module
 * Управляет панелями, ресайзом блоков и форматированием текста
 *
 * @module editor-ui
 */

(function() {
    'use strict';

    var propertyPanel = null;
    var formatToolbar = null;
    var resizeMarkers = [];
    var sizeIndicator = null;
    var isResizing = false;
    var resizeElement = null;
    var resizeHandle = null;
    var resizeStartX = 0, resizeStartY = 0;
    var resizeStartWidth = 0, resizeStartHeight = 0;
    var resizeStartLeft = 0, resizeStartTop = 0;
    var resizeElementPosition = null;

    var MIN_WIDTH = 40;
    var MIN_HEIGHT = 40;

    // ========== РЕСАЙЗ МАРКЕРЫ (на углах И на краях) ==========
    window.showResizeMarkers = function(element) {
        window.hideResizeMarkers();
        if (!element) return;

        resizeElement = element;

        // Получаем позицию элемента
        var rect = element.getBoundingClientRect();
        var computedStyle = window.getComputedStyle(element);
        var position = computedStyle.position;

        // Запоминаем позиционирование
        if (position === 'static') {
            element.style.position = 'relative';
        }
        resizeElementPosition = position;

        // 8 маркеров: 4 угла + 4 стороны
        var markers = [
            // Углы
            { name: 'nw', left: rect.left - 6, top: rect.top - 6, cursor: 'nw-resize' },
            { name: 'n', left: rect.left + rect.width / 2 - 6, top: rect.top - 6, cursor: 'n-resize' },
            { name: 'ne', left: rect.left + rect.width - 6, top: rect.top - 6, cursor: 'ne-resize' },
            { name: 'e', left: rect.left + rect.width - 6, top: rect.top + rect.height / 2 - 6, cursor: 'e-resize' },
            { name: 'se', left: rect.left + rect.width - 6, top: rect.top + rect.height - 6, cursor: 'se-resize' },
            { name: 's', left: rect.left + rect.width / 2 - 6, top: rect.top + rect.height - 6, cursor: 's-resize' },
            { name: 'sw', left: rect.left - 6, top: rect.top + rect.height - 6, cursor: 'sw-resize' },
            { name: 'w', left: rect.left - 6, top: rect.top + rect.height / 2 - 6, cursor: 'w-resize' }
        ];

        markers.forEach(function(handle) {
            var marker = document.createElement('div');
            marker.className = 'resize-marker';
            marker.style.left = handle.left + 'px';
            marker.style.top = handle.top + 'px';
            marker.style.cursor = handle.cursor;
            marker.setAttribute('data-handle', handle.name);

            marker.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                startResize(e, element, handle.name);
            });

            document.body.appendChild(marker);
            resizeMarkers.push(marker);
        });
    };

    window.hideResizeMarkers = function() {
        resizeMarkers.forEach(function(m) {
            if (m && m.remove) m.remove();
        });
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

        var rect = el.getBoundingClientRect();
        resizeStartWidth = rect.width;
        resizeStartHeight = rect.height;
        resizeStartLeft = rect.left;
        resizeStartTop = rect.top;

        // Создаём индикатор размера
        sizeIndicator = document.createElement('div');
        sizeIndicator.className = 'size-indicator';
        document.body.appendChild(sizeIndicator);

        // Добавляем временные стили для плавного ресайза
        el.style.willChange = 'width, height';

        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);

        // Блокируем выделение текста во время ресайза
        document.body.style.userSelect = 'none';
    }

    function onResize(e) {
        if (!isResizing || !resizeElement) return;

        var deltaX = e.clientX - resizeStartX;
        var deltaY = e.clientY - resizeStartY;
        var newWidth = resizeStartWidth;
        var newHeight = resizeStartHeight;
        var newLeft = resizeStartLeft;
        var newTop = resizeStartTop;

        // Изменение размера в зависимости от ручки
        switch(resizeHandle) {
            case 'nw':
                newWidth = resizeStartWidth - deltaX;
                newHeight = resizeStartHeight - deltaY;
                newLeft = resizeStartLeft + deltaX;
                newTop = resizeStartTop + deltaY;
                break;
            case 'n':
                newHeight = resizeStartHeight - deltaY;
                newTop = resizeStartTop + deltaY;
                break;
            case 'ne':
                newWidth = resizeStartWidth + deltaX;
                newHeight = resizeStartHeight - deltaY;
                newTop = resizeStartTop + deltaY;
                break;
            case 'e':
                newWidth = resizeStartWidth + deltaX;
                break;
            case 'se':
                newWidth = resizeStartWidth + deltaX;
                newHeight = resizeStartHeight + deltaY;
                break;
            case 's':
                newHeight = resizeStartHeight + deltaY;
                break;
            case 'sw':
                newWidth = resizeStartWidth - deltaX;
                newHeight = resizeStartHeight + deltaY;
                newLeft = resizeStartLeft + deltaX;
                break;
            case 'w':
                newWidth = resizeStartWidth - deltaX;
                newLeft = resizeStartLeft + deltaX;
                break;
        }

        // Ограничения
        newWidth = Math.max(MIN_WIDTH, newWidth);
        newHeight = Math.max(MIN_HEIGHT, newHeight);

        // Применяем новые размеры
        resizeElement.style.width = newWidth + 'px';
        resizeElement.style.height = newHeight + 'px';

        // Если элемент позиционирован, обновляем позицию
        if (resizeElement.style.position !== 'static') {
            if (newLeft !== resizeStartLeft) {
                resizeElement.style.left = newLeft + 'px';
            }
            if (newTop !== resizeStartTop) {
                resizeElement.style.top = newTop + 'px';
            }
        }

        // Обновляем индикатор размера
        if (sizeIndicator) {
            sizeIndicator.textContent = Math.round(newWidth) + ' × ' + Math.round(newHeight) + ' px';
            sizeIndicator.style.left = (e.clientX + 15) + 'px';
            sizeIndicator.style.top = (e.clientY - 30) + 'px';
        }

        // Обновляем маркеры
        window.showResizeMarkers(resizeElement);
    }

    function stopResize() {
        isResizing = false;

        if (sizeIndicator) {
            sizeIndicator.remove();
            sizeIndicator = null;
        }

        if (resizeElement) {
            resizeElement.style.willChange = '';
        }

        document.body.style.userSelect = '';
        window.saveToHistory();
        if (window.showToast) window.showToast('✅ Размер изменён');

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

        formatToolbar.querySelectorAll('[data-cmd]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                document.execCommand(btn.dataset.cmd, false, null);
                element.focus();
                window.saveToHistory();
                if (window.showToast) window.showToast('✅ Форматирование применено');
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

        document.getElementById('closePropertyPanel')?.addEventListener('click', function() {
            propertyPanel.classList.remove('show');
        });

        // Применение изменений
        document.getElementById('propWidth')?.addEventListener('change', function(e) {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.width = e.target.value ? e.target.value + 'px' : '';
                window.saveToHistory();
            }
        });

        document.getElementById('propHeight')?.addEventListener('change', function(e) {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.height = e.target.value ? e.target.value + 'px' : '';
                window.saveToHistory();
            }
        });

        document.getElementById('propPadding')?.addEventListener('change', function(e) {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.padding = e.target.value;
                window.saveToHistory();
            }
        });

        document.getElementById('propMargin')?.addEventListener('change', function(e) {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.margin = e.target.value;
                window.saveToHistory();
            }
        });

        document.getElementById('propAlign')?.addEventListener('change', function(e) {
            if (window.editorState.selectedElement) {
                window.editorState.selectedElement.style.textAlign = e.target.value;
                window.saveToHistory();
            }
        });

        document.getElementById('propLockBtn')?.addEventListener('click', function() {
            if (window.editorState.selectedElement) {
                window.toggleBlockLock(window.editorState.selectedElement);
            }
        });

        document.getElementById('propDuplicateBtn')?.addEventListener('click', function() {
            if (window.editorState.selectedElement && !window.isBlockLocked(window.editorState.selectedElement)) {
                var clone = window.editorState.selectedElement.cloneNode(true);
                clone.classList.remove('selected');
                clone.querySelectorAll('.resize-marker, .block-hover-toolbar, .element-delete-btn, .element-lock-btn').forEach(function(el) {
                    if (el && el.remove) el.remove();
                });
                var left = parseFloat(window.editorState.selectedElement.style.left) || 0;
                var top = parseFloat(window.editorState.selectedElement.style.top) || 0;
                if (window.editorState.selectedElement.style.position === 'absolute') {
                    clone.style.left = (left + 30) + 'px';
                    clone.style.top = (top + 30) + 'px';
                }
                window.editorState.selectedElement.parentNode.insertBefore(clone, window.editorState.selectedElement.nextSibling);
                window.saveToHistory();
                if (window.showToast) window.showToast('✅ Блок продублирован');
            }
        });

        document.getElementById('propDeleteBtn')?.addEventListener('click', function() {
            if (window.editorState.selectedElement && !window.isBlockLocked(window.editorState.selectedElement)) {
                if (confirm('Удалить этот блок?')) {
                    window.editorState.selectedElement.remove();
                    window.clearSelection();
                    propertyPanel.classList.remove('show');
                    window.saveToHistory();
                    if (window.showToast) window.showToast('✅ Блок удалён');
                }
            }
        });
    };

    window.showPropertyPanel = function(element) {
        if (!propertyPanel) window.createPropertyPanel();
        propertyPanel.classList.add('show');

        document.getElementById('propWidth').value = parseInt(element.style.width) || '';
        document.getElementById('propHeight').value = parseInt(element.style.height) || '';
        document.getElementById('propPadding').value = element.style.padding || '';
        document.getElementById('propMargin').value = element.style.margin || '';
        document.getElementById('propAlign').value = element.style.textAlign || 'left';
    };

    window.hidePropertyPanel = function() {
        if (propertyPanel) propertyPanel.classList.remove('show');
    };

    if (window.log) window.log('✅ editor-ui.js загружен');
})();