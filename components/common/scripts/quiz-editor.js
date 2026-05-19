// ---------- Редактор квиза с правилами ----------
let quizEditMode = false;

// Текущие данные квиза
let quizData = {
    questions: [
        { text: "1. Ваша роль?", options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"] },
        { text: "2. Ваш текущий уровень?", options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"] },
        { text: "3. Как быстро нужен результат?", options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"] },
        { text: "4. Что для вас важнее всего?", options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"] },
        { text: "5. Бюджет на консультацию/подбор?", options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"] }
    ],
    rules: {
        // Какие ответы на какой вопрос ведут к варианту 1 или варианту 2
        // вариант 1 = более дорогой/интенсивный, вариант 2 = более бюджетный/простой
        question0: { option1: [], option2: [] },  // роль
        question1: { option1: [], option2: [] },  // уровень
        question2: { option1: [], option2: [] },  // срочность
        question3: { option1: [], option2: [] },  // важность
        question4: { option1: [], option2: [] }   // бюджет
    }
};

// Загрузка/сохранение в localStorage
function saveQuizDataToStorage() {
    localStorage.setItem('quizData', JSON.stringify(quizData));
}

function loadQuizDataFromStorage() {
    const saved = localStorage.getItem('quizData');
    if (saved) {
        const parsed = JSON.parse(saved);
        quizData.questions = parsed.questions;
        if (parsed.rules) quizData.rules = parsed.rules;
    }
}

// Генерация двух вариантов на основе правил
function generateTwoOptionsFromRules(answersArray) {
    let score1 = 0, score2 = 0;

    // Подсчитываем очки для варианта 1 и варианта 2 по каждому вопросу
    for (let i = 0; i < answersArray.length; i++) {
        const answer = answersArray[i];
        const rule = quizData.rules[`question${i}`];
        if (rule) {
            if (rule.option1 && rule.option1.includes(answer)) score1++;
            if (rule.option2 && rule.option2.includes(answer)) score2++;
        }
    }

    // Базовые тексты вариантов
    let option1Text = "Индивидуальная карьерная стратегия + полное сопровождение (резюме, подготовка, переговоры до оффера).";
    let option2Text = "Тренинг «Продай себя дорого» + самоподготовка по материалам.";

    // Корректировка на основе ответов (можно дополнить)
    const role = answersArray[0];
    const level = answersArray[1];
    const urgency = answersArray[2];
    const budget = answersArray[4];

    if (role === "Подбираю сотрудников") {
        option1Text = "HR-аудит и закрытие одной вакансии под ключ (гарантия 28 дней).";
        option2Text = "Бесплатная диагностика вакансии + консультация по поиску.";
    } else if (level === "Junior / начинающий") {
        option1Text = "Пошаговая стратегия поиска работы + упаковка резюме.";
        option2Text = "Мастер-класс «Как выделиться без опыта» (групповой).";
    } else if (level === "Middle / опытный") {
        option1Text = "Интенсив «Продай себя дорого» (индивидуально, разбор резюме и интервью).";
        option2Text = "Групповой тренинг по переговорам о зарплате + чек-листы.";
    } else if (level === "Senior / ведущий" || level === "Lead / руководитель") {
        option1Text = "Executive-коучинг и подготовка к собеседованиям с топ-менеджерами.";
        option2Text = "Карьерная сессия (2 часа) по позиционированию на рынке.";
    }
    if (urgency === "Вчера") {
        option1Text = "Экспресс-подготовка за 3 дня: резюме, сопроводительные, интервью.";
        option2Text = "Чек-лист быстрого поиска + самодиагностика.";
    }
    if (budget === "До 5000 ₽") {
        option2Text = option2Text + " (стоимость до 5000 ₽)";
    } else if (budget === "Выше 50000 ₽") {
        option1Text = option1Text + " с персональным куратором на месяц.";
    }

    // Если есть явный перевес, можно показать сообщение
    let recommendationNote = "";
    if (score1 > score2) {
        recommendationNote = "По вашим ответам рекомендуем Вариант 1";
    } else if (score2 > score1) {
        recommendationNote = "По вашим ответам рекомендуем Вариант 2";
    } else {
        recommendationNote = "Оба варианта подходят — выберите тот, который ближе вам по духу";
    }

    return { option1: option1Text, option2: option2Text, note: recommendationNote };
}

// Рендер квиза в режиме просмотра
function renderQuizView() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;

    let html = '';
    quizData.questions.forEach((q, idx) => {
        html += `<div class="quiz-question"><p>${q.text}</p><div class="quiz-options" data-q="${idx}">`;
        q.options.forEach((opt, optIdx) => {
            html += `<div class="quiz-option" data-opt="${opt}" data-opt-idx="${optIdx}">${opt}</div>`;
        });
        html += `</div></div>`;
    });
    html += `<button id="submitQuizBtn" class="btn-primary">Показать варианты</button>`;
    quizContainer.innerHTML = html;

    let answers = [null, null, null, null, null];

    document.querySelectorAll('.quiz-option').forEach(el => {
        el.addEventListener('click', (e) => {
            const parent = el.parentElement;
            const qIdx = parseInt(parent.dataset.q);
            const optIdx = parseInt(el.dataset.optIdx);
            const optText = el.dataset.opt;
            answers[qIdx] = optText;
            parent.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
            el.classList.add('selected');
        });
    });

    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        const newSubmit = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
        newSubmit.addEventListener('click', () => {
            if (answers.includes(null)) {
                alert('Ответьте на все вопросы');
                return;
            }
            const { option1, option2, note } = generateTwoOptionsFromRules(answers);
            const html = `
                <p style="font-weight: 600; margin-bottom: 20px;">${note}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                    <div style="flex: 1; min-width: 200px; background: var(--surface-soft); border-radius: 28px; padding: 24px; text-align: left;">
                        <h4>📌 Вариант 1</h4>
                        <p>${option1}</p>
                        <button class="btn-primary choose-option" data-choice="1">Выбрать этот</button>
                    </div>
                    <div style="flex: 1; min-width: 200px; background: var(--surface-soft); border-radius: 28px; padding: 24px; text-align: left;">
                        <h4>📌 Вариант 2</h4>
                        <p>${option2}</p>
                        <button class="btn-primary choose-option" data-choice="2">Выбрать этот</button>
                    </div>
                </div>
            `;
            const quizContainer = document.getElementById('quizContainer');
            if (quizContainer) quizContainer.innerHTML = html;

            document.querySelectorAll('.choose-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const chosen = e.target.getAttribute('data-choice');
                    const chosenText = chosen === '1' ? option1 : option2;
                    const formData = {
                        formType: 'Квиз',
                        name: '',
                        phone: '',
                        comment: `Выбран вариант ${chosen}: ${chosenText}`,
                        quizAnswers: answers.map((a, i) => `${quizData.questions[i].text} — ${a}`).join('\n'),
                        q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4],
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
        });
    }
}

// Рендер режима редактирования с правилами
function renderQuizEditMode() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;

    let html = `
        <div class="quiz-edit-panel">
            <h3>✏️ Редактор квиза</h3>
            <p style="margin-bottom: 20px;">Редактируйте вопросы и варианты ответов. Для каждого ответа укажите, к какому варианту он ведёт.</p>
    `;

    quizData.questions.forEach((q, qIdx) => {
        const rule = quizData.rules[`question${qIdx}`] || { option1: [], option2: [] };
        html += `
            <div class="quiz-edit-question" data-qidx="${qIdx}" style="margin-bottom: 30px; padding: 20px; border: 1px solid var(--border); border-radius: 24px; background: var(--surface-soft);">
                <div class="quiz-edit-question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div class="quiz-edit-question-text" style="font-weight: 700; font-size: 1.1rem; cursor: pointer; padding: 8px 12px; background: var(--surface); border-radius: 12px; flex: 1;">
                        📝 ${q.text}
                    </div>
                    <button class="quiz-edit-delete-question" data-qidx="${qIdx}" style="background: #dc2626; color: white; border: none; border-radius: 20px; padding: 6px 16px; cursor: pointer; margin-left: 10px;">🗑️ Удалить вопрос</button>
                </div>
                <div class="quiz-edit-options">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 8px;">Вариант ответа</th>
                                <th style="text-align: center; padding: 8px; width: 120px;">🎯 Вариант 1</th>
                                <th style="text-align: center; padding: 8px; width: 120px;">🎯 Вариант 2</th>
                                <th style="text-align: center; padding: 8px; width: 60px;"></th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        q.options.forEach((opt, optIdx) => {
            const isOption1 = rule.option1.includes(opt);
            const isOption2 = rule.option2.includes(opt);
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px;">
                        <span class="quiz-edit-option-text" data-qidx="${qIdx}" data-optidx="${optIdx}" style="cursor: pointer; padding: 4px 8px; display: inline-block; border-radius: 8px;">${opt}</span>
                    </td>
                    <td style="text-align: center; padding: 8px;">
                        <input type="radio" name="option1_${qIdx}_${optIdx}" value="${opt}" ${isOption1 ? 'checked' : ''} class="quiz-rule-option1" data-qidx="${qIdx}" data-opt="${opt}">
                    </td>
                    <td style="text-align: center; padding: 8px;">
                        <input type="radio" name="option2_${qIdx}_${optIdx}" value="${opt}" ${isOption2 ? 'checked' : ''} class="quiz-rule-option2" data-qidx="${qIdx}" data-opt="${opt}">
                    </td>
                    <td style="text-align: center; padding: 8px;">
                        <button class="quiz-edit-option-delete" data-qidx="${qIdx}" data-optidx="${optIdx}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.2rem;">🗑️</button>
                    </td>
                </tr>
            `;
        });
        html += `
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="quiz-edit-add-option" data-qidx="${qIdx}" style="background: var(--primary); color: white; border: none; border-radius: 20px; padding: 8px 16px; cursor: pointer;">+ Добавить вариант</button>
                </div>
            </div>
        `;
    });

    html += `
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="quiz-edit-add-question" style="background: var(--primary); color: white; border: none; border-radius: 40px; padding: 12px 24px; cursor: pointer;">+ Добавить вопрос</button>
            <button class="quiz-edit-save" style="background: #2ea44f; color: white; border: none; border-radius: 40px; padding: 12px 24px; cursor: pointer;">💾 Сохранить квиз</button>
        </div>
    </div>`;

    quizContainer.innerHTML = html;

    // Обработчики редактирования текста вопроса
    document.querySelectorAll('.quiz-edit-question-text').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const qIdx = parseInt(el.closest('.quiz-edit-question').dataset.qidx);
            const newText = prompt('Введите текст вопроса:', quizData.questions[qIdx].text);
            if (newText) {
                quizData.questions[qIdx].text = newText;
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    });

    // Обработчики редактирования текста варианта
    document.querySelectorAll('.quiz-edit-option-text').forEach(el => {
        el.addEventListener('click', (e) => {
            const qIdx = parseInt(el.dataset.qidx);
            const optIdx = parseInt(el.dataset.optidx);
            const newText = prompt('Введите текст варианта:', quizData.questions[qIdx].options[optIdx]);
            if (newText) {
                const oldText = quizData.questions[qIdx].options[optIdx];
                quizData.questions[qIdx].options[optIdx] = newText;
                // Обновляем правила
                const rule = quizData.rules[`question${qIdx}`] || { option1: [], option2: [] };
                if (rule.option1.includes(oldText)) {
                    rule.option1 = rule.option1.map(t => t === oldText ? newText : t);
                }
                if (rule.option2.includes(oldText)) {
                    rule.option2 = rule.option2.map(t => t === oldText ? newText : t);
                }
                quizData.rules[`question${qIdx}`] = rule;
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    });

    // Обработчики выбора варианта 1
    document.querySelectorAll('.quiz-rule-option1').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const qIdx = parseInt(radio.dataset.qidx);
            const opt = radio.dataset.opt;
            if (!quizData.rules[`question${qIdx}`]) {
                quizData.rules[`question${qIdx}`] = { option1: [], option2: [] };
            }
            const rule = quizData.rules[`question${qIdx}`];
            if (radio.checked) {
                if (!rule.option1.includes(opt)) rule.option1.push(opt);
                // Убираем из option2, если был там
                if (rule.option2.includes(opt)) {
                    rule.option2 = rule.option2.filter(o => o !== opt);
                    // Снимаем радиокнопку option2
                    const opt2Radio = document.querySelector(`.quiz-rule-option2[data-qidx="${qIdx}"][data-opt="${opt}"]`);
                    if (opt2Radio) opt2Radio.checked = false;
                }
            } else {
                rule.option1 = rule.option1.filter(o => o !== opt);
            }
            saveQuizDataToStorage();
        });
    });

    // Обработчики выбора варианта 2
    document.querySelectorAll('.quiz-rule-option2').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const qIdx = parseInt(radio.dataset.qidx);
            const opt = radio.dataset.opt;
            if (!quizData.rules[`question${qIdx}`]) {
                quizData.rules[`question${qIdx}`] = { option1: [], option2: [] };
            }
            const rule = quizData.rules[`question${qIdx}`];
            if (radio.checked) {
                if (!rule.option2.includes(opt)) rule.option2.push(opt);
                if (rule.option1.includes(opt)) {
                    rule.option1 = rule.option1.filter(o => o !== opt);
                    const opt1Radio = document.querySelector(`.quiz-rule-option1[data-qidx="${qIdx}"][data-opt="${opt}"]`);
                    if (opt1Radio) opt1Radio.checked = false;
                }
            } else {
                rule.option2 = rule.option2.filter(o => o !== opt);
            }
            saveQuizDataToStorage();
        });
    });

    // Удаление варианта
    document.querySelectorAll('.quiz-edit-option-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qIdx = parseInt(btn.dataset.qidx);
            const optIdx = parseInt(btn.dataset.optidx);
            const optText = quizData.questions[qIdx].options[optIdx];
            if (quizData.questions[qIdx].options.length <= 2) {
                alert('Нельзя удалить последний вариант. Добавьте новый перед удалением.');
                return;
            }
            quizData.questions[qIdx].options.splice(optIdx, 1);
            // Удаляем из правил
            if (quizData.rules[`question${qIdx}`]) {
                quizData.rules[`question${qIdx}`].option1 = quizData.rules[`question${qIdx}`].option1.filter(o => o !== optText);
                quizData.rules[`question${qIdx}`].option2 = quizData.rules[`question${qIdx}`].option2.filter(o => o !== optText);
            }
            renderQuizEditMode();
            saveQuizDataToStorage();
        });
    });

    // Добавление варианта
    document.querySelectorAll('.quiz-edit-add-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qIdx = parseInt(btn.dataset.qidx);
            const newOpt = prompt('Введите текст нового варианта:', 'Новый вариант');
            if (newOpt) {
                quizData.questions[qIdx].options.push(newOpt);
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    });

    // Удаление вопроса
    document.querySelectorAll('.quiz-edit-delete-question').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (quizData.questions.length <= 1) {
                alert('Нельзя удалить единственный вопрос.');
                return;
            }
            const qIdx = parseInt(btn.dataset.qidx);
            if (confirm('Удалить этот вопрос?')) {
                quizData.questions.splice(qIdx, 1);
                delete quizData.rules[`question${qIdx}`];
                // Перенумеровываем правила
                const newRules = {};
                for (let i = 0; i < quizData.questions.length; i++) {
                    if (quizData.rules[`question${i+1}`]) newRules[`question${i}`] = quizData.rules[`question${i+1}`];
                }
                quizData.rules = newRules;
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    });

    // Добавление вопроса
    const addQuestionBtn = document.querySelector('.quiz-edit-add-question');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const newQuestionText = prompt('Введите текст нового вопроса:', 'Новый вопрос');
            if (newQuestionText) {
                const newIndex = quizData.questions.length;
                quizData.questions.push({
                    text: newQuestionText,
                    options: ['Вариант 1', 'Вариант 2']
                });
                quizData.rules[`question${newIndex}`] = { option1: [], option2: [] };
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    }

    // Сохранение
    const saveBtn = document.querySelector('.quiz-edit-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveQuizDataToStorage();
            showToast('✅ Квиз сохранён локально. Не забудьте сохранить страницу в GitHub!');
        });
    }
}

// Главная функция рендера
function renderQuiz() {
    if (editMode && document.body.classList.contains('edit-mode-active')) {
        renderQuizEditMode();
    } else {
        renderQuizView();
    }
}

// Инициализация
loadQuizDataFromStorage();

window.renderQuiz = renderQuiz;
window.quizData = quizData;