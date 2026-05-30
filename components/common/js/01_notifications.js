// ============================================================
// notifications.js – Отправка уведомлений (Telegram, Email)
// ============================================================
(function() {
    'use strict';

    /**
     * Отправляет уведомление в Telegram (через бэкенд)
     * @param {string} chatId - ID чата (или 'admin' для использования из настроек)
     * @param {string} message - Текст сообщения (plain text)
     * @returns {Promise<boolean>}
     */
    async function sendTelegramNotification(chatId, message) {
        if (!window.APP_CONFIG || !window.APP_CONFIG.SCRIPT_URL) {
            logError('❌ APP_CONFIG.SCRIPT_URL не задан');
            return false;
        }
        const formData = {
            formType: 'Telegram уведомление',
            name: 'System',
            comment: `chatId: ${chatId}\nСообщение: ${message.substring(0, 500)}`,
            consent: 'Да',
            userId: window.getOrCreateLocalUserId ? window.getOrCreateLocalUserId() : 'system'
        };
        try {
            await window.sendDataToSheetWithRetry(formData, 1);
            if (window.IS_DEV) console.log('📢 Уведомление отправлено в Telegram');
            return true;
        } catch (err) {
            logError('Ошибка отправки уведомления в Telegram:', err);
            return false;
        }
    }

    /**
     * Отправляет email администратору (через бэкенд)
     * @param {string} subject - Тема письма
     * @param {string} body - Текст письма
     * @returns {Promise<boolean>}
     */
    async function sendAdminEmail(subject, body) {
        if (!window.APP_CONFIG || !window.APP_CONFIG.SCRIPT_URL) return false;
        const formData = {
            formType: 'Email уведомление',
            name: 'System',
            comment: `Тема: ${subject}\n\n${body.substring(0, 1000)}`,
            consent: 'Да',
            userId: window.getOrCreateLocalUserId ? window.getOrCreateLocalUserId() : 'system'
        };
        try {
            await window.sendDataToSheetWithRetry(formData, 1);
            if (window.IS_DEV) console.log('📧 Уведомление отправлено на email');
            return true;
        } catch (err) {
            logError('Ошибка отправки email уведомления:', err);
            return false;
        }
    }

    /**
     * Показывает системное уведомление (браузерный тост + лог)
     * @param {string} message - Текст уведомления
     * @param {string} type - 'info', 'success', 'warning', 'error'
     */
    function showSystemNotification(message, type = 'info') {
        if (type === 'error') window.showErrorToast(message);
        else if (type === 'success') window.showSuccessToast(message);
        else if (type === 'warning') window.showWarningToast(message);
        else window.showToast(message, 'info');
        if (window.IS_DEV) console.log(`🔔 [${type.toUpperCase()}] ${message}`);
    }

    // Экспортируем функции
    window.sendTelegramNotification = sendTelegramNotification;
    window.sendAdminEmail = sendAdminEmail;
    window.showSystemNotification = showSystemNotification;

    if (window.IS_DEV) console.log('✅ Модуль уведомлений загружен');
})();