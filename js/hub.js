// Nexus OS v3.4 — The Complete Workspace
// Kanban + Quick Notes + Analytics

window.NexusHub = {
    state: {
        viewMode: 'grid',
        searchQuery: '',
        recentApps: JSON.parse(localStorage.getItem('nexusRecent') || '[]'),
        favorites: JSON.parse(localStorage.getItem('nexusFavs') || '[]'),
        theme: localStorage.getItem('nexusTheme') || 'dark',
        weather: null,
        projects: [],
        appointments: [],
        todayAppointments: [],
        notes: JSON.parse(localStorage.getItem('nexusNotes') || '[]'),
        kanban: JSON.parse(localStorage.getItem('nexusKanban') || '[]'),
        syncStatus: 'idle',
        notifications: [],
        unreadCount: 0,
        activeTab: 'dashboard' // dashboard | kanban | analytics
    },

    apps: [
        { id: 'workmanager', name: 'Work Manager', desc: 'Control de proyectos fibra', icon: '⚡', color: 'gradient', type: 'local', url: null, view: 'dashboard' },
        { id: 'fincontrol', name: 'FinControl', desc: 'Finanzas y cashflow', icon: '💰', color: 'green', type: 'cloud', url: 'https://umtelkomd-finance.web.app' },
        { id: 'fieldwc', name: 'Field WestConnect', desc: 'App campo WC', icon: '🔧', color: 'blue', type: 'cloud', url: 'https://umtelkomd.github.io/field-report/westconnect.html' },
        { id: 'fieldgfp', name: 'Field Glasfaser+', desc: 'App campo GFP', icon: '🔌', color: 'teal', type: 'cloud', url: 'https://umtelkomd.github.io/field-report/glasfaser.html' },
        { id: 'nexusweb', name: 'Nexus Website', desc: 'Web corporativa', icon: '🌐', color: 'blue', type: 'cloud', url: 'https://hmr-nexus.com' },
        { id: 'nexusbot', name: 'Nexus Bot', desc: 'Telegram bot AI', icon: '🤖', color: 'purple', type: 'cloud', url: 'https://t.me/HMRNexusBot' },
        { id: 'fieldadmin', name: 'Field Admin', desc: 'Admin citas y equipos', icon: '📋', color: 'orange', type: 'cloud', url: 'https://umtelkomd.github.io/field-report/admin.html' }
    ],

    kanbanColumns: [
        { id: 'backlog', name: 'Backlog', color: '#71717a' },
        { id: 'todo', name: 'Por Hacer', color: '#3b82f6' },
        { id: 'inprogress', name: 'En Progreso', color: '#f59e0b' },
        { id: 'review', name: 'Revisión', color: '#a855f7' },
        { id: 'done', name: 'Completado', color: '#22c55e' }
    ],

    projectLocations: {
        'HXT': { city: 'Höxter', lat: 51.77, lon: 9.38 },
        'RSD': { city: 'Roßdorf', lat: 49.86, lon: 8.76 },
        'WCB': { city: 'Würzburg', lat: 49.79, lon: 9.95 },
        'QFF': { city: 'Roßdorf', lat: 49.86, lon: 8.76 },
        'WRZ': { city: 'Würzburg', lat: 49.79, lon: 9.95 },
        'EHR': { city: 'Paderborn', lat: 51.72, lon: 8.75 },
        'AMD': { city: 'Paderborn', lat: 51.72, lon: 8.75 },
    },

    config: {
        weatherProject: localStorage.getItem('nexusWeatherProject') || null,
        syncInterval: 300000
    },

    init() {
        this.applyTheme();
        this.initKanban();
        this.loadAllData();
        this.render();
        this.setupKeyboardShortcuts();
        this.startClock();
        this.loadWeather();
        this.startAutoSync();
    },

    render() {
        const el = document.getElementById('view-hub');
        if (!el) return;

        el.innerHTML = `
            ${this.renderHeader()}
            ${this.renderNavigation()}
            ${this.renderActiveView()}
        `;

        this.attachEvents();
        this.animateEntry();
        
        if (this.state.activeTab === 'kanban') {
            this.initDragAndDrop();
        }
        
        if (this.state.activeTab === 'analytics') {
            this.renderCharts();
        }
    },

    renderHeader() {
        const hasNotifications = this.state.unreadCount > 0;
        
        return `
        <div class="nexus-header">
            <div class="nexus-header-content">
                <div class="nexus-brand">
                    <div class="nexus-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                    </div>
                    <div class="nexus-brand-text">
                        <h1>Nexus<span>OS</span></h1>
                        <p>v3.4 — Complete Workspace</p>
                    </div>
                </div>
                <div class="nexus-header-widgets">
                    ${this.renderWeatherWidget()}
                    <button class="nexus-theme-toggle" onclick="NexusHub.toggleTheme()">
                        ${this.state.theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button class="nexus-notifications-btn ${hasNotifications ? 'nexus-notifications-unread' : ''}" 
                            onclick="NexusHub.toggleNotifications()">
                        🔔
                        ${hasNotifications ? `<span class="nexus-notifications-badge">${this.state.unreadCount}</span>` : ''}
                    </button>
                    <div class="nexus-status-bar">
                        <div class="nexus-status-item nexus-sync-${this.state.syncStatus}" onclick="NexusHub.manualSync()">
                            <span class="nexus-status-dot"></span>
                            <span class="nexus-sync-text">${this.getSyncStatusText()}</span>
                        </div>
                        <div class="nexus-time" id="nexusClock">--:--</div>
                    </div>
                </div>
            </div>
            ${this.renderNotificationsPanel()}
        </div>`;
    },

    renderNavigation() {
        return `
        <div class="nexus-nav">
            <button class="nexus-nav-item ${this.state.activeTab === 'dashboard' ? 'nexus-nav-active' : ''}" 
                    onclick="NexusHub.switchTab('dashboard')"
            >
                <span>📊</span>
                Dashboard
            </button>
            <button class="nexus-nav-item ${this.state.activeTab === 'kanban' ? 'nexus-nav-active' : ''}" 
                    onclick="NexusHub.switchTab('kanban')"
            >
                <span>📋</span>
                Kanban
                ${this.state.kanban.filter(t => t.column === 'inprogress').length > 0 ? 
                    `<span class="nexus-nav-badge">${this.state.kanban.filter(t => t.column === 'inprogress').length}</span>` : ''}
            </button>
            <button class="nexus-nav-item ${this.state.activeTab === 'analytics' ? 'nexus-nav-active' : ''}" 
                    onclick="NexusHub.switchTab('analytics')"
            >
                <span>📈</span>
                Analytics
            </button>
        </div>`;
    },

    renderActiveView() {
        switch(this.state.activeTab) {
            case 'dashboard': return this.renderDashboard();
            case 'kanban': return this.renderKanban();
            case 'analytics': return this.renderAnalytics();
            default: return this.renderDashboard();
        }
    },

    // ========== DASHBOARD VIEW ==========
    renderDashboard() {
        return `
        <div class="nexus-container">
            ${this.renderCommandPalette()}
            ${this.renderDashboardGrid()}
            ${this.renderQuickNotes()}
            ${this.renderApps()}
            ${this.renderOperations()}
            ${this.renderResources()}
        </div>`;
    },

    renderDashboardGrid() {
        const stats = this.calculateStats();
        
        return `
        <div class="nexus-dashboard">
            <div class="nexus-widget nexus-widget-stats-large">
                <div class="nexus-widget-header">
                    <div class="nexus-widget-title">
                        <span>📊 Producción</span>
                        <span class="nexus-widget-live">● LIVE</span>
                    </div>
                </div>
                <div class="nexus-widget-content">
                    <div class="nexus-big-stats">
                        <div class="nexus-big-stat">
                            <div class="nexus-big-value">${stats.total}</div>
                            <div class="nexus-big-label">Proyectos totales</div>
                        </div>
                        <div class="nexus-big-stat">
                            <div class="nexus-big-value nexus-value-success">${stats.done}</div>
                            <div class="nexus-big-label">Completados</div>
                        </div>
                        <div class="nexus-big-stat">
                            <div class="nexus-big-value nexus-value-warning">${stats.inProgress}</div>
                            <div class="nexus-big-label">En progreso</div>
                        </div>
                        <div class="nexus-big-stat nexus-stat-revenue">
                            <div class="nexus-big-value nexus-value-money">€${this.formatMoney(stats.revenue)}</div>
                            <div class="nexus-big-label">Revenue estimado</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="nexus-widget nexus-widget-calendar">
                <div class="nexus-widget-header">
                    <div class="nexus-widget-title">
                        <span>📅 Hoy</span>
                        <span class="nexus-calendar-date">${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                </div>
                <div class="nexus-widget-content">
                    ${this.renderTodayAppointments()}
                </div>
            </div>

            <div class="nexus-widget nexus-widget-quick">
                <div class="nexus-widget-header">
                    <span>⚡ Acceso rápido</span>
                </div>
                <div class="nexus-widget-content">
                    ${this.renderQuickActions()}
                </div>
            </div>
        </div>`;
    },

    renderTodayAppointments() {
        const appointments = this.state.todayAppointments;
        if (appointments.length === 0) {
            return `
            <div class="nexus-calendar-empty">
                <span>🌴</span>
                <p>No hay citas para hoy</p>
                <button class="nexus-btn nexus-btn-primary" onclick="window.navigate('ne4citas')">+ Nueva cita</button>
            </div>`;
        }
        
        return `
        <div class="nexus-calendar-list">
            ${appointments.slice(0, 4).map((apt, i) => `
                <div class="nexus-calendar-item ${apt.status || ''}" style="animation-delay: ${i * 0.1}s">
                    <div class="nexus-calendar-time">${apt.time || '--:--'}</div>
                    <div class="nexus-calendar-info">
                        <div class="nexus-calendar-client">${apt.client || 'Sin nombre'}</div>
                        <div class="nexus-calendar-details">
                            <span>${apt.type || 'Instalación'}</span>
                            <span class="nexus-calendar-dot">•</span>
                            <span>${apt.address || 'Sin dirección'}</span>
                        </div>
                    </div>
                    <div class="nexus-calendar-status">
                        ${apt.status === 'completed' ? '✅' : apt.status === 'cancelled' ? '❌' : '⏳'}
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    renderQuickActions() {
        return `
        <div class="nexus-quick-grid">
            <button class="nexus-quick-btn nexus-quick-primary" onclick="NexusHub.launchApp('fincontrol')">
                <span>💰</span>
                <div><strong>FinControl</strong><small>Ver finanzas</small></div>
            </button>
            <button class="nexus-quick-btn" onclick="NexusHub.launchApp('fieldwc')">
                <span>📈</span>
                <div><strong>Field WC</strong><small>Tecnicos</small></div>
            </button>
            <button class="nexus-quick-btn" onclick="NexusHub.switchTab('kanban')">
                <span>📋</span>
                <div><strong>Kanban</strong><small>Ver tablero</small></div>
            </button>
            <button class="nexus-quick-btn" onclick="NexusHub.openPalette()">
                <span>⌘</span>
                <div><strong>Buscar</strong><small>⌘K</small></div>
            </button>
        </div>`;
    },

    // ========== QUICK NOTES ==========
    renderQuickNotes() {
        const notes = this.state.notes.filter(n => !n.archived).slice(0, 6);
        
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📝</span>
                    <div>
                        <h2>Quick Notes</h2>
                        <p>${notes.length} notas activas</p>
                    </div>
                </div>
                <button class="nexus-btn nexus-btn-primary" onclick="NexusHub.addNote()">+ Nueva nota</button>
            </div>
            <div class="nexus-notes-grid">
                ${notes.length === 0 ? 
                    `<div class="nexus-notes-empty">Sin notas. Crea una con el botón +</div>` :
                    notes.map(note => `
                        <div class="nexus-note-card ${note.color || ''}" data-note-id="${note.id}">
                            <div class="nexus-note-content" contenteditable="true" 
                                 onblur="NexusHub.updateNote('${note.id}', this.innerText)"
                            >${note.content}</div>
                            <div class="nexus-note-footer">
                                <span class="nexus-note-time">${this.timeAgo(note.created)}</span>
                                <div class="nexus-note-actions">
                                    <button onclick="NexusHub.changeNoteColor('${note.id}')">🎨</button>
                                    <button onclick="NexusHub.archiveNote('${note.id}')">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>`;
    },

    // ========== KANBAN VIEW ==========
    renderKanban() {
        const tasks = this.state.kanban.filter(t => !t.archived);
        
        return `
        <div class="nexus-kanban-container">
            <div class="nexus-kanban-header">
                <h2>📋 Kanban Board</h2>
                <button class="nexus-btn nexus-btn-primary" onclick="NexusHub.addKanbanTask()">+ Nueva tarea</button>
            </div>
            <div class="nexus-kanban-board">
                ${this.kanbanColumns.map(col => `
                    <div class="nexus-kanban-column" data-column="${col.id}">
                        <div class="nexus-kanban-column-header" style="border-color: ${col.color}">
                            <span class="nexus-kanban-dot" style="background: ${col.color}"></span>
                            <span>${col.name}</span>
                            <span class="nexus-kanban-count">${tasks.filter(t => t.column === col.id).length}</span>
                        </div>
                        <div class="nexus-kanban-tasks" data-column="${col.id}">
                            ${tasks.filter(t => t.column === col.id).map(task => `
                                <div class="nexus-kanban-task" draggable="true" data-task-id="${task.id}">
                                    <div class="nexus-kanban-task-content">${task.content}</div>
                                    <div class="nexus-kanban-task-meta">
                                        <span class="nexus-kanban-tag ${task.priority}">${task.priority}</span>
                                        ${task.project ? `<span class="nexus-kanban-project">${task.project}</span>` : ''}
                                    </div>
                                    <button class="nexus-kanban-delete" onclick="NexusHub.deleteKanbanTask('${task.id}')">×</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    // ========== ANALYTICS VIEW ==========
    renderAnalytics() {
        const stats = this.calculateStats();
        
        return `
        <div class="nexus-analytics-container">
            <div class="nexus-analytics-header">
                <h2>📈 Analytics Dashboard</h2>
                <div class="nexus-analytics-filters">
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-active">7 días</button>
                    <button class="nexus-btn nexus-btn-ghost">30 días</button>
                    <button class="nexus-btn nexus-btn-ghost">Este mes</button>
                </div>
            </div>
            
            <div class="nexus-analytics-grid">
                <div class="nexus-analytics-card nexus-analytics-wide">
                    <h3>Productividad semanal</h3>
                    <div class="nexus-chart-container">
                        <canvas id="productivityChart"></canvas>
                    </div>
                </div>
                
                <div class="nexus-analytics-card">
                    <h3>Estado de proyectos</h3>
                    <div class="nexus-donut-container">
                        <canvas id="statusChart"></canvas>
                    </div>
                    <div class="nexus-donut-legend">
                        <span><span class="nexus-dot" style="background:#22c55e"></span>Completados ${stats.done}</span>
                        <span><span class="nexus-dot" style="background:#f59e0b"></span>En progreso ${stats.inProgress}</span>
                        <span><span class="nexus-dot" style="background:#3b82f6"></span>Por hacer ${stats.todo}</span>
                    </div>
                </div>
                
                <div class="nexus-analytics-card">
                    <h3>Revenue mensual</h3>
                    <div class="nexus-metric-large">
                        <div class="nexus-metric-value">€${this.formatMoney(stats.revenue)}</div>
                        <div class="nexus-metric-change nexus-change-up">+12% vs mes anterior</div>
                    </div>
                    <div class="nexus-mini-chart">
                        <div class="nexus-mini-bar" style="height:40%"></div>
                        <div class="nexus-mini-bar" style="height:60%"></div>
                        <div class="nexus-mini-bar" style="height:45%"></div>
                        <div class="nexus-mini-bar" style="height:80%"></div>
                        <div class="nexus-mini-bar nexus-mini-current" style="height:100%"></div>
                        <div class="nexus-mini-bar" style="height:0%"></div>
                    </div>
                </div>
                
                <div class="nexus-analytics-card">
                    <h3>Promedio por instalación</h3>
                    <div class="nexus-metric-large">
                        <div class="nexus-metric-value">${stats.avgTime}h</div>
                        <div class="nexus-metric-label">Tiempo promedio</div>
                    </div>
                </div>
                
                <div class="nexus-analytics-card nexus-analytics-wide">
                    <h3>Top proyectos por revenue</h3>
                    <div class="nexus-top-projects">
                        ${this.state.projects.slice(0, 5).map((p, i) => `
                            <div class="nexus-top-project">
                                <span class="nexus-top-rank">${i + 1}</span>
                                <span class="nexus-top-name">${p.name || p.client || 'Proyecto ' + (i + 1)}</span>
                                <span class="nexus-top-bar" style="width: ${100 - (i * 15)}%"></span>
                                <span class="nexus-top-value">€${this.formatMoney((5 - i) * 1250)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ========== CHARTS ==========
    renderCharts() {
        // Chart.js o canvas simple - implementación básica
        const prodCanvas = document.getElementById('productivityChart');
        if (prodCanvas) {
            this.drawBarChart(prodCanvas);
        }
        
        const statusCanvas = document.getElementById('statusChart');
        if (statusCanvas) {
            this.drawDonutChart(statusCanvas);
        }
    },

    drawBarChart(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        const data = [3, 5, 8, 6, 9, 7, 10]; // Proyectos por día
        const max = Math.max(...data);
        const barWidth = (width / data.length) * 0.6;
        const gap = (width / data.length) * 0.4;
        
        data.forEach((val, i) => {
            const barHeight = (val / max) * (height - 30);
            const x = i * (barWidth + gap) + gap / 2;
            const y = height - barHeight - 20;
            
            // Bar
            const gradient = ctx.createLinearGradient(0, y, 0, height - 20);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#1d4ed8');
            ctx.fillStyle = gradient;
            ctx.roundRect(x, y, barWidth, barHeight, 4);
            ctx.fill();
            
            // Label
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--nx-text-secondary');
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(['L', 'M', 'X', 'J', 'V', 'S', 'D'][i], x + barWidth / 2, height - 5);
        });
    },

    drawDonutChart(canvas) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width = canvas.height = Math.min(canvas.offsetWidth, 200);
        const center = size / 2;
        const radius = (size / 2) - 20;
        
        const stats = this.calculateStats();
        const total = stats.total || 1;
        const data = [
            { value: stats.done, color: '#22c55e' },
            { value: stats.inProgress, color: '#f59e0b' },
            { value: stats.todo, color: '#3b82f6' }
        ];
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach(segment => {
            const sliceAngle = (segment.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(center, center, radius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(center, center, radius * 0.6, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
        
        // Center text
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--nx-text');
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total.toString(), center, center);
    },

    // ========== DATA METHODS ==========
    calculateStats() {
        const tasks = this.state.kanban.filter(t => !t.archived);
        return {
            total: tasks.length,
            done: tasks.filter(t => t.column === 'done').length,
            inProgress: tasks.filter(t => t.column === 'inprogress').length,
            todo: tasks.filter(t => t.column === 'todo').length,
            revenue: tasks.length * 1250,
            avgTime: 4.5
        };
    },

    async loadAllData() {
        this.setSyncStatus('syncing');
        try {
            // Load from IndexedDB or localStorage
            if (window.DB && window.DB.getProjects) {
                const projects = await window.DB.getProjects();
                this.state.projects = projects || [];
            }
            
            // Mock data if empty
            if (this.state.projects.length === 0) {
                this.state.projects = [
                    { id: '1', name: 'NE3-001', client: 'Deutsche Telekom', status: 'active' },
                    { id: '2', name: 'NE4-045', client: 'Vodafone', status: 'pending' },
                    { id: '3', name: 'GFP-123', client: 'Glasfaser Plus', status: 'completed' }
                ];
            }
            
            // Mock appointments
            this.state.todayAppointments = [
                { time: '09:00', client: 'Müller GmbH', type: 'Instalación', status: 'pending' },
                { time: '14:00', client: 'Bauunternehmen K', type: 'Inspección', status: 'pending' }
            ];
            
            this.setSyncStatus('synced');
        } catch (e) {
            this.setSyncStatus('error');
        }
    },

    initKanban() {
        if (this.state.kanban.length === 0) {
            this.state.kanban = [
                { id: '1', content: 'Revisar planos NE3-001', column: 'todo', priority: 'high', project: 'NE3', created: Date.now() },
                { id: '2', content: 'Instalación Potsdam', column: 'inprogress', priority: 'medium', project: 'NE4', created: Date.now() },
                { id: '3', content: 'Certificación GFP-120', column: 'review', priority: 'low', project: 'GFP', created: Date.now() }
            ];
            this.saveKanban();
        }
    },

    initDragAndDrop() {
        const tasks = document.querySelectorAll('.nexus-kanban-task');
        const columns = document.querySelectorAll('.nexus-kanban-tasks');
        
        tasks.forEach(task => {
            task.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('task-id', task.dataset.taskId);
                task.classList.add('dragging');
            });
            
            task.addEventListener('dragend', () => {
                task.classList.remove('dragging');
            });
        });
        
        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.classList.add('drag-over');
            });
            
            col.addEventListener('dragleave', () => {
                col.classList.remove('drag-over');
            });
            
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('task-id');
                const newColumn = col.dataset.column;
                this.moveKanbanTask(taskId, newColumn);
            });
        });
    },

    // ========== ACTIONS ==========
    addNote() {
        const colors = ['yellow', 'green', 'blue', 'pink'];
        const note = {
            id: Date.now().toString(),
            content: 'Nueva nota...',
            color: colors[Math.floor(Math.random() * colors.length)],
            created: Date.now(),
            archived: false
        };
        this.state.notes.unshift(note);
        this.saveNotes();
        this.render();
    },

    updateNote(id, content) {
        const note = this.state.notes.find(n => n.id === id);
        if (note) {
            note.content = content;
            this.saveNotes();
        }
    },

    archiveNote(id) {
        const note = this.state.notes.find(n => n.id === id);
        if (note) {
            note.archived = true;
            this.saveNotes();
            this.render();
        }
    },

    changeNoteColor(id) {
        const colors = ['yellow', 'green', 'blue', 'pink', 'purple'];
        const note = this.state.notes.find(n => n.id === id);
        if (note) {
            const currentIndex = colors.indexOf(note.color);
            note.color = colors[(currentIndex + 1) % colors.length];
            this.saveNotes();
            this.render();
        }
    },

    addKanbanTask() {
        const content = prompt('¿Qué tarea quieres agregar?');
        if (content) {
            this.state.kanban.push({
                id: Date.now().toString(),
                content,
                column: 'todo',
                priority: 'medium',
                created: Date.now(),
                archived: false
            });
            this.saveKanban();
            this.render();
        }
    },

    moveKanbanTask(taskId, newColumn) {
        const task = this.state.kanban.find(t => t.id === taskId);
        if (task) {
            task.column = newColumn;
            this.saveKanban();
            this.render();
            this.showToast(`✅ Movido a ${this.kanbanColumns.find(c => c.id === newColumn)?.name}`);
        }
    },

    deleteKanbanTask(id) {
        if (confirm('¿Eliminar esta tarea?')) {
            this.state.kanban = this.state.kanban.filter(t => t.id !== id);
            this.saveKanban();
            this.render();
        }
    },

    saveNotes() {
        localStorage.setItem('nexusNotes', JSON.stringify(this.state.notes));
    },

    saveKanban() {
        localStorage.setItem('nexusKanban', JSON.stringify(this.state.kanban));
    },

    // ========== UTILITIES ==========
    switchTab(tab) {
        this.state.activeTab = tab;
        this.render();
    },

    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'ahora';
        if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
        return `hace ${Math.floor(seconds / 86400)}d`;
    },

    formatMoney(amount) {
        return amount.toLocaleString('de-DE');
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'nexus-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('nexus-toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('nexus-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    // ... include other existing methods from v3.3 ...
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        document.body.classList.toggle('nexus-light', this.state.theme === 'light');
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('nexusTheme', this.state.theme);
        this.applyTheme();
        this.render();
    },

    renderWeatherWidget() {
        const w = this.state.weather;
        if (!w) return '<div class="nexus-weather nexus-weather-loading"><span class="nexus-spinner"></span></div>';
        const seen = {};
        const options = Object.entries(this.projectLocations).filter(([c, loc]) => {
            if (seen[loc.city]) return false;
            seen[loc.city] = true;
            return true;
        }).map(([c, loc]) => {
            const sel = w.city === loc.city ? 'selected' : '';
            return `<option value="${c}" ${sel}>${loc.city}</option>`;
        }).join('');
        return `
            <div class="nexus-weather" title="${w.description}">
                <span class="nexus-weather-icon">${w.icon}</span>
                <span class="nexus-weather-temp">${w.temp}°</span>
                <select class="nexus-weather-select" onchange="NexusHub.loadWeather(this.value)">
                    <option value="" ${!w.project ? 'selected' : ''}>Paderborn</option>
                    ${options}
                </select>
            </div>`;
    },

    async loadWeather(projectCode) {
        try {
            if (projectCode) {
                this.config.weatherProject = projectCode;
                localStorage.setItem('nexusWeatherProject', projectCode);
            }
            const code = this.config.weatherProject;
            const loc = code && this.projectLocations[code] 
                ? this.projectLocations[code] 
                : { city: 'Paderborn', lat: 51.72, lon: 8.75 };
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`);
            const data = await res.json();
            const icons = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 51: '🌦️', 61: '🌧️', 71: '🌨️', 95: '⛈️' };
            this.state.weather = {
                temp: Math.round(data.current_weather.temperature),
                icon: icons[data.current_weather.weathercode] || '🌡️',
                description: `${loc.city}: ${Math.round(data.current_weather.temperature)}°C`,
                city: loc.city,
                project: code
            };
            this.render();
        } catch (e) {}
    },

    setSyncStatus(status) {
        this.state.syncStatus = status;
    },

    getSyncStatusText() {
        return { idle: 'Sin sync', syncing: 'Syncing...', synced: 'Actualizado', error: 'Error' }[this.state.syncStatus];
    },

    manualSync() {
        this.loadAllData();
        this.showToast('🔄 Sincronizado');
    },

    startAutoSync() {
        setInterval(() => this.loadAllData(), this.config.syncInterval);
    },

    startClock() {
        const update = () => {
            const clock = document.getElementById('nexusClock');
            if (clock) {
                clock.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            }
        };
        update();
        setInterval(update, 1000);
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.openPalette?.();
            }
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '3') {
                const tabs = ['dashboard', 'kanban', 'analytics'];
                this.switchTab(tabs[parseInt(e.key) - 1]);
            }
        });
    },

    animateEntry() {
        document.querySelectorAll('.nexus-widget, .nexus-app-card').forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 50);
        });
    },

    attachEvents() {},
    // ========== APP LAUNCHER ==========
    launchApp(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (!app) return;
        this.addToRecent(appId);
        if (app.type === "local" && app.view) {
            window.navigate(app.view);
        } else if (app.url) {
            window.open(app.url, "_blank", "noopener,noreferrer");
        }
    },
    openExternal(url) {
        window.open(url, "_blank", "noopener,noreferrer");
    },
    addToRecent(appId) {
        this.state.recentApps = [appId, ...this.state.recentApps.filter(id => id !== appId)].slice(0, 5);
        localStorage.setItem("nexusRecent", JSON.stringify(this.state.recentApps));
    },
    toggleFav(appId) {
        const idx = this.state.favorites.indexOf(appId);
        if (idx > -1) {
            this.state.favorites.splice(idx, 1);
        } else {
            this.state.favorites.push(appId);
        }
        localStorage.setItem("nexusFavs", JSON.stringify(this.state.favorites));
        this.render();
    },
    toggleViewMode() {
        this.state.viewMode = this.state.viewMode === "grid" ? "list" : "grid";
        this.render();
    },
    openPalette() {
        this.showToast("⌘K para abrir búsqueda");
    },
    closePalette() {},
    execCommand(cmdId) {
        switch(cmdId) {
            case "goto-dashboard": window.navigate("dashboard"); break;
            case "goto-projects": window.navigate("projects"); break;
            case "goto-production": window.navigate("production"); break;
            case "goto-citas": window.navigate("ne4citas"); break;
            case "goto-cert": window.navigate("certification"); break;
            case "toggle-theme": this.toggleTheme(); break;
            case "sync-data": this.manualSync(); break;
        }
    },
    toggleNotifications() {},
    renderNotificationsPanel() { return ''; },
    renderCommandPalette() { return ''; },
    renderApps() { return ''; },
    renderOperations() { return ''; },
    renderResources() { return ''; }
};

window.render_hub = function() {
    NexusHub.init();
};
