// ========== ВЫДЕЛЕНИЕ ЭЛЕМЕНТОВ ==========
import { state } from '../core/state.js';
import { addDeleteButton, removeDeleteButton, addLockButton } from '../core/utils.js';
import { showPropertyPanel, hidePropertyPanel } from '../ui/property-panel.js';
import { removeResizeHandles } from './resize.js';

let currentSelected = null;

export function selectElement(element, onSelectCallback) {
    // Не выделяем заблокированные элементы
    if (element.classList.contains('locked')) {
        showToast('🔒 Элемент заблокирован. Снимите блокировку через панель свойств.');
        return;
    }

    // Снимаем выделение с предыдущего
    if (currentSelected && currentSelected !== element) {
        currentSelected.classList.remove('selected');
        removeDeleteButton();
        removeResizeHandles();
    }

    currentSelected = element;
    state.selectedElement = element;
    element.classList.add('selected');

    // Добавляем кнопку удаления
    addDeleteButton(element, () => {
        currentSelected = null;
        state.selectedElement = null;
        hidePropertyPanel();
        if (onSelectCallback) onSelectCallback();
    });

    // Добавляем кнопку блокировки
    const isLocked = element.classList.contains('locked');
    addLockButton(element, isLocked, () => {
        import('./lock.js').then(module => {
            module.toggleBlockLock(element);
            // Обновляем кнопку
            const newLocked = element.classList.contains('locked');
            const btn = element.querySelector('.element-lock-btn');
            if (btn) {
                btn.innerHTML = newLocked ? '🔒' : '🔓';
                btn.title = newLocked ? 'Разблокировать' : 'Заблокировать';
            }
        });
    });

    // Показываем панель свойств
    showPropertyPanel(element);

    // Для изображений добавляем ручки ресайза
    if (element.tagName === 'IMG' || element.querySelector('img')) {
        const img = element.tagName === 'IMG' ? element : element.querySelector('img');
        import('./resize.js').then(module => {
            module.addResizeHandles(img);
        });
    }

    if (onSelectCallback) onSelectCallback();
}

export function getSelectedElement() {
    return currentSelected;
}

export function clearSelection() {
    if (currentSelected) {
        currentSelected.classList.remove('selected');
        removeDeleteButton();
        removeResizeHandles();
        hidePropertyPanel();
        currentSelected = null;
        state.selectedElement = null;
    }
}

// Импорты
import { showToast } from '../core/utils.js';