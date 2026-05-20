// ========== РЕДАКТИРОВАНИЕ ФОТО (РЕСАЙЗ, ОБРЕЗКА, ФОРМЫ) ==========
import { state } from './state.js';
import { showToast } from './utils.js';

// ========== РЕСАЙЗ ==========
export function addResizeHandles(element) {
    removeResizeHandles();
    if (!element || element.tagName !== 'IMG') return;
    if (!state.isEditMode) return;
    
    const positions = [
        { pos: 'se', cursor: 'se-resize', x: '100%', y: '100%' },
        { pos: 'sw', cursor: 'sw-resize', x: 0, y: '100%' },
        { pos: 'ne', cursor: 'ne-resize', x: '100%', y: 0 },
        { pos: 'nw', cursor: 'nw-resize', x: 0, y: 0 }
    ];
    
    element.style.position = 'relative';
    
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.style.position = 'absolute';
        handle.style.left = pos.x === 0 ? '-6px' : `calc(${pos.x} - 6px)`;
        handle.style.top = pos.y === 0 ? '-6px' : `calc(${pos.y} - 6px)`;
        handle.style.cursor = pos.cursor;
        handle.setAttribute('data-handle', pos.pos);
        
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startResize(e, element, pos.pos);
        });
        
        element.appendChild(handle);
    });
}

export function removeResizeHandles() {
    document.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
}

function startResize(e, img, handle) {
    state.isResizing = true;
    state.resizeElement = img;
    state.activeResizeHandle = handle;
    state.resizeStartX = e.clientX;
    state.resizeStartY = e.clientY;
    state.resizeStartWidth = img.offsetWidth;
    state.resizeStartHeight = img.offsetHeight;
    e.preventDefault();
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
    if (!state.isResizing || !state.resizeElement) return;
    
    const dx = e.clientX - state.resizeStartX;
    const dy = e.clientY - state.resizeStartY;
    let newWidth = state.resizeStartWidth;
    let newHeight = state.resizeStartHeight;
    
    switch(state.activeResizeHandle) {
        case 'se':
            newWidth = Math.max(20, state.resizeStartWidth + dx);
            newHeight = Math.max(20, state.resizeStartHeight + dy);
            break;
        case 'sw':
            newWidth = Math.max(20, state.resizeStartWidth - dx);
            newHeight = Math.max(20, state.resizeStartHeight + dy);
            break;
        case 'ne':
            newWidth = Math.max(20, state.resizeStartWidth + dx);
            newHeight = Math.max(20, state.resizeStartHeight - dy);
            break;
        case 'nw':
            newWidth = Math.max(20, state.resizeStartWidth - dx);
            newHeight = Math.max(20, state.resizeStartHeight - dy);
            break;
    }
    
    state.resizeElement.style.width = newWidth + 'px';
    state.resizeElement.style.height = newHeight + 'px';
    
    if (!state.sizeIndicator) {
        state.sizeIndicator = document.createElement('div');
        state.sizeIndicator.className = 'size-indicator';
        document.body.appendChild(state.sizeIndicator);
    }
    state.sizeIndicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
    state.sizeIndicator.style.left = (e.clientX + 20) + 'px';
    state.sizeIndicator.style.top = (e.clientY - 30) + 'px';
    state.sizeIndicator.style.display = 'block';
}

function stopResize() {
    state.isResizing = false;
    state.resizeElement = null;
    state.activeResizeHandle = null;
    if (state.sizeIndicator) {
        setTimeout(() => { if (state.sizeIndicator) state.sizeIndicator.style.display = 'none'; }, 1000);
    }
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
    if (state.selectedElement && state.selectedElement.tagName === 'IMG') addResizeHandles(state.selectedElement);
}

// ========== ФОРМЫ ФОТО ==========
export function showShapeSelector(img) {
    hideShapeSelector();
    
    state.shapeSelector = document.createElement('div');
    state.shapeSelector.className = 'shape-selector';
    state.shapeSelector.innerHTML = `
        <button class="shape-btn" data-shape="circle" title="Круг">⚪</button>
        <button class="shape-btn" data-shape="oval" title="Овал">🥚</button>
        <button class="shape-btn" data-shape="square" title="Квадрат">◻️</button>
        <button class="shape-btn" data-shape="rounded" title="Скруглённые углы">🔘</button>
        <button class="shape-btn" data-shape="hexagon" title="Шестиугольник">⬡</button>
        <button class="shape-btn" data-shape="pentagon" title="Пятиугольник">⬟</button>
        <button class="shape-btn" data-shape="none" title="Обычный">📷</button>
    `;
    
    img.parentElement.style.position = 'relative';
    img.parentElement.appendChild(state.shapeSelector);
    
    state.shapeSelector.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const shape = btn.dataset.shape;
            applyShapeToImage(img, shape);
            hideShapeSelector();
        });
    });
}

export function hideShapeSelector() {
    if (state.shapeSelector) state.shapeSelector.remove();
    state.shapeSelector = null;
}

function applyShapeToImage(img, shape) {
    img.classList.remove('img-shape-circle', 'img-shape-oval', 'img-shape-square', 'img-shape-rounded', 'img-shape-hexagon', 'img-shape-pentagon');
    
    if (shape !== 'none') {
        img.classList.add(`img-shape-${shape}`);
    }
    
    if (shape === 'circle' || shape === 'oval') {
        img.style.objectFit = 'cover';
    } else {
        img.style.objectFit = '';
    }
    
    showToast(`✅ Форма фото: ${shape}`);
}

// ========== ОБРЕЗКА ФОТО ==========
export function startCrop() {
    if (!state.selectedElement || state.selectedElement.tagName !== 'IMG') {
        showToast('⚠️ Сначала выберите фото');
        return;
    }
    
    state.cropImageElement = state.selectedElement;
    const imgSrc = state.cropImageElement.src;
    
    state.cropOverlay = document.createElement('div');
    state.cropOverlay.className = 'crop-overlay';
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const container = document.createElement('div');
        container.className = 'crop-container';
        
        const displayImg = document.createElement('img');
        displayImg.src = imgSrc;
        displayImg.className = 'crop-image';
        
        container.appendChild(displayImg);
        state.cropOverlay.appendChild(container);
        
        setTimeout(() => {
            const imgRect = displayImg.getBoundingClientRect();
            const cropWidth = imgRect.width * 0.8;
            const cropHeight = imgRect.height * 0.8;
            const cropLeft = (imgRect.width - cropWidth) / 2;
            const cropTop = (imgRect.height - cropHeight) / 2;
            
            state.cropArea = document.createElement('div');
            state.cropArea.className = 'crop-area';
            state.cropArea.style.left = cropLeft + 'px';
            state.cropArea.style.top = cropTop + 'px';
            state.cropArea.style.width = cropWidth + 'px';
            state.cropArea.style.height = cropHeight + 'px';
            container.appendChild(state.cropArea);
            
            const positions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
            positions.forEach(pos => {
                const handle = document.createElement('div');
                handle.className = `crop-resize-handle ${pos}`;
                state.cropArea.appendChild(handle);
            });
            
            makeCropAreaDraggable(state.cropArea, container);
            makeCropAreaResizable(state.cropArea, container);
        }, 100);
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'crop-buttons';
        buttonsDiv.innerHTML = `
            <button class="crop-apply">✅ Применить обрезку</button>
            <button class="crop-cancel">❌ Отмена</button>
        `;
        state.cropOverlay.appendChild(buttonsDiv);
        
        document.body.appendChild(state.cropOverlay);
        
        buttonsDiv.querySelector('.crop-apply').onclick = () => applyCrop(displayImg, state.cropArea, container);
        buttonsDiv.querySelector('.crop-cancel').onclick = () => state.cropOverlay.remove();
    };
    img.src = imgSrc;
}

function makeCropAreaDraggable(area, container) {
    let startX, startY, startLeft, startTop;
    
    area.addEventListener('mousedown', (e) => {
        if (e.target === area || e.target.classList.contains('crop-area')) {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseFloat(area.style.left);
            startTop = parseFloat(area.style.top);
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });
    
    function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        const containerRect = container.querySelector('.crop-image').getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();
        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - areaRect.width));
        newTop = Math.max(0, Math.min(newTop, containerRect.height - areaRect.height));
        area.style.left = newLeft + 'px';
        area.style.top = newTop + 'px';
    }
    
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function makeCropAreaResizable(area, container) {
    const handles = area.querySelectorAll('.crop-resize-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseFloat(area.style.width);
            const startHeight = parseFloat(area.style.height);
            const startLeft = parseFloat(area.style.left);
            const startTop = parseFloat(area.style.top);
            const direction = handle.classList[1];
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            function onMouseMove(me) {
                const dx = me.clientX - startX;
                const dy = me.clientY - startY;
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                if (direction.includes('e')) newWidth = Math.max(50, startWidth + dx);
                if (direction.includes('w')) {
                    newWidth = Math.max(50, startWidth - dx);
                    newLeft = startLeft + (startWidth - newWidth);
                }
                if (direction.includes('s')) newHeight = Math.max(50, startHeight + dy);
                if (direction.includes('n')) {
                    newHeight = Math.max(50, startHeight - dy);
                    newTop = startTop + (startHeight - newHeight);
                }
                
                const containerRect = container.querySelector('.crop-image').getBoundingClientRect();
                newLeft = Math.max(0, Math.min(newLeft, containerRect.width - newWidth));
                newTop = Math.max(0, Math.min(newTop, containerRect.height - newHeight));
                
                area.style.width = newWidth + 'px';
                area.style.height = newHeight + 'px';
                area.style.left = newLeft + 'px';
                area.style.top = newTop + 'px';
            }
            
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        });
    });
}

function applyCrop(displayImg, cropArea, container) {
    const imgRect = displayImg.getBoundingClientRect();
    const naturalWidth = state.cropImageElement.naturalWidth;
    const naturalHeight = state.cropImageElement.naturalHeight;
    
    const scaleX = naturalWidth / imgRect.width;
    const scaleY = naturalHeight / imgRect.height;
    
    const cropLeft = parseFloat(cropArea.style.left) * scaleX;
    const cropTop = parseFloat(cropArea.style.top) * scaleY;
    const cropWidth = parseFloat(cropArea.style.width) * scaleX;
    const cropHeight = parseFloat(cropArea.style.height) * scaleY;
    
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        ctx.drawImage(img, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        const croppedSrc = canvas.toDataURL('image/jpeg', 0.9);
        state.cropImageElement.src = croppedSrc;
        state.cropOverlay.remove();
        showToast('✅ Фото обрезано');
    };
    img.src = state.cropImageElement.src;
}