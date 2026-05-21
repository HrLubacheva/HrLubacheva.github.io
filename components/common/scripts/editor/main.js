// ========== ГЛАВНЫЙ МОДУЛЬ РЕДАКТОРА (скрытие/показ панелей вместо выхода) ==========
import { state } from './core/state.js';
import { showToast } from './core/utils.js';
import { initHistory, saveToHistory } from './core/history.js';
import { createToolbar, hideToolbar } from './ui/toolbar.js';
import { createPropertyPanel } from './ui/property-panel.js';
import { createSlidesPanel } from './ui/panels.js';
import { initBlockEditor, enableBlockEditMode, disableBlockEditMode, toggleGrid, toggleSnap } from './features/block-editor.js';

let toggleBtn = null;
let isInitialized = false;

function clearSelection() {
    if (window.blockEditor && window.blockEditor.clearSelection) {
        window.blockEditor.clearSelection();
    }
}

function getCleanHTML() {
    const clone = document.documentElement.cloneNode(true);
    const selectorsToRemove = [
        '#editorToggle', '.editor-toolbar', '.property-panel', '.slides-panel',
        '.editor-hint', '.editor-grid-overlay', '.editor-toast', '.resize-marker',
        '.block-toolbar', '.size-indicator', '.drag-placeholder', '.editor-grid', '.position-info'
    ];
    selectorsToRemove.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    clone.querySelectorAll('.editable-block, .selected').forEach(el => {
        el.classList.remove('editable-block', 'selected');
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';
        el.style.zIndex = '';
        el.style.boxShadow = '';
        el.style.background = '';
        el.style.padding = '';
        el.style.borderRadius = '';
        el.style.cursor = '';
    });
    clone.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.removeAttribute('contenteditable');
    });
    return '<!DOCTYPE html>\n' + clone.outerHTML;
}

let isSaving = false;

async function saveCleanToGitHub() {
    if (isSaving) {
        showToast('⚠️ Сохранение уже выполняется, подождите');
        return;
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

function createEditButton() {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'editorToggle';
    toggleBtn.innerHTML = '✏️ Редактировать';
    toggleBtn.style.cssText = `position:fixed;top:20px;left:20px;z-index:10001;background:linear-gradient(135deg,#2D6A9F,#1D4D7A);color:white;border:none;border-radius:40px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.2);transition:all 0.2s ease;display:flex;align-items:center;gap:8px;font-family:'Inter',sans-serif;`;
    toggleBtn.onmouseenter = function() { this.style.transform = 'scale(1.05)'; this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; };
    toggleBtn.onmouseleave = function() { this.style.transform = 'scale(1)'; this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; };
    toggleBtn.addEventListener('click', () => {
        if (!state.isEditMode) {
            enableEditMode();
        } else {
            togglePanelsVisibility();
        }
    });
    document.body.appendChild(toggleBtn);
}

export function togglePanelsVisibility() {
    const toolbar = document.querySelector('.editor-toolbar');
    const propertyPanel = document.querySelector('.property-panel');
    const slidesPanel = document.querySelector('.slides-panel');
    const isHidden = toolbar?.style.display === 'none';
    if (isHidden) {
        if (toolbar) toolbar.style.display = '';
        if (propertyPanel && propertyPanel.classList.contains('show')) propertyPanel.style.display = '';
        if (slidesPanel && slidesPanel.classList.contains('show')) slidesPanel.style.display = '';
        if (toggleBtn) toggleBtn.innerHTML = '👁️ Скрыть панели';
        showToast('🔧 Панели показаны');
    } else {
        if (toolbar) toolbar.style.display = 'none';
        if (propertyPanel) propertyPanel.style.display = 'none';
        if (slidesPanel) slidesPanel.style.display = 'none';
        if (toggleBtn) toggleBtn.innerHTML = '👁️ Показать панели';
        showToast('🔧 Панели скрыты (редактирование продолжается)');
    }
}

function enableEditMode() {
    state.isEditMode = true;
    if (toggleBtn) {
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = '👁️ Скрыть панели';
        toggleBtn.style.background = 'linear-gradient(135deg, #2D6A9F, #1D4D7A)';
    }
    createToolbar();
    createPropertyPanel();
    createSlidesPanel();
    initBlockEditor();
    enableBlockEditMode();
    setTimeout(() => {
        const settingsTab = document.querySelector('.tab-content[data-tab="settings"] .group-buttons');
        if (settingsTab && !document.getElementById('gridToggleBtn')) {
            const gridBtn = document.createElement('button');
            gridBtn.id = 'gridToggleBtn';
            gridBtn.className = 'tool-btn';
            gridBtn.innerHTML = '📐 Сетка';
            gridBtn.onclick = () => toggleGrid();
            settingsTab.appendChild(gridBtn);
            const snapBtn = document.createElement('button');
            snapBtn.id = 'snapToggleBtn';
            snapBtn.className = 'tool-btn';
            snapBtn.innerHTML = '🔗 Привязка';
            snapBtn.onclick = () => toggleSnap();
            settingsTab.appendChild(snapBtn);
        }
    }, 100);
    const saveBtn = document.getElementById('saveToGitBtn');
    if (saveBtn) saveBtn.onclick = () => saveCleanToGitHub();
    initHistory();
    saveToHistory();
    showHint();
    showToast('🎨 Режим редактирования включён!');
    showToast('💡 Ctrl+D дублировать | Ctrl+↑/↓ слой | Стрелки перемещение | Delete удалить');
}

export function disableEditMode() {
    state.isEditMode = false;
    if (toggleBtn) {
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = '✏️ Редактировать';
        toggleBtn.style.background = 'linear-gradient(135deg, #2D6A9F, #1D4D7A)';
    }
    disableBlockEditMode();
    hideToolbar();
    document.querySelector('.property-panel')?.remove();
    document.querySelector('.slides-panel')?.remove();
    document.querySelector('.editor-hint')?.remove();
    clearSelection();
    showToast('✨ Режим редактирования выключен');
}

function showHint() {
    const hint = document.createElement('div');
    hint.className = 'editor-hint';
    hint.style.cssText = `position:fixed;bottom:20px;right:20px;background:white;border-radius:16px;padding:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:10000;font-size:12px;max-width:280px;font-family:'Inter',sans-serif;`;
    hint.innerHTML = `<div style="font-weight:700;margin-bottom:10px;">💡 Горячие клавиши</div>
        <div>📋 <strong>Ctrl+D</strong> — дублировать блок</div>
        <div>⬆️ <strong>Ctrl+↑</strong> — на передний план</div>
        <div>⬇️ <strong>Ctrl+↓</strong> — на задний план</div>
        <div>🖱️ <strong>Стрелки</strong> — перемещение (1px)</div>
        <div>🔟 <strong>Shift+Стрелки</strong> — перемещение (10px)</div>
        <div>✏️ <strong>Двойной клик</strong> — редактировать текст</div>
        <div>🗑️ <strong>Delete</strong> — удалить блок</div>
        <div>📐 <strong>Сетка/Привязка</strong> — в настройках</div>`;
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 15000);
}

export function initEditor() {
    if (isInitialized) return;
    isInitialized = true;
    if (window.AUTO_EDITOR) {
        enableEditMode();
        return;
    }
    createEditButton();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initEditor);
else initEditor();

// ВАЖНО: публичные инициализации (калькулятор, квиз и т.д.) уже выполнены через public-main.js,
// поэтому здесь они НЕ вызываются, чтобы избежать дублирования.