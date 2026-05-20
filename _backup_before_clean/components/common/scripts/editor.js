// ---------- Визуальный редактор ----------
let githubToken = localStorage.getItem('githubToken');
let activePanel = null;
let activeElement = null;
let editMode = false;
let editToggle = null;
let gridMode = false;
let gridOverlay = null;

const REPO_OWNER = 'hrLubacheva';
const REPO_NAME = 'hrLubacheva.github.io';
const BRANCH = 'main';

function saveEditModeState() {
    localStorage.setItem('editMode', editMode ? 'true' : 'false');
}

function clearActiveElement() {
    if (activeElement) {
        activeElement.style.outline = '';
        activeElement.style.outlineOffset = '';
        activeElement.style.border = '';
        if (activeElement.hasAttribute('contenteditable')) {
            activeElement.removeAttribute('contenteditable');
            activeElement.style.border = '';
            activeElement.style.padding = '';
        }
        activeElement = null;
    }
    if (activePanel) {
        activePanel.remove();
        activePanel = null;
    }
}

// ==================== РЕЖИМ СЕТКИ ====================
function createGridOverlay() {
    if (gridOverlay) gridOverlay.remove();

    gridOverlay = document.createElement('div');
    gridOverlay.id = 'editor-grid-overlay';
    gridOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
        background-image: 
            linear-gradient(to right, rgba(45,106,159,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(45,106,159,0.15) 1px, transparent 1px);
        background-size: 20px 20px;
    `;
    document.body.appendChild(gridOverlay);
}

function removeGridOverlay() {
    if (gridOverlay) {
        gridOverlay.remove();
        gridOverlay = null;
    }
}

function toggleGridMode() {
    gridMode = !gridMode;
    if (gridMode) {
        createGridOverlay();
        showToast('📐 Режим сетки включён.');
    } else {
        removeGridOverlay();
        showToast('📐 Режим сетки выключен.');
    }
    localStorage.setItem('gridMode', gridMode ? 'true' : 'false');
}

// ==================== РАБОТА С GITHUB ====================
async function commitToGitHub(filePath, content, commitMessage, isImage = false) {
    if (!githubToken) {
        githubToken = prompt('Введите ваш GitHub Personal Access Token (с правами repo):');
        if (githubToken) {
            localStorage.setItem('githubToken', githubToken);
        } else {
            showToast('❌ Токен не введён. Коммит отменён.');
            return false;
        }
    }

    try {
        let contentToSend = content;
        if (isImage) {
            contentToSend = content;
        } else if (typeof content === 'string' && !content.includes('base64')) {
            contentToSend = btoa(unescape(encodeURIComponent(content)));
        }

        const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        const getResponse = await fetch(getUrl, {
            headers: { 'Authorization': `token ${githubToken}` }
        });

        let sha = null;
        if (getResponse.status === 200) {
            const data = await getResponse.json();
            sha = data.sha;
        }

        const putUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        const putResponse = await fetch(putUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: commitMessage,
                content: contentToSend,
                sha: sha,
                branch: BRANCH
            })
        });

        if (putResponse.ok) {
            showToast(`✅ Сохранено: ${filePath}`);
            return true;
        } else {
            const error = await putResponse.json();
            showToast(`❌ Ошибка: ${error.message || 'Неизвестная ошибка'}`);
            return false;
        }
    } catch (error) {
        console.error(error);
        showToast('❌ Ошибка соединения с GitHub');
        return false;
    }
}

function getCurrentHTML() {
    return document.documentElement.outerHTML;
}

function saveCurrentPage() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const content = getCurrentHTML();
    commitToGitHub(currentPath, content, `Автосохранение: правки на странице ${currentPath} [${new Date().toLocaleString()}]`);
}

// ==================== БЛОК ДЛЯ ФОТО ====================
function createImageBlock() {
    const container = document.createElement('div');
    container.className = 'image-block-placeholder';
    container.style.cssText = `
        width: 300px;
        min-height: 200px;
        background: rgba(45,106,159,0.1);
        border: 2px dashed var(--primary);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 10px;
        padding: 20px;
    `;

    const icon = document.createElement('div');
    icon.textContent = '🖼️';
    icon.style.fontSize = '48px';
    container.appendChild(icon);

    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = '📷 Загрузить фото';
    uploadBtn.style.cssText = `
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 40px;
        padding: 8px 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        margin-top: 10px;
    `;

    function insertImageIntoBlock(imgUrl, altText = 'Изображение') {
        container.innerHTML = '';
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = altText;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '12px';
        img.style.display = 'block';
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            createControlPanel(img);
        });
        container.appendChild(img);
        container.style.background = 'none';
        container.style.border = '1px solid var(--border)';
        container.style.padding = '0';
    }

    uploadBtn.onclick = async (e) => {
        e.stopPropagation();
        const choice = confirm('Загрузить фото с компьютера? (ОК — файл, Отмена — по ссылке)');
        if (choice) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                    showToast('❌ Файл слишком большой. Максимум 5MB.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64 = event.target.result.split(',')[1];
                    const extension = file.name.split('.').pop();
                    const timestamp = Date.now();
                    const filename = `upload_${timestamp}.${extension}`;
                    const filePath = `assets/images/${filename}`;
                    showToast('📤 Загрузка фото на GitHub...');
                    const success = await commitToGitHub(filePath, base64, `Добавлено фото: ${filename}`, true);
                    if (success) {
                        const imgUrl = `assets/images/${filename}`;
                        insertImageIntoBlock(imgUrl, file.name);
                        showToast(`✅ Фото добавлено: ${filename}`);
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        } else {
            const imgUrl = prompt('Введите URL изображения:', 'https://example.com/photo.jpg');
            if (imgUrl && imgUrl.trim()) {
                insertImageIntoBlock(imgUrl, 'Фото по ссылке');
                showToast('✅ Фото по ссылке добавлено');
            }
        }
    };

    container.appendChild(uploadBtn);

    const hint = document.createElement('div');
    hint.textContent = 'Нажмите на кнопку, чтобы добавить фото';
    hint.style.fontSize = '12px';
    hint.style.color = 'var(--text-muted)';
    hint.style.marginTop = '8px';
    container.appendChild(hint);

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.style.background = 'rgba(45,106,159,0.2)';
    });
    container.addEventListener('dragleave', () => {
        container.style.background = 'rgba(45,106,159,0.1)';
    });
    container.addEventListener('drop', async (e) => {
        e.preventDefault();
        container.style.background = 'rgba(45,106,159,0.1)';
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) {
            showToast('❌ Пожалуйста, перетащите изображение');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ Файл слишком большой. Максимум 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target.result.split(',')[1];
            const extension = file.name.split('.').pop();
            const timestamp = Date.now();
            const filename = `upload_${timestamp}.${extension}`;
            const filePath = `assets/images/${filename}`;
            showToast('📤 Загрузка фото на GitHub...');
            const success = await commitToGitHub(filePath, base64, `Добавлено фото: ${filename}`, true);
            if (success) {
                const imgUrl = `assets/images/${filename}`;
                insertImageIntoBlock(imgUrl, file.name);
                showToast(`✅ Фото добавлено: ${filename}`);
            }
        };
        reader.readAsDataURL(file);
    });

    return container;
}

// ==================== ТЕКСТОВЫЙ БЛОК ====================
function createTextBlock() {
    const container = document.createElement('div');
    container.className = 'text-block-placeholder';
    container.style.cssText = `
        background: rgba(45,106,159,0.05);
        border: 1px dashed var(--primary);
        border-radius: 16px;
        padding: 16px;
        margin: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    const paragraph = document.createElement('p');
    paragraph.textContent = 'Новый текст (кликните для редактирования)';
    paragraph.style.margin = '0';
    paragraph.style.cursor = 'pointer';
    paragraph.setAttribute('contenteditable', 'true');
    paragraph.style.padding = '8px';
    paragraph.style.borderRadius = '8px';
    paragraph.addEventListener('click', (e) => {
        e.stopPropagation();
        createControlPanel(paragraph);
    });

    container.appendChild(paragraph);

    return container;
}

// ==================== РЕДАКТИРОВАНИЕ СПИСКОВ ====================
function editSelectList(selectElement) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--surface);
        border-radius: 24px;
        padding: 24px;
        z-index: 20000;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Редактирование списка';
    title.style.marginBottom = '16px';
    title.style.fontSize = '1.3rem';
    modal.appendChild(title);

    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse;';
    table.innerHTML = `
        <thead>
            <tr style="border-bottom: 2px solid var(--border);">
                <th style="text-align: left; padding: 8px;">Значение</th>
                <th style="text-align: left; padding: 8px;">Текст</th>
                <th style="width: 50px;"></th>
            </tr>
        </thead>
        <tbody id="select-edit-tbody"></tbody>
    `;
    modal.appendChild(table);

    const tbody = table.querySelector('#select-edit-tbody');

    function renderOptions() {
        tbody.innerHTML = '';
        for (let i = 0; i < selectElement.options.length; i++) {
            const opt = selectElement.options[i];
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--border)';

            const valueCell = document.createElement('td');
            valueCell.style.padding = '8px';
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.value = opt.value;
            valueInput.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px;';
            valueInput.onchange = () => {
                opt.value = valueInput.value;
                showToast('✅ Значение обновлено');
            };
            valueCell.appendChild(valueInput);

            const textCell = document.createElement('td');
            textCell.style.padding = '8px';
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = opt.text;
            textInput.style.cssText = 'width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px;';
            textInput.onchange = () => {
                opt.text = textInput.value;
                showToast('✅ Текст обновлён');
            };
            textCell.appendChild(textInput);

            const deleteCell = document.createElement('td');
            deleteCell.style.padding = '8px';
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.style.cssText = 'background: #dc2626; color: white; border: none; border-radius: 20px; padding: 4px 10px; cursor: pointer;';
            deleteBtn.onclick = () => {
                if (selectElement.options.length <= 1) {
                    showToast('❌ Нельзя удалить последний вариант');
                    return;
                }
                selectElement.remove(i);
                renderOptions();
                showToast('✅ Вариант удалён');
            };
            deleteCell.appendChild(deleteBtn);

            row.appendChild(valueCell);
            row.appendChild(textCell);
            row.appendChild(deleteCell);
            tbody.appendChild(row);
        }
    }

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Добавить вариант';
    addBtn.style.cssText = 'margin-top: 16px; background: var(--primary); color: white; border: none; border-radius: 40px; padding: 10px 20px; cursor: pointer; width: 100%;';
    addBtn.onclick = () => {
        const newOption = document.createElement('option');
        newOption.value = `new_${Date.now()}`;
        newOption.text = 'Новый вариант';
        selectElement.appendChild(newOption);
        renderOptions();
        showToast('✅ Вариант добавлен');
    };
    modal.appendChild(addBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.style.cssText = 'margin-top: 12px; background: var(--surface-soft); color: var(--text); border: 1px solid var(--border); border-radius: 40px; padding: 10px 20px; cursor: pointer; width: 100%;';
    closeBtn.onclick = () => modal.remove();
    modal.appendChild(closeBtn);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 19999;
    `;
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    renderOptions();
}

// ==================== ПАНЕЛЬ УПРАВЛЕНИЯ ====================
function createControlPanel(element) {
    if (!editMode) return;

    clearActiveElement();

    activeElement = element;
    element.style.outline = '3px solid var(--accent)';
    element.style.outlineOffset = '2px';

    const panel = document.createElement('div');
    panel.className = 'edit-control-panel';
    panel.style.cssText = `
        position: fixed;
        background: #12263F;
        color: white;
        padding: 8px 12px;
        border-radius: 40px;
        display: flex;
        gap: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 12px;
        cursor: grab;
        user-select: none;
    `;

    const rect = element.getBoundingClientRect();
    panel.style.top = (rect.top - 45) + 'px';
    panel.style.left = rect.left + 'px';

    let isEditingText = false; // Флаг редактирования текста

    // Перетаскивание панели
    let isPanelDragging = false;
    let panelDragStartX = 0, panelDragStartY = 0;
    let panelStartLeft = 0, panelStartTop = 0;

    panel.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        isPanelDragging = true;
        panelDragStartX = e.clientX;
        panelDragStartY = e.clientY;
        const rect = panel.getBoundingClientRect();
        panelStartLeft = rect.left;
        panelStartTop = rect.top;
        panel.style.position = 'fixed';
        panel.style.left = panelStartLeft + 'px';
        panel.style.top = panelStartTop + 'px';
        panel.style.cursor = 'grabbing';

        const onMouseMove = (e) => {
            if (!isPanelDragging) return;
            const dx = e.clientX - panelDragStartX;
            const dy = e.clientY - panelDragStartY;
            panel.style.left = (panelStartLeft + dx) + 'px';
            panel.style.top = (panelStartTop + dy) + 'px';
        };

        const onMouseUp = () => {
            isPanelDragging = false;
            panel.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Кнопка копирования
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Копировать';
    copyBtn.style.cssText = 'background:#2ea44f;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    copyBtn.onclick = () => {
        const clone = element.cloneNode(true);
        clone.style.outline = 'none';
        clone.style.border = 'none';
        element.parentNode.insertBefore(clone, element.nextSibling);
        showToast('✅ Элемент скопирован');
        clone.style.cursor = 'pointer';
        clone.addEventListener('click', (e) => {
            e.stopPropagation();
            createControlPanel(clone);
        });
        setTimeout(() => createControlPanel(clone), 100);
    };

    // Кнопка редактирования текста (НЕ ЗАКРЫВАЕТ ПАНЕЛЬ)
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️ Текст';
    editBtn.style.cssText = 'background:var(--primary);border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        if (!activeElement) return;

        if (activeElement.hasAttribute('contenteditable')) {
            activeElement.removeAttribute('contenteditable');
            activeElement.style.border = 'none';
            activeElement.style.padding = '0';
            editBtn.textContent = '✏️ Текст';
            isEditingText = false;
            showToast('Текст сохранён локально');
        } else {
            activeElement.setAttribute('contenteditable', 'true');
            activeElement.style.border = '1px dashed var(--primary)';
            activeElement.style.padding = '4px';
            activeElement.focus();
            editBtn.textContent = '💾 Сохранить текст';
            isEditingText = true;
            showToast('Редактируйте текст. Нажмите «💾 Сохранить текст» для выхода.');
        }
    };

    // Кнопка перехода по ссылке
    const goToLinkBtn = document.createElement('button');
    goToLinkBtn.textContent = '🔗 Перейти по ссылке';
    goToLinkBtn.style.cssText = 'background:#8B5CF6;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    goToLinkBtn.onclick = () => {
        if (element.tagName === 'A' && element.href) {
            window.open(element.href, '_blank');
            showToast(`Открыта ссылка: ${element.href}`);
        } else {
            showToast('Этот элемент не является ссылкой');
        }
    };

    // Редактирование списка
    const editSelectBtn = document.createElement('button');
    editSelectBtn.textContent = '📋 Редактировать список';
    editSelectBtn.style.cssText = 'background:#8B5CF6;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    editSelectBtn.onclick = () => {
        if (element.tagName === 'SELECT') {
            editSelectList(element);
        } else {
            showToast('Этот элемент не является списком');
        }
    };

    // Ширина
    const widthBtn = document.createElement('button');
    widthBtn.textContent = '📏 Ширина';
    widthBtn.style.cssText = 'background:var(--accent);border:none;color:#12263F;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    widthBtn.onclick = () => {
        const currentWidth = element.style.width || element.offsetWidth + 'px';
        const newWidth = prompt('Введите новую ширину (px, %, rem, vw):', currentWidth);
        if (newWidth) {
            element.style.width = newWidth;
            element.style.display = 'block';
            showToast(`Ширина изменена на ${newWidth}`);
            const newRect = element.getBoundingClientRect();
            panel.style.top = (newRect.top - 45) + 'px';
            panel.style.left = newRect.left + 'px';
        }
    };

    // Высота
    const heightBtn = document.createElement('button');
    heightBtn.textContent = '📐 Высота';
    heightBtn.style.cssText = 'background:var(--accent);border:none;color:#12263F;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    heightBtn.onclick = () => {
        const currentHeight = element.style.height || element.offsetHeight + 'px';
        const newHeight = prompt('Введите новую высоту (px, %, rem, vh):', currentHeight);
        if (newHeight) {
            element.style.height = newHeight;
            showToast(`Высота изменена на ${newHeight}`);
            const newRect = element.getBoundingClientRect();
            panel.style.top = (newRect.top - 45) + 'px';
            panel.style.left = newRect.left + 'px';
        }
    };

    // Перемещение
    const moveBtn = document.createElement('button');
    moveBtn.textContent = '🖱️ Переместить';
    moveBtn.style.cssText = 'background:#5C6E87;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let originalParent = null;
    let ghost = null;
    let startElement = null;

    moveBtn.onclick = () => {
        if (!editMode) return;
        if (isDragging) {
            if (ghost) ghost.remove();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (startElement) {
                startElement.style.position = '';
                startElement.style.left = '';
                startElement.style.top = '';
                startElement.style.margin = '';
                startElement.style.cursor = '';
            }
            isDragging = false;
            showToast('Режим перемещения выключен');
            moveBtn.textContent = '🖱️ Переместить';
        } else {
            showToast('Перетащите элемент мышью. Нажмите снова для отмены.');
            moveBtn.textContent = '✋ Перемещение активно';

            startElement = element;
            originalParent = element.parentElement;

            element.style.position = 'relative';
            element.style.left = '0px';
            element.style.top = '0px';
            element.style.margin = '0';
            element.style.cursor = 'grab';

            ghost = element.cloneNode(true);
            ghost.style.position = 'absolute';
            ghost.style.top = '0';
            ghost.style.left = '0';
            ghost.style.opacity = '0.5';
            ghost.style.pointerEvents = 'none';
            ghost.style.zIndex = '9999';
            ghost.style.width = element.offsetWidth + 'px';
            document.body.appendChild(ghost);

            isDragging = true;

            const onMouseMoveGlobal = (e) => {
                if (!isDragging) return;
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;
                if (startElement) {
                    startElement.style.left = dx + 'px';
                    startElement.style.top = dy + 'px';
                }
                if (ghost) {
                    ghost.style.left = (originalParent.offsetLeft + dx) + 'px';
                    ghost.style.top = (originalParent.offsetTop + dy) + 'px';
                }
            };

            const onMouseUpGlobal = () => {
                if (!isDragging) return;
                document.removeEventListener('mousemove', onMouseMoveGlobal);
                document.removeEventListener('mouseup', onMouseUpGlobal);
                if (ghost) ghost.remove();
                showToast('Элемент перемещён');
                const newRect = startElement.getBoundingClientRect();
                if (activePanel) {
                    activePanel.style.top = (newRect.top - 45) + 'px';
                    activePanel.style.left = newRect.left + 'px';
                }
                isDragging = false;
                moveBtn.textContent = '🖱️ Переместить';
            };

            const startDrag = (e) => {
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                if (startElement) startElement.style.cursor = 'grabbing';
                document.addEventListener('mousemove', onMouseMoveGlobal);
                document.addEventListener('mouseup', onMouseUpGlobal);
                startElement.removeEventListener('mousedown', startDrag);
            };

            startElement.addEventListener('mousedown', startDrag);

            setTimeout(() => {
                if (isDragging) {
                    document.removeEventListener('mousemove', onMouseMoveGlobal);
                    document.removeEventListener('mouseup', onMouseUpGlobal);
                    if (ghost) ghost.remove();
                    if (startElement) {
                        startElement.style.position = '';
                        startElement.style.left = '';
                        startElement.style.top = '';
                        startElement.style.cursor = '';
                    }
                    isDragging = false;
                    moveBtn.textContent = '🖱️ Переместить';
                    showToast('Режим перемещения автоматически выключен');
                }
            }, 30000);
        }
    };

    // Удаление
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Удалить';
    deleteBtn.style.cssText = 'background:#dc2626;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    deleteBtn.onclick = () => {
        if (confirm('Удалить этот элемент?')) {
            element.remove();
            clearActiveElement();
            showToast('Элемент удалён');
        }
    };

    // Вставить фото
    const insertImageBtn = document.createElement('button');
    insertImageBtn.textContent = '📷 Вставить фото';
    insertImageBtn.style.cssText = 'background:#f59e0b;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    insertImageBtn.onclick = async () => {
        const choice = confirm('Загрузить файл? (ОК — файл, Отмена — по ссылке)');
        if (choice) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                    showToast('❌ Файл слишком большой. Максимум 5MB.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64 = event.target.result.split(',')[1];
                    const extension = file.name.split('.').pop();
                    const timestamp = Date.now();
                    const filename = `upload_${timestamp}.${extension}`;
                    const filePath = `assets/images/${filename}`;
                    showToast('📤 Загрузка фото на GitHub...');
                    const success = await commitToGitHub(filePath, base64, `Добавлено фото: ${filename}`, true);
                    if (success) {
                        const imgUrl = `assets/images/${filename}`;
                        const newImg = document.createElement('img');
                        newImg.src = imgUrl;
                        newImg.alt = file.name;
                        newImg.style.maxWidth = '100%';
                        newImg.style.borderRadius = '16px';
                        newImg.style.margin = '10px 0';
                        newImg.style.cursor = 'pointer';
                        if (element && element.parentNode) {
                            element.parentNode.insertBefore(newImg, element.nextSibling);
                        } else {
                            document.body.appendChild(newImg);
                        }
                        newImg.addEventListener('click', (e) => {
                            e.stopPropagation();
                            createControlPanel(newImg);
                        });
                        showToast(`✅ Фото добавлено: ${filename}`);
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        } else {
            const imgUrl = prompt('Введите URL изображения:', 'https://example.com/photo.jpg');
            if (imgUrl && imgUrl.trim()) {
                const newImg = document.createElement('img');
                newImg.src = imgUrl;
                newImg.alt = 'Фото по ссылке';
                newImg.style.maxWidth = '100%';
                newImg.style.borderRadius = '16px';
                newImg.style.margin = '10px 0';
                newImg.style.cursor = 'pointer';
                if (element && element.parentNode) {
                    element.parentNode.insertBefore(newImg, element.nextSibling);
                } else {
                    document.body.appendChild(newImg);
                }
                newImg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    createControlPanel(newImg);
                });
                showToast('✅ Фото по ссылке добавлено');
            }
        }
    };

    // Блок для фото
    const addImageBlockBtn = document.createElement('button');
    addImageBlockBtn.textContent = '➕ Блок для фото';
    addImageBlockBtn.style.cssText = 'background:#f59e0b;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    addImageBlockBtn.onclick = () => {
        const imageBlock = createImageBlock();
        if (element && element.parentNode) {
            element.parentNode.insertBefore(imageBlock, element.nextSibling);
        } else {
            document.body.appendChild(imageBlock);
        }
        showToast('✅ Блок для фото добавлен');
    };

    // Текстовый блок
    const addTextBlockBtn = document.createElement('button');
    addTextBlockBtn.textContent = '➕ Текстовый блок';
    addTextBlockBtn.style.cssText = 'background:#8B5CF6;border:none;color:white;padding:4px 12px;border-radius:20px;cursor:pointer;font-size:11px;';
    addTextBlockBtn.onclick = () => {
        const textBlock = createTextBlock();
        if (element && element.parentNode) {
            element.parentNode.insertBefore(textBlock, element.nextSibling);
        } else {
            document.body.appendChild(textBlock);
        }
        showToast('✅ Текстовый блок добавлен');
    };

    panel.appendChild(copyBtn);
    panel.appendChild(editBtn);
    if (element.tagName === 'A') {
        panel.appendChild(goToLinkBtn);
    }
    if (element.tagName === 'SELECT') {
        panel.appendChild(editSelectBtn);
    }
    panel.appendChild(widthBtn);
    panel.appendChild(heightBtn);
    panel.appendChild(moveBtn);
    panel.appendChild(insertImageBtn);
    panel.appendChild(addImageBlockBtn);
    panel.appendChild(addTextBlockBtn);
    panel.appendChild(deleteBtn);

    document.body.appendChild(panel);
    activePanel = panel;

    // Закрытие панели (НЕ закрываем, если идёт редактирование текста)
    const closePanel = (e) => {
        if (isEditingText) return;
        if (!panel.contains(e.target) && e.target !== element && !element.contains(e.target)) {
            clearActiveElement();
            document.removeEventListener('click', closePanel);
        }
    };
    setTimeout(() => document.addEventListener('click', closePanel), 100);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function resetAllEditStyles() {
    document.querySelectorAll('*').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.cursor = '';
        if (el.hasAttribute('contenteditable')) {
            el.removeAttribute('contenteditable');
            el.style.border = '';
            el.style.padding = '';
        }
    });
}

function restoreLinksBehavior() {
    document.querySelectorAll('a').forEach(link => {
        const newLink = link.cloneNode(true);
        if (link.parentNode) {
            link.parentNode.replaceChild(newLink, link);
        }
    });
}

function disableLinksBehavior() {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createControlPanel(link);
        });
    });
}

// ==================== ВКЛ/ВЫКЛ РЕЖИМА РЕДАКТИРОВАНИЯ ====================
function enableEditMode() {
    if (editMode) return;
    editMode = true;
    saveEditModeState();

    document.body.classList.add('edit-mode-active');

    const selectors = [
        'h1', 'h2', 'h3', 'p', '.hero-subtitle', '.hero-text', '.small-note',
        '.contact-line', '.stat-label', '.stat-number', '.benefit-card p',
        '.role-card p', '.service-card p', '.process-card p', 'img', '.stat-number',
        '.service-card', '.role-card', '.benefit-card', '.process-card', '.calc-item',
        '.total-price', '.discountInfo', '.container', 'section', '.hero',
        '.hero-content', '.hero-image', '.roles-grid', '.services-flex', '.stats-grid',
        '.benefits-grid', '.process-row', '.process-col', '.process-grid', '.quiz-card',
        '.checklist-card', '.calendar-card', '.callback-form', '.contact-block',
        '.calculator-tabs', '.tab-pane', '.add-service', '.total-block', '.faq-grid',
        '.faq-item', '.gift-card', '.cases-grid', '.case-card', '.clients-grid',
        '.client-logo', '.certificates-grid', '.cert-card', '.about-header', '.about-text',
        'a', 'button', '.btn-primary', '.btn-secondary', 'select', 'option',
        '.process-step', '.process-card h4', '.process-title', '.process-col h3'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
        if (el.classList && (
            el.classList.contains('add-text-btn') ||
            el.classList.contains('add-image-btn') ||
            el.classList.contains('save-page-btn') ||
            el.classList.contains('edit-toggle') ||
            el.classList.contains('grid-toggle-btn')
        )) {
            return;
        }
        el.style.cursor = 'pointer';
        el.style.outline = '1px dashed var(--primary)';
        el.style.outlineOffset = '2px';
        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createControlPanel(el);
        });
    });

    disableLinksBehavior();

    if (!document.querySelector('.add-text-btn')) {
        const addTextBtn = document.createElement('button');
        addTextBtn.textContent = '+ Добавить текст';
        addTextBtn.className = 'add-text-btn';
        addTextBtn.style.cssText = 'position:fixed;bottom:20px;left:20px;background:var(--primary);color:white;border:none;padding:10px 20px;border-radius:40px;cursor:pointer;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        addTextBtn.onclick = () => {
            const textBlock = createTextBlock();
            document.body.appendChild(textBlock);
            showToast('✅ Текстовый блок добавлен в конец страницы');
        };
        document.body.appendChild(addTextBtn);
    }

    if (!document.querySelector('.add-image-btn')) {
        const addImageBtn = document.createElement('button');
        addImageBtn.textContent = '📷 Добавить фото';
        addImageBtn.className = 'add-image-btn';
        addImageBtn.style.cssText = 'position:fixed;bottom:20px;left:220px;background:var(--accent);color:#12263F;border:none;padding:10px 20px;border-radius:40px;cursor:pointer;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        addImageBtn.onclick = async () => {
            const choice = confirm('Загрузить файл? (ОК — файл, Отмена — по ссылке)');
            if (choice) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        showToast('❌ Файл слишком большой. Максимум 5MB.');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const base64 = event.target.result.split(',')[1];
                        const extension = file.name.split('.').pop();
                        const timestamp = Date.now();
                        const filename = `upload_${timestamp}.${extension}`;
                        const filePath = `assets/images/${filename}`;
                        showToast('📤 Загрузка фото на GitHub...');
                        const success = await commitToGitHub(filePath, base64, `Добавлено фото: ${filename}`, true);
                        if (success) {
                            const imgUrl = `assets/images/${filename}`;
                            const newImg = document.createElement('img');
                            newImg.src = imgUrl;
                            newImg.alt = file.name;
                            newImg.style.maxWidth = '100%';
                            newImg.style.borderRadius = '16px';
                            newImg.style.margin = '10px 0';
                            newImg.style.cursor = 'pointer';
                            document.body.appendChild(newImg);
                            newImg.addEventListener('click', (e) => {
                                e.stopPropagation();
                                createControlPanel(newImg);
                            });
                            showToast(`✅ Фото добавлено: ${filename}`);
                        }
                    };
                    reader.readAsDataURL(file);
                };
                input.click();
            } else {
                const imgUrl = prompt('Введите URL изображения:', 'https://example.com/photo.jpg');
                if (imgUrl && imgUrl.trim()) {
                    const newImg = document.createElement('img');
                    newImg.src = imgUrl;
                    newImg.alt = 'Фото по ссылке';
                    newImg.style.maxWidth = '100%';
                    newImg.style.borderRadius = '16px';
                    newImg.style.margin = '10px 0';
                    newImg.style.cursor = 'pointer';
                    document.body.appendChild(newImg);
                    newImg.addEventListener('click', (e) => {
                        e.stopPropagation();
                        createControlPanel(newImg);
                    });
                    showToast('✅ Фото по ссылке добавлено');
                }
            }
        };
        document.body.appendChild(addImageBtn);
    }

    if (!document.querySelector('.save-page-btn')) {
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾 Сохранить в GitHub';
        saveBtn.className = 'save-page-btn';
        saveBtn.style.cssText = 'position:fixed;bottom:20px;right:160px;background:#2ea44f;color:white;border:none;padding:10px 20px;border-radius:40px;cursor:pointer;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        saveBtn.onclick = saveCurrentPage;
        document.body.appendChild(saveBtn);
    }

    // Кнопка сетки
    if (!document.querySelector('.grid-toggle-btn')) {
        const gridToggleBtn = document.createElement('button');
        gridToggleBtn.textContent = gridMode ? '📐 Сетка: ВКЛ' : '📐 Сетка: ВЫКЛ';
        gridToggleBtn.className = 'grid-toggle-btn';
        gridToggleBtn.style.cssText = 'position:fixed;bottom:80px;right:20px;background:var(--primary-strong);color:white;border:none;padding:10px 20px;border-radius:40px;cursor:pointer;z-index:9999;font-size:12px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        gridToggleBtn.onclick = () => {
            toggleGridMode();
            gridToggleBtn.textContent = gridMode ? '📐 Сетка: ВКЛ' : '📐 Сетка: ВЫКЛ';
        };
        document.body.appendChild(gridToggleBtn);
    }

    if (editToggle) editToggle.textContent = '🔒 Выключить редактирование';

    showToast('🔧 Режим редактирования включён.');
    if (window.renderQuiz) window.renderQuiz();
}

function disableEditMode() {
    if (!editMode) return;
    editMode = false;
    saveEditModeState();

    document.body.classList.remove('edit-mode-active');

    resetAllEditStyles();

    document.querySelectorAll('.add-text-btn, .add-image-btn, .save-page-btn, .edit-control-panel, .grid-toggle-btn').forEach(btn => btn.remove());

    removeGridOverlay();

    // Полностью восстанавливаем ссылки
    document.querySelectorAll('a').forEach(link => {
        const newLink = link.cloneNode(true);
        if (link.parentNode) {
            link.parentNode.replaceChild(newLink, link);
        }
    });

    clearActiveElement();

    if (editToggle) editToggle.textContent = '✏️ Редактировать сайт';

    if (window.renderQuiz) window.renderQuiz();

    showToast('🔒 Режим редактирования выключен. Ссылки активны.');
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function initEditor() {
    const savedState = localStorage.getItem('editMode');
    editMode = savedState === 'true';

    const savedGridState = localStorage.getItem('gridMode');
    if (savedGridState === 'true') {
        gridMode = true;
        createGridOverlay();
    }

    if (!document.querySelector('.edit-toggle')) {
        editToggle = document.createElement('button');
        editToggle.textContent = editMode ? '🔒 Выключить редактирование' : '✏️ Редактировать сайт';
        editToggle.className = 'edit-toggle';
        editToggle.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--primary);color:white;border:none;padding:10px 20px;border-radius:40px;cursor:pointer;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        editToggle.onclick = () => {
            if (editMode) {
                disableEditMode();
            } else {
                enableEditMode();
            }
            editToggle.textContent = editMode ? '🔒 Выключить редактирование' : '✏️ Редактировать сайт';
        };
        document.body.appendChild(editToggle);
    } else {
        editToggle = document.querySelector('.edit-toggle');
        editToggle.textContent = editMode ? '🔒 Выключить редактирование' : '✏️ Редактировать сайт';
    }

    if (editMode) enableEditMode();
}