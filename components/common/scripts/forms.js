// ---------- Форма обратного звонка ----------
function initCallbackForm() {
    const phoneInput = document.getElementById('callbackPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let rawValue = this.value.replace(/\D/g, '');
            if (typeof formatPhoneNumber === 'function') {
                let masked = formatPhoneNumber(rawValue);
                if (masked) this.value = masked;
                else this.value = '';
            } else {
                // fallback если функция не загружена
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
            isSubmitting = true;

            const name = document.getElementById('callbackName').value.trim();
            let phoneField = document.getElementById('callbackPhone').value.trim();
            const comment = document.getElementById('callbackComment').value.trim() || 'Не указано';

            if (!name || !phoneField) {
                if (typeof showToast === 'function') showToast('❌ Заполните имя и телефон');
                else alert('Пожалуйста, заполните имя и номер телефона.');
                isSubmitting = false;
                return;
            }

            let digits = phoneField.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;

            if (digits.length !== 11) {
                if (typeof showToast === 'function') showToast('❌ Некорректный номер телефона');
                else alert('Номер должен содержать 10 цифр после +7');
                isSubmitting = false;
                return;
            }

            const formattedForDisplay = '+7 ' + digits.slice(1,4) + ' ' + digits.slice(4,7) + ' ' + digits.slice(7,9) + ' ' + digits.slice(9);
            const formData = {
                formType: 'Обратный звонок',
                name: name,
                phone: digits,
                comment: comment,
                quizAnswers: '-'
            };

            if (typeof sendDataToSheet === 'function') {
                sendDataToSheet(formData);
            } else {
                console.log('Данные формы:', formData);
            }

            if (typeof showToast === 'function') {
                showToast(`✅ Спасибо, ${name}! Мы перезвоним вам на ${formattedForDisplay}`, 4000);
            } else {
                alert(`Спасибо, ${name}! Мы перезвоним вам на ${formattedForDisplay}`);
            }

            callbackForm.reset();
            setTimeout(() => { isSubmitting = false; }, 2000);
        });
    }
}

// Экспортируем для глобального доступа
window.initCallbackForm = initCallbackForm;