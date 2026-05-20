// ========== РЕДАКТИРОВАНИЕ ТЕКСТА ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';

let currentEditElement = null;
let originalContent = '';
let toolbar = null;

export function initTextEditing() {
    document.addEventListener('dblclick', (e) => {
        if (!state.isEditMode) return;

        // Находим редактируемый текстовый элемент
        const textEl = findTextElement(e.target);
        if (!textEl) return;

        // Проверяем блокировку
        if (textEl.closest('.locked')) {
            showToast('🔒 Элемент заблокирован');
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        startEdit(textEl);
    });
}

function findTextElement(target) {
    const tags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'DIV', 'A', 'FIGCAPTION', '.photo-caption', '.video-caption'];
    for (const tag of tags) {
        const found = target.closest(tag);
        if (found && !found.closest('.editor-toolbar') && !found.closest('.slides-panel')) {
            return found;
        }
    }
    return null;
}

function startEdit(element) {
    if (currentEditElement) cancelEdit();

    currentEditElement = element;
    originalContent = element.innerHTML;

    element.setAttribute('contenteditable', 'true');
    element.style.outline = '2px solid #ff9800';
    element.style.backgroundColor = 'rgba(255,152,0,0.05)';
    element.style.padding = '8px';
    element.style.borderRadius = '8px';
    element.focus();

    showFormatToolbar(element);

    // Сохраняем по Enter (но не Shift+Enter)
    element.addEventListener('keydown', saveOnEnter);
}

function saveOnEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveEdit();
    }
}

function saveEdit() {
    if (!currentEditElement) return;

    currentEditElement.removeAttribute('contenteditable');
    currentEditElement.style.cssText = '';
    currentEditElement.removeEventListener('keydown', saveOnEnter);

    hideFormatToolbar();
    saveToHistory();
    showToast('✅ Текст сохранён');

    currentEditElement = null;
}

function cancelEdit() {
    if (!currentEditElement) return;

    currentEditElement.innerHTML = originalContent;
    currentEditElement.removeAttribute('contenteditable');
    currentEditElement.style.cssText = '';

    hideFormatToolbar();
    showToast('❌ Редактирование отменено');

    currentEditElement = null;
}

function showFormatToolbar(element) {
    hideFormatToolbar();

    const rect = element.getBoundingClientRect();
    toolbar = document.createElement('div');
    toolbar.className = 'format-float-bar';
    toolbar.style.left = rect.left + 'px';
    toolbar.style.top = (rect.top - 50) + 'px';
    toolbar.innerHTML = `
        <button data-cmd="bold"><b>Ж</b></button>
        <button data-cmd="italic"><i>К</i></button>
        <button data-cmd="underline"><u>Ч</u></button>
        <span class="sep"></span>
        <button data-cmd="justifyLeft">◀</button>
        <button data-cmd="justifyCenter">◀▶</button>
        <button data-cmd="justifyRight">▶</button>
        <span class="sep"></span>
        <button data-cmd="insertUnorderedList">•</button>
        <button data-cmd="insertOrderedList">1.</button>
        <span class="sep"></span>
        <button data-cmd="undo">↩️</button>
        <button data-cmd="redo">↪️</button>
    `;

    toolbar.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.dataset.cmd;
            if (cmd === 'undo') document.execCommand('undo');
            else if (cmd === 'redo') document.execCommand('redo');
            else document.execCommand(cmd, false, null);
            currentEditElement?.focus();
        });
    });

    document.body.appendChild(toolbar);
}

function hideFormatToolbar() {
    if (toolbar) {
        toolbar.remove();
        toolbar = null;
    }
}