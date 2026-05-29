// ============================================================
// 04_certificates.js – Бесконечная карусель с прогресс-баром
// Лента утроена (3 копии). Движение влево непрерывно.
// Полоса прокрутки с бегунком, синхронизированная.
// Наведение – пауза, перетаскивание – синхронизация.
// ДОБАВЛЕНА ПОДДЕРЖКА ТАЧПАДА / СЕНСОРНОГО ЭКРАНА
// ============================================================
(function () {
    function initInfiniteCarousel(trackId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        const slideGap = 24;            // px
        let slideWidth = 0;
        let totalWidth = 0;
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
        let originalSetWidth = 0;        // ширина одного набора оригиналов (с отступами)
        let fullTrackWidth = 0;

        function updateDimensions() {
            if (slides[0]) {
                slideWidth = slides[0].offsetWidth;
                if (slideWidth === 0) slideWidth = 200;
                fullTrackWidth = slides.length * (slideWidth + slideGap);
            }
            const wrapper = track.closest('.carousel-viewport');
            containerWidth = wrapper ? wrapper.clientWidth : track.parentElement.clientWidth;
            originalSetWidth = originalSlides.length * (slideWidth + slideGap);
        }

        function setPosition(pos) {
            scrollPos = pos;
            track.style.transform = `translateX(${scrollPos}px)`;
        }

        function normalizePosition(pos) {
            let normalized = pos;
            while (normalized > 0) normalized -= originalSetWidth;
            while (normalized < -originalSetWidth) normalized += originalSetWidth;
            return normalized;
        }

        function updateProgressBar() {
            const progressContainer = document.querySelector('.carousel-progress-container');
            const progressMarker = document.querySelector('.carousel-progress-marker');
            if (!progressContainer || !progressMarker) return;
            let normalized = normalizePosition(scrollPos);
            let progress = -normalized / originalSetWidth;
            const containerRect = progressContainer.getBoundingClientRect();
            const markerWidth = progressMarker.offsetWidth;
            const maxLeft = containerRect.width - markerWidth;
            const leftPos = progress * maxLeft;
            progressMarker.style.left = `${leftPos}px`;
        }

        function ensureProgressBar() {
            let container = document.querySelector('.carousel-progress-container');
            if (!container) {
                const wrapper = track.closest('.carousel-wrapper');
                if (!wrapper) return;
                const progressDiv = document.createElement('div');
                progressDiv.className = 'carousel-progress-container';
                progressDiv.style.cssText = `
                    position: relative;
                    width: 100%;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 6px;
                    margin: 20px auto 10px;
                    cursor: pointer;
                `;
                const marker = document.createElement('div');
                marker.className = 'carousel-progress-marker';
                marker.style.cssText = `
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: var(--primary, #2D6A9F);
                    border-radius: 50%;
                    top: 50%;
                    transform: translateY(-50%);
                    left: 0;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    transition: left 0.05s linear;
                `;
                progressDiv.appendChild(marker);
                wrapper.insertAdjacentElement('afterend', progressDiv);
                progressDiv.addEventListener('click', (e) => {
                    const rect = progressDiv.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    let targetNormalized = -percent * originalSetWidth;
                    let newPos = normalizePosition(scrollPos);
                    let delta = targetNormalized - newPos;
                    scrollPos += delta;
                    setPosition(scrollPos);
                    updateProgressBar();
                    if (!isHovering && !isDragging) {
                        stopAnimation();
                        startAnimation();
                    }
                });
                container = progressDiv;
            }
            return container;
        }

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
                const minPos = -originalSetWidth;
                if (newPos < minPos) {
                    newPos += originalSetWidth;
                }
                setPosition(newPos);
                updateProgressBar();
            }
            requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (animationId) return;
            lastTimestamp = 0;
            animationId = requestAnimationFrame(animate);
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }

        // ----- УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ПЕРЕТАСКИВАНИЯ ДЛЯ МЫШИ И ТАЧПАДА -----
        function getClientXFromEvent(e) {
            if (e.touches) {
                return e.touches[0].clientX;
            }
            return e.clientX;
        }

        function onDragStart(clientX) {
            isDragging = true;
            dragStartX = clientX;
            dragStartPos = scrollPos;
            track.style.transition = 'none';
            document.body.style.userSelect = 'none';
            document.body.style.overflow = 'hidden';
            stopAnimation();
        }

        function onDragMove(clientX) {
            if (!isDragging) return;
            const dx = clientX - dragStartX;
            let newPos = dragStartPos + dx;
            scrollPos = newPos;
            setPosition(scrollPos);
            updateProgressBar();
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
            document.body.style.overflow = '';
            track.style.transition = 'transform 0.3s ease';
            let norm = normalizePosition(scrollPos);
            scrollPos = norm;
            setPosition(scrollPos);
            updateProgressBar();
            if (!isHovering) startAnimation();
        }

        // Обработчики для мыши
        function onMouseDown(e) {
            if (e.button !== 0) return;
            e.preventDefault();
            onDragStart(getClientXFromEvent(e));
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            onDragMove(getClientXFromEvent(e));
        }

        function onMouseUp(e) {
            onDragEnd();
        }

        // Обработчики для тач-событий
        function onTouchStart(e) {
            e.preventDefault();
            if (e.touches.length === 1) {
                onDragStart(getClientXFromEvent(e));
            }
        }

        function onTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            if (e.touches.length === 1) {
                onDragMove(getClientXFromEvent(e));
            }
        }

        function onTouchEnd(e) {
            onDragEnd();
        }

        // Наведение мыши (пауза автопрокрутки)
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

        function init() {
            updateDimensions();
            scrollPos = -originalSetWidth;
            setPosition(scrollPos);
            ensureProgressBar();
            updateProgressBar();
            startAnimation();

            track.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            track.addEventListener('touchstart', onTouchStart, { passive: false });
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd);

            window.addEventListener('resize', () => {
                updateDimensions();
                let norm = normalizePosition(scrollPos);
                scrollPos = norm;
                setPosition(scrollPos);
                updateProgressBar();
                if (!isHovering && !isDragging) {
                    stopAnimation();
                    startAnimation();
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

    // 👇 ЭКСПОРТ ФУНКЦИИ ДЛЯ 99_main.js
    window.initInfiniteCarousel = initInfiniteCarousel;
})();