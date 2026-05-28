// ============================================================
// 04_certificates.js – Карусель сертификатов
// Режим:
// - Мышь НЕ на карусели: автопрокрутка (1 слайд / 5 сек), прогресс-бар.
// - Мышь НА карусели: автопрокрутка ОСТАНАВЛИВАЕТСЯ, можно перетаскивать мышью (drag to scroll),
//   или листать колёсиком, или нажимать на стрелки/точки.
// - Бесконечная (циклическая) прокрутка.
// - Плавный snap после драга.
// ============================================================
(function () {
    function initInfiniteCarousel(trackId, prevBtnClass, nextBtnClass, progressId, dotsId) {
        const track = document.getElementById(trackId);
        if (!track) return;

        let slides = Array.from(track.children);
        if (slides.length === 0) return;

        let currentIndex = 0;
        let slideWidth = 0;
        let autoTimer = null;
        let progressInterval = null;
        let isHovering = false;
        let isDragging = false;
        let startDragX = 0;
        let startScrollLeft = 0;
        let dragStartX = 0;
        let dragStartTime = 0;

        const autoDelay = 5000;        // 5 секунд между слайдами

        // Обновляем ширину слайда
        function updateSlideWidth() {
            slideWidth = slides[0]?.offsetWidth;
            if (slideWidth === 0) slideWidth = 200;
            track.style.transition = 'transform 0.3s ease';
        }

        // Устанавливаем позицию трека по индексу
        function updateCarousel() {
            const shift = -currentIndex * (slideWidth + 24);
            track.style.transform = `translateX(${shift}px)`;
            updateDots();
        }

        // Переключение на следующий/предыдущий слайд
        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        }

        // Обновление активной точки
        function updateDots() {
            const dotsContainer = document.getElementById(dotsId);
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
        }

        // Создание точек навигации
        function createDots() {
            const container = document.getElementById(dotsId);
            if (!container) return;
            container.innerHTML = '';
            for (let i = 0; i < slides.length; i++) {
                const dot = document.createElement('button');
                dot.className = 'dot';
                if (i === 0) dot.classList.add('active');
                dot.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);
                dot.setAttribute('type', 'button');
                dot.addEventListener('click', () => {
                    stopAutoScroll(true);
                    currentIndex = i;
                    updateCarousel();
                    // Если мышь не на карусели – возобновляем автопрокрутку
                    if (!isHovering) startAutoScroll();
                });
                container.appendChild(dot);
            }
        }

        // Управление прогресс-баром
        function resetProgressBar() {
            const progressBar = document.getElementById(progressId);
            if (progressBar) progressBar.style.width = '0%';
        }

        function stopProgressAnimation() {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }

        function startProgressAnimation() {
            if (!isHovering) {
                if (progressInterval) stopProgressAnimation();
                const progressBar = document.getElementById(progressId);
                if (!progressBar) return;
                resetProgressBar();
                const startTime = Date.now();
                progressInterval = setInterval(() => {
                    if (isHovering) {
                        // если мышь наехала – сбрасываем прогресс
                        resetProgressBar();
                        return;
                    }
                    const elapsed = Date.now() - startTime;
                    let percent = (elapsed / autoDelay) * 100;
                    if (percent >= 100) {
                        percent = 100;
                        stopProgressAnimation();
                    }
                    progressBar.style.width = `${percent}%`;
                }, 30);
            } else {
                resetProgressBar();
            }
        }

        // Остановка автопрокрутки
        function stopAutoScroll(resetProgress = true) {
            if (autoTimer) {
                clearTimeout(autoTimer);
                autoTimer = null;
            }
            stopProgressAnimation();
            if (resetProgress) resetProgressBar();
        }

        // Запуск автопрокрутки
        function startAutoScroll() {
            if (isHovering) return; // не запускаем, если мышь на карусели
            stopAutoScroll(true);
            autoTimer = setTimeout(() => {
                nextSlide();
                startProgressAnimation();
                autoTimer = null;
                startAutoScroll();
            }, autoDelay);
            startProgressAnimation();
        }

        // ========== Перетаскивание мышью (drag) ==========
        function onMouseDown(e) {
            if (e.button !== 0) return;
            isDragging = true;
            startDragX = e.clientX;
            dragStartX = e.clientX;
            dragStartTime = Date.now();
            track.style.transition = 'none'; // отключаем анимацию во время драга
            // Получаем текущее смещение из transform
            const transform = track.style.transform;
            const match = transform.match(/translateX\(([-\d.]+)px\)/);
            startScrollLeft = match ? parseFloat(match[1]) : 0;
            e.preventDefault();
            document.body.style.userSelect = 'none';
            // Останавливаем автопрокрутку, если она была
            if (!isHovering) stopAutoScroll(true);
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startDragX;
            let newScroll = startScrollLeft + dx;
            // Ограничения: нельзя уйти дальше первого и последнего слайда (для реалистичности)
            const maxScroll = 0;
            const minScroll = -(slides.length * (slideWidth + 24) - track.parentElement.clientWidth);
            newScroll = Math.min(maxScroll, Math.max(minScroll, newScroll));
            track.style.transform = `translateX(${newScroll}px)`;
            // Приблизительный индекс для динамического обновления точек
            const approxIndex = Math.round(-newScroll / (slideWidth + 24));
            currentIndex = Math.min(slides.length - 1, Math.max(0, approxIndex));
            updateDots();
        }

        function onMouseUp(e) {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
            track.style.transition = 'transform 0.3s ease';
            // Снап к ближайшему слайду
            const finalScroll = -currentIndex * (slideWidth + 24);
            track.style.transform = `translateX(${finalScroll}px)`;
            // Если мышь не на карусели и автопрокрутка была остановлена – возобновляем
            if (!isHovering) {
                startAutoScroll();
            }
        }

        // ========== Колёсико мыши ==========
        function onWheel(e) {
            if (!isHovering) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1 : -1;
            if (delta > 0) nextSlide();
            else prevSlide();
            // Останавливаем автопрокрутку при ручном взаимодействии
            if (!isHovering) stopAutoScroll(true);
            else stopAutoScroll(true);
            // Возобновляем автопрокрутку, если мышь НЕ на карусели
            if (!isHovering) startAutoScroll();
        }

        // ========== Обработчики кнопок ==========
        const prevBtn = document.querySelector(prevBtnClass);
        const nextBtn = document.querySelector(nextBtnClass);
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                stopAutoScroll(true);
                prevSlide();
                if (!isHovering) startAutoScroll();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                stopAutoScroll(true);
                nextSlide();
                if (!isHovering) startAutoScroll();
            });
        }

        // ========== Наведение мыши ==========
        const wrapper = track.closest('.carousel-wrapper');
        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => {
                isHovering = true;
                stopAutoScroll(true);   // останавливаем автопрокрутку
            });
            wrapper.addEventListener('mouseleave', () => {
                isHovering = false;
                startAutoScroll();      // возобновляем автопрокрутку
            });
        }

        // ========== Инициализация ==========
        function waitForImages() {
            const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);
            if (imgs.length === 0) return Promise.resolve();
            return Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            })));
        }

        waitForImages().then(() => {
            updateSlideWidth();
            createDots();
            updateCarousel();
            // Запускаем автопрокрутку только если не наведено (изначально не наведено)
            if (!isHovering) startAutoScroll();
        });

        window.addEventListener('resize', () => {
            updateSlideWidth();
            updateCarousel();
            if (!isHovering) {
                stopAutoScroll(true);
                startAutoScroll();
            } else {
                stopAutoScroll(true);
            }
        });

        // Добавляем слушатели для драга
        track.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        track.addEventListener('wheel', onWheel, { passive: false });

        // Cleanup (опционально)
        window._cleanupCarousel = function () {
            track.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            track.removeEventListener('wheel', onWheel);
            if (autoTimer) clearTimeout(autoTimer);
            if (progressInterval) clearInterval(progressInterval);
        };
    }

    window.initInfiniteCarousel = initInfiniteCarousel;
})();