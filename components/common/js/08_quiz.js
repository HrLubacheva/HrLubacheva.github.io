// ========== КВИЗ (без подтверждения, цена из PRICE_BOOK) ==========
(function () {
    let quizQuestions = [];
    let answers = [];
    let quizState = 'questions';
    let quizInitialized = false;
    let currentQuestionIndex = 0;
    let isSubmittingChoice = false;
    let isAnalyzing = false;
    let currentRole = null;
    let isRendering = false;
    let choiceMade = false;

    if (typeof window.escapeHtml !== 'function') {
        window.escapeHtml = function (str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function (m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        };
    }

    function showErrorToast(message) {
        const existingToast = document.querySelector('.custom-toast-error');
        if (existingToast) existingToast.remove();
        const toast = document.createElement('div');
        toast.className = 'custom-toast-error';
        toast.innerHTML = `⚠️ ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
    }
    function showWarningToast(message) {
        const existingToast = document.querySelector('.custom-toast-warning');
        if (existingToast) existingToast.remove();
        const toast = document.createElement('div');
        toast.className = 'custom-toast-warning';
        toast.innerHTML = `🔔 ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
    }
    function showSuccessToast(message) {
        const existingToast = document.querySelector('.custom-toast-success');
        if (existingToast) existingToast.remove();
        const toast = document.createElement('div');
        toast.className = 'custom-toast-success';
        toast.innerHTML = `✅ ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    function updateCommentField(variantText, variantPrice) {
        const commentField = document.getElementById('callbackComment');
        if (!commentField) return;
        let selectedLine = variantText && variantText !== ''
            ? `🔹 Выбранный вариант: ${variantText}${variantPrice ? ' (' + variantPrice + ')' : ''}`
            : '🔹 Выбранный вариант: Помогите выбрать (бесплатная консультация)';
        let current = commentField.value;
        const lines = current.split('\n');
        const filteredLines = lines.filter(line => !line.trim().startsWith('🔹 Выбранный вариант:'));
        filteredLines.unshift(selectedLine);
        commentField.value = filteredLines.join('\n');
    }

    function getPrice(serviceName) {
        if (window.PRICE_BOOK && window.PRICE_BOOK[serviceName]) {
            return window.PRICE_BOOK[serviceName].toLocaleString() + ' ₽';
        }
        return 'цена по запросу';
    }

    const FIRST_QUESTION = { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] };
    const LEVEL_JOBSEEKER = { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Собственник бизнеса", "Директор / Managing Director"] };
    const LEVEL_RECRUITER = { text: "2. Какой уровень сотрудника ищете?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Собственник бизнеса", "Директор / Managing Director"] };
    const URGENCY_QUESTION = { text: "3. Как быстро нужен результат?", options: ["Максимально быстро", "1–2 месяца", "3–6 месяцев", "В течение года", "Ежемесячно / на постоянной основе", "Планирую постепенно"] };
    const IMPORTANCE_QUESTION = { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности", "Баланс работы и жизни"] };
    const BUDGET_QUESTION = { text: "5. Бюджет на консультацию/подбор?", options: ["До 5 000 ₽", "5 000 – 15 000 ₽", "15 000 – 50 000 ₽", "50 000 – 100 000 ₽", "100 000 – 300 000 ₽", "300 000 – 500 000 ₽", "Выше 500 000 ₽"] };

    function formatQuizAnswersOnly() {
        if (!answers || answers.length === 0) return '-';
        return answers.map(a => a === null ? 'не выбран' : a).join('\n');
    }
    window.quizAnswersRaw = null;
    function updateQuizAnswersRaw() { window.quizAnswersRaw = formatQuizAnswersOnly(); }

    function findVariant(answersArr) {
        if (!window.VARIANTS_MATRIX || !window.VARIANTS_MATRIX.length) {
            console.error('Матрица вариантов не загружена');
            return { variantA: 'Индивидуальная консультация (1ч)', variantB: 'Экспресс-консультация (30мин)' };
        }
        const user = {
            role: answersArr[0] === null ? '*' : answersArr[0],
            level: answersArr[1] === null ? '*' : answersArr[1],
            urgency: answersArr[2] === null ? '*' : answersArr[2],
            importance: answersArr[3] === null ? '*' : answersArr[3],
            budget: answersArr[4] === null ? '*' : answersArr[4]
        };
        const sorted = [...window.VARIANTS_MATRIX].sort((a, b) => a.priority - b.priority);
        for (const rule of sorted) {
            let match = true;
            if (rule.role !== '*' && rule.role !== user.role) match = false;
            if (rule.level !== '*' && rule.level !== user.level) match = false;
            if (rule.urgency !== '*' && rule.urgency !== user.urgency) match = false;
            if (rule.importance !== '*' && rule.importance !== user.importance) match = false;
            if (rule.budget !== '*' && rule.budget !== user.budget) match = false;
            if (match) return { variantA: rule.variantA, variantB: rule.variantB };
        }
        return { variantA: window.VARIANTS_MATRIX[0].variantA, variantB: window.VARIANTS_MATRIX[0].variantB };
    }

    function startQuiz() {
        answers = [null, null, null, null, null];
        currentQuestionIndex = 0;
        quizState = 'questions';
        currentRole = null;
        window.quizAnswersRaw = null;
        choiceMade = false;
        quizQuestions = [FIRST_QUESTION, LEVEL_JOBSEEKER, URGENCY_QUESTION, IMPORTANCE_QUESTION, BUDGET_QUESTION];
        quizInitialized = true;
        renderQuiz();
    }

    function updateSecondQuestion(role) {
        if (role === "Подбираю сотрудников") quizQuestions[1] = { ...LEVEL_RECRUITER };
        else quizQuestions[1] = { ...LEVEL_JOBSEEKER };
        if (answers[1] && !quizQuestions[1].options.includes(answers[1])) {
            answers[1] = null;
            updateQuizAnswersRaw();
        }
        if (currentQuestionIndex === 1 && quizState === 'questions') renderQuiz();
    }

    function renderQuiz() {
        if (isRendering) return;
        isRendering = true;
        const container = document.getElementById('quizContainer');
        if (!container) { console.error('quizContainer не найден!'); isRendering = false; return; }

        if (quizState === 'questions') {
            const currentQ = quizQuestions[currentQuestionIndex];
            if (!currentQ || !currentQ.options) { container.innerHTML = '<div style="text-align:center; padding:40px;">Ошибка загрузки вопроса</div>'; isRendering = false; return; }
            const progressWidth = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
            let html = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${progressWidth}%;"></div></div><div class="quiz-question"><p>${window.escapeHtml(currentQ.text)}</p><div class="quiz-options">`;
            for (let opt of currentQ.options) {
                const isSelected = (answers[currentQuestionIndex] === opt);
                html += `<div class="quiz-option ${isSelected ? 'selected' : ''}" data-opt="${window.escapeHtml(opt)}">${window.escapeHtml(opt)}</div>`;
            }
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
                    if (currentQuestionIndex === 0) { currentRole = selected; updateSecondQuestion(currentRole); }
                    updateQuizAnswersRaw();

                    if (currentQuestionIndex === quizQuestions.length - 1) {
                        isAnalyzing = true;
                        container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                        setTimeout(() => {
                            const filledAnswers = answers.map(a => a === null ? 'не выбран' : a);
                            const variant = findVariant(filledAnswers);
                            quizState = 'choice';
                            renderQuiz();
                            isAnalyzing = false;
                        }, 700);
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
                    if (answers[currentQuestionIndex] === null) showWarningToast('📌 Вы не выбрали ответ, переходим дальше');
                    if (currentQuestionIndex === quizQuestions.length - 1) {
                        if (answers[currentQuestionIndex] === null) { showWarningToast('⚠️ Чтобы получить подборку, выберите вариант ответа.'); return; }
                        isAnalyzing = true;
                        container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                        setTimeout(() => {
                            const filledAnswers = answers.map(a => a === null ? 'не выбран' : a);
                            const variant = findVariant(filledAnswers);
                            quizState = 'choice';
                            renderQuiz();
                            isAnalyzing = false;
                        }, 700);
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
        else if (quizState === 'choice') {
            const variant = findVariant(answers.map(a => a === null ? 'не выбран' : a));
            const priceA = getPrice(variant.variantA);
            const priceB = getPrice(variant.variantB);
            let html = `
                <p style="font-weight:600; margin-bottom:20px;">На основе ваших ответов мы подготовили 3 варианта:</p>
                <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
                    <div style="flex:1; min-width:250px; background:white; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                        <div style="font-size:32px; margin-bottom:12px;">📌</div>
                        <h4>Вариант 1</h4>
                        <p><strong>${window.escapeHtml(variant.variantA)}</strong></p>
                        <p class="service-price" style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceA}</p>
                        <button class="btn-primary choose-option" data-choice="1" data-text="${window.escapeHtml(variant.variantA)}" data-price="${priceA}">Узнать подробнее →</button>
                    </div>
                    <div style="flex:1; min-width:250px; background:white; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                        <div style="font-size:32px; margin-bottom:12px;">🎯</div>
                        <h4>Вариант 2</h4>
                        <p><strong>${window.escapeHtml(variant.variantB)}</strong></p>
                        <p class="service-price" style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceB}</p>
                        <button class="btn-primary choose-option" data-choice="2" data-text="${window.escapeHtml(variant.variantB)}" data-price="${priceB}">Узнать подробнее →</button>
                    </div>
                    <div style="flex:1; min-width:250px; background:#f8f9fa; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                        <div style="font-size:32px; margin-bottom:12px;">🤔</div>
                        <h4>Вариант 3</h4>
                        <p><strong>Не уверены в выборе?</strong></p>
                        <p style="font-size:0.9rem; margin-bottom:10px;">Позвольте помочь – бесплатная консультация 15 минут.</p>
                        <button class="btn-secondary choose-help" data-choice="help" data-text="Помогите выбрать (бесплатная консультация)" data-price="">Помогите выбрать →</button>
                    </div>
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button id="resetQuizBtn" class="btn-secondary">🔁 Пройти заново</button>
                </div>
            `;
            container.innerHTML = html;

            document.querySelectorAll('.choose-option').forEach(btn => {
                btn.removeEventListener('click', btn._choiceHandler);
                btn._choiceHandler = () => {
                    if (isSubmittingChoice) return;
                    isSubmittingChoice = true;
                    const variantText = btn.dataset.text;
                    const variantPrice = btn.dataset.price;
                    window.selectedVariantText = variantText;
                    window.selectedVariantPrice = variantPrice;
                    window.selectedVariantNumber = btn.dataset.choice;

                    updateCommentField(variantText, variantPrice);

                    const resultDiv = document.getElementById('quizResult');
                    if (resultDiv) {
                        resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${btn.dataset.choice}:</strong><br>${variantText}<br><br>📋 Заполните форму ниже, и я свяжусь с вами.`;
                        resultDiv.style.display = 'block';
                    }
                    showSuccessToast('Выбор сохранён. При необходимости отредактируйте комментарий.');

                    container.innerHTML = `
                        <p style="text-align:center; font-size:1.2rem; margin-bottom:20px;">✨ Спасибо за прохождение квиза! ✨</p>
                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
                            <button id="goToCallbackBtn" class="btn-primary" style="min-width: 200px;">📝 Перейти к форме заявки</button>
                            <button id="goToCalculatorBtn" class="btn-secondary" style="min-width: 200px;">🔍 Посмотреть все услуги</button>
                        </div>
                        <div style="text-align:center; margin-top:20px;">
                            <button id="resetQuizBtnAfter" class="btn-secondary">🔁 Пройти заново</button>
                        </div>
                    `;
                    document.getElementById('goToCallbackBtn')?.addEventListener('click', () => {
                        const target = document.getElementById('calendar');
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.location.href = '#calendar';
                    });
                    document.getElementById('goToCalculatorBtn')?.addEventListener('click', () => {
                        const target = document.getElementById('calculator');
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.location.href = '#calculator';
                    });
                    document.getElementById('resetQuizBtnAfter')?.addEventListener('click', () => {
                        answers = [null, null, null, null, null];
                        currentQuestionIndex = 0;
                        quizState = 'questions';
                        currentRole = null;
                        window.quizAnswersRaw = null;
                        window.selectedVariantText = null;
                        window.selectedVariantPrice = null;
                        choiceMade = false;
                        renderQuiz();
                    });
                    isSubmittingChoice = false;
                };
                btn.addEventListener('click', btn._choiceHandler);
            });

            const helpBtn = document.querySelector('.choose-help');
            if (helpBtn) {
                helpBtn.removeEventListener('click', helpBtn._helpHandler);
                helpBtn._helpHandler = () => {
                    if (isSubmittingChoice) return;
                    isSubmittingChoice = true;
                    window.selectedVariantText = "Помогите выбрать (бесплатная консультация)";
                    window.selectedVariantPrice = "";
                    window.selectedVariantNumber = "help";

                    updateCommentField("", "");

                    const resultDiv = document.getElementById('quizResult');
                    if (resultDiv) {
                        resultDiv.innerHTML = `<strong>✅ Вы выбрали: Помогите выбрать</strong><br>Заполните форму – я свяжусь с вами и помогу выбрать вариант.`;
                        resultDiv.style.display = 'block';
                    }
                    showSuccessToast('Спасибо! При необходимости отредактируйте комментарий.');

                    container.innerHTML = `
                        <p style="text-align:center; font-size:1.2rem; margin-bottom:20px;">✨ Спасибо за прохождение квиза! ✨</p>
                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
                            <button id="goToCallbackBtn" class="btn-primary" style="min-width: 200px;">📝 Перейти к форме</button>
                            <button id="goToCalculatorBtn" class="btn-secondary" style="min-width: 200px;">🔍 Посмотреть все услуги</button>
                        </div>
                        <div style="text-align:center; margin-top:20px;">
                            <button id="resetQuizBtnAfter" class="btn-secondary">🔁 Пройти заново</button>
                        </div>
                    `;
                    document.getElementById('goToCallbackBtn')?.addEventListener('click', () => {
                        const target = document.getElementById('calendar');
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.location.href = '#calendar';
                    });
                    document.getElementById('goToCalculatorBtn')?.addEventListener('click', () => {
                        const target = document.getElementById('calculator');
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else window.location.href = '#calculator';
                    });
                    document.getElementById('resetQuizBtnAfter')?.addEventListener('click', () => {
                        answers = [null, null, null, null, null];
                        currentQuestionIndex = 0;
                        quizState = 'questions';
                        currentRole = null;
                        window.quizAnswersRaw = null;
                        window.selectedVariantText = null;
                        window.selectedVariantPrice = null;
                        choiceMade = false;
                        renderQuiz();
                    });
                    isSubmittingChoice = false;
                };
                helpBtn.addEventListener('click', helpBtn._helpHandler);
            }

            const resetBtn = document.getElementById('resetQuizBtn');
            if (resetBtn) {
                resetBtn.removeEventListener('click', resetBtn._resetHandler);
                resetBtn._resetHandler = () => {
                    answers = [null, null, null, null, null];
                    currentQuestionIndex = 0;
                    quizState = 'questions';
                    currentRole = null;
                    window.quizAnswersRaw = null;
                    window.selectedVariantText = null;
                    window.selectedVariantPrice = null;
                    choiceMade = false;
                    renderQuiz();
                };
                resetBtn.addEventListener('click', resetBtn._resetHandler);
            }
        }
        isRendering = false;
    }

    window.initQuiz = function () { if (quizInitialized) return; startQuiz(); };
})();