// ---------- Анимации при скролле ----------
function initAnimations() {
    const faders = document.querySelectorAll('.role-card, .service-card, .stat-item, .benefit-card, .process-card, .quiz-card, .checklist-card, .calendar-card');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    faders.forEach(el => {
        el.classList.add('fade-up');
        obs.observe(el);
    });
}