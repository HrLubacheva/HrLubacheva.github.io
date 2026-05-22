(function() {
    'use strict';

    // Функция для повторной инициализации анимации на ещё не видимых элементах
    function reinitAnimations() {
        const elements = document.querySelectorAll('.fade-up:not(.visible)');
        if (!elements.length) return;
        const isMobile = window.innerWidth <= 768;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: isMobile ? '0px 0px -30px 0px' : '0px 0px -80px 0px'
        });
        elements.forEach(el => observer.observe(el));
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.fade-up').forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            if (typeof initAnimations === 'function') window.initAnimations = function() {};
        }

        // Базовые инициализации
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
        if (typeof initCookieConsent === 'function') initCookieConsent();

        // Переопределяем initCalculator и initQuiz, чтобы после их завершения перезапускать анимацию
        const originalInitCalculator = window.initCalculator;
        if (originalInitCalculator) {
            window.initCalculator = async function() {
                await originalInitCalculator();
                setTimeout(reinitAnimations, 100);
            };
        }

        const originalInitQuiz = window.initQuiz;
        if (originalInitQuiz) {
            window.initQuiz = function() {
                originalInitQuiz();
                setTimeout(reinitAnimations, 150);
            };
        }

        // Также при клике на вкладки калькулятора перезапускаем анимацию
        document.addEventListener('click', function(e) {
            if (e.target.closest('.tab-btn')) {
                setTimeout(reinitAnimations, 50);
            }
        });

        // Дополнительный вызов через небольшую задержку для динамически подгружаемых данных (например, из Google Sheets)
        setTimeout(reinitAnimations, 500);
    });
})();