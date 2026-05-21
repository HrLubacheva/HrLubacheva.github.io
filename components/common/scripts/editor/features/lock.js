// ========== БЛОКИРОВКА ЭЛЕМЕНТОВ ==========
import { saveToHistory } from '../core/history.js';
import { showToast } from '../core/utils.js';

export function toggleBlockLock(element) {
    if (!element) return;
    const wasLocked = element.classList.contains('locked');
    if (wasLocked) {
        element.classList.remove('locked');
        showToast('🔓 Блок разблокирован');
    } else {
        element.classList.add('locked');
        // Если элемент был выделен, снимаем выделение
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
            // Также нужно убрать маркеры ресайза, если они есть
            const markers = document.querySelectorAll('.resize-marker');
            markers.forEach(m => m.remove());
        }
        showToast('🔒 Блок заблокирован');
    }
    saveToHistory();
}

export function isBlockLocked(element) {
    return element?.classList?.contains('locked') || false;
}