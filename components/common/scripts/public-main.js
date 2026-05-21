// Только публичные инициализации (без редактора)
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initCalculator === 'function') initCalculator();
    if (typeof renderQuiz === 'function') renderQuiz();
    if (typeof initModal === 'function') initModal();
    if (typeof initCallbackForm === 'function') initCallbackForm();
    if (typeof initAnimations === 'function') initAnimations();
    if (typeof initSmoothScroll === 'function') initSmoothScroll();
    if (typeof initCopyButtons === 'function') initCopyButtons();
    console.log('✅ Сайт инициализирован (публичная версия)');
});