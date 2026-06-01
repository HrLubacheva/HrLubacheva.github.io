function initCookieConsent() {
    logger.init('initCookieConsent started', 'INFO', '', 3);
    let consent = null;
    try { consent = localStorage.getItem('cookie_consent'); } catch(e) { if (window.IS_DEV) logger.warn('localStorage недоступен', e); }
    const banner = document.getElementById('cookieConsent');
    if (!banner) return;
    if (consent === null) banner.style.display = 'block';
    else banner.style.display = 'none';
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    if (acceptBtn) acceptBtn.addEventListener('click', () => {
        try { localStorage.setItem('cookie_consent', 'accepted'); } catch(e) {}
        banner.style.display = 'none';
        if (typeof gtag !== 'undefined') gtag('consent', 'update', { analytics_storage: 'granted' });
        if (typeof window.loadMetricsOnConsent === 'function') window.loadMetricsOnConsent();
        logger.init('Cookie согласие принято', 'INFO', '', 3);
    });
    if (declineBtn) declineBtn.addEventListener('click', () => {
        try { localStorage.setItem('cookie_consent', 'declined'); } catch(e) {}
        banner.style.display = 'none';
        if (typeof gtag !== 'undefined') gtag('consent', 'update', { analytics_storage: 'denied' });
        logger.init('Cookie согласие отклонено', 'INFO', '', 3);
    });
    logger.init('initCookieConsent finished', 'INFO', '', 3);
}
window.initCookieConsent = initCookieConsent;