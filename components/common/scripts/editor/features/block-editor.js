// ========== УНИВЕРСАЛЬНЫЙ РЕДАКТОР ТЕКСТА И РАЗМЕРОВ (финальная версия) ==========
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { setResizeHandlers, setFormatToolbarHandler } from './selection.js';
import { initDragDrop } from './dragndrop.js';

let selectedBlock = null;
let isResizing = false;
let dragStartX, dragStartY;
let startWidth, startHeight;
let currentHandle = null;
let sizeIndicator = null;
let formatToolbar = null;
let rafId = null;

const MIN_WIDTH = 40;
const MIN_HEIGHT = 40;

function addStyles() {
    if (document.getElementById('block-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-editor-styles';
    style.textContent = `
        body.block-edit-mode .editable-block.selected {
            outline: 3px solid #ff9800 !important;
            outline-offset: 2px;
            position: relative !important;
            z-index: 9999;
            flex: none !important;
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
            padding: 0 !important;
            border-radius: 0 !important;
            min-width: 50px;
            display: inline-block;
        }
        .format-toolbar {
            position: fixed;
            background: white;
            border-radius: 12px;
            padding: 8px 12px;
            display: flex;
            gap: 6px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10002;
            border: 1px solid #e0e0e0;
        }
        .format-toolbar button {
            background: none;
            border: none;
            padding: 6px 10px;
            cursor: pointer;
            border-radius: 6px;
            font-size: 14px;
        }
        .format-toolbar button:hover {
            background: #f0f0f0;
        }
        .format-toolbar .separator {
            width: 1px;
            background: #ddd;
            margin: 0 4px;
        }
    `;
    document.head.appendChild(style);
}

function isProtectedElement(element) {
    if (!element) return true;
    const protectedSelectors = [
        '.editor-toolbar', '.editor-toolbar *',
        '.resize-marker',
        '#editorToggle', '.editor-toggle-btn',
        '.slides-panel', '.slides-panel *',
        '.format-toolbar', '.format-toolbar *',
        '.property-panel', '.property-panel *',
        '.history-panel', '.history-panel *',
        '.editor-hint',
        '.editor-grid-overlay',
        'button', '.btn-primary', '.btn-secondary',
        '.tab-btn', '.tool-btn', '.action-btn', '.exit-btn',
        '.history-tab', '.history-restore', '.history-view',
        '.slide-up', '.slide-down', '.slide-edit',
        '.duplicate-prop-btn', '.delete-prop-btn', '.lock-prop-btn',
        '.move-up-btn', '.move-down-btn'
    ];
    for (const selector of protectedSelectors) {
        if (element.matches?.(selector) || element.closest?.(selector)) return true;
    }
    return false;
}

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

export function showResizeMarkers(element) {
    hideResizeMarkers();
    const rect = element.getBoundingClientRect();
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
            startResize(e, element, m.name);
        });
        document.body.appendChild(marker);
    });
}

export function hideResizeMarkers() {
    document.querySelectorAll('.resize-marker').forEach(m => m.remove());
    if (sizeIndicator) sizeIndicator.remove();
    sizeIndicator = null;
}

function startResize(e, el, handle) {
    isResizing = true;
    currentHandle = handle;
    const rect = el.getBoundingClientRect();
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
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
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
        rafId = null;
    });
}

function stopResize() {
    if (rafId) cancelAnimationFrame(rafId);
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

export function showFormatToolbar(element, rect) {
    hideFormatToolbar();
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
            const cmd = btn.dataset.cmd;
            document.execCommand(cmd, false, null);
            element.focus();
            saveToHistory();
            showToast(`✅ Форматирование применено`);
        });
    });
    document.body.appendChild(formatToolbar);
}

export function hideFormatToolbar() {
    if (formatToolbar) {
        formatToolbar.remove();
        formatToolbar = null;
    }
}

function selectBlock(block) {
    if (selectedBlock === block) return;
    if (selectedBlock) {
        selectedBlock.classList.remove('selected');
        hideResizeMarkers();
        hideFormatToolbar();
    }
    selectedBlock = block;
    selectedBlock.classList.add('selected');
    showResizeMarkers(block);
}

function makeEditable(element) {
    if (!element) return;
    if (element.contentEditable === 'true') return;
    element.contentEditable = 'true';
    element.focus();
    const rect = element.getBoundingClientRect();
    showFormatToolbar(element, rect);
    const saveOnBlur = () => {
        element.contentEditable = 'false';
        element.removeEventListener('blur', saveOnBlur);
        hideFormatToolbar();
        saveToHistory();
        showToast('✅ Текст сохранён');
    };
    element.addEventListener('blur', saveOnBlur, { once: true });
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertLineBreak');
        }
        if (e.ctrlKey && e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
        if (e.ctrlKey && e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
        if (e.ctrlKey && e.key === 'u') { e.preventDefault(); document.execCommand('underline'); }
    });
}

export function initBlockEditor() {
    addStyles();
    setResizeHandlers(showResizeMarkers, hideResizeMarkers);
    setFormatToolbarHandler(hideFormatToolbar);

    const allBlocks = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, .role-card, .service-card, .benefit-card, .process-card, .stat-item, .quiz-card, .checklist-card, .calendar-card, .hero-content, .hero-text, .contact-line, img, .hero-image, .hero-text-card, .hero-image-card, .image-card, .small-note, .hero-subtitle');
    allBlocks.forEach(block => block.classList.add('editable-block'));

    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('block-edit-mode')) return;
        if (isProtectedElement(e.target)) return;
        const block = getBlock(e.target);
        if (block && !e.target.closest('.resize-marker') && !e.target.closest('.format-toolbar')) {
            e.preventDefault();
            e.stopPropagation();
            selectBlock(block);
        } else if (!e.target.closest('.resize-marker') && !e.target.closest('.format-toolbar')) {
            if (selectedBlock) {
                selectedBlock.classList.remove('selected');
                selectedBlock = null;
                hideResizeMarkers();
                hideFormatToolbar();
            }
        }
    });

    document.addEventListener('dblclick', (e) => {
        if (!document.body.classList.contains('block-edit-mode')) return;
        if (isProtectedElement(e.target)) return;
        let textElement = null;
        let target = e.target;
        const editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'DIV', 'A', 'TD', 'TH'];
        while (target && target !== document.body) {
            if (editableTags.includes(target.tagName)) {
                textElement = target;
                break;
            }
            target = target.parentElement;
        }
        if (textElement && !textElement.closest('.resize-marker, .format-toolbar')) {
            e.preventDefault();
            e.stopPropagation();
            if (selectedBlock) {
                selectedBlock.classList.remove('selected');
                selectedBlock = null;
                hideResizeMarkers();
                hideFormatToolbar();
            }
            makeEditable(textElement);
        }
    });
}

export function enableBlockEditMode() {
    document.body.classList.add('block-edit-mode');
    state.dragEnabled = true;
    initDragDrop();
    showToast('🎨 Режим редактирования включён');
    showToast('✏️ Двойной клик по любому тексту | 📏 Тяните за углы любого блока');
}

export function disableBlockEditMode() {
    document.body.classList.remove('block-edit-mode');
    if (selectedBlock) {
        selectedBlock.classList.remove('selected');
        selectedBlock = null;
    }
    hideResizeMarkers();
    hideFormatToolbar();
    document.querySelectorAll('[contenteditable="true"]').forEach(el => el.contentEditable = 'false');
    showToast('✨ Режим редактирования выключен');
}

export function toggleGrid() {}
export function toggleSnap() {}