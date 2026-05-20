// ========== ДОБАВЛЕНИЕ НОВЫХ БЛОКОВ ==========
import { TextBlock } from '../blocks/text-block.js';
import { PhotoBlock } from '../blocks/photo-block.js';
import { VideoBlock } from '../blocks/video-block.js';
import { CardBlock } from '../blocks/card-block.js';
import { ButtonBlock } from '../blocks/button-block.js';
import { DividerBlock } from '../blocks/divider-block.js';
import { saveToHistory } from '../core/history.js';
import { showToast } from '../core/utils.js';

export function addTextBlock(container) {
    const block = new TextBlock();
    block.create();
    if (container) container.appendChild(block.element);
    saveToHistory();
    return block;
}

export function addPhotoBlock(container, url) {
    if (!url) {
        url = prompt('📷 Введите прямую ссылку на изображение:');
        if (!url) return null;
    }
    const block = new PhotoBlock();
    block.create(url);
    if (container) container.appendChild(block.element);
    saveToHistory();
    showToast('✅ Фото добавлено');
    return block;
}

export function addVideoBlock(container, url) {
    if (!url) {
        url = prompt('🎬 Введите прямую ссылку на MP4 видео:');
        if (!url) return null;
    }
    const block = new VideoBlock();
    block.create(url);
    if (container) container.appendChild(block.element);
    saveToHistory();
    showToast('✅ Видео добавлено');
    return block;
}

export function addCardBlock(container) {
    const block = new CardBlock();
    block.create();
    if (container) container.appendChild(block.element);
    saveToHistory();
    return block;
}

export function addButtonBlock(container) {
    const block = new ButtonBlock();
    block.create();
    if (container) container.appendChild(block.element);
    saveToHistory();
    return block;
}

export function addDividerBlock(container) {
    const block = new DividerBlock();
    block.create();
    if (container) container.appendChild(block.element);
    saveToHistory();
    return block;
}