(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof initAnimations === 'function') initAnimations();
        if (typeof initUserId === 'function') initUserId().catch(e => console.warn(e));
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof renderQuiz === 'function') renderQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
    });
})();