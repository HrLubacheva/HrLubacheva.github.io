// ---------- Квиз ----------
const quizQuestions = [
    { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
    { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
    { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
    { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
    { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
];
let answers = [null, null, null, null, null];
let quizState = 'questions';

function generateTwoOptions(answersArray) {
    const role = answersArray[0];
    const level = answersArray[1];
    const urgency = answersArray[2];
    const budget = answersArray[4];
    let optionA = "Индивидуальная карьерная стратегия + полное сопровождение (резюме, подготовка, переговоры до оффера).";
    let optionB = "Тренинг «Продай себя дорого» + самоподготовка по материалам.";

    if (role === "Подбираю сотрудников") {
        optionA = "HR-аудит и закрытие одной вакансии под ключ (гарантия 28 дней).";
        optionB = "Бесплатная диагностика вакансии + консультация по поиску.";
    } else if (level === "Junior / начинающий") {
        optionA = "Пошаговая стратегия поиска работы + упаковка резюме.";
        optionB = "Мастер-класс «Как выделиться без опыта» (групповой).";
    } else if (level === "Middle / опытный") {
        optionA = "Интенсив «Продай себя дорого» (индивидуально, разбор резюме и интервью).";
        optionB = "Групповой тренинг по переговорам о зарплате + чек-листы.";
    } else if (level === "Senior / ведущий" || level === "Lead / руководитель") {
        optionA = "Executive-коучинг и подготовка к собеседованиям с топ-менеджерами.";
        optionB = "Карьерная сессия (2 часа) по позиционированию на рынке.";
    }
    if (urgency === "Вчера") {
        optionA = "Экспресс-подготовка за 3 дня: резюме, сопроводительные, интервью.";
        optionB = "Чек-лист быстрого поиска + самодиагностика.";
    }
    if (budget === "До 5000 ₽") {
        optionB = optionB + " (стоимость до 5000 ₽)";
    } else if (budget === "Выше 50000 ₽") {
        optionA = optionA + " с персональным куратором на месяц.";
    }
    return [optionA, optionB];
}

function renderQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;

    if (quizState === 'questions') {
        let html = '';
        quizQuestions.forEach((q, idx) => {
            html += `<div class="quiz-question"><p>${q.text}</p><div class="quiz-options" data-q="${idx}">`;
            q.options.forEach(opt => { html += `<div class="quiz-option ${answers[idx] === opt ? 'selected' : ''}" data-opt="${opt}">${opt}</div>`; });
            html += `</div></div>`;
        });
        html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
        quizContainer.innerHTML = html;

        document.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const parent = el.parentElement;
                const qIdx = parseInt(parent.dataset.q);
                answers[qIdx] = el.dataset.opt;
                renderQuiz();
            });
        });

        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (answers.includes(null)) {
                    alert('Ответьте на все вопросы');
                    return;
                }
                quizState = 'choice';
                renderQuiz();
            });
        }
    } else if (quizState === 'choice') {
        const options = generateTwoOptions(answers);
        const html = `
            <p style="font-weight: 600; margin-bottom: 20px;">Какой вариант вам больше подходит?</p>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                <div style="flex: 1; min-width: 200px; background: var(--surface-soft); border-radius: 28px; padding: 24px; text-align: left;">
                    <h4>📌 Вариант 1</h4>
                    <p>${options[0]}</p>
                    <button class="btn-primary choose-option" data-choice="1">Выбрать этот</button>
                </div>
                <div style="flex: 1; min-width: 200px; background: var(--surface-soft); border-radius: 28px; padding: 24px; text-align: left;">
                    <h4>📌 Вариант 2</h4>
                    <p>${options[1]}</p>
                    <button class="btn-primary choose-option" data-choice="2">Выбрать этот</button>
                </div>
            </div>
        `;
        quizContainer.innerHTML = html;

        document.querySelectorAll('.choose-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chosen = e.target.getAttribute('data-choice');
                const chosenText = chosen === '1' ? options[0] : options[1];
                const formData = {
                    formType: 'Квиз',
                    name: '',
                    phone: '',
                    comment: `Выбран вариант ${chosen}: ${chosenText}`,
                    quizAnswers: answers.map((a, i) => `${quizQuestions[i].text} — ${a}`).join('\n'),
                    q1: answers[0],
                    q2: answers[1],
                    q3: answers[2],
                    q4: answers[3],
                    q5: answers[4],
                    chosenVariant: `${chosen}: ${chosenText}`
                };
                sendDataToSheet(formData);
                const quizResult = document.getElementById('quizResult');
                if (quizResult) {
                    quizResult.innerHTML = `<strong>✅ Вы выбрали вариант ${chosen}:</strong><br>${chosenText}<br><br><a href="https://t.me/HrLubacheva" class="btn-primary" target="_blank">Обсудить в Telegram</a>`;
                    quizResult.style.display = 'block';
                }
                if (quizContainer) quizContainer.innerHTML = '<p>Спасибо! Результат ниже.</p>';
            });
        });
    }
}