/* ==========================================================================
   CODEVISION CORE APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // DOM Elements
    // ---------------------------------------------------------
    const runBtn = document.getElementById('runBtn');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const projectSidebar = document.getElementById('projectSidebar');
    const currentProjectDisplay = document.getElementById('currentProjectDisplay');
    const renameProjectBtn = document.getElementById('renameProjectBtn');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectList = document.getElementById('projectList');
    
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const downloadCodeBtn = document.getElementById('downloadCodeBtn');
    const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
    const resultFrame = document.getElementById('resultFrame');
    
    // Console DOM
    const consolePanel = document.getElementById('consolePanel');
    const consoleHeader = document.getElementById('consoleHeader');
    const toggleConsoleBtn = document.getElementById('toggleConsoleBtn');
    const clearConsoleBtn = document.getElementById('clearConsoleBtn');
    const consoleLogs = document.getElementById('consoleLogs');
    const consoleLogCount = document.getElementById('consoleLogCount');
    const consoleFilterBtns = document.querySelectorAll('.console-filter-btn');
    
    // Settings DOM
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.querySelectorAll('#closeSettingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const tabSizeSelect = document.getElementById('tabSizeSelect');
    const autoRefreshCheckbox = document.getElementById('autoRefreshCheckbox');
    const autoSaveCheckbox = document.getElementById('autoSaveCheckbox');
    const importFileSelector = document.getElementById('importFileSelector');
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    const importBackupSelector = document.getElementById('importBackupSelector');
    
    // Library DOM
    const openLibraryBtn = document.getElementById('openLibraryBtn');
    const closeLibrariesBtn = document.getElementById('closeLibrariesBtn');
    const librariesOverlay = document.getElementById('librariesOverlay');
    const libCards = document.querySelectorAll('.lib-card');
    
    // Notification DOM
    const appNotification = document.getElementById('appNotification');

    // ---------------------------------------------------------
    // Application State Variables
    // ---------------------------------------------------------
    let projects = [];
    let activeProjectId = null;
    let htmlEditor, cssEditor, jsEditor;
    let consoleMessages = []; // Cache console messages: { type: 'log'|'warn'|'error', text: string, time: string }
    let activeFilter = 'all';
    
    // Debounce Timers
    let typingTimer;
    let saveTimer;
    
    // Default Code Template (Glassmorphism Sample)
    const DEFAULT_HTML_TEMPLATE = `<!-- کد HTML خود را اینجا بنویسید -->
<div class="glass-card">
    <h1><i class="fas fa-crown"></i> استودیو کدویژن</h1>
    <p>محیط توسعه زنده و مدرن وب با طراحی شیشه‌ای و ابزارهای پیشرفته</p>
    <div class="divider"></div>
    <div class="stats-panel">
        <div class="stat-item">
            <span class="stat-title">تعداد کلیک:</span>
            <span class="stat-number" id="clickCounter">0</span>
        </div>
        <button class="action-btn" id="clickBtn">
            <i class="fas fa-magic"></i> کلیک کن!
        </button>
    </div>
</div>`;

    const DEFAULT_CSS_TEMPLATE = `/* استایل‌های CSS خود را اینجا بنویسید */
body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f8fafc;
    direction: rtl;
}

.glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 30px;
    width: 90%;
    max-width: 450px;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

h1 {
    font-size: 1.8rem;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p {
    font-size: 0.9rem;
    color: #94a3b8;
    line-height: 1.6;
}

.divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 20px 0;
}

.stats-panel {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(0, 0, 0, 0.2);
    padding: 12px;
    border-radius: 16px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-title {
    font-size: 0.75rem;
    color: #64748b;
}

.stat-number {
    font-size: 1.6rem;
    font-weight: 700;
    color: #fbbf24;
}

.action-btn {
    background: #6366f1;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 30px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.action-btn:hover {
    transform: translateY(-2px);
    background: #4f46e5;
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}`;

    const DEFAULT_JS_TEMPLATE = `// کدهای جاوااسکریپت خود را اینجا بنویسید
console.log("استودیو کدویژن آماده به کار است! 🚀");

let count = 0;
const clickBtn = document.getElementById('clickBtn');
const counterDisplay = document.getElementById('clickCounter');

if (clickBtn && counterDisplay) {
    clickBtn.addEventListener('click', () => {
        count++;
        counterDisplay.textContent = count;
        console.log("دکمه کلیک شد. مقدار جدید شمارنده: " + count);
        
        // جلوه انیمیشن ساده
        counterDisplay.style.transform = 'scale(1.2)';
        setTimeout(() => {
            counterDisplay.style.transform = 'scale(1)';
        }, 100);
    });
}`;

    // ---------------------------------------------------------
    // Storage Wrapper API (Supports Extension storage & LocalStorage)
    // ---------------------------------------------------------
    const db = {
        get: async (key) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                return new Promise((resolve) => {
                    chrome.storage.local.get([key], (result) => resolve(result[key]));
                });
            } else {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch(e) {
                    return null;
                }
            }
        },
        set: async (key, val) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                return new Promise((resolve) => {
                    chrome.storage.local.set({ [key]: val }, () => resolve());
                });
            } else {
                localStorage.setItem(key, JSON.stringify(val));
            }
        }
    };

    // ---------------------------------------------------------
    // Helper: Show Beautiful Custom Notifications
    // ---------------------------------------------------------
    function showNotification(message, type = 'success') {
        const notifText = appNotification.querySelector('.notification-text');
        const notifIcon = appNotification.querySelector('i');
        
        notifText.textContent = message;
        
        // Reset classes
        appNotification.className = 'custom-notification';
        
        if (type === 'error') {
            appNotification.classList.add('error');
            notifIcon.className = 'fas fa-exclamation-circle';
        } else {
            notifIcon.className = 'fas fa-check-circle';
        }
        
        appNotification.classList.add('show');
        
        clearTimeout(appNotification.timeoutId);
        appNotification.timeoutId = setTimeout(() => {
            appNotification.classList.remove('show');
        }, 2500);
    }

    // ---------------------------------------------------------
    // Initialization: CodeMirror Configuration
    // ---------------------------------------------------------
    function initEditors() {
        // Base options common to all editors
        const baseOptions = {
            lineNumbers: true,
            theme: 'dracula',
            autoCloseBrackets: true,
            lineWrapping: true,
            tabSize: 4,
            indentUnit: 4,
            direction: 'ltr',
            viewportMargin: Infinity
        };

        // Initialize HTML Editor
        htmlEditor = CodeMirror(document.getElementById('htmlEditorContainer'), {
            ...baseOptions,
            value: '',
            mode: 'htmlmixed',
            autoCloseTags: true
        });

        // Initialize CSS Editor
        cssEditor = CodeMirror(document.getElementById('cssEditorContainer'), {
            ...baseOptions,
            value: '',
            mode: 'css'
        });

        // Initialize JS Editor
        jsEditor = CodeMirror(document.getElementById('jsEditorContainer'), {
            ...baseOptions,
            value: '',
            mode: 'javascript'
        });

        // Event listener for editor changes: Auto-refresh & Auto-save
        [htmlEditor, cssEditor, jsEditor].forEach(editor => {
            editor.on('change', () => {
                if (autoRefreshCheckbox.checked) {
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(renderPreview, 600);
                }
                
                if (autoSaveCheckbox.checked) {
                    clearTimeout(saveTimer);
                    saveTimer = setTimeout(saveActiveProjectData, 1000);
                }
            });
        });

        // Set initial font-size and tab-size settings from elements
        applyEditorSettings();
    }

    // ---------------------------------------------------------
    // Editor Settings Controller
    // ---------------------------------------------------------
    function applyEditorSettings() {
        const fontSize = fontSizeSelect.value;
        const tabSize = parseInt(tabSizeSelect.value, 10);

        // Update CSS property for all CodeMirror DOM elements
        document.documentElement.style.setProperty('--editor-font-size', fontSize);

        // Update tab spacing properties
        [htmlEditor, cssEditor, jsEditor].forEach(editor => {
            if (editor) {
                editor.setOption('tabSize', tabSize);
                editor.setOption('indentUnit', tabSize);
            }
        });
    }

    // ---------------------------------------------------------
    // Tabs Navigation Controller
    // ---------------------------------------------------------
    const tabBtns = document.querySelectorAll('.tab-btn');
    const editorContainers = document.querySelectorAll('.editor-container');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active status
            tabBtns.forEach(b => b.classList.remove('active'));
            editorContainers.forEach(c => c.classList.remove('active'));

            // Set clicked button active
            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            
            // Show selected editor container
            const container = document.getElementById(`${targetTab}EditorContainer`);
            container.classList.add('active');

            // CRITICAL: CodeMirror refresh is required to correctly compute lines layout
            if (targetTab === 'html') htmlEditor.refresh();
            if (targetTab === 'css') cssEditor.refresh();
            if (targetTab === 'js') jsEditor.refresh();
            
            // Set focus
            const activeCM = targetTab === 'html' ? htmlEditor : (targetTab === 'css' ? cssEditor : jsEditor);
            activeCM.focus();
        });
    });

    // ---------------------------------------------------------
    // Database and Project Management Logic
    // ---------------------------------------------------------
    async function loadProjects() {
        const storedProjects = await db.get('codevision_projects');
        const storedActiveId = await db.get('codevision_active_project_id');
        
        if (storedProjects && storedProjects.length > 0) {
            projects = storedProjects;
            activeProjectId = storedActiveId || projects[0].id;
        } else {
            // Seed a default project
            const defaultProj = {
                id: 'proj_' + Date.now(),
                name: 'پروژه نمونه کدویژن',
                html: DEFAULT_HTML_TEMPLATE,
                css: DEFAULT_CSS_TEMPLATE,
                js: DEFAULT_JS_TEMPLATE,
                updated: Date.now()
            };
            projects = [defaultProj];
            activeProjectId = defaultProj.id;
            await saveProjectsToDB();
        }

        renderProjectSidebar();
        loadActiveProjectToEditors();
    }

    async function saveProjectsToDB() {
        await db.set('codevision_projects', projects);
        await db.set('codevision_active_project_id', activeProjectId);
    }

    function renderProjectSidebar() {
        projectList.innerHTML = '';
        projects.forEach(proj => {
            const li = document.createElement('li');
            li.className = `project-item ${proj.id === activeProjectId ? 'active' : ''}`;
            li.setAttribute('data-id', proj.id);
            
            li.innerHTML = `
                <div class="project-item-details">
                    <i class="fas fa-file-code project-item-icon"></i>
                    <span class="project-item-title">${proj.name}</span>
                </div>
                <div class="project-item-actions">
                    <button class="btn-mini-action rename-item-btn" data-tooltip="تغییر نام">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-mini-action delete-item-btn" data-tooltip="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            // Click handler to load project
            li.addEventListener('click', (e) => {
                // Prevent trigger when clicking action buttons
                if (e.target.closest('.btn-mini-action')) return;
                selectProject(proj.id);
            });

            // Rename handler inside sidebar
            li.querySelector('.rename-item-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                promptRenameProject(proj.id);
            });

            // Delete handler inside sidebar
            li.querySelector('.delete-item-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                confirmDeleteProject(proj.id);
            });

            projectList.appendChild(li);
        });

        // Update header label
        const activeProj = projects.find(p => p.id === activeProjectId);
        if (activeProj) {
            currentProjectDisplay.textContent = activeProj.name;
        }
    }

    function selectProject(id) {
        if (activeProjectId === id) return;
        
        // Auto-save current project data first
        saveActiveProjectDataSync();
        
        activeProjectId = id;
        loadActiveProjectToEditors();
        renderProjectSidebar();
        
        // Open/refresh preview
        renderPreview();
        
        showNotification('پروژه با موفقیت بارگذاری شد');
    }

    function loadActiveProjectToEditors() {
        const activeProj = projects.find(p => p.id === activeProjectId);
        if (activeProj) {
            htmlEditor.setValue(activeProj.html || '');
            cssEditor.setValue(activeProj.css || '');
            jsEditor.setValue(activeProj.js || '');
            
            // Clear consoles on new project load
            clearLogs();
            
            // Refresh editor layouts
            setTimeout(() => {
                htmlEditor.refresh();
                cssEditor.refresh();
                jsEditor.refresh();
            }, 50);
        }
    }

    function saveActiveProjectData() {
        const activeProj = projects.find(p => p.id === activeProjectId);
        if (activeProj) {
            activeProj.html = htmlEditor.getValue();
            activeProj.css = cssEditor.getValue();
            activeProj.js = jsEditor.getValue();
            activeProj.updated = Date.now();
            saveProjectsToDB();
        }
    }

    // Synchronous save version to run before switching
    function saveActiveProjectDataSync() {
        const activeProj = projects.find(p => p.id === activeProjectId);
        if (activeProj) {
            activeProj.html = htmlEditor.getValue();
            activeProj.css = cssEditor.getValue();
            activeProj.js = jsEditor.getValue();
            activeProj.updated = Date.now();
            
            // Write to localStorage/Extension storage synchronously
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ 
                    'codevision_projects': projects,
                    'codevision_active_project_id': activeProjectId
                });
            } else {
                localStorage.setItem('codevision_projects', JSON.stringify(projects));
                localStorage.setItem('codevision_active_project_id', activeProjectId);
            }
        }
    }

    // Create New Project Handler
    newProjectBtn.addEventListener('click', async () => {
        const projName = prompt('نام پروژه جدید را وارد کنید:', 'پروژه بدون نام');
        if (projName === null) return;
        
        const cleanName = projName.trim() || 'پروژه جدید';
        const newProj = {
            id: 'proj_' + Date.now(),
            name: cleanName,
            html: `<!-- پروژه جدید ${cleanName} -->\n<h1>سلام دنیا!</h1>`,
            css: '/* استایل‌های پروژه جدید */\nbody {\n  padding: 20px;\n  color: #333;\n}',
            js: '// کدهای جاوااسکریپت\nconsole.log("پروژه جدید ایجاد شد!");',
            updated: Date.now()
        };

        // Save current active project values
        saveActiveProjectDataSync();
        
        projects.push(newProj);
        activeProjectId = newProj.id;
        
        await saveProjectsToDB();
        renderProjectSidebar();
        loadActiveProjectToEditors();
        renderPreview();
        
        showNotification('پروژه جدید با موفقیت ایجاد شد');
    });

    // Rename Project Handler
    function promptRenameProject(id) {
        const proj = projects.find(p => p.id === id);
        if (!proj) return;
        
        const newName = prompt('نام جدید پروژه را وارد کنید:', proj.name);
        if (newName === null) return;
        
        const cleanName = newName.trim();
        if (cleanName === '') return;
        
        proj.name = cleanName;
        saveProjectsToDB();
        renderProjectSidebar();
        showNotification('تغییر نام با موفقیت انجام شد');
    }

    renameProjectBtn.addEventListener('click', () => {
        promptRenameProject(activeProjectId);
    });

    // Delete Project Handler
    function confirmDeleteProject(id) {
        if (projects.length <= 1) {
            alert('حداقل باید یک پروژه وجود داشته باشد و امکان حذف تک‌پروژه نیست!');
            return;
        }

        const proj = projects.find(p => p.id === id);
        if (!proj) return;

        if (confirm(`آیا از حذف پروژه "${proj.name}" مطمئن هستید؟`)) {
            projects = projects.filter(p => p.id !== id);
            
            if (activeProjectId === id) {
                activeProjectId = projects[0].id;
                loadActiveProjectToEditors();
            }
            
            saveProjectsToDB();
            renderProjectSidebar();
            renderPreview();
            showNotification('پروژه با موفقیت حذف شد');
        }
    }

    // Toggle Sidebar Action
    toggleSidebarBtn.addEventListener('click', () => {
        projectSidebar.classList.toggle('collapsed');
    });

    // ---------------------------------------------------------
    // Collapsible Console Log capturing
    // ---------------------------------------------------------
    
    // Injectable script to capture iframe logs and redirect them using postMessage
    const consoleCaptureScript = `
    <script>
      (function() {
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _info = console.info;

        function serialize(val, seen = new WeakSet()) {
            if (val === null) return 'null';
            if (val === undefined) return 'undefined';
            if (typeof val === 'string') return '"' + val + '"';
            if (typeof val === 'number' || typeof val === 'boolean') return String(val);
            if (typeof val === 'function') return '[Function: ' + (val.name || 'anonymous') + ']';
            if (val instanceof Error) return val.message;
            
            if (typeof val === 'object') {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
                
                if (Array.isArray(val)) {
                    const elements = val.map(item => serialize(item, seen)).join(', ');
                    return '[' + elements + ']';
                }
                
                try {
                    const keys = Object.keys(val);
                    if (keys.length === 0) return '{}';
                    const props = keys.map(k => k + ': ' + serialize(val[k], seen)).join(', ');
                    return '{ ' + props + ' }';
                } catch(e) {
                    return String(val);
                }
            }
            return String(val);
        }

        function sendLog(type, args) {
            const messages = Array.from(args).map(arg => typeof arg === 'string' ? arg : serialize(arg));
            window.parent.postMessage({
                source: 'codevision-iframe',
                type: type,
                messages: messages
            }, '*');
        }

        console.log = function() {
            sendLog('log', arguments);
            _log.apply(console, arguments);
        };
        console.warn = function() {
            sendLog('warn', arguments);
            _warn.apply(console, arguments);
        };
        console.error = function() {
            sendLog('error', arguments);
            _error.apply(console, arguments);
        };
        console.info = function() {
            sendLog('info', arguments);
            _info.apply(console, arguments);
        };

        window.onerror = function(message, source, lineno, colno, error) {
            sendLog('error', [message + ' (line ' + lineno + ')']);
            return false;
        };
      })();
    <\/script>
    `;

    // Listen to iframe logs
    window.addEventListener('message', (event) => {
        if (event.data && event.data.source === 'codevision-iframe') {
            const logType = event.data.type;
            const content = event.data.messages.join(' ');
            addConsoleLog(logType, content);
        }
    });

    function addConsoleLog(type, text) {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        
        const logObj = { type, text, time: timeStr };
        consoleMessages.push(logObj);
        
        renderConsoleLogs();
    }

    function renderConsoleLogs() {
        consoleLogs.innerHTML = '';
        
        const filtered = consoleMessages.filter(msg => {
            if (activeFilter === 'all') return true;
            return msg.type === activeFilter;
        });

        filtered.forEach(msg => {
            const line = document.createElement('div');
            line.className = `console-log-line ${msg.type}`;
            
            // Format icon based on type
            let iconClass = 'fa-info-circle';
            if (msg.type === 'warn') iconClass = 'fa-exclamation-triangle';
            if (msg.type === 'error') iconClass = 'fa-times-circle';

            line.innerHTML = `
                <span class="console-log-time">[${msg.time}]</span>
                <i class="fas ${iconClass}"></i>
                <span class="console-log-text">${escapeHTML(msg.text)}</span>
            `;
            consoleLogs.appendChild(line);
        });

        // Scroll to bottom
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
        
        // Update total counter
        consoleLogCount.textContent = consoleMessages.length;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function clearLogs() {
        consoleMessages = [];
        consoleLogCount.textContent = '0';
        consoleLogs.innerHTML = '';
    }

    // Toggle Console Area Height
    function toggleConsole() {
        consolePanel.classList.toggle('collapsed');
        const icon = toggleConsoleBtn.querySelector('i');
        if (consolePanel.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-up';
        } else {
            icon.className = 'fas fa-chevron-down';
        }
    }

    consoleHeader.addEventListener('click', (e) => {
        // Prevent toggle if filter or clear buttons were clicked
        if (e.target.closest('.console-actions')) return;
        toggleConsole();
    });

    toggleConsoleBtn.addEventListener('click', toggleConsole);
    clearConsoleBtn.addEventListener('click', clearLogs);

    // Filter Buttons Controller
    consoleFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            consoleFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter');
            renderConsoleLogs();
        });
    });

    // ---------------------------------------------------------
    // Live Preview Rendering Logic
    // ---------------------------------------------------------
    function renderPreview() {
        const htmlCode = htmlEditor.getValue();
        const cssCode = cssEditor.getValue();
        const jsCode = jsEditor.getValue();

        // Parse and combine page code structure
        let documentBlob = '';

        // Inject styles inside head and capture script inside body
        if (htmlCode.trim().toLowerCase().includes('<html')) {
            // Document already has structure, try to inject styles/scripts dynamically
            let parsedHTML = htmlCode;
            
            // Inject console logger and css styles inside head
            if (parsedHTML.includes('</head>')) {
                parsedHTML = parsedHTML.replace('</head>', `${consoleCaptureScript}\n<style>${cssCode}</style>\n</head>`);
            } else {
                parsedHTML = consoleCaptureScript + `\n<style>${cssCode}</style>\n` + parsedHTML;
            }
            
            // Inject user javascript before ending body tag
            if (parsedHTML.includes('</body>')) {
                parsedHTML = parsedHTML.replace('</body>', `<script>${jsCode}</script>\n</body>`);
            } else {
                parsedHTML = parsedHTML + `\n<script>${jsCode}</script>`;
            }
            documentBlob = parsedHTML;
        } else {
            // Standard layout wrapper
            documentBlob = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    ${consoleCaptureScript}
    <style>
        ${cssCode}
    </style>
</head>
<body>
    ${htmlCode}
    <script>
        ${jsCode}
    </script>
</body>
</html>`;
        }

        // Clear console before running new code
        clearLogs();
        
        // Update iframe preview using srcdoc
        resultFrame.srcdoc = documentBlob;
    }

    runBtn.addEventListener('click', () => {
        renderPreview();
        saveActiveProjectData();
        showNotification('کد با موفقیت اجرا شد');
    });

    refreshPreviewBtn.addEventListener('click', () => {
        renderPreview();
        showNotification('پیش‌نمایش مجدداً بارگذاری شد');
    });

    // ---------------------------------------------------------
    // Editor Action utilities (Copy, Download)
    // ---------------------------------------------------------
    copyCodeBtn.addEventListener('click', () => {
        const combined = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${currentProjectDisplay.textContent}</title>
    <style>
        ${cssEditor.getValue()}
    </style>
</head>
<body>
    ${htmlEditor.getValue()}
    <script>
        ${jsEditor.getValue()}
    </script>
</body>
</html>`;

        navigator.clipboard.writeText(combined)
            .then(() => showNotification('کل کدهای پروژه کپی شد'))
            .catch(() => showNotification('خطا در کپی کدهای پروژه', 'error'));
    });

    downloadCodeBtn.addEventListener('click', () => {
        const combined = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${currentProjectDisplay.textContent}</title>
    <style>
        ${cssEditor.getValue()}
    </style>
</head>
<body>
    ${htmlEditor.getValue()}
    <script>
        ${jsEditor.getValue()}
    </script>
</body>
</html>`;

        const blob = new Blob([combined], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProjectDisplay.textContent.replace(/\s+/g, '_') || 'project'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('فایل خروجی HTML دانلود شد');
    });

    // ---------------------------------------------------------
    // CDN Libraries Injection logic
    // ---------------------------------------------------------
    openLibraryBtn.addEventListener('click', () => {
        librariesOverlay.classList.add('show');
        updateLibrariesUI();
    });

    closeLibrariesBtn.addEventListener('click', () => {
        librariesOverlay.classList.remove('show');
    });

    function updateLibrariesUI() {
        const html = htmlEditor.getValue();
        
        libCards.forEach(card => {
            const key = card.getAttribute('data-cdn');
            const btn = card.querySelector('.btn-lib-add');
            
            // Check if CDN is already inside code
            const isAdded = checkLibraryExists(key, html);
            if (isAdded) {
                btn.textContent = 'حذف کتابخانه';
                btn.classList.add('added');
            } else {
                btn.textContent = 'افزودن';
                btn.classList.remove('added');
            }
        });
    }

    const cdnLibraryMap = {
        tailwind: '<script src="https://cdn.tailwindcss.com"></script>',
        bootstrap: '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css" rel="stylesheet">',
        fontawesome: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
        jquery: '<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>',
        react: '<script src="https://unpkg.com/react@18/umd/react.development.js"></script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>',
        animate: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">'
    };

    function checkLibraryExists(key, code) {
        const tag = cdnLibraryMap[key];
        if (!tag) return false;
        
        // Split react because it contains two lines
        if (key === 'react') {
            return code.includes('react.development.js');
        }
        return code.includes(tag.trim()) || code.includes(key);
    }

    libCards.forEach(card => {
        const btn = card.querySelector('.btn-lib-add');
        const cdnKey = card.getAttribute('data-cdn');

        btn.addEventListener('click', () => {
            let html = htmlEditor.getValue();
            const tag = cdnLibraryMap[cdnKey];
            const isAdded = btn.classList.contains('added');

            if (isAdded) {
                // Remove Library tag from HTML
                if (cdnKey === 'react') {
                    // Remove both react tags
                    html = html.replace(/<script src="[^"]*react[^"]*"><\/script>\n?/gi, '');
                } else {
                    const escapedTag = tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const regex = new RegExp(escapedTag + '\\n?', 'g');
                    html = html.replace(regex, '');
                }
                htmlEditor.setValue(html);
                showNotification('کتابخانه با موفقیت حذف شد');
            } else {
                // Add Library tag to HTML
                if (html.includes('</head>')) {
                    html = html.replace('</head>', `    ${tag}\n</head>`);
                } else if (html.trim().startsWith('<!DOCTYPE') || html.includes('<html>')) {
                    // Insert before html ends or in head if found
                    html = html.replace(/<head>/i, `<head>\n    ${tag}`);
                } else {
                    html = tag + '\n' + html;
                }
                htmlEditor.setValue(html);
                showNotification('کتابخانه به پروژه اضافه شد');
            }

            updateLibrariesUI();
            renderPreview();
        });
    });

    // ---------------------------------------------------------
    // Settings Actions & Import/Export
    // ---------------------------------------------------------
    openSettingsBtn.addEventListener('click', () => {
        settingsOverlay.classList.add('show');
    });

    closeSettingsBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsOverlay.classList.remove('show');
        });
    });

    // Handle background click to close modals
    [settingsOverlay, librariesOverlay].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    fontSizeSelect.addEventListener('change', () => {
        applyEditorSettings();
        db.set('codevision_setting_fontsize', fontSizeSelect.value);
    });

    tabSizeSelect.addEventListener('change', () => {
        applyEditorSettings();
        db.set('codevision_setting_tabsize', tabSizeSelect.value);
    });

    autoRefreshCheckbox.addEventListener('change', () => {
        db.set('codevision_setting_autorefresh', autoRefreshCheckbox.checked);
    });

    autoSaveCheckbox.addEventListener('change', () => {
        db.set('codevision_setting_autosave', autoSaveCheckbox.checked);
    });

    // Import Single HTML file and split into HTML/CSS/JS
    importFileSelector.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            const content = evt.target.result;
            
            // Splitting logic
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // Extract styles
            let cssContent = '';
            const styles = doc.querySelectorAll('style');
            styles.forEach(style => {
                cssContent += style.textContent + '\n';
                style.remove();
            });
            
            // Extract scripts
            let jsContent = '';
            const scripts = doc.querySelectorAll('script');
            scripts.forEach(script => {
                if (!script.src) {
                    jsContent += script.textContent + '\n';
                    script.remove();
                }
            });

            // Reconstruct HTML body content
            let htmlContent = '';
            // If body has content, get its innerHTML, otherwise use documentElement's innerHTML
            if (doc.body && doc.body.innerHTML.trim().length > 0) {
                htmlContent = doc.body.innerHTML;
            } else {
                htmlContent = content; // fallback
            }

            // Create a new project with the imported data
            const cleanProjName = file.name.replace(/\.[^/.]+$/, "") + " (وارد شده)";
            const importedProj = {
                id: 'proj_' + Date.now(),
                name: cleanProjName,
                html: htmlContent.trim(),
                css: cssContent.trim() || '/* استایل‌های وارد شده */',
                js: jsContent.trim() || '// کدهای وارد شده',
                updated: Date.now()
            };

            saveActiveProjectDataSync();
            
            projects.push(importedProj);
            activeProjectId = importedProj.id;
            
            saveProjectsToDB().then(() => {
                renderProjectSidebar();
                loadActiveProjectToEditors();
                renderPreview();
                settingsOverlay.classList.remove('show');
                showNotification('فایل HTML با موفقیت تفکیک و وارد شد');
            });
        };
        reader.readAsText(file);
    });

    // Export entire database backup (JSON)
    exportBackupBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            projects: projects,
            settings: {
                fontSize: fontSizeSelect.value,
                tabSize: tabSizeSelect.value,
                autoRefresh: autoRefreshCheckbox.checked,
                autoSave: autoSaveCheckbox.checked
            }
        }));
        
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `codevision_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('پشتیبان از پروژه‌ها ذخیره شد');
    });

    // Import database backup
    importBackupSelector.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(evt) {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (parsed.projects && Array.isArray(parsed.projects)) {
                    projects = parsed.projects;
                    activeProjectId = projects[0].id;
                    
                    if (parsed.settings) {
                        fontSizeSelect.value = parsed.settings.fontSize || '14px';
                        tabSizeSelect.value = parsed.settings.tabSize || '4';
                        autoRefreshCheckbox.checked = parsed.settings.autoRefresh !== false;
                        autoSaveCheckbox.checked = parsed.settings.autoSave !== false;
                    }

                    await saveProjectsToDB();
                    applyEditorSettings();
                    renderProjectSidebar();
                    loadActiveProjectToEditors();
                    renderPreview();
                    
                    settingsOverlay.classList.remove('show');
                    showNotification('بازیابی اطلاعات با موفقیت انجام شد');
                } else {
                    showNotification('ساختار فایل پشتیبان معتبر نیست', 'error');
                }
            } catch (err) {
                showNotification('خطا در خواندن فایل پشتیبان', 'error');
            }
        };
        reader.readAsText(file);
    });

    // ---------------------------------------------------------
    // Load Settings Preferences from Storage
    // ---------------------------------------------------------
    async function loadSettingsPreferences() {
        const savedFontSize = await db.get('codevision_setting_fontsize');
        const savedTabSize = await db.get('codevision_setting_tabsize');
        const savedAutoRefresh = await db.get('codevision_setting_autorefresh');
        const savedAutoSave = await db.get('codevision_setting_autosave');

        if (savedFontSize) fontSizeSelect.value = savedFontSize;
        if (savedTabSize) tabSizeSelect.value = savedTabSize;
        if (savedAutoRefresh !== null && savedAutoRefresh !== undefined) {
            autoRefreshCheckbox.checked = savedAutoRefresh;
        }
        if (savedAutoSave !== null && savedAutoSave !== undefined) {
            autoSaveCheckbox.checked = savedAutoSave;
        }

        applyEditorSettings();
    }

    // ---------------------------------------------------------
    // Execution bootstrap sequence
    // ---------------------------------------------------------
    async function start() {
        initEditors();
        await loadSettingsPreferences();
        await loadProjects();
        renderPreview();
    }

    start();
});
