// ---------- Core Functions ----------
function getOrCreateUserId() {
    let userId = localStorage.getItem('hr_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('hr_user_id', userId);
    }
    return userId;
}

function sendDataToSheet(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUUIy_I9Z0qXBQmYMQmwCpkjVAdGemxl6k9DZiVF9djhI_w7Th7fMGaCbVNI-EyDnnBQ/exec';
    const userId = getOrCreateUserId();
    data.userId = userId;

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
    })
    .then(() => console.log('✅ Отправлено, userId:', userId))
    .catch(error => console.error('❌ Ошибка:', error));
}

function showToast(message, duration = 3000) {
    let toast = document.querySelector('.custom-toast');
    if (toast) toast.remove();

    toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 24px;border-radius:40px;font-size:1rem;z-index:10000;font-family:Inter,sans-serif;backdrop-filter:blur(8px);box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function formatPhoneNumber(input) {
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    if (digits.length > 11) digits = digits.slice(0, 11);
    let formatted = '';
    if (digits.length === 0) return '';
    formatted = '+7';
    if (digits.length > 1) formatted += ' ' + digits.slice(1, 4);
    if (digits.length >= 5) formatted += ' ' + digits.slice(4, 7);
    if (digits.length >= 8) formatted += ' ' + digits.slice(7, 9);
    if (digits.length >= 10) formatted += ' ' + digits.slice(9, 11);
    return formatted;
}