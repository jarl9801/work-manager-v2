// Settings view — project config, team management, price list
window.render_settings = async function() {
    const container = document.getElementById('view-settings');
    const projects = await DB.getAll('projects');
    const teams = await DB.getAll('teams');

    container.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Ajustes</div>
                <div class="section-sub">Configuración del sistema</div>
            </div>
        </div>

        <div class="tabs" id="settingsTabs">
            <button class="tab active" onclick="window.switchSettingsTab('projects', this)">Proyectos</button>
            <button class="tab" onclick="window.switchSettingsTab('prices', this)">Lista de precios</button>
            <button class="tab" onclick="window.switchSettingsTab('data', this)">Datos</button>
            <button class="tab" onclick="window.switchSettingsTab('credentials', this)">Credenciales</button>
        </div>

        <div id="settingsContent"></div>
    `;

    window._settingsTab = 'projects';
    window.renderSettingsContent();
};

window.switchSettingsTab = function(tab, btn) {
    document.querySelectorAll('#settingsTabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    window._settingsTab = tab;
    window.renderSettingsContent();
};

window.renderSettingsContent = async function() {
    const el = document.getElementById('settingsContent');

    if (window._settingsTab === 'projects') {
        const projects = await DB.getAll('projects');
        el.innerHTML = `
            <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
                <button class="btn btn-primary" onclick="window.addProject()">+ Nuevo proyecto</button>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Código</th><th>Nombre</th><th>Cliente</th><th>Operador</th><th>Líneas</th><th>Estado</th><th></th></tr></thead>
                    <tbody>
                        ${projects.map(p => `
                        <tr>
                            <td style="font-weight:600">${p.code}</td>
                            <td>${p.name}</td>
                            <td>${p.clientId}</td>
                            <td>${p.operatorId}</td>
                            <td>${(p.lines || []).map(l => `<span class="badge ${l === 'NE3' ? 'badge-blue' : 'badge-green'}">${l}</span>`).join(' ')}</td>
                            <td><span class="badge ${p.status === 'active' ? 'badge-green' : 'badge-orange'}">${p.status}</span></td>
                            <td><button class="btn btn-sm btn-secondary" onclick="window.editProject('${p.code}')">✏️</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (window._settingsTab === 'prices') {
        el.innerHTML = `
            <div class="card" style="margin-bottom:16px">
                <div class="card-header"><span class="card-title">NE3 — Backbone</span></div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Concepto</th><th>Unidad</th><th>Precio €</th></tr></thead>
                        <tbody>
                            ${Object.entries(PRICE_LIST.NE3).map(([k, v]) => `
                            <tr><td>${v.label}</td><td>${v.unit}</td><td style="font-weight:600">€ ${v.price.toFixed(2)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><span class="card-title">NE4 — Hausanschluss</span></div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Concepto</th><th>Unidad</th><th>Precio €</th></tr></thead>
                        <tbody>
                            ${Object.entries(PRICE_LIST.NE4).map(([k, v]) => `
                            <tr><td>${v.label}</td><td>${v.unit}</td><td style="font-weight:600">€ ${v.price.toFixed(2)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style="margin-top:12px;font-size:12px;color:var(--text-secondary)">
                Para modificar precios, edita <code>data/prices.js</code>
            </div>
        `;
    } else if (window._settingsTab === 'credentials') {
        document.getElementById('settingsContent').innerHTML = `
            <div class="card" style="padding:1.5rem;">
                <h3 style="margin-bottom:1rem;color:#e5e5ea;">🔐 Credenciales GFP (imasm)</h3>
                <p style="color:#8e8e93;font-size:13px;margin-bottom:1rem;">Se guardan solo en tu navegador (localStorage).</p>
                <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:320px;">
                    <input id="gfpUser" type="text" placeholder="Usuario" value="${localStorage.getItem('gfp_usuario')||''}" 
                        style="padding:10px;background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e5e5ea;font-size:14px;">
                    <input id="gfpPass" type="password" placeholder="Contraseña" value="${localStorage.getItem('gfp_password')||''}"
                        style="padding:10px;background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e5e5ea;font-size:14px;">
                    <button onclick="window.saveGfpCreds()" 
                        style="padding:10px;background:#30d158;color:#000;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
                        Guardar
                    </button>
                </div>
            </div>`;
    } else if (window._settingsTab === 'data') {
        const recordCount = await DB.count('records');
        const clientCount = await DB.count('clients');
        const certCount = await DB.count('certification');

        el.innerHTML = `
            <div class="card" style="margin-bottom:16px">
                <div class="card-header"><span class="card-title">Base de datos</span></div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <div style="display:flex;justify-content:space-between"><span>Registros de producción</span><span style="font-weight:600">${recordCount}</span></div>
                    <div style="display:flex;justify-content:space-between"><span>Clientes importados</span><span style="font-weight:600">${clientCount}</span></div>
                    <div style="display:flex;justify-content:space-between"><span>Certificaciones</span><span style="font-weight:600">${certCount}</span></div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><span class="card-title">Acciones</span></div>
                <div style="display:flex;flex-wrap:wrap;gap:8px">
                    <button class="btn btn-secondary" onclick="window.exportAllData()">📥 Exportar todo</button>
                    <button class="btn btn-danger" onclick="window.resetAllData()">🗑 Borrar todo</button>
                </div>
            </div>
        `;
    }
};

window.addProject = function() {
    let body = `
        <div class="form-group"><label class="form-label">Código</label><input class="form-input" id="newProjCode" placeholder="ej: ABC"></div>
        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="newProjName" placeholder="ej: Proyecto Ejemplo"></div>
        <div class="form-group">
            <label class="form-label">Cliente</label>
            <select class="form-select" id="newProjClient">
                ${PROJECT_SEED.clients.map(c => `<option value="${c.id}">${c.name} (${c.id})</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Operador</label>
            <select class="form-select" id="newProjOperator">
                ${PROJECT_SEED.operators.map(o => `<option value="${o.id}">${o.name} (${o.id})</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Líneas</label>
            <label class="dropdown-option"><input type="checkbox" id="newProjNE3" checked> NE3</label>
            <label class="dropdown-option"><input type="checkbox" id="newProjNE4" checked> NE4</label>
        </div>
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.saveNewProject()">Guardar</button>
    `;
    window.openModal('Nuevo proyecto', body, footer);
};

window.saveNewProject = async function() {
    const code = document.getElementById('newProjCode').value.trim().toUpperCase();
    const name = document.getElementById('newProjName').value.trim();
    const clientId = document.getElementById('newProjClient').value;
    const operatorId = document.getElementById('newProjOperator').value;
    const lines = [];
    if (document.getElementById('newProjNE3').checked) lines.push('NE3');
    if (document.getElementById('newProjNE4').checked) lines.push('NE4');

    if (!code || !name) { window.toast('Código y nombre requeridos', 'error'); return; }

    await DB.put('projects', { code, name, clientId, operatorId, lines, status: 'active' });
    window.closeModal();
    window.toast('Proyecto creado', 'success');
    window.renderSettingsContent();
};

window.editProject = async function(code) {
    const project = await DB.get('projects', code);
    if (!project) return;

    let body = `
        <div class="form-group"><label class="form-label">Código</label><input class="form-input" value="${project.code}" disabled></div>
        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="editProjName" value="${project.name}"></div>
        <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="editProjStatus">
                <option value="active" ${project.status === 'active' ? 'selected' : ''}>Activo</option>
                <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>Pausado</option>
                <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completado</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Líneas</label>
            <label class="dropdown-option"><input type="checkbox" id="editProjNE3" ${project.lines.includes('NE3') ? 'checked' : ''}> NE3</label>
            <label class="dropdown-option"><input type="checkbox" id="editProjNE4" ${project.lines.includes('NE4') ? 'checked' : ''}> NE4</label>
        </div>
    `;
    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.updateProject('${code}')">Guardar</button>
    `;
    window.openModal('Editar proyecto', body, footer);
};

window.updateProject = async function(code) {
    const project = await DB.get('projects', code);
    if (!project) return;
    project.name = document.getElementById('editProjName').value.trim();
    project.status = document.getElementById('editProjStatus').value;
    project.lines = [];
    if (document.getElementById('editProjNE3').checked) project.lines.push('NE3');
    if (document.getElementById('editProjNE4').checked) project.lines.push('NE4');
    await DB.put('projects', project);
    window.closeModal();
    window.toast('Proyecto actualizado', 'success');
    window.renderSettingsContent();
};

window.exportAllData = async function() {
    const data = {
        projects: await DB.getAll('projects'),
        records: await DB.getAll('records'),
        clients: await DB.getAll('clients'),
        teams: await DB.getAll('teams'),
        team_assignments: await DB.getAll('team_assignments'),
        certification: await DB.getAll('certification')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `workmanager_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.toast('Backup exportado', 'success');
};

window.resetAllData = async function() {
    if (!confirm('⚠️ ¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
    if (!confirm('¿Estás seguro? Se perderán todos los registros.')) return;
    for (const store of ['records', 'clients', 'team_assignments', 'certification']) {
        await DB.clear(store);
    }
    window.toast('Datos borrados', 'info');
    window.renderSettingsContent();
};

window.saveGfpCreds = function() {
    const u = document.getElementById('gfpUser').value.trim();
    const p = document.getElementById('gfpPass').value.trim();
    if (u && p) {
        localStorage.setItem('gfp_usuario', u);
        localStorage.setItem('gfp_password', p);
        alert('✅ Credenciales guardadas');
    } else {
        alert('⚠️ Completa ambos campos');
    }
};
