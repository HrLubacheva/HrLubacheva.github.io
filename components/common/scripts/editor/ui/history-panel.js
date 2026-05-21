import { showToast } from '../core/utils.js';
import { CONFIG } from '../core/config.js';

let historyPanel = null;

export function createHistoryPanel() {
    if (historyPanel) return historyPanel;
    historyPanel = document.createElement('div');
    historyPanel.className = 'history-panel';
    historyPanel.innerHTML = `
        <div class="history-panel-header">
            <span>📜 История изменений</span>
            <div><button id="refreshHistoryBtn" title="Обновить">🔄</button><button id="closeHistoryPanelBtn">✕</button></div>
        </div>
        <div class="history-tabs">
            <button class="history-tab active" data-tab="local">💾 Локальные</button>
            <button class="history-tab" data-tab="github">🐙 GitHub коммиты</button>
        </div>
        <div class="history-list" id="historyList"><div style="padding:20px;text-align:center;">Загрузка...</div></div>
    `;
    document.body.appendChild(historyPanel);
    document.getElementById('closeHistoryPanelBtn')?.addEventListener('click', () => historyPanel.classList.remove('show'));
    document.getElementById('refreshHistoryBtn')?.addEventListener('click', () => {
        const active = document.querySelector('.history-tab.active')?.dataset.tab;
        if (active === 'local') loadLocalHistory(); else loadGitHubCommits();
    });
    document.querySelectorAll('.history-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.history-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.tab === 'local') loadLocalHistory(); else loadGitHubCommits();
        });
    });
    return historyPanel;
}

function loadLocalHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    const states = window.__editorHistory || [];
    const current = window.__editorHistoryIndex || -1;
    if (!states.length) { list.innerHTML = '<div style="padding:20px;text-align:center;">📭 Нет сохранённых состояний</div>'; return; }
    let html = '';
    for (let i = states.length-1; i>=0; i--) {
        const s = states[i];
        const date = new Date(s.timestamp).toLocaleString();
        const isCur = (i === current);
        html += `<div class="history-item ${isCur ? 'current' : ''}" data-index="${i}">
            <div class="history-time">${date}</div>
            <div class="history-actions"><button class="history-restore" data-index="${i}">↩️ Восстановить</button></div>
        </div>`;
    }
    list.innerHTML = html;
    document.querySelectorAll('.history-restore').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            if (!isNaN(idx) && window.restoreFromLocalHistory) {
                window.restoreFromLocalHistory(idx);
                showToast('✅ Состояние восстановлено');
                setTimeout(loadLocalHistory, 500);
            }
        });
    });
}

async function loadGitHubCommits() {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = '<div style="padding:20px;text-align:center;">⏳ Загрузка коммитов...</div>';
    const token = localStorage.getItem('github_token_hrlubacheva');
    if (!token) {
        list.innerHTML = '<div style="padding:20px;text-align:center;">🔐 Токен GitHub не найден.<br>Сохраните сайт хотя бы раз, чтобы ввести токен.</div>';
        return;
    }
    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/commits?per_page=20`;
        const resp = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        if (!resp.ok) throw new Error('Ошибка загрузки');
        const commits = await resp.json();
        if (!commits.length) { list.innerHTML = '<div style="padding:20px;text-align:center;">📭 Нет коммитов</div>'; return; }
        let html = '';
        for (const c of commits) {
            const date = new Date(c.commit.author.date).toLocaleString();
            const msg = c.commit.message.split('\n')[0];
            const sha = c.sha.substring(0,7);
            html += `<div class="history-item" data-sha="${c.sha}">
                <div class="history-time">${date}</div>
                <div class="history-message">${escapeHtml(msg)}</div>
                <div class="history-actions">
                    <button class="history-view" data-sha="${c.sha}">👁️ Просмотр</button>
                    <button class="history-restore-github" data-sha="${c.sha}">↩️ Восстановить</button>
                </div>
            </div>`;
        }
        list.innerHTML = html;
        document.querySelectorAll('.history-view').forEach(btn => {
            btn.addEventListener('click', () => window.open(`https://github.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/commit/${btn.dataset.sha}`, '_blank'));
        });
        document.querySelectorAll('.history-restore-github').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm(`Восстановить сайт из коммита ${btn.dataset.sha.substring(0,7)}?`)) {
                    await restoreFromGitCommit(btn.dataset.sha);
                    showToast('✅ Сайт восстановлен, перезагрузите страницу');
                    setTimeout(() => location.reload(), 1500);
                }
            });
        });
    } catch(err) {
        console.error(err);
        list.innerHTML = `<div style="padding:20px;text-align:center;">❌ Ошибка: ${err.message}</div>`;
    }
}

async function restoreFromGitCommit(sha) {
    const token = localStorage.getItem('github_token_hrlubacheva');
    if (!token) { showToast('❌ Нет токена GitHub'); return; }
    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/index.html?ref=${sha}`;
        const resp = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        if (!resp.ok) throw new Error('Не удалось загрузить файл');
        const data = await resp.json();
        const content = atob(data.content);
        document.open(); document.write(content); document.close();
    } catch(err) { showToast(`❌ Ошибка восстановления: ${err.message}`); }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

export function toggleHistoryPanel() {
    if (!historyPanel) createHistoryPanel();
    historyPanel.classList.toggle('show');
    if (historyPanel.classList.contains('show')) loadLocalHistory();
}