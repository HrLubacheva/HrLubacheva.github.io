// ============================================================
// 21_accordions.js – Управление аккордеонами на сайте
// ============================================================

(function() {
    'use strict';

    // ========== АККОРДЕОН ДЛЯ СЕКЦИИ УСЛУГ (04_services.html) ==========
    function initServicesAccordion() {
        const cards = document.querySelectorAll('.card-service');
        if (!cards.length) return;

        function updateState() {
            const isMobile = window.innerWidth < 992;
            if (isMobile) {
                cards.forEach(card => {
                    card.classList.remove('open');
                    if (card._clickHandler) card.removeEventListener('click', card._clickHandler);
                    const handler = function(e) {
                        e.stopPropagation();
                        this.classList.toggle('open');
                    };
                    card.addEventListener('click', handler);
                    card._clickHandler = handler;
                });
            } else {
                cards.forEach(card => {
                    card.classList.add('open');
                    if (card._clickHandler) {
                        card.removeEventListener('click', card._clickHandler);
                        delete card._clickHandler;
                    }
                });
            }
        }

        updateState();
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateState, 150);
        });
    }

    // ========== АККОРДЕОН ДЛЯ СЕКЦИИ ПРОЦЕССА (07_process.html) ==========
    function initProcessAccordion() {
        const headers = document.querySelectorAll('.process-block-header');
        if (!headers.length) return;

        function updateAccordionState() {
            const isMobile = window.innerWidth < 768;
            headers.forEach(header => {
                const targetId = header.getAttribute('data-toggle');
                if (!targetId) return;
                const content = document.getElementById(targetId);
                if (!content) return;
                if (isMobile) {
                    content.classList.add('collapsed');
                    header.setAttribute('aria-expanded', 'false');
                } else {
                    content.classList.remove('collapsed');
                    header.setAttribute('aria-expanded', 'true');
                }
            });
        }

        updateAccordionState();

        headers.forEach(header => {
            const targetId = header.getAttribute('data-toggle');
            if (!targetId) return;
            const content = document.getElementById(targetId);
            if (!content) return;

            if (header._clickHandler) {
                header.removeEventListener('click', header._clickHandler);
            }

            const clickHandler = (e) => {
                e.preventDefault();
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                if (isExpanded) {
                    content.classList.add('collapsed');
                    header.setAttribute('aria-expanded', 'false');
                } else {
                    content.classList.remove('collapsed');
                    header.setAttribute('aria-expanded', 'true');
                }
            };
            header.addEventListener('click', clickHandler);
            header._clickHandler = clickHandler;
        });

        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateAccordionState, 200);
        });
    }

    // ========== АККОРДЕОН ДЛЯ СЕКЦИИ ПРЕИМУЩЕСТВ (06_benefits.html) ==========
    function initBenefitsAccordion() {
        const cards = document.querySelectorAll('.benefit-card');
        if (!cards.length) return;

        function updateBenefitsMode() {
            const isMobile = window.innerWidth < 992;
            if (isMobile) {
                cards.forEach(card => {
                    card.classList.remove('open');
                    if (card._clickHandler) card.removeEventListener('click', card._clickHandler);
                    const handler = function(e) {
                        e.stopPropagation();
                        this.classList.toggle('open');
                    };
                    card.addEventListener('click', handler);
                    card._clickHandler = handler;
                });
            } else {
                cards.forEach(card => {
                    card.classList.add('open');
                    if (card._clickHandler) {
                        card.removeEventListener('click', card._clickHandler);
                        delete card._clickHandler;
                    }
                });
            }
        }

        updateBenefitsMode();
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateBenefitsMode, 200);
        });
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ВСЕХ АККОРДЕОНОВ ==========
    function initAllAccordions() {
        logInit('initAllAccordions started', 'INFO', '', 3);
        initServicesAccordion();
        initProcessAccordion();
        initBenefitsAccordion();
        logInit('initAllAccordions finished', 'INFO', '', 3);
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllAccordions);
    } else {
        initAllAccordions();
    }

    // Экспортируем функции для возможного переиспользования
    window.initServicesAccordion = initServicesAccordion;
    window.initProcessAccordion = initProcessAccordion;
    window.initBenefitsAccordion = initBenefitsAccordion;
    window.initAllAccordions = initAllAccordions;
})();