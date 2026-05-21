// animations.js - профессиональные анимации с защитой от кеша
(function() {
    'use strict';

    // Флаг, чтобы анимация не запускалась дважды
    let animationsStarted = false;

    // Флаг для проверки, видна ли страница
    let isPageVisible = true;

    function initAnimations() {
        // Защита от двойного запуска
        if (animationsStarted) {
            console.log('⚠️ Анимации уже запущены, пропускаем');
            return;
        }

        // Ждём, пока страница станет видимой
        if (!isPageVisible) {
            console.log('⏳ Страница не видна, ждём...');
            document.addEventListener('visibilitychange', function onVisibility() {
                if (!document.hidden) {
                    isPageVisible = true;
                    document.removeEventListener('visibilitychange', onVisibility);
                    initAnimations();
                }
            });
            return;
        }

        // Небольшая задержка для полной загрузки CSS
        setTimeout(function() {
            // Проверяем, что CSS загружен
            const testElement = document.createElement('div');
            testElement.className = 'fade-up';
            testElement.style.opacity = '';
            document.body.appendChild(testElement);
            const computedOpacity = window.getComputedStyle(testElement).opacity;
            document.body.removeChild(testElement);

            if (computedOpacity !== '0') {
                console.log('⚠️ CSS анимаций не загружен, ждём...');
                setTimeout(initAnimations, 200);
                return;
            }

            // Все анимируемые элементы
            const selectors = [
                '.fade-up', '.fade-left', '.fade-right', '.scale-in',
                '.section-title', '.process-title', '.hero-subtitle'
            ];

            const animatedElements = document.querySelectorAll(selectors.join(','));

            // Фильтруем только те, у которых нет класса .visible и нет inline-стиля opacity:1
            const filteredElements = Array.from(animatedElements).filter(function(el) {
                const hasVisibleClass = el.classList.contains('visible');
                const hasInlineOpacity = el.style.opacity === '1';
                const hasInlineVisible = el.getAttribute('data-animated') === 'true';
                return !hasVisibleClass && !hasInlineOpacity && !hasInlineVisible;
            });

            if (filteredElements.length === 0) {
                console.log('⚠️ Новых элементов для анимации не найдено');
                animationsStarted = true;
                return;
            }

            console.log('✨ Найдено новых элементов для анимации:', filteredElements.length);

            const isMobile = window.innerWidth <= 768;

            // Сбрасываем стили (только для новых элементов)
            filteredElements.forEach(function(el) {
                el.style.opacity = '';
                el.style.transform = '';
                el.style.transitionDelay = '';
                el.classList.remove('visible');
                el.removeAttribute('data-animated');
            });

            // Умные задержки для карточек в сетках
            const grids = ['.roles-grid', '.services-flex', '.benefits-grid', '.process-grid', '.stats-grid'];

            grids.forEach(function(selector) {
                const grid = document.querySelector(selector);
                if (grid) {
                    const cards = Array.from(grid.children).filter(function(card) {
                        return filteredElements.includes(card);
                    });
                    const total = cards.length;

                    cards.forEach(function(card, index) {
                        const t = index / (total - 1 || 1);
                        const delay = isMobile ? t * 0.15 : Math.pow(t, 1.5) * 0.35;
                        card.style.transitionDelay = delay + 's';
                    });
                }
            });

            // Hero-элементы без задержки
            filteredElements.forEach(function(el) {
                if (el.classList.contains('hero-title') || el.classList.contains('hero-subtitle')) {
                    el.style.transitionDelay = '0s';
                }
            });

            // Настройки Intersection Observer
            const observerOptions = {
                threshold: isMobile ? 0.1 : 0.15,
                rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry, idx) {
                    if (entry.isIntersecting) {
                        const delay = Math.min(idx * 30, 250);
                        setTimeout(function() {
                            entry.target.classList.add('visible');
                            entry.target.setAttribute('data-animated', 'true');
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Запускаем наблюдение
            filteredElements.forEach(function(el) {
                observer.observe(el);
            });

            // Форсируем показ для видимых элементов
            setTimeout(function() {
                filteredElements.forEach(function(el) {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    const threshold = isMobile ? 80 : 120;
                    if (rect.top < windowHeight - threshold) {
                        el.classList.add('visible');
                        el.setAttribute('data-animated', 'true');
                    }
                });
            }, 300);

            animationsStarted = true;
            console.log('✅ Профессиональные анимации инициализированы');
            console.log('📱 Устройство:', isMobile ? 'мобильное' : 'ПК');

        }, 100);
    }

    // Функция для сброса кеша анимаций (можно вызвать вручную)
    window.resetAnimations = function() {
        const animatedElements = document.querySelectorAll('[data-animated="true"]');
        animatedElements.forEach(function(el) {
            el.classList.remove('visible');
            el.removeAttribute('data-animated');
            el.style.transitionDelay = '';
        });
        animationsStarted = false;
        initAnimations();
        console.log('🔄 Анимации сброшены');
    };

    // Следим за видимостью страницы
    document.addEventListener('visibilitychange', function() {
        isPageVisible = !document.hidden;
        if (isPageVisible && !animationsStarted) {
            initAnimations();
        }
    });

    // Запускаем после полной загрузки
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        // Если DOM уже загружен, даём время на CSS
        setTimeout(initAnimations, 150);
    }

    // Также запускаем после загрузки всех ресурсов
    window.addEventListener('load', function() {
        if (!animationsStarted) {
            setTimeout(initAnimations, 200);
        }
    });

    window.initAnimations = initAnimations;
})();