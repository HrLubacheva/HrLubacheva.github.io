// ---------- Квиз с загрузкой из Google Sheets ----------
let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;
let variantsMatrix = [];

const GOOGLE_SHEETS_QUIZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv&gid=1216597339';
const GOOGLE_SHEETS_MATRIX_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv&gid=27728112';

let variantsLoaded = false;

// ========== ЛОКАЛЬНЫЕ ЗАПАСНЫЕ ДАННЫЕ ==========
const LOCAL_QUESTIONS = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];

const LOCAL_VARIANTS = [
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "HR-аудит и закрытие вакансии под ключ (гарантия 28 дней)",
      variantB: "Бесплатная диагностика вакансии + консультация по поиску" },
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "Индивидуальная карьерная стратегия + полное сопровождение",
      variantB: "Тренинг «Продай себя дорого» + самоподготовка" }
];

// ========== ЗАГРУЗКА ВОПРОСОВ ==========
async function loadQuizFromGoogleSheets() {
    try {
        console.log('🔄 Загрузка вопросов из Google Sheets...');
        const response = await fetch(GOOGLE_SHEETS_QUIZ_URL);
        const csvText = await response.text();

        const rows = csvText.split('\n').filter(row => row.trim());
        if (rows.length < 2) throw new Error('Нет данных');

        const headers = rows[0].split(',').map(h => h.trim());

        const qIndex = headers.indexOf('question');
        const opt1Index = headers.indexOf('option1');
        const opt2Index = headers.indexOf('option2');
        const opt3Index = headers.indexOf('option3');
        const opt4Index = headers.indexOf('option4');

        if (qIndex === -1) throw new Error('Не найдена колонка question');

        quizQuestions = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',').map(v => v.trim());
            const question = values[qIndex];
            if (!question) continue;

            const options = [];
            if (opt1Index !== -1 && values[opt1Index]) options.push(values[opt1Index]);
            if (opt2Index !== -1 && values[opt2Index]) options.push(values[opt2Index]);
            if (opt3Index !== -1 && values[opt3Index]) options.push(values[opt3Index]);
            if (opt4Index !== -1 && values[opt4Index]) options.push(values[opt4Index]);

            if (options.length > 0) {
                quizQuestions.push({ text: question, options });
            }
        }

        console.log(`✅ Загружено ${quizQuestions.length} вопросов`);
        return true;

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        quizQuestions = LOCAL_QUESTIONS;
        return false;
    }
}

// ========== ЗАГРУЗКА МАТРИЦЫ ВАРИАНТОВ ==========
async function loadVariantsMatrix() {
    if (variantsLoaded) return true;

    try {
        const response = await fetch(GOOGLE_SHEETS_MATRIX_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() && row.includes(','));
        if (rows.length === 0) throw new Error('Нет данных');

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

        const idx = {
            priority: headers.indexOf('priority'),
            role: headers.indexOf('role'),
            level: headers.indexOf('level'),
            urgency: headers.indexOf('urgency'),
            importance: headers.indexOf('importance'),
            budget: headers.indexOf('budget'),
            variantA: headers.indexOf('variant_a'),
            variantB: headers.indexOf('variant_b')
        };

        variantsMatrix = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',').map(v => v.trim());
            if (!values[idx.variantA] && !values[idx.variantB]) continue;

            variantsMatrix.push({
                priority: parseInt(values[idx.priority]) || 999,
                role: values[idx.role] || '*',
                level: values[idx.level] || '*',
                urgency: values[idx.urgency] || '*',
                importance: values[idx.importance] || '*',
                budget: values[idx.budget] || '*',
                variantA: values[idx.variantA] || "Индивидуальная карьерная стратегия",
                variantB: values[idx.variantB] || "Тренинг «Продай себя дорого»"
            });
        }

        variantsMatrix.sort((a, b) => a.priority - b.priority);
        variantsLoaded = true;
        console.log(`✅ Загружено ${variantsMatrix.length} правил`);
        return true;

    } catch (error) {
        console.error('Ошибка загрузки матрицы:', error);
        variantsMatrix = LOCAL_VARIANTS;
        variantsLoaded = true;
        return false;
    }
}

// ========== ПОИСК ВАРИАНТА ==========
async function findVariantByAnswersAsync(answersArray) {
    if (!variantsLoaded) await loadVariantsMatrix();

    const answers = {
        role: answersArray[0],
        level: answersArray[1],
        urgency: answersArray[2],
        importance: answersArray[3],
        budget: answersArray[4]
    };

    for (const rule of variantsMatrix) {
        let match = true;
        if (rule.role !== '*' && rule.role !== answers.role) match = false;
        if (rule.level !== '*' && rule.level !== answers.level) match = false;
        if (rule.urgency !== '*' && rule.urgency !== answers.urgency) match = false;
        if (rule.importance !== '*' && rule.importance !== answers.importance) match = false;
        if (rule.budget !== '*' && rule.budget !== answers.budget) match = false;

        if (match) return { variantA: rule.variantA, variantB: rule.variantB };
    }

    const defaultRule = variantsMatrix.find(r => r.priority === 999) || variantsMatrix[0];
    return { variantA: defaultRule.variantA, variantB: defaultRule.variantB };
}

// ========== ОТРИСОВКА КВИЗА ==========
function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) {
        console.error('quizContainer не найден');
        return;
    }

    console.log('renderQuiz вызван, вопросов:', quizQuestions.length, 'state:', quizState);

    if (quizQuestions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">❌ Нет вопросов</div>';
        return;
    }

    if (quizState === 'questions') {
        let html = '';
        quizQuestions.forEach((q, idx) => {
            html += `<div class="quiz-question"><p>${q.text}</p><div class="quiz-options" data-q="${idx}">`;
            q.options.forEach(opt => {
                const isSelected = answers[idx] === opt;
                html += `<div class="quiz-option ${isSelected ? 'selected' : ''}" data-opt="${opt.replace(/"/g, '&quot;')}">${opt}</div>`;
            });
            html += `</div></div>`;
        });
        html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        container.innerHTML = html;

        // НАВЕШИВАЕМ ОБРАБОТЧИКИ
        document.querySelectorAll('.quiz-option').forEach(el => {
            el.onclick = function() {
                const parent = this.parentElement;
                const qIdx = parseInt(parent.dataset.q);
                answers[qIdx] = this.dataset.opt;
                renderQuiz();
            };
        });

        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) {
            submitBtn.onclick = async function() {
                if (answers.includes(null)) {
                    alert('Ответьте на все вопросы');
                    return;
                }
                quizState = 'choice';
                const cont = document.getElementById('quizContainer');
                cont.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Загрузка рекомендаций...</div>';
                const variant = await findVariantByAnswersAsync(answers);
                showResult(variant);
            };
        }

        console.log('✅ Квиз отрисован, обработчики навешаны');
    }
}

function showResult(variant) {
    const container = document.getElementById('quizContainer');
    if (!container) return;

    container.innerHTML = `
        <p style="font-weight: 600; margin-bottom: 20px;">На основе ваших ответов мы подготовили 2 варианта:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
            <div style="flex: 1; min-width: 250px; background: var(--surface-soft); border-radius: 28px; padding: 28px; text-align: left; border: 1px solid var(--border);">
                <div style="font-size: 32px; margin-bottom: 12px;">📌</div>
                <h4 style="margin-bottom: 16px;">Вариант 1</h4>
                <p style="margin-bottom: 24px; line-height: 1.5;">${variant.variantA}</p>
                <button class="btn-primary choose-option" data-choice="1" data-text="${variant.variantA.replace(/"/g, '&quot;')}">Выбрать этот</button>
            </div>
            <div style="flex: 1; min-width: 250px; background: var(--surface-soft); border-radius: 28px; padding: 28px; text-align: left; border: 1px solid var(--border);">
                <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
                <h4 style="margin-bottom: 16px;">Вариант 2</h4>
                <p style="margin-bottom: 24px; line-height: 1.5;">${variant.variantB}</p>
                <button class="btn-primary choose-option" data-choice="2" data-text="${variant.variantB.replace(/"/g, '&quot;')}">Выбрать этот</button>
            </div>
        </div>
    `;

    document.querySelectorAll('.choose-option').forEach(btn => {
        btn.onclick = () => {
            const chosen = btn.dataset.choice;
            const chosenText = btn.dataset.text;
            const formData = {
                formType: 'Квиз',
                name: '',
                phone: '',
                comment: `Выбран вариант ${chosen}: ${chosenText}`,
                quizAnswers: answers.map((a, i) => `${quizQuestions[i]?.text} — ${a}`).join('\n'),
                chosenVariant: `${chosen}: ${chosenText}`
            };
            if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);

            const resultDiv = document.getElementById('quizResult');
            if (resultDiv) {
                resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${chosenText}<br><br><a href="https://t.me/HrLubacheva" class="btn-primary" target="_blank">📱 Обсудить в Telegram</a>`;
                resultDiv.style.display = 'block';
            }
            container.innerHTML = '<p>✨ Спасибо! Результат появился ниже.</p>';
        };
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function initQuiz() {
    if (quizInitialized) return;
    quizInitialized = true;

    console.log('🎯 Инициализация квиза...');

    // Загружаем вопросы
    await loadQuizFromGoogleSheets();

    // Инициализируем answers
    answers = new Array(quizQuestions.length).fill(null);

    // Рендерим квиз
    renderQuiz();

    console.log('✅ Квиз инициализирован, вопросов:', quizQuestions.length);
}

// Запускаем когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initQuiz, 500);
    });
} else {
    setTimeout(initQuiz, 500);
}

window.renderQuiz = initQuiz;