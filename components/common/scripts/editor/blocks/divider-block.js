// ========== РАЗДЕЛИТЕЛЬ ==========
import { BaseBlock } from './base.js';

export class DividerBlock extends BaseBlock {
    constructor() {
        super('divider', 'editor-divider-block');
    }

    create() {
        const div = super.create();
        div.innerHTML = '<hr style="margin:20px 0; border:none; height:2px; background:linear-gradient(90deg, transparent, #ddd, transparent);">';
        this.element = div;
        return div;
    }
}