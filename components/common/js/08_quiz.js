// ========== КВИЗ (с 3 вариантами: тариф, альтернатива, помощь) ==========
(function(){
    let quizQuestions = [];
    let answers = [];
    let quizState = 'questions';
    let quizInitialized = false;
    let currentQuestionIndex = 0;
    let isSubmittingChoice = false;
    let isAnalyzing = false;
    let currentRole = null;
    let isRendering = false;

    // Резервная функция экранирования
    if (typeof window.escapeHtml !== 'function') {
        window.escapeHtml = function(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        };
    }

    // ========== ВОПРОСЫ ==========
    const FIRST_QUESTION = {
        text: "1. Ваша роль?",
        options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"]
    };
    const LEVEL_JOBSEEKER = {
        text: "2. Ваш текущий уровень?",
        options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"]
    };
    const LEVEL_RECRUITER = {
        text: "2. Какой уровень сотрудника ищете?",
        options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"]
    };
    const URGENCY_QUESTION = {
        text: "3. Как быстро нужен результат?",
        options: ["Максимально быстро", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"]
    };
    const IMPORTANCE_QUESTION = {
        text: "4. Что для вас важнее всего?",
        options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"]
    };
    const BUDGET_QUESTION = {
        text: "5. Бюджет на консультацию/подбор?",
        options: ["До 5 000 ₽", "5 000 – 15 000 ₽", "15 000 – 50 000 ₽", "50 000 – 100 000 ₽", "Выше 100 000 ₽"]
    };

    // Поиск варианта ответа во внешней матрице
    function findVariant(answersArr) {
        if (!window.VARIANTS_MATRIX || !window.VARIANTS_MATRIX.length) {
            console.error('Матрица вариантов не загружена');
            return { variantA: 'Индивидуальная консультация', variantB: 'Экспресс-консультация' };
        }
        const user = {
            role: answersArr[0],
            level: answersArr[1],
            urgency: answersArr[2],
            importance: answersArr[3],
            budget: answersArr[4]
        };
        const sorted = [...window.VARIANTS_MATRIX].sort((a,b) => a.priority - b.priority);
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

    // Получить цену из текста варианта
    function extractPrice(text) {
        const match = text.match(/(\d[\d\s]*)\s*₽/);
        if (match) return match[1].replace(/\s/g, '') + ' ₽';
        if (text.includes('по запросу')) return 'по запросу';
        return 'уточняйте';
    }

    // Сохранение и восстановление прогресса
    function saveQuizProgress() {
        try {
            localStorage.setItem('quizAnswers', JSON.stringify(answers));
            localStorage.setItem('quizCurrentIndex', currentQuestionIndex);
            localStorage.setItem('quizState', quizState);
            localStorage.setItem('quizCurrentRole', currentRole || '');
        } catch(e) {}
    }
    function restoreQuizProgress() {
        try {
            const savedAnswers = localStorage.getItem('quizAnswers');
            const savedIndex = localStorage.getItem('quizCurrentIndex');
            const savedState = localStorage.getItem('quizState');
            const savedRole = localStorage.getItem('quizCurrentRole');
            if (savedAnswers && savedIndex !== null && savedState) {
                answers = JSON.parse(savedAnswers);
                currentQuestionIndex = parseInt(savedIndex);
                quizState = savedState;
                currentRole = savedRole || null;
                return true;
            }
        } catch(e) {}
        return false;
    }

    function resetAndStart() {
        quizState = 'questions';
        currentQuestionIndex = 0;
        answers = [null, null, null, null, null];
        currentRole = null;
        localStorage.removeItem('quizAnswers');
        localStorage.removeItem('quizCurrentIndex');
        localStorage.removeItem('quizState');
        localStorage.removeItem('quizCurrentRole');
        startQuiz();
    }

    function startQuiz() {
        console.log('startQuiz вызван, роль:', currentRole);
        const restored = restoreQuizProgress();
        if (!restored) {
            answers = [null, null, null, null, null];
            currentQuestionIndex = 0;
            quizState = 'questions';
            currentRole = null;
        }
        quizQuestions = [
            FIRST_QUESTION,
            (currentRole === "Подбираю сотрудников") ? { ...LEVEL_RECRUITER } : { ...LEVEL_JOBSEEKER },
            URGENCY_QUESTION,
            IMPORTANCE_QUESTION,
            BUDGET_QUESTION
        ];
        quizInitialized = true;
        renderQuiz();
    }

    function updateSecondQuestion(role) {
        if (role === "Подбираю сотрудников") {
            quizQuestions[1] = { ...LEVEL_RECRUITER };
        } else {
            quizQuestions[1] = { ...LEVEL_JOBSEEKER };
        }
        if (answers[1] && !quizQuestions[1].options.includes(answers[1])) {
            answers[1] = null;
            saveQuizProgress();
        }
        if (currentQuestionIndex === 1 && quizState === 'questions') {
            renderQuiz();
        }
    }

    function renderQuiz() {
        if (isRendering) return;
        isRendering = true;
        const container = document.getElementById('quizContainer');
        if (!container) {
            console.error('quizContainer не найден!');
            isRendering = false;
            return;
        }

        if (quizState === 'questions') {
            const currentQ = quizQuestions[currentQuestionIndex];
            if (!currentQ || !currentQ.options) {
                container.innerHTML = '<div style="text-align:center; padding:40px;">Ошибка загрузки вопроса</div>';
                isRendering = false;
                return;
            }
            const progressWidth = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
            let html = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${progressWidth}%;"></div></div>`;
            html += `<div class="quiz-question"><p>${window.escapeHtml(currentQ.text)}</p><div class="quiz-options">`;
            for (let opt of currentQ.options) {
                const isSelected = (answers[currentQuestionIndex] === opt);
                html += `<div class="quiz-option ${isSelected ? 'selected' : ''}" data-opt="${window.escapeHtml(opt)}">${window.escapeHtml(opt)}</div>`;
            }
            html += `</div></div>`;
            html += `<div class="quiz-nav">`;
            html += `<button id="quizPrevBtn" class="btn-secondary" ${currentQuestionIndex === 0 ? 'disabled' : ''}>◀ Назад</button>`;
            if (currentQuestionIndex === quizQuestions.length - 1) {
                html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
            } else {
                html += `<button id="quizNextBtn" class="btn-primary">Далее ▶</button>`;
            }
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
                    saveQuizProgress();
                    renderQuiz();
                };
                opt.addEventListener('click', opt._handler);
            });

            const nextBtn = document.getElementById('quizNextBtn');
            if (nextBtn) {
                nextBtn.removeEventListener('click', nextBtn._nextHandler);
                nextBtn._nextHandler = () => {
                    if (isAnalyzing) return;
                    if (answers[currentQuestionIndex] === null) {
                        showErrorToast('📌 Пожалуйста, выберите ответ');
                        return;
                    }
                    currentQuestionIndex++;
                    saveQuizProgress();
                    renderQuiz();
                    document.querySelector('.quiz-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                };
                nextBtn.addEventListener('click', nextBtn._nextHandler);
            }

            const prevBtn = document.getElementById('quizPrevBtn');
            if (prevBtn) {
                prevBtn.removeEventListener('click', prevBtn._prevHandler);
                prevBtn._prevHandler = () => {
                    if (isAnalyzing) return;
                    if (currentQuestionIndex > 0) {
                        currentQuestionIndex--;
                        saveQuizProgress();
                        renderQuiz();
                        document.querySelector('.quiz-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                };
                prevBtn.addEventListener('click', prevBtn._prevHandler);
            }

            const submitBtn = document.getElementById('submitQuizBtn');
            if (submitBtn) {
                submitBtn.removeEventListener('click', submitBtn._submitHandler);
                submitBtn._submitHandler = () => {
                    if (isAnalyzing) return;
                    if (answers[currentQuestionIndex] === null) {
                        showErrorToast('📌 Выберите ответ перед отправкой');
                        return;
                    }
                    if (answers.includes(null)) {
                        showErrorToast('📋 Ответьте на все вопросы');
                        return;
                    }
                    isAnalyzing = true;
                    container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                    setTimeout(() => {
                        const variant = findVariant(answers);
                        quizState = 'choice';
                        renderQuiz();
                        isAnalyzing = false;
                    }, 1500);
                };
                submitBtn.addEventListener('click', submitBtn._submitHandler);
            }
        }
        else if (quizState === 'choice') {
            const variant = findVariant(answers);
            const priceA = extractPrice(variant.variantA);
            const priceB = extractPrice(variant.variantB);

            container.innerHTML = `
                <p style="font-weight:600; margin-bottom:20px;">На основе ваших ответов мы подготовили 3 варианта:</p>
                <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
                    <!-- Вариант 1 (рекомендуемый) -->
                    <div style="flex:1; min-width:250px; background:white; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                        <div style="font-size:32px; margin-bottom:12px;">📌</div>
                        <h4>Вариант 1</h4>
                        <p><strong>${window.escapeHtml(variant.variantA)}</strong></p>
                        <p style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceA}</p>
                        <button class="btn-primary choose-option" data-choice="1" data-text="${window.escapeHtml(variant.variantA)}">Выбрать →</button>
                    </div>
                    <!-- Вариант 2 (альтернатива) -->
                    <div style="flex:1; min-width:250px; background:white; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                        <div style="font-size:32px; margin-bottom:12px;">🎯</div>
                        <h4>Вариант 2</h4>
                        <p><strong>${window.escapeHtml(variant.variantB)}</strong></p>
                        <p style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceB}</p>
                        <button class="btn-primary choose-option" data-choice="2" data-text="${window.escapeHtml(variant.variantB)}">Выбрать →</button>
                    </div>
                    <!-- Вариант 3 (помощь) -->
                    <div style="flex:1; min-width:250px; background:#f8f9fa; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                        <div style="font-size:32px; margin-bottom:12px;">🤔</div>
                        <h4>Вариант 3</h4>
                        <p><strong>Не уверены в выборе?</strong></p>
                        <p style="font-size:0.9rem; margin-bottom:10px;">Позвольте помочь – бесплатная консультация 15 минут.</p>
                        <button class="btn-secondary choose-help" data-choice="help">Помогите выбрать →</button>
                    </div>
                </div>
                <div style="text-align:center; margin-top:30px;">
                    <button id="resetQuizBtn" class="btn-secondary">🔁 Пройти заново</button>
                </div>
            `;

            // Обработчики для вариантов 1 и 2 (выбор тарифа)
            document.querySelectorAll('.choose-option').forEach(btn => {
                btn.removeEventListener('click', btn._choiceHandler);
                btn._choiceHandler = () => {
                    if (isSubmittingChoice) return;
                    isSubmittingChoice = true;
                    const chosen = btn.dataset.choice;
                    const chosenText = btn.dataset.text;

                    const sendData = (userId) => {
                        const formData = {
                            formType: 'Квиз',
                            quizAnswers: answers.map((a, idx) => `${quizQuestions[idx]?.text} — ${a}`).join('\n'),
                            chosenVariant: `${chosen}: ${chosenText}`,
                            role: answers[0] || '',
                            level: answers[1] || '',
                            urgency: answers[2] || '',
                            importance: answers[3] || '',
                            budget: answers[4] || '',
                            userId: userId
                        };
                        if (typeof window.sendDataToSheet === 'function') {
                            window.sendDataToSheet(formData);
                        }
                        const resultDiv = document.getElementById('quizResult');
                        if (resultDiv) {
                            resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${chosenText}<br><br>📋 Напишите мне в Telegram: <a href="https://t.me/HrLubacheva" target="_blank">@HrLubacheva</a>`;
                            resultDiv.style.display = 'block';
                        }
                        document.querySelector('#calendar')?.scrollIntoView({ behavior: 'smooth' });
                        container.innerHTML = '<p>✨ Спасибо! Результат появился ниже.</p>';
                        isSubmittingChoice = false;
                        localStorage.removeItem('quizAnswers');
                        localStorage.removeItem('quizCurrentIndex');
                        localStorage.removeItem('quizState');
                        localStorage.removeItem('quizCurrentRole');
                    };
                    const uid = (typeof currentUserId !== 'undefined' && currentUserId) ? currentUserId : (typeof window.getOrCreateLocalUserId === 'function' ? window.getOrCreateLocalUserId() : 'unknown');
                    sendData(uid);
                };
                btn.addEventListener('click', btn._choiceHandler);
            });

            // Обработчик для варианта "Помочь выбрать"
            const helpBtn = document.querySelector('.choose-help');
            if (helpBtn) {
                helpBtn.removeEventListener('click', helpBtn._helpHandler);
                helpBtn._helpHandler = () => {
                    if (isSubmittingChoice) return;
                    isSubmittingChoice = true;

                    const sendHelpData = (userId) => {
                        const formData = {
                            formType: 'Помощь с выбором',
                            quizAnswers: answers.map((a, idx) => `${quizQuestions[idx]?.text} — ${a}`).join('\n'),
                            name: 'Требуется консультация',
                            comment: 'Пользователь не определился с выбором, просит помощи',
                            userId: userId
                        };
                        if (typeof window.sendDataToSheet === 'function') {
                            window.sendDataToSheet(formData);
                        }
                        const resultDiv = document.getElementById('quizResult');
                        if (resultDiv) {
                            resultDiv.innerHTML = `<strong>✅ Заявка отправлена!</strong><br>Я свяжусь с вами в ближайшее время, чтобы помочь выбрать подходящий вариант.`;
                            resultDiv.style.display = 'block';
                        }
                        document.querySelector('#calendar')?.scrollIntoView({ behavior: 'smooth' });
                        container.innerHTML = '<p>✨ Спасибо! Я скоро свяжусь с вами, чтобы помочь определиться.</p>';
                        isSubmittingChoice = false;
                        localStorage.removeItem('quizAnswers');
                        localStorage.removeItem('quizCurrentIndex');
                        localStorage.removeItem('quizState');
                        localStorage.removeItem('quizCurrentRole');
                    };

                    const uid = (typeof currentUserId !== 'undefined' && currentUserId) ? currentUserId : (typeof window.getOrCreateLocalUserId === 'function' ? window.getOrCreateLocalUserId() : 'unknown');
                    sendHelpData(uid);
                };
                helpBtn.addEventListener('click', helpBtn._helpHandler);
            }

            const resetBtn = document.getElementById('resetQuizBtn');
            if (resetBtn) {
                resetBtn.removeEventListener('click', resetBtn._resetHandler);
                resetBtn._resetHandler = () => resetAndStart();
                resetBtn.addEventListener('click', resetBtn._resetHandler);
            }
        }
        isRendering = false;
    }

    // Глобальная точка входа
    window.initQuiz = function() {
        if (quizInitialized) return;
        startQuiz();
    };
})();