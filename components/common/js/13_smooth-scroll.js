// ============================================================
// 13_smooth-scroll.js – Плавный скролл по якорям (собственная анимация)
// Работает во всех браузерах, включая Safari
// Увеличена длительность до 900 мс для более медленной прокрутки
// ============================================================
(function() {
    'use strict';

    function getNavbarHeight() {
        const navbar = document.querySelector('.navbar');
        return navbar ? navbar.offsetHeight : 0;
    }

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

    function smoothScrollTo(targetElement, offset = 0) {
        if (!targetElement) return;

        const startPosition = window.pageYOffset;
        const targetPosition = targetElement.getBoundingClientRect().top + startPosition - offset;
        const distance = targetPosition - startPosition;
        const duration = 900;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, startPosition + distance * ease);
            if (elapsed < duration) {
                requestAnimationFrame(animation);
            } else {
                // По окончании скролла обновляем активный пункт меню, если функция существует
                if (typeof window.updateActiveNav === 'function') {
                    window.updateActiveNav();
                }
            }
        }

        requestAnimationFrame(animation);
    }

    window.smoothScrollTo = smoothScrollTo;

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
        const offset = navbarHeight + 15;
        smoothScrollTo(targetElement, offset);
    });
})();