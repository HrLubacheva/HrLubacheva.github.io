// ========== ПАНЕЛЬ СЛАЙДОВ ==========
import { state } from './state.js';
import { escapeHtml, showToast } from './utils.js';

export function getSections() {
    const sections = [];
    document.querySelectorAll('section').forEach(section => {
        if (section.id === 'quiz') return;
        const title = section.querySelector('h2, h3, h1')?.innerText?.slice(0, 40) || 'Секция';
        const img = section.querySelector('img');
        const preview = img?.src ? { type: 'img', src: img.src } : { type: 'text', text: '📄' };
        sections.push({ element: section, title, preview, id: section.id || `section_${sections.length}` });
    });
    return sections;
}

export function renderSlidesList(selectElementCallback) {
    const slidesList = document.getElementById('slidesList');
    if (!slidesList) return;

    const sections = getSections();
    slidesList.innerHTML = '';

    sections.forEach((section, index) => {
        const tile = document.createElement('div');
        tile.className = 'slide-tile';
        const previewHtml = section.preview.type === 'img' ? `<img src="${section.preview.src}" onerror="this.parentElement.innerHTML='📄'">` : section.preview.text;
        tile.innerHTML = `
            <div class="slide-number">${index + 1}</div>
            <div class="slide-preview">${previewHtml}</div>
            <div class="slide-info">
                <div class="slide-title">${escapeHtml(section.title)}</div>
                <div class="slide-subtitle">секция ${index + 1}</div>
            </div>
            <div class="slide-actions">
                <button class="slide-edit-btn">✏️</button>
                <button class="slide-delete-btn">🗑</button>
            </div>
        `;

        tile.addEventListener('click', (e) => {
            if (e.target.closest('.slide-actions')) return;
            section.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (selectElementCallback) selectElementCallback(section.element);
            document.querySelectorAll('.slide-tile').forEach(t => t.classList.remove('selected-slide'));
            tile.classList.add('selected-slide');
        });

        tile.querySelector('.slide-edit-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            section.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (selectElementCallback) selectElementCallback(section.element);
        });

        tile.querySelector('.slide-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Удалить секцию "${section.title}"?`)) {
                section.element.remove();
                renderSlidesList(selectElementCallback);
                showToast('✅ Секция удалена');
            }
        });

        slidesList.appendChild(tile);
    });
}

export function createSlidesPanel(selectElementCallback) {
    if (state.slidesPanel) return;

    state.slidesPanel = document.createElement('div');
    state.slidesPanel.className = 'slides-panel';
    state.slidesPanel.innerHTML = `
        <div class="slides-panel-header">
            <span>📑 Слайды</span>
            <div>
                <button id="minimizeSlidesBtn">◀</button>
                <button id="closeSlidesPanelBtn">✕</button>
            </div>
        </div>
        <div class="slides-list" id="slidesList"></div>
    `;
    document.body.appendChild(state.slidesPanel);

    document.getElementById('minimizeSlidesBtn')?.addEventListener('click', () => {
        state.slidesPanelMinimized = !state.slidesPanelMinimized;
        state.slidesPanel.classList.toggle('minimized', state.slidesPanelMinimized);
        document.getElementById('minimizeSlidesBtn').textContent = state.slidesPanelMinimized ? '▶' : '◀';
        if (!state.slidesPanelMinimized) renderSlidesList(selectElementCallback);
    });

    document.getElementById('closeSlidesPanelBtn')?.addEventListener('click', () => {
        state.slidesPanel.classList.remove('show');
    });

    renderSlidesList(selectElementCallback);
}

export function toggleSlidesPanel(selectElementCallback) {
    if (!state.slidesPanel) createSlidesPanel(selectElementCallback);
    state.slidesPanel.classList.toggle('show');
    if (state.slidesPanel.classList.contains('show')) {
        renderSlidesList(selectElementCallback);
    }
}