(function() {
    'use strict';

    // Функция для повторной инициализации анимации на ещё не видимых элементах
    function reinitAnimations() {
        const elements = document.querySelectorAll('.fade-up:not(.visible)');
        if (!elements.length) return;
        const isMobile = window.innerWidth <= 768;
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

    // Валидация формы в реальном времени
    function initFormValidation() {
        const phoneInput = document.getElementById('callbackPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
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
            nameInput.addEventListener('input', function() {
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

    // Кнопка "Наверх"
    function initScrollTopButton() {
        const btn = document.createElement('button');
        btn.className = 'scroll-top';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Наверх');
        document.body.appendChild(btn);

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.fade-up').forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            if (typeof initAnimations === 'function') window.initAnimations = function() {};
        }

        if (typeof initAnimations === 'function') initAnimations();
        if (typeof initUserId === 'function') initUserId().catch(e => console.warn(e));
        if (typeof initCalculator === 'function') initCalculator();
        if (typeof initQuiz === 'function') initQuiz();
        if (typeof initModal === 'function') initModal();
        if (typeof initCallbackForm === 'function') initCallbackForm();
        if (typeof initSmoothScroll === 'function') initSmoothScroll();
        if (typeof initCopyButtons === 'function') initCopyButtons();
        if (typeof initBurgerMenu === 'function') initBurgerMenu();
        if (typeof initFormEnterSubmit === 'function') initFormEnterSubmit();
        if (typeof initCookieConsent === 'function') initCookieConsent();

        // Валидация формы
        initFormValidation();

        // Кнопка "Наверх"
        initScrollTopButton();

        const originalInitCalculator = window.initCalculator;
        if (originalInitCalculator) {
            window.initCalculator = async function() {
                await originalInitCalculator();
                setTimeout(reinitAnimations, 100);
            };
        }

        const originalInitQuiz = window.initQuiz;
        if (originalInitQuiz) {
            window.initQuiz = function() {
                originalInitQuiz();
                setTimeout(reinitAnimations, 150);
            };
        }

        document.addEventListener('click', function(e) {
            if (e.target.closest('.tab-btn')) {
                setTimeout(reinitAnimations, 50);
            }
        });

        setTimeout(reinitAnimations, 500);
    });

    // Принудительный показ видимых элементов после полной загрузки
    window.addEventListener('load', function() {
        setTimeout(function() {
            document.querySelectorAll('.fade-up').forEach(el => {
                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                if (rect.top < windowHeight - 100) {
                    el.classList.add('visible');
                }
            });
        }, 200);
    });
})();