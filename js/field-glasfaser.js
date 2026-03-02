// field-glasfaser.js — Glasfaser Plus Field Report (integrated into WM v2)
(function() {
    'use strict';
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec';
    const CTX = 'gfp';

    const state = {
        lang: 'es', pin: '', teams: {}, teamConfig: [], configLoaded: false,
        currentTeam: null, currentTechnician: '', submissions: [], screen: 'pin'
    };

    const T = {
        es: {
            online:'En línea', offline:'Sin conexión', pinLabel:'Ingrese PIN (4 dígitos)', invalidPin:'PIN inválido',
            sendBtn:'✓ Enviar', sending:'⏳ Enviando...', histBtn:'📋 Historial',
            successTitle:'Enviado con Éxito', successMsg:'Datos registrados correctamente.', newForm:'Nuevo Formulario',
            savedOffline:'📱 Guardado localmente.', connError:'⚠️ Error de conexión.',
            fillRequired:'Complete todos los campos obligatorios', timeError:'Hora fin posterior a inicio',
            needComments:'Se requieren observaciones', needEvidence:'Se requiere al menos 1 foto de evidencia',
            needPhotos:'Faltan fotos obligatorias', needOrder:'Ingrese el Nº de Orden', needBuilding:'Seleccione tipo de edificio',
            sectionBasic:'Información Básica', lblTeam:'Equipo', lblTech:'Técnico',
            lblSupport:'Equipo de Apoyo', noSupport:'Sin equipo de apoyo', lblDate:'Fecha', lblSchedule:'Horario',
            lblStart:'Inicio', lblEnd:'Fin', lblStatus:'Estado del Trabajo', selectStatus:'Seleccionar estado...',
            statusOk:'Finalizada OK', statusAbsent:'Cliente Ausente', statusPrevious:'Estados Previos',
            statusReschedule:'Recitar', statusHold:'Paralizada', statusPreinstalled:'Preinstalada', statusNotOk:'Finalizada No OK',
            lblComments:'Observaciones', phComments:'Agregue observaciones...',
            lblOrder:'Nº Orden', lblBuildType:'Tipo de Edificio',
            sdu1simple:'SDU(1): AP/TA - 1 vivienda simple', sdu1apTa:'SDU(1): AP + TA - 1 vivienda con AP separado',
            sdu2:'SDU(2): 2 viviendas', mdu3:'MDU(3+): 3 o más viviendas',
            gfpData:'Datos de Orden - Glasfaser Plus', gfpPhotos:'Fotos Glasfaser Plus',
            lblNe4Check:'NE4 realizado (Instalación en edificio)', ne4Hint:'OTB/AP, cableado interior, ONT/TA, activación',
            lblNe3Check:'NE3 realizado (Patch NVT / Fusión DP)', ne3Hint:'Patch en POP/NVT, luz roja, fusión DP',
            evidenceTitle:'Foto de Evidencia (Obligatoria)', evidenceHint:'Tome al menos 1 foto como evidencia',
            evidencePhoto:'Foto de Evidencia', evidenceExtra:'Foto Adicional',
            miscTitle:'Fotos Adicionales', miscHint:'Fotos extras: entrada, sellado, daños previos, etc.',
            miscPhoto1:'Foto adicional 1', miscPhoto2:'Foto adicional 2', miscPhoto3:'Foto adicional 3',
            histTitle:'Envíos de Hoy', histEmpty:'📋 No hay envíos aún', histBack:'← Volver',
            selectMember:'Seleccione su nombre',
            photoBlurry:'Foto borrosa', photoDark:'Foto oscura', photoOverexposed:'Foto sobreexpuesta',
        },
        de: {
            online:'Online', offline:'Keine Verbindung', pinLabel:'PIN eingeben (4 Ziffern)', invalidPin:'Ungültige PIN',
            sendBtn:'✓ Einreichen', sending:'⏳ Senden...', histBtn:'📋 Verlauf',
            successTitle:'Erfolgreich gesendet', successMsg:'Daten korrekt registriert.', newForm:'Neues Formular',
            fillRequired:'Alle Pflichtfelder ausfüllen', timeError:'Endzeit nach Startzeit',
            needComments:'Anmerkungen erforderlich', needEvidence:'Mindestens 1 Beweisfoto',
            needPhotos:'Pflichtfotos fehlen', needOrder:'Auftragsnummer eingeben', needBuilding:'Gebäudetyp auswählen',
            sectionBasic:'Grundinformationen', lblTeam:'Team', lblTech:'Techniker',
            lblSupport:'Unterstützungsteam', noSupport:'Kein Unterstützungsteam', lblDate:'Datum', lblSchedule:'Zeitplan',
            lblStart:'Start', lblEnd:'Ende', lblStatus:'Arbeitsstatus', selectStatus:'Status auswählen...',
            statusOk:'Abgeschlossen OK', statusAbsent:'Kunde Abwesend', statusPrevious:'Vorherige Zustände',
            statusReschedule:'Umterminierung', statusHold:'Pausiert', statusPreinstalled:'Vorinstalliert', statusNotOk:'Nicht OK',
            lblComments:'Anmerkungen', phComments:'Wichtige Anmerkungen...',
            lblOrder:'Auftragsnr.', lblBuildType:'Gebäudetyp',
            sdu1simple:'SDU(1): 1 Wohnung einfach', sdu1apTa:'SDU(1): AP + TA - 1 Wohnung',
            sdu2:'SDU(2): 2 Wohnungen', mdu3:'MDU(3+): 3+ Wohnungen',
            gfpData:'Auftragsdaten - Glasfaser Plus', gfpPhotos:'Fotos Glasfaser Plus',
            lblNe4Check:'NE4 durchgeführt (Gebäudeinstallation)', ne4Hint:'OTB/AP, Innenverkabelung, ONT/TA, Aktivierung',
            lblNe3Check:'NE3 durchgeführt (Patch NVT / Fusion DP)', ne3Hint:'Patch im POP/NVT, Rotlicht, DP-Fusion',
            evidenceTitle:'Beweisfoto (Pflicht)', evidenceHint:'Mindestens 1 Foto als Nachweis',
            evidencePhoto:'Beweisfoto', evidenceExtra:'Zusätzliches Foto',
            miscTitle:'Zusatzfotos', miscHint:'Zusatzfotos: Eingang, Abdichtung, Schäden, etc.',
            miscPhoto1:'Zusatzfoto 1', miscPhoto2:'Zusatzfoto 2', miscPhoto3:'Zusatzfoto 3',
            histTitle:'Heutige Einreichungen', histEmpty:'📋 Noch keine', histBack:'← Zurück',
            selectMember:'Wählen Sie Ihren Namen',
            photoBlurry:'Unscharf', photoDark:'Zu dunkel', photoOverexposed:'Überbelichtet',
        }
    };

    function t(key) { return (T[state.lang] && T[state.lang][key]) || T.es[key] || key; }
    function hasPhoto(id) { return window.PhotoUtils.hasPhoto(CTX, id); }
    function cpf(id, label, req) { return window.PhotoUtils.createPhotoFieldHTML(id, label, req, true); }

    // GFP Photo definitions
    const GFP_PHOTOS = {
        obraCivil: [
            { id:'gfp_pre_ext', label:'1.1 Previo - Pasamuros Exterior' },
            { id:'gfp_pre_int', label:'1.2 Previo - Pasamuros Interior' },
            { id:'gfp_post_ext', label:'2.1 Post - Pasamuros Exterior' },
            { id:'gfp_post_int', label:'2.2 Post - Pasamuros Interior' },
        ],
        otbAp: [
            { id:'gfp_otb_entrada', label:'3.1 OTB/AP Abierta - Entrada cable + splitter' },
            { id:'gfp_otb_fusion', label:'3.2 OTB/AP Abierta - Bandeja Fusión' },
            { id:'gfp_otb_cerrada', label:'3.3 OTB/AP Cerrada + Etiqueta KLS ID' },
        ],
        ontTa: [
            { id:'gfp_ta_entrada', label:'4.1 ONT/TA Abierta - Entrada cable' },
            { id:'gfp_ta_fusion', label:'4.2 ONT/TA Abierta - Bandeja Fusión' },
            { id:'gfp_ta_cerrada', label:'4.3 ONT/TA Cerrada + Etiqueta Home ID (QR)' },
        ],
        interiorSdu1: [
            { id:'gfp_cable_ap_entrada', label:'5.4 Cableado: OTB/AP a Entrada Vivienda' },
            { id:'gfp_cable_entrada_ta', label:'5.7 Cableado: Entrada Vivienda - ONT/TA' },
        ],
        interiorSdu2: [
            { id:'gfp_canal_ap_entrada', label:'5.1 Canalizado: OTB/AP a Entrada' },
            { id:'gfp_cable_ap_entrada', label:'5.4 Cableado: OTB/AP a Entrada' },
            { id:'gfp_cable_entrada_ta', label:'5.7 Cableado: Entrada - ONT/TA' },
        ],
        interiorMdu: [
            { id:'gfp_canal_ap_sp', label:'5.2 Canalizado: OTB/AP a SammelPunkt' },
            { id:'gfp_canal_sp_entrada', label:'5.3 Canalizado: SP a Entrada' },
            { id:'gfp_cable_ap_sp', label:'5.5 Cableado: OTB/AP a SP' },
            { id:'gfp_cable_sp_entrada', label:'5.6 Cableado: SP a Entrada' },
            { id:'gfp_cable_entrada_ta', label:'5.7 Cableado: Entrada - ONT/TA' },
        ],
        activation: [{ id:'gfp_activacion', label:'6.1 Captura Activación en App' }],
        ne3: [
            { id:'gfp_patch_nvt', label:'7.1 Patch en POP/NVT' },
            { id:'gfp_luz_roja', label:'8.1 Luz Roja - Fibras NVT a OTB/AP' },
            { id:'gfp_fusion_dp', label:'9.1 Fusión DP/NVT - Bandeja + Etiqueta' },
        ],
    };

    function getGfpRequiredPhotos(bt) {
        let photos = [...GFP_PHOTOS.obraCivil];
        const ne4 = document.getElementById('gfp_ne4Check')?.checked;
        if (ne4) {
            if (['sdu1-ap+ta','sdu2','mdu3'].includes(bt)) photos.push(...GFP_PHOTOS.otbAp);
            if (bt === 'sdu1-ap+ta') photos.push(...GFP_PHOTOS.interiorSdu1);
            else if (bt === 'sdu2') photos.push(...GFP_PHOTOS.interiorSdu2);
            else if (bt === 'mdu3') photos.push(...GFP_PHOTOS.interiorMdu);
            photos.push(...GFP_PHOTOS.ontTa);
            photos.push(...GFP_PHOTOS.activation);
        }
        if (document.getElementById('gfp_ne3Check')?.checked) photos.push(...GFP_PHOTOS.ne3);
        return photos;
    }

    // ── RENDER ──
    window.render_fieldgfp = function() {
        window.PhotoUtils.clearContext(CTX);
        state.screen = 'pin'; state.pin = ''; state.currentTeam = null; state.currentTechnician = '';
        window._fieldPhotoUpdateCallback = updateCounters;

        const el = document.getElementById('view-fieldgfp');
        el.innerHTML = getCSS() + `
            <div class="fgfp-app">
                <div class="fgfp-topbar">
                    <div class="fwc-status"><span class="fwc-conn-dot" id="gfpConnDot"></span><span id="gfpConnText">Online</span></div>
                    <div class="fwc-lang-toggle">
                        <button class="fwc-lang-btn active" onclick="window.gfpSetLang('es')">ES</button>
                        <button class="fwc-lang-btn" onclick="window.gfpSetLang('de')">DE</button>
                    </div>
                </div>
                <div id="gfpContent"></div>
                <div class="fwc-bottom-actions" id="gfpBottom" style="display:none">
                    <button class="fwc-fab fwc-fab-secondary" onclick="window.gfpShowHistory()">📋 Historial</button>
                    <button class="fwc-fab fwc-fab-primary" style="background:var(--green);" id="gfpSubmitBtn" onclick="window.gfpHandleSubmit()">✓ Enviar</button>
                </div>
            </div>`;
        updateConnection();
        renderScreen();
        loadConfig();
    };

    function renderScreen() {
        const c = document.getElementById('gfpContent');
        if (!c) return;
        const bot = document.getElementById('gfpBottom');
        if (bot) bot.style.display = state.screen === 'form' ? 'flex' : 'none';

        switch(state.screen) {
            case 'pin': c.innerHTML = renderPinScreen(); attachPinEvents(); break;
            case 'member': c.innerHTML = renderMemberScreen(); break;
            case 'form': c.innerHTML = renderFormScreen(); attachFormEvents(); break;
            case 'history': c.innerHTML = renderHistoryScreen(); break;
        }
    }

    function renderPinScreen() {
        return `<div class="fwc-pin-screen">
            <div class="fwc-logo" style="background:linear-gradient(135deg,var(--green),#00a846);">GFP</div>
            <div class="fwc-logo-title">Field Report</div>
            <div class="fwc-logo-sub">Glasfaser Plus</div>
            <div class="fwc-pin-label">${t('pinLabel')}</div>
            <div class="fwc-pin-digits" id="gfpPinDigits">
                <div class="fwc-pin-digit"></div><div class="fwc-pin-digit"></div>
                <div class="fwc-pin-digit"></div><div class="fwc-pin-digit"></div>
            </div>
            <div class="fwc-keypad" id="gfpKeypad">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="fwc-key" data-key="${n}">${n}</button>`).join('')}
                <button class="fwc-key" data-key="del">⌫</button>
                <button class="fwc-key" data-key="0">0</button>
                <button class="fwc-key" style="visibility:hidden"></button>
            </div>
            <div id="gfpPinAlert"></div>
        </div>`;
    }

    function attachPinEvents() {
        const kp = document.getElementById('gfpKeypad');
        if (kp) kp.addEventListener('click', e => {
            const btn = e.target.closest('.fwc-key');
            if (!btn) return;
            const key = btn.dataset.key;
            if (key === 'del') state.pin = state.pin.slice(0,-1);
            else if (state.pin.length < 4) state.pin += key;
            updatePinDisplay();
            if (state.pin.length === 4) setTimeout(submitPin, 300);
        });
    }

    function updatePinDisplay() {
        document.querySelectorAll('#gfpPinDigits .fwc-pin-digit').forEach((d, i) => {
            d.textContent = i < state.pin.length ? '●' : '';
            d.classList.toggle('filled', i < state.pin.length);
        });
    }

    function submitPin() {
        if (!state.configLoaded) { setTimeout(submitPin, 500); return; }
        const team = state.teams[state.pin];
        if (!team) { showAlert(t('invalidPin'),'error'); state.pin = ''; updatePinDisplay(); return; }
        state.currentTeam = team;
        if (team.members && team.members.length > 0) { state.screen = 'member'; renderScreen(); }
        else { state.screen = 'form'; renderScreen(); }
    }

    function renderMemberScreen() {
        return `<div class="fwc-member-screen">
            <div style="font-size:48px;margin-bottom:12px;">👷</div>
            <h2 style="color:var(--green);margin-bottom:4px;">${state.currentTeam.name}</h2>
            <p style="color:var(--text-secondary)">${t('selectMember')}</p>
            <div class="fwc-member-list">
                ${state.currentTeam.members.map(m => `<button class="fwc-member-btn" onclick="window.gfpSelectMember('${m.replace(/'/g,"\\'")}')">${m}</button>`).join('')}
            </div>
        </div>`;
    }

    window.gfpSelectMember = function(name) { state.currentTechnician = name; state.screen = 'form'; renderScreen(); };

    function renderFormScreen() {
        const team = state.currentTeam;
        const today = new Date().toISOString().split('T')[0];
        return `<div class="fwc-form-screen">
            <div id="gfpAlertContainer"></div>
            <form id="gfpForm" onsubmit="return false;">
                <div class="fwc-section">
                    <div class="fwc-section-title" style="color:var(--green);">${t('sectionBasic')}</div>
                    <div class="fwc-field"><label>${t('lblTeam')}</label><div class="fwc-field-display">${team.name}</div></div>
                    ${state.currentTechnician ? `<div class="fwc-field"><label>${t('lblTech')}</label><div class="fwc-field-display">${state.currentTechnician}</div></div>` : ''}
                    <div class="fwc-field"><label>${t('lblSupport')}</label><select class="fwc-input" id="gfp_supportTeam"><option value="">${t('noSupport')}</option>${getSupportOptions()}</select></div>
                    <div class="fwc-field"><label class="required">${t('lblDate')}</label><input type="date" class="fwc-input" id="gfp_date" value="${today}"></div>
                    <div class="fwc-field"><label class="required">${t('lblSchedule')}</label>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            <div><label style="font-size:12px">${t('lblStart')}</label><input type="time" class="fwc-input" id="gfp_startTime"></div>
                            <div><label style="font-size:12px">${t('lblEnd')}</label><input type="time" class="fwc-input" id="gfp_endTime"></div>
                        </div>
                    </div>
                    <div class="fwc-field"><label class="required">${t('lblStatus')}</label>
                        <select class="fwc-input" id="gfp_workStatus" onchange="window.gfpHandleStatusChange()">
                            <option value="">${t('selectStatus')}</option>
                            <option value="completed-ok">${t('statusOk')}</option>
                            <option value="client-absent">${t('statusAbsent')}</option>
                            <option value="previous-states">${t('statusPrevious')}</option>
                            <option value="client-reschedule">${t('statusReschedule')}</option>
                            <option value="on-hold">${t('statusHold')}</option>
                            <option value="preinstalled">${t('statusPreinstalled')}</option>
                            <option value="completed-not-ok">${t('statusNotOk')}</option>
                        </select>
                    </div>
                    <div class="fwc-field"><label id="gfpCommentsLabel">${t('lblComments')}</label><textarea class="fwc-input" id="gfp_comments" placeholder="${t('phComments')}" rows="3"></textarea></div>
                </div>

                <div id="gfpDataSection" style="display:none;">
                    <div class="fwc-section">
                        <div class="fwc-section-title" style="color:var(--green);">${t('gfpData')}</div>
                        <div class="fwc-field"><label class="required">${t('lblOrder')}</label><input type="text" class="fwc-input" id="gfp_orderNumber" placeholder="Ej: 2051504"></div>
                        <div class="fwc-field"><label class="required">${t('lblBuildType')}</label>
                            <select class="fwc-input" id="gfp_buildingType" onchange="window.gfpUpdatePhotos()">
                                <option value="">Seleccionar...</option>
                                <option value="sdu1-ap-ta">${t('sdu1simple')}</option>
                                <option value="sdu1-ap+ta">${t('sdu1apTa')}</option>
                                <option value="sdu2">${t('sdu2')}</option>
                                <option value="mdu3">${t('mdu3')}</option>
                            </select>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
                            <label class="fwc-check-item" style="background:var(--green-dim);border-left:3px solid var(--green);padding:12px;">
                                <input type="checkbox" id="gfp_ne4Check" onchange="window.gfpUpdatePhotos()" style="width:20px;height:20px;accent-color:var(--green);">
                                <div><strong>${t('lblNe4Check')}</strong><br><span style="font-size:12px;color:var(--text-secondary);">${t('ne4Hint')}</span></div>
                            </label>
                            <label class="fwc-check-item" style="background:var(--blue-dim);border-left:3px solid var(--blue);padding:12px;">
                                <input type="checkbox" id="gfp_ne3Check" onchange="window.gfpUpdatePhotos()" style="width:20px;height:20px;accent-color:var(--blue);">
                                <div><strong>${t('lblNe3Check')}</strong><br><span style="font-size:12px;color:var(--text-secondary);">${t('ne3Hint')}</span></div>
                            </label>
                        </div>
                    </div>
                    <div id="gfpPhotosContainer"></div>
                </div>

                <div id="gfpMiscSection" style="display:none;"></div>
                <div id="gfpEvidenceSection" style="display:none;"></div>
            </form>
        </div>`;
    }

    function getSupportOptions() {
        const current = state.currentTeam;
        const teams = state.teamConfig.length > 0 ? state.teamConfig : Object.values(state.teams);
        return teams.filter(t => t.name !== current.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    }

    function attachFormEvents() {}

    window.gfpHandleStatusChange = function() {
        const status = document.getElementById('gfp_workStatus')?.value;
        const needsEvidence = ['client-absent','previous-states','client-reschedule','on-hold','completed-not-ok'].includes(status);
        const isFinalized = ['completed-ok','preinstalled'].includes(status);

        const cl = document.getElementById('gfpCommentsLabel');
        if (cl) cl.className = needsEvidence ? 'required' : '';

        // Evidence
        const evDiv = document.getElementById('gfpEvidenceSection');
        if (evDiv) {
            if (needsEvidence) {
                evDiv.style.display = 'block';
                evDiv.innerHTML = `<div class="fwc-section"><div class="fwc-section-title" style="color:var(--green);">${t('evidenceTitle')}</div>
                    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${t('evidenceHint')}</p>
                    ${cpf('gfp_evidence_1',t('evidencePhoto'),true)}${cpf('gfp_evidence_2',t('evidenceExtra'),false)}
                </div>`;
            } else { evDiv.style.display = 'none'; evDiv.innerHTML = ''; }
        }

        // Misc photos
        const miscDiv = document.getElementById('gfpMiscSection');
        if (miscDiv) {
            if (isFinalized) {
                miscDiv.style.display = 'block';
                miscDiv.innerHTML = `<div class="fwc-section"><div class="fwc-section-title" style="color:var(--green);">${t('miscTitle')}</div>
                    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${t('miscHint')}</p>
                    ${cpf('gfp_misc_1',t('miscPhoto1'),false)}${cpf('gfp_misc_2',t('miscPhoto2'),false)}${cpf('gfp_misc_3',t('miscPhoto3'),false)}
                </div>`;
            } else { miscDiv.style.display = 'none'; miscDiv.innerHTML = ''; }
        }

        // GFP data section
        const ds = document.getElementById('gfpDataSection');
        if (ds) ds.style.display = 'block';
        window.gfpUpdatePhotos();
    };

    window.gfpUpdatePhotos = function() {
        const container = document.getElementById('gfpPhotosContainer');
        if (!container) return;
        const bt = document.getElementById('gfp_buildingType')?.value;
        const status = document.getElementById('gfp_workStatus')?.value;
        const isFinalized = ['completed-ok','preinstalled'].includes(status);
        if (!bt || !isFinalized) { container.innerHTML = ''; return; }

        const photos = getGfpRequiredPhotos(bt);
        let html = `<div class="fwc-section"><div class="fwc-section-title" style="color:var(--green);">${t('gfpPhotos')} <span class="fwc-counter" id="gfpPhotoCtr">0/${photos.length}</span></div>`;
        photos.forEach(p => { html += cpf(p.id, p.label, true); });
        html += '</div>';
        container.innerHTML = html;
        updateCounters();
    };

    function updateCounters() {
        const bt = document.getElementById('gfp_buildingType')?.value;
        if (!bt) return;
        const photos = getGfpRequiredPhotos(bt);
        const filled = photos.filter(p => hasPhoto(p.id)).length;
        const ctr = document.getElementById('gfpPhotoCtr');
        if (ctr) { ctr.textContent = `${filled}/${photos.length}`; ctr.className = 'fwc-counter' + (filled===photos.length?' complete':''); }
    }

    function validate() {
        const status = document.getElementById('gfp_workStatus')?.value;
        const start = document.getElementById('gfp_startTime')?.value;
        const end = document.getElementById('gfp_endTime')?.value;
        const comments = document.getElementById('gfp_comments')?.value;
        if (!status || !start || !end || !document.getElementById('gfp_date')?.value) { showAlert(t('fillRequired'),'error'); return false; }
        if (start >= end) { showAlert(t('timeError'),'error'); return false; }
        const needsEvidence = ['client-absent','previous-states','client-reschedule','on-hold','completed-not-ok'].includes(status);
        if (needsEvidence && !comments?.trim()) { showAlert(t('needComments'),'error'); return false; }
        if (needsEvidence && !hasPhoto('gfp_evidence_1')) { showAlert(t('needEvidence'),'error'); return false; }
        if (!document.getElementById('gfp_orderNumber')?.value) { showAlert(t('needOrder'),'error'); return false; }
        const bt = document.getElementById('gfp_buildingType')?.value;
        if (!bt) { showAlert(t('needBuilding'),'error'); return false; }
        const isFinalized = ['completed-ok','preinstalled'].includes(status);
        if (isFinalized) {
            const photos = getGfpRequiredPhotos(bt);
            const missing = photos.filter(p => !hasPhoto(p.id));
            if (missing.length > 0) { showAlert(t('needPhotos') + ': ' + missing[0].label, 'error'); return false; }
        }
        return true;
    }

    function collectFormData() {
        return {
            timestamp: new Date().toISOString(),
            team: state.currentTeam?.name||'', technician: state.currentTechnician||'', client:'glasfaser-plus',
            date: document.getElementById('gfp_date')?.value,
            startTime: document.getElementById('gfp_startTime')?.value,
            endTime: document.getElementById('gfp_endTime')?.value,
            workStatus: document.getElementById('gfp_workStatus')?.value,
            comments: document.getElementById('gfp_comments')?.value,
            supportTeam: document.getElementById('gfp_supportTeam')?.value,
            orderNumber: document.getElementById('gfp_orderNumber')?.value,
            buildingType: document.getElementById('gfp_buildingType')?.value,
            ne4: document.getElementById('gfp_ne4Check')?.checked,
            ne3: document.getElementById('gfp_ne3Check')?.checked,
            photos: window.PhotoUtils.getPhotos(CTX),
            photoNames: window.PhotoUtils.collectPhotoNames(),
        };
    }

    window.gfpHandleSubmit = async function() {
        if (!validate()) return;
        const formData = collectFormData();
        const btn = document.getElementById('gfpSubmitBtn');
        if (btn) { btn.disabled = true; btn.textContent = t('sending'); }
        try {
            if (navigator.onLine) {
                await fetch(SCRIPT_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
            }
            state.submissions.push(formData);
            window.toast('✅ ' + t('successTitle'), 'success');
            window.PhotoUtils.clearContext(CTX);
            state.screen = 'form'; renderScreen();
        } catch(e) {
            formData.pendingSync = true; state.submissions.push(formData);
            window.toast(t('connError'), 'warning');
        }
        if (btn) { btn.disabled = false; btn.textContent = t('sendBtn'); }
    };

    function renderHistoryScreen() {
        const items = state.submissions.length === 0 ? `<div style="text-align:center;padding:40px;color:var(--text-secondary);">${t('histEmpty')}</div>` :
            state.submissions.map(s => `<div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;margin-bottom:8px;"><div style="font-weight:600;">${s.orderNumber||'—'}</div><div style="font-size:13px;color:var(--text-secondary);">${s.startTime} - ${s.endTime} | ${s.workStatus}</div></div>`).join('');
        return `<div style="padding:16px 0;"><h2 style="font-size:18px;margin-bottom:16px;">${t('histTitle')}</h2>${items}
            <button class="fwc-skip-btn" onclick="window.gfpGoBack()">${t('histBack')}</button></div>`;
    }

    window.gfpShowHistory = function() { state.screen = 'history'; renderScreen(); };
    window.gfpGoBack = function() { state.screen = 'form'; renderScreen(); };
    window.gfpSetLang = function(lang) {
        state.lang = lang;
        document.querySelectorAll('#view-fieldgfp .fwc-lang-btn').forEach(b => b.classList.toggle('active', b.textContent.trim() === lang.toUpperCase()));
        renderScreen();
    };

    async function loadConfig() {
        try {
            const resp = await fetch(SCRIPT_URL + '?action=getConfig');
            const data = await resp.json();
            if (data.teams && data.teams.length > 0) {
                state.teams = {}; state.teamConfig = data.teams.filter(t => (t.client||'').toLowerCase().includes('glasfaser'));
                data.teams.forEach(team => {
                    if (!(team.client||'').toLowerCase().includes('glasfaser')) return;
                    state.teams[team.pin] = { name:team.name, client:'glasfaser-plus', members:team.members||[] };
                });
                state.configLoaded = true;
                if (Object.keys(state.teams).length === 0) fallbackTeams();
            } else fallbackTeams();
        } catch(e) { fallbackTeams(); }
    }

    function fallbackTeams() {
        state.teams = { '1234': { name:'Plus-001', client:'glasfaser-plus', members:['Erick Flores'] } };
        state.configLoaded = true;
    }

    function showAlert(msg, type) {
        const c = document.getElementById('gfpAlertContainer');
        if (!c) { window.toast(msg, type); return; }
        const el = document.createElement('div');
        el.className = `fwc-alert fwc-alert-${type}`;
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }

    function updateConnection() {
        const dot = document.getElementById('gfpConnDot');
        const txt = document.getElementById('gfpConnText');
        if (dot) dot.classList.toggle('offline', !navigator.onLine);
        if (txt) txt.textContent = navigator.onLine ? t('online') : t('offline');
    }

    function getCSS() {
        return `<style>
        .fgfp-app { max-width:600px; margin:0 auto; }
        .fgfp-topbar { background:var(--bg-secondary); border-bottom:1px solid var(--border); padding:12px 16px; display:flex; align-items:center; justify-content:space-between; border-radius:12px 12px 0 0; margin-bottom:16px; }
        </style>`;
    }
})();
