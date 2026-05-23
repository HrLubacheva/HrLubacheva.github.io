// ========== ДАННЫЕ УСЛУГ ДЛЯ КАЛЬКУЛЯТОРА ==========
window.LOCAL_SERVICES = {
    business: [
        { service: "Подбор специалиста", price: 60000, sort: 1 },
        { service: "Подбор руководителя", price: 90000, sort: 2 },
        { service: "Хэдхантинг", price: 120000, sort: 3 },
        { service: "Онбординг (проект)", price: 250000, sort: 4 },
        { service: "УТП компании", price: 25000, sort: 5 }
    ],
    individual: [
        { service: "Индивидуальная консультация (1ч)", price: 7000, sort: 1 },
        { service: "Экспресс-консультация (30мин)", price: 3500, sort: 2 },
        { service: "Аудит резюме", price: 4000, sort: 3 },
        { service: "Резюме специалиста", price: 6000, sort: 4 },
        { service: "Резюме руководителя", price: 9000, sort: 5 },
        { service: "CV на английском", price: 15000, sort: 6 },
        { service: "Сопроводительное письмо", price: 3000, sort: 7 },
        { service: "Подготовка к собеседованию (1ч)", price: 5000, sort: 10 },
        { service: "Карьерная стратегия (пакет 3 консультации)", price: 18000, sort: 11 },
        { service: "Переговоры о зарплате (1ч)", price: 6000, sort: 12 },
        { service: "LinkedIn-профиль под ключ", price: 12000, sort: 13 },
        { service: "Профориентационная диагностика", price: 8000, sort: 14 },
        { service: "Психологическое консультирование (1ч)", price: 7000, sort: 15 },
        // Добавленные услуги для квиза (цены ориентировочные, вы можете изменить)
        { service: "VIP-коучинг", price: 30000, sort: 16 },
        { service: "Executive-коучинг", price: 50000, sort: 17 },
        { service: "Карьерная стратегия (пакет)", price: 18000, sort: 18 },   // дублирует с пакетом 3 консультаций, но название короче
        { service: "Стратегия трудоустройства", price: 15000, sort: 19 },
        { service: "Поиск позиции C-level", price: 80000, sort: 20 },
        { service: "Поиск топ-позиций", price: 100000, sort: 21 },
        { service: "Executive-сопровождение", price: 60000, sort: 22 },
        { service: "Стратегия поиска работы", price: 8000, sort: 23 },
        { service: "План развития до Senior", price: 12000, sort: 24 },
        { service: "Развитие управленческих навыков", price: 15000, sort: 25 },
        { service: "Подготовка к повышению", price: 10000, sort: 26 },
        { service: "Коучинг для руководителей", price: 25000, sort: 27 },
        { service: "Стратегия роста до C-level", price: 45000, sort: 28 },
        { service: "Переговоры о зарплате", price: 6000, sort: 29 },  // уже есть выше, но для совпадения
        { service: "Повышение грейда", price: 12000, sort: 30 },
        { service: "Массовый подбор джуниоров", price: 30000, sort: 31 },
        { service: "Скрининг резюме", price: 15000, sort: 32 },
        { service: "Подбор джуниора (до 5 дней)", price: 25000, sort: 33 },
        { service: "База кандидатов + тестирование", price: 20000, sort: 34 },
        { service: "Постепенный найм джуниоров", price: 40000, sort: 35 },
        { service: "Ассессмент стажёров", price: 18000, sort: 36 },
        { service: "Подбор на долгосрок (Junior)", price: 50000, sort: 37 },
        { service: "Программа стажировки", price: 60000, sort: 38 },
        { service: "Подбор Middle-специалиста", price: 60000, sort: 39 },
        { service: "Классический рекрутинг", price: 70000, sort: 40 },
        { service: "Подбор Middle+ с кейсами", price: 80000, sort: 41 },
        { service: "Глубокое интервью", price: 10000, sort: 42 },
        { service: "Подбор на долгосрок (Middle)", price: 90000, sort: 43 },
        { service: "Программа удержания", price: 120000, sort: 44 },
        { service: "Хэдхантинг Senior-специалиста", price: 150000, sort: 45 },
        { service: "Картографирование рынка", price: 50000, sort: 46 },
        { service: "Поиск Senior+ с гарантией", price: 120000, sort: 47 },
        { service: "Оценка компетенций", price: 25000, sort: 48 },
        { service: "Executive search Senior", price: 200000, sort: 49 },
        { service: "Эксклюзивный хэдхантинг", price: 250000, sort: 50 },
        { service: "Подбор руководителя отдела", price: 100000, sort: 51 },
        { service: "Оценка управленческого потенциала", price: 40000, sort: 52 },
        { service: "HR-стратегия + подбор ключевых людей", price: 300000, sort: 53 },
        { service: "Коучинг топ-менеджеров", price: 80000, sort: 54 },
        { service: "Консультация по услугам подбора", price: 5000, sort: 55 },
        { service: "Диагностика вакансии", price: 10000, sort: 56 }
    ],
    corporate: [
        { service: "Тренинг по запросу (1ч, до 25 чел.)", price: 12000, sort: 1 },
        { service: "Мастер-класс (3ч, до 25 чел.)", price: 30000, sort: 2 },
        { service: "Стратегическая сессия (1ч, до 12 чел.)", price: 13000, sort: 3 }
    ],
    group: [
        { service: "Индивидуальный тренинг «Продай себя дорого»", price: 14000, sort: 1 },
        { service: "Групповой тренинг «Продай себя дорого»", price: 5500, sort: 2 },
        { service: "Групповой тренинг (до 10 чел.)", price: 5500, sort: 3 },
        { service: "Групповой тренинг (11-20 чел.)", price: 5000, sort: 4 },
        { service: "Групповой тренинг (21+ чел.)", price: 4500, sort: 5 },


    ]
};