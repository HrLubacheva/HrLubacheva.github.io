// ========== UI ЭЛЕМЕНТЫ ==========
import { state } from './state.js';
import { ADMIN_STYLES } from './styles.js';
import { showToast, getEditableElements, removeDeleteButton, addDeleteButton } from './utils.js';
import { toggleSlidesPanel } from './slides-panel.js';
import { addImage, duplicateElement, createNewPanel, createGroup, deleteSelectedElement, selectElement } from './elements.js';
import { startCrop, showShapeSelector, addResizeHandles } from './image-editor.js';
import { createTextEditor } from './text-editor.js';
import { saveToGitHub as saveToGitHubApi, clearGitHubToken } from './token.js';
import { initDragDrop } from './drag-drop.js';

let toggleBtn = null;
let toolbar = null;

export function createUI(renderSlidesCallback) {
    // Стили
    const styleSheet = document.createElement('style');
    styleSheet.textContent = ADMIN_STYLES;
    document.head.appendChild(styleSheet);

    // Кнопка включения режима
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'adminToggle';
    toggleBtn.textContent = '✏️ Редактировать';
    document.body.appendChild(toggleBtn);

    // Панель инструментов
    toolbar = document.createElement('div');
    toolbar.className = 'admin-toolbar';
    toolbar.innerHTML = `
        <button id="toggleSlidesPanelBtn">📑 Панель слайдов</button>
        <button id="enableDragBtn">📌 Перетаскивание</button>
        <button id="toggleGridBtn">📐 Сетка</button>
        <button id="duplicateElementBtn" class="duplicate-btn">📋 Дублировать</button>
        <button id="deleteElementBtn" class="delete-btn">🗑 Удалить</button>
        <button id="cropImageBtn" class="crop-btn">✂️ Обрезать фото</button>
        <button id="shapeImageBtn" class="crop-btn" style="background:#6f42c1;">🔘 Форма фото</button>
        <button id="newImageBtn" class="new-image-btn">🖼 Добавить фото</button>
        <button id="newPanelBtn" class="new-panel-btn">📦 Новая панель</button>
        <button id="createGroupBtn" class="group-btn">📁 Создать группу</button>
        <button id="saveToGitHubBtn" class="github-save">💾 Сохранить на GitHub</button>
        <button id="clearTokenBtn" class="clear-token-btn">🗑️ Очистить токен</button>
        <button id="exitAdminBtn" class="danger">🚪 Выйти</button>
    `;
    document.body.appendChild(toolbar);

    // Переменные для сетки
    let showGrid = false;
    let gridOverlay = null;

    // Переменная для перетаскивания
    let dragEnabledLocal = false;

    // ========== ОБРАБОТЧИКИ ==========

    // Панель слайдов
    document.getElementById('toggleSlidesPanelBtn')?.addEventListener('click', () => toggleSlidesPanel(renderSlidesCallback));

    // Перетаскивание
    document.getElementById('enableDragBtn')?.addEventListener('click', () => {
        dragEnabledLocal = !dragEnabledLocal;
        state.dragEnabled = dragEnabledLocal;
        const btn = document.getElementById('enableDragBtn');
        if (btn) {
            btn.style.background = dragEnabledLocal ? '#28a745' : '#f8f9fa';
            btn.textContent = dragEnabledLocal ? '✅ Перетаскивание (вкл)' : '📌 Перетаскивание';
        }
        if (dragEnabledLocal) {
            initDragDrop();
            showToast('🎯 Режим перетаскивания включён');
        } else {
            showToast('🎯 Режим перетаскивания выключен');
        }
    });

    // Сетка
    document.getElementById('toggleGridBtn')?.addEventListener('click', () => {
        showGrid = !showGrid;
        if (showGrid) {
            if (!gridOverlay) {
                gridOverlay = document.createElement('div');
                gridOverlay.className = 'grid-overlay';
                document.body.appendChild(gridOverlay);
            }
            gridOverlay.style.display = 'block';
            showToast('📐 Сетка включена');
        } else if (gridOverlay) {
            gridOverlay.style.display = 'none';
            showToast('📐 Сетка выключена');
        }
    });

    // Дублировать
    document.getElementById('duplicateElementBtn')?.addEventListener('click', () => duplicateElement(renderSlidesCallback));

    // Удалить
    document.getElementById('deleteElementBtn')?.addEventListener('click', () => deleteSelectedElement(renderSlidesCallback));

    // Обрезать фото
    document.getElementById('cropImageBtn')?.addEventListener('click', startCrop);

    // Форма фото
    document.getElementById('shapeImageBtn')?.addEventListener('click', () => {
        if (state.selectedElement && state.selectedElement.tagName === 'IMG') {
            showShapeSelector(state.selectedElement);
        } else {
            showToast('⚠️ Выберите фото');
        }
    });

    // Добавить фото
    document.getElementById('newImageBtn')?.addEventListener('click', addImage);

    // Новая панель
    document.getElementById('newPanelBtn')?.addEventListener('click', () => createNewPanel(renderSlidesCallback));

    // Создать группу
    document.getElementById('createGroupBtn')?.addEventListener('click', () => createGroup(renderSlidesCallback));

    // Сохранить на GitHub
    document.getElementById('saveToGitHubBtn')?.addEventListener('click', async () => {
        const wasEditMode = state.isEditMode;

        // Выключаем визуальные элементы админки
        if (state.isEditMode) {
            document.querySelectorAll('.editable-object, .selected').forEach(el => el.classList.remove('editable-object', 'selected'));
            removeDeleteButton();
            document.querySelectorAll('.resize-handle').forEach(h => h.remove());
            toolbar.classList.remove('show');
            if (state.slidesPanel) state.slidesPanel.classList.remove('show');
            const hint = document.getElementById('editHint');
            if (hint) hint.remove();
            document.querySelectorAll('a').forEach(link => {
                const originalHref = link.getAttribute('data-original-href');
                if (originalHref) link.setAttribute('href', originalHref);
            });
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        const currentHTML = document.documentElement.outerHTML;
        const content = btoa(unescape(encodeURIComponent(currentHTML)));

        const success = await saveToGitHubApi(content, wasEditMode, (restore) => {
            if (restore) enableEditMode(renderSlidesCallback);
        });

        if (wasEditMode) enableEditMode(renderSlidesCallback);
    });

    // Очистить токен
    document.getElementById('clearTokenBtn')?.addEventListener('click', () => {
        clearGitHubToken();
    });

    // Выйти из режима
    document.getElementById('exitAdminBtn')?.addEventListener('click', () => disableEditMode());

    return { toggleBtn, toolbar };
}

export function enableEditMode(renderSlidesCallback) {
    state.isEditMode = true;
    toggleBtn.classList.add('admin-active');
    toggleBtn.textContent = '🔴 Выйти';
    toolbar.classList.add('show');

    // Добавляем классы редактируемым элементам
    getEditableElements().forEach(el => el.classList.add('editable-object'));

    // Подсказка
    const hint = document.createElement('div');
    hint.id = 'editHint';
    hint.textContent = '💡 Клик по тексту - редактирование | ПКМ по фото - форма | Тяните за уголки';
    document.body.appendChild(hint);

    // Блокируем ссылки
    document.querySelectorAll('a').forEach(link => {
        link.setAttribute('data-original-href', link.href);
        link.removeAttribute('href');
    });

    // Обработчик клика по тексту
    document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, .role-card, .service-card, .benefit-card, .stat-item, .process-card, .quiz-card, .checklist-card, .calendar-card, .new-panel-template, div:not(.admin-toolbar):not(.slides-panel)').forEach(el => {
        if (!el.closest('.admin-toolbar') && !el.closest('.slides-panel')) {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state.isEditMode && el.tagName !== 'IMG' && !el.classList.contains('group-container')) {
                    createTextEditor(el);
                }
                selectElement(el, renderSlidesCallback);
            });
        }
    });

    // Обработчик для фото
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(img, renderSlidesCallback);
        });
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (state.isEditMode) showShapeSelector(img);
        });
    });

    // Добавляем ручки ресайза для выбранного фото
    if (state.selectedElement && state.selectedElement.tagName === 'IMG') {
        addResizeHandles(state.selectedElement);
    }

    // Добавляем кнопку удаления
    if (state.selectedElement) {
        addDeleteButton(state.selectedElement, state.isEditMode, () => {
            state.selectedElement = null;
            if (renderSlidesCallback) renderSlidesCallback();
        });
    }

    showToast('✨ Режим редактирования включён');
}

export function disableEditMode() {
    state.isEditMode = false;
    state.dragEnabled = false;
    toggleBtn.classList.remove('admin-active');
    toggleBtn.textContent = '✏️ Редактировать';
    toolbar.classList.remove('show');

    // Убираем классы
    getEditableElements().forEach(el => el.classList.remove('editable-object', 'selected'));
    removeDeleteButton();
    document.querySelectorAll('.resize-handle').forEach(h => h.remove());

    // Прячем панели
    if (state.slidesPanel) state.slidesPanel.classList.remove('show');
    if (state.gridOverlay) state.gridOverlay.style.display = 'none';
    if (state.shapeSelector) state.shapeSelector.remove();
    if (state.textEditorPopup) state.textEditorPopup.remove();

    // Убираем подсказку
    const hint = document.getElementById('editHint');
    if (hint) hint.remove();

    // Восстанавливаем ссылки
    document.querySelectorAll('a').forEach(link => {
        const originalHref = link.getAttribute('data-original-href');
        if (originalHref) link.setAttribute('href', originalHref);
    });

    // Снимаем выделение
    if (state.selectedElement) state.selectedElement.classList.remove('selected');
    state.selectedElement = null;

    showToast('✨ Режим редактирования выключен');
}