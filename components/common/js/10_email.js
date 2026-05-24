// ========== ОТПРАВКА МАТЕРИАЛОВ С ПОВТОРНЫМИ ПОПЫТКАМИ ==========
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function isValidEmail(email) {
    return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
}

async function sendMaterialsEmail(email, wantChecklist, wantTraining) {
    if (!email || !isValidEmail(email)) {
        throw new Error('Введите корректный email');
    }

    const url = window.APP_CONFIG ? window.APP_CONFIG.SCRIPT_URL : window.SCRIPT_URL;
    if (!url) {
        throw new Error('URL скрипта не задан');
    }

    const formData = {
        formType: 'Запрос материалов',
        name: email,
        comment: `чек-лист=${wantChecklist}, тренинг=${wantTraining}`,
        consent: true,
        userId: window.getOrCreateLocalUserId()
    };

    // postWithRetry определена в 00_core.js
    return window.postWithRetry(url, formData, MAX_RETRIES, RETRY_DELAY);
}

window.sendMaterialsEmail = sendMaterialsEmail;