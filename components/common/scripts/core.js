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

// ========== ЛОГИРОВАНИЕ (отключается в продакшене) ==========

const IS_DEV = window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');

let originalConsoleLog = null;

function log(...args) {
    if (IS_DEV) {
        console.log(...args);
    }
}

function logError(...args) {
    console.error(...args);
}

function logWarn(...args) {
    if (IS_DEV) {
        console.warn(...args);
    }
}

// В продакшене отключаем console.log
if (!IS_DEV) {
    originalConsoleLog = console.log;
    console.log = function() {};
}

// Функции для ручного включения/выключения логов
window.enableLogs = function() {
    if (originalConsoleLog) {
        console.log = originalConsoleLog;
    } else {
        console.log = function(...args) { originalConsoleLog(...args); };
    }
    showToast('🔍 Логи включены', 2000);
};

window.disableLogs = function() {
    console.log = function() {};
    showToast('🔇 Логи отключены', 2000);
};

// ========== USER ID (постоянный идентификатор) ==========

function getOrCreateLocalUserId() {
    let userId = localStorage.getItem('hr_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('hr_user_id', userId);
    }
    return userId;
}

function getUserIdFromSW() {
    return new Promise((resolve) => {
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
            resolve(getOrCreateLocalUserId());
            return;
        }

        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'USER_ID') {
                localStorage.setItem('hr_user_id', event.data.userId);
                resolve(event.data.userId);
            }
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'GET_USER_ID' },
            [channel.port2]
        );

        setTimeout(() => {
            resolve(getOrCreateLocalUserId());
        }, 1000);
    });
}

let currentUserId = null;

function initUserId() {
    return getUserIdFromSW().then(userId => {
        currentUserId = userId;
        log('👤 User ID инициализирован:', userId);

        // Передаём User ID в Google Analytics
        if (typeof gtag === 'function') {
            gtag('config', 'G-QZJJ2SE117', {
                'user_id': userId
            });
            log('📊 User ID передан в Google Analytics:', userId);
        }

        // Передаём User ID в Яндекс.Метрику
        if (typeof ym === 'function') {
            ym(109292129, 'setUserID', userId);
            log('📊 User ID передан в Яндекс.Метрику:', userId);
        }

        return userId;
    });
}

// ========== FETCH С ТАЙМАУТОМ И ПОВТОРНЫМИ ПОПЫТКАМИ ==========

async function fetchWithRetry(url, options = {}, retries = 3, timeout = 10000) {
    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return response;
            }

            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (err) {
            lastError = err;
        }

        if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

async function fetchTextWithRetry(url, retries = 3, timeout = 10000) {
    const response = await fetchWithRetry(url, {}, retries, timeout);
    return response.text();
}

// ========== КЕШИРОВАНИЕ В localStorage ==========

const CACHE_TTL = 10 * 60 * 1000; // 10 минут

async function loadWithCache(cacheKey, fetchFn, ttl = CACHE_TTL) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < ttl) {
                log(`📦 Кеш для ${cacheKey} (актуальный)`);
                return data;
            }
            log(`📦 Кеш для ${cacheKey} (просрочен, загружаем новое)`);
        } catch(e) {}
    }

    const data = await fetchFn();
    localStorage.setItem(cacheKey, JSON.stringify({
        data: data,
        timestamp: Date.now()
    }));

    return data;
}

// ========== ИНДИКАТОР ЗАГРУЗКИ ==========

let loadingIndicator = null;
let loadingSpinnerStyle = null;
let isLoadingActive = false;

function showLoading(message = 'Загрузка...') {
    if (isLoadingActive) return;
    isLoadingActive = true;

    if (!loadingSpinnerStyle) {
        loadingSpinnerStyle = document.createElement('style');
        loadingSpinnerStyle.textContent = `
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
                font-family: 'Inter', sans-serif;
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
            .loading-text {
                font-size: 14px;
            }
        `;
        document.head.appendChild(loadingSpinnerStyle);
    }

    loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">${escapeHtml(message)}</div>
    `;
    document.body.appendChild(loadingIndicator);
}

function hideLoading() {
    if (!isLoadingActive) return;
    isLoadingActive = false;

    if (loadingIndicator) {
        loadingIndicator.remove();
        loadingIndicator = null;
    }
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========

function sendDataToSheet(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUUIy_I9Z0qXBQmYMQmwCpkjVAdGemxl6k9DZiVF9djhI_w7Th7fMGaCbVNI-EyDnnBQ/exec';
    const userId = currentUserId || getOrCreateLocalUserId();
    data.userId = userId;

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
    })
    .then(() => log('✅ Отправлено, userId:', userId))
    .catch(error => logError('❌ Ошибка:', error));
}

function showToast(message, duration = 3000) {
    let toast = document.querySelector('.custom-toast');
    if (toast) toast.remove();

    toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:40px;font-size:1rem;z-index:10000;font-family:Inter,sans-serif;backdrop-filter:blur(8px);box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
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

// ========== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ==========

window.escapeHtml = escapeHtml;
window.getOrCreateLocalUserId = getOrCreateLocalUserId;
window.getUserIdFromSW = getUserIdFromSW;
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
window.enableLogs = enableLogs;
window.disableLogs = disableLogs;