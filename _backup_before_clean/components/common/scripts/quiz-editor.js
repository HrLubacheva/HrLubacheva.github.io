// ---------- Редактор квиза (все секции развёрнуты) ----------
let quizEditMode = false;

let quizData = {
    questions: [
        {
            text: "1. Ваша роль?",
            options: ["Ищу работу", "Хочу сменить профессию", "Рост в текущей компании", "Подбираю сотрудников"],
            rules: {}
        },
        {
            text: "2. Ваш текущий уровень?",
            options: ["Junior / начинающий", "Middle / опытный", "Senior / ведущий", "Lead / руководитель"],
            rules: {}
        },
        {
            text: "3. Как быстро нужен результат?",
            options: ["Вчера", "1–2 месяца", "3–6 месяцев", "Планирую постепенно"],
            rules: {}
        },
        {
            text: "4. Что для вас важнее всего?",
            options: ["Зарплата", "Условия/удаленка", "Карьерный рост", "Команда и ценности"],
            rules: {}
        },
        {
            text: "5. Бюджет на консультацию/подбор?",
            options: ["До 5000 ₽", "5000–15000 ₽", "15000–50000 ₽", "Выше 50000 ₽"],
            rules: {}
        }
    ],
    variant1Text: "Индивидуальная карьерная стратегия + полное сопровождение (резюме, подготовка, переговоры до оффера).",
    variant2Text: "Тренинг «Продай себя дорого» + самоподготовка по материалам."
};

function saveQuizDataToStorage() {
    localStorage.setItem('quizData', JSON.stringify(quizData));
}

function loadQuizDataFromStorage() {
    const saved = localStorage.getItem('quizData');
    if (saved) {
        const parsed = JSON.parse(saved);
        quizData.questions = parsed.questions;
        if (parsed.variant1Text) quizData.variant1Text = parsed.variant1Text;
        if (parsed.variant2Text) quizData.variant2Text = parsed.variant2Text;
    }
}

function generateTwoOptionsFromRules(answersArray) {
    let variant1Count = 0, variant2Count = 0;
    for (let i = 0; i < answersArray.length; i++) {
        const answer = answersArray[i];
        const rules = quizData.questions[i].rules;
        if (rules && rules[answer]) {
            if (rules[answer] === 'variant1') variant1Count++;
            if (rules[answer] === 'variant2') variant2Count++;
        }
    }
    let recommendationNote = "";
    if (variant1Count > variant2Count) {
        recommendationNote = "По вашим ответам рекомендуем Вариант 1";
    } else if (variant2Count > variant1Count) {
        recommendationNote = "По вашим ответам рекомендуем Вариант 2";
    } else {
        recommendationNote = "Оба варианта подходят — выберите тот, который ближе вам по духу";
    }
    return {
        option1: quizData.variant1Text,
        option2: quizData.variant2Text,
        note: recommendationNote
    };
}

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

function renderQuizEditMode() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;

    let html = `
        <div class="quiz-edit-panel">
            <h3 style="margin-bottom: 20px;">✏️ Редактор квиза</h3>
            <div style="margin-bottom: 20px; padding: 15px; background: var(--surface-soft); border-radius: 16px;">
                <h4 style="margin-bottom: 10px;">📌 Финальные варианты ответов</h4>
                <div style="margin-bottom: 10px;">
                    <label style="font-weight: 600;">Вариант 1 (рекомендация):</label>
                    <textarea id="variant1-text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 12px; border: 1px solid var(--border);" rows="2">${quizData.variant1Text}</textarea>
                </div>
                <div>
                    <label style="font-weight: 600;">Вариант 2 (рекомендация):</label>
                    <textarea id="variant2-text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 12px; border: 1px solid var(--border);" rows="2">${quizData.variant2Text}</textarea>
                </div>
            </div>
    `;

    quizData.questions.forEach((q, qIdx) => {
        html += `
            <div class="quiz-edit-question" data-qidx="${qIdx}" style="margin-bottom: 30px; padding: 20px; border: 1px solid var(--border); border-radius: 24px; background: var(--surface-soft);">
                <div class="quiz-edit-question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div class="quiz-edit-question-text" style="font-weight: 700; font-size: 1.1rem; cursor: pointer; padding: 8px 12px; background: var(--surface); border-radius: 12px; flex: 1;">
                        📝 ${q.text}
                    </div>
                    <button class="quiz-edit-delete-question" data-qidx="${qIdx}" style="background: #dc2626; color: white; border: none; border-radius: 20px; padding: 6px 16px; cursor: pointer; margin-left: 10px;">🗑️ Удалить вопрос</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">📋 Варианты ответов</h4>
                    <div class="quiz-edit-options-list" data-qidx="${qIdx}">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border);">
                                    <th style="text-align: left; padding: 8px;">Вариант</th>
                                    <th style="width: 60px;"></th>
                                </tr>
                            </thead>
                            <tbody id="options-tbody-${qIdx}">
        `;

        q.options.forEach((opt, optIdx) => {
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px;">
                        <input type="text" class="quiz-option-text" data-qidx="${qIdx}" data-optidx="${optIdx}" value="${opt.replace(/"/g, '&quot;')}" style="width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px;">
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        <button class="quiz-option-delete" data-qidx="${qIdx}" data-optidx="${optIdx}" style="background: #dc2626; color: white; border: none; border-radius: 20px; padding: 4px 10px; cursor: pointer;">🗑️</button>
                    </td>
                </tr>
            `;
        });

        html += `
                            </tbody>
                        </table>
                        <button class="quiz-option-add" data-qidx="${qIdx}" style="margin-top: 10px; background: var(--primary); color: white; border: none; border-radius: 20px; padding: 6px 16px; cursor: pointer;">+ Добавить вариант</button>
                    </div>
                </div>
                
                <div>
                    <h4 style="margin-bottom: 10px;">🎯 Правила (какой ответ ведёт к какому варианту)</h4>
                    <div class="quiz-edit-rules" data-qidx="${qIdx}">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border);">
                                    <th style="text-align: left; padding: 8px;">Вариант ответа</th>
                                    <th style="text-align: center; padding: 8px; width: 120px;">🎯 Вариант 1</th>
                                    <th style="text-align: center; padding: 8px; width: 120px;">🎯 Вариант 2</th>
                                </tr>
                            </thead>
                            <tbody id="rules-tbody-${qIdx}">
        `;

        q.options.forEach((opt, optIdx) => {
            const rule = q.rules[opt] || '';
            const isVariant1 = rule === 'variant1';
            const isVariant2 = rule === 'variant2';
            html += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 8px;">${opt}</td>
                    <td style="text-align: center; padding: 8px;">
                        <input type="radio" name="rule_${qIdx}_${optIdx}" value="variant1" ${isVariant1 ? 'checked' : ''} class="quiz-rule-radio" data-qidx="${qIdx}" data-opt="${opt}">
                    </td>
                    <td style="text-align: center; padding: 8px;">
                        <input type="radio" name="rule_${qIdx}_${optIdx}" value="variant2" ${isVariant2 ? 'checked' : ''} class="quiz-rule-radio" data-qidx="${qIdx}" data-opt="${opt}">
                    </td>
                </tr>
            `;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
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

    // Обработчики
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

    document.querySelectorAll('.quiz-option-text').forEach(input => {
        input.addEventListener('change', (e) => {
            const qIdx = parseInt(input.dataset.qidx);
            const optIdx = parseInt(input.dataset.optidx);
            const oldText = quizData.questions[qIdx].options[optIdx];
            const newText = input.value;
            const rule = quizData.questions[qIdx].rules[oldText];
            quizData.questions[qIdx].options[optIdx] = newText;
            if (rule) {
                delete quizData.questions[qIdx].rules[oldText];
                quizData.questions[qIdx].rules[newText] = rule;
            }
            renderQuizEditMode();
            saveQuizDataToStorage();
        });
    });

    document.querySelectorAll('.quiz-option-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qIdx = parseInt(btn.dataset.qidx);
            const optIdx = parseInt(btn.dataset.optidx);
            if (quizData.questions[qIdx].options.length <= 2) {
                showToast('❌ Нельзя удалить последний вариант. Добавьте новый перед удалением.');
                return;
            }
            const optText = quizData.questions[qIdx].options[optIdx];
            quizData.questions[qIdx].options.splice(optIdx, 1);
            delete quizData.questions[qIdx].rules[optText];
            renderQuizEditMode();
            saveQuizDataToStorage();
        });
    });

    document.querySelectorAll('.quiz-option-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qIdx = parseInt(btn.dataset.qidx);
            const newOpt = prompt('Введите текст нового варианта:', 'Новый вариант');
            if (newOpt) {
                quizData.questions[qIdx].options.push(newOpt);
                quizData.questions[qIdx].rules[newOpt] = '';
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    });

    document.querySelectorAll('.quiz-rule-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const qIdx = parseInt(radio.dataset.qidx);
            const opt = radio.dataset.opt;
            const value = radio.value;
            if (radio.checked) {
                quizData.questions[qIdx].rules[opt] = value;
                const oppositeRadio = document.querySelector(`.quiz-rule-radio[data-qidx="${qIdx}"][data-opt="${opt}"][value="${value === 'variant1' ? 'variant2' : 'variant1'}"]`);
                if (oppositeRadio) oppositeRadio.checked = false;
                saveQuizDataToStorage();
                showToast(`✅ Правило обновлено: "${opt}" → ${value === 'variant1' ? 'Вариант 1' : 'Вариант 2'}`);
            }
        });
    });

    document.querySelectorAll('.quiz-edit-delete-question').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (quizData.questions.length <= 1) {
                showToast('❌ Нельзя удалить единственный вопрос.');
                return;
            }
            const qIdx = parseInt(btn.dataset.qidx);
            if (confirm('Удалить этот вопрос?')) {
                quizData.questions.splice(qIdx, 1);
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    });

    const addQuestionBtn = document.querySelector('.quiz-edit-add-question');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const newQuestionText = prompt('Введите текст нового вопроса:', 'Новый вопрос');
            if (newQuestionText) {
                quizData.questions.push({
                    text: newQuestionText,
                    options: ['Вариант 1', 'Вариант 2'],
                    rules: {}
                });
                renderQuizEditMode();
                saveQuizDataToStorage();
            }
        });
    }

    const variant1Textarea = document.getElementById('variant1-text');
    const variant2Textarea = document.getElementById('variant2-text');
    if (variant1Textarea) {
        variant1Textarea.addEventListener('change', () => {
            quizData.variant1Text = variant1Textarea.value;
            saveQuizDataToStorage();
        });
    }
    if (variant2Textarea) {
        variant2Textarea.addEventListener('change', () => {
            quizData.variant2Text = variant2Textarea.value;
            saveQuizDataToStorage();
        });
    }

    const saveBtn = document.querySelector('.quiz-edit-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveQuizDataToStorage();
            showToast('✅ Квиз сохранён локально. Не забудьте сохранить страницу в GitHub!');
        });
    }
}

function renderQuiz() {
    if (editMode && document.body.classList.contains('edit-mode-active')) {
        renderQuizEditMode();
    } else {
        renderQuizView();
    }
}

loadQuizDataFromStorage();
window.renderQuiz = renderQuiz;
window.quizData = quizData;