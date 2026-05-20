// ========== ПАНЕЛЬ СВОЙСТВ (РАЗМЕРЫ, ОТСТУПЫ, БЛОКИРОВКА) ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { toggleBlockLock } from '../features/lock.js';
import { clearSelection } from '../features/selection.js';

let propertyPanel = null;

export function createPropertyPanel() {
    if (propertyPanel) return propertyPanel;

    propertyPanel = document.createElement('div');
    propertyPanel.className = 'property-panel';
    propertyPanel.innerHTML = `
        <div class="panel-header">
            <span>📐 Свойства блока</span>
            <button id="closePropertyPanel">✕</button>
        </div>
        <div class="panel-content">
            <div class="prop-group">
                <label>📏 Ширина (px)</label>
                <input type="number" id="propWidth" step="10" placeholder="auto">
            </div>
            <div class="prop-group">
                <label>📏 Высота (px)</label>
                <input type="number" id="propHeight" step="10" placeholder="auto">
            </div>
            <div class="prop-group">
                <label>📐 Отступ внутри (padding)</label>
                <input type="text" id="propPadding" placeholder="20px 15px">
            </div>
            <div class="prop-group">
                <label>📐 Отступ снаружи (margin)</label>
                <input type="text" id="propMargin" placeholder="10px 0">
            </div>
            <div class="prop-group">
                <label>🎯 Выравнивание</label>
                <select id="propAlign">
                    <option value="left">По левому краю</option>
                    <option value="center">По центру</option>
                    <option value="right">По правому краю</option>
                </select>
            </div>
            <div class="prop-group">
                <label>🔒 Блокировка</label>
                <button id="propLockBtn" class="lock-prop-btn">🔓 Заблокировать</button>
            </div>
            <div class="prop-group">
                <label>🗑️ Удалить блок</label>
                <button id="propDeleteBtn" class="delete-prop-btn">Удалить</button>
            </div>
        </div>
    `;
    document.body.appendChild(propertyPanel);

    document.getElementById('closePropertyPanel')?.addEventListener('click', () => {
        propertyPanel.classList.remove('show');
    });

    attachPropertyEvents();
    return propertyPanel;
}

function attachPropertyEvents() {
    const widthInput = document.getElementById('propWidth');
    const heightInput = document.getElementById('propHeight');
    const paddingInput = document.getElementById('propPadding');
    const marginInput = document.getElementById('propMargin');
    const alignSelect = document.getElementById('propAlign');
    const lockBtn = document.getElementById('propLockBtn');
    const deleteBtn = document.getElementById('propDeleteBtn');

    widthInput?.addEventListener('change', () => {
        const el = state.selectedElement;
        if (!el) return;
        const val = widthInput.value;
        el.style.width = val ? val + 'px' : '';
        saveToHistory();
    });

    heightInput?.addEventListener('change', () => {
        const el = state.selectedElement;
        if (!el) return;
        const val = heightInput.value;
        el.style.height = val ? val + 'px' : '';
        saveToHistory();
    });

    paddingInput?.addEventListener('change', () => {
        const el = state.selectedElement;
        if (!el) return;
        el.style.padding = paddingInput.value;
        saveToHistory();
    });

    marginInput?.addEventListener('change', () => {
        const el = state.selectedElement;
        if (!el) return;
        el.style.margin = marginInput.value;
        saveToHistory();
    });

    alignSelect?.addEventListener('change', () => {
        const el = state.selectedElement;
        if (!el) return;
        el.style.textAlign = alignSelect.value;
        saveToHistory();
    });

    lockBtn?.addEventListener('click', () => {
        const el = state.selectedElement;
        if (!el) return;
        toggleBlockLock(el);
        const isLocked = el.classList.contains('locked');
        lockBtn.innerHTML = isLocked ? '🔒 Разблокировать' : '🔓 Заблокировать';
    });

    deleteBtn?.addEventListener('click', () => {
        const el = state.selectedElement;
        if (!el) return;
        if (confirm('Удалить этот блок?')) {
            el.remove();
            clearSelection();
            hidePropertyPanel();
            saveToHistory();
            showToast('✅ Блок удалён');
        }
    });
}

export function showPropertyPanel(element) {
    if (!propertyPanel) createPropertyPanel();
    if (!element) return;

    propertyPanel.classList.add('show');

    // Заполняем текущие значения
    const computed = getComputedStyle(element);
    const widthInput = document.getElementById('propWidth');
    const heightInput = document.getElementById('propHeight');
    const paddingInput = document.getElementById('propPadding');
    const marginInput = document.getElementById('propMargin');
    const alignSelect = document.getElementById('propAlign');
    const lockBtn = document.getElementById('propLockBtn');

    if (widthInput) {
        const w = element.style.width || computed.width;
        widthInput.value = w === 'auto' ? '' : parseInt(w);
    }
    if (heightInput) {
        const h = element.style.height || computed.height;
        heightInput.value = h === 'auto' ? '' : parseInt(h);
    }
    if (paddingInput) paddingInput.value = element.style.padding || '';
    if (marginInput) marginInput.value = element.style.margin || '';
    if (alignSelect) alignSelect.value = element.style.textAlign || 'left';
    if (lockBtn) {
        const isLocked = element.classList.contains('locked');
        lockBtn.innerHTML = isLocked ? '🔒 Разблокировать' : '🔓 Заблокировать';
    }
}

export function hidePropertyPanel() {
    if (propertyPanel) {
        propertyPanel.classList.remove('show');
    }
}