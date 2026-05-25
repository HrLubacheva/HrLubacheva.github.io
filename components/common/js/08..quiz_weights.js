// ========== ВЕСА УСЛУГ (ТОЛЬКО ПРИОРИТЕТНЫЕ ДЛЯ КВИЗА, БЕЗ БЕСПЛАТНЫХ) ==========
// Табличный формат: каждая услуга описывается массивом [название, веса...]
// Формат: [название, role_*, level_*, urgency_*, importance_*, budget_*]

window.SERVICE_WEIGHTS_TABLE = [
    // ---------- B2C: Базовые (до 10 000 ₽) ----------
    ["Экспресс-консультация (30мин)",      "role_job_seeker:10,role_career_change:8",                 "level_junior:8,level_middle:6",               "urgency_fast:9,urgency_1_2_months:6",     "importance_salary:6,importance_career:5",       "budget_low:10,budget_5000_15000:8"],
    ["Аудит резюме",                       "role_job_seeker:10,role_career_change:7",                 "level_junior:9,level_middle:7,level_senior:6","urgency_fast:7,urgency_1_2_months:6",     "importance_salary:6,importance_career:7",       "budget_low:9,budget_5000_15000:8"],
    ["Сопроводительное письмо",            "role_job_seeker:9,role_career_change:6",                  "level_junior:8,level_middle:6",               "urgency_fast:6",                           "importance_salary:5",                           "budget_low:8,budget_5000_15000:7"],
    ["Подготовка к собеседованию (1ч)",    "role_job_seeker:10,role_career_change:7",                 "level_junior:8,level_middle:7,level_senior:6","urgency_fast:9,urgency_1_2_months:6",     "importance_salary:8,importance_career:6",       "budget_5000_15000:7,budget_15000_50000:6"],
    ["Резюме специалиста",                 "role_job_seeker:10",                                      "level_middle:8,level_senior:7",               "urgency_fast:6,urgency_1_2_months:6",     "importance_salary:7,importance_career:7",       "budget_5000_15000:8,budget_15000_50000:7"],
    ["Индивидуальная консультация (1ч)",   "role_job_seeker:9,role_career_change:8,role_growth:8",   "level_any:6",                                 "urgency_any:5",                            "importance_any:5",                              "budget_any:5"],
    ["Профориентация для взрослых",        "role_career_change:10",                                   "level_junior:7,level_middle:6",               "urgency_1_2_months:7,urgency_3_6_months:6","importance_career:9",                           "budget_5000_15000:7,budget_15000_50000:6"],
    ["Профориентация для подростков",      "role_career_change:9",                                    "level_junior:8",                              "urgency_1_2_months:6",                     "importance_career:8",                           "budget_5000_15000:7"],
    ["Стратегия поиска работы",            "role_job_seeker:9,role_career_change:8",                  "level_middle:7,level_senior:7",               "urgency_1_2_months:8,urgency_3_6_months:6","importance_salary:7,importance_career:8",       "budget_15000_50000:8,budget_5000_15000:6"],
    ["Резюме руководителя",                "role_job_seeker:9",                                      "level_lead:9,level_director:8,level_top:7",   "urgency_1_2_months:7",                     "importance_salary:8,importance_career:8",       "budget_15000_50000:8,budget_50000_100000:7"],
    ["Тренинг по переговорам",             "role_job_seeker:7,role_growth:8",                         "level_middle:7,level_senior:7",               "urgency_fast:6",                           "importance_salary:9",                           "budget_5000_15000:6,budget_15000_50000:6"],
    ["Психологическое консультирование (1ч)","role_job_seeker:6,role_career_change:7",                "level_any:5",                                 "urgency_1_2_months:5",                     "importance_balance:10",                         "budget_5000_15000:6"],
    ["Переговоры о зарплате (1ч)",         "role_job_seeker:8,role_growth:9",                         "level_middle:7,level_senior:7",               "urgency_fast:8",                           "importance_salary:10",                          "budget_5000_15000:7,budget_15000_50000:6"],

    // ---------- B2C: Стандартные (10 000 – 50 000 ₽) ----------
    ["Индивидуальный тренинг «Продай себя дорого»", "role_job_seeker:9,role_growth:8",                 "level_middle:8,level_senior:8",               "urgency_fast:7,urgency_1_2_months:6",     "importance_salary:9,importance_career:8",       "budget_15000_50000:8,budget_5000_15000:6"],
    ["План развития (рост в должности)",   "role_growth:10",                                          "level_middle:9,level_senior:7",               "urgency_1_2_months:7,urgency_3_6_months:6","importance_career:10,importance_salary:7",       "budget_15000_50000:8,budget_5000_15000:6"],
    ["Повышение грейда",                   "role_growth:10",                                          "level_middle:9,level_senior:7",               "urgency_1_2_months:8",                     "importance_salary:9,importance_career:8",       "budget_15000_50000:8"],
    ["Развитие управленческих навыков",    "role_growth:10",                                          "level_lead:9,level_director:8",               "urgency_1_2_months:7,urgency_3_6_months:6","importance_career:9,importance_team:8",         "budget_50000_100000:8,budget_15000_50000:6"],
    ["Карьерная стратегия (пакет 3 консультации)","role_job_seeker:9,role_career_change:9,role_growth:8","level_middle:8,level_senior:8",            "urgency_1_2_months:7,urgency_3_6_months:6","importance_career:9,importance_salary:7",       "budget_15000_50000:9,budget_50000_100000:7"],
    ["Коучинг для руководителей",          "role_growth:9,role_job_seeker:7",                         "level_lead:9,level_director:8,level_top:7",   "urgency_1_2_months:7",                     "importance_career:9,importance_team:8",         "budget_50000_100000:8,budget_15000_50000:6"],
    ["Коучинг для руководителей (пакет 4 сессии)","role_growth:9",                                    "level_lead:9,level_director:8",               "urgency_1_2_months:6",                     "importance_career:9",                           "budget_50000_100000:9"],
    ["VIP-коучинг",                        "role_growth:8,role_job_seeker:7",                         "level_senior:9,level_lead:9,level_director:8","urgency_1_2_months:6",                     "importance_career:9,importance_salary:8",       "budget_50000_100000:9,budget_100000_300000:8"],
    ["Стратегия роста",                    "role_growth:10",                                          "level_senior:8,level_lead:9,level_director:9,level_top:9","urgency_3_6_months:7",            "importance_career:10",                          "budget_100000_300000:9,budget_50000_100000:7"],

    // ---------- B2C: Премиальные (от 50 000 ₽) ----------
    ["Executive-коучинг/мес",              "role_growth:9",                                          "level_director:9,level_top:10",               "urgency_1_2_months:7",                     "importance_career:10",                          "budget_100000_300000:9"],
    ["Executive-сопровождение/мес",        "role_growth:8",                                          "level_director:9,level_top:10",               "urgency_3_6_months:7",                     "importance_career:9",                           "budget_300000_500000:9,budget_higher:8"],
    ["Поиск позиции C-level",              "role_job_seeker:10",                                     "level_top:10,level_director:9",               "urgency_fast:9",                           "importance_salary:9,importance_career:8",       "budget_300000_500000:10,budget_higher:9"],
    ["Коучинг топ-менеджеров",             "role_growth:9",                                          "level_top:10,level_director:9",               "urgency_1_2_months:7",                     "importance_career:9",                           "budget_300000_500000:9,budget_higher:8"],

    // ---------- B2B: Поиск сотрудников ----------
    ["Составление вакансии (с УТП)",       "role_business:10",                                       "level_junior:8,level_middle:7",               "urgency_fast:8,urgency_1_2_months:6",     "",                                              "budget_5000_15000:8,budget_15000_50000:7"],
    ["Подбор резюме под вакансию",         "role_business:10",                                       "level_junior:8,level_middle:7",               "urgency_fast:9",                           "",                                              "budget_15000_50000:8,budget_5000_15000:7"],
    ["База кандидатов + тестирование",     "role_business:10",                                       "level_junior:8",                              "urgency_fast:7,urgency_1_2_months:6",     "",                                              "budget_15000_50000:8"],
    ["Составить 'Программу стажировки'",   "role_business:9",                                        "level_junior:8",                              "urgency_3_6_months:8",                     "",                                              "budget_50000_100000:8,budget_15000_50000:6"],
    ["Подбор специалиста + гарантия",      "role_business:10",                                       "level_middle:9,level_senior:7",               "urgency_fast:9",                           "",                                              "budget_50000_100000:9,budget_100000_300000:8"],
    ["Классический рекрутинг",             "role_business:10",                                       "level_middle:8,level_senior:7",               "urgency_1_2_months:8",                     "",                                              "budget_50000_100000:8,budget_100000_300000:7"],
    ["Подбор руководителя",                "role_business:10",                                       "level_lead:9,level_director:8",               "urgency_fast:8,urgency_1_2_months:7",     "",                                              "budget_100000_300000:9,budget_50000_100000:7"],
    ["Аутсорсинг подбора (абонемент)",     "role_business:10",                                       "",                                            "urgency_monthly:10",                       "",                                              "budget_100000_300000:9,budget_higher:8"],
    ["Хэдхантинг",                         "role_business:10",                                       "level_senior:9,level_lead:8",                 "urgency_fast:9",                           "",                                              "budget_100000_300000:9,budget_300000_500000:8"],
    ["IT Поиск Senior+ с гарантией",       "role_business:10",                                       "level_senior:10",                             "urgency_fast:9",                           "",                                              "budget_100000_300000:9,budget_300000_500000:9"],
    ["IT Хэдхантинг Senior-специалиста",   "role_business:10",                                       "level_senior:10",                             "urgency_fast:9",                           "",                                              "budget_100000_300000:9"],
    ["IT Executive search Senior",         "role_business:10",                                       "level_senior:10,level_lead:9",                "urgency_fast:9",                           "",                                              "budget_300000_500000:10,budget_higher:9"],
    ["Эксклюзивный хэдхантинг",            "role_business:10",                                       "level_director:10,level_top:10,level_owner:9","urgency_fast:9",                            "",                                              "budget_higher:10,budget_300000_500000:9"],
    ["Подбор специалиста",                 "role_business:10",                                       "level_middle:8,level_junior:7",               "urgency_fast:7,urgency_1_2_months:6",     "",                                              "budget_50000_100000:8,budget_15000_50000:7"],

    // ---------- ТРЕНИНГИ ----------
    ["Групповой тренинг «Продай себя дорого»", "role_job_seeker:7,role_growth:7",                   "level_any:5",                                 "urgency_1_2_months:5",                     "importance_salary:6",                           "budget_15000_50000:7,budget_5000_15000:6"],
    ["Тренинг по запросу (1ч, до 25 чел.)","role_business:9",                                         "",                                            "urgency_fast:8",                           "",                                              "budget_15000_50000:8,budget_5000_15000:7"],
    ["Тренинг 'Удержание персонала'",      "role_business:9",                                        "",                                            "urgency_1_2_months:7",                     "",                                              "budget_50000_100000:8,budget_15000_50000:6"],
    ["Тренинг 'Профилактика выгорания'",   "role_business:8",                                        "",                                            "urgency_1_2_months:6",                     "importance_balance:9",                          "budget_15000_50000:7"],

    // ---------- АВТОРСКИЕ КУРСЫ ----------
    ["Авторский курс 'Рекрутер для недвижимости'","role_business:9,role_career_change:7",          "level_junior:7,level_middle:8",               "urgency_1_2_months:7,urgency_3_6_months:6","importance_career:8,importance_salary:7",       "budget_15000_50000:8,budget_5000_15000:6"],
    ["Обучение с '0' менеджер по продажам", "role_business:9,role_career_change:8",                 "level_junior:9,level_middle:7",               "urgency_1_2_months:7,urgency_3_6_months:7","importance_career:9,importance_salary:8",       "budget_50000_100000:8,budget_15000_50000:7"]
];

// ========== КОНВЕРТЕР: таблица → объект ==========
window.SERVICE_WEIGHTS = {};

function buildServiceWeightsFromTable() {
    for (const row of window.SERVICE_WEIGHTS_TABLE) {
        const [serviceName, roles, levels, urgencies, importances, budgets] = row;
        const weights = {};

        // Парсинг строк вида "ключ:значение,ключ2:значение2"
        const parseGroup = (str, targetObj) => {
            if (!str || str === "") return;
            const parts = str.split(",");
            for (const part of parts) {
                const [key, val] = part.split(":");
                if (key && val) targetObj[key.trim()] = parseInt(val, 10);
            }
        };

        parseGroup(roles, weights);
        parseGroup(levels, weights);
        parseGroup(urgencies, weights);
        parseGroup(importances, weights);
        parseGroup(budgets, weights);

        window.SERVICE_WEIGHTS[serviceName] = weights;
    }
}

buildServiceWeightsFromTable();

// ========== МАППИНГ ОТВЕТОВ В КЛЮЧИ (табличный формат) ==========
window.ANSWER_MAPPING_TABLE = [
    ["Ищу работу",                          "role_job_seeker"],
    ["Хочу сменить профессию",              "role_career_change"],
    ["Рост в текущей компании",             "role_growth"],
    ["Подбираю сотрудников",                "role_business"],
    ["Junior / начинающий",                 "level_junior"],
    ["Middle / опытный",                    "level_middle"],
    ["Senior / ведущий",                    "level_senior"],
    ["Lead / руководитель",                 "level_lead"],
    ["Директор / Managing Director",        "level_director"],
    ["Топ-менеджер (C-level)",              "level_top"],
    ["Собственник бизнеса",                 "level_owner"],
    ["Максимально быстро",                  "urgency_fast"],
    ["1–2 месяца",                          "urgency_1_2_months"],
    ["3–6 месяцев",                         "urgency_3_6_months"],
    ["В течение года",                      "urgency_year"],
    ["Ежемесячно / на постоянной основе",   "urgency_monthly"],
    ["Планирую постепенно",                 "urgency_slow"],
    ["Зарплата",                            "importance_salary"],
    ["Условия/удаленка",                    "importance_conditions"],
    ["Карьерный рост",                      "importance_career"],
    ["Команда и ценности",                  "importance_team"],
    ["Баланс работы и жизни",               "importance_balance"],
    ["До 5 000 ₽",                          "budget_low"],
    ["5 000 – 15 000 ₽",                    "budget_5000_15000"],
    ["15 000 – 50 000 ₽",                   "budget_15000_50000"],
    ["50 000 – 100 000 ₽",                  "budget_50000_100000"],
    ["100 000 – 300 000 ₽",                 "budget_100000_300000"],
    ["300 000 – 500 000 ₽",                 "budget_300000_500000"],
    ["Выше 500 000 ₽",                      "budget_higher"]
];

// Конвертируем таблицу в объект для обратной совместимости
window.ANSWER_MAPPING = {};
for (const [answer, key] of window.ANSWER_MAPPING_TABLE) {
    window.ANSWER_MAPPING[answer] = key;
}

// ========== КАТЕГОРИИ ЦЕН (табличный формат) ==========
window.PRICE_CATEGORY_TABLE = {
    base: [
        "Экспресс-консультация (30мин)",
        "Аудит резюме",
        "Сопроводительное письмо",
        "Подготовка к собеседованию (1ч)",
        "Резюме специалиста",
        "Индивидуальная консультация (1ч)",
        "Профориентация для взрослых",
        "Профориентация для подростков",
        "Стратегия поиска работы",
        "Тренинг по переговорам",
        "Психологическое консультирование (1ч)",
        "Переговоры о зарплате (1ч)"
    ],
    standard: [
        "Индивидуальный тренинг «Продай себя дорого»",
        "План развития (рост в должности)",
        "Повышение грейда",
        "Развитие управленческих навыков",
        "Карьерная стратегия (пакет 3 консультации)",
        "Коучинг для руководителей",
        "Коучинг для руководителей (пакет 4 сессии)",
        "VIP-коучинг",
        "Стратегия роста"
    ],
    premium: [
        "Executive-коучинг/мес",
        "Executive-сопровождение/мес",
        "Поиск позиции C-level",
        "Коучинг топ-менеджеров"
    ]
};

// Сохраняем плоский объект для обратной совместимости
window.PRICE_CATEGORY = window.PRICE_CATEGORY_TABLE;

// Дополнительная утилита: получить веса услуги (вспомогательная)
window.getServiceWeights = function(serviceName) {
    return window.SERVICE_WEIGHTS[serviceName] || {};
};

// Утилита: найти все услуги для заданной категории
window.getServicesByCategory = function(category) {
    return window.PRICE_CATEGORY_TABLE[category] || [];
};

console.log("✅ Табличная версия SERVICE_WEIGHTS загружена. Доступно услуг:", Object.keys(window.SERVICE_WEIGHTS).length);