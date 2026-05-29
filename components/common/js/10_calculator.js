// ============================================================
// 10_calculator.js – Калькулятор стоимости услуг, корзина, скидка
// ============================================================
let cart = [];
function formatPrice(price) { if (price === null) return 'по запросу'; if (price === 0) return '0 ₽'; return price.toLocaleString() + ' ₽'; }
function getNumericPrice(price) { if (price === null) return 0; return price; }

window.addToCart = function(serviceName, price, quantity) {
    const existing = cart.find(item => item.name === serviceName);
    if (existing) { existing.qty += quantity; window.showSuccessToast(`✅ "${serviceName}" количество увеличено до ${existing.qty}`); }
    else { cart.push({name: serviceName, price: price, qty: quantity}); window.showSuccessToast(`✅ "${serviceName}" добавлен(а) в корзину`); }
    renderCart();
};

// (Удалена внутренняя функция addToCart – больше никакой рекурсии)

function renderCart() {
    let total = 0, totalQty = 0;
    cart.forEach(item => { const itemPrice = getNumericPrice(item.price); total += itemPrice * item.qty; totalQty += item.qty; });
    let finalTotal = total, discount = 0, discountApplied = false;
    const minItems = window.APP_CONFIG?.CONSTANTS?.DISCOUNT_MIN_ITEMS || 2;
    const discountPercent = window.APP_CONFIG?.CONSTANTS?.DISCOUNT_PERCENT || 0.05;
    if (totalQty >= minItems && total > 0) { discount = total * discountPercent; finalTotal = total - discount; discountApplied = true; }
    const totalPriceSpan = document.getElementById('totalPrice');
    if (totalPriceSpan) totalPriceSpan.innerHTML = formatPrice(finalTotal);
    const discountDiv = document.getElementById('discountInfo');
    if (discountDiv) {
        if (discountApplied) discountDiv.innerHTML = `✅ Скидка 5% (${totalQty} услуги) — экономия ${Math.round(discount).toLocaleString()} ₽`;
        else if (totalQty === 1 && total > 0) discountDiv.innerHTML = '🔹 Добавьте ещё одну услугу для скидки 5%';
        else if (totalQty >= 1 && total === 0) discountDiv.innerHTML = '🔹 Бесплатные услуги не участвуют в скидке. Добавьте платные услуги.';
        else discountDiv.innerHTML = '🔹 Добавьте услуги для расчёта скидки';
    }
    const container = document.getElementById('servicesList');
    if (!container) return;
    if (cart.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = '';
    cart.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'calc-item';
        let priceDisplay;
        if (item.price === null) priceDisplay = 'по запросу';
        else if (item.price === 0) priceDisplay = '0 ₽';
        else priceDisplay = (item.price * item.qty).toLocaleString() + ' ₽';
        const escapedName = window.escapeHtml ? window.escapeHtml(item.name) : item.name;
        div.innerHTML = `<div class="service-name">${escapedName}</div><div class="service-price">${priceDisplay}</div><div class="service-qty-control"><button class="qty-btn qty-minus" data-idx="${idx}">−</button><span class="qty-value">${item.qty}</span><button class="qty-btn qty-plus" data-idx="${idx}">+</button></div><div class="service-remove"><button class="remove-item" data-idx="${idx}">✖</button></div>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.qty-minus').forEach(btn => { btn.onclick = () => { const idx = parseInt(btn.dataset.idx, 10); if (cart[idx].qty > 1) cart[idx].qty--; else cart.splice(idx, 1); renderCart(); }; });
    document.querySelectorAll('.qty-plus').forEach(btn => { btn.onclick = () => { const idx = parseInt(btn.dataset.idx, 10); cart[idx].qty++; renderCart(); }; });
    document.querySelectorAll('.remove-item').forEach(btn => { btn.onclick = () => { const idx = parseInt(btn.dataset.idx, 10); cart.splice(idx, 1); renderCart(); }; });
}
function populateSelect(selectId, services) {
    const select = document.getElementById(selectId);
    if (!select) { if (window.IS_DEV) console.error('Select not found:', selectId); return; }
    select.innerHTML = '';
    services.forEach((service) => {
        const option = document.createElement('option');
        option.value = service.price !== null ? service.price : 'null';
        let priceDisplay;
        if (service.price === null) priceDisplay = 'по запросу';
        else if (service.price === 0) priceDisplay = '0 ₽';
        else priceDisplay = service.price.toLocaleString() + ' ₽';
        option.textContent = `${service.name} — ${priceDisplay}`;
        option.setAttribute('data-name', service.name);
        option.setAttribute('data-price', service.price !== null ? service.price : 'null');
        select.appendChild(option);
    });
}
function initSelects() {
    if (typeof SERVICES_DATA === 'undefined') { if (window.IS_DEV) console.error('SERVICES_DATA не загружен!'); return; }
    populateSelect('recruitment-select', SERVICES_DATA.recruitment);
    populateSelect('retention-select', SERVICES_DATA.retention);
    populateSelect('business-training-select', SERVICES_DATA["business-training"]);
    populateSelect('corporate-select', SERVICES_DATA.corporate);
    populateSelect('start-select', SERVICES_DATA.start);
    populateSelect('growth-select', SERVICES_DATA.growth);
    populateSelect('executive-select', SERVICES_DATA.executive);
    populateSelect('training-select', SERVICES_DATA.training);
    populateSelect('courses-select', SERVICES_DATA.courses);
}
function initAddButtons() {
    const handlers = [
        {btn: 'recruitment-add', select: 'recruitment-select', qty: 'recruitment-qty'},
        {btn: 'retention-add', select: 'retention-select', qty: 'retention-qty'},
        {btn: 'business-training-add', select: 'business-training-select', qty: 'business-training-qty'},
        {btn: 'corporate-add', select: 'corporate-select', qty: 'corporate-qty'},
        {btn: 'start-add', select: 'start-select', qty: 'start-qty'},
        {btn: 'growth-add', select: 'growth-select', qty: 'growth-qty'},
        {btn: 'executive-add', select: 'executive-select', qty: 'executive-qty'},
        {btn: 'training-add', select: 'training-select', qty: 'training-qty'},
        {btn: 'courses-add', select: 'courses-select', qty: 'courses-qty'}
    ];
    handlers.forEach(({btn, select, qty}) => {
        const button = document.getElementById(btn);
        if (button) {
            button.removeEventListener('click', button._handler);
            button._handler = () => {
                const selectEl = document.getElementById(select);
                const selectedOption = selectEl.options[selectEl.selectedIndex];
                const serviceName = selectedOption.getAttribute('data-name');
                let price = selectEl.value;
                price = (price === 'null' || price === '') ? null : parseInt(price, 10);
                let quantity = parseInt(document.getElementById(qty).value, 10);
                const defaultQty = window.APP_CONFIG?.CONSTANTS?.DEFAULT_QUANTITY || 1;
                if (isNaN(quantity) || quantity < defaultQty) quantity = defaultQty;
                if (serviceName) window.addToCart(serviceName, price, quantity);
                else { if (window.IS_DEV) console.error('Не удалось получить название услуги'); window.showErrorToast('❌ Ошибка: не удалось определить услугу'); }
            };
            button.addEventListener('click', button._handler);
        } else if (window.IS_DEV) console.error('Button not found:', btn);
    });
}
function initTabs() {
    const tabs = document.querySelectorAll('#calculator .tab-btn');
    tabs.forEach(btn => {
        btn.removeEventListener('click', btn._tabHandler);
        btn._tabHandler = () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('#calculator .tab-pane').forEach(pane => pane.classList.remove('active'));
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const activePane = document.getElementById(`tab-${tab}`);
            if (activePane) activePane.classList.add('active');
        };
        btn.addEventListener('click', btn._tabHandler);
    });
}
window.getCartData = function() { if (cart.length === 0) return 'Корзина пуста'; return cart.map(item => { const price = getNumericPrice(item.price); const totalPrice = price * item.qty; let priceDisplay; if (price === 0) priceDisplay = '0 ₽'; else if (price === null) priceDisplay = 'по запросу'; else priceDisplay = totalPrice.toLocaleString() + ' ₽'; return `${item.name} x${item.qty} = ${priceDisplay}`; }).join('\n'); };
function initCalculator() {
    if (window.IS_DEV) console.log('Инициализация калькулятора...');
    if (window._calculatorInitialized) { if (window.IS_DEV) console.log('Калькулятор уже инициализирован'); return; }
    window._calculatorInitialized = true;
    if (typeof SERVICES_DATA !== 'undefined') initSelects();
    else if (window.IS_DEV) console.error('SERVICES_DATA не загружен! Проверьте подключение services-data.js');
    initAddButtons();
    initTabs();
    if (window.IS_DEV) console.log('Инициализация калькулятора завершена');
}
window.initCalculator = initCalculator;