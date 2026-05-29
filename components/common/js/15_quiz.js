// ============================================================
// 15_quiz.js – Квиз: 5 вопросов, 2 услуги + бесплатная консультация
// Без подсветки лучшего выбора.
// При выборе услуги -> addToCart + скролл к #cart
// При помощи -> скролл к #callback-form
// ============================================================
(function () {
    let quizQuestions = [];
    let answers = [null, null, null, null, null];
    let quizState = 'questions';
    let currentQuestionIndex = 0;
    let isAnalyzing = false;
    let selectedVariantText = '';
    let selectedVariantPrice = '';
    let selectedOriginalText = '';
    let selectedOriginalPrice = '';
    const C = window.APP_CONFIG?.CONSTANTS || {};
    const QUIZ_ANALYZE_DELAY = C.QUIZ_ANALYZE_DELAY || 700;
    const BREAKPOINT_MOBILE = C.BREAKPOINT_MOBILE || 768;

    if (typeof window.escapeHtml !== 'function') {
        window.escapeHtml = function (str) { if (!str) return ''; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); };
    }

    const benefitTags = {
        "Аудит резюме": "🔥 Повысит отклики",
        "Подготовка к собеседованию (1ч)": "🎯 Уверенность +100%",
        "Переговоры о зарплате (1ч)": "💰 Прибавка до 30%",
        "Подбор специалиста": "⚡ Закрытие за 2 недели",
        "Коучинг для руководителей": "💼 Управляйте эффективнее",
        "Стратегия поиска работы": "🚀 Найдёте работу быстрее",
        "Индивидуальный тренинг «Продай себя дорого»": "🏆 Выделитесь среди других",
        "Развитие управленческих навыков": "📈 Рост команды",
        "Executive-коучинг/мес": "🎯 Стратегия для топов",
        "VIP-коучинг": "💎 Персональный подход",
        "Резюме специалиста": "📄 Привлечёт работодателя",
        "Профориентация для взрослых": "🧭 Найдёте своё призвание",
        "Карьерная стратегия (пакет 3 консультации)": "🗺️ Чёткий план",
        "Составление вакансии (с УТП)": "📢 Привлечёт лучших",
        "Хэдхантинг": "🎯 Только топ-кандидаты"
    };

    function getPrice(serviceName) { if (window.PRICE_BOOK && window.PRICE_BOOK[serviceName] !== undefined) { const price = window.PRICE_BOOK[serviceName]; if (price === 0) return '0 ₽'; if (price === null) return 'цена по запросу'; return price.toLocaleString() + ' ₽'; } return 'цена по запросу'; }

    function getNavbarHeight() {
        const navbar = document.querySelector('.navbar');
        return navbar ? navbar.offsetHeight : 0;
    }

    function scrollToElement(targetElement) {
        if (!targetElement) return;
        if (typeof window.smoothScrollTo === 'function') {
            const navbarHeight = getNavbarHeight();
            const offset = navbarHeight + 15;
            window.smoothScrollTo(targetElement, offset);
        } else {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Ищем корзину строго по id="cart"
    function getCartElement() {
        return document.getElementById('cart');
    }

    function updateFormHiddenFields(chosenText, chosenPrice, originalText, originalPrice, recommendedStr, answersArr) {
        const forms = ['callbackForm', 'quickOrderForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (!form) return;
            setField(form, 'chosenVariant', chosenText);
            setField(form, 'chosenVariantPrice', chosenPrice);
            setField(form, 'originalChosenVariant', originalText);
            setField(form, 'originalChosenVariantPrice', originalPrice);
            setField(form, 'recommendedVariants', recommendedStr);
            setField(form, 'quizAnswersRaw', answersArr.join('\n'));

            const qLabels = ['role', 'level', 'urgency', 'importance', 'budget'];
            for (let i = 0; i < qLabels.length; i++) {
                const fieldName = `quiz_q${i+1}_${qLabels[i]}`;
                setField(form, fieldName, answersArr[i] || '');
            }
            setField(form, 'quiz_recommendations', recommendedStr);
            setField(form, 'quiz_chosen_variant', chosenText);
            setField(form, 'quiz_chosen_price', chosenPrice);
        });
    }

    function setField(form, name, value) {
        let input = form.querySelector(`[name="${name}"]`);
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.id = name;
            form.appendChild(input);
        }
        input.value = value;
    }

    function updateSelectionBlock(variantText, variantPrice) {
        const block = document.getElementById('quizSelectionBlock');
        if (!block) return;
        const nameSpan = block.querySelector('.service-name');
        const priceSpan = block.querySelector('.service-price');
        if (variantText && variantText.trim() !== '') {
            if (nameSpan) nameSpan.innerHTML = window.escapeHtml(variantText);
            if (priceSpan && variantPrice && variantPrice !== '') priceSpan.innerHTML = window.escapeHtml(variantPrice);
            else if (priceSpan) priceSpan.innerHTML = '';
            block.style.display = '';
            if (window.innerWidth <= BREAKPOINT_MOBILE) block.style.display = 'flex';
            else block.style.display = 'grid';
        } else { block.style.display = 'none'; if (nameSpan) nameSpan.innerHTML = ''; if (priceSpan) priceSpan.innerHTML = ''; }
    }

    function sendQuizStats(answersStr, recommendedStr, chosenText, chosenPrice, originalText, originalPrice) {
        const scriptUrl = window.APP_CONFIG ? window.APP_CONFIG.SCRIPT_URL : window.SCRIPT_URL;
        if (!scriptUrl) return;
        const formData = { formType: 'Квиз ответы', quizAnswersRaw: answersStr, recommendedVariants: recommendedStr, chosenVariant: chosenText, chosenVariantPrice: chosenPrice, originalChosenVariant: originalText, originalChosenVariantPrice: originalPrice, userId: typeof window.getOrCreateLocalUserId === 'function' ? window.getOrCreateLocalUserId() : '' };
        if (typeof window.getTimeOnSite === 'function') formData.timeOnSite = window.getTimeOnSite();
        if (typeof window.getVisitStatsText === 'function') formData.visitStats = window.getVisitStatsText();
        if (typeof window.getUTMText === 'function') formData.utm = window.getUTMText();
        if (typeof window.getDeviceText === 'function') formData.device = window.getDeviceText();
        if (typeof window.getPageText === 'function') formData.page = window.getPageText();
        if (typeof window.postWithRetry === 'function') window.postWithRetry(scriptUrl, formData, 2, 1500).catch(err => { if (window.IS_DEV) console.warn('Ошибка отправки статистики квиза', err); });
        else fetch(scriptUrl, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(formData) }).catch(e => { if (window.IS_DEV) console.warn('Ошибка отправки статистики квиза (fallback)', e); });
    }

    const FIRST_QUESTION = { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников", "Развиваю сотрудников", "Найти себя / определиться с путём"] };
    const LEVEL_JOBSEEKER = { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Собственник бизнеса", "Директор / Managing Director"] };
    const LEVEL_RECRUITER = { text: "2. Какой уровень сотрудника ищете?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Собственник бизнеса", "Директор / Managing Director"] };
    const URGENCY_QUESTION = { text: "3. Как быстро нужен результат?", options: ["Максимально быстро", "1–2 месяца", "3–6 месяцев", "В течение года", "Ежемесячно / на постоянной основе", "Планирую постепенно"] };
    const IMPORTANCE_QUESTION = { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности", "Баланс работы и жизни"] };
    const BUDGET_QUESTION = { text: "5. Бюджет на консультацию/подбор?", options: ["До 5 000 ₽", "5 000 – 15 000 ₽", "15 000 – 50 000 ₽", "50 000 – 100 000 ₽", "100 000 – 300 000 ₽", "300 000 – 500 000 ₽", "Выше 500 000 ₽"] };

    let currentRole = null;
    let isSubmittingChoice = false;

    function startQuiz() {
        logInit('Квиз: startQuiz', 'INFO', '', 3);
        answers = [null, null, null, null, null];
        currentQuestionIndex = 0;
        quizState = 'questions';
        currentRole = null;
        quizQuestions = [
            FIRST_QUESTION,
            LEVEL_JOBSEEKER,
            URGENCY_QUESTION,
            IMPORTANCE_QUESTION,
            BUDGET_QUESTION
        ];
        selectedVariantText = ''; selectedVariantPrice = ''; selectedOriginalText = ''; selectedOriginalPrice = '';
        updateFormHiddenFields('', '', '', '', '', answers);
        updateSelectionBlock('', '');
        renderQuiz();
    }

    function updateSecondQuestion(role) {
        const businessRoles = ["Подбираю сотрудников", "Развиваю сотрудников", "Собственник бизнеса"];
        if (businessRoles.includes(role)) {
            quizQuestions[1] = {...LEVEL_RECRUITER};
        } else {
            quizQuestions[1] = {...LEVEL_JOBSEEKER};
        }
        if (answers[1] && !quizQuestions[1].options.includes(answers[1])) answers[1] = null;
        if (currentQuestionIndex === 1 && quizState === 'questions') renderQuiz();
    }

    function renderQuiz() {
        logInit(`Квиз: renderQuiz, state=${quizState}, questionIndex=${currentQuestionIndex}`, 'DEBUG', '', 5);
        const container = document.getElementById('quizContainer');
        if (!container) return;
        if (quizState === 'questions') {
            const currentQ = quizQuestions[currentQuestionIndex];
            if (!currentQ || !currentQ.options) { container.innerHTML = '<div style="text-align:center; padding:40px;">Ошибка загрузки вопроса</div>'; return; }
            const progressWidth = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
            let html = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${progressWidth}%;"></div></div><div class="quiz-question"><p>${window.escapeHtml(currentQ.text)}</p><div class="quiz-options">`;
            for (let opt of currentQ.options) { const isSelected = (answers[currentQuestionIndex] === opt); html += `<button class="quiz-option ${isSelected ? 'selected' : ''}" data-opt="${window.escapeHtml(opt)}" type="button">${window.escapeHtml(opt)}</button>`; }
            html += `</div></div><div class="quiz-nav"><button id="quizPrevBtn" class="btn-secondary" ${currentQuestionIndex === 0 ? 'disabled' : ''}>◀ Назад</button>`;
            if (currentQuestionIndex < quizQuestions.length - 1) html += `<button id="quizNextBtn" class="btn-primary">Далее ▶</button>`;
            html += `</div>`;
            container.innerHTML = html;
            document.querySelectorAll('.quiz-option').forEach(opt => {
                opt.removeEventListener('click', opt._handler);
                opt._handler = (e) => {
                    if (isAnalyzing) return;
                    const selected = e.currentTarget.dataset.opt;
                    answers[currentQuestionIndex] = selected;
                    if (currentQuestionIndex === 0) {
                        currentRole = selected;
                        updateSecondQuestion(currentRole);
                    }
                    if (currentQuestionIndex === quizQuestions.length - 1) {
                        isAnalyzing = true;
                        container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                        setTimeout(() => { const recommendations = window.getTopServices(answers); quizState = 'choice'; renderResult(recommendations); isAnalyzing = false; }, QUIZ_ANALYZE_DELAY);
                    } else {
                        currentQuestionIndex++;
                        renderQuiz();
                    }
                };
                opt.addEventListener('click', opt._handler);
            });
            const nextBtn = document.getElementById('quizNextBtn');
            if (nextBtn) {
                nextBtn.removeEventListener('click', nextBtn._nextHandler);
                nextBtn._nextHandler = () => {
                    if (isAnalyzing) return;
                    if (answers[currentQuestionIndex] === null) { window.showWarningToast('📌 Выберите вариант ответа, чтобы продолжить'); return; }
                    if (currentQuestionIndex === quizQuestions.length - 1) {
                        isAnalyzing = true;
                        container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                        setTimeout(() => { const recommendations = window.getTopServices(answers); quizState = 'choice'; renderResult(recommendations); isAnalyzing = false; }, QUIZ_ANALYZE_DELAY);
                    } else {
                        currentQuestionIndex++;
                        renderQuiz();
                    }
                };
                nextBtn.addEventListener('click', nextBtn._nextHandler);
            }
            const prevBtn = document.getElementById('quizPrevBtn');
            if (prevBtn) {
                prevBtn.removeEventListener('click', prevBtn._prevHandler);
                prevBtn._prevHandler = () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuiz(); } };
                prevBtn.addEventListener('click', prevBtn._prevHandler);
            }
        }
    }

    function extractNumericPrice(priceStr) {
        if (!priceStr) return null;
        const match = priceStr.replace(/\s/g, '').match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    function renderResult(recommendations) {
        logInit('Квиз: renderResult', 'INFO', '', 3);
        const container = document.getElementById('quizContainer');
        if (!container) return;

        const services = recommendations.services || [];
        const topTwo = services.slice(0, 2);
        const recommendationsText = topTwo.map((s, idx) => `📌 Рекомендация ${idx+1}: ${s.formatted} (${s.price})`).join('\n');
        const esc = window.escapeHtml;

        let cardsHtml = '';
        for (let i = 0; i < topTwo.length; i++) {
            const s = topTwo[i];
            let rawCategory = s.formatted.split(' — ')[0] || '';
            let category = rawCategory || 'Рекомендация';
            const name = esc(s.formatted.split(' — ')[1] || s.service);
            const price = esc(s.price);
            const serviceName = esc(s.service);
            const displayName = esc(s.formatted);
            const numericPrice = extractNumericPrice(s.price);
            const benefit = benefitTags[serviceName] || '';

            cardsHtml += `
                <div class="quiz-result-card" data-service-name="${serviceName}" data-price="${numericPrice !== null ? numericPrice : ''}">
                    <div class="quiz-result-icon">${i === 0 ? '🏆' : '🥈'}</div>
                    <div class="quiz-result-category">${esc(category)}</div>
                    <div class="quiz-result-title">${name}</div>
                    ${benefit ? `<div class="quiz-result-benefit">${esc(benefit)}</div>` : ''}
                    <div class="quiz-result-price">💰 ${price}</div>
                    <div class="quiz-result-buttons">
                        <button class="quiz-btn-select choose-option" data-choice="${i}" data-text="${serviceName}" data-price="${price}" data-display="${displayName}" data-numeric-price="${numericPrice !== null ? numericPrice : ''}">✅ Выбрать</button>
                    </div>
                </div>
            `;
        }

        cardsHtml += `
            <div class="quiz-result-card">
                <div class="quiz-result-icon">🤝</div>
                <div class="quiz-result-category">Помощь эксперта</div>
                <div class="quiz-result-title">Бесплатная консультация</div>
                <div class="quiz-result-price" style="background:#f5f5f5; color:#666;">🎁 15 минут</div>
                <div class="quiz-result-buttons">
                    <button class="quiz-btn-help choose-help" data-choice="help" data-text="Помогите выбрать (бесплатная консультация)" data-price="">Нужна помощь →</button>
                </div>
            </div>
        `;

        const html = `
            <p style="font-weight: 500; margin-bottom: 20px; text-align:center; font-size:0.95rem; color: var(--text-muted);">
                🎯 На основе ваших ответов мы подобрали оптимальные варианты.
            </p>
            <div class="quiz-results-grid">
                ${cardsHtml}
            </div>
            <div style="text-align:center; margin-top: 20px;">
                <button id="resetQuizBtn" class="btn-secondary" style="padding: 8px 20px; font-size: 0.85rem;">🔄 Пройти заново</button>
            </div>
        `;

        container.innerHTML = html;

        // Обработчик кнопки "✅ Выбрать" – добавление в корзину + скролл к #cart
        document.querySelectorAll('.choose-option').forEach(btn => {
            btn.removeEventListener('click', btn._choiceHandler);
            btn._choiceHandler = (e) => {
                if (isSubmittingChoice) return;
                isSubmittingChoice = true;
                const variantText = btn.dataset.text;
                const variantPrice = btn.dataset.price;
                const displayText = btn.dataset.display || variantText;
                const numericPrice = btn.dataset.numericPrice ? parseInt(btn.dataset.numericPrice, 10) : null;

                // Добавление в корзину
                if (numericPrice !== null && numericPrice !== 0 && typeof window.addToCart === 'function') {
                    window.addToCart(variantText, numericPrice, 1);
                    window.showSuccessToast(`🛒 ${variantText} добавлен(а) в корзину`);
                } else if (numericPrice === null || numericPrice === 0) {
                    window.showSuccessToast(`✅ Выбрано: ${displayText}`);
                } else {
                    window.showSuccessToast(`✅ Выбрано: ${displayText} (добавление в корзину недоступно)`);
                }

                // Сохранение выбора
                selectedVariantText = displayText;
                selectedVariantPrice = variantPrice;
                selectedOriginalText = variantText;
                selectedOriginalPrice = variantPrice;
                const answersArr = answers.slice();
                const answersStr = answersArr.map((a, idx) => {
                    const qText = ['Роль', 'Уровень', 'Срочность', 'Важность', 'Бюджет'][idx];
                    return `${qText}: ${a || 'не выбран'}`;
                }).join('\n');
                updateFormHiddenFields(selectedVariantText, selectedVariantPrice, selectedOriginalText, selectedOriginalPrice, recommendationsText, answersArr);
                updateSelectionBlock(selectedVariantText, selectedVariantPrice);
                sendQuizStats(answersStr, recommendationsText, selectedVariantText, selectedVariantPrice, selectedOriginalText, selectedOriginalPrice);

                // Подсветка выбранной карточки
                document.querySelectorAll('.quiz-result-card').forEach(card => card.classList.remove('selected'));
                const currentCard = btn.closest('.quiz-result-card');
                if (currentCard) currentCard.classList.add('selected');

                // Скролл к корзине (строго по id="cart")
                const cartElement = getCartElement();
                if (cartElement) {
                    scrollToElement(cartElement);
                } else if (window.IS_DEV) {
                    console.warn('Элемент #cart не найден. Скролл не выполнен.');
                }

                isSubmittingChoice = false;
            };
            btn.addEventListener('click', btn._choiceHandler);
        });

        // Обработчик "Нужна помощь?" – скролл к #callback-form
        const helpBtn = document.querySelector('.choose-help');
        if (helpBtn) {
            helpBtn.removeEventListener('click', helpBtn._helpHandler);
            helpBtn._helpHandler = () => {
                if (isSubmittingChoice) return;
                isSubmittingChoice = true;
                selectedVariantText = '';
                selectedVariantPrice = '';
                selectedOriginalText = 'Помогите выбрать (бесплатная консультация)';
                selectedOriginalPrice = '';
                const answersArr = answers.slice();
                const answersStr = answersArr.map((a, idx) => {
                    const qText = ['Роль', 'Уровень', 'Срочность', 'Важность', 'Бюджет'][idx];
                    return `${qText}: ${a || 'не выбран'}`;
                }).join('\n');
                updateFormHiddenFields(selectedVariantText, selectedVariantPrice, selectedOriginalText, selectedOriginalPrice, recommendationsText, answersArr);
                updateSelectionBlock(selectedOriginalText, selectedOriginalPrice);
                sendQuizStats(answersStr, recommendationsText, '', '', selectedOriginalText, selectedOriginalPrice);
                window.showSuccessToast('🙏 Спасибо! Я свяжусь с вами.');

                const callbackForm = document.getElementById('callback-form');
                if (callbackForm) {
                    scrollToElement(callbackForm);
                } else {
                    showFinalScreen();
                }
                isSubmittingChoice = false;
            };
            helpBtn.addEventListener('click', helpBtn._helpHandler);
        }

        const resetBtn = document.getElementById('resetQuizBtn');
        if (resetBtn) {
            resetBtn.removeEventListener('click', resetBtn._resetHandler);
            resetBtn._resetHandler = () => {
                startQuiz();
            };
            resetBtn.addEventListener('click', resetBtn._resetHandler);
        }

        function showFinalScreen() {
            container.innerHTML = `
                <style>
                    .quiz-final-screen { text-align: center; padding: 16px; }
                    .quiz-final-icon { font-size: 48px; margin-bottom: 12px; }
                    .quiz-final-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-dark, #1F4A6E); margin-bottom: 10px; }
                    .quiz-final-text { color: var(--text-muted, #666); margin-bottom: 20px; line-height: 1.5; }
                    .quiz-final-buttons { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin: 20px 0; }
                    .quiz-final-btn-primary, .quiz-final-btn-secondary { padding: 10px 24px; border-radius: 40px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.25s ease; text-decoration: none; display: inline-block; border: none; }
                    .quiz-final-btn-primary { background: linear-gradient(135deg, var(--primary, #2D6A9F), var(--primary-dark, #1F4A6E)); color: white; }
                    .quiz-final-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(45,106,159,0.2); }
                    .quiz-final-btn-secondary { background: transparent; border: 1.5px solid var(--primary, #2D6A9F); color: var(--primary, #2D6A9F); }
                    .quiz-final-btn-secondary:hover { background: rgba(45,106,159,0.06); transform: translateY(-1px); }
                    .quiz-final-reset { margin-top: 16px; }
                </style>
                <div class="quiz-final-screen">
                    <div class="quiz-final-icon">✨</div>
                    <div class="quiz-final-title">Спасибо за прохождение квиза!</div>
                    <div class="quiz-final-text">📋 Выбранная услуга сохранена. Заполните форму ниже, и я свяжусь с вами, чтобы обсудить детали.</div>
                    <div class="quiz-final-buttons">
                        <button class="quiz-final-btn-primary go-to-callback">📝 Перейти к форме заявки</button>
                        <button class="quiz-final-btn-secondary go-to-calculator">🔍 Посмотреть все услуги</button>
                    </div>
                    <div class="quiz-final-reset">
                        <button id="resetQuizBtnAfter" class="btn-secondary" style="padding: 8px 20px; font-size: 0.85rem;">🔄 Пройти заново</button>
                    </div>
                </div>
            `;
            const goToCallbackBtn = container.querySelector('.go-to-callback');
            const goToCalculatorBtn = container.querySelector('.go-to-calculator');
            const resetBtnAfter = document.getElementById('resetQuizBtnAfter');
            if (goToCallbackBtn) goToCallbackBtn.addEventListener('click', (e) => { e.preventDefault(); const target = document.getElementById('callback-form'); if (target) scrollToElement(target); });
            if (goToCalculatorBtn) goToCalculatorBtn.addEventListener('click', (e) => { e.preventDefault(); const target = document.getElementById('calculator'); if (target) scrollToElement(target); });
            if (resetBtnAfter) resetBtnAfter.addEventListener('click', () => startQuiz());
        }
    }

    window.initQuiz = function () {
        startQuiz();
        const removeBtn = document.getElementById('removeQuizSelection');
        if (removeBtn) {
            removeBtn.removeEventListener('click', removeBtn._removeHandler);
            removeBtn._removeHandler = function () {
                selectedVariantText = '';
                selectedVariantPrice = '';
                updateFormHiddenFields('', '', selectedOriginalText, selectedOriginalPrice, '', answers);
                updateSelectionBlock('', '');
                window.showSuccessToast('🗑️ Выбранный вариант удалён');
                document.querySelectorAll('.quiz-result-card').forEach(card => card.classList.remove('selected'));
            };
            removeBtn.addEventListener('click', removeBtn._removeHandler);
        }

        const copyResultBtn = document.getElementById('copyQuizResultBtn');
        if (copyResultBtn) {
            copyResultBtn.removeEventListener('click', copyResultBtn._copyHandler);
            copyResultBtn._copyHandler = function () {
                const actionKey = 'copy_quiz';
                if (window.isActionLocked && window.isActionLocked(actionKey, 5000)) return;
                const chosenVariant = document.getElementById('chosenVariant')?.value || '';
                const chosenVariantPrice = document.getElementById('chosenVariantPrice')?.value || '';
                const originalChosenVariant = document.getElementById('originalChosenVariant')?.value || '';
                const recommendedVariants = document.getElementById('recommendedVariants')?.value || '';
                if (!chosenVariant && !originalChosenVariant) { window.showWarningToast('📋 Пройдите квиз и выберите вариант, чтобы скопировать рекомендации.'); return; }
                let copyText = '🎯 Мои результаты квиза у Виктории Любачевой:\n\n';
                if (chosenVariant) { copyText += `✅ Выбранный вариант: ${chosenVariant}`; if (chosenVariantPrice) copyText += ` (${chosenVariantPrice})`; copyText += '\n'; }
                if (originalChosenVariant && originalChosenVariant !== chosenVariant) copyText += `📌 Исходный выбор: ${originalChosenVariant}\n`;
                if (recommendedVariants) copyText += `\n📌 Рекомендации эксперта:\n${recommendedVariants}\n`;
                copyText += `\n🔗 ${window.location.href.split('?')[0]}`;
                navigator.clipboard.writeText(copyText).then(() => { window.showSuccessToast('✅ Рекомендации скопированы в буфер'); if (window.lockAction) window.lockAction(actionKey, 5000); }).catch(() => { window.showErrorToast('❌ Не удалось скопировать'); });
            };
            copyResultBtn.addEventListener('click', copyResultBtn._copyHandler);
        }
    };
})();