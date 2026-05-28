// ============================================================
// 04_certificates.js – Бесконечная карусель с кнопками и прогрессом
// ============================================================
(function () {
    function initInfiniteCarousel(trackId, prevBtnSelector = null, nextBtnSelector = null) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        const slideGap = 24;
        let slideWidth = 0;
        let containerWidth = 0;
        let scrollPos = 0;
        let animationId = null;
        let isHovering = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartPos = 0;
        let lastTimestamp = 0;
        const SPEED = 140;

        function buildTripleTrack() {
            const triple = [];
            for (let i = 0; i < 3; i++) {
                originalSlides.forEach(slide => triple.push(slide.cloneNode(true)));
            }
            track.innerHTML = '';
            triple.forEach(clone => track.appendChild(clone));
            track.style.willChange = 'transform';
            return Array.from(track.children);
        }

        let slides = buildTripleTrack();
        let originalSetWidth = 0;
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
                `;
                wrapper.insertAdjacentElement('afterend', progress);
            }
            return progress;
        }

        function startGradientAnimation() {
            if (!progressElement || gradientAnimationActive) return;
            if (originalSetWidth <= 0) return;
            const duration = originalSetWidth / SPEED;
            if (isNaN(duration) || duration <= 0) return;
            progressElement.style.animation = `progressMove ${duration}s linear infinite`;
            gradientAnimationActive = true;
        }

        function stopGradientAnimation() {
            if (!progressElement) return;
            progressElement.style.animation = 'none';
            gradientAnimationActive = false;
        }

        function updateDimensions() {
            const firstSlide = slides[0];
            slideWidth = firstSlide ? firstSlide.offsetWidth : 200;
            const wrapper = track.closest('.carousel-viewport');
            containerWidth = wrapper ? wrapper.clientWidth : track.parentElement.clientWidth;
            originalSetWidth = originalSlides.length * (slideWidth + slideGap);
        }

        function setPosition(pos) {
            scrollPos = pos;
            track.style.transform = `translateX(${scrollPos}px)`;
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
                if (newPos < -originalSetWidth * 2) newPos += originalSetWidth;
                else if (newPos > 0) newPos -= originalSetWidth;
                setPosition(newPos);
            }
            requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (animationId) return;
            lastTimestamp = 0;
            animationId = requestAnimationFrame(animate);
            if (!isHovering && !isDragging) startGradientAnimation();
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            stopGradientAnimation();
        }

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
            let norm = scrollPos;
            if (norm < -originalSetWidth * 2) norm += originalSetWidth;
            if (norm > 0) norm -= originalSetWidth;
            setPosition(norm);
            if (!isHovering) startAnimation();
        }

        function setupButtons() {
            const prevBtn = prevBtnSelector ? document.querySelector(prevBtnSelector) : null;
            const nextBtn = nextBtnSelector ? document.querySelector(nextBtnSelector) : null;
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    let newPos = scrollPos + originalSetWidth;
                    if (newPos > 0) newPos -= originalSetWidth;
                    setPosition(newPos);
                    if (!isHovering && !isDragging) startAnimation();
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    let newPos = scrollPos - originalSetWidth;
                    if (newPos < -originalSetWidth * 2) newPos += originalSetWidth;
                    setPosition(newPos);
                    if (!isHovering && !isDragging) startAnimation();
                });
            }
        }

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
            setPosition(-originalSetWidth);
            progressElement = createGradientProgressBar();
            setupButtons();
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
            });
        }

        function waitForImages() {
            const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);
            if (imgs.length === 0) return Promise.resolve();
            return Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })));
        }

        waitForImages().then(init);
    }

    window.initInfiniteCarousel = initInfiniteCarousel;

    if (document.getElementById('carouselTrack')) {
        initInfiniteCarousel('carouselTrack', '.carousel-prev', '.carousel-next');
    }
})();