// GFP Citas — Glasfaser Plus (Insyte imasm) appointment management
(function() {
    const API_BASE = 'https://api-imasm.insytedeutschland.de';
    // Credentials stored in localStorage (set via Settings)
    const CREDENTIALS = {
        usuario: localStorage.getItem('gfp_usuario') || '',
        password: localStorage.getItem('gfp_password') || ''
    };
    const el = document.getElementById('view-gfpcitas');
    if (!CREDENTIALS.usuario || !CREDENTIALS.password) {
        el.innerHTML = '<div style="padding:2rem;text-align:center;color:#8e8e93;"><h3 style="color:#e5e5ea;">⚠️ Credenciales GFP no configuradas</h3><p>Ve a <b>Ajustes</b> para ingresar usuario y contraseña de imasm.</p></div>';
        return;
    }

    // Token management
    let authToken = null;
    let tokenExpiry = 0;

    // Cache
    let mastersCache = null;
    let allGfpData = [];

    // Status maps (fallback if masters unavailable)
    const APPOIN_STATUS = {
        1: '00. HA Sync. - HC', 2: '01. Appointment Made', 3: '02. Call Pending',
        5: '04. Preinstalled', 9: '08. Contract Cancel', 11: '02. Re-schedule', 13: '01. Appt to Cancel'
    };

    const INSYTE_STATUS = {
        1: 'Capturada', 2: 'En Camino', 3: 'En Trabajo', 4: 'Cliente Ausente',
        5: 'Estados Previos', 6: 'Recitar', 7: 'Paralizada', 8: 'Finalizada OK',
        9: 'Preinstalada', 10: 'Finalizada No OK'
    };

    const APPROVE_STATUS = { 1: 'Pte Revisión', 2: 'Rechazada' };

    const INSYTE_BADGE_CLASS = {
        1: 'gfp-capturada', 2: 'gfp-encamino', 3: 'gfp-entrabajo', 4: 'gfp-ausente',
        5: 'gfp-previos', 6: 'gfp-recitar', 7: 'gfp-paralizada', 8: 'gfp-ok',
        9: 'gfp-preinstalada', 10: 'gfp-nook'
    };

    const INSYTE_DONE = [4, 6, 7, 8, 10];

    const WORKGROUP_MAP = {
        'HA_UMT_01': 'West-001', 'HA_UMT_02': 'West-002', 'HA_UMT_03': 'West-003'
    };

    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    function fmtDate(dateStr) {
        const dt = new Date(dateStr);
        return `${DAY_NAMES[dt.getDay()]} ${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]}`;
    }

    function fmtTime(dateStr) {
        const dt = new Date(dateStr);
        return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    }

    function dateKey(dateStr) {
        return new Date(dateStr).toISOString().split('T')[0];
    }

    // ── Auth ──
    async function getToken() {
        if (authToken && Date.now() < tokenExpiry - 60000) return authToken;
        try {
            const resp = await fetch(`${API_BASE}/api/authorize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(CREDENTIALS)
            });
            const data = await resp.json();
            authToken = data.token.access_token;
            tokenExpiry = data.token.valid_until * 1000; // Unix seconds → ms
            return authToken;
        } catch (err) {
            authToken = null;
            throw new Error('Auth failed: ' + err.message);
        }
    }

    async function apiFetch(url, options = {}) {
        const token = await getToken();
        const resp = await fetch(url, {
            ...options,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
        });
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        return resp.json();
    }

    // ── Masters ──
    async function getMasters() {
        if (mastersCache) return mastersCache;
        mastersCache = await apiFetch(`${API_BASE}/workorders/masters`);
        return mastersCache;
    }

    function getWorkgroupName(id, masters) {
        if (!masters || !masters.workgroups) return `WG-${id}`;
        const wg = masters.workgroups.find(w => w.id === id);
        return wg ? wg.name : `WG-${id}`;
    }

    // ── Render ──
    window.render_gfpcitas = function() {
        const container = document.getElementById('view-gfpcitas');
        container.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Citas GFP</div>
                    <div class="section-sub">Glasfaser Plus — Insyte Portal</div>
                </div>
            </div>

            <div class="kpi-grid" id="gfpKpiGrid">
                <div class="kpi-card"><div class="kpi-label">Total Citas</div><div class="kpi-value" id="gkTotal">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Appointment Made</div><div class="kpi-value blue" id="gkAppointed">—</div></div>
                <div class="kpi-card"><div class="kpi-label">En Trabajo</div><div class="kpi-value purple" id="gkWorking">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Finalizadas</div><div class="kpi-value green" id="gkDone">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Pendientes</div><div class="kpi-value orange" id="gkPending">—</div></div>
            </div>

            <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
                <select id="gfpAreaFilter" class="form-select" style="width:auto;padding:8px 14px;">
                    <option value="">Todas las áreas</option>
                </select>
                <select id="gfpInsyteFilter" class="form-select" style="width:auto;padding:8px 14px;">
                    <option value="">Insyte Status</option>
                    ${Object.entries(INSYTE_STATUS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                </select>
                <select id="gfpAppoinFilter" class="form-select" style="width:auto;padding:8px 14px;">
                    <option value="">Appoin Status</option>
                    ${Object.entries(APPOIN_STATUS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                </select>
                <input type="date" id="gfpDateFrom" class="form-input" style="width:auto;padding:8px 14px;" title="Desde">
                <input type="date" id="gfpDateTo" class="form-input" style="width:auto;padding:8px 14px;" title="Hasta">
                <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;">
                    <input type="checkbox" id="gfpOnlyUmt" checked> Solo Umtelkomd
                </label>
                <button class="btn btn-primary btn-sm" onclick="window.loadGfpCitas()">🔄 Cargar</button>
                <span id="gfpStatusMsg" style="font-size:12px;color:var(--text-secondary);"></span>
            </div>

            <div id="gfpLoading" style="text-align:center;padding:40px;color:var(--text-secondary);">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;"><div class="cita-spinner"></div> Cargando citas GFP…</div>
            </div>
            <div id="gfpGrid"></div>
        `;

        window.loadGfpCitas();
    };

    window.loadGfpCitas = async function() {
        const loading = document.getElementById('gfpLoading');
        const grid = document.getElementById('gfpGrid');
        loading.style.display = 'block';
        grid.innerHTML = '';

        try {
            const [workorders, masters] = await Promise.all([
                apiFetch(`${API_BASE}/workorders/buscador`, {
                    method: 'POST',
                    body: JSON.stringify({
                        params: { first: 0, rows: 500, sortField: 'appoin_date', sortOrder: -1 },
                        selectedColumns: [], globalFilterFields: [], zonaHoraria: 'Europe/Berlin'
                    })
                }),
                getMasters()
            ]);

            allGfpData = workorders.items || [];

            // Populate area filter
            const areas = [...new Set(allGfpData.map(c => c.area).filter(Boolean))].sort();
            const areaSelect = document.getElementById('gfpAreaFilter');
            areaSelect.innerHTML = '<option value="">Todas las áreas</option>' +
                areas.map(a => `<option value="${a}">${a}</option>`).join('');

            // Apply filters
            let citas = [...allGfpData];
            const onlyUmt = document.getElementById('gfpOnlyUmt').checked;
            if (onlyUmt) citas = citas.filter(c => c.appoin_subco === '19');

            const areaF = document.getElementById('gfpAreaFilter').value;
            if (areaF) citas = citas.filter(c => c.area === areaF);

            const insyteF = document.getElementById('gfpInsyteFilter').value;
            if (insyteF) citas = citas.filter(c => c.insyte_status == insyteF);

            const appoinF = document.getElementById('gfpAppoinFilter').value;
            if (appoinF) citas = citas.filter(c => c.appoin_status == appoinF);

            const dateFrom = document.getElementById('gfpDateFrom').value;
            const dateTo = document.getElementById('gfpDateTo').value;
            if (dateFrom) citas = citas.filter(c => dateKey(c.appoin_date) >= dateFrom);
            if (dateTo) citas = citas.filter(c => dateKey(c.appoin_date) <= dateTo);

            // KPIs (from filtered set based on Umtelkomd only)
            const umtCitas = allGfpData.filter(c => c.appoin_subco === '19');
            document.getElementById('gkTotal').textContent = umtCitas.length;
            document.getElementById('gkAppointed').textContent = umtCitas.filter(c => c.appoin_status === 2).length;
            document.getElementById('gkWorking').textContent = umtCitas.filter(c => c.insyte_status === 3).length;
            document.getElementById('gkDone').textContent = umtCitas.filter(c => c.insyte_status === 8).length;
            document.getElementById('gkPending').textContent = umtCitas.filter(c => [1, 2, 9].includes(c.insyte_status)).length;

            loading.style.display = 'none';

            if (citas.length === 0) {
                grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div class="title">Sin citas</div><div class="desc">No hay citas con los filtros seleccionados</div></div>`;
                return;
            }

            // Group by date
            const byDate = {};
            citas.forEach(c => {
                const dk = dateKey(c.appoin_date);
                if (!byDate[dk]) byDate[dk] = [];
                byDate[dk].push(c);
            });

            grid.innerHTML = Object.keys(byDate).sort().reverse().map(fecha => `
                <div style="margin-bottom:28px;">
                    <div class="cita-date-header">
                        📅 ${fmtDate(fecha + 'T12:00:00')} <span style="color:var(--text-secondary);font-weight:400;font-size:12px;">(${byDate[fecha].length} cita${byDate[fecha].length > 1 ? 's' : ''})</span>
                    </div>
                    ${byDate[fecha].map(c => renderGfpCard(c, masters)).join('')}
                </div>
            `).join('');

            document.getElementById('gfpStatusMsg').textContent = `✅ ${citas.length} citas · ${new Date().toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'})}`;

        } catch (err) {
            loading.style.display = 'none';
            grid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div class="title">Error</div><div class="desc">${err.message}</div></div>`;
        }
    };

    function renderGfpCard(c, masters) {
        const isDone = INSYTE_DONE.includes(c.insyte_status);
        const insyteLbl = INSYTE_STATUS[c.insyte_status] || `Status ${c.insyte_status}`;
        const insyteCls = INSYTE_BADGE_CLASS[c.insyte_status] || 'gfp-capturada';
        const appoinLbl = APPOIN_STATUS[c.appoin_status] || `Appoin ${c.appoin_status}`;
        const approveLbl = APPROVE_STATUS[c.approve_status] || '';
        const wgName = getWorkgroupName(c.id_workgroup, masters);
        const teamName = WORKGROUP_MAP[wgName] || wgName;
        const timeStart = fmtTime(c.appoin_date);
        const timeEnd = c.appoin_date_end ? fmtTime(c.appoin_date_end) : '';
        const mapUrl = (c.latitude && c.longitude) ? `https://maps.google.com/?q=${c.latitude},${c.longitude}` : '';

        return `
        <div class="cita-card gfp-insyte-${c.insyte_status}" ${isDone ? 'style="opacity:0.55;"' : ''}>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                <div>
                    <span style="font-size:17px;font-weight:700;">${c.city || '—'}</span>
                    <span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">${c.area || ''}</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <span class="badge badge-gfp ${insyteCls}">${insyteLbl}</span>
                    <span class="badge badge-gfp gfp-appoin">${appoinLbl}</span>
                    ${approveLbl ? `<span class="badge badge-gfp gfp-approve">${approveLbl}</span>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin:8px 0 4px;">
                <span style="font-size:13px;color:var(--text-secondary);">🏠 ${c.address_id || '—'} / ${c.home_id || '—'}</span>
                <span style="font-size:13px;color:var(--blue);">🕐 ${timeStart}${timeEnd ? ' – ' + timeEnd : ''}</span>
                <span style="font-size:13px;color:var(--text-secondary);">👥 ${teamName}</span>
                ${mapUrl ? `<a href="${mapUrl}" target="_blank" style="font-size:13px;color:var(--teal);text-decoration:none;">📍 Mapa</a>` : ''}
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">ID: ${c.id}</div>
        </div>`;
    }

    // Expose for dashboard
    window.getGfpCitasStats = function() {
        if (!allGfpData.length) return null;
        const umt = allGfpData.filter(c => c.appoin_subco === '19');
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const ws = weekStart.toISOString().split('T')[0];
        const we = weekEnd.toISOString().split('T')[0];
        const thisWeek = umt.filter(c => { const d = dateKey(c.appoin_date); return d >= ws && d <= we; });
        return { total: umt.length, thisWeek: thisWeek.length };
    };
})();
