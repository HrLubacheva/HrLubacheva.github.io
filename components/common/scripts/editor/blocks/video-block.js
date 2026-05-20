// ========== ВИДЕО ПО ССЫЛКЕ (MP4) ==========
import { BaseBlock } from './base.js';
import { escapeHtml } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { showToast } from '../core/utils.js';

export class VideoBlock extends BaseBlock {
    constructor() {
        super('video', 'editor-video-block');
    }

    create(videoUrl, caption = '🎬 Двойной клик по тексту, чтобы изменить подпись') {
        const div = super.create();
        div.innerHTML = `
            <div class="video-card-inner" style="text-align:center; padding:10px;">
                <video controls style="max-width:100%; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <source src="${escapeHtml(videoUrl)}" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>
                <p class="video-caption" style="font-size:12px; color:#888; margin-top:8px;">${escapeHtml(caption)}</p>
            </div>
        `;
        this.element = div;
        return div;
    }

    updateVideo(url) {
        const source = this.element?.querySelector('source');
        if (source) {
            source.src = url;
            this.element.querySelector('video')?.load();
            saveToHistory();
            showToast('✅ Видео обновлено');
        }
    }

    updateCaption(caption) {
        const captionEl = this.element?.querySelector('.video-caption');
        if (captionEl) {
            captionEl.textContent = caption;
            saveToHistory();
        }
    }
}