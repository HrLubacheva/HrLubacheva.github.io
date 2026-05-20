// ---------- Калькулятор услуг ----------
let cart = [];
let calculatorInitialized = false;

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

    // Очищаем все списки
    const businessDiv = document.getElementById('business-list');
    const individualDiv = document.getElementById('individual-list');
    const corporateDiv = document.getElementById('corporate-list');
    const groupDiv = document.getElementById('group-list');

    if (businessDiv) businessDiv.innerHTML = '';
    if (individualDiv) individualDiv.innerHTML = '';
    if (corporateDiv) corporateDiv.innerHTML = '';
    if (groupDiv) groupDiv.innerHTML = '';

    cart.forEach((item, idx) => {
        let container = null;
        if (item.cat === 'business') container = businessDiv;
        else if (item.cat === 'individual') container = individualDiv;
        else if (item.cat === 'corporate') container = corporateDiv;
        else if (item.cat === 'group') container = groupDiv;

        if (!container) return;

        const div = document.createElement('div');
        div.className = 'calc-item';
        div.innerHTML = `<div>${item.name} × ${item.qty}</div><div>${(item.price * item.qty).toLocaleString()} ₽ <button class="remove-item" data-idx="${idx}" style="background:none;border:none;color:red;cursor:pointer;font-size:1.2rem;">✖</button></div>`;
        container.appendChild(div);
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        // Удаляем старые обработчики, чтобы не было дублирования
        btn.removeEventListener('click', btn._handler);
        btn._handler = (e) => {
            const idx = parseInt(btn.dataset.idx);
            cart.splice(idx, 1);
            renderCart();
        };
        btn.addEventListener('click', btn._handler);
    });
}

function addToCart(cat, selectId, qtyId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const price = parseInt(select.value);
    const name = select.options[select.selectedIndex].text.replace(/ — .*/, '');
    const quantity = parseInt(document.getElementById(qtyId).value);
    if (isNaN(quantity) || quantity < 1) return;

    const existing = cart.find(i => i.name === name && i.cat === cat);
    if (existing) {
        existing.qty += quantity;
    } else {
        cart.push({ name, price, qty: quantity, cat });
    }
    renderCart();
}

function initCalculator() {
    // Защита от двойной инициализации
    if (calculatorInitialized) {
        console.log('Калькулятор уже инициализирован');
        return;
    }
    calculatorInitialized = true;

    // Удаляем старые обработчики, если они есть
    const businessAdd = document.getElementById('business-add');
    const individualAdd = document.getElementById('individual-add');
    const corporateAdd = document.getElementById('corporate-add');
    const groupAdd = document.getElementById('group-add');

    // Создаём новые обработчики с защитой от дублирования
    const businessHandler = () => addToCart('business', 'business-select', 'business-qty');
    const individualHandler = () => addToCart('individual', 'individual-select', 'individual-qty');
    const corporateHandler = () => addToCart('corporate', 'corporate-select', 'corporate-qty');
    const groupHandler = () => addToCart('group', 'group-select', 'group-qty');

    if (businessAdd) {
        businessAdd.removeEventListener('click', businessAdd._handler);
        businessAdd._handler = businessHandler;
        businessAdd.addEventListener('click', businessAdd._handler);
    }
    if (individualAdd) {
        individualAdd.removeEventListener('click', individualAdd._handler);
        individualAdd._handler = individualHandler;
        individualAdd.addEventListener('click', individualAdd._handler);
    }
    if (corporateAdd) {
        corporateAdd.removeEventListener('click', corporateAdd._handler);
        corporateAdd._handler = corporateHandler;
        corporateAdd.addEventListener('click', corporateAdd._handler);
    }
    if (groupAdd) {
        groupAdd.removeEventListener('click', groupAdd._handler);
        groupAdd._handler = groupHandler;
        groupAdd.addEventListener('click', groupAdd._handler);
    }

    // Инициализация табов (тоже с защитой)
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

// Экспортируем для глобального доступа
window.initCalculator = initCalculator;
window.addToCart = addToCart;
window.renderCart = renderCart;