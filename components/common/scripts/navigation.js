// ---------- Плавная прокрутка с учётом фиксированной шапки ----------
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
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

// ---------- Скрытие шапки при скролле на мобильных ----------
function initMobileNavbarHide() {
    // Только для мобильных устройств (ширина экрана меньше 768px)
    if (window.innerWidth > 768) return;

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    // Добавляем стили для анимации
    navbar.style.transition = 'transform 0.3s ease-in-out';

    window.addEventListener('scroll', function() {
        if (ticking) return;

        requestAnimationFrame(function() {
            const currentScrollY = window.scrollY;

            // Прокрутка вниз и не в самом верху
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // Скрываем шапку
                navbar.style.transform = 'translateY(-100%)';
            }
            // Прокрутка вверх или в самом верху
            else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
                // Показываем шапку
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
            ticking = false;
        });

        ticking = true;
    });

    // При наведении на верхнюю часть экрана показываем шапку (для удобства)
    let hoverTimeout;
    document.addEventListener('mousemove', function(e) {
        if (e.clientY < 50 && navbar.style.transform === 'translateY(-100%)') {
            clearTimeout(hoverTimeout);
            navbar.style.transform = 'translateY(0)';
            hoverTimeout = setTimeout(() => {
                if (window.scrollY > 50) {
                    navbar.style.transform = 'translateY(-100%)';
                }
            }, 1500);
        }
    });

    // При касании верхней части экрана на мобильных
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', function(e) {
        const touchY = e.touches[0].clientY;
        if (touchY < 50 && touchStartY > touchY && navbar.style.transform === 'translateY(-100%)') {
            navbar.style.transform = 'translateY(0)';
            setTimeout(() => {
                if (window.scrollY > 50) {
                    navbar.style.transform = 'translateY(-100%)';
                }
            }, 2000);
        }
        touchStartY = touchY;
    });
}

// ---------- Запуск после загрузки DOM ----------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initSmoothScroll();
        initMobileNavbarHide();
    });
} else {
    initSmoothScroll();
    initMobileNavbarHide();
}

// При изменении размера окна перепроверяем
window.addEventListener('resize', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.innerWidth > 768) {
            // На десктопе всегда показываем
            navbar.style.transform = 'translateY(0)';
            navbar.style.transition = '';
        } else {
            // На мобильных возвращаем анимацию
            navbar.style.transition = 'transform 0.3s ease-in-out';
        }
    }
});