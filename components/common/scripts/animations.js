// animations.js - улучшенная версия
(function() {
    'use strict';

    function initAnimations() {
        // Все элементы с классами анимаций
        const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in');

        if (animatedElements.length === 0) {
            console.log('⚠️ Элементы для анимации не найдены');
            return;
        }

        console.log('✨ Найдено элементов для анимации:', animatedElements.length);

        // Сбрасываем стили перед анимацией
        animatedElements.forEach(function(el) {
            el.style.opacity = '';
            el.style.transform = '';
            el.style.transitionDelay = '';
            el.classList.remove('visible');
        });

        // Плавные задержки для карточек (эффект волны)
        const grids = ['.roles-grid', '.services-flex', '.benefits-grid', '.process-grid', '.stats-grid'];

        grids.forEach(function(selector) {
            const grid = document.querySelector(selector);
            if (grid) {
                const cards = Array.from(grid.children);
                const totalCards = cards.length;

                cards.forEach(function(card, index) {
                    // Более плавное нарастание: первые быстрее, последние с большей задержкой
                    const delay = (index / totalCards) * 0.3;
                    card.style.transitionDelay = delay + 's';
                });
            }
        });

        // Отдельные элементы с классами задержек
        document.querySelectorAll('.delay-1, .delay-2, .delay-3, .delay-4, .delay-5, .delay-6').forEach(function(el) {
            // классы уже есть в CSS
        });

        // Настройки Intersection Observer с более чувствительным порогом
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry, index) {
                if (entry.isIntersecting) {
                    // Маленькая задержка для более плавного появления
                    setTimeout(function() {
                        entry.target.classList.add('visible');
                    }, index * 20); // Каскадное появление
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15, // Чуть ниже для более раннего появления
            rootMargin: '0px 0px -30px 0px' // Немного раньше срабатывает
        });

        // Запускаем наблюдение
        animatedElements.forEach(function(el) {
            observer.observe(el);
        });

        // Форсируем показ для элементов, которые уже в видимой области
        setTimeout(function() {
            animatedElements.forEach(function(el) {
                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                if (rect.top < windowHeight - 100) {
                    el.classList.add('visible');
                }
            });
        }, 200);

        console.log('✅ Плавные анимации инициализированы');
    }

    window.initAnimations = initAnimations;
})();