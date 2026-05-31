(function() {
    'use strict';

    function updateBenefitsMode() {
        const isMobile = window.innerWidth < 992;
        const cards = document.querySelectorAll('.benefit-card');

        if (isMobile) {
            cards.forEach(card => {
                card.classList.remove('open');
                if (card._clickHandler) {
                    card.removeEventListener('click', card._clickHandler);
                }
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateBenefitsMode);
    } else {
        updateBenefitsMode();
    }

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateBenefitsMode, 200);
    });
})();