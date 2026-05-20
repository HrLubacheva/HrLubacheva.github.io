// ========== СОХРАНЕНИЕ НА GITHUB ==========
import { CONFIG } from '../core/config.js';
import { showToast } from '../core/utils.js';
import { state } from '../core/state.js';

let saveInProgress = false;

function getToken() {
    let token = localStorage.getItem('github_token_hrlubacheva');
    if (!token) {
        token = prompt(
            '🔐 Введите GitHub Personal Access Token\n\n' +
            'Как получить:\n' +
            '1. github.com/settings/tokens\n' +
            '2. Generate new token (classic)\n' +
            '3. Права: repo (полный доступ)\n' +
            '4. Скопируйте токен и вставьте сюда'
        );
        if (token && token.trim()) {
            localStorage.setItem('github_token_hrlubacheva', token.trim());
            showToast('✅ Токен сохранён');
        }
    }
    return token || '';
}

export function clearToken() {
    if (confirm('🗑️ Удалить сохранённый токен?')) {
        localStorage.removeItem('github_token_hrlubacheva');
        showToast('✅ Токен удалён');
    }
}

export async function saveToGitHub() {
    if (saveInProgress) {
        showToast('⚠️ Сохранение уже выполняется...');
        return;
    }

    const token = getToken();
    if (!token) {
        showToast('❌ Нет токена. Очистите токен и введите новый');
        return;
    }

    saveInProgress = true;
    showToast('📤 Сохранение на GitHub...');

    try {
        const currentHTML = document.documentElement.outerHTML;
        const content = btoa(unescape(encodeURIComponent(currentHTML)));

        let sha = null;
        const getUrl = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
        const getResponse = await fetch(getUrl, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        } else if (getResponse.status === 401) {
            showToast('❌ Токен недействителен. Очистите и введите новый');
            localStorage.removeItem('github_token_hrlubacheva');
            saveInProgress = false;
            return;
        }

        const updateResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Обновление сайта ${new Date().toLocaleString()}`,
                content: content,
                sha: sha,
                branch: CONFIG.BRANCH
            })
        });

        if (updateResponse.ok) {
            showToast('✅ Сохранено! Сайт обновится через 1-2 минуты');
        } else {
            const error = await updateResponse.json();
            showToast('❌ Ошибка: ' + (error.message || 'Неизвестная ошибка'));
        }
    } catch (err) {
        showToast('⚠️ Ошибка сети: ' + err.message);
        const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `index_backup_${new Date().toISOString().slice(0, 19)}.html`;
        link.click();
        showToast('📥 Файл сохранён локально (бекап)');
    } finally {
        saveInProgress = false;
    }
}