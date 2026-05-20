// ========== ГЛАВНЫЙ МОДУЛЬ ==========
import { state } from './state.js';
import { createUI, enableEditMode, disableEditMode } from './ui.js';
import { createSlidesPanel, renderSlidesList } from './slides-panel.js';
import { selectElement } from './elements.js';

let isInitialized = false;

function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Функция обновления панели слайдов
    const renderCallback = () => {
        if (state.slidesPanel && state.slidesPanel.classList.contains('show')) {
            renderSlidesList(selectElement);
        }
    };

    // Создаём UI
    const { toggleBtn } = createUI(renderCallback);

    // Создаём панель слайдов
    createSlidesPanel(selectElement);

    // Обработчик кнопки включения/выключения режима
    toggleBtn.onclick = () => {
        if (state.isEditMode) {
            disableEditMode();
        } else {
            enableEditMode(renderCallback);
        }
    };
}

// Запуск после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}