/* ============================================
   SAISIE — Formulaire de saisie journalière
   ============================================ */
const Traitement = {
  editingId: null,
  currentActivite: 'reconditionnement',
  phasesList: ['Triage-Lavage','Glasurage','Nettoyage','Cuisson','Emballage','RECEPTION','EVISCERATION ET ETETAGE','Mélançage','Trempage','Congélation','DECONGELATION'],

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
    'C12': { article: 'Carton 12 KG', prix: 11.64 },
    'C13': { article: 'Carton 12 KG', prix: 12.50 },
    'C15': { article: 'Carton 12 KG', prix: 14.00 },
    'C17': { article: 'Carton 12 KG', prix: 15.00 },
    'C19': { article: 'Carton 12 KG', prix: 16.50 },
    'C20': { article: 'Carton 12 KG', prix: 18.00 },
  },

  sachetMap: {
    'S1000': { article: 'Sachet 30x40 1 Kg', prix: 24.46, ratio: 76 },
    'S1500': { article: 'Sachet 40x40 1,5 Kg', prix: 24.00, ratio: 68 },
    'S2000': { article: 'Sachet 40x50 2 Kg', prix: 24.00, ratio: 60 },
  },

  sachetRatioMap: {
    'Sachet 30x40': 76,
    'Sachet 30x40 1 Kg': 76,
    'Sachet 1kg': 76,
    'Sachet 1 kg': 76,
    'Sachet 40x40': 68,
    'Sachet 40x40 1,5 Kg': 68,
    'Sachet 40x50': 60,
    'Sachet 40x50 2 Kg': 60,
    'Sachet 1.5kg': 68,
    'Sachet 1,5 kg': 68,
    'Sachet 40x60': 60,
    'Sachet 40x60x40': 60,
    'Sachet 2kg': 60,
    'Sachet 2 kg': 60,
  },

  intrantsMaster: [
    { ref: 'SEL', article: 'SEL', famille: 'INTRANT', prix: 0.60 },
    { ref: 'S1000', article: 'Sachet 30x40 1 Kg', famille: 'PLASTIQUE', prix: 24.46 },
    { ref: 'S1500', article: 'Sachet 40x40 1,5 Kg', famille: 'PLASTIQUE', prix: 24.00 },
    { ref: 'S2338', article: 'Sachet 23x38', famille: 'PLASTIQUE', prix: 24.00 },
    { ref: 'S2535', article: 'Sachet 25x35', famille: 'PLASTIQUE', prix: 25.28 },
    { ref: 'S4050', article: 'Sachet 40x50 2 Kg', famille: 'PLASTIQUE', prix: 24.00 },
    { ref: 'S7780', article: 'Sachet 77x80', famille: 'PLASTIQUE', prix: 25.20 },
    { ref: 'S4060', article: 'Sachet 40x60', famille: 'PLASTIQUE', prix: 24.00 },
    { ref: 'S1230', article: 'Sachet 12x30', famille: 'PLASTIQUE', prix: 27.60 },
    { ref: 'S1440', article: 'Sachet 14x40', famille: 'PLASTIQUE', prix: 27.60 },
    { ref: 'S1450', article: 'Sachet 14x50', famille: 'PLASTIQUE', prix: 27.60 },
    { ref: 'S4065', article: 'Sachet 40x65', famille: 'PLASTIQUE', prix: 27.60 },
    { ref: 'S61120', article: 'Sachet 61+5(13)x120x80', famille: 'PLASTIQUE', prix: 25.20 },
    { ref: 'S6080', article: 'Sachet 60+5(16)x80x40', famille: 'PLASTIQUE', prix: 25.20 },
    { ref: 'S4353', article: 'Sachet 43x53', famille: 'PLASTIQUE', prix: 24.00 },
    { ref: 'S5885', article: 'Sachet 58x85', famille: 'PLASTIQUE', prix: 24.00 },
    { ref: 'C12', article: 'Carton 12 KG', famille: 'CARTON', prix: 11.64 },
    { ref: 'SCT', article: 'Scotch transparent / TR', famille: 'PLASTIQUE', prix: 11.24 },
    { ref: 'SCM', article: 'Ruban Scotch (Marron)', famille: 'PLASTIQUE', prix: 10.80 },
    { ref: 'FLM', article: 'Film Étirable', famille: 'PLASTIQUE', prix: 42.00 },
    { ref: 'P120', article: 'Palette 120 x 100', famille: 'EQUIPEMENT', prix: 50.23 },
    { ref: 'PJ', article: 'Palette j', famille: 'EQUIPEMENT', prix: 35.00 },
    { ref: 'PE', article: 'Palette Euro', famille: 'EQUIPEMENT', prix: 90.00 },
    { ref: 'ELEC', article: 'ELECTRICITE', famille: 'EAU-ELEC', prix: 0 },
    { ref: 'SC', article: 'AUTRES CHARGES', famille: 'DIVERS', prix: 0 },
  ],
  render() {
    let prod = App.getCurrentMonthProduction();
    prod = prod.filter(p => (p.activite||'reconditionnement') === this.currentActivite);
    const content = document.getElementById('pageContent');
    
    let title = 'Fiches de traitement';
    if(this.currentActivite === 'reconditionnement') title = 'Fiches de reconditionnement';
    if(this.currentActivite === 'divers') title = 'Saisies diverses';

    content.innerHTML = `
      <div class="fade-in" style="background:#fff;border-radius:4px;border:1px solid #d1d1e0;padding:12px;">
        <div style="font-weight:700;color:#333;text-align:center;margin-bottom:12px;font-size:1.1rem;text-transform:uppercase;">
          ${title}
        </div>

        <div class="ntsamak-tabs" style="display:flex;gap:10px;margin-bottom:15px;border-bottom:2px solid #e0e0e0;padding-bottom:5px;justify-content:center;">
          <button class="ntsamak-tab ${this.currentActivite==='reconditionnement'?'active':''}" onclick="Traitement.switchActivite('reconditionnement')" style="padding:8px 16px;border:none;background:transparent;${this.currentActivite==='reconditionnement'?'border-bottom:3px solid var(--primary-color);color:var(--primary-color);font-weight:700;':'color:#666;font-weight:600;'}cursor:pointer;">Réceptions MP</button>
          <button class="ntsamak-tab ${this.currentActivite==='traitement'?'active':''}" onclick="Traitement.switchActivite('traitement')" style="padding:8px 16px;border:none;background:transparent;${this.currentActivite==='traitement'?'border-bottom:3px solid var(--primary-color);color:var(--primary-color);font-weight:700;':'color:#666;font-weight:600;'}cursor:pointer;">Fiches de Traitement</button>
          <button class="ntsamak-tab ${this.currentActivite==='divers'?'active':''}" onclick="Traitement.switchActivite('divers')" style="padding:8px 16px;border:none;background:transparent;${this.currentActivite==='divers'?'border-bottom:3px solid var(--primary-color);color:var(--primary-color);font-weight:700;':'color:#666;font-weight:600;'}cursor:pointer;">Divers</button>
        </div>

        <div class="ntsamak-filter-bar">
          <div class="ntsamak-filter-group">
            <label class="ntsamak-filter-label">Date début:*</label>
            <input type="date" class="ntsamak-filter-input" value="${App.formatDate(new Date(new Date().setMonth(new Date().getMonth()-1)))}">
          </div>
          <div class="ntsamak-filter-group">
            <label class="ntsamak-filter-label">Date fin:*</label>
            <input type="date" class="ntsamak-filter-input" value="${App.formatDate(new Date())}">
          </div>
          <div class="ntsamak-filter-group" style="flex:1">
            <label class="ntsamak-filter-label">Sociétés:</label>
            <select class="ntsamak-filter-input"><option>----------</option></select>
          </div>
          <div class="ntsamak-filter-group" style="flex:1">
            <label class="ntsamak-filter-label">Espèces:</label>
            <select class="ntsamak-filter-input" id="filterEspece" onchange="Traitement.renderTable()">
              <option value="">Toutes les espèces</option>
              ${App.data.especes.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
          </div>
          <button class="btn-ntsamak-green" style="margin-top:16px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Rechercher
          </button>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;background:#fdfdfd;padding:8px;border:1px solid #d1d1e0;">
          <button class="btn-ntsamak-green" onclick="Traitement.showNewForm()" style="padding:4px 12px;font-size:0.9rem;">
            + Ajouter
          </button>
        </div>

        <div id="saisieFormContainer"></div>

        <div class="table-container" id="saisieTable">
          ${this.buildTable(prod)}
        </div>
      </div>
    `;
  },

  renderTable() {
    let prod = App.getCurrentMonthProduction();
    prod = prod.filter(p => (p.activite||'reconditionnement') === this.currentActivite);
    const filter = document.getElementById('filterEspece')?.value;
    if (filter) prod = prod.filter(p => p.espece === filter);
    document.getElementById('saisieTable').innerHTML = this.buildTable(prod);
  },

  buildTable(prod) {
    if (prod.length === 0) return `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Aucune saisie</div></div>`;
    const sorted = [...prod].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `<table>
      <thead><tr><th>Date</th><th>Espèce</th><th>C. PI</th><th>Poids PI</th><th>C. PF</th><th>Poids PF</th><th>H. M.O.</th><th>Coût M.O.</th><th>Coût Emb.</th><th>Coût Total</th><th>Actions</th></tr></thead>
      <tbody>${sorted.map(p => {
        const coutEmb = (p.coutCarton||0)+(p.coutSachet||0)+(p.coutScotch||0);
        const coutTotal = (p.coutMOJ||0)+coutEmb;
        return `<tr>
          <td>${App.formatDateFR(p.date)}</td>
          <td><span class="badge badge-info">${p.espece}</span></td>
          <td class="td-right">${p.caissesPI||''}</td>
          <td class="td-right">${App.formatNumber(p.poidsBrutPI,1)}</td>
          <td class="td-right">${p.caissesPF||''}</td>
          <td class="td-right td-bold">${App.formatNumber(p.poidsBrutPF,1)}</td>
          <td class="td-right">${App.formatNumber((p.heuresMOO||0)+(p.heuresMOF||0),1)}</td>
          <td class="td-right">${App.formatNumber(p.coutMOJ,0)}</td>
          <td class="td-right">${App.formatNumber(coutEmb,0)}</td>
          <td class="td-right td-bold">${App.formatNumber(coutTotal,0)} DH</td>
          <td class="td-center">
            <button class="btn-icon" onclick="Traitement.editEntry(${p.id})" title="Modifier"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
            <button class="btn-icon danger" onclick="Traitement.deleteEntry(${p.id})" title="Supprimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </td>
        </tr>`}).join('')}</tbody>
    </table>`;
  },

  showForm(entry = null) {
    this.editingId = entry ? entry.id : null;
    const p = App.data.parametres;
    const totalFixeH = App.data.personnel.filter(e => e.dept === 'Production').length;
    const salaireFixeTotal = App.data.personnel.filter(e => e.dept === 'Production').reduce((s, e) => s + e.salaire, 0);
    const salaireHF = p.heuresMensuelles > 0 ? salaireFixeTotal / totalFixeH / (p.heuresMensuelles / App.data.personnel.filter(e => e.dept === 'Production').length) : 22.1;

    const container = document.getElementById('saisieFormContainer');
    container.innerHTML = `
      <div class="card slide-up" style="margin-bottom:22px;">
        <div class="card-header">
          <span class="card-title">${entry ? '✏️ Modifier la saisie' : '📝 Nouvelle saisie journalière'}</span>
          <button class="btn-icon" onclick="Traitement.hideForm()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="card-body">
          <div class="form-section">
            <div class="form-section-title">🔹 Informations générales</div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-input" id="fDate" value="${entry ? App.formatDate(entry.date) : App.formatDate(new Date())}" onchange="Traitement.calc()">
              </div>
              <div class="form-group">
                <label class="form-label">Espèce</label>
                <select class="form-select" id="fEspece">
                  ${App.data.especes.map(e => `<option value="${e}" ${entry && entry.espece===e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Client</label>
                <select class="form-select" id="fClient">
                  <option value="">(Interne)</option>
                  ${(App.data.tiers?.clients||[]).map(c => `<option value="${c}" ${entry && entry.client===c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Fournisseur / Bateau</label>
                <select class="form-select" id="fFournisseur">
                  <option value="">Sélectionner</option>
                  ${(App.data.tiers?.fournisseurs||[]).map(c => `<option value="${c}" ${entry && entry.fournisseur===c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Réf. Lot</label>
                <input type="text" class="form-input" id="fRefLot" value="${entry ? entry.refLot||'' : ''}" placeholder="Traçabilité">
              </div>
              <div class="form-group">
                <label class="form-label">Origine Capture</label>
                <input type="text" class="form-input" id="fOrigine" value="${entry ? entry.origineCapture||'' : ''}" placeholder="Zone de pêche">
              </div>
              <div class="form-group">
                <label class="form-label">Reliquat / Notes</label>
                <input type="text" class="form-input" id="fReliquat" value="${entry ? entry.reliquat||'' : ''}" placeholder="Ex: ROTO=11.4KG">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">🔹 Production</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Caisses PI</label><input type="number" class="form-input" id="fCaissesPI" value="${entry?entry.caissesPI||'':''}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Poids Brut PI (kg)</label><input type="number" step="0.1" class="form-input" id="fPoidsPI" value="${entry?entry.poidsBrutPI||'':''}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Caisses PF</label><input type="number" class="form-input" id="fCaissesPF" value="${entry?entry.caissesPF||'':''}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Poids Brut PF (kg)</label><input type="number" step="0.1" class="form-input" id="fPoidsPF" value="${entry?entry.poidsBrutPF||'':''}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Conditionnement</label><select class="form-select" id="fConditionnement" onchange="Traitement.calc()">${Traitement.emballagesList.map(e=>`<option value="${e.code}" ${entry && entry.conditionnement===e.code?'selected':''}>${e.code} — ${e.designation}</option>`).join('')}</select></div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">🔹 Main-d'œuvre</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Heures M.O. Occasionnelle</label><input type="number" step="0.25" class="form-input" id="fHeuresMOO" value="${entry?entry.heuresMOO||'':''}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Salaire Horaire (DH)</label><input type="number" class="form-input" id="fSalaireH" value="${entry?entry.salaireH||p.salaireHoraireOcc:p.salaireHoraireOcc}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Coût M.O. Occasionnelle</label><div class="form-computed" id="fCoutMOO">0.00 DH</div></div>
              <div class="form-group"><label class="form-label">Heures M.O. Fixe</label><input type="number" step="0.5" class="form-input" id="fHeuresMOF" value="${entry?entry.heuresMOF||totalFixeH*8:totalFixeH*8}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Salaire H/F (DH)</label><input type="number" step="0.01" class="form-input" id="fSalaireHF" value="${entry?entry.salaireHF||22.1:22.1}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Coût Personnel Fixe</label><div class="form-computed" id="fCoutPF">0.00 DH</div></div>
            </div>
            <div style="margin-top:12px;padding:14px;background:rgba(99,102,241,0.08);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;color:var(--text-secondary);">COÛT M.O. TOTAL / JOUR</span>
              <span class="form-computed" id="fCoutMOJ" style="font-size:1.2rem;border:none;padding:0;">0.00 DH</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">🔹 Consommables</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Nb Cartons utilisés</label><input type="number" class="form-input" id="fNbCartons" value="${entry?entry.nbCartons||'':''}" onchange="Traitement.calc()" placeholder="Auto-calculé si vide"></div>
              <div class="form-group"><label class="form-label">Coût Carton</label><div class="form-computed" id="fCoutCarton">0.00 DH</div></div>
              <div class="form-group"><label class="form-label">Nb Sachets (unités)</label><input type="number" class="form-input" id="fNbSachets" value="${entry?entry.nbSachets||'':''}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Coût Sachet</label><div class="form-computed" id="fCoutSachet">0.00 DH</div></div>
              <div class="form-group"><label class="form-label">Scotch (qté)</label><input type="number" class="form-input" id="fScotch" value="${entry?entry.nbScotch||15:15}" onchange="Traitement.calc()"></div>
              <div class="form-group"><label class="form-label">Coût Scotch</label><div class="form-computed" id="fCoutScotch">0.00 DH</div></div>
            </div>
          </div>

          <div class="summary-box">
            <h3 style="margin-bottom:14px;font-size:1.05rem;">📊 Résumé des coûts de la journée</h3>
            <div class="summary-row"><span class="summary-label">Coût Main-d'œuvre</span><span class="summary-value" id="sumMO">0 DH</span></div>
            <div class="summary-row"><span class="summary-label">Coût Emballage</span><span class="summary-value" id="sumEmb">0 DH</span></div>
            <div class="summary-row"><span class="summary-label">Rendement (PF / PI)</span><span class="summary-value" id="sumRendement" style="color:var(--primary);font-weight:bold;">-</span></div>
            <div class="summary-row"><span class="summary-label">Coût Total Journée</span><span class="summary-value summary-total" id="sumTotal">0 DH</span></div>
            <div class="summary-row"><span class="summary-label">Coût / kg produit</span><span class="summary-value" id="sumParKg">0 DH/kg</span></div>
          </div>

          <div style="margin-top:18px;display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn btn-outline" onclick="Traitement.hideForm()">Annuler</button>
            <button class="btn btn-success" onclick="Traitement.saveEntry()">💾 ${entry ? 'Mettre à jour' : 'Enregistrer'}</button>
          </div>
        </div>
      </div>
    `;
    this.calc();
  },

  hideForm() { document.getElementById('saisieFormContainer').innerHTML = ''; this.editingId = null; },

  calc() {
    const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    const coutMOO = v('fHeuresMOO') * v('fSalaireH');
    const coutPF = v('fHeuresMOF') * v('fSalaireHF');
    const coutMOJ = coutMOO + coutPF;

    // Consommables
    const cons = App.data.consommables;
    const prixCarton = cons.find(c => c.nom === 'Carton 12 KG')?.prixUnitaire || 11.64;
    const prixScotch = cons.find(c => c.nom === 'Scotch transparent / TR')?.prixUnitaire || 11.237;

    let nbCartons = v('fNbCartons');
    if (!nbCartons && v('fCaissesPF') > 0) { nbCartons = v('fCaissesPF'); document.getElementById('fNbCartons').value = nbCartons; }

    const nbSachets = v('fNbSachets') || v('fCaissesPF') * 12;
    if (!document.getElementById('fNbSachets').value && v('fCaissesPF') > 0) document.getElementById('fNbSachets').value = nbSachets;

    // Determine ratio and exact sachet price based on conditionnement
    const cond = document.getElementById('fConditionnement')?.value || '';
    let ratio = 70; // fallback
    let prixSachet = 24;
    const matchS = cond.match(/S(\d+)$/);
    if (matchS) {
        const sKey = 'S' + matchS[1];
        const s = Traitement.sachetMap[sKey];
        if (s) {
            ratio = s.ratio || 70;
            prixSachet = cons.find(c => c.nom === s.article)?.prixUnitaire || s.prix;
        }
    }

    const sachetsKg = nbSachets / ratio;
    const coutCarton = nbCartons * prixCarton * 0.97; // Wait, why * 0.97? Let's keep existing logic just in case it was a business rule.
    const coutSachet = sachetsKg * prixSachet;
    const coutScotch = v('fScotch') * prixScotch;
    const totalEmb = coutCarton + coutSachet + coutScotch;
    const totalJ = coutMOJ + totalEmb;
    const poidsPI = v('fPoidsPI');
    const poidsPF = v('fPoidsPF');
    const parKg = poidsPF > 0 ? totalJ / poidsPF : 0;
    const rendement = poidsPI > 0 ? (poidsPF / poidsPI) * 100 : 0;

    document.getElementById('fCoutMOO').textContent = App.formatNumber(coutMOO) + ' DH';
    document.getElementById('fCoutPF').textContent = App.formatNumber(coutPF) + ' DH';
    document.getElementById('fCoutMOJ').textContent = App.formatNumber(coutMOJ) + ' DH';
    document.getElementById('fCoutCarton').textContent = App.formatNumber(coutCarton) + ' DH';
    document.getElementById('fCoutSachet').textContent = App.formatNumber(coutSachet) + ' DH';
    document.getElementById('fCoutScotch').textContent = App.formatNumber(coutScotch) + ' DH';
    document.getElementById('sumMO').textContent = App.formatNumber(coutMOJ, 0) + ' DH';
    document.getElementById('sumEmb').textContent = App.formatNumber(totalEmb, 0) + ' DH';
    document.getElementById('sumTotal').textContent = App.formatNumber(totalJ, 0) + ' DH';
    document.getElementById('sumRendement').textContent = rendement > 0 ? rendement.toFixed(1) + ' %' : '-';
    document.getElementById('sumParKg').textContent = App.formatNumber(parKg) + ' DH/kg';
  },

  saveEntry() {
    const v = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    const date = document.getElementById('fDate').value;
    const espece = document.getElementById('fEspece').value;
    if (!date || !espece) { App.toast('Veuillez remplir la date et l\'espèce', 'error'); return; }

    const cons = App.data.consommables;
    const prixCarton = cons.find(c => c.nom === 'Carton 12 KG')?.prixUnitaire || 11.64;
    const prixScotch = cons.find(c => c.nom === 'Scotch transparent / TR')?.prixUnitaire || 11.237;

    let nbCartons = v('fNbCartons');
    if (!nbCartons && v('fCaissesPF') > 0) nbCartons = v('fCaissesPF');
    
    let nbSachets = v('fNbSachets');
    if (!nbSachets && v('fCaissesPF') > 0) nbSachets = v('fCaissesPF') * 12;

    const cond = document.getElementById('fConditionnement')?.value || '';
    let ratio = 70; // fallback
    let prixSachet = 24;
    let nomSachet = 'Sachet';
    const matchS = cond.match(/S(\d+)$/);
    if (matchS) {
        const sKey = 'S' + matchS[1];
        const s = Traitement.sachetMap[sKey];
        if (s) {
            ratio = s.ratio || 70;
            nomSachet = s.article;
            prixSachet = cons.find(c => c.nom === s.article)?.prixUnitaire || s.prix;
        }
    }

    const sachetsKg = nbSachets / ratio;
    const coutMOO = v('fHeuresMOO') * v('fSalaireH');
    const coutPF = v('fHeuresMOF') * v('fSalaireHF');

    const entry = {
      id: this.editingId || App.nextId(App.data.production),
      activite: 'reconditionnement',
      date, espece,
      client: document.getElementById('fClient')?.value || '',
      fournisseur: document.getElementById('fFournisseur')?.value || '',
      refLot: document.getElementById('fRefLot')?.value || '',
      origineCapture: document.getElementById('fOrigine')?.value || '',
      conditionnement: cond,
      caissesPI: v('fCaissesPI'), poidsBrutPI: v('fPoidsPI'),
      caissesPF: v('fCaissesPF'), poidsBrutPF: v('fPoidsPF'),
      reliquat: document.getElementById('fReliquat').value,
      heuresMOO: v('fHeuresMOO'), salaireH: v('fSalaireH'), coutMOO,
      heuresMOF: v('fHeuresMOF'), salaireHF: v('fSalaireHF'), coutPersonnelF: coutPF,
      coutMOJ: coutMOO + coutPF,
      nbCartons, coutCarton: nbCartons * prixCarton * 0.97,
      nbSachets, sachetsKg, coutSachet: sachetsKg * prixSachet,
      nbScotch: v('fScotch'), coutScotch: v('fScotch') * prixScotch
    };

    if (this.editingId) {
      const idx = App.data.production.findIndex(p => p.id === this.editingId);
      if (idx !== -1) App.data.production[idx] = entry;
    } else {
      App.data.production.push(entry);
      // Deduct stock
      this.deductStock('Carton 12 KG', nbCartons);
      this.deductStock(nomSachet, sachetsKg);
      this.deductStock('Scotch transparent / TR', v('fScotch'));
    }

    App.saveData();
    this.hideForm();
    this.render();
    App.toast(this.editingId ? 'Saisie mise à jour' : 'Saisie enregistrée', 'success');
  },

  deductStock(nom, qty) {
    const c = App.data.consommables.find(c => c.nom === nom);
    if (c && qty > 0) {
      c.stock = Math.max(0, c.stock - qty);
      App.data.mouvementsStock.push({ date: new Date().toISOString(), consommable: nom, type: 'sortie', quantite: qty, motif: 'Production' });
    }
  },

  editEntry(id) {
    const entry = App.data.production.find(p => p.id === id);
    if (entry) {
      if (entry.activite === 'traitement' || entry.activite === 'divers') this.showTraitementForm(entry);
      else this.showForm(entry);
    }
  },

  deleteEntry(id) {
    if (!confirm('Supprimer cette saisie ?')) return;
    App.data.production = App.data.production.filter(p => p.id !== id);
    App.saveData();
    this.renderTable();
    App.toast('Saisie supprimée', 'info');
  },

  switchActivite(act) {
    this.currentActivite = act;
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
    const intrants = entry?.intrants ? JSON.parse(JSON.stringify(entry.intrants)) : this.getDefaultIntrants(conditionnement);

    // Fix legacy entries where sachet price was saved per kg
    intrants.forEach(it => {
        if (it.prix > 5) {
            for (const [key, r] of Object.entries(Traitement.sachetRatioMap)) {
                if (it.article.toLowerCase().includes(key.toLowerCase())) {
                    it.prix = parseFloat((it.prix / r).toFixed(4));
                    break;
                }
            }
        }
    });

    const container = document.getElementById('saisieFormContainer');
    container.innerHTML = `
      <div class="ntsamak-modal-overlay">
        <div class="ntsamak-modal slide-up" style="max-width:1100px;">
          <div class="ntsamak-modal-header">
            <span class="ntsamak-modal-title">Fiches de traitement</span>
            <button class="btn-icon" onclick="Traitement.hideForm()" style="color:#64748b;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
          </div>
          <div class="ntsamak-modal-body">
            
            <div class="ntsamak-details-header">
              <div class="header-main">
                <div class="header-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div style="display:flex; flex-direction:column;">
                  <h3 style="margin:0;font-size:1.25rem;font-weight:700;">DÉTAILS DE LA FICHE DE TRAITEMENT</h3>
                  <span style="font-size:0.85rem;opacity:0.9;">Gérez les phases de production et les rendements</span>
                </div>
                <button class="btn-ai-magic" style="margin-left:20px;" onclick="App.AiEngine.openScanner('traitement', Traitement.autoFillFromAI.bind(Traitement))">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  Scan IA
                </button>
              </div>
              <div class="ntsamak-badges">
                <div class="ntsamak-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  RENDEMENT
                  <span class="ntsamak-badge-val" id="badgeRendement">0,00%</span>
                </div>
                <div class="ntsamak-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/></svg>
                  PRIX REVIENT
                  <span class="ntsamak-badge-val" id="badgePrixRevient">0,00</span>
                </div>
              </div>
            </div>
          <div class="form-section">
            <div class="form-section-title">🔹 Liaison réception & infos</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Réception (stockage) *</label><select class="form-select" id="tReception">${receptions}</select></div>
              <div class="form-group"><label class="form-label">Date *</label><input type="date" class="form-input" id="tDate" value="${entry?App.formatDate(entry.date):App.formatDate(new Date())}"></div>
              <div class="form-group">
                <label class="form-label">Client</label>
                <select class="form-select" id="tClient" onchange="Traitement.refreshQR()">
                  <option value="">(Interne)</option>
                  ${(App.data.tiers?.clients||[]).map(c => `<option value="${c}" ${entry && entry.client===c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Fournisseur / Bateau</label>
                <select class="form-select" id="tFournisseur">
                  <option value="">Sélectionner</option>
                  ${(App.data.tiers?.fournisseurs||[]).map(c => `<option value="${c}" ${entry && entry.fournisseur===c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Réf. Lot</label>
                <input type="text" class="form-input" id="tRefLot" value="${entry ? entry.refLot||'' : ''}" placeholder="Traçabilité">
              </div>
              <div class="form-group">
                <label class="form-label">Origine Capture</label>
                <input type="text" class="form-input" id="tOrigine" value="${entry ? entry.origineCapture||'' : ''}" placeholder="Zone de pêche">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">🔹 Matière première</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Espèce / Calibre</label><select class="form-select" id="tEspece" onchange="Traitement.refreshQR()">${App.data.especes.map(e=>`<option value="${e}" ${entry?.espece===e?'selected':''}>${e}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Poids net total MP (kg)</label><input type="number" step="0.01" class="form-input" id="tPoidsMP" value="${entry?.poidsMP||''}" onchange="Traitement.calcT()"></div>
              <div class="form-group"><label class="form-label">Valeur MP (DH)</label><input type="number" step="0.01" class="form-input" id="tValeurMP" value="${entry?.valeurMP||''}"></div>
              <div class="form-group"><label class="form-label">Prix moyen (DH/kg)</label><div class="form-computed" id="tPrixMoyen">0.00</div></div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;"><span>🔹 Phases matière première</span><button class="btn btn-sm btn-outline" onclick="Traitement.addPhase('tPhasesMP')">+ Phase</button></div>
            <table><thead><tr><th>Phase</th><th>Seuil %</th><th>Qté initiale</th><th>Qté finale</th><th>Rend. phase</th><th>Rend. cumulé</th><th style="width:30px"></th></tr></thead>
            <tbody id="tPhasesMP">${phases.map((ph,i)=>`<tr>
              <td><select class="form-select" style="width:160px;padding:5px;font-weight:700" data-ph="nom">${Traitement.phasesList.map(p=>`<option value="${p}" ${ph.nom===p?'selected':''}>${p}</option>`).join('')}</select></td>
              <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="${ph.seuil}" data-ph="seuil" data-idx="${i}" onchange="Traitement.calcT()"></td>
              <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteInit||''}" data-ph="qteInit" data-idx="${i}" onchange="Traitement.calcT()"></td>
              <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteFinale||''}" data-ph="qteFinale" data-idx="${i}" onchange="Traitement.calcT()"></td>
              <td class="td-right td-bold" id="rendPhMP${i}">0%</td>
              <td class="td-right" id="rendCumMP${i}">0%</td>
              <td><button class="btn-icon danger" onclick="Traitement.removePhase(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>
            </tr>`).join('')}</tbody></table>
          </div>

          <div class="form-section">
            <div class="form-section-title">🔹 Produits finis</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Produit fini</label><input type="text" class="form-input" id="tProduitFini" value="${entry?.produitFini||''}" placeholder="Ex: TUBE DE CALAMAR"></div>
              <div class="form-group"><label class="form-label">Poids net PF (kg)</label><input type="number" step="0.01" class="form-input" id="tPoidsPF" value="${entry?.poidsBrutPF||''}" onchange="Traitement.calcT()"></div>
              <div class="form-group"><label class="form-label">Nb Caisses PF</label><input type="number" class="form-input" id="tCaissesPF" value="${entry?.caissesPF||''}"></div>
              <div class="form-group"><label class="form-label">Conditionnement</label><select class="form-select" id="tConditionnement" onchange="Traitement.onConditionnementChange()">${Traitement.emballagesList.map(e=>`<option value="${e.code}" ${conditionnement===e.code?'selected':''}>${e.code} — ${e.designation}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">Rendement global</label><div class="form-computed" id="tRendement">0.00%</div></div>
              <div class="form-group"><label class="form-label">Coût matière révisé</label><div class="form-computed" id="tCoutMatiere">0.00 DH</div></div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;"><span>🔹 Phases produits finis</span><button class="btn btn-sm btn-outline" onclick="Traitement.addPhase('tPhasesPF')">+ Phase</button></div>
            <table><thead><tr><th>Phase</th><th>Seuil %</th><th>Qté initiale</th><th>Qté finale</th><th>Rend. phase</th><th>Rend. cumulé</th><th style="width:30px"></th></tr></thead>
            <tbody id="tPhasesPF">${phasesPF.map((ph,i)=>`<tr>
              <td><select class="form-select" style="width:160px;padding:5px;font-weight:700" data-ph="nom">${Traitement.phasesList.map(p=>`<option value="${p}" ${ph.nom===p?'selected':''}>${p}</option>`).join('')}</select></td>
              <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="${ph.seuil}" data-ph="seuil" data-idx="${i}" onchange="Traitement.calcT()"></td>
              <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteInit||''}" data-ph="qteInit" data-idx="${i}" onchange="Traitement.calcT()"></td>
              <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="${ph.qteFinale||''}" data-ph="qteFinale" data-idx="${i}" onchange="Traitement.calcT()"></td>
              <td class="td-right td-bold" id="rendPhPF${i}">0%</td>
              <td class="td-right" id="rendCumPF${i}">0%</td>
              <td><button class="btn-icon danger" onclick="Traitement.removePhase(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>
            </tr>`).join('')}</tbody></table>
          </div>

          <div class="form-section">
            <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
              <span>🔹 Intrants</span>
              <div style="display:flex;gap:6px;align-items:center;">
                <select class="form-select" id="tIntrantSelect" style="width:220px;padding:6px;font-size:0.82rem">
                  <optgroup label="── PLASTIQUE ──">${Traitement.intrantsMaster.filter(i=>i.famille==='PLASTIQUE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  <optgroup label="── CARTON ──">${Traitement.intrantsMaster.filter(i=>i.famille==='CARTON').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  <optgroup label="── INTRANT ──">${Traitement.intrantsMaster.filter(i=>i.famille==='INTRANT').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  <optgroup label="── EQUIPEMENT ──">${Traitement.intrantsMaster.filter(i=>i.famille==='EQUIPEMENT').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  <optgroup label="── SERVICE ──">${Traitement.intrantsMaster.filter(i=>i.famille==='SERVICE').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  <optgroup label="── FOURNITURES ──">${Traitement.intrantsMaster.filter(i=>i.famille==='FOURNITURES').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                  <optgroup label="── DIVERS ──">${Traitement.intrantsMaster.filter(i=>i.famille==='DIVERS'||i.famille==='EAU-ELEC').map(i=>`<option value="${i.ref}">${i.article}</option>`).join('')}</optgroup>
                </select>
                <button class="btn btn-success btn-sm" onclick="Traitement.addIntrantFromList()">+ Ajouter</button>
              </div>
            </div>
            <table><thead><tr><th>Article</th><th>Quantité</th><th>Prix unit. (DH)</th><th>Valeur (DH)</th><th style="width:30px"></th></tr></thead>
            <tbody id="tIntrants">${intrants.map((it,i)=> Traitement.renderIntrantRow(it,i)).join('')}
            <tr style="background:rgba(99,102,241,0.1)"><td colspan="4" class="td-bold">Total intrants</td><td class="td-right td-bold" id="tTotalIntrants">0.00 DH</td></tr>
            </tbody></table>
          </div>

          <div class="summary-box">
            <h3 style="margin-bottom:14px;">📊 Résumé</h3>
            <div class="summary-row"><span class="summary-label">Rendement produits</span><span class="summary-value" id="sumRendement">0%</span></div>
            <div class="summary-row"><span class="summary-label">Rendement phase finale</span><span class="summary-value" id="sumRendFinal">0%</span></div>
            <div class="summary-row"><span class="summary-label">Total intrants</span><span class="summary-value" id="sumIntrants">0 DH</span></div>
            <div class="summary-row"><span class="summary-label">Prix de revient global</span><span class="summary-value summary-total" id="sumPrixRevient">0 DH/kg</span></div>
          </div>

          <div class="form-section" style="margin-top:14px;">
            <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center;">
              <span>🏷️ QR Code du lot</span>
              <button class="btn btn-sm btn-outline" onclick="Traitement.refreshQR()" style="font-size:0.78rem;">🔄 Actualiser</button>
            </div>
            <div id="traitementQRArea" style="padding:12px;text-align:center;">
              <div style="color:#94a3b8;font-size:0.85rem;">Sélectionnez Client & Espèce pour afficher le QR Code associé</div>
            </div>
          </div>

          </div>
          <div class="ntsamak-modal-footer">
            <button class="btn btn-outline" onclick="Traitement.hideForm()" style="display:flex;align-items:center;gap:4px;border:1px solid #cbd5e1;color:#64748b;font-weight:600;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Fermer</button>
            <button class="btn-ntsamak-green" onclick="Traitement.saveTraitement()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> Enregistrer</button>
          </div>
        </div>
      </div>`;
    this.calcT();
  },

  calcT() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const poidsMP = v('tPoidsMP');
    const valeurMP = v('tValeurMP');
    const poidsPF = v('tPoidsPF');
    document.getElementById('tPrixMoyen').textContent = poidsMP>0 ? App.formatNumber(valeurMP/poidsMP,2) : '0.00';

    // Phases MP
    document.querySelectorAll('#tPhasesMP tr').forEach((row,i) => {
      const qi = parseFloat(row.querySelector('[data-ph="qteInit"]')?.value)||0;
      const qf = parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0;
      const rp = qi>0 ? (qf/qi*100) : 0;
      const rc = poidsMP>0 ? (qf/poidsMP*100) : 0;
      document.getElementById('rendPhMP'+i).textContent = App.formatNumber(rp,2)+'%';
      document.getElementById('rendCumMP'+i).textContent = App.formatNumber(rc,2)+'%';
    });

    // Phases PF
    document.querySelectorAll('#tPhasesPF tr').forEach((row,i) => {
      const qi = parseFloat(row.querySelector('[data-ph="qteInit"]')?.value)||0;
      const qf = parseFloat(row.querySelector('[data-ph="qteFinale"]')?.value)||0;
      const rp = qi>0 ? (qf/qi*100) : 0;
      document.getElementById('rendPhPF'+i).textContent = App.formatNumber(rp,2)+'%';
      document.getElementById('rendCumPF'+i).textContent = poidsPF>0 ? App.formatNumber(qf/poidsPF*100,2)+'%' : '0%';
    });

    const rendement = poidsMP>0 ? (poidsPF/poidsMP*100) : 0;
    document.getElementById('tRendement').textContent = App.formatNumber(rendement,2)+'%';
    const coutMatiere = poidsPF>0 ? valeurMP/poidsPF : 0;
    document.getElementById('tCoutMatiere').textContent = App.formatNumber(coutMatiere,2)+' DH';

    // Intrants
    let totalInt = 0;
    document.querySelectorAll('#tIntrants tr').forEach((row,i) => {
      const q = parseFloat(row.querySelector('[data-int="qte"]')?.value)||0;
      const p = parseFloat(row.querySelector('[data-int="prix"]')?.value)||0;
      const val = q*p;
      totalInt += val;
      const el = document.getElementById('intVal'+i);
      if(el) el.textContent = App.formatNumber(val,2);
    });
    document.getElementById('tTotalIntrants').textContent = App.formatNumber(totalInt,2)+' DH';

    document.getElementById('sumRendement').textContent = App.formatNumber(rendement,2)+'%';
    document.getElementById('sumIntrants').textContent = App.formatNumber(totalInt,0)+' DH';
    const prixRevient = poidsPF>0 ? (valeurMP+totalInt)/poidsPF : 0;
    document.getElementById('sumPrixRevient').textContent = App.formatNumber(prixRevient,2)+' DH/kg';

    // Update NTSAMAK Badges
    const bRend = document.getElementById('badgeRendement');
    if(bRend) bRend.textContent = App.formatNumber(rendement,2)+'%';
    const bPrix = document.getElementById('badgePrixRevient');
    if(bPrix) bPrix.textContent = App.formatNumber(prixRevient,2);

    // Last PF phase rendement
    const pfRows = document.querySelectorAll('#tPhasesPF tr');
    if(pfRows.length>0){
      const last = pfRows[pfRows.length-1];
      const qi=parseFloat(last.querySelector('[data-ph="qteInit"]')?.value)||0;
      const qf=parseFloat(last.querySelector('[data-ph="qteFinale"]')?.value)||0;
      document.getElementById('sumRendFinal').textContent = qi>0?App.formatNumber(qf/qi*100,2)+'%':'0%';
    }
  },

  autoFillFromAI(data) {
    if (!data) return;
    
    if (data.date) document.getElementById('tDate').value = data.date;
    if (data.poidsMP) document.getElementById('tPoidsMP').value = data.poidsMP;
    if (data.poidsPF) document.getElementById('tPoidsPF').value = data.poidsPF;
    
    if (data.produitFini) {
      document.getElementById('tProduitFini').value = data.produitFini;
    }

    if (data.intrants && data.intrants.length > 0) {
      data.intrants.forEach(intrant => {
        // Find matching intrant in master list
        const matched = Traitement.intrantsMaster.find(i => 
          i.article.toLowerCase().includes(intrant.article.toLowerCase()) || 
          i.ref.toLowerCase() === intrant.article.toLowerCase()
        );
        if (matched) {
          const select = document.getElementById('tIntrantSelect');
          select.value = matched.ref;
          Traitement.addIntrantFromList(); // adds the row
          // set quantity in the newly added row
          const rows = document.querySelectorAll('#tIntrants tr');
          if (rows.length > 1) {
            const lastRow = rows[rows.length-2]; // -2 because last row is the total row
            const qInput = lastRow.querySelector('[data-int="qte"]');
            if (qInput) {
              qInput.value = intrant.quantite;
            }
          }
        }
      });
    }
    
    Traitement.calcT();
  },

  addPhase(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const idx = tbody.children.length;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><select class="form-select" style="width:160px;padding:5px;font-weight:700" data-ph="nom">${Traitement.phasesList.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></td>
      <td><input type="number" step="0.1" class="form-input" style="width:70px;padding:5px" value="100" data-ph="seuil" data-idx="${idx}" onchange="Traitement.calcT()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="" data-ph="qteInit" data-idx="${idx}" onchange="Traitement.calcT()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:100px;padding:5px" value="" data-ph="qteFinale" data-idx="${idx}" onchange="Traitement.calcT()"></td>
      <td class="td-right td-bold" id="rendPh${tbodyId==='tPhasesMP'?'MP':'PF'}${idx}">0%</td>
      <td class="td-right" id="rendCum${tbodyId==='tPhasesMP'?'MP':'PF'}${idx}">0%</td>
      <td><button class="btn-icon danger" onclick="Traitement.removePhase(this)" style="width:24px;height:24px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>`;
    tbody.appendChild(tr);
  },

  removePhase(btn) {
    const tr = btn.closest('tr');
    const tbody = tr.parentElement;
    if (tbody.children.length <= 1) { App.toast('Il faut au moins une phase', 'error'); return; }
    tr.remove();
    this.calcT();
  },

  renderIntrantRow(it, i) {
    return `<tr>
      <td><input type="text" class="form-input" style="width:180px;padding:5px;font-weight:600" value="${it.article}" data-int="article" data-idx="${i}"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:90px;padding:5px" value="${it.qte||''}" data-int="qte" data-idx="${i}" onchange="Traitement.calcT()"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:90px;padding:5px" value="${it.prix}" data-int="prix" data-idx="${i}" onchange="Traitement.calcT()"></td>
      <td class="td-right td-bold" id="intVal${i}">0.00</td>
      <td><button class="btn-icon danger" onclick="Traitement.removeIntrantRow(this)" style="width:24px;height:24px" title="Supprimer"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>
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
      if (c) {
        const p = App.data.consommables.find(item => item.nom === c.article)?.prixUnitaire || c.prix;
        intrants.push({ article: c.article, qte: 0, prix: p });
      }
      if (s) {
        let p = App.data.consommables.find(item => item.nom === s.article)?.prixUnitaire || s.prix;
        if (s.ratio) p = p / s.ratio;
        intrants.push({ article: s.article, qte: 0, prix: parseFloat(p.toFixed(4)) });
      }
    }
    return intrants;
  },

  onConditionnementChange() {
    const code = document.getElementById('tConditionnement')?.value || '';
    const newIntrants = this.getDefaultIntrants(code);
    // Keep any extra intrants the user added (beyond the base 2)
    const tbody = document.getElementById('tIntrants');
    const existingRows = tbody.querySelectorAll('tr:not(:last-child)');
    const extraIntrants = [];
    existingRows.forEach((row, i) => {
      if (i >= 2) { // keep rows beyond the base 2
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
    // Fetch latest price from consumables if available
    let latestPrice = App.data.consommables.find(c => c.nom === master.article)?.prixUnitaire || master.prix;
    // Apply ratio if sachet
    for (const [key, r] of Object.entries(Traitement.sachetRatioMap)) {
        if (master.article.toLowerCase().includes(key.toLowerCase())) {
            latestPrice = latestPrice / r;
            break;
        }
    }
    tr.innerHTML = this.renderIntrantRow({ article: master.article, qte: 0, prix: parseFloat(latestPrice.toFixed(4)) }, idx).replace(/^<tr>/, '').replace(/<\/tr>$/, '');
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
    const poidsMP=v('tPoidsMP'), valeurMP=v('tValeurMP'), poidsPF=v('tPoidsPF');
    const intrants=collectIntrants();
    const totalInt=intrants.reduce((s,it)=>s+it.qte*it.prix,0);

    const entry = {
      id: this.editingId || App.nextId(App.data.production),
      activite: this.currentActivite,
      receptionId: parseInt(document.getElementById('tReception')?.value)||0,
      date, espece, client: document.getElementById('tClient').value,
      fournisseur: document.getElementById('tFournisseur')?.value || '',
      refLot: document.getElementById('tRefLot')?.value || '',
      origineCapture: document.getElementById('tOrigine')?.value || '',
      produitFini: document.getElementById('tProduitFini').value,
      poidsMP, valeurMP,
      poidsBrutPF: poidsPF, caissesPF: parseInt(document.getElementById('tCaissesPF')?.value)||0,
      conditionnement: document.getElementById('tConditionnement').value,
      phases: collectPhases('tPhasesMP'),
      phasesPF: collectPhases('tPhasesPF'),
      intrants,
      rendement: poidsMP>0?(poidsPF/poidsMP*100):0,
      totalIntrants: totalInt,
      prixRevient: poidsPF>0?(valeurMP+totalInt)/poidsPF:0,
      // compat fields
      poidsBrutPI: poidsMP, caissesPI:0, heuresMOO:0, heuresMOF:0,
      coutMOO:0, coutPersonnelF:0, coutMOJ:0,
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

  refreshQR() {
    const client = document.getElementById('tClient')?.value || '';
    const espece = document.getElementById('tEspece')?.value || '';
    const area = document.getElementById('traitementQRArea');
    if (!area) return;

    if (!client || !espece) {
      area.innerHTML = '<div style="color:#94a3b8;font-size:0.85rem;">Sélectionnez Client & Espèce pour afficher le QR Code associé</div>';
      return;
    }

    const qr = (typeof QRCodes !== 'undefined') ? QRCodes.getQRForLot(client, espece) : null;
    if (qr && qr.imageData) {
      area.innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;justify-content:center;">
          <img src="${qr.imageData}" width="120" style="border-radius:8px;border:2px solid #e2e8f0;">
          <div style="text-align:left;font-size:0.82rem;">
            <div style="font-weight:700;color:#1e293b;margin-bottom:6px;">QR Code trouvé ✅</div>
            <div style="color:#64748b;">Client: <strong>${qr.client}</strong></div>
            <div style="color:#64748b;">Espèce: <span class="badge badge-info">${qr.espece}</span></div>
            ${qr.calibre ? `<div style="color:#64748b;">Calibre: <strong>${qr.calibre}</strong></div>` : ''}
            ${qr.refLot ? `<div style="color:#64748b;">Lot: ${qr.refLot}</div>` : ''}
            <div style="color:#94a3b8;font-size:0.75rem;margin-top:4px;">ID: ${qr.id} — ${App.formatDateFR(qr.date)}</div>
          </div>
        </div>`;
    } else {
      area.innerHTML = `
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px;color:#854d0e;font-size:0.85rem;">
          ⚠️ Aucun QR Code trouvé pour <strong>${client}</strong> / <strong>${espece}</strong>
          <br><button class="btn btn-sm btn-outline" style="margin-top:8px;font-size:0.78rem;" onclick="App.navigate('qrcodes')">➕ Générer un QR Code</button>
        </div>`;
    }
  }
};

