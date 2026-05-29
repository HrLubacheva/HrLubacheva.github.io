// ============================================================
// 04_certificates.js – Бесконечная плавная карусель
// Прогресс-бар: плавная полоса (волна) без дерганий
// ============================================================
(function () {
    function initInfiniteCarousel(trackId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        // Настройки
        const SLIDE_GAP = 24;
        const SPEED_PX_PER_SEC = 25; // очень медленно и плавно
        let slideWidth = 0;
        let originalSetWidth = 0;
        let scrollPos = 0;
        let animationId = null;
        let isHovering = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartPos = 0;
        let lastTimestamp = 0;

        // Утроение ленты
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

        function updateDimensions() {
            if (slides[0]) {
                slideWidth = slides[0].offsetWidth;
                if (slideWidth === 0) slideWidth = 200;
            }
            originalSetWidth = originalSlides.length * (slideWidth + SLIDE_GAP);
        }

        function setPosition(pos) {
            scrollPos = pos;
            // Используем translate3d для аппаратного ускорения
            track.style.transform = `translate3d(${scrollPos}px, 0, 0)`;
        }

        function normalizePosition(pos) {
            let norm = pos;
            while (norm > 0) norm -= originalSetWidth;
            while (norm < -originalSetWidth) norm += originalSetWidth;
            return norm;
        }

        // Обновление прогресс-бара (ширина полосы)
        function updateProgressBar() {
            const fill = document.querySelector('.carousel-progress-fill');
            if (!fill) return;
            let norm = normalizePosition(scrollPos);
            let progress = -norm / originalSetWidth;
            // Ограничиваем от 0 до 1
            progress = Math.min(1, Math.max(0, progress));
            fill.style.width = `${progress * 100}%`;
        }

        function ensureProgressBar() {
            if (document.querySelector('.carousel-progress-container')) return;
            const wrapper = track.closest('.carousel-wrapper');
            if (!wrapper) return;
            const container = document.createElement('div');
            container.className = 'carousel-progress-container';
            container.style.cssText = 'position:relative; width:100%; height:4px; background:#e2e8f0; border-radius:4px; margin:20px auto 10px; cursor:pointer; overflow:hidden;';
            const fill = document.createElement('div');
            fill.className = 'carousel-progress-fill';
            fill.style.cssText = 'position:absolute; top:0; left:0; height:100%; width:0%; background:linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius:4px; transition:width 0.05s linear; will-change:width;';
            container.appendChild(fill);
            wrapper.insertAdjacentElement('afterend', container);

            // Клик для перемотки
            container.addEventListener('click', (e) => {
                const rect = container.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const targetNorm = -percent * originalSetWidth;
                let delta = targetNorm - normalizePosition(scrollPos);
                scrollPos += delta;
                setPosition(scrollPos);
                updateProgressBar();
                if (!isHovering && !isDragging) {
                    stopAnimation();
                    startAnimation();
                }
            });
        }

        function animate(now) {
            if (!animationId) return;
            if (lastTimestamp === 0) {
                lastTimestamp = now;
                requestAnimationFrame(animate);
                return;
            }
            const deltaSec = Math.min(0.1, (now - lastTimestamp) / 1000);
            lastTimestamp = now;
            if (!isHovering && !isDragging) {
                let step = SPEED_PX_PER_SEC * deltaSec;
                let newPos = scrollPos - step;
                if (newPos < -originalSetWidth) newPos += originalSetWidth;
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

        // Drag & drop с аппаратным ускорением
        function getClientX(e) {
            return e.touches ? e.touches[0].clientX : e.clientX;
        }

        function onDragStart(x) {
            isDragging = true;
            dragStartX = x;
            dragStartPos = scrollPos;
            track.style.transition = 'none';
            stopAnimation();
        }

        function onDragMove(x) {
            if (!isDragging) return;
            const dx = x - dragStartX;
            scrollPos = dragStartPos + dx;
            setPosition(scrollPos);
            updateProgressBar();
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            track.style.transition = 'transform 0.3s ease';
            scrollPos = normalizePosition(scrollPos);
            setPosition(scrollPos);
            updateProgressBar();
            if (!isHovering) startAnimation();
        }

        function onMouseDown(e) {
            if (e.button !== 0) return;
            e.preventDefault();
            onDragStart(getClientX(e));
        }
        function onMouseMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            onDragMove(getClientX(e));
        }
        function onMouseUp() {
            onDragEnd();
        }

        function onTouchStart(e) {
            if (e.touches.length === 1) {
                onDragStart(getClientX(e));
            }
        }
        function onTouchMove(e) {
            if (!isDragging) return;
            if (e.touches.length === 1) {
                e.preventDefault();
                onDragMove(getClientX(e));
            }
        }
        function onTouchEnd() {
            onDragEnd();
        }

        const wrapper = track.closest('.carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => { isHovering = true; stopAnimation(); });
            wrapper.addEventListener('mouseleave', () => { isHovering = false; if (!isDragging) startAnimation(); });
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

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updateDimensions();
                    scrollPos = normalizePosition(scrollPos);
                    setPosition(scrollPos);
                    updateProgressBar();
                    if (!isHovering && !isDragging) {
                        stopAnimation();
                        startAnimation();
                    }
                }, 150);
            });
        }

        function waitForImages() {
            const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);
            if (!imgs.length) return Promise.resolve();
            return Promise.all(imgs.map(img =>
                img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
            ));
        }

        waitForImages().then(init);
    }

    if (document.getElementById('carouselTrack')) {
        initInfiniteCarousel('carouselTrack');
    }
    window.initInfiniteCarousel = initInfiniteCarousel;
})();