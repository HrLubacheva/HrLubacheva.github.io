function initCopyButtons() {
    logInit('initCopyButtons started', 'INFO', '', 3);
    document.querySelectorAll('.copyable-phone, .copyable-text').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const textToCopy = this.getAttribute('data-copy');
            if (!textToCopy) return;
            navigator.clipboard.writeText(textToCopy).then(() => { showToast('✅ Скопировано!'); }).catch(err => { logError('Ошибка копирования:', err); showErrorToast('Не удалось скопировать. Попробуйте вручную.'); });
        });
    });
    logInit('initCopyButtons finished', 'INFO', '', 3);
}
window.initCopyButtons = initCopyButtons;