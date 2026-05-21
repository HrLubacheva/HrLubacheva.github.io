// public-main.js - с защитой от кеша
(function() {
    'use strict';

    // Версия сайта (меняйте при обновлении)
    const SITE_VERSION = '2.1';
    const cachedVersion = localStorage.getItem('site_version');

    // Очистка старого Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
                registration.unregister();
                console.log('✅ Service Worker удалён');
            });
        });
    }

    // Проверка версии
    if (cachedVersion !== SITE_VERSION) {
        localStorage.setItem('site_version', SITE_VERSION);
        localStorage.removeItem('animations_done');
        console.log('🔄 Новая версия сайта v' + SITE_VERSION);
    }

    // Помечаем, что JS готов
    document.documentElement.classList.add('js-ready');
    document.body.classList.add('js-ready');

    // Основная инициализация
    document.addEventListener('DOMContentLoaded', function () {
        // Небольшая задержка для стабильности
        setTimeout(function() {
            if (typeof initAnimations === 'function') {
                console.log('🎬 Запуск анимаций...');
                initAnimations();
            }
        }, 50);

        // Остальные инициализации
        if (typeof initUserId === 'function') {
            initUserId().then(() => {
                console.log('✅ User ID готов');
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
            if (typeof initCalculator === 'function') initCalculator();
            if (typeof renderQuiz === 'function') renderQuiz();
            if (typeof initModal === 'function') initModal();
            if (typeof initCallbackForm === 'function') initCallbackForm();
            if (typeof initSmoothScroll === 'function') initSmoothScroll();
            if (typeof initCopyButtons === 'function') initCopyButtons();
            if (typeof initBurgerMenu === 'function') initBurgerMenu();
            if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
        }
    });
})();