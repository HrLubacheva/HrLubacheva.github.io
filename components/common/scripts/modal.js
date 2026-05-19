// ---------- Модалка материалов ----------
const modal = document.getElementById('checklistModal');
const openModal = document.getElementById('openChecklistModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const downloadBoth = document.getElementById('downloadBothBtn');
const singleChecklistBtn = document.getElementById('singleChecklistBtn');
const singleTrainingBtn = document.getElementById('singleTrainingBtn');

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
    sendDataToSheet(formData);
    if (checklist) window.open('assets/docs/checklist.pdf', '_blank');
    if (training) window.open('assets/docs/training_program.pdf', '_blank');
    showToast('✅ Email сохранён. Файлы открываются в новой вкладке.', 3000);
    return true;
}

function initModal() {
    if (openModal) openModal.onclick = () => { if (modal) modal.style.display = 'flex'; };
    if (closeModalBtn) closeModalBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
    if (downloadBoth) {
        downloadBoth.onclick = () => {
            const email = document.getElementById('checklistEmail').value;
            const checklist = document.getElementById('checklistCheck').checked;
            const training = document.getElementById('trainingCheck').checked;
            if (saveEmailAndOpen(email, checklist, training)) {
                if (modal) modal.style.display = 'none';
            }
        };
    }
    if (singleChecklistBtn) {
        singleChecklistBtn.onclick = () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, true, false)) {
                if (modal) modal.style.display = 'none';
            }
        };
    }
    if (singleTrainingBtn) {
        singleTrainingBtn.onclick = () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, false, true)) {
                if (modal) modal.style.display = 'none';
            }
        };
    }
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Политика конфиденциальности
    const privacyModal = document.getElementById('privacyModal');
    const privacyLink = document.getElementById('privacyLink');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');
    const closePrivacy = document.getElementById('closePrivacyModal');

    if (privacyLink) privacyLink.onclick = (e) => { e.preventDefault(); if (privacyModal) privacyModal.style.display = 'flex'; };
    if (closePrivacyBtn) closePrivacyBtn.onclick = () => { if (privacyModal) privacyModal.style.display = 'none'; };
    if (closePrivacy) closePrivacy.onclick = () => { if (privacyModal) privacyModal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target === privacyModal) privacyModal.style.display = 'none'; };
}