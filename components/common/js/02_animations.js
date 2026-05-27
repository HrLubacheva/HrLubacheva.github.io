function initAnimations() {
    logInit('initAnimations started', 'INFO', '', 3);
    const elements = document.querySelectorAll('.fade-up');
    logInit(`Найдено элементов .fade-up: ${elements.length}`, 'INFO', '', 4);
    if (!elements.length) {
        logInit('Нет элементов .fade-up, выход', 'WARN', '', 2);
        return;
    }
    const isMobile = window.innerWidth <= (window.APP_CONFIG?.CONSTANTS?.BREAKPOINT_MOBILE || 768);
    logInit(`isMobile = ${isMobile}`, 'INFO', '', 5);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
                logInit(`Элемент .fade-up стал видимым`, 'DEBUG', '', 5);
            }
        });
    }, { threshold: 0.1, rootMargin: isMobile ? '0px 0px -30px 0px' : '0px 0px -80px 0px' });
    elements.forEach(el => observer.observe(el));
    logInit('initAnimations finished', 'INFO', '', 3);
}
window.initAnimations = initAnimations;