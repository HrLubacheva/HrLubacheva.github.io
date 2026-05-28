function initCallbackForm() {
    // Защита от двойной инициализации
    if (window._callbackFormInitialized) return;
    window._callbackFormInitialized = true;

    logInit('initCallbackForm started', 'INFO', '', 3);
    const C = window.APP_CONFIG?.CONSTANTS || {};
    const MAX_PHONE_DIGITS = C.MAX_PHONE_DIGITS || 11;
    const FORM_MESSAGE_HIDE_DELAY = C.FORM_MESSAGE_HIDE_DELAY || 5000;

    const callbackForm = document.getElementById('callbackForm');
    const callbackMessages = document.getElementById('callbackFormMessages');

    if (callbackForm && callbackMessages) {
        // Удаляем старый обработчик, если он был
        if (callbackForm._submitHandler) {
            callbackForm.removeEventListener('submit', callbackForm._submitHandler);
        }

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

        let isSubmitting = false;

        const submitHandler = async function(e) {
            e.preventDefault();

            if (isSubmitting) {
                logInit('Отправка уже выполняется, игнорируем', 'WARN', '', 3);
                showCallbackMessage('⏳ Отправка уже выполняется, подождите...', true);
                return;
            }

            logInit('Отправка формы callbackForm', 'INFO', '', 3);
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

            isSubmitting = true;

            try {
                await window.submitForm('callbackForm', 'Обратный звонок', async (form) => {
                    const quizBlock = document.getElementById('quizSelectionBlock');
                    if (quizBlock) quizBlock.style.display = 'none';
                    return window.getQuizDataFromForm(form);
                });
                logInit('Отправка формы callbackForm завершена успешно', 'INFO', '', 3);
            } catch (err) {
                logInit('Ошибка отправки формы callbackForm', 'ERROR', err, 2);
                showCallbackMessage('❌ Ошибка отправки. Попробуйте позже или свяжитесь напрямую.', true);
            } finally {
                isSubmitting = false;
            }
        };

        callbackForm._submitHandler = submitHandler;
        callbackForm.addEventListener('submit', submitHandler);
    }

    // ========== Быстрый заказ ==========
    const quickForm = document.getElementById('quickOrderForm');
    const quickMessages = document.getElementById('quickFormMessages');

    if (quickForm && quickMessages) {
        if (quickForm._submitHandler) {
            quickForm.removeEventListener('submit', quickForm._submitHandler);
        }

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

        let isQuickSubmitting = false;

        const quickSubmitHandler = async function(e) {
            e.preventDefault();

            if (isQuickSubmitting) {
                logInit('Быстрый заказ уже выполняется, игнорируем', 'WARN', '', 3);
                showQuickMessage('⏳ Отправка уже выполняется, подождите...', true);
                return;
            }

            logInit('Отправка формы quickOrderForm', 'INFO', '', 3);
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

            isQuickSubmitting = true;

            try {
                await window.submitForm('quickOrderForm', 'Быстрый заказ', async (form) => {
                    const quizData = window.getQuizDataFromForm(form);
                    return { ...quizData, cart: cartData };
                });
                logInit('Отправка формы quickOrderForm завершена успешно', 'INFO', '', 3);
            } catch (err) {
                logInit('Ошибка отправки формы quickOrderForm', 'ERROR', err, 2);
                showQuickMessage('❌ Ошибка отправки. Попробуйте позже или свяжитесь напрямую.', true);
            } finally {
                isQuickSubmitting = false;
            }
        };

        quickForm._submitHandler = quickSubmitHandler;
        quickForm.addEventListener('submit', quickSubmitHandler);
    }

    // ========== Копирование корзины ==========
    const copyCartBtn = document.getElementById('copyCartBtn');
    if (copyCartBtn) {
        if (copyCartBtn._copyHandler) {
            copyCartBtn.removeEventListener('click', copyCartBtn._copyHandler);
        }

        copyCartBtn._copyHandler = () => {
            logInit('Копирование корзины', 'INFO', '', 4);
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
        };

        copyCartBtn.addEventListener('click', copyCartBtn._copyHandler);
    }

    logInit('initCallbackForm finished', 'INFO', '', 3);
}

function initFormEnterSubmit() {
    // Защита от двойной инициализации
    if (window._formEnterSubmitInitialized) return;
    window._formEnterSubmitInitialized = true;

    const form = document.getElementById('callbackForm');
    if (form && !form._enterHandler) {
        form._enterHandler = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                if (btn) btn.click();
            }
        };
        form.querySelectorAll('input, textarea').forEach(input => {
            input.removeEventListener('keypress', form._enterHandler);
            input.addEventListener('keypress', form._enterHandler);
        });
    }

    const quickForm = document.getElementById('quickOrderForm');
    if (quickForm && !quickForm._enterHandler) {
        quickForm._enterHandler = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const btn = quickForm.querySelector('button[type="submit"]');
                if (btn) btn.click();
            }
        };
        quickForm.querySelectorAll('input, textarea').forEach(input => {
            input.removeEventListener('keypress', quickForm._enterHandler);
            input.addEventListener('keypress', quickForm._enterHandler);
        });
    }
}

window.initCallbackForm = initCallbackForm;
window.initFormEnterSubmit = initFormEnterSubmit;