// ========== КАЛЬКУЛЯТОР (только локальные данные) ==========
let cart = [];
let calculatorInitialized = false;

// Локальные данные услуг
const LOCAL_SERVICES = {
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
        { service: "Групповой тренинг (21+ чел.)", price: 4500, sort: 3 },
        { service: "Групповой тренинг онлайн", price: 4500, sort: 4 },
    ]
};

function updateSelectsFromData() {
    const selects = {
        'business-select': LOCAL_SERVICES.business,
        'individual-select': LOCAL_SERVICES.individual,
        'corporate-select': LOCAL_SERVICES.corporate,
        'group-select': LOCAL_SERVICES.group
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

function initCalculator() {
    if (calculatorInitialized) return;
    calculatorInitialized = true;

    // Заполняем селекты локальными данными
    updateSelectsFromData();

    // Обработчики кнопок добавления
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

    // Обработчики вкладок
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

    log('✅ Калькулятор инициализирован (локальные данные)');
}

window.initCalculator = initCalculator;
window.addToCart = addToCart;
window.renderCart = renderCart;