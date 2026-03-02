// NE4 Citas — WestConnect appointment management (improved)
(function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec';
    const CITAS_JSON = 'https://umtelkomd.github.io/field-report/citas.json';

    const ADMIN_TEAMS = ['West-001', 'West-002', 'West-003', 'West-004', 'Plus-001'];

    const STATUS_LABELS = {
        libre: 'Libre', asignada: 'Asignada', capturada: 'Capturada',
        en_trabajo: 'En trabajo', finalizada_ok: 'Finalizada ✓',
        finalizada_no_ok: 'Finalizada ✗', cliente_ausente: 'Ausente',
        recitar: 'Recitar', paralizada: 'Paralizada', cancelada: 'Cancelada'
    };

    const STATUS_COLORS = {
        libre: 'var(--text-secondary)', asignada: 'var(--blue)', capturada: 'var(--orange)',
        en_trabajo: 'var(--green)', finalizada_ok: 'var(--green)', finalizada_no_ok: 'var(--red)',
        cliente_ausente: 'var(--orange)', recitar: 'var(--purple)', paralizada: 'var(--text-secondary)', cancelada: 'var(--red)'
    };

    const STATUS_DONE = ['finalizada_ok', 'finalizada_no_ok', 'cliente_ausente', 'recitar', 'paralizada', 'cancelada'];

    const DAY_NAMES_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    let allCitas = [];
    let citasCache = {};

    function getISOWeek(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const day = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }

    function kwFromDateStr(str) {
        if (!str) return '—';
        const d = new Date(str + 'T12:00:00');
        return 'KW' + String(getISOWeek(d)).padStart(2, '0');
    }

    function fmtDate(str) {
        const d = new Date(str + 'T12:00:00');
        return `${DAY_NAMES_DE[d.getDay()]} ${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')}`;
    }

    function fmtDateFull(str) {
        const d = new Date(str + 'T12:00:00');
        return `${DAY_NAMES_ES[d.getDay()]} ${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
    }

    function statusBadge(status) {
        const color = STATUS_COLORS[status] || 'var(--text-secondary)';
        const label = STATUS_LABELS[status] || status;
        return `<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${color}20;color:${color};text-transform:uppercase;letter-spacing:0.3px;">${label}</span>`;
    }

    window.render_ne4citas = async function() {
        const container = document.getElementById('view-ne4citas');
        container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-secondary);"><div style="font-size:24px;margin-bottom:8px;">⏳</div>Cargando citas WestConnect…</div>`;

        try {
            const resp = await fetch(CITAS_JSON + '?t=' + Date.now());
            const data = await resp.json();
            allCitas = data.citas || [];
            citasCache = {};
            allCitas.forEach(c => { citasCache[c.id] = c; });

            renderCitasView(data.generated);
        } catch (err) {
            container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><div class="title">Error al cargar</div><div class="sub">${err.message}</div><button class="btn btn-primary" onclick="window.render_ne4citas()" style="margin-top:12px;">🔄 Reintentar</button></div>`;
        }
    };

    function renderCitasView(generated) {
        const container = document.getElementById('view-ne4citas');
        const today = new Date().toISOString().split('T')[0];
        const nowKW = 'KW' + String(getISOWeek(new Date())).padStart(2, '0');

        // Stats
        const total = allCitas.length;
        const libre = allCitas.filter(c => c.status === 'libre').length;
        const asignada = allCitas.filter(c => ['asignada', 'capturada', 'en_trabajo'].includes(c.status)).length;
        const done = allCitas.filter(c => STATUS_DONE.includes(c.status)).length;
        const todayCitas = allCitas.filter(c => c.fecha === today).length;

        // Get unique KWs
        const kws = [...new Set(allCitas.map(c => kwFromDateStr(c.fecha)).filter(k => k !== '—'))].sort();

        // Team workload
        const teamLoad = {};
        ADMIN_TEAMS.forEach(t => { teamLoad[t] = { total: 0, today: 0, pending: 0 }; });
        allCitas.forEach(c => {
            if (c.equipo && teamLoad[c.equipo]) {
                teamLoad[c.equipo].total++;
                if (c.fecha === today) teamLoad[c.equipo].today++;
                if (!STATUS_DONE.includes(c.status)) teamLoad[c.equipo].pending++;
            }
        });

        const genStr = generated ? new Date(generated).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

        container.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Citas NE4 — WestConnect</div>
                    <div class="section-sub">Última sync: ${genStr}</div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="window.render_ne4citas()">🔄 Actualizar</button>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Total</div>
                    <div class="kpi-value blue">${total}</div>
                    <div class="kpi-sub">${kws.length} semanas</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Hoy</div>
                    <div class="kpi-value ${todayCitas > 0 ? 'green' : ''}">${todayCitas}</div>
                    <div class="kpi-sub">${fmtDate(today)}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Libres</div>
                    <div class="kpi-value orange">${libre}</div>
                    <div class="kpi-sub">sin asignar</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Asignadas</div>
                    <div class="kpi-value blue">${asignada}</div>
                    <div class="kpi-sub">en proceso</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Finalizadas</div>
                    <div class="kpi-value green">${done}</div>
                    <div class="kpi-sub">completadas</div>
                </div>
            </div>

            <!-- Team workload -->
            <div style="margin-bottom:20px;">
                <div style="font-size:14px;font-weight:700;margin-bottom:10px;">👥 Carga por equipo</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${ADMIN_TEAMS.map(t => {
                        const tl = teamLoad[t];
                        return `<div style="flex:1;min-width:120px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">${t}</div>
                            <div style="font-size:20px;font-weight:800;color:var(--blue);">${tl.total}</div>
                            <div style="font-size:11px;color:var(--text-secondary);">${tl.today} hoy · ${tl.pending} pend.</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Filters -->
            <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
                <select id="citasKWFilter" onchange="window.filterNe4Citas()" style="padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;min-height:44px;">
                    <option value="">Todas las semanas</option>
                    ${kws.map(k => `<option value="${k}" ${k === nowKW ? 'selected' : ''}>${k}</option>`).join('')}
                </select>
                <select id="citasTeamFilter" onchange="window.filterNe4Citas()" style="padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;min-height:44px;">
                    <option value="">Todos los equipos</option>
                    ${ADMIN_TEAMS.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <select id="citasStatusFilter" onchange="window.filterNe4Citas()" style="padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;min-height:44px;">
                    <option value="">Todos los estados</option>
                    <option value="libre">🔘 Libres</option>
                    <option value="asignada">🔵 Asignadas</option>
                    <option value="en_trabajo">🟢 En trabajo</option>
                    <option value="done">✅ Finalizadas</option>
                </select>
            </div>

            <div id="citasGrid"></div>
        `;

        window.filterNe4Citas();
    }

    window.filterNe4Citas = function() {
        const kwFilter = document.getElementById('citasKWFilter')?.value || '';
        const teamFilter = document.getElementById('citasTeamFilter')?.value || '';
        const statusFilter = document.getElementById('citasStatusFilter')?.value || '';

        let citas = allCitas;
        if (kwFilter) citas = citas.filter(c => kwFromDateStr(c.fecha) === kwFilter);
        if (teamFilter) citas = citas.filter(c => c.equipo === teamFilter);
        if (statusFilter === 'done') citas = citas.filter(c => STATUS_DONE.includes(c.status));
        else if (statusFilter) citas = citas.filter(c => c.status === statusFilter);

        const grid = document.getElementById('citasGrid');
        if (!grid) return;

        if (citas.length === 0) {
            grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div class="title">Sin citas</div><div class="sub">No hay citas para estos filtros</div></div>`;
            return;
        }

        // Group by date
        const byDate = {};
        citas.forEach(c => { if (!byDate[c.fecha]) byDate[c.fecha] = []; byDate[c.fecha].push(c); });

        grid.innerHTML = Object.keys(byDate).sort().map(fecha => {
            const dayCitas = byDate[fecha];
            const kw = kwFromDateStr(fecha);
            const doneCount = dayCitas.filter(c => STATUS_DONE.includes(c.status)).length;
            const freeCount = dayCitas.filter(c => c.status === 'libre').length;

            return `
            <div style="margin-bottom:24px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);">
                    <span style="font-size:16px;font-weight:700;">${fmtDateFull(fecha)}</span>
                    <span style="font-size:11px;padding:3px 8px;border-radius:6px;background:var(--blue);color:white;font-weight:600;">${kw}</span>
                    <span style="font-size:12px;color:var(--text-secondary);">${dayCitas.length} cita${dayCitas.length > 1 ? 's' : ''}${freeCount > 0 ? ` · ${freeCount} libre${freeCount > 1 ? 's' : ''}` : ''}${doneCount > 0 ? ` · ${doneCount} hechas` : ''}</span>
                </div>
                ${dayCitas.map(c => renderCitaCard(c)).join('')}
            </div>`;
        }).join('');
    };

    function renderCitaCard(c) {
        const isDone = STATUS_DONE.includes(c.status);
        const addr = c.calle ? `${c.calle}, ${c.cp} ${c.ciudad}`.trim() : (c.ciudad || '—');
        const teamOptions = ADMIN_TEAMS.map(t => `<option value="${t}" ${c.equipo === t ? 'selected' : ''}>${t}</option>`).join('');

        return `
        <div id="cita-${c.id}" style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:10px;${c.status === 'libre' ? 'border-left:4px solid var(--orange);' : c.status === 'en_trabajo' ? 'border-left:4px solid var(--green);' : ['asignada','capturada'].includes(c.status) ? 'border-left:4px solid var(--blue);' : isDone ? 'border-left:4px solid var(--green);opacity:0.7;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
                <div>
                    <span style="font-size:16px;font-weight:700;">${c.ha || c.titulo || '—'}</span>
                    <span style="font-size:12px;color:var(--text-secondary);margin-left:6px;">👷 ${c.tecnicos || '?'} TK</span>
                </div>
                ${statusBadge(c.status)}
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">📍 ${addr}</div>
            <div style="font-size:13px;color:var(--blue);margin-bottom:${isDone ? '0' : '12'}px;">🕐 ${c.inicio || '?'} – ${c.fin || '?'}</div>
            ${!isDone ? `
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <select id="cita-team-${c.id}" style="flex:1;min-width:110px;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;min-height:44px;">
                    <option value="">— Equipo —</option>
                    ${teamOptions}
                </select>
                <input id="cita-docs-${c.id}" type="url" placeholder="📎 Link docs" value="${c.linkDocs || ''}" style="flex:2;min-width:140px;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:13px;min-height:44px;">
                <button onclick="window.assignNe4Cita('${c.id}')" style="background:${c.equipo ? 'var(--bg-tertiary)' : 'var(--green)'};color:${c.equipo ? 'var(--text-primary)' : 'white'};border:${c.equipo ? '1px solid var(--border)' : 'none'};border-radius:10px;padding:10px 16px;font-size:14px;font-weight:600;cursor:pointer;min-height:44px;white-space:nowrap;">${c.equipo ? '✏️ Actualizar' : '✅ Asignar'}</button>
            </div>` : `
            <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">
                ${c.equipo ? `👥 ${c.equipo}` : '—'} ${c.linkDocs ? `· <a href="${c.linkDocs}" target="_blank" style="color:var(--blue);">📎 Docs</a>` : ''}
            </div>`}
        </div>`;
    }

    window.assignNe4Cita = async function(citaId) {
        const equipo = document.getElementById(`cita-team-${citaId}`)?.value;
        const linkDocs = document.getElementById(`cita-docs-${citaId}`)?.value || '';

        if (!equipo) { window.toast('Selecciona un equipo', 'error'); return; }

        const btn = event.target;
        const origHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '⏳';

        try {
            const cita = citasCache[citaId] || {};
            const params = new URLSearchParams({
                action: 'assignCita', citaId, equipo, linkDocs,
                ha: cita.ha || '', direccion: cita.calle || '', cp: cita.cp || '',
                ciudad: cita.ciudad || '', inicio: cita.inicio || '', fin: cita.fin || '',
                tecnicos: cita.tecnicos || '', fecha: cita.fecha || ''
            });
            const resp = await fetch(`${SCRIPT_URL}?${params}`);
            const result = await resp.json();

            if (result.success) {
                if (citasCache[citaId]) {
                    citasCache[citaId].equipo = equipo;
                    citasCache[citaId].linkDocs = linkDocs;
                    if (citasCache[citaId].status === 'libre') citasCache[citaId].status = 'asignada';
                }
                btn.innerHTML = '✅';
                btn.style.background = 'var(--green)';
                btn.style.color = 'white';
                btn.style.border = 'none';
                window.toast(`Asignada a ${equipo} ✓`, 'success');
                setTimeout(() => { btn.disabled = false; btn.innerHTML = '✏️ Actualizar'; btn.style.background = 'var(--bg-tertiary)'; btn.style.color = 'var(--text-primary)'; btn.style.border = '1px solid var(--border)'; }, 1500);
            } else {
                throw new Error(result.error || 'Error al asignar');
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = origHTML;
            window.toast('Error: ' + err.message, 'error');
        }
    };

    // Expose for other modules
    window.getNe4CitasForTeam = function(teamName) {
        const today = new Date().toISOString().split('T')[0];
        return allCitas.filter(c => c.equipo === teamName && c.fecha === today && !STATUS_DONE.includes(c.status));
    };
    window.getNe4CitasLoaded = () => allCitas.length > 0;
})();
