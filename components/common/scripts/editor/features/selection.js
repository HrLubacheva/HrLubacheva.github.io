// ========== ВЫДЕЛЕНИЕ ЭЛЕМЕНТОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';

let currentSelected = null;
let isDragging = false;
let isResizing = false;
let dragStartX, dragStartY;
let dragStartLeft, dragStartTop;
let dragStartWidth, dragStartHeight;
let currentResizeHandle = null;
let sizeIndicator = null;

// Проверка, является ли элемент частью редактора (НЕ РЕДАКТИРУЕМ)
function isEditorElement(element) {
    if (!element) return true;

    // Защищённые элементы - их нельзя выделять, перетаскивать, изменять
    const editorSelectors = [
        '.editor-toolbar', '.editor-toolbar *',
        '.property-panel', '.property-panel *',
        '.slides-panel', '.slides-panel *',
        '#editorToggle', '.editor-toggle-btn',
        '.editor-hint', '.editor-hint *',
        '.editor-grid-overlay',
        '.editor-toast',
        '.format-float-bar', '.format-float-bar *',
        '.object-context-menu', '.object-context-menu *',
        '.editor-modal-overlay', '.editor-modal-overlay *',
        '.element-delete-btn', '.element-lock-btn',
        '.resize-handle', '.resize-handles',
        '.image-resize-handle',
        '.slide-editor-toolbar', '.slide-editor-toolbar *',
        '.slides-thumbnails', '.slides-thumbnails *',
        '.slide-canvas-area',
        '.object-properties-panel', '.object-properties-panel *',
        '.slide-editor-container',
        'button', 'button *', '.btn-primary', '.btn-secondary',
        '.tab-btn', '.tool-btn', '.action-btn', '.exit-btn'
    ];

    for (const selector of editorSelectors) {
        if (element.matches?.(selector) || element.closest?.(selector)) {
            return true;
        }
    }
    return false;
}

// Добавляем пунктирную границу всем блокам при наведении (только в режиме редактирования)
function addHoverStyles() {
    if (document.getElementById('editor-hover-styles')) return;

    const style = document.createElement('style');
    style.id = 'editor-hover-styles';
    style.textContent = `
        body.edit-mode-active section,
        body.edit-mode-active .role-card,
        body.edit-mode-active .service-card,
        body.edit-mode-active .benefit-card,
        body.edit-mode-active .process-card,
        body.edit-mode-active .stat-item,
        body.edit-mode-active .quiz-card,
        body.edit-mode-active .checklist-card,
        body.edit-mode-active .calendar-card,
        body.edit-mode-active .editor-text-block,
        body.edit-mode-active .editor-photo-block,
        body.edit-mode-active .editor-video-block,
        body.edit-mode-active .editor-card-block,
        body.edit-mode-active .editor-button-block,
        body.edit-mode-active .editor-divider-block,
        body.edit-mode-active .hero-grid,
        body.edit-mode-active .hero-content,
        body.edit-mode-active .hero-image,
        body.edit-mode-active .container > div,
        body.edit-mode-active section > .container,
        body.edit-mode-active .roles-grid,
        body.edit-mode-active .services-flex,
        body.edit-mode-active .stats-grid,
        body.edit-mode-active .benefits-grid,
        body.edit-mode-active .process-grid,
        body.edit-mode-active p, body.edit-mode-active h1, body.edit-mode-active h2,
        body.edit-mode-active h3, body.edit-mode-active h4, body.edit-mode-active div:not(.no-border),
        body.edit-mode-active img {
            outline: 2px dashed #ccc !important;
            outline-offset: 2px !important;
            transition: outline 0.1s ease;
            cursor: move;
        }
        
        body.edit-mode-active section:hover,
        body.edit-mode-active .role-card:hover,
        body.edit-mode-active .service-card:hover,
        body.edit-mode-active .benefit-card:hover,
        body.edit-mode-active .process-card:hover,
        body.edit-mode-active .stat-item:hover,
        body.edit-mode-active .editor-text-block:hover,
        body.edit-mode-active .editor-photo-block:hover,
        body.edit-mode-active .hero-grid:hover,
        body.edit-mode-active .hero-content:hover,
        body.edit-mode-active .hero-image:hover,
        body.edit-mode-active p:hover, 
        body.edit-mode-active h1:hover, 
        body.edit-mode-active h2:hover,
        body.edit-mode-active h3:hover, 
        body.edit-mode-active img:hover {
            outline: 2px dashed #ff9800 !important;
            outline-offset: 2px !important;
        }
        
        body.edit-mode-active .selected-block {
            outline: 3px solid #ff9800 !important;
            outline-offset: 3px !important;
            background: rgba(255,152,0,0.05);
            z-index: 9999;
            position: relative;
        }
        
        .resize-handle-global {
            position: absolute;
            width: 14px;
            height: 14px;
            background: #ff9800;
            border: 2px solid white;
            border-radius: 50%;
            z-index: 10000;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .resize-handle-global:hover {
            transform: scale(1.2);
            background: #ff5722;
        }
    `;
    document.head.appendChild(style);
}

// Показать ручки изменения размера для выбранного блока
function showResizeHandles(element) {
    hideResizeHandles();

    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    const positions = [
        { name: 'nw', left: rect.left + scrollLeft - 7, top: rect.top + scrollTop - 7, cursor: 'nw-resize' },
        { name: 'n', left: rect.left + scrollLeft + rect.width/2 - 7, top: rect.top + scrollTop - 7, cursor: 'n-resize' },
        { name: 'ne', left: rect.left + scrollLeft + rect.width - 7, top: rect.top + scrollTop - 7, cursor: 'ne-resize' },
        { name: 'w', left: rect.left + scrollLeft - 7, top: rect.top + scrollTop + rect.height/2 - 7, cursor: 'w-resize' },
        { name: 'e', left: rect.left + scrollLeft + rect.width - 7, top: rect.top + scrollTop + rect.height/2 - 7, cursor: 'e-resize' },
        { name: 'sw', left: rect.left + scrollLeft - 7, top: rect.top + scrollTop + rect.height - 7, cursor: 'sw-resize' },
        { name: 's', left: rect.left + scrollLeft + rect.width/2 - 7, top: rect.top + scrollTop + rect.height - 7, cursor: 's-resize' },
        { name: 'se', left: rect.left + scrollLeft + rect.width - 7, top: rect.top + scrollTop + rect.height - 7, cursor: 'se-resize' }
    ];

    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle-global';
        handle.style.left = pos.left + 'px';
        handle.style.top = pos.top + 'px';
        handle.style.cursor = pos.cursor;
        handle.setAttribute('data-resize', pos.name);
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startResize(e, element, pos.name);
        });
        document.body.appendChild(handle);
    });
}

function hideResizeHandles() {
    document.querySelectorAll('.resize-handle-global').forEach(h => h.remove());
    if (sizeIndicator) sizeIndicator.remove();
    sizeIndicator = null;
}

function startResize(e, element, direction) {
    if (isEditorElement(element)) return;

    isResizing = true;
    currentResizeHandle = direction;
    const rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartWidth = rect.width;
    dragStartHeight = rect.height;
    dragStartLeft = rect.left + window.scrollX;
    dragStartTop = rect.top + window.scrollY;

    element.style.position = element.style.position || 'relative';
    element.style.display = 'inline-block';
    if (computed.display === 'inline') element.style.display = 'inline-block';

    document.body.style.cursor = getComputedStyle(e.target).cursor;

    // Индикатор размера
    sizeIndicator = document.createElement('div');
    sizeIndicator.style.cssText = `
        position: fixed;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-family: monospace;
        z-index: 10001;
        pointer-events: none;
        white-space: nowrap;
    `;
    document.body.appendChild(sizeIndicator);

    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
    if (!isResizing || !currentSelected) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    let newWidth = dragStartWidth;
    let newHeight = dragStartHeight;
    let newLeft = dragStartLeft;
    let newTop = dragStartTop;

    if (currentResizeHandle.includes('e')) newWidth = dragStartWidth + deltaX;
    if (currentResizeHandle.includes('w')) {
        newWidth = dragStartWidth - deltaX;
        newLeft = dragStartLeft + deltaX;
    }
    if (currentResizeHandle.includes('s')) newHeight = dragStartHeight + deltaY;
    if (currentResizeHandle.includes('n')) {
        newHeight = dragStartHeight - deltaY;
        newTop = dragStartTop + deltaY;
    }

    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(40, newHeight);

    currentSelected.style.width = newWidth + 'px';
    currentSelected.style.height = newHeight + 'px';
    currentSelected.style.left = newLeft - window.scrollX + 'px';
    currentSelected.style.top = newTop - window.scrollY + 'px';
    if (getComputedStyle(currentSelected).position !== 'absolute') {
        currentSelected.style.position = 'relative';
    }

    if (sizeIndicator) {
        sizeIndicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
        sizeIndicator.style.left = (e.clientX + 15) + 'px';
        sizeIndicator.style.top = (e.clientY - 30) + 'px';
    }

    // Обновляем ручки
    showResizeHandles(currentSelected);
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        currentResizeHandle = null;
        document.body.style.cursor = '';
        if (sizeIndicator) sizeIndicator.remove();
        sizeIndicator = null;
        saveToHistory();
        showToast('✅ Размер изменён');
    }
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
}

export function selectElement(element) {
    // Запрещаем выделение элементов редактора
    if (isEditorElement(element)) {
        return;
    }

    // Снимаем выделение с предыдущего
    if (currentSelected) {
        currentSelected.classList.remove('selected-block');
        hideResizeHandles();
    }

    currentSelected = element;
    currentSelected.classList.add('selected-block');

    // Показываем ручки изменения размера
    showResizeHandles(currentSelected);

    // Показываем панель свойств (опционально)
    import('../ui/property-panel.js').then(module => {
        module.showPropertyPanel(currentSelected);
    });
}

export function getSelectedElement() {
    return currentSelected;
}

export function clearSelection() {
    if (currentSelected) {
        currentSelected.classList.remove('selected-block');
        hideResizeHandles();
        currentSelected = null;
        import('../ui/property-panel.js').then(module => {
            module.hidePropertyPanel();
        });
    }
}

// Инициализация перетаскивания
export function initDragAndResize() {
    addHoverStyles();

    document.addEventListener('mousedown', (e) => {
        // Не перетаскиваем элементы редактора
        if (isEditorElement(e.target)) return;

        // Находим ближайший редактируемый блок
        let target = e.target.closest('section, .role-card, .service-card, .benefit-card, .process-card, .stat-item, .quiz-card, .checklist-card, .calendar-card, .editor-text-block, .editor-photo-block, .editor-video-block, .editor-card-block, .editor-button-block, .editor-divider-block, .hero-grid, .hero-content, .hero-image, p, h1, h2, h3, h4, img, .container > div');

        if (!target) return;
        if (isEditorElement(target)) return;

        // Если клик на ручке изменения размера - не начинаем перетаскивание
        if (e.target.classList?.contains('resize-handle-global')) return;

        e.preventDefault();

        selectElement(target);

        isDragging = true;
        const rect = target.getBoundingClientRect();
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartLeft = rect.left + window.scrollX;
        dragStartTop = rect.top + window.scrollY;

        target.style.position = target.style.position || 'relative';
        target.style.cursor = 'grabbing';
        target.style.zIndex = '9999';

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    });
}

function onDrag(e) {
    if (!isDragging || !currentSelected) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    let newLeft = dragStartLeft + deltaX;
    let newTop = dragStartTop + deltaY;

    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - currentSelected.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - currentSelected.offsetHeight));

    currentSelected.style.position = 'fixed';
    currentSelected.style.left = newLeft + 'px';
    currentSelected.style.top = newTop + 'px';
    currentSelected.style.margin = '0';
    currentSelected.style.zIndex = '9999';
}

function stopDrag() {
    if (isDragging && currentSelected) {
        isDragging = false;
        currentSelected.style.cursor = '';
        currentSelected.style.zIndex = '';
        saveToHistory();
        showToast('✅ Блок перемещён');
        // Обновляем ручки
        showResizeHandles(currentSelected);
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}