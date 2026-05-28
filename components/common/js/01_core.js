// ============================================================
// 01_core.js – Ядро: утилиты, тосты, fetch, валидация, отправка форм, гео, UTM и т.д.
// ============================================================

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

const IS_DEV = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.search.includes('debug=true');

let originalConsoleLog = null;

function log(...args) {
    if (IS_DEV) console.log(...args);
}

function logError(...args) {
    console.error(...args);
}

function logWarn(...args) {
    if (IS_DEV) console.warn(...args);
}

window.IS_DEV = IS_DEV;

window.enableLogs = function () {
    if (typeof originalConsoleLog === 'undefined') return;
    console.log = originalConsoleLog;
    originalConsoleLog = null;
    showToast('🔍 Логи включены', 'success');
};
window.disableLogs = function () {
    if (originalConsoleLog === null) originalConsoleLog = console.log;
    console.log = function () {};
    showToast('🔇 Логи отключены', 'success');
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
        if (!window._tempUserId) {
            window._tempUserId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        }
        return window._tempUserId;
    }
}

let currentUserId = null;

async function initUserId() {
    currentUserId = getOrCreateLocalUserId();
    return currentUserId;
}

async function fetchWithRetry(url, options = {}, retries = null, timeout = null) {
    const maxRetries = retries !== null ? retries : (window.APP_CONFIG?.CONSTANTS?.FETCH_RETRIES || 3);
    const timeoutMs = timeout !== null ? timeout : (window.APP_CONFIG?.CONSTANTS?.FETCH_TIMEOUT || 10000);
    const baseDelay = window.APP_CONFIG?.CONSTANTS?.FETCH_RETRY_DELAY_BASE || 2000;
    const maxDelay = window.APP_CONFIG?.CONSTANTS?.FETCH_RETRY_DELAY_MAX || 5000;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch(url, {...options, signal: controller.signal});
            clearTimeout(timeoutId);
            if (response.ok) return response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (err) {
            lastError = err;
        }
        if (attempt < maxRetries) {
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

async function fetchTextWithRetry(url, retries = 3, timeout = 10000) {
    const response = await fetchWithRetry(url, {}, retries, timeout);
    return response.text();
}

async function loadWithCache(cacheKey, fetchFn, ttl = null) {
    const cacheTtl = ttl !== null ? ttl : (window.APP_CONFIG?.CONSTANTS?.CACHE_TTL || 10 * 60 * 1000);
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const {data, timestamp} = JSON.parse(cached);
                if (Date.now() - timestamp < cacheTtl) return data;
            } catch (e) {
                if (IS_DEV) console.warn(e);
            }
        }
    } catch (e) {}
    const data = await fetchFn();
    try {
        localStorage.setItem(cacheKey, JSON.stringify({data, timestamp: Date.now()}));
    } catch (e) {}
    return data;
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
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, window.APP_CONFIG?.CONSTANTS?.TOAST_DURATION || 3000);
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function showSuccessToast(message) {
    showToast(message, 'success');
}

function showWarningToast(message) {
    showToast(message, 'warning');
}

// ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ postWithRetry (CORS fix) ==========
window.postWithRetry = async function (url, data, retries = null, baseDelay = null) {
    const maxRetries = retries !== null ? retries : (window.APP_CONFIG?.CONSTANTS?.FETCH_RETRIES || 3);
    const delayMs = baseDelay !== null ? baseDelay : (window.APP_CONFIG?.CONSTANTS?.FETCH_RETRY_DELAY_BASE || 2000);
    let lastError = null;

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const mode = isLocal ? 'no-cors' : 'cors';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const body = new URLSearchParams(data);
            const response = await fetch(url, {
                method: 'POST',
                body: body,
                mode: mode,
                credentials: 'omit'
            });
            if (mode === 'no-cors') {
                return true;
            }
            if (response.ok) {
                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    throw new Error('Не удалось разобрать ответ сервера');
                }
                if (result && result.result === 'ok') return true;
                else throw new Error(result?.message || 'Сервер вернул ошибку');
            } else throw new Error(`HTTP ${response.status}`);
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
        }
    }
    throw lastError;
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
    const phoneInputs = document.querySelectorAll('#callbackPhone, #quickPhone');
    phoneInputs.forEach(input => {
        if (input) applyPhoneMask(input);
    });
}

async function sendDataToSheetWithRetry(data, retries = 3, delay = 2000) {
    const userId = currentUserId || getOrCreateLocalUserId();
    data.userId = userId;
    if (typeof window.getCartData === 'function') data.cart = window.getCartData();
    else data.cart = '';
    return window.postWithRetry(window.APP_CONFIG.SCRIPT_URL, data, retries, delay);
}

function sendDataToSheet(data) {
    sendDataToSheetWithRetry(data).catch(err => {
        logError('❌ Ошибка отправки в Google Sheets:', err);
        showErrorToast('Ошибка связи. Попробуйте ещё раз или свяжитесь с нами напрямую.');
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
            try {
                visits = JSON.parse(stored);
                const monthAgo = now.getTime() - oneMonth;
                visits = visits.filter(v => v > monthAgo);
            } catch (e) {
                if (IS_DEV) console.warn(e);
                visits = [];
            }
        }
    } catch (e) {}
    const lastVisit = visits.length > 0 ? visits[visits.length - 1] : 0;
    if (now.getTime() - lastVisit > 30 * 60 * 1000) visits.push(now.getTime());
    try {
        localStorage.setItem(visitsKey, JSON.stringify(visits));
    } catch (e) {}
    const weekAgo = now.getTime() - oneWeek;
    const monthAgo = now.getTime() - oneMonth;
    return {week: visits.filter(v => v > weekAgo).length, month: visits.filter(v => v > monthAgo).length, total: visits.length};
}

function getVisitStatsText() {
    const stats = getVisitStats();
    return `📊 Визиты: ${stats.week} за неделю, ${stats.month} за месяц`;
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
    return `📊 UTM: source=${u.source}, medium=${u.medium}, campaign=${u.campaign}, content=${u.content}, term=${u.term}`;
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
    return `📱 Устройство: ${d.device}, браузер: ${d.browser}, ОС: ${d.os}`;
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
    return `📄 Страница: ${p.page}\n🔗 Referrer: ${p.referrer || '-'}`;
}

window.getPageText = getPageText;

async function getGeoData() {
    const geoKey = window.APP_CONFIG?.CONSTANTS?.LOCALSTORAGE_GEO_KEY || 'hr_geo';
    const apiUrl = window.APP_CONFIG?.CONSTANTS?.GEO_API_URL || 'https://ipapi.co/json/';
    let cached = null;
    try {
        const raw = localStorage.getItem(geoKey);
        if (raw) {
            try {
                cached = JSON.parse(raw);
                if (cached && typeof cached === 'object') return cached;
            } catch (e) {}
        }
    } catch (e) {}
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
        try {
            localStorage.setItem(geoKey, JSON.stringify(result));
        } catch (e) {}
        return result;
    } catch (e) {
        if (IS_DEV) console.warn(e);
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

window.submitForm = async function (formId, formType, getAdditionalData = null) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : 'Отправить';

    if (form._isSubmitting) {
        showWarningToast('⏳ Отправка уже выполняется, подождите...');
        return false;
    }

    try {
        form._isSubmitting = true;

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
            ...additional
        };

        await window.sendDataToSheetWithRetry(formData);
        showSuccessToast(`Спасибо! ${name ? name : ''} Мы свяжемся с вами.`);
        form.reset();

        const hiddenFields = ['chosenVariant', 'chosenVariantPrice', 'originalChosenVariant', 'originalChosenVariantPrice', 'recommendedVariants', 'quizAnswersRaw'];
        hiddenFields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) input.value = '';
        });

        return true;
    } catch (err) {
        logError('Ошибка отправки:', err);
        if (!err.message || !err.message.includes('Телефон')) {
            showErrorToast('Не удалось отправить заявку. Пожалуйста, попробуйте позже или свяжитесь с нами напрямую.');
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
        cart: window.getCartData ? window.getCartData() : ''
    };
};

function initShareButtons() {
    const shareButtons = document.querySelectorAll('#shareButtonContacts, .floating-share-btn button');
    const getSiteShareText = () => {
        return `Виктория Любачева | Карьерный консультант\n\n✅ 24 года в HR, 1000+ закрытых вакансий, 500+ карьерных консультаций.\n✅ Диагностика запроса: 15 минут.\n\n🔗 ${window.location.href.split('?')[0]}`;
    };
    shareButtons.forEach(btn => {
        if (btn) {
            btn.removeEventListener('click', btn._shareHandler);
            btn._shareHandler = () => {
                const text = getSiteShareText();
                navigator.clipboard.writeText(text).then(() => {
                    window.showSuccessToast('✅ Ссылка на сайт скопирована');
                })
                .catch(() => {
                    window.showErrorToast('❌ Не удалось скопировать');
                });
            };
            btn.addEventListener('click', btn._shareHandler);
        }
    });
}

window.initLogs = [];

let currentLogLevel = window.APP_CONFIG?.CONSTANTS?.LOG_LEVEL || 0;
if (window.location.search.includes('debug=1') || localStorage.getItem('hr_debug_mode') === 'true') {
    currentLogLevel = Math.max(currentLogLevel, 5);
}
const urlLogLevel = parseInt(new URLSearchParams(window.location.search).get('loglevel'));
if (!isNaN(urlLogLevel) && urlLogLevel >= 0 && urlLogLevel <= 7) {
    currentLogLevel = urlLogLevel;
    localStorage.setItem('hr_log_level', urlLogLevel);
}
window.currentLogLevel = currentLogLevel;

function logInit(message, level = 'INFO', context = '', requiredLevel = 3) {
    const timestamp = new Date().toISOString();
    const logEntry = {timestamp, level, message, context, url: window.location.href, requiredLevel};
    window.initLogs.push(logEntry);
    const isDebug = currentLogLevel >= requiredLevel;
    if (isDebug) {
        let style = '';
        if (level === 'ERROR') style = 'color:red; font-weight:bold';
        else if (level === 'WARN') style = 'color:orange';
        else if (level === 'TRACE') style = 'color:gray';
        else if (level === 'DEBUG') style = 'color:blue';
        else style = 'color:green';
        console.log(`%c[${timestamp}] [${level}] ${message} ${context ? '(' + context + ')' : ''}`, style);
    }
    const forceSend = window.APP_CONFIG?.CONSTANTS?.FORCE_SEND_LOGS_TO_SERVER || false;
    if (level === 'ERROR' || level === 'WARN' || (window.location.search.includes('debug=1') && currentLogLevel >= requiredLevel) || forceSend) {
        sendInitLog(logEntry);
    }
}

function sendInitLog(logEntry) {
    const url = window.APP_CONFIG?.SCRIPT_URL;
    if (!url) return;
    const formData = new URLSearchParams();
    formData.append('formType', 'Лог инициализации');
    formData.append('name', 'System');
    formData.append('comment', JSON.stringify(logEntry));
    formData.append('consent', 'Да');
    formData.append('userId', window.getOrCreateLocalUserId?.() || 'unknown');
    formData.append('page', window.location.href);
    formData.append('userAgent', navigator.userAgent);
    navigator.sendBeacon(url, formData);
}

const originalErrorHandler = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
    logInit(`Uncaught error: ${message} at ${source}:${lineno}:${colno}`, 'ERROR', error?.stack, 1);
    if (originalErrorHandler) originalErrorHandler(message, source, lineno, colno, error);
};
const originalUnhandledRejection = window.onunhandledrejection;
window.onunhandledrejection = function (event) {
    logInit(`Unhandled rejection: ${event.reason}`, 'ERROR', event.reason?.stack, 1);
    if (originalUnhandledRejection) originalUnhandledRejection(event);
};

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
window.fetchWithRetry = fetchWithRetry;
window.fetchTextWithRetry = fetchTextWithRetry;
window.loadWithCache = loadWithCache;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.log = log;
window.logError = logError;
window.logWarn = logWarn;
window.showToast = showToast;
window.showErrorToast = showErrorToast;
window.showSuccessToast = showSuccessToast;
window.showWarningToast = showWarningToast;
window.initShareButtons = initShareButtons;
window.applyPhoneMask = applyPhoneMask;
window.initPhoneMasks = initPhoneMasks;
window.logInit = logInit;