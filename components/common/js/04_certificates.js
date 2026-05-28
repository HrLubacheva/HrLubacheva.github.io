// ============================================================
// 04_certificates.js – Бесконечная карусель с анимированной полосой
// Лента утроена (3 копии). Движение влево непрерывно.
// Полоса прокрутки – бегущий градиент, синхронизированный со скоростью.
// Наведение – пауза, перетаскивание – пауза, после отпускания – продолжение.
// ============================================================
(function () {
    function initInfiniteCarousel(trackId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        const slideGap = 24;            // px
        let slideWidth = 0;
        let containerWidth = 0;
        let scrollPos = 0;
        let animationId = null;
        let isHovering = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartPos = 0;
        let lastTimestamp = 0;
        const SPEED = 140;              // px/сек

        // Создаём утроенную ленту (3 копии)
        function buildTripleTrack() {
            const triple = [];
            for (let i = 0; i < 3; i++) {
                originalSlides.forEach(slide => {
                    triple.push(slide.cloneNode(true));
                });
            }
            track.innerHTML = '';
            triple.forEach(clone => track.appendChild(clone));
            return Array.from(track.children);
        }

        let slides = buildTripleTrack();
        let originalSetWidth = 0;        // ширина одного набора оригиналов

        // ========== Прогресс-бар с анимированным градиентом ==========
        let progressElement = null;
        let gradientAnimationActive = false;

        function createGradientProgressBar() {
            let progress = document.querySelector('.carousel-progress');
            if (!progress) {
                const wrapper = track.closest('.carousel-wrapper');
                if (!wrapper) return null;
                progress = document.createElement('div');
                progress.className = 'carousel-progress';
                progress.style.cssText = `
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, #e2e8f0 0%, #e2e8f0 30%, var(--primary, #2D6A9F) 50%, #e2e8f0 70%, #e2e8f0 100%);
                    background-size: 200% 100%;
                    border-radius: 4px;
                    margin: 20px auto 10px;
                    transition: opacity 0.2s;
                `;
                wrapper.insertAdjacentElement('afterend', progress);
            }
            // Скрываем старые элементы (маркер и контейнер), если они есть
            const oldMarker = document.querySelector('.carousel-progress-marker');
            if (oldMarker) oldMarker.style.display = 'none';
            const oldContainer = document.querySelector('.carousel-progress-container');
            if (oldContainer) oldContainer.style.display = 'none';
            return progress;
        }

        function ensureKeyframes() {
            if (document.querySelector('#carousel-gradient-keyframes')) return;
            const style = document.createElement('style');
            style.id = 'carousel-gradient-keyframes';
            style.textContent = `
                @keyframes progressMove {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 200% 0%; }
                }
            `;
            document.head.appendChild(style);
        }

        function startGradientAnimation() {
            if (!progressElement) return;
            if (gradientAnimationActive) return;
            if (originalSetWidth <= 0) return;
            const duration = originalSetWidth / SPEED;
            if (isNaN(duration) || duration <= 0) return;
            ensureKeyframes();
            progressElement.style.animation = `progressMove ${duration}s linear infinite`;
            gradientAnimationActive = true;
        }

        function stopGradientAnimation() {
            if (!progressElement) return;
            progressElement.style.animation = 'none';
            progressElement.style.backgroundPosition = '0% 0%';
            gradientAnimationActive = false;
        }

        // ========== Геометрия ==========
        function updateDimensions() {
            const firstSlide = slides[0];
            if (firstSlide) {
                slideWidth = firstSlide.offsetWidth;
                if (slideWidth === 0) slideWidth = 200;
            }
            const wrapper = track.closest('.carousel-viewport');
            containerWidth = wrapper ? wrapper.clientWidth : track.parentElement.clientWidth;
            originalSetWidth = originalSlides.length * (slideWidth + slideGap);
        }

        function setPosition(pos) {
            scrollPos = pos;
            track.style.transform = `translateX(${scrollPos}px)`;
        }

        // ========== Анимация карусели ==========
        function animate(now) {
            if (!animationId) return;
            if (lastTimestamp === 0) {
                lastTimestamp = now;
                requestAnimationFrame(animate);
                return;
            }
            const delta = Math.min(100, now - lastTimestamp);
            lastTimestamp = now;

            if (!isHovering && !isDragging) {
                let step = (SPEED * delta) / 1000;
                let newPos = scrollPos - step;

                // Бесконечное зацикливание: удерживаем позицию в пределах двух копий
                if (newPos < -originalSetWidth * 2) {
                    newPos += originalSetWidth;
                } else if (newPos > 0) {
                    newPos -= originalSetWidth;
                }
                setPosition(newPos);
            }
            requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (animationId) return;
            lastTimestamp = 0;
            animationId = requestAnimationFrame(animate);
            if (!isHovering && !isDragging && progressElement) {
                startGradientAnimation();
            }
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            stopGradientAnimation();
        }

        // ========== Drag & drop ==========
        function onMouseDown(e) {
            if (e.button !== 0) return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartPos = scrollPos;
            track.style.transition = 'none';
            e.preventDefault();
            document.body.style.userSelect = 'none';
            stopAnimation();
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            let newPos = dragStartPos + dx;
            const minPos = -originalSetWidth * 2;
            const maxPos = 0;
            if (newPos > maxPos) newPos = maxPos;
            if (newPos < minPos) newPos = minPos;
            setPosition(newPos);
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
            track.style.transition = 'transform 0.3s ease';
            // Нормализуем позицию
            let norm = scrollPos;
            if (norm < -originalSetWidth * 2) norm += originalSetWidth;
            if (norm > 0) norm -= originalSetWidth;
            setPosition(norm);
            if (!isHovering) startAnimation();
        }

        // ========== Наведение мыши ==========
        const wrapper = track.closest('.carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => {
                isHovering = true;
                stopAnimation();
            });
            wrapper.addEventListener('mouseleave', () => {
                isHovering = false;
                if (!isDragging) startAnimation();
            });
        }

        // ========== Инициализация ==========
        function init() {
            updateDimensions();
            setPosition(-originalSetWidth);
            progressElement = createGradientProgressBar();
            startAnimation();

            track.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            window.addEventListener('resize', () => {
                updateDimensions();
                let norm = scrollPos;
                if (norm < -originalSetWidth * 2) norm += originalSetWidth;
                if (norm > 0) norm -= originalSetWidth;
                setPosition(norm);
                if (!isHovering && !isDragging) {
                    stopAnimation();
                    startAnimation();
                }
                if (progressElement && originalSetWidth > 0) {
                    const duration = originalSetWidth / SPEED;
                    progressElement.style.animation = `progressMove ${duration}s linear infinite`;
                    if (gradientAnimationActive) {
                        progressElement.style.animation = `progressMove ${duration}s linear infinite`;
                    }
                }
            });
        }

        function waitForImages() {
            const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);
            if (imgs.length === 0) return Promise.resolve();
            return Promise.all(imgs.map(img =>
                img.complete ? Promise.resolve() : new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                })
            ));
        }

        waitForImages().then(init);
    }

    if (document.getElementById('carouselTrack')) {
        initInfiniteCarousel('carouselTrack');
    }
})();