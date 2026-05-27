// ========== РАСЧЁТ БАЛЛОВ, ФИЛЬТРАЦИЯ И ПОДГОТОВКА ЦЕН ==========
(function() {
    const CATEGORY_DISPLAY_NAMES = {
        business_recruitment: '🔍 HR: Рекрутинг и подбор',
        business_retention: '📊 HR: Удержание и развитие',
        individual_base: '👤 B2C: Базовые (до 10 000 ₽)',
        individual_standard: '👔 B2C: Стандартные (10 000–50 000 ₽)',
        individual_premium: '💎 B2C: Премиальные (от 50 000 ₽)',
        training: '🎓 Тренинги',
        corporate: '🏢 Корпоративным клиентам',
        author_courses: '📚 Авторские курсы'
    };

    function buildServiceCategoryMap() {
        const map = {};
        if (!window.LOCAL_SERVICES) return map;
        for (const [cat, items] of Object.entries(window.LOCAL_SERVICES)) {
            const displayName = CATEGORY_DISPLAY_NAMES[cat] || cat;
            for (const item of items) {
                map[item.service] = displayName;
            }
        }
        return map;
    }

    function getServiceCategory(serviceName) {
        if (!window.SERVICE_CATEGORY_MAP) {
            window.SERVICE_CATEGORY_MAP = buildServiceCategoryMap();
        }
        return window.SERVICE_CATEGORY_MAP[serviceName] || '📌 Другое';
    }

    function formatServiceWithCategory(serviceName) {
        const category = getServiceCategory(serviceName);
        return `${category} — ${serviceName}`;
    }

    function getNumericPrice(serviceName) {
        if (window.PRICE_BOOK && window.PRICE_BOOK[serviceName] !== undefined) {
            return window.PRICE_BOOK[serviceName];
        }
        return null;
    }

    function getUserPriceSegment(answersArr) {
        const level = answersArr[1];
        const budget = answersArr[4];
        const expensiveLevels = ["Senior / ведущий", "Lead / руководитель", "Директор / Managing Director", "Топ-менеджер (C-level)", "Собственник бизнеса"];
        const isExpensiveByLevel = expensiveLevels.includes(level);
        const expensiveBudgets = ["50 000 – 100 000 ₽", "100 000 – 300 000 ₽", "300 000 – 500 000 ₽", "Выше 500 000 ₽"];
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
        const isBusinessService = (
            service.includes("подбор") || service.includes("рекрутинг") ||
            service.includes("хэдхантинг") || service.includes("аутсорсинг") ||
            service.includes("вакансии") || service.includes("кандидатов") ||
            service.includes("стажировки") || service.includes("Программу стажировки") ||
            service.includes("Авторский курс") || service.includes("Обучение с '0'") ||
            service.includes("Корпоративная") || service.includes("Абонемент") ||
            service === "База кандидатов + тестирование" ||
            service === "Подбор резюме под вакансию" ||
            service === "Составление вакансии (с УТП)" ||
            service === "Тренинг по запросу (1ч, до 25 чел.)" ||
            service === "Стратегическая сессия (1ч, до 12 чел.)" ||
            service === "Мастер-класс (3ч, до 25 чел.)" ||
            service === "Тренинг 'Удержание персонала'" ||
            service === "Тренинг 'Профилактика выгорания'"
        );
        const isBusinessUser = (userRole === "Подбираю сотрудников");
        if (isBusinessService && !isBusinessUser) return false;
        if (isBusinessUser && !isBusinessService) return false;
        if (!isBusinessService) {
            const price = getNumericPrice(service);
            if (price === 0) return false;
            if (price === null) return true;
            if (userSegment === "expensive" && price < 10000) return false;
            if (userSegment === "cheap" && price >= 50000) return false;
        }
        return true;
    }

    window.getTopTwoServices = function(answersArr) {
        let weights = window.SERVICE_WEIGHTS;
        let mapping = window.ANSWER_MAPPING;

        if (!weights || Object.keys(weights).length === 0 || !mapping) {
            return {
                variantA: "Индивидуальная консультация (1ч)",
                variantB: "Экспресс-консультация (30мин)",
                variantAFormatted: "👤 B2C: Стандартные — Индивидуальная консультация (1ч)",
                variantBFormatted: "👤 B2C: Базовые — Экспресс-консультация (30мин)"
            };
        }

        const userRole = answersArr[0];
        const userSegment = getUserPriceSegment(answersArr);
        const userKeys = [];

        for (let i = 0; i < answersArr.length; i++) {
            const answer = answersArr[i];
            if (answer && mapping[answer]) {
                userKeys.push(mapping[answer]);
            }
        }

        if (userRole === "Подбираю сотрудников") userKeys.push("role_business");
        else if (userRole === "Рост в текущей компании") userKeys.push("role_growth");
        else if (userRole === "Хочу сменить профессию") userKeys.push("role_career_change");
        else if (userRole === "Ищу работу") userKeys.push("role_job_seeker");

        const scores = [];
        for (const [service, weightObj] of Object.entries(weights)) {
            if (!isServiceAllowed(service, userRole, userSegment)) continue;
            let total = 0;
            for (const key of userKeys) {
                if (weightObj[key]) total += weightObj[key];
            }
            if (total === 0 && weightObj.role_any) total = weightObj.role_any;
            if (total > 0) {
                const price = getNumericPrice(service);
                scores.push({
                    service,
                    score: total,
                    price: (price !== null && price !== undefined) ? price.toLocaleString() + ' ₽' : 'цена по запросу'
                });
            }
        }

        scores.sort((a, b) => b.score - a.score);

        if (scores.length === 0) {
            return {
                variantA: "Индивидуальная консультация (1ч)",
                variantB: "Экспресс-консультация (30мин)",
                variantAFormatted: "👤 B2C: Стандартные — Индивидуальная консультация (1ч)",
                variantBFormatted: "👤 B2C: Базовые — Экспресс-консультация (30мин)"
            };
        }

        const top = scores[0];
        const second = scores[1] || scores[0];

        return {
            variantA: top.service,
            variantB: second.service,
            variantAFormatted: formatServiceWithCategory(top.service),
            variantBFormatted: formatServiceWithCategory(second.service),
            scoreA: top.score,
            scoreB: second.score,
            priceA: top.price,
            priceB: second.price
        };
    };
})();