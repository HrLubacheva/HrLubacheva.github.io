// ---------- Главная инициализация сайта ----------
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация калькулятора
    if (typeof initCalculator === 'function') {
        initCalculator();
        console.log('✅ Калькулятор инициализирован');
    }

    // Инициализация квиза
    if (typeof renderQuiz === 'function') {
        renderQuiz();
        console.log('✅ Квиз инициализирован');
    }

    // Инициализация модалок
    if (typeof initModal === 'function') {
        initModal();
        console.log('✅ Модалки инициализированы');
    }

    // Инициализация формы обратного звонка
    if (typeof initCallbackForm === 'function') {
        initCallbackForm();
        console.log('✅ Форма обратного звонка инициализирована');
    }

    // Инициализация анимаций при скролле
    if (typeof initAnimations === 'function') {
        initAnimations();
        console.log('✅ Анимации инициализированы');
    }

    // Инициализация плавной прокрутки
    if (typeof initSmoothScroll === 'function') {
        initSmoothScroll();
        console.log('✅ Плавная прокрутка инициализирована');
    }

    // Инициализация копирования в буфер
    if (typeof initCopyButtons === 'function') {
        initCopyButtons();
        console.log('✅ Копирование инициализировано');
    }

    console.log('🚀 Сайт полностью загружен и готов к работе');
});

// Экспортируем глобальные функции для доступа из редактора
window.getOrCreateUserId = getOrCreateUserId;
window.sendDataToSheet = sendDataToSheet;
window.showToast = showToast;
window.formatPhoneNumber = formatPhoneNumber;