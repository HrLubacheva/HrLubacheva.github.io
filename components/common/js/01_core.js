// ============================================================
// 01_core.js – Ядро с обходом CORS, валидацией, сохранением полей + расширенная аналитика
// ============================================================

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

const IS_DEV = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.search.includes('debug=true');

const IS_TEST = window.location.search.includes('test=1');

window.IS_DEV = IS_DEV;
window.IS_TEST = IS_TEST;

window.enableLogs = function () {
    if (typeof window.enableDebug === 'function') {
        window.enableDebug();
    } else {
        logger.warn('enableDebug не доступен');
    }
};

window.disableLogs = function () {
    if (typeof window.disableDebug === 'function') {
        window.disableDebug();
    } else {
        logger.warn('disableDebug не доступен');
    }
};

function getOrCreateLocalUserId() {
    const key = window.APP_CONFIG?.CONSTANTS?.LOCALSTORAGE_USER_ID_KEY || 'hr_user_id';
    try {
        let userId = localStorage.getItem(key);
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem(key, userId);
        }
        return userId;
    } catch (e) {
        if (!window._tempUserIdStore) {
            window._tempUserIdStore = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        }
        return window._tempUserIdStore;
    }
}

let currentUserId = null;
async function initUserId() {
    currentUserId = getOrCreateLocalUserId();
    return currentUserId;
}

let loadingIndicator = null, isLoadingActive = false, loadingStylesAdded = false;

function showLoading(message = 'Загрузка...') {
    if (isLoadingActive) return;
    isLoadingActive = true;
    if (!loadingStylesAdded) {
        const style = document.createElement('style');
        style.textContent = `
            .loading-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(8px);
                color: white;
                padding: 12px 24px;
                border-radius: 40px;
                font-size: 14px;
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: loading-spin 0.8s linear infinite;
            }
            @keyframes loading-spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
        loadingStylesAdded = true;
    }
    loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `<div class="loading-spinner"></div><div class="loading-text">${escapeHtml(message)}</div>`;
    document.body.appendChild(loadingIndicator);
}

function hideLoading() {
    if (!isLoadingActive) return;
    isLoadingActive = false;
    if (loadingIndicator) loadingIndicator.remove();
}

function showToast(message, type = 'error') {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;
    let icon = '⚠️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '🔔';
    if (type === 'error') icon = '❌';
    toast.innerHTML = `${icon} ${escapeHtml(message)}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    document.body.appendChild(toast);
    const duration = window.APP_CONFIG?.CONSTANTS?.TOAST_DURATION || 3000;
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showErrorToast(message) { showToast(message, 'error'); }
function showSuccessToast(message) { showToast(message, 'success'); }
function showWarningToast(message) { showToast(message, 'warning'); }

function generateRequestId() {
    return Date.now() + '_' + Math.random().toString(36).substring(2, 12) + '_' + (currentUserId || getOrCreateLocalUserId());
}

function saveFormFields(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const data = {
        name: form.querySelector('[name="name"]')?.value || '',
        phone: form.querySelector('[name="phone"]')?.value || '',
        email: form.querySelector('[name="email"]')?.value || ''
    };
    try {
        sessionStorage.setItem(`form_${formId}`, JSON.stringify(data));
    } catch(e) {}
}

function loadFormFields(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    let saved;
    try {
        saved = JSON.parse(sessionStorage.getItem(`form_${formId}`));
    } catch(e) {}
    if (!saved) return;
    if (saved.name) {
        const nameInput = form.querySelector('[name="name"]');
        if (nameInput) nameInput.value = saved.name;
    }
    if (saved.phone) {
        const phoneInput = form.querySelector('[name="phone"]');
        if (phoneInput) phoneInput.value = saved.phone;
    }
    if (saved.email) {
        const emailInput = form.querySelector('[name="email"]');
        if (emailInput) emailInput.value = saved.email;
    }
}

function clearFormFields(formId) {
    try {
        sessionStorage.removeItem(`form_${formId}`);
    } catch(e) {}
}

function bindFormAutoSave(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    const inputs = form.querySelectorAll('[name="name"], [name="phone"], [name="email"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => saveFormFields(formId));
    });
}

function saveFailedRequest(url, data) {
    try {
        const failedKey = 'hr_failed_requests';
        let failed = JSON.parse(localStorage.getItem(failedKey) || '[]');
        const requestId = data.requestId;
        const now = Date.now();
        const isDuplicate = failed.some(item => item.requestId === requestId && (now - item.timestamp) < 30000);
        if (isDuplicate) return;
        failed.push({ url, data, timestamp: now, requestId });
        if (failed.length > 50) failed = failed.slice(-50);
        localStorage.setItem(failedKey, JSON.stringify(failed));
        logger.debug('💾 Запрос сохранён локально');
    } catch(e) { logger.error('Ошибка сохранения запроса', e); }
}

async function retryFailedRequests() {
    try {
        const failedKey = 'hr_failed_requests';
        let failed = JSON.parse(localStorage.getItem(failedKey) || '[]');
        if (failed.length === 0) return;
        const newFailed = [];
        for (const req of failed) {
            const success = await window.sendViaBeaconOrFetch(req.url, req.data, true);
            if (!success) {
                newFailed.push(req);
            }
        }
        localStorage.setItem(failedKey, JSON.stringify(newFailed));
        logger.debug(`🔄 Повторная отправка: отправлено ${failed.length - newFailed.length}, осталось ${newFailed.length}`);
    } catch(e) { logger.error('Ошибка повторной отправки', e); }
}

setInterval(retryFailedRequests, 60000);
window.addEventListener('load', () => setTimeout(retryFailedRequests, 5000));

window.sendViaBeaconOrFetch = async function(url, data, isRetry = false) {
    const formData = new URLSearchParams(data);
    if (navigator.sendBeacon && navigator.sendBeacon(url, formData)) {
        logger.debug('📡 Отправлено через sendBeacon');
        return true;
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            logger.debug('📡 Отправлено через fetch');
            return true;
        }
        throw new Error('Ответ сервера не OK: ' + response.status);
    } catch (err) {
        logger.error('Ошибка отправки (попробуем fallback no-cors):', err);
        try {
            await fetch(url, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                mode: 'no-cors',
                cache: 'no-store'
            });
            logger.debug('📡 Отправлено через fetch (no-cors) – статус неизвестен, но данные вероятно ушли');
            return true;
        } catch (e) {
            logger.error('Fallback тоже провалился:', e);
            return false;
        }
    }
};

window.postWithRetry = async function(url, data, maxRetries = 3, baseDelay = 2000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const success = await window.sendViaBeaconOrFetch(url, data, attempt > 1);
            if (success) return true;
            throw new Error('Отправка вернула false');
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 10000);
                logger.debug(`🔄 Повторная попытка ${attempt}/${maxRetries} через ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error('Все попытки отправки не удались');
};

function normalizePhoneDigits(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    const maxDigits = window.APP_CONFIG?.CONSTANTS?.MAX_PHONE_DIGITS || 11;
    if (digits.length > maxDigits) digits = digits.slice(0, maxDigits);
    return digits;
}

function validatePhoneDigits(phone) {
    const digits = normalizePhoneDigits(phone);
    const maxDigits = window.APP_CONFIG?.CONSTANTS?.MAX_PHONE_DIGITS || 11;
    return digits.length === maxDigits && /^7\d{10}$/.test(digits);
}

function validateEmailFormat(email) {
    if (!email) return true;
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
}

function showFieldError(input, message) {
    if (input._errorElement) input._errorElement.remove();
    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error-message';
    errorSpan.textContent = message;
    input.insertAdjacentElement('afterend', errorSpan);
    input._errorElement = errorSpan;
    input.classList.add('input-error');
}

function clearFieldError(input) {
    if (input._errorElement) {
        input._errorElement.remove();
        input._errorElement = null;
    }
    input.classList.remove('input-error');
}

function validatePhoneField(input, showImmediate = true) {
    const phone = input.value.trim();
    if (!phone) {
        if (showImmediate) showFieldError(input, '❌ Введите номер телефона');
        return false;
    }
    const isValid = validatePhoneDigits(phone);
    if (!isValid && showImmediate) showFieldError(input, '❌ Некорректный номер. Нужно 11 цифр, например +7 921 791-66-55');
    else clearFieldError(input);
    return isValid;
}

function validateEmailField(input, showImmediate = true) {
    const email = input.value.trim();
    if (!email) {
        clearFieldError(input);
        return true;
    }
    const isValid = validateEmailFormat(email);
    if (!isValid && showImmediate) showFieldError(input, '❌ Введите корректный email, например name@domain.ru');
    else clearFieldError(input);
    return isValid;
}

function bindLiveValidation(input, type = 'phone') {
    if (!input) return;
    const validateFn = type === 'phone' ? validatePhoneField : validateEmailField;
    input.addEventListener('blur', () => validateFn(input, true));
    input.addEventListener('input', () => clearFieldError(input));
}

function applyPhoneMask(inputElement) {
    if (!inputElement) return;
    if (inputElement._phoneMaskHandler) {
        inputElement.removeEventListener('input', inputElement._phoneMaskHandler);
    }
    const formatPhone = (digits) => {
        if (!digits) return '';
        if (digits.length === 0) return '';
        if (digits.length > 11) digits = digits.slice(0, 11);
        let result = '+7';
        if (digits.length >= 2) {
            result += ' (' + digits.slice(1, 4);
            if (digits.length >= 5) result += ')';
            else result += ')';
        }
        if (digits.length >= 5) {
            result += ' ' + digits.slice(4, 7);
        }
        if (digits.length >= 8) {
            result += '-' + digits.slice(7, 9);
        }
        if (digits.length >= 10) {
            result += '-' + digits.slice(9, 11);
        }
        if (digits.length >= 2 && digits.length <= 4 && !result.includes(')')) {
            result += ')';
        }
        return result;
    };
    const handler = function(e) {
        const oldValue = this.value;
        let digits = oldValue.replace(/\D/g, '');
        if (digits.length === 0) {
            if (this.value !== '') this.value = '';
            return;
        }
        let formatted = formatPhone(digits);
        if (formatted === oldValue) return;
        const cursorPos = this.selectionStart;
        let digitsBeforeCursor = 0;
        for (let i = 0; i < cursorPos && i < oldValue.length; i++) {
            if (/\d/.test(oldValue[i])) digitsBeforeCursor++;
        }
        this.value = formatted;
        let newCursorPos = 0;
        let digitsCount = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) digitsCount++;
            if (digitsCount === digitsBeforeCursor) {
                newCursorPos = i + 1;
                break;
            }
        }
        if (newCursorPos === 0 && digitsBeforeCursor === digits.length) {
            newCursorPos = formatted.length;
        }
        this.setSelectionRange(newCursorPos, newCursorPos);
    };
    inputElement.addEventListener('input', handler);
    inputElement._phoneMaskHandler = handler;
    handler.call(inputElement);
}

function initPhoneMasks() {
    const phoneInputs = document.querySelectorAll('.phone-mask, #callbackPhone, #quickPhone');
    phoneInputs.forEach(input => { if (input) applyPhoneMask(input); });
}

// ========== РАСШИРЕННАЯ АНАЛИТИКА (СТАБИЛЬНЫЕ ДАННЫЕ + БАТАРЕЯ) ==========
async function getBatteryInfo() {
    if (!navigator.getBattery) return { level: '-', charging: '-' };
    try {
        const battery = await navigator.getBattery();
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        return { level: level, charging: charging };
    } catch(e) {
        return { level: '-', charging: '-' };
    }
}

function getExtendedDeviceInfo() {
    let connectionType = '-';
    if (navigator.connection) {
        connectionType = navigator.connection.effectiveType || '-';
    }

    return {
        language: navigator.language || navigator.userLanguage || '-',
        screenResolution: screen.width + 'x' + screen.height,
        screenColorDepth: screen.colorDepth + 'bit',
        timezone: -new Date().getTimezoneOffset() / 60,
        timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone || '-',
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        connection: connectionType,
        deviceMemory: navigator.deviceMemory || '-',
        hardwareConcurrency: navigator.hardwareConcurrency || '-'
    };
}

async function sendDataToSheetWithRetry(data, retries = 3, delay = 2000) {
    const userId = currentUserId || getOrCreateLocalUserId();
    data.userId = userId;
    if (typeof window.getCartData === 'function') data.cart = window.getCartData();
    else data.cart = '';
    data.requestId = generateRequestId();

    const extendedInfo = getExtendedDeviceInfo();
    data.language = extendedInfo.language;
    data.screenResolution = extendedInfo.screenResolution;
    data.timezone = extendedInfo.timezone;
    data.theme = extendedInfo.theme;
    data.connection = extendedInfo.connection;

    const batteryInfo = await getBatteryInfo();
    data.batteryLevel = batteryInfo.level;
    data.batteryCharging = batteryInfo.charging;

    let targetUrl = window.APP_CONFIG?.SCRIPT_URL;
    if (IS_TEST && window.APP_CONFIG?.TEST_SCRIPT_URL) {
        targetUrl = window.APP_CONFIG.TEST_SCRIPT_URL;
        data.test_mode = '1';
        logger.debug('🧪 Тестовый режим: отправка на', targetUrl);
    }

    if (!targetUrl) {
        logger.error('SCRIPT_URL не задан');
        return false;
    }

    try {
        await window.postWithRetry(targetUrl, data, retries, delay);
        return true;
    } catch (err) {
        logger.error('❌ Ошибка отправки в Google Sheets после всех попыток:', err);
        saveFailedRequest(targetUrl, data);
        showWarningToast('⚠️ Данные сохранены локально, будут отправлены позже.');
        return false;
    }
}

function sendDataToSheet(data) {
    sendDataToSheetWithRetry(data).catch(err => {
        logger.error('❌ Ошибка отправки в Google Sheets:', err);
        showWarningToast('⚠️ Данные сохранены локально, будут отправлены позже.');
    });
}

window.sendDataToSheet = sendDataToSheet;
window.sendDataToSheetWithRetry = sendDataToSheetWithRetry;

function formatPhoneNumber(input) {
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    const maxDigits = window.APP_CONFIG?.CONSTANTS?.MAX_PHONE_DIGITS || 11;
    if (digits.length > maxDigits) digits = digits.slice(0, maxDigits);
    let formatted = '';
    if (digits.length === 0) return '';
    formatted = '+7';
    if (digits.length > 1) formatted += ' ' + digits.slice(1, 4);
    if (digits.length >= 5) formatted += ' ' + digits.slice(4, 7);
    if (digits.length >= 8) formatted += ' ' + digits.slice(7, 9);
    if (digits.length >= 10) formatted += ' ' + digits.slice(9, 11);
    return formatted;
}

window.sessionStartTime = Date.now();

function getTimeOnSite() {
    if (!window.sessionStartTime) return '-';
    const seconds = Math.floor((Date.now() - window.sessionStartTime) / 1000);
    if (seconds < 60) return `${seconds} сек`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} мин ${secs} сек`;
}
window.getTimeOnSite = getTimeOnSite;

function getVisitStats() {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    let visits = [];
    const visitsKey = window.APP_CONFIG?.CONSTANTS?.LOCALSTORAGE_VISITS_KEY || 'hr_visits';
    try {
        const stored = localStorage.getItem(visitsKey);
        if (stored) {
            visits = JSON.parse(stored);
            const monthAgo = now.getTime() - oneMonth;
            visits = visits.filter(v => v > monthAgo);
        }
    } catch(e) {}
    const lastVisit = visits.length > 0 ? visits[visits.length - 1] : 0;
    if (now.getTime() - lastVisit > 30 * 60 * 1000) visits.push(now.getTime());
    try { localStorage.setItem(visitsKey, JSON.stringify(visits)); } catch(e) {}
    const weekAgo = now.getTime() - oneWeek;
    const monthAgo = now.getTime() - oneMonth;
    return {week: visits.filter(v => v > weekAgo).length, month: visits.filter(v => v > monthAgo).length, total: visits.length};
}
function getVisitStatsText() {
    const stats = getVisitStats();
    return `за неделю: ${stats.week}, за месяц: ${stats.month}`;
}
window.getVisitStats = getVisitStats;
window.getVisitStatsText = getVisitStatsText;

function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        source: urlParams.get('utm_source') || '-',
        medium: urlParams.get('utm_medium') || '-',
        campaign: urlParams.get('utm_campaign') || '-',
        content: urlParams.get('utm_content') || '-',
        term: urlParams.get('utm_term') || '-'
    };
}
window.getUTMParams = getUTMParams;
function getUTMText() {
    const u = getUTMParams();
    return `source=${u.source}, medium=${u.medium}, campaign=${u.campaign}, content=${u.content}, term=${u.term}`;
}
window.getUTMText = getUTMText;

function getDeviceInfo() {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
    let device = 'ПК';
    if (isTablet) device = 'планшет';
    else if (isMobile) device = 'мобильное';
    let browser = 'другой';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    let os = 'другая';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    return {device, browser, os};
}
window.getDeviceInfo = getDeviceInfo;
function getDeviceText() {
    const d = getDeviceInfo();
    return `${d.device}, ${d.browser}, ${d.os}`;
}
window.getDeviceText = getDeviceText;

function getPageInfo() {
    return {
        page: window.location.pathname + window.location.search,
        referrer: document.referrer || '-',
        fullUrl: window.location.href
    };
}
window.getPageInfo = getPageInfo;
function getPageText() {
    const p = getPageInfo();
    return `страница: ${p.page}, реферер: ${p.referrer || '-'}`;
}
window.getPageText = getPageText;

async function getGeoData() {
    const geoKey = window.APP_CONFIG?.CONSTANTS?.LOCALSTORAGE_GEO_KEY || 'hr_geo';
    const apiUrl = window.APP_CONFIG?.CONSTANTS?.GEO_API_URL || 'https://ipapi.co/json/';
    let cached = null;
    try {
        const raw = localStorage.getItem(geoKey);
        if (raw) {
            cached = JSON.parse(raw);
            if (cached && typeof cached === 'object') return cached;
        }
    } catch(e) {}
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Ошибка геолокации');
        const data = await response.json();
        const result = {
            ip: data.ip || '-',
            city: data.city || '-',
            region: data.region || '-',
            country: data.country_name || '-',
            geoText: `${data.city || ''} ${data.region || ''} ${data.country_name || ''} (${data.ip || ''})`.trim().replace(/  +/g, ' ') || '-'
        };
        try { localStorage.setItem(geoKey, JSON.stringify(result)); } catch(e) {}
        return result;
    } catch(e) {
        logger.warn(e);
        return {ip: '-', city: '-', region: '-', country: '-', geoText: '-'};
    }
}
window.getGeoData = getGeoData;

window._actionLocks = window._actionLocks || {};
window.isActionLocked = function(actionKey, durationMs = 60000) {
    const lockedUntil = window._actionLocks[actionKey];
    if (lockedUntil && Date.now() < lockedUntil) {
        const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
        window.showWarningToast(`⏳ Подождите ${secondsLeft} сек. перед повторным действием`);
        return true;
    }
    return false;
};
window.lockAction = function(actionKey, durationMs = 60000) {
    window._actionLocks[actionKey] = Date.now() + durationMs;
    setTimeout(() => {
        if (window._actionLocks[actionKey] && window._actionLocks[actionKey] <= Date.now()) {
            delete window._actionLocks[actionKey];
        }
    }, durationMs + 1000);
};

window._lastSubmitTime = {};

window.submitForm = async function (formId, formType, getAdditionalData = null) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const now = Date.now();
    if (window._lastSubmitTime[formId] && now - window._lastSubmitTime[formId] < 5000) {
        showWarningToast('⏳ Пожалуйста, подождите несколько секунд перед повторной отправкой');
        return false;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : 'Отправить';

    if (form._isSubmitting) {
        showWarningToast('⏳ Отправка уже выполняется, подождите...');
        return false;
    }

    try {
        form._isSubmitting = true;
        window._lastSubmitTime[formId] = now;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.innerText = 'Отправка...';
        }

        const name = form.querySelector('[name="name"]')?.value.trim() || '';
        let phone = form.querySelector('[name="phone"]')?.value.trim() || '';
        const email = form.querySelector('[name="email"]')?.value.trim() || '';
        const comment = form.querySelector('[name="comment"]')?.value.trim() || '';
        const consent = form.querySelector('[name="consent"]')?.checked || false;

        let additional = {};
        if (getAdditionalData) additional = await getAdditionalData(form);

        if (phone) phone = normalizePhoneDigits(phone);

        if (!phone && formType !== 'Запрос материалов') {
            showErrorToast('Введите номер телефона');
            throw new Error('Телефон обязателен');
        }

        const maxDigits = window.APP_CONFIG?.CONSTANTS?.MAX_PHONE_DIGITS || 11;
        if (phone && phone.length !== maxDigits) {
            showErrorToast('Некорректный номер телефона. Введите 11 цифр.');
            throw new Error('Неверный номер');
        }

        const geo = await window.getGeoData();

        const formData = {
            formType: formType,
            name: name || ' ',
            phone: phone || ' ',
            email: email || ' ',
            comment: comment || 'Не указано',
            consent: consent ? 'Да' : 'Нет',
            timeOnSite: window.getTimeOnSite(),
            visitStats: window.getVisitStatsText(),
            utm: window.getUTMText(),
            device: window.getDeviceText(),
            page: window.getPageText(),
            geo: geo.geoText,
            userId: window.getOrCreateLocalUserId(),
            ip: geo.ip || '-',
            referrer: document.referrer || '-',
            helpRequested: window.helpRequested ? 'Да' : 'Нет',
            helpType: window.helpType || '',
            ...additional
        };

        if (IS_DEV || window.location.search.includes('debug=1')) {
            logger.debug('📋 Отправка формы:', formType, formData);
        }

        await window.sendDataToSheetWithRetry(formData);

        const phoneDisplay = phone ? phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3-$4-$5') : '';
        showSuccessToast(`🎉 Спасибо, ${name || 'друг'}! Ваша заявка принята. ${phoneDisplay ? `Мы свяжемся с вами по номеру ${phoneDisplay}` : 'Мы свяжемся с вами в ближайшее время.'}`);

        clearFormFields(formId);
        form.reset();
        const hiddenFields = ['chosenVariant', 'chosenVariantPrice', 'originalChosenVariant', 'originalChosenVariantPrice', 'recommendedVariants', 'quizAnswersRaw'];
        hiddenFields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) input.value = '';
        });

        window.helpRequested = false;
        window.helpType = null;

        return true;
    } catch (err) {
        logger.error('Ошибка отправки:', err);
        if (!err.message || !err.message.includes('Телефон')) {
            showErrorToast('❌ Не удалось отправить заявку. Пожалуйста, попробуйте позже или свяжитесь с нами напрямую.');
        }
        return false;
    } finally {
        form._isSubmitting = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerText = originalBtnText;
        }
    }
};

window.getQuizDataFromForm = function (form) {
    return {
        chosenVariant: form.querySelector('[name="chosenVariant"]')?.value || '',
        chosenVariantPrice: form.querySelector('[name="chosenVariantPrice"]')?.value || '',
        originalChosenVariant: form.querySelector('[name="originalChosenVariant"]')?.value || '',
        originalChosenVariantPrice: form.querySelector('[name="originalChosenVariantPrice"]')?.value || '',
        recommendedVariants: form.querySelector('[name="recommendedVariants"]')?.value || '',
        quizAnswersRaw: form.querySelector('[name="quizAnswersRaw"]')?.value || '',
        cart: typeof window.getCartData === 'function' ? window.getCartData() : ''
    };
};

function initShareButtons() {
    const shareButtons = document.querySelectorAll('#shareButtonContacts, .floating-share-btn button');
    const getSiteShareText = () => {
        return `Виктория Любачева | Карьерный консультант\n\n✅ 24 года в HR, 1000+ закрытых вакансий, 500+ карьерных консультаций.\n\n🔗 ${window.location.href.split('?')[0]}`;
    };
    shareButtons.forEach(btn => {
        if (btn) {
            btn.removeEventListener('click', btn._shareHandler);
            btn._shareHandler = () => {
                const text = getSiteShareText();
                navigator.clipboard.writeText(text).then(() => {
                    window.showSuccessToast('✅ Ссылка на сайт скопирована');
                }).catch(() => {
                    window.showErrorToast('❌ Не удалось скопировать');
                });
            };
            btn.addEventListener('click', btn._shareHandler);
        }
    });
}

window.saveFormFields = saveFormFields;
window.loadFormFields = loadFormFields;
window.clearFormFields = clearFormFields;
window.bindFormAutoSave = bindFormAutoSave;
window.escapeHtml = escapeHtml;
window.getOrCreateLocalUserId = getOrCreateLocalUserId;
window.initUserId = initUserId;
window.formatPhoneNumber = formatPhoneNumber;
window.normalizePhoneDigits = normalizePhoneDigits;
window.validatePhoneDigits = validatePhoneDigits;
window.validateEmailFormat = validateEmailFormat;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.validatePhoneField = validatePhoneField;
window.validateEmailField = validateEmailField;
window.bindLiveValidation = bindLiveValidation;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.showErrorToast = showErrorToast;
window.showSuccessToast = showSuccessToast;
window.showWarningToast = showWarningToast;
window.initShareButtons = initShareButtons;
window.applyPhoneMask = applyPhoneMask;
window.initPhoneMasks = initPhoneMasks;