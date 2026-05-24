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
    try {
        let userId = localStorage.getItem('hr_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem('hr_user_id', userId);
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

async function fetchWithRetry(url, options = {}, retries = 3, timeout = 10000) {
    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) return response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (err) { lastError = err; }
        if (attempt < retries) await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt-1), 5000)));
    }
    throw lastError;
}
async function fetchTextWithRetry(url, retries = 3, timeout = 10000) {
    const response = await fetchWithRetry(url, {}, retries, timeout);
    return response.text();
}

const CACHE_TTL = 10 * 60 * 1000;
async function loadWithCache(cacheKey, fetchFn, ttl = CACHE_TTL) {
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < ttl) return data;
        }
    } catch(e) {}
    const data = await fetchFn();
    try { localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() })); } catch(e) {}
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
    toast.innerHTML = `${icon} ${message}`;
    toast.setAttribute('role', 'status');
    if (type === 'error') {
        toast.setAttribute('aria-live', 'assertive');
    } else {
        toast.setAttribute('aria-live', 'polite');
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
function showErrorToast(message) { showToast(message, 'error'); }
function showSuccessToast(message) { showToast(message, 'success'); }
function showWarningToast(message) { showToast(message, 'warning'); }

const SCRIPT_URL = window.APP_CONFIG.SCRIPT_URL;
if (typeof window !== 'undefined') {
    window.SCRIPT_URL = SCRIPT_URL;
}

// ========== УНИВЕРСАЛЬНАЯ ОТПРАВКА POST С ПОВТОРНЫМИ ПОПЫТКАМИ ==========
async function postWithRetry(url, data, retries = 3, baseDelay = 2000) {
    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const body = new URLSearchParams(data);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });
            if (response.ok) {
                const result = await response.json();
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
            console.warn(`Попытка ${attempt} из ${retries} не удалась:`, err);
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
            }
        }
    }
    throw lastError;
}
window.postWithRetry = postWithRetry;

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
    if (digits.length > 11) digits = digits.slice(0, 11);
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
    try {
        const stored = localStorage.getItem('hr_visits');
        if (stored) {
            visits = JSON.parse(stored);
            const monthAgo = now.getTime() - oneMonth;
            visits = visits.filter(v => v > monthAgo);
        }
    } catch(e) {}
    const lastVisit = visits.length > 0 ? visits[visits.length - 1] : 0;
    if (now.getTime() - lastVisit > 30 * 60 * 1000) {
        visits.push(now.getTime());
    }
    try {
        localStorage.setItem('hr_visits', JSON.stringify(visits));
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
    const cached = localStorage.getItem('hr_geo');
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch(e) {}
    }
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Ошибка геолокации');
        const data = await response.json();
        const result = {
            ip: data.ip || '-',
            city: data.city || '-',
            region: data.region || '-',
            country: data.country_name || '-',
            geoText: `${data.city || ''} ${data.region || ''} ${data.country_name || ''} (${data.ip || ''})`.trim().replace(/  +/g, ' ') || '-'
        };
        localStorage.setItem('hr_geo', JSON.stringify(result));
        return result;
    } catch(e) {
        console.error('Ошибка получения геоданных:', e);
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
        const phone = form.querySelector('[name="phone"]')?.value.trim() || '';
        const email = form.querySelector('[name="email"]')?.value.trim() || '';
        const comment = form.querySelector('[name="comment"]')?.value.trim() || '';
        const consent = form.querySelector('[name="consent"]')?.checked || false;

        let additional = {};
        if (getAdditionalData) {
            additional = await getAdditionalData(form);
        }

        if (!phone && formType !== 'Запрос материалов') {
            showErrorToast('Введите номер телефона');
            throw new Error('Телефон обязателен');
        }
        if (phone) {
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;
            if (digits.length !== 11) {
                showErrorToast('Некорректный номер телефона. Введите 11 цифр.');
                throw new Error('Неверный номер');
            }
        }

        const geo = await window.getGeoData();
        const formData = {
            formType: formType,
            name: name || ' ',
            phone: phone ? phone.replace(/\D/g, '') : ' ',
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
        console.error('Ошибка отправки:', err);
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

// ========== ВАЛИДАЦИЯ ТЕЛЕФОНА И EMAIL ==========
function normalizePhoneDigits(phone) {
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    return digits;
}

function validatePhoneDigits(phone) {
    const digits = normalizePhoneDigits(phone);
    return digits.length === 11 && /^7\d{10}$/.test(digits);
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

// ========== ЭКСПОРТ ВСЕХ ФУНКЦИЙ В ГЛОБАЛЬНЫЙ ОБЪЕКТ ==========
window.escapeHtml = escapeHtml;
window.getOrCreateLocalUserId = getOrCreateLocalUserId;
window.initUserId = initUserId;
window.formatPhoneNumber = formatPhoneNumber;
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

// Экспорт функций валидации
window.normalizePhoneDigits = normalizePhoneDigits;
window.validatePhoneDigits = validatePhoneDigits;
window.validateEmailFormat = validateEmailFormat;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.validatePhoneField = validatePhoneField;
window.validateEmailField = validateEmailField;
window.bindLiveValidation = bindLiveValidation;