// ========== ДУБЛИРОВАНИЕ БЛОКОВ ==========
import { saveToHistory } from '../core/history.js';
import { showToast } from '../core/utils.js';
import { selectElement } from '../features/selection.js';

export function duplicateBlock(element) {
    if (!element) return null;

    // Проверяем блокировку
    if (element.classList.contains('locked')) {
        showToast('🔒 Нельзя дублировать заблокированный блок');
        return null;
    }

    const clone = element.cloneNode(true);
    clone.classList.remove('selected');
    clone.querySelectorAll('.element-delete-btn, .element-lock-btn, .resize-handle').forEach(el => el.remove());

    element.parentNode.insertBefore(clone, element.nextSibling);
    saveToHistory();
    showToast('✅ Блок продублирован');

    selectElement(clone);
    return clone;
}

export function duplicateSelectedBlock() {
    const selected = document.querySelector('.editable-object.selected');
    if (selected) {
        duplicateBlock(selected);
    } else {
        showToast('⚠️ Выберите блок для дублирования');
    }
}