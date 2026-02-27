// Hub — Nexus Command Center v2.0
// El centro neuralgico de todo tu ecosistema

window.render_hub = function() {
    const el = document.getElementById('view-hub');
    if (!el) return;

    el.innerHTML = `
    <div class="hub-container">

        <!-- Nexus Ecosystem — Tus Apps -->
        <div class="hub-section hub-section-highlight">
            <div class="hub-section-header">
                <h2 class="hub-section-title">🐙 Nexus Ecosystem</h2>
                <span class="hub-badge hub-badge-live">Activo</span>
            </div>
            <div class="hub-grid hub-grid-ecosystem">

                <div class="hub-card hub-card-app" data-app="workmanager">
                    <div class="hub-card-glow"></div>
                    <div class="hub-card-content">
                        <div class="hub-app-header">
                            <div class="hub-app-icon hub-app-icon-primary">⚡</div>
                            <div class="hub-app-status hub-status-active"></div>
                        </div>
                        <div class="hub-app-name">Work Manager</div>
                        <div class="hub-app-desc">Control de proyectos fibra NE3/NE4</div>
                        <div class="hub-app-meta">
                            <span class="hub-meta-tag">v2.0</span>
                            <span class="hub-meta-tag hub-meta-local">Local</span>
                        </div>
                    </div>
                    <div class="hub-card-actions">
                        <button class="hub-btn hub-btn-sm" onclick="window.navigate('dashboard')">Abrir</button>
                    </div>
                </div>

                <div class="hub-card hub-card-app" data-app="fincontrol">
                    <div class="hub-card-glow hub-glow-green"></div>
                    <div class="hub-card-content">
                        <div class="hub-app-header">
                            <div class="hub-app-icon hub-app-icon-green">💰</div>
                            <div class="hub-app-status hub-status-cloud"></div>
                        </div>
                        <div class="hub-app-name">FinControl</div>
                        <div class="hub-app-desc">Finanzas, CXP/CXC, cashflow</div>
                        <div class="hub-app-meta">
                            <span class="hub-meta-tag">Firebase</span>
                            <span class="hub-meta-tag hub-meta-prod">Prod</span>
                        </div>
                    </div>
                    <div class="hub-card-actions">
                        <button class="hub-btn hub-btn-sm hub-btn-primary" onclick="window.open('https://umtelkomd-finance.web.app','_blank')">Abrir ↗</button>
                    </div>
                </div>

                <div class="hub-card hub-card-app" data-app="stockanalyzer">
                    <div class="hub-card-glow hub-glow-orange"></div>
                    <div class="hub-card-content">
                        <div class="hub-app-header">
                            <div class="hub-app-icon hub-app-icon-orange">📈</div>
                            <div class="hub-app-status hub-status-cloud"></div>
                        </div>
                        <div class="hub-app-name">Stock Analyzer</div>
                        <div class="hub-app-desc">Valuacion DCF, portfolio, scanner</div>
                        <div class="hub-app-meta">
                            <span class="hub-meta-tag">Terminal</span>
                            <span class="hub-meta-tag hub-meta-prod">GitHub</span>
                        </div>
                    </div>
                    <div class="hub-card-actions">
                        <button class="hub-btn hub-btn-sm hub-btn-orange" onclick="window.open('https://jarl9801.github.io/stock-analyzer/','_blank')">Abrir ↗</button>
                    </div>
                </div>

                <div class="hub-card hub-card-app" data-app="nexusweb">
                    <div class="hub-card-glow hub-glow-blue"></div>
                    <div class="hub-card-content">
                        <div class="hub-app-header">
                            <div class="hub-app-icon hub-app-icon-blue">🌐</div>
                            <div class="hub-app-status hub-status-cloud"></div>
                        </div>
                        <div class="hub-app-name">Nexus Website</div>
                        <div class="hub-app-desc">Web corporativa + i18n</div>
                        <div class="hub-app-meta">
                            <span class="hub-meta-tag">React</span>
                            <span class="hub-meta-tag hub-meta-prod">Netlify</span>
                        </div>
                    </div>
                    <div class="hub-card-actions">
                        <button class="hub-btn hub-btn-sm hub-btn-blue" onclick="window.open('https://hmr-nexus.com','_blank')">Abrir ↗</button>
                    </div>
                </div>

                <div class="hub-card hub-card-app" data-app="nexusbot">
                    <div class="hub-card-glow hub-glow-purple"></div>
                    <div class="hub-card-content">
                        <div class="hub-app-header">
                            <div class="hub-app-icon hub-app-icon-purple">🤖</div>
                            <div class="hub-app-status hub-status-cloud"></div>
                        </div>
                        <div class="hub-app-name">Nexus Bot</div>
                        <div class="hub-app-desc">Telegram bot + API Groq</div>
                        <div class="hub-app-meta">
                            <span class="hub-meta-tag">Node.js</span>
                            <span class="hub-meta-tag hub-meta-prod">Railway</span>
                        </div>
                    </div>
                    <div class="hub-card-actions">
                        <button class="hub-btn hub-btn-sm hub-btn-purple" onclick="window.open('https://t.me/HMRNexusBot','_blank')">Abrir ↗</button>
                    </div>
                </div>

                <div class="hub-card hub-card-app" data-app="fieldreport">
                    <div class="hub-card-glow hub-glow-teal"></div>
                    <div class="hub-card-content">
                        <div class="hub-app-header">
                            <div class="hub-app-icon hub-app-icon-teal">📋</div>
                            <div class="hub-app-status hub-status-cloud"></div>
                        </div>
                        <div class="hub-app-name">Field Report</div>
                        <div class="hub-app-desc">Gestion de citas equipos de campo</div>
                        <div class="hub-app-meta">
                            <span class="hub-meta-tag">PWA</span>
                            <span class="hub-meta-tag hub-meta-prod">GitHub</span>
                        </div>
                    </div>
                    <div class="hub-card-actions">
                        <button class="hub-btn hub-btn-sm hub-btn-teal" onclick="window.open('https://jarl9801.github.io/field-report/','_blank')">Abrir ↗</button>
                    </div>
                </div>

            </div>
        </div>

        <!-- Operaciones -->
        <div class="hub-section">
            <div class="hub-section-header">
                <h2 class="hub-section-title">📡 Operaciones</h2>
            </div>
            <div class="hub-grid">

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">🔵</span>
                        <div>
                            <div class="hub-card-name">WestConnect — Tech View</div>
                            <div class="hub-card-desc">Vista tecnica para equipos WestConnect</div>
                        </div>
                    </div>
                    <div class="hub-pins">
                        <div class="hub-pin-title">PINs de equipo</div>
                        <div class="hub-pin-grid">
                            <span class="hub-pin"><b>West-001</b> 2345</span>
                            <span class="hub-pin"><b>West-002</b> 3456</span>
                            <span class="hub-pin"><b>West-003</b> 4567</span>
                            <span class="hub-pin"><b>West-004</b> 5678</span>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/westconnect.html','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">🟢</span>
                        <div>
                            <div class="hub-card-name">Glasfaser Plus — Tech View</div>
                            <div class="hub-card-desc">Vista tecnica para equipos Glasfaser Plus</div>
                        </div>
                    </div>
                    <div class="hub-pins">
                        <div class="hub-pin-title">PINs de equipo</div>
                        <div class="hub-pin-grid">
                            <span class="hub-pin"><b>Plus-001</b> 1234</span>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/glasfaser.html','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">📊</span>
                        <div>
                            <div class="hub-card-name">Field Report Admin</div>
                            <div class="hub-card-desc">Admin citas — asignacion y seguimiento</div>
                            <div class="hub-card-desc" style="color:var(--accent);font-size:11px;">PIN Isabelle: 0223 · Integrado en Citas NE4</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/field-report/admin.html','_blank')">Abrir ↗</button>
                </div>

                <div class="hub-card">
                    <div class="hub-card-header">
                        <span class="hub-icon">🌐</span>
                        <div>
                            <div class="hub-card-name">GO FiberConnect</div>
                            <div class="hub-card-desc">Fuente de datos de proyectos · Requiere 2FA</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://dg.connectsoftware.nl','_blank')">Abrir ↗</button>
                </div>

            </div>
        </div>

        <!-- Google Sheets -->
        <div class="hub-section">
            <div class="hub-section-header">
                <h2 class="hub-section-title">📑 Google Sheets</h2>
            </div>
            <div class="hub-grid hub-grid-sheets">
                <a class="hub-sheet-card" href="https://docs.google.com/spreadsheets/d/1g3-t2_02wSLpg2LPBvRgEFY3EFjYPxZJTfpyoAa--EE" target="_blank">
                    <span class="hub-sheet-icon">💨</span>
                    <span class="hub-sheet-name">Soplado RD</span>
                </a>
                <a class="hub-sheet-card" href="https://docs.google.com/spreadsheets/d/1jLQf3brTId_hU2nmU16BapEvTYxYDbJJyR6IV_u7MOc" target="_blank">
                    <span class="hub-sheet-icon">💨</span>
                    <span class="hub-sheet-name">Soplado RA</span>
                </a>
                <a class="hub-sheet-card" href="https://docs.google.com/spreadsheets/d/1Ssq_EYReehe8ddOrho1B08CzTocXYr2o7Qlnf73gxcs" target="_blank">
                    <span class="hub-sheet-icon">🔧</span>
                    <span class="hub-sheet-name">Fusiones DP</span>
                </a>
                <a class="hub-sheet-card" href="https://docs.google.com/spreadsheets/d/19gmi3TLzhlsfq5K_l5-T1EmDt7EheTkouqMEFcUYPUw" target="_blank">
                    <span class="hub-sheet-icon">📋</span>
                    <span class="hub-sheet-name">Field Reports</span>
                </a>
            </div>
        </div>

        <!-- Legacy -->
        <div class="hub-section">
            <div class="hub-section-header">
                <h2 class="hub-section-title">🗂️ Legacy</h2>
            </div>
            <div class="hub-grid hub-grid-legacy">
                <div class="hub-card hub-card-legacy">
                    <div class="hub-card-header">
                        <span class="hub-icon">⚙️</span>
                        <div>
                            <div class="hub-card-name">Work Manager v1 <span class="hub-badge-legacy">Legacy</span></div>
                            <div class="hub-card-desc">En migracion a v2</div>
                        </div>
                    </div>
                    <button class="hub-btn" onclick="window.open('https://jarl9801.github.io/work-manager/','_blank')">Abrir ↗</button>
                </div>
            </div>
        </div>

    </div>`;

    // Animacion de entrada para las cards
    setTimeout(() => {
        document.querySelectorAll('.hub-card-app').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 80);
        });
    }, 50);
};
