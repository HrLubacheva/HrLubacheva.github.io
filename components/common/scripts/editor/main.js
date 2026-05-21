async function saveCleanToGitHub() {
    if (isSaving) {
        showToast('⚠️ Сохранение уже выполняется, подождите');
        return;
    }
    if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
        showToast('⚠️ Сайт должен работать по HTTPS для безопасного сохранения токена.', 5000);
    }
    isSaving = true;
    let cleanHTML;
    showToast('📤 Сохранение на GitHub...', 0);
    try {
        const { CONFIG } = await import('./core/config.js');
        let token = localStorage.getItem('github_token_hrlubacheva');
        if (!token) {
            token = prompt('🔐 Введите GitHub Personal Access Token:\n\n1. github.com/settings/tokens\n2. Generate new token (classic)\n3. Права: repo\n4. Скопируйте токен');
            if (!token) {
                showToast('❌ Токен не введён');
                return;
            }
            const saveToken = confirm('Сохранить токен в браузере для следующих сеансов? (безопасно, если вы один используете этот компьютер)');
            if (saveToken) localStorage.setItem('github_token_hrlubacheva', token);
        }
        cleanHTML = getCleanHTML();
        const content = btoa(unescape(encodeURIComponent(cleanHTML)));
        const getUrl = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
        let sha = null;
        const getResponse = await fetch(getUrl, { headers: { 'Authorization': `token ${token}` } });
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }
        const updateResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Сохранение сайта ${new Date().toLocaleString()}`,
                content: content,
                sha: sha,
                branch: CONFIG.BRANCH
            })
        });
        if (updateResponse.ok) {
            showToast('✅ Сохранено! Сайт обновится через 1-2 минуты', 4000);
        } else {
            const error = await updateResponse.json();
            showToast('❌ Ошибка: ' + (error.message || 'Неизвестная ошибка'), 5000);
        }
    } catch (err) {
        showToast('⚠️ Ошибка: ' + err.message, 5000);
        if (cleanHTML) {
            const blob = new Blob([cleanHTML], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `index_backup_${new Date().toISOString().slice(0, 19)}.html`;
            link.click();
            showToast('📥 Бекап сохранён локально', 3000);
        }
    } finally {
        isSaving = false;
        const toast = document.querySelector('.editor-toast');
        if (toast && toast.textContent === '📤 Сохранение на GitHub...') toast.remove();
    }
}