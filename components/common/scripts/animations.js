// ========== ПЛАВНЫЕ АНИМАЦИИ ДЛЯ САЙТА ==========
(function() {
    'use strict';

    function isEditorMode() {
        return window.location.pathname.includes('editor.html') ||
               window.AUTO_EDITOR === true ||
               document.body.classList.contains('block-edit-mode');
    }

    function initAnimations() {
        // В режиме редактора — показываем ВСЕ блоки мгновенно, без анимаций
        if (isEditorMode()) {
            console.log('🎨 Режим редактора — анимации отключены, все блоки видны');

            // Находим все элементы с fade-up и сразу делаем видимыми
            const fadeElements = document.querySelectorAll('.fade-up');
            fadeElements.forEach(function(el) {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.transition = 'none';
            });

            // Также убираем анимацию у всех элементов, которые могли её иметь
            const allAnimated = document.querySelectorAll('[class*="fade"], [class*="scale"], [class*="slide"]');
            allAnimated.forEach(function(el) {
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.transition = 'none';
            });

            return;
        }

        // Для публичного сайта — обычные анимации
        const selectors = [
            '.role-card', '.service-card', '.stat-item', '.benefit-card',
            '.process-card', '.quiz-card', '.checklist-card', '.calendar-card',
            '.hero-content', '.hero-image', '.section-title', '.contact-block'
        ];

        const animatedElements = document.querySelectorAll(selectors.join(','));

        if (animatedElements.length === 0) {
            console.log('⚠️ Элементы для анимации не найдены');
            return;
        }

        console.log('✨ Найдено элементов для анимации:', animatedElements.length);

        // Добавляем класс fade-up если его нет
        animatedElements.forEach(function(el) {
            if (!el.classList.contains('fade-up')) {
                el.classList.add('fade-up');
            }
            // Сбрасываем visible, чтобы анимация повторилась
            el.classList.remove('visible');
        });

        // Настройки Intersection Observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    setTimeout(function() {
                        entry.target.classList.add('visible');
                    }, 50);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Запускаем наблюдение
        animatedElements.forEach(function(el) {
            observer.observe(el);
        });

        // Добавляем последовательные задержки для элементов внутри гридов
        document.querySelectorAll('.roles-grid .role-card, .services-flex .service-card, .benefits-grid .benefit-card, .process-grid .process-card, .stats-grid .stat-item').forEach(function(el, idx) {
            var delay = (idx % 4) * 0.1;
            el.style.transitionDelay = delay + 's';
        });

        console.log('✅ Анимации инициализированы');
    }

    // Запускаем после полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    window.initAnimations = initAnimations;
})();