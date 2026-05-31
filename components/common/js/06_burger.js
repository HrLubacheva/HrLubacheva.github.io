(function() {
    'use strict';

    // Дождались загрузки DOM
    document.addEventListener('DOMContentLoaded', function() {
        const burger = document.querySelector('.burger-menu');
        const navBottom = document.querySelector('.nav-bottom');
        const overlay = document.getElementById('menuOverlay');
        const body = document.body;

        // Если какого-то элемента нет — выходим
        if (!burger || !navBottom) return;

        // Функция открытия/закрытия
        function toggleMenu() {
            burger.classList.toggle('active');
            navBottom.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
            body.classList.toggle('menu-open');

            // Для доступности: говорим скринридерам, что меню открыто/закрыто
            const expanded = navBottom.classList.contains('open');
            burger.setAttribute('aria-expanded', expanded);
            if (expanded) {
                // Перемещаем фокус на первый пункт меню (опционально)
                const firstLink = navBottom.querySelector('.nav-links a');
                if (firstLink) firstLink.focus();
            }
        }

        // Закрытие по клику на оверлей
        if (overlay) {
            overlay.addEventListener('click', toggleMenu);
        }

        // Закрытие по кнопке ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navBottom.classList.contains('open')) {
                toggleMenu();
            }
        });

        // Закрытие при клике на любую ссылку в меню
        const navLinks = navBottom.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });

        // Открытие/закрытие по клику на бургер
        burger.addEventListener('click', toggleMenu);

        // При ресайзе окна, если ширина становится >768px и меню открыто — закрываем его (чтобы не было глюков)
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navBottom.classList.contains('open')) {
                toggleMenu();
            }
        });
    });
})();