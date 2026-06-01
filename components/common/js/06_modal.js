// ============================================================
// 06_modal.js – Модальные окна с полной поддержкой клавиатуры
// ============================================================
let lastFocusedElement = null;
let scrollPositionBeforeModal = 0;

function trapFocus(element) {
    const focusable = element.querySelectorAll('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };
    element.addEventListener('keydown', handleTab);
    element._trapHandler = handleTab;
}

function removeTrapFocus(element) {
    if (element._trapHandler) {
        element.removeEventListener('keydown', element._trapHandler);
        delete element._trapHandler;
    }
}

function showModal(modal) {
    if (!modal) return;
    scrollPositionBeforeModal = window.scrollY;
    lastFocusedElement = document.activeElement;
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    trapFocus(modal);

    const focusable = modal.querySelectorAll('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
        focusable[0].focus({ preventScroll: true });
    } else {
        modal.setAttribute('tabindex', '-1');
        modal.focus({ preventScroll: true });
    }
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    window.scrollTo(0, scrollPositionBeforeModal);

    removeTrapFocus(modal);

    modal.addEventListener('transitionend', function onEnd() {
        if (!modal.classList.contains('show')) modal.style.display = 'none';
        modal.removeEventListener('transitionend', onEnd);
    }, { once: true });

    if (lastFocusedElement && lastFocusedElement.focus) {
        lastFocusedElement.focus({ preventScroll: true });
        lastFocusedElement = null;
    }
}

async function loadPrivacyPolicy() {
    const container = document.getElementById('privacyModalContent');
    if (!container) return;
    try {
        const url = window.APP_CONFIG?.PRIVACY_PAGE_URL || 'privacy.html';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки');
        let html = await response.text();
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) html = bodyMatch[1];
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
        html = html.replace(/<footer[\s\S]*?<\/footer>/gi, '');
        html = html.replace(/<a[^>]*class="back-link"[^>]*>[\s\S]*?<\/a>/gi, '');
        container.innerHTML = html;
    } catch (err) {
        logger.error(err);
        container.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Не удалось загрузить политику конфиденциальности.</div>';
    }
}

function openPrivacyModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const modal = document.getElementById('privacyModal');
    if (modal) {
        loadPrivacyPolicy();
        showModal(modal);
    }
    return false;
}

function initModal() {
    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModal');
    const closePrivacyIcon = document.getElementById('closePrivacyModalIcon');

    if (closePrivacyBtn) {
        closePrivacyBtn.removeEventListener('click', closePrivacyBtn._closeHandler);
        closePrivacyBtn._closeHandler = () => hideModal(privacyModal);
        closePrivacyBtn.addEventListener('click', closePrivacyBtn._closeHandler);
    }
    if (closePrivacyIcon) {
        closePrivacyIcon.removeEventListener('click', closePrivacyIcon._closeHandler);
        closePrivacyIcon._closeHandler = () => hideModal(privacyModal);
        closePrivacyIcon.addEventListener('click', closePrivacyIcon._closeHandler);
    }

    window.removeEventListener('click', window._privacyOutsideClick);
    window._privacyOutsideClick = (e) => {
        if (e.target === privacyModal) hideModal(privacyModal);
    };
    window.addEventListener('click', window._privacyOutsideClick);

    document.removeEventListener('keydown', window._privacyEscapeHandler);
    window._privacyEscapeHandler = (e) => {
        if (e.key === 'Escape' && privacyModal && privacyModal.classList.contains('show')) {
            hideModal(privacyModal);
        }
    };
    document.addEventListener('keydown', window._privacyEscapeHandler);
}

window.showModal = showModal;
window.hideModal = hideModal;
window.openPrivacyModal = openPrivacyModal;
window.initModal = initModal;