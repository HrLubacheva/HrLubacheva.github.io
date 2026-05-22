(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        // Отключаем анимации для пользователей с reduced motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.fade-up').forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            // Заглушаем initAnimations
            if (typeof initAnimations === 'function') window.initAnimations = function() {};
        }

        if (typeof initAnimations === 'function') initAnimations();
        if (typeof initUserId === 'function') initUserId().catch(e => console.warn(e));
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof initQuiz === 'function') initQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
    });
})();