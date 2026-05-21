// public-main.js - публичные инициализации
document.addEventListener('DOMContentLoaded', function () {
    // Запускаем анимации с небольшой задержкой для стабильности
    setTimeout(function() {
        if (typeof initAnimations === 'function') {
            console.log('🎬 Запуск анимаций...');
            initAnimations();
        }
    }, 50);

    // Инициализируем User ID и остальное
    if (typeof initUserId === 'function') {
        initUserId().then(() => {
            console.log('✅ User ID готов и передан в аналитику');

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
        console.log('⚠️ initUserId не найден, запускаем без User ID');
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof renderQuiz === 'function') renderQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
    }

    console.log('✅ Сайт инициализирован (публичная версия)');
});