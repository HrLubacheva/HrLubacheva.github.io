// Бургер-меню
function initBurgerMenu() {
    const burger = document.getElementById('burgerMenu');
    const navBottom = document.getElementById('navBottom');
    const mainElement = document.querySelector('main') || document.querySelector('.container')?.parentElement;
    const MOBILE_BREAKPOINT = window.APP_CONFIG?.CONSTANTS?.BREAKPOINT_MOBILE || 768;

    if (!burger || !navBottom) return;

    function updateAria() {
        const isOpen = navBottom.classList.contains('open');
        burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (mainElement) mainElement.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    }

    burger.addEventListener('click', function() {
        this.classList.toggle('active');
        navBottom.classList.toggle('open');
        document.body.classList.toggle('menu-open');
        updateAria();
    });

    navBottom.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
            updateAria();
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
            updateAria();
        }
    });
    updateAria();
}

// Плавный кастомный скролл с easing
function smoothScrollTo(targetY, duration = 900) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animation(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeInOutCubic(progress);
        window.scrollTo(0, startY + distance * easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

// Плавный скролл с автооткрытием details
function initSmoothScroll() {
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 80;
    const extraOffset = 20; // комфортный отступ от шапки
    const scrollDuration = 900; // мс

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            if (targetId === '#top') {
                e.preventDefault();
                smoothScrollTo(0, scrollDuration);
                return;
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight - extraOffset;

                smoothScrollTo(targetPosition, scrollDuration);

                // Открываем details после окончания скролла
                setTimeout(() => {
                    if (targetElement.tagName === 'DETAILS') {
                        targetElement.open = true;
                    } else {
                        const parentDetails = targetElement.closest('details');
                        if (parentDetails) parentDetails.open = true;
                    }
                }, scrollDuration + 50);
            }
        });
    });
}

function initNavigation() {
    initBurgerMenu();
    initSmoothScroll();
}

window.initBurgerMenu = initBurgerMenu;
window.initSmoothScroll = initSmoothScroll;
window.initNavigation = initNavigation;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}