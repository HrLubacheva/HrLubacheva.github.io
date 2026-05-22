// ========== ОТПРАВКА ЗАПРОСА МАТЕРИАЛОВ НА ВАШ Google Apps Script ==========

/**
 * Отправляет email-запрос на получение материалов (чек-лист и/или программа тренинга)
 * @param {string} email - Email пользователя
 * @param {boolean} wantChecklist - Запросить ли чек-лист
 * @param {boolean} wantTraining - Запросить ли программу тренинга
 * @returns {Promise<boolean>}
 */
async function sendMaterialsEmail(email, wantChecklist, wantTraining) {
    if (!email || !email.includes('@')) {
        throw new Error('Введите корректный email');
    }

    const formData = {
        formType: 'Запрос материалов',
        name: email,
        comment: `чек-лист=${wantChecklist}, тренинг=${wantTraining}`,
        consent: true,
        userId: typeof window.getOrCreateLocalUserId === 'function' ? window.getOrCreateLocalUserId() : 'unknown'
    };

    console.log('📤 Отправка данных на скрипт:', formData);

    try {
        // Отправляем JSON (скрипт умеет обрабатывать и JSON, и URL-encoded)
        const response = await fetch(MATERIALS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',               // важно для получения ответа
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Ответ от скрипта:', result);

        if (result.result !== 'ok') {
            throw new Error(result.message || 'Неизвестная ошибка скрипта');
        }

        return true;
    } catch (err) {
        console.error('❌ Ошибка отправки:', err);
        // Можно также показать пользователю более понятное сообщение, но выбросим ошибку для обработки выше
        throw new Error('Не удалось отправить запрос. Попробуйте позже.');
    }
}

// Делаем функцию доступной глобально
window.sendMaterialsEmail = sendMaterialsEmail;