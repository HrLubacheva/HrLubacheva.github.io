// editor/main.js
let isSaving = false;

function getCleanHTML() {
    const clone = document.cloneNode(true);
    clone.querySelectorAll('.editor-toolbar, .property-panel, .slides-panel, .history-panel, .resize-marker, .format-toolbar, .editor-grid-overlay, .editor-hint, .editor-toast').forEach(el => el.remove());
    clone.querySelectorAll('[contenteditable="true"]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('.selected, .editable-block').forEach(el => el.classList.remove('selected', 'editable-block'));
    clone.querySelectorAll('[style*="position: absolute"], [style*="z-index"], [style*="outline"]').forEach(el => {
        el.style.removeProperty('position');
        el.style.removeProperty('z-index');
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-offset');
    });
    return '<!DOCTYPE html>\n' + clone.documentElement.outerHTML;
}

// Получение токена из хранилища (сначала localStorage, потом sessionStorage)
function getStoredToken() {
    let token = localStorage.getItem('github_token_hrlubacheva');
    if (token) return token;
    token = sessionStorage.getItem('github_token_hrlubacheva');
    return token;
}

// Сохранение токена с выбором пользователя
function saveToken(token, remember) {
    localStorage.removeItem('github_token_hrlubacheva');
    sessionStorage.removeItem('github_token_hrlubacheva');

    if (remember) {
        localStorage.setItem('github_token_hrlubacheva', token);
        showToast('🔐 Токен сохранён навсегда (до ручной очистки)', 3000);
    } else {
        sessionStorage.setItem('github_token_hrlubacheva', token);
        showToast('🔐 Токен сохранён до закрытия вкладки', 3000);
    }
}

// Очистка токена (кнопка)
function clearToken() {
    localStorage.removeItem('github_token_hrlubacheva');
    sessionStorage.removeItem('github_token_hrlubacheva');
    showToast('🔐 Токен удалён. При следующем сохранении введите заново.', 3000);
}

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

        let token = getStoredToken();

        if (!token) {
            token = prompt('🔐 Введите GitHub Personal Access Token:\n\n1. github.com/settings/tokens\n2. Generate new token (classic)\n3. Права: repo\n4. Скопируйте токен');

            if (!token) {
                showToast('❌ Токен не введён');
                isSaving = false;
                return;
            }

            const remember = confirm('Запомнить токен для следующих сеансов?\n\n• OK — токен сохранится навсегда\n• Отмена — токен будет удалён при закрытии вкладки');

            saveToken(token, remember);
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
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
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

            if (error.message === 'Bad credentials' || error.message === 'Invalid token') {
                clearToken();
                showToast('❌ Токен недействителен, удалён. Введите заново при следующем сохранении.', 4000);
            }
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

// Добавляем кнопку очистки токена
function addClearTokenButton() {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    if (document.getElementById('clearTokenBtn')) return;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearTokenBtn';
    clearBtn.textContent = '🗑️ Очистить токен';
    clearBtn.className = 'tool-btn';
    clearBtn.title = 'Удалить сохранённый токен (выйти из GitHub)';
    clearBtn.style.background = '#ffc107';
    clearBtn.style.color = '#333';
    clearBtn.onclick = () => {
        if (confirm('Удалить сохранённый токен? При следующем сохранении нужно будет ввести заново.')) {
            clearToken();
        }
    };

    const saveBtn = document.getElementById('saveToGitBtn');
    if (saveBtn && saveBtn.parentNode) {
        saveBtn.parentNode.insertBefore(clearBtn, saveBtn.nextSibling);
    }
}

window.saveCleanToGitHub = saveCleanToGitHub;
window.clearToken = clearToken;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addClearTokenButton);
} else {
    addClearTokenButton();
}