// ========== ПЛАВНЫЕ АНИМАЦИИ ДЛЯ САЙТА ==========
(function() {
    'use strict';

    function isEditorMode() {
        return window.location.pathname.includes('editor.html') ||
               window.AUTO_EDITOR === true ||
               document.body.classList.contains('block-edit-mode');
    }

    function initAnimations() {
        if (isEditorMode()) {
            log('🎨 Режим редактора — анимации отключены');
            return;
        }

        const selectors = [
            '.role-card', '.service-card', '.stat-item', '.benefit-card',
            '.process-card', '.quiz-card', '.checklist-card', '.calendar-card',
            '.hero-content', '.hero-image', '.section-title', '.contact-block'
        ];

        const animatedElements = document.querySelectorAll(selectors.join(','));

        if (animatedElements.length === 0) {
            log('⚠️ Элементы для анимации не найдены');
            return;
        }

        log(`✨ Найдено ${animatedElements.length} элементов для анимации`);

        animatedElements.forEach(el => {
            if (!el.classList.contains('fade-up')) {
                el.classList.add('fade-up');
            }
            // Сбрасываем visible, чтобы анимация повторилась
            el.classList.remove('visible');
        });

        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, 100); // Небольшая задержка перед появлением
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(el => observer.observe(el));

        // Последовательные задержки для карточек в гридах
        document.querySelectorAll('.roles-grid .role-card, .services-flex .service-card, .benefits-grid .benefit-card, .process-grid .process-card, .stats-grid .stat-item').forEach((el, idx) => {
            const delay = (idx % 4) * 0.15;
            el.style.transitionDelay = `${delay}s`;
        });

        log('✅ Анимации инициализированы');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    window.initAnimations = initAnimations;
})();