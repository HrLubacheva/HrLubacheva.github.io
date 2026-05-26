function initCallbackForm() {
    // ========== Общие функции ==========
    function normalizePhone(phone) {
        let digits = phone.replace(/\D/g, '');
        if (digits.length === 0) return '';
        if (digits[0] === '8') digits = '7' + digits.slice(1);
        if (digits[0] === '9') digits = '7' + digits;
        if (digits[0] !== '7') digits = '7' + digits;
        if (digits.length > 11) digits = digits.slice(0, 11);
        return digits;
    }

    function isValidPhone(phone) {
        const normalized = normalizePhone(phone);
        return normalized.length === 11 && /^7\d{10}$/.test(normalized);
    }

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
                }, 5000);
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
                if (!isValidPhone(callbackPhone.value) && callbackPhone.value.trim() !== '') {
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
            if (!isValidPhone(callbackPhone.value)) {
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

            callbackPhone.value = normalizePhone(callbackPhone.value);
            await window.submitForm('callbackForm', 'Обратный звонок', async (form) => {
                const quizBlock = document.getElementById('quizSelectionBlock');
                if (quizBlock) quizBlock.style.display = 'none';
                return window.getQuizDataFromForm(form);
            });
        });
    }

    // ========== Форма быстрого заказа (упрощённая) ==========
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
                }, 5000);
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
                if (!isValidPhone(quickPhone.value) && quickPhone.value.trim() !== '') {
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
            if (!isValidPhone(quickPhone.value)) {
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

            quickPhone.value = normalizePhone(quickPhone.value);
            await window.submitForm('quickOrderForm', 'Быстрый заказ', async (form) => {
                const quizData = window.getQuizDataFromForm(form);
                return { ...quizData, cart: cartData };
            });
        });
    }

    // ========== Копирование корзины в буфер обмена ==========
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