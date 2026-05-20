// ========== БЛОКИРОВКА ЭЛЕМЕНТОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { clearSelection } from './selection.js';
import { saveToHistory } from '../core/history.js';

export function toggleBlockLock(element) {
    if (!element) return;

    const wasLocked = element.classList.contains('locked');

    if (wasLocked) {
        element.classList.remove('locked');
        showToast('🔓 Блок разблокирован');
    } else {
        element.classList.add('locked');
        // Если элемент был выделен — снимаем выделение
        if (state.selectedElement === element) {
            clearSelection();
        }
        showToast('🔒 Блок заблокирован');
    }

    // Обновляем иконку замка, если она есть
    const lockBtn = element.querySelector('.element-lock-btn');
    if (lockBtn) {
        lockBtn.innerHTML = wasLocked ? '🔓' : '🔒';
        lockBtn.title = wasLocked ? 'Заблокировать' : 'Разблокировать';
    }

    saveToHistory();
}

export function unlockAllBlocks() {
    const lockedBlocks = document.querySelectorAll('.locked');
    if (lockedBlocks.length === 0) {
        showToast('⚠️ Нет заблокированных блоков');
        return;
    }

    lockedBlocks.forEach(block => {
        block.classList.remove('locked');
        const lockBtn = block.querySelector('.element-lock-btn');
        if (lockBtn) {
            lockBtn.innerHTML = '🔓';
            lockBtn.title = 'Заблокировать';
        }
    });

    showToast(`✅ Разблокировано ${lockedBlocks.length} блоков`);
    saveToHistory();
}

export function isBlockLocked(element) {
    return element?.classList?.contains('locked') || false;
}