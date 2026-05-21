/**
 * Editor Main Module — с левой боковой панелью
 */

(function() {
    'use strict';

    var sidebar = null;
    var historyPanel = null;
    var isSidebarVisible = true;
    var isSaving = false;

    // ========== GITHUB ТОКЕН ==========
    function getStoredToken() {
        try {
            var token = localStorage.getItem('github_token_hrlubacheva');
            if (token) return token;
            token = sessionStorage.getItem('github_token_hrlubacheva');
            return token;
        } catch(e) {
            return null;
        }
    }

    function saveToken(token, remember) {
        try {
            localStorage.removeItem('github_token_hrlubacheva');
            sessionStorage.removeItem('github_token_hrlubacheva');
            if (remember) {
                localStorage.setItem('github_token_hrlubacheva', token);
            } else {
                sessionStorage.setItem('github_token_hrlubacheva', token);
            }
            return true;
        } catch(e) {
            return false;
        }
    }

    function clearToken() {
        try {
            localStorage.removeItem('github_token_hrlubacheva');
            sessionStorage.removeItem('github_token_hrlubacheva');
            if (window.showToast) window.showToast('🔐 Токен удалён', 2000);
            return true;
        } catch(e) {
            if (window.showToast) window.showToast('❌ Не удалось удалить токен', 2000);
            return false;
        }
    }

    // ========== СОХРАНЕНИЕ НА GITHUB ==========
    function getCleanHTML() {
        var clone = document.cloneNode(true);
        // Удаляем служебные элементы редактора
        clone.querySelectorAll('.editor-sidebar, .history-panel, .resize-marker, .format-toolbar, .sidebar-toggle, .editor-toast').forEach(function(el) {
            if (el && el.remove) el.remove();
        });
        clone.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
            el.removeAttribute('contenteditable');
        });
        clone.querySelectorAll('.selected, .editable-block').forEach(function(el) {
            el.classList.remove('selected', 'editable-block');
        });
        clone.querySelectorAll('[style*="outline"]').forEach(function(el) {
            if (el.style) {
                el.style.removeProperty('outline');
                el.style.removeProperty('outline-offset');
            }
        });
        return '<!DOCTYPE html>\n' + clone.documentElement.outerHTML;
    }

    window.saveToGitHub = async function() {
        if (isSaving) {
            if (window.showToast) window.showToast('⚠️ Сохранение уже выполняется', 2000);
            return;
        }

        isSaving = true;
        if (window.showToast) window.showToast('📤 Сохранение на GitHub...', 0);

        try {
            var token = getStoredToken();

            if (!token) {
                token = prompt('🔐 Введите GitHub Personal Access Token:\n\n1. github.com/settings/tokens\n2. Generate new token (classic)\n3. Права: repo\n4. Скопируйте токен');
                if (!token) {
                    isSaving = false;
                    if (window.showToast) window.showToast('❌ Токен не введён', 2000);
                    return;
                }
                var remember = confirm('Запомнить токен для следующих сеансов?\n\nOK — да, Отмена — только на эту сессию');
                saveToken(token, remember);
            }

            var cleanHTML = getCleanHTML();
            var content = btoa(unescape(encodeURIComponent(cleanHTML)));
            var REPO_OWNER = 'hrlubacheva';
            var REPO_NAME = 'hrlubacheva.github.io';
            var FILE_PATH = 'index.html';
            var BRANCH = 'main';

            var getUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + FILE_PATH;

            var sha = null;
            var getResponse = await fetch(getUrl, {
                headers: { 'Authorization': 'token ' + token }
            });

            if (getResponse.ok) {
                var data = await getResponse.json();
                sha = data.sha;
            } else if (getResponse.status === 404) {
                // Файл не существует, будем создавать
                console.log('Файл не найден, будет создан новый');
            } else {
                var errorText = await getResponse.text();
                throw new Error('HTTP ' + getResponse.status + ': ' + errorText);
            }

            var updateResponse = await fetch(getUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': 'token ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Сохранение сайта ' + new Date().toLocaleString(),
                    content: content,
                    sha: sha,
                    branch: BRANCH
                })
            });

            if (updateResponse.ok) {
                if (window.showToast) window.showToast('✅ Сохранено на GitHub!', 3000);
                if (window.refreshGitHubCommits) window.refreshGitHubCommits();
            } else {
                var error = await updateResponse.json();
                if (window.showToast) window.showToast('❌ Ошибка: ' + (error.message || 'Неизвестная ошибка'), 5000);
                if (error.message === 'Bad credentials' || error.message === 'Invalid token') {
                    clearToken();
                    if (window.showToast) window.showToast('❌ Токен недействителен, удалён. Введите заново при следующем сохранении.', 3000);
                }
            }
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            if (window.showToast) window.showToast('⚠️ Ошибка: ' + err.message, 5000);

            // Бекап локально
            try {
                var cleanHTML = getCleanHTML();
                var blob = new Blob([cleanHTML], { type: 'text/html' });
                var link = document.createElement('a');
                var date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                link.href = URL.createObjectURL(blob);
                link.download = 'index_backup_' + date + '.html';
                link.click();
                if (window.showToast) window.showToast('📥 Бекап сохранён локально', 3000);
            } catch(e) {
                console.error('Ошибка создания бекапа:', e);
            }
        } finally {
            isSaving = false;
            var toast = document.querySelector('.editor-toast');
            if (toast && toast.textContent === '📤 Сохранение на GitHub...') toast.remove();
        }
    };

    // ========== ВОССТАНОВЛЕНИЕ ИЗ GITHUB ==========
    window.showGitHubHistory = function() {
        if (!historyPanel) {
            createHistoryPanel();
        }
        historyPanel.classList.toggle('show');
        if (historyPanel.classList.contains('show')) {
            loadGitHubCommits();
        }
    };

    function createHistoryPanel() {
        if (historyPanel) return;

        historyPanel = document.createElement('div');
        historyPanel.className = 'history-panel';
        historyPanel.innerHTML = `
            <div class="history-panel-header">
                <span>📜 История коммитов GitHub</span>
                <button id="closeHistoryPanelBtn">✕</button>
            </div>
            <div class="history-list" id="historyList">
                <div style="padding:20px;text-align:center;">Загрузка...</div>
            </div>
            <div style="padding:10px; border-top:1px solid #eee; display: flex; gap: 8px;">
                <button id="refreshHistoryBtn" class="sidebar-btn" style="flex:1;">🔄 Обновить</button>
                <button id="clearTokenBtn" class="sidebar-btn" style="flex:1; background:#dc3545; color:white;">🗑️ Удалить токен</button>
            </div>
        `;
        document.body.appendChild(historyPanel);

        document.getElementById('closeHistoryPanelBtn')?.addEventListener('click', function() {
            historyPanel.classList.remove('show');
        });

        document.getElementById('refreshHistoryBtn')?.addEventListener('click', function() {
            loadGitHubCommits();
        });

        document.getElementById('clearTokenBtn')?.addEventListener('click', function() {
            if (confirm('Удалить сохранённый GitHub токен? При следующем сохранении нужно будет ввести заново.')) {
                clearToken();
                historyPanel.classList.remove('show');
            }
        });
    }

    async function loadGitHubCommits() {
        var list = document.getElementById('historyList');
        if (!list) return;

        list.innerHTML = '<div style="padding:20px;text-align:center;">⏳ Загрузка коммитов...</div>';

        var token = getStoredToken();
        if (!token) {
            list.innerHTML = '<div style="padding:20px;text-align:center;">🔐 Токен GitHub не найден.<br>Сначала сохраните сайт, чтобы ввести токен.</div>';
            return;
        }

        try {
            var REPO_OWNER = 'hrlubacheva';
            var REPO_NAME = 'hrlubacheva.github.io';
            var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/commits?per_page=30';
            var resp = await fetch(url, { headers: { 'Authorization': 'token ' + token } });

            if (!resp.ok) {
                if (resp.status === 401) {
                    list.innerHTML = '<div style="padding:20px;text-align:center;">❌ Токен недействителен. Удалите токен и введите заново.</div>';
                    return;
                }
                throw new Error('Ошибка загрузки');
            }

            var commits = await resp.json();
            if (!commits.length) {
                list.innerHTML = '<div style="padding:20px;text-align:center;">📭 Нет коммитов</div>';
                return;
            }

            var html = '';
            for (var i = 0; i < commits.length; i++) {
                var c = commits[i];
                var date = new Date(c.commit.author.date).toLocaleString();
                var msg = c.commit.message.split('\n')[0];
                var sha = c.sha.substring(0, 7);
                html += '<div class="history-item" data-sha="' + c.sha + '">';
                html += '<div class="history-time">' + date + '</div>';
                html += '<div class="history-message" style="font-size:12px;margin:5px 0;">' + escapeHtmlLocal(msg) + '</div>';
                html += '<div class="history-actions">';
                html += '<button class="history-view" data-sha="' + c.sha + '" style="margin-right:8px;">👁️ Просмотр</button>';
                html += '<button class="history-restore" data-sha="' + c.sha + '">↩️ Восстановить</button>';
                html += '</div></div>';
            }
            list.innerHTML = html;

            document.querySelectorAll('.history-view').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var sha = btn.dataset.sha;
                    var REPO_OWNER = 'hrlubacheva';
                    var REPO_NAME = 'hrlubacheva.github.io';
                    window.open('https://github.com/' + REPO_OWNER + '/' + REPO_NAME + '/commit/' + sha, '_blank');
                });
            });

            document.querySelectorAll('.history-restore').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var sha = btn.dataset.sha;
                    if (confirm('Восстановить сайт из коммита ' + sha.substring(0,7) + '?')) {
                        restoreFromCommit(sha);
                    }
                });
            });

        } catch(err) {
            console.error(err);
            list.innerHTML = '<div style="padding:20px;text-align:center;">❌ Ошибка: ' + err.message + '</div>';
        }
    }

    async function restoreFromCommit(sha) {
        var token = getStoredToken();
        if (!token) {
            if (window.showToast) window.showToast('❌ Нет токена GitHub', 2000);
            return;
        }

        try {
            if (window.showToast) window.showToast('⏳ Восстановление...', 0);
            var REPO_OWNER = 'hrlubacheva';
            var REPO_NAME = 'hrlubacheva.github.io';
            var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/index.html?ref=' + sha;
            var resp = await fetch(url, { headers: { 'Authorization': 'token ' + token } });

            if (!resp.ok) throw new Error('Не удалось загрузить файл');

            var data = await resp.json();
            var content = atob(data.content);

            document.open();
            document.write(content);
            document.close();

            if (window.showToast) window.showToast('✅ Сайт восстановлен!', 3000);

        } catch(err) {
            console.error(err);
            if (window.showToast) window.showToast('❌ Ошибка: ' + err.message, 4000);
        }
    }

    function escapeHtmlLocal(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    window.refreshGitHubCommits = loadGitHubCommits;

    // ========== ПЕРЕМЕЩЕНИЕ БЛОКОВ ==========
    function moveBlockUp() {
        var selected = document.querySelector('.editable-block.selected');
        if (!selected) {
            if (window.showToast) window.showToast('⚠️ Сначала выделите блок', 2000);
            return;
        }
        var parent = selected.parentNode;
        if (!parent) return;
        var children = Array.from(parent.children).filter(function(child) {
            return child.classList && child.classList.contains('editable-block');
        });
        var index = children.indexOf(selected);
        if (index <= 0) {
            if (window.showToast) window.showToast('⚠️ Блок уже первый', 2000);
            return;
        }
        parent.insertBefore(selected, children[index - 1]);
        window.saveToHistory();
        if (window.showToast) window.showToast('⬆️ Блок перемещён вверх', 1500);
        selected.classList.add('selected');
    }

    function moveBlockDown() {
        var selected = document.querySelector('.editable-block.selected');
        if (!selected) {
            if (window.showToast) window.showToast('⚠️ Сначала выделите блок', 2000);
            return;
        }
        var parent = selected.parentNode;
        if (!parent) return;
        var children = Array.from(parent.children).filter(function(child) {
            return child.classList && child.classList.contains('editable-block');
        });
        var index = children.indexOf(selected);
        if (index === -1 || index === children.length - 1) {
            if (window.showToast) window.showToast('⚠️ Блок уже последний', 2000);
            return;
        }
        parent.insertBefore(selected, children[index + 1].nextSibling);
        window.saveToHistory();
        if (window.showToast) window.showToast('⬇️ Блок перемещён вниз', 1500);
        selected.classList.add('selected');
    }

    function duplicateBlock() {
        var selected = document.querySelector('.editable-block.selected');
        if (!selected) {
            if (window.showToast) window.showToast('⚠️ Сначала выделите блок', 2000);
            return;
        }
        if (selected.classList.contains('locked')) {
            if (window.showToast) window.showToast('🔒 Нельзя дублировать заблокированный блок', 2000);
            return;
        }
        var clone = selected.cloneNode(true);
        clone.classList.remove('selected');
        clone.querySelectorAll('.resize-marker, .format-toolbar').forEach(function(el) {
            if (el && el.remove) el.remove();
        });
        selected.parentNode.insertBefore(clone, selected.nextSibling);
        window.saveToHistory();
        if (window.showToast) window.showToast('✅ Блок продублирован', 1500);
        clone.classList.add('selected');
        window.selectElement(clone);
    }

    function deleteBlock() {
        var selected = document.querySelector('.editable-block.selected');
        if (!selected) {
            if (window.showToast) window.showToast('⚠️ Сначала выделите блок', 2000);
            return;
        }
        if (selected.classList.contains('locked')) {
            if (window.showToast) window.showToast('🔒 Нельзя удалить заблокированный блок', 2000);
            return;
        }
        if (confirm('Удалить этот блок?')) {
            selected.remove();
            window.clearSelection();
            window.saveToHistory();
            if (window.showToast) window.showToast('✅ Блок удалён', 1500);
        }
    }

    // ========== ЛЕВАЯ БОКОВАЯ ПАНЕЛЬ ==========
    function createSidebar() {
        if (sidebar) return;

        sidebar = document.createElement('div');
        sidebar.className = 'editor-sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                ✏️ Редактор сайта
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">📋 История</div>
                <div class="sidebar-buttons">
                    <button id="undoBtn" class="sidebar-btn" title="Отменить (Ctrl+Z)">↩️ Отменить</button>
                    <button id="redoBtn" class="sidebar-btn" title="Вернуть (Ctrl+Y)">↪️ Вернуть</button>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">⬆️ Порядок блоков</div>
                <div class="sidebar-buttons">
                    <button id="moveUpBtn" class="sidebar-btn" title="Переместить выше">⬆️ Выше</button>
                    <button id="moveDownBtn" class="sidebar-btn" title="Переместить ниже">⬇️ Ниже</button>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">📋 Действия с блоком</div>
                <div class="sidebar-buttons">
                    <button id="duplicateBtn" class="sidebar-btn" title="Дублировать">📋 Дублировать</button>
                    <button id="deleteBtn" class="sidebar-btn danger-btn" title="Удалить">🗑️ Удалить</button>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">💾 GitHub</div>
                <div class="sidebar-buttons">
                    <button id="saveGitBtn" class="sidebar-btn save-btn">💾 Сохранить на GitHub</button>
                    <button id="historyGitBtn" class="sidebar-btn">📜 История коммитов</button>
                    <button id="clearTokenSidebarBtn" class="sidebar-btn" style="background:#dc3545; color:white; margin-top:8px;">🗑️ Удалить токен</button>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-section-title">ℹ️ Инструкция</div>
                <div style="font-size: 12px; color: #666; line-height: 1.5;">
                    • Клик по блоку — выделить<br>
                    • Тяните за углы — изменить размер<br>
                    • Двойной клик по тексту — редактировать
                </div>
            </div>
        `;

        document.body.appendChild(sidebar);

        // Кнопки
        document.getElementById('undoBtn')?.addEventListener('click', function() { window.undo(); });
        document.getElementById('redoBtn')?.addEventListener('click', function() { window.redo(); });
        document.getElementById('moveUpBtn')?.addEventListener('click', moveBlockUp);
        document.getElementById('moveDownBtn')?.addEventListener('click', moveBlockDown);
        document.getElementById('duplicateBtn')?.addEventListener('click', duplicateBlock);
        document.getElementById('deleteBtn')?.addEventListener('click', deleteBlock);
        document.getElementById('saveGitBtn')?.addEventListener('click', function() { window.saveToGitHub(); });
        document.getElementById('historyGitBtn')?.addEventListener('click', function() { window.showGitHubHistory(); });
        document.getElementById('clearTokenSidebarBtn')?.addEventListener('click', function() {
            if (confirm('Удалить сохранённый GitHub токен? При следующем сохранении нужно будет ввести заново.')) {
                clearToken();
            }
        });
    }

    function toggleSidebar() {
        isSidebarVisible = !isSidebarVisible;
        if (isSidebarVisible) {
            sidebar.classList.remove('hidden');
            document.body.classList.remove('sidebar-hidden');
        } else {
            sidebar.classList.add('hidden');
            document.body.classList.add('sidebar-hidden');
        }
    }

    function addSidebarToggleButton() {
        if (document.querySelector('.sidebar-toggle')) return;

        var btn = document.createElement('button');
        btn.className = 'sidebar-toggle';
        btn.innerHTML = '◀';
        btn.title = 'Скрыть панель';
        btn.onclick = function() {
            toggleSidebar();
            if (isSidebarVisible) {
                btn.innerHTML = '◀';
                btn.title = 'Скрыть панель';
            } else {
                btn.innerHTML = '▶';
                btn.title = 'Показать панель';
            }
        };

        document.body.appendChild(btn);
    }

    // ========== РЕЖИМ РЕДАКТИРОВАНИЯ ==========
    function makeBlocksEditable() {
        var selectors = [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div', 'span',
            '.role-card', '.service-card', '.benefit-card', '.process-card',
            '.stat-item', '.quiz-card', '.checklist-card', '.calendar-card',
            '.hero-content', '.hero-text', '.hero-image', '.small-note',
            '.contact-line', '.hero-title', '.hero-subtitle',
            '.section-title', '.process-title', 'img'
        ];

        var elements = document.querySelectorAll(selectors.join(','));
        console.log('🔍 Найдено элементов для редактирования:', elements.length);

        elements.forEach(function(el) {
            el.classList.add('editable-block');
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.transition = 'none';
        });

        document.querySelectorAll('.fade-up').forEach(function(el) {
            el.classList.add('visible');
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.transition = 'none';
        });

        return elements.length;
    }

    function enableEditMode() {
        console.log('🎨 Включение режима редактирования...');

        window.editorState.isEditMode = true;
        document.body.classList.add('block-edit-mode');

        document.querySelectorAll('.fade-up, .fade-in, .scale-in, .slide-in').forEach(function(el) {
            el.classList.add('visible');
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.transition = 'none';
        });

        var blockCount = makeBlocksEditable();
        console.log('✅ Добавлено блоков editable-block:', blockCount);

        createSidebar();
        addSidebarToggleButton();

        if (window.showToast) {
            window.showToast('🎨 Режим редактирования включён', 2000);
        }

        console.log('✅ Режим редактирования активен');
    }

    // ========== ОБРАБОТЧИКИ ==========
    function handleClick(e) {
        if (!window.editorState.isEditMode) return;
        if (window.isProtectedElement && window.isProtectedElement(e.target)) return;

        var block = window.getBlock ? window.getBlock(e.target) : null;

        if (block && !e.target.closest('.resize-marker') && !e.target.closest('.format-toolbar')) {
            e.preventDefault();
            e.stopPropagation();
            window.selectElement(block);
        } else if (!e.target.closest('.resize-marker') && !e.target.closest('.format-toolbar') && !e.target.closest('.editor-sidebar')) {
            window.clearSelection();
        }
    }

    function handleDoubleClick(e) {
        if (!window.editorState.isEditMode) return;
        if (window.isProtectedElement && window.isProtectedElement(e.target)) return;

        var textElement = e.target;
        var editableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'DIV'];

        while (textElement && !editableTags.includes(textElement.tagName)) {
            textElement = textElement.parentElement;
        }

        if (textElement && !textElement.closest('.resize-marker, .format-toolbar')) {
            e.preventDefault();
            e.stopPropagation();
            window.clearSelection();
            makeTextEditable(textElement);
        }
    }

    function makeTextEditable(element) {
        if (!element || element.contentEditable === 'true') return;

        element.contentEditable = 'true';
        element.focus();

        var rect = element.getBoundingClientRect();
        if (window.showFormatToolbar) window.showFormatToolbar(element, rect);

        element.addEventListener('blur', function() {
            element.contentEditable = 'false';
            window.hideFormatToolbar();
            window.saveToHistory();
            if (window.showToast) window.showToast('✅ Текст сохранён', 1500);
        }, { once: true });

        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.execCommand('insertLineBreak');
            }
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                document.execCommand('bold');
            }
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                document.execCommand('italic');
            }
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                document.execCommand('underline');
            }
        });
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initEditor() {
        console.log('🚀 Инициализация редактора...');

        if (window.initEditorHistory) window.initEditorHistory();

        enableEditMode();

        document.addEventListener('click', handleClick);
        document.addEventListener('dblclick', handleDoubleClick);

        console.log('✅ Редактор инициализирован');
        console.log('💡 Клик — выделить блок');
        console.log('💾 Кнопка "Сохранить на GitHub" — сохраняет сайт');
        console.log('📜 Кнопка "История коммитов" — восстанавливает из GitHub');
        console.log('🗑️ Кнопка "Удалить токен" — очищает сохранённый токен');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditor);
    } else {
        initEditor();
    }
})();