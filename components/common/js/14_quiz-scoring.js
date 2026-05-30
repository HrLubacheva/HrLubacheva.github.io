// ============================================================
// 14_quiz-scoring.js – Расчёт баллов и подбор услуг (2-4 варианта)
// Поддержка ролей: Развиваю сотрудников, Собственник бизнеса
// Категории приведены в соответствие с калькулятором
// ============================================================
(function() {
    const CATEGORY_DISPLAY_NAMES = {
        business_recruitment: 'Подбор персонала',
        business_retention: 'Удержание и развитие',
        individual_base: 'Ищу работу',
        individual_standard: 'Карьерный рост',
        individual_premium: 'Премиум',
        training: 'Тренинги',
        corporate: 'HR под ключ',
        author_courses: 'Авторские курсы'
    };

    function buildServiceCategoryMap() {
        const map = {};
        if (!window.LOCAL_SERVICES) return map;
        for (const [cat, items] of Object.entries(window.LOCAL_SERVICES)) {
            const displayName = CATEGORY_DISPLAY_NAMES[cat] || cat;
            for (const item of items) map[item.service] = displayName;
        }
        return map;
    }

    function getServiceCategory(serviceName) {
        if (!window.SERVICE_CATEGORY_MAP) window.SERVICE_CATEGORY_MAP = buildServiceCategoryMap();
        return window.SERVICE_CATEGORY_MAP[serviceName] || '📌 Рекомендация';
    }

    function formatServiceWithCategory(serviceName) {
        return `${getServiceCategory(serviceName)} — ${serviceName}`;
    }

    function getNumericPrice(serviceName) {
        if (window.PRICE_BOOK && window.PRICE_BOOK[serviceName] !== undefined) return window.PRICE_BOOK[serviceName];
        return null;
    }

    function getUserPriceSegment(answersArr) {
        const level = answersArr[1];
        const budget = answersArr[4];
        const expensiveLevels = ["Senior / ведущий", "Lead / руководитель", "Топ-менеджер (C-level)", "Директор / Managing Director"];
        const isExpensiveByLevel = expensiveLevels.includes(level);
        const expensiveBudgets = ["50 000 – 100 000 ₽", "100 000 – 300 000 ₽"];
        const isExpensiveByBudget = expensiveBudgets.includes(budget);
        if (isExpensiveByLevel || isExpensiveByBudget) return "expensive";
        const cheapLevels = ["Junior / начинающий", "Middle / опытный"];
        const isCheapByLevel = cheapLevels.includes(level);
        const cheapBudgets = ["До 5 000 ₽", "5 000 – 15 000 ₽"];
        const isCheapByBudget = cheapBudgets.includes(budget);
        if (isCheapByLevel && isCheapByBudget) return "cheap";
        return "middle";
    }

    function isServiceAllowed(service, userRole, userSegment) {
        const isBusinessService = (service.includes("подбор") || service.includes("рекрутинг") ||
            service.includes("хэдхантинг") || service.includes("аутсорсинг") ||
            service.includes("вакансии") || service.includes("кандидатов") ||
            service.includes("стажировки") || service.includes("Программу стажировки") ||
            service.includes("Авторский курс") || service.includes("Обучение с '0'") ||
            service.includes("Корпоративная") || service.includes("Абонемент") ||
            service === "База кандидатов + тестирование" ||
            service === "Подбор резюме под вакансию" ||
            service === "Составление вакансии (с УТП)" ||
            service === "Тренинг под запрос (1ч, до 25 чел.)" ||
            service === "Стратегическая сессия (1ч, до 12 чел.)" ||
            service === "Мастер-класс (3ч, до 25 чел.)" ||
            service === "Тренинг 'Удержание персонала'" ||
            service === "Тренинг 'Профилактика выгорания'");

        const isBusinessUser = (userRole === "Подбираю сотрудников" ||
                                userRole === "Развиваю сотрудников" ||
                                userRole === "Собственник бизнеса");

        if (isBusinessService && !isBusinessUser) return false;
        if (!isBusinessService && isBusinessUser && userRole !== "Собственник бизнеса") {
            if (!service.includes("VIP") && !service.includes("Executive") && !service.includes("Коучинг топ") && !service.includes("Стратегия роста"))
                return false;
        }
        if (!isBusinessService) {
            const price = getNumericPrice(service);
            if (price === 0) return false;
            if (price === null) return true;
            if (userSegment === "expensive" && price < 10000) return false;
            if (userSegment === "cheap" && price >= 50000) return false;
        }
        return true;
    }

    window.getTopServices = function(answersArr) {
        logInit(`getTopServices вызван с answers: ${JSON.stringify(answersArr)}`, 'INFO', '', 4);
        let weights = window.SERVICE_WEIGHTS;
        let mapping = window.ANSWER_MAPPING;
        if (!weights || Object.keys(weights).length === 0 || !mapping) {
            logInit('SERVICE_WEIGHTS или ANSWER_MAPPING не загружены', 'ERROR', '', 1);
            return {
                services: [
                    { service: "Индивидуальная консультация (1ч)", price: "7 000 ₽", formatted: "Ищу работу — Индивидуальная консультация (1ч)", score: 0 },
                    { service: "Экспресс-консультация (30мин)", price: "3 500 ₽", formatted: "Ищу работу — Экспресс-консультация (30мин)", score: 0 }
                ]
            };
        }
        const userRole = answersArr[0];
        const userSegment = getUserPriceSegment(answersArr);
        const userKeys = [];
        for (let i = 0; i < answersArr.length; i++) {
            const answer = answersArr[i];
            if (answer && mapping[answer]) userKeys.push(mapping[answer]);
        }
        if (userRole === "Подбираю сотрудников") userKeys.push("role_business");
        else if (userRole === "Развиваю сотрудников") userKeys.push("role_develop_employees");
        else if (userRole === "Собственник бизнеса") userKeys.push("role_business_owner");
        else if (userRole === "Хочу вырасти в текущей компании") userKeys.push("role_growth");
        else if (userRole === "Хочу сменить профессию") userKeys.push("role_career_change");
        else if (userRole === "Ищу работу") userKeys.push("role_job_seeker");

        const scores = [];
        for (const [service, weightObj] of Object.entries(weights)) {
            if (!isServiceAllowed(service, userRole, userSegment)) continue;
            let total = 0;
            for (const key of userKeys) if (weightObj[key]) total += weightObj[key];
            if (total === 0 && weightObj.role_any) total = weightObj.role_any;
            if (total > 0) {
                const price = getNumericPrice(service);
                scores.push({
                    service: service,
                    score: total,
                    price: (price !== null && price !== undefined) ? price.toLocaleString() + ' ₽' : 'цена по запросу'
                });
            }
        }
        scores.sort((a, b) => b.score - a.score);

        if (scores.length === 0) {
            logInit('Не найдено подходящих услуг', 'WARN', '', 2);
            return {
                services: [
                    { service: "Индивидуальная консультация (1ч)", price: "7 000 ₽", formatted: "Ищу работу — Индивидуальная консультация (1ч)", score: 0 },
                    { service: "Экспресс-консультация (30мин)", price: "3 500 ₽", formatted: "Ищу работу — Экспресс-консультация (30мин)", score: 0 }
                ]
            };
        }

        const maxScore = scores[0].score;
        const filtered = scores.filter(item => item.score >= maxScore * 0.5);
        const topServices = filtered.slice(0, 4);

        const result = topServices.map(s => ({
            service: s.service,
            price: s.price,
            formatted: formatServiceWithCategory(s.service),
            score: s.score
        }));

        logInit(`Найдено рекомендаций: ${result.length}`, 'INFO', '', 4);
        return { services: result };
    };

    // Для обратной совместимости
    window.getTopTwoServices = function(answersArr) {
        const top = window.getTopServices(answersArr);
        const services = top.services;
        if (services.length >= 2) {
            return {
                variantA: services[0].service,
                variantB: services[1].service,
                variantAFormatted: services[0].formatted,
                variantBFormatted: services[1].formatted,
                priceA: services[0].price,
                priceB: services[1].price
            };
        }
        return {
            variantA: services[0].service,
            variantB: services[0].service,
            variantAFormatted: services[0].formatted,
            variantBFormatted: services[0].formatted,
            priceA: services[0].price,
            priceB: services[0].price
        };
    };
})();