// ========== ТЕКСТОВЫЙ БЛОК ==========
import { BaseBlock } from './base.js';
import { escapeHtml } from '../core/utils.js';

export class TextBlock extends BaseBlock {
    constructor() {
        super('text', 'editor-text-block');
    }

    create(content = '') {
        const div = super.create();
        div.innerHTML = `
            <div class="text-block-content" style="padding:20px; background:rgba(255,255,255,0.05); border-radius:16px;">
                ${content || '<p><strong>Новый текстовый блок</strong></p><p>Двойной клик для редактирования</p>'}
            </div>
        `;
        this.element = div;
        return div;
    }

    getContent() {
        const contentDiv = this.element?.querySelector('.text-block-content');
        return contentDiv ? contentDiv.innerHTML : '';
    }
}