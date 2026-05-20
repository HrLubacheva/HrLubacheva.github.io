// ========== ПОЛНОЦЕННЫЙ РЕДАКТОР СЛАЙДОВ ==========
import { showToast } from '../core/utils.js';

let activeSlide = null;
let selectedObjects = [];
let isDragging = false;
let isResizing = false;
let dragStartX, dragStartY;
let dragStartLeft, dragStartTop, dragStartWidth, dragStartHeight;
let selectionRect = null;
let clipboard = [];
let currentZIndex = 100;
let slideHistory = [];
let historyIndex = -1;

const SLIDE_WIDTH = 1200;
const SLIDE_HEIGHT = 675;

// Стили
function addSlideEditorStyles() {
    if (document.getElementById('slide-editor-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'slide-editor-styles';
    styles.textContent = `
        body.slide-edit-mode { background: #1a1a1a; overflow: hidden; height: 100vh; margin: 0; }
        .slide-editor-container { display: flex; flex-direction: column; height: 100vh; background: #1a1a1a; }
        .slide-editor-toolbar { background: #2d2d2d; padding: 8px 16px; display: flex; gap: 8px; border-bottom: 1px solid #444; z-index: 1000; }
        .slide-editor-toolbar button { padding: 8px 16px; background: #3d3d3d; border: none; border-radius: 8px; color: white; cursor: pointer; }
        .slide-editor-toolbar button:hover { background: #4d4d4d; }
        .slide-editor-toolbar .separator { width: 1px; background: #444; margin: 0 8px; }
        .slide-canvas-area { flex: 1; display: flex; justify-content: center; align-items: center; overflow: auto; background: #1a1a1a; }
        .slide-container { position: relative; background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.3); margin: 20px; }
        .slide-canvas { position: relative; width: 1200px; height: 675px; background: white; overflow: hidden; }
        .slide-bounds { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 10; }
        .slide-bounds-left, .slide-bounds-right { position: absolute; top: 0; bottom: 0; width: 30px; background: rgba(45,106,159,0.2); }
        .slide-bounds-left { left: 0; border-right: 2px solid #2D6A9F; }
        .slide-bounds-right { right: 0; border-left: 2px solid #2D6A9F; }
        .slide-object { position: absolute; cursor: move; user-select: none; box-sizing: border-box; }
        .slide-object.selected { outline: 3px solid #ff9800; z-index: 10000 !important; }
        .resize-handles { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 10001; }
        .resize-handle { position: absolute; width: 12px; height: 12px; background: #ff9800; border: 2px solid white; border-radius: 2px; pointer-events: auto; cursor: pointer; }
        .resize-handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
        .resize-handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
        .resize-handle.w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
        .resize-handle.e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }
        .resize-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
        .resize-handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
        .object-context-menu { position: fixed; background: #2d2d2d; border-radius: 8px; padding: 8px 0; min-width: 180px; z-index: 20000; }
        .object-context-menu button { display: block; width: 100%; padding: 10px 20px; background: none; border: none; color: white; text-align: left; cursor: pointer; }
        .object-context-menu button:hover { background: #3d3d3d; }
        .object-context-menu .separator { height: 1px; background: #444; margin: 4px 0; }
        .selection-rect { position: absolute; background: rgba(45,106,159,0.2); border: 2px solid #2D6A9F; pointer-events: none; z-index: 100000; }
        .slides-thumbnails { position: fixed; left: 0; top: 80px; bottom: 0; width: 160px; background: #2d2d2d; border-right: 1px solid #444; overflow-y: auto; padding: 10px; z-index: 100; }
        .slide-thumbnail { background: white; border-radius: 8px; margin-bottom: 12px; cursor: pointer; position: relative; }
        .slide-thumbnail.active { outline: 3px solid #2D6A9F; }
        .slide-thumbnail canvas { width: 100%; height: auto; border-radius: 8px; }
        .slide-thumbnail .delete-slide { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: #dc3545; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px; }
    `;
    document.head.appendChild(styles);
}

function saveSlideHistory() {
    if (!activeSlide) return;
    const slideData = { objects: [] };
    activeSlide.querySelectorAll('.slide-object').forEach(obj => {
        slideData.objects.push({
            type: obj.dataset.type,
            left: parseInt(obj.style.left),
            top: parseInt(obj.style.top),
            width: parseInt(obj.style.width),
            height: parseInt(obj.style.height),
            zIndex: parseInt(obj.style.zIndex),
            content: getObjectContent(obj)
        });
    });
    if (historyIndex < slideHistory.length - 1) slideHistory = slideHistory.slice(0, historyIndex + 1);
    slideHistory.push(slideData);
    if (slideHistory.length > 50) slideHistory.shift();
    historyIndex = slideHistory.length - 1;
}

function undoSlide() {
    if (historyIndex > 0) { historyIndex--; restoreSlide(slideHistory[historyIndex]); showToast('↩️ Отменено'); }
}

function redoSlide() {
    if (historyIndex < slideHistory.length - 1) { historyIndex++; restoreSlide(slideHistory[historyIndex]); showToast('↪️ Возвращено'); }
}

function restoreSlide(slideData) {
    if (!activeSlide) return;
    const canvas = activeSlide.querySelector('.slide-canvas');
    canvas.querySelectorAll('.slide-object').forEach(obj => obj.remove());
    slideData.objects.forEach(objData => {
        const obj = createSlideObject(objData.type, objData.content);
        obj.style.left = objData.left + 'px';
        obj.style.top = objData.top + 'px';
        obj.style.width = objData.width + 'px';
        obj.style.height = objData.height + 'px';
        obj.style.zIndex = objData.zIndex;
        canvas.appendChild(obj);
        makeObjectInteractive(obj);
    });
    updateThumbnails();
}

function getObjectContent(obj) {
    if (obj.dataset.type === 'text') return obj.innerHTML;
    if (obj.dataset.type === 'image') {
        const img = obj.querySelector('img');
        return img ? img.src : '';
    }
    return '';
}

function createSlideObject(type, content) {
    const obj = document.createElement('div');
    obj.className = 'slide-object';
    obj.setAttribute('data-type', type);
    obj.id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    obj.style.position = 'absolute';
    obj.style.left = '100px';
    obj.style.top = '100px';
    obj.style.zIndex = currentZIndex++;

    if (type === 'text') {
        obj.contentEditable = 'true';
        obj.innerHTML = content || '<p><strong>Новый текст</strong><br>Двойной клик для редактирования</p>';
        obj.style.minWidth = '150px';
        obj.style.minHeight = '60px';
        obj.style.padding = '12px';
        obj.style.background = 'rgba(255,255,255,0.9)';
        obj.style.borderRadius = '8px';
        obj.style.fontSize = '16px';
        obj.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        obj.addEventListener('blur', () => saveSlideHistory());
    } else if (type === 'image') {
        const img = document.createElement('img');
        img.src = content || 'https://via.placeholder.com/300x200?text=Image';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        obj.appendChild(img);
        obj.style.width = '300px';
        obj.style.height = '200px';
        obj.style.background = '#f0f0f0';
    }
    return obj;
}

function makeObjectInteractive(obj) {
    obj.addEventListener('mousedown', (e) => {
        if (e.target === obj || obj.contains(e.target) && !e.target.classList.contains('resize-handle')) {
            e.stopPropagation();
            if (!e.ctrlKey && !e.shiftKey) clearSelection();
            if (!obj.classList.contains('selected')) {
                obj.classList.add('selected');
                selectedObjects.push(obj);
            }
            if (selectedObjects.length === 1) showResizeHandles(selectedObjects[0]);
            if (!e.target.classList.contains('resize-handle')) {
                isDragging = true;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                dragStartLeft = parseInt(obj.style.left);
                dragStartTop = parseInt(obj.style.top);
                e.preventDefault();
            }
        }
    });
    obj.addEventListener('contextmenu', (e) => { e.preventDefault(); showContextMenu(e, obj); });
}

function showResizeHandles(obj) {
    hideResizeHandles();
    const handles = document.createElement('div');
    handles.className = 'resize-handles';
    handles.innerHTML = `<div class="resize-handle nw"></div><div class="resize-handle n"></div><div class="resize-handle ne"></div>
        <div class="resize-handle w"></div><div class="resize-handle e"></div>
        <div class="resize-handle sw"></div><div class="resize-handle s"></div><div class="resize-handle se"></div>`;
    obj.appendChild(handles);
    handles.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            const type = handle.className.split(' ')[1];
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartWidth = parseInt(obj.style.width);
            dragStartHeight = parseInt(obj.style.height);
            dragStartLeft = parseInt(obj.style.left);
            dragStartTop = parseInt(obj.style.top);
            obj.dataset.resizeType = type;
            e.preventDefault();
        });
    });
}

function hideResizeHandles() {
    document.querySelectorAll('.resize-handles').forEach(h => h.remove());
}

function showContextMenu(e, obj) {
    const menu = document.createElement('div');
    menu.className = 'object-context-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.innerHTML = `<button data-action="copy">📋 Копировать</button><button data-action="paste">📌 Вставить</button>
        <div class="separator"></div><button data-action="bringForward">⬆️ На передний план</button>
        <button data-action="sendBackward">⬇️ На задний план</button><div class="separator"></div>
        <button data-action="delete" style="color:#ff6b6b;">🗑️ Удалить</button>`;
    document.body.appendChild(menu);
    menu.querySelector('[data-action="copy"]').onclick = () => { copySelected(); menu.remove(); };
    menu.querySelector('[data-action="paste"]').onclick = () => { pasteSelected(); menu.remove(); };
    menu.querySelector('[data-action="bringForward"]').onclick = () => { bringToFront(obj); menu.remove(); };
    menu.querySelector('[data-action="sendBackward"]').onclick = () => { sendToBack(obj); menu.remove(); };
    menu.querySelector('[data-action="delete"]').onclick = () => { deleteSelected(); menu.remove(); };
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
}

function copySelected() {
    clipboard = [];
    selectedObjects.forEach(obj => {
        clipboard.push({ type: obj.dataset.type, content: getObjectContent(obj), width: obj.style.width, height: obj.style.height });
    });
    showToast(`📋 Скопировано ${clipboard.length} объектов`);
}

function pasteSelected() {
    if (clipboard.length === 0) return;
    clearSelection();
    clipboard.forEach(item => {
        const newObj = createSlideObject(item.type, item.content);
        newObj.style.left = (parseInt(selectedObjects[0]?.style.left || 100) + 20) + 'px';
        newObj.style.top = (parseInt(selectedObjects[0]?.style.top || 100) + 20) + 'px';
        newObj.style.width = item.width;
        newObj.style.height = item.height;
        activeSlide.querySelector('.slide-canvas').appendChild(newObj);
        makeObjectInteractive(newObj);
        newObj.classList.add('selected');
        selectedObjects.push(newObj);
    });
    saveSlideHistory();
    showToast(`📌 Вставлено ${clipboard.length} объектов`);
}

function bringToFront(obj) {
    let maxZ = 0;
    activeSlide.querySelectorAll('.slide-object').forEach(o => { const z = parseInt(o.style.zIndex); if (z > maxZ) maxZ = z; });
    obj.style.zIndex = maxZ + 1;
    saveSlideHistory();
}

function sendToBack(obj) {
    let minZ = Infinity;
    activeSlide.querySelectorAll('.slide-object').forEach(o => { const z = parseInt(o.style.zIndex); if (z < minZ) minZ = z; });
    obj.style.zIndex = minZ - 1;
    saveSlideHistory();
}

function deleteSelected() {
    if (selectedObjects.length === 0) return;
    selectedObjects.forEach(obj => obj.remove());
    clearSelection();
    saveSlideHistory();
    showToast('🗑️ Объекты удалены');
}

function clearSelection() {
    selectedObjects.forEach(obj => obj.classList.remove('selected'));
    selectedObjects = [];
    hideResizeHandles();
}

function updateThumbnails() {
    const container = document.querySelector('.slides-thumbnails');
    if (!container) return;
    const slides = document.querySelectorAll('.slide-wrapper');
    container.innerHTML = '<h4 style="color:white; margin-bottom:12px;">📑 Слайды</h4>';
    slides.forEach((slide, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'slide-thumbnail';
        if (slide === activeSlide) thumb.classList.add('active');
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 160, 90);
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.fillText(`Слайд ${index + 1}`, 10, 20);
        thumb.appendChild(canvas);
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-slide';
        delBtn.innerHTML = '×';
        delBtn.onclick = (e) => { e.stopPropagation(); if (confirm('Удалить слайд?')) { slide.remove(); updateThumbnails(); } };
        thumb.appendChild(delBtn);
        thumb.onclick = () => {
            document.querySelectorAll('.slide-wrapper').forEach(s => s.classList.remove('active'));
            slide.classList.add('active');
            activeSlide = slide;
            updateThumbnails();
            clearSelection();
        };
        container.appendChild(thumb);
    });
}

function createNewSlide() {
    const container = document.querySelector('.slide-container');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-wrapper';
    const canvas = document.createElement('div');
    canvas.className = 'slide-canvas';
    canvas.style.width = SLIDE_WIDTH + 'px';
    canvas.style.height = SLIDE_HEIGHT + 'px';
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
    const textObj = createSlideObject('text', '<h2>Новый слайд</h2><p>Перетащите меня в любую точку</p>');
    textObj.style.left = '50px';
    textObj.style.top = '50px';
    textObj.style.width = '300px';
    canvas.appendChild(textObj);
    makeObjectInteractive(textObj);
    updateThumbnails();
    saveSlideHistory();
    showToast('✅ Новый слайд создан');
}

function initGlobalHandlers() {
    document.addEventListener('mousemove', (e) => {
        if (isDragging && selectedObjects.length > 0) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            selectedObjects.forEach(obj => {
                let newLeft = dragStartLeft + deltaX;
                let newTop = dragStartTop + deltaY;
                newLeft = Math.max(0, Math.min(newLeft, SLIDE_WIDTH - parseInt(obj.style.width)));
                newTop = Math.max(0, Math.min(newTop, SLIDE_HEIGHT - parseInt(obj.style.height)));
                obj.style.left = newLeft + 'px';
                obj.style.top = newTop + 'px';
            });
        }
        if (isResizing && selectedObjects.length === 1) {
            const obj = selectedObjects[0];
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            const type = obj.dataset.resizeType;
            let w = dragStartWidth, h = dragStartHeight, l = dragStartLeft, t = dragStartTop;
            if (type.includes('e')) w = dragStartWidth + deltaX;
            if (type.includes('w')) { w = dragStartWidth - deltaX; l = dragStartLeft + deltaX; }
            if (type.includes('s')) h = dragStartHeight + deltaY;
            if (type.includes('n')) { h = dragStartHeight - deltaY; t = dragStartTop + deltaY; }
            w = Math.max(50, w); h = Math.max(40, h);
            obj.style.width = w + 'px';
            obj.style.height = h + 'px';
            obj.style.left = l + 'px';
            obj.style.top = t + 'px';
        }
    });
    document.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            if (selectedObjects[0]) delete selectedObjects[0].dataset.resizeType;
            saveSlideHistory();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (!activeSlide) return;
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoSlide(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redoSlide(); }
        if (e.ctrlKey && e.key === 'c') { e.preventDefault(); copySelected(); }
        if (e.ctrlKey && e.key === 'v') { e.preventDefault(); pasteSelected(); }
        if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); }
    });
}

export function enableSlideEditMode() {
    addSlideEditorStyles();
    const originalContent = document.querySelector('.container').innerHTML;
    localStorage.setItem('original_content_slides', originalContent);

    document.body.innerHTML = `
        <div class="slide-editor-container">
            <div class="slide-editor-toolbar">
                <button id="newSlideBtn">➕ Новый слайд</button>
                <button id="undoSlideBtn">↩️ Отменить</button>
                <button id="redoSlideBtn">↪️ Вернуть</button>
                <div class="separator"></div>
                <button id="exportSlidesBtn">💾 Экспорт</button>
                <div class="separator"></div>
                <button id="exitSlideModeBtn" style="background:#dc3545;">✖️ Выйти</button>
            </div>
            <div class="slides-thumbnails"></div>
            <div class="slide-canvas-area">
                <div class="slide-container"></div>
            </div>
        </div>
    `;

    const container = document.querySelector('.slide-container');
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-wrapper';
    const canvas = document.createElement('div');
    canvas.className = 'slide-canvas';
    canvas.style.width = SLIDE_WIDTH + 'px';
    canvas.style.height = SLIDE_HEIGHT + 'px';
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
    activeSlide = wrapper;

    const textObj = createSlideObject('text', '<h1>Добро пожаловать!</h1><p>Это ваш первый слайд. Перетащите меня в любую точку.</p><p>ПКМ для контекстного меню</p>');
    textObj.style.left = '100px';
    textObj.style.top = '100px';
    textObj.style.width = '400px';
    canvas.appendChild(textObj);
    makeObjectInteractive(textObj);

    updateThumbnails();
    initGlobalHandlers();
    saveSlideHistory();

    document.getElementById('newSlideBtn')?.addEventListener('click', createNewSlide);
    document.getElementById('undoSlideBtn')?.addEventListener('click', undoSlide);
    document.getElementById('redoSlideBtn')?.addEventListener('click', redoSlide);
    document.getElementById('exportSlidesBtn')?.addEventListener('click', () => {
        const allSlides = [];
        document.querySelectorAll('.slide-wrapper').forEach(slide => {
            const slideData = { objects: [] };
            slide.querySelectorAll('.slide-object').forEach(obj => {
                slideData.objects.push({ type: obj.dataset.type, left: obj.style.left, top: obj.style.top, width: obj.style.width, height: obj.style.height, content: getObjectContent(obj) });
            });
            allSlides.push(slideData);
        });
        localStorage.setItem('slides_data', JSON.stringify(allSlides));
        showToast('💾 Все слайды сохранены!');
    });
    document.getElementById('exitSlideModeBtn')?.addEventListener('click', () => {
        document.body.innerHTML = localStorage.getItem('original_content_slides');
        location.reload();
    });

    showToast('🎬 PowerPoint режим включён! Перетаскивайте объекты, меняйте размеры!');
}