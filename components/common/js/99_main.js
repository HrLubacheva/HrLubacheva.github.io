(function () {
    'use strict';
    logInit('=== НАЧАЛО 99_main.js ===', 'INFO', '', 3);
    const C = window.APP_CONFIG?.CONSTANTS || {};
    const MOBILE_BREAKPOINT = C.BREAKPOINT_MOBILE || 768;
    const STATS_ANIMATION_DURATION = C.STATS_ANIMATION_DURATION || 1500;
    const SCROLL_TOP_THRESHOLD = C.SCROLL_TOP_VISIBLE_THRESHOLD || 500;

    function reinitAnimations() {
        logInit('reinitAnimations started', 'DEBUG', '', 5);
        const elements = document.querySelectorAll('.fade-up:not(.visible)');
        if (!elements.length) return;
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        const threshold = isMobile ? 0.1 : 0.05;
        const rootMargin = isMobile ? '0px 0px -30px 0px' : '0px 0px -50px 0px';
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {threshold, rootMargin});
        elements.forEach(el => observer.observe(el));
        logInit(`reinitAnimations обработано ${elements.length} элементов`, 'DEBUG', '', 5);
    }

    function animateStats() {
        logInit('animateStats started', 'INFO', '', 4);
        const statNumbers = document.querySelectorAll('.stat-number');
        if (!statNumbers.length) return;
        if (window._statsAnimated) {
            logInit('Статистика уже анимирована', 'DEBUG', '', 5);
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
                    logInit(`Статистика анимирована для ${target.getAttribute('data-target')}`, 'DEBUG', '', 5);
                }
            });
        }, {threshold: 0.3});
        statNumbers.forEach(el => observer.observe(el));
        logInit('animateStats finished', 'INFO', '', 4);
    }

    function initFormValidation() {
        logInit('initFormValidation started', 'INFO', '', 4);
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
        logInit('initFormValidation finished', 'INFO', '', 4);
    }

    function initScrollTopButton() {
        logInit('initScrollTopButton started', 'INFO', '', 4);
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
        logInit('initScrollTopButton finished', 'INFO', '', 4);
    }

    function initMaterialsEmailButtons() {
        logInit('initMaterialsEmailButtons started', 'INFO', '', 4);
        const buttons = document.querySelectorAll('.material-email-simple');
        const modal = document.getElementById('materialsModal');
        const closeBtn = document.getElementById('closeMaterialsModal');
        const sendBtn = document.getElementById('sendMaterialsBtn');
        let currentMaterial = null;
        let isModalSending = false;
        if (!modal) return;
        buttons.forEach(btn => {
            btn.removeEventListener('click', btn._materialsHandler);
            btn._materialsHandler = () => {
                currentMaterial = btn.dataset.material;
                logInit(`Открытие модалки материалов для ${currentMaterial}`, 'INFO', '', 4);
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
                document.body.classList.add('modal-open');
                setTimeout(() => {
                    const emailInput = document.getElementById('materialsEmail');
                    if (emailInput) emailInput.focus();
                }, 100);
            };
            btn.addEventListener('click', btn._materialsHandler);
        });
        if (closeBtn) {
            closeBtn.removeEventListener('click', closeBtn._closeHandler);
            closeBtn._closeHandler = () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const emailInput = document.getElementById('materialsEmail');
                    if (emailInput) emailInput.value = '';
                    isModalSending = false;
                }, 200);
                logInit('Модалка материалов закрыта', 'INFO', '', 4);
            };
            closeBtn.addEventListener('click', closeBtn._closeHandler);
        }
        if (sendBtn) {
            sendBtn.removeEventListener('click', sendBtn._sendHandler);
            sendBtn._sendHandler = async () => {
                if (isModalSending) {
                    window.showWarningToast('⏳ Отправка уже выполняется, подождите...');
                    return;
                }
                const email = document.getElementById('materialsEmail').value;
                const originalText = sendBtn.innerText;
                isModalSending = true;
                sendBtn.disabled = true;
                sendBtn.innerText = '⏳ Отправка...';
                try {
                    logInit(`Отправка материалов на email ${email}`, 'INFO', '', 4);
                    const success = await window.sendMaterialsToEmail(email, currentMaterial);
                    if (success) {
                        modal.classList.remove('show');
                        setTimeout(() => {
                            modal.style.display = 'none';
                            document.body.classList.remove('modal-open');
                            const emailInput = document.getElementById('materialsEmail');
                            if (emailInput) emailInput.value = '';
                        }, 200);
                    }
                } catch (err) {
                    if (window.IS_DEV) console.error('Ошибка отправки:', err);
                } finally {
                    sendBtn.disabled = false;
                    sendBtn.innerText = originalText;
                    setTimeout(() => {
                        isModalSending = false;
                    }, 500);
                }
            };
            sendBtn.addEventListener('click', sendBtn._sendHandler);
        }
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const emailInput = document.getElementById('materialsEmail');
                    if (emailInput) emailInput.value = '';
                    isModalSending = false;
                }, 200);
            }
        });
        logInit('initMaterialsEmailButtons finished', 'INFO', '', 4);
    }

    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        if (!sections.length || !navLinks.length) return;
        const observer = new IntersectionObserver((entries) => {
            const visibleSections = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (visibleSections.length) {
                const activeId = visibleSections[0].target.id;
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    link.classList.toggle('active', href === `#${activeId}`);
                });
            }
        }, {threshold: [0.25, 0.5, 0.75]});
        sections.forEach(section => observer.observe(section));
    }

    function initCarousel() {
        if (typeof window.initInfiniteCarousel === 'function') {
            window.initInfiniteCarousel('carouselTrack', '.carousel-prev', '.carousel-next', 'progressBar', 'carouselDots');
            logInit('Карусель сертификатов инициализирована', 'INFO', '', 4);
        }
    }

    // НОВАЯ ФУНКЦИЯ для инициализации отслеживания ошибок, если файл error_tracking.js уже загружен
    function initErrorTrackingIfAvailable() {
        if (typeof window.initErrorTracking === 'function') {
            window.initErrorTracking();
            logInit('ErrorTracking инициализирован через глобальную функцию', 'INFO', '', 3);
        } else if (window.ErrorTracking && typeof window.ErrorTracking.init === 'function') {
            window.ErrorTracking.init();
            logInit('ErrorTracking инициализирован через модуль', 'INFO', '', 3);
        } else {
            // Если скрипт ещё не загружен, подождём событие load
            window.addEventListener('load', function() {
                if (typeof window.initErrorTracking === 'function') {
                    window.initErrorTracking();
                    logInit('ErrorTracking инициализирован после загрузки страницы', 'INFO', '', 3);
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        logInit('DOMContentLoaded событие', 'INFO', '', 3);
        if (typeof initUserId === 'function') {
            logInit('Вызов initUserId', 'INFO', '', 3);
            initUserId().catch(e => logInit(`Ошибка initUserId: ${e}`, 'ERROR', '', 1));
        }
        if (typeof initModal === 'function') {
            logInit('Вызов initModal', 'INFO', '', 3);
            initModal();
        }
        if (typeof initCopyButtons === 'function') {
            logInit('Вызов initCopyButtons', 'INFO', '', 3);
            initCopyButtons();
        }
        if (typeof initFormEnterSubmit === 'function') {
            logInit('Вызов initFormEnterSubmit', 'INFO', '', 3);
            initFormEnterSubmit();
        }
        if (typeof initCookieConsent === 'function') {
            logInit('Вызов initCookieConsent', 'INFO', '', 3);
            initCookieConsent();
        }
        if (typeof initShareButtons === 'function') {
            logInit('Вызов initShareButtons', 'INFO', '', 3);
            initShareButtons();
        }
        if (typeof window.initPhoneMasks === 'function') {
            logInit('Вызов initPhoneMasks', 'INFO', '', 3);
            window.initPhoneMasks();
        }
        if (typeof initBurgerMenu === 'function') {
            logInit('Вызов initBurgerMenu', 'INFO', '', 3);
            initBurgerMenu();
        }
        if (typeof initCallbackForm === 'function') {
            logInit('Вызов initCallbackForm', 'INFO', '', 3);
            initCallbackForm();
        }

        const originalInitCalculator = window.initCalculator;
        const originalInitQuiz = window.initQuiz;

        window.initCalculator = async function () {
            logInit('Переопределённый initCalculator запущен', 'INFO', '', 3);
            await originalInitCalculator();
            logInit('originalInitCalculator завершён', 'INFO', '', 3);
            setTimeout(reinitAnimations, 100);
            setTimeout(animateStats, 150);
        };
        window.initQuiz = function () {
            logInit('Переопределённый initQuiz запущен', 'INFO', '', 3);
            originalInitQuiz();
            setTimeout(reinitAnimations, 150);
            setTimeout(animateStats, 200);
        };

        logInit('Запуск window.initCalculator()', 'INFO', '', 3);
        window.initCalculator();
        logInit('Запуск window.initQuiz()', 'INFO', '', 3);
        window.initQuiz();

        initActiveNav();
        initFormValidation();
        initScrollTopButton();
        initMaterialsEmailButtons();
        initCarousel();
        initErrorTrackingIfAvailable(); // <--- ДОБАВЛЕНА ИНИЦИАЛИЗАЦИЯ ТРЕКИНГА ОШИБОК

        if (typeof initAnimations === 'function') {
            logInit('Вызов initAnimations', 'INFO', '', 3);
            initAnimations();
        } else {
            logInit('initAnimations не найдена!', 'ERROR', '', 1);
        }
        setTimeout(reinitAnimations, 100);
        logInit('DOMContentLoaded обработчик завершён', 'INFO', '', 3);
    });

    window.addEventListener('load', function () {
        logInit('Событие load', 'INFO', '', 3);
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