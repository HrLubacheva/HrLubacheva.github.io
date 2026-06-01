// ============================================================
// 00_logger.js – Умная система логирования
// ============================================================

const LOG_LEVELS = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};

// Определяем уровень логирования
let currentLevel = LOG_LEVELS.ERROR;  // по умолчанию на проде

// Проверяем режим отладки
if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const hasDebug = urlParams.get('debug') === '1' || urlParams.get('debug') === 'true';
    const storedDebug = localStorage.getItem('hr_debug_mode') === 'true';
    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';

    if (hasDebug || storedDebug || isLocalhost) {
        currentLevel = LOG_LEVELS.DEBUG;
        console.log('%c🐛 Режим отладки ВКЛЮЧЁН', 'color: #2D6A9F; font-size: 12px; font-weight: bold;');
    }
}

// Управление уровнем логирования
window.setLogLevel = function(level) {
    const levelMap = {
        'none': LOG_LEVELS.NONE,
        'error': LOG_LEVELS.ERROR,
        'warn': LOG_LEVELS.WARN,
        'info': LOG_LEVELS.INFO,
        'debug': LOG_LEVELS.DEBUG,
        'trace': LOG_LEVELS.TRACE
    };
    const newLevel = levelMap[level.toLowerCase()];
    if (newLevel !== undefined) {
        currentLevel = newLevel;
        console.log(`📋 Уровень логирования: ${level.toUpperCase()}`);
    }
};

window.enableDebug = function() {
    currentLevel = LOG_LEVELS.DEBUG;
    localStorage.setItem('hr_debug_mode', 'true');
    console.log('%c🐛 Режим отладки ВКЛЮЧЁН', 'color: #2D6A9F; font-size: 12px; font-weight: bold;');
};

window.disableDebug = function() {
    currentLevel = LOG_LEVELS.ERROR;
    localStorage.setItem('hr_debug_mode', 'false');
    console.log('%c🔇 Режим отладки ВЫКЛЮЧЁН', 'color: #E67E22; font-size: 12px; font-weight: bold;');
};

// Основной логгер
window.logger = {
    error: (...args) => {
        if (currentLevel >= LOG_LEVELS.ERROR) {
            console.error('❌', ...args);
        }
    },
    warn: (...args) => {
        if (currentLevel >= LOG_LEVELS.WARN) {
            console.warn('⚠️', ...args);
        }
    },
    info: (...args) => {
        if (currentLevel >= LOG_LEVELS.INFO) {
            console.log('ℹ️', ...args);
        }
    },
    debug: (...args) => {
        if (currentLevel >= LOG_LEVELS.DEBUG) {
            console.log('🔍', ...args);
        }
    },
    trace: (...args) => {
        if (currentLevel >= LOG_LEVELS.TRACE) {
            console.trace('🔬', ...args);
        }
    },
    init: (message, level = 'INFO', context = '') => {
        const isDev = currentLevel >= LOG_LEVELS.DEBUG;
        if (isDev) {
            let style = '';
            if (level === 'ERROR') style = 'color:red; font-weight:bold';
            else if (level === 'WARN') style = 'color:orange';
            else if (level === 'TRACE') style = 'color:gray';
            else if (level === 'DEBUG') style = 'color:blue';
            else style = 'color:green';
            console.log(`%c[${new Date().toISOString()}] [${level}] ${message} ${context ? '(' + context + ')' : ''}`, style);
        }
    }
};

// Перехват глобальных ошибок
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        logger.error('Uncaught error:', e.message, e.filename, e.lineno);
    });
    window.addEventListener('unhandledrejection', (e) => {
        logger.error('Unhandled rejection:', e.reason);
    });
}

console.log(`📋 Логгер инициализирован. Уровень: ${Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === currentLevel) || 'UNKNOWN'}`);