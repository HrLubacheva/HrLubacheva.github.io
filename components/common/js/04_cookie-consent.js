function initCookieConsent() {
    const consent = localStorage.getItem('cookie_consent');
    const banner = document.getElementById('cookieConsent');
    if (!banner) return;

    if (consent === null) {
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }

    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'accepted');
            banner.style.display = 'none';
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', { analytics_storage: 'granted' });
            }
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'declined');
            banner.style.display = 'none';
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', { analytics_storage: 'denied' });
            }
        });
    }
}
window.initCookieConsent = initCookieConsent;