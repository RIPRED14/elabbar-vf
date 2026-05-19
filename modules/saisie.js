/* ============================================
   SAISIE — Formulaire de saisie journalière
   ============================================ */
const Saisie = {
  editingId: null,
  currentActivite: 'reconditionnement',
  viewType: 'month',
  selectedDay: new Date().toISOString().split('T')[0],
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  selectedQuarter: Math.floor(new Date().getMonth() / 3) + 1,
  phasesList: ['Triage-Lavage','Lavage','Triage','Glasurage','Nettoyage','Cuisson','Emballage','RECEPTION','EVISCERATION ET ETETAGE','Evisceration','Decorticage','Mélançage','Trempage','Congélation','Congelation','DECONGELATION','Décongélation'],

  emballagesList: [
    { code: 'Cs', designation: 'N (Caisse)' },
    { code: 'MST1', designation: 'MOUSTIK 1' },
    { code: 'Kg', designation: 'Kg (Vrac)' },
    { code: 'N-CREVETTE', designation: 'N-CREVETTE BRAISE' },
    { code: 'CR17KG', designation: 'CR 17KG' },
    { code: 'CR1.7', designation: 'C CREVETTE' },
    { code: 'CS0.33', designation: 'CS POTON' },
    { code: 'CR19KG', designation: 'CR 19KG' },
    { code: 'C20S2000', designation: 'C20S2000' },
    { code: 'C20S1000', designation: 'C20S1000' },
    { code: 'C20S1500', designation: 'C20S1500' },
    { code: 'C15S1000', designation: 'C15S1000' },
    { code: 'C15S2000', designation: 'C15S2000' },
    { code: 'C15S1500', designation: 'C15S1500' },
    { code: 'C13S1000', designation: 'C13S1000' },
    { code: 'C13S1500', designation: 'C13S1500' },
    { code: 'C12S2000', designation: 'C12S2000' },
    { code: 'C12S1000', designation: 'C12S1000' },
  ],

  cartonMap: {
    'C12': { article: 'CARTON 12KG', prix: 11.64 },
    'C13': { article: 'CARTON 13KG', prix: 12.50 },
    'C15': { article: 'CARTON 15KG', prix: 14.00 },
    'C17': { article: 'CARTON 17KG', prix: 15.00 },
    'C19': { article: 'CARTON 19KG', prix: 16.50 },
    'C20': { article: 'CARTON 20KG', prix: 18.00 },
  },

  sachetMap: {
    'S1000': { article: 'SACHET 1KG NEUTRE', prix: 24.46 / 76 },
    'S1500': { article: 'SACHET 1.5KG NEUTRE', prix: 25 / 68 },
    'S2000': { article: 'SACHET 2KG', prix: 25 / 60 },
    'S1000IMP': { article: 'SACHET 1KG IMPRIMÉ', prix: 27.76 / 140 },
  },

  get intrantsMaster() {
    const list = [];
    if (App.data && App.data.consommables) {
      App.data.consommables.forEach(c => {
        let famille = 'DIVERS';
        const cat = (c.categorie || '').toUpperCase();
        const nom = (c.nom || '').toUpperCase();
        
        if (cat === 'SACHETS' || nom.includes('SACHET')) famille = 'SACHET';
        else if (cat === 'CONDITIONNEMENT' || cat === 'EMBALLAGE') {
          if (nom.includes('CARTON')) famille = 'CARTON';
          else if (nom.includes('ETIQUETTE')) famille = 'ETIQUETTE';
          else if (nom.includes('FILM') || nom.includes('SCOTCH') || nom.includes('PALETTE') || cat === 'EMBALLAGE') famille = 'EMBALLAGE';
          else famille = 'PLASTIQUE';
        }
        else if (cat === 'INTRANT' || cat === 'INTRANTS' || cat === 'ADDITIF' || cat === 'ADDITIFS' || nom.includes('AGRAFISH') || nom.includes('HYDROMAR') || nom.includes('SEL')) famille = 'INTRANT';
        else if (cat === 'AUTRES' || cat === 'DIVERS') {
          if (nom.includes('SAC') || nom.includes('FEUILLE')) famille = 'PLASTIQUE';
          else famille = 'DIVERS';
        }
        else if (cat === 'FOURNITURES') famille = 'FOURNITURES';
        else if (cat === 'EQUIPEMENT' || cat === 'EQUIPEMENTS') famille = 'EQUIPEMENT';
        else if (cat === 'SERVICE' || cat === 'SERVICES') famille = 'SERVICE';
        else famille = cat; // Fallback
        
        list.push({
          ref: c.id ? c.id.toString() : c.nom,
          article: c.nom,
          famille: famille,
          prix: c.prixUnitaire || 0
        });
      });
    }

    // Add required systemic services if they don't exist
    const systemics = [
      { ref: '00001', article: 'ELECTRICITE', famille: 'EAU-ELEC', prix: 0 },
      { ref: 'SC', article: 'AUTRES CHARGES', famille: 'DIVERS', prix: 0 }
    ];

    systemics.forEach(sys => {
      if (!list.find(i => i.ref === sys.ref || i.article === sys.article)) {
        list.push(sys);
      }
    });

    return list;
  },
  render() {
    let prod = this.viewType === 'day' 
      ? App.getDayProduction(this.selectedDay)
      : this.viewType === 'quarter'
      ? App.getQuarterProduction(this.selectedYear, this.selectedQuarter)
      : App.getMonthProduction(this.selectedYear, this.selectedMonth);

    prod = prod.filter(p => (p.activite||'reconditionnement') === this.currentActivite);
    const content = document.getElementById('pageContent');
    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px;">
          <div>
            <nav style="display:flex; gap:8px; margin-bottom:12px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
              <span>Production</span>
              <span>/</span>
              <span style="color:var(--accent-blue);">${this.currentActivite.charAt(0).toUpperCase() + this.currentActivite.slice(1)}</span>
            </nav>
            <h2 class="page-title">Saisie Journalière</h2>
            <p class="page-subtitle">Enregistrement et suivi des opérations de production en temps réel.</p>
          </div>
          <div style="display:flex; gap:12px; align-items:flex-end;">
            <div style="display:flex; background:var(--bg-card); padding:4px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:2px;">
              <button onclick="Saisie.onViewTypeChange('day')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'day' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'day' ? 'white' : 'var(--text-muted)'};">Jour</button>
              <button onclick="Saisie.onViewTypeChange('month')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'month' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'month' ? 'white' : 'var(--text-muted)'};">Mois</button>
              <button onclick="Saisie.onViewTypeChange('quarter')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'quarter' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'quarter' ? 'white' : 'var(--text-muted)'};">Trimestre</button>
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.72rem; margin-bottom:4px; opacity:0.8; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${this.viewType === 'day' ? 'Date' : 'Période'}</label>
              ${this.viewType === 'day' 
                ? `<input type="date" class="form-input" value="${this.selectedDay}" onchange="Saisie.onDayChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">`
                : this.viewType === 'month'
                ? `<input type="month" class="form-input" value="${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}" onchange="Saisie.onPeriodChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">`
                : `<div style="display:flex; gap:4px;">
                     <select class="form-select" onchange="Saisie.onQuarterChange(this.value, Saisie.selectedQuarter)" style="padding:8px; font-size:0.85rem; width:85px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">
                       ${[2024, 2025, 2026].map(y => `<option value="${y}" ${this.selectedYear===y?'selected':''}>${y}</option>`).join('')}
                     </select>
                     <select class="form-select" onchange="Saisie.onQuarterChange(Saisie.selectedYear, this.value)" style="padding:8px; font-size:0.85rem; width:65px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">
                       <option value="1" ${this.selectedQuarter===1?'selected':''}>T1</option>
                       <option value="2" ${this.selectedQuarter===2?'selected':''}>T2</option>
                       <option value="3" ${this.selectedQuarter===3?'selected':''}>T3</option>
                       <option value="4" ${this.selectedQuarter===4?'selected':''}>T4</option>
                     </select>
                   </div>`
              }
            </div>
            <button class="btn btn-outline" onclick="Saisie.printTable()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
              <span>Imprimer</span>
            </button>
            <button class="btn btn-outline" onclick="Saisie.scanAndCreate()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h2v2H7z"/><path d="M7 15h2v2H7z"/><path d="M15 7h2v2h-2z"/><path d="M15 15h2v2h-2z"/></svg>
              <span>Scanner QR</span>
            </button>
            <label class="btn btn-purple" style="cursor:pointer;" title="Analyse intelligente de bons ou fiches de production">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/><rect x="2" y="12" width="20" height="8" rx="2"/><circle cx="12" cy="16" r="2"/></svg>
              <span>Scan Bon IA</span>
              <input type="file" accept="image/*,application/pdf,.xlsx" style="display:none" onchange="Saisie.processAIAnalysis(event)">
            </label>
            <label class="btn btn-success" style="cursor:pointer; background:linear-gradient(135deg, #10b981, #059669); border:none;" title="Importer un rapport de production Excel (.xlsx)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
              <span>📊 Import Excel</span>
              <input type="file" accept=".xlsx,.xls" style="display:none" onchange="Saisie.processExcelImport(event)">
            </label>
            <button class="btn btn-primary" onclick="Saisie.showNewForm()">
              <span>+ Nouvelle Saisie</span>
            </button>
          </div>
        </div>

        <div class="tabs" style="margin-bottom:32px;">
          <div class="tab ${this.currentActivite==='reconditionnement'?'active':''}" onclick="Saisie.switchActivite('reconditionnement')">📦 Reconditionnement</div>
          <div class="tab ${this.currentActivite==='traitement'?'active':''}" onclick="Saisie.switchActivite('traitement')">🔧 Traitement</div>
          <div class="tab ${this.currentActivite==='divers'?'active':''}" onclick="Saisie.switchActivite('divers')">📋 Divers</div>
        </div>

        <div id="saisieFormContainer"></div>

        <div class="slide-up">
          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <span class="card-title">📋 Historique des opérations</span>
              <div style="display:flex; gap:12px; align-items:center;">
                <button class="btn" style="background-color: #ef4444; color: white; border: none; padding:8px 12px; font-size:0.85rem; display:flex; align-items:center; gap:6px; cursor:pointer; border-radius:4px;" onclick="Saisie.confirmBatchDelete()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Supprimer
                </button>
                <button class="btn btn-success" onclick="Saisie.confirmBatchSend()" style="padding:8px 12px; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                  Valider la sélection
                </button>
                <div class="badge badge-info">${prod.length} entrées ${this.viewType === 'day' ? "aujourd'hui" : this.viewType === 'month' ? "ce mois" : "ce trimestre"}</div>
                <select class="form-select" id="filterEspece" onchange="Saisie.renderTable()" style="width:180px; padding:8px 12px; font-size:0.85rem;">
                  <option value="">Toutes les espèces</option>
                  ${App.data.especes.map(e => `<option value="${e.nom}">${e.nom}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="card-body">
              <div class="table-container" id="saisieTable">
                ${this.buildTable(prod)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  onViewTypeChange(type) {
    this.viewType = type;
    this.render();
  },

  onDayChange(e) {
    this.selectedDay = e.target.value;
    this.render();
  },

  renderTable() {
    let prod = this.viewType === 'day' 
      ? App.getDayProduction(this.selectedDay)
      : this.viewType === 'month'
      ? App.getMonthProduction(this.selectedYear, this.selectedMonth)
      : App.getQuarterProduction(this.selectedYear, this.selectedQuarter);

    prod = prod.filter(p => (p.activite||'reconditionnement') === this.currentActivite);
    const filter = document.getElementById('filterEspece')?.value;
    if (filter) prod = prod.filter(p => p.espece === filter);
    document.getElementById('saisieTable').innerHTML = this.buildTable(prod);
  },

  buildTable(prod) {
    if (prod.length === 0) return `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Aucune saisie enregistrée pour cette activité ce mois-ci.</div></div>`;
    const sorted = [...prod].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" onchange="Saisie.toggleAllBatchSelection(event)" title="Tout sélectionner" /></th>
            <th>Date</th>
            <th>Espèce</th>
            <th>Calibre</th>
            <th class="td-right">Poids PI</th>
            <th class="td-right">Poids PF</th>
            <th class="td-right">Coût Total</th>
            <th>Statut</th>
            <th class="td-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(p => {
            const coutEmb = (p.coutCarton||0)+(p.coutSachet||0)+(p.coutEtiquetteNoir||0)+(p.coutEtiquette5075||0)+(p.coutScotch||0);
            const coutTotal = (p.coutMOJ||0)+coutEmb+(p.totalIntrants||0);
            const hasPF = (p.poidsBrutPF || 0) > 0;
            const isSent = !!p.sentToStorage;
            
            const statusBadge = isSent
              ? '<span class="badge badge-success"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:4px;"><path d="M20 6 9 17l-5-5"/></svg>Stocké</span>'
              : (hasPF ? '<span class="badge badge-warning">⏳ À Transférer</span>' : '<span class="badge badge-info">🔄 En Cours</span>');

            return `
              <tr>
                <td><input type="checkbox" class="batch-select-cb" value="${p.id}" ${isSent || !hasPF ? 'disabled' : ''} /></td>
                <td>
                  <div style="font-weight:600; color:var(--text-primary);">${App.formatDateFR(p.date)}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${p.activite}</div>
                </td>
                <td><span class="badge badge-purple">${p.espece||'-'}</span></td>
                <td><span style="font-family:var(--font-mono); font-size:0.85rem;">${p.calibre||'-'}</span></td>
                <td class="td-right">${App.formatNumber(p.poidsBrutPI || p.poidsMP || 0, 1)} kg</td>
                <td class="td-right td-bold" style="color:var(--accent-blue);">${App.formatNumber(p.poidsBrutPF, 1)} kg</td>
                <td class="td-right td-bold">${App.formatNumber(coutTotal, 0)} <span style="font-size:0.7rem; font-weight:normal;">DH</span></td>
                <td>${statusBadge}</td>
                <td class="td-center">
                  <div style="display:flex; gap:4px; justify-content:center;">
                    <button class="btn-icon" onclick="Saisie.editEntry('${p.id}')" title="${isSent ? 'Voir (Lecture seule)' : 'Modifier'}" style="${isSent ? 'color:var(--text-muted);' : ''}">
                      ${isSent ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'}
                    </button>
                    <button class="btn-icon" onclick="Saisie.printBon('${p.id}')" title="Bon de production">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                    </button>
                    ${hasPF && !isSent ? `
                      <button class="btn-icon" onclick="Saisie.showSendToStorageModal('${p.id}')" title="Transférer au Stockage" style="color:var(--status-success); background:rgba(34,197,94,0.1);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0-9-5-9 5m9 11V8"/></svg>
                      </button>
                    ` : ''}
                    <button class="btn-icon danger" onclick="Saisie.deleteEntry('${p.id}')" title="Supprimer" ${isSent ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  showForm(entry = null) {
    this.editingId = entry ? entry.id : null;
    const p = App.data.parametres;
    const totalFixeH = App.data.personnel.filter(e => e.dept === 'Production').length;
    const salaireFixeTotal = App.data.personnel.filter(e => e.dept === 'Production').reduce((s, e) => s + e.salaire, 0);
    const salaireHF = p.heuresMensuelles > 0 && totalFixeH > 0 ? salaireFixeTotal / totalFixeH / (p.heuresMensuelles / totalFixeH) : 22.1;

    const phasesPF = entry?.phasesPF || [
      { nom: 'Glasurage', seuil: 107, qteInit: 0, qteFinale: 0 }
    ];
    const conditionnement = entry?.conditionnement || 'C12S1000';
    const intrants = entry?.intrants || this.getDefaultIntrants(conditionnement);
    const initialPrixMP = entry?.prixMP !== undefined
      ? entry.prixMP
      : (entry?.poidsMP > 0 && entry?.valeurMP ? entry.valeurMP / entry.poidsMP : '');

    const isSent = entry?.sentToStorage === true;

    const container = document.getElementById('saisieFormContainer');
    container.innerHTML = `
      <div class="card slide-up" style="margin-bottom:22px; border:1px solid var(--border-color); box-shadow:var(--shadow-float); overflow:hidden; ${isSent ? 'border-left: 5px solid var(--status-warning);' : ''}">
        <div class="card-header" style="background:var(--bg-card); padding:1.5rem; display:flex; justify-content:space-between; align-items:center;">
          <span class="card-title" style="color:var(--primary-color); font-size:1.2rem; font-weight:700;">
            ${isSent ? '🔒 Voir la saisie (Lecture seule)' : (entry ? '✏️ Modifier la saisie' : '📝 Nouvelle saisie journalière')} 
            <span style="opacity:0.8;font-weight:500;color:var(--text-muted);font-size:1rem">— Reconditionnement</span>
          </span>
          <button class="btn-icon" style="background:var(--bg-app);" onclick="Saisie.hideForm()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="card-body">
          ${isSent ? `
            <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:12px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.4rem;">⚠️</span>
              <div>
                <div style="font-weight:700; color:var(--status-warning);">Saisie verrouillée</div>
                <div style="font-size:0.85rem; color:var(--text-secondary);">Cette fiche a été envoyée au stockage. Elle n'est plus modifiable.</div>
              </div>
            </div>
          ` : ''}
          
          <fieldset ${isSent ? 'disabled style="border:none; padding:0; margin:0;"' : 'style="border:none; padding:0; margin:0;"'}>
            <div class="form-section">
              <div class="form-section-title">🔹 Informations générales</div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Date</label>
                  <input type="date" class="form-input" id="fDate" value="${entry ? App.formatDate(entry.date) : this.selectedDay}" onchange="Saisie.onDateChange()">
                </div>
                <div class="form-group">
                  <label class="form-label">Client</label>
                  <input type="text" class="form-input" id="fClient" value="${entry?.client||''}" placeholder="Ex: ALIA PECHE" list="clientsListRec">
                  <datalist id="clientsListRec">${[...new Set((App.data.stockage||[]).map(e=>e.client).filter(Boolean))].map(c=>`<option value="${c}">`).join('')}</datalist>
                </div>
                <div class="form-group">
                  <label class="form-label">Espèce</label>
                  <div style="display:flex;gap:6px;">
                    <select class="form-select" id="fEspece" onchange="Saisie.onEspeceChange('fEspece', 'fCalibre'); Saisie.autoFillProduitFini()" style="flex:1">
                      ${App.data.especes.map(e => `<option value="${e.nom}" ${entry && entry.espece===e.nom ? 'selected' : ''}>${e.nom}</option>`).join('')}
                    </select>
                    <button class="btn btn-purple btn-sm" onclick="document.querySelector('#saisieFormContainer input[type=file]').click()" title="Analyser une fiche pour cette espèce">📸 IA</button>
                    <button class="btn btn-primary btn-sm" onclick="Saisie.scanForForm('fEspece', 'fCalibre')" title="Scanner QR">📷</button>
                    <input type="file" accept="image/*,application/pdf" style="display:none" onchange="Saisie.processAIAnalysis(event)">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Calibre</label>
                  <select class="form-select" id="fCalibre" onchange="Saisie.autoFillProduitFini()">
                    <!-- Filled dynamically -->
                  </select>
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">🔹 Matière première (Entrée)</div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Caisses PI</label><input type="number" class="form-input" id="fCaissesPI" value="${entry?entry.caissesPI||'':''}" onchange="Saisie.calc()"></div>
                <div class="form-group"><label class="form-label">Poids Net PI (kg)</label><input type="number" step="0.1" class="form-input" id="fPoidsPI" value="${entry?entry.poidsBrutPI||'':''}" onchange="Saisie.calc()"></div>
                <div class="form-group"><label class="form-label">Prix MP / kg (DH)</label><input type="number" step="0.01" class="form-input" id="fPrixMP" value="${initialPrixMP}" placeholder="Ex: 15.00" onchange="Saisie.calc()"></div>
                <div class="form-group">
                  <label class="form-label">Reliquat (Nature & Poids kg)</label>
                  <div style="display:flex;gap:6px;">
                    <input type="text" class="form-input" id="fReliquatNom" value="${entry ? entry.reliquatNom||entry.reliquat||'' : ''}" placeholder="Ex: ROTO" style="flex:1">
                    <input type="number" step="0.1" class="form-input" id="fReliquatPoids" value="${entry ? entry.reliquatPoids||'' : ''}" placeholder="kg" style="width:80px" onchange="Saisie.calc()">
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🔹 Phases de Reconditionnement</span>
                <button class="btn btn-sm btn-outline" onclick="Saisie.addPhaseRecond('fPhasesPF')" ${isSent ? 'disabled' : ''}>+ Phase</button>
              </div>
              <table><thead><tr><th>Phase</th><th>Seuil %</th><th>Qté initiale</th><th>Qté finale</th><th>Rend. phase</th><th>Rend. final</th><th style="width:30px"></th></tr></thead>
              <tbody id="fPhasesPF">${phasesPF.map((ph,i)=>`<tr draggable="true" ondragstart="Saisie.onPhaseDragStart(event, this)" ondragover="Saisie.onPhaseDragOver(event)" ondrop="Saisie.onPhaseDrop(event, this, 'fPhasesPF')">
                <td><select class="form-select" style="width:160px;padding:5px;font-weight:700;cursor:grab;" data-ph="nom" ${isSent ? 'disabled' : ''}>${Saisie.phasesList.map(p=>`<option value="${p}" ${ph.nom===p?'selected':''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="${ph.seuil}" data-ph="seuil" data-idx="${i}" onchange="Saisie.calc()" ${isSent ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteInit||''}" data-ph="qteInit" data-idx="${i}" onchange="Saisie.calc()" ${isSent ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteFinale||''}" data-ph="qteFinale" data-idx="${i}" onchange="Saisie.calc()" ${isSent ? 'disabled' : ''}></td>
                <td class="td-right td-bold" id="fRendPhPF${i}">0%</td>
                <td class="td-right" id="fRendCumPF${i}">0%</td>
                <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removePhaseRecond(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
              </tr>`).join('')}</tbody></table>
            </div>

            <div class="form-section">
              <div class="form-section-title">🔹 Produits finis</div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Produit fini</label><input type="text" class="form-input" id="fProduitFini" value="${entry?.produitFini||''}" placeholder="Ex: TUBE DE CALAMAR"></div>
                <div class="form-group"><label class="form-label">Poids Net PF (kg)</label><input type="number" step="0.01" class="form-input" id="fPoidsPF" value="${entry?.poidsBrutPF||''}" onchange="Saisie.calc()"></div>
                <div class="form-group"><label class="form-label">Nb Caisses PF</label><input type="number" class="form-input" id="fCaissesPF" value="${entry?.caissesPF||''}" onchange="Saisie.calc()"></div>
                <div class="form-group"><label class="form-label">Conditionnement</label><select class="form-select" id="fConditionnement" onchange="Saisie.onConditionnementChangeRec()">${Saisie.emballagesList.map(e=>`<option value="${e.code}" ${conditionnement===e.code?'selected':''}>${e.code} — ${e.designation}</option>`).join('')}</select></div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🔹 Main-d'œuvre</span>
                <button class="btn btn-sm btn-outline" onclick="Saisie.addEquipeMO()" ${isSent ? 'disabled' : ''}>+ Ajouter Équipe</button>
              </div>

              <div style="margin-bottom:15px; display:flex; gap:12px; align-items:center;">
                <label class="form-label" style="margin:0; font-weight:600;">Période d'allocation :</label>
                <select class="form-select" id="fAllocationPeriod" onchange="Saisie.calc()" style="width:200px; padding:6px; font-size:0.85rem;">
                  <option value="day" ${entry?.allocationPeriod === 'day' ? 'selected' : ''}>📅 Journalière (Jour)</option>
                  <option value="month" ${entry?.allocationPeriod === 'month' ? 'selected' : ''}>📊 Mensuelle (Mois)</option>
                  <option value="quarter" ${!entry || entry.allocationPeriod === 'quarter' || !entry.allocationPeriod ? 'selected' : ''}>📈 Trimestrielle (Trimestre)</option>
                  <option value="year" ${entry?.allocationPeriod === 'year' ? 'selected' : ''}>🏆 Annuelle (Année)</option>
                </select>
              </div>
              
              <div style="margin-bottom:15px;">
                <div style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary);">Personnel Fixe (Allocation mensuelle)</div>
                <div class="form-grid">
                  <div class="form-group"><label class="form-label">Heures M.O. Fixe</label><input type="number" step="0.5" class="form-input" id="fHeuresMOF" value="${entry?entry.heuresMOF||totalFixeH*8:totalFixeH*8}" onchange="Saisie.calc()"></div>
                  <div class="form-group"><label class="form-label">Salaire H/F (DH)</label><input type="number" step="0.01" class="form-input" id="fSalaireHF" value="${entry?entry.salaireHF||22.1:22.1}" onchange="Saisie.calc()"></div>
                  <div class="form-group"><label class="form-label">Coût Personnel Fixe</label><div class="form-computed" id="fCoutPF">0.00 DH</div></div>
                </div>
              </div>

              <div style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary);">Équipes Occasionnelles</div>
              <table><thead><tr><th>Profil</th><th>Nb personnes</th><th>Heures/pers.</th><th>Taux Hor. (DH)</th><th>Coût Total</th><th style="width:30px"></th></tr></thead>
              <tbody id="fEquipesMO">${(entry?.equipesMO || [{profil: 'Ouvrière', nb: 1, heures: 8, taux: p.salaireHoraireOcc}]).map((eq,i)=>`<tr>
                <td><input type="text" class="form-input" style="width:140px;padding:5px;font-weight:600" value="${eq.profil}" data-mo="profil"></td>
                <td><input type="number" class="form-input" style="width:70px;padding:5px" value="${eq.nb}" data-mo="nb" onchange="Saisie.calc()"></td>
                <td><input type="number" step="0.5" class="form-input" style="width:70px;padding:5px" value="${eq.heures}" data-mo="heures" onchange="Saisie.calc()"></td>
                <td><input type="number" step="0.01" class="form-input" style="width:80px;padding:5px" value="${eq.taux || p.salaireHoraireOcc}" data-mo="taux" onchange="Saisie.calc()"></td>
                <td class="td-right td-bold" id="fCoutEq${i}">0.00</td>
                <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removeEquipeMO(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
              </tr>`).join('')}
              <tr style="background:rgba(99,102,241,0.05)"><td colspan="4" class="td-bold">Total M.O. Occasionnelle</td><td class="td-right td-bold" id="fCoutMOO">0.00 DH</td><td></td></tr>
              </tbody></table>

              <div style="margin-top:12px;padding:14px;background:rgba(99,102,241,0.08);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:var(--text-secondary);">COÛT M.O. TOTAL / JOUR</span>
                <span class="form-computed" id="fCoutMOJ" style="font-size:1.2rem;border:none;padding:0;">0.00 DH</span>
              </div>
              <div id="fAllocationMOInfo" style="margin-top:8px;padding:12px;background:rgba(99,102,241,0.05);border-radius:8px;border-left:4px solid var(--accent-blue);display:none;"></div>
              <div id="fAllocationEnergieInfo" style="margin-top:8px;padding:12px;background:rgba(234,179,8,0.05);border-radius:8px;border-left:4px solid #eab308;display:none;"></div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🔹 Intrants</span>
                <div style="display:flex;gap:6px;align-items:center;">
                  <select class="form-select" id="fIntrantSelect" style="width:220px;padding:6px;font-size:0.82rem" ${isSent ? 'disabled' : ''}>
                    <optgroup label="── SACHET ──">${Saisie.intrantsMaster.filter(i=>i.famille==='SACHET').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── PLASTIQUE / SAC ──">${Saisie.intrantsMaster.filter(i=>i.famille==='PLASTIQUE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── CARTON ──">${Saisie.intrantsMaster.filter(i=>i.famille==='CARTON').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── ETIQUETTE ──">${Saisie.intrantsMaster.filter(i=>i.famille==='ETIQUETTE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── EMBALLAGE ──">${Saisie.intrantsMaster.filter(i=>i.famille==='EMBALLAGE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── INTRANT ──">${Saisie.intrantsMaster.filter(i=>i.famille==='INTRANT').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── EQUIPEMENT ──">${Saisie.intrantsMaster.filter(i=>i.famille==='EQUIPEMENT').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── FOURNITURES ──">${Saisie.intrantsMaster.filter(i=>i.famille==='FOURNITURES').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── DIVERS ──">${Saisie.intrantsMaster.filter(i=>i.famille==='DIVERS'||i.famille==='EAU-ELEC'||i.famille==='SERVICE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  </select>
                  <button class="btn btn-success btn-sm" onclick="Saisie.addIntrantFromListRec()" ${isSent ? 'disabled' : ''}>+ Ajouter</button>
                </div>
              </div>
              <table><thead><tr><th>Article</th><th>Quantité</th><th>Prix unit. (DH)</th><th>Valeur (DH)</th><th style="width:30px"></th></tr></thead>
              <tbody id="fIntrants">${intrants.map((it, i) => Saisie.renderIntrantRowRec(it, i, isSent)).join('')}
              <tr style="background:rgba(99,102,241,0.1)"><td colspan="4" class="td-bold">Total intrants</td><td class="td-right td-bold" id="fTotalIntrants">0.00 DH</td></tr>
              </tbody></table>
            </div>

            <div class="summary-box" style="background:linear-gradient(145deg, var(--bg-card), rgba(245,166,35,0.05)); border:1px solid rgba(245,166,35,0.2); border-left:4px solid var(--status-warning); border-radius:12px; padding:20px; margin-top:20px; box-shadow:var(--shadow-soft);">
              <h3 style="margin-bottom:18px;font-size:1.15rem;color:var(--status-warning);display:flex;align-items:center;gap:8px;font-weight:700;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                Résumé des coûts de la journée
              </h3>
              <div class="summary-row"><span class="summary-label">Coût Main-d'œuvre</span><span class="summary-value" id="sumMO">0 DH</span></div>
              <div class="summary-row"><span class="summary-label">Coût Emballage (Intrants)</span><span class="summary-value" id="sumEmb">0 DH</span></div>
              <div class="summary-row"><span class="summary-label">Coût Total Journée</span><span class="summary-value summary-total" id="sumTotal">0 DH</span></div>
              <div class="summary-row"><span class="summary-label">Coût Opérationnel / kg produit</span><span class="summary-value" id="sumParKg">0 DH/kg</span></div>
              <div class="summary-row"><span class="summary-label">Rendement de production</span><span class="summary-value" id="sumRendementRec" style="color:var(--accent-orange);font-weight:bold;">0%</span></div>
            </div>
          </fieldset>

          <div style="margin-top:30px; display:flex; gap:15px; justify-content:center; padding: 25px 0; border-top: 1px solid var(--border-color);">
            <button class="btn btn-outline" style="min-width: 150px; border-radius:30px;" onclick="Saisie.hideForm()">${isSent ? 'Fermer' : '✕ Annuler'}</button>
            ${!isSent ? `
              <button class="btn btn-primary" style="min-width: 250px; font-size: 1.1rem; border-radius:30px; background:var(--status-warning); border:none; box-shadow:0 8px 16px rgba(245,166,35,0.3);" onclick="Saisie.saveEntry()">
                💾 ${entry ? 'Mettre à jour la saisie' : 'Enregistrer la saisie'}
              </button>
            ` : ''}
            ${entry && !isSent ? `
              <button class="btn btn-success" style="min-width: 250px; font-size: 1.1rem; border-radius:30px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);" onclick="Saisie.showSendToStorageModal('${entry.id}', 'Reconditionnement')">
                📦 Valider vers Stockage
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    this.onEspeceChange('fEspece', 'fCalibre', entry?.calibre);
    if (!entry) this.onDateChange(); else this.calc();
  },

  hideForm() { document.getElementById('saisieFormContainer').innerHTML = ''; this.editingId = null; },

  onDateChange() {
    const d = document.getElementById('fDate');
    if(!d) return;
    
    // Mapper l'activité de saisie vers l'activité de pointage
    const activiteMap = {
      'traitement': 'Traitement',
      'reconditionnement': 'Reconditionnement',
      'divers': 'Traitement'
    };
    const targetAct = activiteMap[this.currentActivite] || 'Traitement';
    const hp = App.getHeuresJour(d.value, targetAct);
    
    const fMOF = document.getElementById('fHeuresMOF');
    if(fMOF) fMOF.value = hp.hFixe;
    
    const fEquipesMO = document.getElementById('fEquipesMO');
    if(fEquipesMO) {
       const taux = App.data.parametres.salaireHoraireOcc || 16.8;
       const trs = fEquipesMO.querySelectorAll('tr:not(:last-child)');
       if (trs.length > 0) {
           const row = trs[0];
           const nbInput = row.querySelector('[data-mo="nb"]');
           const hInput = row.querySelector('[data-mo="heures"]');
           const tInput = row.querySelector('[data-mo="taux"]');
           if (nbInput) nbInput.value = hp.occCount || 1;
           if (hInput) hInput.value = hp.occCount ? (hp.hOcc / hp.occCount).toFixed(1) : 0;
           if (tInput) tInput.value = taux;
           
           for (let i = 1; i < trs.length; i++) {
               trs[i].remove();
           }
       }
    }
    
    this.calc();
  },

  calc() {
    const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    
    let coutMOO = 0;
    document.querySelectorAll('#fEquipesMO tr:not(:last-child)').forEach((row, i) => {
      const nb = parseFloat(row.querySelector('[data-mo="nb"]')?.value) || 0;
      const heures = parseFloat(row.querySelector('[data-mo="heures"]')?.value) || 0;
      const taux = parseFloat(row.querySelector('[data-mo="taux"]')?.value) || 0;
      const val = nb * heures * taux;
      const valEl = document.getElementById('fCoutEq' + i);
      if (valEl) valEl.textContent = App.formatNumber(val);
      coutMOO += val;
    });

    const coutPF = v('fHeuresMOF') * v('fSalaireHF');
    const localCost = coutMOO + coutPF;

    let poidsPF = v('fPoidsPF');
    const poidsPI = v('fPoidsPI');
    
    // Automation: Cascade phases and PF
    const tbodyPF = document.getElementById('fPhasesPF');
    if (tbodyPF) {
      let prevQF = poidsPI;
      const pfRows = tbodyPF.querySelectorAll('tr');
      pfRows.forEach((row, i) => {
        const qiInput = row.querySelector('[data-ph="qteInit"]');
        if (qiInput) {
          if (i === 0 && poidsPI > 0) qiInput.value = poidsPI;
          else if (i > 0) qiInput.value = prevQF;
        }
        
        const qi = parseFloat(qiInput?.value)||0;
        const qf = parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0;
        prevQF = qf || qi;

        const rend = qi > 0 ? (qf/qi*100) : 0;
        const rendEl = document.getElementById('fRendPhPF'+i);
        if(rendEl) rendEl.textContent = App.formatNumber(rend,2)+'%';

        const rendCum = poidsPI > 0 ? (prevQF/poidsPI*100) : 0;
        const rendCumEl = document.getElementById('fRendCumPF'+i);
        if(rendCumEl) rendCumEl.textContent = App.formatNumber(rendCum,2)+'%';
      });

      const lastRow = pfRows[pfRows.length-1];
      const lastQF = lastRow ? (parseFloat(lastRow.querySelector('[data-ph="qteFinale"]')?.value)||0) : 0;
      if (lastQF > 0) {
        const fPoidsPFEl = document.getElementById('fPoidsPF');
        if (fPoidsPFEl) {
          fPoidsPFEl.value = lastQF;
          poidsPF = lastQF;
        }
      }
    }

    // Find initial weight for TREMPAGE
    let refWeight = poidsPI;
    if (tbodyPF) {
      tbodyPF.querySelectorAll('tr').forEach(row => {
        const nomInput = row.querySelector('[data-ph="nom"]');
        if (nomInput && nomInput.value.toUpperCase().includes('TREMPAGE')) {
          const qi = parseFloat(row.querySelector('[data-ph="qteInit"]')?.value);
          if (qi > 0) refWeight = qi;
        }
      });
    }

    // Automation: Calculate Intrants from Nb Caisses PF
    const caissesPF = v('fCaissesPF');
    const condCode = document.getElementById('fConditionnement')?.value || '';
    const condMatch = condCode.match(/^C(\d+)S(\d+)$/);
    
    let nbCartons = caissesPF;
    let nbSachetsTotal = 0;
    let nbRouleaux = 0;
    let nbToners = 0;

    if (condMatch && caissesPF > 0) {
      const cartonKg = parseFloat(condMatch[1]);
      const sachetG = parseFloat(condMatch[2]);
      const sachetKg = sachetG / 1000;
      const sachetsParCarton = cartonKg / sachetKg;
      
      nbSachetsTotal = nbCartons * sachetsParCarton;
      const etiqParCarton = sachetsParCarton + 1;
      const totalEtiquettes = nbCartons * etiqParCarton;
      nbRouleaux = totalEtiquettes / 1000;
      nbToners = nbRouleaux / 4;
    }

    let totalEmb = 0;
    document.querySelectorAll('#fIntrants tr:not(:last-child)').forEach((row, i) => {
      const artInput = row.querySelector('[data-int="article"]');
      const qteInput = row.querySelector('[data-int="qte"]');
      const prixInput = row.querySelector('[data-int="prix"]');
      if (!artInput || !qteInput) return;
      
      const art = artInput.value.toUpperCase();
      
      if (refWeight > 0 && art.includes('AGRAFISH')) {
        qteInput.value = (refWeight / 100 * 1).toFixed(3);
      } else if (refWeight > 0 && art.includes('HYDROMAR')) {
        qteInput.value = (refWeight / 100 * 1).toFixed(3);
      } else if (refWeight > 0 && (art === 'SEL' || art.includes('SEL ') || art.startsWith('SEL'))) {
        qteInput.value = (refWeight / 100 * 0.5).toFixed(3);
      } else if (condMatch && caissesPF > 0) {
        const currentQte = parseFloat(qteInput.value) || 0;
        if (art.includes('CARTON')) {
          if (!currentQte) qteInput.value = nbCartons;
        } else if (art.includes('SACHET')) {
          if (!currentQte) qteInput.value = nbSachetsTotal;
        } else if (art.includes('50') && art.includes('75') || art.includes('ETIQUETTE') && !art.includes('NOIR')) {
          if (!currentQte) {
            qteInput.value = nbRouleaux.toFixed(3);
            if (prixInput && !parseFloat(prixInput.value)) prixInput.value = 45;
          }
        } else if (art.includes('NOIR') || art.includes('TONER')) {
          if (!currentQte) {
            qteInput.value = nbToners.toFixed(3);
            if (prixInput && !parseFloat(prixInput.value)) prixInput.value = 78;
          }
        }
      }

      const q = parseFloat(qteInput.value) || 0;
      const p = parseFloat(prixInput?.value) || 0;
      const val = q * p;
      const valEl = document.getElementById('intValRec' + i);
      if (valEl) valEl.textContent = App.formatNumber(val);
      totalEmb += val;
    });

    // Dynamic Labor Cost Allocation
    const dateStr = document.getElementById('fDate')?.value || '';
    const allocationPeriod = document.getElementById('fAllocationPeriod')?.value || 'quarter';
    const pesos = App.getPeriodLaborCostAllocation(dateStr, poidsPF, Saisie.editingId, allocationPeriod);
    const energieAlloc = App.getPeriodEnergyCostAllocation(dateStr, poidsPF, Saisie.editingId, allocationPeriod);
    
    let coutMOJ = localCost;
    const infoEl = document.getElementById('fAllocationMOInfo');
    
    let labelPeriode = 'Mensuelle';
    if (allocationPeriod === 'day') labelPeriode = 'Journalière';
    else if (allocationPeriod === 'quarter') labelPeriode = 'Trimestrielle';
    else if (allocationPeriod === 'year') labelPeriode = 'Annuelle';

    if (infoEl) {
      if (pesos.fallback) {
        infoEl.style.display = 'block';
        infoEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; color:var(--status-warning);">
            <div style="font-weight:700; display:flex; align-items:center; gap:4px;">⚠️ Mode Repli Activé</div>
            <div style="color:var(--text-secondary);">Aucune donnée de pointage ou de tonnage pour la période <strong>${pesos.targetMonths.join(', ')}</strong>. Calcul basé sur les équipes locales de la fiche.</div>
          </div>
        `;
      } else {
        infoEl.style.display = 'block';
        let labelMasse = 'Masse Salariale Période';
        let labelTonnage = 'Tonnage Total Période';
        if (allocationPeriod === 'day') {
          labelMasse = 'Masse Salariale du Jour';
          labelTonnage = 'Tonnage Total du Jour';
        }

        infoEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:6px; font-size:0.8rem;">
            <div style="font-weight:700; color:var(--accent-blue); display:flex; align-items:center; gap:4px;">📊 Ventilation Dynamique (${labelPeriode})</div>
            <div style="color:var(--text-secondary); line-height:1.4;">
              ${labelMasse} : <strong>${App.formatNumber(pesos.totalLaborCost, 0)} DH</strong><br>
              ${labelTonnage} : <strong>${App.formatNumber(pesos.totalTonnage, 1)} kg</strong><br>
              Ratio Alloué : <strong>${App.formatNumber(pesos.ratio, 4)} DH/kg</strong>
            </div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(99,102,241,0.1); color:var(--text-primary); font-weight:600;">
              Coût M.O. Alloué Journalier : ${App.formatNumber(pesos.allocatedCost, 2)} DH
            </div>
          </div>
        `;
        coutMOJ = pesos.allocatedCost;
      }
    }

    let coutEnergie = 0;
    const infoEnergieEl = document.getElementById('fAllocationEnergieInfo');
    if (infoEnergieEl) {
      if (energieAlloc.fallback || energieAlloc.totalEnergyCost === 0) {
        infoEnergieEl.style.display = 'block';
        infoEnergieEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; color:var(--status-warning);">
            <div style="font-weight:700; display:flex; align-items:center; gap:4px;">⚠️ Mode Repli Énergie Activé</div>
            <div style="color:var(--text-secondary);">Aucune donnée d'énergie ou de tonnage pour la période <strong>${energieAlloc.targetMonths.join(', ')}</strong>.</div>
          </div>
        `;
      } else {
        infoEnergieEl.style.display = 'block';
        infoEnergieEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:6px; font-size:0.8rem;">
            <div style="font-weight:700; color:#eab308; display:flex; align-items:center; gap:4px;">⚡ Ventilation Énergie (${labelPeriode})</div>
            <div style="color:var(--text-secondary); line-height:1.4;">
              Facture Globale Énergie : <strong>${App.formatNumber(energieAlloc.totalEnergyCost, 2)} DH</strong><br>
              Tonnage Total Période : <strong>${App.formatNumber(energieAlloc.totalTonnage, 1)} kg</strong><br>
              Ratio Alloué : <strong>${App.formatNumber(energieAlloc.ratio, 4)} DH/kg</strong>
            </div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(234,179,8,0.1); color:var(--text-primary); font-weight:600;">
              Coût Énergie Alloué : ${App.formatNumber(energieAlloc.allocatedCost, 2)} DH
            </div>
          </div>
        `;
        coutEnergie = energieAlloc.allocatedCost;
      }
    }

    const totalJ = coutMOJ + totalEmb + coutEnergie;
    const parKg = poidsPF > 0 ? totalJ / poidsPF : 0;

    const poidsReliquat = v('fReliquatPoids');
    const poidsNetEngage = Math.max(0, poidsPI - poidsReliquat);
    const rendement = poidsNetEngage > 0 ? (poidsPF / poidsNetEngage * 100) : 0;

    const elMOO = document.getElementById('fCoutMOO'); if(elMOO) elMOO.textContent = App.formatNumber(coutMOO) + ' DH';
    const elPF = document.getElementById('fCoutPF'); if(elPF) elPF.textContent = App.formatNumber(coutPF) + ' DH';
    const elMOJ = document.getElementById('fCoutMOJ'); if(elMOJ) elMOJ.textContent = App.formatNumber(coutMOJ) + ' DH';
    const elSumMO = document.getElementById('sumMO'); if(elSumMO) elSumMO.textContent = App.formatNumber(coutMOJ, 0) + ' DH';
    
    const elSumEmb = document.getElementById('sumEmb'); if(elSumEmb) elSumEmb.textContent = App.formatNumber(totalEmb, 0) + ' DH';
    const elTotInt = document.getElementById('fTotalIntrants'); if(elTotInt) elTotInt.textContent = App.formatNumber(totalEmb) + ' DH';
    
    const elSumTotal = document.getElementById('sumTotal'); if(elSumTotal) elSumTotal.textContent = App.formatNumber(totalJ, 0) + ' DH';
    
    // --- Calcul Impact Facturation Intelligent (Reconditionnement) ---
    const monthStr = dateStr ? dateStr.substring(0, 7) : new Date().toISOString().substring(0, 7);
    
    // 1. Tonnages
    const allProdMois = (App.data.production || []).filter(p => (p.date||'').startsWith(monthStr));
    const totalKgUsine = allProdMois.reduce((s, p) => s + (p.poidsBrutPF || 0), 0) + poidsPF;
    const totalKgActivite = allProdMois.filter(p => p.activite === 'reconditionnement' && p.id !== Saisie.editingId).reduce((s, p) => s + (p.poidsBrutPF || 0), 0) + poidsPF;

    // 2. Factures
    const facturesMois = (App.data.factures || []).filter(f => (f.date||'').startsWith(monthStr));
    
    // Charges spécifiques (Reconditionnement + Emballage pour recond)
    const chargesSpecifiques = facturesMois.filter(f => f.allocation === 'reconditionnement' || f.allocation === 'emballage').reduce((s, f) => s + (f.montant||0), 0);
    const impactSpecifique = totalKgActivite > 0 ? (chargesSpecifiques / totalKgActivite) : 0;

    // Charges générales
    const chargesGenerales = facturesMois.filter(f => f.allocation === 'general' || !f.allocation).reduce((s, f) => s + (f.montant||0), 0);
    const impactGeneral = totalKgUsine > 0 ? (chargesGenerales / totalKgUsine) : 0;

    let coutFactureParKg = impactSpecifique + impactGeneral;
    let isEstime = false;
    if (coutFactureParKg === 0) {
        coutFactureParKg = App.data.parametres.coutStructureEstime || 1.5;
        isEstime = true;
    }
    // -------------------------------------------------------------

    const prixRevientTotal = parKg + coutFactureParKg;
    const elSumParKg = document.getElementById('sumParKg'); 
    if(elSumParKg) {
      elSumParKg.innerHTML = `${App.formatNumber(prixRevientTotal, 2)} DH/kg`;
      if (coutFactureParKg > 0) {
        elSumParKg.innerHTML += `<div style="font-size:11px;color:${isEstime?'#f59e0b':'#10b981'};font-weight:normal;margin-top:4px;">
          ${isEstime ? '⚠️ Charges estimées' : '✅ Charges réelles'} : +${App.formatNumber(coutFactureParKg, 2)} DH/kg
        </div>`;
      }
    }

    const rendEl = document.getElementById('sumRendementRec'); if (rendEl) rendEl.textContent = App.formatNumber(rendement, 2) + '%';
  },

  autoFillProduitFini() {
    const espece = document.getElementById('fEspece')?.value || '';
    const calibre = document.getElementById('fCalibre')?.value || '';
    const pfInput = document.getElementById('fProduitFini');
    if (pfInput && espece) {
      if (!pfInput.value || pfInput.value.includes('Reconditionné')) {
        pfInput.value = (espece + ' ' + calibre + ' Reconditionné').trim().toUpperCase();
      }
    }
  },

  addEquipeMO(tbodyId = 'fEquipesMO') {
    const tbody = document.getElementById(tbodyId);
    const idx = tbody.querySelectorAll('tr:not(:last-child)').length;
    const lastRow = tbody.querySelector('tr:last-child');
    const tr = document.createElement('tr');
    const defaultTaux = App.data.parametres.salaireHoraireOcc || 17.92;
    const callback = tbodyId === 'tEquipesMO' ? 'Saisie.calcT()' : 'Saisie.calc()';
    const prefix = tbodyId === 'tEquipesMO' ? 't' : 'f';

    tr.innerHTML = `
      <td><input type="text" class="form-input" style="width:140px;padding:5px;font-weight:600" value="Ouvrière" data-mo="profil"></td>
      <td><input type="number" class="form-input" style="width:70px;padding:5px" value="1" data-mo="nb" onchange="${callback}"></td>
      <td><input type="number" step="0.5" class="form-input" style="width:70px;padding:5px" value="8" data-mo="heures" onchange="${callback}"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:80px;padding:5px" value="${defaultTaux}" data-mo="taux" onchange="${callback}"></td>
      <td class="td-right td-bold" id="${prefix}CoutEq${idx}">0.00</td>
      <td><button class="btn-icon danger" onclick="Saisie.removeEquipeMO(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>
    `;
    tbody.insertBefore(tr, lastRow);
    if (tbodyId === 'tEquipesMO') this.calcT(); else this.calc();
  },

  removeEquipeMO(btn) {
    const tr = btn.closest('tr');
    const tbody = tr.parentElement;
    const rows = tbody.querySelectorAll('tr:not(:last-child)');
    if (rows.length <= 1) { App.toast("Il faut au moins une ligne d'équipe", 'error'); return; }
    tr.remove();
    tbody.querySelectorAll('tr:not(:last-child)').forEach((row, i) => {
      const valEl = row.querySelector('td:nth-child(5)');
      if (valEl) valEl.id = 'fCoutEq' + i;
    });
    this.calc();
  },

  renderIntrantRowRec(it, i, isSent = false) {
    return `<tr>
      <td><input type="text" class="form-input" style="width:180px;padding:5px;font-weight:600" value="${it.article}" data-int="article" data-idx="${i}" ${isSent ? 'disabled' : ''}></td>
      <td><input type="number" step="0.01" class="form-input" style="width:90px;padding:5px" value="${it.qte||''}" data-int="qte" data-idx="${i}" onchange="Saisie.calc()" ${isSent ? 'disabled' : ''}></td>
      <td><input type="number" step="0.01" class="form-input" style="width:90px;padding:5px" value="${it.prix}" data-int="prix" data-idx="${i}" onchange="Saisie.calc()" ${isSent ? 'disabled' : ''}></td>
      <td class="td-right td-bold" id="intValRec${i}">0.00</td>
      <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removeIntrantRowRec(this)" style="width:24px;height:24px" title="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
    </tr>`;
  },

  onConditionnementChangeRec() {
    const code = document.getElementById('fConditionnement')?.value || '';
    const newIntrants = this.getDefaultIntrants(code);
    const tbody = document.getElementById('fIntrants');
    const existingRows = tbody.querySelectorAll('tr:not(:last-child)');
    const extraIntrants = [];
    existingRows.forEach((row, i) => {
      if (i >= 4) {
        const a = row.querySelector('[data-int="article"]');
        const q = row.querySelector('[data-int="qte"]');
        const p = row.querySelector('[data-int="prix"]');
        if (a) extraIntrants.push({ article: a.value, qte: parseFloat(q?.value)||0, prix: parseFloat(p?.value)||0 });
      }
    });
    const allIntrants = [...newIntrants, ...extraIntrants];
    const totalRow = tbody.querySelector('tr:last-child');
    tbody.innerHTML = allIntrants.map((it, i) => this.renderIntrantRowRec(it, i)).join('') + totalRow.outerHTML;
    this.calc();
  },

  addIntrantFromListRec() {
    const sel = document.getElementById('fIntrantSelect');
    const ref = sel.value;
    const master = this.intrantsMaster.find(i => i.ref === ref);
    if (!master) return;
    const tbody = document.getElementById('fIntrants');
    const rows = tbody.querySelectorAll('tr:not(:last-child)');
    const idx = rows.length;
    const totalRow = tbody.querySelector('tr:last-child');
    const tr = document.createElement('tr');
    tr.innerHTML = this.renderIntrantRowRec({ article: master.article, qte: 0, prix: master.prix }, idx).replace(/^<tr>/, '').replace(/<\/tr>$/, '');
    tbody.insertBefore(tr, totalRow);
    this.calc();
    App.toast(`${master.article} ajouté`, 'success');
  },

  removeIntrantRowRec(btn) {
    const tr = btn.closest('tr');
    const tbody = tr.parentElement;
    const rows = tbody.querySelectorAll('tr:not(:last-child)');
    if (rows.length <= 1) { App.toast('Il faut au moins un intrant', 'error'); return; }
    tr.remove();
    tbody.querySelectorAll('tr:not(:last-child)').forEach((row, i) => {
      row.querySelectorAll('[data-int]').forEach(inp => inp.dataset.idx = i);
      const valEl = row.querySelector('td:nth-child(4)');
      if (valEl) valEl.id = 'intValRec' + i;
    });
    this.calc();
  },

  saveEntry() {
    const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    const date = document.getElementById('fDate').value;
    const espece = document.getElementById('fEspece').value;
    if (!date || !espece) { App.toast('Veuillez remplir la date et l\'espèce', 'error'); return; }

    const coutPF = v('fHeuresMOF') * v('fSalaireHF');
    
    let coutMOO = 0;
    const equipesMO = [];
    document.querySelectorAll('#fEquipesMO tr:not(:last-child)').forEach(row => {
      const profil = row.querySelector('[data-mo="profil"]')?.value || 'Ouvrière';
      const nb = parseFloat(row.querySelector('[data-mo="nb"]')?.value) || 0;
      const heures = parseFloat(row.querySelector('[data-mo="heures"]')?.value) || 0;
      const taux = parseFloat(row.querySelector('[data-mo="taux"]')?.value) || 0;
      const coutEq = nb * heures * taux;
      equipesMO.push({ profil, nb, heures, taux, coutEq });
      coutMOO += coutEq;
    });

    const phasesPF = [];
    document.querySelectorAll('#fPhasesPF tr').forEach(row => {
      phasesPF.push({
        nom: row.querySelector('[data-ph="nom"]')?.value || '',
        seuil: parseFloat(row.querySelector('[data-ph="seuil"]')?.value) || 0,
        qteInit: parseFloat(row.querySelector('[data-ph="qteInit"]')?.value) || 0,
        qteFinale: parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value) || 0
      });
    });

    const intrants = [];
    document.querySelectorAll('#fIntrants tr:not(:last-child)').forEach(row => {
      intrants.push({
        article: row.querySelector('[data-int="article"]')?.value || '',
        qte: parseFloat(row.querySelector('[data-int="qte"]')?.value) || 0,
        prix: parseFloat(row.querySelector('[data-int="prix"]')?.value) || 0
      });
    });

    const totalIntrants = intrants.reduce((s, it) => s + (it.qte||0) * (it.prix||0), 0);
    const prixMP = v('fPrixMP');
    const poidsMP = v('fPoidsPI');
    const valeurMP = prixMP > 0 && poidsMP > 0 ? prixMP * poidsMP : 0;
    const poidsPF = v('fPoidsPF');
    const rendement = poidsMP > 0 ? (poidsPF / poidsMP * 100) : 0;

    const entry = {
      id: this.editingId || App.nextId(App.data.production),
      activite: 'reconditionnement',
      date, espece,
      calibre: document.getElementById('fCalibre')?.value || '',
      client: document.getElementById('fClient')?.value || '',
      caissesPI: v('fCaissesPI'), poidsBrutPI: poidsMP,
      caissesPF: v('fCaissesPF'), poidsBrutPF: poidsPF,
      produitFini: document.getElementById('fProduitFini')?.value || '',
      conditionnement: document.getElementById('fConditionnement')?.value || '',
      reliquatNom: document.getElementById('fReliquatNom')?.value || '',
      reliquatPoids: v('fReliquatPoids'),
      allocationPeriod: document.getElementById('fAllocationPeriod')?.value || 'quarter',
      equipesMO,
      coutMOO,
      heuresMOF: v('fHeuresMOF'), salaireHF: v('fSalaireHF'), coutPersonnelF: coutPF,
      coutMOJ: parseFloat(document.getElementById('fCoutMOJ')?.textContent.replace(/[^0-9.]/g,''))||(coutMOO + coutPF),
      phasesPF,
      intrants,
      totalIntrants,
      prixMP,
      valeurMP,
      poidsMP,
      rendement
    };
    const previous = this.editingId ? App.data.production.find(p => p.id == this.editingId) : null;
    const previousConsumption = previous ? this.getReconditionnementConsumption(previous) : {};
    const nextConsumption = this.getReconditionnementConsumption(entry);
    const missingOrLow = Object.entries(nextConsumption).find(([nom, qty]) => {
      if (qty <= 0) return false;
      const c = App.data.consommables.find(item => item.nom === nom);
      if (!c) return true;
      return (c.stock + (previousConsumption[nom] || 0)) < qty;
    });
    if (missingOrLow) {
      const [nom, qty] = missingOrLow;
      const c = App.data.consommables.find(item => item.nom === nom);
      const disponible = (c?.stock || 0) + (previousConsumption[nom] || 0);
      if (!confirm(`⚠️ Stock consommable insuffisant: ${nom} (${App.formatNumber(disponible, 2)} disponible / ${App.formatNumber(qty, 2)} requis).\n\nVoulez-vous forcer l'enregistrement ? Le stock passera en négatif.`)) {
        return;
      }
    }

    if (this.editingId) {
      const idx = App.data.production.findIndex(p => p.id == this.editingId);
      if (idx !== -1) App.data.production[idx] = entry;
      this.restoreConsumption(previousConsumption, `Correction saisie #${entry.id}`);
      this.consumeStock(nextConsumption, `Production #${entry.id}`);
    } else {
      App.data.production.push(entry);
      this.consumeStock(nextConsumption, `Production #${entry.id}`);
    }

    App.saveData('production', entry);
    this.hideForm();
    this.render();
    App.toast(this.editingId ? 'Saisie mise à jour' : 'Saisie enregistrée', 'success');
  },

  deductStock(nom, qty) {
    const c = App.data.consommables.find(c => c.nom === nom);
    if (c && qty > 0) {
      c.stock = Math.max(0, c.stock - qty);
      App.data.mouvementsStock.push({ id: crypto.randomUUID(), date: new Date().toISOString(), consommable: nom, type: 'sortie', quantite: qty, motif: 'Production' });
    }
  },

  getReconditionnementConsumption(entry) {
    if (!entry || (entry.activite || 'reconditionnement') !== 'reconditionnement') return {};
    const cons = {};
    if (entry.intrants) {
      entry.intrants.forEach(it => {
        if (it.article && it.qte > 0) {
          cons[it.article] = (cons[it.article] || 0) + it.qte;
        }
      });
    }
    return cons;
  },

  consumeStock(consumption, motif) {
    if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
    Object.entries(consumption).forEach(([nom, qty]) => {
      let c = App.data.consommables.find(item => item.nom === nom);
      if (!c && qty > 0) {
        c = { id: App.nextId(App.data.consommables), nom: nom, unite: 'pièce', stock: 0, seuilCritique: 0, seuilAlerte: 0, prixUnitaire: 0 };
        App.data.consommables.push(c);
      }
      if (c && qty > 0) {
        c.stock = c.stock - qty;
        App.data.mouvementsStock.push({ id: crypto.randomUUID(), date: new Date().toISOString(), consommable: nom, type: 'sortie', quantite: qty, motif });
      }
    });
  },

  restoreConsumption(consumption, motif) {
    if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
    Object.entries(consumption).forEach(([nom, qty]) => {
      let c = App.data.consommables.find(item => item.nom === nom);
      if (!c && qty > 0) {
        c = { id: App.nextId(App.data.consommables), nom: nom, unite: 'pièce', stock: 0, seuilCritique: 0, seuilAlerte: 0, prixUnitaire: 0 };
        App.data.consommables.push(c);
      }
      if (c && qty > 0) {
        c.stock += qty;
        App.data.mouvementsStock.push({ id: crypto.randomUUID(), date: new Date().toISOString(), consommable: nom, type: 'entree', quantite: qty, motif });
      }
    });
  },

  editEntry(id) {
    try {
      const entry = App.data.production.find(p => p.id == id);
      if (entry) {
        if (entry.activite === 'traitement' || entry.activite === 'divers') this.showTraitementForm(entry);
        else this.showForm(entry);
        
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.warn("Entry not found for ID:", id);
        App.toast("Impossible de trouver cette saisie (ID: " + id + ")", "error");
      }
    } catch (err) {
      console.error("Error in editEntry:", err);
      App.toast("Erreur lors de l'ouverture de la saisie", "error");
    }
  },

  async deleteEntry(id) {
    if (!confirm('Supprimer cette saisie ?')) return;
    const entry = App.data.production.find(p => p.id == id);
    if (entry) {
      this.restoreConsumption(this.getReconditionnementConsumption(entry), `Annulation saisie #${id}`);
    }
    App.data.production = App.data.production.filter(p => p.id != id);
    
    // Cloud sync deletion
    await App.deleteFromCloud('production', id);
    
    App.saveData();
    this.render();
    App.toast('Saisie supprimée', 'info');
  },

  toggleAllBatchSelection(e) {
    const isChecked = e.target.checked;
    const cbs = document.querySelectorAll('.batch-select-cb:not([disabled])');
    cbs.forEach(cb => cb.checked = isChecked);
  },

  async confirmBatchDelete() {
    const cbs = document.querySelectorAll('.batch-select-cb:checked');
    if (cbs.length === 0) {
      App.toast("Veuillez sélectionner au moins une saisie à supprimer.", "error");
      return;
    }
    
    if (!confirm(`Voulez-vous vraiment supprimer ces ${cbs.length} saisies ? Cette action est irréversible.`)) return;
    
    let deleteCount = 0;
    
    for (const cb of cbs) {
      const id = cb.value;
      const entry = App.data.production.find(p => p.id == id);
      if (entry) {
        this.restoreConsumption(this.getReconditionnementConsumption(entry), `Annulation saisie #${id}`);
      }
      App.data.production = App.data.production.filter(p => p.id != id);
      await App.deleteFromCloud('production', id);
      deleteCount++;
    }
    
    App.saveData();
    this.render();
    App.toast(`${deleteCount} saisie(s) supprimée(s) avec succès.`, 'success');
  },

  confirmBatchSend() {
    const cbs = document.querySelectorAll('.batch-select-cb:checked');
    if (cbs.length === 0) {
      App.toast("Veuillez sélectionner au moins une saisie à transférer.", "error");
      return;
    }
    
    if (!confirm(`Voulez-vous vraiment transférer ces ${cbs.length} saisies vers le stockage ?`)) return;
    
    let transferCount = 0;
    if (!App.data.pendingStorageEntries) App.data.pendingStorageEntries = [];

    cbs.forEach(cb => {
      const id = cb.value;
      const p = App.data.production.find(x => x.id === id);
      if (p && !p.sentToStorage && (p.poidsBrutPF > 0)) {
        const chambre = 'chambre1'; // Default to chambre 1 for batch
        const activiteLabel = (p.activite === 'traitement') ? 'Traitement' : (p.activite === 'reconditionnement' ? 'Reconditionnement' : p.activite);
        
        let sourceBateau = '';
        let sourceFournisseur = '';
        if (p.receptionId) {
          const originalRec = (App.data.stockage || []).find(s => s.id === p.receptionId);
          if (originalRec) {
            sourceBateau = originalRec.bateau || '';
            sourceFournisseur = originalRec.fournisseur || '';
          }
        }

        const pendingEntry = {
          id: App.nextId(App.data.pendingStorageEntries),
          productionId: p.id,
          activite: p.activite,
          origine: activiteLabel,
          dateEnvoi: new Date().toISOString().split('T')[0],
          dateProd: p.date,
          client: p.client || 'Interne',
          espece: p.espece || '',
          calibre: p.calibre || '',
          produitFini: p.produitFini || '',
          poidsPF: p.poidsBrutPF || 0,
          caissesPF: p.caissesPF || 0,
          conditionnement: p.conditionnement || '',
          chambreDestination: chambre,
          receptionId: p.receptionId || null,
          bateau: sourceBateau,
          fournisseur: sourceFournisseur,
          rendement: p.rendement || 0,
          prixRevient: p.prixRevient || 0,
          poidsMP: p.poidsMP || p.poidsBrutPI || 0,
          valeurMP: p.valeurMP || 0,
          totalIntrants: p.totalIntrants || 0,
          phases: p.phases || [],
          phasesPF: p.phasesPF || [],
          intrants: p.intrants || [],
          status: 'pending'
        };

        App.data.pendingStorageEntries.push(pendingEntry);

        // Mark the production entry
        p.sentToStorage = true;
        p.sentToStorageDate = new Date().toISOString();
        p.sentToChambre = chambre;
        transferCount++;
      }
    });

    if (transferCount > 0) {
      App.saveData();
      this.render();
      App.toast(`${transferCount} saisies ont été marquées pour transfert.`, "success");
    } else {
      App.toast("Aucune saisie valide n'a pu être transférée.", "info");
    }
  },

  switchActivite(act) {
    this.currentActivite = act;
    this.render();
  },

  onPeriodChange(e) {
    const val = e.target.value;
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    this.selectedYear = y;
    this.selectedMonth = m - 1;
    this.render();
  },

  onQuarterChange(year, q) {
    this.selectedYear = parseInt(year);
    this.selectedQuarter = parseInt(q);
    this.render();
  },

  showNewForm() {
    if (this.currentActivite === 'reconditionnement') this.showForm();
    else this.showTraitementForm();
  },

  showTraitementForm(entry = null) {
    this.editingId = entry ? entry.id : null;
    const act = entry?.activite || this.currentActivite;
    const label = act === 'traitement' ? '🔧 Traitement' : '📋 Divers';
    const receptions = (App.data.stockage || []).map(s => `<option value="${s.id}" ${entry?.receptionId===s.id?'selected':''}>${s.reference} — ${s.client} (${App.formatDateFR(s.dateEntree)})</option>`).join('');
    const phases = entry?.phases || [
      { nom: 'Décongélation', seuil: 97, qteInit: 0, qteFinale: 0 },
      { nom: 'Nettoyage', seuil: 77, qteInit: 0, qteFinale: 0 }
    ];
    const phasesPF = entry?.phasesPF || [
      { nom: 'Trempage', seuil: 110, qteInit: 0, qteFinale: 0 },
      { nom: 'Congélation', seuil: 100, qteInit: 0, qteFinale: 0 },
      { nom: 'Glasurage', seuil: 107, qteInit: 0, qteFinale: 0 },
      { nom: 'Emballage', seuil: 100, qteInit: 0, qteFinale: 0 }
    ];
    const conditionnement = entry?.conditionnement || 'C12S1000';
    const intrants = entry?.intrants || [];
    const isSent = entry?.sentToStorage === true;
    const initialPrixMP = entry?.prixMP !== undefined
      ? entry.prixMP
      : (entry?.poidsMP > 0 && entry?.valeurMP ? entry.valeurMP / entry.poidsMP : '');

    const container = document.getElementById('saisieFormContainer');
    container.innerHTML = `
      <div class="card slide-up" style="margin-bottom:22px; ${isSent ? 'border-left: 5px solid var(--status-warning);' : ''}">
        <div class="card-header" style="background:var(--bg-card);border-radius:var(--radius-md) var(--radius-md) 0 0;display:flex;justify-content:space-between;align-items:center;padding:1.5rem;">
          <span class="card-title" style="color:var(--primary-color);font-size:1.2rem;font-weight:700;">
            ${isSent ? '🔒 Voir la saisie (Lecture seule)' : (entry ? '✏️ Modifier' : '📝 Nouvelle saisie')} 
            <span style="opacity:0.8;font-weight:500;color:var(--text-muted);font-size:1rem">— ${label}</span>
          </span>
          <button class="btn-icon" style="background:var(--bg-app);" onclick="Saisie.hideForm()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="card-body">
          ${isSent ? `
            <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:12px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.4rem;">⚠️</span>
              <div>
                <div style="font-weight:700; color:var(--status-warning);">Saisie verrouillée</div>
                <div style="font-size:0.85rem; color:var(--text-secondary);">Cette fiche a été envoyée au stockage. Elle n'est plus modifiable.</div>
              </div>
            </div>
          ` : ''}

          <fieldset ${isSent ? 'disabled style="border:none; padding:0; margin:0;"' : 'style="border:none; padding:0; margin:0;"'}>
            <div class="form-section">
              <div class="form-section-title">🔹 Liaison réception & infos</div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Réception (stockage) *</label><select class="form-select" id="tReception" onchange="Saisie.onReceptionChange()">${receptions}</select></div>
                <div class="form-group"><label class="form-label">Date *</label><input type="date" class="form-input" id="tDate" value="${entry?App.formatDate(entry.date):this.selectedDay}"></div>
                <div class="form-group"><label class="form-label">Client</label><input type="text" class="form-input" id="tClient" value="${entry?.client||''}" oninput="Saisie.refreshQR()"></div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;"><span>🔹 Phases matière première</span><button class="btn btn-sm btn-outline" onclick="Saisie.addPhase('tPhasesMP')" ${isSent ? 'disabled' : ''}>+ Phase</button></div>
              <table><thead><tr><th>Phase</th><th>Seuil %</th><th>Qté initiale</th><th>Qté finale</th><th>Rend. phase</th><th>Rend. final</th><th style="width:30px"></th></tr></thead>
              <tbody id="tPhasesMP">${phases.map((ph,i)=>`<tr draggable="true" ondragstart="Saisie.onPhaseDragStart(event, this)" ondragover="Saisie.onPhaseDragOver(event)" ondrop="Saisie.onPhaseDrop(event, this, 'tPhasesMP')">
                <td><select class="form-select" style="width:160px;padding:5px;font-weight:700;cursor:grab;" data-ph="nom" ${isSent ? 'disabled' : ''}>${Saisie.phasesList.map(p=>`<option value="${p}" ${ph.nom===p?'selected':''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="${ph.seuil}" data-ph="seuil" data-idx="${i}" onchange="Saisie.calcT()" ${isSent ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteInit||''}" data-ph="qteInit" data-idx="${i}" onchange="Saisie.calcT()" ${isSent ? 'disabled' : ''}></td>
                <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteFinale||''}" data-ph="qteFinale" data-idx="${i}" onchange="Saisie.calcT()" ${isSent ? 'disabled' : ''}></td>
                <td class="td-right td-bold" id="rendPhMP${i}">0%</td>
                <td class="td-right" id="rendCumMP${i}">0%</td>
                <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removePhase(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
              </tr>`).join('')}</tbody></table>
            </div>

            <div class="form-section">
              <div class="form-section-title">🔹 Matière première</div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Espèce</label>
                  <div style="display:flex;gap:6px;">
                    <select class="form-select" id="tEspece" onchange="Saisie.onEspeceChange('tEspece', 'tCalibre'); Saisie.refreshQR()" style="flex:1">
                      ${App.data.especes.map(e => `<option value="${e.nom}" ${entry && entry.espece===e.nom ? 'selected' : ''}>${e.nom}</option>`).join('')}
                    </select>
                    <button class="btn btn-purple btn-sm" onclick="document.querySelector('#saisieFormContainer input[type=file]').click()" title="Analyser une fiche pour cette espèce">📸 IA</button>
                    <input type="file" accept="image/*,application/pdf" style="display:none" onchange="Saisie.processAIAnalysis(event)">
                    <button class="btn btn-primary btn-sm" onclick="Saisie.scanForForm('tEspece', 'tCalibre')" title="Scanner QR">📷</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Calibre</label>
                  <select class="form-select" id="tCalibre" onchange="Saisie.refreshQR()">
                    <!-- Filled dynamically -->
                  </select>
                </div>
                <div class="form-group"><label class="form-label">Poids net total MP (kg)</label><input type="number" step="0.01" class="form-input" id="tPoidsMP" value="${entry?.poidsMP||''}" onchange="Saisie.calcT()"></div>
                <div class="form-group"><label class="form-label">Prix moyen (DH/kg)</label><input type="number" step="0.01" class="form-input" id="tPrixMoyen" value="${initialPrixMP}" onchange="Saisie.calcT()" placeholder="Ex: 40"></div>
                <div class="form-group"><label class="form-label">Valeur MP (DH)</label><div class="form-computed" id="tValeurMP">0.00</div></div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;"><span>🔹 Phases produits finis</span><button class="btn btn-sm btn-outline" onclick="Saisie.addPhase('tPhasesPF')" ${isSent ? 'disabled' : ''}>+ Phase</button></div>
              <table><thead><tr><th>Phase</th><th>Seuil %</th><th>Qté initiale</th><th>Qté finale</th><th>Rend. phase</th><th>Rend. cumulé</th><th style="width:30px"></th></tr></thead>
              <tbody id="tPhasesPF">${phasesPF.map((ph,i)=>`<tr>
                <td><select class="form-select" style="width:160px;padding:5px;font-weight:700" data-ph="nom">${Saisie.phasesList.map(p=>`<option value="${p}" ${ph.nom===p?'selected':''}>${p}</option>`).join('')}</select></td>
                <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="${ph.seuil}" data-ph="seuil" data-idx="${i}" onchange="Saisie.calcT()"></td>
                <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteInit||''}" data-ph="qteInit" data-idx="${i}" onchange="Saisie.calcT()"></td>
                <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteFinale||''}" data-ph="qteFinale" data-idx="${i}" onchange="Saisie.calcT()"></td>
                <td class="td-right td-bold" id="rendPhPF${i}">0%</td>
                <td class="td-right" id="rendCumPF${i}">0%</td>
                <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removePhase(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
              </tr>`).join('')}</tbody></table>
            </div>

            <div class="form-section">
              <div class="form-section-title">🔹 Produits finis</div>
              <div class="form-grid">
                <div class="form-group"><label class="form-label">Produit fini</label><input type="text" class="form-input" id="tProduitFini" value="${entry?.produitFini||''}" placeholder="Ex: TUBE DE CALAMAR"></div>
                <div class="form-group"><label class="form-label">Poids net PF (kg)</label><input type="number" step="0.01" class="form-input" id="tPoidsPF" value="${entry?.poidsBrutPF||''}" onchange="Saisie.calcT()"></div>
                <div class="form-group"><label class="form-label">Nb Caisses PF</label><input type="number" class="form-input" id="tCaissesPF" value="${entry?.caissesPF||''}"></div>
                <div class="form-group"><label class="form-label">Conditionnement</label><select class="form-select" id="tConditionnement" onchange="Saisie.onConditionnementChange()">${Saisie.emballagesList.map(e=>`<option value="${e.code}" ${conditionnement===e.code?'selected':''}>${e.code} — ${e.designation}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label">Rendement global</label><div class="form-computed" id="tRendement">0.00%</div></div>
                <div class="form-group"><label class="form-label">Coût matière révisé</label><div class="form-computed" id="tCoutMatiere">0.00 DH</div></div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🔹 Main-d'œuvre</span>
                <button class="btn btn-sm btn-outline" onclick="Saisie.addEquipeMO('tEquipesMO')" ${isSent ? 'disabled' : ''}>+ Ajouter Équipe</button>
              </div>
              <div style="margin-bottom: 12px; padding: 10px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid rgba(99,102,241,0.2);">
                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">Période d'Allocation des Coûts MO</label>
                <select id="tAllocationPeriod" class="form-select" style="max-width: 300px; border-color: var(--accent-blue);" onchange="Saisie.calcT()">
                  <option value="day" ${entry?.allocationPeriod === 'day' ? 'selected' : ''}>Journalière (Présence du jour)</option>
                  <option value="month" ${(entry?.allocationPeriod === 'month' || !entry?.allocationPeriod) ? 'selected' : ''}>Mensuelle (Mois en cours)</option>
                  <option value="quarter" ${entry?.allocationPeriod === 'quarter' ? 'selected' : ''}>Trimestrielle (3 mois fixes)</option>
                  <option value="year" ${entry?.allocationPeriod === 'year' ? 'selected' : ''}>Annuelle (12 mois fixes)</option>
                </select>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
                  Sert à diviser la masse salariale totale de la période choisie sur le tonnage total de cette même période.
                </div>
              </div>
              
              <div style="margin-bottom:15px;">
                <div style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary);">Personnel Fixe (Allocation mensuelle)</div>
                <div class="form-grid">
                  <div class="form-group"><label class="form-label">Heures M.O. Fixe</label><input type="number" step="0.5" class="form-input" id="tHeuresMOF" value="${entry?entry.heuresMOF||8:8}" onchange="Saisie.calcT()"></div>
                  <div class="form-group"><label class="form-label">Salaire H/F (Base 191h)</label><input type="number" step="0.01" class="form-input" id="tSalaireHF" value="${entry?entry.salaireHF||22.1:22.1}" onchange="Saisie.calcT()"></div>
                  <div class="form-group"><label class="form-label">Coût Personnel Fixe</label><div class="form-computed" id="tCoutPF">0.00 DH</div></div>
                </div>
              </div>

              <div style="font-size:0.9rem;font-weight:600;margin-bottom:8px;color:var(--text-secondary);">Équipes Occasionnelles</div>
              <table><thead><tr><th>Profil</th><th>Nb personnes</th><th>Heures/pers.</th><th>Taux Hor. (DH)</th><th>Coût Total</th><th style="width:30px"></th></tr></thead>
              <tbody id="tEquipesMO">${(entry?.equipesMO || [{profil: 'Ouvrière', nb: 1, heures: 8, taux: App.data.parametres.salaireHoraireOcc}]).map((eq,i)=>`<tr>
                <td><input type="text" class="form-input" style="width:140px;padding:5px;font-weight:600" value="${eq.profil}" data-mo="profil"></td>
                <td><input type="number" class="form-input" style="width:70px;padding:5px" value="${eq.nb}" data-mo="nb" onchange="Saisie.calcT()"></td>
                <td><input type="number" step="0.5" class="form-input" style="width:70px;padding:5px" value="${eq.heures}" data-mo="heures" onchange="Saisie.calcT()"></td>
                <td><input type="number" step="0.01" class="form-input" style="width:80px;padding:5px" value="${eq.taux || App.data.parametres.salaireHoraireOcc}" data-mo="taux" onchange="Saisie.calcT()"></td>
                <td class="td-right td-bold" id="tCoutEq${i}">0.00</td>
                <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removeEquipeMO(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
              </tr>`).join('')}
              <tr style="background:rgba(99,102,241,0.05)"><td colspan="4" class="td-bold">Total M.O. Occasionnelle</td><td class="td-right td-bold" id="tCoutMOO">0.00 DH</td><td></td></tr>
              </tbody></table>

              <div style="margin-top:12px;padding:14px;background:rgba(99,102,241,0.08);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:var(--text-secondary);">COÛT M.O. TOTAL / JOUR</span>
                <span class="form-computed" id="tCoutMOJ" style="font-size:1.2rem;border:none;padding:0;">0.00 DH</span>
              </div>
              <div id="tAllocationMOInfo" style="margin-top:8px;padding:12px;background:rgba(99,102,241,0.05);border-radius:8px;border-left:4px solid var(--accent-blue);display:none;"></div>
              <div id="tAllocationEnergieInfo" style="margin-top:8px;padding:12px;background:rgba(234,179,8,0.05);border-radius:8px;border-left:4px solid #eab308;display:none;"></div>
            </div>

            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🔹 Intrants</span>
                <div style="display:flex;gap:6px;align-items:center;">
                  <select class="form-select" id="tIntrantSelect" style="width:220px;padding:6px;font-size:0.82rem" ${isSent ? 'disabled' : ''}>
                    <optgroup label="── SACHET ──">${Saisie.intrantsMaster.filter(i=>i.famille==='SACHET').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── PLASTIQUE / SAC ──">${Saisie.intrantsMaster.filter(i=>i.famille==='PLASTIQUE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── CARTON ──">${Saisie.intrantsMaster.filter(i=>i.famille==='CARTON').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── ETIQUETTE ──">${Saisie.intrantsMaster.filter(i=>i.famille==='ETIQUETTE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── EMBALLAGE ──">${Saisie.intrantsMaster.filter(i=>i.famille==='EMBALLAGE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── INTRANT ──">${Saisie.intrantsMaster.filter(i=>i.famille==='INTRANT').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── EQUIPEMENT ──">${Saisie.intrantsMaster.filter(i=>i.famille==='EQUIPEMENT').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── FOURNITURES ──">${Saisie.intrantsMaster.filter(i=>i.famille==='FOURNITURES').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                    <optgroup label="── DIVERS ──">${Saisie.intrantsMaster.filter(i=>i.famille==='DIVERS'||i.famille==='EAU-ELEC'||i.famille==='SERVICE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  </select>
                  <button class="btn btn-success btn-sm" onclick="Saisie.addIntrantFromList()" ${isSent ? 'disabled' : ''}>+ Ajouter</button>
                </div>
              </div>
              <table><thead><tr><th>Article</th><th>Quantité</th><th>Prix unit. (DH)</th><th>Valeur (DH)</th><th style="width:30px"></th></tr></thead>
              <tbody id="tIntrants">${intrants.map((it, i) => Saisie.renderIntrantRow(it, i, isSent)).join('')}
              <tr style="background:rgba(99,102,241,0.1)"><td colspan="4" class="td-bold">Total intrants</td><td class="td-right td-bold" id="tTotalIntrants">0.00 DH</td></tr>
              </tbody></table>
            </div>

            <div class="summary-box">
              <h3 style="margin-bottom:14px;">📊 Résumé</h3>
              <div class="summary-row"><span class="summary-label">Rendement produits</span><span class="summary-value" id="sumRendement">0%</span></div>
              <div class="summary-row"><span class="summary-label">Rendement phase finale</span><span class="summary-value" id="sumRendFinal">0%</span></div>
              <div class="summary-row"><span class="summary-label">Coût Main-d'œuvre</span><span class="summary-value" id="sumMO">0 DH</span></div>
              <div class="summary-row"><span class="summary-label">Total intrants</span><span class="summary-value" id="sumIntrants">0 DH</span></div>
              <div class="summary-row"><span class="summary-label">Prix de revient global</span><span class="summary-value summary-total" id="sumPrixRevient">0 DH/kg</span></div>
            </div>

            <div class="form-section" style="margin-top:14px;">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🏷️ QR Code du lot</span>
                <button class="btn btn-sm btn-outline" onclick="Saisie.refreshQR()" style="font-size:0.78rem;" ${isSent ? 'disabled' : ''}>🔄 Actualiser</button>
              </div>
              <div id="saisieQRArea" style="padding:12px;text-align:center;">
                <div style="color:var(--text-muted);font-size:0.85rem;">Sélectionnez Client & Espèce pour afficher le QR Code associé</div>
              </div>
            </div>
          </fieldset>

          <div style="margin-top:30px; display:flex; gap:15px; justify-content:center; padding: 25px 0; border-top: 1px solid var(--border-color);">
            <button class="btn btn-outline" style="min-width: 150px;" onclick="Saisie.hideForm()">${isSent ? 'Fermer' : 'Annuler'}</button>
            ${!isSent ? `
              <button class="btn btn-primary" style="min-width: 250px; font-size: 1.1rem; box-shadow: var(--shadow-glow-purple);" onclick="Saisie.saveTraitement()">
                💾 ${entry ? 'Mettre à jour la saisie' : 'Enregistrer la saisie'}
              </button>
            ` : ''}
            ${entry && !isSent ? `
              <button class="btn btn-success" style="min-width: 250px; font-size: 1.1rem; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);" onclick="Saisie.showSendToStorageModal('${entry.id}', 'Traitement')">
                📦 Valider vers Stockage
              </button>
            ` : ''}
          </div>
        </div>
      </div>`;
    this.onEspeceChange('tEspece', 'tCalibre', entry?.calibre);
    this.calcT();
    this.refreshQR();
  },

  onReceptionChange() {
    const recId = parseInt(document.getElementById('tReception')?.value) || 0;
    if (!recId) return;
    const reception = (App.data.stockage || []).find(s => s.id === recId);
    if (!reception || !reception.lignes || reception.lignes.length === 0) return;
    
    const line = reception.lignes[0];
    
    const espSelect = document.getElementById('tEspece');
    if (espSelect) {
      espSelect.value = line.espece || '';
      this.onEspeceChange('tEspece', 'tCalibre', line.calibre);
    }
    
    const poidsMP = document.getElementById('tPoidsMP');
    if (poidsMP) poidsMP.value = line.pdsNetTotal || '';
    
    const client = document.getElementById('tClient');
    if (client) client.value = reception.client || '';
    this.refreshQR();
    
    // Fill first phase qteInit
    const firstPhaseRow = document.querySelector('#tPhasesMP tr');
    if (firstPhaseRow) {
      const qteInitInput = firstPhaseRow.querySelector('[data-ph="qteInit"]');
      if (qteInitInput) qteInitInput.value = line.pdsNetTotal || '';
    }
    
    this.calcT();
  },

  calcT() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const poidsMP = v('tPoidsMP');
    const prixMP = v('tPrixMoyen');
    const valeurMP = poidsMP * prixMP;
    const poidsPF = v('tPoidsPF');
    const valeurEl = document.getElementById('tValeurMP');
    if (valeurEl) valeurEl.textContent = App.formatNumber(valeurMP, 2);

    // Phases MP — cascade: phase i>0 gets qteInit = previous phase qteFinale
    let prevQF_MP = poidsMP;
    const mpRows = document.querySelectorAll('#tPhasesMP tr');
    mpRows.forEach((row,i) => {
      const qiInput = row.querySelector('[data-ph="qteInit"]');
      // Phase 0: fill with poidsMP if empty; Phase i>0: always fill with previous qteFinale
      if (qiInput) {
        if (i === 0 && poidsMP > 0) {
          qiInput.value = poidsMP;
        } else if (i > 0) {
          if (!qiInput.value || qiInput.value == "0") {
            qiInput.value = prevQF_MP || '';
          }
        }
      }
      const qi = parseFloat(qiInput?.value)||0;
      const qf = parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0;
      prevQF_MP = qf || qi; // if no qteFinale yet, carry forward qteInit
      
      const rp = qi>0 ? (qf/qi*100) : 0;
      const rc = poidsMP>0 ? (qf/poidsMP*100) : 0;
      const elPh = document.getElementById('rendPhMP'+i);
      const elCum = document.getElementById('rendCumMP'+i);
      if(elPh) elPh.textContent = App.formatNumber(rp,2)+'%';
      if(elCum) elCum.textContent = App.formatNumber(rc,2)+'%';
    });

    // Phases PF — cascade: phase 0 gets last MP qteFinale, phase i>0 gets previous PF qteFinale
    let prevQF_PF = prevQF_MP;
    const pfCalcRows = document.querySelectorAll('#tPhasesPF tr');
    pfCalcRows.forEach((row,i) => {
      const qiInput = row.querySelector('[data-ph="qteInit"]');
      if (qiInput) {
        if (i === 0) {
          // First PF phase: always gets the last MP phase's qteFinale
          qiInput.value = prevQF_PF || '';
        } else {
          // Subsequent PF phases: gets previous PF phase's qteFinale
          if (!qiInput.value || qiInput.value == "0") {
            qiInput.value = prevQF_PF || '';
          }
        }
      }
      const qi = parseFloat(qiInput?.value)||0;
      const qf = parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0;
      prevQF_PF = qf || qi;
      
      const rp = qi>0 ? (qf/qi*100) : 0;
      const rc = poidsMP>0 ? (qf/poidsMP*100) : 0;
      const elPh = document.getElementById('rendPhPF'+i);
      const elCum = document.getElementById('rendCumPF'+i);
      if(elPh) elPh.textContent = App.formatNumber(rp,2)+'%';
      if(elCum) elCum.textContent = App.formatNumber(rc,2)+'%';
    });

    // Update Poids PF automatically from last PF phase's qteFinale
    const lastPFRow = pfCalcRows.length > 0 ? pfCalcRows[pfCalcRows.length-1] : null;
    const lastPFqf = lastPFRow ? (parseFloat(lastPFRow.querySelector('[data-ph="qteFinale"]')?.value)||0) : 0;
    const currentPoidsPF = lastPFqf > 0 ? lastPFqf : poidsPF;
    const poidsPFInput = document.getElementById('tPoidsPF');
    if (poidsPFInput && lastPFqf > 0) {
      poidsPFInput.value = lastPFqf;
    }

    // Update rendCumPF
    pfCalcRows.forEach((row,i) => {
      const qf = parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0;
      const elCum = document.getElementById('rendCumPF'+i);
      if(elCum) elCum.textContent = currentPoidsPF>0 ? App.formatNumber(qf/currentPoidsPF*100,2)+'%' : '0%';
    });

    const rendement = poidsMP>0 ? (currentPoidsPF/poidsMP*100) : 0;
    document.getElementById('tRendement').textContent = App.formatNumber(rendement,2)+'%';
    const coutMatiere = currentPoidsPF>0 ? valeurMP/currentPoidsPF : 0;
    document.getElementById('tCoutMatiere').textContent = App.formatNumber(coutMatiere,2)+' DH';

    // ═══════════════════════════════════════════════════════
    // INTRANTS — Calcul automatique basé sur le conditionnement
    // Ex: C12S1000 → Carton 12kg, Sachet 1000g (1kg)
    //   nbCartons = PoidsPF / 12
    //   sachetsParCarton = 12 / 1 = 12
    //   étiquettes par carton = 12 sachets + 1 carton = 13
    //   totalEtiquettes = nbCartons × 13
    //   nbRouleaux = totalEtiquettes / 1000 (prix 45 DH/rouleau)
    //   nbToners = nbRouleaux / 4 (prix 78 DH/toner)
    // ═══════════════════════════════════════════════════════
    const condCode = document.getElementById('tConditionnement')?.value || '';
    const condMatch = condCode.match(/^C(\d+)S(\d+)$/);
    let nbCartons = 0;
    let nbSachetsTotal = 0;
    let totalEtiquettes = 0;
    let nbRouleaux = 0;
    let nbToners = 0;
    
    if (condMatch && currentPoidsPF > 0) {
      const cartonKg = parseFloat(condMatch[1]);   // ex: 12 (kg)
      const sachetG = parseFloat(condMatch[2]);      // ex: 1000 (g)
      const sachetKg = sachetG / 1000;               // ex: 1 (kg)
      const sachetsParCarton = cartonKg / sachetKg;   // ex: 12
      
      nbCartons = Math.ceil(currentPoidsPF / cartonKg);  // ex: 2700/12 = 225
      nbSachetsTotal = nbCartons * sachetsParCarton;      // ex: 225 * 12 = 2700
      
      // Étiquettes: chaque sachet + chaque carton = sachetsParCarton + 1 par carton
      const etiqParCarton = sachetsParCarton + 1;         // ex: 13
      totalEtiquettes = nbCartons * etiqParCarton;        // ex: 225 * 13 = 2925
      
      // Rouleaux d'étiquettes (1000 étiquettes/rouleau, 45 DH/rouleau)
      nbRouleaux = totalEtiquettes / 1000;                // ex: 2.925
      
      // Toner noir = 1/4 de la consommation des étiquettes (78 DH/toner)
      nbToners = nbRouleaux / 4;                          // ex: 0.731
      
      const caissesPFInput = document.getElementById('tCaissesPF');
      if (caissesPFInput && (!parseFloat(caissesPFInput.value) || caissesPFInput.value == "")) {
        caissesPFInput.value = nbCartons;
      }
    }

    // Find initial weight for TREMPAGE
    let refWeight = poidsMP;
    document.querySelectorAll('#tPhasesMP tr, #tPhasesPF tr').forEach(row => {
      const nomInput = row.querySelector('[data-ph="nom"]');
      if (nomInput && nomInput.value.toUpperCase().includes('TREMPAGE')) {
        const qi = parseFloat(row.querySelector('[data-ph="qteInit"]')?.value);
        if (qi > 0) refWeight = qi;
      }
    });

    let totalInt = 0;
    document.querySelectorAll('#tIntrants tr').forEach((row,i) => {
      const artInput = row.querySelector('[data-int="article"]');
      const qteInput = row.querySelector('[data-int="qte"]');
      const prixInput = row.querySelector('[data-int="prix"]');
      if (!artInput || !qteInput) return;
      
      const art = artInput.value.toUpperCase();
      
      // Auto-fill quantities based on article type
      if (refWeight > 0 && art.includes('AGRAFISH')) {
        qteInput.value = (refWeight / 100 * 1).toFixed(3);
      } else if (refWeight > 0 && art.includes('HYDROMAR')) {
        qteInput.value = (refWeight / 100 * 1).toFixed(3);
      } else if (refWeight > 0 && (art === 'SEL' || art.includes('SEL ') || art.startsWith('SEL'))) {
        qteInput.value = (refWeight / 100 * 0.5).toFixed(3);
      } else if (condMatch && currentPoidsPF > 0) {
        if (art.includes('CARTON')) {
          qteInput.value = nbCartons;
        } else if (art.includes('SACHET')) {
          qteInput.value = nbSachetsTotal;
        } else if (art.includes('50') && art.includes('75') || art.includes('ETIQUETTE') && !art.includes('NOIR')) {
          // Étiquettes normales (rouleaux)
          qteInput.value = nbRouleaux.toFixed(3);
          if (prixInput && !parseFloat(prixInput.value)) prixInput.value = 45;
        } else if (art.includes('NOIR') || art.includes('TONER')) {
          // Étiquettes noir / toner
          qteInput.value = nbToners.toFixed(3);
          if (prixInput && !parseFloat(prixInput.value)) prixInput.value = 78;
        }
      }
      
      const q = parseFloat(qteInput?.value)||0;
      const p = parseFloat(prixInput?.value)||0;
      const val = q*p;
      totalInt += val;
      const el = document.getElementById('intVal'+i);
      if(el) el.textContent = App.formatNumber(val,2);
    });
    document.getElementById('tTotalIntrants').textContent = App.formatNumber(totalInt,2)+' DH';

    document.getElementById('sumRendement').textContent = App.formatNumber(rendement,2)+'%';
    document.getElementById('sumIntrants').textContent = App.formatNumber(totalInt,0)+' DH';
    
    // --- Calcul Impact Facturation Intelligent (Traitement) ---
    const dateStr = document.getElementById('tDate')?.value || '';
    const monthStr = dateStr ? dateStr.substring(0, 7) : new Date().toISOString().substring(0, 7);
    
    // 1. Tonnages
    const allProdMois = (App.data.production || []).filter(p => (p.date||'').startsWith(monthStr));
    const totalKgUsine = allProdMois.reduce((s, p) => s + (p.poidsBrutPF || 0), 0) + currentPoidsPF;
    const totalKgActivite = allProdMois.filter(p => p.activite === 'traitement' && p.id !== Saisie.editingId).reduce((s, p) => s + (p.poidsBrutPF || 0), 0) + currentPoidsPF;

    // 2. Factures
    const facturesMois = (App.data.factures || []).filter(f => (f.date||'').startsWith(monthStr));
    
    // Charges spécifiques (Traitement + Emballage pour le traitement)
    const chargesSpecifiques = facturesMois.filter(f => f.allocation === 'traitement' || f.allocation === 'emballage').reduce((s, f) => s + (f.montant||0), 0);
    const impactSpecifique = totalKgActivite > 0 ? (chargesSpecifiques / totalKgActivite) : 0;

    // Charges générales
    const chargesGenerales = facturesMois.filter(f => f.allocation === 'general' || !f.allocation).reduce((s, f) => s + (f.montant||0), 0);
    const impactGeneral = totalKgUsine > 0 ? (chargesGenerales / totalKgUsine) : 0;

    let coutFactureParKg = impactSpecifique + impactGeneral;
    let isEstime = false;
    if (coutFactureParKg === 0) {
        coutFactureParKg = App.data.parametres.coutStructureEstime || 1.5;
        isEstime = true;
    }
    // ---------------------------------

    // MAIN D'OEUVRE
    let coutMOO = 0;
    document.querySelectorAll('#tEquipesMO tr:not(:last-child)').forEach((row, i) => {
      const nb = parseFloat(row.querySelector('[data-mo="nb"]')?.value) || 0;
      const heures = parseFloat(row.querySelector('[data-mo="heures"]')?.value) || 0;
      const taux = parseFloat(row.querySelector('[data-mo="taux"]')?.value) || 0;
      const val = nb * heures * taux;
      const valEl = document.getElementById('tCoutEq' + i);
      if (valEl) valEl.textContent = App.formatNumber(val);
      coutMOO += val;
    });
    const coutPF = v('tHeuresMOF') * v('tSalaireHF');
    const localCost = coutMOO + coutPF;

    // Dynamic Labor Cost Allocation (Traitement)
    const allocationPeriod = document.getElementById('tAllocationPeriod')?.value || 'month';
    const pesos = App.getPeriodLaborCostAllocation(dateStr, currentPoidsPF, Saisie.editingId, allocationPeriod);
    
    let coutMOJ = localCost;
    const infoEl = document.getElementById('tAllocationMOInfo');
    if (infoEl) {
      if (pesos.fallback) {
        infoEl.style.display = 'block';
        infoEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; color:var(--status-warning);">
            <div style="font-weight:700; display:flex; align-items:center; gap:4px;">⚠️ Mode Repli Activé</div>
            <div style="color:var(--text-secondary);">Aucune donnée de pointage ou de tonnage pour la période <strong>${pesos.targetMonths.join(', ')}</strong>. Calcul basé sur les équipes locales de la fiche.</div>
          </div>
        `;
      } else {
        infoEl.style.display = 'block';
        let labelPeriode = 'Mensuelle';
        if (allocationPeriod === 'day') labelPeriode = 'Journalière';
        else if (allocationPeriod === 'quarter') labelPeriode = 'Trimestrielle';
        else if (allocationPeriod === 'year') labelPeriode = 'Annuelle';

        let labelMasse = 'Masse Salariale Période';
        let labelTonnage = 'Tonnage Total Période';
        if (allocationPeriod === 'day') {
          labelMasse = 'Masse Salariale du Jour';
          labelTonnage = 'Tonnage Total du Jour';
        }

        infoEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:6px; font-size:0.8rem;">
            <div style="font-weight:700; color:var(--accent-blue); display:flex; align-items:center; gap:4px;">📊 Ventilation Dynamique (${labelPeriode})</div>
            <div style="color:var(--text-secondary); line-height:1.4;">
              ${labelMasse} : <strong>${App.formatNumber(pesos.totalLaborCost, 0)} DH</strong><br>
              ${labelTonnage} : <strong>${App.formatNumber(pesos.totalTonnage, 1)} kg</strong><br>
              Ratio Alloué : <strong>${App.formatNumber(pesos.ratio, 4)} DH/kg</strong>
            </div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(99,102,241,0.1); color:var(--text-primary); font-weight:600;">
              Coût M.O. Alloué Journalier : ${App.formatNumber(pesos.allocatedCost, 2)} DH
            </div>
          </div>
        `;
        coutMOJ = pesos.allocatedCost;
      }
    }

    // Dynamic Energy Cost Allocation (Traitement)
    const energieAlloc = App.getPeriodEnergyCostAllocation(dateStr, currentPoidsPF, Saisie.editingId, allocationPeriod);
    const energieInfoEl = document.getElementById('tAllocationEnergieInfo');
    if (energieInfoEl) {
      if (energieAlloc.fallback) {
        energieInfoEl.style.display = 'block';
        energieInfoEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:4px; font-size:0.8rem; color:var(--status-warning);">
            <div style="font-weight:700; display:flex; align-items:center; gap:4px;">⚠️ Mode Repli Énergie Activé</div>
            <div style="color:var(--text-secondary);">Aucune donnée d'énergie ou de tonnage pour la période <strong>${energieAlloc.targetMonths.join(', ')}</strong>.</div>
          </div>
        `;
      } else {
        energieInfoEl.style.display = 'block';
        let labelPeriode = 'Mensuelle';
        if (allocationPeriod === 'day') labelPeriode = 'Journalière';
        else if (allocationPeriod === 'quarter') labelPeriode = 'Trimestrielle';
        else if (allocationPeriod === 'year') labelPeriode = 'Annuelle';

        energieInfoEl.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:6px; font-size:0.8rem;">
            <div style="font-weight:700; color:var(--accent-blue); display:flex; align-items:center; gap:4px;">⚡ Ventilation Énergie (${labelPeriode})</div>
            <div style="color:var(--text-secondary); line-height:1.4;">
              Coût Énergie Période : <strong>${App.formatNumber(energieAlloc.totalEnergyCost, 2)} DH</strong><br>
              Tonnage Total Période : <strong>${App.formatNumber(energieAlloc.totalTonnage, 1)} kg</strong><br>
              Ratio Alloué : <strong>${App.formatNumber(energieAlloc.ratio, 4)} DH/kg</strong>
            </div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(99,102,241,0.1); color:var(--text-primary); font-weight:600;">
              Coût Énergie Alloué : ${App.formatNumber(energieAlloc.allocatedCost, 2)} DH
            </div>
          </div>
        `;
        // Add to facture costs
        if (coutFactureParKg === App.data.parametres.coutStructureEstime) {
           // If it was estimated, overwrite with this specific ratio if we prefer, but for now just add.
           coutFactureParKg += energieAlloc.ratio;
        } else {
           coutFactureParKg += energieAlloc.ratio;
        }
      }
    }

    document.getElementById('tCoutPF').textContent = App.formatNumber(coutPF) + ' DH';
    document.getElementById('tCoutMOO').textContent = App.formatNumber(coutMOO) + ' DH';
    document.getElementById('tCoutMOJ').textContent = App.formatNumber(coutMOJ) + ' DH';

    const baseCout = currentPoidsPF>0 ? (valeurMP+totalInt+coutMOJ)/currentPoidsPF : 0;
    const prixRevient = baseCout + coutFactureParKg;
    
    document.getElementById('sumPrixRevient').textContent = App.formatNumber(prixRevient,2)+' DH/kg';
    if (coutFactureParKg > 0) {
       document.getElementById('sumPrixRevient').innerHTML += `<div style="font-size:11px;color:${isEstime?'#f59e0b':'#10b981'};font-weight:normal;margin-top:4px;">
        ${isEstime ? '⚠️ Charges estimées' : '✅ Charges réelles'} : +${App.formatNumber(coutFactureParKg, 2)} DH/kg
       </div>`;
    }
    document.getElementById('sumMO').textContent = App.formatNumber(coutMOJ, 0) + ' DH';

    // Last PF phase rendement
    const pfRows = document.querySelectorAll('#tPhasesPF tr');
    if(pfRows.length>0){
      const last = pfRows[pfRows.length-1];
      const qi=parseFloat(last.querySelector('[data-ph="qteInit"]')?.value)||0;
      const qf=parseFloat(last.querySelector('[data-ph="qteFinale"]')?.value)||0;
      document.getElementById('sumRendFinal').textContent = qi>0?App.formatNumber(qf/qi*100,2)+'%':'0%';
    }
  },

  addPhase(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const idx = tbody.children.length;
    const tr = document.createElement('tr');
    tr.setAttribute('draggable', 'true');
    tr.setAttribute('ondragstart', 'Saisie.onPhaseDragStart(event, this)');
    tr.setAttribute('ondragover', 'Saisie.onPhaseDragOver(event)');
    tr.setAttribute('ondrop', `Saisie.onPhaseDrop(event, this, '${tbodyId}')`);
    tr.innerHTML = `
      <td><select class="form-select" style="width:160px;padding:5px;font-weight:700;cursor:grab;" data-ph="nom">${Saisie.phasesList.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></td>
      <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="100" data-ph="seuil" data-idx="${idx}" onchange="Saisie.calcT()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="" data-ph="qteInit" data-idx="${idx}" onchange="Saisie.calcT()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="" data-ph="qteFinale" data-idx="${idx}" onchange="Saisie.calcT()"></td>
      <td class="td-right td-bold" id="rendPh${tbodyId==='tPhasesMP'?'MP':'PF'}${idx}">0%</td>
      <td class="td-right" id="rendCum${tbodyId==='tPhasesMP'?'MP':'PF'}${idx}">0%</td>
      <td><button class="btn-icon danger" onclick="Saisie.removePhase(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>`;
    tbody.appendChild(tr);
  },

  removePhase(btn) {
    const tr = btn.closest('tr');
    const tbody = tr.parentElement;
    if (tbody.children.length <= 1) { App.toast('Il faut au moins une phase', 'error'); return; }
    tr.remove();
    this.calcT();
  },

  addPhaseRecond(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const idx = tbody.children.length;
    const tr = document.createElement('tr');
    tr.setAttribute('draggable', 'true');
    tr.setAttribute('ondragstart', 'Saisie.onPhaseDragStart(event, this)');
    tr.setAttribute('ondragover', 'Saisie.onPhaseDragOver(event)');
    tr.setAttribute('ondrop', `Saisie.onPhaseDrop(event, this, '${tbodyId}')`);
    tr.innerHTML = `
      <td><select class="form-select" style="width:160px;padding:5px;font-weight:700;cursor:grab;" data-ph="nom">${Saisie.phasesList.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></td>
      <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="100" data-ph="seuil" data-idx="${idx}" onchange="Saisie.calc()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="" data-ph="qteInit" data-idx="${idx}" onchange="Saisie.calc()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="" data-ph="qteFinale" data-idx="${idx}" onchange="Saisie.calc()"></td>
      <td class="td-right td-bold" id="fRendPhPF${idx}">0%</td>
      <td class="td-right" id="fRendCumPF${idx}">0%</td>
      <td><button class="btn-icon danger" onclick="Saisie.removePhaseRecond(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>`;
    tbody.appendChild(tr);
  },

  removePhaseRecond(btn) {
    const tr = btn.closest('tr');
    const tbody = tr.parentElement;
    if (tbody.children.length <= 1) { App.toast('Il faut au moins une phase', 'error'); return; }
    tr.remove();
    this.calc();
  },

  draggedRow: null,

  onPhaseDragStart(e, row) {
    this.draggedRow = row;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      row.style.opacity = '0.4';
    }, 0);
  },

  onPhaseDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },

  onPhaseDrop(e, targetRow, tbodyId) {
    e.preventDefault();
    if (!this.draggedRow || this.draggedRow === targetRow) {
      if (this.draggedRow) this.draggedRow.style.opacity = '1';
      this.draggedRow = null;
      return;
    }
    
    const tbody = document.getElementById(tbodyId);
    if (this.draggedRow.parentElement !== tbody) {
      this.draggedRow.style.opacity = '1';
      this.draggedRow = null;
      return;
    }

    const children = Array.from(tbody.children);
    const draggedIdx = children.indexOf(this.draggedRow);
    const targetIdx = children.indexOf(targetRow);

    if (draggedIdx < targetIdx) {
      targetRow.after(this.draggedRow);
    } else {
      targetRow.before(this.draggedRow);
    }
    
    this.draggedRow.style.opacity = '1';
    this.draggedRow = null;

    this.reindexPhases(tbodyId);
  },

  reindexPhases(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    const prefixPh = tbodyId === 'fPhasesPF' ? 'fRendPhPF' : (tbodyId === 'tPhasesMP' ? 'rendPhMP' : 'rendPhPF');
    const prefixCum = tbodyId === 'fPhasesPF' ? 'fRendCumPF' : (tbodyId === 'tPhasesMP' ? 'rendCumMP' : 'rendCumPF');
    
    Array.from(tbody.children).forEach((row, idx) => {
      const inputs = row.querySelectorAll('input');
      inputs.forEach(inp => inp.setAttribute('data-idx', idx));
      
      const tdPh = row.querySelector(`[id^="${prefixPh}"]`);
      if (tdPh) tdPh.id = prefixPh + idx;
      
      const tdCum = row.querySelector(`[id^="${prefixCum}"]`);
      if (tdCum) tdCum.id = prefixCum + idx;
    });

    if (tbodyId === 'fPhasesPF') {
      this.calc();
    } else {
      this.calcT();
    }
  },

  renderIntrantRow(it, i, isSent = false) {
    return `<tr>
      <td><input type="text" class="form-input" style="width:180px;padding:5px;font-weight:600" value="${it.article}" data-int="article" data-idx="${i}" ${isSent ? 'disabled' : ''}></td>
      <td><input type="number" step="0.01" class="form-input" style="width:90px;padding:5px" value="${it.qte||''}" data-int="qte" data-idx="${i}" onchange="Saisie.calcT()" ${isSent ? 'disabled' : ''}></td>
      <td><input type="number" step="0.01" class="form-input" style="width:90px;padding:5px" value="${it.prix}" data-int="prix" data-idx="${i}" onchange="Saisie.calcT()" ${isSent ? 'disabled' : ''}></td>
      <td class="td-right td-bold" id="intVal${i}">0.00</td>
      <td>${!isSent ? `<button class="btn-icon danger" onclick="Saisie.removeIntrantRow(this)" style="width:24px;height:24px" title="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>` : ''}</td>
    </tr>`;
  },

  getDefaultIntrants(code) {
    const intrants = [];
    const match = code.match(/^C(\d+)S(\d+)$/);
    if (match) {
      const cartonKey = 'C' + match[1];
      const sachetKey = 'S' + match[2];
      const c = this.cartonMap[cartonKey];
      const s = this.sachetMap[sachetKey];
      if (c) intrants.push({ article: c.article, qte: 0, prix: c.prix });
      if (s) intrants.push({ article: s.article, qte: 0, prix: s.prix });
    }
    intrants.push({ article: 'ETIQUETTE 50*75', qte: 0, prix: 45.00 });
    intrants.push({ article: 'ETIQUETTE NOIR', qte: 0, prix: 78.00 });
    return intrants;
  },

  onConditionnementChange() {
    const code = document.getElementById('tConditionnement')?.value || '';
    const newIntrants = this.getDefaultIntrants(code);
    // Keep any extra intrants the user added (beyond the base 4)
    const tbody = document.getElementById('tIntrants');
    const existingRows = tbody.querySelectorAll('tr:not(:last-child)');
    const extraIntrants = [];
    existingRows.forEach((row, i) => {
      if (i >= 4) { // keep rows beyond the base 4
        const a = row.querySelector('[data-int="article"]');
        const q = row.querySelector('[data-int="qte"]');
        const p = row.querySelector('[data-int="prix"]');
        if (a) extraIntrants.push({ article: a.value, qte: parseFloat(q?.value)||0, prix: parseFloat(p?.value)||0 });
      }
    });
    const allIntrants = [...newIntrants, ...extraIntrants];
    // Rebuild tbody
    const totalRow = tbody.querySelector('tr:last-child');
    tbody.innerHTML = allIntrants.map((it, i) => this.renderIntrantRow(it, i)).join('') + totalRow.outerHTML;
    this.calcT();
  },

  addIntrantFromList() {
    const sel = document.getElementById('tIntrantSelect');
    const ref = sel.value;
    const master = this.intrantsMaster.find(i => i.ref === ref);
    if (!master) return;
    const tbody = document.getElementById('tIntrants');
    const rows = tbody.querySelectorAll('tr:not(:last-child)');
    const idx = rows.length;
    const totalRow = tbody.querySelector('tr:last-child');
    const tr = document.createElement('tr');
    tr.innerHTML = this.renderIntrantRow({ article: master.article, qte: 0, prix: master.prix }, idx).replace(/^<tr>/, '').replace(/<\/tr>$/, '');
    tbody.insertBefore(tr, totalRow);
    this.calcT();
    App.toast(`${master.article} ajouté`, 'success');
  },

  removeIntrantRow(btn) {
    const tr = btn.closest('tr');
    const tbody = tr.parentElement;
    const rows = tbody.querySelectorAll('tr:not(:last-child)');
    if (rows.length <= 1) { App.toast('Il faut au moins un intrant', 'error'); return; }
    tr.remove();
    // Re-index
    tbody.querySelectorAll('tr:not(:last-child)').forEach((row, i) => {
      row.querySelectorAll('[data-int]').forEach(inp => inp.dataset.idx = i);
      const valEl = row.querySelector('td:nth-child(4)');
      if (valEl) valEl.id = 'intVal' + i;
    });
    this.calcT();
  },

  saveTraitement() {
    const date = document.getElementById('tDate').value;
    const espece = document.getElementById('tEspece').value;
    if(!date){App.toast('Date requise','error');return;}

    const collectPhases = (tbody) => {
      const arr=[];
      document.querySelectorAll('#'+tbody+' tr').forEach(row=>{
        arr.push({
          nom: row.querySelector('[data-ph="nom"]')?.value||'',
          seuil: parseFloat(row.querySelector('[data-ph="seuil"]')?.value)||0,
          qteInit: parseFloat(row.querySelector('[data-ph="qteInit"]')?.value)||0,
          qteFinale: parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0
        });
      });
      return arr;
    };
    const collectIntrants = () => {
      const arr=[];
      document.querySelectorAll('#tIntrants tr:not(:last-child)').forEach(row=>{
        const a=row.querySelector('[data-int="article"]');
        if(!a)return;
        arr.push({
          article: a.value,
          qte: parseFloat(row.querySelector('[data-int="qte"]')?.value)||0,
          prix: parseFloat(row.querySelector('[data-int="prix"]')?.value)||0
        });
      });
      return arr;
    };

    const v=id=>parseFloat(document.getElementById(id)?.value)||0;
    const poidsMP=v('tPoidsMP'), prixMP=v('tPrixMoyen'), valeurMP=poidsMP*prixMP, poidsPF=v('tPoidsPF');
    const intrants=collectIntrants();
    const totalInt=intrants.reduce((s,it)=>s+it.qte*it.prix,0);

    const previous = this.editingId ? App.data.production.find(p => p.id === this.editingId) : null;
    const monthStr = date ? date.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const totalFacturesMois = (App.data.factures || []).filter(f => f.date.startsWith(monthStr)).reduce((s, f) => s + f.montant, 0);
    const totalKgMois = (App.data.production || []).filter(p => p.date.startsWith(monthStr) && p.id !== this.editingId).reduce((s, p) => s + (p.poidsBrutPF || 0), 0) + poidsPF;
    const coutFactureParKg = totalKgMois > 0 ? totalFacturesMois / totalKgMois : 0;
    const prixRevientBase = poidsPF>0?(valeurMP+totalInt)/poidsPF:0;

    const entry = {
      id: this.editingId || App.nextId(App.data.production),
      sourceSortieId: previous?.sourceSortieId || null,
      sourceLineIdx: previous?.sourceLineIdx ?? null,
      activite: this.currentActivite,
      receptionId: parseInt(document.getElementById('tReception')?.value)||0,
      date, espece,
      calibre: document.getElementById('tCalibre')?.value || '',
      client: document.getElementById('tClient').value,
      produitFini: document.getElementById('tProduitFini').value,
      poidsMP, prixMP, valeurMP,
      poidsBrutPF: poidsPF, caissesPF: parseInt(document.getElementById('tCaissesPF')?.value)||0,
      conditionnement: document.getElementById('tConditionnement').value,
      phases: collectPhases('tPhasesMP'),
      phasesPF: collectPhases('tPhasesPF'),
      intrants,
      rendement: poidsMP>0?(poidsPF/poidsMP*100):0,
      totalIntrants: totalInt,
      coutFactureParKg,
      prixRevient: prixRevientBase + (poidsPF > 0 ? (parseFloat(document.getElementById('tCoutMOJ')?.textContent.replace(/[^0-9.]/g,''))||0)/poidsPF : 0) + coutFactureParKg,
      // Main-d'œuvre
      allocationPeriod: document.getElementById('tAllocationPeriod')?.value || 'month',
      heuresMOF: v('tHeuresMOF'),
      salaireHF: v('tSalaireHF'),
      coutPersonnelF: v('tHeuresMOF') * v('tSalaireHF'),
      equipesMO: Array.from(document.querySelectorAll('#tEquipesMO tr:not(:last-child)')).map(row => ({
        profil: row.querySelector('[data-mo="profil"]')?.value || '',
        nb: parseFloat(row.querySelector('[data-mo="nb"]')?.value) || 0,
        heures: parseFloat(row.querySelector('[data-mo="heures"]')?.value) || 0,
        taux: parseFloat(row.querySelector('[data-mo="taux"]')?.value) || 0
      })),
      coutMOO: parseFloat(document.getElementById('tCoutMOO')?.textContent.replace(/[^0-9.]/g,''))||0,
      coutMOJ: parseFloat(document.getElementById('tCoutMOJ')?.textContent.replace(/[^0-9.]/g,''))||0,
      // compat fields
      poidsBrutPI: poidsMP, caissesPI:0,
      coutCarton:0,coutSachet:0,coutEtiquetteNoir:0,coutEtiquette5075:0,coutScotch:0
    };

    if(this.editingId){
      const idx=App.data.production.findIndex(p=>p.id===this.editingId);
      if(idx!==-1) App.data.production[idx]=entry;
    } else {
      App.data.production.push(entry);
    }
    App.saveData();
    this.hideForm();
    this.render();
    App.toast(this.editingId?'Saisie mise à jour':'Saisie enregistrée','success');
  },

  printTable() {
    try {
      const tableContainer = document.querySelector('.card-body .table-container');
      if (!tableContainer) return;
      const tableHTML = tableContainer.innerHTML;
      
      let printDiv = document.getElementById('printBonContainer');
      if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'printBonContainer';
        printDiv.className = 'print-only';
        document.body.appendChild(printDiv);
      }
      
      printDiv.innerHTML = `
        <div style="font-family:Arial, sans-serif; color:#000; background:#fff; font-size:12px; width:100%; max-width:1050px; margin:0 auto; padding:20px;">
          <!-- HEADER -->
          <table style="width:100%; border-bottom:2px solid #000; margin-bottom:15px; padding-bottom:10px;">
            <tr>
              <td style="width:120px; vertical-align:middle;">
                <img src="logo.png?v=${Date.now()}" style="max-height:70px; max-width:120px;" onerror="this.style.display='none'">
              </td>
              <td style="vertical-align:middle; text-align:center;">
                <h1 style="margin:0; font-size:20px; font-weight:bold;">FISH AND FOOD SARL</h1>
                <p style="margin:2px 0; font-size:11px;">Zone industrielle ANZA</p>
              </td>
              <td style="width:120px; text-align:right; vertical-align:middle;">
                <div style="border:1px solid #000; padding:5px;">
                  <span style="font-weight:bold; font-size:12px;">Date d'édition :</span><br>
                  ${App.formatDateFR(new Date())}
                </div>
              </td>
            </tr>
          </table>
          
          <h2 style="text-align:center; font-size:16px; margin:10px 0 20px 0; text-transform:uppercase;">RAPPORT MENSUEL DE PRODUCTION</h2>
          
          <!-- TABLE -->
          <div style="margin-bottom:40px;">
            ${tableHTML}
          </div>
          
          <!-- SIGNATURES -->
          <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr>
              <td style="width:33%; text-align:center; padding-bottom:70px;">
                <span style="font-weight:bold; text-decoration:underline;">Chef d'Atelier / Production</span>
              </td>
              <td style="width:33%; text-align:center; padding-bottom:70px;">
                <span style="font-weight:bold; text-decoration:underline;">Contrôle de Gestion</span>
              </td>
              <td style="width:33%; text-align:center; padding-bottom:70px;">
                <span style="font-weight:bold; text-decoration:underline;">Direction Générale</span>
              </td>
            </tr>
          </table>
        </div>
      `;

      const tables = printDiv.querySelectorAll('table');
      tables.forEach(t => { t.style.width = '100%'; t.style.borderCollapse = 'collapse'; t.style.fontSize = '11px'; t.style.border = '1px solid #000'; });
      const ths = printDiv.querySelectorAll('th');
      ths.forEach(th => { th.style.border = '1px solid #000'; th.style.padding = '5px'; th.style.background = '#f2f2f2'; th.style.color = '#000'; });
      const tds = printDiv.querySelectorAll('td');
      tds.forEach(td => { td.style.border = '1px solid #000'; td.style.padding = '4px'; });
      
      // Hide actions column
      const headerCols = printDiv.querySelectorAll('th');
      let actionColIdx = -1;
      headerCols.forEach((th, i) => { if((th.textContent || '').includes('Actions')) actionColIdx = i; });
      if(actionColIdx > -1) {
        printDiv.querySelectorAll('tr').forEach(tr => {
          if(tr.children[actionColIdx]) tr.children[actionColIdx].style.display = 'none';
        });
      }

      document.body.classList.add('printing-bon');
      setTimeout(() => {
        try { window.print(); } catch(err) { App.toast('Print error: ' + err.message, 'error'); }
        document.body.classList.remove('printing-bon');
      }, 500);
    } catch(err) {
      App.toast('Erreur PrintTable: ' + err.message, 'error');
      console.error(err);
    }
  },

  printBon(id) {
    try {
      const p = App.data.production.find(x => x.id === id);
      if (!p) return;
      const isTraitement = (p.activite === 'traitement' || p.activite === 'divers');
      // Calculate intrants total dynamically
      const intrantsArr = (p.intrants || []);
      const totalIntrants = p.totalIntrants || intrantsArr.reduce((s, it) => s + (it.qte||0) * (it.prix||0), 0);
      const coutEmb = (p.coutCarton||0)+(p.coutSachet||0)+(p.coutEtiquetteNoir||0)+(p.coutEtiquette5075||0)+(p.coutScotch||0);
      const valeurMP = p.valeurMP || (p.prixMP > 0 && (p.poidsMP||p.poidsBrutPI||0) > 0 ? p.prixMP * (p.poidsMP||p.poidsBrutPI) : 0);
      const coutTotal = valeurMP + totalIntrants + (p.coutMOJ||0);
      const pr = p.poidsBrutPF > 0 ? coutTotal / p.poidsBrutPF : 0;
      const rendement = p.rendement || ((p.poidsMP||p.poidsBrutPI||0) > 0 ? (p.poidsBrutPF / (p.poidsMP||p.poidsBrutPI) * 100) : 0);

      // Build phases MP rows
      const phasesMP = (p.phases || []);
      let phasesMPhtml = '';
      if (isTraitement && phasesMP.length > 0) {
        phasesMPhtml = `
          <h3 style="font-size:13px; margin:15px 0 5px; border-bottom:1px solid #000; display:inline-block;">Phases Matière Première</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:11px;">
            <thead><tr style="background:#e8e8e8;">
              <th style="border:1px solid #000; padding:4px; text-align:left;">Phase</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Seuil %</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Qté Init (kg)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Qté Finale (kg)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Rend. Phase</th>
            </tr></thead>
            <tbody>${phasesMP.map(ph => {
              const rp = ph.qteInit > 0 ? (ph.qteFinale / ph.qteInit * 100) : 0;
              return `<tr>
                <td style="border:1px solid #000; padding:4px; font-weight:600;">${ph.nom}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(ph.seuil,1)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(ph.qteInit,2)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right; font-weight:bold;">${App.formatNumber(ph.qteFinale,2)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right; font-weight:bold;">${App.formatNumber(rp,2)} %</td>
              </tr>`;
            }).join('')}</tbody>
          </table>`;
      }

      // Build phases PF rows
      const phasesPF = (p.phasesPF || []);
      let phasesPFhtml = '';
      if (isTraitement && phasesPF.length > 0) {
        phasesPFhtml = `
          <h3 style="font-size:13px; margin:15px 0 5px; border-bottom:1px solid #000; display:inline-block;">Phases Produits Finis</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:11px;">
            <thead><tr style="background:#e8e8e8;">
              <th style="border:1px solid #000; padding:4px; text-align:left;">Phase</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Seuil %</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Qté Init (kg)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Qté Finale (kg)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Rend. Phase</th>
            </tr></thead>
            <tbody>${phasesPF.map(ph => {
              const rp = ph.qteInit > 0 ? (ph.qteFinale / ph.qteInit * 100) : 0;
              return `<tr>
                <td style="border:1px solid #000; padding:4px; font-weight:600;">${ph.nom}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(ph.seuil,1)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(ph.qteInit,2)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right; font-weight:bold;">${App.formatNumber(ph.qteFinale,2)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right; font-weight:bold;">${App.formatNumber(rp,2)} %</td>
              </tr>`;
            }).join('')}</tbody>
          </table>`;
      }

      // Build intrants rows
      const intrants = (p.intrants || []);
      let intrantsHtml = '';
      if (intrants.length > 0) {
        const totalInt = intrants.reduce((s, it) => s + (it.qte||0) * (it.prix||0), 0);
        intrantsHtml = `
          <h3 style="font-size:13px; margin:15px 0 5px; border-bottom:1px solid #000; display:inline-block;">Détail des Intrants</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:11px;">
            <thead><tr style="background:#e8e8e8;">
              <th style="border:1px solid #000; padding:4px; text-align:left;">Article</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Quantité</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Prix Unit. (DH)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Valeur (DH)</th>
            </tr></thead>
            <tbody>${intrants.map(it => {
              const val = (it.qte||0) * (it.prix||0);

              return `<tr>
                <td style="border:1px solid #000; padding:4px; font-weight:600;">${it.article}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(it.qte||0,2)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(it.prix||0,2)}</td>
                <td style="border:1px solid #000; padding:4px; text-align:right; font-weight:bold;">${App.formatNumber(val,2)}</td>
              </tr>`;
            }).join('')}
            <tr style="background:#f2f2f2;">
              <td colspan="3" style="border:1px solid #000; padding:5px; font-weight:bold; text-align:right;">TOTAL INTRANTS</td>
              <td style="border:1px solid #000; padding:5px; text-align:right; font-weight:bold;">${App.formatNumber(totalInt,2)} DH</td>
            </tr></tbody>
          </table>`;
      }

      // Build QR data
      const qrData = JSON.stringify({
        t: 'prod', id: p.id, d: (p.date||'').substring(0,10),
        esp: (p.espece||'').substring(0,12), cal: (p.calibre||'').substring(0,12),
        cli: (p.client||'Interne').substring(0,12),
        pf: p.poidsBrutPF, rnd: App.formatNumber(p.rendement,1),
        act: (p.activite||'').substring(0,8)
      });

      let printDiv = document.getElementById('printBonContainer');
      if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'printBonContainer';
        printDiv.className = 'print-only';
        document.body.appendChild(printDiv);
      }

      const _poidsPF = p.poidsBrutPF || 0;
      const _valeurMPkg = _poidsPF > 0 ? valeurMP / _poidsPF : 0;
      const _coutIntrantsKg = _poidsPF > 0 ? totalIntrants / _poidsPF : 0;
      const _coutMOkg = _poidsPF > 0 ? (p.coutMOJ || 0) / _poidsPF : 0;
      const _coutTotalKg = _poidsPF > 0 ? coutTotal / _poidsPF : 0;

      // Coût factures intelligent
      const _dateMois = (p.date || '').substring(0, 7);
      const _allFactures = (App.data.factures || []).filter(f => (f.date || '').substring(0, 7) === _dateMois);
      const _allProd = (App.data.production || []).filter(pr => (pr.date || '').substring(0, 7) === _dateMois);
      
      const _kgUsine = _allProd.reduce((s, pr) => s + (pr.poidsBrutPF || 0), 0);
      const _kgActivite = _allProd.filter(pr => pr.activite === p.activite).reduce((s, pr) => s + (pr.poidsBrutPF || 0), 0);

      const _chargesSpec = _allFactures.filter(f => f.allocation === p.activite || f.allocation === 'emballage').reduce((s, f) => s + (f.montant || 0), 0);
      const _chargesGen = _allFactures.filter(f => f.allocation === 'general' || !f.allocation).reduce((s, f) => s + (f.montant || 0), 0);

      let _coutFactureKg = (_kgActivite > 0 ? _chargesSpec / _kgActivite : 0) + (_kgUsine > 0 ? _chargesGen / _kgUsine : 0);
      let _isEstime = false;
      if (_coutFactureKg === 0) {
        _coutFactureKg = App.data.parametres.coutStructureEstime || 1.5;
        _isEstime = true;
      }

      const _prixRevientKg = _valeurMPkg + _coutIntrantsKg + _coutMOkg + _coutFactureKg;

      const ficheTitle = isTraitement
        ? `FICHE D'ACTIVITÉ ${p.activite.toUpperCase()} N° TRT-${p.id}`
        : `FICHE DE PRODUCTION N° PRD-${p.id}`;

      printDiv.innerHTML = `
        <div style="font-family:Arial, sans-serif; color:#000; background:#fff; font-size:12px; width:100%; max-width:800px; margin:0 auto; padding:20px;">
          <!-- HEADER -->
          <table style="width:100%; border-bottom:2px solid #000; margin-bottom:10px; padding-bottom:8px;">
            <tr>
              <td style="width:100px; vertical-align:middle;">
                <img src="logo.png?v=${Date.now()}" style="max-height:60px; max-width:100px;" onerror="this.style.display='none'">
              </td>
              <td style="vertical-align:middle; text-align:center;">
                <h1 style="margin:0; font-size:18px; font-weight:bold;">FISH AND FOOD SARL</h1>
                <p style="margin:2px 0; font-size:10px;">Zone industrielle ANZA — Agadir</p>
              </td>
              <td style="width:100px; text-align:right; vertical-align:middle;">
                <div style="border:1px solid #999; padding:4px; font-size:10px; text-align:center;">
                  <div style="font-weight:bold;">Date édition</div>
                  ${App.formatDateFR(new Date())}
                </div>
              </td>
            </tr>
          </table>

          <h2 style="text-align:center; font-size:15px; margin:8px 0 15px; text-transform:uppercase; background:#222; color:#fff; padding:6px; letter-spacing:1px;">${ficheTitle}</h2>

          <!-- INFO -->
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:11px;">
            <tr>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; width:18%; background:#f5f5f5;">Date</td>
              <td style="border:1px solid #000; padding:4px; width:32%;">${App.formatDateFR(p.date)}</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; width:18%; background:#f5f5f5;">Client</td>
              <td style="border:1px solid #000; padding:4px; width:32%;">${p.client||'Interne'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Activité</td>
              <td style="border:1px solid #000; padding:4px; text-transform:uppercase;">${p.activite}</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Produit Fini</td>
              <td style="border:1px solid #000; padding:4px;">${p.produitFini||'-'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Espèce</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold;">${p.espece||'-'}</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Calibre</td>
              <td style="border:1px solid #000; padding:4px;">${p.calibre||'-'}</td>
            </tr>
          </table>

          ${phasesMPhtml}
          
          <!-- BILAN QUANTITATIF -->
          <h3 style="font-size:13px; margin:15px 0 5px; border-bottom:1px solid #000; display:inline-block;">Bilan Quantitatif</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:11px;">
            <thead><tr style="background:#e8e8e8;">
              <th style="border:1px solid #000; padding:4px; text-align:left;">Matière Première (kg)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Poids Fini Net (kg)</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Nb Caisses</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Conditionnement</th>
              <th style="border:1px solid #000; padding:4px; text-align:right;">Rendement</th>
            </tr></thead>
            <tbody><tr>
              <td style="border:1px solid #000; padding:4px;">${App.formatNumber(p.poidsMP || p.poidsBrutPI || 0,2)}</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold;">${App.formatNumber(p.poidsBrutPF,2)}</td>
              <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(p.caissesPF,0)}</td>
              <td style="border:1px solid #000; padding:4px; text-align:right;">${p.conditionnement||'-'}</td>
              <td style="border:1px solid #000; padding:4px; text-align:right; font-weight:bold;">${App.formatNumber(rendement || 0,2)} %</td>
            </tr></tbody>
          </table>

          ${phasesPFhtml}
          ${intrantsHtml}

          <!-- ANALYSE DES COÛTS -->
          <h3 style="font-size:13px; margin:15px 0 5px; border-bottom:1px solid #000; display:inline-block;">Analyse des Coûts</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:12px; font-size:11px;">
            <tr>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; width:25%; background:#f5f5f5;">Valeur MP</td>
              <td style="border:1px solid #000; padding:4px; text-align:right; width:25%;">${App.formatNumber(_valeurMPkg,2)} DH/kg</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; width:25%; background:#f5f5f5;">Coût Intrants</td>
              <td style="border:1px solid #000; padding:4px; text-align:right; width:25%;">${App.formatNumber(_coutIntrantsKg,2)} DH/kg</td>
            </tr>
            <tr>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Coût M.O.</td>
              <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(_coutMOkg,2)} DH/kg</td>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Coût Intrants</td>
              <td style="border:1px solid #000; padding:4px; text-align:right;">${App.formatNumber(_coutIntrantsKg,2)} DH/kg</td>
            </tr>
            <tr>
              <td style="border:1px solid #000; padding:4px; font-weight:bold; background:#f5f5f5;">Charges / Factures</td>
              <td style="border:1px solid #000; padding:4px; text-align:right; color:${_isEstime?'#f59e0b':'#c00'};">
                ${App.formatNumber(_coutFactureKg,2)} DH/kg
                ${_isEstime ? '<br><span style="font-size:8px; font-weight:normal;">(Estimation standard)</span>' : ''}
              </td>
              <td style="border:1px solid #000; padding:4px; font-size:9px; color:#555;" colspan="2">
                ${_isEstime ? 'Factures non saisies pour ce mois.' : `Répartition intelligente (Spécifique + Général) pour ${_dateMois}`}
              </td>
            </tr>
            <tr style="background:#222; color:#fff;">
              <td colspan="3" style="border:1px solid #000; padding:6px; font-weight:bold; text-align:right; font-size:12px;">PRIX DE REVIENT GLOBAL (DH/KG)</td>
              <td style="border:1px solid #000; padding:6px; text-align:right; font-weight:bold; font-size:14px;">${App.formatNumber(_prixRevientKg,2)}</td>
            </tr>
          </table>

          <!-- SIGNATURES -->
          <table style="width:100%; border-collapse:collapse; margin-top:15px;">
            <tr>
              <td style="width:33%; text-align:center; padding-bottom:50px;">
                <span style="font-weight:bold; text-decoration:underline; font-size:10px;">Chef d'Atelier / Production</span>
              </td>
              <td style="width:33%; text-align:center; padding-bottom:50px;">
                <span style="font-weight:bold; text-decoration:underline; font-size:10px;">Contrôle de Gestion</span>
              </td>
              <td style="width:33%; text-align:center; padding-bottom:50px;">
                <span style="font-weight:bold; text-decoration:underline; font-size:10px;">Direction Générale</span>
              </td>
            </tr>
          </table>

          <!-- GRAND QR CODE EN BAS -->
          <div style="border-top:2px solid #000; padding-top:15px; margin-top:10px; text-align:center;">
            <div style="font-weight:bold; font-size:12px; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Traçabilité — Scanner pour vérifier</div>
            <div id="bonQrCodeBig" style="display:inline-block;"></div>
            <div style="margin-top:6px; font-size:9px; color:#666;">
              ${ficheTitle} | ${p.espece||''} ${p.calibre||''} | ${App.formatDateFR(p.date)} | ${p.client||'Interne'}
            </div>
          </div>
        </div>
      `;

      document.body.classList.add('printing-bon');

      setTimeout(() => {
        // Generate large QR at bottom
        if (typeof QRCode !== 'undefined') {
          document.getElementById("bonQrCodeBig").innerHTML = '';
          new QRCode(document.getElementById("bonQrCodeBig"), {
            text: qrData, width: 180, height: 180,
            correctLevel: QRCode.CorrectLevel.L
          });

          // Force canvas to img for reliable printing
          setTimeout(() => {
            const canvas = document.querySelector('#bonQrCodeBig canvas');
            const img = document.querySelector('#bonQrCodeBig img');
            if (canvas && img && (!img.src || img.src === '')) {
              img.src = canvas.toDataURL('image/png');
              img.style.display = 'block';
              canvas.style.display = 'none';
            }
          }, 50);
        }

        setTimeout(() => {
          try { window.print(); } catch(err) { App.toast('Print error: ' + err.message, 'error'); }
          document.body.classList.remove('printing-bon');
        }, 500);
      }, 50);
    } catch(err) {
      App.toast('Erreur PrintBon: ' + err.message, 'error');
      console.error(err);
    }
  },

  scanAndCreate() {
    if (typeof Stockage !== 'undefined' && Stockage.startScanner) {
      Stockage.startScanner((espece, calibre) => {
        App.toast(`Scanné: ${espece} (Cal: ${calibre})`, 'success');
        if (this.currentActivite === 'reconditionnement') {
          this.showForm();
          setTimeout(() => {
            const espSelect = document.getElementById('fEspece');
            if (espSelect) { espSelect.value = espece; this.onEspeceChange('fEspece', 'fCalibre', calibre); }
          }, 100);
        } else {
          this.showTraitementForm();
          setTimeout(() => {
            const espSelect = document.getElementById('tEspece');
            if (espSelect) { espSelect.value = espece; this.onEspeceChange('tEspece', 'tCalibre', calibre); }
          }, 100);
        }
      });
    } else {
      App.toast('Scanner non disponible', 'error');
    }
  },

  onEspeceChange(espId, calId, selectedCalibre = null) {
    const espNom = document.getElementById(espId)?.value;
    const esp = App.data.especes.find(e => e.nom === espNom);
    const calSelect = document.getElementById(calId);
    if (!calSelect) return;
    if (esp) {
      calSelect.innerHTML = esp.calibres.map(c => `<option value="${c}" ${selectedCalibre===c?'selected':''}>${c}</option>`).join('');
    } else {
      calSelect.innerHTML = '<option value="">-- Calibre --</option>';
    }
  },

  refreshQR() {
    const client = document.getElementById('tClient')?.value || '';
    const espece = document.getElementById('tEspece')?.value || '';
    const calibre = document.getElementById('tCalibre')?.value || '';
    const area = document.getElementById('saisieQRArea');
    if (!area) return;

    if (!client && !espece) {
      area.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Sélectionnez Client & Espèce pour afficher le QR Code associé</div>';
      return;
    }

    const qr = (typeof QRCodes !== 'undefined') ? QRCodes.getQRForLot(client, espece, calibre) : null;
    if (qr && qr.imageData) {
      area.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;justify-content:center;flex-wrap:wrap;">
          <img src="${qr.imageData}" width="120" style="border-radius:8px;border:2px solid var(--border-color);background:white;padding:4px;">
          <div style="text-align:left;font-size:0.82rem;">
            <div style="font-weight:800;margin-bottom:4px;">QR Code associé</div>
            <div style="color:var(--text-secondary);">Type: <strong>${qr.type}</strong></div>
            ${qr.value ? `<div style="color:var(--text-secondary);">Valeur: <strong>${qr.value}</strong></div>` : ''}
            ${qr.espece ? `<div style="color:var(--text-secondary);">Espèce: <span class="badge badge-info">${qr.espece}</span></div>` : ''}
            ${qr.calibre ? `<div style="color:var(--text-secondary);">Calibre: <strong>${qr.calibre}</strong></div>` : ''}
            <div style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;">ID: ${qr.id} — ${App.formatDateFR(qr.createdAt)}</div>
          </div>
        </div>`;
    } else {
      area.innerHTML = `
        <div style="background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.35);border-radius:8px;padding:12px;color:var(--accent-yellow);font-size:0.85rem;">
          ⚠️ Aucun QR Code trouvé pour <strong>${client || '-'}</strong> / <strong>${espece || '-'}</strong>
          <br><button class="btn btn-sm btn-outline" style="margin-top:8px;font-size:0.78rem;" onclick="App.navigate('qrcodes')">➕ Générer un QR Code</button>
        </div>`;
    }
  },

  scanForForm(espId, calId) {
    if (typeof Stockage !== 'undefined' && Stockage.startScanner) {
      Stockage.startScanner((espece, calibre) => {
        const espSelect = document.getElementById(espId);
        if (espSelect) {
          espSelect.value = espece;
          this.onEspeceChange(espId, calId, calibre);
          this.refreshQR();
          App.toast(`Scanné: ${espece} (Cal: ${calibre})`, 'success');
        }
      });
    } else {
      App.toast('Scanner non disponible', 'error');
    }
  },

  /* ============================================
     ENVOI VERS STOCKAGE — Post-Traitement
     ============================================ */
  showSendToStorageModal(id) {
    const p = App.data.production.find(x => x.id === id);
    if (!p) return;
    if (p.sentToStorage) { App.toast('Cette saisie a déjà été envoyée vers le stockage', 'warning'); return; }
    if (!(p.poidsBrutPF > 0)) { App.toast('Le traitement n\'est pas encore terminé (Poids PF = 0)', 'error'); return; }

    const activiteLabel = (p.activite === 'traitement') ? 'Traitement' : (p.activite === 'reconditionnement' ? 'Reconditionnement' : p.activite);

    App.showModal('📦 Envoyer vers Stockage', `
      <div style="padding:10px 0;">
        <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:18px;margin-bottom:20px;">
          <div style="font-weight:800;font-size:1.05rem;margin-bottom:12px;color:var(--accent-green);">
            📋 Résumé du lot à envoyer
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;font-size:0.88rem;">
            <div><span style="color:var(--text-muted);">Activité :</span> <strong>${activiteLabel}</strong></div>
            <div><span style="color:var(--text-muted);">Date :</span> <strong>${App.formatDateFR(p.date)}</strong></div>
            <div><span style="color:var(--text-muted);">Espèce :</span> <span class="badge badge-info">${p.espece||'-'}</span></div>
            <div><span style="color:var(--text-muted);">Calibre :</span> <strong>${p.calibre||'-'}</strong></div>
            <div><span style="color:var(--text-muted);">Client :</span> <strong>${p.client||'Interne'}</strong></div>
            <div><span style="color:var(--text-muted);">Produit fini :</span> <strong>${p.produitFini||'-'}</strong></div>
            <div><span style="color:var(--text-muted);">Poids PF :</span> <strong style="color:var(--accent-green);font-size:1.1rem;">${App.formatNumber(p.poidsBrutPF,2)} kg</strong></div>
            <div><span style="color:var(--text-muted);">Caisses PF :</span> <strong>${App.formatNumber(p.caissesPF||0,0)}</strong></div>
            <div><span style="color:var(--text-muted);">Conditionnement :</span> <strong>${p.conditionnement||'-'}</strong></div>
            <div><span style="color:var(--text-muted);">Rendement :</span> <strong>${App.formatNumber(p.rendement||0,2)}%</strong></div>
          </div>
        </div>

        <div class="form-section" style="margin-top:0;">
          <div class="form-section-title">❄️ Destination — Chambre de stockage</div>
          <div class="form-grid" style="grid-template-columns:1fr;">
            <div class="form-group">
              <label class="form-label">Chambre de froid *</label>
              <select class="form-select" id="sendToChambre" style="font-size:1rem;padding:12px;">
                <option value="chambre1">❄️ Chambre de Stockage 1</option>
                <option value="chambre2">❄️ Chambre de Stockage 2</option>
                <option value="entreposage">📦 Entreposage</option>
                <option value="direct">🚀 Flux Direct (Sans Stockage)</option>
              </select>
            </div>
          </div>
        </div>

        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:12px;margin-top:14px;font-size:0.82rem;color:var(--accent-yellow);">
          ⚠️ Cette action va créer un élément en attente dans <strong>Entrée de Stockage → Éléments en Attente</strong>.
          L'origine sera marquée comme <strong>${activiteLabel}</strong>.
          La fiche sera en <strong>lecture seule</strong>.
        </div>
      </div>
    `, `
      <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      <button class="btn btn-success" style="min-width:200px;font-size:1rem;" onclick="Saisie.confirmSendToStorage('${id}')">📦 Confirmer l'envoi</button>
    `);
  },

  confirmSendToStorage(id) {
    const p = App.data.production.find(x => x.id === id);
    if (!p) return;
    if (p.sentToStorage) { App.toast('Déjà envoyé', 'warning'); App.closeModal(); return; }

    const chambre = document.getElementById('sendToChambre')?.value || 'chambre1';
    const activiteLabel = (p.activite === 'traitement') ? 'Traitement' : (p.activite === 'reconditionnement' ? 'Reconditionnement' : p.activite);

    // Traceability: lookup original reception if linked
    let sourceBateau = '';
    let sourceFournisseur = '';
    if (p.receptionId) {
      const originalRec = (App.data.stockage || []).find(s => s.id === p.receptionId);
      if (originalRec) {
        sourceBateau = originalRec.bateau || '';
        sourceFournisseur = originalRec.fournisseur || '';
      }
    }

    if (!App.data.pendingStorageEntries) App.data.pendingStorageEntries = [];

    const pendingEntry = {
      id: App.nextId(App.data.pendingStorageEntries),
      productionId: p.id,
      activite: p.activite,
      origine: activiteLabel,
      dateEnvoi: new Date().toISOString().split('T')[0],
      dateProd: p.date,
      client: p.client || 'Interne',
      espece: p.espece || '',
      calibre: p.calibre || '',
      produitFini: p.produitFini || '',
      poidsPF: p.poidsBrutPF || 0,
      caissesPF: p.caissesPF || 0,
      conditionnement: p.conditionnement || '',
      chambreDestination: chambre,
      receptionId: p.receptionId || null,
      bateau: sourceBateau,
      fournisseur: sourceFournisseur,
      rendement: p.rendement || 0,
      prixRevient: p.prixRevient || 0,
      poidsMP: p.poidsMP || p.poidsBrutPI || 0,
      valeurMP: p.valeurMP || 0,
      totalIntrants: p.totalIntrants || 0,
      phases: p.phases || [],
      phasesPF: p.phasesPF || [],
      intrants: p.intrants || [],
      status: 'pending'
    };

    App.data.pendingStorageEntries.push(pendingEntry);

    // Mark the production entry
    p.sentToStorage = true;
    p.sentToStorageDate = new Date().toISOString();
    p.sentToChambre = chambre;

    App.saveData();
    App.closeModal();
    this.render();
    App.toast(`Lot envoyé vers ${activiteLabel} (${chambre === 'chambre1' ? 'Chambre 1' : chambre === 'chambre2' ? 'Chambre 2' : 'Entreposage'}) — En attente de validation`, 'success');
  },

  async processAIAnalysis(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx')) {
      App.AiEngine.currentType = 'traitement';
      App.AiEngine.currentCallback = (data) => {
        this.importBatchAIData(data);
      };
      App.AiEngine.processFile(file);
      return;
    }

    App.AI.showOverlay("Analyse du document de production...");
    
    try {
      const prompt = `Analyse cette fiche de production ou bon de travail.
EXTRACTION MULTI-LIGNES OBLIGATOIRE :
Si le document contient un tableau ou plusieurs lignes de production, tu DOIS extraire CHAQUE ligne comme un objet distinct dans un tableau nommé "entries". 
Ne te contente pas de la première ligne, extrais TOUTES les lignes visibles.

Structure de l'objet pour chaque ligne :
{
  "date": "YYYY-MM-DD",
  "client": "Nom du client",
  "espece": "Nom espece",
  "calibre": "Taille/Calibre",
  "poidsMP": 0.0,
  "caissesPI": 0,
  "poidsPF": 0.0,
  "caissesPF": 0,
  "produitFini": "Désignation (ex: SEPIA NETTOYE)",
  "conditionnement": "CODE (ex: C12S1000)",
  "reliquatNom": "Article reliquat",
  "reliquatPoids": 0.0,
  "isQuarterly": false
}
Notes:
- Si c'est un rapport trimestriel ou périodique, mets "isQuarterly": true.
- Si une info est manquante, laisse vide.
- Espèces standards: SEPIA, POULPE, SARDINE, CREVETTE, BURRO, BESUGO, etc.
- Nombres avec point décimal.`;

      const rawData = await App.AI.analyzeImage(file, prompt);
      
      // Normalisation: toujours avoir un tableau d'entrées pour la suite
      let entries = rawData.entries ? rawData.entries : [rawData];
      
      // Fuzzy matching sur chaque entrée
      const speciesList = (App.data.especes || []).map(e => e.nom.toUpperCase());
      const clientsList = [...new Set((App.data.stockage||[]).map(e=>e.client).filter(Boolean))];
      
      entries.forEach(data => {
        if (data.client) data.client = App.AI.fuzzyMatch(data.client, clientsList);
        if (data.espece) data.espece = App.AI.fuzzyMatch(data.espece, speciesList);
      });

      App.AI.hideOverlay();
      this.showAIReviewModal(entries, rawData.isQuarterly || entries.some(e => e.isQuarterly));
      
    } catch (error) {
      App.AI.hideOverlay();
      console.error(error);
      App.toast("Erreur IA: " + error.message, "error");
    } finally {
      event.target.value = '';
    }
  },

  showAIReviewModal(entries, isQuarterly = false) {
    const isSingle = entries.length === 1;
    const title = isQuarterly ? "🤖 Rapport Trimestriel Détecté" : (isSingle ? "🤖 Validation de l'Extraction IA" : `🤖 Extraction Multi-Lignes (${entries.length} entrées)`);
    
    let bodyHtml = `
      <div style="max-height:60vh; overflow-y:auto; padding-right:10px;">
        <p style="margin-bottom:15px; font-size:0.9rem; color:var(--text-secondary);">
          ${isQuarterly ? "Ce document semble être un rapport trimestriel. Les données seront importées comme des résumés de période." : "Vérifiez les informations extraites avant l'importation."}
        </p>
    `;

    if (isSingle) {
      const data = entries[0];
      bodyHtml += `
        <div class="ai-review-card">
          <div class="ai-review-field"><span class="ai-review-label">Date:</span><span class="ai-review-value">${data.date || '-'}</span></div>
          <div class="ai-review-field"><span class="ai-review-label">Client:</span><span class="ai-review-value">${data.client || '-'}</span></div>
          <div class="ai-review-field"><span class="ai-review-label">Espèce:</span><span class="ai-review-value">${data.espece || '-'}</span></div>
          <div class="ai-review-field"><span class="ai-review-label">Calibre:</span><span class="ai-review-value">${data.calibre || '-'}</span></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border-color);">
            <div class="ai-review-field"><span class="ai-review-label">Poids MP:</span><span class="ai-review-value">${data.poidsMP || 0} kg</span></div>
            <div class="ai-review-field"><span class="ai-review-label">Caisses PI:</span><span class="ai-review-value">${data.caissesPI || 0}</span></div>
            <div class="ai-review-field"><span class="ai-review-label">Poids PF:</span><span class="ai-review-value">${data.poidsPF || 0} kg</span></div>
            <div class="ai-review-field"><span class="ai-review-label">Caisses PF:</span><span class="ai-review-value">${data.caissesPF || 0}</span></div>
          </div>
          <div class="ai-review-field"><span class="ai-review-label">Produit:</span><span class="ai-review-value">${data.produitFini || '-'}</span></div>
          <div class="ai-review-field"><span class="ai-review-label">Condit.:</span><span class="ai-review-value">${data.conditionnement || '-'}</span></div>
        </div>
      `;
    } else {
      bodyHtml += `
        <div class="table-container">
          <table style="font-size:0.8rem;">
            <thead>
              <tr>
                <th>Date</th>
                <th>Espèce</th>
                <th class="td-right">Poids MP</th>
                <th class="td-right">Poids PF</th>
                <th>Produit</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td>${e.date || '-'}</td>
                  <td><strong>${e.espece || '-'}</strong></td>
                  <td class="td-right">${App.formatNumber(e.poidsMP, 1)}</td>
                  <td class="td-right td-bold">${App.formatNumber(e.poidsPF, 1)}</td>
                  <td>${e.produitFini || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    bodyHtml += `</div>`;

    App.showModal(title, bodyHtml, `
      <div style="display:flex; gap:12px;">
        <button class="btn btn-primary" id="btnConfirmAI">${isSingle ? 'Appliquer à la fiche' : 'Importer tout en historique'}</button>
        <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      </div>
    `);

    const btn = document.getElementById('btnConfirmAI');
    if (btn) {
      btn.onclick = () => {
        App.closeModal();
        if (isSingle) {
          this.applyAIData(entries[0]);
        } else {
          this.importBatchAIData(entries);
        }
      };
    }
  },

  importBatchAIData(entries) {
    App.toast(`Importation de ${entries.length} lignes...`, 'info');
    
    entries.forEach(e => {
      const isTrt = (this.currentActivite === 'traitement' || this.currentActivite === 'divers');
      const entry = {
        id: App.nextId(App.data.production),
        activite: this.currentActivite,
        date: e.date || this.selectedDay,
        client: e.client || '',
        espece: e.espece || '',
        calibre: e.calibre || '',
        caissesPI: e.caissesPI || 0,
        poidsBrutPI: e.poidsMP || 0,
        poidsMP: e.poidsMP || 0,
        caissesPF: e.caissesPF || 0,
        poidsBrutPF: e.poidsPF || 0,
        produitFini: e.produitFini || (e.espece + ' ' + (isTrt ? 'Traité' : 'Reconditionné')).toUpperCase(),
        conditionnement: e.conditionnement || 'C12S1000',
        phases: [],
        phasesPF: [],
        intrants: [],
        // Phases par défaut pour import historique
        phasesPF: [
          { nom: 'Glasurage', seuil: 107, qteInit: e.poidsMP || 0, qteFinale: e.poidsPF || 0 }
        ]
      };
      App.data.production.push(entry);
    });

    App.saveData();
    this.render();
    App.toast(`${entries.length} lignes importées avec succès`, 'success');
  },

  applyAIData(data) {
    this.showNewForm();
    
    setTimeout(() => {
      const isTrt = (this.currentActivite === 'traitement' || this.currentActivite === 'divers');
      const prefix = isTrt ? 't' : 'f';
      
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
      };

      const finalDate = data.date || this.selectedDay;
      setVal(prefix + 'Date', finalDate);
      if (prefix === 'f') this.onDateChange(); else this.onDateChangeT();
      setVal(prefix + 'Client', data.client);
      
      if (data.espece) {
        setVal(prefix + 'Espece', data.espece);
        this.onEspeceChange(prefix + 'Espece', prefix + 'Calibre', data.calibre);
      }
      
      setVal(isTrt ? 'tPoidsMP' : 'fPoidsPI', data.poidsMP);
      setVal(isTrt ? 'tCaissesMP' : 'fCaissesPI', data.caissesPI);
      setVal(prefix + 'PoidsPF', data.poidsPF);
      setVal(prefix + 'CaissesPF', data.caissesPF);
      setVal(prefix + 'ProduitFini', data.produitFini);
      setVal(prefix + 'Conditionnement', data.conditionnement);
      
      if (prefix === 'f') {
        setVal('fReliquatNom', data.reliquatNom);
        setVal('fReliquatPoids', data.reliquatPoids);
        this.onConditionnementChangeRec();
      } else {
        this.onConditionnementChange();
      }
      
      // Forcer le calcul final
      setTimeout(() => {
        if (isTrt) this.calcT(); else this.calc();
        this.refreshQR();
        App.toast("Données IA appliquées et synchronisées", "success");
      }, 100);
    }, 250);
  },

  /* ============================================
     EXCEL IMPORT — Rapport de Production
     ============================================ */

  async processExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    if (typeof XLSX === 'undefined') {
      App.toast('Bibliothèque Excel (SheetJS) non chargée. Rechargez la page.', 'error');
      return;
    }

    App.toast('📊 Lecture du fichier Excel...', 'info');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      const allEntries = [];

      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        const parsed = this.parseExcelSheet(ws, sheetName);
        if (parsed && parsed.length > 0) {
          allEntries.push(...parsed);
        }
      }

      if (allEntries.length === 0) {
        App.toast('Aucune donnée de production trouvée dans ce fichier Excel.', 'error');
        return;
      }

      this.showExcelPreviewModal(allEntries);
    } catch (error) {
      console.error('Excel import error:', error);
      App.toast('Erreur lecture Excel: ' + error.message, 'error');
    }
  },

  parseExcelSheet(ws, sheetName) {
    const entries = [];
    
    // Convert sheet to array of arrays for easier parsing
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const rows = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row = [];
      for (let c = range.s.c; c <= Math.min(range.e.c, 20); c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        row.push(cell ? cell.v : null);
      }
      rows.push(row);
    }

    if (rows.length < 9) return entries;

    // --- Extract dates ---
    let dateTraitement = null;
    let dateEmballage = null;
    let dateRapport = null;

    for (let r = 0; r < Math.min(rows.length, 8); r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const val = rows[r][c];
        if (val === null || val === undefined) continue;
        
        const str = String(val);
        
        // Check for "Date de Traitement : DD/MM/YYYY"
        const trtMatch = str.match(/date\s*de\s*traitement\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if (trtMatch) {
          dateTraitement = this.parseExcelDateStr(trtMatch[1]);
        }
        
        // Check for "Date d'emballage : DD/MM/YYYY"
        const embMatch = str.match(/emballage\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if (embMatch) {
          dateEmballage = this.parseExcelDateStr(embMatch[1]);
        }
        
        // Check for "Le, DD/MM/YYYY" header date
        const leMatch = str.match(/Le\s*,?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if (leMatch) {
          dateRapport = this.parseExcelDateStr(leMatch[1]);
        }
        
        // Check for range end "AU DD/MM/YYYY"
        const auMatch = str.match(/AU\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if (auMatch && !dateEmballage) {
          dateEmballage = this.parseExcelDateStr(auMatch[1]);
        }
        
        // Cell might be a Date object directly
        if (val instanceof Date && !isNaN(val)) {
          if (str.toLowerCase().includes('traitement')) {
            dateTraitement = val;
          } else if (str.toLowerCase().includes('emballage')) {
            dateEmballage = val;
          }
        }
      }
      // Also check: the date might be in a separate cell on the same row
      for (let c = 0; c < rows[r].length; c++) {
        const val = rows[r][c];
        if (val instanceof Date && !isNaN(val)) {
          const rowText = rows[r].map(v => String(v || '')).join(' ').toLowerCase();
          if (rowText.includes('traitement') && !dateTraitement) {
            dateTraitement = val;
          } else if (rowText.includes('emballage') && !dateEmballage) {
            dateEmballage = val;
          } else if (rowText.includes('le,') && !dateRapport) {
            dateRapport = val;
          }
        }
      }
    }

    // Fallback: use sheet name as date (format "DD-MM-YYYY")
    if (!dateEmballage && !dateTraitement) {
      const nameMatch = sheetName.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
      if (nameMatch) {
        dateEmballage = new Date(parseInt(nameMatch[3]), parseInt(nameMatch[2]) - 1, parseInt(nameMatch[1]));
      }
    }

    const finalDate = dateEmballage || dateTraitement || dateRapport || this.selectedDay;

    // --- Find the header row (contains "ESPECE") ---
    let headerRow = -1;
    let colMap = {};
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const rowStr = rows[r].map(v => String(v || '').toUpperCase()).join('|');
      if (rowStr.includes('ESPECE') || rowStr.includes('ESPÈCE')) {
        headerRow = r;
        // Map columns
        rows[r].forEach((val, c) => {
          const h = String(val || '').toUpperCase().trim();
          const nextRow = rows[r+1] || [];
          const hNext = String(nextRow[c] || '').toUpperCase().trim();
          const hNextPlus = String(nextRow[c+1] || '').toUpperCase().trim();

          if (h.includes('ESPECE') || h.includes('ESPÈCE')) colMap.espece = c;
          else if (h.includes('NBR') && h.includes('CSS') && !h.includes('FINAL') && !colMap.caissesPI) colMap.caissesPI = c;
          else if (h.includes('NBR') && h.includes('CSS') && h.includes('FINAL')) colMap.caissesPF = c;
          else if (h.includes('POIDS INITIAL') || h.includes('POIDS INIT')) colMap.poidsPI = c;
          else if (h.includes('MATIERE. PREMIERE') || h.includes('MATIÈRE PREMIÈRE')) {
            // Merged header case: check row below
            if (hNextPlus.includes('QUANT') || hNextPlus.includes('KG')) colMap.poidsPI = c + 1;
            else if (hNext.includes('QUANT') || hNext.includes('KG')) colMap.poidsPI = c;
            else colMap.poidsPI = c + 1; // Fallback to next col for weights
          }
          else if (h.includes('PRODUIT FINI')) {
            if (hNextPlus.includes('QUANT') || hNextPlus.includes('KG')) colMap.poidsEmballe = c + 1;
            else if (hNext.includes('QUANT') || hNext.includes('KG')) colMap.poidsEmballe = c;
            else colMap.poidsEmballe = c + 1;
          }
          else if (h.includes('MODE') && h.includes('TRAITEMENT')) colMap.modeTraitement = c;
          else if (h.includes('EVISCERATION') || h.includes('ÉVISCÉR')) colMap.poidsEvisceration = c;
          else if (h.includes('TREMPAGE')) colMap.poidsTrempage = c;
          else if (h.includes('LAVAGE')) colMap.poidsLavage = c;
          else if (h.includes('TRIAGE')) colMap.poidsTriage = c;
          else if (h.includes('CUISSON')) colMap.poidsCuisson = c;
          else if (h.includes('DECORTICAGE') || h.includes('DÉCORTICAGE')) colMap.poidsDecorticage = c;
          else if (h.includes('CONGELATION') || h.includes('CONGÉLATION')) colMap.poidsCongelation = c;
          else if (h.match(/RENDEMENT/) && !h.includes('FINAL')) colMap.rendement = c;
          else if (h.includes('GLAZURAGE') || h.includes('GLACAGE')) colMap.poidsGlazurage = c;
          else if (h.includes('TAUX') && h.includes('GLAZURAGE')) colMap.tauxGlazurage = c;
          else if (h.includes('EMBALLÉ') || h.includes('EMBALLE')) colMap.poidsEmballe = c;
          else if (h.includes('RENDEMENT') && h.includes('FINAL')) colMap.rendementFinal = c;
          else if (h.includes('MODE') && h.includes('EMBALL')) colMap.modeEmballage = c;
          else if (h.includes('EFFECTIF')) colMap.effectifs = c;
          else if (h.includes('HEUR')) colMap.heures = c;
        });
        break;
      }
    }

    if (headerRow < 0) return entries;

    // --- Find shared effectifs/heures (often in merged cells) ---
    let sharedEffectifs = 0;
    let sharedHeures = 0;
    for (let r = headerRow + 1; r < rows.length; r++) {
      if (colMap.effectifs !== undefined) {
        const v = parseFloat(rows[r][colMap.effectifs]);
        if (v > 0 && sharedEffectifs === 0) sharedEffectifs = v;
      }
      if (colMap.heures !== undefined) {
        const v = parseFloat(rows[r][colMap.heures]);
        if (v > 0 && sharedHeures === 0) sharedHeures = v;
      }
    }

    // --- Extract data rows ---
    for (let r = headerRow + 1; r < rows.length; r++) {
      const espece = rows[r][colMap.espece !== undefined ? colMap.espece : 0];
      if (!espece || String(espece).trim() === '') continue;
      
      const especeStr = String(espece).trim();
      
      // Skip summary/total rows
      if (especeStr.toUpperCase().includes('TOTAL') || especeStr.toUpperCase().includes('SOMME')) continue;

      const caissesPI = parseFloat(rows[r][colMap.caissesPI]) || 0;
      const poidsPI = parseFloat(rows[r][colMap.poidsPI]) || 0;
      const modeTraitement = String(rows[r][colMap.modeTraitement] || '').trim();
      const poidsEvisceration = parseFloat(rows[r][colMap.poidsEvisceration]) || 0;
      const poidsTrempage = parseFloat(rows[r][colMap.poidsTrempage]) || 0;
      const poidsLavage = parseFloat(rows[r][colMap.poidsLavage]) || 0;
      const poidsTriage = parseFloat(rows[r][colMap.poidsTriage]) || 0;
      const poidsCuisson = parseFloat(rows[r][colMap.poidsCuisson]) || 0;
      const poidsDecorticage = parseFloat(rows[r][colMap.poidsDecorticage]) || 0;
      const poidsCongelation = parseFloat(rows[r][colMap.poidsCongelation]) || 0;
      const poidsGlazurage = parseFloat(rows[r][colMap.poidsGlazurage]) || 0;
      const poidsEmballe = parseFloat(rows[r][colMap.poidsEmballe]) || 0;
      const rendementFinal = parseFloat(rows[r][colMap.rendementFinal]) || 0;
      const modeEmballage = String(rows[r][colMap.modeEmballage] || '').trim();

      // Per-row effectifs/heures (may be empty if merged)
      const rowEffectifs = parseFloat(rows[r][colMap.effectifs]) || sharedEffectifs;
      const rowHeures = parseFloat(rows[r][colMap.heures]) || sharedHeures;
      const caissesPF = colMap.caissesPF !== undefined ? (parseFloat(rows[r][colMap.caissesPF]) || 0) : 0;

      // Determine activite
      let activite = 'reconditionnement';
      const modeLower = modeTraitement.toLowerCase();
      if (modeLower.includes('traitement') && !modeLower.includes('reconditionnement')) {
        activite = 'traitement';
      } else if (modeLower.includes('evisceration') || modeLower.includes('etetage') || modeLower.includes('nettoyage')) {
        activite = 'traitement';
      }

      // Map mode emballage to conditionnement code
      let conditionnement = 'C12S2000';
      if (modeEmballage) {
        const embMatch = modeEmballage.match(/S(\d+(?:\.\d+)?)(?:Kg)?C(\d+)(?:Kg)?/i);
        if (embMatch) {
          const sachetKg = parseFloat(embMatch[1]);
          const cartonKg = parseFloat(embMatch[2]);
          const sachetG = Math.round(sachetKg * 1000);
          conditionnement = `C${cartonKg}S${sachetG}`;
        }
      }

      // Fuzzy match espece to known species
      let matchedEspece = especeStr;
      const speciesList = (App.data.especes || []).map(e => e.nom);
      if (speciesList.length > 0) {
        const upper = especeStr.toUpperCase();
        const found = speciesList.find(s => upper.includes(s.toUpperCase()) || s.toUpperCase().includes(upper.split('/')[0].trim().toUpperCase()));
        if (found) matchedEspece = found;
      }

      const poidsPF = poidsEmballe || poidsGlazurage || 0;

      entries.push({
        _sheetName: sheetName,
        _selected: true,
        date: this.formatDateISO(finalDate),
        dateTraitement: dateTraitement ? this.formatDateISO(dateTraitement) : null,
        dateEmballage: dateEmballage ? this.formatDateISO(dateEmballage) : null,
        espece: matchedEspece,
        especeOriginal: especeStr,
        caissesPI,
        poidsPI,
        modeTraitement,
        activite,
        poidsEvisceration,
        poidsTrempage,
        poidsLavage,
        poidsTriage,
        poidsCuisson,
        poidsDecorticage,
        poidsCongelation,
        poidsGlazurage,
        poidsEmballe,
        poidsPF,
        rendementFinal,
        conditionnement,
        modeEmballage,
        effectifs: rowEffectifs,
        heures: rowHeures,
        caissesPF,
        rendement: poidsPI > 0 ? (poidsPF / poidsPI * 100) : 0
      });
    }

    return entries;
  },

  parseExcelDateStr(str) {
    // Parse DD/MM/YYYY or DD-MM-YYYY
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  },

  formatDateISO(d) {
    if (!d) return '';
    if (typeof d === 'string') return d;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  showExcelPreviewModal(entries) {
    // Check for potential duplicates
    const existing = App.data.production || [];
    entries.forEach(e => {
      const isDup = existing.some(p => 
        p.date === e.date && 
        (p.espece || '').toUpperCase() === (e.espece || '').toUpperCase() &&
        Math.abs((p.poidsBrutPI || p.poidsMP || 0) - e.poidsPI) < 1
      );
      e._duplicate = isDup;
      if (isDup) e._selected = false;
    });

    const totalPoids = entries.filter(e => e._selected).reduce((s, e) => s + e.poidsPF, 0);
    const totalEntries = entries.filter(e => e._selected).length;

    const tableRows = entries.map((e, i) => {
      const rendStr = e.rendement > 0 ? App.formatNumber(e.rendement, 1) + '%' : '-';
      const dupBadge = e._duplicate ? '<span class="badge badge-warning" style="font-size:0.7rem; margin-left:6px;">⚠️ Doublon?</span>' : '';
      const activiteBadge = e.activite === 'traitement' 
        ? '<span class="badge badge-purple" style="font-size:0.7rem;">Traitement</span>'
        : '<span class="badge badge-info" style="font-size:0.7rem;">Recond.</span>';
      
      return `<tr style="${e._duplicate ? 'opacity:0.5;' : ''}">
        <td><input type="checkbox" id="xlCheck${i}" ${e._selected ? 'checked' : ''} onchange="Saisie._excelEntries[${i}]._selected = this.checked; Saisie.updateExcelPreviewSummary()"></td>
        <td style="font-weight:600; white-space:nowrap;">${App.formatDateFR ? App.formatDateFR(e.date) : e.date}</td>
        <td>
          <div style="font-weight:700; color:var(--text-primary);">${e.espece}</div>
          ${e.especeOriginal !== e.espece ? '<div style="font-size:0.72rem; color:var(--text-muted);">Excel: ' + e.especeOriginal + '</div>' : ''}
          ${dupBadge}
        </td>
        <td>${activiteBadge}</td>
        <td class="td-right">${App.formatNumber(e.caissesPI, 0)}</td>
        <td class="td-right">${App.formatNumber(e.poidsPI, 1)} kg</td>
        <td class="td-right td-bold" style="color:var(--accent-blue);">${App.formatNumber(e.poidsPF, 1)} kg</td>
        <td class="td-right">${rendStr}</td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${e.modeEmballage || '-'}</td>
        <td class="td-right">${e.effectifs || '-'}</td>
        <td class="td-right">${e.heures || '-'}</td>
      </tr>`;
    }).join('');

    this._excelEntries = entries;

    App.showModal('📊 Import Excel — Prévisualisation', `
      <div style="max-height:65vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding:12px; background:rgba(16,185,129,0.08); border-radius:10px; border:1px solid rgba(16,185,129,0.2);">
          <div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Entrées détectées</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--status-success);" id="xlPreviewCount">${totalEntries}</div>
          </div>
          <div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Poids total PF</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--accent-blue);" id="xlPreviewPoids">${App.formatNumber(totalPoids, 1)} kg</div>
          </div>
          <div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Feuilles Excel</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--text-primary);">${[...new Set(entries.map(e => e._sheetName))].length}</div>
          </div>
        </div>

        ${entries.some(e => e._duplicate) ? '<div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:10px; margin-bottom:12px; font-size:0.85rem; color:var(--status-warning);"><strong>⚠️ Doublons détectés</strong> — Certaines entrées semblent déjà exister (même date, espèce et poids). Elles sont désélectionnées par défaut.</div>' : ''}

        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <button class="btn btn-sm btn-outline" onclick="Saisie._excelEntries.forEach(e => e._selected = true); document.querySelectorAll('[id^=xlCheck]').forEach(c => c.checked = true); Saisie.updateExcelPreviewSummary();">✅ Tout sélectionner</button>
          <button class="btn btn-sm btn-outline" onclick="Saisie._excelEntries.forEach(e => e._selected = false); document.querySelectorAll('[id^=xlCheck]').forEach(c => c.checked = false); Saisie.updateExcelPreviewSummary();">❌ Tout désélectionner</button>
        </div>

        <div class="table-container">
          <table style="font-size:0.82rem;">
            <thead>
              <tr>
                <th style="width:30px;"></th>
                <th>Date</th>
                <th>Espèce</th>
                <th>Type</th>
                <th class="td-right">Css PI</th>
                <th class="td-right">Poids PI</th>
                <th class="td-right">Poids PF</th>
                <th class="td-right">Rend.</th>
                <th>Emballage</th>
                <th class="td-right">Eff.</th>
                <th class="td-right">Hrs</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    `, `
      <div style="display:flex; gap:12px; align-items:center;">
        <button class="btn btn-primary" style="min-width:220px; background:linear-gradient(135deg, #10b981, #059669); border:none; font-weight:700;" onclick="Saisie.importExcelEntries()">
          📥 Importer <span id="xlImportCount">${totalEntries}</span> saisies
        </button>
        <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      </div>
    `);
  },

  updateExcelPreviewSummary() {
    const selected = (this._excelEntries || []).filter(e => e._selected);
    const count = selected.length;
    const poids = selected.reduce((s, e) => s + e.poidsPF, 0);
    
    const countEl = document.getElementById('xlPreviewCount');
    const poidsEl = document.getElementById('xlPreviewPoids');
    const importCountEl = document.getElementById('xlImportCount');
    
    if (countEl) countEl.textContent = count;
    if (poidsEl) poidsEl.textContent = App.formatNumber(poids, 1) + ' kg';
    if (importCountEl) importCountEl.textContent = count;
  },

  importExcelEntries() {
    const entries = (this._excelEntries || []).filter(e => e._selected);
    if (entries.length === 0) {
      App.toast('Aucune entrée sélectionnée', 'error');
      return;
    }

    const p = App.data.parametres || {};
    const totalFixeH = App.data.personnel.filter(e => e.dept === 'Production').length;
    const salaireFixeTotal = App.data.personnel.filter(e => e.dept === 'Production').reduce((s, e) => s + e.salaire, 0);
    const salaireHF = p.heuresMensuelles > 0 && totalFixeH > 0 ? salaireFixeTotal / totalFixeH / (p.heuresMensuelles / totalFixeH) : 22.1;

    let imported = 0;
    
    entries.forEach(e => {
      // Build phases
      const phases = [];
      const phasesPF = [];
      // Build phases (Matière Première / Traitement)
      let currentQteMP = e.poidsPI;

      if (e.poidsLavage > 0) {
        phases.push({ nom: 'Lavage', seuil: 100, qteInit: currentQteMP, qteFinale: e.poidsLavage });
        currentQteMP = e.poidsLavage;
      }
      if (e.poidsTriage > 0) {
        phases.push({ nom: 'Triage', seuil: 100, qteInit: currentQteMP, qteFinale: e.poidsTriage });
        currentQteMP = e.poidsTriage;
      }
      if (e.poidsEvisceration > 0) {
        phases.push({ nom: 'Evisceration', seuil: 77, qteInit: currentQteMP, qteFinale: e.poidsEvisceration });
        currentQteMP = e.poidsEvisceration;
      }
      if (e.poidsCuisson > 0) {
        phases.push({ nom: 'Cuisson', seuil: 80, qteInit: currentQteMP, qteFinale: e.poidsCuisson });
        currentQteMP = e.poidsCuisson;
      }
      if (e.poidsDecorticage > 0) {
        phases.push({ nom: 'Decorticage', seuil: 70, qteInit: currentQteMP, qteFinale: e.poidsDecorticage });
        currentQteMP = e.poidsDecorticage;
      }

      // Build phasesPF (Produit Fini / Reconditionnement)
      let currentQtePF = currentQteMP; // starts where MP left off

      if (e.poidsTrempage > 0) {
        phasesPF.push({ nom: 'Trempage', seuil: 110, qteInit: currentQtePF, qteFinale: e.poidsTrempage });
        currentQtePF = e.poidsTrempage;
      }
      if (e.poidsCongelation > 0) {
        phasesPF.push({ nom: 'Congelation', seuil: 95, qteInit: currentQtePF, qteFinale: e.poidsCongelation });
        currentQtePF = e.poidsCongelation;
      }
      if (e.poidsGlazurage > 0) {
        phasesPF.push({ nom: 'Glasurage', seuil: 107, qteInit: currentQtePF, qteFinale: e.poidsGlazurage });
        currentQtePF = e.poidsGlazurage;
      }
      if (e.poidsEmballe > 0) {
        phasesPF.push({ nom: 'Emballage', seuil: 100, qteInit: currentQtePF, qteFinale: e.poidsEmballe });
      }

      // If no phasesPF were built, add a default Glasurage if we have a PF weight
      if (phasesPF.length === 0 && e.poidsPF > 0) {
        phasesPF.push({ nom: 'Glasurage', seuil: 107, qteInit: currentQtePF, qteFinale: e.poidsPF });
      }

      // Build MO
      const heuresMOF = totalFixeH * 8;
      const coutPF = heuresMOF * salaireHF;
      const equipesMO = [];
      let coutMOO = 0;

      if (e.effectifs > 0 && e.heures > 0) {
        const heuresParPersonne = e.heures / e.effectifs;
        const taux = p.salaireHoraireOcc || 17;
        const coutEq = e.effectifs * heuresParPersonne * taux;
        equipesMO.push({
          profil: 'Ouvrière',
          nb: e.effectifs,
          heures: parseFloat(heuresParPersonne.toFixed(1)),
          taux: taux,
          coutEq: coutEq
        });
        coutMOO = coutEq;
      }

      // Build intrants (empty - will be filled manually)
      const intrants = [];

      // Build the production entry
      const isRecond = e.activite === 'reconditionnement';
      const rendement = e.poidsPI > 0 ? (e.poidsPF / e.poidsPI * 100) : 0;

      const entry = {
        id: App.nextId(App.data.production),
        activite: e.activite,
        date: e.date,
        espece: e.espece,
        calibre: '',
        client: '',
        caissesPI: e.caissesPI,
        poidsBrutPI: e.poidsPI,
        poidsMP: e.poidsPI,
        caissesPF: e.caissesPF || 0,
        poidsBrutPF: e.poidsPF,
        produitFini: (e.espece + ' ' + (isRecond ? 'Reconditionné' : 'Traité')).trim().toUpperCase(),
        conditionnement: e.conditionnement,
        modeTraitement: e.modeTraitement,
        modeEmballage: e.modeEmballage,
        reliquatNom: '',
        reliquatPoids: 0,
        equipesMO,
        coutMOO,
        heuresMOF,
        salaireHF,
        coutPersonnelF: coutPF,
        coutMOJ: coutMOO + coutPF,
        phases: e.activite === 'traitement' ? phases : undefined,
        phasesPF,
        intrants,
        totalIntrants: 0,
        prixMP: 0,
        valeurMP: 0,
        rendement,
        importSource: 'excel',
        importDate: new Date().toISOString()
      };

      App.data.production.push(entry);
      imported++;
    });

    if (entries.length > 0) {
      const firstDate = new Date(entries[0].date);
      this.selectedYear = firstDate.getFullYear();
      this.selectedMonth = firstDate.getMonth();
      this.selectedDay = entries[0].date; // Use the raw date string from entry
      // Optionnel: this.viewType = 'day'; // On pourrait forcer la vue jour après import
    }

    App.saveData();
    App.closeModal();
    this.render();
    App.toast(`✅ ${imported} saisie(s) importée(s) depuis Excel avec succès!`, 'success');
    this._excelEntries = null;
  }
};
