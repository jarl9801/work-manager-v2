// Dashboard view
window.render_dashboard = async function() {
    const container = document.getElementById('view-dashboard');
    const projects = await DB.getAll('projects');
    const records = await DB.getAll('records');
    const teams = await DB.getAll('teams');
    const clients = await DB.getAll('clients');

    const activeProjects = projects.filter(p => p.status === 'active');

    // NE4 local DB stats
    const ne4Records = records.filter(r => r.line === 'NE4');
    const totalWEs = ne4Records.reduce((s, r) => s + (r.wes || 0), 0);

    // Current KW (ISO)
    function getISOWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    function kwFromDateStr(str) {
        if (!str) return null;
        const [datePart] = str.split(' ');
        const [m, d, y] = datePart.split('/');
        const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return 'KW' + String(getISOWeek(date)).padStart(2, '0');
    }

    const now = new Date();
    const nowKW = 'KW' + String(getISOWeek(now)).padStart(2, '0');
    const thisWeekNE4 = ne4Records.filter(r => r.kw === nowKW);
    const weekWEs = thisWeekNE4.reduce((s, r) => s + (r.wes || 0), 0);

    // Render shell immediately, then update with real NE3 data
    container.innerHTML = `
        <div class="kpi-grid" id="dashKpiGrid">
            <div class="kpi-card">
                <div class="kpi-label">${I18N.totalProjects}</div>
                <div class="kpi-value blue">${activeProjects.length}</div>
                <div class="kpi-sub">${projects.filter(p => p.lines && p.lines.includes('NE3')).length} NE3 · ${projects.filter(p => p.lines && p.lines.includes('NE4')).length} NE4</div>
            </div>
            <div class="kpi-card" id="dashNE3Card">
                <div class="kpi-label">Producción NE3 — Soplado</div>
                <div class="kpi-value green" id="dashNE3Metros">…</div>
                <div class="kpi-sub" id="dashNE3Sub">Cargando…</div>
            </div>
            <div class="kpi-card" id="dashFusionCard">
                <div class="kpi-label">Producción NE3 — Fusiones</div>
                <div class="kpi-value blue" id="dashFusiones">…</div>
                <div class="kpi-sub" id="dashFusionSub">Cargando…</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Producción NE4</div>
                <div class="kpi-value green">${totalWEs}</div>
                <div class="kpi-sub">WEs · ${nowKW}: ${weekWEs}</div>
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
                        ${hasNE3 ? `<div><div class="project-stat-label">Metros (ML)</div><div class="project-stat-value" id="dash-proj-${p.code}-metros">—</div></div>` : ''}
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
            <div class="title">Sin registros manuales de producción</div>
            <div class="desc">Ve a Producción para ver los datos en tiempo real desde Google Sheets</div>
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

    // Async: fetch sheets.json and update NE3 cards
    const SHEETS_URL = 'https://jarl9801.github.io/work-manager/data/sheets.json';
    try {
        // Use cached data if available
        let data = window._sheetsData;
        if (!data) {
            const res = await fetch(SHEETS_URL + '?_=' + Date.now());
            if (res.ok) {
                data = await res.json();
                window._sheetsData = data;
                window._sheetsDataLoaded = true;
            }
        }

        if (data) {
            const soplado = data.soplado_rd || [];
            const fusion = data.fusion || [];

            const totalMetros = soplado.reduce((s, r) => s + (parseFloat(r['Metros Soplados']) || 0), 0);
            const totalFusiones = fusion.reduce((s, r) => s + (parseInt(r['Fusiones']) || 0), 0);

            const weekSoplado = soplado.filter(r => kwFromDateStr(r['Timestamp']) === nowKW);
            const weekFusion = fusion.filter(r => kwFromDateStr(r['Timestamp']) === nowKW);
            const weekMetros = weekSoplado.reduce((s, r) => s + (parseFloat(r['Metros Soplados']) || 0), 0);
            const weekFusionesCount = weekFusion.reduce((s, r) => s + (parseInt(r['Fusiones']) || 0), 0);

            const updatedStr = data.updated
                ? new Date(data.updated).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '—';

            const el = (id) => document.getElementById(id);
            if (el('dashNE3Metros')) el('dashNE3Metros').textContent = totalMetros.toLocaleString('de-DE') + ' m';
            if (el('dashNE3Sub')) el('dashNE3Sub').textContent = `${nowKW}: ${weekMetros.toLocaleString('de-DE')} m · act. ${updatedStr}`;
            if (el('dashFusiones')) el('dashFusiones').textContent = totalFusiones.toLocaleString('de-DE');
            if (el('dashFusionSub')) el('dashFusionSub').textContent = `${nowKW}: ${weekFusionesCount} fusiones`;

            // Update per-project meters from sheets
            const projMetros = {};
            soplado.forEach(r => {
                const code = r['Código de Proyecto'];
                if (code) projMetros[code] = (projMetros[code] || 0) + (parseFloat(r['Metros Soplados']) || 0);
            });
            Object.entries(projMetros).forEach(([code, metros]) => {
                const el2 = document.getElementById(`dash-proj-${code}-metros`);
                if (el2) el2.textContent = metros.toLocaleString('de-DE') + ' m';
            });
        }
    } catch(e) {
        console.warn('Dashboard: failed to load sheets.json', e);
        const el = (id) => document.getElementById(id);
        if (el('dashNE3Metros')) el('dashNE3Metros').textContent = '—';
        if (el('dashNE3Sub')) el('dashNE3Sub').textContent = 'No disponible';
        if (el('dashFusiones')) el('dashFusiones').textContent = '—';
        if (el('dashFusionSub')) el('dashFusionSub').textContent = 'No disponible';
    }
};
