// ========== ОБЩИЕ УТИЛИТЫ ==========
export function showToast(message, duration = 3000) {
    let toast = document.querySelector('.editor-toast');
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.className = 'editor-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function addDeleteButton(element, onDelete) {
    removeDeleteButton();
    if (!element) return;
    const btn = document.createElement('button');
    btn.className = 'element-delete-btn';
    btn.innerHTML = '×';
    btn.onclick = (e) => {
        e.stopPropagation();
        if (element.parentNode) {
            element.remove();
            if (onDelete) onDelete();
            showToast('✅ Элемент удалён');
        }
    };
    element.style.position = element.style.position || 'relative';
    element.appendChild(btn);
}

export function removeDeleteButton() {
    const btn = document.querySelector('.element-delete-btn');
    if (btn) btn.remove();
}

export function addLockButton(element, isLocked, onToggle) {
    let btn = element.querySelector('.element-lock-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.className = 'element-lock-btn';
        element.appendChild(btn);
    }
    btn.innerHTML = isLocked ? '🔒' : '🔓';
    btn.title = isLocked ? 'Разблокировать' : 'Заблокировать';
    btn.onclick = (e) => {
        e.stopPropagation();
        if (onToggle) onToggle();
    };
}

export function toggleLock(element) {
    const wasLocked = element.classList.contains('locked');
    if (wasLocked) {
        element.classList.remove('locked');
    } else {
        element.classList.add('locked');
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
        }
    }
    const btn = element.querySelector('.element-lock-btn');
    if (btn) {
        btn.innerHTML = wasLocked ? '🔓' : '🔒';
        btn.title = wasLocked ? 'Заблокировать' : 'Разблокировать';
    }
    showToast(wasLocked ? '🔓 Блок разблокирован' : '🔒 Блок заблокирован');
    return !wasLocked;
}