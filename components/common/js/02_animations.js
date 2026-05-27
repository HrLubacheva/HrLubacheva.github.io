function initAnimations() {
    logInit('initAnimations started', 'INFO', '', 3);
    const elements = document.querySelectorAll('.fade-up');
    logInit(`Найдено элементов .fade-up: ${elements.length}`, 'INFO', '', 4);
    if (!elements.length) {
        logInit('Нет элементов .fade-up, выход', 'WARN', '', 2);
        return;
    }

    // Гарантируем, что изначально класс visible не стоит (если вдруг кто-то добавил)
    elements.forEach(el => el.classList.remove('visible'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
                logInit(`Элемент .fade-up стал видимым`, 'DEBUG', '', 5);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px 0px 0px'   // ← больше никаких отрицательных отступов
    });

    elements.forEach(el => observer.observe(el));
    logInit('initAnimations finished', 'INFO', '', 3);
}
window.initAnimations = initAnimations;