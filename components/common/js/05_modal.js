// ============================================================
// 05_modal.js – Модальные окна (политика конфиденциальности)
// ============================================================
let lastFocusedElement = null;
function showModal(modal) {
    logInit(`showModal вызван`, 'INFO', '', 4);
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    const focusable = modal.querySelectorAll('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
    else { modal.setAttribute('tabindex', '-1'); modal.focus(); }
}
function hideModal(modal) {
    logInit(`hideModal вызван`, 'INFO', '', 4);
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    modal.addEventListener('transitionend', function onEnd() { if (!modal.classList.contains('show')) modal.style.display = 'none'; modal.removeEventListener('transitionend', onEnd); }, { once: true });
    if (lastFocusedElement && lastFocusedElement.focus) { lastFocusedElement.focus(); lastFocusedElement = null; }
}
function initModal() {
    logInit('initModal started', 'INFO', '', 3);
    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');
    const closePrivacy = document.getElementById('closePrivacyModal');
    if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', () => hideModal(privacyModal));
    if (closePrivacy) closePrivacy.addEventListener('click', () => hideModal(privacyModal));
    window.addEventListener('click', (e) => { if (e.target === privacyModal) hideModal(privacyModal); });
    logInit('initModal finished', 'INFO', '', 3);
}
window.initModal = initModal;
window.showModal = showModal;
window.hideModal = hideModal;