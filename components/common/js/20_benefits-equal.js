function equalizeBenefitsColumns() {
    if (window.innerWidth < 992) return;
    const leftCol = document.querySelector('.benefits-two-columns .benefits-column:first-child');
    const rightCol = document.querySelector('.benefits-two-columns .benefits-column:last-child');
    if (!leftCol || !rightCol) return;
    // Убираем ранее установленную высоту
    rightCol.style.minHeight = '';
    // Устанавливаем высоту правой колонки равной высоте левой
    rightCol.style.minHeight = leftCol.offsetHeight + 'px';
}

// Запускаем после полной загрузки страницы
window.addEventListener('load', equalizeBenefitsColumns);
window.addEventListener('resize', function() {
    clearTimeout(window._benefitsEqTimer);
    window._benefitsEqTimer = setTimeout(equalizeBenefitsColumns, 200);
});