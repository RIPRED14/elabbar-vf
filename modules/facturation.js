/* ============================================
   FACTURATION — Saisie des factures et charges
   ============================================ */
const Facturation = {
  editingId: null,
  currentLignes: [],
  viewType: 'month',
  selectedDay: new Date().toISOString().split('T')[0],
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),

  applyAIData(data) {
    if (!data) return;
    
    const fallbackDate = this.selectedDay || new Date().toISOString().split('T')[0];
    const finalDate = data.date ? App.formatDateISO(data.date) : fallbackDate;

    const d = new Date(finalDate);
    this.selectedYear = d.getFullYear();
    this.selectedMonth = d.getMonth();
    this.selectedDay = finalDate;

    this.render();
    
    const entry = {
      societe: data.societe || 'FISH & FOOD TRAITEMENT',
      fournisseur: data.fournisseur || '',
      numero: data.numero || '',
      date: finalDate,
      dateEcheance: data.dateEcheance || finalDate,
      montantHT: parseFloat(data.montantHT) || 0,
      tva: parseFloat(data.tva) || 0,
      montant: parseFloat(data.montantTTC || data.montant) || 0,
      devise: data.devise || 'MAD',
      motif: data.motif || '',
      allocation: data.allocation || 'general',
      origine: data.origine || 'Divers achats',
      type: data.type || 'Facture',
      etatPaiement: 'En attente',
      lignes: Array.isArray(data.lignes) ? data.lignes : []
    };

    this.showForm(entry);
    App.toast("Facture importée et normalisée via IA.", "success");
  },

  render() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    let factures = this.viewType === 'day' 
      ? App.getDayData('factures', this.selectedDay)
      : App.getMonthData('factures', this.selectedYear, this.selectedMonth);

    const totalPeriod = factures.reduce((s, f) => s + (f.montant || 0), 0);

    let prod = this.viewType === 'day'
      ? App.getDayProduction(this.selectedDay)
      : App.getMonthProduction(this.selectedYear, this.selectedMonth);

    const totalKgPeriod = prod.reduce((s, p) => s + (p.poidsBrutPF || 0), 0);
    const coutFactureParKg = totalKgPeriod > 0 ? (totalPeriod / totalKgPeriod) : 0;

    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px;">
          <div>
            <nav style="display:flex; gap:8px; margin-bottom:12px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
              <span>Finance</span>
              <span>/</span>
              <span style="color:var(--accent-blue);">Facturation & Charges</span>
            </nav>
            <h2 class="page-title">Facturation & Charges</h2>
            <p class="page-subtitle">Gestion des dépenses opérationnelles et analyse de rentabilité.</p>
          </div>
          <div style="display:flex; gap:12px; align-items:flex-end;">
            <div style="display:flex; background:var(--bg-card); padding:4px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:2px;">
              <button onclick="Facturation.onViewTypeChange('day')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'day' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'day' ? 'white' : 'var(--text-muted)'};">Jour</button>
              <button onclick="Facturation.onViewTypeChange('month')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'month' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'month' ? 'white' : 'var(--text-muted)'};">Mois</button>
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.72rem; margin-bottom:4px; opacity:0.8; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${this.viewType === 'day' ? 'Date' : 'Période'}</label>
              ${this.viewType === 'day' 
                ? `<input type="date" class="form-input" value="${this.selectedDay}" onchange="Facturation.onDayChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">`
                : `<input type="month" class="form-input" value="${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}" onchange="Facturation.onPeriodChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">`
              }
            </div>

            <button class="btn btn-outline" style="border-color:var(--accent-blue); color:var(--accent-blue); height:38px; display:flex; align-items:center;" onclick="Facturation.showSyncModal()">
              <span>📥 Portail Ntsamak</span>
            </button>

            <button class="btn btn-primary" onclick="Facturation.showForm()" style="height:38px; display:flex; align-items:center;">
              <span>+ Nouvelle Facture</span>
            </button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-icon blue">💰</div>
            <div class="kpi-label">Total Factures (${this.viewType === 'day' ? 'Jour' : 'Ce Mois'})</div>
            <div class="kpi-value">${App.formatNumber(totalPeriod, 0)}<span class="kpi-unit">DH</span></div>
            <div class="kpi-change">Dépenses opérationnelles</div>
          </div>
          <div class="kpi-card purple">
            <div class="kpi-icon purple">📦</div>
            <div class="kpi-label">Volume Production</div>
            <div class="kpi-value">${App.formatNumber(totalKgPeriod, 0)}<span class="kpi-unit">kg</span></div>
            <div class="kpi-change">Masse critique ${this.viewType === 'day' ? 'journalière' : 'mensuelle'}</div>
          </div>
          <div class="kpi-card ${coutFactureParKg > 5 ? 'red' : 'green'}">
            <div class="kpi-icon ${coutFactureParKg > 5 ? 'red' : 'green'}">⚖️</div>
            <div class="kpi-label">Impact Revient</div>
            <div class="kpi-value">+ ${App.formatNumber(coutFactureParKg, 2)}<span class="kpi-unit">DH/kg</span></div>
            <div class="kpi-change">Coût de structure</div>
          </div>
        </div>

        <div id="facturationFormContainer"></div>

        <div class="slide-up">
          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <span class="card-title">📋 Historique des Factures</span>
              <div class="badge badge-info">${factures.length} documents (${this.viewType === 'day' ? 'ce jour' : 'ce mois'})</div>
            </div>
            <div class="card-body">
              <div class="table-container">
                ${factures.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-text">Aucune facture enregistrée pour cette période</div></div>' : `
                  <table>
                    <thead>
                      <tr>
                        <th>Société / Type / Usine</th>
                        <th>Date / Échéance / Créateur</th>
                        <th>N° Facture / Origine</th>
                        <th>Fournisseur / Taux</th>
                        <th>État / Règlements</th>
                        <th class="td-right">Finances (Net)</th>
                        <th class="td-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${[...factures].sort((a,b) => new Date(b.date) - new Date(a.date)).map(f => `
                        <tr>
                          <td>
                            <div style="font-weight:700; font-size:0.75rem; color:var(--text-muted);">${f.societe || 'FF TRAITEMENT'}</div>
                            <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${f.type || 'Facture'}</div>
                            ${f.usineRaisonSociale ? `<div style="font-size:0.72rem; color:var(--accent-blue); font-weight:500; margin-top:2px;">🏭 ${f.usineRaisonSociale}</div>` : ''}
                          </td>
                          <td>
                            <div style="font-weight:600;">${App.formatDateFR(f.date)}</div>
                            <div style="font-size:0.7rem; color:var(--text-muted);">Dû le: ${f.dateEcheance ? App.formatDateFR(f.dateEcheance) : '-'}</div>
                            ${f.creeParNom ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">✍️ par: ${f.creeParNom}</div>` : ''}
                          </td>
                          <td>
                            <div><span class="badge badge-info" style="font-family:var(--font-mono);">${f.numero || '-'}</span></div>
                            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;" title="Origine: ${f.origine || '-'}">${f.origine || '-'}</div>
                            ${f.allocation ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">📍 ${f.allocation === 'general' ? 'Général' : f.allocation === 'emballage' ? 'Emballage' : f.allocation === 'traitement' ? 'Traitement' : 'Recond.'}</div>` : ''}
                          </td>
                          <td>
                            <div style="font-weight:600; color:var(--text-primary);">${f.fournisseur}</div>
                            ${f.tauxChange && f.tauxChange !== 1 ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">💱 Taux: ${App.formatNumber(f.tauxChange, 4)}</div>` : ''}
                          </td>
                          <td>
                            <span class="badge ${f.etatPaiement === 'Payée' ? 'badge-success' : 'badge-warning'}">
                              ${f.etatPaiement || 'En attente'}
                            </span>
                            ${f.montantReglement ? `<div style="font-size:0.7rem; color:var(--status-success); font-weight:600; margin-top:4px;">💳 Payé: ${App.formatNumber(f.montantReglement, 2)} DH</div>` : ''}
                            ${f.referencesReglements ? `<div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;" title="${f.referencesReglements}">Ref: ${f.referencesReglements.substring(0, 15)}${f.referencesReglements.length > 15 ? '...' : ''}</div>` : ''}
                            ${f.datesReglements ? `<div style="font-size:0.65rem; color:var(--text-muted);">le: ${f.datesReglements}</div>` : ''}
                          </td>
                          <td class="td-right">
                            <div style="font-size:0.75rem; color:var(--text-muted);">TTC: <span style="font-weight:600; color:var(--text-primary);">${App.formatNumber(f.montant, 2)} ${f.devise || 'MAD'}</span></div>
                            <div style="font-size:1.05rem; font-weight:800; color:var(--accent-blue); margin-top:2px;">Net: ${App.formatNumber(f.netAPayer !== undefined ? f.netAPayer : f.montant, 2)} <span style="font-size:0.8rem; color:var(--text-muted);">${f.devise || 'MAD'}</span></div>
                            ${f.remiseTtc ? `<div style="font-size:0.7rem; color:var(--status-success);">- Remise: ${App.formatNumber(f.remiseTtc, 2)} ${f.devise || 'MAD'}</div>` : ''}
                          </td>
                          <td class="td-center">
                            <div style="display:flex; gap:4px; justify-content:center;">
                              <button class="btn-icon" onclick="Facturation.editEntry('${f.id}')" title="Modifier">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button class="btn-icon danger" onclick="Facturation.deleteEntry('${f.id}')" title="Supprimer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `}
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

  onPeriodChange(e) {
    const [y, m] = e.target.value.split('-').map(Number);
    this.selectedYear = y;
    this.selectedMonth = m - 1;
    this.render();
  },

  showForm(entry = null) {
    this.editingId = entry && entry.id ? entry.id : null;
    this.currentLignes = entry && entry.lignes ? JSON.parse(JSON.stringify(entry.lignes)) : [];
    if (this.currentLignes.length === 0 && (!entry || !entry.id)) {
      this.currentLignes.push({ description: '', quantite: 1, prixUnitaire: 0, totalLigne: 0 });
    }

    const container = document.getElementById('facturationFormContainer');
    const isEditing = this.editingId !== null;

    container.innerHTML = `
      <div class="card slide-up" style="margin-bottom:24px; border:1px solid var(--primary-color);">
        <div class="card-header">
          <span class="card-title">${isEditing ? '✏️ Modifier Facture' : '📥 Nouvelle Facture'}</span>
          <button class="btn-icon" onclick="Facturation.hideForm()">✕</button>
        </div>
        <div class="card-body">
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-bottom:20px;">
            <input type="file" id="ocrInput" accept="image/*" capture="environment" style="display:none" onchange="Facturation.processOCR(event)">
            <button class="btn btn-outline" style="border-color:#0ea5e9; color:#0ea5e9;" onclick="document.getElementById('ocrInput').click()">📸 Scanner par IA</button>
          </div>
          
          <div id="ocrLoadingArea" style="display:none; text-align:center; padding:20px; background:var(--bg-app); border:1px dashed var(--border-color); border-radius:12px; margin-bottom:20px;">
            <div style="color:var(--primary-color); font-weight:700;">🤖 Analyse de la facture...</div>
          </div>

          <h4 style="margin-bottom:15px; color:var(--accent-blue); border-bottom:1px solid #eee; padding-bottom:5px;">Informations Générales</h4>
          <div class="form-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
            <div class="form-group">
              <label class="form-label">Société</label>
              <select class="form-select" id="fSociete">
                <option value="FISH & FOOD TRAITEMENT" ${entry?.societe === 'FISH & FOOD TRAITEMENT' ? 'selected' : ''}>FISH & FOOD TRAITEMENT</option>
                <option value="FISH AND FOOD PROCESS" ${entry?.societe === 'FISH AND FOOD PROCESS' ? 'selected' : ''}>FISH AND FOOD PROCESS</option>
                <option value="LAMBDA FISH SUD" ${entry?.societe === 'LAMBDA FISH SUD' ? 'selected' : ''}>LAMBDA FISH SUD</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Origine</label><input type="text" class="form-input" id="fOrigine" value="${entry?.origine||'Divers achats'}" placeholder="Ex: Divers achats"></div>
            <div class="form-group"><label class="form-label">Date Facture</label><input type="date" class="form-input" id="fDate" value="${entry ? entry.date : (this.selectedDay || App.formatDate(new Date()))}"></div>
            <div class="form-group"><label class="form-label">Date Échéance</label><input type="date" class="form-input" id="fDateEcheance" value="${entry?.dateEcheance || entry?.date || ''}"></div>
            <div class="form-group"><label class="form-label">Fournisseur</label><input type="text" class="form-input" id="fFournisseur" value="${entry?.fournisseur||''}" placeholder="Ex: AMENDIS"></div>
            <div class="form-group"><label class="form-label">N° Facture</label><input type="text" class="form-input" id="fNumero" value="${entry?.numero||''}" placeholder="FA-2026-01"></div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="fType">
                <option value="Facture" ${entry?.type === 'Facture' ? 'selected' : ''}>Facture</option>
                <option value="Proforma" ${entry?.type === 'Proforma' ? 'selected' : ''}>Proforma</option>
                <option value="Avoir" ${entry?.type === 'Avoir' ? 'selected' : ''}>Avoir</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">État du Paiement</label>
              <select class="form-select" id="fEtatPaiement">
                <option value="En attente" ${entry?.etatPaiement === 'En attente' ? 'selected' : ''}>⏳ En attente</option>
                <option value="Payée" ${entry?.etatPaiement === 'Payée' ? 'selected' : ''}>✅ Payée</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / 3;">
              <label class="form-label">Motif / Description globale</label>
              <input type="text" class="form-input" id="fMotif" value="${entry?.motif||''}" placeholder="Ex: Achat fournitures bureau">
            </div>
            <div class="form-group" style="grid-column: 3 / -1;">
              <label class="form-label">Allocation Activité</label>
              <select class="form-select" id="fAllocation">
                <option value="general" ${entry?.allocation === 'general' ? 'selected' : ''}>🌍 Général (Toute l'usine)</option>
                <option value="traitement" ${entry?.allocation === 'traitement' ? 'selected' : ''}>🔧 Traitement</option>
                <option value="reconditionnement" ${entry?.allocation === 'reconditionnement' ? 'selected' : ''}>📦 Reconditionnement</option>
                <option value="emballage" ${entry?.allocation === 'emballage' ? 'selected' : ''}>🏷️ Emballage / Intrants</option>
              </select>
            </div>
          </div>

          <h4 style="margin-top:24px; margin-bottom:15px; color:var(--accent-blue); border-bottom:1px solid #eee; padding-bottom:5px;">Détails Financiers Avancés & Règlements (Ntsamak)</h4>
          <div class="form-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
            <div class="form-group">
              <label class="form-label">Usine (Raison Sociale)</label>
              <input type="text" class="form-input" id="fUsineRaisonSociale" value="${entry?.usineRaisonSociale||''}" placeholder="Ex: Usine Elabbar">
            </div>
            <div class="form-group">
              <label class="form-label">Créé par (Nom)</label>
              <input type="text" class="form-input" id="fCreeParNom" value="${entry?.creeParNom||''}" placeholder="Ex: Admin Ntsamak">
            </div>
            <div class="form-group">
              <label class="form-label">Taux de Change</label>
              <input type="number" step="0.0001" class="form-input" id="fTauxChange" value="${entry?.tauxChange!==undefined ? entry.tauxChange : 1}">
            </div>
            <div class="form-group">
              <label class="form-label">Remise TTC</label>
              <input type="number" step="0.01" class="form-input" id="fRemiseTtc" value="${entry?.remiseTtc||0}">
            </div>
            <div class="form-group">
              <label class="form-label">Net à Payer</label>
              <input type="number" step="0.01" class="form-input" id="fNetAPayer" value="${entry?.netAPayer!==undefined ? entry.netAPayer : (entry?.montant||0)}">
            </div>
            <div class="form-group">
              <label class="form-label">Montant Règlement</label>
              <input type="number" step="0.01" class="form-input" id="fMontantReglement" value="${entry?.montantReglement||0}">
            </div>
            <div class="form-group">
              <label class="form-label">Dates Règlements</label>
              <input type="text" class="form-input" id="fDatesReglements" value="${entry?.datesReglements||''}" placeholder="Ex: 2026-05-20">
            </div>
            <div class="form-group">
              <label class="form-label">Références Règlements</label>
              <input type="text" class="form-input" id="fReferencesReglements" value="${entry?.referencesReglements||''}" placeholder="Ex: CHQ-928172">
            </div>
          </div>

          <h4 style="margin-bottom:15px; color:var(--accent-blue); border-bottom:1px solid #eee; padding-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
            Détail des Lignes
            <button class="btn btn-sm btn-outline" onclick="Facturation.addLigne()">+ Ajouter une ligne</button>
          </h4>
          <div class="table-container" style="margin-bottom:24px; overflow-x:auto;">
            <table style="width:100%; table-layout:fixed;">
              <thead>
                <tr>
                  <th style="width: 50%;">Description de l'article / service</th>
                  <th style="width: 10%;">Qté</th>
                  <th style="width: 15%;">Prix Unit.</th>
                  <th style="width: 15%;">Total</th>
                  <th style="width: 10%;"></th>
                </tr>
              </thead>
              <tbody id="fLignesContainer">
                <!-- Les lignes seront injectées ici par renderLignes() -->
              </tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <div style="background:#f8fafc; padding:20px; border-radius:8px; border:1px solid #eee; min-width: 300px;">
              <div class="form-group" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <label style="margin:0; font-weight:600;">Montant HT</label>
                <input type="number" step="0.01" class="form-input" id="fMontantHT" value="${entry?.montantHT||0}" style="width:120px; text-align:right;" oninput="Facturation.calcTotalsFromHT()">
              </div>
              <div class="form-group" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <label style="margin:0; font-weight:600;">TVA (Montant)</label>
                <input type="number" step="0.01" class="form-input" id="fTVA" value="${entry?.tva||0}" style="width:120px; text-align:right;" oninput="Facturation.calcTotalsFromTVA()">
              </div>
              <div style="height:1px; background:#ddd; margin:15px 0;"></div>
              <div class="form-group" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <label style="margin:0; font-weight:700; font-size:1.1rem; color:var(--primary-color);">Montant TTC</label>
                <input type="number" step="0.01" class="form-input" id="fMontantTTC" value="${entry?.montant||0}" style="width:140px; text-align:right; font-weight:bold; font-size:1.1rem; color:var(--primary-color);" oninput="Facturation.calcTotalsFromTTC()">
              </div>
              <div class="form-group" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0;">
                <label style="margin:0; font-weight:600;">Devise</label>
                <select class="form-select" id="fDevise" style="width:120px; text-align:right;">
                  <option value="MAD" ${entry?.devise === 'MAD' ? 'selected' : ''}>MAD</option>
                  <option value="EUR" ${entry?.devise === 'EUR' ? 'selected' : ''}>EUR</option>
                  <option value="USD" ${entry?.devise === 'USD' ? 'selected' : ''}>USD</option>
                </select>
              </div>
            </div>
          </div>

          <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-color); padding-top:20px;">
            <button class="btn btn-outline" onclick="Facturation.hideForm()">Annuler</button>
            <button class="btn btn-primary" onclick="Facturation.saveEntry()">${isEditing ? 'Mettre à jour' : 'Enregistrer la facture'}</button>
          </div>
        </div>
      </div>
    `;
    this.renderLignes();
  },

  renderLignes() {
    const container = document.getElementById('fLignesContainer');
    if (!container) return;

    container.innerHTML = this.currentLignes.map((ligne, index) => `
      <tr>
        <td>
          <input type="text" class="form-input" value="${ligne.description || ''}" onchange="Facturation.updateLigne(${index}, 'description', this.value)" placeholder="Description de l'article...">
        </td>
        <td>
          <input type="number" class="form-input" style="text-align:right;" value="${ligne.quantite || 0}" step="0.01" oninput="Facturation.updateLigne(${index}, 'quantite', this.value)">
        </td>
        <td>
          <input type="number" class="form-input" style="text-align:right;" value="${ligne.prixUnitaire || 0}" step="0.01" oninput="Facturation.updateLigne(${index}, 'prixUnitaire', this.value)">
        </td>
        <td style="text-align:right; font-weight:600; padding-right:15px; background:#f8fafc;">
          ${App.formatNumber(ligne.totalLigne || 0, 2)}
        </td>
        <td style="text-align:center; vertical-align:middle;">
          <button type="button" style="background:none; border:1px solid #fee2e2; border-radius:6px; color:#ef4444; cursor:pointer; padding:4px 8px; font-size:1rem;" onclick="Facturation.removeLigne(${index})" title="Supprimer cette ligne">✕</button>
        </td>
      </tr>
    `).join('');

    this.calcTotalsFromLignes();
  },

  updateLigne(index, field, value) {
    if (field === 'quantite' || field === 'prixUnitaire') {
      this.currentLignes[index][field] = parseFloat(value) || 0;
      this.currentLignes[index].totalLigne = this.currentLignes[index].quantite * this.currentLignes[index].prixUnitaire;
      this.renderLignes();
    } else {
      this.currentLignes[index][field] = value;
    }
  },

  addLigne() {
    this.currentLignes.push({ description: '', quantite: 1, prixUnitaire: 0, totalLigne: 0 });
    this.renderLignes();
  },

  removeLigne(index) {
    this.currentLignes.splice(index, 1);
    this.renderLignes();
  },

  calcTotalsFromLignes() {
    const totalLignesHT = this.currentLignes.reduce((sum, ligne) => sum + (ligne.totalLigne || 0), 0);
    const inputHT = document.getElementById('fMontantHT');
    if (inputHT && totalLignesHT > 0) {
      inputHT.value = totalLignesHT.toFixed(2);
      this.calcTotalsFromHT();
    }
  },

  calcTotalsFromHT() {
    const ht = parseFloat(document.getElementById('fMontantHT').value) || 0;
    // Par défaut, TVA à 20% si non modifiée
    const tva = parseFloat(document.getElementById('fTVA').value) || (ht * 0.2);
    document.getElementById('fTVA').value = tva.toFixed(2);
    document.getElementById('fMontantTTC').value = (ht + tva).toFixed(2);
  },

  calcTotalsFromTVA() {
    const ht = parseFloat(document.getElementById('fMontantHT').value) || 0;
    const tva = parseFloat(document.getElementById('fTVA').value) || 0;
    document.getElementById('fMontantTTC').value = (ht + tva).toFixed(2);
  },

  calcTotalsFromTTC() {
    const ttc = parseFloat(document.getElementById('fMontantTTC').value) || 0;
    // Si on modifie le TTC, on recalcule le HT et TVA (supposant 20% par défaut)
    const ht = ttc / 1.2;
    const tva = ttc - ht;
    document.getElementById('fMontantHT').value = ht.toFixed(2);
    document.getElementById('fTVA').value = tva.toFixed(2);
  },

  hideForm() {
    const container = document.getElementById('facturationFormContainer');
    if (container) container.innerHTML = '';
    this.editingId = null;
    this.currentLignes = [];
  },

  saveEntry() {
    const date = document.getElementById('fDate').value;
    const fournisseur = document.getElementById('fFournisseur').value.trim();
    const numero = document.getElementById('fNumero').value.trim();
    const etatPaiement = document.getElementById('fEtatPaiement').value;
    const motif = document.getElementById('fMotif').value.trim();
    
    const montantHT = parseFloat(document.getElementById('fMontantHT').value) || 0;
    const tva = parseFloat(document.getElementById('fTVA').value) || 0;
    const montantTTC = parseFloat(document.getElementById('fMontantTTC').value) || 0;
    const devise = document.getElementById('fDevise').value;

    if (!date || !fournisseur || montantTTC <= 0) {
      App.toast('Veuillez remplir le fournisseur, la date et le montant TTC.', 'error');
      return;
    }

    // Filtrer les lignes vides
    const lignesValides = this.currentLignes.filter(l => l.description.trim() !== '' || l.totalLigne > 0);

    const societe = document.getElementById('fSociete').value;
    const origine = document.getElementById('fOrigine').value.trim();
    const type = document.getElementById('fType').value;
    const dateEcheance = document.getElementById('fDateEcheance').value;

    const usineRaisonSociale = document.getElementById('fUsineRaisonSociale')?.value.trim() || '';
    const creeParNom = document.getElementById('fCreeParNom')?.value.trim() || '';
    const tauxChange = parseFloat(document.getElementById('fTauxChange')?.value) || 1;
    const remiseTtc = parseFloat(document.getElementById('fRemiseTtc')?.value) || 0;
    const netAPayer = parseFloat(document.getElementById('fNetAPayer')?.value) || montantTTC;
    const montantReglement = parseFloat(document.getElementById('fMontantReglement')?.value) || 0;
    const datesReglements = document.getElementById('fDatesReglements')?.value.trim() || '';
    const referencesReglements = document.getElementById('fReferencesReglements')?.value.trim() || '';

    App.data.factures = App.data.factures || [];
    const entry = { 
      id: this.editingId || App.nextId(App.data.factures), 
      date, 
      dateEcheance,
      fournisseur, 
      numero, 
      etatPaiement,
      motif,
      montantHT,
      tva,
      montant: montantTTC, // compatibilité historique
      devise,
      lignes: lignesValides,
      allocation: document.getElementById('fAllocation')?.value || 'general',
      societe,
      origine,
      type,
      // Nouveaux champs d'intégration Ntsamak
      usineRaisonSociale,
      creeParNom,
      tauxChange,
      remiseTtc,
      netAPayer,
      montantReglement,
      datesReglements,
      referencesReglements
    };

    if (this.editingId) {
      const idx = App.data.factures.findIndex(e => e.id === this.editingId);
      if (idx !== -1) App.data.factures[idx] = entry;
    } else {
      App.data.factures.push(entry);
    }

    App.saveData('factures', entry);
    this.hideForm();
    this.render();
    App.toast('Facture enregistrée', 'success');
  },

  editEntry(id) {
    const entry = (App.data.factures || []).find(e => e.id === id);
    if (entry) this.showForm(entry);
  },

  async deleteEntry(id) {
    if (!confirm('Supprimer cette facture ?')) return;
    App.data.factures = (App.data.factures || []).filter(e => e.id !== id);
    await App.deleteFromCloud('factures', id);
    App.saveData();
    this.render();
    App.toast('Facture supprimée', 'info');
  },

  async processOCR(event) {
    const file = event.target.files[0];
    if (!file) return;

    App.AI.showOverlay("Analyse de la Facture / Document...");
    
    try {
      const prompt = `Extrait les informations de cette facture ou bon de commande.
Renvoie un objet JSON avec la structure exacte suivante :
{
  "category": "FACTURE",
  "summary": "Résumé",
  "data": {
    "numero": "N° facture",
    "date": "YYYY-MM-DD",
    "fournisseur": "Fournisseur",
    "montantHT": 0.0,
    "tva": 0.0,
    "montantTTC": 0.0,
    "devise": "MAD",
    "motif": "Description globale",
    "allocation": "general | traitement | reconditionnement | emballage",
    "lignes": [
      { "description": "Nom article", "quantite": 1, "prixUnitaire": 0.0, "totalLigne": 0.0 }
    ]
  }
}
Note pour l'allocation: utilise 'traitement' si c'est du poisson, sel ou matériel de prod, 'reconditionnement' si c'est du matériel de stockage/recond, 'emballage' si c'est des cartons/sachets, sinon 'general'.`;

      const result = await App.AI.analyzeImage(file, prompt);
      
      App.AI.hideOverlay();
      
      // On redirige vers applyAIData pour afficher le formulaire pré-rempli
      if (result && result.data) {
        this.applyAIData(result.data);
      } else {
        throw new Error("Format de données invalide retourné par l'IA");
      }
      
    } catch (error) {
      App.AI.hideOverlay();
      App.toast("Erreur d\'analyse: " + error.message, "error");
    } finally {
      event.target.value = '';
    }
  },

  showSyncModal() {
    const activeNtsamakCount = (App.data.factures || []).filter(f => String(f.id).startsWith('nt_')).length;
    
    let modal = document.getElementById('ntsamakSyncModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ntsamakSyncModal';
      modal.style = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="card" style="width: 100%; max-width: 500px; border: 1px solid var(--accent-blue); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); background: var(--bg-card);">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding: 16px 24px;">
          <span class="card-title" style="display:flex; align-items:center; gap:8px; font-weight:750; color:var(--text-main);">📥 Portail Automatique Ntsamak</span>
          <button class="btn-icon" onclick="Facturation.hideSyncModal()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">✕</button>
        </div>
        <div class="card-body" style="padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">🔌</div>
            <h4 style="margin: 0 0 6px 0; color: var(--text-main); font-weight:700;">Pipeline d'Extraction Automatique</h4>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Synchronisez vos factures fournisseurs directement avec l'ERP</p>
          </div>

          <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Factures Ntsamak synchronisées :</span>
              <span style="font-weight: 700; color: var(--accent-blue);">${activeNtsamakCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">État du service :</span>
              <span style="font-weight: 700; color: var(--status-success);">🟢 Opérationnel</span>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h5 style="margin: 0 0 8px 0; font-size: 0.9rem; color: var(--text-main); font-weight:600;">⚙️ Lancer la synchronisation :</h5>
            <p style="margin: 0 0 12px 0; font-size: 0.8rem; color: var(--text-muted);">Pour exécuter le crawler en arrière-plan et récupérer toutes les factures fournisseurs activement mises à jour :</p>
            
            <div style="background: #0f172a; color: #38bdf8; font-family: monospace; padding: 12px 16px; border-radius: 8px; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid #334155;">
              <span>npm run sync-invoices</span>
              <button class="btn btn-sm" style="border: 1px solid #38bdf8; background:transparent; color: #38bdf8; padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; cursor:pointer;" onclick="navigator.clipboard.writeText('npm run sync-invoices'); App.toast('Commande copiée !', 'success')">Copier</button>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-color); padding-top:16px; margin-top:24px;">
            <button class="btn btn-outline" onclick="Facturation.hideSyncModal()">Fermer</button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  },

  hideSyncModal() {
    const modal = document.getElementById('ntsamakSyncModal');
    if (modal) modal.style.display = 'none';
  }
};
