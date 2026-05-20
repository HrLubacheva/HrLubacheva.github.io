// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
export function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function getEditableElements() {
    return Array.from(document.querySelectorAll('section, .role-card, .service-card, .benefit-card, .stat-item, .process-card, .quiz-card, .checklist-card, .calendar-card, .new-panel-template, img, .group-container, p, h1, h2, h3, h4, h5, h6, li, div:not(.admin-toolbar):not(.slides-panel):not(.text-editor-popup):not(.format-toolbar)'))
        .filter(el => !el.closest('.admin-toolbar') && !el.closest('.slides-panel') && el.id !== 'adminToggle' && !el.classList?.contains('resize-handle') && !el.classList?.contains('element-delete-btn'));
}

export function removeDeleteButton() {
    const existingBtn = document.querySelector('.element-delete-btn');
    if (existingBtn) existingBtn.remove();
}

export function addDeleteButton(selectedElement, isEditMode, onDelete) {
    removeDeleteButton();
    if (!selectedElement || !isEditMode) return;
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'element-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (selectedElement && selectedElement.parentNode) {
            selectedElement.remove();
            showToast('✅ Элемент удалён');
            if (onDelete) onDelete();
        }
    };
    selectedElement.style.position = selectedElement.style.position || 'relative';
    selectedElement.appendChild(deleteBtn);
}