// ---------- Модалка материалов ----------
const modal = document.getElementById('checklistModal');
const openModal = document.getElementById('openChecklistModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const downloadBoth = document.getElementById('downloadBothBtn');
const singleChecklistBtn = document.getElementById('singleChecklistBtn');
const singleTrainingBtn = document.getElementById('singleTrainingBtn');

/**
 * Сохраняет email и открывает файлы
 * @param {string} email - Email пользователя
 * @param {boolean} checklist - Скачать чек-лист?
 * @param {boolean} training - Скачать программу тренинга?
 * @returns {boolean} - Успех операции
 */
function saveEmailAndOpen(email, checklist, training) {
    if (!email || !email.includes('@')) {
        alert('Введите корректный email');
        return false;
    }
    const formData = {
        formType: 'Запрос материалов',
        name: email,
        phone: '',
        comment: `Запросил: чек-лист=${checklist}, тренинг=${training}`,
        quizAnswers: '-'
    };

    if (typeof sendDataToSheet === 'function') {
        sendDataToSheet(formData);
    }

    // Отправляем событие в GA4
    if (typeof gtag === 'function') {
        gtag('event', 'download', {
            'event_category': 'material',
            'event_label': checklist && training ? 'both' : (checklist ? 'checklist' : 'training')
        });
    }

    if (checklist) window.open('assets/docs/checklist.pdf', '_blank');
    if (training) window.open('assets/docs/training_program.pdf', '_blank');

    if (typeof showToast === 'function') {
        showToast('✅ Email сохранён. Файлы открываются в новой вкладке.', 3000);
    }
    return true;
}

/**
 * Инициализирует модальные окна
 */
function initModal() {
    // Открытие модалки материалов
    if (openModal) {
        openModal.addEventListener('click', () => {
            if (modal) modal.style.display = 'flex';
        });
    }

    // Закрытие модалки материалов крестиком
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }

    // Кнопка "Скачать оба файла"
    if (downloadBoth) {
        downloadBoth.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            const checklist = document.getElementById('checklistCheck').checked;
            const training = document.getElementById('trainingCheck').checked;
            if (saveEmailAndOpen(email, checklist, training)) {
                if (modal) modal.style.display = 'none';
            }
        });
    }

    // Кнопка "Только чек-лист"
    if (singleChecklistBtn) {
        singleChecklistBtn.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, true, false)) {
                if (modal) modal.style.display = 'none';
            }
        });
    }

    // Кнопка "Только тренинг"
    if (singleTrainingBtn) {
        singleTrainingBtn.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, false, true)) {
                if (modal) modal.style.display = 'none';
            }
        });
    }

    // Закрытие модалки материалов по клику вне её
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // ========== Политика конфиденциальности ==========
    const privacyModal = document.getElementById('privacyModal');
    const privacyLink = document.getElementById('privacyLink');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');
    const closePrivacy = document.getElementById('closePrivacyModal');

    // Открытие из футера
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (privacyModal) privacyModal.style.display = 'flex';
        });
    }

    // Закрытие крестиком
    if (closePrivacyBtn) {
        closePrivacyBtn.addEventListener('click', () => {
            if (privacyModal) privacyModal.style.display = 'none';
        });
    }

    // Закрытие другой кнопкой
    if (closePrivacy) {
        closePrivacy.addEventListener('click', () => {
            if (privacyModal) privacyModal.style.display = 'none';
        });
    }

    // Закрытие политики по клику вне
    window.addEventListener('click', (e) => {
        if (e.target === privacyModal) privacyModal.style.display = 'none';
    });
}

// Экспортируем в глобальную область
window.initModal = initModal;