// public-main.js - исправленная версия
document.addEventListener('DOMContentLoaded', function () {
    // ВАЖНО: Сначала запускаем анимации!
    if (typeof initAnimations === 'function') {
        console.log('🎬 Запуск анимаций...');
        initAnimations();
    }

    // Потом инициализируем User ID и остальное
    if (typeof initUserId === 'function') {
        initUserId().then(() => {
            log('✅ User ID готов и передан в аналитику');

            // Запускаем остальные инициализации (кроме анимаций)
            if (typeof initCalculator === 'function') initCalculator();
            if (typeof renderQuiz === 'function') renderQuiz();
            if (typeof initModal === 'function') initModal();
            if (typeof initCallbackForm === 'function') initCallbackForm();
            if (typeof initSmoothScroll === 'function') initSmoothScroll();
            if (typeof initCopyButtons === 'function') initCopyButtons();
            if (typeof initBurgerMenu === 'function') initBurgerMenu();
            if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
        });
    } else {
        // Fallback, если User ID не инициализирован
        log('⚠️ initUserId не найден, запускаем без User ID');
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof renderQuiz === 'function') renderQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
    }

    log('✅ Сайт инициализирован (публичная версия)');
});