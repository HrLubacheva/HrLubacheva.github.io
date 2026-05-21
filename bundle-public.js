// ---------- Core Functions ----------
function getOrCreateUserId() {
    let userId = localStorage.getItem('hr_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('hr_user_id', userId);
    }
    return userId;
}

function sendDataToSheet(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUUIy_I9Z0qXBQmYMQmwCpkjVAdGemxl6k9DZiVF9djhI_w7Th7fMGaCbVNI-EyDnnBQ/exec';
    const userId = getOrCreateUserId();
    data.userId = userId;

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
    })
    .then(() => console.log('✅ Отправлено, userId:', userId))
    .catch(error => console.error('❌ Ошибка:', error));
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
// ---------- Калькулятор услуг (данные из Google Sheets) ----------
let cart = [];
let calculatorInitialized = false;
let servicesData = { business: [], individual: [], corporate: [], group: [] };

const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function parsePrice(value) {
    if (!value) return 0;
    let cleaned = String(value).replace(/\s/g, '').replace(',', '.');
    cleaned = cleaned.replace(/[^0-9.-]/g, '');
    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
}

async function loadServicesFromGoogleSheets() {
    if (typeof showToast === 'function') showToast('📥 Загрузка услуг...');
    try {
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        if (!response.ok) throw new Error('Ошибка загрузки');
        const csvText = await response.text();
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
                const catMap = {
                    'business': 'business',
                    'individual': 'individual',
                    'corporate': 'corporate',
                    'group': 'group'
                };
                const cat = catMap[category.toLowerCase()];
                if (cat) {
                    servicesData[cat].push({ service, price, sort });
                }
            }
        }
        for (const cat in servicesData) {
            servicesData[cat].sort((a, b) => a.sort - b.sort);
        }
        updateSelectsFromData();
        const total = Object.values(servicesData).reduce((sum, arr) => sum + arr.length, 0);
        if (typeof showToast === 'function') showToast(`✅ Загружено ${total} услуг`);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        if (typeof showToast === 'function') showToast('⚠️ Ошибка загрузки услуг');
        loadLocalFallback();
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
            { service: "Групповой тренинг (до 10 чел.)", price: 5000, sort: 1 },
            { service: "Групповой тренинг (11-20 чел.)", price: 4000, sort: 2 },
            { service: "Групповой тренинг (21+ чел.)", price: 3500, sort: 3 }
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
        if (qty >= 2) discountDiv.innerHTML = `✅ Скидка 5% (${qty} услуги) — вы экономите ${Math.round(total*0.05)} ₽`;
        else discountDiv.innerHTML = '🔹 Добавьте ещё одну услугу для скидки 5%';
    }
    const containers = {
        business: document.getElementById('business-list'),
        individual: document.getElementById('individual-list'),
        corporate: document.getElementById('corporate-list'),
        group: document.getElementById('group-list')
    };
    for (const container of Object.values(containers)) {
        if (container) container.innerHTML = '';
    }
    cart.forEach((item, idx) => {
        const container = containers[item.cat];
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'calc-item';
        div.innerHTML = `<div>${escapeHtml(item.name)} × ${item.qty}</div><div>${(item.price * item.qty).toLocaleString()} ₽ <button class="remove-item" data-idx="${idx}" style="background:none;border:none;color:red;cursor:pointer;font-size:1.2rem;">✖</button></div>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.removeEventListener('click', btn._handler);
        btn._handler = () => {
            cart.splice(parseInt(btn.dataset.idx), 1);
            renderCart();
        };
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
    if (existing) {
        existing.qty += quantity;
    } else {
        cart.push({ name, price, qty: quantity, cat });
    }
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
    const panes = document.querySelectorAll('.tab-pane');
    tabs.forEach(btn => {
        btn.removeEventListener('click', btn._tabHandler);
        btn._tabHandler = () => {
            const tab = btn.dataset.tab;
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            panes.forEach(p => p.classList.remove('active'));
            const activePane = document.getElementById(`tab-${tab}`);
            if (activePane) activePane.classList.add('active');
        };
        btn.addEventListener('click', btn._tabHandler);
    });
    console.log('✅ Калькулятор инициализирован');
}

window.initCalculator = initCalculator;
window.addToCart = addToCart;
window.renderCart = renderCart;
// ---------- Квиз с загрузкой из Google Sheets ----------
let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;
let variantsMatrix = [];

const GOOGLE_SHEETS_QUIZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv&gid=1216597339';
const GOOGLE_SHEETS_MATRIX_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv&gid=27728112';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

const LOCAL_QUESTIONS = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];

const LOCAL_VARIANTS = [
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "HR-аудит и закрытие вакансии под ключ",
      variantB: "Бесплатная диагностика вакансии" },
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "Индивидуальная карьерная стратегия + полное сопровождение",
      variantB: "Тренинг «Продай себя дорого» + самоподготовка" }
];

async function loadQuizFromGoogleSheets() {
    try {
        const response = await fetch(GOOGLE_SHEETS_QUIZ_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        if (rows.length < 2) throw new Error('Нет данных');
        const headers = rows[0].split(',').map(h => h.trim());
        const qIndex = headers.indexOf('question');
        const opt1Index = headers.indexOf('option1');
        const opt2Index = headers.indexOf('option2');
        const opt3Index = headers.indexOf('option3');
        const opt4Index = headers.indexOf('option4');
        const loadedQuestions = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',').map(v => v.trim());
            const question = values[qIndex];
            if (!question) continue;
            const options = [];
            if (opt1Index !== -1 && values[opt1Index]) options.push(values[opt1Index]);
            if (opt2Index !== -1 && values[opt2Index]) options.push(values[opt2Index]);
            if (opt3Index !== -1 && values[opt3Index]) options.push(values[opt3Index]);
            if (opt4Index !== -1 && values[opt4Index]) options.push(values[opt4Index]);
            if (options.length > 0) {
                loadedQuestions.push({ text: question, options });
            }
        }
        if (loadedQuestions.length > 0) {
            quizQuestions = loadedQuestions;
        } else {
            throw new Error('Нет вопросов');
        }
    } catch (error) {
        console.error('Ошибка, используем локальные:', error);
        if (typeof showToast === 'function') showToast('⚠️ Не удалось загрузить квиз, используем локальные вопросы', 4000);
        quizQuestions = LOCAL_QUESTIONS;
    }
}

async function loadVariantsMatrix() {
    if (variantsLoaded) return;
    try {
        const response = await fetch(GOOGLE_SHEETS_MATRIX_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() && row.includes(','));
        if (rows.length > 0) {
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            const idx = {
                priority: headers.indexOf('priority'),
                role: headers.indexOf('role'),
                level: headers.indexOf('level'),
                urgency: headers.indexOf('urgency'),
                importance: headers.indexOf('importance'),
                budget: headers.indexOf('budget'),
                variantA: headers.indexOf('variant_a'),
                variantB: headers.indexOf('variant_b')
            };
            variantsMatrix = [];
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',').map(v => v.trim());
                if (values[idx.variantA] || values[idx.variantB]) {
                    variantsMatrix.push({
                        priority: parseInt(values[idx.priority]) || 999,
                        role: values[idx.role] || '*',
                        level: values[idx.level] || '*',
                        urgency: values[idx.urgency] || '*',
                        importance: values[idx.importance] || '*',
                        budget: values[idx.budget] || '*',
                        variantA: values[idx.variantA] || "Индивидуальная стратегия",
                        variantB: values[idx.variantB] || "Тренинг «Продай себя дорого»"
                    });
                }
            }
            variantsMatrix.sort((a, b) => a.priority - b.priority);
        } else {
            throw new Error('Нет данных');
        }
    } catch (error) {
        console.error('Ошибка загрузки матрицы, используем локальную');
        if (typeof showToast === 'function') showToast('⚠️ Ошибка загрузки рекомендаций, используем стандартные', 4000);
        variantsMatrix = LOCAL_VARIANTS;
    }
    variantsLoaded = true;
}

async function findVariant(answersArr) {
    if (!variantsLoaded) await loadVariantsMatrix();
    const user = {
        role: answersArr[0],
        level: answersArr[1],
        urgency: answersArr[2],
        importance: answersArr[3],
        budget: answersArr[4]
    };
    for (const rule of variantsMatrix) {
        let match = true;
        if (rule.role !== '*' && rule.role !== user.role) match = false;
        if (rule.level !== '*' && rule.level !== user.level) match = false;
        if (rule.urgency !== '*' && rule.urgency !== user.urgency) match = false;
        if (rule.importance !== '*' && rule.importance !== user.importance) match = false;
        if (rule.budget !== '*' && rule.budget !== user.budget) match = false;
        if (match) return { variantA: rule.variantA, variantB: rule.variantB };
    }
    const def = variantsMatrix.find(r => r.priority === 999) || variantsMatrix[0];
    return { variantA: def.variantA, variantB: def.variantB };
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    if (quizQuestions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Загрузка...</div>';
        return;
    }
    if (quizState === 'questions') {
        let html = '';
        for (let i = 0; i < quizQuestions.length; i++) {
            const q = quizQuestions[i];
            html += `<div class="quiz-question"><p>${escapeHtml(q.text)}</p><div class="quiz-options" data-q="${i}">`;
            for (let j = 0; j < q.options.length; j++) {
                const opt = q.options[j];
                const isSelected = answers[i] === opt;
                html += `<div class="quiz-option ${isSelected ? 'selected' : ''}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
            }
            html += `</div></div>`;
        }
        html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        container.innerHTML = html;
        const opts = document.querySelectorAll('.quiz-option');
        for (let i = 0; i < opts.length; i++) {
            opts[i].onclick = function() {
                const parent = this.parentElement;
                const qIdx = parseInt(parent.dataset.q);
                answers[qIdx] = this.dataset.opt;
                renderQuiz();
            };
        }
        const btn = document.getElementById('submitQuizBtn');
        if (btn) {
            btn.onclick = async function() {
                if (answers.includes(null)) {
                    alert('Ответьте на все вопросы');
                    return;
                }
                quizState = 'choice';
                container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Анализ ответов...</div>';
                const variant = await findVariant(answers);
                showResult(variant);
            };
        }
    }
}

function showResult(variant) {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    container.innerHTML = `
        <p style="font-weight: 600; margin-bottom: 20px;">На основе ваших ответов мы подготовили 2 варианта:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
            <div style="flex: 1; min-width: 250px; background: var(--surface-soft); border-radius: 28px; padding: 28px; text-align: left; border: 1px solid var(--border);">
                <div style="font-size: 32px; margin-bottom: 12px;">📌</div>
                <h4>Вариант 1</h4>
                <p>${escapeHtml(variant.variantA)}</p>
                <button class="btn-primary choose-option" data-choice="1" data-text="${escapeHtml(variant.variantA)}">Выбрать</button>
            </div>
            <div style="flex: 1; min-width: 250px; background: var(--surface-soft); border-radius: 28px; padding: 28px; text-align: left; border: 1px solid var(--border);">
                <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
                <h4>Вариант 2</h4>
                <p>${escapeHtml(variant.variantB)}</p>
                <button class="btn-primary choose-option" data-choice="2" data-text="${escapeHtml(variant.variantB)}">Выбрать</button>
            </div>
        </div>
    `;
    const btns = document.querySelectorAll('.choose-option');
    for (let i = 0; i < btns.length; i++) {
        btns[i].onclick = function() {
            const chosen = this.dataset.choice;
            const chosenText = this.dataset.text;
            const formData = {
                formType: 'Квиз',
                quizAnswers: answers.map((a, idx) => `${quizQuestions[idx]?.text} — ${a}`).join('\n'),
                chosenVariant: `${chosen}: ${chosenText}`
            };
            if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);

            // Отправляем событие в GA4
            if (typeof gtag === 'function') {
                gtag('event', 'quiz_choice', {
                    'event_category': 'quiz',
                    'event_label': chosenText,
                    'value': chosen
                });
            }

            const resultDiv = document.getElementById('quizResult');
            if (resultDiv) {
                resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${escapeHtml(chosenText)}<br><br><a href="https://t.me/HrLubacheva" class="btn-primary" target="_blank">📱 Обсудить в Telegram</a>`;
                resultDiv.style.display = 'block';
            }
            container.innerHTML = '<p>✨ Спасибо! Результат появился ниже.</p>';
        };
    }
}

let variantsLoaded = false;
async function initQuiz() {
    if (quizInitialized) return;
    quizInitialized = true;
    await loadQuizFromGoogleSheets();
    answers = new Array(quizQuestions.length).fill(null);
    renderQuiz();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initQuiz, 100));
} else {
    setTimeout(initQuiz, 100);
}

window.renderQuiz = renderQuiz;
window.initQuiz = initQuiz;
// ---------- Модалка материалов ----------
const modal = document.getElementById('checklistModal');
const openModal = document.getElementById('openChecklistModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const downloadBoth = document.getElementById('downloadBothBtn');
const singleChecklistBtn = document.getElementById('singleChecklistBtn');
const singleTrainingBtn = document.getElementById('singleTrainingBtn');

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
    sendDataToSheet(formData);

    // Отправляем событие в GA4
    if (typeof gtag === 'function') {
        gtag('event', 'download', {
            'event_category': 'material',
            'event_label': checklist && training ? 'both' : (checklist ? 'checklist' : 'training')
        });
    }

    if (checklist) window.open('assets/docs/checklist.pdf', '_blank');
    if (training) window.open('assets/docs/training_program.pdf', '_blank');
    showToast('✅ Email сохранён. Файлы открываются в новой вкладке.', 3000);
    return true;
}

function initModal() {
    if (openModal) openModal.onclick = () => { if (modal) modal.style.display = 'flex'; };
    if (closeModalBtn) closeModalBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
    if (downloadBoth) {
        downloadBoth.onclick = () => {
            const email = document.getElementById('checklistEmail').value;
            const checklist = document.getElementById('checklistCheck').checked;
            const training = document.getElementById('trainingCheck').checked;
            if (saveEmailAndOpen(email, checklist, training)) {
                if (modal) modal.style.display = 'none';
            }
        };
    }
    if (singleChecklistBtn) {
        singleChecklistBtn.onclick = () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, true, false)) {
                if (modal) modal.style.display = 'none';
            }
        };
    }
    if (singleTrainingBtn) {
        singleTrainingBtn.onclick = () => {
            const email = document.getElementById('checklistEmail').value;
            if (saveEmailAndOpen(email, false, true)) {
                if (modal) modal.style.display = 'none';
            }
        };
    }
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Политика конфиденциальности
    const privacyModal = document.getElementById('privacyModal');
    const privacyLink = document.getElementById('privacyLink');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');
    const closePrivacy = document.getElementById('closePrivacyModal');

    if (privacyLink) privacyLink.onclick = (e) => { e.preventDefault(); if (privacyModal) privacyModal.style.display = 'flex'; };
    if (closePrivacyBtn) closePrivacyBtn.onclick = () => { if (privacyModal) privacyModal.style.display = 'none'; };
    if (closePrivacy) closePrivacy.onclick = () => { if (privacyModal) privacyModal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target === privacyModal) privacyModal.style.display = 'none'; };
}
// ---------- Форма обратного звонка ----------
function initCallbackForm() {
    const phoneInput = document.getElementById('callbackPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let rawValue = this.value.replace(/\D/g, '');
            if (typeof formatPhoneNumber === 'function') {
                let masked = formatPhoneNumber(rawValue);
                if (masked) this.value = masked;
                else this.value = '';
            } else {
                // fallback
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
                if (typeof showToast === 'function') showToast('❌ Подтвердите согласие на обработку данных');
                else alert('Подтвердите согласие на обработку персональных данных');
                return;
            }

            isSubmitting = true;

            const name = document.getElementById('callbackName').value.trim();
            let phoneField = document.getElementById('callbackPhone').value.trim();
            const comment = document.getElementById('callbackComment').value.trim() || 'Не указано';

            if (!name || !phoneField) {
                if (typeof showToast === 'function') showToast('❌ Заполните имя и телефон');
                else alert('Пожалуйста, заполните имя и номер телефона.');
                isSubmitting = false;
                return;
            }

            let digits = phoneField.replace(/\D/g, '');
            if (digits.startsWith('8')) digits = '7' + digits.slice(1);
            if (!digits.startsWith('7')) digits = '7' + digits;

            if (digits.length !== 11) {
                if (typeof showToast === 'function') showToast('❌ Некорректный номер телефона');
                else alert('Номер должен содержать 10 цифр после +7');
                isSubmitting = false;
                return;
            }

            const formattedForDisplay = '+7 ' + digits.slice(1,4) + ' ' + digits.slice(4,7) + ' ' + digits.slice(7,9) + ' ' + digits.slice(9);
            const formData = {
                formType: 'Обратный звонок',
                name: name,
                phone: digits,
                comment: comment,
                quizAnswers: '-',
                consent: true
            };

            if (typeof sendDataToSheet === 'function') {
                sendDataToSheet(formData);
            } else {
                console.log('Данные формы:', formData);
            }

            if (typeof showToast === 'function') {
                showToast(`✅ Спасибо, ${name}! Мы перезвоним вам на ${formattedForDisplay}`, 4000);
            } else {
                alert(`Спасибо, ${name}! Мы перезвоним вам на ${formattedForDisplay}`);
            }

            callbackForm.reset();
            setTimeout(() => { isSubmitting = false; }, 2000);
        });
    }

    // Обработка ссылки на политику в форме
    const privacyLinkForm = document.getElementById('privacyLinkForm');
    if (privacyLinkForm) {
        privacyLinkForm.addEventListener('click', (e) => {
            e.preventDefault();
            const privacyModal = document.getElementById('privacyModal');
            if (privacyModal) privacyModal.style.display = 'flex';
        });
    }
}

// Экспортируем для глобального доступа
window.initCallbackForm = initCallbackForm;
// ---------- Анимации при скролле ----------
function initAnimations() {
    const faders = document.querySelectorAll('.role-card, .service-card, .stat-item, .benefit-card, .process-card, .quiz-card, .checklist-card, .calendar-card');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    faders.forEach(el => {
        el.classList.add('fade-up');
        obs.observe(el);
    });
}
// ---------- Плавная прокрутка с учётом фиксированной шапки ----------
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
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

// ---------- Скрытие шапки при скролле на мобильных ----------
function initMobileNavbarHide() {
    if (window.innerWidth > 768) return;

    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    navbar.style.transition = 'transform 0.3s ease-in-out';

    window.addEventListener('scroll', function() {
        if (ticking) return;
        requestAnimationFrame(function() {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                navbar.style.transform = 'translateY(-100%)';
            }
            else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
                navbar.style.transform = 'translateY(0)';
            }
            lastScrollY = currentScrollY;
            ticking = false;
        });
        ticking = true;
    });

    let hoverTimeout;
    document.addEventListener('mousemove', function(e) {
        if (e.clientY < 50 && navbar.style.transform === 'translateY(-100%)') {
            clearTimeout(hoverTimeout);
            navbar.style.transform = 'translateY(0)';
            hoverTimeout = setTimeout(() => {
                if (window.scrollY > 50) navbar.style.transform = 'translateY(-100%)';
            }, 1500);
        }
    });

    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });
    document.addEventListener('touchmove', function(e) {
        const touchY = e.touches[0].clientY;
        if (touchY < 50 && touchStartY > touchY && navbar.style.transform === 'translateY(-100%)') {
            navbar.style.transform = 'translateY(0)';
            setTimeout(() => {
                if (window.scrollY > 50) navbar.style.transform = 'translateY(-100%)';
            }, 2000);
        }
        touchStartY = touchY;
    });
}

window.addEventListener('resize', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.innerWidth > 768) {
            navbar.style.transform = 'translateY(0)';
            navbar.style.transition = '';
        } else {
            navbar.style.transition = 'transform 0.3s ease-in-out';
        }
    }
});

// ВАЖНО: функции только объявлены, НЕ вызываются здесь.
// Их вызов происходит из public-main.js или editor-main.js
// ---------- Копирование в буфер ----------
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
// Cookie consent banner logic
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
    const privacyLink = document.getElementById('cookiePrivacyLink');
    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModalBtn');

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

    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (privacyModal) privacyModal.style.display = 'flex';
        });
    }

    if (closePrivacyBtn) {
        closePrivacyBtn.addEventListener('click', () => {
            if (privacyModal) privacyModal.style.display = 'none';
        });
    }

    // Закрытие модалки по клику вне её
    window.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            privacyModal.style.display = 'none';
        }
    });
}

// Запускаем после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
    initCookieConsent();
}
// Только публичные инициализации (без редактора)
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initCalculator === 'function') initCalculator();
    if (typeof renderQuiz === 'function') renderQuiz();
    if (typeof initModal === 'function') initModal();
    if (typeof initCallbackForm === 'function') initCallbackForm();
    if (typeof initAnimations === 'function') initAnimations();
    if (typeof initSmoothScroll === 'function') initSmoothScroll();
    if (typeof initCopyButtons === 'function') initCopyButtons();
    console.log('✅ Сайт инициализирован (публичная версия)');
});