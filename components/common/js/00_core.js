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

// User ID
function getOrCreateLocalUserId() {
    try {
        let userId = sessionStorage.getItem('hr_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
            sessionStorage.setItem('hr_user_id', userId);
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
    if (typeof gtag === 'function') gtag('config', 'G-QZJJ2SE117', { 'user_id': currentUserId });
    if (typeof ym === 'function') ym(109292129, 'setUserID', currentUserId);
    return Promise.resolve(currentUserId);
}

// Fetch utils
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

// Loading indicator
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

// ========== КАСТОМНЫЕ ТОСТЫ ==========
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
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
function showErrorToast(message) { showToast(message, 'error'); }
function showSuccessToast(message) { showToast(message, 'success'); }
function showWarningToast(message) { showToast(message, 'warning'); }

// ========== ЕДИНЫЙ URL ДЛЯ ВСЕХ ЗАПРОСОВ ==========
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeFWGqTbq4583D6-m2lqMqsH_O8gN5_HV1aFXSGlnP3bxdvxHTAMxqzjOBc7v-fBuz3Q/exec';
if (typeof window !== 'undefined') {
    window.SCRIPT_URL = SCRIPT_URL;
}

// ========== ОТПРАВКА ДАННЫХ ==========
function sendDataToSheet(data) {
    const userId = currentUserId || getOrCreateLocalUserId();
    data.userId = userId;
    if (typeof window.getCartData === 'function') {
        data.cart = window.getCartData();
    } else {
        data.cart = '';
    }
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
    }).catch(err => logError('❌ Ошибка отправки в Google Sheets:', err));
}

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

// ========== ВРЕМЯ НА САЙТЕ ==========
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

// ========== СЧЁТЧИК ВИЗИТОВ ==========
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

// ========== UTM-МЕТКИ ==========
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

// ========== ТИП УСТРОЙСТВА, БРАУЗЕР, ОС ==========
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

// ========== СТРАНИЦА ВХОДА И РЕФЕРЕР ==========
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

// ========== ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ ==========
window.escapeHtml = escapeHtml;
window.getOrCreateLocalUserId = getOrCreateLocalUserId;
window.initUserId = initUserId;
window.sendDataToSheet = sendDataToSheet;
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