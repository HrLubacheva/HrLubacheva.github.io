function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const scrollThreshold = 50;

    function updateNavbar() {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNavbar);
    updateNavbar();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarScroll);
} else {
    initNavbarScroll();
}