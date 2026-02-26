// Dashboard view
window.render_dashboard = async function() {
    const container = document.getElementById('view-dashboard');
    const projects = await DB.getAll('projects');
    const records = await DB.getAll('records');
    const teams = await DB.getAll('teams');
    const clients = await DB.getAll('clients');

    const activeProjects = projects.filter(p => p.status === 'active');
    const ne3Records = records.filter(r => r.line === 'NE3');
    const ne4Records = records.filter(r => r.line === 'NE4');

    // Current KW
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const currentKW = Math.ceil(((now - start) / 86400000 + start.getDay()) / 7);
    const kwStr = 'KW' + String(currentKW).padStart(2, '0');
    const thisWeekRecords = records.filter(r => r.kw === kwStr);

    // Calc KPIs
    const totalMeters = ne3Records.reduce((s, r) => s + (r.meters || 0), 0);
    const totalWEs = ne4Records.reduce((s, r) => s + (r.wes || 0), 0);
    const weekMeters = thisWeekRecords.filter(r => r.line === 'NE3').reduce((s, r) => s + (r.meters || 0), 0);
    const weekWEs = thisWeekRecords.filter(r => r.line === 'NE4').reduce((s, r) => s + (r.wes || 0), 0);

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">${I18N.totalProjects}</div>
                <div class="kpi-value blue">${activeProjects.length}</div>
                <div class="kpi-sub">${projects.filter(p => p.lines && p.lines.includes('NE3')).length} NE3 · ${projects.filter(p => p.lines && p.lines.includes('NE4')).length} NE4</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Producción NE3</div>
                <div class="kpi-value green">${totalMeters.toLocaleString('de-DE')} m</div>
                <div class="kpi-sub">Esta semana: ${weekMeters.toLocaleString('de-DE')} m</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Producción NE4</div>
                <div class="kpi-value green">${totalWEs}</div>
                <div class="kpi-sub">WEs · Esta semana: ${weekWEs}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">${I18N.teams}</div>
                <div class="kpi-value blue">${teams.length}</div>
                <div class="kpi-sub">${teams.reduce((s, t) => s + (t.members ? t.members.length : 0), 0)} técnicos</div>
            </div>
        </div>

        <div class="section-header">
            <div>
                <div class="section-title">Proyectos activos</div>
                <div class="section-sub">${activeProjects.length} proyectos en curso</div>
            </div>
        </div>

        <div class="project-grid">
            ${activeProjects.map(p => {
                const pRecords = records.filter(r => r.projectCode === p.code);
                const pMeters = pRecords.filter(r => r.line === 'NE3').reduce((s, r) => s + (r.meters || 0), 0);
                const pWEs = pRecords.filter(r => r.line === 'NE4').reduce((s, r) => s + (r.wes || 0), 0);
                const hasNE3 = p.lines && p.lines.includes('NE3');
                const hasNE4 = p.lines && p.lines.includes('NE4');
                const operator = PROJECT_SEED.operators.find(o => o.id === p.operatorId);
                const client = PROJECT_SEED.clients.find(c => c.id === p.clientId);

                return `
                <div class="project-card" onclick="window.navigate('projects')">
                    <div class="project-card-header">
                        <div>
                            <div class="project-code">${p.code}</div>
                            <div class="project-name">${p.name}</div>
                            <div class="project-meta">${client ? client.name : p.clientId} → ${operator ? operator.name : p.operatorId}</div>
                        </div>
                        <div>
                            ${hasNE3 ? '<span class="badge badge-blue">NE3</span>' : ''}
                            ${hasNE4 ? '<span class="badge badge-green">NE4</span>' : ''}
                        </div>
                    </div>
                    <div class="project-stats">
                        ${hasNE3 ? `<div><div class="project-stat-label">Metros (ML)</div><div class="project-stat-value">${pMeters.toLocaleString('de-DE')}</div></div>` : ''}
                        ${hasNE4 ? `<div><div class="project-stat-label">WEs</div><div class="project-stat-value">${pWEs}</div></div>` : ''}
                        <div><div class="project-stat-label">Registros</div><div class="project-stat-value">${pRecords.length}</div></div>
                    </div>
                </div>`;
            }).join('')}
        </div>

        <div id="dashGfpStats" class="kpi-grid" style="margin-top:24px;display:none;">
            <div class="kpi-card">
                <div class="kpi-label">📋 Citas GFP (Umtelkomd)</div>
                <div class="kpi-value teal" id="dashGfpTotal">—</div>
                <div class="kpi-sub" id="dashGfpWeek">Esta semana: —</div>
            </div>
        </div>

        ${records.length === 0 ? `
        <div class="empty-state" style="margin-top: 40px">
            <div class="icon">📊</div>
            <div class="title">Sin registros de producción</div>
            <div class="desc">Ve a Producción para agregar registros semanales</div>
        </div>` : ''}
    `;

    // Try loading GFP stats in background
    try {
        const stats = window.getGfpCitasStats && window.getGfpCitasStats();
        if (stats) {
            document.getElementById('dashGfpStats').style.display = '';
            document.getElementById('dashGfpTotal').textContent = stats.total;
            document.getElementById('dashGfpWeek').textContent = 'Esta semana: ' + stats.thisWeek;
        }
    } catch(e) {}
};
