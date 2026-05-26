// ========== ГЛОБАЛЬНЫЕ НАСТРОЙКИ САЙТА ==========
window.APP_CONFIG = {
    // URL веб-приложения Google Apps Script (обработчик форм)
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwHN9ej6DF2_X5s_Pak5cOQ0E3aTeEP4N_1gSB6trtrv5oZzNZjijCEKHAZ85do4rzz3A/exec',

    // Контакты (для ссылок в меню и подвале)
    TELEGRAM: 'https://t.me/HrLubacheva',
    WHATSAPP: 'https://wa.me/79217916655',
    EMAIL: 'hrlubacheva@yandex.ru',
    PHONE: '+79217916655',

    // ID счётчиков аналитики
    YANDEX_METRIKA_ID: '109380497',
    GOOGLE_ANALYTICS_ID: 'G-QZJJ2SE117',

    // ========== КОНСТАНТЫ ДЛЯ ВСЕГО САЙТА ==========
    CONSTANTS: {
        // Таймауты и задержки (в миллисекундах)
        TOAST_DURATION: 3000,
        TOAST_FADE_DURATION: 300,
        LOADING_TIMEOUT: 2000,
        FETCH_RETRY_DELAY_BASE: 2000,
        FETCH_RETRY_DELAY_MAX: 5000,
        FETCH_TIMEOUT: 10000,
        FETCH_RETRIES: 3,
        QUIZ_ANALYZE_DELAY: 700,
        QUIZ_RESULT_DELAY: 700,
        QUIZ_SELECTION_DELAY: 300,
        MATERIAL_SEND_INTERVAL: 5000,
        MATERIAL_RETRY_DELAY: 2000,
        MATERIAL_MAX_RETRIES: 3,
        CACHE_TTL: 10 * 60 * 1000,
        ANIMATION_FADE_DURATION: 700,
        STATS_ANIMATION_DURATION: 1500,

        // Брейкпоинты (px)
        BREAKPOINT_MOBILE: 768,
        BREAKPOINT_TABLET: 992,
        BREAKPOINT_DESKTOP: 1200,
        SCROLL_TOP_VISIBLE_THRESHOLD: 500,

        // Размеры изображений
        OG_IMAGE_WIDTH: 1200,
        OG_IMAGE_HEIGHT: 630,
        HERO_IMAGE_WIDTH: 480,
        HERO_IMAGE_HEIGHT: 640,

        // Финансовые константы
        DISCOUNT_PERCENT: 0.05,
        DISCOUNT_MIN_ITEMS: 2,

        // Валидация
        MAX_PHONE_DIGITS: 11,

        // Геолокация
        GEO_API_URL: 'https://ipapi.co/json/',

        // Ключи localStorage
        LOCALSTORAGE_VISITS_KEY: 'hr_visits',
        LOCALSTORAGE_GEO_KEY: 'hr_geo',
        LOCALSTORAGE_USER_ID_KEY: 'hr_user_id',

        // Прочие (необязательные)
        DEFAULT_QUANTITY: 1,
    }
};