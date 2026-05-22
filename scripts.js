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

function log(...args) {
    if (IS_DEV) console.log(...args);
}
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

// User ID (только локальный, без Service Worker)
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

// Fetch with retry
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

// Кеширование
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

// Индикатор загрузки
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

// Отправка в Google Sheets
function sendDataToSheet(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUUIy_I9Z0qXBQmYMQmwCpkjVAdGemxl6k9DZiVF9djhI_w7Th7fMGaCbVNI-EyDnnBQ/exec';
    const userId = currentUserId || getOrCreateLocalUserId();
    data.userId = userId;
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
    }).catch(err => logError('❌ Ошибка отправки:', err));
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
function initAnimations() {
    const elements = document.querySelectorAll('.fade-up');
    if (!elements.length) return;
    const isMobile = window.innerWidth <= 768;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: isMobile ? '0px 0px -30px 0px' : '0px 0px -80px 0px'
    });
    elements.forEach(el => observer.observe(el));
}
window.initAnimations = initAnimations;
function initCallbackForm() {
    const phoneInput = document.getElementById('callbackPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let rawValue = this.value.replace(/\D/g, '');
            if (typeof formatPhoneNumber === 'function') {
                let masked = formatPhoneNumber(rawValue);
                this.value = masked || '';
            } else {
                if (rawValue.length > 11) rawValue = rawValue.slice(0, 11);
                let formatted = '+7';
                if (rawValue.length > 1) formatted += ' ' + rawValue.slice(1, 4);
                if (rawValue.length >= 5) formatted += ' ' + rawValue.slice(4, 7);
                if (rawValue.length >= 8) formatted += ' ' + rawValue.slice(7, 9);
                if (rawValue.length >= 10) formatted += ' ' + rawValue.slice(9, 11);
                this.value = formatted;
            }
        });
    }

    const callbackForm = document.getElementById('callbackForm');
    let isSubmitting = false;

    if (callbackForm) {
        callbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (isSubmitting) return;

            const consentCheckbox = document.getElementById('callbackConsent');
            if (!consentCheckbox || !consentCheckbox.checked) {
                showToast('❌ Подтвердите согласие на обработку данных');
                return;
            }

            const submitBtn = callbackForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            isSubmitting = true;

            const name = document.getElementById('callbackName').value.trim();
            let phoneField = document.getElementById('callbackPhone').value.trim();
            const comment = document.getElementById('callbackComment').value.trim() || 'Не указано';

            if (!name || !phoneField) {
                showToast('❌ Заполните имя и телефон');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
                return;
            }

            let digits = phoneField.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;
            if (digits.length !== 11) {
                showToast('❌ Некорректный номер телефона');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
                return;
            }

            const formattedForDisplay = '+7 ' + digits.slice(1,4) + ' ' + digits.slice(4,7) + ' ' + digits.slice(7,9) + ' ' + digits.slice(9);

            const sendForm = (userId) => {
                const formData = {
                    formType: 'Обратный звонок',
                    name: name,
                    phone: digits,
                    comment: comment,
                    quizAnswers: '-',
                    consent: true,
                    userId: userId
                };
                if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
                showToast(`✅ Спасибо, ${name}! Мы перезвоним на ${formattedForDisplay}`, 4000);
                callbackForm.reset();
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                isSubmitting = false;
            };

            if (typeof currentUserId !== 'undefined' && currentUserId) sendForm(currentUserId);
            else if (typeof getOrCreateLocalUserId === 'function') sendForm(getOrCreateLocalUserId());
            else sendForm('unknown');
        });
    }

    const privacyLinkForm = document.getElementById('privacyLinkForm');
    if (privacyLinkForm) {
        privacyLinkForm.addEventListener('click', (e) => {
            e.preventDefault();
            const privacyModal = document.getElementById('privacyModal');
            if (privacyModal && typeof showModal === 'function') showModal(privacyModal);
        });
    }
}

function initFormEnterSubmit() {
    const form = document.getElementById('callbackForm');
    if (!form) return;
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            }
        });
    });
}

window.initCallbackForm = initCallbackForm;
window.initFormEnterSubmit = initFormEnterSubmit;
function showModal(modal) {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.offsetHeight; // reflow
    modal.classList.add('show');
}
function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.addEventListener('transitionend', function onEnd() {
        if (!modal.classList.contains('show')) modal.style.display = 'none';
        modal.removeEventListener('transitionend', onEnd);
    }, { once: true });
}

function initModal() {
    const modal = document.getElementById('checklistModal');
    const openModal = document.getElementById('openChecklistModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const downloadBoth = document.getElementById('downloadBothBtn');
    const singleChecklistBtn = document.getElementById('singleChecklistBtn');
    const singleTrainingBtn = document.getElementById('singleTrainingBtn');

    if (openModal) openModal.addEventListener('click', () => showModal(modal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideModal(modal));

    function saveEmailAndOpen(email, checklist, training) {
        if (!email || !email.includes('@')) {
            alert('Введите корректный email');
            return false;
        }
        const formData = {
            formType: 'Запрос материалов',
            name: email,
            phone: '',
            comment: `Запросил: чек-лист=${checklist}, тренинг=${training}`,
            quizAnswers: '-'
        };
        if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
        if (typeof gtag === 'function') gtag('event', 'download', { event_category: 'material', event_label: checklist && training ? 'both' : (checklist ? 'checklist' : 'training') });
        if (checklist) window.open('assets/docs/checklist.pdf', '_blank');
        if (training) window.open('assets/docs/training_program.pdf', '_blank');
        showToast('✅ Email сохранён. Файлы открываются.', 3000);
        return true;
    }

    if (downloadBoth) {
        downloadBoth.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            const checklist = document.getElementById('checklistCheck').checked;
            const training = document.getElementById('trainingCheck').checked;
            if (saveEmailAndOpen(email, checklist, training)) hideModal(modal);
        });
    }
    if (singleChecklistBtn) {
        singleChecklistBtn.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, true, false)) hideModal(modal);
        });
    }
    if (singleTrainingBtn) {
        singleTrainingBtn.addEventListener('click', () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, false, true)) hideModal(modal);
        });
    }

    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');
    const closePrivacy = document.getElementById('closePrivacyModal');
    if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', () => hideModal(privacyModal));
    if (closePrivacy) closePrivacy.addEventListener('click', () => hideModal(privacyModal));

    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal);
        if (e.target === privacyModal) hideModal(privacyModal);
    });
}

window.initModal = initModal;
window.showModal = showModal;
window.hideModal = hideModal;
function initCookieConsent() {
    const consent = localStorage.getItem('cookie_consent');
    const banner = document.getElementById('cookieConsent');
    if (!banner) return;

    if (consent === null) {
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }

    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'accepted');
            banner.style.display = 'none';
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', { analytics_storage: 'granted' });
            }
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'declined');
            banner.style.display = 'none';
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', { analytics_storage: 'denied' });
            }
        });
    }
}
window.initCookieConsent = initCookieConsent;
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            if (targetId === '#top') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 80;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

function initBurgerMenu() {
    const burger = document.getElementById('burgerMenu');
    const navBottom = document.getElementById('navBottom');

    if (!burger || !navBottom) return;

    burger.addEventListener('click', function() {
        this.classList.toggle('active');
        navBottom.classList.toggle('open');
        document.body.classList.toggle('menu-open');
    });

    navBottom.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            burger.classList.remove('active');
            navBottom.classList.remove('open');
            document.body.classList.remove('menu-open');
        }
    });
}

window.initSmoothScroll = initSmoothScroll;
window.initBurgerMenu = initBurgerMenu;
function initCopyButtons() {
    document.querySelectorAll('.copyable-phone, .copyable-text').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const textToCopy = this.getAttribute('data-copy');
            if (!textToCopy) return;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('✅ Скопировано!');
            }).catch(err => {
                console.error('Ошибка копирования:', err);
                alert('Не удалось скопировать. Попробуйте вручную.');
            });
        });
    });
}
window.initCopyButtons = initCopyButtons;
let cart = [];
let calculatorInitialized = false;
let servicesData = { business: [], individual: [], corporate: [], group: [] };

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv';
const CACHE_KEY_SERVICES = 'hr_services_data';

function parsePrice(value) {
    if (!value) return 0;
    let cleaned = String(value).replace(/\s/g, '').replace(',', '.');
    cleaned = cleaned.replace(/[^0-9.-]/g, '');
    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
}

async function loadServicesFromGoogleSheets() {
    showLoading('Загрузка услуг...');
    try {
        const csvText = await loadWithCache(CACHE_KEY_SERVICES, () => fetchTextWithRetry(GOOGLE_SHEETS_CSV_URL, 3, 8000), 10 * 60 * 1000);
        const rows = [];
        const lines = csvText.split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
            if (values.length >= 3 && values[0] && values[1] && values[2]) rows.push(values);
        }
        if (rows.length === 0) throw new Error('Нет данных');
        const headers = rows[0].map(h => h.toLowerCase());
        const colIndex = {
            category: headers.indexOf('category'),
            service: headers.indexOf('service'),
            price: headers.indexOf('price'),
            sort: headers.indexOf('sort')
        };
        servicesData = { business: [], individual: [], corporate: [], group: [] };
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            const category = values[colIndex.category];
            const service = values[colIndex.service];
            const price = parsePrice(values[colIndex.price]);
            const sort = colIndex.sort !== -1 ? (parseInt(values[colIndex.sort]) || 999) : 999;
            if (category && service && price > 0) {
                const catMap = { 'business': 'business', 'individual': 'individual', 'corporate': 'corporate', 'group': 'group' };
                const cat = catMap[category.toLowerCase()];
                if (cat) servicesData[cat].push({ service, price, sort });
            }
        }
        for (const cat in servicesData) servicesData[cat].sort((a,b) => a.sort - b.sort);
        updateSelectsFromData();
    } catch (error) {
        logError('Ошибка загрузки:', error);
        showToast('⚠️ Не удалось загрузить услуги. Используем локальные данные.', 4000);
        loadLocalFallback();
    } finally {
        hideLoading();
    }
}

function loadLocalFallback() {
    servicesData = {
        business: [
            { service: "Подбор специалиста", price: 60000, sort: 1 },
            { service: "Подбор руководителя", price: 90000, sort: 2 },
            { service: "Хэдхантинг", price: 120000, sort: 3 },
            { service: "Онбординг", price: 250000, sort: 4 },
            { service: "УТП компании", price: 25000, sort: 5 }
        ],
        individual: [
            { service: "Индивидуальная консультация (1ч)", price: 7000, sort: 1 },
            { service: "Экспресс-консультация (30мин)", price: 3500, sort: 2 },
            { service: "Аудит резюме", price: 4000, sort: 3 },
            { service: "Резюме специалиста", price: 6000, sort: 4 },
            { service: "Резюме руководителя", price: 9000, sort: 5 },
            { service: "CV на английском", price: 15000, sort: 6 },
            { service: "Сопроводительное письмо", price: 3000, sort: 7 },
            { service: "Индивидуальный тренинг «Продай себя дорого»", price: 14000, sort: 8 }
        ],
        corporate: [
            { service: "Тренинг по запросу (до 25 чел.)", price: 12000, sort: 1 },
            { service: "Мастер-класс (3ч, до 25 чел.)", price: 30000, sort: 2 },
            { service: "Стратегическая сессия (до 12 чел.)", price: 13000, sort: 3 }
        ],
        group: [
            { service: "Групповой тренинг (до 10 чел.)", price: 5500, sort: 1 },
            { service: "Групповой тренинг (11-20 чел.)", price: 5000, sort: 2 },
            { service: "Групповой тренинг (21+ чел.)", price: 4500, sort: 3 }
        ]
    };
    updateSelectsFromData();
}

function updateSelectsFromData() {
    const selects = {
        'business-select': servicesData.business,
        'individual-select': servicesData.individual,
        'corporate-select': servicesData.corporate,
        'group-select': servicesData.group
    };
    for (const [id, data] of Object.entries(selects)) {
        const select = document.getElementById(id);
        if (select && data && data.length) {
            select.innerHTML = data.map(s => `<option value="${s.price}">${escapeHtml(s.service)} — ${s.price.toLocaleString()} ₽</option>`).join('');
        }
    }
}

function renderCart() {
    let total = 0, qty = 0;
    cart.forEach(i => { total += i.price * i.qty; qty += i.qty; });
    let final = total;
    if (qty >= 2) final = total * 0.95;
    const totalEl = document.getElementById('totalPrice');
    if (totalEl) totalEl.innerText = Math.round(final).toLocaleString() + ' ₽';
    const discountDiv = document.getElementById('discountInfo');
    if (discountDiv) {
        if (qty >= 2) discountDiv.innerHTML = `✅ Скидка 5% (${qty} услуги) — экономия ${Math.round(total*0.05)} ₽`;
        else discountDiv.innerHTML = '🔹 Добавьте ещё одну услугу для скидки 5%';
    }
    const containers = { business: 'business-list', individual: 'individual-list', corporate: 'corporate-list', group: 'group-list' };
    for (const cat of Object.keys(containers)) {
        const container = document.getElementById(containers[cat]);
        if (container) container.innerHTML = '';
    }
    cart.forEach((item, idx) => {
        const container = document.getElementById(containers[item.cat]);
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'calc-item';
        div.innerHTML = `<div>${escapeHtml(item.name)} × ${item.qty}</div><div>${(item.price * item.qty).toLocaleString()} ₽ <button class="remove-item" data-idx="${idx}" style="background:none;border:none;color:red;cursor:pointer;font-size:1.2rem;">✖</button></div>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.removeEventListener('click', btn._handler);
        btn._handler = () => { cart.splice(parseInt(btn.dataset.idx), 1); renderCart(); };
        btn.addEventListener('click', btn._handler);
    });
}

function addToCart(cat, selectId, qtyId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const price = parseInt(select.value);
    const fullText = select.options[select.selectedIndex].text;
    const name = fullText.replace(/ — .*/, '');
    let quantity = parseInt(document.getElementById(qtyId).value);
    if (isNaN(quantity) || quantity < 1) quantity = 1;
    const existing = cart.find(i => i.name === name && i.cat === cat);
    if (existing) existing.qty += quantity;
    else cart.push({ name, price, qty: quantity, cat });
    renderCart();
}

async function initCalculator() {
    if (calculatorInitialized) return;
    calculatorInitialized = true;
    await loadServicesFromGoogleSheets();

    const handlers = [
        { btn: 'business-add', cat: 'business', select: 'business-select', qty: 'business-qty' },
        { btn: 'individual-add', cat: 'individual', select: 'individual-select', qty: 'individual-qty' },
        { btn: 'corporate-add', cat: 'corporate', select: 'corporate-select', qty: 'corporate-qty' },
        { btn: 'group-add', cat: 'group', select: 'group-select', qty: 'group-qty' }
    ];
    handlers.forEach(({ btn, cat, select, qty }) => {
        const button = document.getElementById(btn);
        if (button) {
            button.removeEventListener('click', button._handler);
            button._handler = () => addToCart(cat, select, qty);
            button.addEventListener('click', button._handler);
        }
    });

    const tabs = document.querySelectorAll('.calculator-tabs .tab-btn');
    tabs.forEach(btn => {
        btn.removeEventListener('click', btn._tabHandler);
        btn._tabHandler = () => {
            const tab = btn.dataset.tab;
            const activePane = document.querySelector('.tab-pane.active');
            if (activePane) activePane.classList.remove('active');
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const newPane = document.getElementById(`tab-${tab}`);
            if (newPane) newPane.classList.add('active');
        };
        btn.addEventListener('click', btn._tabHandler);
    });

    log('✅ Калькулятор инициализирован');
}

window.initCalculator = initCalculator;
window.addToCart = addToCart;
window.renderCart = renderCart;
let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;
let currentQuestionIndex = 0;
let totalQuestions = 0;
let isSubmittingChoice = false;
let isAnalyzing = false; // флаг для предотвращения повторного анализа

const LOCAL_QUESTIONS = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];

const VARIANTS_MATRIX = [
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "HR-аудит и закрытие вакансии под ключ", variantB: "Бесплатная диагностика вакансии" },
    { priority: 2, role: "Ищу работу", level: "Junior / начинающий", urgency: "*", importance: "*", budget: "*", variantA: "Карьерная стратегия + упаковка резюме", variantB: "Экспресс-консультация по поиску" },
    { priority: 3, role: "Ищу работу", level: "Middle / опытный", urgency: "*", importance: "*", budget: "*", variantA: "Тренинг «Продай себя дорого» и переговоры о зарплате", variantB: "Индивидуальное сопровождение до оффера" },
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Индивидуальная карьерная стратегия + полное сопровождение", variantB: "Тренинг «Продай себя дорого» + самоподготовка" }
];

function initQuizData() {
    quizQuestions = LOCAL_QUESTIONS;
    answers = new Array(quizQuestions.length).fill(null);
    currentQuestionIndex = 0;
}

function findVariant(answersArr) {
    const user = { role: answersArr[0], level: answersArr[1], urgency: answersArr[2], importance: answersArr[3], budget: answersArr[4] };
    const sorted = [...VARIANTS_MATRIX].sort((a,b) => a.priority - b.priority);
    for (const rule of sorted) {
        let match = true;
        if (rule.role !== '*' && rule.role !== user.role) match = false;
        if (rule.level !== '*' && rule.level !== user.level) match = false;
        if (rule.urgency !== '*' && rule.urgency !== user.urgency) match = false;
        if (rule.importance !== '*' && rule.importance !== user.importance) match = false;
        if (rule.budget !== '*' && rule.budget !== user.budget) match = false;
        if (match) return { variantA: rule.variantA, variantB: rule.variantB };
    }
    const def = VARIANTS_MATRIX.find(r => r.priority === 999) || VARIANTS_MATRIX[0];
    return { variantA: def.variantA, variantB: def.variantB };
}

function resetQuiz() {
    quizState = 'questions';
    currentQuestionIndex = 0;
    answers = new Array(quizQuestions.length).fill(null);
    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    if (quizQuestions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Загрузка...</div>';
        return;
    }
    totalQuestions = quizQuestions.length;
    if (quizState === 'questions') {
        let progressHtml = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${((currentQuestionIndex+1)/totalQuestions)*100}%;"></div></div>`;
        let question = quizQuestions[currentQuestionIndex];
        let html = progressHtml;
        html += `<div class="quiz-question fade-up"><p>${escapeHtml(question.text)}</p><div class="quiz-options" data-q="${currentQuestionIndex}">`;
        for (let opt of question.options) {
            html += `<div class="quiz-option ${answers[currentQuestionIndex] === opt ? 'selected' : ''}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
        }
        html += `</div></div>`;
        html += `<div class="quiz-nav"><button id="quizPrevBtn" class="btn-secondary" ${currentQuestionIndex === 0 ? 'disabled' : ''}>◀ Назад</button>`;
        if (currentQuestionIndex === totalQuestions - 1) {
            html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        } else {
            html += `<button id="quizNextBtn" class="btn-primary">Далее ▶</button>`;
        }
        html += `</div>`;
        container.innerHTML = html;

        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', function() {
                if (isAnalyzing) return;
                answers[currentQuestionIndex] = this.dataset.opt;
                renderQuiz();
            });
        });

        const nextBtn = document.getElementById('quizNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (isAnalyzing) return;
                if (answers[currentQuestionIndex] === null) {
                    alert('Пожалуйста, выберите ответ');
                    return;
                }
                currentQuestionIndex++;
                renderQuiz();
            });
        }
        const prevBtn = document.getElementById('quizPrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (isAnalyzing) return;
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    renderQuiz();
                }
            });
        }
        const submitQuiz = document.getElementById('submitQuizBtn');
        if (submitQuiz) {
            submitQuiz.addEventListener('click', () => {
                if (isAnalyzing) {
                    alert('Подождите, анализ уже выполняется...');
                    return;
                }
                if (answers[currentQuestionIndex] === null) {
                    alert('Выберите ответ перед отправкой');
                    return;
                }
                if (answers.includes(null)) {
                    alert('Ответьте на все вопросы');
                    return;
                }
                isAnalyzing = true;
                submitQuiz.disabled = true;
                submitQuiz.style.opacity = '0.5';
                submitQuiz.style.cursor = 'not-allowed';

                // Показываем крутящийся спиннер вместо текста
                container.innerHTML = `
                    <div class="quiz-loading">
                        <div class="quiz-spinner"></div>
                        <p>Анализируем ваши ответы...</p>
                    </div>
                `;

                setTimeout(() => {
                    const variant = findVariant(answers);
                    quizState = 'choice';
                    showResult(variant);
                    isAnalyzing = false;
                }, 1500);
            });
        }
    } else if (quizState === 'choice') {
        showResult(findVariant(answers));
    }
}

function showResult(variant) {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    container.innerHTML = `
        <p style="font-weight:600; margin-bottom:20px;">На основе ваших ответов мы подготовили 2 варианта:</p>
        <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
            <div style="flex:1; min-width:250px; background:var(--surface-soft); border-radius:28px; padding:28px; border:1px solid var(--border);">
                <div style="font-size:32px; margin-bottom:12px;">📌</div>
                <h4>Вариант 1</h4>
                <p>${escapeHtml(variant.variantA)}</p>
                <button class="btn-primary choose-option" data-choice="1" data-text="${escapeHtml(variant.variantA)}">Выбрать</button>
            </div>
            <div style="flex:1; min-width:250px; background:var(--surface-soft); border-radius:28px; padding:28px; border:1px solid var(--border);">
                <div style="font-size:32px; margin-bottom:12px;">🎯</div>
                <h4>Вариант 2</h4>
                <p>${escapeHtml(variant.variantB)}</p>
                <button class="btn-primary choose-option" data-choice="2" data-text="${escapeHtml(variant.variantB)}">Выбрать</button>
            </div>
        </div>
        <div style="text-align:center; margin-top:30px;">
            <button id="resetQuizBtn" class="btn-secondary">🔁 Пройти заново</button>
        </div>
    `;
    document.querySelectorAll('.choose-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (isSubmittingChoice) return;
            isSubmittingChoice = true;
            const chosen = this.dataset.choice;
            const chosenText = this.dataset.text;
            const sendQuizResult = (userId) => {
                const formData = {
                    formType: 'Квиз',
                    quizAnswers: answers.map((a, idx) => `${quizQuestions[idx]?.text} — ${a}`).join('\n'),
                    chosenVariant: `${chosen}: ${chosenText}`,
                    userId: userId
                };
                if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
                if (typeof gtag === 'function') gtag('event', 'quiz_choice', { event_category: 'quiz', event_label: chosenText, value: chosen });
                const resultDiv = document.getElementById('quizResult');
                if (resultDiv) {
                    resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${escapeHtml(chosenText)}<br><br><a href="https://t.me/HrLubacheva" class="btn-primary" target="_blank">📱 Обсудить в Telegram</a>`;
                    resultDiv.style.display = 'block';
                }
                container.innerHTML = '<p>✨ Спасибо! Результат появился ниже.</p>';
                isSubmittingChoice = false;
            };
            if (typeof currentUserId !== 'undefined' && currentUserId) sendQuizResult(currentUserId);
            else if (typeof getOrCreateLocalUserId === 'function') sendQuizResult(getOrCreateLocalUserId());
            else sendQuizResult('unknown');
        });
    });
    const resetBtn = document.getElementById('resetQuizBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => resetQuiz());
}

function initQuiz() {
    if (quizInitialized) return;
    quizInitialized = true;
    initQuizData();
    renderQuiz();
}

window.initQuiz = initQuiz;
window.renderQuiz = renderQuiz;
(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.fade-up').forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            if (typeof initAnimations === 'function') window.initAnimations = function() {};
        }

        if (typeof initAnimations === 'function') initAnimations();
        if (typeof initUserId === 'function') initUserId().catch(e => console.warn(e));
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof initQuiz === 'function') initQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
        if (typeof initCookieConsent === 'function') initCookieConsent();
    });
})();