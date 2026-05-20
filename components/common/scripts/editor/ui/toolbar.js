// ========== ГЛАВНАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { saveToGitHub } from '../actions/save.js';
import { unlockAllBlocks } from '../features/lock.js';
import { toggleSlidesPanel } from './panels.js';
import { showPropertyPanel, hidePropertyPanel } from './property-panel.js';
import { TextBlock } from '../blocks/text-block.js';
import { PhotoBlock } from '../blocks/photo-block.js';
import { VideoBlock } from '../blocks/video-block.js';
import { CardBlock } from '../blocks/card-block.js';
import { ButtonBlock } from '../blocks/button-block.js';
import { DividerBlock } from '../blocks/divider-block.js';

let toolbar = null;

export function createToolbar() {
    if (toolbar) return toolbar;

    toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `
        <div class="toolbar-container">
            <div class="toolbar-tabs">
                <button class="tab-btn active" data-tab="home">🏠 Главная</button>
                <button class="tab-btn" data-tab="insert">➕ Вставка</button>
                <button class="tab-btn" data-tab="settings">⚙️ Настройки</button>
                <button class="tab-btn" data-tab="help">❓ Помощь</button>
            </div>
            
            <!-- Главная вкладка -->
            <div class="tab-content active" data-tab="home">
                <div class="toolbar-group">
                    <div class="group-label">📋 История</div>
                    <div class="group-buttons">
                        <button id="undoBtn" class="tool-btn">↩️ Отменить</button>
                        <button id="redoBtn" class="tool-btn">↪️ Вернуть</button>
                    </div>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <div class="group-label">🔧 Действия</div>
                    <div class="group-buttons">
                        <button id="unlockAllBtn" class="tool-btn">🔓 Разблокировать всё</button>
                        <button id="slidesPanelBtn" class="tool-btn">📑 Слайды</button>
                    </div>
                </div>
            </div>
            
            <!-- Вставка вкладка -->
            <div class="tab-content" data-tab="insert">
                <div class="toolbar-group">
                    <div class="group-label">📝 Текст</div>
                    <div class="group-buttons">
                        <button data-block="text" class="insert-block-btn">📄 Текстовый блок</button>
                    </div>
                </div>
                <div class="toolbar-group">
                    <div class="group-label">🖼️ Медиа</div>
                    <div class="group-buttons">
                        <button data-block="photo" class="insert-block-btn">📷 Фото по ссылке</button>
                        <button data-block="video" class="insert-block-btn">🎬 Видео (MP4)</button>
                    </div>
                </div>
                <div class="toolbar-group">
                    <div class="group-label">📦 Элементы</div>
                    <div class="group-buttons">
                        <button data-block="card" class="insert-block-btn">📇 Карточка</button>
                        <button data-block="button" class="insert-block-btn">🔘 Кнопка</button>
                        <button data-block="divider" class="insert-block-btn">➖ Разделитель</button>
                    </div>
                </div>
            </div>
            
            <!-- Настройки вкладка -->
            <div class="tab-content" data-tab="settings">
                <div class="toolbar-group">
                    <div class="group-label">👁️ Вид</div>
                    <div class="group-buttons">
                        <label class="toggle-switch">
                            <input type="checkbox" id="dragToggle">
                            <span class="toggle-slider"></span>
                            <span>📌 Перетаскивание</span>
                        </label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="gridToggle">
                            <span class="toggle-slider"></span>
                            <span>📐 Сетка</span>
                        </label>
                    </div>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <div class="group-label">💾 Сохранение</div>
                    <div class="group-buttons">
                        <button id="saveToGitBtn" class="action-btn save-btn">💾 Сохранить на GitHub</button>
                    </div>
                </div>
            </div>
            
            <!-- Помощь вкладка -->
            <div class="tab-content" data-tab="help">
                <div class="toolbar-group">
                    <div class="group-label">⌨️ Горячие клавиши</div>
                    <div class="shortcuts-list">
                        <div><kbd>Ctrl+Z</kbd> — Отменить</div>
                        <div><kbd>Ctrl+Y</kbd> — Вернуть</div>
                        <div><kbd>Delete</kbd> — Удалить блок</div>
                        <div><kbd>Ctrl+D</kbd> — Дублировать</div>
                    </div>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <div class="group-label">📌 Советы</div>
                    <ul class="tips-list">
                        <li>✏️ <strong>Двойной клик</strong> по тексту — редактирование</li>
                        <li>🖼️ <strong>ПКМ по фото</strong> — изменить форму/заменить</li>
                        <li>🔒 <strong>Замок</strong> — блокировка блока</li>
                        <li>📐 <strong>Панель свойств</strong> — меняйте размеры и отступы</li>
                    </ul>
                </div>
            </div>
            
            <div class="toolbar-actions">
                <button id="exitEditBtn" class="exit-btn">🚪 Выйти</button>
            </div>
        </div>
    `;

    document.body.appendChild(toolbar);
    attachEvents();
    return toolbar;
}

function attachEvents() {
    // Вкладки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${tab}"]`).classList.add('active');
        });
    });

    // Вставка блоков
    document.querySelectorAll('.insert-block-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.block;
            insertBlock(type);
        });
    });

    // Отмена/Возврат
    document.getElementById('undoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.undo());
    });
    document.getElementById('redoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.redo());
    });

    // Разблокировать всё
    document.getElementById('unlockAllBtn')?.addEventListener('click', unlockAllBlocks);

    // Панель слайдов
    document.getElementById('slidesPanelBtn')?.addEventListener('click', toggleSlidesPanel);

    // Перетаскивание
    document.getElementById('dragToggle')?.addEventListener('change', (e) => {
        state.dragEnabled = e.target.checked;
        showToast(state.dragEnabled ? '📌 Перетаскивание включено' : '📌 Перетаскивание выключено');
    });

    // Сетка
    let gridOverlay = null;
    document.getElementById('gridToggle')?.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (!gridOverlay) {
                gridOverlay = document.createElement('div');
                gridOverlay.className = 'editor-grid-overlay';
                document.body.appendChild(gridOverlay);
            }
            gridOverlay.style.display = 'block';
        } else if (gridOverlay) {
            gridOverlay.style.display = 'none';
        }
    });

    // Сохранение
    document.getElementById('saveToGitBtn')?.addEventListener('click', () => saveToGitHub());

    // Выход
    document.getElementById('exitEditBtn')?.addEventListener('click', () => {
        import('../main.js').then(m => m.disableEditMode());
    });
}

function insertBlock(type) {
    const container = document.querySelector('.container');
    if (!container) return;

    let block;
    switch(type) {
        case 'text':
            block = new TextBlock();
            block.create();
            break;
        case 'photo':
            const url = prompt('📷 Введите прямую ссылку на изображение:');
            if (!url) return;
            block = new PhotoBlock();
            block.create(url);
            break;
        case 'video':
            const videoUrl = prompt('🎬 Введите прямую ссылку на MP4 видео:');
            if (!videoUrl) return;
            block = new VideoBlock();
            block.create(videoUrl);
            break;
        case 'card':
            block = new CardBlock();
            block.create();
            break;
        case 'button':
            block = new ButtonBlock();
            block.create();
            break;
        case 'divider':
            block = new DividerBlock();
            block.create();
            break;
        default:
            return;
    }

    if (block && block.element) {
        container.appendChild(block.element);
        saveToHistory();
        showToast(`✅ Блок "${type}" добавлен`);
    }
}

export function hideToolbar() {
    if (toolbar) toolbar.remove();
    toolbar = null;
}