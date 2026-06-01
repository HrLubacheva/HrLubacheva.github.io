// ============================================================
// 02_notifications.js – Отправка уведомлений (Telegram, Email)
// ============================================================
(function() {
    'use strict';

    async function sendTelegramNotification(chatId, message) {
        if (!window.APP_CONFIG || !window.APP_CONFIG.SCRIPT_URL) {
            logger.error('❌ APP_CONFIG.SCRIPT_URL не задан');
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
            if (window.IS_DEV) logger.info('📢 Уведомление отправлено в Telegram');
            return true;
        } catch (err) {
            logger.error('Ошибка отправки уведомления в Telegram:', err);
            return false;
        }
    }

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
            if (window.IS_DEV) logger.info('📧 Уведомление отправлено на email');
            return true;
        } catch (err) {
            logger.error('Ошибка отправки email уведомления:', err);
            return false;
        }
    }

    function showSystemNotification(message, type = 'info') {
        if (type === 'error') window.showErrorToast(message);
        else if (type === 'success') window.showSuccessToast(message);
        else if (type === 'warning') window.showWarningToast(message);
        else window.showToast(message, 'info');
        if (window.IS_DEV) logger.debug(`🔔 [${type.toUpperCase()}] ${message}`);
    }

    window.sendTelegramNotification = sendTelegramNotification;
    window.sendAdminEmail = sendAdminEmail;
    window.showSystemNotification = showSystemNotification;

    if (window.IS_DEV) logger.info('✅ Модуль уведомлений загружен');
})();