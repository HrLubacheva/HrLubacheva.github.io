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
    document.getElementById('closeSlidesPanelBtn')?.addEventListener('click', () => slidesPanel.classList.remove('show'));
    renderSlidesList();
}

export function renderSlidesList() {
    const list = document.getElementById('slidesList');
    if (!list) return;
    const sections = Array.from(document.querySelectorAll('section')).filter(s => !s.hasAttribute('data-protected'));
    list.innerHTML = '';
    sections.forEach((sec, idx) => {
        const titleEl = sec.querySelector('h1, h2, h3');
        const title = titleEl ? titleEl.textContent.slice(0,40) : `Секция ${idx+1}`;
        const tile = document.createElement('div');
        tile.className = 'slide-tile';
        tile.innerHTML = `
            <div class="slide-number">${idx+1}</div>
            <div class="slide-info"><div class="slide-title">${escapeHtml(title)}</div></div>
            <div class="slide-actions">
                <button class="slide-up" ${idx===0 ? 'disabled' : ''} title="Выше">▲</button>
                <button class="slide-down" ${idx===sections.length-1 ? 'disabled' : ''} title="Ниже">▼</button>
                <button class="slide-edit" title="Прокрутить">✏️</button>
            </div>
        `;
        tile.querySelector('.slide-up')?.addEventListener('click', (e) => { e.stopPropagation(); if(idx>0) moveSection(idx, idx-1); });
        tile.querySelector('.slide-down')?.addEventListener('click', (e) => { e.stopPropagation(); if(idx<sections.length-1) moveSection(idx, idx+1); });
        tile.querySelector('.slide-edit')?.addEventListener('click', (e) => { e.stopPropagation(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        list.appendChild(tile);
    });
}

function moveSection(from, to) {
    const sections = Array.from(document.querySelectorAll('section')).filter(s => !s.hasAttribute('data-protected'));
    if (from<0 || from>=sections.length || to<0 || to>=sections.length) return;
    const fromSec = sections[from], toSec = sections[to];
    const parent = fromSec.parentNode;
    parent.insertBefore(fromSec, from < to ? toSec.nextSibling : toSec);
    renderSlidesList();
    saveToHistory();
    showToast('✅ Секция перемещена');
}

export function toggleSlidesPanel() {
    if (!slidesPanel) createSlidesPanel();
    slidesPanel.classList.toggle('show');
    if (slidesPanel.classList.contains('show')) renderSlidesList();
}