// ========== РАБОТА С ТОКЕНОМ ==========
import { CONFIG } from './config.js';
import { showToast } from './utils.js';

export function getGitHubToken() {
    let token = localStorage.getItem('github_token_hrlubacheva');
    if (!token) {
        token = prompt(
            '🔐 Введите GitHub Personal Access Token\n\n' +
            'Как получить:\n' +
            '1. Перейдите на github.com/settings/tokens\n' +
            '2. Нажмите "Generate new token (classic)"\n' +
            '3. Название: admin-panel-local\n' +
            '4. Права: отметьте "repo" (полный доступ)\n' +
            '5. Скопируйте токен и вставьте сюда\n\n' +
            'Токен сохранится ТОЛЬКО на этом компьютере'
        );
        if (token && token.trim()) {
            localStorage.setItem('github_token_hrlubacheva', token.trim());
            showToast('✅ Токен сохранён локально');
        }
    }
    return token || '';
}

export function clearGitHubToken() {
    if (confirm('🗑️ Удалить сохранённый токен? Без него сохранение на GitHub будет недоступно.')) {
        localStorage.removeItem('github_token_hrlubacheva');
        showToast('✅ Токен удалён');
    }
}

export async function saveToGitHub(content, wasEditMode, onComplete) {
    const token = getGitHubToken();
    if (!token) {
        showToast('❌ Нет токена');
        return false;
    }

    showToast('📤 Отправка на GitHub...');

    try {
        let sha = null;
        const getResponse = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        } else if (getResponse.status === 401) {
            showToast('❌ Токен недействителен. Очистите и введите новый');
            localStorage.removeItem('github_token_hrlubacheva');
            if (onComplete) onComplete(wasEditMode);
            return false;
        }

        const updateResponse = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Обновление через админ-панель ${new Date().toLocaleString()}`,
                content: content,
                sha: sha,
                branch: CONFIG.BRANCH
            })
        });

        if (updateResponse.ok) {
            showToast('✅ Сохранено на GitHub! Сайт обновится через 1-2 минуты');
            return true;
        } else {
            const error = await updateResponse.json();
            showToast('❌ Ошибка: ' + (error.message || 'Неизвестная ошибка'));
            return false;
        }
    } catch (err) {
        showToast('⚠️ Ошибка сети: ' + err.message);
        // Запасной вариант - скачать файл локально
        const blob = new Blob([content], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `index_backup_${new Date().toISOString().slice(0, 19)}.html`;
        link.click();
        showToast('📥 Файл сохранён локально (бекап)');
        return false;
    }
}