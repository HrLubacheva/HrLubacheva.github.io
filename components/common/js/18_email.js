const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
let isSendingMaterials = false;
let lastSendTime = 0;
const MIN_INTERVAL_MS = 60000;

function isValidEmail(email) { return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email); }

async function sendMaterialsEmail(email, wantChecklist, wantTraining) {
    logger.init(`sendMaterialsEmail: ${email}, чек-лист=${wantChecklist}, тренинг=${wantTraining}`, 'INFO', '', 4);

    const actionKey = 'materials_email';
    if (window.isActionLocked && window.isActionLocked(actionKey, MIN_INTERVAL_MS)) {
        throw new Error('Пожалуйста, подождите перед повторной отправкой');
    }

    if (isSendingMaterials) throw new Error('Пожалуйста, подождите, предыдущая отправка ещё не завершена');
    const now = Date.now();
    if (now - lastSendTime < MIN_INTERVAL_MS) {
        const secondsLeft = Math.ceil((MIN_INTERVAL_MS - (now - lastSendTime)) / 1000);
        throw new Error(`Пожалуйста, подождите ${secondsLeft} секунд перед повторной отправкой`);
    }
    if (!email || !isValidEmail(email)) throw new Error('Введите корректный email');
    const url = window.APP_CONFIG ? window.APP_CONFIG.SCRIPT_URL : window.SCRIPT_URL;
    if (!url) throw new Error('URL скрипта не задан');
    const formData = { formType: 'Запрос материалов', name: email, comment: `чек-лист=${wantChecklist}, тренинг=${wantTraining}`, consent: true, userId: window.getOrCreateLocalUserId() };
    isSendingMaterials = true;
    try {
        const result = await window.postWithRetry(url, formData, MAX_RETRIES, RETRY_DELAY);
        lastSendTime = Date.now();
        if (window.lockAction) window.lockAction(actionKey, MIN_INTERVAL_MS);
        return result;
    } finally {
        setTimeout(() => { isSendingMaterials = false; }, 1000);
    }
}

let isSendingEmail = false;

async function sendMaterialsToEmail(email, materialType) {
    logger.init(`sendMaterialsToEmail: ${email}, тип=${materialType}`, 'INFO', '', 4);

    if (isSendingEmail) {
        window.showErrorToast('⏳ Отправка уже выполняется, подождите...');
        return false;
    }
    if (!email || !isValidEmail(email)) {
        window.showErrorToast('❌ Введите корректный email');
        return false;
    }

    let wantChecklist = false, wantTraining = false;
    if (materialType === 'checklist') wantChecklist = true;
    else if (materialType === 'training') wantTraining = true;
    else if (materialType === 'both') { wantChecklist = true; wantTraining = true; }

    isSendingEmail = true;

    let activeButton = null;
    if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('material-email-simple')) {
        activeButton = document.activeElement;
        activeButton.disabled = true;
        activeButton.style.opacity = '0.6';
        activeButton.style.cursor = 'wait';
    }

    try {
        await sendMaterialsEmail(email, wantChecklist, wantTraining);
        window.showSuccessToast('✅ Материалы отправлены! Проверьте почту');
        return true;
    } catch (err) {
        window.showErrorToast('❌ Ошибка: ' + err.message);
        return false;
    } finally {
        setTimeout(() => {
            isSendingEmail = false;
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.style.opacity = '';
                activeButton.style.cursor = '';
            }
        }, 1000);
    }
}

window.sendMaterialsEmail = sendMaterialsEmail;
window.sendMaterialsToEmail = sendMaterialsToEmail;
window.isValidEmail = isValidEmail;