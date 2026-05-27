// ========== БУРГЕР-МЕНЮ (телефонная версия) ==========
function initBurgerMenu() {
    const burger = document.getElementById('burgerMenu');
    const navBottom = document.getElementById('navBottom');
    const body = document.body;
    const MOBILE_BREAKPOINT = window.APP_CONFIG?.CONSTANTS?.BREAKPOINT_MOBILE || 768;

    if (!burger || !navBottom) return;

    function closeMenu() {
        burger.classList.remove('active');
        navBottom.classList.remove('open');
        body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
        burger.classList.add('active');
        navBottom.classList.add('open');
        body.classList.add('menu-open');
        burger.setAttribute('aria-expanded', 'true');
    }

    function toggleMenu() {
        if (navBottom.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Обработчики для мыши и касания
    burger.addEventListener('click', toggleMenu);
    burger.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleMenu();
    });

    // Закрытие меню при клике/касании на любую ссылку внутри
    navBottom.querySelectorAll('a').forEach(link => {
        const handler = (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            closeMenu();
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    setTimeout(() => {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 200);
                }
            }
        };
        link.addEventListener('click', handler);
        link.addEventListener('touchstart', handler);
    });

    // При ресайзе, если ширина стала больше брейкпоинта, закрываем меню
    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT && navBottom.classList.contains('open')) {
            closeMenu();
        }
    });
}

// ========== ПЛАВНЫЙ СКРОЛЛ ДЛЯ ЯКОРЕЙ (простая версия) ==========
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not(.nav-links a)').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            if (targetId === '#top') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ========== ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ ==========
function initNavigation() {
    initBurgerMenu();
    initSmoothScroll();
}

// Экспорт для возможного использования в других скриптах
window.initBurgerMenu = initBurgerMenu;
window.initSmoothScroll = initSmoothScroll;
window.initNavigation = initNavigation;

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}