// ---------- Калькулятор услуг ----------
let cart = [];

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
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.idx);
            cart.splice(idx, 1);
            renderCart();
        });
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
    if (existing) existing.qty += quantity;
    else cart.push({ name, price, qty: quantity, cat });
    renderCart();
}

function initCalculator() {
    const businessAdd = document.getElementById('business-add');
    const individualAdd = document.getElementById('individual-add');
    const corporateAdd = document.getElementById('corporate-add');
    const groupAdd = document.getElementById('group-add');

    if (businessAdd) businessAdd.addEventListener('click', () => addToCart('business', 'business-select', 'business-qty'));
    if (individualAdd) individualAdd.addEventListener('click', () => addToCart('individual', 'individual-select', 'individual-qty'));
    if (corporateAdd) corporateAdd.addEventListener('click', () => addToCart('corporate', 'corporate-select', 'corporate-qty'));
    if (groupAdd) groupAdd.addEventListener('click', () => addToCart('group', 'group-select', 'group-qty'));

    const tabs = document.querySelectorAll('.calculator-tabs .tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    tabs.forEach(btn => btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        panes.forEach(p => p.classList.remove('active'));
        const activePane = document.getElementById(`tab-${tab}`);
        if (activePane) activePane.classList.add('active');
    }));
}

// Экспортируем для глобального доступа
window.initCalculator = initCalculator;