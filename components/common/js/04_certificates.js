// ============================================================
// 04_certificates.js – Бесконечная карусель с прогресс-баром
// Плавная автопрокрутка, поддержка тач-устройств, утроение слайдов
// ============================================================
(function () {
    function initInfiniteCarousel(trackId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        // Настройки
        const SLIDE_GAP = 24;
        const SPEED = 100;
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
                    triple.push(slide.cloneNode(true)));
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
            track.style.transform = `translateX(${scrollPos}px)`;
        }

        function normalizePosition(pos) {
            let norm = pos;
            while (norm > 0) norm -= originalSetWidth;
            while (norm < -originalSetWidth) norm += originalSetWidth;
            return norm;
        }

        function updateProgressBar() {
            const container = document.querySelector('.carousel-progress-container');
            const marker = document.querySelector('.carousel-progress-marker');
            if (!container || !marker) return;
            let norm = normalizePosition(scrollPos);
            let progress = -norm / originalSetWidth;
            const rect = container.getBoundingClientRect();
            const maxLeft = rect.width - marker.offsetWidth;
            marker.style.left = `${progress * maxLeft}px`;
        }

        function ensureProgressBar() {
            if (document.querySelector('.carousel-progress-container')) return;
            const wrapper = track.closest('.carousel-wrapper');
            if (!wrapper) return;
            const div = document.createElement('div');
            div.className = 'carousel-progress-container';
            div.style.cssText = `position:relative; width:100%; height:6px; background:#e2e8f0; border-radius:6px; margin:20px auto 10px; cursor:pointer;`;
            const marker = document.createElement('div');
            marker.className = 'carousel-progress-marker';
            marker.style.cssText = `position:absolute; width:20px; height:20px; background:var(--primary,#2D6A9F); border-radius:50%; top:50%; transform:translateY(-50%); left:0; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.2); transition:left 0.05s linear;`;
            div.appendChild(marker);
            wrapper.insertAdjacentElement('afterend', div);
            div.addEventListener('click', (e) => {
                const rect = div.getBoundingClientRect();
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
            const delta = Math.min(100, now - lastTimestamp);
            lastTimestamp = now;
            if (!isHovering && !isDragging) {
                let step = (SPEED * delta) / 1000;
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

        // Drag & drop
        function getClientX(e) {
            return e.touches ? e.touches[0].clientX : e.clientX;
        }
        function onDragStart(x) {
            isDragging = true;
            dragStartX = x;
            dragStartPos = scrollPos;
            track.style.transition = 'none';
            document.body.style.userSelect = 'none';
            document.body.style.overflow = 'hidden';
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
            document.body.style.userSelect = '';
            document.body.style.overflow = '';
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
        function onMouseUp() { onDragEnd(); }

        function onTouchStart(e) {
            e.preventDefault();
            if (e.touches.length === 1) onDragStart(getClientX(e));
        }
        function onTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            if (e.touches.length === 1) onDragMove(getClientX(e));
        }
        function onTouchEnd() { onDragEnd(); }

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