// Cookie consent banner logic
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
    const privacyLink = document.getElementById('cookiePrivacyLink');
    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');

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

    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (privacyModal) privacyModal.style.display = 'flex';
        });
    }

    if (closePrivacyBtn) {
        closePrivacyBtn.addEventListener('click', () => {
            if (privacyModal) privacyModal.style.display = 'none';
        });
    }

    // Закрытие модалки по клику вне её
    window.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            privacyModal.style.display = 'none';
        }
    });
}

// Запускаем после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
    initCookieConsent();
}