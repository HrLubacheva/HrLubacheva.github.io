// ============================================================
// 04_certificates.js – Бесконечная карусель с прогресс-баром
// Лента утроена (3 копии). Движение влево непрерывно.
// Полоса прокрутки с бегунком, синхронизированная.
// Наведение – пауза, перетаскивание – синхронизация.
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
        const SPEED = 140;              // px/сек (регулируйте)

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
            // Бесконечная прокрутка: удерживаем позицию в пределах от -originalSetWidth до 0
            // Но для удобства вычислений разрешаем любую и будем нормализовывать
            scrollPos = pos;
            track.style.transform = `translateX(${scrollPos}px)`;
        }

        // Нормализация позиции для полосы прогресса и перескока
        function normalizePosition(pos) {
            let normalized = pos;
            while (normalized > 0) normalized -= originalSetWidth;
            while (normalized < -originalSetWidth) normalized += originalSetWidth;
            return normalized;
        }

        // Обновление прогресс-бара (бегунок от 0 до 1, где 0 = крайний правый край ленты, 1 = левый край одного цикла)
        function updateProgressBar() {
            const progressContainer = document.querySelector('.carousel-progress-container');
            const progressMarker = document.querySelector('.carousel-progress-marker');
            if (!progressContainer || !progressMarker) return;
            // Вычисляем относительное смещение в пределах одного цикла (от -originalSetWidth до 0)
            let normalized = normalizePosition(scrollPos);
            // normalized от -originalSetWidth (лево) до 0 (право)
            let progress = -normalized / originalSetWidth; // от 0 до 1
            const containerRect = progressContainer.getBoundingClientRect();
            const markerWidth = progressMarker.offsetWidth;
            const maxLeft = containerRect.width - markerWidth;
            const leftPos = progress * maxLeft;
            progressMarker.style.left = `${leftPos}px`;
        }

        // Создание прогресс-бара, если его нет
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
                // Вставляем после карусели
                wrapper.insertAdjacentElement('afterend', progressDiv);
                // Клик по полосе – перемотка
                progressDiv.addEventListener('click', (e) => {
                    const rect = progressDiv.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    let targetNormalized = -percent * originalSetWidth;
                    let newPos = normalizePosition(scrollPos);
                    // Сдвигаем newPos до targetNormalized, но с учётом текущего цикла
                    let delta = targetNormalized - newPos;
                    scrollPos += delta;
                    setPosition(scrollPos);
                    updateProgressBar();
                    if (!isHovering && !isDragging) {
                        // перезапускаем анимацию, чтобы продолжить
                        stopAnimation();
                        startAnimation();
                    }
                });
                container = progressDiv;
            }
            return container;
        }

        // Анимация
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
                let newPos = scrollPos - step; // двигаем влево
                // Бесконечное зацикливание: если ушли левее -originalSetWidth, перепрыгиваем
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
            // Бесконечная прокрутка: не ограничиваем, но для синхронизации прогресса потом нормализуем
            scrollPos = newPos;
            setPosition(scrollPos);
            updateProgressBar();
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
            track.style.transition = 'transform 0.3s ease';
            // Нормализуем позицию, чтобы не было огромных чисел
            let norm = normalizePosition(scrollPos);
            scrollPos = norm;
            setPosition(scrollPos);
            updateProgressBar();
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

        // Инициализация
        function init() {
            updateDimensions();
            // Стартовая позиция: второй набор оригиналов (сдвиг на -originalSetWidth)
            scrollPos = -originalSetWidth;
            setPosition(scrollPos);
            ensureProgressBar();
            updateProgressBar();
            startAnimation();

            track.addEventListener('mousedown', onMouseDown);
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);

            window.addEventListener('resize', () => {
                updateDimensions();
                // Нормализуем позицию после смены размеров
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
})();