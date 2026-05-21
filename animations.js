// ---------- Красивые анимации при скролле ----------
function initAnimations() {
    const selectors = [
        '.role-card', '.service-card', '.stat-item', '.benefit-card',
        '.process-card', '.quiz-card', '.checklist-card', '.calendar-card'
    ];

    const elements = document.querySelectorAll(selectors.join(','));

    // Убираем класс visible у всех элементов (чтобы они спрятались)
    elements.forEach(el => {
        el.classList.remove('visible');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => {
        el.classList.add('fade-up');
        observer.observe(el);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    initAnimations();
}