// ============================================================
// 05_certificates.js – Бесконечная карусель с управлением и остановкой вне вьюпорта
// ============================================================
(function() {
    let isRunning = false;
    let currentAnimationId = null;
    let carouselPaused = false;
    let isMoving = false;

    function initInfiniteCarousel(trackId) {
        if (isRunning) return;
        const track = document.getElementById(trackId);
        if (!track) return;

        const originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        function getSlideWidth() {
            if (originalSlides.length === 0) return 280;
            const style = window.getComputedStyle(originalSlides[0]);
            let width = parseFloat(style.width);
            if (isNaN(width) || width === 0) {
                width = originalSlides[0].getBoundingClientRect().width;
            }
            if (isNaN(width) || width === 0) width = 280;
            return width;
        }

        const SLIDE_GAP = 24;
        const SPEED = 25;

        let slideWidth = getSlideWidth();
        let setWidth = originalSlides.length * (slideWidth + SLIDE_GAP);
        let scrollPos = 0;
        let isHover = false;
        let isDrag = false;
        let dragStartX = 0;
        let dragStartScroll = 0;
        let lastTimestamp = 0;

        function buildTripleTrack() {
            const triple = [];
            for (let i = 0; i < 3; i++) {
                originalSlides.forEach(slide => {
                    triple.push(slide.cloneNode(true));
                });
            }
            track.innerHTML = '';
            triple.forEach(clone => track.appendChild(clone));
        }
        buildTripleTrack();

        function setPosition(pos) {
            scrollPos = pos;
            track.style.transform = `translate3d(${scrollPos}px, 0, 0)`;
        }

        function normalizePosition(pos) {
            if (setWidth <= 1) return 0;
            let norm = pos;
            while (norm > 0) norm -= setWidth;
            while (norm < -setWidth) norm += setWidth;
            return norm;
        }

        function updateProgressBar() {
            const fill = document.querySelector('.carousel-progress-fill');
            if (!fill || setWidth <= 1) return;
            let norm = normalizePosition(scrollPos);
            let progress = -norm / setWidth;
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
            fill.style.cssText = 'position:absolute; top:0; left:0; height:100%; width:0%; background:linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius:4px; transition:width 0.05s linear;';
            container.appendChild(fill);
            wrapper.insertAdjacentElement('afterend', container);

            container.addEventListener('click', (e) => {
                if (setWidth <= 1) return;
                const rect = container.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const targetPos = -percent * setWidth;
                let delta = targetPos - normalizePosition(scrollPos);
                scrollPos += delta;
                setPosition(scrollPos);
                updateProgressBar();
                if (!isHover && !isDrag && !carouselPaused) startAnimation();
            });
        }

        function animate(now) {
            if (!currentAnimationId) return;
            if (lastTimestamp === 0) {
                lastTimestamp = now;
                requestAnimationFrame(animate);
                return;
            }
            const deltaSec = Math.min(0.1, (now - lastTimestamp) / 1000);
            lastTimestamp = now;
            if (!isHover && !isDrag && !carouselPaused && setWidth > 1) {
                let step = SPEED * deltaSec;
                let newPos = scrollPos - step;
                if (newPos < -setWidth) newPos += setWidth;
                if (newPos > 0) newPos -= setWidth;
                setPosition(newPos);
                updateProgressBar();
            }
            requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (currentAnimationId) return;
            lastTimestamp = 0;
            currentAnimationId = requestAnimationFrame(animate);
        }
        function stopAnimation() {
            if (currentAnimationId) {
                cancelAnimationFrame(currentAnimationId);
                currentAnimationId = null;
            }
        }

        function onDragStart(x) {
            isDrag = true;
            dragStartX = x;
            dragStartScroll = scrollPos;
            track.style.transition = 'none';
            stopAnimation();
        }
        function onDragMove(x) {
            if (!isDrag) return;
            const dx = x - dragStartX;
            scrollPos = dragStartScroll + dx;
            setPosition(scrollPos);
            updateProgressBar();
        }
        function onDragEnd() {
            if (!isDrag) return;
            isDrag = false;
            track.style.transition = 'transform 0.3s ease';
            scrollPos = normalizePosition(scrollPos);
            setPosition(scrollPos);
            updateProgressBar();
            if (!isHover && !carouselPaused) startAnimation();
        }
        function onMouseDown(e) { if (e.button !== 0) return; e.preventDefault(); onDragStart(e.clientX); }
        function onMouseMove(e) { if (!isDrag) return; e.preventDefault(); onDragMove(e.clientX); }
        function onMouseUp() { onDragEnd(); }
        function onTouchStart(e) { if (e.touches.length === 1) { e.preventDefault(); onDragStart(e.touches[0].clientX); } }
        function onTouchMove(e) {
            if (!isDrag || e.touches.length !== 1) return;
            onDragMove(e.touches[0].clientX);
        }
        function onTouchEnd() { onDragEnd(); }

        const wrapper = track.closest('.carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => { isHover = true; stopAnimation(); });
            wrapper.addEventListener('mouseleave', () => {
                isHover = false;
                if (!isDrag && !carouselPaused) startAnimation();
            });
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!carouselPaused && !isHover && !isDrag) startAnimation();
                } else {
                    stopAnimation();
                }
            });
        }, { threshold: 0.1 });
        if (wrapper) observer.observe(wrapper);

        window.carouselControl = {
            play: () => {
                if (!carouselPaused) return;
                carouselPaused = false;
                if (!isHover && !isDrag) startAnimation();
            },
            pause: () => {
                if (carouselPaused) return;
                carouselPaused = true;
                stopAnimation();
            },
            next: () => {
                if (isMoving) return;
                isMoving = true;
                const wasPlaying = !carouselPaused && !isHover && !isDrag;
                stopAnimation();
                let newPos = scrollPos - (slideWidth + SLIDE_GAP);
                if (newPos < -setWidth) newPos += setWidth;
                setPosition(newPos);
                updateProgressBar();
                if (wasPlaying) startAnimation();
                setTimeout(() => { isMoving = false; }, 100);
            },
            prev: () => {
                if (isMoving) return;
                isMoving = true;
                const wasPlaying = !carouselPaused && !isHover && !isDrag;
                stopAnimation();
                let newPos = scrollPos + (slideWidth + SLIDE_GAP);
                if (newPos > 0) newPos -= setWidth;
                setPosition(newPos);
                updateProgressBar();
                if (wasPlaying) startAnimation();
                setTimeout(() => { isMoving = false; }, 100);
            }
        };

        const prevBtn = document.getElementById('carouselPrevBtn');
        const nextBtn = document.getElementById('carouselNextBtn');
        const playPauseBtn = document.getElementById('carouselPlayPauseBtn');

        if (prevBtn) {
            prevBtn.removeEventListener('click', window._carouselPrevHandler);
            window._carouselPrevHandler = () => window.carouselControl.prev();
            prevBtn.addEventListener('click', window._carouselPrevHandler);
        }
        if (nextBtn) {
            nextBtn.removeEventListener('click', window._carouselNextHandler);
            window._carouselNextHandler = () => window.carouselControl.next();
            nextBtn.addEventListener('click', window._carouselNextHandler);
        }
        if (playPauseBtn) {
            const updateButtonText = () => {
                playPauseBtn.textContent = carouselPaused ? '▶' : '⏸';
            };
            playPauseBtn.removeEventListener('click', window._carouselPlayPauseHandler);
            window._carouselPlayPauseHandler = () => {
                if (carouselPaused) {
                    window.carouselControl.play();
                } else {
                    window.carouselControl.pause();
                }
                updateButtonText();
            };
            playPauseBtn.addEventListener('click', window._carouselPlayPauseHandler);
            updateButtonText();
        }

        function init() {
            slideWidth = getSlideWidth();
            setWidth = originalSlides.length * (slideWidth + SLIDE_GAP);
            scrollPos = -setWidth;
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

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    slideWidth = getSlideWidth();
                    setWidth = originalSlides.length * (slideWidth + SLIDE_GAP);
                    scrollPos = normalizePosition(scrollPos);
                    setPosition(scrollPos);
                    updateProgressBar();
                    if (!isHover && !isDrag && !carouselPaused) {
                        stopAnimation();
                        startAnimation();
                    }
                }, 150);
            });
            isRunning = true;
        }
        setTimeout(init, 50);
    }

    if (document.getElementById('carouselTrack')) {
        initInfiniteCarousel('carouselTrack');
    }
    window.initInfiniteCarousel = initInfiniteCarousel;
})();