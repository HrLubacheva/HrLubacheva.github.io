// ---------- Квиз с загрузкой из Google Sheets ----------
let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;
let variantsMatrix = [];

const GOOGLE_SHEETS_QUIZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv&gid=1216597339';
const GOOGLE_SHEETS_MATRIX_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDxpfQuCLTjJpiJHgK26zSt_S8a-1LtFUGZV0v1eSg2bHat_BMK6pP4RhXkF5aXPtl9AS9UDj4-a1a/pub?output=csv&gid=27728112';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

const LOCAL_QUESTIONS = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];

const LOCAL_VARIANTS = [
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "HR-аудит и закрытие вакансии под ключ",
      variantB: "Бесплатная диагностика вакансии" },
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "Индивидуальная карьерная стратегия + полное сопровождение",
      variantB: "Тренинг «Продай себя дорого» + самоподготовка" }
];

async function loadQuizFromGoogleSheets() {
    try {
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
        const loadedQuestions = [];
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
                loadedQuestions.push({ text: question, options });
            }
        }
        if (loadedQuestions.length > 0) {
            quizQuestions = loadedQuestions;
        } else {
            throw new Error('Нет вопросов');
        }
    } catch (error) {
        console.error('Ошибка, используем локальные:', error);
        quizQuestions = LOCAL_QUESTIONS;
    }
}

async function loadVariantsMatrix() {
    if (variantsLoaded) return;
    try {
        const response = await fetch(GOOGLE_SHEETS_MATRIX_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() && row.includes(','));
        if (rows.length > 0) {
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
                if (values[idx.variantA] || values[idx.variantB]) {
                    variantsMatrix.push({
                        priority: parseInt(values[idx.priority]) || 999,
                        role: values[idx.role] || '*',
                        level: values[idx.level] || '*',
                        urgency: values[idx.urgency] || '*',
                        importance: values[idx.importance] || '*',
                        budget: values[idx.budget] || '*',
                        variantA: values[idx.variantA] || "Индивидуальная стратегия",
                        variantB: values[idx.variantB] || "Тренинг «Продай себя дорого»"
                    });
                }
            }
            variantsMatrix.sort((a, b) => a.priority - b.priority);
        } else {
            throw new Error('Нет данных');
        }
    } catch (error) {
        console.error('Ошибка загрузки матрицы, используем локальную');
        variantsMatrix = LOCAL_VARIANTS;
    }
    variantsLoaded = true;
}

async function findVariant(answersArr) {
    if (!variantsLoaded) await loadVariantsMatrix();
    const user = {
        role: answersArr[0],
        level: answersArr[1],
        urgency: answersArr[2],
        importance: answersArr[3],
        budget: answersArr[4]
    };
    for (const rule of variantsMatrix) {
        let match = true;
        if (rule.role !== '*' && rule.role !== user.role) match = false;
        if (rule.level !== '*' && rule.level !== user.level) match = false;
        if (rule.urgency !== '*' && rule.urgency !== user.urgency) match = false;
        if (rule.importance !== '*' && rule.importance !== user.importance) match = false;
        if (rule.budget !== '*' && rule.budget !== user.budget) match = false;
        if (match) return { variantA: rule.variantA, variantB: rule.variantB };
    }
    const def = variantsMatrix.find(r => r.priority === 999) || variantsMatrix[0];
    return { variantA: def.variantA, variantB: def.variantB };
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    if (quizQuestions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Загрузка...</div>';
        return;
    }
    if (quizState === 'questions') {
        let html = '';
        for (let i = 0; i < quizQuestions.length; i++) {
            const q = quizQuestions[i];
            html += `<div class="quiz-question"><p>${escapeHtml(q.text)}</p><div class="quiz-options" data-q="${i}">`;
            for (let j = 0; j < q.options.length; j++) {
                const opt = q.options[j];
                const isSelected = answers[i] === opt;
                html += `<div class="quiz-option ${isSelected ? 'selected' : ''}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
            }
            html += `</div></div>`;
        }
        html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        container.innerHTML = html;
        const opts = document.querySelectorAll('.quiz-option');
        for (let i = 0; i < opts.length; i++) {
            opts[i].onclick = function() {
                const parent = this.parentElement;
                const qIdx = parseInt(parent.dataset.q);
                answers[qIdx] = this.dataset.opt;
                renderQuiz();
            };
        }
        const btn = document.getElementById('submitQuizBtn');
        if (btn) {
            btn.onclick = async function() {
                if (answers.includes(null)) {
                    alert('Ответьте на все вопросы');
                    return;
                }
                quizState = 'choice';
                container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Анализ ответов...</div>';
                const variant = await findVariant(answers);
                showResult(variant);
            };
        }
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
                <h4>Вариант 1</h4>
                <p>${escapeHtml(variant.variantA)}</p>
                <button class="btn-primary choose-option" data-choice="1" data-text="${escapeHtml(variant.variantA)}">Выбрать</button>
            </div>
            <div style="flex: 1; min-width: 250px; background: var(--surface-soft); border-radius: 28px; padding: 28px; text-align: left; border: 1px solid var(--border);">
                <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
                <h4>Вариант 2</h4>
                <p>${escapeHtml(variant.variantB)}</p>
                <button class="btn-primary choose-option" data-choice="2" data-text="${escapeHtml(variant.variantB)}">Выбрать</button>
            </div>
        </div>
    `;
    const btns = document.querySelectorAll('.choose-option');
    for (let i = 0; i < btns.length; i++) {
        btns[i].onclick = function() {
            const chosen = this.dataset.choice;
            const chosenText = this.dataset.text;
            const formData = {
                formType: 'Квиз',
                quizAnswers: answers.map((a, idx) => `${quizQuestions[idx]?.text} — ${a}`).join('\n'),
                chosenVariant: `${chosen}: ${chosenText}`
            };
            if (typeof sendDataToSheet === 'function') sendDataToSheet(formData);
            const resultDiv = document.getElementById('quizResult');
            if (resultDiv) {
                resultDiv.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${escapeHtml(chosenText)}<br><br><a href="https://t.me/HrLubacheva" class="btn-primary" target="_blank">📱 Обсудить в Telegram</a>`;
                resultDiv.style.display = 'block';
            }
            container.innerHTML = '<p>✨ Спасибо! Результат появился ниже.</p>';
        };
    }
}

async function initQuiz() {
    if (quizInitialized) return;
    quizInitialized = true;
    await loadQuizFromGoogleSheets();
    answers = new Array(quizQuestions.length).fill(null);
    renderQuiz();
}

let variantsLoaded = false;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initQuiz, 100));
} else {
    setTimeout(initQuiz, 100);
}

window.renderQuiz = renderQuiz;
window.initQuiz = initQuiz;