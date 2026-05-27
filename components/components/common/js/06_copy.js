function initCopyButtons() {
    document.querySelectorAll('.copyable-phone, .copyable-text').forEach(el => {
        // Удаляем старые обработчики, чтобы не дублировать
        el.removeEventListener('click', el._clickHandler);
        el.removeEventListener('keydown', el._keydownHandler);

        // Создаём и сохраняем обработчики
        el._clickHandler = function(e) {
            e.stopPropagation();
            const textToCopy = this.getAttribute('data-copy');
            if (!textToCopy) return;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('✅ Скопировано!');
            }).catch(err => {
                logError('Ошибка копирования:', err);
                showErrorToast('Не удалось скопировать. Попробуйте вручную.');
            });
        };
        el._keydownHandler = function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        };

        el.addEventListener('click', el._clickHandler);
        el.addEventListener('keydown', el._keydownHandler);
    });
}