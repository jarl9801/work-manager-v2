// field-admin.js — Admin Dashboard (integrated into WM v2)
(function() {
    'use strict';
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec';
    const CITAS_JSON = 'https://umtelkomd.github.io/field-report/citas.json';

    let allData = [];
    let filteredData = [];
    let adminTeams = ['West-001','West-002','West-003','West-004'];
    let citasCache = {};
    let currentTab = 'overview';

    const STATUS_MAP = {
        'completed-ok':    { label:'Finalizada OK', badge:'ok',     color:'var(--green)' },
        'client-absent':   { label:'Ausente',       badge:'absent', color:'var(--orange)' },
        'previous-states': { label:'Estados Prev.', badge:'hold',   color:'var(--orange)' },
        'client-reschedule':{ label:'Recitar',      badge:'absent', color:'var(--orange)' },
        'on-hold':         { label:'Paralizada',    badge:'hold',   color:'var(--orange)' },
        'preinstalled':    { label:'Preinstalada',  badge:'pre',    color:'var(--blue)' },
        'completed-not-ok':{ label:'No OK',         badge:'notok',  color:'var(--red)' },
    };

    function parseTime(val) {
        if (!val) return '';
        if (typeof val === 'string' && val.includes('1899')) { const m = val.match(/T(\d{2}:\d{2})/); return m ? m[1] : ''; }
        if (typeof val === 'string' && /^\d{2}:\d{2}/.test(val)) return val.substring(0,5);
        return String(val);
    }
    function calcDuration(s, e) { if(!s||!e) return 0; const [sh,sm]=s.split(':').map(Number); const [eh,em]=e.split(':').map(Number); return (eh*60+em)-(sh*60+sm); }
    function fmtDuration(m) { if(!m||m<=0) return '—'; const h=Math.floor(m/60),mn=m%60; return h>0?`${h}h ${mn}m`:`${mn}m`; }

    // ── RENDER ──
    window.render_fieldadmin = function() {
        const el = document.getElementById('view-fieldadmin');
        el.innerHTML = getCSS() + `
            <div class="fa-container">
                <div class="fa-topbar">
                    <h1>📊 Field Report <span style="color:var(--green);">Admin</span></h1>
                    <div style="display:flex;gap:8px;">
                        <button class="fa-btn fa-btn-outline" onclick="window.faExportCSV()">📥 CSV</button>
                        <button class="fa-btn fa-btn-green" onclick="window.faLoadData()">🔄 Actualizar</button>
                    </div>
                </div>

                <div class="fa-tabs">
                    <div class="fa-tab active" onclick="window.faSwitchTab('overview')">📊 Resumen</div>
                    <div class="fa-tab" onclick="window.faSwitchTab('citas')">📅 Citas</div>
                    <div class="fa-tab" onclick="window.faSwitchTab('reports')">📋 Reportes</div>
                    <div class="fa-tab" onclick="window.faSwitchTab('teams')">👥 Equipos</div>
                </div>

                <div class="fa-filters">
                    <div class="fa-filter-group">
                        <span class="fa-filter-label">Periodo:</span>
                        <select class="fa-filter-select" id="faFilterPeriod" onchange="window.faApplyFilters()">
                            <option value="today">Hoy</option><option value="week">Esta semana</option>
                            <option value="month" selected>Este mes</option><option value="all">Todo</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    <div class="fa-filter-group" id="faCustomDates" style="display:none;">
                        <input type="date" class="fa-filter-input" id="faFilterFrom" onchange="window.faApplyFilters()">
                        <span class="fa-filter-label">→</span>
                        <input type="date" class="fa-filter-input" id="faFilterTo" onchange="window.faApplyFilters()">
                    </div>
                    <div class="fa-filter-group">
                        <span class="fa-filter-label">Cliente:</span>
                        <select class="fa-filter-select" id="faFilterClient" onchange="window.faApplyFilters()">
                            <option value="">Todos</option><option value="glasfaser-plus">GFP</option><option value="westconnect">WC</option>
                        </select>
                    </div>
                    <div class="fa-filter-group">
                        <span class="fa-filter-label">Equipo:</span>
                        <select class="fa-filter-select" id="faFilterTeam" onchange="window.faApplyFilters()"><option value="">Todos</option></select>
                    </div>
                    <div class="fa-filter-group">
                        <span class="fa-filter-label">Estado:</span>
                        <select class="fa-filter-select" id="faFilterStatus" onchange="window.faApplyFilters()">
                            <option value="">Todos</option>
                            ${Object.entries(STATUS_MAP).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div id="fa-tab-overview"></div>
                <div id="fa-tab-citas" style="display:none;"></div>
                <div id="fa-tab-reports" style="display:none;"></div>
                <div id="fa-tab-teams" style="display:none;"></div>
                <div id="fa-loading" class="fa-loading" style="display:none;"><div class="fa-spinner"></div><p>Cargando datos...</p></div>
            </div>`;
        loadData();
        loadTeamsForAdmin();
    };

    window.faLoadData = loadData;
    window.faApplyFilters = applyFilters;

    async function loadData() {
        document.getElementById('fa-loading').style.display = 'block';
        try {
            const resp = await fetch(SCRIPT_URL + '?action=getReports');
            const json = await resp.json();
            const raw = json.reports || json.data || json || [];
            const NORM = { 'completed':'completed-ok', 'not-ok':'completed-not-ok', 'absent':'client-absent' };
            allData = raw.map(r => ({
                ...r, workStatus: NORM[r.workStatus] || r.workStatus,
                date: r.date || (r.timestamp ? r.timestamp.split('T')[0] : ''),
                startTime: parseTime(r.startTime), endTime: parseTime(r.endTime),
                duration: calcDuration(parseTime(r.startTime), parseTime(r.endTime)),
                photoCount: r.photoCount || 0,
            }));
            populateTeamFilter();
            applyFilters();
        } catch(e) {
            console.error('Load error:', e);
            allData = []; applyFilters();
        }
        document.getElementById('fa-loading').style.display = 'none';
    }

    function populateTeamFilter() {
        const teams = [...new Set(allData.map(r => r.team).filter(Boolean))].sort();
        const sel = document.getElementById('faFilterTeam');
        if (sel) sel.innerHTML = '<option value="">Todos</option>' + teams.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    function applyFilters() {
        const period = document.getElementById('faFilterPeriod')?.value || 'month';
        const client = document.getElementById('faFilterClient')?.value || '';
        const team = document.getElementById('faFilterTeam')?.value || '';
        const status = document.getElementById('faFilterStatus')?.value || '';
        const cd = document.getElementById('faCustomDates');
        if (cd) cd.style.display = period === 'custom' ? 'flex' : 'none';

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        filteredData = allData.filter(r => {
            if (client && r.client !== client) return false;
            if (team && r.team !== team) return false;
            if (status && r.workStatus !== status) return false;
            if (period === 'today') return r.date === today;
            if (period === 'week') {
                const d = new Date(r.date + 'T12:00:00');
                const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7)); mon.setHours(0,0,0,0);
                const sun = new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999);
                return d >= mon && d <= sun;
            }
            if (period === 'month') return r.date.startsWith(today.substring(0,7));
            if (period === 'custom') {
                const from = document.getElementById('faFilterFrom')?.value;
                const to = document.getElementById('faFilterTo')?.value;
                if (from && r.date < from) return false;
                if (to && r.date > to) return false;
            }
            return true;
        });
        filteredData.sort((a,b) => (b.timestamp||b.date).localeCompare(a.timestamp||a.date));
        render();
    }

    function render() {
        renderKPIs();
        renderDailyChart();
        renderStatusChart();
        renderTeamChart();
        renderTimeChart();
        renderTable();
        renderTeams();
    }

    function renderKPIs() {
        const total = filteredData.length;
        const ok = filteredData.filter(r => r.workStatus === 'completed-ok').length;
        const notOk = filteredData.filter(r => r.workStatus === 'completed-not-ok').length;
        const absent = filteredData.filter(r => r.workStatus === 'client-absent').length;
        const pre = filteredData.filter(r => r.workStatus === 'preinstalled').length;
        const avgDur = total > 0 ? Math.round(filteredData.reduce((s,r) => s+(r.duration||0),0)/total) : 0;
        const rate = total > 0 ? Math.round((ok+pre)/total*100) : 0;
        const days = new Set(filteredData.map(r => r.date)).size;
        const avgDay = days > 0 ? (total/days).toFixed(1) : 0;

        const el = document.getElementById('fa-tab-overview');
        if (!el) return;
        el.innerHTML = `
            <div class="fa-kpi-grid">
                <div class="fa-kpi"><div class="fa-kpi-value" style="color:var(--green)">${total}</div><div class="fa-kpi-label">Total Reportes</div><div class="fa-kpi-sub">${avgDay}/día</div></div>
                <div class="fa-kpi"><div class="fa-kpi-value" style="color:var(--green)">${ok}</div><div class="fa-kpi-label">Finalizadas OK</div><div class="fa-kpi-sub">${pre} preinstaladas</div></div>
                <div class="fa-kpi"><div class="fa-kpi-value" style="color:var(--orange)">${absent}</div><div class="fa-kpi-label">Ausentes</div><div class="fa-kpi-sub">${notOk} No OK</div></div>
                <div class="fa-kpi"><div class="fa-kpi-value" style="color:var(--blue)">${rate}%</div><div class="fa-kpi-label">Tasa Éxito</div><div class="fa-kpi-sub">OK + Pre</div></div>
                <div class="fa-kpi"><div class="fa-kpi-value" style="color:var(--purple)">${fmtDuration(avgDur)}</div><div class="fa-kpi-label">Duración Prom.</div><div class="fa-kpi-sub">${days} días</div></div>
            </div>
            <div class="fa-charts-row">
                <div class="fa-chart-card"><div class="fa-chart-title">📈 Reportes por Día</div><div id="faChartDaily"></div></div>
                <div class="fa-chart-card"><div class="fa-chart-title">📊 Estados</div><div id="faChartStatus"></div></div>
            </div>
            <div class="fa-charts-row">
                <div class="fa-chart-card"><div class="fa-chart-title">👥 Por Equipo</div><div id="faChartTeams"></div></div>
                <div class="fa-chart-card"><div class="fa-chart-title">⏱ Tiempo Promedio</div><div id="faChartTime"></div></div>
            </div>`;
        renderDailyChart(); renderStatusChart(); renderTeamChart(); renderTimeChart();
    }

    function renderDailyChart() {
        const byday = {};
        filteredData.forEach(r => { byday[r.date]=(byday[r.date]||0)+1; });
        const days = Object.keys(byday).sort().slice(-7);
        const max = Math.max(...days.map(d => byday[d]), 1);
        const el = document.getElementById('faChartDaily');
        if (!el) return;
        el.innerHTML = days.map(d => {
            const pct = (byday[d]/max*100).toFixed(0);
            const nm = new Date(d+'T12:00:00').toLocaleDateString('es',{weekday:'short',day:'numeric'});
            return `<div class="fa-bar-row"><div class="fa-bar-label">${nm}</div><div class="fa-bar-track"><div class="fa-bar-fill green" style="width:${pct}%">${byday[d]}</div></div></div>`;
        }).join('') || '<div class="fa-empty">Sin datos</div>';
    }

    function renderStatusChart() {
        const counts = {};
        filteredData.forEach(r => { const s = r.workStatus||'unknown'; counts[s]=(counts[s]||0)+1; });
        const total = filteredData.length || 1;
        const colors = { 'completed-ok':'var(--green)', 'preinstalled':'var(--blue)', 'client-absent':'var(--orange)', 'on-hold':'#ffab40', 'previous-states':'#ff9800', 'client-reschedule':'#ffd54f', 'completed-not-ok':'var(--red)' };
        let offset = 0;
        const segs = Object.entries(counts).map(([s,c]) => {
            const pct = c/total*100;
            const seg = `<circle cx="60" cy="60" r="45" fill="none" stroke="${colors[s]||'#666'}" stroke-width="20" stroke-dasharray="${pct} ${100-pct}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)"/>`;
            offset += pct; return seg;
        });
        const legend = Object.entries(counts).map(([s,c]) => {
            const info = STATUS_MAP[s] || {label:s}; return `<div style="display:flex;align-items:center;gap:6px;font-size:12px;"><div style="width:10px;height:10px;border-radius:50%;background:${colors[s]||'#666'};flex-shrink:0;"></div>${info.label}: <strong>${c}</strong> (${(c/total*100).toFixed(0)}%)</div>`;
        }).join('');
        const el = document.getElementById('faChartStatus');
        if (!el) return;
        el.innerHTML = `<div style="display:flex;align-items:center;gap:20px;"><svg viewBox="0 0 120 120" style="width:120px;height:120px;">${segs.join('')}<text x="60" y="60" text-anchor="middle" dominant-baseline="central" fill="var(--text-primary)" font-size="20" font-weight="800">${filteredData.length}</text></svg><div style="display:flex;flex-direction:column;gap:6px;">${legend}</div></div>`;
    }

    function renderTeamChart() {
        const byt = {}; filteredData.forEach(r => { const t=r.team||'—'; byt[t]=(byt[t]||0)+1; });
        const entries = Object.entries(byt).sort((a,b)=>b[1]-a[1]);
        const max = Math.max(...entries.map(e=>e[1]),1);
        const el = document.getElementById('faChartTeams');
        if (!el) return;
        el.innerHTML = entries.map(([t,c]) => {
            const pct = (c/max*100).toFixed(0);
            return `<div class="fa-bar-row"><div class="fa-bar-label">${t}</div><div class="fa-bar-track"><div class="fa-bar-fill blue" style="width:${pct}%">${c}</div></div></div>`;
        }).join('') || '<div class="fa-empty">Sin datos</div>';
    }

    function renderTimeChart() {
        const bys = {};
        filteredData.forEach(r => { const s=r.workStatus||'?'; if(!bys[s]) bys[s]={total:0,count:0}; bys[s].total+=r.duration||0; bys[s].count++; });
        const entries = Object.entries(bys).map(([s,v])=>({status:s,avg:Math.round(v.total/v.count)})).sort((a,b)=>b.avg-a.avg);
        const max = Math.max(...entries.map(e=>e.avg),1);
        const el = document.getElementById('faChartTime');
        if (!el) return;
        el.innerHTML = entries.map(e => {
            const info = STATUS_MAP[e.status]||{label:e.status}; const pct=(e.avg/max*100).toFixed(0);
            return `<div class="fa-bar-row"><div class="fa-bar-label">${info.label}</div><div class="fa-bar-track"><div class="fa-bar-fill blue" style="width:${pct}%">${fmtDuration(e.avg)}</div></div></div>`;
        }).join('') || '<div class="fa-empty">Sin datos</div>';
    }

    function renderTable() {
        const el = document.getElementById('fa-tab-reports');
        if (!el) return;
        const rows = filteredData.slice(0,100).map(r => {
            const info = STATUS_MAP[r.workStatus]||{label:r.workStatus||'—',badge:'hold'};
            const order = r.orderNumber||r.ha||'—';
            const clientBadge = r.client==='glasfaser-plus'?'<span class="fa-badge fa-badge-ok">GFP</span>':'<span class="fa-badge fa-badge-pre">WC</span>';
            return `<tr>
                <td>${r.date}</td><td>${r.team||'—'}</td><td>${r.technician||'—'}</td>
                <td>${clientBadge}</td><td><span class="fa-badge fa-badge-${info.badge}">${info.label}</span></td>
                <td style="font-family:monospace;font-size:12px;">${order}</td>
                <td>${r.startTime||'—'} → ${r.endTime||'—'}</td><td>${fmtDuration(r.duration)}</td>
                <td>📷 ${r.photoCount||0}</td>
                <td>${r.driveUrl?`<a href="${r.driveUrl}" target="_blank" style="color:var(--green);">📁</a>`:'—'}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-secondary);">📋 Sin reportes</td></tr>';

        el.innerHTML = `<div class="fa-table-card">
            <div class="fa-table-header"><h3>📋 Todos los Reportes</h3><span style="font-size:13px;color:var(--text-secondary);">${filteredData.length} reportes</span></div>
            <div class="fa-table-scroll"><table>
                <thead><tr><th>Fecha</th><th>Equipo</th><th>Técnico</th><th>Cliente</th><th>Estado</th><th>Orden/HA</th><th>Horario</th><th>Duración</th><th>📷</th><th>📁</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div></div>`;
    }

    function renderTeams() {
        const byt = {};
        filteredData.forEach(r => {
            const t = r.team||'—';
            if (!byt[t]) byt[t] = {total:0,ok:0,notOk:0,techs:{},totalTime:0};
            byt[t].total++; byt[t].totalTime += r.duration||0;
            if (['completed-ok','preinstalled'].includes(r.workStatus)) byt[t].ok++;
            if (r.workStatus === 'completed-not-ok') byt[t].notOk++;
            const tech = r.technician?.trim() || `(${r.team||'—'})`;
            if (!byt[t].techs[tech]) byt[t].techs[tech] = {total:0,ok:0,notOk:0,totalTime:0};
            byt[t].techs[tech].total++; byt[t].techs[tech].totalTime += r.duration||0;
            if (['completed-ok','preinstalled'].includes(r.workStatus)) byt[t].techs[tech].ok++;
            if (r.workStatus === 'completed-not-ok') byt[t].techs[tech].notOk++;
        });

        const colors = ['var(--green)','var(--blue)','var(--orange)','var(--purple)','var(--red)'];
        const teamCards = Object.entries(byt).map(([name,d],i) => {
            const rate = d.total>0?Math.round(d.ok/d.total*100):0;
            return `<div class="fa-kpi"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-weight:700;">${name}</div><div style="font-size:24px;font-weight:800;color:${colors[i%colors.length]}">${d.total}</div>
            </div><div style="font-size:12px;color:var(--text-secondary);">✅ ${d.ok} OK · ❌ ${d.notOk} No OK · 📊 ${rate}%</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">⏱ ${fmtDuration(Math.round(d.totalTime/d.total))} prom · 👤 ${Object.keys(d.techs).length} técnicos</div></div>`;
        }).join('');

        const allTechs = [];
        Object.entries(byt).forEach(([team,d]) => {
            Object.entries(d.techs).forEach(([tech,td]) => {
                allTechs.push({ tech, team, ...td, avg:Math.round(td.totalTime/td.total), rate:td.total>0?Math.round(td.ok/td.total*100):0 });
            });
        });
        allTechs.sort((a,b) => b.total-a.total);

        const el = document.getElementById('fa-tab-teams');
        if (!el) return;
        el.innerHTML = `<div class="fa-kpi-grid">${teamCards}</div>
            <div class="fa-table-card" style="margin-top:16px;">
                <div class="fa-table-header"><h3>👤 Detalle por Técnico</h3></div>
                <div class="fa-table-scroll"><table>
                    <thead><tr><th>Técnico</th><th>Equipo</th><th>Reportes</th><th>OK</th><th>No OK</th><th>Éxito</th><th>T. Prom.</th></tr></thead>
                    <tbody>${allTechs.map(t => `<tr>
                        <td>${t.tech}</td><td>${t.team}</td><td><strong>${t.total}</strong></td>
                        <td style="color:var(--green)">${t.ok}</td><td style="color:var(--red)">${t.notOk}</td>
                        <td><span class="fa-badge ${t.rate>=80?'fa-badge-ok':t.rate>=50?'fa-badge-absent':'fa-badge-notok'}">${t.rate}%</span></td>
                        <td>${fmtDuration(t.avg)}</td>
                    </tr>`).join('')}</tbody>
                </table></div></div>`;
    }

    // ── CITAS TAB ──
    async function loadTeamsForAdmin() {
        try {
            const resp = await fetch(SCRIPT_URL + '?action=getConfig');
            const data = await resp.json();
            if (data.teams) adminTeams = data.teams.filter(t => (t.client||'').toLowerCase().includes('westconnect')).map(t => t.name);
        } catch(_) {}
    }

    function renderCitasTab() {
        const el = document.getElementById('fa-tab-citas');
        if (!el) return;
        el.innerHTML = `<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
            <input type="date" id="faCitasDate" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:14px;">
            <button class="fa-btn fa-btn-green" onclick="window.faLoadCitas()">🔄 Cargar</button>
            <button class="fa-btn fa-btn-outline" onclick="document.getElementById('faCitasDate').value='';window.faLoadCitas()">📋 Todas</button>
            <span id="faCitasStatus" style="font-size:13px;color:var(--text-secondary);"></span>
        </div>
        <div id="faCitasLoading" style="text-align:center;padding:40px;color:var(--text-secondary);">Selecciona fecha y carga las citas</div>
        <div id="faCitasEmpty" style="display:none;text-align:center;padding:40px;color:var(--text-secondary);">📭 Sin citas</div>
        <div id="faCitasGrid"></div>`;
    }

    window.faLoadCitas = async function() {
        const dateStr = document.getElementById('faCitasDate')?.value || '';
        const loading = document.getElementById('faCitasLoading');
        const empty = document.getElementById('faCitasEmpty');
        const grid = document.getElementById('faCitasGrid');
        if (loading) { loading.style.display = 'block'; loading.textContent = '⏳ Cargando citas…'; }
        if (empty) empty.style.display = 'none';
        if (grid) grid.innerHTML = '';

        try {
            const resp = await fetch(CITAS_JSON + '?t=' + Date.now());
            const data = await resp.json();
            const today = new Date().toISOString().split('T')[0];
            const allCitas = (data.citas || []).filter(c => c.fecha >= today);
            const citas = dateStr ? allCitas.filter(c => c.fecha === dateStr) : allCitas;
            citasCache = {};
            allCitas.forEach(c => { citasCache[c.id] = c; });
            if (loading) loading.style.display = 'none';
            if (citas.length === 0) { if (empty) empty.style.display = 'block'; return; }

            const DONE = ['finalizada_ok','finalizada_no_ok','cliente_ausente','recitar','paralizada','cancelada'];
            const SL = { libre:'Libre', asignada:'Asignada', capturada:'Capturada', en_trabajo:'En trabajo', finalizada_ok:'Finalizada ✓', finalizada_no_ok:'Finalizada ✗', cliente_ausente:'Ausente', recitar:'Recitar', paralizada:'Paralizada' };
            const teamOpts = adminTeams.map(t => `<option value="${t}">${t}</option>`).join('');

            const byDate = {};
            citas.forEach(c => { if (!byDate[c.fecha]) byDate[c.fecha] = []; byDate[c.fecha].push(c); });

            const DAY = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
            const MON = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
            function fmtDate(d) { const dt = new Date(d+'T12:00:00'); return `${DAY[dt.getDay()]} ${dt.getDate()} ${MON[dt.getMonth()]}`; }

            grid.innerHTML = Object.keys(byDate).sort().map(fecha => `
                <div style="margin-bottom:24px;">
                    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--blue);border-bottom:1px solid var(--border);padding-bottom:6px;margin-bottom:10px;">
                        📅 ${fmtDate(fecha)} <span style="color:var(--text-secondary);font-weight:400;">(${byDate[fecha].length} cita${byDate[fecha].length>1?'s':''})</span>
                    </div>
                    ${byDate[fecha].map(c => {
                        const isDone = DONE.includes(c.status);
                        const badgeCls = isDone ? 'fa-badge-hold' : (c.status === 'asignada' ? 'fa-badge-pre' : c.status === 'en_trabajo' ? 'fa-badge-ok' : c.status === 'capturada' ? 'fa-badge-absent' : 'fa-badge-hold');
                        const addr = c.calle ? `${c.calle}, ${c.cp} ${c.ciudad}`.trim() : (c.ciudad || '—');
                        const sel = c.equipo ? `<option value="${c.equipo}" selected>${c.equipo}</option>` : '<option value="">— Equipo —</option>';
                        const filtOpts = adminTeams.filter(t => t !== c.equipo).map(t => `<option value="${t}">${t}</option>`).join('');
                        return `<div class="fa-cita-card ${c.status}" id="fa-cita-${c.id}">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                                <div><span style="font-size:18px;font-weight:700;">${c.ha||'—'}</span><span style="font-size:13px;color:var(--text-secondary);margin-left:8px;">👷 ${c.tecnicos} TK</span></div>
                                <span class="fa-badge ${badgeCls}">${SL[c.status]||c.status}</span>
                            </div>
                            <div style="font-size:14px;color:var(--text-secondary);margin:6px 0 2px;">📍 ${addr}</div>
                            <div style="font-size:13px;color:var(--blue);margin-bottom:10px;">🕐 ${c.inicio} – ${c.fin}</div>
                            ${!isDone ? `<div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap;">
                                <select id="fa-team-${c.id}" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;flex:1;min-width:120px;">${sel}${filtOpts}</select>
                                <input id="fa-docs-${c.id}" type="url" placeholder="Link Aushändigung" value="${c.linkDocs||''}" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;flex:1;min-width:120px;">
                                <button class="fa-btn fa-btn-green" onclick="window.faAssignCita('${c.id}')">${c.equipo?'✏️ Actualizar':'✅ Asignar'}</button>
                            </div>` : `<div style="font-size:13px;color:var(--text-secondary);">${c.equipo?`👥 ${c.equipo}`:''} ${c.linkDocs?`· <a href="${c.linkDocs}" target="_blank" style="color:var(--blue);">📎 Docs</a>`:''}</div>`}
                        </div>`;
                    }).join('')}
                </div>`).join('');
        } catch(err) {
            if (loading) loading.style.display = 'none';
            if (grid) grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--red);">⚠️ Error: ${err.message}</div>`;
        }
    };

    window.faAssignCita = async function(citaId) {
        const equipo = document.getElementById(`fa-team-${citaId}`)?.value;
        const linkDocs = document.getElementById(`fa-docs-${citaId}`)?.value;
        if (!equipo) { alert('Selecciona un equipo'); return; }
        const cita = citasCache[citaId] || {};
        try {
            const params = new URLSearchParams({
                action:'assignCita', citaId, equipo, linkDocs:linkDocs||'',
                ha:cita.ha||'', direccion:cita.calle||'', cp:cita.cp||'', ciudad:cita.ciudad||'',
                inicio:cita.inicio||'', fin:cita.fin||'', tecnicos:cita.tecnicos||'', fecha:cita.fecha||''
            });
            const resp = await fetch(`${SCRIPT_URL}?${params}`, { redirect:'follow' });
            const result = await resp.json();
            if (result.success) {
                if (citasCache[citaId]) { citasCache[citaId].equipo = equipo; citasCache[citaId].linkDocs = linkDocs||''; citasCache[citaId].status = 'asignada'; }
                window.toast('✅ Cita asignada', 'success');
                window.faLoadCitas();
            } else throw new Error(result.error||'Error');
        } catch(err) { alert('Error: '+err.message); }
    };

    // ── TABS ──
    window.faSwitchTab = function(tab) {
        currentTab = tab;
        document.querySelectorAll('.fa-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        ['overview','citas','reports','teams'].forEach(t => {
            const el = document.getElementById('fa-tab-'+t);
            if (el) el.style.display = t===tab ? 'block' : 'none';
        });
        if (tab === 'citas') { renderCitasTab(); }
    };

    // ── EXPORT ──
    window.faExportCSV = function() {
        const headers = ['Fecha','Equipo','Técnico','Cliente','Estado','Orden/HA','Inicio','Fin','Duración (min)','Comentarios'];
        const rows = filteredData.map(r => [
            r.date, r.team, r.technician, r.client,
            (STATUS_MAP[r.workStatus]||{}).label||r.workStatus,
            r.orderNumber||r.ha||'', r.startTime, r.endTime, r.duration, `"${(r.comments||'').replace(/"/g,'""')}"`
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `field-report-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    // ── CSS ──
    function getCSS() {
        return `<style>
        .fa-container { max-width:1200px; margin:0 auto; }
        .fa-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
        .fa-topbar h1 { font-size:18px; font-weight:700; }
        .fa-btn { padding:8px 16px; border-radius:var(--radius-sm); border:none; font-size:13px; font-weight:600; cursor:pointer; }
        .fa-btn-green { background:var(--green); color:#000; }
        .fa-btn-green:hover { background:#3de065; }
        .fa-btn-outline { background:transparent; border:1px solid var(--border); color:var(--text-secondary); }
        .fa-btn-outline:hover { border-color:var(--green); color:var(--green); }
        .fa-tabs { display:flex; gap:4px; margin-bottom:20px; background:var(--bg-secondary); border-radius:var(--radius); padding:4px; border:1px solid var(--border); }
        .fa-tab { flex:1; padding:10px; text-align:center; border-radius:var(--radius-sm); font-size:13px; font-weight:600; cursor:pointer; color:var(--text-secondary); }
        .fa-tab.active { background:var(--green); color:#000; }
        .fa-tab:hover:not(.active) { background:var(--bg-tertiary); }
        .fa-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; align-items:center; }
        .fa-filter-group { display:flex; align-items:center; gap:6px; }
        .fa-filter-label { font-size:12px; color:var(--text-secondary); }
        .fa-filter-select, .fa-filter-input { background:var(--bg-tertiary); border:1px solid var(--border); color:var(--text-primary); padding:6px 10px; border-radius:6px; font-size:13px; }
        .fa-filter-select:focus, .fa-filter-input:focus { outline:none; border-color:var(--green); }
        .fa-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:24px; }
        .fa-kpi { background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius); padding:16px; }
        .fa-kpi-value { font-size:28px; font-weight:800; margin-bottom:4px; }
        .fa-kpi-label { font-size:12px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.5px; }
        .fa-kpi-sub { font-size:11px; color:var(--text-secondary); margin-top:4px; }
        .fa-charts-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
        @media(max-width:768px) { .fa-charts-row { grid-template-columns:1fr; } }
        .fa-chart-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius); padding:16px; }
        .fa-chart-title { font-size:14px; font-weight:600; margin-bottom:12px; color:var(--text-secondary); }
        .fa-bar-row { display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:6px; }
        .fa-bar-label { min-width:80px; color:var(--text-secondary); text-align:right; }
        .fa-bar-track { flex:1; height:24px; background:var(--bg-primary); border-radius:4px; overflow:hidden; }
        .fa-bar-fill { height:100%; border-radius:4px; display:flex; align-items:center; padding-left:8px; font-size:11px; font-weight:600; transition:width 0.6s; }
        .fa-bar-fill.green { background:var(--green); color:#000; }
        .fa-bar-fill.blue { background:var(--blue); color:#fff; }
        .fa-bar-fill.orange { background:var(--orange); color:#000; }
        .fa-table-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; margin-bottom:24px; }
        .fa-table-header { padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
        .fa-table-header h3 { font-size:15px; }
        .fa-table-scroll { overflow-x:auto; }
        .fa-table-card table { width:100%; border-collapse:collapse; font-size:13px; }
        .fa-table-card th { padding:10px 12px; text-align:left; color:var(--text-secondary); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid var(--border); background:var(--bg-tertiary); }
        .fa-table-card td { padding:10px 12px; border-bottom:1px solid var(--border); }
        .fa-table-card tr:hover { background:var(--bg-tertiary); }
        .fa-badge { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap; }
        .fa-badge-ok { background:var(--green-dim); color:var(--green); }
        .fa-badge-absent { background:var(--orange-dim); color:var(--orange); }
        .fa-badge-hold { background:var(--orange-dim); color:var(--orange); }
        .fa-badge-notok { background:var(--red-dim); color:var(--red); }
        .fa-badge-pre { background:var(--blue-dim); color:var(--blue); }
        .fa-cita-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin-bottom:12px; }
        .fa-cita-card.asignada { border-left:3px solid var(--blue); }
        .fa-cita-card.capturada { border-left:3px solid var(--orange); }
        .fa-cita-card.en_trabajo { border-left:3px solid var(--green); }
        .fa-cita-card.libre { border-left:3px solid var(--text-secondary); }
        .fa-loading { text-align:center; padding:60px 20px; color:var(--text-secondary); }
        .fa-spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:fa-spin 0.8s linear infinite; margin:0 auto 12px; }
        @keyframes fa-spin { to { transform:rotate(360deg); } }
        .fa-empty { text-align:center; padding:20px; color:var(--text-secondary); }
        @media(max-width:600px) { .fa-kpi-grid { grid-template-columns:repeat(2,1fr); } .fa-filters { flex-direction:column; align-items:stretch; } }
        </style>`;
    }
})();
