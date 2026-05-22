// ========== КВИЗ ==========
let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;
let currentQuestionIndex = 0;
let totalQuestions = 0;
let isSubmittingChoice = false;
let isAnalyzing = false;
let currentRole = null;

// ========== УВЕДОМЛЕНИЕ ОБ ОШИБКЕ (ТОСТ) ==========
function showErrorToast(message) {
    // Удаляем старый тост, если есть
    const existingToast = document.querySelector('.custom-toast-error');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'custom-toast-error';
    toast.innerHTML = `⚠️ ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ---------- Вопросы ----------
const FIRST_QUESTION = {
    text: "1. Ваша роль?",
    options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"]
};

// Второй вопрос (будет заменён динамически)
const LEVEL_JOBSEEKER = {
    text: "2. Ваш текущий уровень?",
    options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"]
};
const LEVEL_RECRUITER = {
    text: "2. Какой уровень сотрудника ищете?",
    options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"]
};

// Третий вопрос
const URGENCY_QUESTION = {
    text: "3. Как быстро нужен результат?",
    options: ["Максимально быстро", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"]
};

// Четвёртый вопрос
const IMPORTANCE_QUESTION = {
    text: "4. Что для вас важнее всего?",
    options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"]
};

// Пятый вопрос (ОБНОВЛЁН: 5 вариантов, включая "Выше 100 000 ₽")
const BUDGET_QUESTION = {
    text: "5. Бюджет на консультацию/подбор?",
    options: [
        "До 5 000 ₽",
        "5 000 – 15 000 ₽",
        "15 000 – 50 000 ₽",
        "50 000 – 100 000 ₽",
        "Выше 100 000 ₽"
    ]
};

// ---------- Матрица вариантов (ПОЛНАЯ, с новыми бюджетами) ----------
const VARIANTS_MATRIX = [
    // 1. Рекрутеры (все бюджеты)
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "HR-аудит и закрытие вакансии под ключ", variantB: "Бесплатная диагностика вакансии" },
    { priority: 27, role: "Подбираю сотрудников", level: "*", urgency: "Максимально быстро", importance: "*", budget: "50 000 – 100 000 ₽", variantA: "Подбор руководителя + гарантия", variantB: "Хэдхантинг (базовый пакет)" },
    { priority: 29, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "Выше 100 000 ₽", variantA: "Хэдхантинг топ-менеджера + онбординг", variantB: "Полный HR-аутсорсинг на проект" },

    // 2. Хочу сменить профессию
    { priority: 2, role: "Хочу сменить профессию", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "*", budget: "До 5 000 ₽", variantA: "Профориентационная диагностика + план смены профессии", variantB: "Тест на склонности и способности" },
    { priority: 3, role: "Хочу сменить профессию", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "*", budget: "5 000 – 15 000 ₽", variantA: "Индивидуальная программа переквалификации + менторство", variantB: "Карьерная сессия \"Новая профессия за 3 месяца\"" },
    { priority: 4, role: "Хочу сменить профессию", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "*", budget: "*", variantA: "Дорожная карта перехода в новую профессию", variantB: "Обучение с гарантией трудоустройства" },
    { priority: 5, role: "Хочу сменить профессию", level: "Middle / опытный", urgency: "*", importance: "*", budget: "*", variantA: "Аудит текущих навыков + план перехода на новую роль", variantB: "Менторство от эксперта из новой сферы" },
    { priority: 6, role: "Хочу сменить профессию", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Карьерная консультация + диагностика", variantB: "Профориентационное тестирование" },

    // 10-17. Ищу работу (Junior)
    { priority: 10, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Зарплата", budget: "До 5 000 ₽", variantA: "Экспресс-трудоустройство за 3 дня + резюме", variantB: "Чек-лист быстрого поиска + самодиагностика" },
    { priority: 11, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Зарплата", budget: "5 000 – 15 000 ₽", variantA: "Интенсивная подготовка к собеседованиям", variantB: "Групповой вебинар \"Как получить оффер\"" },
    { priority: 12, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Зарплата", budget: "15 000 – 50 000 ₽", variantA: "Индивидуальный карьерный коучинг", variantB: "Подготовка к собеседованиям с топ-менеджерами" },
    { priority: 13, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Условия/удаленка", budget: "*", variantA: "Подборка работодателей с удаленкой", variantB: "Самопрезентация для удаленных вакансий" },
    { priority: 14, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Карьерный рост", budget: "*", variantA: "План развития на 6 месяцев + менторство", variantB: "Тренинг \"Soft skills для джуниора\"" },
    { priority: 15, role: "Ищу работу", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "Зарплата", budget: "До 5 000 ₽", variantA: "Пошаговая стратегия поиска + упаковка резюме", variantB: "Тренинг \"Как правильно искать работу\"" },
    { priority: 16, role: "Ищу работу", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "Зарплата", budget: "5 000 – 15 000 ₽", variantA: "Карьерная карта на полгода + созвоны", variantB: "Мастер-класс \"Как просить повышение\"" },
    { priority: 17, role: "Ищу работу", level: "Junior / начинающий", urgency: "3–6 месяцев", importance: "*", budget: "*", variantA: "Стратегия долгосрочного карьерного роста", variantB: "План развития навыков" },

    // 20-25. Ищу работу (Middle)
    { priority: 20, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "5 000 – 15 000 ₽", variantA: "Интенсив «Продай себя дорого»", variantB: "Групповой тренинг по переговорам о зарплате" },
    { priority: 21, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "15 000 – 50 000 ₽", variantA: "Упаковка резюме и LinkedIn для топ-компаний", variantB: "Подготовка к сложным интервью" },
    { priority: 22, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "50 000 – 100 000 ₽", variantA: "Executive-поиск + сопровождение", variantB: "Переговоры о компенсации топ-уровня" },
    { priority: 23, role: "Ищу работу", level: "Middle / опытный", urgency: "1–2 месяца", importance: "Зарплата", budget: "*", variantA: "Аудит карьеры + план выхода на новый доход", variantB: "Тренинг \"Как сменить работу с повышением\"" },
    { priority: 24, role: "Ищу работу", level: "Middle / опытный", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Диагностика потолка + стратегия роста", variantB: "Развитие управленческих навыков" },
    { priority: 25, role: "Ищу работу", level: "Middle / опытный", urgency: "3–6 месяцев", importance: "*", budget: "*", variantA: "Стратегия развития до Senior", variantB: "План прокачки экспертизы" },
    { priority: 26, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "Выше 100 000 ₽", variantA: "Премиум-пакет «Золотой» (сопровождение под ключ)", variantB: "Индивидуальный коучинг + карьерная стратегия" },

    // 30-32. Ищу работу (Senior)
    { priority: 30, role: "Ищу работу", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Зарплата", budget: "15 000 – 50 000 ₽", variantA: "Executive-коучинг и подготовка", variantB: "Карьерная сессия по позиционированию" },
    { priority: 31, role: "Ищу работу", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Зарплата", budget: "50 000 – 100 000 ₽", variantA: "Поиск C-level позиций с хедхантером", variantB: "VIP-сопровождение карьеры" },
    { priority: 32, role: "Ищу работу", level: "Senior / ведущий", urgency: "1–2 месяца", importance: "*", budget: "*", variantA: "Стратегия перехода в топ-компанию", variantB: "Подготовка к совету директоров" },
    { priority: 33, role: "Ищу работу", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Зарплата", budget: "Выше 100 000 ₽", variantA: "Executive-коучинг + поиск через хедхантеров", variantB: "VIP-сопровождение «Первое лицо»" },

    // 35. Team Lead
    { priority: 35, role: "Ищу работу", level: "Team Lead", urgency: "Максимально быстро", importance: "*", budget: "*", variantA: "Экспресс-подготовка к собеседованию", variantB: "Карьерный коучинг для тимлидов" },

    // 40-41. Ищу работу (Lead)
    { priority: 40, role: "Ищу работу", level: "Lead / руководитель", urgency: "*", importance: "*", budget: "50 000 – 100 000 ₽", variantA: "Подготовка к собеседованиям на C-level", variantB: "Стратегия развития карьеры топ-менеджера" },
    { priority: 41, role: "Ищу работу", level: "Lead / руководитель", urgency: "*", importance: "*", budget: "*", variantA: "Executive-коучинг для руководителей", variantB: "Карьерная стратегия первого лица" },
    { priority: 42, role: "Ищу работу", level: "Lead / руководитель", urgency: "Максимально быстро", importance: "Зарплата", budget: "Выше 100 000 ₽", variantA: "VIP-коучинг для топ-менеджеров", variantB: "Поиск позиции первого лица" },

    // 45. Команда и ценности
    { priority: 45, role: "*", level: "*", urgency: "*", importance: "Команда и ценности", budget: "*", variantA: "Как выбрать идеальный коллектив", variantB: "Тест на корпоративную культуру" },

    // 50-55. Рост в текущей компании
    { priority: 50, role: "Рост в текущей компании", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "Зарплата", budget: "*", variantA: "Подготовка к повышению + разговор с руководителем", variantB: "План развития внутри компании" },
    { priority: 51, role: "Рост в текущей компании", level: "Middle / опытный", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Подготовка к повышению + разговор с руководителем", variantB: "План развития внутри компании" },
    { priority: 52, role: "Рост в текущей компании", level: "Middle / опытный", urgency: "3–6 месяцев", importance: "Зарплата", budget: "*", variantA: "Переговорная стратегия для повышения дохода", variantB: "Аудит эффективности + презентация руководителю" },
    { priority: 53, role: "Рост в текущей компании", level: "Senior / ведущий", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Подготовка к роли тимлида", variantB: "Развитие управленческих компетенций" },
    { priority: 54, role: "Рост в текущей компании", level: "Lead / руководитель", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Коучинг для руководителей высшего звена", variantB: "Стратегия роста до C-level" },
    { priority: 55, role: "Рост в текущей компании", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Карьерная сессия \"Следующий уровень\"", variantB: "План карьерного роста на год" },

    // 60-62. Универсальные (Junior)
    { priority: 60, role: "*", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "*", budget: "До 5 000 ₽", variantA: "Экспресс-подготовка за 3 дня", variantB: "Чек-лист быстрого поиска" },
    { priority: 61, role: "*", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "*", budget: "5 000 – 15 000 ₽", variantA: "Интенсивная подготовка", variantB: "Тренинг \"Старт карьеры\"" },
    { priority: 62, role: "*", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "*", budget: "*", variantA: "Пошаговая стратегия поиска", variantB: "Карьерная карта развития" },

    // 70-71. Универсальные (срочные)
    { priority: 70, role: "*", level: "*", urgency: "Максимально быстро", importance: "*", budget: "До 5 000 ₽", variantA: "Экспресс-подготовка", variantB: "Чек-лист быстрого поиска" },
    { priority: 71, role: "*", level: "*", urgency: "Максимально быстро", importance: "*", budget: "5 000 – 15 000 ₽", variantA: "Ускоренный курс подготовки", variantB: "Тренинг \"Результат за неделю\"" },

    // 80-92. Универсальные (по бюджету)
    { priority: 80, role: "*", level: "*", urgency: "*", importance: "*", budget: "Выше 100 000 ₽", variantA: "Премиум-сопровождение карьеры", variantB: "VIP-коучинг с гарантией" },
    { priority: 85, role: "*", level: "*", urgency: "*", importance: "*", budget: "15 000 – 50 000 ₽", variantA: "Эконом-пакет: резюме + 1 консультация", variantB: "Стандарт: резюме + 2 консультации" },
    { priority: 90, role: "*", level: "*", urgency: "*", importance: "*", budget: "До 5 000 ₽", variantA: "Минимальный пакет услуг", variantB: "Самоподготовка по материалам" },
    { priority: 91, role: "*", level: "*", urgency: "*", importance: "*", budget: "5 000 – 15 000 ₽", variantA: "Стандартный пакет услуг", variantB: "Групповые тренинги" },
    { priority: 92, role: "*", level: "*", urgency: "*", importance: "*", budget: "50 000 – 100 000 ₽", variantA: "Расширенный пакет услуг", variantB: "Индивидуальный коучинг" },

    // 999. Fallback
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Индивидуальная карьерная стратегия + полное сопровождение (резюме, подготовка, переговоры до оффера)", variantB: "Тренинг «Продай себя дорого» + самоподготовка по материалам" }
];

// ---------- Инициализация ----------
function initQuizData() {
    quizQuestions = [
        FIRST_QUESTION,
        { ...LEVEL_JOBSEEKER },
        URGENCY_QUESTION,
        IMPORTANCE_QUESTION,
        BUDGET_QUESTION
    ];
    answers = new Array(quizQuestions.length).fill(null);
    currentQuestionIndex = 0;
    currentRole = null;
}

function updateSecondQuestion(role) {
    if (role === "Подбираю сотрудников") {
        quizQuestions[1] = { ...LEVEL_RECRUITER };
    } else {
        quizQuestions[1] = { ...LEVEL_JOBSEEKER };
    }
    answers[1] = null;
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
    initQuizData();
    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) {
        console.warn('quizContainer не найден');
        return;
    }
    if (!quizQuestions.length) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Загрузка...</div>';
        return;
    }
    totalQuestions = quizQuestions.length;
    if (quizState === 'questions') {
        const progressWidth = ((currentQuestionIndex+1)/totalQuestions)*100;
        let html = `<div class="quiz-progress"><div class="quiz-progress-bar" style="width: ${progressWidth}%;"></div></div>`;
        const question = quizQuestions[currentQuestionIndex];
        html += `<div class="quiz-question fade-up"><p>${escapeHtml(question.text)}</p><div class="quiz-options">`;
        for (let opt of question.options) {
            const selectedClass = answers[currentQuestionIndex] === opt ? 'selected' : '';
            html += `<div class="quiz-option ${selectedClass}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
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

        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                if (isAnalyzing) return;
                const selected = e.currentTarget.dataset.opt;
                answers[currentQuestionIndex] = selected;
                if (currentQuestionIndex === 0) {
                    currentRole = selected;
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
                    showErrorToast('📌 Пожалуйста, выберите ответ');
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
        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (isAnalyzing) {
                    showErrorToast('⏳ Подождите, анализ уже выполняется...');
                    return;
                }
                if (answers[currentQuestionIndex] === null) {
                    showErrorToast('📌 Выберите ответ перед отправкой');
                    return;
                }
                if (answers.includes(null)) {
                    showErrorToast('📋 Ответьте на все вопросы');
                    return;
                }
                isAnalyzing = true;
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                container.innerHTML = `<div class="quiz-loading"><div class="quiz-spinner"></div><p>Анализируем ваши ответы...</p></div>`;
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

    // Цены и ссылки под ваш точный список услуг
    let priceA = 'уточняйте';
    let priceB = 'уточняйте';
    let linkA = '#contacts';
    let linkB = '#contacts';
    let descA = '';
    let descB = '';

    // ---- ВАРИАНТ А ----
    if (variant.variantA.includes('HR-аудит')) {
        priceA = 'от 60 000 ₽';
        descA = 'Подбор специалиста или руководителя + онбординг';
        linkA = '#calculator';
    } else if (variant.variantA.includes('Карьерная стратегия')) {
        priceA = '6 000 – 9 000 ₽';
        descA = 'Резюме специалиста или руководителя + консультация';
        linkA = '#individual';
    } else if (variant.variantA.includes('Продай себя дорого')) {
        priceA = '14 000 ₽';
        descA = 'Индивидуальный тренинг «Продай себя дорого»';
        linkA = '#individual';
    } else if (variant.variantA.includes('Профориентационная диагностика')) {
        priceA = '7 000 ₽';
        descA = 'Индивидуальная консультация (1 час)';
        linkA = '#individual';
    } else if (variant.variantA.includes('Executive-коучинг')) {
        priceA = '9 000 ₽';
        descA = 'Резюме руководителя + карьерная стратегия';
        linkA = '#individual';
    } else if (variant.variantA.includes('Премиум-пакет') || variant.variantA.includes('Золотой')) {
        priceA = 'по запросу';
        descA = 'Тариф «Золотой» — сопровождение под ключ';
        linkA = '#individual';
    } else if (variant.variantA.includes('Хэдхантинг')) {
        priceA = 'от 120 000 ₽';
        descA = 'Поиск редких специалистов и топ-менеджеров';
        linkA = '#calculator';
    } else if (variant.variantA.includes('Подбор руководителя')) {
        priceA = '90 000 ₽';
        descA = 'Подбор руководителя + гарантия';
        linkA = '#calculator';
    }

    // ---- ВАРИАНТ Б ----
    if (variant.variantB.includes('диагностика вакансии')) {
        priceB = '0 ₽';
        descB = 'Бесплатная консультация по услугам для бизнеса';
        linkB = '#calendar';
    } else if (variant.variantB.includes('Экспресс-консультация')) {
        priceB = '3 500 ₽';
        descB = 'Экспресс-консультация (30 минут)';
        linkB = '#individual';
    } else if (variant.variantB.includes('Тренинг') || variant.variantB.includes('самоподготовка')) {
        priceB = '5 500 ₽';
        descB = 'Групповой тренинг «Продай себя дорого»';
        linkB = '#group';
    } else if (variant.variantB.includes('Тест на склонности')) {
        priceB = '4 000 ₽';
        descB = 'Аудит резюме (письменные рекомендации)';
        linkB = '#individual';
    } else if (variant.variantB.includes('VIP-сопровождение')) {
        priceB = 'по запросу';
        descB = 'VIP-сопровождение карьеры "под ключ"';
        linkB = '#individual';
    }

    // ---- ОТРИСОВКА КАРТОЧЕК ----
    container.innerHTML = `
        <p style="font-weight:600; margin-bottom:20px;">На основе ваших ответов мы подготовили 2 варианта:</p>
        <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
            <!-- Вариант 1 -->
            <div style="flex:1; min-width:250px; background:var(--surface-soft); border-radius:28px; padding:28px; border:1px solid var(--border);">
                <div style="font-size:32px; margin-bottom:12px;">📌</div>
                <h4>Вариант 1</h4>
                <p><strong>${escapeHtml(variant.variantA)}</strong></p>
                <p style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceA}</p>
                <p style="font-size: 0.9rem; margin-bottom: 20px;">${escapeHtml(descA)}</p>
                <a href="${linkA}" class="btn-primary choose-option-link" data-choice="1" data-text="${escapeHtml(variant.variantA)}">Выбрать →</a>
            </div>
            <!-- Вариант 2 -->
            <div style="flex:1; min-width:250px; background:var(--surface-soft); border-radius:28px; padding:28px; border:1px solid var(--border);">
                <div style="font-size:32px; margin-bottom:12px;">🎯</div>
                <h4>Вариант 2</h4>
                <p><strong>${escapeHtml(variant.variantB)}</strong></p>
                <p style="color: var(--primary); font-weight: 700; margin: 10px 0;">💰 ${priceB}</p>
                <p style="font-size: 0.9rem; margin-bottom: 20px;">${escapeHtml(descB)}</p>
                <a href="${linkB}" class="btn-primary choose-option-link" data-choice="2" data-text="${escapeHtml(variant.variantB)}">Выбрать →</a>
            </div>
        </div>
        <div style="text-align:center; margin-top:30px;">
            <button id="resetQuizBtn" class="btn-secondary">🔁 Пройти заново</button>
        </div>
    `;

    // ---- ОБРАБОТЧИКИ КНОПОК ----
    document.querySelectorAll('.choose-option-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
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
                    resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${escapeHtml(chosenText)}<br><br>📋 Я свяжусь с вами в ближайшее время или напишите мне в Telegram: <a href="https://t.me/HrLubacheva" target="_blank">@HrLubacheva</a>`;
                    resultDiv.style.display = 'block';
                }

                setTimeout(() => {
                    document.querySelector('#calendar')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);

                container.innerHTML = '<p>✨ Спасибо! Результат появился ниже. Я скоро свяжусь с вами для уточнения деталей.</p>';
                isSubmittingChoice = false;
            };

            const uid = (typeof currentUserId !== 'undefined' && currentUserId) ? currentUserId : (typeof getOrCreateLocalUserId === 'function' ? getOrCreateLocalUserId() : 'unknown');
            sendQuizResult(uid);
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