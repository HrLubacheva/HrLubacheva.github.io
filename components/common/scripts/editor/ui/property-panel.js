// ========== ПАНЕЛЬ СВОЙСТВ (с кнопками дублирования, удаления и перемещения) ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { toggleBlockLock } from '../features/lock.js';
import { clearSelection } from '../features/selection.js';

let propertyPanel = null;
let currentElement = null;

// ---------- Вспомогательная функция rgb -> hex ----------
function rgbToHex(rgb) {
    if (!rgb) return null;
    const res = rgb.match(/\d+/g);
    if (!res) return null;
    return '#' + res.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('');
}

// ---------- Стили для текстового блока ----------
function attachTextBlockEvents() {
    const bgColor = document.getElementById('textBgColor');
    const borderRadius = document.getElementById('textBorderRadius');
    const borderRadiusVal = document.getElementById('textBorderRadiusValue');
    const borderWidth = document.getElementById('textBorderWidth');
    const borderStyle = document.getElementById('textBorderStyle');
    const borderColor = document.getElementById('textBorderColor');
    const shadowEnabled = document.getElementById('textShadowEnabled');
    const shadowControls = document.getElementById('textShadowControls');
    const shadowX = document.getElementById('textShadowX');
    const shadowY = document.getElementById('textShadowY');
    const shadowBlur = document.getElementById('textShadowBlur');
    const shadowColor = document.getElementById('textShadowColor');
    const shadowInset = document.getElementById('textShadowInset');

    if (!bgColor) return;

    const applyTextStyles = () => {
        if (!currentElement) return;
        if (!currentElement.matches('.hero-text-card, .hero-content, .hero-text, .small-note')) return;
        currentElement.style.backgroundColor = bgColor.value;
        currentElement.style.borderRadius = borderRadius.value + 'px';
        if (borderRadiusVal) borderRadiusVal.innerText = borderRadius.value + 'px';
        currentElement.style.borderWidth = borderWidth.value ? borderWidth.value + 'px' : '';
        currentElement.style.borderStyle = borderStyle.value;
        currentElement.style.borderColor = borderColor.value;
        if (shadowEnabled.checked) {
            const insetVal = shadowInset.checked ? 'inset ' : '';
            currentElement.style.boxShadow = `${insetVal}${shadowX.value}px ${shadowY.value}px ${shadowBlur.value}px ${shadowColor.value}`;
        } else {
            currentElement.style.boxShadow = '';
        }
        saveToHistory();
    };

    bgColor.addEventListener('input', applyTextStyles);
    borderRadius.addEventListener('input', applyTextStyles);
    borderWidth.addEventListener('input', applyTextStyles);
    borderStyle.addEventListener('change', applyTextStyles);
    borderColor.addEventListener('input', applyTextStyles);
    shadowEnabled.addEventListener('change', () => {
        shadowControls.style.display = shadowEnabled.checked ? 'block' : 'none';
        applyTextStyles();
    });
    shadowX.addEventListener('input', applyTextStyles);
    shadowY.addEventListener('input', applyTextStyles);
    shadowBlur.addEventListener('input', applyTextStyles);
    shadowColor.addEventListener('input', applyTextStyles);
    shadowInset.addEventListener('change', applyTextStyles);
}

// ---------- Стили для контейнера изображения ----------
function attachContainerEvents() {
    const borderRadius = document.getElementById('containerBorderRadius');
    const borderRadiusVal = document.getElementById('containerBorderRadiusValue');
    const borderWidth = document.getElementById('containerBorderWidth');
    const borderStyle = document.getElementById('containerBorderStyle');
    const borderColor = document.getElementById('containerBorderColor');
    const bgColor = document.getElementById('containerBgColor');
    const shadowEnabled = document.getElementById('containerShadowEnabled');
    const shadowControls = document.getElementById('containerShadowControls');
    const shadowX = document.getElementById('containerShadowX');
    const shadowY = document.getElementById('containerShadowY');
    const shadowBlur = document.getElementById('containerShadowBlur');
    const shadowColor = document.getElementById('containerShadowColor');
    const shadowInset = document.getElementById('containerShadowInset');

    if (!borderRadius) return;

    const applyContainerStyles = () => {
        if (!currentElement) return;
        if (!currentElement.matches('.hero-image-card, .hero-image')) return;
        currentElement.style.borderRadius = borderRadius.value + 'px';
        if (borderRadiusVal) borderRadiusVal.innerText = borderRadius.value + 'px';
        currentElement.style.borderWidth = borderWidth.value ? borderWidth.value + 'px' : '';
        currentElement.style.borderStyle = borderStyle.value;
        currentElement.style.borderColor = borderColor.value;
        currentElement.style.backgroundColor = bgColor.value;
        if (shadowEnabled.checked) {
            const insetVal = shadowInset.checked ? 'inset ' : '';
            currentElement.style.boxShadow = `${insetVal}${shadowX.value}px ${shadowY.value}px ${shadowBlur.value}px ${shadowColor.value}`;
        } else {
            currentElement.style.boxShadow = '';
        }
        saveToHistory();
    };

    borderRadius.addEventListener('input', applyContainerStyles);
    borderWidth.addEventListener('input', applyContainerStyles);
    borderStyle.addEventListener('change', applyContainerStyles);
    borderColor.addEventListener('input', applyContainerStyles);
    bgColor.addEventListener('input', applyContainerStyles);
    shadowEnabled.addEventListener('change', () => {
        shadowControls.style.display = shadowEnabled.checked ? 'block' : 'none';
        applyContainerStyles();
    });
    shadowX.addEventListener('input', applyContainerStyles);
    shadowY.addEventListener('input', applyContainerStyles);
    shadowBlur.addEventListener('input', applyContainerStyles);
    shadowColor.addEventListener('input', applyContainerStyles);
    shadowInset.addEventListener('change', applyContainerStyles);
}

// ---------- Стили для самого изображения ----------
function attachImageEvents() {
    const borderRadius = document.getElementById('imgBorderRadius');
    const borderRadiusVal = document.getElementById('imgBorderRadiusValue');
    const borderWidth = document.getElementById('imgBorderWidth');
    const borderStyle = document.getElementById('imgBorderStyle');
    const borderColor = document.getElementById('imgBorderColor');
    const shadowEnabled = document.getElementById('imgShadowEnabled');
    const shadowControls = document.getElementById('imgShadowControls');
    const shadowX = document.getElementById('imgShadowX');
    const shadowY = document.getElementById('imgShadowY');
    const shadowBlur = document.getElementById('imgShadowBlur');
    const shadowColor = document.getElementById('imgShadowColor');
    const shadowInset = document.getElementById('imgShadowInset');
    const flipH = document.getElementById('imgFlipH');
    const flipV = document.getElementById('imgFlipV');

    if (!borderRadius) return;

    const applyImageStyles = () => {
        if (!currentElement) return;
        if (currentElement.tagName !== 'IMG') return;
        currentElement.style.borderRadius = borderRadius.value + 'px';
        if (borderRadiusVal) borderRadiusVal.innerText = borderRadius.value + 'px';
        currentElement.style.borderWidth = borderWidth.value ? borderWidth.value + 'px' : '';
        currentElement.style.borderStyle = borderStyle.value;
        currentElement.style.borderColor = borderColor.value;
        if (shadowEnabled.checked) {
            const insetVal = shadowInset.checked ? 'inset ' : '';
            currentElement.style.boxShadow = `${insetVal}${shadowX.value}px ${shadowY.value}px ${shadowBlur.value}px ${shadowColor.value}`;
        } else {
            currentElement.style.boxShadow = '';
        }
        saveToHistory();
    };

    borderRadius.addEventListener('input', applyImageStyles);
    borderWidth.addEventListener('input', applyImageStyles);
    borderStyle.addEventListener('change', applyImageStyles);
    borderColor.addEventListener('input', applyImageStyles);
    shadowEnabled.addEventListener('change', () => {
        shadowControls.style.display = shadowEnabled.checked ? 'block' : 'none';
        applyImageStyles();
    });
    shadowX.addEventListener('input', applyImageStyles);
    shadowY.addEventListener('input', applyImageStyles);
    shadowBlur.addEventListener('input', applyImageStyles);
    shadowColor.addEventListener('input', applyImageStyles);
    shadowInset.addEventListener('change', applyImageStyles);

    if (flipH) {
        flipH.addEventListener('click', () => {
            if (currentElement && currentElement.tagName === 'IMG') {
                const scaleX = currentElement.style.transform === 'scaleX(-1)' ? 'scaleX(1)' : 'scaleX(-1)';
                currentElement.style.transform = scaleX;
                saveToHistory();
                showToast('✅ Отражение по горизонтали');
            }
        });
    }
    if (flipV) {
        flipV.addEventListener('click', () => {
            if (currentElement && currentElement.tagName === 'IMG') {
                const scaleY = currentElement.style.transform === 'scaleY(-1)' ? 'scaleY(1)' : 'scaleY(-1)';
                currentElement.style.transform = scaleY;
                saveToHistory();
                showToast('✅ Отражение по вертикали');
            }
        });
    }

    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentElement || currentElement.tagName !== 'IMG') return;
            const shape = btn.dataset.shape;
            switch(shape) {
                case 'circle': currentElement.style.borderRadius = '50%'; break;
                case 'oval': currentElement.style.borderRadius = '50%'; currentElement.style.aspectRatio = '2/1'; break;
                case 'rounded': currentElement.style.borderRadius = '30px'; break;
                case 'hexagon': currentElement.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'; break;
                case 'star': currentElement.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'; break;
                default: currentElement.style.borderRadius = ''; currentElement.style.clipPath = ''; currentElement.style.aspectRatio = ''; break;
            }
            if (borderRadius) borderRadius.value = parseInt(currentElement.style.borderRadius) || 0;
            saveToHistory();
        });
    });
}

// ---------- Отображение панели свойств для выбранного элемента ----------
export function showPropertyPanel(element) {
    if (!propertyPanel) createPropertyPanel();
    currentElement = element;
    propertyPanel.classList.add('show');

    const width = parseInt(element.style.width) || '';
    const height = parseInt(element.style.height) || '';
    document.getElementById('propWidth').value = width;
    document.getElementById('propHeight').value = height;
    document.getElementById('propPadding').value = element.style.padding || '';
    document.getElementById('propMargin').value = element.style.margin || '';
    const textAlign = element.style.textAlign || 'left';
    document.getElementById('propAlign').value = textAlign;

    const lockBtn = document.getElementById('propLockBtn');
    if (lockBtn) lockBtn.innerHTML = element.classList.contains('locked') ? '🔒 Разблокировать' : '🔓 Заблокировать';

    const textSection = document.getElementById('textBlockStylesSection');
    const containerSection = document.getElementById('containerStylesSection');
    const imageSection = document.getElementById('imageStylesSection');

    if (textSection) textSection.style.display = element.matches('.hero-text-card, .hero-content, .hero-text, .small-note') ? 'block' : 'none';
    if (containerSection) containerSection.style.display = element.matches('.hero-image-card, .hero-image') ? 'block' : 'none';
    if (imageSection) imageSection.style.display = (element.tagName === 'IMG') ? 'block' : 'none';

    // Заполняем поля текущими стилями (упрощённо)
    if (element.matches('.hero-text-card, .hero-content, .hero-text, .small-note')) {
        const bgInput = document.getElementById('textBgColor');
        if (bgInput) bgInput.value = rgbToHex(element.style.backgroundColor) || '#ffffff';
        const radiusInput = document.getElementById('textBorderRadius');
        if (radiusInput) radiusInput.value = parseInt(element.style.borderRadius) || 0;
        const borderWidthInput = document.getElementById('textBorderWidth');
        if (borderWidthInput) borderWidthInput.value = parseInt(element.style.borderWidth) || '';
        const borderStyleSelect = document.getElementById('textBorderStyle');
        if (borderStyleSelect) borderStyleSelect.value = element.style.borderStyle || 'solid';
        const borderColorInput = document.getElementById('textBorderColor');
        if (borderColorInput) borderColorInput.value = rgbToHex(element.style.borderColor) || '#cccccc';
        const shadowCheck = document.getElementById('textShadowEnabled');
        if (shadowCheck) shadowCheck.checked = !!element.style.boxShadow;
        const shadowCtrl = document.getElementById('textShadowControls');
        if (shadowCtrl) shadowCtrl.style.display = shadowCheck.checked ? 'block' : 'none';
    }
    if (element.matches('.hero-image-card, .hero-image')) {
        const radiusInput = document.getElementById('containerBorderRadius');
        if (radiusInput) radiusInput.value = parseInt(element.style.borderRadius) || 0;
        const bgInput = document.getElementById('containerBgColor');
        if (bgInput) bgInput.value = rgbToHex(element.style.backgroundColor) || '#ffffff';
    }
    if (element.tagName === 'IMG') {
        const radiusInput = document.getElementById('imgBorderRadius');
        if (radiusInput) radiusInput.value = parseInt(element.style.borderRadius) || 0;
    }
}

// ---------- Применение изменений свойств ----------
function applyStyle(property, value) {
    if (!currentElement) return;
    if (value === '' || value === null) currentElement.style[property] = '';
    else currentElement.style[property] = value;
    saveToHistory();
}

function moveBlockUp(block) {
    const parent = block.parentNode;
    if (!parent) return;
    const children = Array.from(parent.children).filter(child => child.classList?.contains('editable-block'));
    const index = children.indexOf(block);
    if (index <= 0) { showToast('⚠️ Блок уже первый'); return; }
    parent.insertBefore(block, children[index - 1]);
    saveToHistory();
    showToast('⬆️ Блок перемещён вверх');
    block.classList.add('selected');
}

function moveBlockDown(block) {
    const parent = block.parentNode;
    if (!parent) return;
    const children = Array.from(parent.children).filter(child => child.classList?.contains('editable-block'));
    const index = children.indexOf(block);
    if (index === -1 || index === children.length - 1) { showToast('⚠️ Блок уже последний'); return; }
    parent.insertBefore(block, children[index + 1].nextSibling);
    saveToHistory();
    showToast('⬇️ Блок перемещён вниз');
    block.classList.add('selected');
}

function duplicateBlock(block) {
    if (block.classList.contains('locked')) { showToast('🔒 Нельзя дублировать заблокированный блок'); return; }
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
        const newBlock = clone;
        if (window.showPropertyPanel) window.showPropertyPanel(newBlock);
    }, 50);
}

function deleteBlock(block) {
    if (block.classList.contains('locked')) { showToast('🔒 Нельзя удалить заблокированный блок'); return; }
    if (confirm('Удалить этот блок?')) {
        block.remove();
        clearSelection();
        if (propertyPanel) propertyPanel.classList.remove('show');
        saveToHistory();
        showToast('✅ Блок удалён');
    }
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

    if (widthInput) widthInput.addEventListener('change', () => applyStyle('width', widthInput.value ? widthInput.value + 'px' : ''));
    if (heightInput) heightInput.addEventListener('change', () => applyStyle('height', heightInput.value ? heightInput.value + 'px' : ''));
    if (paddingInput) paddingInput.addEventListener('change', () => applyStyle('padding', paddingInput.value));
    if (marginInput) marginInput.addEventListener('change', () => applyStyle('margin', marginInput.value));
    if (alignSelect) alignSelect.addEventListener('change', () => applyStyle('textAlign', alignSelect.value));
    if (lockBtn) lockBtn.addEventListener('click', () => {
        if (!currentElement) return;
        toggleBlockLock(currentElement);
        lockBtn.innerHTML = currentElement.classList.contains('locked') ? '🔒 Разблокировать' : '🔓 Заблокировать';
    });
    if (duplicateBtn) duplicateBtn.addEventListener('click', () => { if (currentElement) duplicateBlock(currentElement); });
    if (deleteBtn) deleteBtn.addEventListener('click', () => { if (currentElement) deleteBlock(currentElement); });
    if (moveUpBtn) moveUpBtn.addEventListener('click', () => { if (currentElement) moveBlockUp(currentElement); });
    if (moveDownBtn) moveDownBtn.addEventListener('click', () => { if (currentElement) moveBlockDown(currentElement); });
}

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
            <div class="prop-group"><label>📏 Ширина (px)</label><input type="number" id="propWidth" step="10" placeholder="auto"></div>
            <div class="prop-group"><label>📏 Высота (px)</label><input type="number" id="propHeight" step="10" placeholder="auto"></div>
            <div class="prop-group"><label>📐 Отступ внутри (padding)</label><input type="text" id="propPadding" placeholder="20px 15px"></div>
            <div class="prop-group"><label>📐 Отступ снаружи (margin)</label><input type="text" id="propMargin" placeholder="10px 0"></div>
            <div class="prop-group"><label>🎯 Выравнивание</label><select id="propAlign"><option value="left">По левому краю</option><option value="center">По центру</option><option value="right">По правому краю</option></select></div>
            <div class="prop-group"><label>⬆️ Порядок</label><div style="display:flex;gap:8px;"><button id="moveUpBtn" class="tool-btn move-up-btn">⬆️ Вверх</button><button id="moveDownBtn" class="tool-btn move-down-btn">⬇️ Вниз</button></div></div>
            <div class="prop-group"><label>🔒 Блокировка</label><button id="propLockBtn" class="lock-prop-btn">🔓 Заблокировать</button></div>
            <div class="prop-group"><label>📋 Дублировать блок</label><button id="propDuplicateBtn" class="duplicate-prop-btn">📋 Дублировать</button></div>
            <div class="prop-group"><label>🗑️ Удалить блок</label><button id="propDeleteBtn" class="delete-prop-btn">Удалить</button></div>

            <div id="textBlockStylesSection" style="display:none;">
                <div class="prop-group"><label>🎨 Фон</label><input type="color" id="textBgColor" value="#ffffff"></div>
                <div class="prop-group"><label>🔘 Скругление (px)</label><input type="range" id="textBorderRadius" min="0" max="50" value="0" step="1"><span id="textBorderRadiusValue">0px</span></div>
                <div class="prop-group"><label>🖌️ Рамка</label><div style="display:flex;gap:6px;"><input type="number" id="textBorderWidth" placeholder="толщина" step="1" style="width:70px;"><select id="textBorderStyle" style="width:100px;"><option value="solid">сплошная</option><option value="dashed">пунктир</option><option value="dotted">точки</option><option value="none">нет</option></select><input type="color" id="textBorderColor" value="#cccccc" style="width:40px;"></div></div>
                <div class="prop-group"><label>🌑 Тень</label><label><input type="checkbox" id="textShadowEnabled"> Включить</label><div id="textShadowControls" style="display:none;"><div style="display:flex;gap:6px;"><input type="number" id="textShadowX" placeholder="X" value="0" step="1" style="width:60px;"><input type="number" id="textShadowY" placeholder="Y" value="4" step="1" style="width:60px;"><input type="number" id="textShadowBlur" placeholder="размытие" value="12" step="1" style="width:60px;"></div><div><input type="color" id="textShadowColor" value="#000000"><label><input type="checkbox" id="textShadowInset"> Внутренняя</label></div></div></div>
            </div>
            <div id="containerStylesSection" style="display:none;">
                <div class="prop-group"><label>🔘 Скругление (px)</label><input type="range" id="containerBorderRadius" min="0" max="50" value="0" step="1"><span id="containerBorderRadiusValue">0px</span></div>
                <div class="prop-group"><label>🖌️ Рамка</label><div style="display:flex;gap:6px;"><input type="number" id="containerBorderWidth" placeholder="толщина" step="1" style="width:70px;"><select id="containerBorderStyle" style="width:100px;"><option value="solid">сплошная</option><option value="dashed">пунктир</option><option value="dotted">точки</option><option value="none">нет</option></select><input type="color" id="containerBorderColor" value="#cccccc" style="width:40px;"></div></div>
                <div class="prop-group"><label>🎨 Фон</label><input type="color" id="containerBgColor" value="#ffffff"></div>
                <div class="prop-group"><label>🌑 Тень</label><label><input type="checkbox" id="containerShadowEnabled"> Включить</label><div id="containerShadowControls" style="display:none;"><div style="display:flex;gap:6px;"><input type="number" id="containerShadowX" placeholder="X" value="0" step="1" style="width:60px;"><input type="number" id="containerShadowY" placeholder="Y" value="4" step="1" style="width:60px;"><input type="number" id="containerShadowBlur" placeholder="размытие" value="12" step="1" style="width:60px;"></div><div><input type="color" id="containerShadowColor" value="#000000"><label><input type="checkbox" id="containerShadowInset"> Внутренняя</label></div></div></div>
            </div>
            <div id="imageStylesSection" style="display:none;">
                <div class="prop-group"><label>🔘 Скругление (px)</label><input type="range" id="imgBorderRadius" min="0" max="50" value="0" step="1"><span id="imgBorderRadiusValue">0px</span></div>
                <div class="prop-group"><label>🖌️ Рамка</label><div style="display:flex;gap:6px;"><input type="number" id="imgBorderWidth" placeholder="толщина" step="1" style="width:70px;"><select id="imgBorderStyle" style="width:100px;"><option value="solid">сплошная</option><option value="dashed">пунктир</option><option value="dotted">точки</option><option value="none">нет</option></select><input type="color" id="imgBorderColor" value="#cccccc" style="width:40px;"></div></div>
                <div class="prop-group"><label>🌑 Тень</label><label><input type="checkbox" id="imgShadowEnabled"> Включить</label><div id="imgShadowControls" style="display:none;"><div style="display:flex;gap:6px;"><input type="number" id="imgShadowX" placeholder="X" value="0" step="1" style="width:60px;"><input type="number" id="imgShadowY" placeholder="Y" value="4" step="1" style="width:60px;"><input type="number" id="imgShadowBlur" placeholder="размытие" value="12" step="1" style="width:60px;"></div><div><input type="color" id="imgShadowColor" value="#000000"><label><input type="checkbox" id="imgShadowInset"> Внутренняя</label></div></div></div>
                <div class="prop-group"><label>🎨 Форма</label><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="tool-btn shape-btn" data-shape="none">Прямо</button><button class="tool-btn shape-btn" data-shape="circle">Круг</button><button class="tool-btn shape-btn" data-shape="oval">Овал</button><button class="tool-btn shape-btn" data-shape="rounded">Скруглённый</button><button class="tool-btn shape-btn" data-shape="hexagon">Шестиугольник</button><button class="tool-btn shape-btn" data-shape="star">Звезда</button></div></div>
                <div class="prop-group"><label>🪞 Отражение</label><div style="display:flex;gap:8px;"><button id="imgFlipH" class="tool-btn">↔️ По горизонтали</button><button id="imgFlipV" class="tool-btn">↕️ По вертикали</button></div></div>
            </div>
        </div>
    `;
    document.body.appendChild(propertyPanel);
    document.getElementById('closePropertyPanel')?.addEventListener('click', () => propertyPanel.classList.remove('show'));
    attachPropertyEvents();
    attachTextBlockEvents();
    attachContainerEvents();
    attachImageEvents();
    return propertyPanel;
}

export function hidePropertyPanel() {
    if (propertyPanel) propertyPanel.classList.remove('show');
}