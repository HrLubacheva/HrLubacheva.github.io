// ========== ОТПРАВКА МАТЕРИАЛОВ С ПОВТОРНЫМИ ПОПЫТКАМИ И ЗАЩИТОЙ ОТ СПАМА ==========
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Флаги для предотвращения одновременных отправок
let isSendingMaterials = false;
let lastSendTime = 0;
const MIN_INTERVAL_MS = 5000; // 5 секунд между отправками

function isValidEmail(email) {
    return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
}

async function sendMaterialsEmail(email, wantChecklist, wantTraining) {
    // Проверка на одновременную отправку
    if (isSendingMaterials) {
        throw new Error('Пожалуйста, подождите, предыдущая отправка ещё не завершена');
    }

    // Проверка минимального интервала между отправками
    const now = Date.now();
    if (now - lastSendTime < MIN_INTERVAL_MS) {
        const secondsLeft = Math.ceil((MIN_INTERVAL_MS - (now - lastSendTime)) / 1000);
        throw new Error(`Пожалуйста, подождите ${secondsLeft} секунд перед повторной отправкой`);
    }

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

    isSendingMaterials = true;

    try {
        const result = await window.postWithRetry(url, formData, MAX_RETRIES, RETRY_DELAY);
        lastSendTime = Date.now();
        return result;
    } finally {
        setTimeout(() => {
            isSendingMaterials = false;
        }, 1000);
    }
}

// Обёртка для вызова из модального окна
let isSendingEmail = false;

async function sendMaterialsToEmail(email, materialType) {
    if (isSendingEmail) {
        window.showErrorToast('⏳ Отправка уже выполняется, подождите...');
        return false;
    }

    if (!email || !isValidEmail(email)) {
        window.showErrorToast('❌ Введите корректный email');
        return false;
    }

    let wantChecklist = false;
    let wantTraining = false;

    if (materialType === 'checklist') {
        wantChecklist = true;
    } else if (materialType === 'training') {
        wantTraining = true;
    } else if (materialType === 'both') {
        wantChecklist = true;
        wantTraining = true;
    }

    isSendingEmail = true;

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
        }, 1000);
    }
}

// Экспорт
window.sendMaterialsEmail = sendMaterialsEmail;
window.sendMaterialsToEmail = sendMaterialsToEmail;
window.isValidEmail = isValidEmail;