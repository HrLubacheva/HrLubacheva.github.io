// ---------- Форма обратного звонка ----------
function initCallbackForm() {
    const phoneInput = document.getElementById('callbackPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let rawValue = this.value.replace(/\D/g, '');
            let masked = formatPhoneNumber(rawValue);
            if (masked) this.value = masked;
            else this.value = '';
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
                alert('Пожалуйста, заполните имя и номер телефона.');
                isSubmitting = false;
                return;
            }

            let digits = phoneField.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;

            if (digits.length !== 11) {
                alert('Номер должен содержать 10 цифр после +7. Пример: 9123456789');
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
            sendDataToSheet(formData);
            showToast(`✅ Спасибо, ${name}! Мы перезвоним вам на ${formattedForDisplay}`, 4000);
            callbackForm.reset();

            setTimeout(() => { isSubmitting = false; }, 2000);
        });
    }
}