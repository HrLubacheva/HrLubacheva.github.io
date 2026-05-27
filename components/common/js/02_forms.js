function initCallbackForm() {
    // ========== ИСПРАВЛЕНО: используем глобальные функции валидации ==========
    const C = window.APP_CONFIG?.CONSTANTS || {};
    const MAX_PHONE_DIGITS = C.MAX_PHONE_DIGITS || 11;
    const FORM_MESSAGE_HIDE_DELAY = C.FORM_MESSAGE_HIDE_DELAY || 5000;

    // ========== Форма обратного звонка ==========
    const callbackForm = document.getElementById('callbackForm');
    const callbackMessages = document.getElementById('callbackFormMessages');

    if (callbackForm && callbackMessages) {
        function showCallbackMessage(message, isError = true) {
            callbackMessages.textContent = message;
            callbackMessages.className = 'form-messages ' + (isError ? 'error' : 'success');
            if (!isError) {
                setTimeout(() => {
                    callbackMessages.textContent = '';
                    callbackMessages.className = 'form-messages';
                }, FORM_MESSAGE_HIDE_DELAY);
            }
        }
        function clearCallbackMessage() {
            callbackMessages.textContent = '';
            callbackMessages.className = 'form-messages';
        }

        const callbackPhone = document.getElementById('callbackPhone');
        const callbackEmail = document.getElementById('callbackEmail');
        const callbackConsent = document.getElementById('callbackConsent');

        if (callbackPhone) {
            // ДОБАВЛЕНО: маска телефона
            if (typeof window.applyPhoneMask === 'function') {
                window.applyPhoneMask(callbackPhone);
            }
            callbackPhone.addEventListener('blur', () => {
                let digits = callbackPhone.value.replace(/\D/g, '');
                if (digits.startsWith('8')) digits = '7' + digits.slice(1);
                if (!digits.startsWith('7')) digits = '7' + digits;
                const isValid = digits.length === MAX_PHONE_DIGITS;
                if (!isValid && callbackPhone.value.trim() !== '') {
                    showCallbackMessage('❌ Введите 11 цифр телефона, начиная с 7, 8 или 9');
                } else {
                    clearCallbackMessage();
                }
            });
            callbackPhone.addEventListener('input', () => clearCallbackMessage());
        }
        if (callbackEmail) {
            callbackEmail.addEventListener('blur', () => {
                const email = callbackEmail.value.trim();
                if (email && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) {
                    showCallbackMessage('❌ Введите корректный email');
                } else {
                    clearCallbackMessage();
                }
            });
            callbackEmail.addEventListener('input', () => {
                if (callbackMessages.textContent === '❌ Введите корректный email') clearCallbackMessage();
            });
        }

        callbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearCallbackMessage();

            let isValid = true;
            let phoneDigits = callbackPhone.value.replace(/\D/g, '');
            if (phoneDigits.startsWith('8')) phoneDigits = '7' + phoneDigits.slice(1);
            if (!phoneDigits.startsWith('7')) phoneDigits = '7' + phoneDigits;

            if (phoneDigits.length !== MAX_PHONE_DIGITS) {
                showCallbackMessage('❌ Введите 11 цифр телефона, начиная с 7, 8 или 9');
                isValid = false;
            }
            if (callbackEmail && callbackEmail.value.trim() && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(callbackEmail.value.trim())) {
                showCallbackMessage('❌ Введите корректный email');
                isValid = false;
            }
            if (!callbackConsent.checked) {
                showCallbackMessage('❌ Необходимо согласие на обработку данных');
                isValid = false;
            }
            if (!isValid) return;

            if (window.normalizePhoneDigits) {
                callbackPhone.value = window.normalizePhoneDigits(callbackPhone.value);
            } else {
                let digits = callbackPhone.value.replace(/\D/g, '');
                if (digits.startsWith('8')) digits = '7' + digits.slice(1);
                if (!digits.startsWith('7')) digits = '7' + digits;
                callbackPhone.value = digits;
            }

            await window.submitForm('callbackForm', 'Обратный звонок', async (form) => {
                const quizBlock = document.getElementById('quizSelectionBlock');
                if (quizBlock) quizBlock.style.display = 'none';
                return window.getQuizDataFromForm(form);
            });
        });
    }

    // ========== Форма быстрого заказа ==========
    const quickForm = document.getElementById('quickOrderForm');
    const quickMessages = document.getElementById('quickFormMessages');

    if (quickForm && quickMessages) {
        function showQuickMessage(message, isError = true) {
            quickMessages.textContent = message;
            quickMessages.className = 'form-messages ' + (isError ? 'error' : 'success');
            if (!isError) {
                setTimeout(() => {
                    quickMessages.textContent = '';
                    quickMessages.className = 'form-messages';
                }, FORM_MESSAGE_HIDE_DELAY);
            }
        }
        function clearQuickMessage() {
            quickMessages.textContent = '';
            quickMessages.className = 'form-messages';
        }

        const quickPhone = document.getElementById('quickPhone');
        const quickConsent = document.getElementById('quickConsent');

        if (quickPhone) {
            // ДОБАВЛЕНО: маска телефона
            if (typeof window.applyPhoneMask === 'function') {
                window.applyPhoneMask(quickPhone);
            }
            quickPhone.addEventListener('blur', () => {
                let digits = quickPhone.value.replace(/\D/g, '');
                if (digits.startsWith('8')) digits = '7' + digits.slice(1);
                if (!digits.startsWith('7')) digits = '7' + digits;
                const isValid = digits.length === MAX_PHONE_DIGITS;
                if (!isValid && quickPhone.value.trim() !== '') {
                    showQuickMessage('❌ Введите 11 цифр телефона, начиная с 7, 8 или 9');
                } else {
                    clearQuickMessage();
                }
            });
            quickPhone.addEventListener('input', () => clearQuickMessage());
        }

        quickForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearQuickMessage();

            let isValid = true;
            let digits = quickPhone.value.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;

            if (digits.length !== MAX_PHONE_DIGITS) {
                showQuickMessage('❌ Введите 11 цифр телефона, начиная с 7, 8 или 9');
                isValid = false;
            }
            if (!quickConsent.checked) {
                showQuickMessage('❌ Необходимо согласие на обработку данных');
                isValid = false;
            }
            const cartData = window.getCartData ? window.getCartData() : '';
            if (!cartData || cartData === 'Корзина пуста') {
                showQuickMessage('🛒 Добавьте хотя бы одну услугу в корзину');
                isValid = false;
            }
            if (!isValid) return;

            if (window.normalizePhoneDigits) {
                quickPhone.value = window.normalizePhoneDigits(quickPhone.value);
            } else {
                let normDigits = quickPhone.value.replace(/\D/g, '');
                if (normDigits.startsWith('8')) normDigits = '7' + normDigits.slice(1);
                if (!normDigits.startsWith('7')) normDigits = '7' + normDigits;
                quickPhone.value = normDigits;
            }

            await window.submitForm('quickOrderForm', 'Быстрый заказ', async (form) => {
                const quizData = window.getQuizDataFromForm(form);
                return { ...quizData, cart: cartData };
            });
        });
    }

    // ========== Копирование корзины ==========
    const copyCartBtn = document.getElementById('copyCartBtn');
    if (copyCartBtn) {
        copyCartBtn.addEventListener('click', () => {
            const cartText = window.getCartData ? window.getCartData() : '';
            if (!cartText || cartText === 'Корзина пуста') {
                window.showWarningToast('🛒 Корзина пуста. Добавьте услуги.');
                return;
            }
            const totalPrice = document.getElementById('totalPrice')?.innerText || '0 ₽';
            const fullText = `Корзина:\n${cartText}\n\n💰 Итого: ${totalPrice}`;
            navigator.clipboard.writeText(fullText).then(() => {
                window.showSuccessToast('✅ Корзина скопирована в буфер обмена');
            }).catch(() => {
                window.showErrorToast('❌ Не удалось скопировать');
            });
        });
    }
}

function initFormEnterSubmit() {
    const form = document.getElementById('callbackForm');
    if (form) {
        form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const btn = form.querySelector('button[type="submit"]');
                    if (btn) btn.click();
                }
            });
        });
    }
    const quickForm = document.getElementById('quickOrderForm');
    if (quickForm) {
        quickForm.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const btn = quickForm.querySelector('button[type="submit"]');
                    if (btn) btn.click();
                }
            });
        });
    }
}

window.initCallbackForm = initCallbackForm;
window.initFormEnterSubmit = initFormEnterSubmit;