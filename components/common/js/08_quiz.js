// ========== КВИЗ (с блокировкой перехода без выбора ответа) ==========
(function () {
    let quizQuestions = [];
    let answers = [null, null, null, null, null];
    let quizState = 'questions';
    let currentQuestionIndex = 0;
    let isSubmittingChoice = false;
    let isAnalyzing = false;

    let selectedVariantText = '';
    let selectedVariantPrice = '';
    let selectedOriginalText = '';
    let selectedOriginalPrice = '';

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

    function showSuccessToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'custom-toast-success';
        toast.innerHTML = `✅ ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showWarningToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'custom-toast-warning';
        toast.innerHTML = `🔔 ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    function getPrice(serviceName) {
        if (window.PRICE_BOOK && window.PRICE_BOOK[serviceName]) {
            return window.PRICE_BOOK[serviceName].toLocaleString() + ' ₽';
        }
        return 'цена по запросу';
    }

    function updateFormHiddenFields(chosenText, chosenPrice, originalText, originalPrice, recommendedStr, answersStr) {
        const forms = ['callbackForm', 'quickOrderForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (!form) return;
            const fields = {
                chosenVariant: chosenText,
                chosenVariantPrice: chosenPrice,
                originalChosenVariant: originalText,
                originalChosenVariantPrice: originalPrice,
                recommendedVariants: recommendedStr,
                quizAnswersRaw: answersStr
            };
            for (const [name, value] of Object.entries(fields)) {
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
        });
    }

    function updateSelectionBlock(variantText, variantPrice) {
        const block = document.getElementById('quizSelectionBlock');
        if (!block) return;
        const nameSpan = block.querySelector('.service-name');
        const priceSpan = block.querySelector('.service-price');

        if (variantText && variantText.trim() !== '') {
            if (nameSpan) nameSpan.innerHTML = window.escapeHtml(variantText);
            if (priceSpan && variantPrice && variantPrice !== '') {
                priceSpan.innerHTML = variantPrice;
            } else if (priceSpan) {
                priceSpan.innerHTML = '';
            }
            block.style.display = '';
            if (window.innerWidth <= 768) {
                block.style.display = 'flex';
            } else {
                block.style.display = 'grid';
            }
        } else {
            block.style.display = 'none';
            if (nameSpan) nameSpan.innerHTML = '';
            if (priceSpan) priceSpan.innerHTML = '';
        }
    }

    function sendQuizStats(answersStr, recommendedStr, chosenText, chosenPrice, originalText, originalPrice) {
        const scriptUrl = window.APP_CONFIG ? window.APP_CONFIG.SCRIPT_URL : window.SCRIPT_URL;
        if (!scriptUrl) return;
        const formData = {
            formType: 'Квиз ответы',
            quizAnswersRaw: answersStr,
            recommendedVariants: recommendedStr,
            chosenVariant: chosenText,
            chosenVariantPrice: chosenPrice,
            originalChosenVariant: originalText,
            originalChosenVariantPrice: originalPrice,
            userId: typeof window.getOrCreateLocalUserId === 'function' ? window.getOrCreateLocalUserId() : ''
        };
        if (typeof window.getTimeOnSite === 'function') formData.timeOnSite = window.getTimeOnSite();
        if (typeof window.getVisitStatsText === 'function') formData.visitStats = window.getVisitStatsText();
        if (typeof window.getUTMText === 'function') formData.utm = window.getUTMText();
        if (typeof window.getDeviceText === 'function') formData.device = window.getDeviceText();
        if (typeof window.getPageText === 'function') formData.page = window.getPageText();

        if (typeof window.postWithRetry === 'function') {
            window.postWithRetry(scriptUrl, formData, 2, 1500).catch(err => console.warn('Ошибка отправки статистики квиза:', err));
        } else {
            console.warn('postWithRetry не определён, отправка через fallback fetch');
            fetch(scriptUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams(formData)
            }).catch(e => console.warn('Fallback ошибка:', e));
        }
    }

    const FIRST_QUESTION = {
        text: "1. Ваша роль?",
        options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"]
    };
    const LEVEL_JOBSEEKER = {
        text: "2. Ваш текущий уровень?",
        options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Собственник бизнеса", "Директор / Managing Director"]
    };
    const LEVEL_RECRUITER = {
        text: "2. Какой уровень сотрудника ищете?",
        options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Собственник бизнеса", "Директор / Managing Director"]
    };
    const URGENCY_QUESTION = {
        text: "3. Как быстро нужен результат?",
        options: ["Максимально быстро", "1–2 месяца", "3–6 месяцев", "В течение года", "Ежемесячно / на постоянной основе", "Планирую постепенно"]
    };
    const IMPORTANCE_QUESTION = {
        text: "4. Что для вас важнее всего?",
        options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности", "Баланс работы и жизни"]
    };
    const BUDGET_QUESTION = {
        text: "5. Бюджет на консультацию/подбор?",
        options: ["До 5 000 ₽", "5 000 – 15 000 ₽", "15 000 – 50 000 ₽", "50 000 – 100 000 ₽", "100 000 – 300 000 ₽", "300 000 – 500 000 ₽", "Выше 500 000 ₽"]
    };

    let currentRole = null;

    function startQuiz() {
        answers = [null, null, null, null, null];
        currentQuestionIndex = 0;
        quizState = 'questions';
        currentRole = null;
        quizQuestions = [FIRST_QUESTION, LEVEL_JOBSEEKER, URGENCY_QUESTION, IMPORTANCE_QUESTION, BUDGET_QUESTION];
        selectedVariantText = '';
        selectedVariantPrice = '';
        selectedOriginalText = '';
        selectedOriginalPrice = '';
        updateFormHiddenFields('', '', '', '', '', '');
        updateSelectionBlock('', '');
        renderQuiz();
    }

    function updateSecondQuestion(role) {
        if (role === "Подбираю сотрудников") quizQuestions[1] = {...LEVEL_RECRUITER};
        else quizQuestions[1] = {...LEVEL_JOBSEEKER};
        if (answers[1] && !quizQuestions[1].options.includes(answers[1])) answers[1] = null;
        if (currentQuestionIndex === 1 && quizState === 'questions') renderQuiz();
    }

    function renderQuiz() {
        const container = document.getElementById('quizContainer');
        if (!container) return;

        if (quizState === 'questions') {
            const currentQ = quizQuestions[currentQuestionIndex];
            if (!currentQ || !currentQ.options) {
                container.innerHTML = '<div style="text-align:center; padding:40px;">Ошибка загрузки вопроса</div>';
                return;
            }
            const progressWidth = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
            let html = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${progressWidth}%;"></div></div>
                        <div class="quiz-question"><p>${window.escapeHtml(currentQ.text)}</p><div class="quiz-options">`;
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
                    if (currentQuestionIndex === 0) {
                        currentRole = selected;
                        updateSecondQuestion(currentRole);
                    }
                    if (currentQuestionIndex === quizQuestions.length - 1) {
                        isAnalyzing = true;
                        container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                        setTimeout(() => {
                            const topTwo = window.getTopTwoServices(answers);
                            quizState = 'choice';
                            renderResult(topTwo);
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
                    if (answers[currentQuestionIndex] === null) {
                        showWarningToast('📌 Выберите вариант ответа, чтобы продолжить');
                        return;
                    }
                    if (currentQuestionIndex === quizQuestions.length - 1) {
                        isAnalyzing = true;
                        container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
                        setTimeout(() => {
                            const topTwo = window.getTopTwoServices(answers);
                            quizState = 'choice';
                            renderResult(topTwo);
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
                prevBtn._prevHandler = () => {
                    if (currentQuestionIndex > 0) {
                        currentQuestionIndex--;
                        renderQuiz();
                    }
                };
                prevBtn.addEventListener('click', prevBtn._prevHandler);
            }
        }
    }

    function renderResult(topTwo) {
        const container = document.getElementById('quizContainer');
        if (!container) return;

        const displayNameA = topTwo.variantAFormatted || topTwo.variantA;
        const displayNameB = topTwo.variantBFormatted || topTwo.variantB;
        const priceA = topTwo.priceA || getPrice(topTwo.variantA);
        const priceB = topTwo.priceB || getPrice(topTwo.variantB);
        const recommendations = `📌 Рекомендация 1: ${displayNameA} (${priceA})\n🎯 Рекомендация 2: ${displayNameB} (${priceB})`;

        let html = `
            <p style="font-weight:600; margin-bottom:20px;">На основе ваших ответов мы подобрали оптимальные варианты:</p>
            <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
                <div style="flex:1; min-width:250px; background:white; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                    <div style="font-size:32px; margin-bottom:12px;">📌</div>
                    <h4>Рекомендация 1</h4>
                    <p style="font-size:0.85rem; color:#666; margin-bottom:8px;">${window.escapeHtml(displayNameA.split(' — ')[0])}</p>
                    <p><strong>${window.escapeHtml(displayNameA.split(' — ')[1] || displayNameA)}</strong></p>
                    <p class="service-price" style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceA}</p>
                    <button class="btn-primary choose-option" data-choice="1" data-text="${window.escapeHtml(topTwo.variantA)}" data-price="${priceA}" data-display="${window.escapeHtml(displayNameA)}">Узнать подробнее →</button>
                </div>
                <div style="flex:1; min-width:250px; background:white; border-radius:28px; padding:28px; border:1px solid #e0e0e0;">
                    <div style="font-size:32px; margin-bottom:12px;">🎯</div>
                    <h4>Рекомендация 2</h4>
                    <p style="font-size:0.85rem; color:#666; margin-bottom:8px;">${window.escapeHtml(displayNameB.split(' — ')[0])}</p>
                    <p><strong>${window.escapeHtml(displayNameB.split(' — ')[1] || displayNameB)}</strong></p>
                    <p class="service-price" style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceB}</p>
                    <button class="btn-primary choose-option" data-choice="2" data-text="${window.escapeHtml(topTwo.variantB)}" data-price="${priceB}" data-display="${window.escapeHtml(displayNameB)}">Узнать подробнее →</button>
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
                const displayText = btn.dataset.display || variantText;

                selectedVariantText = displayText;
                selectedVariantPrice = variantPrice;
                selectedOriginalText = variantText;
                selectedOriginalPrice = variantPrice;

                const answersStr = answers.map((a, idx) => {
                    const qText = ['Роль', 'Уровень', 'Срочность', 'Важность', 'Бюджет'][idx];
                    return `${qText}: ${a || 'не выбран'}`;
                }).join('\n');

                updateFormHiddenFields(selectedVariantText, selectedVariantPrice, selectedOriginalText, selectedOriginalPrice, recommendations, answersStr);
                updateSelectionBlock(selectedVariantText, selectedVariantPrice);
                sendQuizStats(answersStr, recommendations, selectedVariantText, selectedVariantPrice, selectedOriginalText, selectedOriginalPrice);
                showSuccessToast('Выбор сохранён');
                showFinalScreen();
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
                selectedVariantText = '';
                selectedVariantPrice = '';
                selectedOriginalText = 'Помогите выбрать (бесплатная консультация)';
                selectedOriginalPrice = '';

                const answersStr = answers.map((a, idx) => {
                    const qText = ['Роль', 'Уровень', 'Срочность', 'Важность', 'Бюджет'][idx];
                    return `${qText}: ${a || 'не выбран'}`;
                }).join('\n');

                updateFormHiddenFields(selectedVariantText, selectedVariantPrice, selectedOriginalText, selectedOriginalPrice, recommendations, answersStr);
                updateSelectionBlock(selectedOriginalText, selectedOriginalPrice);
                sendQuizStats(answersStr, recommendations, '', '', selectedOriginalText, selectedOriginalPrice);
                showSuccessToast('Спасибо!');
                showFinalScreen();
                isSubmittingChoice = false;
            };
            helpBtn.addEventListener('click', helpBtn._helpHandler);
        }

        const resetBtn = document.getElementById('resetQuizBtn');
        if (resetBtn) {
            resetBtn.removeEventListener('click', resetBtn._resetHandler);
            resetBtn._resetHandler = () => startQuiz();
            resetBtn.addEventListener('click', resetBtn._resetHandler);
        }

        function showFinalScreen() {
            container.innerHTML = `
                <p style="text-align:center; font-size:1.2rem; margin-bottom:20px;">✨ Спасибо за прохождение квиза! ✨</p>
                <p style="text-align:center; margin-bottom:20px;">📋 Заполните форму ниже, и я свяжусь с вами.</p>
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
                if (target) target.scrollIntoView({behavior: 'smooth', block: 'start'});
            });
            document.getElementById('goToCalculatorBtn')?.addEventListener('click', () => {
                const target = document.getElementById('calculator');
                if (target) target.scrollIntoView({behavior: 'smooth', block: 'start'});
            });
            document.getElementById('resetQuizBtnAfter')?.addEventListener('click', () => startQuiz());
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
                updateFormHiddenFields('', '', selectedOriginalText, selectedOriginalPrice, '', '');
                updateSelectionBlock('', '');
                showSuccessToast('Выбранный вариант удалён');
            };
            removeBtn.addEventListener('click', removeBtn._removeHandler);
        }
    };
})();