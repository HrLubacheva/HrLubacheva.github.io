// ========== СОСТОЯНИЕ ==========
export const state = {
    isEditMode: false,
    selectedElement: null,
    dragEnabled: false,
    dragTarget: null,
    offsetX: 0,
    offsetY: 0,
    showGrid: false,
    gridOverlay: null,
    slidesPanel: null,
    slidesPanelMinimized: false,

    // Для ресайза
    isResizing: false,
    resizeStartX: 0,
    resizeStartY: 0,
    resizeStartWidth: 0,
    resizeStartHeight: 0,
    resizeStartFontSize: 0,
    resizeElement: null,
    activeResizeHandle: null,
    resizeMode: 'size', // 'size' или 'font'

    // Для обрезки
    cropImageElement: null,
    cropOverlay: null,
    cropArea: null,

    // Для редактирования текста
    editingElement: null,
    originalContent: '',
    textEditorPopup: null,
    formatToolbar: null,

    // Для формы фото
    shapeSelector: null,
    sizeIndicator: null
};