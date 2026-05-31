// ============================================================
// 14_pricelist.js – Управление доступностью аккордеонов прайс-листа
// ============================================================
(function() {
    'use strict';

    function initPriceAccordions() {
        const detailsList = document.querySelectorAll('.price-details');
        if (!detailsList.length) return;

        detailsList.forEach(details => {
            const summary = details.querySelector('.price-summary');
            if (!summary) return;

            // Устанавливаем ARIA-атрибуты
            summary.setAttribute('role', 'button');

            const updateAria = () => {
                const isOpen = details.open;
                summary.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                const hiddenSpan = summary.querySelector('.visually-hidden');
                if (hiddenSpan) {
                    hiddenSpan.textContent = isOpen ? '(развернуто)' : '(свернуто)';
                }
            };

            // Инициализация
            updateAria();

            // Слушаем событие toggle на details
            details.addEventListener('toggle', updateAria);
        });
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPriceAccordions);
    } else {
        initPriceAccordions();
    }
})();