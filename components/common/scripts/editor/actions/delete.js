// ========== УДАЛЕНИЕ БЛОКОВ ==========
import { saveToHistory } from '../core/history.js';
import { showToast } from '../core/utils.js';
import { clearSelection } from '../features/selection.js';

export function deleteBlock(element) {
    if (!element) return;

    // Проверяем блокировку
    if (element.classList.contains('locked')) {
        showToast('🔒 Нельзя удалить заблокированный блок');
        return false;
    }

    if (confirm('Удалить этот блок?')) {
        element.remove();
        clearSelection();
        saveToHistory();
        showToast('✅ Блок удалён');
        return true;
    }
    return false;
}

export function deleteSelectedBlock() {
    const selected = document.querySelector('.editable-object.selected');
    if (selected) {
        deleteBlock(selected);
    } else {
        showToast('⚠️ Выберите блок для удаления');
    }
}