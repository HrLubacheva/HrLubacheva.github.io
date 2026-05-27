// ============================================================
// 13_smooth-scroll.js – Плавный скролл по якорным ссылкам
// ============================================================
(function() {
    'use strict';
    function getNavbarHeight() {
        const navbar = document.querySelector('.navbar');
        return navbar ? navbar.offsetHeight : 0;
    }
    window.smoothScrollTo = function(targetElement) {
        if (!targetElement) return;
        const navbarHeight = getNavbarHeight();
        const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarHeight - 15;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    };
    function closeMenu() {
        if (typeof window.closeBurgerMenu === 'function') window.closeBurgerMenu();
        else {
            const burger = document.getElementById('burgerMenu');
            const navBottom = document.getElementById('navBottom');
            if (burger && navBottom && navBottom.classList.contains('open')) {
                burger.classList.remove('active');
                navBottom.classList.remove('open');
                document.body.classList.remove('menu-open');
                burger.setAttribute('aria-expanded', 'false');
            }
        }
    }
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href === '#' || href === '#top') {
            e.preventDefault();
            closeMenu();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const targetElement = document.querySelector(href);
        if (targetElement) {
            e.preventDefault();
            closeMenu();
            setTimeout(() => { window.smoothScrollTo(targetElement); }, 0);
        }
    });
})();