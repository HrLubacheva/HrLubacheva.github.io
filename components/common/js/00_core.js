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
    showToast('🔍 Логи включены', 2000);
};
window.disableLogs = function() {
    if (originalConsoleLog === null) originalConsoleLog = console.log;
    console.log = function() {};
    showToast('🔇 Логи отключены', 2000);
};

// User ID
function getOrCreateLocalUserId() {
    try {
        let userId = localStorage.getItem('hr_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
            localStorage.setItem('hr_user_id', userId);
        }
        return userId;
    } catch(e) {
        return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
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

// ========== ЕДИНЫЙ URL ДЛЯ ВСЕХ ЗАПРОСОВ (Google Apps Script) ==========
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlTVJQbD_v5KppUbbjUVvcN2yiPy0AR64iC5NEzWHCgz5jnNxjF_r5ri0_u5ws6cCozw/exec';
if (typeof window !== 'undefined') {
    window.SCRIPT_URL = SCRIPT_URL;
}

// ========== ОТПРАВКА ДАННЫХ (обратный звонок, квиз и т.д.) ==========
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

// Toast
function showToast(message, duration = 3000) {
    let toast = document.querySelector('.custom-toast');
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:40px;font-size:1rem;z-index:10000;font-family:Inter,sans-serif;backdrop-filter:blur(8px);box-shadow:0 4px 12px rgba(0,0,0,0.2);opacity:0;transition:opacity 0.2s;';
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
    }, duration);
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

window.escapeHtml = escapeHtml;
window.getOrCreateLocalUserId = getOrCreateLocalUserId;
window.initUserId = initUserId;
window.sendDataToSheet = sendDataToSheet;
window.showToast = showToast;
window.formatPhoneNumber = formatPhoneNumber;
window.fetchWithRetry = fetchWithRetry;
window.fetchTextWithRetry = fetchTextWithRetry;
window.loadWithCache = loadWithCache;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.log = log;
window.logError = logError;
window.logWarn = logWarn;