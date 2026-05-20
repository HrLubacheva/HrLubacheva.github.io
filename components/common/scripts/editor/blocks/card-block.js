// ========== УНИВЕРСАЛЬНАЯ КАРТОЧКА ==========
import { BaseBlock } from './base.js';
import { escapeHtml } from '../core/utils.js';

export class CardBlock extends BaseBlock {
    constructor() {
        super('card', 'editor-card-block');
    }

    create(title = 'Новая карточка', content = 'Описание карточки. Двойной клик для редактирования.') {
        const div = super.create();
        div.innerHTML = `
            <div style="padding:24px; background:white; border-radius:20px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(content)}</p>
            </div>
        `;
        this.element = div;
        return div;
    }
}