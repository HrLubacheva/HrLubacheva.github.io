// ========== УПРАВЛЕНИЕ ВЫДЕЛЕНИЕМ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';

// Заглушки, будут переопределены при инициализации
let showResizeMarkers = () => {};
let hideResizeMarkers = () => {};
let hideFormatToolbar = () => {};

export function setResizeHandlers(showFn, hideFn) {
    showResizeMarkers = showFn;
    hideResizeMarkers = hideFn;
}

export function setFormatToolbarHandler(hideFn) {
    hideFormatToolbar = hideFn;
}

export function clearSelection() {
    if (state.selectedElement) {
        state.selectedElement.classList.remove('selected');
        state.selectedElement = null;
    }
    hideResizeMarkers();
    hideFormatToolbar();
}

export function selectElement(element) {
    if (!element) return;
    if (state.selectedElement === element) return;
    clearSelection();
    state.selectedElement = element;
    element.classList.add('selected');
    // Если это изображение, показываем маркеры ресайза
    if (element.tagName === 'IMG') {
        showResizeMarkers(element);
    }
}