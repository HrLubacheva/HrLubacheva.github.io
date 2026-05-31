(function() {
    'use strict';

    let resizeTimer = null;

    function updateAccordionState() {
        const isMobile = window.innerWidth < 768;
        const headers = document.querySelectorAll('.process-block-header');

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

    function initProcessAccordion() {
        const headers = document.querySelectorAll('.process-block-header');
        if (!headers.length) return;

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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProcessAccordion);
    } else {
        initProcessAccordion();
    }

    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateAccordionState();
        }, 200);
    });
})();