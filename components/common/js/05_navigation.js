// Бургер-меню для мобильных
function initBurgerMenu() {
    const burger = document.getElementById('burgerMenu');
    const navBottom = document.getElementById('navBottom');
    const mainElement = document.querySelector('main') || document.querySelector('.container')?.parentElement;

    if (!burger || !navBottom) return;

    function updateAria() {
        const isOpen = navBottom.classList.contains('open');
        burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (mainElement) {
            mainElement.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        }
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
        if (window.innerWidth > 768) {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
            updateAria();
        }
    });

    updateAria();
}

// Плавный скролл
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 80;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initBurgerMenu();
    initSmoothScroll();
});

// Экспорт
window.initBurgerMenu = initBurgerMenu;
window.initSmoothScroll = initSmoothScroll;