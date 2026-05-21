// ========== ПЛАВНЫЕ АНИМАЦИИ ДЛЯ САЙТА ==========
(function() {
    'use strict';

    function isEditorMode() {
        // Проверяем, что это не редактор
        return window.location.pathname.includes('editor.html') ||
               window.AUTO_EDITOR === true ||
               document.body.classList.contains('block-edit-mode');
    }

    function initAnimations() {
        // Если редактор — не запускаем анимации
        if (isEditorMode()) {
            log('🎨 Режим редактора — анимации отключены');
            return;
        }

        // Селекторы для анимации
        const selectors = [
            '.role-card',
            '.service-card',
            '.stat-item',
            '.benefit-card',
            '.process-card',
            '.quiz-card',
            '.checklist-card',
            '.calendar-card',
            '.hero-content',
            '.hero-image',
            '.section-title',
            '.contact-block'
        ];

        const animatedElements = document.querySelectorAll(selectors.join(','));

        if (animatedElements.length === 0) {
            log('⚠️ Элементы для анимации не найдены');
            return;
        }

        log(`✨ Найдено ${animatedElements.length} элементов для анимации`);

        // Добавляем класс fade-up если его нет
        animatedElements.forEach(el => {
            if (!el.classList.contains('fade-up') && !el.classList.contains('fade-in') && !el.classList.contains('scale-in')) {
                el.classList.add('fade-up');
            }
        });

        // Настройки Intersection Observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, 50);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Запускаем наблюдение
        animatedElements.forEach(el => observer.observe(el));

        // Добавляем последовательные задержки для элементов внутри гридов
        document.querySelectorAll('.roles-grid .role-card, .services-flex .service-card, .benefits-grid .benefit-card, .process-grid .process-card, .stats-grid .stat-item').forEach((el, idx) => {
            const delay = (idx % 4) * 0.1;
            el.style.transitionDelay = `${delay}s`;
        });

        log('✅ Анимации инициализированы');
    }

    // Запускаем после полной загрузки DOM только если не редактор
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    window.initAnimations = initAnimations;
})();