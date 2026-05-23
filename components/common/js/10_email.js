// ========== ОТПРАВКА ЗАПРОСА МАТЕРИАЛОВ ==========
// Используем глобальную переменную window.APP_CONFIG.SCRIPT_URL

async function sendMaterialsEmail(email, wantChecklist, wantTraining) {
    if (!email || !email.includes('@')) {
        throw new Error('Введите корректный email');
    }

    const url = window.APP_CONFIG ? window.APP_CONFIG.SCRIPT_URL : window.SCRIPT_URL;
    if (!url) {
        throw new Error('URL скрипта не задан. Убедитесь, что APP_CONFIG загружен');
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
        const body = new URLSearchParams(formData);
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        console.log('✅ Запрос отправлен (режим no-cors)');
        return true;
    } catch (err) {
        console.error('❌ Ошибка отправки:', err);
        throw new Error('Не удалось отправить запрос. Попробуйте позже.');
    }
}

window.sendMaterialsEmail = sendMaterialsEmail;