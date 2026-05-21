export function showToast(message, duration = 3000) {
    let toast = document.querySelector('.editor-toast');
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.className = 'editor-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 12px 24px;
        border-radius: 40px;
        font-size: 14px;
        z-index: 10002;
        font-family: 'Inter', sans-serif;
        white-space: nowrap;
    `;
    document.body.appendChild(toast);
    if (duration > 0) {
        setTimeout(() => toast.remove(), duration);
    }
    return toast;
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