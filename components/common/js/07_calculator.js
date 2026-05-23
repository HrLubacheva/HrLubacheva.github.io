// ========== КАЛЬКУЛЯТОР (4 вкладки, кастомные дропдауны без иконок) ==========
let cart = [];
let calculatorInitialized = false;

function getCartData() {
    if (!cart || cart.length === 0) return 'Корзина пуста';
    let total = 0;
    let items = [];
    let maxNameLength = 0;
    cart.forEach(item => {
        const nameWithQty = `${item.name} x${item.qty}`;
        if (nameWithQty.length > maxNameLength) maxNameLength = nameWithQty.length;
    });
    maxNameLength = Math.min(maxNameLength, 45);
    cart.forEach(item => {
        total += item.price * item.qty;
        const nameWithQty = `${item.name} x${item.qty}`;
        const priceFormatted = (item.price * item.qty).toLocaleString() + ' ₽';
        const dotsLength = Math.max(1, maxNameLength + 2 - nameWithQty.length);
        const dots = '.'.repeat(dotsLength);
        items.push(`${nameWithQty} ${dots} ${priceFormatted}`);
    });
    let discount = cart.length >= 2 ? '\n✅ Скидка 5%' : '';
    let finalTotal = Math.round(total * (cart.length >= 2 ? 0.95 : 1));
    return items.join('\n') + `\n💰 Итого: ${finalTotal.toLocaleString()} ₽` + discount;
}
window.getCartData = getCartData;

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
                return `<option value="${s.price}">${s.service} — ${priceText}</option>`;
            }).join('');
        }
    }
}

// ========== КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК (простой и надёжный) ==========
function initCustomDropdowns() {
    const selects = document.querySelectorAll('.service-select');
    selects.forEach(select => {
        // Проверяем, не заменён ли уже
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-dropdown')) return;

        const container = document.createElement('div');
        container.className = 'custom-dropdown';

        const button = document.createElement('button');
        button.className = 'dropdown-button';
        const defaultText = select.options[select.selectedIndex]?.text || 'Выберите услугу';
        button.innerHTML = `${defaultText} <span class="dropdown-arrow">▼</span>`;

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';

        // Заполняем меню
        Array.from(select.options).forEach(opt => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'dropdown-option';
            optionDiv.textContent = opt.text;
            optionDiv.dataset.value = opt.value;
            optionDiv.addEventListener('click', () => {
                select.value = opt.value;
                button.innerHTML = `${opt.text} <span class="dropdown-arrow">▼</span>`;
                menu.querySelectorAll('.dropdown-option').forEach(div => div.classList.remove('selected'));
                optionDiv.classList.add('selected');
                menu.classList.remove('open');
                // Триггерим событие change на оригинальном select, чтобы обновить корзину
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            });
            menu.appendChild(optionDiv);
        });

        // Выделяем текущий выбранный пункт
        const selectedOpt = Array.from(select.options).find(opt => opt.selected);
        if (selectedOpt) {
            const selectedDiv = Array.from(menu.children).find(div => div.textContent === selectedOpt.text);
            if (selectedDiv) selectedDiv.classList.add('selected');
        }

        // Клик по кнопке
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            // Закрываем все остальные открытые меню
            document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
            menu.classList.toggle('open');
        });

        container.appendChild(button);
        container.appendChild(menu);
        select.style.display = 'none';
        select.parentNode.insertBefore(container, select.nextSibling);
    });

    // Закрываем меню при клике вне
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    });
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
    if (existing) existing.qty += quantity;
    else cart.push({ name, price, qty: quantity, cat });
    renderCart();
}

function initCalculator() {
    if (calculatorInitialized) return;
    calculatorInitialized = true;

    updateSelectsFromData();
    initCustomDropdowns();

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
}

window.initCalculator = initCalculator;
window.addToCart = addToCart;
window.renderCart = renderCart;