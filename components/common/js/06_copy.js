function initCopyButtons() {
    document.querySelectorAll('.copyable-phone, .copyable-text').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const textToCopy = this.getAttribute('data-copy');
            if (!textToCopy) return;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('✅ Скопировано!');
            }).catch(err => {
                logError('Ошибка копирования:', err);
                alert('Не удалось скопировать. Попробуйте вручную.');
            });
        });
    });
}
window.initCopyButtons = initCopyButtons;