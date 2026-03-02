// Main app — routing, navigation, utilities
(async function() {
    // Register SW
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Init DB & seed
    await DB.open();
    await DB.seed();

    // Current KW
    function getCurrentKW() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000);
        const oneWeek = 604800000;
        return Math.ceil((diff / oneWeek + start.getDay() / 7));
    }

    document.getElementById('currentKW').textContent = `KW ${String(getCurrentKW()).padStart(2, '0')}`;

    // Navigation
    const viewTitles = {
        dashboard: 'Dashboard',
        projects: 'Proyectos',
        production: 'Producción',
        teams: 'Equipos',
        ne3clients: 'Clientes NE3',
        ne4citas: 'Citas WC',
        gfpcitas: 'Citas GFP',
        clients: 'Clientes NE4',
        certification: 'Certificación',
        hub: '🔗 Hub de Apps',
        fieldwc: '🔧 Field WestConnect',
        fieldgfp: '🔌 Field Glasfaser+',
        fieldadmin: '📊 Field Admin',
        fieldreports: '📄 Reportes de Campo',
        settings: 'Ajustes'
    };

    window.navigate = function(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const el = document.getElementById('view-' + view);
        if (el) el.classList.add('active');
        
        const nav = document.querySelector(`[data-view="${view}"]`);
        if (nav) nav.classList.add('active');
        
        document.getElementById('pageTitle').textContent = viewTitles[view] || view;
        
        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('open');

        // Render view
        window.location.hash = view;
        if (window['render_' + view]) window['render_' + view]();
    };

    window.toggleSidebar = function() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('open');
    };

    // Modal
    window.openModal = function(title, bodyHtml, footerHtml) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalFooter').innerHTML = footerHtml || '';
        document.getElementById('modalOverlay').classList.add('open');
    };

    window.closeModal = function() {
        document.getElementById('modalOverlay').classList.remove('open');
    };

    // Toast
    window.toast = function(msg, type = 'info') {
        const container = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    };

    // Utility: generate unique code
    window.generateCode = function(clientId, operatorId, projectCode, line, kw) {
        const kwStr = 'KW' + String(kw).padStart(2, '0');
        // Count existing records for sequence
        return DB.getAllByIndex('records', 'by_kw', kwStr).then(records => {
            const filtered = records.filter(r => r.projectCode === projectCode && r.line === line);
            const seq = String(filtered.length + 1).padStart(3, '0');
            return `${clientId}-${operatorId}-${projectCode}-${line}-${kwStr}-${seq}`;
        });
    };

    // Utility: parse CSV
    window.parseCSV = function(text) {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];
        // Handle semicolon or comma separator
        const sep = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(sep).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        return lines.slice(1).map(line => {
            const vals = line.split(sep).map(v => v.trim().replace(/^"(.*)"$/, '$1'));
            const obj = {};
            headers.forEach((h, i) => obj[h] = vals[i] || '');
            return obj;
        });
    };

    // Utility: export to CSV
    window.exportCSV = function(data, filename) {
        if (!data.length) return;
        const headers = Object.keys(data[0]);
        const csv = [headers.join(';'), ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    };

    // Utility: dropdown checkbox filter
    window.createDropdownFilter = function(containerId, label, options, onChange) {
        const selected = new Set();
        const container = document.getElementById(containerId);
        if (!container) return { getSelected: () => selected };

        const wrapper = document.createElement('div');
        wrapper.className = 'dropdown-filter';

        const btn = document.createElement('button');
        btn.className = 'dropdown-btn';
        btn.innerHTML = `${label} <span class="arrow">▾</span>`;

        const panel = document.createElement('div');
        panel.className = 'dropdown-panel';

        options.forEach(opt => {
            const option = document.createElement('label');
            option.className = 'dropdown-option';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = opt.value;
            cb.addEventListener('change', () => {
                if (cb.checked) selected.add(opt.value);
                else selected.delete(opt.value);
                updateBtn();
                onChange(selected);
            });
            option.appendChild(cb);
            option.appendChild(document.createTextNode(opt.label));
            panel.appendChild(option);
        });

        function updateBtn() {
            if (selected.size > 0) {
                btn.innerHTML = `${label} <span class="count">${selected.size}</span> <span class="arrow">▾</span>`;
                btn.classList.add('active');
            } else {
                btn.innerHTML = `${label} <span class="arrow">▾</span>`;
                btn.classList.remove('active');
            }
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-panel.open').forEach(p => {
                if (p !== panel) p.classList.remove('open');
            });
            panel.classList.toggle('open');
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(panel);
        container.appendChild(wrapper);

        return { getSelected: () => selected };
    };

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-panel.open').forEach(p => p.classList.remove('open'));
    });

    // Route from hash
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    window.navigate(hash);
})();
