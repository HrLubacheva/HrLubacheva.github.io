// ============================================================
// 20_materials-modal.js – отправка материалов на email
// ============================================================
(function() {
    'use strict';

    let isSubmitting = false;

    function getMaterialText(material) {
        switch(material) {
            case 'checklist': return '📋 Чек-лист «Идеальное резюме»';
            case 'training': return '🎓 Программа тренинга «Продай себя дорого»';
            case 'both': return '📋 Чек-лист + 🎓 Программа тренинга';
            default: return 'Материалы';
        }
    }

    function initMaterialsEmailButtons() {
        const modal = document.getElementById('materialsModal');
        if (!modal) return;

        const openButtons = document.querySelectorAll('.material-email-simple');
        const closeBtn = document.getElementById('closeMaterialsModal');
        const closeIcon = document.getElementById('closeMaterialsModalIcon');
        const sendBtn = document.getElementById('sendMaterialsBtn');
        const emailInput = document.getElementById('materialsEmail');
        const selectedInfo = document.getElementById('selectedMaterialInfo');

        let currentMaterial = null;

        const closeModal = () => {
            if (!modal.classList.contains('show')) return;
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                if (emailInput) {
                    emailInput.value = '';
                    emailInput.classList.remove('error');
                }
                if (selectedInfo) {
                    selectedInfo.innerHTML = '';
                }
                isSubmitting = false;
            }, 200);
        };

        openButtons.forEach(btn => {
            btn.removeEventListener('click', btn._materialsHandler);
            btn._materialsHandler = (e) => {
                e.preventDefault();
                currentMaterial = btn.dataset.material;

                // Показываем, что выбрал пользователь
                if (selectedInfo) {
                    selectedInfo.innerHTML = `✅ Вы выбрали:<br><strong>${getMaterialText(currentMaterial)}</strong>`;
                }

                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
                document.body.classList.add('modal-open');
                if (emailInput) {
                    emailInput.focus();
                    emailInput.classList.remove('error');
                }
            };
            btn.addEventListener('click', btn._materialsHandler);
        });

        const closeModalHandler = () => closeModal();
        if (closeBtn) {
            closeBtn.removeEventListener('click', closeBtn._closeHandler);
            closeBtn._closeHandler = closeModalHandler;
            closeBtn.addEventListener('click', closeBtn._closeHandler);
        }
        if (closeIcon) {
            closeIcon.removeEventListener('click', closeIcon._closeHandler);
            closeIcon._closeHandler = closeModalHandler;
            closeIcon.addEventListener('click', closeIcon._closeHandler);
        }

        if (sendBtn && emailInput) {
            sendBtn.removeEventListener('click', sendBtn._sendHandler);
            sendBtn._sendHandler = async () => {
                if (isSubmitting) {
                    window.showWarningToast('⏳ Отправка уже выполняется, подождите...');
                    return;
                }
                const email = emailInput.value.trim();
                if (!email) {
                    emailInput.classList.add('error');
                    window.showErrorToast('❌ Введите email');
                    emailInput.focus();
                    return;
                }
                if (!window.isValidEmail || !window.isValidEmail(email)) {
                    emailInput.classList.add('error');
                    window.showErrorToast('❌ Введите корректный email, например name@domain.ru');
                    emailInput.focus();
                    return;
                }
                emailInput.classList.remove('error');

                isSubmitting = true;
                const originalText = sendBtn.innerText;
                sendBtn.disabled = true;
                sendBtn.innerText = '⏳ Отправка...';
                sendBtn.classList.add('loading');

                try {
                    const success = await window.sendMaterialsToEmail(email, currentMaterial);
                    if (success) {
                        closeModal();
                    } else {
                        emailInput.classList.add('error');
                    }
                } catch (err) {
                    window.showErrorToast('❌ Ошибка отправки. Попробуйте позже.');
                    emailInput.classList.add('error');
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.innerText = originalText;
                    sendBtn.classList.remove('loading');
                    isSubmitting = false;
                }
            };
            sendBtn.addEventListener('click', sendBtn._sendHandler);
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal && modal.classList.contains('show')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    window.initMaterialsEmailButtons = initMaterialsEmailButtons;
})();