// ============================================================
// 12_close-burger.js – Закрытие бургер-меню (используется в smooth-scroll)
// ============================================================
(function() {
    'use strict';
    function closeBurgerMenuIfOpen() {
        const burger = document.getElementById('burgerMenu');
        const navBottom = document.getElementById('navBottom');
        if (burger && navBottom && navBottom.classList.contains('open')) {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
            burger.setAttribute('aria-expanded', 'false');
        }
    }
    window.closeBurgerMenu = closeBurgerMenuIfOpen;
})();