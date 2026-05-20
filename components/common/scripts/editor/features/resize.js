// ========== ИЗМЕНЕНИЕ РАЗМЕРОВ (ФОТО И БЛОКОВ) ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';

let isResizing = false;
let resizeElement = null;
let resizeStartX = 0, resizeStartY = 0;
let resizeStartWidth = 0, resizeStartHeight = 0;
let resizeHandle = null;
let sizeIndicator = null;

export function addResizeHandles(element) {
    removeResizeHandles();

    if (!element || element.tagName !== 'IMG') return;
    if (!state.isEditMode) return;

    element.style.position = 'relative';
    element.style.display = 'inline-block';

    resizeHandle = document.createElement('div');
    resizeHandle.className = 'image-resize-handle';
    resizeHandle.innerHTML = '◢';
    resizeHandle.title = 'Изменить размер (тяните)';
    Object.assign(resizeHandle.style, {
        position: 'absolute',
        bottom: '-8px',
        right: '-8px',
        width: '22px',
        height: '22px',
        background: '#ff9800',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        cursor: 'nw-resize',
        zIndex: '10010',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        border: '2px solid white'
    });

    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startResize(e, element);
    });

    element.parentElement.style.position = 'relative';
    element.parentElement.appendChild(resizeHandle);
}

export function removeResizeHandles() {
    if (resizeHandle) {
        resizeHandle.remove();
        resizeHandle = null;
    }
    if (sizeIndicator) {
        sizeIndicator.remove();
        sizeIndicator = null;
    }
}

function startResize(e, img) {
    isResizing = true;
    resizeElement = img;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartWidth = img.offsetWidth;
    resizeStartHeight = img.offsetHeight;

    document.body.style.cursor = 'nw-resize';
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
    if (!isResizing || !resizeElement) return;

    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;

    let newWidth = Math.max(50, resizeStartWidth + dx);
    let newHeight = Math.max(50, resizeStartHeight + dy);

    if (e.shiftKey) {
        const aspectRatio = resizeStartWidth / resizeStartHeight;
        newHeight = newWidth / aspectRatio;
    }

    resizeElement.style.width = newWidth + 'px';
    resizeElement.style.height = newHeight + 'px';

    if (!sizeIndicator) {
        sizeIndicator = document.createElement('div');
        Object.assign(sizeIndicator.style, {
            position: 'fixed',
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: '10011',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
        });
        document.body.appendChild(sizeIndicator);
    }

    sizeIndicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
    sizeIndicator.style.left = (e.clientX + 15) + 'px';
    sizeIndicator.style.top = (e.clientY - 30) + 'px';
    sizeIndicator.style.display = 'block';
}

function stopResize() {
    isResizing = false;
    resizeElement = null;
    document.body.style.cursor = '';

    if (sizeIndicator) {
        sizeIndicator.style.display = 'none';
    }

    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
}

export function applyShapeToImage(img, shape) {
    const shapes = ['circle', 'oval', 'square', 'rounded', 'hexagon', 'pentagon'];
    shapes.forEach(s => img.classList.remove(`img-shape-${s}`));

    if (shape !== 'none') {
        img.classList.add(`img-shape-${shape}`);
    }

    if (shape === 'circle' || shape === 'oval') {
        img.style.objectFit = 'cover';
    } else {
        img.style.objectFit = '';
    }

    showToast(`✅ Форма фото: ${shape === 'none' ? 'обычная' : shape}`);
}