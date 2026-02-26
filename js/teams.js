// Teams view — team cards + Gantt-style KW planner
window.render_teams = async function() {
    const container = document.getElementById('view-teams');
    const teams = await DB.getAll('teams');
    const records = await DB.getAll('records');
    const assignments = await DB.getAll('team_assignments');

    // Current KW
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const currentKW = Math.ceil(((now - start) / 86400000 + start.getDay()) / 7);

    // Team cards
    let cardsHTML = teams.map(t => {
        const teamRecords = records.filter(r => r.teamId === t.id);
        const teamAssigns = assignments.filter(a => a.teamId === t.id);
        const currentAssign = teamAssigns.find(a => a.kw === 'KW' + String(currentKW).padStart(2, '0'));
        const weekRecords = teamRecords.filter(r => r.kw === 'KW' + String(currentKW).padStart(2, '0'));

        const weekMeters = weekRecords.filter(r => r.line === 'NE3').reduce((s, r) => s + (r.meters || 0), 0);
        const weekWEs = weekRecords.filter(r => r.line === 'NE4').reduce((s, r) => s + (r.wes || 0), 0);

        // Today's citas for this team
        const todayCitas = window.getNe4CitasForTeam ? window.getNe4CitasForTeam(t.name) : [];
        const citasHTML = todayCitas.length > 0
            ? `<div class="team-citas-section">
                <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:4px;">📅 Citas de hoy (${todayCitas.length})</div>
                ${todayCitas.map(c => `<div class="team-cita-mini"><span>${c.ha || '—'} · ${c.inicio}–${c.fin}</span><span class="badge badge-cita-${c.status}" style="font-size:10px;padding:2px 8px;">${c.status}</span></div>`).join('')}
               </div>`
            : '';

        return `
        <div class="team-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                    <div class="team-name">${t.name}</div>
                    <div class="team-assignment">${currentAssign ? `Asignado: ${currentAssign.projectCode}` : 'Sin asignación esta semana'}</div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="window.editTeam('${t.id}')">✏️</button>
            </div>
            <div class="team-members">
                ${(t.members || []).map(m => `<span class="member-chip">${m}</span>`).join('')}
            </div>
            <div style="display:flex;gap:16px">
                <div><div class="project-stat-label">ML esta semana</div><div class="project-stat-value" style="font-size:16px">${weekMeters.toLocaleString('de-DE')}</div></div>
                <div><div class="project-stat-label">WEs esta semana</div><div class="project-stat-value" style="font-size:16px">${weekWEs}</div></div>
                <div><div class="project-stat-label">Total registros</div><div class="project-stat-value" style="font-size:16px">${teamRecords.length}</div></div>
            </div>
            ${citasHTML}
        </div>`;
    }).join('');

    // Gantt-style KW planner
    const kwStart = Math.max(1, currentKW - 4);
    const kwEnd = Math.min(52, currentKW + 8);
    const kwRange = [];
    for (let i = kwStart; i <= kwEnd; i++) kwRange.push(i);

    let ganttHTML = `
    <div class="gantt-wrap" style="margin-top:24px">
        <table class="gantt-table">
            <thead><tr><th class="gantt-cell-label">Equipo</th>${kwRange.map(k => `<th style="${k === currentKW ? 'color:var(--blue);font-weight:700' : ''}">KW${String(k).padStart(2, '0')}</th>`).join('')}</tr></thead>
            <tbody>
                ${teams.map(t => {
                    const teamAssigns = assignments.filter(a => a.teamId === t.id);
                    return `<tr>
                        <td class="gantt-cell-label">${t.name}</td>
                        ${kwRange.map(k => {
                            const kwStr = 'KW' + String(k).padStart(2, '0');
                            const assign = teamAssigns.find(a => a.kw === kwStr);
                            if (assign) {
                                return `<td class="gantt-cell-active" title="${assign.projectCode}" style="cursor:pointer" onclick="window.assignTeamKW('${t.id}', '${kwStr}')">${assign.projectCode}</td>`;
                            }
                            return `<td style="cursor:pointer;color:var(--text-tertiary)" onclick="window.assignTeamKW('${t.id}', '${kwStr}')">—</td>`;
                        }).join('')}
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Equipos</div>
                <div class="section-sub">${teams.length} equipos · ${teams.reduce((s, t) => s + (t.members || []).length, 0)} técnicos</div>
            </div>
            <button class="btn btn-primary" onclick="window.addTeam()">+ Nuevo equipo</button>
        </div>

        <div class="team-grid">${cardsHTML}</div>

        <div class="section-header" style="margin-top:32px">
            <div>
                <div class="section-title">Planificador KW</div>
                <div class="section-sub">Click en celda para asignar proyecto</div>
            </div>
        </div>
        ${ganttHTML}
    `;
};

window.assignTeamKW = async function(teamId, kw) {
    const projects = await DB.getAll('projects');
    const assignments = await DB.getAll('team_assignments');
    const existing = assignments.find(a => a.teamId === teamId && a.kw === kw);

    let body = `
        <div class="form-group">
            <label class="form-label">Proyecto para ${teamId} en ${kw}</label>
            <select class="form-select" id="assignProject">
                <option value="">— Sin asignación —</option>
                ${projects.map(p => `<option value="${p.code}" ${existing && existing.projectCode === p.code ? 'selected' : ''}>${p.code} — ${p.name}</option>`).join('')}
            </select>
        </div>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.saveAssignment('${teamId}', '${kw}', ${existing ? existing.id : 'null'})">Guardar</button>
    `;
    window.openModal('Asignar equipo', body, footer);
};

window.saveAssignment = async function(teamId, kw, existingId) {
    const projectCode = document.getElementById('assignProject').value;

    if (existingId !== null) {
        if (projectCode) {
            await DB.put('team_assignments', { id: existingId, teamId, kw, projectCode, timestamp: Date.now() });
        } else {
            await DB.del('team_assignments', existingId);
        }
    } else if (projectCode) {
        await DB.add('team_assignments', { teamId, kw, projectCode, timestamp: Date.now() });
    }

    window.closeModal();
    window.toast('Asignación guardada', 'success');
    window.render_teams();
};

window.addTeam = function() {
    let body = `
        <div class="form-group"><label class="form-label">ID del equipo</label><input class="form-input" id="newTeamId" placeholder="ej: WEST-005"></div>
        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="newTeamName" placeholder="ej: West-005"></div>
        <div class="form-group"><label class="form-label">Miembros (uno por línea)</label><textarea class="form-textarea" id="newTeamMembers" placeholder="Carlos M.\nDiego R."></textarea></div>
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.saveNewTeam()">Guardar</button>
    `;
    window.openModal('Nuevo equipo', body, footer);
};

window.saveNewTeam = async function() {
    const id = document.getElementById('newTeamId').value.trim();
    const name = document.getElementById('newTeamName').value.trim();
    const members = document.getElementById('newTeamMembers').value.split('\n').map(m => m.trim()).filter(Boolean);
    if (!id || !name) { window.toast('ID y nombre requeridos', 'error'); return; }
    await DB.put('teams', { id, name, members });
    window.closeModal();
    window.toast('Equipo creado', 'success');
    window.render_teams();
};

window.editTeam = async function(teamId) {
    const team = await DB.get('teams', teamId);
    if (!team) return;

    let body = `
        <div class="form-group"><label class="form-label">ID</label><input class="form-input" value="${team.id}" disabled></div>
        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="editTeamName" value="${team.name}"></div>
        <div class="form-group"><label class="form-label">Miembros (uno por línea)</label><textarea class="form-textarea" id="editTeamMembers">${(team.members || []).join('\n')}</textarea></div>
    `;
    const footer = `
        <button class="btn btn-danger" onclick="window.deleteTeam('${teamId}')">Eliminar</button>
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.updateTeam('${teamId}')">Guardar</button>
    `;
    window.openModal('Editar equipo', body, footer);
};

window.updateTeam = async function(teamId) {
    const team = await DB.get('teams', teamId);
    if (!team) return;
    team.name = document.getElementById('editTeamName').value.trim();
    team.members = document.getElementById('editTeamMembers').value.split('\n').map(m => m.trim()).filter(Boolean);
    await DB.put('teams', team);
    window.closeModal();
    window.toast('Equipo actualizado', 'success');
    window.render_teams();
};

window.deleteTeam = async function(teamId) {
    if (!confirm('¿Eliminar este equipo?')) return;
    await DB.del('teams', teamId);
    window.closeModal();
    window.toast('Equipo eliminado', 'info');
    window.render_teams();
};
