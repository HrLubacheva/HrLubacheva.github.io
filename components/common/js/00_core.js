// ========== ОБЩИЕ УТИЛИТЫ ==========
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
let originalConsoleLog = null;

function log(...args) { if (IS_DEV) console.log(...args); }
function logError(...args) { console.error(...args); }
function logWarn(...args) { if (IS_DEV) console.warn(...args); }

window.IS_DEV = IS_DEV;

if (!IS_DEV) {
    originalConsoleLog = console.log;
    console.log = function() {};
}

window.enableLogs = function() {
    if (originalConsoleLog) {
        console.log = originalConsoleLog;
        originalConsoleLog = null;
    } else {
        console.log = function(...args) { if (typeof console !== 'undefined') console.log(...args); };
    }
    showToast('🔍 Логи включены', 'success');
};
window.disableLogs = function() {
    if (originalConsoleLog === null) originalConsoleLog = console.log;
    console.log = function() {};
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
    } catch(e) {
        if (!window._tempUserId) {
            window._tempUserId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        }
        return window._tempUserId;
    }
}
let currentUserId = null;

function initUserId() {
    currentUserId = getOrCreateLocalUserId();
    return Promise.resolve(currentUserId);
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
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) return response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (err) { lastError = err; }
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
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < cacheTtl) return data;
            } catch(e) {
                if (IS_DEV) console.warn('Ошибка парсинга кэша', e);
            }
        }
    } catch(e) {}
    const data = await fetchFn();
    try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch(e) {}
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
            @keyframes loading-spin {
                to { transform: rotate(360deg); }
            }
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
    toast.setAttribute('aria-live', 'polite');   // ДОБАВЛЕНО для доступности
    if (type === 'error') {
        toast.setAttribute('aria-live', 'assertive');
    } else {
        toast.setAttribute('aria-live', 'polite');
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, window.APP_CONFIG?.CONSTANTS?.TOAST_DURATION || 3000);
}
function showErrorToast(message) { showToast(message, 'error'); }
function showSuccessToast(message) { showToast(message, 'success'); }
function showWarningToast(message) { showToast(message, 'warning'); }

const SCRIPT_URL = window.APP_CONFIG.SCRIPT_URL;
if (typeof window !== 'undefined') {
    window.SCRIPT_URL = SCRIPT_URL;
}

// ========== УНИВЕРСАЛЬНАЯ ОТПРАВКА POST С ПОВТОРНЫМИ ПОПЫТКАМИ ==========
async function postWithRetry(url, data, retries = null, baseDelay = null) {
    const maxRetries = retries !== null ? retries : (window.APP_CONFIG?.CONSTANTS?.FETCH_RETRIES || 3);
    const delayMs = baseDelay !== null ? baseDelay : (window.APP_CONFIG?.CONSTANTS?.FETCH_RETRY_DELAY_BASE || 2000);
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const body = new URLSearchParams(data);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });
            if (response.ok) {
                let result;
                try {
                    result = await response.json();
                } catch(e) {
                    throw new Error('Не удалось разобрать ответ сервера');
                }
                if (result && result.result === 'ok') {
                    return true;
                } else {
                    throw new Error(result?.message || 'Сервер вернул ошибку');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
            }
        }
    }
    throw lastError;
}
window.postWithRetry = postWithRetry;

// ========== НОРМАЛИЗАЦИЯ ТЕЛЕФОНА (ЕДИНАЯ ФУНКЦИЯ) ==========
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
    if (!isValid && showImmediate) {
        showFieldError(input, '❌ Некорректный номер. Нужно 11 цифр, например +7 921 791-66-55');
    } else {
        clearFieldError(input);
    }
    return isValid;
}

function validateEmailField(input, showImmediate = true) {
    const email = input.value.trim();
    if (!email) {
        clearFieldError(input);
        return true;
    }
    const isValid = validateEmailFormat(email);
    if (!isValid && showImmediate) {
        showFieldError(input, '❌ Введите корректный email, например name@domain.ru');
    } else {
        clearFieldError(input);
    }
    return isValid;
}

function bindLiveValidation(input, type = 'phone') {
    if (!input) return;
    const validateFn = type === 'phone' ? validatePhoneField : validateEmailField;
    input.addEventListener('blur', () => validateFn(input, true));
    input.addEventListener('input', () => clearFieldError(input));
}

// ========== МАСКА ТЕЛЕФОНА (с выводом ошибок в общий блок формы) ==========
function applyPhoneMask(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', function(e) {
        let raw = this.value.replace(/\D/g, '');
        const maxDigits = window.APP_CONFIG?.CONSTANTS?.MAX_PHONE_DIGITS || 11;
        if (raw.length > maxDigits) raw = raw.slice(0, maxDigits);

        let formatted = '';
        if (raw.length > 0) {
            formatted = '+7';
            if (raw.length >= 2) {
                let part = raw.slice(1, 4);
                formatted += ' (' + part;
                if (part.length === 3) formatted += ')';
                else if (raw.length >= 5) formatted += ')';
            }
            if (raw.length >= 5) {
                let part = raw.slice(4, 7);
                formatted += ' ' + part;
            }
            if (raw.length >= 8) {
                let part = raw.slice(7, 9);
                formatted += '-' + part;
            }
            if (raw.length >= 10) {
                let part = raw.slice(9, 11);
                formatted += '-' + part;
            }
            if (raw.length >= 2 && raw.length < 5 && !formatted.includes(')')) formatted += ')';
        }
        this.value = formatted;

        // Находим родительскую форму и блок сообщений
        const form = this.closest('form');
        const messagesBlock = form ? form.querySelector('.form-messages') : null;

        if (raw.length > 0 && raw.length !== maxDigits) {
            // Показываем ошибку в общем блоке
            if (messagesBlock) {
                messagesBlock.textContent = `❌ Введите ${maxDigits} цифр телефона, сейчас ${raw.length}`;
                messagesBlock.className = 'form-messages error';
                messagesBlock.style.display = 'block';
            }
            this.classList.add('input-error');
        } else {
            // Очищаем сообщение только если оно было про телефон (чтобы не стереть другие ошибки)
            if (messagesBlock && messagesBlock.textContent.includes('Введите') && messagesBlock.textContent.includes('цифр телефона')) {
                messagesBlock.textContent = '';
                messagesBlock.className = 'form-messages';
                messagesBlock.style.display = '';
            }
            this.classList.remove('input-error');
        }
    });
}

function initPhoneMasks() {
    const phoneInputs = document.querySelectorAll('#callbackPhone, #quickPhone');
    phoneInputs.forEach(input => {
        if (input) applyPhoneMask(input);
    });
}

// ========== ОТПРАВКА ДАННЫХ В GOOGLE SHEETS ==========
async function sendDataToSheetWithRetry(data, retries = 3, delay = 2000) {
    const userId = currentUserId || getOrCreateLocalUserId();
    data.userId = userId;
    if (typeof window.getCartData === 'function') {
        data.cart = window.getCartData();
    } else {
        data.cart = '';
    }
    return postWithRetry(SCRIPT_URL, data, retries, delay);
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
            } catch(e) {
                if (IS_DEV) console.warn('Ошибка парсинга visits', e);
                visits = [];
            }
        }
    } catch(e) {}
    const lastVisit = visits.length > 0 ? visits[visits.length - 1] : 0;
    if (now.getTime() - lastVisit > 30 * 60 * 1000) {
        visits.push(now.getTime());
    }
    try {
        localStorage.setItem(visitsKey, JSON.stringify(visits));
    } catch(e) {}
    const weekAgo = now.getTime() - oneWeek;
    const monthAgo = now.getTime() - oneMonth;
    return {
        week: visits.filter(v => v > weekAgo).length,
        month: visits.length,
        total: visits.length
    };
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
    return { device, browser, os };
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
        cached = localStorage.getItem(geoKey);
        if (cached) {
            try {
                cached = JSON.parse(cached);
                if (cached && typeof cached === 'object') return cached;
            } catch(e) {}
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
        try {
            localStorage.setItem(geoKey, JSON.stringify(result));
        } catch(e) {}
        return result;
    } catch(e) {
        if (IS_DEV) console.warn('Ошибка получения геоданных:', e);
        return { ip: '-', city: '-', region: '-', country: '-', geoText: '-' };
    }
}
window.getGeoData = getGeoData;

// ========== ЕДИНЫЙ МОДУЛЬ ОТПРАВКИ ФОРМ ==========
window.submitForm = async function(formId, formType, getAdditionalData = null) {
    const form = document.getElementById(formId);
    if (!form) return false;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : 'Отправить';

    try {
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
        if (getAdditionalData) {
            additional = await getAdditionalData(form);
        }

        if (phone) {
            phone = normalizePhoneDigits(phone);
        }

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
        return true;
    } catch (err) {
        logError('Ошибка отправки:', err);
        showErrorToast('Не удалось отправить заявку. Пожалуйста, попробуйте позже или свяжитесь с нами напрямую.');
        return false;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerText = originalBtnText;
        }
    }
};

window.getQuizDataFromForm = function(form) {
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

// ========== КНОПКИ «ПОДЕЛИТЬСЯ» ==========
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
                }).catch(() => {
                    window.showErrorToast('❌ Не удалось скопировать');
                });
            };
            btn.addEventListener('click', btn._shareHandler);
        }
    });
}

// ========== ЭКСПОРТ ВСЕХ ФУНКЦИЙ ==========
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