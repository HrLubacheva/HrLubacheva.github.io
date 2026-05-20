// ========== ПЕРЕТАСКИВАНИЕ ОБЪЕКТОВ ==========
import { state } from './state.js';

export function startDrag(e) {
    if (!state.dragEnabled || !state.selectedElement) return;
    if (e.target.classList?.contains('resize-handle')) return;
    if (e.target.classList?.contains('element-delete-btn')) return;
    if (e.target.classList?.contains('shape-btn')) return;

    e.preventDefault();
    e.stopPropagation();

    state.dragTarget = state.selectedElement;
    const rect = state.dragTarget.getBoundingClientRect();
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!state.dragTarget) return;
    state.dragTarget.style.position = 'absolute';
    state.dragTarget.style.left = (e.clientX - state.offsetX) + 'px';
    state.dragTarget.style.top = (e.clientY - state.offsetY) + 'px';
    state.dragTarget.style.margin = '0';
    state.dragTarget.style.zIndex = '1000';
    state.dragTarget.style.cursor = 'grabbing';
}

function stopDrag() {
    if (state.dragTarget) {
        state.dragTarget.style.cursor = '';
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    state.dragTarget = null;
}

export function initDragDrop() {
    document.addEventListener('mousedown', startDrag);
}