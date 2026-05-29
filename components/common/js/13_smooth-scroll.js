// ============================================================
// 13_smooth-scroll.js – Плавный скролл по якорям (собственная анимация)
// Работает во всех браузерах, включая Safari
// Увеличена длительность до 900 мс для более медленной прокрутки
// ============================================================
(function() {
    'use strict';

    // Получаем высоту фиксированной навигации (если есть)
    function getNavbarHeight() {
        const navbar = document.querySelector('.navbar');
        return navbar ? navbar.offsetHeight : 0;
    }

    // Закрываем бургер-меню, если оно открыто
    function closeBurgerMenu() {
        const burger = document.getElementById('burgerMenu');
        const navBottom = document.getElementById('navBottom');
        if (burger && navBottom && navBottom.classList.contains('open')) {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
            burger.setAttribute('aria-expanded', 'false');
        }
    }

    // Плавная прокрутка с кастомной анимацией (работает в Safari)
    function smoothScrollTo(targetElement, offset = 0) {
        if (!targetElement) return;

        const startPosition = window.pageYOffset;
        const targetPosition = targetElement.getBoundingClientRect().top + startPosition - offset;
        const distance = targetPosition - startPosition;
        const duration = 900; // миллисекунд – увеличено с 600 для более медленной прокрутки
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic – плавное замедление в конце (ощущается более естественно)
            const ease = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, startPosition + distance * ease);
            if (elapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    // Делаем функцию глобальной для использования в других скриптах (например, кнопка "Наверх")
    window.smoothScrollTo = smoothScrollTo;

    // Обработчик кликов по якорным ссылкам
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (href === '#' || href === '#top') {
            e.preventDefault();
            closeBurgerMenu();
            smoothScrollTo(document.body, 0);
            return;
        }

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        e.preventDefault();
        closeBurgerMenu();

        const navbarHeight = getNavbarHeight();
        const offset = navbarHeight + 15; // +15 для отступа
        smoothScrollTo(targetElement, offset);
    });
})();