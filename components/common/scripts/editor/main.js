import { state } from './core/state.js';
import { showToast } from './core/utils.js';
import { initHistory, saveToHistory } from './core/history.js';
import { createToolbar, hideToolbar } from './ui/toolbar.js';
import { createPropertyPanel } from './ui/property-panel.js';
import { createSlidesPanel } from './ui/panels.js';
import { initBlockEditor, enableBlockEditMode, disableBlockEditMode } from './features/block-editor.js';

let toggleBtn = null;
let isInitialized = false;

function getCleanHTML() {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('#editorToggle, .editor-toolbar, .slides-panel, .resize-marker, .editor-toast').forEach(el => el.remove());
    clone.querySelectorAll('.editable-block, .selected').forEach(el => {
        el.classList.remove('editable-block', 'selected');
        el.style.width = '';
        el.style.height = '';
    });
    clone.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.removeAttribute('contenteditable');
    });
    return '<!DOCTYPE html>\n' + clone.outerHTML;
}

async function saveToGitHub() {
    const { CONFIG } = await import('./core/config.js');
    let token = localStorage.getItem('github_token');
    if (!token) {
        token = prompt('🔐 Введите GitHub Personal Access Token:');
        if (!token) { showToast('❌ Токен не введён'); return; }
        localStorage.setItem('github_token', token);
    }
    const cleanHTML = getCleanHTML();
    const content = btoa(unescape(encodeURIComponent(cleanHTML)));
    showToast('📤 Сохранение...');
    try {
        const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
        let sha = null;
        const getRes = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        if (getRes.ok) sha = (await getRes.json()).sha;
        const putRes = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Сохранение ${new Date().toLocaleString()}`, content, sha, branch: CONFIG.BRANCH })
        });
        if (putRes.ok) showToast('✅ Сохранено!');
        else showToast('❌ Ошибка');
    } catch (err) {
        showToast('⚠️ Ошибка: ' + err.message);
        const blob = new Blob([cleanHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_${Date.now()}.html`;
        link.click();
    }
}

export function initEditor() {
    if (isInitialized) return;
    isInitialized = true;
    console.log('🎨 Запуск редактора');

    toggleBtn = document.createElement('button');
    toggleBtn.id = 'editorToggle';
    toggleBtn.innerHTML = '✏️ Редактировать';
    toggleBtn.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        left: 20px !important;
        right: auto !important;
        bottom: auto !important;
        z-index: 10001 !important;
        background: linear-gradient(135deg, #2D6A9F, #1D4D7A) !important;
        color: white !important;
        border: none !important;
        border-radius: 40px !important;
        padding: 10px 24px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        font-family: 'Inter', sans-serif !important;
    `;

    toggleBtn.onmouseenter = () => {
        toggleBtn.style.transform = 'scale(1.05)';
        toggleBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    };
    toggleBtn.onmouseleave = () => {
        toggleBtn.style.transform = 'scale(1)';
        toggleBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    };

    document.body.appendChild(toggleBtn);
    toggleBtn.onclick = () => state.isEditMode ? disableEditMode() : enableEditMode();
}

function enableEditMode() {
    state.isEditMode = true;
    toggleBtn.innerHTML = '🔴 Выйти';
    toggleBtn.style.background = 'linear-gradient(135deg, #dc3545, #b02a37)';
    createToolbar();
    createPropertyPanel();
    createSlidesPanel();
    initBlockEditor();
    enableBlockEditMode();
    const saveBtn = document.querySelector('#saveToGitBtn');
    if (saveBtn) saveBtn.onclick = () => saveToGitHub();
    initHistory();
    saveToHistory();
    showToast('🎨 Режим редактирования включён');
}

export function disableEditMode() {
    state.isEditMode = false;
    toggleBtn.innerHTML = '✏️ Редактировать';
    toggleBtn.style.background = 'linear-gradient(135deg, #2D6A9F, #1D4D7A)';
    disableBlockEditMode();
    hideToolbar();
    document.querySelector('.slides-panel')?.remove();
    showToast('✨ Режим редактирования выключен');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
} else {
    initEditor();
}