(function () {
    'use strict';
    logger.init('=== НАЧАЛО 99_main.js ===', 'INFO', '', 3);
    const C = window.APP_CONFIG?.CONSTANTS || {};
    const MOBILE_BREAKPOINT = C.BREAKPOINT_MOBILE || 768;
    const STATS_ANIMATION_DURATION = C.STATS_ANIMATION_DURATION || 1500;
    const SCROLL_TOP_THRESHOLD = C.SCROLL_TOP_VISIBLE_THRESHOLD || 500;

    let globalFadeObserver = null;

    function reinitAnimations() {
        logger.init('reinitAnimations started', 'DEBUG', '', 5);
        const elements = document.querySelectorAll('.fade-up:not(.visible)');
        if (!elements.length) return;
        if (globalFadeObserver) {
            globalFadeObserver.disconnect();
        }
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        const threshold = isMobile ? 0.1 : 0.05;
        const rootMargin = isMobile ? '0px 0px -30px 0px' : '0px 0px -50px 0px';
        globalFadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    globalFadeObserver.unobserve(entry.target);
                }
            });
        }, {threshold, rootMargin});
        elements.forEach(el => globalFadeObserver.observe(el));
        logger.init(`reinitAnimations обработано ${elements.length} элементов`, 'DEBUG', '', 5);
    }

    function animateStats() {
        logger.init('animateStats started', 'INFO', '', 4);
        const statNumbers = document.querySelectorAll('.stat-number');
        if (!statNumbers.length) return;
        if (window._statsAnimated) {
            logger.init('Статистика уже анимирована', 'DEBUG', '', 5);
            return;
        }

        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const final = parseInt(target.getAttribute('data-target'), 10);
                    const duration = STATS_ANIMATION_DURATION;
                    const startTime = performance.now();

                    function update(currentTime) {
                        const elapsed = currentTime - startTime;
                        let progress = Math.min(elapsed / duration, 1);
                        const easeProgress = 1 - Math.pow(1 - progress, 1.5);
                        const current = Math.floor(easeProgress * final);
                        target.innerText = formatNumber(current);
                        if (progress < 1) requestAnimationFrame(update);
                        else target.innerText = formatNumber(final);
                    }

                    requestAnimationFrame(update);
                    observer.unobserve(target);
                    window._statsAnimated = true;
                    logger.init(`Статистика анимирована для ${target.getAttribute('data-target')}`, 'DEBUG', '', 5);
                }
            });
        }, {threshold: 0.3});
        statNumbers.forEach(el => observer.observe(el));
        logger.init('animateStats finished', 'INFO', '', 4);
    }

    function initFormValidation() {
        logger.init('initFormValidation started', 'INFO', '', 4);
        const phoneInput = document.getElementById('callbackPhone');
        if (phoneInput) phoneInput.addEventListener('input', function () {
            const digits = this.value.replace(/\D/g, '');
            if (digits.length === 11) {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
            } else if (digits.length > 0) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 2px rgba(220,53,69,0.2)';
            } else {
                this.style.borderColor = 'var(--border)';
                this.style.boxShadow = 'none';
            }
        });
        const nameInput = document.getElementById('callbackName');
        if (nameInput) nameInput.addEventListener('input', function () {
            if (this.value.length >= 2) {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
            } else if (this.value.length > 0) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 2px rgba(220,53,69,0.2)';
            } else {
                this.style.borderColor = 'var(--border)';
                this.style.boxShadow = 'none';
            }
        });
        logger.init('initFormValidation finished', 'INFO', '', 4);
    }

    function initScrollTopButton() {
        logger.init('initScrollTopButton started', 'INFO', '', 4);
        const btn = document.createElement('button');
        btn.className = 'scroll-top';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Наверх');
        document.body.appendChild(btn);

        function toggleScrollTop() {
            if (window.scrollY > SCROLL_TOP_THRESHOLD) btn.classList.add('visible'); else btn.classList.remove('visible');
        }

        window.addEventListener('scroll', toggleScrollTop);
        toggleScrollTop();
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.smoothScrollTo === 'function') {
                window.smoothScrollTo(document.body, 0);
            } else {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        });
        logger.init('initScrollTopButton finished', 'INFO', '', 4);
    }

    let updateActiveNavTimeout = null;
    function updateActiveNav() {
        if (updateActiveNavTimeout) clearTimeout(updateActiveNavTimeout);
        updateActiveNavTimeout = setTimeout(() => {
            const navLinks = document.querySelectorAll('.nav-links a');
            if (!navLinks.length) return;

            const menuSectionIds = Array.from(navLinks).map(link => {
                const href = link.getAttribute('href');
                return href ? href.substring(1) : null;
            }).filter(Boolean);

            function isSectionVisible(section) {
                const rect = section.getBoundingClientRect();
                return rect.top < window.innerHeight && rect.bottom > 0;
            }

            let activeId = null;
            const homeSection = document.getElementById('home');
            if (homeSection) {
                const rect = homeSection.getBoundingClientRect();
                const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                const ratio = visibleHeight / rect.height;
                if (ratio >= 0.1 && rect.top <= 100) {
                    activeId = 'home';
                }
            }

            if (!activeId) {
                let bestSection = null;
                let bestTop = Infinity;
                for (const id of menuSectionIds) {
                    const section = document.getElementById(id);
                    if (!section) continue;
                    const rect = section.getBoundingClientRect();
                    if (isSectionVisible(section)) {
                        const top = rect.top;
                        if (top >= 0 && top < bestTop) {
                            bestTop = top;
                            bestSection = section;
                        }
                    }
                }
                if (bestSection) activeId = bestSection.id;
                else {
                    let lastVisibleId = null;
                    let lastVisibleBottom = -Infinity;
                    for (const id of menuSectionIds) {
                        const section = document.getElementById(id);
                        if (!section) continue;
                        const rect = section.getBoundingClientRect();
                        if (rect.bottom > 0 && rect.bottom < window.innerHeight + 200) {
                            if (rect.bottom > lastVisibleBottom) {
                                lastVisibleBottom = rect.bottom;
                                lastVisibleId = id;
                            }
                        }
                    }
                    if (lastVisibleId) activeId = lastVisibleId;
                }
            }

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === `#${activeId}`) link.classList.add('active');
                else link.classList.remove('active');
            });
        }, 50);
    }

    window.updateActiveNav = updateActiveNav;

    function initActiveNav() {
        window.addEventListener('scroll', updateActiveNav);
        window.addEventListener('resize', updateActiveNav);
        updateActiveNav();
    }

    function initCarousel() {
        if (typeof window.initInfiniteCarousel === 'function') {
            window.initInfiniteCarousel('carouselTrack');
            logger.init('Карусель сертификатов инициализирована', 'INFO', '', 4);
        }
    }

    function initErrorTrackingIfAvailable() {
        if (typeof window.initErrorTracking === 'function') {
            window.initErrorTracking();
            logger.init('ErrorTracking инициализирован через глобальную функцию', 'INFO', '', 3);
        } else if (window.ErrorTracking && typeof window.ErrorTracking.init === 'function') {
            window.ErrorTracking.init();
            logger.init('ErrorTracking инициализирован через модуль', 'INFO', '', 3);
        } else {
            window.addEventListener('load', function() {
                if (typeof window.initErrorTracking === 'function') {
                    window.initErrorTracking();
                    logger.init('ErrorTracking инициализирован после загрузки страницы', 'INFO', '', 3);
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        logger.init('DOMContentLoaded событие', 'INFO', '', 3);
        if (typeof initUserId === 'function') {
            logger.init('Вызов initUserId', 'INFO', '', 3);
            initUserId().catch(e => logger.init(`Ошибка initUserId: ${e}`, 'ERROR', '', 1));
        }
        if (typeof initModal === 'function') {
            logger.init('Вызов initModal', 'INFO', '', 3);
            initModal();
        }
        if (typeof initCopyButtons === 'function') {
            logger.init('Вызов initCopyButtons', 'INFO', '', 3);
            initCopyButtons();
        }
        if (typeof initFormEnterSubmit === 'function') {
            logger.init('Вызов initFormEnterSubmit', 'INFO', '', 3);
            initFormEnterSubmit();
        }
        if (typeof initCookieConsent === 'function') {
            logger.init('Вызов initCookieConsent', 'INFO', '', 3);
            initCookieConsent();
        }
        if (typeof initShareButtons === 'function') {
            logger.init('Вызов initShareButtons', 'INFO', '', 3);
            initShareButtons();
        }
        if (typeof window.initPhoneMasks === 'function') {
            logger.init('Вызов initPhoneMasks', 'INFO', '', 3);
            window.initPhoneMasks();
        }
        if (typeof initCallbackForm === 'function') {
            logger.init('Вызов initCallbackForm', 'INFO', '', 3);
            initCallbackForm();
        }

        const originalInitCalculator = window.initCalculator;
        const originalInitQuiz = window.initQuiz;

        if (typeof originalInitCalculator === 'function') {
            window.initCalculator = async function () {
                logger.init('Переопределённый initCalculator запущен', 'INFO', '', 3);
                await originalInitCalculator();
                logger.init('originalInitCalculator завершён', 'INFO', '', 3);
                setTimeout(reinitAnimations, 100);
                setTimeout(animateStats, 150);
            };
        } else {
            logger.init('originalInitCalculator не найден, пропускаем', 'WARN', '', 2);
        }

        if (typeof originalInitQuiz === 'function') {
            window.initQuiz = function () {
                logger.init('Переопределённый initQuiz запущен', 'INFO', '', 3);
                originalInitQuiz();
                setTimeout(reinitAnimations, 150);
                setTimeout(animateStats, 200);
            };
        } else {
            logger.init('originalInitQuiz не найден, пропускаем', 'WARN', '', 2);
        }

        if (typeof window.initCalculator === 'function') {
            logger.init('Запуск window.initCalculator()', 'INFO', '', 3);
            window.initCalculator();
        }
        if (typeof window.initQuiz === 'function') {
            logger.init('Запуск window.initQuiz()', 'INFO', '', 3);
            window.initQuiz();
        }

        initActiveNav();
        initFormValidation();
        initScrollTopButton();
        if (typeof window.initMaterialsEmailButtons === 'function') {
            window.initMaterialsEmailButtons();
        } else {
            logger.init('initMaterialsEmailButtons не найдена! Убедитесь, что 20_materials-modal.js загружен.', 'WARN', '', 2);
        }
        initCarousel();
        initErrorTrackingIfAvailable();

        if (typeof initAnimations === 'function') {
            logger.init('Вызов initAnimations', 'INFO', '', 3);
            initAnimations();
        } else {
            logger.init('initAnimations не найдена!', 'ERROR', '', 1);
        }
        setTimeout(reinitAnimations, 100);
        logger.init('DOMContentLoaded обработчик завершён', 'INFO', '', 3);
    });

    window.addEventListener('load', function () {
        logger.init('Событие load', 'INFO', '', 3);
        setTimeout(function () {
            document.querySelectorAll('.fade-up').forEach(el => {
                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                if (rect.top < windowHeight - 100) {
                    el.classList.add('visible');
                }
            });
            animateStats();
        }, 200);
    });
})();