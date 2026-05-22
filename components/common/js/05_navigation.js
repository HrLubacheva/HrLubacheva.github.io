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

function initBurgerMenu() {
    const burger = document.getElementById('burgerMenu');
    const navBottom = document.getElementById('navBottom');

    if (!burger || !navBottom) return;

    burger.addEventListener('click', function() {
        this.classList.toggle('active');
        navBottom.classList.toggle('open');
        document.body.classList.toggle('menu-open');
    });

    navBottom.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
        }
    });
}

window.initSmoothScroll = initSmoothScroll;
window.initBurgerMenu = initBurgerMenu;