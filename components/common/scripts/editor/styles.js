// ========== СТИЛИ АДМИН-ПАНЕЛИ ==========
export const ADMIN_STYLES = `
    #adminToggle, .admin-toolbar, .admin-toolbar *, .save-toast, .grid-overlay,
    .element-delete-btn, .group-container, .group-label,
    .slides-panel, .slides-panel *, .slide-tile, .slide-tile *,
    .resize-handle, .resize-handle *,
    .crop-overlay, .crop-overlay *,
    .shape-selector, .shape-selector *,
    .text-editor-popup, .text-editor-popup *,
    .format-toolbar, .format-toolbar * {
        user-select: none !important;
        -webkit-user-select: none !important;
    }
    
    #adminToggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-weight: bold;
        transition: all 0.2s;
        border: 1px solid rgba(255,255,255,0.2);
    }
    #adminToggle:hover { transform: scale(1.02); background: #0056b3; }
    #adminToggle.admin-active { background: #dc3545; }
    
    .admin-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #fff;
        border-radius: 16px;
        padding: 15px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        gap: 10px;
        min-width: 260px;
        border: 1px solid rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
        background: rgba(255,255,255,0.98);
    }
    .admin-toolbar.show { display: flex; }
    .admin-toolbar button {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 10px;
        cursor: pointer;
        background: #f8f9fa;
        transition: all 0.1s;
        font-weight: 500;
    }
    .admin-toolbar button:hover { background: #e9ecef; transform: scale(1.01); border-color: #007bff; }
    .admin-toolbar .github-save { background: #24292e; color: white; border-color: #1a1e22; }
    .admin-toolbar .clear-token-btn { background: #dc3545; color: white; border-color: #c82333; }
    .admin-toolbar .duplicate-btn { background: #28a745; color: white; border-color: #218838; }
    .admin-toolbar .delete-btn { background: #dc3545; color: white; border-color: #c82333; }
    .admin-toolbar .crop-btn { background: #ff9800; color: white; border-color: #e68900; }
    .admin-toolbar .new-panel-btn { background: #17a2b8; color: white; border-color: #138496; }
    .admin-toolbar .new-image-btn { background: #6f42c1; color: white; border-color: #5a3396; }
    .admin-toolbar .group-btn { background: #fd7e14; color: white; border-color: #e06c03; }
    .admin-toolbar .danger { background: #6c757d; color: white; border-color: #5a6268; }
    .admin-toolbar .resize-text-btn { background: #20c997; color: white; border-color: #1ba87e; }
    
    /* Панель слайдов */
    .slides-panel {
        position: fixed;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 320px;
        max-height: 85vh;
        background: rgba(255,255,255,0.98);
        border-radius: 20px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
    }
    .slides-panel.show { display: flex; }
    .slides-panel.minimized { width: 50px; background: #2D6A9F; }
    .slides-panel.minimized .slides-panel-header span,
    .slides-panel.minimized .slides-list { display: none; }
    
    .slides-panel-header {
        padding: 14px 18px;
        background: #2D6A9F;
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    .slides-panel-header button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 8px;
    }
    .slides-panel-header button:hover { background: rgba(255,255,255,0.3); }
    
    .slides-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .slide-tile {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #e0e0e0;
        transition: all 0.2s;
        cursor: pointer;
    }
    .slide-tile:hover { background: #e9ecef; transform: translateX(3px); }
    .slide-tile.selected-slide {
        background: #007bff;
        color: white;
        border-color: #007bff;
        box-shadow: 0 2px 8px rgba(0,123,255,0.3);
    }
    
    .slide-number {
        width: 30px;
        height: 30px;
        background: #2D6A9F;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
    }
    .slide-tile.selected-slide .slide-number {
        background: white;
        color: #007bff;
    }
    
    .slide-preview {
        width: 45px;
        height: 45px;
        background: #e0e0e0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        overflow: hidden;
    }
    .slide-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .slide-info { flex: 1; min-width: 0; }
    .slide-title {
        font-size: 13px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .slide-subtitle {
        font-size: 10px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .slide-tile.selected-slide .slide-subtitle { color: rgba(255,255,255,0.8); }
    
    .slide-actions {
        display: flex;
        gap: 4px;
    }
    .slide-actions button {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 5px;
        border-radius: 6px;
    }
    .slide-actions button:hover { background: rgba(0,0,0,0.1); transform: scale(1.05); }
    
    /* Редактор текста */
    .text-editor-popup {
        position: fixed;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        z-index: 10007;
        display: none;
        flex-direction: column;
        min-width: 320px;
        border: 1px solid rgba(0,0,0,0.1);
        overflow: hidden;
    }
    .text-editor-popup.show { display: flex; }
    .text-editor-header {
        padding: 12px 15px;
        background: #2D6A9F;
        color: white;
        font-weight: bold;
        font-size: 13px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .text-editor-header button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
    }
    .text-editor-textarea { padding: 15px; }
    .text-editor-textarea textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        line-height: 1.5;
        box-sizing: border-box;
        resize: vertical;
    }
    .text-editor-textarea textarea:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
    .text-editor-buttons {
        display: flex;
        gap: 10px;
        padding: 0 15px 15px 15px;
    }
    .text-editor-buttons button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
    }
    .text-save-btn { background: #28a745; color: white; }
    .text-save-btn:hover { background: #218838; }
    .text-cancel-btn { background: #dc3545; color: white; }
    .text-cancel-btn:hover { background: #c82333; }
    
    /* Панель форматирования */
    .format-toolbar {
        position: fixed;
        background: white;
        border-radius: 12px;
        padding: 8px 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        gap: 6px;
        z-index: 10008;
        border: 1px solid #ddd;
    }
    .format-toolbar button {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 13px;
    }
    .format-toolbar button:hover { background: #e0e0e0; transform: scale(1.02); }
    .format-toolbar button.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }
    .format-toolbar .separator {
        width: 1px;
        height: 24px;
        background: #ddd;
        margin: 0 4px;
    }
    
    /* Формы фото */
    .shape-selector {
        position: absolute;
        bottom: -45px;
        left: 0;
        background: white;
        border-radius: 12px;
        padding: 6px 8px;
        display: flex;
        gap: 6px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10011;
        border: 1px solid #ddd;
    }
    .shape-btn {
        width: 34px;
        height: 34px;
        border: 1px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }
    .shape-btn:hover { background: #e0e0e0; transform: scale(1.05); }
    .shape-btn.active { border-color: #007bff; background: #007bff20; }
    
    .img-shape-circle { border-radius: 50% !important; object-fit: cover; }
    .img-shape-oval { border-radius: 50% / 60% !important; object-fit: cover; }
    .img-shape-square { border-radius: 12px !important; }
    .img-shape-rounded { border-radius: 30px !important; }
    .img-shape-hexagon { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
    .img-shape-pentagon { clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); }
    
    /* Выделение элементов */
    .editable-object {
        outline: 2px dashed #007bff;
        outline-offset: 2px;
        cursor: pointer;
        position: relative;
        transition: outline 0.1s ease;
    }
    .editable-object.selected {
        outline: 3px solid #ff9800;
        background: rgba(255,152,0,0.05);
    }
    
    /* Ручки ресайза */
    .resize-handle {
        position: absolute;
        background: white;
        border: 2px solid #ff9800;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        z-index: 10010;
        pointer-events: auto;
        cursor: nw-resize;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .resize-handle:hover { background: #ff9800; transform: scale(1.2); }
    .resize-handle.font-resize {
        background: #20c997;
        border-color: #20c997;
        cursor: ns-resize;
    }
    .resize-handle.font-resize:hover { background: #1ba87e; }
    
    /* Кнопка удаления */
    .element-delete-btn {
        position: absolute;
        top: -12px;
        right: -12px;
        width: 26px;
        height: 26px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .element-delete-btn:hover { transform: scale(1.1); background: #c82333; }
    
    /* Сетка */
    .grid-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9995;
        background-image: linear-gradient(to right, rgba(0,123,255,0.15) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0,123,255,0.15) 1px, transparent 1px);
        background-size: 20px 20px;
    }
    
    /* Обрезка фото */
    .crop-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 20000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .crop-container {
        position: relative;
        background: #1a1a1a;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.2);
    }
    .crop-image { display: block; max-width: 85vw; max-height: 70vh; cursor: crosshair; }
    .crop-area {
        position: absolute;
        border: 2px solid #ff9800;
        background: rgba(0,123,255,0.2);
        cursor: move;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);
    }
    .crop-resize-handle {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #ff9800;
        border-radius: 50%;
        border: 1px solid white;
    }
    .crop-resize-handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
    .crop-resize-handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .crop-resize-handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
    .crop-resize-handle.w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
    .crop-resize-handle.e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }
    .crop-resize-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
    .crop-resize-handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .crop-resize-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
    
    .crop-buttons {
        margin-top: 20px;
        display: flex;
        gap: 15px;
    }
    .crop-buttons button {
        padding: 12px 28px;
        border: none;
        border-radius: 50px;
        font-size: 16px;
        cursor: pointer;
        font-weight: bold;
    }
    .crop-apply { background: #28a745; color: white; }
    .crop-apply:hover { background: #218838; }
    .crop-cancel { background: #dc3545; color: white; }
    .crop-cancel:hover { background: #c82333; }
    
    .save-toast {
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        z-index: 10002;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-weight: 500;
    }
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeOut {
        to { opacity: 0; visibility: hidden; }
    }
    
    .group-container {
        border: 2px solid #fd7e14;
        border-radius: 16px;
        padding: 15px;
        margin: 10px 0;
        position: relative;
        background: rgba(253,126,20,0.03);
    }
    .group-label {
        position: absolute;
        top: -12px;
        left: 15px;
        background: #fd7e14;
        color: white;
        padding: 2px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .new-panel-template {
        background: white;
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        text-align: center;
        border: 1px solid #e0e0e0;
    }
    
    #editHint {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #ff9800;
        color: white;
        padding: 8px 18px;
        border-radius: 30px;
        font-size: 12px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .size-indicator {
        position: fixed;
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        z-index: 10011;
        pointer-events: none;
        font-family: monospace;
        backdrop-filter: blur(4px);
    }

        
        /* Панель форматирования */
        .format-toolbar {
            position: fixed;
            background: white;
            border-radius: 12px;
            padding: 8px 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            display: none;
            gap: 6px;
            z-index: 10008;
            border: 1px solid #ddd;
            flex-wrap: wrap;
            max-width: 90vw;
        }
        .format-toolbar button {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.1s;
        }
        .format-toolbar button:hover {
            background: #e0e0e0;
            transform: scale(1.02);
        }
        .format-toolbar button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        .format-toolbar .separator {
            width: 1px;
            height: 24px;
            background: #ddd;
            margin: 0 4px;
        }
        .format-toolbar select,
        .format-toolbar input {
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
        }
        .format-toolbar input[type="color"] {
            width: 32px;
            height: 32px;
            padding: 2px;
        }
        
        /* Редактируемый элемент */
        [contenteditable="true"] {
            outline: 2px solid #ff9800 !important;
            background-color: rgba(255,152,0,0.05) !important;
            cursor: text !important;
            min-height: 50px;
        }
            
`;