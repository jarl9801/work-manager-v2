// NE4 Citas — WestConnect appointment management
(function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec';

    const ADMIN_TEAMS = ['West-001', 'West-002', 'West-003', 'West-004'];

    const STATUS_LABELS = {
        libre: 'Libre', asignada: 'Asignada', capturada: 'Capturada',
        en_trabajo: 'En trabajo', finalizada_ok: 'Finalizada ✓',
        finalizada_no_ok: 'Finalizada ✗', cliente_ausente: 'Ausente',
        recitar: 'Recitar', paralizada: 'Paralizada', cancelada: 'Cancelada'
    };

    const STATUS_DONE = ['finalizada_ok', 'finalizada_no_ok', 'cliente_ausente', 'recitar', 'paralizada', 'cancelada'];

    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    let citasCache = {};
    let allCitasData = [];

    function fmtDate(d) {
        const dt = new Date(d + 'T12:00:00');
        return `${DAY_NAMES[dt.getDay()]} ${dt.getDate()} ${MONTH_NAMES[dt.getMonth()]}`;
    }

    function statusBadgeClass(status) {
        if (STATUS_DONE.includes(status)) return 'badge-cita-done';
        return 'badge-cita-' + status;
    }

    window.render_ne4citas = function() {
        const container = document.getElementById('view-ne4citas');
        container.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Citas NE4</div>
                    <div class="section-sub">Gestión de visitas WestConnect</div>
                </div>
            </div>

            <div class="kpi-grid" id="citasKpiGrid">
                <div class="kpi-card"><div class="kpi-label">Total Citas</div><div class="kpi-value" id="ckTotal">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Asignadas</div><div class="kpi-value blue" id="ckAssigned">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Pendientes</div><div class="kpi-value orange" id="ckPending">—</div></div>
                <div class="kpi-card"><div class="kpi-label">Finalizadas</div><div class="kpi-value green" id="ckCompleted">—</div></div>
            </div>

            <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
                <input type="date" id="citasDateFilter" class="form-input" style="width:auto;padding:8px 14px;">
                <select id="citasTeamFilter" class="form-select" style="width:auto;padding:8px 14px;">
                    <option value="">Todos los equipos</option>
                    ${ADMIN_TEAMS.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm" onclick="window.loadNe4Citas()">🔄 Cargar</button>
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('citasDateFilter').value='';window.loadNe4Citas()">📋 Todas</button>
                <span id="citasStatusMsg" style="font-size:12px;color:var(--text-secondary);"></span>
            </div>

            <div id="citasLoading" style="text-align:center;padding:40px;color:var(--text-secondary);">
                Carga las citas para comenzar
            </div>
            <div id="citasGrid"></div>
        `;

        window.loadNe4Citas();
    };

    window.loadNe4Citas = async function() {
        const loading = document.getElementById('citasLoading');
        const grid = document.getElementById('citasGrid');
        const dateFilter = document.getElementById('citasDateFilter').value || '';
        const teamFilter = document.getElementById('citasTeamFilter').value || '';

        loading.style.display = 'block';
        loading.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><div class="cita-spinner"></div> Cargando citas…</div>';
        grid.innerHTML = '';

        try {
            // Fetch both: citas.json (calendar source) + Apps Script (assignments)
            const [respJson, respScript] = await Promise.all([
                fetch('https://jarl9801.github.io/field-report/citas.json?t=' + Date.now()),
                fetch(SCRIPT_URL + '?action=getLiveCitas&t=' + Date.now()).catch(() => null)
            ]);
            const data = await respJson.json();

            // citas.json already includes assignment data (merged by sync cron)
            // No extra fetch needed — data is ready to use

            const today = new Date().toISOString().split('T')[0];
            allCitasData = (data.citas || []).filter(c => c.fecha >= today && !STATUS_DONE.includes(c.status));
            citasCache = {};
            allCitasData.forEach(c => { citasCache[c.id] = c; });

            let citas = allCitasData;
            if (dateFilter) citas = citas.filter(c => c.fecha === dateFilter);
            if (teamFilter) citas = citas.filter(c => c.equipo === teamFilter);

            // Update KPIs
            const total = allCitasData.length;
            const assigned = allCitasData.filter(c => c.status === 'asignada' || c.status === 'capturada' || c.status === 'en_trabajo').length;
            const pending = allCitasData.filter(c => c.status === 'libre').length;
            const completed = allCitasData.filter(c => STATUS_DONE.includes(c.status)).length;

            document.getElementById('ckTotal').textContent = total;
            document.getElementById('ckAssigned').textContent = assigned;
            document.getElementById('ckPending').textContent = pending;
            document.getElementById('ckCompleted').textContent = completed;

            loading.style.display = 'none';

            if (citas.length === 0) {
                grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div class="title">Sin citas</div><div class="desc">${dateFilter ? 'No hay citas para esta fecha' : 'No hay citas próximas'}</div></div>`;
                return;
            }

            const teamOptions = (cita) => ADMIN_TEAMS
                .filter(t => !cita.equipo || t !== cita.equipo)
                .map(t => `<option value="${t}">${t}</option>`).join('');

            // Group by date
            const byDate = {};
            citas.forEach(c => { if (!byDate[c.fecha]) byDate[c.fecha] = []; byDate[c.fecha].push(c); });

            grid.innerHTML = Object.keys(byDate).sort().map(fecha => `
                <div style="margin-bottom:28px;">
                    <div class="cita-date-header">
                        📅 ${fmtDate(fecha)} <span style="color:var(--text-secondary);font-weight:400;font-size:12px;">(${byDate[fecha].length} cita${byDate[fecha].length > 1 ? 's' : ''})</span>
                    </div>
                    ${byDate[fecha].map(c => renderCitaCard(c, teamOptions(c))).join('')}
                </div>
            `).join('');

            document.getElementById('citasStatusMsg').textContent = `✅ ${citas.length} citas · ${data.generated ? data.generated.substring(0, 16) : ''}`;

        } catch (err) {
            loading.style.display = 'none';
            grid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div class="title">Error</div><div class="desc">${err.message}</div></div>`;
        }
    };

    function renderCitaCard(c, teamOptions) {
        const isDone = STATUS_DONE.includes(c.status);
        const badgeCls = statusBadgeClass(c.status);
        const badgeLbl = STATUS_LABELS[c.status] || c.status;
        const selected = c.equipo ? `<option value="${c.equipo}" selected>${c.equipo}</option><option value="">— Cambiar equipo —</option>` : '<option value="">— Equipo —</option>';
        const addr = c.calle ? `${c.calle}, ${c.cp} ${c.ciudad}`.trim() : (c.ciudad || '—');

        return `
        <div class="cita-card cita-status-${c.status}" id="cita-${c.id}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <div>
                    <span style="font-size:17px;font-weight:700;">${c.ha || '—'}</span>
                    <span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">👷 ${c.tecnicos} TK</span>
                </div>
                <span class="badge ${badgeCls}">${badgeLbl}</span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin:8px 0 4px;">📍 ${addr}</div>
            <div style="font-size:13px;color:var(--blue);margin-bottom:10px;">🕐 ${c.inicio} – ${c.fin}</div>
            ${!isDone ? `
            <div class="cita-assign-row">
                <select id="cita-team-${c.id}" class="form-select" style="width:auto;flex:1;min-width:100px;padding:7px 10px;font-size:13px;">${selected}${teamOptions}</select>
                <input id="cita-docs-${c.id}" class="form-input" type="url" placeholder="Link Aushändigung" value="${c.linkDocs || ''}" style="flex:2;min-width:140px;padding:7px 10px;font-size:13px;">
                <button class="btn btn-sm ${c.equipo ? 'btn-secondary' : 'btn-success'}" onclick="window.assignNe4Cita('${c.id}')">${c.equipo ? '✏️ Actualizar' : '✅ Asignar'}</button>
            </div>` : `
            <div style="font-size:12px;color:var(--text-secondary);">
                ${c.equipo ? `👥 ${c.equipo}` : ''} ${c.linkDocs ? `· <a href="${c.linkDocs}" target="_blank" style="color:var(--blue);">📎 Docs</a>` : ''}
            </div>`}
        </div>`;
    }

    window.assignNe4Cita = async function(citaId) {
        const equipo = document.getElementById(`cita-team-${citaId}`).value;
        const linkDocs = document.getElementById(`cita-docs-${citaId}`).value;

        if (!equipo) { window.toast('Selecciona un equipo', 'error'); return; }

        const btn = event.target;
        btn.disabled = true;
        const origText = btn.textContent;
        btn.textContent = '⏳';

        try {
            const cita = citasCache[citaId] || {};
            const params = new URLSearchParams({
                action: 'assignCita', citaId, equipo, linkDocs: linkDocs || '',
                ha: cita.ha || '', direccion: cita.calle || '', cp: cita.cp || '',
                ciudad: cita.ciudad || '', inicio: cita.inicio || '', fin: cita.fin || '',
                tecnicos: cita.tecnicos || '', fecha: cita.fecha || ''
            });
            const resp = await fetch(`${SCRIPT_URL}?${params}`);
            const result = await resp.json();

            if (result.success) {
                // Update cache
                if (citasCache[citaId]) {
                    citasCache[citaId].equipo = equipo;
                    citasCache[citaId].linkDocs = linkDocs;
                    citasCache[citaId].status = citasCache[citaId].status === 'libre' ? 'asignada' : citasCache[citaId].status;
                }
                // Update badge in DOM
                const cardEl = document.getElementById('cita-' + citaId);
                if (cardEl) {
                    const badge = cardEl.querySelector('.badge');
                    const newStatus = citasCache[citaId] ? citasCache[citaId].status : 'asignada';
                    if (badge) {
                        badge.className = 'badge ' + statusBadgeClass(newStatus);
                        badge.textContent = STATUS_LABELS[newStatus] || newStatus;
                    }
                }
                btn.textContent = '✅';
                window.toast('Cita asignada a ' + equipo, 'success');
            } else {
                throw new Error(result.error || 'Error al asignar');
            }
        } catch (err) {
            btn.disabled = false;
            btn.textContent = origText;
            window.toast('Error: ' + err.message, 'error');
        }
    };

    // Expose citas data for teams view
    window.getNe4CitasForTeam = function(teamName) {
        const today = new Date().toISOString().split('T')[0];
        return allCitasData.filter(c => c.equipo === teamName && c.fecha === today && !STATUS_DONE.includes(c.status));
    };

    window.getNe4CitasLoaded = function() {
        return allCitasData.length > 0;
    };
})();
