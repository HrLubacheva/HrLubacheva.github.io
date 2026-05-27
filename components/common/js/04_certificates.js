// ============================================================
// 04_certificates.js – Карусель сертификатов (автопрокрутка 5 секунд)
// ============================================================
(function() {
    function initInfiniteCarousel(trackId, prevBtnClass, nextBtnClass, progressId, dotsId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let slides = Array.from(track.children);
        if (slides.length === 0) return;

        let currentIndex = 0;
        let slideWidth = 0;
        let autoInterval = null;
        let progressInterval = null;
        let isHovering = false;
        const autoDelay = 5000; // 5 секунд

        function updateSlideWidth() {
            slideWidth = slides[0]?.offsetWidth;
            if (slideWidth === 0) slideWidth = 200; // fallback
            track.style.transition = 'transform 0.3s ease';
        }

        function updateCarousel() {
            const shift = -currentIndex * (slideWidth + 24); // gap 24px
            track.style.transform = `translateX(${shift}px)`;
            updateDots();
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
            resetProgressBar();
            if (!isHovering) startProgressAnimation();
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
            resetProgressBar();
            if (!isHovering) startProgressAnimation();
        }

        function updateDots() {
            const dotsContainer = document.getElementById(dotsId);
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
        }

        function createDots() {
            const container = document.getElementById(dotsId);
            if (!container) return;
            container.innerHTML = '';
            for (let i = 0; i < slides.length; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                    resetProgressBar();
                    if (!isHovering) startProgressAnimation();
                });
                container.appendChild(dot);
            }
        }

        function resetProgressBar() {
            const progressBar = document.getElementById(progressId);
            if (progressBar) progressBar.style.width = '0%';
        }

        function startProgressAnimation() {
            const progressBar = document.getElementById(progressId);
            if (!progressBar) return;
            resetProgressBar();
            if (progressInterval) clearInterval(progressInterval);
            const startTime = Date.now();
            progressInterval = setInterval(() => {
                if (isHovering) return;
                const elapsed = Date.now() - startTime;
                let percent = (elapsed / autoDelay) * 100;
                if (percent >= 100) {
                    percent = 100;
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
                progressBar.style.width = `${percent}%`;
            }, 30);
        }

        function startAutoScroll() {
            if (autoInterval) clearInterval(autoInterval);
            autoInterval = setInterval(() => {
                if (!isHovering) nextSlide();
            }, autoDelay);
            startProgressAnimation();
        }

        function stopAutoScroll() {
            if (autoInterval) {
                clearInterval(autoInterval);
                autoInterval = null;
            }
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
            resetProgressBar();
        }

        const prevBtn = document.querySelector(prevBtnClass);
        const nextBtn = document.querySelector(nextBtnClass);
        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); stopAutoScroll(); startAutoScroll(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); stopAutoScroll(); startAutoScroll(); });

        const wrapper = track.closest('.carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => { isHovering = true; stopAutoScroll(); });
            wrapper.addEventListener('mouseleave', () => { isHovering = false; startAutoScroll(); });
        }

        function waitForImages() {
            const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);
            if (imgs.length === 0) return Promise.resolve();
            return Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })));
        }

        waitForImages().then(() => {
            updateSlideWidth();
            createDots();
            updateCarousel();
            startAutoScroll();
        });

        window.addEventListener('resize', () => {
            updateSlideWidth();
            updateCarousel();
            stopAutoScroll();
            startAutoScroll();
        });
    }
    window.initInfiniteCarousel = initInfiniteCarousel;
})();