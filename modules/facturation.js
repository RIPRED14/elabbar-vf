/* ============================================
   FACTURATION — Saisie des factures et charges
   ============================================ */
const Facturation = {
  editingId: null,
  currentLignes: [],

  applyAIData(data) {
    if (!data) return;
    this.render();
    
    // Convertir les champs de l'IA vers la structure attendue
    const entry = {
      fournisseur: data.fournisseur || '',
      numero: data.numero || '',
      date: data.date || App.formatDate(new Date()),
      montantHT: data.montantHT || 0,
      tva: data.tva || 0,
      montant: data.montantTTC || data.montant || 0,
      devise: data.devise || 'MAD',
      motif: data.motif || '',
      etatPaiement: 'En attente',
      lignes: data.lignes && data.lignes.length > 0 ? data.lignes : []
    };

    this.showForm(entry);
    App.toast("Données IA importées avec succès.", "success");
  },

  render() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const factures = App.data.factures || [];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const facturesDuMois = factures.filter(f => f.date.startsWith(currentMonth));
    const totalMois = facturesDuMois.reduce((s, f) => s + (f.montant || 0), 0);

    const saisiesMois = (App.data.production || []).filter(p => p.date.startsWith(currentMonth));
    const totalKgMois = saisiesMois.reduce((s, p) => s + (p.poidsBrutPF || 0), 0);
    const coutFactureParKg = totalKgMois > 0 ? (totalMois / totalKgMois) : 0;

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
          <div style="display:flex; gap:12px;">
            <button class="btn btn-primary" onclick="Facturation.showForm()">
              <span>+ Nouvelle Facture</span>
            </button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-icon blue">💰</div>
            <div class="kpi-label">Total Factures (Ce Mois)</div>
            <div class="kpi-value">${App.formatNumber(totalMois, 0)}<span class="kpi-unit">DH</span></div>
            <div class="kpi-change">Dépenses opérationnelles</div>
          </div>
          <div class="kpi-card purple">
            <div class="kpi-icon purple">📦</div>
            <div class="kpi-label">Volume Production</div>
            <div class="kpi-value">${App.formatNumber(totalKgMois, 0)}<span class="kpi-unit">kg</span></div>
            <div class="kpi-change">Masse critique mensuelle</div>
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
              <div class="badge badge-info">${factures.length} documents enregistrés</div>
            </div>
            <div class="card-body">
              <div class="table-container">
                ${factures.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-text">Aucune facture enregistrée</div></div>' : `
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>N° Facture</th>
                        <th>Fournisseur</th>
                        <th>État</th>
                        <th class="td-right">Montant TTC</th>
                        <th class="td-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${[...factures].sort((a,b) => new Date(b.date) - new Date(a.date)).map(f => `
                        <tr>
                          <td><div style="font-weight:600;">${App.formatDateFR(f.date)}</div></td>
                          <td><span class="badge badge-info" style="font-family:var(--font-mono);">${f.numero || '-'}</span></td>
                          <td><div style="font-weight:600; color:var(--text-primary);">${f.fournisseur}</div></td>
                          <td>
                            <span class="badge ${f.etatPaiement === 'Payée' ? 'badge-success' : 'badge-warning'}">
                              ${f.etatPaiement || 'En attente'}
                            </span>
                          </td>
                          <td class="td-right td-bold" style="color:var(--accent-blue); font-size:1.05rem;">
                            ${App.formatNumber(f.montant, 2)} <span style="font-size:0.8rem; color:var(--text-muted);">${f.devise || 'MAD'}</span>
                          </td>
                          <td class="td-center">
                            <div style="display:flex; gap:4px; justify-content:center;">
                              <button class="btn-icon" onclick="Facturation.editEntry(${f.id})" title="Modifier">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>
                              <button class="btn-icon danger" onclick="Facturation.deleteEntry(${f.id})" title="Supprimer">
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
            <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="fDate" value="${entry ? entry.date : App.formatDate(new Date())}"></div>
            <div class="form-group"><label class="form-label">Fournisseur</label><input type="text" class="form-input" id="fFournisseur" value="${entry?.fournisseur||''}" placeholder="Ex: AMENDIS"></div>
            <div class="form-group"><label class="form-label">N° Facture</label><input type="text" class="form-input" id="fNumero" value="${entry?.numero||''}" placeholder="FA-2026-01"></div>
            <div class="form-group"><label class="form-label">État du Paiement</label>
              <select class="form-select" id="fEtatPaiement">
                <option value="En attente" ${entry?.etatPaiement === 'En attente' ? 'selected' : ''}>⏳ En attente</option>
                <option value="Payée" ${entry?.etatPaiement === 'Payée' ? 'selected' : ''}>✅ Payée</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label">Motif / Description globale</label>
              <input type="text" class="form-input" id="fMotif" value="${entry?.motif||''}" placeholder="Ex: Achat fournitures bureau">
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

    App.data.factures = App.data.factures || [];
    const entry = { 
      id: this.editingId || App.nextId(App.data.factures), 
      date, 
      fournisseur, 
      numero, 
      etatPaiement,
      motif,
      montantHT,
      tva,
      montant: montantTTC, // compatibilité historique
      devise,
      lignes: lignesValides,
      type: 'Achat'
    };

    if (this.editingId) {
      const idx = App.data.factures.findIndex(e => e.id === this.editingId);
      if (idx !== -1) App.data.factures[idx] = entry;
    } else {
      App.data.factures.push(entry);
    }

    App.saveData();
    this.hideForm();
    this.render();
    App.toast('Facture enregistrée', 'success');
  },

  editEntry(id) {
    const entry = (App.data.factures || []).find(e => e.id === id);
    if (entry) this.showForm(entry);
  },

  deleteEntry(id) {
    if (!confirm('Supprimer cette facture ?')) return;
    App.data.factures = (App.data.factures || []).filter(e => e.id !== id);
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
    "lignes": [
      { "description": "Nom article", "quantite": 1, "prixUnitaire": 0.0, "totalLigne": 0.0 }
    ]
  }
}`;

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
  }
};
