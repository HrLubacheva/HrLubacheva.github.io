let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;
let currentQuestionIndex = 0;
let totalQuestions = 0;
let isSubmittingChoice = false;
let isAnalyzing = false;
let currentRole = null; // запоминаем роль для динамической смены вопроса

// Базовые вопросы (второй вопрос будет заменён динамически)
const BASE_QUESTIONS = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    // место для второго вопроса (заполнится позже)
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];

// Вопрос для тех, кто ищет работу (оригинальный)
const LEVEL_QUESTION_JOBSEEKER = { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] };

// Вопрос для тех, кто подбирает сотрудников
const LEVEL_QUESTION_RECRUITER = { text: "2. Какой уровень сотрудника ищете?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] };

// Матрица подбора вариантов (расширена для рекрутеров)
const VARIANTS_MATRIX = [
    // Рекрутеры
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "HR-аудит и закрытие вакансии под ключ", variantB: "Бесплатная диагностика вакансии" },
    // Соискатели Junior
    { priority: 2, role: "Ищу работу", level: "Junior / начинающий", urgency: "*", importance: "*", budget: "*", variantA: "Карьерная стратегия + упаковка резюме", variantB: "Экспресс-консультация по поиску" },
    // Соискатели Middle
    { priority: 3, role: "Ищу работу", level: "Middle / опытный", urgency: "*", importance: "*", budget: "*", variantA: "Тренинг «Продай себя дорого» и переговоры о зарплате", variantB: "Индивидуальное сопровождение до оффера" },
    // Соискатели Senior/Lead
    { priority: 4, role: "Ищу работу", level: "Senior / ведущий", urgency: "*", importance: "*", budget: "*", variantA: "Executive-коучинг и позиционирование C-level", variantB: "Стратегия поиска через хедхантеров" },
    { priority: 5, role: "Ищу работу", level: "Lead / руководитель", urgency: "*", importance: "*", budget: "*", variantA: "Управленческий аудит и карта роста", variantB: "Подготовка к совету директоров" },
    // Дефолтный вариант
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Индивидуальная карьерная стратегия + полное сопровождение", variantB: "Тренинг «Продай себя дорого» + самоподготовка" }
];

function initQuizData() {
    // Начинаем с базовых вопросов, но второй вопрос будет заменён динамически
    quizQuestions = [...BASE_QUESTIONS];
    // Временно вставляем заглушку на вторую позицию
    quizQuestions.splice(1, 0, { text: "2. Загрузка...", options: [] });
    answers = new Array(quizQuestions.length).fill(null);
    currentQuestionIndex = 0;
    currentRole = null;
}

function updateSecondQuestion(role) {
    if (role === "Подбираю сотрудников") {
        quizQuestions[1] = LEVEL_QUESTION_RECRUITER;
    } else {
        quizQuestions[1] = LEVEL_QUESTION_JOBSEEKER;
    }
    // Сброс ответа на второй вопрос при смене роли
    if (answers[1] !== undefined) answers[1] = null;
    // Перерисовываем только если мы на этом вопросе или раньше
    if (quizState === 'questions' && currentQuestionIndex <= 1) {
        renderQuiz();
    }
}

function findVariant(answersArr) {
    const user = {
        role: answersArr[0],
        level: answersArr[1],
        urgency: answersArr[2],
        importance: answersArr[3],
        budget: answersArr[4]
    };
    const sorted = [...VARIANTS_MATRIX].sort((a,b) => a.priority - b.priority);
    for (const rule of sorted) {
        let match = true;
        if (rule.role !== '*' && rule.role !== user.role) match = false;
        if (rule.level !== '*' && rule.level !== user.level) match = false;
        if (rule.urgency !== '*' && rule.urgency !== user.urgency) match = false;
        if (rule.importance !== '*' && rule.importance !== user.importance) match = false;
        if (rule.budget !== '*' && rule.budget !== user.budget) match = false;
        if (match) return { variantA: rule.variantA, variantB: rule.variantB };
    }
    const def = VARIANTS_MATRIX.find(r => r.priority === 999) || VARIANTS_MATRIX[0];
    return { variantA: def.variantA, variantB: def.variantB };
}

function resetQuiz() {
    quizState = 'questions';
    currentQuestionIndex = 0;
    initQuizData(); // переинициализируем с правильным вторым вопросом
    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    if (quizQuestions.length === 0 || quizQuestions[1].options.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Загрузка...</div>';
        return;
    }
    totalQuestions = quizQuestions.length;
    if (quizState === 'questions') {
        let progressHtml = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${((currentQuestionIndex+1)/totalQuestions)*100}%;"></div></div>`;
        let question = quizQuestions[currentQuestionIndex];
        let html = progressHtml;
        html += `<div class="quiz-question fade-up"><p>${escapeHtml(question.text)}</p><div class="quiz-options" data-q="${currentQuestionIndex}">`;
        for (let opt of question.options) {
            html += `<div class="quiz-option ${answers[currentQuestionIndex] === opt ? 'selected' : ''}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
        }
        html += `</div></div>`;
        html += `<div class="quiz-nav"><button id="quizPrevBtn" class="btn-secondary" ${currentQuestionIndex === 0 ? 'disabled' : ''}>◀ Назад</button>`;
        if (currentQuestionIndex === totalQuestions - 1) {
            html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        } else {
            html += `<button id="quizNextBtn" class="btn-primary">Далее ▶</button>`;
        }
        html += `</div>`;
        container.innerHTML = html;

        // Обработчики выбора опций
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', function() {
                if (isAnalyzing) return;
                const selectedValue = this.dataset.opt;
                answers[currentQuestionIndex] = selectedValue;
                // Если это первый вопрос (роль), обновляем второй вопрос
                if (currentQuestionIndex === 0) {
                    currentRole = selectedValue;
                    updateSecondQuestion(currentRole);
                }
                renderQuiz();
            });
        });

        const nextBtn = document.getElementById('quizNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (isAnalyzing) return;
                if (answers[currentQuestionIndex] === null) {
                    alert('Пожалуйста, выберите ответ');
                    return;
                }
                currentQuestionIndex++;
                renderQuiz();
            });
        }
        const prevBtn = document.getElementById('quizPrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (isAnalyzing) return;
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    renderQuiz();
                }
            });
        }
        const submitQuiz = document.getElementById('submitQuizBtn');
        if (submitQuiz) {
            submitQuiz.addEventListener('click', () => {
                if (isAnalyzing) {
                    alert('Подождите, анализ уже выполняется...');
                    return;
                }
                if (answers[currentQuestionIndex] === null) {
                    alert('Выберите ответ перед отправкой');
                    return;
                }
                if (answers.includes(null)) {
                    alert('Ответьте на все вопросы');
                    return;
                }
                isAnalyzing = true;
                submitQuiz.disabled = true;
                submitQuiz.style.opacity = '0.5';
                submitQuiz.style.cursor = 'not-allowed';

                container.innerHTML = `
                    <div class="quiz-loading">
                        <div class="quiz-spinner"></div>
                        <p>Анализируем ваши ответы...</p>
                    </div>
                `;

                setTimeout(() => {
                    const variant = findVariant(answers);
                    quizState = 'choice';
                    showResult(variant);
                    isAnalyzing = false;
                }, 1500);
            });
        }
    } else if (quizState === 'choice') {
        showResult(findVariant(answers));
    }
}

function showResult(variant) {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    container.innerHTML = `
        <p style="font-weight:600; margin-bottom:20px;">На основе ваших ответов мы подготовили 2 варианта:</p>
        <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
            <div style="flex:1; min-width:250px; background:var(--surface-soft); border-radius:28px; padding:28px; border:1px solid var(--border);">
                <div style="font-size:32px; margin-bottom:12px;">📌</div>
                <h4>Вариант 1</h4>
                <p>${escapeHtml(variant.variantA)}</p>
                <button class="btn-primary choose-option" data-choice="1" data-text="${escapeHtml(variant.variantA)}">Выбрать</button>
            </div>
            <div style="flex:1; min-width:250px; background:var(--surface-soft); border-radius:28px; padding:28px; border:1px solid var(--border);">
                <div style="font-size:32px; margin-bottom:12px;">🎯</div>
                <h4>Вариант 2</h4>
                <p>${escapeHtml(variant.variantB)}</p>
                <button class="btn-primary choose-option" data-choice="2" data-text="${escapeHtml(variant.variantB)}">Выбрать</button>
            </div>
        </div>
        <div style="text-align:center; margin-top:30px;">
            <button id="resetQuizBtn" class="btn-secondary">🔁 Пройти заново</button>
        </div>
    `;
    document.querySelectorAll('.choose-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (isSubmittingChoice) return;
            isSubmittingChoice = true;
            const chosen = this.dataset.choice;
            const chosenText = this.dataset.text;
            const sendQuizResult = (userId) => {
                const formData = {
                    formType: 'Квиз',
                    quizAnswers: answers.map((a, idx) => `${quizQuestions[idx]?.text} — ${a}`).join('\n'),
                    chosenVariant: `${chosen}: ${chosenText}`,
                    userId: userId
                };
                if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
                if (typeof gtag === 'function') gtag('event', 'quiz_choice', { event_category: 'quiz', event_label: chosenText, value: chosen });
                const resultDiv = document.getElementById('quizResult');
                if (resultDiv) {
                    resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${escapeHtml(chosenText)}<br><br><a href="https://t.me/HrLubacheva" class="btn-primary" target="_blank">📱 Обсудить в Telegram</a>`;
                    resultDiv.style.display = 'block';
                }
                container.innerHTML = '<p>✨ Спасибо! Результат появился ниже.</p>';
                isSubmittingChoice = false;
            };
            if (typeof currentUserId !== 'undefined' && currentUserId) sendQuizResult(currentUserId);
            else if (typeof getOrCreateLocalUserId === 'function') sendQuizResult(getOrCreateLocalUserId());
            else sendQuizResult('unknown');
        });
    });
    const resetBtn = document.getElementById('resetQuizBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => resetQuiz());
}

function initQuiz() {
    if (quizInitialized) return;
    quizInitialized = true;
    initQuizData();
    renderQuiz();
}

window.initQuiz = initQuiz;
window.renderQuiz = renderQuiz;