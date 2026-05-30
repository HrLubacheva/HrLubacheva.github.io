// ============================================================
// 11_quiz-weights.js – Веса услуг и соответствие ответов ключам
// Добавлены роли: Развиваю сотрудников, Собственник бизнеса, Найти себя / определиться с путём
// Исправлены кавычки для синхронизации с SERVICES_DATA
// ============================================================
window.SERVICE_WEIGHTS = {
    // ========== БАЗОВЫЕ УСЛУГИ ДЛЯ СОИСКАТЕЛЕЙ ==========
    "Экспресс-консультация (30мин)": {
        role_job_seeker:8, role_career_change:7,
        level_junior:9, level_middle:7,
        urgency_fast:10, urgency_1_2_months:7,
        budget_low:10, budget_5000_15000:8,
        work_format_any:5
    },
    "Аудит резюме": {
        role_job_seeker:9, role_career_change:6,
        level_junior:10, level_middle:8, level_senior:6,
        urgency_fast:8, urgency_1_2_months:7,
        importance_salary:6, importance_career:7,
        budget_low:9, budget_5000_15000:8,
        work_format_any:5
    },
    "Сопроводительное письмо": {
        role_job_seeker:8, role_career_change:5,
        level_junior:9, level_middle:6,
        urgency_fast:7,
        budget_low:8, budget_5000_15000:7
    },
    "Подготовка к собеседованию (1ч)": {
        role_job_seeker:9, role_career_change:6,
        level_junior:9, level_middle:8, level_senior:7,
        urgency_fast:10, urgency_1_2_months:7,
        importance_salary:8, importance_career:6,
        budget_5000_15000:8, budget_15000_50000:7,
        work_format_remote:6, work_format_office:6, work_format_hybrid:6
    },
    "Резюме специалиста": {
        role_job_seeker:9,
        level_middle:9, level_senior:8,
        urgency_fast:7, urgency_1_2_months:7,
        importance_salary:7, importance_career:7,
        budget_5000_15000:9, budget_15000_50000:8
    },
    "Индивидуальная консультация (1ч)": {
        role_any:8,
        urgency_any:6,
        importance_any:5,
        budget_any:5,
        work_format_any:5
    },
    "Профориентация для взрослых": {
        role_career_change:10,
        level_junior:8, level_middle:7,
        urgency_1_2_months:8, urgency_3_6_months:7,
        importance_career:9,
        budget_5000_15000:8, budget_15000_50000:7,
        work_format_any:5
    },
    "Профориентация для подростков": {
        role_career_change:9,
        level_junior:9,
        urgency_1_2_months:7,
        importance_career:8,
        budget_5000_15000:8,
        work_format_any:5
    },
    "Стратегия поиска работы": {
        role_job_seeker:9, role_career_change:8,
        level_middle:8, level_senior:8,
        urgency_1_2_months:9, urgency_3_6_months:7,
        importance_salary:7, importance_career:8,
        budget_15000_50000:9, budget_5000_15000:7,
        work_format_remote:7, work_format_office:7, work_format_hybrid:7
    },
    "Резюме руководителя": {
        role_job_seeker:9,
        level_lead:10, level_director:9, level_top:8,
        urgency_1_2_months:8,
        importance_salary:8, importance_career:8,
        budget_15000_50000:9, budget_50000_100000:8
    },
    "Тренинг по переговорам": {
        role_job_seeker:7, role_growth:8,
        level_middle:8, level_senior:8,
        urgency_fast:7,
        importance_salary:10,
        budget_5000_15000:7, budget_15000_50000:7,
        work_format_remote:6, work_format_office:8, work_format_hybrid:7
    },
    "Психологическое консультирование (1ч)": {
        role_job_seeker:6, role_career_change:7,
        level_any:5,
        urgency_1_2_months:5,
        importance_balance:10,
        budget_5000_15000:7,
        work_format_remote:8, work_format_office:6, work_format_hybrid:7
    },
    "Переговоры о зарплате (1ч)": {
        role_job_seeker:8, role_growth:9,
        level_middle:8, level_senior:8,
        urgency_fast:9,
        importance_salary:10,
        budget_5000_15000:8, budget_15000_50000:7,
        work_format_remote:6, work_format_office:6, work_format_hybrid:6
    },

    // ========== ПРОДВИНУТЫЕ УСЛУГИ ==========
    "Индивидуальный тренинг «Продай себя дорого»": {
        role_job_seeker:9, role_growth:8,
        level_middle:9, level_senior:9,
        urgency_fast:8, urgency_1_2_months:7,
        importance_salary:9, importance_career:8,
        budget_15000_50000:9, budget_5000_15000:6,
        work_format_remote:7, work_format_office:8, work_format_hybrid:8
    },
    "План развития (рост в должности)": {
        role_growth:10, role_develop_employees:7,
        level_middle:9, level_senior:8,
        urgency_1_2_months:8, urgency_3_6_months:7,
        importance_career:10,
        budget_15000_50000:9, budget_5000_15000:7
    },
    "Повышение грейда": {
        role_growth:10,
        level_middle:9, level_senior:8,
        urgency_1_2_months:9,
        importance_salary:9, importance_career:8,
        budget_15000_50000:8
    },
    "Развитие управленческих навыков": {
        role_growth:10, role_develop_employees:9,
        level_lead:10, level_director:9,
        urgency_1_2_months:8, urgency_3_6_months:7,
        importance_career:9, importance_team:8,
        budget_50000_100000:9, budget_15000_50000:7,
        work_format_remote:6, work_format_office:9, work_format_hybrid:8
    },
    "Карьерная стратегия (пакет 3 консультации)": {
        role_job_seeker:9, role_career_change:9, role_growth:8,
        level_middle:9, level_senior:9,
        urgency_1_2_months:8, urgency_3_6_months:7,
        importance_career:9, importance_salary:7,
        budget_15000_50000:10, budget_50000_100000:8,
        work_format_any:5
    },
    "Коучинг для руководителей": {
        role_growth:9, role_develop_employees:8, role_business_owner:7,
        level_lead:10, level_director:9, level_top:8,
        urgency_1_2_months:8,
        importance_career:9, importance_team:8,
        budget_50000_100000:9, budget_15000_50000:7,
        work_format_remote:7, work_format_office:9, work_format_hybrid:8
    },
    "Коучинг для руководителей (пакет 4 сессии)": {
        role_growth:9, role_develop_employees:8, role_business_owner:7,
        level_lead:10, level_director:9,
        urgency_1_2_months:7,
        importance_career:9,
        budget_50000_100000:10,
        work_format_remote:7, work_format_office:9, work_format_hybrid:8
    },

    // ========== ПРЕМИУМ-УСЛУГИ ==========
    "VIP-коучинг": {
        role_growth:8, role_job_seeker:7, role_business_owner:9,
        level_senior:9, level_lead:9, level_director:8,
        urgency_1_2_months:7,
        importance_career:9, importance_salary:8,
        budget_50000_100000:9, budget_100000_300000:9,
        work_format_remote:7, work_format_office:8, work_format_hybrid:8
    },
    "Стратегия роста": {
        role_growth:10, role_develop_employees:8, role_business_owner:9,
        level_senior:8, level_lead:9, level_director:9, level_top:9,
        urgency_3_6_months:8,
        importance_career:10,
        budget_100000_300000:10, budget_50000_100000:8
    },
    "Executive-коучинг/мес": {
        role_growth:9, role_develop_employees:8, role_business_owner:10,
        level_director:9, level_top:10,
        urgency_1_2_months:8,
        importance_career:10,
        budget_100000_300000:10,
        work_format_remote:7, work_format_office:9, work_format_hybrid:8
    },
    "Executive-сопровождение/мес": {
        role_growth:8, role_develop_employees:7, role_business_owner:10,
        level_director:9, level_top:10,
        urgency_3_6_months:8,
        importance_career:9,
        budget_300000_500000:10, budget_higher:9,
        work_format_remote:7, work_format_office:9, work_format_hybrid:8
    },
    "Поиск позиции C-level": {
        role_job_seeker:10, role_business_owner:8,
        level_top:10, level_director:9,
        urgency_fast:9,
        importance_salary:9, importance_career:8,
        budget_300000_500000:10, budget_higher:10,
        work_format_any:5
    },
    "Коучинг топ-менеджеров": {
        role_growth:9, role_develop_employees:8, role_business_owner:10,
        level_top:10, level_director:9,
        urgency_1_2_months:8,
        importance_career:9,
        budget_300000_500000:10, budget_higher:9,
        work_format_remote:7, work_format_office:9, work_format_hybrid:8
    },

    // ========== УСЛУГИ ДЛЯ БИЗНЕСА (с учётом отрасли) ==========
    "Составление вакансии (с УТП)": {
        role_business:10,
        level_junior:8, level_middle:7,
        urgency_fast:9, urgency_1_2_months:7,
        budget_5000_15000:9, budget_15000_50000:8,
        industry_it:8, industry_sales:9, industry_hr:9, industry_other:7
    },
    "Подбор резюме под вакансию": {
        role_business:10,
        level_junior:9, level_middle:8,
        urgency_fast:10,
        budget_15000_50000:9, budget_5000_15000:8,
        industry_it:9, industry_sales:8, industry_hr:8, industry_other:7
    },
    "База кандидатов + тестирование": {
        role_business:10,
        level_junior:9,
        urgency_fast:8, urgency_1_2_months:7,
        budget_15000_50000:9,
        industry_it:9, industry_sales:8, industry_hr:8, industry_other:7
    },
    "Составить «Программу стажировки»": {
        role_business:9, role_develop_employees:8,
        level_junior:9,
        urgency_3_6_months:9,
        budget_50000_100000:9, budget_15000_50000:7,
        industry_it:9, industry_sales:8, industry_hr:9, industry_other:7
    },
    "Подбор специалиста + гарантия": {
        role_business:10,
        level_middle:9, level_senior:8,
        urgency_fast:10,
        budget_50000_100000:10, budget_100000_300000:9,
        industry_it:10, industry_sales:9, industry_hr:9, industry_other:8
    },
    "Классический рекрутинг": {
        role_business:10,
        level_middle:9, level_senior:8,
        urgency_1_2_months:9,
        budget_50000_100000:9, budget_100000_300000:8,
        industry_it:9, industry_sales:8, industry_hr:8, industry_other:7
    },
    "Подбор руководителя": {
        role_business:10, role_develop_employees:7,
        level_lead:10, level_director:9,
        urgency_fast:9, urgency_1_2_months:8,
        budget_100000_300000:10, budget_50000_100000:8,
        industry_it:10, industry_sales:9, industry_hr:9, industry_other:8
    },
    "Аутсорсинг подбора (абонемент)": {
        role_business:10,
        urgency_monthly:10,
        budget_100000_300000:10, budget_higher:9,
        industry_it:10, industry_sales:9, industry_hr:9, industry_other:8
    },
    "Хэдхантинг": {
        role_business:10,
        level_senior:9, level_lead:9,
        urgency_fast:10,
        budget_100000_300000:10, budget_300000_500000:9,
        industry_it:10, industry_sales:9, industry_hr:9, industry_other:8
    },
    "IT Поиск Senior+ с гарантией": {
        role_business:10,
        level_senior:10,
        urgency_fast:10,
        budget_100000_300000:10, budget_300000_500000:10,
        industry_it:10, industry_sales:5, industry_hr:5, industry_other:5
    },
    "IT Хэдхантинг Senior-специалиста": {
        role_business:10,
        level_senior:10,
        urgency_fast:10,
        budget_100000_300000:10,
        industry_it:10, industry_sales:5, industry_hr:5, industry_other:5
    },
    "IT Executive search Senior": {
        role_business:10,
        level_senior:10, level_lead:9,
        urgency_fast:10,
        budget_300000_500000:10, budget_higher:10,
        industry_it:10, industry_sales:5, industry_hr:5, industry_other:5
    },
    "Эксклюзивный хэдхантинг": {
        role_business:10, role_business_owner:9,
        level_director:10, level_top:10, level_owner:9,
        urgency_fast:10,
        budget_higher:10, budget_300000_500000:10,
        industry_it:10, industry_sales:9, industry_hr:9, industry_other:9
    },
    "Подбор специалиста": {
        role_business:10,
        level_middle:9, level_junior:8,
        urgency_fast:8, urgency_1_2_months:7,
        budget_50000_100000:9, budget_15000_50000:8,
        industry_it:9, industry_sales:8, industry_hr:8, industry_other:7
    },

    // ========== УДЕРЖАНИЕ И РАЗВИТИЕ ==========
    "Оценка компетенций": {
        role_business:8, role_develop_employees:9,
        level_lead:8, level_director:7,
        urgency_1_2_months:8,
        budget_15000_50000:8,
        industry_any:5
    },
    "Оценка управленческого потенциала": {
        role_business:9, role_develop_employees:10,
        level_lead:9, level_director:9, level_top:8,
        urgency_3_6_months:9,
        importance_career:8,
        budget_50000_100000:9,
        industry_any:5
    },
    "Разработка программы удержания": {
        role_business:9, role_develop_employees:9,
        level_lead:8, level_director:8,
        urgency_3_6_months:9,
        importance_team:9,
        budget_50000_100000:9,
        industry_hr:9, industry_other:7
    },
    "Разработка проекта адаптации персонала": {
        role_business:9, role_develop_employees:10,
        level_lead:7, level_director:8,
        urgency_3_6_months:9,
        importance_team:8,
        budget_100000_300000:9,
        industry_any:7
    },
    "Разработка HR-бренда": {
        role_business:9, role_develop_employees:8, role_business_owner:8,
        level_director:8, level_top:7,
        urgency_3_6_months:8,
        importance_team:7,
        budget_100000_300000:9,
        industry_any:7
    },
    "Стратегическая сессия с собственниками": {
        role_business:9, role_business_owner:10, role_develop_employees:9,
        level_top:10, level_director:9,
        urgency_1_2_months:8,
        importance_career:9,
        budget_100000_300000:10,
        industry_any:8
    },
    "HR-стратегия + подбор ключевых людей": {
        role_business:10, role_develop_employees:9, role_business_owner:10,
        level_director:10, level_top:10,
        urgency_3_6_months:9,
        importance_career:10,
        budget_300000_500000:10,
        industry_any:9
    },
    "Абонемент на HR-консультации": {
        role_business:9, role_develop_employees:7, role_business_owner:7,
        urgency_monthly:10,
        budget_50000_100000:9,
        industry_any:6
    },
    "Корпоративная подписка на рекрутинг": {
        role_business:10, role_develop_employees:6,
        urgency_monthly:10,
        budget_100000_300000:9,
        industry_any:7
    },

    // ========== ТРЕНИНГИ ==========
    "Групповой тренинг «Продай себя дорого»": {
        role_job_seeker:7, role_growth:7, role_develop_employees:6,
        level_any:5,
        urgency_1_2_months:6,
        importance_salary:6,
        budget_15000_50000:8, budget_5000_15000:7,
        work_format_remote:8, work_format_office:8, work_format_hybrid:9
    },
    "Тренинг под запрос (1ч, до 25 чел.)": {
        role_business:9, role_develop_employees:8,
        urgency_fast:9,
        budget_15000_50000:9, budget_5000_15000:8,
        work_format_remote:8, work_format_office:10, work_format_hybrid:9,
        industry_it:8, industry_sales:9, industry_hr:9, industry_other:8
    },
    "Тренинг «Удержание персонала»": {
        role_business:9, role_develop_employees:9,
        urgency_1_2_months:8,
        budget_50000_100000:9, budget_15000_50000:7,
        industry_it:8, industry_sales:8, industry_hr:10, industry_other:8
    },
    "Тренинг «Профилактика выгорания»": {
        role_business:8, role_develop_employees:8,
        urgency_1_2_months:7,
        importance_balance:9,
        budget_15000_50000:8,
        work_format_remote:9, work_format_office:7, work_format_hybrid:8,
        industry_any:5
    },
    "Тренинг «Я хочу здесь работать» мотивация": {
        role_business:8, role_develop_employees:7,
        urgency_fast:8,
        budget_15000_50000:8,
        industry_any:7
    },
    "Мастер-класс (3ч, до 25 чел.)": {
        role_business:8, role_develop_employees:7,
        urgency_1_2_months:7,
        budget_15000_50000:8,
        work_format_office:9, work_format_hybrid:7,
        industry_any:6
    },

    // ========== КУРСЫ ==========
    "Авторский курс «Рекрутер для недвижимости»": {
        role_business:9, role_career_change:8, role_develop_employees:7,
        level_junior:8, level_middle:8,
        urgency_1_2_months:8, urgency_3_6_months:7,
        importance_career:8, importance_salary:7,
        budget_15000_50000:9, budget_5000_15000:7,
        industry_hr:9, industry_other:7
    },
    "Обучение с '0' менеджер по продажам": {
        role_business:9, role_career_change:9, role_develop_employees:8,
        level_junior:10, level_middle:8,
        urgency_1_2_months:8, urgency_3_6_months:8,
        importance_career:9, importance_salary:8,
        budget_50000_100000:9, budget_15000_50000:8,
        industry_sales:10, industry_other:7
    },

    // ========== ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ (retention/corporate) ==========
    "Консультация по внедрению гибких форматов": {
        role_business:7, role_develop_employees:6,
        urgency_1_2_months:6,
        budget_5000_15000:7,
        industry_it:6, industry_hr:6
    },
    "Оценка удовлетворённости персонала": {
        role_business:8, role_develop_employees:8,
        urgency_3_6_months:7,
        budget_15000_50000:8,
        industry_hr:8
    },
    "Стратегическая сессия в компании": {
        role_business:8, role_develop_employees:7,
        urgency_1_2_months:7,
        budget_15000_50000:8,
        industry_any:6
    },
    "HR найди людей – цена от": {
        role_business:9,
        urgency_fast:8,
        budget_50000_100000:8,
        industry_any:7
    },
    "HR на час": {
        role_business:8,
        urgency_fast:8,
        budget_5000_15000:8,
        industry_any:6
    },
    "HR реши вопрос – цена от": {
        role_business:8,
        urgency_1_2_months:7,
        budget_50000_100000:8,
        industry_any:7
    },
    "Наставничество для HR": {
        role_business:7, role_develop_employees:8,
        level_middle:7,
        urgency_1_2_months:6,
        budget_5000_15000:7,
        industry_hr:8
    }
};

window.ANSWER_MAPPING = {
    // Основные роли
    "Ищу работу": "role_job_seeker",
    "Хочу сменить профессию": "role_career_change",
    "Рост в текущей компании": "role_growth",
    "Подбираю сотрудников": "role_business",
    "Развиваю сотрудников": "role_develop_employees",
    "Найти себя / определиться с путём": "role_career_change",
    // Уровни
    "Junior / начинающий": "level_junior",
    "Middle / опытный": "level_middle",
    "Senior / ведущий": "level_senior",
    "Lead / руководитель": "level_lead",
    "Директор / Managing Director": "level_director",
    "Топ-менеджер (C-level)": "level_top",
    "Собственник бизнеса": "level_owner",
    // Срочность
    "Максимально быстро": "urgency_fast",
    "1–2 месяца": "urgency_1_2_months",
    "3–6 месяцев": "urgency_3_6_months",
    "В течение года": "urgency_year",
    "Ежемесячно / на постоянной основе": "urgency_monthly",
    "Планирую постепенно": "urgency_slow",
    // Важность
    "Зарплата": "importance_salary",
    "Условия/удаленка": "importance_conditions",
    "Карьерный рост": "importance_career",
    "Команда и ценности": "importance_team",
    "Баланс работы и жизни": "importance_balance",
    // Бюджет
    "До 5 000 ₽": "budget_low",
    "5 000 – 15 000 ₽": "budget_5000_15000",
    "15 000 – 50 000 ₽": "budget_15000_50000",
    "50 000 – 100 000 ₽": "budget_50000_100000",
    "100 000 – 300 000 ₽": "budget_100000_300000",
    "300 000 – 500 000 ₽": "budget_300000_500000",
    "Выше 500 000 ₽": "budget_higher",
    // Отрасль
    "IT / Технологии": "industry_it",
    "Продажи / Маркетинг": "industry_sales",
    "HR / Управление персоналом": "industry_hr",
    "Другое": "industry_other",
    // Формат работы
    "Офлайн / В офисе": "work_format_office",
    "Онлайн / Удалённо": "work_format_remote",
    "Гибридный (смешанный)": "work_format_hybrid"
};

if (window.IS_DEV) console.log("✅ SERVICE_WEIGHTS и ANSWER_MAPPING загружены (с полной поддержкой развития сотрудников, собственников и поиска себя)");