(function() {
    'use strict';

    if (window._burgerMenuInitialized) return;
    window._burgerMenuInitialized = true;

    function initBurger() {
        const burger = document.querySelector('.burger-menu');
        const navBottom = document.querySelector('.nav-bottom');
        const body = document.body;

        if (!burger || !navBottom) return;

        function closeMenu() {
            if (!navBottom.classList.contains('open')) return;
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            body.classList.remove('menu-open');
            body.style.overflow = '';
            burger.setAttribute('aria-expanded', 'false');
        }

        function openMenu() {
            if (navBottom.classList.contains('open')) return;
            body.style.overflow = 'hidden';
            burger.classList.add('active');
            navBottom.classList.add('open');
            body.classList.add('menu-open');
            burger.setAttribute('aria-expanded', 'true');
        }

        function toggleMenu(e) {
            e.stopPropagation();
            e.preventDefault();
            if (navBottom.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        burger.addEventListener('click', toggleMenu);
        burger.addEventListener('touchstart', toggleMenu, { passive: false });

        const navLinks = navBottom.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navBottom.classList.contains('open')) {
                closeMenu();
            }
        });

        document.addEventListener('click', (e) => {
            if (!navBottom.classList.contains('open')) return;
            if (!navBottom.contains(e.target) && !burger.contains(e.target)) {
                closeMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navBottom.classList.contains('open')) {
                closeMenu();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBurger);
    } else {
        initBurger();
    }
})();