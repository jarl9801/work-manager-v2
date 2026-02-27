// Nexus OS v3.2 — Live Widgets + Real Weather + Theme Toggle
// El sistema cobra vida

window.NexusHub = {
    state: {
        viewMode: 'grid',
        searchQuery: '',
        recentApps: JSON.parse(localStorage.getItem('nexusRecent') || '[]'),
        favorites: JSON.parse(localStorage.getItem('nexusFavs') || '[]'),
        theme: localStorage.getItem('nexusTheme') || 'dark',
        weather: null,
        projects: [],
        todaysAppointments: []
    },

    apps: [
        { id: 'workmanager', name: 'Work Manager', desc: 'Control de proyectos fibra', icon: '⚡', color: 'gradient', type: 'local', url: null, view: 'dashboard' },
        { id: 'fincontrol', name: 'FinControl', desc: 'Finanzas y cashflow', icon: '💰', color: 'green', type: 'cloud', url: 'https://umtelkomd-finance.web.app' },
        { id: 'stockanalyzer', name: 'Stock Analyzer', desc: 'Valuación DCF', icon: '📈', color: 'orange', type: 'cloud', url: 'https://jarl9801.github.io/stock-analyzer/' },
        { id: 'nexusweb', name: 'Nexus Website', desc: 'Web corporativa', icon: '🌐', color: 'blue', type: 'cloud', url: 'https://hmr-nexus.com' },
        { id: 'nexusbot', name: 'Nexus Bot', desc: 'Telegram bot AI', icon: '🤖', color: 'purple', type: 'cloud', url: 'https://t.me/HMRNexusBot' },
        { id: 'fieldreport', name: 'Field Report', desc: 'Gestión de citas', icon: '📋', color: 'teal', type: 'cloud', url: 'https://jarl9801.github.io/field-report/' }
    ],

    init() {
        this.applyTheme();
        this.render();
        this.setupKeyboardShortcuts();
        this.startClock();
        this.loadWeather();
        this.loadData();
    },

    render() {
        const el = document.getElementById('view-hub');
        if (!el) return;

        el.innerHTML = `
            ${this.renderHeader()}
            ${this.renderCommandPalette()}
            ${this.renderLiveWidgets()}
            ${this.renderQuickActions()}
            ${this.renderApps()}
            ${this.renderOperations()}
            ${this.renderResources()}
        `;

        this.attachEvents();
        this.animateEntry();
    },

    renderHeader() {
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
                        <p>Command Center</p>
                    </div>
                </div>
                <div class="nexus-header-widgets">
                    ${this.renderWeatherWidget()}
                    <button class="nexus-theme-toggle" onclick="NexusHub.toggleTheme()" title="Cambiar tema">
                        ${this.state.theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <div class="nexus-status-bar">
                        <div class="nexus-status-item">
                            <span class="nexus-status-dot nexus-status-online"></span>
                            <span>Online</span>
                        </div>
                        <div class="nexus-time" id="nexusClock">--:--</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderWeatherWidget() {
        const w = this.state.weather;
        if (!w) {
            return `<div class="nexus-weather nexus-weather-loading">
                <span class="nexus-spinner"></span>
                <span>Cargando...</span>
            </div>`;
        }
        return `
        <div class="nexus-weather" title="${w.description}">
            <span class="nexus-weather-icon">${w.icon}</span>
            <span class="nexus-weather-temp">${w.temp}°</span>
            <span class="nexus-weather-location">Berlin</span>
        </div>`;
    },

    renderLiveWidgets() {
        const projectsCount = this.state.projects.length || 4;
        const appointmentsCount = this.state.todaysAppointments.length || 0;
        
        return `
        <div class="nexus-live-widgets">
            <div class="nexus-widget nexus-widget-stats">
                <div class="nexus-widget-header">
                    <span>📊 Overview</span>
                    <span class="nexus-widget-live">● LIVE</span>
                </div>
                <div class="nexus-widget-content">
                    <div class="nexus-widget-stat" onclick="NexusHub.launchApp('workmanager')">
                        <div class="nexus-widget-value">${projectsCount}</div>
                        <div class="nexus-widget-label">Proyectos activos</div>
                    </div>
                    <div class="nexus-widget-stat" onclick="window.navigate('ne4citas')">
                        <div class="nexus-widget-value">${appointmentsCount}</div>
                        <div class="nexus-widget-label">Citas hoy</div>
                    </div>
                    <div class="nexus-widget-stat">
                        <div class="nexus-widget-value">6</div>
                        <div class="nexus-widget-label">Apps conectadas</div>
                    </div>
                </div>
            </div>

            <div class="nexus-widget nexus-widget-quick">
                <div class="nexus-widget-header">
                    <span>⚡ Acceso rápido</span>
                </div>
                <div class="nexus-widget-content nexus-widget-buttons">
                    <button class="nexus-widget-btn" onclick="NexusHub.launchApp('fincontrol')">
                        <span>💰</span>
                        FinControl
                    </button>
                    <button class="nexus-widget-btn" onclick="NexusHub.launchApp('stockanalyzer')">
                        <span>📈</span>
                        Stocks
                    </button>
                    <button class="nexus-widget-btn" onclick="window.open('https://docs.google.com/spreadsheets/d/1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE','_blank')">
                        <span>💨</span>
                        Soplado
                    </button>
                    <button class="nexus-widget-btn" onclick="NexusHub.openPalette()">
                        <span>⌘</span>
                        Buscar
                    </button>
                </div>
            </div>

            ${this.renderRecentAppsWidget()}
        </div>`;
    },

    renderRecentAppsWidget() {
        const recent = this.state.recentApps.slice(0, 4);
        if (recent.length === 0) return '';
        
        const recentApps = recent.map(id => this.apps.find(a => a.id === id)).filter(Boolean);
        
        return `
        <div class="nexus-widget nexus-widget-recent">
            <div class="nexus-widget-header">
                <span>🕐 Recientes</span>
            </div>
            <div class="nexus-widget-content">
                ${recentApps.map(app => `
                    <div class="nexus-recent-item" onclick="NexusHub.launchApp('${app.id}')">
                        <span class="nexus-recent-icon nexus-recent-${app.color}">${app.icon}</span>
                        <span class="nexus-recent-name">${app.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    renderCommandPalette() {
        return `
        <div class="nexus-palette">
            <div class="nexus-palette-trigger" onclick="NexusHub.openPalette()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                </svg>
                <span>Buscar apps, comandos...</span>
                <kbd class="nexus-kbd">⌘K</kbd>
            </div>
        </div>
        
        <div class="nexus-palette-modal" id="nexusPaletteModal" style="display:none">
            <div class="nexus-palette-backdrop" onclick="NexusHub.closePalette()"></div>
            <div class="nexus-palette-content">
                <div class="nexus-palette-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" 
                           class="nexus-palette-input" 
                           id="nexusPaletteInput"
                           placeholder="Buscar apps, comandos, recursos..."
                           autocomplete="off"
                    >
                    <kbd class="nexus-kbd" onclick="NexusHub.closePalette()">ESC</kbd>
                </div>
                <div class="nexus-palette-results" id="nexusPaletteResults">
                    ${this.renderPaletteResults('')}
                </div>
            </div>
        </div>`;
    },

    renderPaletteResults(query) {
        const q = query.toLowerCase();
        const apps = this.apps.filter(a => 
            a.name.toLowerCase().includes(q) || 
            a.desc.toLowerCase().includes(q)
        );
        
        const commands = [
            { id: 'goto-dashboard', name: 'Ir al Dashboard', icon: '📊', action: () => window.navigate('dashboard') },
            { id: 'goto-projects', name: 'Ver Proyectos', icon: '📁', action: () => window.navigate('projects') },
            { id: 'goto-production', name: 'Ver Producción', icon: '📈', action: () => window.navigate('production') },
            { id: 'goto-citas', name: 'Ver Citas NE4', icon: '📅', action: () => window.navigate('ne4citas') },
            { id: 'toggle-theme', name: 'Cambiar tema', icon: this.state.theme === 'dark' ? '☀️' : '🌙', action: () => this.toggleTheme() },
            { id: 'sync-data', name: 'Sincronizar datos', icon: '🔄', action: () => { this.loadData(); this.showToast('Datos sincronizados'); } }
        ].filter(c => c.name.toLowerCase().includes(q));

        let html = '';
        
        if (apps.length) {
            html += `<div class="nexus-palette-section">
                <div class="nexus-palette-section-title">Aplicaciones</div>
                ${apps.map((app, i) => `
                    <div class="nexus-palette-item ${i === 0 ? 'nexus-palette-selected' : ''}" 
                         onclick="NexusHub.launchApp('${app.id}')"
                         data-index="${i}"
                    >
                        <span class="nexus-palette-item-icon nexus-palette-icon-${app.color}">${app.icon}</span>
                        <div class="nexus-palette-item-info">
                            <div class="nexus-palette-item-name">${app.name}</div>
                            <div class="nexus-palette-item-desc">${app.desc}</div>
                        </div>
                        <span class="nexus-palette-item-badge">${app.type === 'local' ? 'Local' : 'Web'}</span>
                    </div>
                `).join('')}
            </div>`;
        }
        
        if (commands.length) {
            html += `<div class="nexus-palette-section">
                <div class="nexus-palette-section-title">Comandos</div>
                ${commands.map((cmd, i) => `
                    <div class="nexus-palette-item" onclick="NexusHub.execCommand('${cmd.id}')">
                        <span class="nexus-palette-item-icon">${cmd.icon}</span>
                        <div class="nexus-palette-item-info">
                            <div class="nexus-palette-item-name">${cmd.name}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        }
        
        return html || '<div class="nexus-palette-empty">No se encontraron resultados</div>';
    },

    renderQuickActions() {
        const isList = this.state.viewMode === 'list';
        
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">🐙</span>
                    <div>
                        <h2>Nexus Ecosystem</h2>
                        <p>${this.apps.length} aplicaciones conectadas</p>
                    </div>
                </div>
                <div class="nexus-section-actions">
                    <button class="nexus-btn nexus-btn-ghost" onclick="NexusHub.toggleViewMode()">
                        ${isList ? '⊞ Grid' : '☰ Lista'}
                    </button>
                    <button class="nexus-btn nexus-btn-ghost" onclick="window.open('https://github.com/jarl9801','_blank')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                        </svg>
                        GitHub
                    </button>
                </div>
            </div>

            <div class="${isList ? 'nexus-app-list' : 'nexus-app-grid'}">
                ${this.apps.map(app => this.renderAppCard(app, isList)).join('')}
            </div>
        </div>`;
    },

    renderAppCard(app, isList) {
        const isFav = this.state.favorites.includes(app.id);
        
        if (isList) {
            return `
            <div class="nexus-app-row" data-app="${app.id}" onclick="NexusHub.launchApp('${app.id}')">
                <div class="nexus-row-accent nexus-accent-${app.color}"></div>
                <div class="nexus-app-row-icon nexus-icon-${app.color}">${app.icon}</div>
                <div class="nexus-app-row-info">
                    <div class="nexus-app-row-name">${app.name}</div>
                    <div class="nexus-app-row-desc">${app.desc}</div>
                </div>
                <div class="nexus-app-row-meta">
                    <span class="nexus-tag nexus-tag-${app.color}">${app.type === 'local' ? 'Local' : 'Cloud'}</span>
                    <button class="nexus-fav-btn ${isFav ? 'nexus-fav-active' : ''}" 
                            onclick="event.stopPropagation(); NexusHub.toggleFav('${app.id}')">
                        ${isFav ? '★' : '☆'}
                    </button>
                </div>
            </div>`;
        }
        
        return `
        <div class="nexus-app-card ${app.type === 'local' ? 'nexus-app-local' : ''}" data-app="${app.id}">
            <div class="nexus-app-accent nexus-accent-${app.color}"></div>
            <div class="nexus-app-body">
                <div class="nexus-app-top">
                    <div class="nexus-app-badge nexus-badge-${app.type}">
                        ${app.type === 'local' 
                            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Local`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> Cloud`
                        }
                    </div>
                    <button class="nexus-fav-btn ${isFav ? 'nexus-fav-active' : ''}" 
                            onclick="event.stopPropagation(); NexusHub.toggleFav('${app.id}')">
                        ${isFav ? '★' : '☆'}
                    </button>
                </div>
                
                <div class="nexus-app-icon-lg nexus-icon-${app.color}">
                    <span style="font-size:24px">${app.icon}</span>
                </div>

                <div class="nexus-app-info">
                    <h3>${app.name}</h3>
                    <p>${app.desc}</p>
                </div>

                <div class="nexus-app-footer">
                    <span class="nexus-tag nexus-tag-${app.color}">${app.type === 'local' ? 'v2.0' : app.color}</span>
                    <button class="nexus-btn nexus-btn-sm nexus-btn-${app.color}" onclick="NexusHub.launchApp('${app.id}')">
                        Abrir
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderOperations() {
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📡</span>
                    <div>
                        <h2>Operaciones</h2>
                        <p>Herramientas de campo</p>
                    </div>
                </div>
            </div>

            <div class="nexus-ops-grid">
                <div class="nexus-op-card">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-west">W</div>
                        <div class="nexus-op-title">
                            <h4>WestConnect</h4>
                            <span>Vista técnica</span>
                        </div>
                    </div>
                    <div class="nexus-op-pins">
                        <div class="nexus-pin"><span>001</span>2345</div>
                        <div class="nexus-pin"><span>002</span>3456</div>
                        <div class="nexus-pin"><span>003</span>4567</div>
                        <div class="nexus-pin"><span>004</span>5678</div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full" 
                            onclick="NexusHub.openExternal('https://jarl9801.github.io/field-report/westconnect.html')">
                        Abrir
                    </button>
                </div>

                <div class="nexus-op-card">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-gfp">G</div>
                        <div class="nexus-op-title">
                            <h4>Glasfaser Plus</h4>
                            <span>Vista técnica</span>
                        </div>
                    </div>
                    <div class="nexus-op-pins">
                        <div class="nexus-pin"><span>001</span>1234</div>
                    </div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full"
                            onclick="NexusHub.openExternal('https://jarl9801.github.io/field-report/glasfaser.html')">
                        Abrir
                    </button>
                </div>

                <div class="nexus-op-card nexus-op-wide">
                    <div class="nexus-op-header">
                        <div class="nexus-op-icon nexus-op-admin">📊</div>
                        <div class="nexus-op-title">
                            <h4>Field Report Admin</h4>
                            <span>Asignación y seguimiento</span>
                        </div>
                    </div>
                    <div class="nexus-op-note">PIN Isabelle: 0223 · Integrado en Citas NE4</div>
                    <button class="nexus-btn nexus-btn-ghost nexus-btn-full"
                            onclick="NexusHub.openExternal('https://jarl9801.github.io/field-report/admin.html')">
                        Abrir Panel Admin
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderResources() {
        return `
        <div class="nexus-section">
            <div class="nexus-section-header">
                <div class="nexus-section-title">
                    <span class="nexus-section-icon">📑</span>
                    <div>
                        <h2>Recursos</h2>
                        <p>Google Sheets</p>
                    </div>
                </div>
            </div>

            <div class="nexus-resources-grid">
                ${[
                    { icon: '💨', name: 'Soplado RD', url: '1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE' },
                    { icon: '💨', name: 'Soplado RA', url: '1jLQf3brTId_hU2nmU16BapEvTYxYDbJJyR6IV_u7MOc' },
                    { icon: '🔧', name: 'Fusiones DP', url: '1Ssq_EYReehe8ddOrho1B08CzTocXYr2o7Qlnf73gxcs' },
                    { icon: '📋', name: 'Field Reports', url: '19gmi3TLzhlsfq5K_l5-T1EmDt7EheTkouqMEFcUYPUw' }
                ].map(sheet => `
                    <a href="https://docs.google.com/spreadsheets/d/${sheet.url}" 
                       target="_blank" 
                       class="nexus-resource"
                    >
                        <div class="nexus-resource-icon">${sheet.icon}</div>
                        <div class="nexus-resource-info">
                            <h4>${sheet.name}</h4>
                            <span>Google Sheets</span>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>`;
    },

    // Theme management
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        if (this.state.theme === 'light') {
            document.body.classList.add('nexus-light');
        } else {
            document.body.classList.remove('nexus-light');
        }
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('nexusTheme', this.state.theme);
        this.applyTheme();
        this.render();
    },

    // Weather
    async loadWeather() {
        try {
            // Usando Open-Meteo API (gratis, no requiere key)
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true&timezone=Europe/Berlin');
            const data = await response.json();
            
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            
            // Map weather codes to icons
            const iconMap = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️',
                51: '🌦️', 53: '🌧️', 55: '🌧️',
                61: '🌧️', 63: '🌧️', 65: '🌧️',
                71: '🌨️', 73: '🌨️', 75: '🌨️',
                95: '⛈️', 96: '⛈️', 99: '⛈️'
            };
            
            this.state.weather = {
                temp: temp,
                icon: iconMap[code] || '🌡️',
                description: `Berlín: ${temp}°C`
            };
        } catch (e) {
            this.state.weather = { temp: '--', icon: '🌡️', description: 'No disponible' };
        }
        this.render();
    },

    // Data loading
    loadData() {
        // Intentar cargar datos de IndexedDB si existen
        if (window.DB && window.DB.getProjects) {
            window.DB.getProjects().then(projects => {
                this.state.projects = projects || [];
                this.render();
            }).catch(() => {
                this.state.projects = [];
            });
        }
    },

    // Actions
    launchApp(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (!app) return;
        
        this.addToRecent(appId);
        
        if (app.type === 'local' && app.view) {
            window.navigate(app.view);
        } else if (app.url) {
            window.open(app.url, '_blank');
        }
    },

    openExternal(url) {
        window.open(url, '_blank');
    },

    addToRecent(appId) {
        this.state.recentApps = [appId, ...this.state.recentApps.filter(id => id !== appId)].slice(0, 5);
        localStorage.setItem('nexusRecent', JSON.stringify(this.state.recentApps));
    },

    toggleFav(appId) {
        const idx = this.state.favorites.indexOf(appId);
        if (idx > -1) {
            this.state.favorites.splice(idx, 1);
        } else {
            this.state.favorites.push(appId);
        }
        localStorage.setItem('nexusFavs', JSON.stringify(this.state.favorites));
        this.render();
    },

    toggleViewMode() {
        this.state.viewMode = this.state.viewMode === 'grid' ? 'list' : 'grid';
        this.render();
    },

    // Command Palette
    openPalette() {
        const modal = document.getElementById('nexusPaletteModal');
        const input = document.getElementById('nexusPaletteInput');
        modal.style.display = 'block';
        input.focus();
        this.state.searchQuery = '';
    },

    closePalette() {
        const modal = document.getElementById('nexusPaletteModal');
        modal.style.display = 'none';
    },

    execCommand(cmdId) {
        this.closePalette();
        switch(cmdId) {
            case 'goto-dashboard': window.navigate('dashboard'); break;
            case 'goto-projects': window.navigate('projects'); break;
            case 'goto-production': window.navigate('production'); break;
            case 'goto-citas': window.navigate('ne4citas'); break;
            case 'toggle-theme': this.toggleTheme(); break;
            case 'sync-data': this.loadData(); this.showToast('✅ Datos sincronizados'); break;
        }
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'nexus-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('nexus-toast-show');
        }, 10);
        setTimeout(() => {
            toast.classList.remove('nexus-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    // Events
    attachEvents() {
        const input = document.getElementById('nexusPaletteInput');
        const results = document.getElementById('nexusPaletteResults');
        
        if (input) {
            input.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                results.innerHTML = this.renderPaletteResults(e.target.value);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closePalette();
                if (e.key === 'Enter') {
                    const selected = results.querySelector('.nexus-palette-selected');
                    if (selected) selected.click();
                }
            });
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.openPalette();
            }
            if (e.key === 'Escape') {
                this.closePalette();
            }
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const idx = parseInt(e.key) - 1;
                if (this.apps[idx]) {
                    this.launchApp(this.apps[idx].id);
                }
            }
        });
    },

    startClock() {
        const update = () => {
            const clock = document.getElementById('nexusClock');
            if (clock) {
                clock.textContent = new Date().toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };
        update();
        setInterval(update, 1000);
    },

    animateEntry() {
        const cards = document.querySelectorAll('.nexus-app-card, .nexus-app-row, .nexus-widget');
        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 50);
        });
    }
};

window.render_hub = function() {
    NexusHub.init();
};
