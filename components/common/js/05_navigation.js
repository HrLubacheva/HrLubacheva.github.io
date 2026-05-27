// Бургер-меню
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
        if (navBottom.classList.contains('open')) closeMenu();
        else openMenu();
    }

    burger.addEventListener('click', toggleMenu);

    navBottom.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
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
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT && navBottom.classList.contains('open')) {
            closeMenu();
        }
    });
}

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

// Плавный кастомный скролл с easing
function smoothScrollTo(targetY, duration = 900) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 5) return;
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

// Вспомогательная функция: дождаться загрузки всех изображений внутри элемента
function waitForImagesInElement(element, timeout = 2000) {
    return new Promise((resolve) => {
        if (!element) return resolve();
        const images = element.querySelectorAll('img');
        if (images.length === 0) return resolve();
        let pending = images.length;
        let resolved = false;
        const timeoutId = setTimeout(() => {
            if (!resolved) resolve();
        }, timeout);
        const onLoadOrError = () => {
            pending--;
            if (pending === 0 && !resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                resolve();
            }
        };
        images.forEach(img => {
            if (img.complete) {
                onLoadOrError();
            } else {
                img.addEventListener('load', onLoadOrError);
                img.addEventListener('error', onLoadOrError);
            }
        });
    });
}

// Плавный скролл для всех якорей с автооткрытием details и коррекцией позиции
function initSmoothScroll() {
    const navbar = document.querySelector('.navbar');
    let navbarHeight = navbar ? navbar.offsetHeight : 80;
    const extraOffset = 20;
    const scrollDuration = 900;

    // Пересчитываем высоту навбара при ресайзе и после загрузки
    function updateNavbarHeight() {
        if (navbar) navbarHeight = navbar.offsetHeight;
    }
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('load', updateNavbarHeight);

    // Функция, которая вычисляет целевую позицию и выполняет скролл с ожиданием загрузки картинок
    async function scrollToTarget(targetElement) {
        if (!targetElement) return;

        // Сначала дождаться загрузки изображений внутри целевого элемента и его родителей до ближайшего section
        const section = targetElement.closest('section');
        const elementToWait = section || targetElement;
        await waitForImagesInElement(elementToWait);

        // Повторно вычисляем позицию после загрузки картинок
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

    // Обработчик кликов по якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            if (targetId === '#top' || targetId === '#') {
                e.preventDefault();
                smoothScrollTo(0, scrollDuration);
                return;
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                scrollToTarget(targetElement);
            }
        });
    });
}

// Экспорт
function initNavigation() {
    initBurgerMenu();
    initSmoothScroll();
}

window.initBurgerMenu = initBurgerMenu;
window.initSmoothScroll = initSmoothScroll;
window.initNavigation = initNavigation;
window.smoothScrollTo = smoothScrollTo;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}