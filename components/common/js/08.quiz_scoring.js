// ========== РАСЧЁТ БАЛЛОВ, ФИЛЬТРАЦИЯ И ПОДГОТОВКА ЦЕН ==========
(function() {
    if (!window.PRICE_BOOK && window.LOCAL_SERVICES) {
        window.PRICE_BOOK = {};
        const categories = ['business_recruitment', 'business_retention', 'individual_base', 'individual_standard', 'individual_premium', 'corporate', 'training'];
        for (const cat of categories) {
            if (window.LOCAL_SERVICES[cat]) {
                for (const item of window.LOCAL_SERVICES[cat]) {
                    window.PRICE_BOOK[item.service] = item.price;
                }
            }
        }
    }

    function getNumericPrice(serviceName) {
        if (window.PRICE_BOOK && window.PRICE_BOOK[serviceName] !== undefined) {
            return window.PRICE_BOOK[serviceName];
        }
        return null;
    }

    function initPriceCategories() {
        if (!window.PRICE_BOOK) return;
        const categories = { base: [], standard: [], premium: [] };
        for (const [service, price] of Object.entries(window.PRICE_BOOK)) {
            if (price < 10000) categories.base.push(service);
            else if (price >= 10000 && price < 50000) categories.standard.push(service);
            else if (price >= 50000) categories.premium.push(service);
        }
        window.PRICE_CATEGORY = categories;
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
            service === "Диагностика вакансии" || service === "Скрининг резюме" ||
            service === "База кандидатов + тестирование"
        );
        const isBusinessUser = (userRole === "Подбираю сотрудников");
        if (isBusinessUser !== isBusinessService) return false;

        if (!isBusinessService) {
            const price = getNumericPrice(service);
            if (price === null) return true;
            if (userSegment === "expensive" && price < 10000) return false;
            if (userSegment === "cheap" && price >= 50000) return false;
        }
        return true;
    }

    window.getTopTwoServices = function(answersArr) {
        if (!window.SERVICE_WEIGHTS || !window.ANSWER_MAPPING) {
            console.error("SERVICE_WEIGHTS или ANSWER_MAPPING не загружены");
            return { variantA: "Индивидуальная консультация (1ч)", variantB: "Экспресс-консультация (30мин)" };
        }
        if (!window.PRICE_CATEGORY || Object.keys(window.PRICE_CATEGORY).length === 0) {
            initPriceCategories();
        }

        const userRole = answersArr[0];
        const userSegment = getUserPriceSegment(answersArr);

        const userKeys = [];
        for (let i = 0; i < answersArr.length; i++) {
            const answer = answersArr[i];
            if (answer && window.ANSWER_MAPPING[answer]) {
                userKeys.push(window.ANSWER_MAPPING[answer]);
            }
        }
        if (userRole === "Подбираю сотрудников") userKeys.push("role_business");
        else if (userRole === "Рост в текущей компании") userKeys.push("role_growth");
        else if (userRole === "Хочу сменить профессию") userKeys.push("role_career_change");
        else if (userRole === "Ищу работу") userKeys.push("role_job_seeker");

        const scores = [];
        for (const [service, weights] of Object.entries(window.SERVICE_WEIGHTS)) {
            if (!isServiceAllowed(service, userRole, userSegment)) continue;

            let total = 0;
            for (const key of userKeys) {
                if (weights[key]) total += weights[key];
            }
            if (total === 0 && weights.role_any) total = weights.role_any;
            if (total > 0) {
                const price = getNumericPrice(service);
                scores.push({ service, score: total, price: price ? price.toLocaleString() + ' ₽' : 'цена по запросу' });
            }
        }

        scores.sort((a, b) => b.score - a.score);

        if (scores.length === 0) {
            return { variantA: "Индивидуальная консультация (1ч)", variantB: "Экспресс-консультация (30мин)" };
        }
        const top = scores[0];
        const second = scores[1] || scores[0];
        return {
            variantA: top.service,
            variantB: second.service,
            scoreA: top.score,
            scoreB: second.score
        };
    };
})();