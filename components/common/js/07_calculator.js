// ========== КАЛЬКУЛЯТОР (4 вкладки, данные из внешнего файла, логирование корзины) ==========
let cart = [];
let calculatorInitialized = false;

// Получить текстовое представление корзины для отправки
function getCartData() {
    if (!cart || cart.length === 0) return 'Корзина пуста';
    let total = 0;
    let items = cart.map(item => {
        total += item.price * item.qty;
        return `${item.name} x${item.qty} (${(item.price * item.qty).toLocaleString()} ₽)`;
    }).join('; ');
    let discount = cart.length >= 2 ? ' (скидка 5%)' : '';
    let finalTotal = Math.round(total * (cart.length >= 2 ? 0.95 : 1));
    return items + '; Итого: ' + finalTotal.toLocaleString() + ' ₽' + discount;
}
window.getCartData = getCartData;

// Логирование изменения корзины в Лист4 (Google Sheets)
function logCartToSheet(action) {
    const url = window.SCRIPT_URL;
    if (!url) return;
    const userId = typeof window.getOrCreateLocalUserId === 'function' ? window.getOrCreateLocalUserId() : 'unknown';
    const cartText = getCartData();
    let total = '';
    const match = cartText.match(/Итого:\s*([\d\s]+)₽/);
    if (match) total = match[1].replace(/\s/g, '');

    const formData = {
        formType: 'Корзина',
        action: action,
        userId: userId,
        cart: cartText,
        total: total
    };
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData)
    }).catch(err => console.error('Ошибка логирования корзины:', err));
}

function updateSelectsFromData() {
    if (!window.LOCAL_SERVICES) {
        console.error('Данные услуг не загружены (window.LOCAL_SERVICES отсутствует)');
        return;
    }
    const selects = {
        'business-select': window.LOCAL_SERVICES.business,
        'individual-select': window.LOCAL_SERVICES.individual,
        'corporate-select': window.LOCAL_SERVICES.corporate,
        'group-select': window.LOCAL_SERVICES.group
    };
    for (const [id, data] of Object.entries(selects)) {
        const select = document.getElementById(id);
        if (select && data && data.length) {
            select.innerHTML = data.map(s => {
                const priceText = s.price > 0 ? s.price.toLocaleString() + ' ₽' : 'по запросу';
                return `<option value="${s.price}">${escapeHtml(s.service)} — ${priceText}</option>`;
            }).join('');
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
    const containers = {
        business: 'business-list',
        individual: 'individual-list',
        corporate: 'corporate-list',
        group: 'group-list'
    };
    for (const cat of Object.keys(containers)) {
        const container = document.getElementById(containers[cat]);
        if (container) container.innerHTML = '';
    }
    cart.forEach((item, idx) => {
        const container = document.getElementById(containers[item.cat]);
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'calc-item';
        div.innerHTML = `
            <div class="service-name">${escapeHtml(item.name)}</div>
            <div class="service-price">${item.price > 0 ? (item.price * item.qty).toLocaleString() + ' ₽' : 'по запросу'}</div>
            <div class="service-qty">× ${item.qty}</div>
            <div class="service-remove"><button class="remove-item" data-idx="${idx}">✖</button></div>
        `;
        container.appendChild(div);
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.removeEventListener('click', btn._handler);
        btn._handler = () => {
            cart.splice(parseInt(btn.dataset.idx), 1);
            renderCart();
            logCartToSheet('remove');
        };
        btn.addEventListener('click', btn._handler);
    });
    // После каждого рендера (добавление/удаление) логируем изменение
    logCartToSheet('update');
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

    updateSelectsFromData();

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

    log('✅ Калькулятор инициализирован (4 вкладки, данные из внешнего файла)');
}

window.initCalculator = initCalculator;
window.addToCart = addToCart;
window.renderCart = renderCart;