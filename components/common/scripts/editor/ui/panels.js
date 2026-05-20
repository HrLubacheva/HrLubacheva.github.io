// ========== БОКОВЫЕ ПАНЕЛИ (СЛАЙДЫ И ГРУППЫ) ==========
import { state } from '../core/state.js';
import { showToast, escapeHtml } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { selectElement } from '../features/selection.js';

let slidesPanel = null;

export function createSlidesPanel() {
    if (slidesPanel) return;

    slidesPanel = document.createElement('div');
    slidesPanel.className = 'slides-panel';
    slidesPanel.innerHTML = `
        <div class="slides-panel-header">
            <span>📑 Слайды (секции)</span>
            <div>
                <button id="minimizeSlidesBtn" title="Свернуть">◀</button>
                <button id="closeSlidesPanelBtn" title="Закрыть">✕</button>
            </div>
        </div>
        <div class="slides-list" id="slidesList"></div>
        <div class="slides-panel-footer">
            <small>💡 Используйте ▲▼ для перемещения секций</small>
        </div>
    `;
    document.body.appendChild(slidesPanel);

    document.getElementById('minimizeSlidesBtn')?.addEventListener('click', () => {
        slidesPanel.classList.toggle('minimized');
        const btn = document.getElementById('minimizeSlidesBtn');
        if (btn) btn.textContent = slidesPanel.classList.contains('minimized') ? '▶' : '◀';
    });

    document.getElementById('closeSlidesPanelBtn')?.addEventListener('click', () => {
        slidesPanel.classList.remove('show');
    });

    renderSlidesList();
}

export function renderSlidesList() {
    const slidesList = document.getElementById('slidesList');
    if (!slidesList) return;

    const sections = getSections();
    slidesList.innerHTML = '';

    sections.forEach((section, index) => {
        const titleEl = section.querySelector('h1, h2, h3');
        const title = titleEl ? titleEl.textContent.slice(0, 40) : `Секция ${index + 1}`;
        const img = section.querySelector('img');
        const previewHtml = img ? `<img src="${img.src}" style="width:100%;height:100%;object-fit:cover;">` : '📄';

        const tile = document.createElement('div');
        tile.className = 'slide-tile';
        tile.innerHTML = `
            <div class="slide-number">${index + 1}</div>
            <div class="slide-preview">${previewHtml}</div>
            <div class="slide-info">
                <div class="slide-title">${escapeHtml(title)}</div>
                <div class="slide-subtitle">секция ${index + 1} из ${sections.length}</div>
            </div>
            <div class="slide-actions">
                <button class="slide-up" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="slide-down" ${index === sections.length - 1 ? 'disabled' : ''}>▼</button>
                <button class="slide-edit">✏️</button>
                <button class="slide-delete">🗑️</button>
            </div>
        `;

        tile.querySelector('.slide-up')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (index > 0) moveSection(index, index - 1);
        });

        tile.querySelector('.slide-down')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (index < sections.length - 1) moveSection(index, index + 1);
        });

        tile.querySelector('.slide-edit')?.addEventListener('click', (e) => {
            e.stopPropagation();
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            selectElement(section);
        });

        tile.querySelector('.slide-delete')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Удалить секцию "${title}"?`)) {
                section.remove();
                renderSlidesList();
                saveToHistory();
                showToast('✅ Секция удалена');
            }
        });

        tile.addEventListener('click', () => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            selectElement(section);
            document.querySelectorAll('.slide-tile').forEach(t => t.classList.remove('selected-slide'));
            tile.classList.add('selected-slide');
        });

        slidesList.appendChild(tile);
    });
}

function getSections() {
    const sections = [];
    document.querySelectorAll('section').forEach(section => {
        if (!section.hasAttribute('data-protected')) {
            sections.push(section);
        }
    });
    return sections;
}

function moveSection(from, to) {
    const sections = getSections();
    if (from < 0 || from >= sections.length) return;
    if (to < 0 || to >= sections.length) return;

    const fromSection = sections[from];
    const toSection = sections[to];

    if (from < to) {
        toSection.parentNode.insertBefore(fromSection, toSection.nextSibling);
    } else {
        toSection.parentNode.insertBefore(fromSection, toSection);
    }

    renderSlidesList();
    saveToHistory();
    showToast('✅ Секция перемещена');
}

export function toggleSlidesPanel() {
    if (!slidesPanel) createSlidesPanel();
    slidesPanel.classList.toggle('show');
    if (slidesPanel.classList.contains('show')) {
        renderSlidesList();
    }
}