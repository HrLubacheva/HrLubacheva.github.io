(function() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    let slides = [], currentIndex = 0, slideWidth = 0, gap = 0, autoInterval = null, progressInterval = null, isTransitioning = false;
    const autoDelay = 5000;
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const progressBar = document.getElementById('progressBar');

    function updateDimensionsAndPosition() {
        if (!slides.length) return;
        slideWidth = slides[0].offsetWidth;
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
            track.offsetHeight; // reflow
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
        if (isTransitioning || slides.length === 0) return;
        isTransitioning = true;
        const newIndex = (currentIndex + 1) % slides.length;
        const isWrapping = (newIndex === 0 && currentIndex === slides.length - 1);
        if (!isWrapping) {
            currentIndex = newIndex;
            updateCarousel();
            setTimeout(() => { isTransitioning = false; }, 500);
        } else {
            currentIndex = newIndex;
            updateCarousel();
            setTimeout(() => {
                disableTransition();
                updateCarousel(true);
                enableTransition();
                setTimeout(() => { isTransitioning = false; }, 50);
            }, 500);
        }
        startProgressAnimation();
    }
    function prevSlide() {
        if (isTransitioning || slides.length === 0) return;
        isTransitioning = true;
        const newIndex = (currentIndex - 1 + slides.length) % slides.length;
        const isWrapping = (newIndex === slides.length - 1 && currentIndex === 0);
        if (!isWrapping) {
            currentIndex = newIndex;
            updateCarousel();
            setTimeout(() => { isTransitioning = false; }, 500);
        } else {
            currentIndex = newIndex;
            updateCarousel();
            setTimeout(() => {
                disableTransition();
                updateCarousel(true);
                enableTransition();
                setTimeout(() => { isTransitioning = false; }, 50);
            }, 500);
        }
        startProgressAnimation();
    }
    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
    }
    function createDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < slides.length; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === currentIndex) dot.classList.add('active');
            dot.addEventListener('click', () => {
                if (isTransitioning) return;
                stopAutoScroll();
                currentIndex = i;
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
    const wrapper = document.querySelector('.carousel-wrapper');
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
        slides = Array.from(track.children);
        if (!slides.length) return;
        waitForImages().then(() => {
            updateDimensionsAndPosition();
            createDots();
            startAutoScroll();
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();