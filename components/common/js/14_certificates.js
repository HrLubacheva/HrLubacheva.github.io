(function() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    let slides = [];
    let currentIndex = 0;
    let slideWidth = 0;
    let gap = 0;
    let autoInterval = null;
    const autoDelay = 4000;

    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    // Функция обновления размеров и позиции
    function updateDimensionsAndPosition() {
        if (!slides.length) return;
        // Получаем ширину первого слайда
        slideWidth = slides[0].offsetWidth;
        // Получаем gap из CSS (значение между слайдами)
        const trackStyle = getComputedStyle(track);
        gap = parseFloat(trackStyle.gap) || 24;
        // Обновляем позицию
        updateCarousel();
    }

    function updateCarousel() {
        const shift = -currentIndex * (slideWidth + gap);
        track.style.transform = `translateX(${shift}px)`;
        updateDots();
    }

    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentIndex);
        });
    }

    function createDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < slides.length; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === currentIndex) dot.classList.add('active');
            dot.addEventListener('click', () => {
                stopAutoScroll();
                currentIndex = i;
                updateCarousel();
                startAutoScroll();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function nextSlide() {
        if (slides.length === 0) return;
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    }
    function prevSlide() {
        if (slides.length === 0) return;
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    }

    function startAutoScroll() {
        if (autoInterval) clearInterval(autoInterval);
        autoInterval = setInterval(nextSlide, autoDelay);
    }
    function stopAutoScroll() {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
        }
    }

    // Обработчики кнопок
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoScroll();
            prevSlide();
            startAutoScroll();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoScroll();
            nextSlide();
            startAutoScroll();
        });
    }

    // Остановка автопрокрутки при наведении
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', stopAutoScroll);
        carouselWrapper.addEventListener('mouseleave', startAutoScroll);
    }

    // Пересчёт при ресайзе
    window.addEventListener('resize', () => {
        updateDimensionsAndPosition();
    });

    // Лайтбокс
    function initLightbox() {
        const lightbox = document.getElementById('certLightbox');
        if (!lightbox) return;
        const lightboxImg = document.getElementById('certLightboxImg');
        const lightboxCaption = document.getElementById('certLightboxCaption');
        const closeBtn = document.querySelector('.cert-lightbox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
                if (lightboxCaption) lightboxCaption.innerHTML = '';
            });
        }
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
                if (lightboxCaption) lightboxCaption.innerHTML = '';
            }
        });
        slides.forEach(slide => {
            const img = slide.querySelector('img');
            if (!img) return;
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                const fullSrc = img.getAttribute('data-full') || img.src;
                lightboxImg.src = fullSrc;
                const altText = img.getAttribute('alt') || '';
                if (lightboxCaption) lightboxCaption.innerHTML = altText;
                lightbox.style.display = 'flex';
            });
        });
    }

    // Ждём загрузки всех изображений, чтобы правильно вычислить ширину
    function waitForImages() {
        const imgs = Array.from(track.querySelectorAll('img'));
        if (imgs.length === 0) return Promise.resolve();
        const promises = imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve);
            });
        });
        return Promise.all(promises);
    }

    // Основная инициализация
    function init() {
        slides = Array.from(track.children);
        if (slides.length === 0) return;
        waitForImages().then(() => {
            updateDimensionsAndPosition();
            createDots();
            initLightbox();
            startAutoScroll();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();