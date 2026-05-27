(function() {
    function initInfiniteCarousel(trackId, prevBtnClass, nextBtnClass, progressId, dotsId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;
        const slideCount = originalSlides.length;

        // Клонируем слайды для бесконечности
        const cloneStart = originalSlides.map(slide => slide.cloneNode(true));
        const cloneEnd = originalSlides.map(slide => slide.cloneNode(true));
        cloneStart.forEach(clone => track.appendChild(clone));
        cloneEnd.forEach(clone => track.insertBefore(clone, track.firstChild));

        let allSlides = Array.from(track.children);
        let currentIndex = slideCount; // начинаем с первого оригинала
        let slideWidth = 0, gap = 0;
        let autoInterval = null, progressInterval = null;
        let isTransitioning = false;
        const autoDelay = 5000;

        const prevBtn = document.querySelector(prevBtnClass);
        const nextBtn = document.querySelector(nextBtnClass);
        const progressBar = document.getElementById(progressId);
        const dotsContainer = document.getElementById(dotsId);

        function updateDimensionsAndPosition() {
            if (!allSlides.length) return;
            slideWidth = allSlides[0].offsetWidth;
            const trackStyle = getComputedStyle(track);
            gap = parseFloat(trackStyle.gap) || 24;
            disableTransition();
            updateCarousel(true);
            enableTransition();
        }

        function updateCarousel(instant = false) {
            const shift = -currentIndex * (slideWidth + gap);
            if (instant) {
                track.style.transition = 'none';
                track.style.transform = `translateX(${shift}px)`;
                track.offsetHeight;
                track.style.transition = '';
            } else {
                track.style.transform = `translateX(${shift}px)`;
            }
            updateDots();
            resetProgressBar();
        }

        function disableTransition() { track.style.transition = 'none'; }
        function enableTransition() { track.style.transition = ''; }

        function nextSlide() {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex++;
            updateCarousel();

            if (currentIndex >= slideCount * 2) {
                setTimeout(() => {
                    disableTransition();
                    currentIndex = slideCount;
                    updateCarousel(true);
                    enableTransition();
                    setTimeout(() => { isTransitioning = false; }, 50);
                }, 250);
            } else {
                setTimeout(() => { isTransitioning = false; }, 250);
            }
            startProgressAnimation();
        }

        function prevSlide() {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex--;
            updateCarousel();

            if (currentIndex < slideCount) {
                setTimeout(() => {
                    disableTransition();
                    currentIndex = slideCount * 2 - 1;
                    updateCarousel(true);
                    enableTransition();
                    setTimeout(() => { isTransitioning = false; }, 50);
                }, 250);
            } else {
                setTimeout(() => { isTransitioning = false; }, 250);
            }
            startProgressAnimation();
        }

        function updateDots() {
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.dot');
            let originalIndex = currentIndex % slideCount;
            if (originalIndex < 0) originalIndex += slideCount;
            dots.forEach((dot, idx) => dot.classList.toggle('active', idx === originalIndex));
        }

        function createDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            for (let i = 0; i < slideCount; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    if (isTransitioning) return;
                    stopAutoScroll();
                    currentIndex = slideCount + i;
                    updateCarousel();
                    startAutoScroll();
                });
                dotsContainer.appendChild(dot);
            }
        }

        function resetProgressBar() { if (progressBar) progressBar.style.width = '0%'; }
        function startProgressAnimation() {
            if (!progressBar) return;
            resetProgressBar();
            let startTime = null;
            function animateProgress(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const percent = Math.min((elapsed / autoDelay) * 100, 100);
                progressBar.style.width = `${percent}%`;
                if (elapsed < autoDelay) {
                    progressInterval = requestAnimationFrame(animateProgress);
                } else {
                    progressBar.style.width = '100%';
                    cancelProgressAnimation();
                }
            }
            cancelProgressAnimation();
            progressInterval = requestAnimationFrame(animateProgress);
        }
        function cancelProgressAnimation() {
            if (progressInterval) { cancelAnimationFrame(progressInterval); progressInterval = null; }
        }

        function startAutoScroll() {
            if (autoInterval) clearInterval(autoInterval);
            autoInterval = setInterval(nextSlide, autoDelay);
            startProgressAnimation();
        }
        function stopAutoScroll() {
            if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
            cancelProgressAnimation();
            if (progressBar) progressBar.style.width = '0%';
        }

        if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoScroll(); prevSlide(); startAutoScroll(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoScroll(); nextSlide(); startAutoScroll(); });

        const wrapper = track.closest('.carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', stopAutoScroll);
            wrapper.addEventListener('mouseleave', startAutoScroll);
        }

        window.addEventListener('resize', () => updateDimensionsAndPosition());

        function waitForImages() {
            const imgs = Array.from(track.querySelectorAll('img'));
            if (!imgs.length) return Promise.resolve();
            return Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })));
        }

        function init() {
            if (!allSlides.length) return;
            waitForImages().then(() => {
                updateDimensionsAndPosition();
                createDots();
                startAutoScroll();
            });
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }

    document.addEventListener('DOMContentLoaded', function() {
        initInfiniteCarousel('carouselTrack', '.carousel-prev', '.carousel-next', 'progressBar', 'carouselDots');
    });
})();