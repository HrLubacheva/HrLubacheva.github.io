let cart = [];
let calculatorInitialized = false;

function getCartData() {
    if (!cart || cart.length === 0) return 'Корзина пуста';

    let total = 0;
    let items = [];
    let hasPriceOnRequest = false;

    cart.forEach(item => {
        if (item.price !== null && item.price > 0) {
            total += item.price * item.qty;
        } else {
            hasPriceOnRequest = true;
        }
    });

    cart.forEach(item => {
        const nameWithQty = `${item.name} x${item.qty}`;
        let priceText = '';

        if (item.price === null || item.price === 0) {
            priceText = 'по запросу';
        } else {
            priceText = (item.price * item.qty).toLocaleString() + ' ₽';
        }

        items.push(`${nameWithQty} — ${priceText}`);
    });

    let discount = 0;
    let discountApplied = false;
    const itemsWithPrice = cart.filter(item => item.price !== null && item.price > 0);
    const totalQuantity = itemsWithPrice.reduce((sum, item) => sum + item.qty, 0);

    if (totalQuantity >= 2 && total > 0) {
        discount = total * 0.05;
        discountApplied = true;
    }

    const finalTotal = total - discount;

    let result = items.join('\n');
    result += `\n💰 Итого: ${finalTotal.toLocaleString()} ₽`;

    if (discountApplied) {
        result += `\n✅ Скидка 5% (${totalQuantity} услуги) — экономия ${Math.round(discount).toLocaleString()} ₽`;
    }

    if (hasPriceOnRequest) {
        result += `\n📌 Услуги с пометкой «по запросу» — точная цена после консультации`;
    }

    return result;
}
window.getCartData = getCartData;

function updateSelectsFromData() {
    if (!window.LOCAL_SERVICES) return;
    const selects = {
        'business-recruitment-select': window.LOCAL_SERVICES.business_recruitment,
        'business-retention-select': window.LOCAL_SERVICES.business_retention,
        'business-training-select': window.LOCAL_SERVICES.business_training,
        'individual-base-select': window.LOCAL_SERVICES.individual_base,
        'individual-standard-select': window.LOCAL_SERVICES.individual_standard,
        'individual-premium-select': window.LOCAL_SERVICES.individual_premium,
        'corporate-select': window.LOCAL_SERVICES.corporate,
        'training-select': window.LOCAL_SERVICES.training,
        'author-courses-select': window.LOCAL_SERVICES.author_courses
    };
    for (const [id, data] of Object.entries(selects)) {
        const select = document.getElementById(id);
        if (select && data && data.length) {
            select.innerHTML = data.map(s => {
                let priceText = '';
                if (s.price === null || s.price === 0) {
                    priceText = 'по запросу';
                } else {
                    priceText = s.price.toLocaleString() + ' ₽';
                }
                return `<option value="${s.price === null ? 'null' : s.price}">${s.service} — ${priceText}</option>`;
            }).join('');
        }
    }
}

function initCustomDropdowns() {
    const selects = document.querySelectorAll('.service-select');
    selects.forEach(select => {
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-dropdown')) return;
        const container = document.createElement('div');
        container.className = 'custom-dropdown';
        const button = document.createElement('button');
        button.className = 'dropdown-button';
        const defaultText = select.options[select.selectedIndex]?.text || 'Выберите услугу';
        button.innerHTML = `${defaultText} <span class="dropdown-arrow">▼</span>`;
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';
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
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            });
            menu.appendChild(optionDiv);
        });
        const selectedOpt = Array.from(select.options).find(opt => opt.selected);
        if (selectedOpt) {
            const selectedDiv = Array.from(menu.children).find(div => div.textContent === selectedOpt.text);
            if (selectedDiv) selectedDiv.classList.add('selected');
        }
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
            menu.classList.toggle('open');
        });
        container.appendChild(button);
        container.appendChild(menu);
        select.style.display = 'none';
        select.parentNode.insertBefore(container, select.nextSibling);
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    });
}

function renderCart() {
    let total = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
        if (item.price !== null && item.price > 0) {
            total += item.price * item.qty;
            totalQuantity += item.qty;
        }
    });

    let finalTotal = total;
    let discount = 0;
    let discountApplied = false;

    if (totalQuantity >= 2 && total > 0) {
        discount = total * 0.05;
        finalTotal = total - discount;
        discountApplied = true;
    }

    const totalEl = document.getElementById('totalPrice');
    if (totalEl) {
        totalEl.innerText = finalTotal.toLocaleString() + ' ₽';
    }

    const discountDiv = document.getElementById('discountInfo');
    if (discountDiv) {
        if (discountApplied) {
            discountDiv.innerHTML = `✅ Скидка 5% (${totalQuantity} услуги) — экономия ${Math.round(discount).toLocaleString()} ₽`;
        } else if (totalQuantity === 1 && total > 0) {
            discountDiv.innerHTML = '🔹 Добавьте ещё одну услугу для скидки 5%';
        } else {
            discountDiv.innerHTML = '🔹 Добавьте услуги для расчёта скидки';
        }
    }

    // ОДНА ОБЩАЯ КОРЗИНА
    const cartContainer = document.getElementById('cart-items-list');
    if (cartContainer) cartContainer.innerHTML = '';

    if (cart.length === 0) {
        if (cartContainer) cartContainer.innerHTML = '<div class="cart-empty">Корзина пуста. Добавьте услуги выше.</div>';
        return;
    }

    cart.forEach((item, idx) => {
        if (!cartContainer) return;

        const priceDisplay = (item.price === null || item.price === 0)
            ? 'по запросу'
            : (item.price * item.qty).toLocaleString() + ' ₽';

        const div = document.createElement('div');
        div.className = 'calc-item';
        div.dataset.idx = idx;
        div.innerHTML = `
            <div class="service-name">${escapeHtml(item.name)}</div>
            <div class="service-price">${priceDisplay}</div>
            <div class="service-qty-control">
                <button class="qty-btn qty-minus" data-idx="${idx}" aria-label="Уменьшить количество">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn qty-plus" data-idx="${idx}" aria-label="Увеличить количество">+</button>
            </div>
            <div class="service-remove"><button class="remove-item" data-idx="${idx}" aria-label="Удалить услугу">✖</button></div>
        `;
        cartContainer.appendChild(div);
    });

    // Привязываем обработчики
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.removeEventListener('click', btn._minusHandler);
        btn._minusHandler = () => {
            const idx = parseInt(btn.dataset.idx);
            if (isNaN(idx)) return;
            if (cart[idx].qty > 1) {
                cart[idx].qty--;
            } else {
                cart.splice(idx, 1);
            }
            renderCart();
            if (typeof window.updateCartSummary === 'function') window.updateCartSummary();
        };
        btn.addEventListener('click', btn._minusHandler);
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.removeEventListener('click', btn._plusHandler);
        btn._plusHandler = () => {
            const idx = parseInt(btn.dataset.idx);
            if (isNaN(idx)) return;
            cart[idx].qty++;
            renderCart();
            if (typeof window.updateCartSummary === 'function') window.updateCartSummary();
        };
        btn.addEventListener('click', btn._plusHandler);
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.removeEventListener('click', btn._removeHandler);
        btn._removeHandler = () => {
            const idx = parseInt(btn.dataset.idx);
            if (isNaN(idx)) return;
            cart.splice(idx, 1);
            renderCart();
            if (typeof window.updateCartSummary === 'function') window.updateCartSummary();
        };
        btn.addEventListener('click', btn._removeHandler);
    });
}

function addToCart(cat, selectId, qtyId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const priceValue = select.value;
    let price = null;
    if (priceValue !== 'null' && !isNaN(parseInt(priceValue))) {
        price = parseInt(priceValue);
    }

    const fullText = select.options[select.selectedIndex].text;
    const name = fullText.replace(/ — .*/, '');

    let quantity = parseInt(document.getElementById(qtyId).value);
    if (isNaN(quantity) || quantity < 1) quantity = 1;

    // Все услуги складываются в одну общую корзину
    const existing = cart.find(i => i.name === name);
    if (existing) {
        existing.qty += quantity;
    } else {
        cart.push({ name, price, qty: quantity });
    }

    renderCart();
    if (typeof window.updateCartSummary === 'function') window.updateCartSummary();

    const priceText = (price === null || price === 0) ? 'по запросу' : price.toLocaleString() + ' ₽';
    if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(`✅ "${name}" добавлен(а) в корзину (${priceText})`);
    }
}

function initCalculator() {
    if (calculatorInitialized) return;
    calculatorInitialized = true;

    updateSelectsFromData();
    initCustomDropdowns();

    const handlers = [
        { btn: 'business-recruitment-add', cat: 'business_recruitment', select: 'business-recruitment-select', qty: 'business-recruitment-qty' },
        { btn: 'business-retention-add', cat: 'business_retention', select: 'business-retention-select', qty: 'business-retention-qty' },
        { btn: 'business-training-add', cat: 'business_training', select: 'business-training-select', qty: 'business-training-qty' },
        { btn: 'individual-base-add', cat: 'individual_base', select: 'individual-base-select', qty: 'individual-base-qty' },
        { btn: 'individual-standard-add', cat: 'individual_standard', select: 'individual-standard-select', qty: 'individual-standard-qty' },
        { btn: 'individual-premium-add', cat: 'individual_premium', select: 'individual-premium-select', qty: 'individual-premium-qty' },
        { btn: 'corporate-add', cat: 'corporate', select: 'corporate-select', qty: 'corporate-qty' },
        { btn: 'training-add', cat: 'training', select: 'training-select', qty: 'training-qty' },
        { btn: 'author-courses-add', cat: 'author_courses', select: 'author-courses-select', qty: 'author-courses-qty' }
    ];

    handlers.forEach(({ btn, cat, select, qty }) => {
        const button = document.getElementById(btn);
        if (button) {
            button.removeEventListener('click', button._handler);
            button._handler = () => addToCart(cat, select, qty);
            button.addEventListener('click', button._handler);
        }
    });

    // Инициализация табов
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