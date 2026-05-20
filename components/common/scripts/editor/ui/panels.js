import { showToast, escapeHtml } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';

let slidesPanel = null;

export function createSlidesPanel() {
    if (slidesPanel) return;

    slidesPanel = document.createElement('div');
    slidesPanel.className = 'slides-panel';
    slidesPanel.innerHTML = `
        <div class="slides-panel-header">
            <span>📑 Слайды (секции)</span>
            <button id="closeSlidesPanelBtn">✕</button>
        </div>
        <div class="slides-list" id="slidesList"></div>
    `;
    document.body.appendChild(slidesPanel);

    document.getElementById('closeSlidesPanelBtn')?.addEventListener('click', () => {
        slidesPanel.classList.remove('show');
    });

    renderSlidesList();
}

export function renderSlidesList() {
    const slidesList = document.getElementById('slidesList');
    if (!slidesList) return;

    const sections = document.querySelectorAll('section');
    slidesList.innerHTML = '';

    sections.forEach((section, index) => {
        const titleEl = section.querySelector('h1, h2, h3');
        const title = titleEl ? titleEl.textContent.slice(0, 40) : `Секция ${index + 1}`;
        const tile = document.createElement('div');
        tile.className = 'slide-tile';
        tile.innerHTML = `
            <div class="slide-number">${index + 1}</div>
            <div class="slide-info">
                <div class="slide-title">${escapeHtml(title)}</div>
            </div>
            <button class="slide-edit">✏️</button>
        `;
        tile.querySelector('.slide-edit')?.addEventListener('click', () => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        slidesList.appendChild(tile);
    });
}

export function toggleSlidesPanel() {
    if (!slidesPanel) createSlidesPanel();
    slidesPanel.classList.toggle('show');
    if (slidesPanel.classList.contains('show')) {
        renderSlidesList();
    }
}