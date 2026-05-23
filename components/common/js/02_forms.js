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

            // Читаем данные квиза из скрытых полей формы обратной связи
            const chosenVariant = document.querySelector('#callbackForm [name="chosenVariant"]')?.value || '';
            const chosenVariantPrice = document.querySelector('#callbackForm [name="chosenVariantPrice"]')?.value || '';
            const originalChosenVariant = document.querySelector('#callbackForm [name="originalChosenVariant"]')?.value || '';
            const originalChosenVariantPrice = document.querySelector('#callbackForm [name="originalChosenVariantPrice"]')?.value || '';
            const recommendedVariants = document.querySelector('#callbackForm [name="recommendedVariants"]')?.value || '';
            const quizAnswersRaw = document.querySelector('#callbackForm [name="quizAnswersRaw"]')?.value || '';

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
                    quizAnswersRaw: quizAnswersRaw,
                    recommendedVariants: recommendedVariants,
                    chosenVariant: chosenVariant,
                    chosenVariantPrice: chosenVariantPrice,
                    originalChosenVariant: originalChosenVariant,
                    originalChosenVariantPrice: originalChosenVariantPrice,
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
                // Очистить скрытые поля
                const hiddenFields = ['chosenVariant', 'chosenVariantPrice', 'originalChosenVariant', 'originalChosenVariantPrice', 'recommendedVariants', 'quizAnswersRaw'];
                hiddenFields.forEach(field => {
                    const input = document.querySelector(`#callbackForm [name="${field}"]`);
                    if (input) input.value = '';
                });
                // Сбросить блок выбора квиза
                const quizBlock = document.getElementById('quizSelectionBlock');
                if (quizBlock) quizBlock.style.display = 'none';
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
            if (customerName === '') customerName = '';

            // Читаем данные квиза из скрытых полей формы быстрого заказа
            const chosenVariant = document.querySelector('#quickOrderForm [name="chosenVariant"]')?.value || '';
            const chosenVariantPrice = document.querySelector('#quickOrderForm [name="chosenVariantPrice"]')?.value || '';
            const originalChosenVariant = document.querySelector('#quickOrderForm [name="originalChosenVariant"]')?.value || '';
            const originalChosenVariantPrice = document.querySelector('#quickOrderForm [name="originalChosenVariantPrice"]')?.value || '';
            const recommendedVariants = document.querySelector('#quickOrderForm [name="recommendedVariants"]')?.value || '';
            const quizAnswersRaw = document.querySelector('#quickOrderForm [name="quizAnswersRaw"]')?.value || '';

            const geo = await window.getGeoData();
            const formData = {
                formType: 'Быстрый заказ',
                name: customerName,
                phone: digits,
                email: '',
                comment: '',
                consent: true,
                quizAnswersRaw: quizAnswersRaw,
                recommendedVariants: recommendedVariants,
                chosenVariant: chosenVariant,
                chosenVariantPrice: chosenVariantPrice,
                originalChosenVariant: originalChosenVariant,
                originalChosenVariantPrice: originalChosenVariantPrice,
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
            // Очистить скрытые поля квиза
            const hiddenFields = ['chosenVariant', 'chosenVariantPrice', 'originalChosenVariant', 'originalChosenVariantPrice', 'recommendedVariants', 'quizAnswersRaw'];
            hiddenFields.forEach(field => {
                const input = document.querySelector(`#quickOrderForm [name="${field}"]`);
                if (input) input.value = '';
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