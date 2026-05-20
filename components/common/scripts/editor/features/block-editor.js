// ========== МИНИМАЛЬНЫЙ РЕДАКТОР ==========
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';

let selectedBlock = null;
let isResizing = false;
let dragStartX, dragStartY;
let startWidth, startHeight;
let currentHandle = null;
let sizeIndicator = null;

const MIN_WIDTH = 50;
const MIN_HEIGHT = 50;

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
            cursor: pointer;
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
        body.block-edit-mode p[contenteditable="true"],
        body.block-edit-mode h1[contenteditable="true"],
        body.block-edit-mode h2[contenteditable="true"],
        body.block-edit-mode h3[contenteditable="true"],
        body.block-edit-mode h4[contenteditable="true"] {
            outline: 2px solid #2D6A9F !important;
            background: rgba(45,106,159,0.05);
            padding: 8px;
            border-radius: 8px;
        }
    `;
    document.head.appendChild(style);
}

function isEditorElement(element) {
    if (!element) return true;
    const protectedSelectors = [
        '.editor-toolbar', '.editor-toolbar *',
        '.resize-marker',
        '#editorToggle', '.editor-toggle-btn',
        '.property-panel', '.property-panel *',
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

function showResizeMarkers(img) {
    hideResizeMarkers();
    const rect = img.getBoundingClientRect();
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
            startResize(e, img, m.name);
        });
        document.body.appendChild(marker);
    });
}

function hideResizeMarkers() {
    document.querySelectorAll('.resize-marker').forEach(m => m.remove());
    if (sizeIndicator) sizeIndicator.remove();
    sizeIndicator = null;
}

function startResize(e, img, handle) {
    isResizing = true;
    currentHandle = handle;
    const rect = img.getBoundingClientRect();
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

function selectBlock(block) {
    if (selectedBlock === block) return;
    if (selectedBlock) {
        selectedBlock.classList.remove('selected');
        hideResizeMarkers();
    }
    selectedBlock = block;
    selectedBlock.classList.add('selected');
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

export function initBlockEditor() {
    addStyles();
    const allBlocks = document.querySelectorAll('img, p, h1, h2, h3, h4');
    allBlocks.forEach(block => {
        block.classList.add('editable-block');
    });
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('block-edit-mode')) return;
        const block = getBlock(e.target);
        if (block && !isEditorElement(e.target) && !e.target.closest('.resize-marker')) {
            e.preventDefault();
            e.stopPropagation();
            selectBlock(block);
        } else if (!e.target.closest('.resize-marker')) {
            clearSelection();
        }
    });
    document.addEventListener('dblclick', (e) => {
        if (!document.body.classList.contains('block-edit-mode')) return;
        const block = getBlock(e.target);
        if (block && (block.tagName === 'P' || block.tagName === 'H1' || block.tagName === 'H2' || block.tagName === 'H3' || block.tagName === 'H4')) {
            block.contentEditable = 'true';
            block.focus();
            block.addEventListener('blur', () => {
                block.contentEditable = 'false';
                saveToHistory();
                showToast('✅ Текст сохранён');
            }, { once: true });
        }
    });
}

export function enableBlockEditMode() {
    document.body.classList.add('block-edit-mode');
    showToast('🎨 Режим редактирования включён');
    showToast('✏️ Двойной клик по тексту | 📏 Тяните за углы фото');
}

export function disableBlockEditMode() {
    document.body.classList.remove('block-edit-mode');
    clearSelection();
    showToast('✨ Режим редактирования выключен');
}