// Production view — weekly production tracking
// NE3: real data from sheets.json | NE4: manual IndexedDB records

const SHEETS_URL = 'https://jarl9801.github.io/work-manager/data/sheets.json';

// ── helpers ────────────────────────────────────────────────────────────────────

function parseSheetDate(str) {
    if (!str) return null;
    const [datePart] = str.split(' ');
    const [m, d, y] = datePart.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function kwFromDateStr(str) {
    const d = parseSheetDate(str);
    if (!d) return null;
    return 'KW' + String(getISOWeek(d)).padStart(2, '0');
}

function currentKWStr() {
    const now = new Date();
    return 'KW' + String(getISOWeek(now)).padStart(2, '0');
}

// Cache sheets data globally to avoid re-fetching on tab switch
window._sheetsData = null;
window._sheetsDataLoaded = false;

async function fetchSheetsData() {
    if (window._sheetsDataLoaded) return window._sheetsData;
    try {
        const res = await fetch(SHEETS_URL + '?_=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        window._sheetsData = await res.json();
        window._sheetsDataLoaded = true;
    } catch (e) {
        console.warn('sheets.json fetch failed:', e);
        window._sheetsData = null;
        window._sheetsDataLoaded = false;
    }
    return window._sheetsData;
}

// ── main render ────────────────────────────────────────────────────────────────

window.render_production = async function() {
    const container = document.getElementById('view-production');
    const projects = await DB.getAll('projects');
    const teams = await DB.getAll('teams');

    // Preload sheets data quietly
    fetchSheetsData();

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Producción</div>
                <div class="section-sub">Registros semanales por equipo</div>
            </div>
            <button class="btn btn-primary" onclick="window.addProductionRecord()">+ Nuevo registro</button>
        </div>

        <div class="tabs" id="prodTabs">
            <button class="tab active" onclick="window.switchProdTab('NE3', this)">NE3 — Backbone</button>
            <button class="tab" onclick="window.switchProdTab('NE4', this)">NE4 — Hausanschluss</button>
        </div>

        <div class="filter-bar" id="prodFilters"></div>
        <div id="prodTable"></div>
    `;

    window._prodLine = 'NE3';
    window._prodSubTab = 'soplado'; // 'soplado' | 'fusiones'

    // NE3 filters (driven by sheets data)
    window._ne3FilterKW = new Set([currentKWStr()]);
    window._ne3FilterProject = new Set();
    window._ne3FilterTecnico = new Set();

    // NE4 filters (local DB)
    window._prodFilterKW = new Set([currentKWStr()]);
    window._prodFilterTeam = new Set();
    window._prodFilterProject = new Set();

    await window.buildProdFilters();
    await window.renderProdTable();
};

// ── build filters ──────────────────────────────────────────────────────────────

window.buildProdFilters = async function() {
    const filtersEl = document.getElementById('prodFilters');
    filtersEl.innerHTML = '';

    if (window._prodLine === 'NE3') {
        await window.buildNE3Filters(filtersEl);
    } else {
        await window.buildNE4Filters(filtersEl);
    }
};

window.buildNE3Filters = async function(filtersEl) {
    const data = await fetchSheetsData();
    const rows = data ? [
        ...(data.soplado_rd || []),
        ...(data.fusion || [])
    ] : [];

    // Collect unique KWs
    const kwSet = new Set();
    rows.forEach(r => {
        const kw = kwFromDateStr(r['Timestamp'] || r['Fecha de Inicio']);
        if (kw) kwSet.add(kw);
    });
    const kwOptions = Array.from(kwSet).sort();

    // Collect unique projects
    const projSet = new Set(rows.map(r => r['Código de Proyecto']).filter(Boolean));
    const projOptions = Array.from(projSet).sort().map(p => ({ value: p, label: p }));

    // Collect unique técnicos
    const tecSet = new Set(rows.map(r => r['Técnico Responsable']).filter(Boolean));
    const tecOptions = Array.from(tecSet).sort().map(t => ({ value: t, label: t }));

    // KW filter
    const kwWrapper = document.createElement('div');
    kwWrapper.className = 'dropdown-filter';
    const kwBtn = document.createElement('button');
    kwBtn.className = 'dropdown-btn';
    kwBtn.innerHTML = 'KW <span class="arrow">▾</span>';
    const kwPanel = document.createElement('div');
    kwPanel.className = 'dropdown-panel';

    // "All" option
    const allLbl = document.createElement('label');
    allLbl.className = 'dropdown-option';
    const allCb = document.createElement('input');
    allCb.type = 'checkbox'; allCb.value = '__all__';
    allCb.onchange = () => {
        window._ne3FilterKW.clear();
        document.querySelectorAll('#prodFilters .kw-cb').forEach(c => { c.checked = false; });
        window.renderProdTable();
    };
    allLbl.appendChild(allCb); allLbl.appendChild(document.createTextNode('Todas'));
    kwPanel.appendChild(allLbl);

    kwOptions.forEach(kw => {
        const lbl = document.createElement('label');
        lbl.className = 'dropdown-option';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = kw; cb.className = 'kw-cb';
        if (window._ne3FilterKW.has(kw)) cb.checked = true;
        cb.onchange = () => {
            cb.checked ? window._ne3FilterKW.add(kw) : window._ne3FilterKW.delete(kw);
            window.renderProdTable();
        };
        lbl.appendChild(cb); lbl.appendChild(document.createTextNode(kw));
        kwPanel.appendChild(lbl);
    });
    kwBtn.onclick = (e) => { e.stopPropagation(); kwPanel.classList.toggle('open'); };
    kwWrapper.appendChild(kwBtn); kwWrapper.appendChild(kwPanel);
    filtersEl.appendChild(kwWrapper);

    // Project filter
    window.createDropdownFilter('prodFilters', 'Proyecto', projOptions, (sel) => {
        window._ne3FilterProject = sel;
        window.renderProdTable();
    });

    // Técnico filter
    window.createDropdownFilter('prodFilters', 'Técnico', tecOptions, (sel) => {
        window._ne3FilterTecnico = sel;
        window.renderProdTable();
    });
};

window.buildNE4Filters = async function(filtersEl) {
    const projects = await DB.getAll('projects');
    const teams = await DB.getAll('teams');

    const now = new Date();
    const kwOptions = [];
    for (let i = 1; i <= 52; i++) kwOptions.push('KW' + String(i).padStart(2, '0'));

    // KW filter
    const kwWrapper = document.createElement('div');
    kwWrapper.className = 'dropdown-filter';
    const kwBtn = document.createElement('button');
    kwBtn.className = 'dropdown-btn';
    kwBtn.innerHTML = 'KW <span class="arrow">▾</span>';
    const kwPanel = document.createElement('div');
    kwPanel.className = 'dropdown-panel';
    kwOptions.forEach(kw => {
        const lbl = document.createElement('label');
        lbl.className = 'dropdown-option';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = kw;
        if (window._prodFilterKW.has(kw)) cb.checked = true;
        cb.onchange = () => { cb.checked ? window._prodFilterKW.add(kw) : window._prodFilterKW.delete(kw); window.renderProdTable(); };
        lbl.appendChild(cb); lbl.appendChild(document.createTextNode(kw));
        kwPanel.appendChild(lbl);
    });
    kwBtn.onclick = (e) => { e.stopPropagation(); kwPanel.classList.toggle('open'); };
    kwWrapper.appendChild(kwBtn); kwWrapper.appendChild(kwPanel);
    filtersEl.appendChild(kwWrapper);

    const teamOpts = teams.map(t => ({ value: t.id, label: t.name }));
    window.createDropdownFilter('prodFilters', 'Equipo', teamOpts, (sel) => { window._prodFilterTeam = sel; window.renderProdTable(); });

    const projOpts = projects.map(p => ({ value: p.code, label: `${p.code} — ${p.name}` }));
    window.createDropdownFilter('prodFilters', 'Proyecto', projOpts, (sel) => { window._prodFilterProject = sel; window.renderProdTable(); });
};

// ── tab switching ──────────────────────────────────────────────────────────────

window.switchProdTab = async function(line, btn) {
    document.querySelectorAll('#prodTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    window._prodLine = line;
    await window.buildProdFilters();
    await window.renderProdTable();
};

window.switchNE3SubTab = function(sub, btn) {
    document.querySelectorAll('#ne3SubTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    window._prodSubTab = sub;
    window.renderNE3Content();
};

// ── main render dispatcher ─────────────────────────────────────────────────────

window.renderProdTable = async function() {
    if (window._prodLine === 'NE3') {
        await window.renderNE3Table();
    } else {
        await window.renderNE4Table();
    }
};

// ── NE3 render ─────────────────────────────────────────────────────────────────

window.renderNE3Table = async function() {
    const tableEl = document.getElementById('prodTable');
    tableEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary)">Cargando datos…</div>`;

    const data = await fetchSheetsData();

    if (!data) {
        tableEl.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚠️</div>
                <div class="title">No se pudo cargar sheets.json</div>
                <div class="desc">Verifica la conexión. Puedes agregar registros manuales con el botón +</div>
            </div>`;
        return;
    }

    let soplado = data.soplado_rd || [];
    let fusion = data.fusion || [];

    // Apply filters
    const filterRow = (rows) => {
        let f = rows;
        if (window._ne3FilterKW.size > 0) {
            f = f.filter(r => {
                const kw = kwFromDateStr(r['Timestamp']);
                return kw && window._ne3FilterKW.has(kw);
            });
        }
        if (window._ne3FilterProject.size > 0) {
            f = f.filter(r => window._ne3FilterProject.has(r['Código de Proyecto']));
        }
        if (window._ne3FilterTecnico.size > 0) {
            f = f.filter(r => window._ne3FilterTecnico.has(r['Técnico Responsable']));
        }
        return f;
    };

    soplado = filterRow(soplado);
    fusion = filterRow(fusion);

    // KPI calculations
    const totalMetros = soplado.reduce((s, r) => s + (parseFloat(r['Metros Soplados']) || 0), 0);
    const totalFusiones = fusion.reduce((s, r) => s + (parseInt(r['Fusiones']) || 0), 0);

    const nowKW = currentKWStr();
    const estaSemanaSoplado = (data.soplado_rd || []).filter(r => kwFromDateStr(r['Timestamp']) === nowKW).length;
    const estaSemanaFusion = (data.fusion || []).filter(r => kwFromDateStr(r['Timestamp']) === nowKW).length;
    const registrosEstaSemana = estaSemanaSoplado + estaSemanaFusion;

    const projActivos = new Set([
        ...(data.soplado_rd || []).map(r => r['Código de Proyecto']),
        ...(data.fusion || []).map(r => r['Código de Proyecto'])
    ]).size;

    // Updated timestamp
    const updatedStr = data.updated ? new Date(data.updated).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    tableEl.innerHTML = `
        <div class="kpi-grid" style="margin-bottom:20px">
            <div class="kpi-card">
                <div class="kpi-label">Total Soplado</div>
                <div class="kpi-value green">${totalMetros.toLocaleString('de-DE')} m</div>
                <div class="kpi-sub">${soplado.length} registros</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Total Fusiones</div>
                <div class="kpi-value blue">${totalFusiones.toLocaleString('de-DE')}</div>
                <div class="kpi-sub">${fusion.length} registros</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Registros esta semana</div>
                <div class="kpi-value orange">${registrosEstaSemana}</div>
                <div class="kpi-sub">${nowKW}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Proyectos activos</div>
                <div class="kpi-value teal">${projActivos}</div>
                <div class="kpi-sub">Actualizado: ${updatedStr}</div>
            </div>
        </div>

        <div class="tabs" id="ne3SubTabs" style="margin-bottom:16px">
            <button class="tab ${window._prodSubTab === 'soplado' ? 'active' : ''}" onclick="window.switchNE3SubTab('soplado', this)">🔵 Soplado RD (${soplado.length})</button>
            <button class="tab ${window._prodSubTab === 'fusiones' ? 'active' : ''}" onclick="window.switchNE3SubTab('fusiones', this)">⚡ Fusiones (${fusion.length})</button>
        </div>

        <div id="ne3Content"></div>
    `;

    // Store filtered data for sub-tab use
    window._ne3Soplado = soplado;
    window._ne3Fusion = fusion;

    window.renderNE3Content();
};

window.renderNE3Content = function() {
    const contentEl = document.getElementById('ne3Content');
    if (!contentEl) return;

    if (window._prodSubTab === 'soplado') {
        const rows = window._ne3Soplado || [];
        if (rows.length === 0) {
            contentEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div class="title">Sin registros de soplado</div><div class="desc">Cambia los filtros o agrega registros manualmente</div></div>`;
            return;
        }
        contentEl.innerHTML = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>KW</th>
                            <th>Proyecto</th>
                            <th>DP</th>
                            <th>Calle</th>
                            <th>Técnico</th>
                            <th>Metros</th>
                            <th>Fibras</th>
                            <th>Color</th>
                            <th>Certificado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => {
                            const fecha = r['Fecha de Inicio'] || r['Timestamp']?.split(' ')[0] || '—';
                            const kw = kwFromDateStr(r['Timestamp']) || '—';
                            const cert = r['Certificado'] === 'TRUE' || r['Certificado'] === true;
                            const color = r['Color miniducto'] || '—';
                            const incidencia = r['Incidencias (si las hubo)'] || '';
                            return `<tr${incidencia ? ' style="background:rgba(255,150,0,0.07)"' : ''}>
                                <td style="white-space:nowrap">${fecha}</td>
                                <td><span class="badge badge-blue" style="font-size:10px">${kw}</span></td>
                                <td style="font-weight:600">${r['Código de Proyecto'] || '—'}</td>
                                <td style="font-family:monospace;font-size:11px">${r['DP'] || '—'}</td>
                                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r['Calle'] || ''}">${r['Calle'] || '—'}</td>
                                <td>${r['Técnico Responsable'] || '—'}</td>
                                <td style="font-weight:600;color:var(--accent-green)">${parseFloat(r['Metros Soplados'] || 0).toLocaleString('de-DE')} m</td>
                                <td>${r['Número de Fibras'] || '—'}</td>
                                <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colorDot(color)};margin-right:4px;vertical-align:middle"></span>${color}</td>
                                <td>${cert
                                    ? '<span class="badge badge-green">✓ Sí</span>'
                                    : '<span class="badge" style="background:rgba(255,100,100,0.15);color:#ff6464">✗ No</span>'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    } else {
        const rows = window._ne3Fusion || [];
        if (rows.length === 0) {
            contentEl.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div class="title">Sin registros de fusiones</div><div class="desc">Cambia los filtros o agrega registros manualmente</div></div>`;
            return;
        }
        contentEl.innerHTML = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>KW</th>
                            <th>Proyecto</th>
                            <th>DP</th>
                            <th>Técnico</th>
                            <th>Fusiones</th>
                            <th>Incidencias</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => {
                            const fecha = r['Fecha de Inicio'] || r['Timestamp']?.split(' ')[0] || '—';
                            const kw = kwFromDateStr(r['Timestamp']) || '—';
                            const inc = r['Incidencias (si las hubo)'] || '';
                            return `<tr${inc ? ' style="background:rgba(255,150,0,0.07)"' : ''}>
                                <td style="white-space:nowrap">${fecha}</td>
                                <td><span class="badge badge-blue" style="font-size:10px">${kw}</span></td>
                                <td style="font-weight:600">${r['Código de Proyecto'] || '—'}</td>
                                <td style="font-family:monospace;font-size:11px">${r['DP'] || '—'}</td>
                                <td>${r['Técnico Responsable'] || '—'}</td>
                                <td style="font-weight:600;color:var(--accent-blue)">${r['Fusiones'] || 0}</td>
                                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${inc ? 'var(--accent-orange)' : 'var(--text-secondary)'}" title="${inc}">${inc || '—'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }
};

function colorDot(color) {
    const map = {
        'Azul': '#4fc3f7', 'azul': '#4fc3f7',
        'Rojo': '#ef5350', 'rojo': '#ef5350',
        'Verde': '#66bb6a', 'verde': '#66bb6a',
        'Amarillo': '#ffee58', 'amarillo': '#ffee58',
        'Naranja': '#ffa726', 'naranja': '#ffa726',
        'Violeta': '#ab47bc', 'violeta': '#ab47bc',
        'Gris': '#90a4ae', 'gris': '#90a4ae',
        'Marron': '#8d6e63', 'marron': '#8d6e63',
        'Rosa': '#f48fb1', 'rosa': '#f48fb1',
        'Turquesa': '#26c6da', 'turquesa': '#26c6da',
        'Negro': '#616161', 'negro': '#616161',
        'Blanco': '#f5f5f5', 'blanco': '#f5f5f5',
    };
    return map[color] || '#888';
}

// ── NE4 render (unchanged logic) ───────────────────────────────────────────────

window.renderNE4Table = async function() {
    const records = await DB.getAll('records');
    const teams = await DB.getAll('teams');
    let filtered = records.filter(r => r.line === 'NE4');

    if (window._prodFilterKW.size > 0) filtered = filtered.filter(r => window._prodFilterKW.has(r.kw));
    if (window._prodFilterTeam.size > 0) filtered = filtered.filter(r => window._prodFilterTeam.has(r.teamId));
    if (window._prodFilterProject.size > 0) filtered = filtered.filter(r => window._prodFilterProject.has(r.projectCode));

    const tableEl = document.getElementById('prodTable');

    if (filtered.length === 0) {
        tableEl.innerHTML = `<div class="empty-state"><div class="icon">📈</div><div class="title">Sin registros NE4</div><div class="desc">Agrega registros de producción con el botón +</div></div>`;
        return;
    }

    const totalWEs = filtered.reduce((s, r) => s + (r.wes || 0), 0);
    const totalMDUs = filtered.reduce((s, r) => s + (r.mdus || 0), 0);

    tableEl.innerHTML = `
        <div class="kpi-grid" style="margin-bottom:20px">
            <div class="kpi-card"><div class="kpi-label">Total WEs</div><div class="kpi-value green">${totalWEs}</div></div>
            <div class="kpi-card"><div class="kpi-label">Total MDUs</div><div class="kpi-value blue">${totalMDUs}</div></div>
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Código</th><th>Proyecto</th><th>Equipo</th><th>KW</th><th>WEs</th><th>MDUs</th><th></th></tr></thead>
                <tbody>
                    ${filtered.map(r => {
                        const team = teams.find(t => t.id === r.teamId);
                        return `<tr>
                            <td style="font-family:monospace;font-size:11px">${r.code || '-'}</td>
                            <td>${r.projectCode}</td>
                            <td>${team ? team.name : r.teamId || '-'}</td>
                            <td>${r.kw}</td>
                            <td style="font-weight:600">${r.wes || 0}</td>
                            <td>${r.mdus || 0}</td>
                            <td><button class="btn btn-sm btn-secondary" onclick="window.editRecord(${r.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="window.deleteRecord(${r.id})">🗑</button></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
};

// ── manual record entry (both NE3 and NE4 fallback) ───────────────────────────

window.addProductionRecord = async function() {
    const projects = await DB.getAll('projects');
    const teams = await DB.getAll('teams');
    const now = new Date();
    const kwNum = getISOWeek(now);
    const line = window._prodLine || 'NE3';

    const lineProjects = projects.filter(p => p.lines && p.lines.includes(line));

    let body = `
        <div class="form-group">
            <label class="form-label">Proyecto</label>
            <select class="form-select" id="recProject">
                ${lineProjects.map(p => `<option value="${p.code}">${p.code} — ${p.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Equipo</label>
            <select class="form-select" id="recTeam">
                <option value="">— Sin equipo —</option>
                ${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">KW</label>
            <input class="form-input" type="number" id="recKW" value="${kwNum}" min="1" max="52">
        </div>
        ${line === 'NE3' ? `
        <div class="form-group"><label class="form-label">Metros soplados (ML)</label><input class="form-input" type="number" id="recMeters" value="0"></div>
        <div class="form-group"><label class="form-label">Fusiones (DPs)</label><input class="form-input" type="number" id="recFusions" value="0"></div>
        <div class="form-group"><label class="form-label">Altas de cliente</label><input class="form-input" type="number" id="recAltas" value="0"></div>
        ` : `
        <div class="form-group"><label class="form-label">WEs montados</label><input class="form-input" type="number" id="recWEs" value="0"></div>
        <div class="form-group"><label class="form-label">MDUs completados</label><input class="form-input" type="number" id="recMDUs" value="0"></div>
        `}
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.saveProductionRecord('${line}')">Guardar</button>
    `;

    window.openModal(`Nuevo registro ${line}`, body, footer);
};

window.saveProductionRecord = async function(line) {
    const projectCode = document.getElementById('recProject').value;
    const teamId = document.getElementById('recTeam').value;
    const kw = 'KW' + String(document.getElementById('recKW').value).padStart(2, '0');

    const project = await DB.get('projects', projectCode);
    const clientId = project ? project.clientId : '';
    const operatorId = project ? project.operatorId : '';

    const record = { projectCode, teamId, kw, line, timestamp: Date.now() };

    if (line === 'NE3') {
        record.meters = parseFloat(document.getElementById('recMeters').value) || 0;
        record.fusions = parseInt(document.getElementById('recFusions').value) || 0;
        record.activations = parseInt(document.getElementById('recAltas').value) || 0;
    } else {
        record.wes = parseInt(document.getElementById('recWEs').value) || 0;
        record.mdus = parseInt(document.getElementById('recMDUs').value) || 0;
    }

    const allRecords = await DB.getAll('records');
    const sameScope = allRecords.filter(r => r.projectCode === projectCode && r.line === line && r.kw === kw);
    const seq = String(sameScope.length + 1).padStart(3, '0');
    record.code = `${clientId}-${operatorId}-${projectCode}-${line}-${kw}-${seq}`;

    await DB.add('records', record);
    window.closeModal();
    window.toast('Registro guardado', 'success');
    window.renderProdTable();
};

window.editRecord = async function(id) {
    const record = await DB.get('records', id);
    if (!record) return;
    const teams = await DB.getAll('teams');
    const line = record.line;

    let body = `
        <div class="form-group">
            <label class="form-label">Código</label>
            <input class="form-input" value="${record.code || ''}" disabled>
        </div>
        <div class="form-group">
            <label class="form-label">Equipo</label>
            <select class="form-select" id="editTeam">
                <option value="">— Sin equipo —</option>
                ${teams.map(t => `<option value="${t.id}" ${t.id === record.teamId ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
        </div>
        ${line === 'NE3' ? `
        <div class="form-group"><label class="form-label">Metros (ML)</label><input class="form-input" type="number" id="editMeters" value="${record.meters || 0}"></div>
        <div class="form-group"><label class="form-label">Fusiones</label><input class="form-input" type="number" id="editFusions" value="${record.fusions || 0}"></div>
        <div class="form-group"><label class="form-label">Altas</label><input class="form-input" type="number" id="editAltas" value="${record.activations || 0}"></div>
        ` : `
        <div class="form-group"><label class="form-label">WEs</label><input class="form-input" type="number" id="editWEs" value="${record.wes || 0}"></div>
        <div class="form-group"><label class="form-label">MDUs</label><input class="form-input" type="number" id="editMDUs" value="${record.mdus || 0}"></div>
        `}
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.updateRecord(${id}, '${line}')">Guardar</button>
    `;
    window.openModal('Editar registro', body, footer);
};

window.updateRecord = async function(id, line) {
    const record = await DB.get('records', id);
    if (!record) return;
    record.teamId = document.getElementById('editTeam').value;
    if (line === 'NE3') {
        record.meters = parseFloat(document.getElementById('editMeters').value) || 0;
        record.fusions = parseInt(document.getElementById('editFusions').value) || 0;
        record.activations = parseInt(document.getElementById('editAltas').value) || 0;
    } else {
        record.wes = parseInt(document.getElementById('editWEs').value) || 0;
        record.mdus = parseInt(document.getElementById('editMDUs').value) || 0;
    }
    await DB.put('records', record);
    window.closeModal();
    window.toast('Registro actualizado', 'success');
    window.renderProdTable();
};

window.deleteRecord = async function(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    await DB.del('records', id);
    window.toast('Registro eliminado', 'info');
    window.renderProdTable();
};
