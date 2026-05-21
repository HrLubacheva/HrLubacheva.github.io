// animations.js - профессиональные анимации
(function() {
    'use strict';

    function initAnimations() {
        // Все анимируемые элементы
        const selectors = [
            '.fade-up', '.fade-left', '.fade-right', '.scale-in',
            '.section-title', '.process-title', '.hero-subtitle'
        ];

        const animatedElements = document.querySelectorAll(selectors.join(','));

        if (animatedElements.length === 0) {
            console.log('⚠️ Элементы для анимации не найдены');
            return;
        }

        console.log('✨ Найдено элементов для анимации:', animatedElements.length);

        const isMobile = window.innerWidth <= 768;

        // Сбрасываем стили
        animatedElements.forEach(function(el) {
            el.style.opacity = '';
            el.style.transform = '';
            el.style.transitionDelay = '';
            el.classList.remove('visible');
        });

        // Умные задержки для карточек в сетках (квадратичная функция)
        const grids = ['.roles-grid', '.services-flex', '.benefits-grid', '.process-grid', '.stats-grid'];

        grids.forEach(function(selector) {
            const grid = document.querySelector(selector);
            if (grid) {
                const cards = Array.from(grid.children);
                const total = cards.length;

                cards.forEach(function(card, index) {
                    // Квадратичная задержка: первые быстрее, последние с большей задержкой
                    const t = index / (total - 1 || 1);
                    const delay = isMobile ? t * 0.15 : Math.pow(t, 1.5) * 0.35;
                    card.style.transitionDelay = delay + 's';

                    // Добавляем класс задержки для CSS
                    if (delay >= 0.3) card.classList.add('delay-high');
                });
            }
        });

        // Hero-элементы без задержки
        const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle');
        heroElements.forEach(function(el) {
            el.style.transitionDelay = '0s';
        });

        // Настройки Intersection Observer
        const observerOptions = {
            threshold: isMobile ? 0.1 : 0.15,
            rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry, idx) {
                if (entry.isIntersecting) {
                    // Небольшая каскадная задержка для элементов на одной строке
                    const delay = Math.min(idx * 20, 200);
                    setTimeout(function() {
                        entry.target.classList.add('visible');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Запускаем наблюдение
        animatedElements.forEach(function(el) {
            observer.observe(el);
        });

        // Форсируем показ для видимых элементов (на случай быстрой загрузки)
        setTimeout(function() {
            animatedElements.forEach(function(el) {
                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const threshold = isMobile ? 100 : 150;
                if (rect.top < windowHeight - threshold) {
                    el.classList.add('visible');
                }
            });
        }, 200);

        console.log('✅ Профессиональные анимации инициализированы');
        console.log('📱 Устройство:', isMobile ? 'мобильное' : 'ПК');
        console.log('🎯 Порог срабатывания:', observerOptions.threshold);
    }

    // Запускаем после полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    window.initAnimations = initAnimations;
})();