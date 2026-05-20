// ========== ФОТО ПО ССЫЛКЕ ==========
import { BaseBlock } from './base.js';
import { escapeHtml } from '../core/utils.js';

export class PhotoBlock extends BaseBlock {
    constructor() {
        super('photo', 'editor-photo-block');
    }

    create(imageUrl, caption = '📷 Двойной клик по тексту, чтобы изменить подпись') {
        const div = super.create();
        div.innerHTML = `
            <div class="photo-card-inner" style="text-align:center; padding:10px;">
                <img src="${escapeHtml(imageUrl)}" alt="Фото" style="max-width:100%; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <p class="photo-caption" style="font-size:12px; color:#888; margin-top:8px;">${escapeHtml(caption)}</p>
            </div>
        `;
        this.element = div;
        return div;
    }

    updateImage(url) {
        const img = this.element?.querySelector('img');
        if (img) {
            img.src = url;
            saveToHistory();
            showToast('✅ Фото обновлено');
        }
    }

    updateCaption(caption) {
        const captionEl = this.element?.querySelector('.photo-caption');
        if (captionEl) {
            captionEl.textContent = caption;
            saveToHistory();
        }
    }
}

// Импортируем saveToHistory и showToast
import { saveToHistory } from '../core/history.js';
import { showToast } from '../core/utils.js';