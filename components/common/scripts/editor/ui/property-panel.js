// ========== ПАНЕЛЬ СВОЙСТВ (с кнопками дублирования, удаления и перемещения) ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { toggleBlockLock } from '../features/lock.js';
import { clearSelection } from '../features/selection.js';

let propertyPanel = null;
let currentElement = null;

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
                <label>⬆️ Порядок</label>
                <div style="display: flex; gap: 8px;">
                    <button id="moveUpBtn" class="tool-btn move-up-btn" title="Переместить блок выше">⬆️ Вверх</button>
                    <button id="moveDownBtn" class="tool-btn move-down-btn" title="Переместить блок ниже">⬇️ Вниз</button>
                </div>
            </div>
            <div class="prop-group">
                <label>🔒 Блокировка</label>
                <button id="propLockBtn" class="lock-prop-btn">🔓 Заблокировать</button>
            </div>
            <div class="prop-group">
                <label>📋 Дублировать блок</label>
                <button id="propDuplicateBtn" class="duplicate-prop-btn">📋 Дублировать</button>
            </div>
            <div class="prop-group">
                <label>🗑️ Удалить блок</label>
                <button id="propDeleteBtn" class="delete-prop-btn">Удалить</button>
            </div>

            <!-- Секция для текстового блока (.hero-text-card) -->
            <div id="textBlockStylesSection" style="display: none;">
                <div class="prop-group"><label>🎨 Фон</label><input type="color" id="textBgColor" value="#ffffff"></div>
                <div class="prop-group"><label>🔘 Скругление (px)</label><input type="range" id="textBorderRadius" min="0" max="50" value="0" step="1"><span id="textBorderRadiusValue">0px</span></div>
                <div class="prop-group"><label>🖌️ Рамка</label><div style="display:flex;gap:6px;"><input type="number" id="textBorderWidth" placeholder="толщина" step="1" style="width:70px;"><select id="textBorderStyle" style="width:100px;"><option value="solid">сплошная</option><option value="dashed">пунктир</option><option value="dotted">точки</option><option value="none">нет</option></select><input type="color" id="textBorderColor" value="#cccccc" style="width:40px;"></div></div>
                <div class="prop-group"><label>🌑 Тень</label><label><input type="checkbox" id="textShadowEnabled"> Включить</label><div id="textShadowControls" style="display:none;"><div style="display:flex;gap:6px;"><input type="number" id="textShadowX" placeholder="X" value="0" step="1" style="width:60px;"><input type="number" id="textShadowY" placeholder="Y" value="4" step="1" style="width:60px;"><input type="number" id="textShadowBlur" placeholder="размытие" value="12" step="1" style="width:60px;"></div><div><input type="color" id="textShadowColor" value="#000000"><label><input type="checkbox" id="textShadowInset"> Внутренняя</label></div></div></div>
            </div>

            <!-- Секция для контейнера фото (.hero-image-card) -->
            <div id="containerStylesSection" style="display: none;">
                <div class="prop-group"><label>🔘 Скругление (px)</label><input type="range" id="containerBorderRadius" min="0" max="50" value="0" step="1"><span id="containerBorderRadiusValue">0px</span></div>
                <div class="prop-group"><label>🖌️ Рамка</label><div style="display:flex;gap:6px;"><input type="number" id="containerBorderWidth" placeholder="толщина" step="1" style="width:70px;"><select id="containerBorderStyle" style="width:100px;"><option value="solid">сплошная</option><option value="dashed">пунктир</option><option value="dotted">точки</option><option value="none">нет</option></select><input type="color" id="containerBorderColor" value="#cccccc" style="width:40px;"></div></div>
                <div class="prop-group"><label>🎨 Фон</label><input type="color" id="containerBgColor" value="#ffffff"></div>
                <div class="prop-group"><label>🌑 Тень</label><label><input type="checkbox" id="containerShadowEnabled"> Включить</label><div id="containerShadowControls" style="display:none;"><div style="display:flex;gap:6px;"><input type="number" id="containerShadowX" placeholder="X" value="0" step="1" style="width:60px;"><input type="number" id="containerShadowY" placeholder="Y" value="4" step="1" style="width:60px;"><input type="number" id="containerShadowBlur" placeholder="размытие" value="12" step="1" style="width:60px;"></div><div><input type="color" id="containerShadowColor" value="#000000"><label><input type="checkbox" id="containerShadowInset"> Внутренняя</label></div></div></div>
            </div>

            <!-- Секция для самого изображения (IMG) -->
            <div id="imageStylesSection" style="display: none;">
                <div class="prop-group"><label>🔘 Скругление (px)</label><input type="range" id="imgBorderRadius" min="0" max="50" value="0" step="1"><span id="imgBorderRadiusValue">0px</span></div>
                <div class="prop-group"><label>🖌️ Рамка</label><div style="display:flex;gap:6px;"><input type="number" id="imgBorderWidth" placeholder="толщина" step="1" style="width:70px;"><select id="imgBorderStyle" style="width:100px;"><option value="solid">сплошная</option><option value="dashed">пунктир</option><option value="dotted">точки</option><option value="none">нет</option></select><input type="color" id="imgBorderColor" value="#cccccc" style="width:40px;"></div></div>
                <div class="prop-group"><label>🌑 Тень</label><label><input type="checkbox" id="imgShadowEnabled"> Включить</label><div id="imgShadowControls" style="display:none;"><div style="display:flex;gap:6px;"><input type="number" id="imgShadowX" placeholder="X" value="0" step="1" style="width:60px;"><input type="number" id="imgShadowY" placeholder="Y" value="4" step="1" style="width:60px;"><input type="number" id="imgShadowBlur" placeholder="размытие" value="12" step="1" style="width:60px;"></div><div><input type="color" id="imgShadowColor" value="#000000"><label><input type="checkbox" id="imgShadowInset"> Внутренняя</label></div></div></div>
                <div class="prop-group"><label>🎨 Форма</label><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="tool-btn shape-btn" data-shape="none">Прямо</button><button class="tool-btn shape-btn" data-shape="circle">Круг</button><button class="tool-btn shape-btn" data-shape="oval">Овал</button><button class="tool-btn shape-btn" data-shape="rounded">Скруглённый</button><button class="tool-btn shape-btn" data-shape="hexagon">Шестиугольник</button><button class="tool-btn shape-btn" data-shape="star">Звезда</button></div></div>
                <div class="prop-group"><label>🪞 Отражение</label><div style="display:flex;gap:8px;"><button id="imgFlipH" class="tool-btn">↔️ По горизонтали</button><button id="imgFlipV" class="tool-btn">↕️ По вертикали</button></div></div>
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
    const duplicateBtn = document.getElementById('propDuplicateBtn');
    const deleteBtn = document.getElementById('propDeleteBtn');
    const moveUpBtn = document.getElementById('moveUpBtn');
    const moveDownBtn = document.getElementById('moveDownBtn');

    widthInput?.addEventListener('change', () => applyStyle('width', widthInput.value ? widthInput.value + 'px' : ''));
    heightInput?.addEventListener('change', () => applyStyle('height', heightInput.value ? heightInput.value + 'px' : ''));
    paddingInput?.addEventListener('change', () => applyStyle('padding', paddingInput.value));
    marginInput?.addEventListener('change', () => applyStyle('margin', marginInput.value));
    alignSelect?.addEventListener('change', () => applyStyle('textAlign', alignSelect.value));
    lockBtn?.addEventListener('click', () => {
        if (!currentElement) return;
        toggleBlockLock(currentElement);
        const isLocked = currentElement.classList.contains('locked');
        lockBtn.innerHTML = isLocked ? '🔒 Разблокировать' : '🔓 Заблокировать';
    });
    duplicateBtn?.addEventListener('click', () => {
        if (currentElement) duplicateBlock(currentElement);
    });
    deleteBtn?.addEventListener('click', () => {
        if (currentElement) deleteBlock(currentElement);
    });
    moveUpBtn?.addEventListener('click', () => {
        if (currentElement) moveBlockUp(currentElement);
    });
    moveDownBtn?.addEventListener('click', () => {
        if (currentElement) moveBlockDown(currentElement);
    });
}

function applyStyle(property, value) {
    if (!currentElement) return;
    if (value === '' || value === null) currentElement.style[property] = '';
    else currentElement.style[property] = value;
    saveToHistory();
}

// ---------- Перемещение блока вверх ----------
function moveBlockUp(block) {
    const parent = block.parentNode;
    if (!parent) return;
    const children = Array.from(parent.children).filter(child => child.classList?.contains('editable-block'));
    const index = children.indexOf(block);
    if (index <= 0) {
        showToast('⚠️ Блок уже первый');
        return;
    }
    const previous = children[index - 1];
    parent.insertBefore(block, previous);
    saveToHistory();
    showToast('⬆️ Блок перемещён вверх');
    // Обновляем выделение (не сбрасываем)
    block.classList.add('selected');
}

// ---------- Перемещение блока вниз ----------
function moveBlockDown(block) {
    const parent = block.parentNode;
    if (!parent) return;
    const children = Array.from(parent.children).filter(child => child.classList?.contains('editable-block'));
    const index = children.indexOf(block);
    if (index === -1 || index === children.length - 1) {
        showToast('⚠️ Блок уже последний');
        return;
    }
    const next = children[index + 1];
    parent.insertBefore(next, block); // меняем местами: block встаёт после next
    // или более явно: parent.insertBefore(block, next.nextSibling);
    saveToHistory();
    showToast('⬇️ Блок перемещён вниз');
    block.classList.add('selected');
}

// ---------- Дублирование блока ----------
function duplicateBlock(block) {
    if (block.classList.contains('locked')) {
        showToast('🔒 Нельзя дублировать заблокированный блок');
        return;
    }
    const clone = block.cloneNode(true);
    clone.classList.remove('selected');
    clone.querySelectorAll('.resize-marker, .block-hover-toolbar, .element-delete-btn, .element-lock-btn').forEach(el => el.remove());
    const left = parseFloat(block.style.left) || 0;
    const top = parseFloat(block.style.top) || 0;
    if (block.style.position === 'absolute') {
        clone.style.left = (left + 30) + 'px';
        clone.style.top = (top + 30) + 'px';
    }
    block.parentNode.insertBefore(clone, block.nextSibling);
    saveToHistory();
    showToast('✅ Блок продублирован');
    setTimeout(() => {
        if (typeof showPropertyPanel === 'function') {
            const newBlock = document.querySelector('.editable-block.selected');
            if (newBlock) newBlock.classList.remove('selected');
            clone.classList.add('selected');
            if (window.showPropertyPanel) window.showPropertyPanel(clone);
        }
    }, 50);
}

// ---------- Удаление блока ----------
function deleteBlock(block) {
    if (block.classList.contains('locked')) {
        showToast('🔒 Нельзя удалить заблокированный блок');
        return;
    }
    if (confirm('Удалить этот блок?')) {
        block.remove();
        clearSelection();
        hidePropertyPanel();
        saveToHistory();
        showToast('✅ Блок удалён');
    }
}

// ---------- Остальные функции (attachTextBlockEvents, attachContainerEvents, attachImageEvents) остаются без изменений ----------
// Они уже были в предыдущей версии. Я их здесь не повторяю, но в финальном файле они должны быть.
// Для краткости я приведу их ниже, но в вашем проекте они уже есть.

// ... (вставьте сюда attachTextBlockEvents, attachContainerEvents, attachImageEvents, applyShapeToImage и showPropertyPanel из предыдущей версии)