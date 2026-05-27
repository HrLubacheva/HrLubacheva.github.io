// ============================================================
// 07_navigation.js – Бургер-меню для мобильных устройств
// ============================================================
function initBurgerMenu() {
    logInit('initBurgerMenu started', 'INFO', '', 3);
    const burger = document.getElementById('burgerMenu');
    const navBottom = document.getElementById('navBottom');
    const body = document.body;
    const MOBILE_BREAKPOINT = window.APP_CONFIG?.CONSTANTS?.BREAKPOINT_MOBILE || 768;
    if (!burger || !navBottom) return;
    function closeMenu() { burger.classList.remove('active'); navBottom.classList.remove('open'); body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); }
    function openMenu() { burger.classList.add('active'); navBottom.classList.add('open'); body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); }
    function toggleMenu() { if (navBottom.classList.contains('open')) closeMenu(); else openMenu(); }
    burger.addEventListener('click', toggleMenu);
    burger.addEventListener('touchstart', (e) => { e.preventDefault(); toggleMenu(); });
    navBottom.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => closeMenu()); link.addEventListener('touchstart', () => closeMenu()); });
    window.addEventListener('resize', () => { if (window.innerWidth > MOBILE_BREAKPOINT && navBottom.classList.contains('open')) closeMenu(); });
    logInit('initBurgerMenu finished', 'INFO', '', 3);
}
function initNavigation() { initBurgerMenu(); }

function toggleMenu() {
    if (navBottom.classList.contains('open')) {
        closeMenu();
    } else {
        openMenu();
    }
}
function openMenu() {
    burger.classList.add('active');
    navBottom.classList.add('open');
    body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
    burger.classList.remove('active');
    navBottom.classList.remove('open');
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
}

window.initBurgerMenu = initBurgerMenu;
window.initNavigation = initNavigation;