// Только публичные инициализации (без редактора)
document.addEventListener('DOMContentLoaded', function () {
    // Сначала инициализируем User ID (и передаём в аналитику)
    if (typeof initUserId === 'function') {
        initUserId().then(() => {
            log('✅ User ID готов и передан в аналитику');

            // Запускаем остальные инициализации
            if (typeof initCalculator === 'function') initCalculator();
            if (typeof renderQuiz === 'function') renderQuiz();
            if (typeof initModal === 'function') initModal();
            if (typeof initCallbackForm === 'function') initCallbackForm();
            if (typeof initAnimations === 'function') initAnimations();
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
        if (typeof initAnimations === 'function') initAnimations();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
    }

    log('✅ Сайт инициализирован (публичная версия)');
});