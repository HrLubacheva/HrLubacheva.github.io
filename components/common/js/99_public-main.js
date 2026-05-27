(function () {
    'use strict';

    const C = window.APP_CONFIG?.CONSTANTS || {};
    const MOBILE_BREAKPOINT = C.BREAKPOINT_MOBILE || 768;
    const STATS_ANIMATION_DURATION = C.STATS_ANIMATION_DURATION || 1500;
    const SCROLL_TOP_THRESHOLD = C.SCROLL_TOP_VISIBLE_THRESHOLD || 500;

    function reinitAnimations() {
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
        }, { threshold, rootMargin });
        elements.forEach(el => observer.observe(el));
    }

    function animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (!statNumbers.length) return;
        if (window._statsAnimated) return;

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
                        if (progress < 1) {
                            requestAnimationFrame(update);
                        } else {
                            target.innerText = formatNumber(final);
                        }
                    }

                    requestAnimationFrame(update);
                    observer.unobserve(target);
                    window._statsAnimated = true;
                }
            });
        }, { threshold: 0.3 });

        statNumbers.forEach(el => observer.observe(el));
    }

    function initFormValidation() {
        const phoneInput = document.getElementById('callbackPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
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
        }
        const nameInput = document.getElementById('callbackName');
        if (nameInput) {
            nameInput.addEventListener('input', function () {
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
        }
    }

    function initScrollTopButton() {
        const btn = document.createElement('button');
        btn.className = 'scroll-top';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Наверх');
        document.body.appendChild(btn);

        function toggleScrollTop() {
            if (window.scrollY > SCROLL_TOP_THRESHOLD) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }
        window.addEventListener('scroll', toggleScrollTop);
        toggleScrollTop();

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.smoothScrollTo === 'function') {
                window.smoothScrollTo(0, 900);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    function initMaterialsEmailButtons() {
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
    }

    // ========== АКТИВНОЕ МЕНЮ ПРИ СКРОЛЛЕ ==========
    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        if (!sections.length || !navLinks.length) return;

        const observer = new IntersectionObserver((entries) => {
            const visibleSections = entries
                .filter(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (visibleSections.length) {
                const activeId = visibleSections[0].target.id;
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    link.classList.toggle('active', href === `#${activeId}`);
                });
            }
        }, { threshold: [0.25, 0.5, 0.75] });

        sections.forEach(section => observer.observe(section));
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.fade-up').forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            if (typeof initAnimations === 'function') window.initAnimations = function () {};
        }

        if (typeof initAnimations === 'function') initAnimations();
        animateStats();
        initActiveNav(); // <-- добавлен вызов активного меню

        if (typeof initUserId === 'function') initUserId().catch(() => {});
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof initQuiz === 'function') initQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
        if (typeof initCookieConsent === 'function') initCookieConsent();
        if (typeof initShareButtons === 'function') initShareButtons();
        if (typeof window.initPhoneMasks === 'function') window.initPhoneMasks();

        initFormValidation();
        initScrollTopButton();
        initMaterialsEmailButtons();

        const originalInitCalculator = window.initCalculator;
        if (originalInitCalculator) {
            window.initCalculator = async function () {
                await originalInitCalculator();
                setTimeout(reinitAnimations, 100);
                setTimeout(animateStats, 150);
            };
        }

        const originalInitQuiz = window.initQuiz;
        if (originalInitQuiz) {
            window.initQuiz = function () {
                originalInitQuiz();
                setTimeout(reinitAnimations, 150);
                setTimeout(animateStats, 200);
            };
        }

        document.addEventListener('click', function (e) {
            if (e.target.closest('.tab-btn')) {
                setTimeout(reinitAnimations, 50);
                setTimeout(animateStats, 100);
            }
        });

        setTimeout(reinitAnimations, 500);
        setTimeout(animateStats, 600);
    });

    window.addEventListener('load', function () {
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