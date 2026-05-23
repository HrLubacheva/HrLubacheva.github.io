function initCallbackForm() {
    const phoneInput = document.getElementById('callbackPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let rawValue = this.value.replace(/\D/g, '');
            if (typeof formatPhoneNumber === 'function') {
                let masked = formatPhoneNumber(rawValue);
                this.value = masked || '';
            } else {
                if (rawValue.length > 11) rawValue = rawValue.slice(0, 11);
                let formatted = '+7';
                if (rawValue.length > 1) formatted += ' ' + rawValue.slice(1, 4);
                if (rawValue.length >= 5) formatted += ' ' + rawValue.slice(4, 7);
                if (rawValue.length >= 8) formatted += ' ' + rawValue.slice(7, 9);
                if (rawValue.length >= 10) formatted += ' ' + rawValue.slice(9, 11);
                this.value = formatted;
            }
        });
    }

    const callbackForm = document.getElementById('callbackForm');
    let isSubmitting = false;

    if (callbackForm) {
        callbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (isSubmitting) return;

            const consentCheckbox = document.getElementById('callbackConsent');
            if (!consentCheckbox || !consentCheckbox.checked) {
                showErrorToast('Подтвердите согласие на обработку данных');
                return;
            }

            const submitBtn = callbackForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            isSubmitting = true;

            const name = document.getElementById('callbackName').value.trim();
            let phoneField = document.getElementById('callbackPhone').value.trim();
            const emailField = document.getElementById('callbackEmail')?.value.trim() || '';
            const comment = document.getElementById('callbackComment').value.trim() || 'Не указано';

            if (!name || !phoneField) {
                showErrorToast('Заполните имя и телефон');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
                return;
            }

            let digits = phoneField.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;
            if (digits.length !== 11) {
                showErrorToast('Некорректный номер телефона');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
                return;
            }

            const formattedForDisplay = '+7 ' + digits.slice(1,4) + ' ' + digits.slice(4,7) + ' ' + digits.slice(7,9) + ' ' + digits.slice(9);

            const sendForm = (userId) => {
                const formData = {
                    formType: 'Обратный звонок',
                    name: name,
                    phone: digits,
                    email: emailField,
                    comment: comment,
                    quizAnswers: window.quizAnswersRaw || '-',
                    cart: typeof window.getCartData === 'function' ? window.getCartData() : '',
                    timeOnSite: typeof window.getTimeOnSite === 'function' ? window.getTimeOnSite() : '-',
                    visitStats: typeof window.getVisitStatsText === 'function' ? window.getVisitStatsText() : '-',
                    consent: true,
                    userId: userId
                };
                if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
                showSuccessToast(`Спасибо, ${name}! Мы перезвоним на ${formattedForDisplay}`);
                callbackForm.reset();
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
            };

            if (typeof currentUserId !== 'undefined' && currentUserId) sendForm(currentUserId);
            else if (typeof getOrCreateLocalUserId === 'function') sendForm(getOrCreateLocalUserId());
            else sendForm('unknown');
        });
    }

    const privacyLinkForm = document.getElementById('privacyLinkForm');
    if (privacyLinkForm) {
        privacyLinkForm.addEventListener('click', (e) => {
            e.preventDefault();
            const privacyModal = document.getElementById('privacyModal');
            if (privacyModal && typeof showModal === 'function') showModal(privacyModal);
        });
    }
}

function initFormEnterSubmit() {
    const form = document.getElementById('callbackForm');
    if (!form) return;
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            }
        });
    });
}

window.initCallbackForm = initCallbackForm;
window.initFormEnterSubmit = initFormEnterSubmit;