// ========== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ==========
export const state = {
    // Режимы
    isEditMode: false,

    // Выделенный элемент
    selectedElement: null,

    // История
    history: [],
    historyIndex: -1,
    isUndoRedo: false,

    // Панели
    toolbar: null,
    slidesPanel: null,
    propertyPanel: null,

    // Настройки
    dragEnabled: false,
    showGrid: false,
    snapToGrid: true,

    // Для фото-редактора
    cropImageElement: null,
    cropOverlay: null
};