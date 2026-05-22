/**
 * Квиз для определения карьерного пути – статическая версия
 */
let quizQuestions = [];
let answers = [];
let quizState = 'questions';
let quizInitialized = false;

const LOCAL_QUESTIONS = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];

const VARIANTS_MATRIX = [
    { priority: 1, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "HR-аудит и закрытие вакансии под ключ", variantB: "Бесплатная диагностика вакансии" },
    { priority: 2, role: "Ищу работу", level: "Junior / начинающий", urgency: "*", importance: "*", budget: "*",
      variantA: "Карьерная стратегия + упаковка резюме", variantB: "Экспресс-консультация по поиску" },
    { priority: 3, role: "Ищу работу", level: "Middle / опытный", urgency: "*", importance: "*", budget: "*",
      variantA: "Тренинг «Продай себя дорого» и переговоры о зарплате", variantB: "Индивидуальное сопровождение до оффера" },
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*",
      variantA: "Индивидуальная карьерная стратегия + полное сопровождение", variantB: "Тренинг «Продай себя дорого» + самоподготовка" }
];

function initQuizData() {
    quizQuestions = LOCAL_QUESTIONS;
    answers = new Array(quizQuestions.length).fill(null);
}

function findVariant(answersArr) {
    const user = { role: answersArr[0], level: answersArr[1], urgency: answersArr[2], importance: answersArr[3], budget: answersArr[4] };
    for (const rule of VARIANTS_MATRIX) {
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
                html += `<div class="quiz-option ${answers[i] === opt ? 'selected' : ''}" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
            }
            html += `</div></div>`;
        }
        html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        container.innerHTML = html;
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', function() {
                const qIdx = parseInt(this.parentElement.dataset.q);
                answers[qIdx] = this.dataset.opt;
                renderQuiz();
            });
        });
        document.getElementById('submitQuizBtn')?.addEventListener('click', () => {
            if (answers.includes(null)) { alert('Ответьте на все вопросы'); return; }
            quizState = 'choice';
            container.innerHTML = '<div style="text-align:center; padding:40px;">⏳ Анализ ответов...</div>';
            const variant = findVariant(answers);
            showResult(variant);
        });
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
    `;
    document.querySelectorAll('.choose-option').forEach(btn => {
        btn.addEventListener('click', function() {
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
            };
            if (typeof currentUserId !== 'undefined' && currentUserId) sendQuizResult(currentUserId);
            else if (typeof getUserIdFromSW === 'function') getUserIdFromSW().then(userId => sendQuizResult(userId));
            else sendQuizResult('unknown');
        });
    });
}

function initQuiz() {
    if (quizInitialized) return;
    quizInitialized = true;
    initQuizData();
    renderQuiz();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(initQuiz, 100));
else setTimeout(initQuiz, 100);
window.renderQuiz = renderQuiz;
window.initQuiz = initQuiz;