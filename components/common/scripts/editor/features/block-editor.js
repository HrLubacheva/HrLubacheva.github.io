// ========== УНИВЕРСАЛЬНЫЙ РЕДАКТОР ЛЮБЫХ БЛОКОВ ==========
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';

let selectedBlock = null;
let isResizing = false;
let dragStartX, dragStartY;
let startWidth, startHeight;
let currentHandle = null;
let sizeIndicator = null;

const MIN_WIDTH = 40;
const MIN_HEIGHT = 40;

// Стили
function addStyles() {
    if (document.getElementById('block-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-editor-styles';
    style.textContent = `
        body.block-edit-mode .editable-block.selected {
            outline: 3px solid #ff9800 !important;
            outline-offset: 2px;
            position: relative;
            z-index: 9999;
        }
        body.block-edit-mode img.editable-block.selected {
            outline: 3px solid #ff9800 !important;
        }
        .resize-marker {
            position: fixed;
            width: 12px;
            height: 12px;
            background: white;
            border: 2px solid #ff9800;
            border-radius: 50%;
            z-index: 10000;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .resize-marker:hover {
            transform: scale(1.2);
            background: #ff9800;
        }
        .size-indicator {
            position: fixed;
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-family: monospace;
            z-index: 10001;
            pointer-events: none;
        }
        body.block-edit-mode [contenteditable="true"] {
            outline: 2px solid #2D6A9F !important;
            background: rgba(45,106,159,0.05);
            padding: 8px;
            border-radius: 8px;
            min-width: 50px;
            display: inline-block;
        }
        /* Защита элементов редактора */
        .editor-toolbar, .editor-toolbar *,
        .slides-panel, .slides-panel *,
        #editorToggle,
        .resize-marker {
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(style);
}

// Защищённые элементы редактора
function isProtectedElement(element) {
    if (!element) return true;
    const protectedSelectors = [
        '.editor-toolbar', '.editor-toolbar *',
        '.resize-marker',
        '#editorToggle', '.editor-toggle-btn',
        '.slides-panel', '.slides-panel *',
        'button', '.btn-primary', '.btn-secondary',
        '.tab-btn', '.tool-btn', '.action-btn', '.exit-btn'
    ];
    for (const selector of protectedSelectors) {
        if (element.matches?.(selector) || element.closest?.(selector)) {
            return true;
        }
    }
    return false;
}

// Найти редактируемый блок
function getBlock(element) {
    if (!element) return null;
    let current = element;
    while (current && current !== document.body) {
        if (current.classList?.contains('editable-block')) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

// Показать маркеры изменения размера
function showResizeMarkers(block) {
    hideResizeMarkers();
    const rect = block.getBoundingClientRect();
    const markers = [
        { name: 'se', left: rect.left + rect.width - 6, top: rect.top + rect.height - 6, cursor: 'se-resize' },
        { name: 'sw', left: rect.left - 6, top: rect.top + rect.height - 6, cursor: 'sw-resize' },
        { name: 'ne', left: rect.left + rect.width - 6, top: rect.top - 6, cursor: 'ne-resize' },
        { name: 'nw', left: rect.left - 6, top: rect.top - 6, cursor: 'nw-resize' }
    ];
    markers.forEach(m => {
        const marker = document.createElement('div');
        marker.className = 'resize-marker';
        marker.style.left = m.left + 'px';
        marker.style.top = m.top + 'px';
        marker.style.cursor = m.cursor;
        marker.setAttribute('data-handle', m.name);
        marker.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startResize(e, block, m.name);
        });
        document.body.appendChild(marker);
    });
}

function hideResizeMarkers() {
    document.querySelectorAll('.resize-marker').forEach(m => m.remove());
    if (sizeIndicator) sizeIndicator.remove();
    sizeIndicator = null;
}

function startResize(e, block, handle) {
    isResizing = true;
    currentHandle = handle;
    const rect = block.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startWidth = rect.width;
    startHeight = rect.height;
    sizeIndicator = document.createElement('div');
    sizeIndicator.className = 'size-indicator';
    document.body.appendChild(sizeIndicator);
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
    if (!isResizing || !selectedBlock) return;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    let newWidth = startWidth;
    let newHeight = startHeight;
    if (currentHandle.includes('e')) newWidth = startWidth + deltaX;
    if (currentHandle.includes('w')) newWidth = startWidth - deltaX;
    if (currentHandle.includes('s')) newHeight = startHeight + deltaY;
    if (currentHandle.includes('n')) newHeight = startHeight - deltaY;
    newWidth = Math.max(MIN_WIDTH, newWidth);
    newHeight = Math.max(MIN_HEIGHT, newHeight);
    selectedBlock.style.width = newWidth + 'px';
    selectedBlock.style.height = newHeight + 'px';
    if (sizeIndicator) {
        sizeIndicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
        sizeIndicator.style.left = (e.clientX + 15) + 'px';
        sizeIndicator.style.top = (e.clientY - 30) + 'px';
    }
    showResizeMarkers(selectedBlock);
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        currentHandle = null;
        if (sizeIndicator) sizeIndicator.remove();
        sizeIndicator = null;
        saveToHistory();
        showToast('✅ Размер изменён');
    }
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
}

// Выделение блока
function selectBlock(block) {
    if (selectedBlock === block) return;
    if (selectedBlock) {
        selectedBlock.classList.remove('selected');
        hideResizeMarkers();
    }
    selectedBlock = block;
    selectedBlock.classList.add('selected');
    // Показываем маркеры только для изображений
    if (block.tagName === 'IMG') {
        showResizeMarkers(block);
    }
}

function clearSelection() {
    if (selectedBlock) {
        selectedBlock.classList.remove('selected');
        hideResizeMarkers();
        selectedBlock = null;
    }
}

// Сделать любой элемент редактируемым
function makeEditable(element) {
    if (!element) return;
    if (element.contentEditable === 'true') return;

    element.contentEditable = 'true';
    element.focus();

    // Сохраняем при потере фокуса
    const saveOnBlur = () => {
        element.contentEditable = 'false';
        element.removeEventListener('blur', saveOnBlur);
        saveToHistory();
        showToast('✅ Текст сохранён');
    };
    element.addEventListener('blur', saveOnBlur, { once: true });

    // Enter для переноса строки (не закрывает редактирование)
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertLineBreak');
        }
    }, { once: true });
}

// Инициализация
export function initBlockEditor() {
    addStyles();

    // Все редактируемые блоки: текст, карточки, заголовки, параграфы, списки
    const allBlocks = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, .role-card, .service-card, .benefit-card, .process-card, .stat-item, .quiz-card, .checklist-card, .calendar-card, .hero-content, .hero-text, .contact-line, img');

    allBlocks.forEach(block => {
        block.classList.add('editable-block');
    });

    // Клик для выделения
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('block-edit-mode')) return;
        if (isProtectedElement(e.target)) return;

        const block = getBlock(e.target);
        if (block && !e.target.closest('.resize-marker')) {
            e.preventDefault();
            e.stopPropagation();
            selectBlock(block);
        } else if (!e.target.closest('.resize-marker')) {
            clearSelection();
        }
    });

    // Двойной клик для редактирования ЛЮБОГО текстового блока
    document.addEventListener('dblclick', (e) => {
        if (!document.body.classList.contains('block-edit-mode')) return;
        if (isProtectedElement(e.target)) return;

        // Находим редактируемый элемент
        let target = e.target;
        const editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'DIV', 'A', 'TD', 'TH'];

        if (editableTags.includes(target.tagName) || target.closest('.role-card, .service-card, .benefit-card, .process-card, .stat-item, .quiz-card, .checklist-card, .calendar-card, .hero-content, .hero-text, .contact-line')) {
            const editableElement = target.tagName === 'DIV' && !target.innerText ? target.querySelector('p, h1, h2, h3, h4, li') || target : target;
            makeEditable(editableElement);
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

export function enableBlockEditMode() {
    document.body.classList.add('block-edit-mode');
    showToast('🎨 Режим редактирования включён');
    showToast('✏️ Двойной клик по любому тексту | 📏 Тяните за углы фото');
}

export function disableBlockEditMode() {
    document.body.classList.remove('block-edit-mode');
    clearSelection();
    // Закрываем все активные редакторы
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.contentEditable = 'false';
    });
    showToast('✨ Режим редактирования выключен');
}

export function toggleGrid() {}
export function toggleSnap() {}