function showModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.offsetHeight; // reflow
    modal.classList.add('show');
}
function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.addEventListener('transitionend', function onEnd() {
        if (!modal.classList.contains('show')) modal.style.display = 'none';
        modal.removeEventListener('transitionend', onEnd);
    }, { once: true });
}

function initModal() {
    const modal = document.getElementById('checklistModal');
    const openModal = document.getElementById('openChecklistModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const downloadBoth = document.getElementById('downloadBothBtn');
    const singleChecklistBtn = document.getElementById('singleChecklistBtn');
    const singleTrainingBtn = document.getElementById('singleTrainingBtn');

    if (openModal) openModal.addEventListener('click', () => showModal(modal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideModal(modal));

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
        if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
        if (typeof gtag === 'function') gtag('event', 'download', { event_category: 'material', event_label: checklist && training ? 'both' : (checklist ? 'checklist' : 'training') });
        if (checklist) window.open('assets/docs/checklist.pdf', '_blank');
        if (training) window.open('assets/docs/training_program.pdf', '_blank');
        showToast('✅ Email сохранён. Файлы открываются.', 3000);
        return true;
    }

    if (downloadBoth) {
        downloadBoth.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            const checklist = document.getElementById('checklistCheck').checked;
            const training = document.getElementById('trainingCheck').checked;
            if (saveEmailAndOpen(email, checklist, training)) hideModal(modal);
        });
    }
    if (singleChecklistBtn) {
        singleChecklistBtn.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, true, false)) hideModal(modal);
        });
    }
    if (singleTrainingBtn) {
        singleTrainingBtn.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, false, true)) hideModal(modal);
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