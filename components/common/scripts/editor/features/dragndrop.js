// ========== ПЕРЕТАСКИВАНИЕ БЛОКОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';

let dragElement = null;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartLeft = 0, dragStartTop = 0;
let rafId = null;

export function initDragDrop() {
    document.addEventListener('mousedown', startDrag);
}

function startDrag(e) {
    if (!state.dragEnabled) return;

    // Не перетаскиваем служебные элементы
    if (e.target.classList?.contains('resize-handle')) return;
    if (e.target.classList?.contains('element-delete-btn')) return;
    if (e.target.closest('.slides-panel')) return;
    if (e.target.closest('.editor-toolbar')) return;

    // Находим перетаскиваемый блок
    let target = e.target.closest('.editable-object');
    if (!target) return;

    // Заблокированные блоки не перетаскиваем
    if (target.classList.contains('locked')) return;

    e.preventDefault();
    e.stopPropagation();

    dragElement = target;
    const rect = dragElement.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartLeft = rect.left + window.scrollX;
    dragStartTop = rect.top + window.scrollY;

    dragElement.classList.add('dragging');
    dragElement.style.cursor = 'grabbing';
    dragElement.style.opacity = '0.8';
    dragElement.style.zIndex = '100000';

    isDragging = true;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!isDragging || !dragElement) return;
    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
        if (!dragElement) return;

        let newLeft = dragStartLeft + (e.clientX - dragStartX);
        let newTop = dragStartTop + (e.clientY - dragStartY);

        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - dragElement.offsetWidth));
        newTop = Math.max(10, Math.min(newTop, window.innerHeight - dragElement.offsetHeight));

        dragElement.style.position = 'fixed';
        dragElement.style.left = newLeft + 'px';
        dragElement.style.top = newTop + 'px';
        dragElement.style.margin = '0';

        showDropIndicator(e);
    });
}

function showDropIndicator(e) {
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    const elemUnderCursor = document.elementsFromPoint(e.clientX, e.clientY)[0];
    let targetContainer = elemUnderCursor.closest('.container, .group-content, section');

    if (targetContainer && targetContainer !== dragElement?.parentElement) {
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        const rect = targetContainer.getBoundingClientRect();

        const children = Array.from(targetContainer.children);
        let insertBefore = true;
        for (let i = 0; i < children.length; i++) {
            const childRect = children[i].getBoundingClientRect();
            if (e.clientY < childRect.top + childRect.height / 2) break;
            insertBefore = false;
        }

        Object.assign(indicator.style, {
            position: 'absolute',
            height: '3px',
            background: '#ff9800',
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: '100001',
            width: rect.width + 'px',
            left: rect.left + 'px',
            top: (insertBefore ? rect.top - 2 : rect.bottom + 2) + 'px'
        });

        document.body.appendChild(indicator);
        dragElement._dropTarget = targetContainer;
        dragElement._insertBefore = insertBefore;
    }
}

function stopDrag() {
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    if (dragElement) {
        if (dragElement._dropTarget && dragElement._dropTarget !== dragElement.parentElement) {
            const target = dragElement._dropTarget;
            if (dragElement._insertBefore && target.firstChild) {
                target.insertBefore(dragElement, target.firstChild);
            } else if (!dragElement._insertBefore && target.lastChild) {
                target.insertBefore(dragElement, target.lastChild.nextSibling);
            } else {
                target.appendChild(dragElement);
            }
            showToast('✅ Элемент перемещён');
        }

        dragElement.classList.remove('dragging');
        dragElement.style.cssText = '';
        delete dragElement._dropTarget;
        delete dragElement._insertBefore;
    }

    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    dragElement = null;
    isDragging = false;
}