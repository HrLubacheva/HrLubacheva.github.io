function initCallbackForm() {
    function formatPhoneField(inputElement) {
        let rawValue = inputElement.value.replace(/\D/g, '');
        if (typeof formatPhoneNumber === 'function') {
            let masked = formatPhoneNumber(rawValue);
            inputElement.value = masked || '';
        } else {
            if (rawValue.length > 11) rawValue = rawValue.slice(0, 11);
            let formatted = '+7';
            if (rawValue.length > 1) formatted += ' ' + rawValue.slice(1, 4);
            if (rawValue.length >= 5) formatted += ' ' + rawValue.slice(4, 7);
            if (rawValue.length >= 8) formatted += ' ' + rawValue.slice(7, 9);
            if (rawValue.length >= 10) formatted += ' ' + rawValue.slice(9, 11);
            inputElement.value = formatted;
        }
    }

    const callbackPhone = document.getElementById('callbackPhone');
    if (callbackPhone) callbackPhone.addEventListener('input', function() { formatPhoneField(this); });
    const quickPhone = document.getElementById('quickPhone');
    if (quickPhone) quickPhone.addEventListener('input', function() { formatPhoneField(this); });

    const callbackForm = document.getElementById('callbackForm');
    if (callbackForm) {
        callbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await window.submitForm('callbackForm', 'Обратный звонок', async (form) => {
                const quizBlock = document.getElementById('quizSelectionBlock');
                if (quizBlock) quizBlock.style.display = 'none';
                return window.getQuizDataFromForm(form);
            });
        });
    }

    const quickForm = document.getElementById('quickOrderForm');
    if (quickForm) {
        quickForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const cartData = window.getCartData ? window.getCartData() : '';
            if (!cartData || cartData === 'Корзина пуста') {
                showErrorToast('Добавьте хотя бы одну услугу в корзину перед заказом');
                return;
            }
            await window.submitForm('quickOrderForm', 'Быстрый заказ', async (form) => {
                const quizData = window.getQuizDataFromForm(form);
                return { ...quizData, cart: cartData };
            });
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
                const btn = form.querySelector('button[type="submit"]');
                if (btn) btn.click();
            }
        });
    });
}

window.initCallbackForm = initCallbackForm;
window.initFormEnterSubmit = initFormEnterSubmit;