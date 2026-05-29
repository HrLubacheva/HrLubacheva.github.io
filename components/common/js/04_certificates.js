// ============================================================
// 04_certificates.js – Бесконечная карусель с прогресс-баром
// Плавная автопрокрутка, поддержка тач-устройств, без лагов
// ============================================================
(function () {
    function initInfiniteCarousel(trackId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let originalSlides = Array.from(track.children);
        if (originalSlides.length === 0) return;

        // ----- НАСТРОЙКИ -----
        const SLIDE_GAP = 24;           // px между слайдами
        const SPEED = 100;              // px/сек (средняя скорость, комфортная)
        let slideWidth = 0;
        let originalSetWidth = 0;       // ширина одного набора оригиналов (с отступами)
        let scrollPos = 0;
        let animationId = null;
        let isHovering = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartPos = 0;
        let lastTimestamp = 0;

        // ----- УТРОЕНИЕ ЛЕНТЫ (3 копии для бесконечности) -----
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

        // ----- ПЕРЕСЧЁТ РАЗМЕРОВ (при загрузке и resize) -----
        function updateDimensions() {
            if (slides[0]) {
                slideWidth = slides[0].offsetWidth;
                if (slideWidth === 0) slideWidth = 200; // fallback
            }
            originalSetWidth = originalSlides.length * (slideWidth + SLIDE_GAP);
        }

        // ----- УСТАНОВКА ПОЗИЦИИ -----
        function setPosition(pos) {
            scrollPos = pos;
            track.style.transform = `translateX(${scrollPos}px)`;
        }

        // ----- НОРМАЛИЗАЦИЯ ДЛЯ БЕСКОНЕЧНОСТИ -----
        function normalizePosition(pos) {
            let normalized = pos;
            while (normalized > 0) normalized -= originalSetWidth;
            while (normalized < -originalSetWidth) normalized += originalSetWidth;
            return normalized;
        }

        // ----- ПРОГРЕСС-БАР (БЕГУНОК) -----
        function updateProgressBar() {
            const progressContainer = document.querySelector('.carousel-progress-container');
            const progressMarker = document.querySelector('.carousel-progress-marker');
            if (!progressContainer || !progressMarker) return;
            let normalized = normalizePosition(scrollPos);
            let progress = -normalized / originalSetWidth; // от 0 до 1
            const containerRect = progressContainer.getBoundingClientRect();
            const markerWidth = progressMarker.offsetWidth;
            const maxLeft = containerRect.width - markerWidth;
            const leftPos = progress * maxLeft;
            progressMarker.style.left = `${leftPos}px`;
        }

        // ----- СОЗДАНИЕ ПРОГРЕСС-БАРА, ЕСЛИ ЕГО НЕТ В DOM -----
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
                // Клик по полосе – перемотка
                progressDiv.addEventListener('click', (e) => {
                    const rect = progressDiv.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = Math.min(1, Math.max(0, clickX / rect.width));
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

        // ----- АНИМАЦИЯ (движение влево) -----
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
                // Бесконечное зацикливание
                if (newPos < -originalSetWidth) newPos += originalSetWidth;
                if (newPos > 0) newPos -= originalSetWidth;   // на всякий случай
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

        // ----- DRAG & DROP (мышь и тач) -----
        function getClientX(e) {
            if (e.touches) return e.touches[0].clientX;
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

        // ----- МЫШЬ -----
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

        // ----- ТАЧ-УСТРОЙСТВА -----
        function onTouchStart(e) {
            e.preventDefault();
            if (e.touches.length === 1) onDragStart(getClientX(e));
        }
        function onTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            if (e.touches.length === 1) onDragMove(getClientX(e));
        }
        function onTouchEnd(e) { onDragEnd(); }

        // ----- ПАУЗА ПРИ НАВЕДЕНИИ МЫШИ -----
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

        // ----- ИНИЦИАЛИЗАЦИЯ -----
        function init() {
            updateDimensions();
            // Начальная позиция: второй набор оригиналов (сдвиг влево на originalSetWidth)
            scrollPos = -originalSetWidth;
            setPosition(scrollPos);
            ensureProgressBar();
            updateProgressBar();
            startAnimation();

            // События
            track.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            track.addEventListener('touchstart', onTouchStart, { passive: false });
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd);

            // Адаптив при изменении размера окна (debounce)
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updateDimensions();
                    let norm = normalizePosition(scrollPos);
                    scrollPos = norm;
                    setPosition(scrollPos);
                    updateProgressBar();
                    if (!isHovering && !isDragging) {
                        stopAnimation();
                        startAnimation();
                    }
                }, 150);
            });
        }

        // Ждём загрузки всех изображений, чтобы корректно рассчитать ширину
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

    // Запускаем карусель, если есть элемент с id="carouselTrack"
    if (document.getElementById('carouselTrack')) {
        initInfiniteCarousel('carouselTrack');
    }

    // Экспортируем функцию для возможной переинициализации
    window.initInfiniteCarousel = initInfiniteCarousel;
})();