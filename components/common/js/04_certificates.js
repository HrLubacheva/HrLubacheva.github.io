// ============================================================
// 04_certificates.js – Бесконечная плавная карусель (лента)
// Режим: непрерывное вращение, остановка при наведении,
//        перетаскивание мышью. Без дискретных переключений.
// ============================================================
(function () {
    function initInfiniteCarousel(trackId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        const slideGap = 24;            // px (из CSS)
        let slideWidth = 0;
        let totalWidth = 0;
        let scrollPos = 0;              // текущее смещение в px
        let animationId = null;
        let isHovering = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartPos = 0;
        let lastTimestamp = 0;

        const SCROLL_SPEED = 100;       // пикселей в секунду (настройте при необходимости)

        // Клонирование слайдов для бесконечного эффекта
        function cloneSlides() {
            const clonesBefore = [];
            const clonesAfter = [];
            const cloneCount = 6;
            for (let i = 0; i < cloneCount; i++) {
                clonesAfter.push(originalSlides[i].cloneNode(true));
                clonesBefore.push(originalSlides[originalSlides.length - 1 - i].cloneNode(true));
            }
            track.innerHTML = '';
            clonesBefore.reverse().forEach(clone => track.appendChild(clone));
            originalSlides.forEach(slide => track.appendChild(slide.cloneNode(true)));
            clonesAfter.forEach(clone => track.appendChild(clone));
            return Array.from(track.children);
        }

        let slides = cloneSlides();
        const originalStartIndex = 6;   // позиция, с которой начинается первый оригинальный слайд

        function updateDimensions() {
            const firstSlide = slides[0];
            if (firstSlide) {
                slideWidth = firstSlide.offsetWidth;
                if (slideWidth === 0) slideWidth = 200;
                totalWidth = slides.length * (slideWidth + slideGap);
            }
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
                // Движение влево
                scrollPos -= (SCROLL_SPEED * delta) / 1000;
                // Бесконечное зацикливание
                const minLimit = -(totalWidth - (slideWidth + slideGap) * originalSlides.length);
                const maxLimit = 0;
                if (scrollPos <= minLimit) {
                    scrollPos += (slideWidth + slideGap) * originalSlides.length;
                } else if (scrollPos >= maxLimit) {
                    scrollPos -= (slideWidth + slideGap) * originalSlides.length;
                }
                setPosition(scrollPos);
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
            const minPos = -(totalWidth - (slideWidth + slideGap) * originalSlides.length);
            const maxPos = 0;
            if (newPos > maxPos) newPos = maxPos;
            if (newPos < minPos) newPos = minPos;
            scrollPos = newPos;
            setPosition(scrollPos);
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
            track.style.transition = 'transform 0.3s ease';
            if (!isHovering) startAnimation();
        }

        // Наведение мыши
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

        // Инициализация после загрузки изображений
        function init() {
            updateDimensions();
            scrollPos = -originalStartIndex * (slideWidth + slideGap);
            setPosition(scrollPos);
            startAnimation();

            track.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            window.addEventListener('resize', () => {
                updateDimensions();
                scrollPos = -originalStartIndex * (slideWidth + slideGap);
                setPosition(scrollPos);
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

    // Запуск, если элемент существует
    if (document.getElementById('carouselTrack')) {
        initInfiniteCarousel('carouselTrack');
    }
})();