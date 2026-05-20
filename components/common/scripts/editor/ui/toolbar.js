// ========== ГЛАВНАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ ==========
import { state } from '../core/state.js';
import { showToast } from '../core/utils.js';
import { saveToHistory } from '../core/history.js';
import { saveToGitHub } from '../actions/save.js';
import { unlockAllBlocks } from '../features/lock.js';
import { toggleSlidesPanel } from './panels.js';
import { selectElement } from '../features/selection.js';
import { TextBlock } from '../blocks/text-block.js';
import { PhotoBlock } from '../blocks/photo-block.js';
import { VideoBlock } from '../blocks/video-block.js';
import { CardBlock } from '../blocks/card-block.js';
import { ButtonBlock } from '../blocks/button-block.js';
import { DividerBlock } from '../blocks/divider-block.js';

let toolbar = null;
let modalOverlay = null;
let currentContainer = null;

// Стили для модального окна (добавляем один раз)
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
            transition: border 0.2s;
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
            transition: background 0.2s;
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
            transition: background 0.2s;
        }
        .editor-modal .btn-secondary:hover {
            background: #e0e0e0;
        }
        .editor-modal .preview-area {
            background: #f5f5f5;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            margin-top: 16px;
        }
        .editor-modal .preview-area img,
        .editor-modal .preview-area video {
            max-width: 100%;
            max-height: 150px;
            border-radius: 12px;
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
            transition: all 0.2s;
        }
        .content-type-btn.active {
            border-color: #2D6A9F;
            background: #2D6A9F;
            color: white;
        }
        .content-type-btn[data-type="text"]:hover { border-color: #2D6A9F; }
        .content-type-btn[data-type="photo"]:hover { border-color: #2D6A9F; }
        .content-type-btn[data-type="video"]:hover { border-color: #2D6A9F; }
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
        transition: all 0.2s;
    `;

    // Внутренний контент
    const contentArea = document.createElement('div');
    contentArea.className = 'container-content';
    contentArea.style.cssText = `
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Кнопка выбора типа контента
    const placeholder = document.createElement('div');
    placeholder.className = 'container-placeholder';
    placeholder.style.cssText = `
        text-align: center;
        padding: 40px;
        color: #999;
        cursor: pointer;
    `;
    placeholder.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 12px;">➕</div>
        <div style="font-size: 14px;">Нажмите, чтобы добавить контент</div>
        <div style="font-size: 12px; margin-top: 8px;">Текст | Фото | Видео</div>
    `;

    placeholder.onclick = () => showContentTypeModal(container, contentArea);

    contentArea.appendChild(placeholder);
    container.appendChild(contentArea);

    return { container, contentArea };
}

// Модалка выбора типа контента для существующего контейнера
function showContentTypeModal(container, contentArea) {
    // Удаляем старую модалку
    if (modalOverlay) modalOverlay.remove();

    addModalStyles();

    let selectedType = 'text';
    let urlInputHtml = '';

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
        
        <div class="modal-fields" id="dynamicFields">
            <!-- Текстовое поле -->
            <div class="field-group" id="textFieldGroup">
                <label>📄 Текст</label>
                <textarea id="contentText" rows="4" placeholder="Введите текст..."></textarea>
            </div>
            
            <!-- URL поле (изначально скрыто) -->
            <div class="field-group" id="urlFieldGroup" style="display:none;">
                <label>🔗 Ссылка на файл</label>
                <input type="text" id="contentUrl" placeholder="https://example.com/image.jpg  или  video.mp4">
            </div>
            
            <!-- Настройки размеров -->
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
            
            <div id="previewArea" class="preview-area" style="display:none;">
                <div id="previewContent"></div>
            </div>
        </div>
        
        <div class="modal-buttons">
            <button class="btn-secondary" id="cancelModalBtn">Отмена</button>
            <button class="btn-primary" id="confirmModalBtn">✅ Создать</button>
        </div>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Переключение между типами
    const typeBtns = modal.querySelectorAll('.content-type-btn');
    const textGroup = modal.querySelector('#textFieldGroup');
    const urlGroup = modal.querySelector('#urlFieldGroup');
    const previewArea = modal.querySelector('#previewArea');
    const previewContent = modal.querySelector('#previewContent');
    const urlInput = modal.querySelector('#contentUrl');
    const textArea = modal.querySelector('#contentText');
    const widthInput = modal.querySelector('#contentWidth');
    const heightInput = modal.querySelector('#contentHeight');
    const alignSelect = modal.querySelector('#contentAlign');

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;

            if (selectedType === 'text') {
                textGroup.style.display = 'block';
                urlGroup.style.display = 'none';
                previewArea.style.display = 'none';
            } else {
                textGroup.style.display = 'none';
                urlGroup.style.display = 'block';
                previewArea.style.display = 'block';
                updatePreview(selectedType, urlInput.value);
            }
        });
    });

    // Предпросмотр для фото/видео
    urlInput.addEventListener('input', () => {
        updatePreview(selectedType, urlInput.value);
    });

    function updatePreview(type, url) {
        if (!url) {
            previewContent.innerHTML = '<div style="color:#999;">Введите ссылку для предпросмотра</div>';
            return;
        }

        if (type === 'photo') {
            previewContent.innerHTML = `<img src="${url}" onerror="this.style.display='none'; this.parentElement.innerHTML='❌ Ошибка загрузки фото'">`;
        } else if (type === 'video') {
            previewContent.innerHTML = `<video controls style="max-width:100%; max-height:150px;"><source src="${url}" type="video/mp4">Не поддерживается</video>`;
        }
    }

    // Отмена
    modal.querySelector('#cancelModalBtn').onclick = () => {
        modalOverlay.remove();
        modalOverlay = null;
    };

    // Подтверждение
    modal.querySelector('#confirmModalBtn').onclick = () => {
        const width = widthInput.value;
        const height = heightInput.value;
        const align = alignSelect.value;

        let contentElement = null;

        if (selectedType === 'text') {
            const text = textArea.value || 'Новый текст';
            contentElement = document.createElement('div');
            contentElement.className = 'editor-text-content';
            contentElement.innerHTML = `<div style="padding:20px;"><p>${text.replace(/\n/g, '<br>')}</p></div>`;
        }
        else if (selectedType === 'photo') {
            const url = urlInput.value;
            if (!url) {
                showToast('❌ Введите ссылку на фото');
                return;
            }
            contentElement = document.createElement('div');
            contentElement.className = 'editor-photo-content';
            contentElement.innerHTML = `<img src="${url}" alt="Фото" style="max-width:100%; border-radius:16px;">`;
        }
        else if (selectedType === 'video') {
            const url = urlInput.value;
            if (!url) {
                showToast('❌ Введите ссылку на видео');
                return;
            }
            contentElement = document.createElement('div');
            contentElement.className = 'editor-video-content';
            contentElement.innerHTML = `<video controls style="max-width:100%; border-radius:16px;"><source src="${url}" type="video/mp4">Не поддерживается</video>`;
        }

        if (contentElement) {
            // Применяем размеры
            if (width && width !== 'auto') contentElement.style.width = width + 'px';
            if (height && height !== 'auto') contentElement.style.height = height + 'px';
            contentElement.style.textAlign = align;

            // Очищаем и добавляем контент
            contentArea.innerHTML = '';
            contentArea.appendChild(contentElement);

            // Добавляем кнопку редактирования
            addEditButton(container, contentArea, contentElement, selectedType);
        }

        modalOverlay.remove();
        modalOverlay = null;
        saveToHistory();
        showToast(`✅ ${selectedType === 'text' ? 'Текст' : selectedType === 'photo' ? 'Фото' : 'Видео'} добавлено`);
    };
}

// Кнопка редактирования контента
function addEditButton(container, contentArea, contentElement, contentType) {
    const editBtn = document.createElement('button');
    editBtn.className = 'content-edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Редактировать контент';
    editBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        background: #2D6A9F;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s;
    `;
    editBtn.onmouseenter = () => editBtn.style.transform = 'scale(1.05)';
    editBtn.onmouseleave = () => editBtn.style.transform = 'scale(1)';

    editBtn.onclick = (e) => {
        e.stopPropagation();
        showEditModal(container, contentArea, contentElement, contentType);
    };

    container.appendChild(editBtn);
}

// Модалка редактирования существующего контента
function showEditModal(container, contentArea, contentElement, contentType) {
    if (modalOverlay) modalOverlay.remove();

    addModalStyles();

    let currentContent = '';
    let currentUrl = '';

    if (contentType === 'text') {
        const textDiv = contentElement.querySelector('div');
        currentContent = textDiv ? textDiv.innerText : '';
    } else if (contentType === 'photo') {
        const img = contentElement.querySelector('img');
        currentUrl = img ? img.src : '';
    } else if (contentType === 'video') {
        const source = contentElement.querySelector('source');
        currentUrl = source ? source.src : '';
    }

    modalOverlay = document.createElement('div');
    modalOverlay.className = 'editor-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'editor-modal';

    modal.innerHTML = `
        <h3>✏️ Редактировать ${contentType === 'text' ? 'текст' : contentType === 'photo' ? 'фото' : 'видео'}</h3>
        
        <div class="modal-fields">
            ${contentType === 'text' ? `
                <div class="field-group">
                    <label>📄 Текст</label>
                    <textarea id="editText" rows="5">${currentContent}</textarea>
                </div>
            ` : `
                <div class="field-group">
                    <label>🔗 Ссылка на файл</label>
                    <input type="text" id="editUrl" value="${currentUrl}" placeholder="https://...">
                </div>
                <div class="preview-area" id="editPreview"></div>
            `}
            
            <div class="size-row">
                <div class="field-group">
                    <label>📏 Ширина (px)</label>
                    <input type="number" id="editWidth" placeholder="auto" value="${parseInt(contentElement.style.width) || ''}">
                </div>
                <div class="field-group">
                    <label>📏 Высота (px)</label>
                    <input type="number" id="editHeight" placeholder="auto" value="${parseInt(contentElement.style.height) || ''}">
                </div>
            </div>
            
            <div class="field-group">
                <label>🎯 Выравнивание</label>
                <select id="editAlign">
                    <option value="left" ${contentElement.style.textAlign === 'left' ? 'selected' : ''}>По левому краю</option>
                    <option value="center" ${contentElement.style.textAlign === 'center' ? 'selected' : ''}>По центру</option>
                    <option value="right" ${contentElement.style.textAlign === 'right' ? 'selected' : ''}>По правому краю</option>
                </select>
            </div>
        </div>
        
        <div class="modal-buttons">
            <button class="btn-secondary" id="cancelEditBtn">Отмена</button>
            <button class="btn-primary" id="saveEditBtn">💾 Сохранить</button>
        </div>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    if (contentType !== 'text') {
        const editUrl = modal.querySelector('#editUrl');
        const editPreview = modal.querySelector('#editPreview');

        function updateEditPreview() {
            const url = editUrl.value;
            if (contentType === 'photo') {
                editPreview.innerHTML = `<img src="${url}" style="max-width:100%; max-height:150px; border-radius:12px;" onerror="this.style.display='none'">`;
            } else {
                editPreview.innerHTML = `<video controls style="max-width:100%; max-height:150px;"><source src="${url}" type="video/mp4"></video>`;
            }
        }
        editUrl.addEventListener('input', updateEditPreview);
        updateEditPreview();
    }

    modal.querySelector('#cancelEditBtn').onclick = () => {
        modalOverlay.remove();
        modalOverlay = null;
    };

    modal.querySelector('#saveEditBtn').onclick = () => {
        const width = modal.querySelector('#editWidth').value;
        const height = modal.querySelector('#editHeight').value;
        const align = modal.querySelector('#editAlign').value;

        if (contentType === 'text') {
            const newText = modal.querySelector('#editText').value;
            const textDiv = contentElement.querySelector('div');
            if (textDiv) textDiv.innerHTML = newText.replace(/\n/g, '<br>');
        } else {
            const newUrl = modal.querySelector('#editUrl').value;
            if (contentType === 'photo') {
                const img = contentElement.querySelector('img');
                if (img) img.src = newUrl;
            } else if (contentType === 'video') {
                const source = contentElement.querySelector('source');
                const video = contentElement.querySelector('video');
                if (source) source.src = newUrl;
                if (video) video.load();
            }
        }

        if (width && width !== 'auto') contentElement.style.width = width + 'px';
        else contentElement.style.width = '';
        if (height && height !== 'auto') contentElement.style.height = height + 'px';
        else contentElement.style.height = '';
        contentElement.style.textAlign = align;

        modalOverlay.remove();
        modalOverlay = null;
        saveToHistory();
        showToast('✅ Контент обновлён');
    };
}

// Вставка нового блока через модалку
function insertSmartBlock(container) {
    if (!container) {
        const mainContainer = document.querySelector('.container');
        if (!mainContainer) {
            showToast('❌ Не найден контейнер для вставки');
            return;
        }
        container = mainContainer;
    }

    const { container: blockContainer, contentArea } = createContainerBlock();
    container.appendChild(blockContainer);
    saveToHistory();
    showToast('📦 Новый блок создан. Нажмите на плюс, чтобы добавить контент');

    // Прокрутка к новому блоку
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
                    <div class="group-label">📦 Умные блоки</div>
                    <div class="group-buttons">
                        <button id="insertSmartBlock" class="tool-btn" style="background:#2D6A9F; color:white;">✨ Умный блок (текст/фото/видео)</button>
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
                        <li>✨ <strong>Умный блок</strong> — создайте контейнер, внутри выберите текст/фото/видео</li>
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

    // Умный блок
    const smartBlockBtn = document.getElementById('insertSmartBlock');
    if (smartBlockBtn) {
        smartBlockBtn.addEventListener('click', () => insertSmartBlock());
    }

    // Простые блоки
    document.querySelectorAll('.insert-block-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.block;
            insertSimpleBlock(type);
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

function insertSimpleBlock(type) {
    const container = document.querySelector('.container');
    if (!container) return;

    let block;
    switch(type) {
        case 'text':
            block = new TextBlock();
            block.create();
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
        showToast(`✅ Блок добавлен`);
    }
}

export function hideToolbar() {
    if (toolbar) toolbar.remove();
    toolbar = null;
    if (modalOverlay) modalOverlay.remove();
    modalOverlay = null;
}