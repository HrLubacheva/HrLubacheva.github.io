// ========== КНОПКА ==========
import { BaseBlock } from './base.js';
import { escapeHtml } from '../core/utils.js';

export class ButtonBlock extends BaseBlock {
    constructor() {
        super('button', 'editor-button-block');
    }

    create(text = '🔘 Новая кнопка', link = '#') {
        const div = super.create();
        div.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <a href="${escapeHtml(link)}" class="btn-primary" style="display:inline-block; text-decoration:none;">${escapeHtml(text)}</a>
            </div>
        `;
        this.element = div;
        return div;
    }

    updateText(text) {
        const btn = this.element?.querySelector('a');
        if (btn) {
            btn.textContent = text;
            saveToHistory();
        }
    }

    updateLink(link) {
        const btn = this.element?.querySelector('a');
        if (btn) {
            btn.href = link;
            saveToHistory();
        }
    }
}

import { saveToHistory } from '../core/history.js';