// ========== ВЕСА УСЛУГ (ПОЛНЫЙ НАБОР, КРОМЕ BUSINESS_RETENTION И CORPORATE) ==========
window.SERVICE_WEIGHTS = {
    // ---------- B2C: Базовые (до 10 000 ₽) ----------
    "Экспресс-консультация (30мин)": {
        role_job_seeker: 10, level_junior: 8, urgency_fast: 7, importance_salary: 6,
        budget_low: 9, budget_5000: 9
    },
    "Аудит резюме": {
        role_job_seeker: 10, level_junior: 9, urgency_fast: 6, importance_salary: 5,
        budget_low: 8, budget_5000: 8
    },
    "Сопроводительное письмо": {
        role_job_seeker: 8, level_junior: 7, urgency_fast: 5,
        budget_low: 7, budget_5000: 7
    },
    "Подготовка к собеседованию (1ч)": {
        role_job_seeker: 9, level_junior: 7, level_middle: 6, urgency_fast: 8,
        importance_salary: 7, budget_5000_15000: 6
    },
    "Резюме специалиста": {
        role_job_seeker: 9, level_middle: 8, urgency_fast: 5, importance_salary: 6,
        budget_5000_15000: 7
    },
    "Индивидуальная консультация (1ч)": {
        role_job_seeker: 9, role_any: 1, level_any: 5, urgency_any: 5,
        importance_any: 5, budget_any: 5
    },
    "Профориентационная диагностика": {
        role_career_change: 10, level_junior: 8, level_middle: 6, urgency_1_2_months: 6,
        importance_career: 7, budget_5000_15000: 6
    },
    "Стратегия поиска работы": {
        role_job_seeker: 9, level_middle: 7, level_senior: 6, urgency_1_2_months: 7,
        importance_salary: 6, budget_15000_50000: 6
    },
    "Резюме руководителя": {
        role_job_seeker: 9, level_lead: 8, level_director: 7, urgency_1_2_months: 6,
        importance_salary: 7, budget_15000_50000: 6
    },
    "Консультация по услугам подбора": {
        role_business: 8, level_any: 5, urgency_any: 4, budget_any: 4
    },
    "Тренинг по переговорам": {
        role_job_seeker: 7, role_growth: 8, level_middle: 7, level_senior: 6,
        importance_salary: 8, urgency_fast: 5, budget_5000_15000: 5
    },
    "Психологическое консультирование (1ч)": {
        role_job_seeker: 6, role_career_change: 7, level_any: 5, importance_balance: 8,
        urgency_1_2_months: 5, budget_5000_15000: 5
    },

    // ---------- B2C: Стандартные (10 000 – 50 000 ₽) ----------
    "Индивидуальный тренинг «Продай себя дорого»": {
        role_job_seeker: 9, level_middle: 8, level_senior: 7, urgency_fast: 7,
        importance_salary: 8, importance_career: 7, budget_15000_50000: 7
    },
    "План развития до Senior": {
        role_job_seeker: 8, role_growth: 10, level_middle: 9, importance_career: 9,
        urgency_1_2_months: 6, budget_15000_50000: 6
    },
    "Развитие управленческих навыков": {
        role_job_seeker: 7, role_growth: 9, level_lead: 8, level_senior: 7,
        importance_career: 8, importance_team: 7, budget_50000_100000: 6
    },
    "Карьерная стратегия (пакет 3 консультации)": {
        role_job_seeker: 9, role_career_change: 8, level_middle: 8, level_senior: 7,
        urgency_1_2_months: 6, importance_career: 8, budget_15000_50000: 7
    },
    "Переговоры о зарплате (1ч)": {
        role_job_seeker: 8, role_growth: 10, level_middle: 7, level_senior: 6,
        importance_salary: 10, urgency_fast: 6, budget_5000_15000: 6
    },
    "Повышение грейда": {
        role_growth: 10, level_middle: 8, level_junior: 7, importance_salary: 9,
        urgency_1_2_months: 7, budget_15000_50000: 5
    },
    "VIP-коучинг": {
        role_job_seeker: 8, role_growth: 7, level_senior: 9, level_lead: 8,
        importance_salary: 8, importance_career: 8, budget_50000_100000: 8
    },
    "Executive-коучинг": {
        role_job_seeker: 9, role_growth: 8, level_senior: 9, level_lead: 9,
        level_director: 9, level_owner: 9, importance_career: 9, budget_100000_300000: 8
    },
    "Стратегия роста до C-level": {
        role_growth: 10, level_senior: 8, level_lead: 9, level_director: 9, level_owner: 9,
        importance_career: 10, budget_100000_300000: 8
    },
    "Подготовка к повышению": {
        role_growth: 9, level_middle: 7, level_senior: 6, importance_salary: 8,
        urgency_1_2_months: 7, budget_15000_50000: 6
    },
    "План обучения": {
        role_growth: 8, level_junior: 7, level_middle: 7, importance_career: 7,
        urgency_1_2_months: 5, budget_15000_50000: 5
    },
    "Поиск работы с гибким графиком": {
        role_job_seeker: 8, importance_balance: 9, level_middle: 6, level_senior: 5,
        urgency_1_2_months: 5, budget_15000_50000: 5
    },
    "LinkedIn-профиль под ключ": {
        role_job_seeker: 8, level_senior: 7, level_lead: 7, urgency_1_2_months: 6,
        importance_salary: 6, budget_15000_50000: 6
    },
    "CV на английском": {
        role_job_seeker: 7, level_middle: 6, level_senior: 7, urgency_1_2_months: 5,
        importance_salary: 5, budget_15000_50000: 5
    },
    "Карьерная стратегия (пакет)": {
        role_job_seeker: 9, role_career_change: 8, level_middle: 8, level_senior: 7,
        urgency_1_2_months: 6, importance_career: 8, budget_15000_50000: 7
    },
    "Коучинг для руководителей": {
        role_growth: 9, role_job_seeker: 7, level_lead: 9, level_director: 8,
        importance_career: 8, importance_team: 7, budget_50000_100000: 8
    },

    // ---------- B2C: Премиальные (от 50 000 ₽) ----------
    "Поиск позиции C-level": {
        role_job_seeker: 9, level_director: 9, level_top: 10, level_owner: 9,
        urgency_fast: 8, importance_salary: 9, budget_300000_500000: 9
    },
    "Коучинг топ-менеджеров": {
        role_growth: 9, level_director: 9, level_top: 10, level_owner: 9,
        importance_career: 9, importance_team: 8, budget_300000_500000: 8
    },
    "Executive-сопровождение": {
        role_job_seeker: 8, role_growth: 8, level_director: 9, level_top: 9, level_owner: 8,
        importance_career: 9, budget_300000_500000: 8, budget_higher: 9
    },

    // ---------- B2B: Поиск сотрудников ----------
    "Диагностика вакансии": {
        role_business: 10, level_any: 5, urgency_fast: 6, budget_low: 7, budget_5000_15000: 7
    },
    "Скрининг резюме": {
        role_business: 10, level_junior: 8, urgency_fast: 7, budget_5000_15000: 8, budget_15000_50000: 7
    },
    "База кандидатов + тестирование": {
        role_business: 10, level_junior: 8, urgency_fast: 6, budget_15000_50000: 8
    },
    "Подбор джуниора (до 5 дней)": {
        role_business: 10, level_junior: 9, urgency_fast: 9, budget_15000_50000: 8, budget_50000_100000: 7
    },
    "Массовый подбор джуниоров": {
        role_business: 10, level_junior: 9, urgency_fast: 8, budget_50000_100000: 8, budget_100000_300000: 7
    },
    "Подбор Middle-специалиста": {
        role_business: 10, level_middle: 9, urgency_fast: 8, budget_50000_100000: 8, budget_100000_300000: 7
    },
    "Классический рекрутинг": {
        role_business: 10, level_middle: 8, level_senior: 7, urgency_1_2_months: 7, budget_50000_100000: 8
    },
    "Аутсорсинг подбора": {
        role_business: 10, level_middle: 7, level_senior: 7, urgency_monthly: 9, budget_100000_300000: 8
    },
    "Подбор Middle+ с кейсами": {
        role_business: 10, level_middle: 9, level_senior: 7, urgency_fast: 8, budget_100000_300000: 9
    },
    "Хэдхантинг Senior-специалиста": {
        role_business: 10, level_senior: 9, urgency_fast: 9, budget_100000_300000: 9, budget_300000_500000: 8, level_owner: 7
    },
    "Executive search Senior": {
        role_business: 10, level_senior: 9, level_lead: 9, level_director: 9, level_owner: 9,
        urgency_fast: 9, budget_300000_500000: 10, budget_higher: 10
    },
    "Эксклюзивный хэдхантинг": {
        role_business: 10, level_director: 9, level_top: 9, level_owner: 9,
        urgency_fast: 9, budget_higher: 10
    },
    "Аутсорсинг подбора (абонемент)": {
        role_business: 10, urgency_monthly: 10, budget_100000_300000: 8, budget_higher: 9
    },
    "Ассессмент стажёров": {
        role_business: 9, level_junior: 8, urgency_1_2_months: 6, budget_15000_50000: 7
    },
    "Подбор специалиста": {
        role_business: 10, level_middle: 8, level_senior: 7, urgency_fast: 7, budget_50000_100000: 8
    },
    "Подбор руководителя": {
        role_business: 10, level_lead: 9, urgency_fast: 8, budget_100000_300000: 9
    },
    "Подбор на долгосрок (Middle)": {
        role_business: 9, level_middle: 8, urgency_3_6_months: 8, budget_100000_300000: 7
    },
    "Хэдхантинг": {
        role_business: 10, level_senior: 8, level_lead: 8, urgency_fast: 8,
        budget_100000_300000: 8, budget_300000_500000: 9, level_owner: 7
    },
    "Поиск Senior+ с гарантией": {
        role_business: 10, level_senior: 9, urgency_fast: 8, budget_100000_300000: 8, budget_300000_500000: 9
    },
    "Подбор руководителя отдела": {
        role_business: 10, level_lead: 9, level_director: 8, urgency_fast: 8, budget_100000_300000: 9, level_owner: 8
    },
    "Постепенный найм джуниоров": {
        role_business: 9, level_junior: 8, urgency_3_6_months: 8, budget_15000_50000: 7
    },
    "Программа стажировки": {
        role_business: 9, level_junior: 8, urgency_3_6_months: 7, budget_50000_100000: 7
    },
    "Подбор на долгосрок (Junior)": {
        role_business: 9, level_junior: 8, urgency_3_6_months: 8, budget_50000_100000: 7
    },
    "Массовый подбор на потоке": {
        role_business: 10, urgency_monthly: 10, budget_100000_300000: 8, budget_higher: 8
    },

    // ---------- Тренинг ----------
    "Групповой тренинг «Продай себя дорого»": {
        role_job_seeker: 7, role_growth: 7, level_any: 5, urgency_1_2_months: 5,
        importance_salary: 6, budget_15000_50000: 6
    }
};

window.ANSWER_MAPPING = {
    "Ищу работу": "role_job_seeker",
    "Хочу сменить профессию": "role_career_change",
    "Рост в текущей компании": "role_growth",
    "Подбираю сотрудников": "role_business",
    "Junior / начинающий": "level_junior",
    "Middle / опытный": "level_middle",
    "Senior / ведущий": "level_senior",
    "Lead / руководитель": "level_lead",
    "Директор / Managing Director": "level_director",
    "Топ-менеджер (C-level)": "level_top",
    "Собственник бизнеса": "level_owner",
    "Максимально быстро": "urgency_fast",
    "1–2 месяца": "urgency_1_2_months",
    "3–6 месяцев": "urgency_3_6_months",
    "В течение года": "urgency_year",
    "Ежемесячно / на постоянной основе": "urgency_monthly",
    "Планирую постепенно": "urgency_slow",
    "Зарплата": "importance_salary",
    "Условия/удаленка": "importance_conditions",
    "Карьерный рост": "importance_career",
    "Команда и ценности": "importance_team",
    "Баланс работы и жизни": "importance_balance",
    "До 5 000 ₽": "budget_low",
    "5 000 – 15 000 ₽": "budget_5000_15000",
    "15 000 – 50 000 ₽": "budget_15000_50000",
    "50 000 – 100 000 ₽": "budget_50000_100000",
    "100 000 – 300 000 ₽": "budget_100000_300000",
    "300 000 – 500 000 ₽": "budget_300000_500000",
    "Выше 500 000 ₽": "budget_higher"
};

window.PRICE_CATEGORY = { base: [], standard: [], premium: [] };