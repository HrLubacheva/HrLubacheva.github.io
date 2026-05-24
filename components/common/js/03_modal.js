let lastFocusedElement = null;

function showModal(modal) {
    if (!modal) return;
    // Сохраняем элемент, который открыл модалку
    lastFocusedElement = document.activeElement;

    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    // Перемещаем фокус на первый интерактивный элемент внутри модалки
    const focusable = modal.querySelectorAll('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
        focusable[0].focus();
    } else {
        // Если нет фокусируемых элементов, фокусируемся на самой модалке (не рекомендуется, но запасной вариант)
        modal.setAttribute('tabindex', '-1');
        modal.focus();
    }
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    modal.addEventListener('transitionend', function onEnd() {
        if (!modal.classList.contains('show')) modal.style.display = 'none';
        modal.removeEventListener('transitionend', onEnd);
    }, { once: true });

    // Возвращаем фокус на элемент, который открывал модалку
    if (lastFocusedElement && lastFocusedElement.focus) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

function initModal() {
    const modal = document.getElementById('checklistModal');
    const openModal = document.getElementById('openChecklistModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const sendBtn = document.getElementById('sendMaterialsBtn');

    if (openModal) {
        openModal.addEventListener('click', () => showModal(modal));
        // Для a11y: делаем кнопку открытия доступной через клавиатуру (уже есть)
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideModal(modal));

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const email = document.getElementById('checklistEmail').value;
            const wantChecklist = document.getElementById('checklistCheck').checked;
            const wantTraining = document.getElementById('trainingCheck').checked;

            const originalText = sendBtn.innerText;
            sendBtn.disabled = true;
            sendBtn.innerText = 'Отправляю...';

            try {
                await window.sendMaterialsEmail(email, wantChecklist, wantTraining);
                if (typeof window.sendDataToSheet === 'function') {
                    window.sendDataToSheet({
                        formType: 'Запрос материалов',
                        name: email,
                        comment: `чек-лист=${wantChecklist}, тренинг=${wantTraining}`,
                        quizAnswersRaw: '-'
                    });
                }
                const modalContent = modal.querySelector('.modal-content');
                modalContent.innerHTML = `
                    <h3>✅ Письмо отправлено!</h3>
                    <p>Проверьте вашу почту (и папку «Спам»). Ссылки на материалы уже в письме.</p>
                    <button id="closeAfterSendBtn" class="btn-primary">Закрыть</button>
                `;
                const closeAfterBtn = document.getElementById('closeAfterSendBtn');
                if (closeAfterBtn) {
                    closeAfterBtn.addEventListener('click', () => hideModal(modal));
                    // После замены содержимого фокусируемся на новой кнопке
                    setTimeout(() => closeAfterBtn.focus(), 50);
                }
            } catch (err) {
                showErrorToast('Ошибка: ' + err.message);
                sendBtn.disabled = false;
                sendBtn.innerText = originalText;
            }
        });
    }

    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');
    const closePrivacy = document.getElementById('closePrivacyModal');
    if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', () => hideModal(privacyModal));
    if (closePrivacy) closePrivacy.addEventListener('click', () => hideModal(privacyModal));

    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal);
        if (e.target === privacyModal) hideModal(privacyModal);
    });
}

window.initModal = initModal;
window.showModal = showModal;
window.hideModal = hideModal;