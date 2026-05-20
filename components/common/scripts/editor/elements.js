// ========== РАБОТА С ЭЛЕМЕНТАМИ ==========
import { state } from './state.js';
import { showToast, addDeleteButton } from './utils.js';
import { addResizeHandles, removeResizeHandles } from './image-editor.js';

export function selectElement(el, renderSlidesCallback) {
    if (state.selectedElement) {
        state.selectedElement.classList.remove('selected');
        removeResizeHandles();
    }
    state.selectedElement = el;
    if (state.selectedElement) {
        state.selectedElement.classList.add('selected');
        if (state.selectedElement.tagName === 'IMG') {
            addResizeHandles(state.selectedElement);
        }
        addDeleteButton(state.selectedElement, state.isEditMode, () => {
            state.selectedElement = null;
            if (renderSlidesCallback) renderSlidesCallback();
        });
    }
}

export function duplicateElement(renderSlidesCallback) {
    if (!state.selectedElement) {
        showToast('⚠️ Выберите элемент');
        return;
    }
    const clone = state.selectedElement.cloneNode(true);
    clone.classList.remove('selected');
    clone.querySelectorAll('.resize-handle, .element-delete-btn').forEach(h => h.remove());
    state.selectedElement.parentNode.insertBefore(clone, state.selectedElement.nextSibling);
    selectElement(clone, renderSlidesCallback);
    if (renderSlidesCallback) renderSlidesCallback();
    showToast('✅ Элемент продублирован');
}

export function addImage() {
    const url = prompt('📷 Введите URL фото:');
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        if (state.selectedElement && state.selectedElement.tagName !== 'IMG') {
            state.selectedElement.appendChild(img);
        } else {
            document.querySelector('.container')?.appendChild(img);
        }
        selectElement(img);
        showToast('✅ Фото добавлено');
    }
}

export function createNewPanel(renderSlidesCallback) {
    const container = document.querySelector('.container');
    if (!container) return;
    const newSection = document.createElement('section');
    newSection.innerHTML = `<div class="new-panel-template"><h3>📦 Новая панель</h3><p>Кликните на текст для редактирования</p><p>Тяните за уголки фото</p></div>`;

    // Вставляем перед footer или в конец
    const footer = document.querySelector('footer');
    if (footer) {
        footer.parentNode.insertBefore(newSection, footer);
    } else {
        container.appendChild(newSection);
    }

    selectElement(newSection, renderSlidesCallback);
    if (renderSlidesCallback) renderSlidesCallback();
    showToast('✅ Новая панель создана');
}

export function createGroup(renderSlidesCallback) {
    const groupName = prompt('📁 Название группы:');
    if (!groupName) return;
    const group = document.createElement('div');
    group.className = 'group-container';
    group.innerHTML = `<div class="group-label">${groupName}</div><div class="group-content" style="min-height:50px;"></div>`;

    if (state.selectedElement && !state.selectedElement.classList?.contains('group-container')) {
        const content = group.querySelector('.group-content');
        state.selectedElement.parentNode.insertBefore(group, state.selectedElement);
        content.appendChild(state.selectedElement);
    } else {
        document.querySelector('.container')?.appendChild(group);
    }

    selectElement(group, renderSlidesCallback);
    if (renderSlidesCallback) renderSlidesCallback();
    showToast(`✅ Группа "${groupName}" создана`);
}

export function deleteSelectedElement(renderSlidesCallback) {
    if (state.selectedElement && state.selectedElement.parentNode) {
        state.selectedElement.remove();
        showToast('✅ Элемент удалён');
        state.selectedElement = null;
        if (renderSlidesCallback) renderSlidesCallback();
    } else {
        showToast('⚠️ Выберите элемент');
    }
}