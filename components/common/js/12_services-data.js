// ============================================================
// 12_services-data.js – Полный перечень услуг с ценами и группировкой
// ============================================================
logInit('Начало загрузки SERVICES_DATA', 'INFO', '', 3);
const SERVICES_DATA = {
    recruitment: [
        {name: "Составление вакансии (с УТП)", price: 10000},
        {name: "Подбор резюме под вакансию", price: 15000},
        {name: "База кандидатов + тестирование", price: 20000},
        {name: "Подбор специалиста", price: 40000},
        {name: "Подбор специалиста + гарантия", price: 60000},
        {name: "Составить «Программу стажировки»", price: 70000},
        {name: "Классический рекрутинг", price: 70000},
        {name: "Подбор руководителя", price: 90000},
        {name: "Аутсорсинг подбора (абонемент)", price: 100000},
        {name: "Хэдхантинг", price: 120000},
        {name: "IT Поиск Senior+ с гарантией", price: 150000},
        {name: "IT Хэдхантинг Senior-специалиста", price: 150000},
        {name: "IT Executive search Senior", price: 200000},
        {name: "Эксклюзивный хэдхантинг", price: 250000}
    ],
    retention: [
        {name: "Разработка УТП компании", price: 25000},
        {name: "Оценка компетенций", price: 25000},
        {name: "Оценка управленческого потенциала", price: 50000},
        {name: "Консультация по внедрению гибких форматов", price: 10000},
        {name: "Оценка удовлетворённости персонала", price: null},
        {name: "Разработка программы удержания", price: 120000},
        {name: "Разработка проекта адаптации персонала", price: 250000},
        {name: "HR-стратегия + подбор ключевых людей", price: 300000},
        {name: "Разработка HR-бренда", price: 150000},
        {name: "Стратегическая сессия с собственниками", price: 200000},
        {name: "Стратегическая сессия в компании", price: 13000}
    ],
    "business-training": [
        {name: "Тренинг под запрос (1ч, до 25 чел.)", price: 12000},
        {name: "Стратегическая сессия (1ч, до 12 чел.)", price: 13000},
        {name: "Тренинг «Профилактика выгорания»", price: 12000},
        {name: "Тренинг «Я хочу здесь работать» мотивация", price: 15000},
        {name: "Тренинг «Удержание персонала»", price: 12000},
        {name: "Мастер-класс (3ч, до 25 чел.)", price: 25000}
    ],
    corporate: [
        {name: "Абонемент на HR-консультации", price: 100000},
        {name: "Корпоративная подписка на рекрутинг", price: 200000},
        {name: "HR найди людей – цена от", price: 90000},
        {name: "HR на час", price: 8500},
        {name: "HR реши вопрос – цена от", price: 120000}
    ],
    start: [
        {name: "Экспресс-диагностика (15мин) – Подбор услуги", price: 0},
        {name: "Сопроводительное письмо", price: 3000},
        {name: "Экспресс-консультация (30мин)", price: 3500},
        {name: "Аудит резюме", price: 4000},
        {name: "Профориентация для подростков", price: 6000},
        {name: "Резюме специалиста", price: 6500},
        {name: "Подготовка к собеседованию (1ч)", price: 7000},
        {name: "Тренинг по переговорам", price: 7000},
        {name: "Переговоры о зарплате (1ч)", price: 7000},
        {name: "Индивидуальная консультация (1ч)", price: 7000},
        {name: "Психологическое консультирование (1ч)", price: 7000},
        {name: "Профориентация для взрослых", price: 8000},
        {name: "Стратегия поиска работы", price: 8000},
        {name: "Резюме руководителя", price: 9000},
        {name: "Индивидуальный тренинг «Продай себя дорого»", price: 14000},
        {name: "LinkedIn-профиль под ключ", price: 15000},
        {name: "Резюме (CV) на английском", price: 15000},
        {name: "Стратегия трудоустройства", price: 15000}
    ],
    growth: [
        {name: "Подготовка к повышению", price: 10000},
        {name: "Коучинг для руководителей", price: 10000},
        {name: "План развития (рост в должности)", price: 12000},
        {name: "Повышение грейда", price: 12000},
        {name: "Индивидуальный тренинг «Продай себя дорого»", price: 14000},
        {name: "LinkedIn-профиль под ключ", price: 15000},
        {name: "Резюме (CV) на английском", price: 15000},
        {name: "Развитие управленческих навыков", price: 15000},
        {name: "Стратегия трудоустройства", price: 15000},
        {name: "Карьерная стратегия (пакет 3 консультации)", price: 18000},
        {name: "Коучинг для руководителей (пакет 4 сессии)", price: 30000},
        {name: "Стратегия роста", price: 45000}
    ],
    executive: [
        {name: "Работа «под ключ»", price: 250000},
        {name: "Executive-коучинг/мес", price: 100000},
        {name: "Executive-сопровождение/мес", price: 60000},
        {name: "Поиск позиции C-level", price: 80000},
        {name: "Коучинг топ-менеджеров", price: 150000},
        {name: "VIP-коучинг", price: 30000}
    ],
    training: [
        {name: "Индивидуальный тренинг «Продай себя дорого»", price: 14000},
        {name: "Групповой тренинг «Продай себя дорого»", price: 5500},
        {name: "Наставничество для HR", price: 7000}
    ],
    courses: [
        {name: "Авторский курс «Рекрутер для недвижимости»", price: 25000},
        {name: "Обучение с '0' менеджер по продажам", price: 50000}
    ]
};
window.SERVICES_DATA = SERVICES_DATA;
window.LOCAL_SERVICES = {
    individual_base: (SERVICES_DATA.start || []).filter(item => item.price !== null && item.price > 0 && item.price < 10000).map(item => ({ service: item.name, price: item.price })),
    individual_standard: [
        ...(SERVICES_DATA.start || []).filter(item => item.price !== null && item.price >= 10000 && item.price < 50000).map(item => ({ service: item.name, price: item.price })),
        ...(SERVICES_DATA.growth || []).filter(item => item.price !== null && item.price >= 10000 && item.price < 50000).map(item => ({ service: item.name, price: item.price }))
    ],
    individual_premium: (SERVICES_DATA.executive || []).filter(item => item.price !== null && item.price >= 50000).map(item => ({ service: item.name, price: item.price })),
    business_recruitment: (SERVICES_DATA.recruitment || []).filter(item => item.price !== null).map(item => ({ service: item.name, price: item.price })),
    business_retention: (SERVICES_DATA.retention || []).filter(item => item.price !== null).map(item => ({ service: item.name, price: item.price })),
    training: [
        ...(SERVICES_DATA.training || []).filter(item => item.price !== null).map(item => ({ service: item.name, price: item.price })),
        ...(SERVICES_DATA["business-training"] || []).filter(item => item.price !== null).map(item => ({ service: item.name, price: item.price }))
    ],
    corporate: (SERVICES_DATA.corporate || []).filter(item => item.price !== null).map(item => ({ service: item.name, price: item.price })),
    author_courses: (SERVICES_DATA.courses || []).filter(item => item.price !== null).map(item => ({ service: item.name, price: item.price }))
};
window.PRICE_BOOK = {};
for (const category of Object.values(window.LOCAL_SERVICES)) {
    for (const item of category) { if (!window.PRICE_BOOK[item.service]) window.PRICE_BOOK[item.service] = item.price; }
}
logInit(`SERVICES_DATA загружено, категорий: ${Object.keys(SERVICES_DATA).length}, локальных категорий: ${Object.keys(window.LOCAL_SERVICES).length}`, 'INFO', '', 3);