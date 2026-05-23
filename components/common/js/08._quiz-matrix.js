// ========== ПОЛНАЯ МАТРИЦА ВАРИАНТОВ КВИЗА (с учётом уровня для рекрутеров) ==========
window.VARIANTS_MATRIX = [
    // ==================== ДЛЯ СОИСКАТЕЛЕЙ (ИЩУ РАБОТУ) ====================

    // JUNIOR
    { priority: 10, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Зарплата", budget: "До 5 000 ₽", variantA: "Тариф «Бронзовый»", variantB: "Экспресс-консультация" },
    { priority: 11, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Зарплата", budget: "5 000 – 15 000 ₽", variantA: "Тариф «Серебряный»", variantB: "Резюме специалиста" },
    { priority: 12, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Зарплата", budget: "15 000 – 50 000 ₽", variantA: "Тариф «Золотой»", variantB: "Индивидуальный карьерный коучинг" },
    { priority: 13, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Условия/удаленка", budget: "*", variantA: "Тариф «Серебряный» + самопрезентация", variantB: "Экспресс-консультация" },
    { priority: 14, role: "Ищу работу", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Карьерный рост", budget: "*", variantA: "Тариф «Серебряный» + план развития", variantB: "Групповой тренинг" },
    { priority: 15, role: "Ищу работу", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "Зарплата", budget: "До 5 000 ₽", variantA: "Тариф «Бронзовый»", variantB: "Аудит резюме" },
    { priority: 16, role: "Ищу работу", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "Зарплата", budget: "5 000 – 15 000 ₽", variantA: "Тариф «Серебряный»", variantB: "Резюме специалиста" },
    { priority: 17, role: "Ищу работу", level: "Junior / начинающий", urgency: "3–6 месяцев", importance: "*", budget: "*", variantA: "Тариф «Бронзовый»", variantB: "План развития навыков" },

    // MIDDLE
    { priority: 20, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "5 000 – 15 000 ₽", variantA: "Тариф «Серебряный»", variantB: "Групповой тренинг" },
    { priority: 21, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "15 000 – 50 000 ₽", variantA: "Тариф «Серебряный»", variantB: "Подготовка к сложным интервью" },
    { priority: 22, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "50 000 – 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "Индивидуальный коучинг" },
    { priority: 23, role: "Ищу работу", level: "Middle / опытный", urgency: "1–2 месяца", importance: "Зарплата", budget: "*", variantA: "Тариф «Серебряный»", variantB: "Тренинг по переговорам" },
    { priority: 24, role: "Ищу работу", level: "Middle / опытный", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Тариф «Серебряный»", variantB: "Развитие управленческих навыков" },
    { priority: 25, role: "Ищу работу", level: "Middle / опытный", urgency: "3–6 месяцев", importance: "*", budget: "*", variantA: "Тариф «Серебряный»", variantB: "План прокачки экспертизы" },
    { priority: 26, role: "Ищу работу", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Зарплата", budget: "Выше 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "Индивидуальный коучинг" },

    // SENIOR
    { priority: 30, role: "Ищу работу", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Зарплата", budget: "15 000 – 50 000 ₽", variantA: "Тариф «Золотой»", variantB: "Карьерная сессия" },
    { priority: 31, role: "Ищу работу", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Зарплата", budget: "50 000 – 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "VIP-сопровождение" },
    { priority: 32, role: "Ищу работу", level: "Senior / ведущий", urgency: "1–2 месяца", importance: "*", budget: "*", variantA: "Тариф «Серебряный»", variantB: "Подготовка к собеседованию" },
    { priority: 33, role: "Ищу работу", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Зарплата", budget: "Выше 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "VIP-коучинг" },

    // TEAM LEAD / LEAD
    { priority: 35, role: "Ищу работу", level: "Team Lead", urgency: "Максимально быстро", importance: "*", budget: "*", variantA: "Тариф «Золотой»", variantB: "Карьерный коучинг" },
    { priority: 40, role: "Ищу работу", level: "Lead / руководитель", urgency: "*", importance: "*", budget: "50 000 – 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "Стратегия развития" },
    { priority: 41, role: "Ищу работу", level: "Lead / руководитель", urgency: "*", importance: "*", budget: "*", variantA: "Тариф «Золотой»", variantB: "Карьерная стратегия" },
    { priority: 42, role: "Ищу работу", level: "Lead / руководитель", urgency: "Максимально быстро", importance: "Зарплата", budget: "Выше 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "Поиск позиции" },

    // ==================== ДЛЯ ЖЕЛАЮЩИХ СМЕНИТЬ ПРОФЕССИЮ ====================
    { priority: 100, role: "Хочу сменить профессию", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "*", budget: "До 5 000 ₽", variantA: "Профориентационная диагностика", variantB: "Тест на склонности" },
    { priority: 101, role: "Хочу сменить профессию", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "*", budget: "5 000 – 15 000 ₽", variantA: "Карьерная консультация + дорожная карта", variantB: "Индивидуальная консультация" },
    { priority: 102, role: "Хочу сменить профессию", level: "Middle / опытный", urgency: "*", importance: "*", budget: "*", variantA: "Аудит навыков + план перехода", variantB: "Менторство от эксперта" },

    // ==================== ДЛЯ РОСТА В ТЕКУЩЕЙ КОМПАНИИ ====================
    { priority: 200, role: "Рост в текущей компании", level: "*", urgency: "1–2 месяца", importance: "Зарплата", budget: "*", variantA: "Переговорная стратегия", variantB: "Аудит эффективности" },
    { priority: 201, role: "Рост в текущей компании", level: "*", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Подготовка к повышению", variantB: "План развития" },
    { priority: 202, role: "Рост в текущей компании", level: "Senior / ведущий", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Подготовка к роли тимлида", variantB: "Управленческие компетенции" },
    { priority: 203, role: "Рост в текущей компании", level: "Lead / руководитель", urgency: "1–2 месяца", importance: "Карьерный рост", budget: "*", variantA: "Коучинг для руководителей", variantB: "Стратегия роста до C-level" },

    // ==================== ДЛЯ РЕКРУТЕРОВ (ПОДБИРАЮ СОТРУДНИКОВ) С УЧЁТОМ УРОВНЯ ====================
    // Junior
    { priority: 305, role: "Подбираю сотрудников", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "До 30 000 ₽", variantA: "Массовый подбор джуниоров", variantB: "Скрининг резюме" },
    { priority: 306, role: "Подбираю сотрудников", level: "Junior / начинающий", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "30 000 – 60 000 ₽", variantA: "Подбор джуниора (до 5 дней)", variantB: "База кандидатов + тестирование" },
    { priority: 307, role: "Подбираю сотрудников", level: "Junior / начинающий", urgency: "1–2 месяца", importance: "Профессиональный опыт", budget: "30 000 – 60 000 ₽", variantA: "Постепенный найм джуниоров", variantB: "Ассессмент стажёров" },
    { priority: 308, role: "Подбираю сотрудников", level: "Junior / начинающий", urgency: "3–6 месяцев", importance: "Мотивация и лояльность", budget: "60 000 – 120 000 ₽", variantA: "Подбор на долгосрок (Junior)", variantB: "Программа стажировки" },

    // Middle
    { priority: 309, role: "Подбираю сотрудников", level: "Middle / опытный", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "60 000 – 120 000 ₽", variantA: "Подбор Middle-специалиста", variantB: "Классический рекрутинг" },
    { priority: 310, role: "Подбираю сотрудников", level: "Middle / опытный", urgency: "1–2 месяца", importance: "Профессиональный опыт", budget: "60 000 – 120 000 ₽", variantA: "Подбор Middle+ с кейсами", variantB: "Глубокое интервью" },
    { priority: 311, role: "Подбираю сотрудников", level: "Middle / опытный", urgency: "3–6 месяцев", importance: "Мотивация и лояльность", budget: "120 000 – 250 000 ₽", variantA: "Подбор на долгосрок (Middle)", variantB: "Программа удержания" },

    // Senior
    { priority: 312, role: "Подбираю сотрудников", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "120 000 – 250 000 ₽", variantA: "Хэдхантинг Senior-специалиста", variantB: "Картографирование рынка" },
    { priority: 313, role: "Подбираю сотрудников", level: "Senior / ведущий", urgency: "1–2 месяца", importance: "Профессиональный опыт", budget: "120 000 – 250 000 ₽", variantA: "Поиск Senior+ с гарантией", variantB: "Оценка компетенций" },
    { priority: 314, role: "Подбираю сотрудников", level: "Senior / ведущий", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "Выше 250 000 ₽", variantA: "Executive search Senior", variantB: "Эксклюзивный хэдхантинг" },

    // Lead / Руководитель
    { priority: 315, role: "Подбираю сотрудников", level: "Lead / руководитель", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "120 000 – 250 000 ₽", variantA: "Подбор руководителя отдела", variantB: "Оценка управленческого потенциала" },
    { priority: 316, role: "Подбираю сотрудников", level: "Lead / руководитель", urgency: "Максимально быстро", importance: "Скорость закрытия", budget: "Выше 250 000 ₽", variantA: "Executive search (топ-менеджеры)", variantB: "VIP-хэдхантинг" },
    { priority: 317, role: "Подбираю сотрудников", level: "Lead / руководитель", urgency: "1–2 месяца", importance: "Мотивация и лояльность", budget: "Выше 250 000 ₽", variantA: "HR-стратегия + подбор ключевых людей", variantB: "Коучинг топ-менеджеров" },

    // Базовые правила для рекрутеров (если уровень не указан)
    { priority: 330, role: "Подбираю сотрудников", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Консультация по услугам", variantB: "Диагностика вакансии" },

    // ==================== УНИВЕРСАЛЬНЫЕ (FALLBACK) ====================
    { priority: 900, role: "*", level: "*", urgency: "*", importance: "*", budget: "До 5 000 ₽", variantA: "Тариф «Бронзовый»", variantB: "Аудит резюме" },
    { priority: 901, role: "*", level: "*", urgency: "*", importance: "*", budget: "5 000 – 15 000 ₽", variantA: "Тариф «Серебряный»", variantB: "Резюме специалиста" },
    { priority: 902, role: "*", level: "*", urgency: "*", importance: "*", budget: "15 000 – 50 000 ₽", variantA: "Тариф «Серебряный»", variantB: "Индивидуальный тренинг" },
    { priority: 903, role: "*", level: "*", urgency: "*", importance: "*", budget: "50 000 – 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "VIP-коучинг" },
    { priority: 904, role: "*", level: "*", urgency: "*", importance: "*", budget: "Выше 100 000 ₽", variantA: "Тариф «Золотой»", variantB: "Индивидуальный коучинг" },

    // ==================== АБСОЛЮТНЫЙ FALLBACK ====================
    { priority: 999, role: "*", level: "*", urgency: "*", importance: "*", budget: "*", variantA: "Индивидуальная консультация", variantB: "Экспресс-консультация" }
];