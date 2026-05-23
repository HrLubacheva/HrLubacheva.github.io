function initCallbackForm() {
    // Форматирование телефона
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

    // ----- ОСНОВНАЯ ФОРМА (Обратный звонок) -----
    const callbackForm = document.getElementById('callbackForm');
    let isSubmitting = false;
    if (callbackForm) {
        callbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (isSubmitting) return;
            const consentCheck = document.getElementById('callbackConsent');
            if (!consentCheck || !consentCheck.checked) {
                showErrorToast('Подтвердите согласие на обработку данных');
                return;
            }
            const submitBtn = callbackForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            isSubmitting = true;

            let name = document.getElementById('callbackName').value.trim();
            let phoneField = document.getElementById('callbackPhone').value.trim();
            const emailField = document.getElementById('callbackEmail')?.value.trim() || '';
            let comment = document.getElementById('callbackComment').value.trim();

            if (name === '') name = 'Не указано';
            if (!phoneField) {
                showErrorToast('Заполните телефон');
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
            const chosenVariant = window.selectedVariantText || '';
            const chosenVariantPrice = window.selectedVariantPrice || '';
            if (comment === '') comment = 'Не указано';

            const sendForm = async (userId) => {
                const geo = await window.getGeoData();
                const formData = {
                    formType: 'Обратный звонок',
                    name: name,
                    phone: digits,
                    email: emailField,
                    comment: comment,
                    consent: true,
                    quizAnswers: window.quizAnswersRaw || '-',
                    chosenVariant: chosenVariant,
                    chosenVariantPrice: chosenVariantPrice,
                    cart: '',
                    timeOnSite: typeof window.getTimeOnSite === 'function' ? window.getTimeOnSite() : '-',
                    visitStats: typeof window.getVisitStatsText === 'function' ? window.getVisitStatsText() : '-',
                    utm: typeof window.getUTMText === 'function' ? window.getUTMText() : '-',
                    device: typeof window.getDeviceText === 'function' ? window.getDeviceText() : '-',
                    page: typeof window.getPageText === 'function' ? window.getPageText() : '-',
                    geo: geo.geoText,
                    userId: userId
                };
                if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
                showSuccessToast(`Спасибо, ${name}! Мы перезвоним на ${formattedForDisplay}`);
                callbackForm.reset();
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
                window.selectedVariantText = null;
                window.selectedVariantPrice = null;
                window.quizAnswersRaw = null;
            };
            const uid = (typeof currentUserId !== 'undefined' && currentUserId) ? currentUserId : (typeof getOrCreateLocalUserId === 'function' ? getOrCreateLocalUserId() : 'unknown');
            sendForm(uid);
        });
    }

    // ----- БЫСТРЫЙ ЗАКАЗ (под калькулятором) -----
    const quickForm = document.getElementById('quickOrderForm');
    if (quickForm) {
        quickForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const cartData = typeof window.getCartData === 'function' ? window.getCartData() : '';
            if (!cartData || cartData === 'Корзина пуста') {
                showErrorToast('Добавьте хотя бы одну услугу в корзину перед заказом');
                return;
            }
            const phoneInput = document.getElementById('quickPhone');
            const nameInput = document.getElementById('quickName');
            const consentCheck = document.getElementById('quickConsent');
            if (!consentCheck.checked) {
                showErrorToast('Подтвердите согласие на обработку данных');
                return;
            }
            let phone = phoneInput.value.trim();
            if (!phone) {
                showErrorToast('Введите номер телефона');
                return;
            }
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;
            if (digits.length !== 11) {
                showErrorToast('Некорректный номер телефона. Введите 11 цифр.');
                return;
            }
            let customerName = nameInput ? nameInput.value.trim() : '';
            if (customerName === '') customerName = 'Быстрый заказ (без имени)';
            const geo = await window.getGeoData();
            const formData = {
                formType: 'Быстрый заказ',
                name: customerName,
                phone: digits,
                email: '',
                comment: `Быстрый заказ из калькулятора\nКорзина:\n${cartData}`,
                consent: true,
                quizAnswers: '-',
                chosenVariant: '-',
                chosenVariantPrice: '-',
                cart: cartData,
                timeOnSite: typeof window.getTimeOnSite === 'function' ? window.getTimeOnSite() : '-',
                visitStats: typeof window.getVisitStatsText === 'function' ? window.getVisitStatsText() : '-',
                utm: typeof window.getUTMText === 'function' ? window.getUTMText() : '-',
                device: typeof window.getDeviceText === 'function' ? window.getDeviceText() : '-',
                page: typeof window.getPageText === 'function' ? window.getPageText() : '-',
                geo: geo.geoText,
                userId: typeof getOrCreateLocalUserId === 'function' ? getOrCreateLocalUserId() : ''
            };
            if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
            showSuccessToast('Спасибо! Я перезвоню вам в ближайшее время.');
            quickForm.reset();
            consentCheck.checked = false;
            if (phoneInput) phoneInput.value = '';
            if (nameInput) nameInput.value = '';
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