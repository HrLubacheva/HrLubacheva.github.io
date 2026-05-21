// ========== ПЕРЕТАСКИВАНИЕ БЛОКОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';

let dragElement = null;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartLeft = 0, dragStartTop = 0;

export function initDragDrop() {
    document.addEventListener('mousedown', startDrag);
}

function startDrag(e) {
    if (e.target.closest('.property-panel, .slides-panel, .history-panel, .editor-toolbar, .format-toolbar')) return;
    if (!state.dragEnabled) return;
    // Не перетаскиваем служебные элементы
    if (e.target.closest('.resize-marker')) return;
    if (e.target.closest('.editor-toolbar')) return;
    if (e.target.closest('.format-toolbar')) return;
    if (e.target.closest('.block-hover-toolbar')) return;

    let target = e.target.closest('.editable-block');
    if (!target) return;
    if (target.classList.contains('locked')) return;

    e.preventDefault();
    e.stopPropagation();

    dragElement = target;
    const rect = dragElement.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartLeft = rect.left + window.scrollX;
    dragStartTop = rect.top + window.scrollY;

    dragElement.style.position = 'absolute';
    dragElement.style.cursor = 'grabbing';
    dragElement.style.zIndex = '100000';
    dragElement.style.opacity = '0.8';
    dragElement.style.margin = '0';

    isDragging = true;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!isDragging || !dragElement) return;
    let newLeft = dragStartLeft + (e.clientX - dragStartX);
    let newTop = dragStartTop + (e.clientY - dragStartY);
    dragElement.style.left = newLeft + 'px';
    dragElement.style.top = newTop + 'px';
}

function stopDrag() {
    if (isDragging && dragElement) {
        dragElement.style.cursor = '';
        dragElement.style.opacity = '';
        dragElement.style.zIndex = '';
        showToast('✅ Блок перемещён');
        dragElement = null;
        isDragging = false;
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}