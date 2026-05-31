function initAnimations() {
    logInit('initAnimations started', 'INFO', '', 3);
    const elements = document.querySelectorAll('.fade-up');
    logInit(`Найдено элементов .fade-up: ${elements.length}`, 'INFO', '', 4);
    if (!elements.length) {
        logInit('Нет элементов .fade-up, выход', 'WARN', '', 2);
        return;
    }

    elements.forEach(el => el.classList.remove('visible'));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const rootMargin = isMobile ? '0px 0px -50px 0px' : '0px 0px -50px 0px';
    const threshold = isMobile ? 0.05 : 0.1;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
                logInit(`Элемент .fade-up стал видимым`, 'DEBUG', '', 5);
            }
        });
    }, {
        threshold: threshold,
        rootMargin: rootMargin
    });

    elements.forEach(el => observer.observe(el));

    window.addEventListener('load', function() {
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top < windowHeight - 50) {
                el.classList.add('visible');
                observer.unobserve(el);
            }
        });
    });

    logInit('initAnimations finished', 'INFO', '', 3);
}

window.initAnimations = initAnimations;