function initAnimations() {
    const elements = document.querySelectorAll('.fade-up');
    if (!elements.length) return;
    const isMobile = window.innerWidth <= (window.APP_CONFIG?.CONSTANTS?.BREAKPOINT_MOBILE || 768);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: isMobile ? '0px 0px -30px 0px' : '0px 0px -80px 0px'
    });
    elements.forEach(el => observer.observe(el));
}
window.initAnimations = initAnimations;