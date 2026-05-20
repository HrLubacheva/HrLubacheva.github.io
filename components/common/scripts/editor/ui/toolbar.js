// ========== ГЛАВНАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { saveToGitHub } from '../actions/save.js';
import { unlockAllBlocks } from '../features/lock.js';
import { toggleSlidesPanel } from './panels.js';
import { TextBlock } from '../blocks/text-block.js';
import { PhotoBlock } from '../blocks/photo-block.js';
import { VideoBlock } from '../blocks/video-block.js';
import { CardBlock } from '../blocks/card-block.js';
import { ButtonBlock } from '../blocks/button-block.js';
import { DividerBlock } from '../blocks/divider-block.js';

let toolbar = null;
let modalOverlay = null;

// Стили для модального окна
function addModalStyles() {
    if (document.getElementById('editor-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'editor-modal-styles';
    styles.textContent = `
        .editor-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
        }
        .editor-modal {
            background: white;
            border-radius: 28px;
            padding: 32px;
            max-width: 520px;
            width: 90%;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            animation: modalSlideIn 0.2s ease;
        }
        @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .editor-modal h3 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 700;
        }
        .editor-modal .modal-desc {
            color: #666;
            margin-bottom: 24px;
            font-size: 14px;
        }
        .editor-modal .modal-fields {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .editor-modal .field-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .editor-modal .field-group label {
            font-weight: 600;
            font-size: 14px;
            color: #333;
        }
        .editor-modal input, 
        .editor-modal select, 
        .editor-modal textarea {
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 16px;
            font-size: 14px;
            font-family: inherit;
        }
        .editor-modal input:focus, 
        .editor-modal select:focus, 
        .editor-modal textarea:focus {
            outline: none;
            border-color: #2D6A9F;
            box-shadow: 0 0 0 3px rgba(45,106,159,0.1);
        }
        .editor-modal .size-row {
            display: flex;
            gap: 12px;
        }
        .editor-modal .size-row .field-group {
            flex: 1;
        }
        .editor-modal .modal-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 28px;
        }
        .editor-modal .btn-primary {
            background: #2D6A9F;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 40px;
            font-weight: 600;
            cursor: pointer;
        }
        .editor-modal .btn-primary:hover {
            background: #1D4D7A;
        }
        .editor-modal .btn-secondary {
            background: #f0f0f0;
            color: #333;
            border: none;
            padding: 12px 24px;
            border-radius: 40px;
            font-weight: 600;
            cursor: pointer;
        }
        .editor-modal .btn-secondary:hover {
            background: #e0e0e0;
        }
        .content-type-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .content-type-btn {
            flex: 1;
            padding: 12px;
            border: 2px solid #e0e0e0;
            background: white;
            border-radius: 16px;
            cursor: pointer;
            font-weight: 600;
        }
        .content-type-btn.active {
            border-color: #2D6A9F;
            background: #2D6A9F;
            color: white;
        }
    `;
    document.head.appendChild(styles);
}

// Создаём контейнер-блок
function createContainerBlock() {
    const container = document.createElement('div');
    container.className = 'editor-container-block editable-object';
    container.setAttribute('data-block-type', 'container');
    container.style.cssText = `
        background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
        border: 2px dashed #2D6A9F;
        border-radius: 24px;
        padding: 20px;
        margin: 20px 0;
        position: relative;
    `;

    const contentArea = document.createElement('div');
    contentArea.className = 'container-content';
    contentArea.style.cssText = `min-height: 100px; display: flex; align-items: center; justify-content: center;`;

    const placeholder = document.createElement('div');
    placeholder.className = 'container-placeholder';
    placeholder.style.cssText = `text-align: center; padding: 40px; color: #999; cursor: pointer;`;
    placeholder.innerHTML = `<div style="font-size: 48px; margin-bottom: 12px;">➕</div>
        <div style="font-size: 14px;">Нажмите, чтобы добавить контент</div>
        <div style="font-size: 12px; margin-top: 8px;">Текст | Фото | Видео</div>`;

    placeholder.onclick = () => showContentTypeModal(container, contentArea);
    contentArea.appendChild(placeholder);
    container.appendChild(contentArea);

    return { container, contentArea };
}

function showContentTypeModal(container, contentArea) {
    if (modalOverlay) modalOverlay.remove();
    addModalStyles();

    let selectedType = 'text';

    modalOverlay = document.createElement('div');
    modalOverlay.className = 'editor-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'editor-modal';
    modal.innerHTML = `
        <h3>📦 Добавить контент</h3>
        <div class="modal-desc">Выберите тип контента и настройте размеры</div>
        <div class="content-type-buttons">
            <button class="content-type-btn active" data-type="text">📝 Текст</button>
            <button class="content-type-btn" data-type="photo">🖼️ Фото</button>
            <button class="content-type-btn" data-type="video">🎬 Видео</button>
        </div>
        <div class="modal-fields">
            <div class="field-group" id="textFieldGroup">
                <label>📄 Текст</label>
                <textarea id="contentText" rows="4" placeholder="Введите текст..."></textarea>
            </div>
            <div class="field-group" id="urlFieldGroup" style="display:none;">
                <label>🔗 Ссылка на файл</label>
                <input type="text" id="contentUrl" placeholder="https://example.com/image.jpg">
            </div>
            <div class="size-row">
                <div class="field-group">
                    <label>📏 Ширина (px)</label>
                    <input type="number" id="contentWidth" placeholder="auto" value="400">
                </div>
                <div class="field-group">
                    <label>📏 Высота (px)</label>
                    <input type="number" id="contentHeight" placeholder="auto" value="300">
                </div>
            </div>
            <div class="field-group">
                <label>🎯 Выравнивание</label>
                <select id="contentAlign">
                    <option value="left">По левому краю</option>
                    <option value="center" selected>По центру</option>
                    <option value="right">По правому краю</option>
                </select>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="btn-secondary" id="cancelModalBtn">Отмена</button>
            <button class="btn-primary" id="confirmModalBtn">✅ Создать</button>
        </div>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    const typeBtns = modal.querySelectorAll('.content-type-btn');
    const textGroup = modal.querySelector('#textFieldGroup');
    const urlGroup = modal.querySelector('#urlFieldGroup');

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
            if (selectedType === 'text') {
                textGroup.style.display = 'block';
                urlGroup.style.display = 'none';
            } else {
                textGroup.style.display = 'none';
                urlGroup.style.display = 'block';
            }
        });
    });

    modal.querySelector('#cancelModalBtn').onclick = () => {
        modalOverlay.remove();
        modalOverlay = null;
    };

    modal.querySelector('#confirmModalBtn').onclick = () => {
        const width = modal.querySelector('#contentWidth').value;
        const height = modal.querySelector('#contentHeight').value;
        const align = modal.querySelector('#contentAlign').value;

        let contentElement = null;

        if (selectedType === 'text') {
            const text = modal.querySelector('#contentText').value || 'Новый текст';
            contentElement = document.createElement('div');
            contentElement.innerHTML = `<div style="padding:20px;"><p>${text.replace(/\n/g, '<br>')}</p></div>`;
        } else if (selectedType === 'photo') {
            const url = modal.querySelector('#contentUrl').value;
            if (!url) { showToast('❌ Введите ссылку на фото'); return; }
            contentElement = document.createElement('div');
            contentElement.innerHTML = `<img src="${url}" alt="Фото" style="max-width:100%; border-radius:16px;">`;
        } else if (selectedType === 'video') {
            const url = modal.querySelector('#contentUrl').value;
            if (!url) { showToast('❌ Введите ссылку на видео'); return; }
            contentElement = document.createElement('div');
            contentElement.innerHTML = `<video controls style="max-width:100%; border-radius:16px;"><source src="${url}" type="video/mp4"></video>`;
        }

        if (contentElement) {
            if (width && width !== 'auto') contentElement.style.width = width + 'px';
            if (height && height !== 'auto') contentElement.style.height = height + 'px';
            contentElement.style.textAlign = align;
            contentArea.innerHTML = '';
            contentArea.appendChild(contentElement);
        }

        modalOverlay.remove();
        modalOverlay = null;
        saveToHistory();
        showToast(`✅ Контент добавлен`);
    };
}

function insertSmartBlock(container) {
    if (!container) {
        container = document.querySelector('.container');
        if (!container) { showToast('❌ Не найден контейнер'); return; }
    }
    const { container: blockContainer } = createContainerBlock();
    container.appendChild(blockContainer);
    saveToHistory();
    showToast('📦 Новый блок создан. Нажмите на плюс, чтобы добавить контент');
    blockContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function createToolbar() {
    if (toolbar) return toolbar;
    addModalStyles();

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
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <div class="group-label">🎬 Презентация</div>
                    <div class="group-buttons">
                        <button id="powerpointModeBtn" class="tool-btn" style="background:#9C27B0; color:white;">🎞️ PowerPoint режим</button>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" data-tab="insert">
                <div class="toolbar-group">
                    <div class="group-label">📦 Умные блоки</div>
                    <div class="group-buttons">
                        <button id="insertSmartBlock" class="tool-btn" style="background:#2D6A9F; color:white;">✨ Умный блок</button>
                    </div>
                </div>
                <div class="toolbar-separator"></div>
                <div class="toolbar-group">
                    <div class="group-label">📝 Простые блоки</div>
                    <div class="group-buttons">
                        <button data-block="text" class="insert-block-btn">📄 Текстовый блок</button>
                        <button data-block="card" class="insert-block-btn">📇 Карточка</button>
                        <button data-block="button" class="insert-block-btn">🔘 Кнопка</button>
                        <button data-block="divider" class="insert-block-btn">➖ Разделитель</button>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" data-tab="settings">
                <div class="toolbar-group">
                    <div class="group-label">👁️ Вид</div>
                    <div class="group-buttons">
                        <label class="toggle-switch"><input type="checkbox" id="dragToggle"><span class="toggle-slider"></span><span>📌 Перетаскивание</span></label>
                        <label class="toggle-switch"><input type="checkbox" id="gridToggle"><span class="toggle-slider"></span><span>📐 Сетка</span></label>
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${tab}"]`).classList.add('active');
        });
    });

    document.getElementById('insertSmartBlock')?.addEventListener('click', () => insertSmartBlock());

    document.getElementById('powerpointModeBtn')?.addEventListener('click', () => {
        import('../features/slide-editor.js').then(m => {
            m.enableSlideEditMode();
        }).catch(err => {
            console.error('Ошибка загрузки slide-editor:', err);
            showToast('❌ Ошибка загрузки PowerPoint режима');
        });
    });

    document.querySelectorAll('.insert-block-btn').forEach(btn => {
        btn.addEventListener('click', () => insertSimpleBlock(btn.dataset.block));
    });

    document.getElementById('undoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.undo());
    });
    document.getElementById('redoBtn')?.addEventListener('click', () => {
        import('../core/history.js').then(m => m.redo());
    });
    document.getElementById('unlockAllBtn')?.addEventListener('click', unlockAllBlocks);
    document.getElementById('slidesPanelBtn')?.addEventListener('click', toggleSlidesPanel);
    document.getElementById('saveToGitBtn')?.addEventListener('click', () => saveToGitHub());
    document.getElementById('exitEditBtn')?.addEventListener('click', () => {
        import('../main.js').then(m => m.disableEditMode());
    });

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
}

function insertSimpleBlock(type) {
    const container = document.querySelector('.container');
    if (!container) return;

    let block;
    switch(type) {
        case 'text': block = new TextBlock(); block.create(); break;
        case 'card': block = new CardBlock(); block.create(); break;
        case 'button': block = new ButtonBlock(); block.create(); break;
        case 'divider': block = new DividerBlock(); block.create(); break;
        default: return;
    }

    if (block && block.element) {
        container.appendChild(block.element);
        saveToHistory();
        showToast(`✅ Блок добавлен`);
    }
}

export function hideToolbar() {
    if (toolbar) toolbar.remove();
    toolbar = null;
    if (modalOverlay) modalOverlay.remove();
    modalOverlay = null;
}