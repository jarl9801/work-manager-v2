// field-westconnect.js — WestConnect NE4 Field Report (integrated into WM v2)
(function() {
    'use strict';
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6YI1Oh-tutU3q5NfPJxDq77QKDMVX6DtM92YZ_GxgKYqm0XXymVCOi08k4SuDteXr/exec';
    const CTX = 'wc';

    const state = {
        lang: 'es', pin: '', teams: {}, teamConfig: [], configLoaded: false,
        currentTeam: null, currentTechnician: '', selectedCita: null, citasTab: 'pendientes',
        submissions: [], screen: 'pin'
    };

    // ── I18N ──
    const T = {
        es: {
            online:'En línea', offline:'Sin conexión', pinLabel:'Ingrese PIN (4 dígitos)', invalidPin:'PIN inválido',
            sendBtn:'✓ Enviar', sending:'⏳ Enviando...', histBtn:'📋 Historial',
            successTitle:'Enviado con Éxito', successMsg:'Los datos se han registrado correctamente.', newForm:'Nuevo Formulario',
            savedOffline:'📱 Guardado localmente.', connError:'⚠️ Error de conexión. Guardado localmente.',
            fillRequired:'Complete todos los campos obligatorios', timeError:'Hora fin debe ser posterior a inicio',
            needComments:'Se requieren observaciones', needEvidence:'Se requiere al menos 1 foto de evidencia',
            needPhotos:'Faltan fotos obligatorias', needProtocols:'Deben completarse los 4 protocolos',
            needHA:'Ingrese todos los datos HA requeridos',
            needApPhoto:'Falta foto de la AP instalada', needApMediciones:'Faltan fotos de mediciones AP',
            needWeNomenclature:'Falta nomenclatura en WE-{we}', needWeClientName:'Falta nombre cliente en WE-{we}',
            needWeAbsentOnt:'Falta foto ONT sótano WE-{we}', needWeVariant:'Seleccione variante WE-{we}',
            lblWePresent:'Presente', lblWeAbsent:'Ausente',
            wePresentHint:'Instalación completa en vivienda', weAbsentHint:'Solo ONT en sótano + medición',
            sectionBasic:'Información Básica', lblTeam:'Equipo', lblTech:'Técnico',
            lblSupport:'Equipo de Apoyo', noSupport:'Sin equipo de apoyo', lblDate:'Fecha', lblSchedule:'Horario',
            lblStart:'Inicio', lblEnd:'Fin', lblStatus:'Estado del Trabajo', selectStatus:'Seleccionar estado...',
            statusCompleted:'Vivienda Finalizada', statusSecondVisit:'Requiere Segunda Visita', statusNoInstall:'Vivienda sin Instalación',
            lblComments:'Observaciones', phComments:'Agregue observaciones...',
            wcData:'Datos HA - Westconnect', lblHA:'Nº HA', lblUnits:'Unidades de Vivienda (WE)', lblVariant:'Variante de Ejecución',
            varEmpty:'Tuberías vacías / Conductos chimenea', varInterior:'Montante interior / vivienda',
            varCorridor:'Montante de pasillo', varExterior:'Montante exterior fachada', varMixed:'Mixto / Mischbau',
            lblWeVariant:'Variante para esta WE',
            protocols:'Protocolos (4/4 obligatorios)',
            fotosSotano:'Fotos Sótano', fotosVivienda:'Fotos por Vivienda', fotosExterior:'Fotos Exterior/Pasillo',
            evidenceTitle:'Foto de Evidencia (Obligatoria)', evidenceHint:'Tome al menos 1 foto como evidencia',
            evidencePhoto:'Foto de Evidencia', evidenceExtra:'Foto Adicional',
            histTitle:'Envíos de Hoy', histEmpty:'📋 No hay envíos aún', histBack:'← Volver al formulario',
            selectMember:'Seleccione su nombre',
            checklistTitle:'📋 Checklist Documentación NE4',
            valTitle:'📊 Score de Documentación', valBasicData:'Datos básicos', valComplete:'Completos', valIncomplete:'Incompletos',
            valPhotos:'Fotos', valMissing:'faltan', valChecklist:'Checklist NE4',
            valProtocols:'Protocolos', valComments:'Observaciones', valIncluded:'Incluidas', valNotIncluded:'Sin observaciones',
            valHaFormat:'Formato HA', valHaFormatHint:'HA debe empezar con "HA" seguido de números',
            valGoBack:'← Revisar', valSendAnyway:'Enviar →',
            valLowScoreTitle:'Score incompleto', valLowScoreMsg:'El score de documentación es {score}%. Enviar de todas formas?',
            photoBlurry:'Foto borrosa', photoDark:'Foto oscura', photoOverexposed:'Foto sobreexpuesta',
            // Checklist keys
            chkContract:'Nº Contrato en Installationsprotokoll', chkContractDesc:'Vertragsnummer incluido y correcto',
            chkHomeId:'HOME-ID pegada', chkHomeIdDesc:'Etiqueta HOME-ID visible en GFTA',
            chkOntSerial:'Serial ONT correcto', chkOntSerialDesc:'Número de serie ONT registrado',
            chkFiberWe:'Fibra asignada por WE', chkFiberWeDesc:'Cada WE tiene fibra asignada',
            chkGvPort:'GV-Port para GE correcto', chkGvPortDesc:'Puerto GV indicado (ej: 1/2, 3/4)',
            chkSignature:'Protocolo firmado', chkSignatureDesc:'Installationsprotokoll firmado',
            chkMessAll:'Mediciones de TODAS las WE', chkMessAllDesc:'Incluso las conectadas al APL',
            chkMessGe:'GE: ambas fibras medidas', chkMessGeDesc:'Ambas fibras para GE documentadas',
            chkUgFormat:'Formato UG-WE correcto', chkUgFormatDesc:'Formato: A.-0X.00X',
            chkFarbWe:'WE: Rot + reserva Weiss', chkFarbWeDesc:'NO verde por defecto — WE = Rojo + Blanco',
            chkFarbGe:'GE: Rot / Grün', chkFarbGeDesc:'Unidades comerciales con Rojo / Verde',
            chkFarbCount:'Cantidad WE/GE correcta', chkFarbCountDesc:'Número correcto verificado',
            chkHochzeit:'Hochzeit indicada', chkHochzeitDesc:'Conexión APL-GV indicada',
            chkLp:'Leistungspositionen correctas', chkLpDesc:'#100, #200, #210, #110, #180',
            chkLeerrohr:'Leerrohre documentados', chkLeerrohrDesc:'Fotos de tubos vacíos',
            chkBrandschutz:'Sellado cortafuegos', chkBrandschutzDesc:'Fotos del sello cortafuegos',
            chkMlar:'MLAR cumplido', chkMlarDesc:'Normativa MLAR en pasillo',
            chkFluchtweg:'Vía de escape libre', chkFluchtwegDesc:'Canal no obstruye evacuación',
            chkWetterfest:'Sellado exterior', chkWetterfestDesc:'Canal exterior protegido',
            chkFotoApl:'Foto APL-GV conexión clara', chkFotoAplDesc:'Patchkabel en canal',
            chkFotoKassette:'Foto cada Kassette clara', chkFotoKassetteDesc:'Patchkabel visibles',
            chkFotoGfta:'GFTA+ONT: HOME-ID legible', chkFotoGftaDesc:'Misma altura, rectos',
            chkFotoMedicion:'1 foto por cada fibra', chkFotoMedicionDesc:'Incluir GE',
            chkClean:'🧹 Lugar limpio', chkCleanDesc:'Sitio ordenado al terminar',
            needChecklist:'Complete todos los items del checklist NE4',
        },
        de: {
            online:'Online', offline:'Keine Verbindung', pinLabel:'PIN eingeben (4 Ziffern)', invalidPin:'Ungültige PIN',
            sendBtn:'✓ Einreichen', sending:'⏳ Senden...', histBtn:'📋 Verlauf',
            successTitle:'Erfolgreich gesendet', successMsg:'Daten korrekt registriert.', newForm:'Neues Formular',
            fillRequired:'Bitte alle Pflichtfelder ausfüllen', timeError:'Endzeit nach Startzeit',
            needComments:'Anmerkungen erforderlich', needEvidence:'Mindestens 1 Beweisfoto',
            needPhotos:'Pflichtfotos fehlen', needProtocols:'Alle 4 Protokolle nötig',
            needHA:'Alle HA-Daten eingeben',
            needApPhoto:'Foto AP fehlt', needApMediciones:'Fotos Leistungsmessungen fehlen',
            needWeNomenclature:'Nomenklatur fehlt WE-{we}', needWeClientName:'Kundenname fehlt WE-{we}',
            needWeAbsentOnt:'ONT-Foto fehlt WE-{we}', needWeVariant:'Variante wählen WE-{we}',
            lblWePresent:'Anwesend', lblWeAbsent:'Abwesend',
            wePresentHint:'Vollständige Installation', weAbsentHint:'Nur ONT im Keller + Messung',
            sectionBasic:'Grundinformationen', lblTeam:'Team', lblTech:'Techniker',
            lblSupport:'Unterstützungsteam', noSupport:'Kein Unterstützungsteam', lblDate:'Datum', lblSchedule:'Zeitplan',
            lblStart:'Start', lblEnd:'Ende', lblStatus:'Arbeitsstatus', selectStatus:'Status auswählen...',
            statusCompleted:'Wohnung fertiggestellt', statusSecondVisit:'Zweiter Besuch', statusNoInstall:'Wohnung ohne Installation',
            lblComments:'Anmerkungen', phComments:'Wichtige Anmerkungen...',
            wcData:'HA-Daten - Westconnect', lblHA:'HA-Nr.', lblUnits:'Wohneinheiten (WE)', lblVariant:'Ausführungsvariante',
            varEmpty:'Leerrohre / Schornsteinzüge', varInterior:'Innensteigleitung',
            varCorridor:'Flursteigleitung', varExterior:'Außensteigleitung Fassade', varMixed:'Mischbau',
            lblWeVariant:'Variante für diese WE',
            protocols:'Protokolle (4/4 erforderlich)',
            fotosSotano:'Fotos Keller', fotosVivienda:'Fotos pro Wohnung', fotosExterior:'Fotos Außen/Flur',
            evidenceTitle:'Beweisfoto (Pflicht)', evidenceHint:'Mindestens 1 Foto als Nachweis',
            evidencePhoto:'Beweisfoto', evidenceExtra:'Zusätzliches Foto',
            histTitle:'Heutige Einreichungen', histEmpty:'📋 Noch keine', histBack:'← Zurück',
            selectMember:'Wählen Sie Ihren Namen',
            checklistTitle:'📋 Checkliste NE4-Dokumentation',
            valTitle:'📊 Dokumentations-Score', valBasicData:'Basisdaten', valComplete:'Vollständig', valIncomplete:'Unvollständig',
            valPhotos:'Fotos', valMissing:'fehlen', valChecklist:'Checkliste NE4',
            valProtocols:'Protokolle', valComments:'Anmerkungen', valIncluded:'Vorhanden', valNotIncluded:'Keine',
            valHaFormat:'HA-Format', valHaFormatHint:'HA muss mit "HA" + Zahlen beginnen',
            valGoBack:'← Prüfen', valSendAnyway:'Senden →',
            valLowScoreTitle:'Score unvollständig', valLowScoreMsg:'Score beträgt {score}%. Trotzdem senden?',
            photoBlurry:'Unscharf', photoDark:'Zu dunkel', photoOverexposed:'Überbelichtet',
            chkContract:'Vertragsnr. im Protokoll', chkContractDesc:'Vertragsnummer korrekt',
            chkHomeId:'HOME-ID aufgeklebt', chkHomeIdDesc:'HOME-ID sichtbar auf GFTA',
            chkOntSerial:'ONT-Seriennr. korrekt', chkOntSerialDesc:'ONT-Seriennummer erfasst',
            chkFiberWe:'Faser pro WE zugewiesen', chkFiberWeDesc:'Jede WE hat Faser',
            chkGvPort:'GV-Port korrekt', chkGvPortDesc:'GV-Port angegeben',
            chkSignature:'Protokoll unterschrieben', chkSignatureDesc:'Vom Techniker unterschrieben',
            chkMessAll:'Messungen ALLER WE', chkMessAllDesc:'Auch direkt am APL',
            chkMessGe:'GE: beide Fasern', chkMessGeDesc:'Beide Fasern dokumentiert',
            chkUgFormat:'UG-WE Format korrekt', chkUgFormatDesc:'Format: A.-0X.00X',
            chkFarbWe:'WE: Rot + Weiss', chkFarbWeDesc:'NICHT Grün — WE = Rot + Weiß',
            chkFarbGe:'GE: Rot / Grün', chkFarbGeDesc:'Gewerbe mit Rot / Grün',
            chkFarbCount:'Anzahl WE/GE korrekt', chkFarbCountDesc:'Anzahl überprüft',
            chkHochzeit:'Hochzeit vermerkt', chkHochzeitDesc:'APL-GV Verbindung',
            chkLp:'Leistungspositionen', chkLpDesc:'#100 bis #180',
            chkLeerrohr:'Leerrohre dok.', chkLeerrohrDesc:'Fotos Leerrohre',
            chkBrandschutz:'Brandschutz', chkBrandschutzDesc:'Fotos Abschottung',
            chkMlar:'MLAR eingehalten', chkMlarDesc:'MLAR-Vorschriften',
            chkFluchtweg:'Fluchtweg frei', chkFluchtwegDesc:'Kein Hindernis',
            chkWetterfest:'Außendichtung', chkWetterfestDesc:'Wetterfest abgedichtet',
            chkFotoApl:'Foto APL-GV klar', chkFotoAplDesc:'Patchkabel im Kanal',
            chkFotoKassette:'Foto Kassette klar', chkFotoKassetteDesc:'Patchkabel sichtbar',
            chkFotoGfta:'GFTA+ONT lesbar', chkFotoGftaDesc:'HOME-ID lesbar, ONT an',
            chkFotoMedicion:'1 Foto pro Faser', chkFotoMedicionDesc:'Inkl. GE',
            chkClean:'🧹 Sauber', chkCleanDesc:'Aufgeräumt',
            needChecklist:'Alle NE4-Punkte ausfüllen',
        }
    };

    function t(key) { return (T[state.lang] && T[state.lang][key]) || T.es[key] || key; }

    // ── PHOTO DEFINITIONS ──
    const WC_BASEMENT = [
        { id:'wc_gfap', label:'GF-AP (abierto antes, después y cerrado)', req:true },
        { id:'wc_hochzeit', label:'Hochzeit: Conexión GF-AP ↔ GF-GV', req:true },
        { id:'wc_gv_interior', label:'Interior GF-GV (kassettes, empalmes)', req:true },
        { id:'wc_gv_cerrado', label:'GF-GV cerrado', req:true },
        { id:'wc_leitungsweg_keller', label:'Leitungsweg im Keller', req:true },
    ];
    const WC_WE_PHOTOS = [
        { suffix:'gfta_ont', label:'GF-TA + ONT (HOME-ID, patch, LEDs)', req:true, variants:'all' },
        { suffix:'canal', label:'Canal superficial hasta GF-TA', req:true, variants:['interior-riser','corridor-riser','exterior-riser'] },
        { suffix:'medicion', label:'Medición de fibra', req:true, variants:'all' },
    ];
    const WC_WE_ABSENT_PHOTOS = [
        { suffix:'ont_sotano', label:'ONT en sótano (Keller)', req:true },
        { suffix:'medicion', label:'Medición de fibra', req:true },
    ];
    const WC_EXTERIOR_BY_VARIANT = {
        'empty-pipes': [],
        'interior-riser': [
            { id:'wc_canal_interior', label:'Canal interior entre plantas', req:true },
            { id:'wc_sello_perforacion', label:'Sello cortafuegos', req:true },
        ],
        'corridor-riser': [
            { id:'wc_canal_pasillo', label:'Canal en pasillo / escalera', req:true },
            { id:'wc_sello_pasillo', label:'Sello cortafuegos pasillo', req:true },
        ],
        'exterior-riser': [
            { id:'wc_canal_fachada', label:'Canal exterior en fachada', req:true },
            { id:'wc_sello_ext', label:'Sello cortafuegos exterior', req:true },
            { id:'wc_penetracion', label:'Sellado penetración muro', req:true },
        ],
    };

    const NE4_CHECKLIST_ITEMS = [
        { id:'chk_inst_contract', titleKey:'chkContract', descKey:'chkContractDesc', bg:'rgba(255,159,10,0.1)', border:'var(--orange)', variants:'all' },
        { id:'chk_inst_homeid', titleKey:'chkHomeId', descKey:'chkHomeIdDesc', bg:'rgba(255,159,10,0.1)', border:'var(--orange)', variants:'all' },
        { id:'chk_inst_ont', titleKey:'chkOntSerial', descKey:'chkOntSerialDesc', bg:'rgba(255,159,10,0.1)', border:'var(--orange)', variants:'all' },
        { id:'chk_inst_fiber', titleKey:'chkFiberWe', descKey:'chkFiberWeDesc', bg:'rgba(255,159,10,0.1)', border:'var(--orange)', variants:'all' },
        { id:'chk_inst_gvport', titleKey:'chkGvPort', descKey:'chkGvPortDesc', bg:'rgba(255,159,10,0.1)', border:'var(--orange)', variants:'all' },
        { id:'chk_inst_sign', titleKey:'chkSignature', descKey:'chkSignatureDesc', bg:'rgba(255,159,10,0.1)', border:'var(--orange)', variants:'all' },
        { id:'chk_mess_allwe', titleKey:'chkMessAll', descKey:'chkMessAllDesc', bg:'rgba(10,132,255,0.1)', border:'var(--blue)', variants:'all' },
        { id:'chk_mess_ge', titleKey:'chkMessGe', descKey:'chkMessGeDesc', bg:'rgba(10,132,255,0.1)', border:'var(--blue)', variants:'all' },
        { id:'chk_mess_ugformat', titleKey:'chkUgFormat', descKey:'chkUgFormatDesc', bg:'rgba(10,132,255,0.1)', border:'var(--blue)', variants:'all' },
        { id:'chk_farb_we', titleKey:'chkFarbWe', descKey:'chkFarbWeDesc', bg:'rgba(48,209,88,0.1)', border:'var(--green)', variants:'all' },
        { id:'chk_farb_ge', titleKey:'chkFarbGe', descKey:'chkFarbGeDesc', bg:'rgba(48,209,88,0.1)', border:'var(--green)', variants:'all' },
        { id:'chk_farb_count', titleKey:'chkFarbCount', descKey:'chkFarbCountDesc', bg:'rgba(48,209,88,0.1)', border:'var(--green)', variants:'all' },
        { id:'chk_baumappe_hochzeit', titleKey:'chkHochzeit', descKey:'chkHochzeitDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:'all' },
        { id:'chk_baumappe_lp', titleKey:'chkLp', descKey:'chkLpDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:'all' },
        { id:'chk_leerrohr', titleKey:'chkLeerrohr', descKey:'chkLeerrohrDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:['empty-pipes'] },
        { id:'chk_brandschutz', titleKey:'chkBrandschutz', descKey:'chkBrandschutzDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:['interior-riser','corridor-riser','exterior-riser'] },
        { id:'chk_mlar', titleKey:'chkMlar', descKey:'chkMlarDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:['corridor-riser'] },
        { id:'chk_fluchtweg', titleKey:'chkFluchtweg', descKey:'chkFluchtwegDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:['corridor-riser'] },
        { id:'chk_wetterfest', titleKey:'chkWetterfest', descKey:'chkWetterfestDesc', bg:'rgba(191,90,242,0.1)', border:'var(--purple)', variants:['exterior-riser'] },
        { id:'chk_fotos_apl', titleKey:'chkFotoApl', descKey:'chkFotoAplDesc', bg:'rgba(255,69,58,0.1)', border:'var(--red)', variants:'all' },
        { id:'chk_fotos_kassette', titleKey:'chkFotoKassette', descKey:'chkFotoKassetteDesc', bg:'rgba(255,69,58,0.1)', border:'var(--red)', variants:'all' },
        { id:'chk_fotos_gfta', titleKey:'chkFotoGfta', descKey:'chkFotoGftaDesc', bg:'rgba(255,69,58,0.1)', border:'var(--red)', variants:'all' },
        { id:'chk_fotos_medicion', titleKey:'chkFotoMedicion', descKey:'chkFotoMedicionDesc', bg:'rgba(255,69,58,0.1)', border:'var(--red)', variants:'all' },
        { id:'chk_sauberkeit', titleKey:'chkClean', descKey:'chkCleanDesc', bg:'rgba(100,210,255,0.1)', border:'var(--cyan)', variants:'all' },
    ];

    function hasPhoto(id) { return window.PhotoUtils.hasPhoto(CTX, id); }
    function cpf(id, label, req) { return window.PhotoUtils.createPhotoFieldHTML(id, label, req, false); }

    function getWePhotosForVariant(v) { return WC_WE_PHOTOS.filter(p => p.variants === 'all' || p.variants.includes(v)); }
    function getExteriorPhotos(v) { return WC_EXTERIOR_BY_VARIANT[v] || []; }

    function getWeVariant(weId) {
        const gv = document.getElementById('wc_variant')?.value;
        if (gv !== 'mixed') return gv || '';
        const sel = document.getElementById(weId + '_variant');
        return sel ? sel.value : '';
    }

    function getUsedVariants() {
        const gv = document.getElementById('wc_variant')?.value;
        if (gv !== 'mixed') return gv ? [gv] : [];
        const numWe = parseInt(document.getElementById('wc_units')?.value) || 0;
        const set = new Set();
        for (let i = 1; i <= numWe; i++) { const v = getWeVariant('we' + String(i).padStart(2,'0')); if (v) set.add(v); }
        return [...set];
    }

    function getActiveChecklist() {
        const used = getUsedVariants();
        if (used.length === 0) return NE4_CHECKLIST_ITEMS.filter(i => i.variants === 'all');
        return NE4_CHECKLIST_ITEMS.filter(i => i.variants === 'all' || i.variants.some(v => used.includes(v)));
    }
    function getActiveCheckIds() { return getActiveChecklist().map(i => i.id); }

    // ── RENDER ──
    window.render_fieldwc = function() {
        window.PhotoUtils.clearContext(CTX);
        state.screen = 'pin'; state.pin = ''; state.currentTeam = null; state.currentTechnician = '';
        state.selectedCita = null; state.citasTab = 'pendientes';
        window._fieldPhotoUpdateCallback = updateCounters;

        const el = document.getElementById('view-fieldwc');
        el.innerHTML = getCSS() + `
            <div class="fwc-app">
                <div class="fwc-topbar">
                    <button class="fwc-back-btn" id="fwcBackBtn" onclick="window.fwcGoBack()" style="display:none">←</button>
                    <div class="fwc-status">
                        <span class="fwc-conn-dot" id="fwcConnDot"></span>
                        <span id="fwcConnText">Online</span>
                    </div>
                    <div class="fwc-lang-toggle">
                        <button class="fwc-lang-btn active" onclick="window.fwcSetLang('es')">ES</button>
                        <button class="fwc-lang-btn" onclick="window.fwcSetLang('de')">DE</button>
                    </div>
                </div>
                <div class="fwc-content" id="fwcContent"></div>
                <div class="fwc-bottom-actions" id="fwcBottom" style="display:none">
                    <button class="fwc-fab fwc-fab-secondary" onclick="window.fwcShowHistory()">📋 Historial</button>
                    <button class="fwc-fab fwc-fab-primary" id="fwcSubmitBtn" onclick="window.fwcHandleSubmit()">✓ Enviar</button>
                </div>
            </div>`;
        updateConnection();
        renderScreen();
        loadConfig();
    };

    function renderScreen() {
        const c = document.getElementById('fwcContent');
        if (!c) return;
        const bb = document.getElementById('fwcBackBtn');
        if (bb) bb.style.display = ['form','history'].includes(state.screen) ? 'block' : 'none';
        const bot = document.getElementById('fwcBottom');
        if (bot) bot.style.display = state.screen === 'form' ? 'flex' : 'none';

        switch(state.screen) {
            case 'pin': c.innerHTML = renderPinScreen(); attachPinEvents(); break;
            case 'member': c.innerHTML = renderMemberScreen(); break;
            case 'citas': c.innerHTML = renderCitasScreen(); loadCitas(); break;
            case 'form': c.innerHTML = renderFormScreen(); attachFormEvents(); break;
            case 'history': c.innerHTML = renderHistoryScreen(); break;
        }
    }

    function renderPinScreen() {
        return `<div class="fwc-pin-screen">
            <div class="fwc-logo">WC</div>
            <div class="fwc-logo-title">Field Report</div>
            <div class="fwc-logo-sub">Westconnect NE4</div>
            <div class="fwc-pin-label" id="fwcPinLabel">${t('pinLabel')}</div>
            <div class="fwc-pin-digits" id="fwcPinDigits">
                <div class="fwc-pin-digit"></div><div class="fwc-pin-digit"></div>
                <div class="fwc-pin-digit"></div><div class="fwc-pin-digit"></div>
            </div>
            <div class="fwc-keypad" id="fwcKeypad">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="fwc-key" data-key="${n}">${n}</button>`).join('')}
                <button class="fwc-key" data-key="del">⌫</button>
                <button class="fwc-key" data-key="0">0</button>
                <button class="fwc-key" style="visibility:hidden"></button>
            </div>
            <div id="fwcPinAlert"></div>
        </div>`;
    }

    function attachPinEvents() {
        const kp = document.getElementById('fwcKeypad');
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
        document.querySelectorAll('.fwc-pin-digit').forEach((d, i) => {
            d.textContent = i < state.pin.length ? '●' : '';
            d.classList.toggle('filled', i < state.pin.length);
        });
    }

    function submitPin() {
        if (!state.configLoaded) { setTimeout(submitPin, 500); return; }
        const team = state.teams[state.pin];
        if (!team) {
            showAlert(t('invalidPin'), 'error');
            state.pin = ''; updatePinDisplay(); return;
        }
        state.currentTeam = team;
        if (team.members && team.members.length > 0) { state.screen = 'member'; renderScreen(); }
        else { state.screen = 'citas'; renderScreen(); }
    }

    function renderMemberScreen() {
        return `<div class="fwc-member-screen">
            <div style="font-size:48px;margin-bottom:12px;">👷</div>
            <h2 style="color:var(--blue);margin-bottom:4px;">${state.currentTeam.name}</h2>
            <p style="color:var(--text-secondary)">${t('selectMember')}</p>
            <div class="fwc-member-list">
                ${state.currentTeam.members.map(m => `<button class="fwc-member-btn" onclick="window.fwcSelectMember('${m.replace(/'/g,"\\'")}')">${m}</button>`).join('')}
            </div>
        </div>`;
    }

    window.fwcSelectMember = function(name) {
        state.currentTechnician = name;
        state.screen = 'citas'; renderScreen();
    };

    // ── CITAS SCREEN ──
    function renderCitasScreen() {
        const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
        const dateStr = new Date().toLocaleDateString(state.lang === 'de' ? 'de-DE' : 'es-ES', opts);
        return `<div class="fwc-citas-screen">
            <div class="fwc-citas-header">
                <div style="font-size:18px;font-weight:700;">👷 ${state.currentTeam.name}</div>
                <div style="font-size:13px;opacity:0.85;margin-top:2px;">${dateStr}</div>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button class="fwc-citas-tab active" id="fwcTabPend" onclick="window.fwcSwitchCitasTab('pendientes')">📋 Pendientes</button>
                <button class="fwc-citas-tab" id="fwcTabHist" onclick="window.fwcSwitchCitasTab('historial')">📁 Historial</button>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;">
                <input type="date" id="fwcCitasDate" value="${new Date().toISOString().split('T')[0]}" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-primary);font-size:14px;">
                <button onclick="window.fwcLoadCitas()" style="background:var(--blue);color:white;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;">🔄</button>
            </div>
            <div id="fwcCitasLoading" style="text-align:center;padding:32px;color:var(--text-secondary);">⏳ Cargando citas…</div>
            <div id="fwcCitasEmpty" style="display:none;text-align:center;padding:32px;color:var(--text-secondary);">📭 Sin citas para esta fecha.</div>
            <div id="fwcCitasList"></div>
            <button class="fwc-skip-btn" onclick="window.fwcEnterFormDirect()">✏️ Llenar formulario sin cita</button>
        </div>`;
    }

    window.fwcSwitchCitasTab = function(tab) {
        state.citasTab = tab;
        const pend = document.getElementById('fwcTabPend');
        const hist = document.getElementById('fwcTabHist');
        if (pend) { pend.classList.toggle('active', tab==='pendientes'); }
        if (hist) { hist.classList.toggle('active', tab==='historial'); }
        loadCitasForDate(document.getElementById('fwcCitasDate')?.value || new Date().toISOString().split('T')[0]);
    };

    window.fwcLoadCitas = loadCitas;

    async function loadCitas() {
        const teamName = state.currentTeam.name;
        const today = new Date().toISOString().split('T')[0];
        const DONE = ['finalizada_ok','finalizada_no_ok','cliente_ausente','recitar','paralizada','cancelada'];
        for (let i = 0; i < 14; i++) {
            const d = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
            try {
                const resp = await fetch(`${SCRIPT_URL}?action=getCitasByTeam&team=${encodeURIComponent(teamName)}&date=${d}`);
                const data = await resp.json();
                if (data.success && data.citas && data.citas.some(c => !DONE.includes(c.status))) {
                    const dp = document.getElementById('fwcCitasDate');
                    if (dp) dp.value = d;
                    loadCitasForDate(d); return;
                }
            } catch (e) {}
        }
        const dp = document.getElementById('fwcCitasDate');
        if (dp) dp.value = today;
        loadCitasForDate(today);
    }

    async function loadCitasForDate(dateStr) {
        const teamName = state.currentTeam.name;
        const DONE = ['finalizada_ok','finalizada_no_ok','cliente_ausente','recitar','paralizada','cancelada'];
        const isHist = state.citasTab === 'historial';
        const loading = document.getElementById('fwcCitasLoading');
        const empty = document.getElementById('fwcCitasEmpty');
        const list = document.getElementById('fwcCitasList');
        if (loading) loading.style.display = 'block';
        if (empty) empty.style.display = 'none';
        if (list) list.innerHTML = '';

        try {
            const resp = await fetch(`${SCRIPT_URL}?action=getCitasByTeam&team=${encodeURIComponent(teamName)}&date=${dateStr}`);
            const data = await resp.json();
            if (loading) loading.style.display = 'none';
            if (!data.success || !data.citas) { if (empty) empty.style.display = 'block'; return; }
            let citas = data.citas.filter(c => isHist ? DONE.includes(c.status) : !DONE.includes(c.status));
            if (citas.length === 0) { if (empty) empty.style.display = 'block'; return; }
            renderCitasCards(citas, teamName, dateStr);
        } catch (err) {
            if (loading) loading.style.display = 'none';
            if (list) list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--red);">⚠️ Sin conexión</div>';
        }
    }

    function renderCitasCards(citas, teamName, dateStr) {
        const list = document.getElementById('fwcCitasList');
        const SL = { asignada:'Asignada', capturada:'Capturada', en_trabajo:'En trabajo',
            finalizada_ok:'✓ Finalizada', finalizada_no_ok:'✗ Finalizada', cliente_ausente:'Ausente', recitar:'Recitar', paralizada:'Paralizada' };
        const DONE = ['finalizada_ok','finalizada_no_ok','cliente_ausente','recitar','paralizada','cancelada'];

        list.innerHTML = citas.map(c => {
            const st = SL[c.status] || c.status;
            const addr = c.direccion || (c.calle ? `${c.calle}, ${c.cp} ${c.ciudad}` : '—');
            const isDone = DONE.includes(c.status);
            let btns = '';
            if (!isDone) {
                if (['libre','asignada'].includes(c.status)) btns = `<button class="fwc-cita-btn primary" onclick="window.fwcCapturarCita('${c.id}')">✅ Capturar</button>`;
                else if (c.status === 'capturada') btns = `<button class="fwc-cita-btn success" onclick="window.fwcIniciarCita('${c.id}',${JSON.stringify(c).replace(/"/g,'&quot;')})">▶️ Iniciar</button>`;
                else if (c.status === 'en_trabajo') btns = `<button class="fwc-cita-btn primary" onclick="window.fwcFinalizarCita('${c.id}',${JSON.stringify(c).replace(/"/g,'&quot;')})">🏁 Finalizar</button>`;
            }
            if (c.linkDocs) btns += `<a href="${c.linkDocs}" target="_blank" class="fwc-cita-btn doc">📎 Docs</a>`;
            return `<div class="fwc-cita-card status-${c.status}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <span style="font-size:20px;font-weight:700;">${c.ha || '—'}</span>
                    <span class="fwc-cita-badge badge-${c.status}">${st}</span>
                </div>
                <div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;">📍 ${addr}</div>
                <div style="font-size:13px;color:var(--blue);">🕐 ${c.inicio} – ${c.fin} · 👷 ${c.tecnicos} TK</div>
                <div class="fwc-cita-actions">${btns}</div>
            </div>`;
        }).join('');
    }

    window.fwcCapturarCita = async function(id) {
        await updateCitaStatus(id, 'capturada');
        loadCitas();
    };
    window.fwcIniciarCita = function(id, cita) {
        state.selectedCita = cita;
        updateCitaStatus(id, 'en_trabajo');
        window.fwcEnterFormDirect();
    };
    window.fwcFinalizarCita = function(id, cita) {
        state.selectedCita = cita;
        window.fwcEnterFormDirect();
    };

    async function updateCitaStatus(id, status, notas) {
        try {
            const p = new URLSearchParams({ action:'updateCitaStatus', citaId:id, status, notas: notas||'' });
            await fetch(`${SCRIPT_URL}?${p}`);
        } catch(_) {}
    }

    window.fwcEnterFormDirect = function() {
        state.screen = 'form'; renderScreen();
    };

    // ── FORM SCREEN ──
    function renderFormScreen() {
        const team = state.currentTeam;
        const today = new Date().toISOString().split('T')[0];
        const haVal = state.selectedCita?.ha || '';
        const startVal = state.selectedCita?.inicio || '';

        return `<div class="fwc-form-screen">
            <div class="fwc-progress"><div class="fwc-progress-fill" id="fwcProgressFill"></div></div>
            <div id="fwcAlertContainer"></div>
            <form id="fwcForm" onsubmit="return false;">
                <!-- Basic Info -->
                <div class="fwc-section">
                    <div class="fwc-section-title">${t('sectionBasic')}</div>
                    <div class="fwc-field"><label>${t('lblTeam')}</label><div class="fwc-field-display">${team.name}</div></div>
                    ${state.currentTechnician ? `<div class="fwc-field"><label>${t('lblTech')}</label><div class="fwc-field-display">${state.currentTechnician}</div></div>` : ''}
                    <div class="fwc-field"><label>${t('lblSupport')}</label><select class="fwc-input" id="wc_supportTeam"><option value="">${t('noSupport')}</option>${getSupportOptions()}</select></div>
                    <div class="fwc-field"><label class="required">${t('lblDate')}</label><input type="date" class="fwc-input" id="wc_date" value="${today}"></div>
                    <div class="fwc-field"><label class="required">${t('lblSchedule')}</label>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            <div><label style="font-size:12px">${t('lblStart')}</label><input type="time" class="fwc-input" id="wc_startTime" value="${startVal}"></div>
                            <div><label style="font-size:12px">${t('lblEnd')}</label><input type="time" class="fwc-input" id="wc_endTime"></div>
                        </div>
                    </div>
                    <div class="fwc-field"><label class="required">${t('lblStatus')}</label>
                        <select class="fwc-input" id="wc_workStatus" onchange="window.fwcHandleStatusChange()">
                            <option value="">${t('selectStatus')}</option>
                            <option value="completed">${t('statusCompleted')}</option>
                            <option value="second-visit">${t('statusSecondVisit')}</option>
                            <option value="no-install">${t('statusNoInstall')}</option>
                        </select>
                    </div>
                    <div class="fwc-field"><label id="fwcCommentsLabel">${t('lblComments')}</label><textarea class="fwc-input" id="wc_comments" placeholder="${t('phComments')}" rows="3"></textarea></div>
                </div>

                <!-- WC Data -->
                <div id="fwcWcSection" style="display:none;">
                    <div class="fwc-section">
                        <div class="fwc-section-title">${t('wcData')}</div>
                        <div class="fwc-field"><label class="required">${t('lblHA')}</label><input type="text" class="fwc-input" id="wc_ha" placeholder="Ej: HA898706" value="${haVal}"></div>
                        <div class="fwc-field"><label class="required">${t('lblUnits')}</label><input type="number" class="fwc-input" id="wc_units" min="1" max="50" placeholder="WE" onchange="window.fwcUpdateWePhotos()"></div>
                        <div class="fwc-field"><label class="required">${t('lblVariant')}</label>
                            <select class="fwc-input" id="wc_variant" onchange="window.fwcUpdateWePhotos()">
                                <option value="">Seleccionar...</option>
                                <option value="empty-pipes">${t('varEmpty')}</option>
                                <option value="interior-riser">${t('varInterior')}</option>
                                <option value="corridor-riser">${t('varCorridor')}</option>
                                <option value="exterior-riser">${t('varExterior')}</option>
                                <option value="mixed">${t('varMixed')}</option>
                            </select>
                        </div>
                        <div class="fwc-field"><label class="required">AP instalada?</label>
                            <div style="display:flex;gap:12px;">
                                <label class="fwc-radio-label" id="fwcApNo"><input type="radio" name="wc_ap" value="no" checked onchange="window.fwcHandleApChange()"> No</label>
                                <label class="fwc-radio-label" id="fwcApYes"><input type="radio" name="wc_ap" value="yes" onchange="window.fwcHandleApChange()"> Sí</label>
                            </div>
                        </div>
                    </div>
                    <div id="fwcApSection" style="display:none;"></div>
                    <div id="fwcProtocols" style="display:none;"></div>
                    <div id="fwcChecklist" style="display:none;"></div>
                    <div id="fwcWcPhotos"></div>
                </div>

                <!-- Validation Score -->
                <div class="fwc-section" id="fwcValidationCard" style="display:none;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span style="font-size:15px;font-weight:700;color:var(--blue);">${t('valTitle')}</span>
                        <span id="fwcValScore" style="font-size:22px;font-weight:700;"></span>
                    </div>
                    <div id="fwcValItems" style="font-size:13px;font-family:monospace;"></div>
                </div>

                <!-- Evidence -->
                <div id="fwcEvidenceSection" style="display:none;"></div>
            </form>
        </div>`;
    }

    function getSupportOptions() {
        const current = state.currentTeam;
        const teams = state.teamConfig.length > 0 ? state.teamConfig : Object.values(state.teams);
        return teams.filter(t => t.name !== current.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    }

    function attachFormEvents() {
        ['wc_ha','wc_units','wc_variant','wc_startTime','wc_endTime','wc_date','wc_comments','wc_workStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.addEventListener('input', renderValidation); el.addEventListener('change', renderValidation); }
        });
    }

    window.fwcHandleStatusChange = function() {
        const status = document.getElementById('wc_workStatus')?.value;
        const isCompleted = status === 'completed';
        const needsEvidence = ['second-visit','no-install'].includes(status);

        // Show WC section
        const wcs = document.getElementById('fwcWcSection');
        if (wcs) wcs.style.display = 'block';

        // Protocols
        const protDiv = document.getElementById('fwcProtocols');
        if (protDiv) {
            if (isCompleted) {
                protDiv.style.display = 'block';
                protDiv.innerHTML = `<div class="fwc-section">
                    <div class="fwc-section-title">${t('protocols')}</div>
                    <div class="fwc-checklist">
                        ${['Auskundungsprotokoll','Installationsprotokoll','Messprotokoll','Farbcodierungsprotokoll'].map((p,i) =>
                            `<label class="fwc-check-item"><input type="checkbox" id="wc_prot_${i}" onchange="window.fwcRenderValidation()"> <strong>${p}</strong></label>`
                        ).join('')}
                    </div>
                    <div style="margin-top:12px;">${cpf('protocol_inst','Installationsprotokoll (foto/PDF)',true)}</div>
                </div>`;
            } else { protDiv.style.display = 'none'; protDiv.innerHTML = ''; }
        }

        // Checklist
        const chkDiv = document.getElementById('fwcChecklist');
        if (chkDiv) {
            if (isCompleted) { chkDiv.style.display = 'block'; renderChecklist(); }
            else { chkDiv.style.display = 'none'; chkDiv.innerHTML = ''; }
        }

        // Evidence
        const evDiv = document.getElementById('fwcEvidenceSection');
        if (evDiv) {
            if (needsEvidence) {
                evDiv.style.display = 'block';
                evDiv.innerHTML = `<div class="fwc-section">
                    <div class="fwc-section-title">${t('evidenceTitle')}</div>
                    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${t('evidenceHint')}</p>
                    ${cpf('evidence_1', t('evidencePhoto'), true)}
                    ${cpf('evidence_2', t('evidenceExtra'), false)}
                </div>`;
            } else { evDiv.style.display = 'none'; evDiv.innerHTML = ''; }
        }

        // Comments required label
        const cl = document.getElementById('fwcCommentsLabel');
        if (cl) cl.className = needsEvidence ? 'required' : '';

        window.fwcUpdateWePhotos();
        renderValidation();
    };

    window.fwcHandleApChange = function() {
        const isYes = document.querySelector('input[name="wc_ap"][value="yes"]')?.checked;
        const section = document.getElementById('fwcApSection');
        if (section) {
            if (isYes) {
                section.style.display = 'block';
                section.innerHTML = `<div class="fwc-section">
                    <div class="fwc-section-title">Fotos AP Instalada</div>
                    ${cpf('ap_foto','Foto de la AP instalada',true)}
                    ${cpf('ap_mediciones','Mediciones de potencia en la AP',true)}
                </div>`;
            } else { section.style.display = 'none'; section.innerHTML = ''; }
        }
    };

    window.fwcUpdateWePhotos = function() {
        const status = document.getElementById('wc_workStatus')?.value;
        const container = document.getElementById('fwcWcPhotos');
        if (!container) return;
        if (status !== 'completed') { container.innerHTML = ''; return; }

        const numWe = parseInt(document.getElementById('wc_units')?.value) || 0;
        const variant = document.getElementById('wc_variant')?.value || '';
        const isMixed = variant === 'mixed';
        let html = '';

        // Basement
        html += `<div class="fwc-section"><div class="fwc-section-title">${t('fotosSotano')} <span class="fwc-counter" id="fwcBasementCtr">0/${WC_BASEMENT.filter(p=>p.req).length}</span></div>`;
        WC_BASEMENT.forEach(p => { html += cpf(p.id, p.label, p.req); });
        html += '</div>';

        // Per WE
        if (numWe > 0) {
            html += `<div class="fwc-section"><div class="fwc-section-title">${t('fotosVivienda')} (${numWe} WE)</div>`;
            html += '<div class="fwc-we-tabs">';
            for (let i = 1; i <= numWe; i++) html += `<button class="fwc-we-tab ${i===1?'active':''}" onclick="window.fwcSwitchWeTab(${i})">WE-${String(i).padStart(2,'0')}</button>`;
            html += '</div>';
            for (let i = 1; i <= numWe; i++) {
                const weId = 'we' + String(i).padStart(2,'0');
                html += `<div class="fwc-we-panel ${i===1?'active':''}" id="fwcPanel_${weId}">`;
                html += `<div style="font-weight:600;color:var(--blue);margin-bottom:8px;">WE-${String(i).padStart(2,'0')} <span class="fwc-counter" id="fwcCtr_${weId}">0/0</span></div>`;
                if (isMixed) {
                    html += `<select class="fwc-input" id="${weId}_variant" onchange="window.fwcHandleWePresence('${weId}')" style="margin-bottom:8px;">
                        <option value="">${t('lblWeVariant')}...</option>
                        <option value="empty-pipes">${t('varEmpty')}</option><option value="interior-riser">${t('varInterior')}</option>
                        <option value="corridor-riser">${t('varCorridor')}</option><option value="exterior-riser">${t('varExterior')}</option>
                    </select>`;
                }
                html += `<div style="display:flex;gap:8px;margin-bottom:8px;">
                    <input type="text" class="fwc-input" id="${weId}_nomenclature" placeholder="A.000.00${i}" maxlength="9" style="flex:0 0 130px;font-family:monospace;">
                    <input type="text" class="fwc-input" id="${weId}_clientname" placeholder="Nombre Cliente">
                </div>`;
                html += `<div style="display:flex;gap:8px;margin-bottom:8px;">
                    <label class="fwc-radio-label" id="${weId}_presentLabel"><input type="radio" name="${weId}_presence" value="present" checked onchange="window.fwcHandleWePresence('${weId}')"> ${t('lblWePresent')}</label>
                    <label class="fwc-radio-label" id="${weId}_absentLabel"><input type="radio" name="${weId}_presence" value="absent" onchange="window.fwcHandleWePresence('${weId}')"> ${t('lblWeAbsent')}</label>
                </div>`;
                html += `<div id="${weId}_photos"></div>`;
                html += '</div>';
            }
            html += '</div>';
        }

        // Exterior
        html += '<div id="fwcExteriorContainer"></div>';
        container.innerHTML = html;

        // Init WE photos
        for (let i = 1; i <= numWe; i++) window.fwcHandleWePresence('we' + String(i).padStart(2,'0'));
        updateExteriorPhotos();
        if (document.getElementById('fwcChecklist')?.style.display !== 'none') renderChecklist();
        updateCounters();
    };

    window.fwcHandleWePresence = function(weId) {
        const isPresent = document.querySelector(`input[name="${weId}_presence"][value="present"]`)?.checked;
        const variant = getWeVariant(weId);
        const container = document.getElementById(weId + '_photos');
        if (!container) return;

        let html = '';
        if (isPresent) {
            html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-style:italic;">${t('wePresentHint')}</div>`;
            getWePhotosForVariant(variant).forEach(p => { html += cpf(`${weId}_${p.suffix}`, p.label, p.req); });
        } else {
            html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-style:italic;">${t('weAbsentHint')}</div>`;
            WC_WE_ABSENT_PHOTOS.forEach(p => { html += cpf(`${weId}_${p.suffix}`, p.label, p.req); });
        }
        container.innerHTML = html;
        updateExteriorPhotos();
        updateCounters();
        renderValidation();
    };

    function updateExteriorPhotos() {
        const extC = document.getElementById('fwcExteriorContainer');
        if (!extC) return;
        const usedVars = getUsedVariants();
        const allExt = []; const seen = new Set();
        usedVars.forEach(v => { getExteriorPhotos(v).forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); allExt.push(p); } }); });
        if (allExt.length === 0) { extC.innerHTML = ''; return; }
        let html = `<div class="fwc-section"><div class="fwc-section-title">${t('fotosExterior')} <span class="fwc-counter" id="fwcExtCtr">0/${allExt.filter(p=>p.req).length}</span></div>`;
        allExt.forEach(p => { html += cpf(p.id, p.label, p.req); });
        html += '</div>';
        extC.innerHTML = html;
    }

    window.fwcSwitchWeTab = function(num) {
        document.querySelectorAll('.fwc-we-tab').forEach((t,i) => t.classList.toggle('active', i === num-1));
        document.querySelectorAll('.fwc-we-panel').forEach((p,i) => p.classList.toggle('active', i === num-1));
    };

    function renderChecklist() {
        const div = document.getElementById('fwcChecklist');
        if (!div) return;
        const items = getActiveChecklist();
        const wasChecked = {};
        items.forEach(i => { const el = document.getElementById(i.id); if (el) wasChecked[i.id] = el.checked; });
        div.innerHTML = `<div class="fwc-section"><div class="fwc-section-title">${t('checklistTitle')} <span class="fwc-counter" id="fwcCheckCtr">0/${items.length}</span></div>
            <div class="fwc-checklist">${items.map(i =>
                `<label class="fwc-check-item" style="background:${i.bg};border-left:3px solid ${i.border};">
                    <input type="checkbox" id="${i.id}" ${wasChecked[i.id]?'checked':''} onchange="window.fwcUpdateCheckCtr();window.fwcRenderValidation();">
                    <div><strong>${t(i.titleKey)}</strong><br><span style="font-size:12px;color:var(--text-secondary);">${t(i.descKey)}</span></div>
                </label>`
            ).join('')}
            </div></div>`;
        window.fwcUpdateCheckCtr();
    }

    window.fwcUpdateCheckCtr = function() {
        const ids = getActiveCheckIds();
        const checked = ids.filter(id => document.getElementById(id)?.checked).length;
        const el = document.getElementById('fwcCheckCtr');
        if (el) { el.textContent = `${checked}/${ids.length}`; el.className = 'fwc-counter' + (checked === ids.length ? ' complete' : ''); }
    };

    function updateCounters() {
        // Basement
        const bc = document.getElementById('fwcBasementCtr');
        if (bc) { const req = WC_BASEMENT.filter(p=>p.req); const filled = req.filter(p=>hasPhoto(p.id)).length; bc.textContent = `${filled}/${req.length}`; bc.className = 'fwc-counter' + (filled===req.length?' complete':''); }

        // Exterior
        const usedVars = getUsedVariants(); const allExt = []; const seen = new Set();
        usedVars.forEach(v => { getExteriorPhotos(v).forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); allExt.push(p); } }); });
        const ec = document.getElementById('fwcExtCtr');
        if (ec) { const req = allExt.filter(p=>p.req); const filled = req.filter(p=>hasPhoto(p.id)).length; ec.textContent = `${filled}/${req.length}`; ec.className = 'fwc-counter' + (filled===req.length?' complete':''); }

        // Per-WE
        const numWe = parseInt(document.getElementById('wc_units')?.value) || 0;
        for (let i = 1; i <= numWe; i++) {
            const weId = 'we' + String(i).padStart(2,'0');
            const weVar = getWeVariant(weId);
            const isPresent = document.querySelector(`input[name="${weId}_presence"][value="present"]`)?.checked !== false;
            const photoSet = isPresent ? getWePhotosForVariant(weVar) : WC_WE_ABSENT_PHOTOS;
            const reqPhotos = photoSet.filter(p => p.req);
            const filled = reqPhotos.filter(p => hasPhoto(`${weId}_${p.suffix}`)).length;
            const hasNom = !!(document.getElementById(weId + '_nomenclature')?.value?.trim());
            const hasClient = !!(document.getElementById(weId + '_clientname')?.value?.trim());
            const totalReq = reqPhotos.length + 2;
            const totalFilled = filled + (hasNom?1:0) + (hasClient?1:0);
            const cEl = document.getElementById('fwcCtr_' + weId);
            if (cEl) { cEl.textContent = `${totalFilled}/${totalReq}`; cEl.className = 'fwc-counter' + (totalFilled===totalReq?' complete':''); }
        }
    }

    // ── VALIDATION SCORE ──
    function computeValidationScore() {
        const status = document.getElementById('wc_workStatus')?.value;
        if (status !== 'completed') return null;
        const results = { items:[], totalPoints:0, earnedPoints:0 };
        const ha = (document.getElementById('wc_ha')?.value||'').trim();
        const startTime = document.getElementById('wc_startTime')?.value;
        const endTime = document.getElementById('wc_endTime')?.value;
        const dateVal = document.getElementById('wc_date')?.value;
        const units = document.getElementById('wc_units')?.value;
        const variant = document.getElementById('wc_variant')?.value;
        const comments = (document.getElementById('wc_comments')?.value||'').trim();

        // Basic (20)
        const bf = [ha,startTime,endTime,dateVal,units,variant];
        const bfilled = bf.filter(v=>v).length;
        const bok = bfilled === bf.length;
        results.totalPoints += 20; results.earnedPoints += bok ? 20 : Math.round(20*bfilled/bf.length);
        results.items.push({ label:t('valBasicData'), ok:bok, detail:bok?`✅ ${t('valComplete')}`:`❌ ${t('valIncomplete')} (${bfilled}/${bf.length})`, cls:bok?'v-ok':'v-fail' });

        // HA format (5)
        const haOk = /^HA\d+$/i.test(ha);
        results.totalPoints += 5; results.earnedPoints += haOk ? 5 : (ha?2:0);
        results.items.push({ label:t('valHaFormat'), ok:haOk, detail:haOk?'✅ OK':(ha?'⚠️ '+t('valHaFormatHint'):'❌'), cls:haOk?'v-ok':(ha?'v-warn':'v-fail') });

        // Photos (30)
        const numWe = parseInt(units) || 0;
        const expBase = WC_BASEMENT.filter(p=>p.req).length;
        let expWe = 0, actWe = 0;
        for (let i = 1; i <= numWe; i++) {
            const weId = 'we' + String(i).padStart(2,'0');
            const weVar = getWeVariant(weId);
            const isP = document.querySelector(`input[name="${weId}_presence"][value="present"]`)?.checked !== false;
            const pset = isP ? getWePhotosForVariant(weVar) : WC_WE_ABSENT_PHOTOS;
            const rp = pset.filter(p=>p.req); expWe += rp.length; actWe += rp.filter(p=>hasPhoto(`${weId}_${p.suffix}`)).length;
        }
        const usedV = getUsedVariants(); const allExt = []; const seenE = new Set();
        usedV.forEach(v => { getExteriorPhotos(v).forEach(p => { if (!seenE.has(p.id)) { seenE.add(p.id); allExt.push(p); } }); });
        const expExt = allExt.filter(p=>p.req).length; const actExt = allExt.filter(p=>p.req&&hasPhoto(p.id)).length;
        const expTotal = expBase + expWe + expExt;
        const actBase = WC_BASEMENT.filter(p=>hasPhoto(p.id)).length;
        const actTotal = actBase + actWe + actExt;
        const photoRatio = expTotal > 0 ? Math.min(actTotal/expTotal,1) : 1;
        results.totalPoints += 30;
        let badCount = 0;
        Object.values(window.PhotoUtils.getPhotoQuality(CTX)).forEach(arr => { if(arr) arr.forEach(q => { if(q && q.warnings && q.warnings.length > 0) badCount++; }); });
        const photoPoints = Math.max(0, Math.round(30*photoRatio) - Math.min(badCount*5,30));
        results.earnedPoints += photoPoints;
        const pOk = actTotal >= expTotal && badCount === 0;
        let pDetail = pOk ? `✅ ${actTotal}/${expTotal}` : `⚠️ ${actTotal}/${expTotal}`;
        if (actTotal < expTotal) pDetail += ` (${t('valMissing')} ${expTotal-actTotal})`;
        results.items.push({ label:t('valPhotos'), ok:pOk, detail:pDetail, cls:pOk?'v-ok':'v-warn' });

        // Checklist (25)
        const ckIds = getActiveCheckIds();
        const ckChecked = ckIds.filter(id => document.getElementById(id)?.checked).length;
        const ckOk = ckChecked === ckIds.length;
        const ckR = ckIds.length > 0 ? ckChecked/ckIds.length : 1;
        results.totalPoints += 25; results.earnedPoints += Math.round(25*ckR);
        results.items.push({ label:t('valChecklist'), ok:ckOk, detail:`${ckOk?'✅':'⚠️'} ${ckChecked}/${ckIds.length}`, cls:ckOk?'v-ok':'v-warn' });

        // Protocols (10)
        const protsChecked = [0,1,2,3].filter(i => document.getElementById('wc_prot_'+i)?.checked).length;
        const prOk = protsChecked === 4;
        results.totalPoints += 10; results.earnedPoints += Math.round(10*protsChecked/4);
        results.items.push({ label:t('valProtocols'), ok:prOk, detail:`${prOk?'✅':'⚠️'} ${protsChecked}/4`, cls:prOk?'v-ok':'v-warn' });

        // Comments (10)
        const cmOk = comments.length > 0;
        results.totalPoints += 10; results.earnedPoints += cmOk?10:0;
        results.items.push({ label:t('valComments'), ok:cmOk, detail:cmOk?`✅ ${t('valIncluded')}`:`⚠️ ${t('valNotIncluded')}`, cls:cmOk?'v-ok':'v-warn' });

        results.score = results.totalPoints > 0 ? Math.round(100*results.earnedPoints/results.totalPoints) : 0;
        return results;
    }

    function renderValidation() {
        const card = document.getElementById('fwcValidationCard');
        const result = computeValidationScore();
        if (!result) { if (card) card.style.display = 'none'; return; }
        if (card) card.style.display = 'block';
        const scoreEl = document.getElementById('fwcValScore');
        const itemsEl = document.getElementById('fwcValItems');
        const s = result.score;
        const emoji = s >= 90 ? '🟢' : s >= 70 ? '🟡' : '🔴';
        const color = s >= 90 ? 'var(--green)' : s >= 70 ? 'var(--orange)' : 'var(--red)';
        if (scoreEl) { scoreEl.textContent = `${emoji} ${s}%`; scoreEl.style.color = color; }
        if (itemsEl) itemsEl.innerHTML = result.items.map((item,i) => {
            const sym = i === result.items.length-1 ? '└' : '├';
            const c = item.cls === 'v-ok' ? 'var(--green)' : item.cls === 'v-warn' ? 'var(--orange)' : 'var(--red)';
            return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
                <span style="color:var(--text-secondary);">${sym} ${item.label}</span><span style="font-weight:600;color:${c};">${item.detail}</span></div>`;
        }).join('');
    }
    window.fwcRenderValidation = renderValidation;

    // ── SUBMIT ──
    function validate() {
        const status = document.getElementById('wc_workStatus')?.value;
        const start = document.getElementById('wc_startTime')?.value;
        const end = document.getElementById('wc_endTime')?.value;
        const comments = document.getElementById('wc_comments')?.value;
        if (!status || !start || !end || !document.getElementById('wc_date')?.value) { showAlert(t('fillRequired'),'error'); return false; }
        if (start >= end) { showAlert(t('timeError'),'error'); return false; }
        const needsEvidence = ['second-visit','no-install'].includes(status);
        if (needsEvidence && !comments?.trim()) { showAlert(t('needComments'),'error'); return false; }
        if (needsEvidence && !hasPhoto('evidence_1')) { showAlert(t('needEvidence'),'error'); return false; }
        const ha = document.getElementById('wc_ha')?.value;
        const units = document.getElementById('wc_units')?.value;
        const variant = document.getElementById('wc_variant')?.value;
        if (!ha || !units || !variant) { showAlert(t('needHA'),'error'); return false; }
        if (document.querySelector('input[name="wc_ap"][value="yes"]')?.checked) {
            if (!hasPhoto('ap_foto')) { showAlert(t('needApPhoto'),'error'); return false; }
            if (!hasPhoto('ap_mediciones')) { showAlert(t('needApMediciones'),'error'); return false; }
        }
        if (status === 'completed') {
            const numWe = parseInt(units) || 0;
            const isMixed = variant === 'mixed';
            for (let i = 1; i <= numWe; i++) {
                const weId = 'we' + String(i).padStart(2,'0');
                const weNum = String(i).padStart(2,'0');
                if (isMixed && !getWeVariant(weId)) { showAlert(t('needWeVariant').replace('{we}',weNum),'error'); return false; }
                if (!document.getElementById(weId+'_nomenclature')?.value?.trim()) { showAlert(t('needWeNomenclature').replace('{we}',weNum),'error'); return false; }
                if (!document.getElementById(weId+'_clientname')?.value?.trim()) { showAlert(t('needWeClientName').replace('{we}',weNum),'error'); return false; }
                const isP = document.querySelector(`input[name="${weId}_presence"][value="present"]`)?.checked;
                if (!isP && !hasPhoto(weId+'_ont_sotano')) { showAlert(t('needWeAbsentOnt').replace('{we}',weNum),'error'); return false; }
            }
        }
        return true;
    }

    function collectFormData() {
        const numWe = parseInt(document.getElementById('wc_units')?.value) || 0;
        const weData = [];
        for (let i = 1; i <= numWe; i++) {
            const weId = 'we' + String(i).padStart(2,'0');
            weData.push({
                we: weId, variant: getWeVariant(weId),
                nomenclature: document.getElementById(weId+'_nomenclature')?.value?.trim()||'',
                clientName: document.getElementById(weId+'_clientname')?.value?.trim()||'',
                presence: document.querySelector(`input[name="${weId}_presence"][value="present"]`)?.checked ? 'present' : 'absent',
            });
        }
        const data = {
            timestamp: new Date().toISOString(),
            team: state.currentTeam?.name||'', technician: state.currentTechnician||'', client:'westconnect',
            date: document.getElementById('wc_date')?.value,
            startTime: document.getElementById('wc_startTime')?.value,
            endTime: document.getElementById('wc_endTime')?.value,
            workStatus: document.getElementById('wc_workStatus')?.value,
            comments: document.getElementById('wc_comments')?.value,
            supportTeam: document.getElementById('wc_supportTeam')?.value,
            ha: document.getElementById('wc_ha')?.value,
            units: document.getElementById('wc_units')?.value,
            variant: document.getElementById('wc_variant')?.value,
            protocols: [0,1,2,3].filter(i => document.getElementById('wc_prot_'+i)?.checked),
            ne4Checklist: getActiveCheckIds().filter(id => document.getElementById(id)?.checked),
            apInstalled: document.querySelector('input[name="wc_ap"][value="yes"]')?.checked ? 'yes' : 'no',
            photos: window.PhotoUtils.getPhotos(CTX), weData
        };
        const vr = computeValidationScore();
        if (vr) { data.validation_score = vr.score; data.validation_details = vr.items.map(i => `${i.label}: ${i.detail}`).join(' | '); }
        return data;
    }

    window.fwcHandleSubmit = async function() {
        if (!validate()) return;
        const vr = computeValidationScore();
        if (vr && vr.score < 90) {
            if (!confirm(`${t('valLowScoreTitle')} (${vr.score}%)\n${t('valLowScoreMsg').replace('{score}',vr.score)}`)) return;
        }
        const formData = collectFormData();
        const btn = document.getElementById('fwcSubmitBtn');
        if (btn) { btn.disabled = true; btn.textContent = t('sending'); }
        try {
            if (navigator.onLine) {
                await fetch(SCRIPT_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
                if (state.selectedCita?.id) {
                    const sm = { 'completed':'finalizada_ok', 'second-visit':'recitar', 'no-install':'finalizada_no_ok' };
                    updateCitaStatus(state.selectedCita.id, sm[formData.workStatus]||'finalizada_ok', formData.comments);
                    state.selectedCita = null;
                }
            }
            state.submissions.push(formData);
            window.toast('✅ ' + t('successTitle'), 'success');
            window.PhotoUtils.clearContext(CTX);
            state.screen = 'citas'; renderScreen();
        } catch(e) {
            formData.pendingSync = true; state.submissions.push(formData);
            window.toast(t('connError'), 'warning');
        }
        if (btn) { btn.disabled = false; btn.textContent = t('sendBtn'); }
    };

    // ── HISTORY ──
    function renderHistoryScreen() {
        const items = state.submissions.length === 0 ? `<div style="text-align:center;padding:40px;color:var(--text-secondary);">${t('histEmpty')}</div>` :
            state.submissions.map(s => `<div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;margin-bottom:8px;"><div style="font-weight:600;">${s.ha||'—'}</div><div style="font-size:13px;color:var(--text-secondary);">${s.startTime} - ${s.endTime} | ${s.workStatus}</div></div>`).join('');
        return `<div style="padding:16px 0;"><h2 style="font-size:18px;margin-bottom:16px;">${t('histTitle')}</h2>${items}
            <button class="fwc-skip-btn" onclick="window.fwcGoBack()">${t('histBack')}</button></div>`;
    }

    window.fwcShowHistory = function() { state.screen = 'history'; renderScreen(); };
    window.fwcGoBack = function() {
        if (state.screen === 'form' || state.screen === 'history') { state.screen = 'citas'; renderScreen(); }
        else { window.navigate('hub'); }
    };
    window.fwcSetLang = function(lang) {
        state.lang = lang;
        document.querySelectorAll('.fwc-lang-btn').forEach(b => b.classList.toggle('active', b.textContent.trim() === lang.toUpperCase()));
        renderScreen();
    };

    // ── CONFIG ──
    async function loadConfig() {
        try {
            const resp = await fetch(SCRIPT_URL + '?action=getConfig');
            const data = await resp.json();
            if (data.teams && data.teams.length > 0) {
                state.teams = {}; state.teamConfig = data.teams.filter(t => (t.client||'').toLowerCase().includes('westconnect'));
                data.teams.forEach(team => {
                    if (!(team.client||'').toLowerCase().includes('westconnect')) return;
                    state.teams[team.pin] = { name:team.name, client:'westconnect', members:team.members||[] };
                });
                state.configLoaded = true;
                if (Object.keys(state.teams).length === 0) fallbackTeams();
            } else fallbackTeams();
        } catch(e) { fallbackTeams(); }
    }

    function fallbackTeams() {
        state.teams = {
            '2345': { name:'West-001', client:'westconnect', members:['Alejandro Herrera','Alexander Herrera'] },
            '3456': { name:'West-002', client:'westconnect', members:['Juan Correa','Eddier Aldana'] },
            '4567': { name:'West-003', client:'westconnect', members:['Jaime Guzman'] },
            '5678': { name:'West-004', client:'westconnect', members:['Michel Matos'] },
        };
        state.configLoaded = true;
    }

    // ── UI HELPERS ──
    function showAlert(msg, type) {
        const c = document.getElementById('fwcAlertContainer');
        if (!c) { window.toast(msg, type); return; }
        const el = document.createElement('div');
        el.className = `fwc-alert fwc-alert-${type}`;
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }

    function updateConnection() {
        const dot = document.getElementById('fwcConnDot');
        const txt = document.getElementById('fwcConnText');
        if (dot) dot.classList.toggle('offline', !navigator.onLine);
        if (txt) txt.textContent = navigator.onLine ? t('online') : t('offline');
    }

    // ── CSS ──
    function getCSS() {
        return `<style>
        .fwc-app { max-width:600px; margin:0 auto; }
        .fwc-topbar { background:var(--bg-secondary); border-bottom:1px solid var(--border); padding:12px 16px; display:flex; align-items:center; justify-content:space-between; border-radius:12px 12px 0 0; margin-bottom:16px; }
        .fwc-back-btn { background:none; border:none; color:var(--blue); font-size:20px; cursor:pointer; padding:4px 8px; }
        .fwc-status { display:flex; gap:8px; align-items:center; font-size:13px; color:var(--text-secondary); }
        .fwc-conn-dot { width:10px; height:10px; border-radius:50%; background:var(--green); }
        .fwc-conn-dot.offline { background:var(--orange); }
        .fwc-lang-toggle { display:flex; gap:4px; }
        .fwc-lang-btn { background:var(--bg-tertiary); border:1px solid var(--border); color:var(--text-secondary); padding:4px 10px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer; }
        .fwc-lang-btn.active { background:var(--blue); color:white; border-color:var(--blue); }
        .fwc-content { padding:0 4px; }
        .fwc-pin-screen { display:flex; flex-direction:column; align-items:center; gap:16px; padding-top:20px; }
        .fwc-logo { width:50px; height:50px; margin:0 auto 8px; background:linear-gradient(135deg,var(--blue),#0066cc); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; font-size:24px; font-weight:bold; }
        .fwc-logo-title { font-size:20px; font-weight:700; text-align:center; }
        .fwc-logo-sub { font-size:12px; color:var(--text-secondary); text-align:center; }
        .fwc-pin-label { font-size:14px; color:var(--text-secondary); text-align:center; }
        .fwc-pin-digits { display:flex; gap:12px; justify-content:center; margin:8px 0; }
        .fwc-pin-digit { width:48px; height:56px; display:flex; align-items:center; justify-content:center; font-size:24px; border:2px solid var(--border); border-radius:8px; background:var(--bg-secondary); color:var(--text-primary); }
        .fwc-pin-digit.filled { border-color:var(--blue); background:var(--bg-tertiary); }
        .fwc-keypad { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; max-width:280px; margin:0 auto; }
        .fwc-key { height:56px; font-size:22px; font-weight:600; border:1px solid var(--border); border-radius:8px; background:var(--bg-secondary); color:var(--text-primary); cursor:pointer; }
        .fwc-key:active { background:var(--bg-tertiary); }
        .fwc-member-screen { text-align:center; padding-top:40px; }
        .fwc-member-list { display:flex; flex-direction:column; gap:10px; max-width:320px; margin:16px auto 0; }
        .fwc-member-btn { width:100%; padding:14px; background:var(--bg-secondary); border:2px solid var(--border); border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; color:var(--text-primary); }
        .fwc-member-btn:hover { border-color:var(--blue); }
        .fwc-citas-screen { padding:0 4px; }
        .fwc-citas-header { background:linear-gradient(135deg,var(--blue),#0066cc); color:white; border-radius:12px; padding:16px; margin-bottom:16px; }
        .fwc-citas-tab { flex:1; padding:10px; border:none; border-radius:8px; font-weight:600; cursor:pointer; background:var(--bg-tertiary); color:var(--text-secondary); font-size:14px; }
        .fwc-citas-tab.active { background:var(--blue); color:white; }
        .fwc-cita-card { background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:12px; }
        .fwc-cita-card.status-asignada { border-left:4px solid var(--blue); }
        .fwc-cita-card.status-capturada { border-left:4px solid var(--orange); }
        .fwc-cita-card.status-en_trabajo { border-left:4px solid var(--green); }
        .fwc-cita-badge { font-size:11px; font-weight:700; border-radius:20px; padding:3px 10px; text-transform:uppercase; }
        .badge-asignada { background:var(--blue-dim); color:var(--blue); }
        .badge-capturada { background:var(--orange-dim); color:var(--orange); }
        .badge-en_trabajo { background:var(--green-dim); color:var(--green); }
        .badge-finalizada_ok { background:var(--green-dim); color:var(--green); }
        .badge-finalizada_no_ok { background:var(--red-dim); color:var(--red); }
        .badge-cliente_ausente { background:var(--orange-dim); color:var(--orange); }
        .badge-recitar { background:rgba(191,90,242,0.12); color:var(--purple); }
        .badge-paralizada { background:rgba(255,255,255,0.06); color:var(--text-secondary); }
        .fwc-cita-actions { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
        .fwc-cita-btn { flex:1; min-width:100px; padding:10px 12px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; text-align:center; text-decoration:none; }
        .fwc-cita-btn.primary { background:var(--blue); color:white; }
        .fwc-cita-btn.success { background:var(--green); color:white; }
        .fwc-cita-btn.doc { background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border); }
        .fwc-skip-btn { width:100%; padding:14px; margin-top:8px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; font-size:15px; cursor:pointer; color:var(--text-secondary); }
        .fwc-bottom-actions { display:flex; gap:12px; padding:12px 0; }
        .fwc-fab { flex:1; padding:14px; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; min-height:48px; }
        .fwc-fab-primary { background:var(--blue); color:white; }
        .fwc-fab-secondary { background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border); }
        .fwc-form-screen { padding:0 4px; }
        .fwc-progress { height:4px; background:var(--bg-tertiary); border-radius:2px; margin-bottom:12px; overflow:hidden; }
        .fwc-progress-fill { height:100%; background:var(--blue); transition:width 0.3s; }
        .fwc-section { background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin-bottom:12px; }
        .fwc-section-title { font-size:15px; font-weight:700; color:var(--blue); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; }
        .fwc-field { margin-bottom:12px; }
        .fwc-field label { display:block; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; }
        .fwc-field label.required::after { content:' *'; color:var(--red); }
        .fwc-field-display { padding:10px 12px; background:var(--bg-tertiary); border-radius:6px; font-weight:600; color:var(--text-primary); border:1px solid var(--border); }
        .fwc-input { width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-size:15px; background:var(--bg-tertiary); color:var(--text-primary); -webkit-appearance:none; }
        .fwc-input:focus { outline:none; border-color:var(--blue); }
        .fwc-radio-label { display:flex; align-items:center; gap:6px; padding:10px 20px; border:2px solid var(--border); border-radius:8px; cursor:pointer; font-weight:600; font-size:15px; color:var(--text-primary); }
        .fwc-radio-label input { width:18px; height:18px; accent-color:var(--blue); }
        .fwc-counter { font-size:12px; font-weight:600; padding:2px 8px; border-radius:10px; background:var(--bg-tertiary); color:var(--text-secondary); }
        .fwc-counter.complete { background:var(--green-dim); color:var(--green); }
        .fwc-we-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
        .fwc-we-tab { padding:6px 14px; border:2px solid var(--border); border-radius:20px; font-size:13px; font-weight:600; cursor:pointer; background:var(--bg-secondary); color:var(--text-secondary); }
        .fwc-we-tab.active { border-color:var(--blue); color:var(--blue); }
        .fwc-we-panel { display:none; }
        .fwc-we-panel.active { display:block; }
        .fwc-checklist { display:flex; flex-direction:column; gap:8px; }
        .fwc-check-item { display:flex; align-items:flex-start; gap:10px; padding:10px; border-radius:6px; cursor:pointer; }
        .fwc-check-item input[type="checkbox"] { width:20px; height:20px; margin-top:2px; accent-color:var(--green); flex-shrink:0; }
        .fwc-alert { padding:12px 16px; border-radius:6px; margin-bottom:8px; font-size:13px; }
        .fwc-alert-error { background:var(--red-dim); color:var(--red); border:1px solid rgba(255,69,58,0.3); }
        .fwc-alert-warning { background:var(--orange-dim); color:var(--orange); }
        .fwc-alert-success { background:var(--green-dim); color:var(--green); }
        /* Photo styles */
        .fr-photo-section { margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border); }
        .fr-photo-section:last-child { border-bottom:none; }
        .fr-photo-label { font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block; }
        .fr-photo-label.required::after { content:' *'; color:var(--red); }
        .fr-photo-label.optional::after { content:' (opcional)'; color:var(--text-secondary); font-weight:400; font-size:11px; }
        .fr-upload-btn { display:inline-flex; align-items:center; gap:4px; padding:8px 16px; background:var(--bg-tertiary); border:1px dashed var(--border-light); border-radius:6px; font-size:13px; cursor:pointer; min-height:44px; color:var(--text-primary); }
        .fr-upload-btn:active { background:var(--bg-hover); }
        .fr-photo-file-input { display:none; }
        .fr-photo-preview-container { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
        .fr-photo-preview { position:relative; width:64px; height:64px; border-radius:6px; overflow:hidden; border:1px solid var(--border); }
        .fr-photo-preview img { width:100%; height:100%; object-fit:cover; }
        .fr-photo-preview.fr-photo-warn { border:2px solid var(--orange); }
        .fr-photo-warning { position:absolute; bottom:0; left:0; right:0; background:rgba(255,159,10,0.85); color:white; font-size:9px; font-weight:600; text-align:center; padding:2px; }
        .fr-photo-remove { position:absolute; top:2px; right:2px; width:20px; height:20px; background:var(--red); color:white; border:none; border-radius:50%; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        </style>`;
    }
})();
