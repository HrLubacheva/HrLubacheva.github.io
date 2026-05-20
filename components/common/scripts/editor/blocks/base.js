// ========== БАЗОВЫЙ КЛАСС ДЛЯ ВСЕХ БЛОКОВ ==========
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';

export class BaseBlock {
    constructor(type, className) {
        this.type = type;
        this.className = className;
        this.element = null;
    }

    // Создать DOM элемент блока (переопределяется в наследниках)
    create(data) {
        const div = document.createElement('div');
        div.className = `${this.className} editable-object`;
        div.setAttribute('data-block-type', this.type);
        return div;
    }

    // Установить ширину
    setWidth(width) {
        if (!this.element) return;
        if (width === 'auto' || !width) {
            this.element.style.width = '';
        } else {
            this.element.style.width = width + 'px';
        }
        saveToHistory();
    }

    // Установить высоту
    setHeight(height) {
        if (!this.element) return;
        if (height === 'auto' || !height) {
            this.element.style.height = '';
        } else {
            this.element.style.height = height + 'px';
        }
        saveToHistory();
    }

    // Установить отступы
    setPadding(padding) {
        if (!this.element) return;
        this.element.style.padding = padding;
        saveToHistory();
    }

    // Установить внешние отступы
    setMargin(margin) {
        if (!this.element) return;
        this.element.style.margin = margin;
        saveToHistory();
    }

    // Установить выравнивание
    setAlign(align) {
        if (!this.element) return;
        this.element.style.textAlign = align;
        saveToHistory();
    }

    // Заблокировать/разблокировать
    setLocked(locked) {
        if (!this.element) return;
        if (locked) {
            this.element.classList.add('locked');
        } else {
            this.element.classList.remove('locked');
        }
        const lockBtn = this.element.querySelector('.element-lock-btn');
        if (lockBtn) {
            lockBtn.innerHTML = locked ? '🔒' : '🔓';
            lockBtn.title = locked ? 'Разблокировать' : 'Заблокировать';
        }
        saveToHistory();
    }

    // Дублировать блок
    clone() {
        if (!this.element) return null;
        const clone = this.element.cloneNode(true);
        clone.classList.remove('selected');
        clone.querySelectorAll('.element-delete-btn, .element-lock-btn, .resize-handle').forEach(el => el.remove());
        this.element.parentNode.insertBefore(clone, this.element.nextSibling);
        saveToHistory();
        showToast('✅ Блок продублирован');
        return clone;
    }

    // Удалить блок
    delete() {
        if (!this.element) return;
        this.element.remove();
        saveToHistory();
        showToast('✅ Блок удалён');
    }
}