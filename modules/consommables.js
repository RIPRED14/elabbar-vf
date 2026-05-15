/* ============================================
   CONSOMMABLES — Stock + Seuils + Alertes
   ============================================ */
const Consommables = {
  currentTab: 'stock', // 'stock', 'mouvements', 'bl'
  viewType: 'month', // 'day' or 'month'
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  selectedDay: new Date().toISOString().split('T')[0],
  selectedPeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
  selectedDayISO: new Date().toISOString().substring(0, 10), // YYYY-MM-DD

  onViewTypeChange(type) {
    this.viewType = type;
    this.updatePeriodISO();
    this.render();
  },

  onDayChange(e) {
    this.selectedDay = e.target.value;
    const parts = this.selectedDay.split('-');
    this.selectedYear = parseInt(parts[0]);
    this.selectedMonth = parseInt(parts[1]) - 1;
    this.updatePeriodISO();
    this.render();
  },

  onPeriodChange(e) {
    const val = e.target.value;
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    this.selectedYear = y;
    this.selectedMonth = m - 1;
    this.updatePeriodISO();
    this.render();
  },

  toggleView(mode) {
    this.onViewTypeChange(mode);
  },

  updatePeriodISO() {
    this.selectedPeriod = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}`;
    this.selectedDayISO = this.selectedDay;
  },

  navigatePeriod(direction) {
    if (this.viewType === 'day') {
      const d = new Date(this.selectedDay);
      d.setDate(d.getDate() + direction);
      this.selectedDay = d.toISOString().split('T')[0];
      this.selectedYear = d.getFullYear();
      this.selectedMonth = d.getMonth();
    } else {
      let m = this.selectedMonth + direction;
      const d = new Date(this.selectedYear, m, 1);
      this.selectedYear = d.getFullYear();
      this.selectedMonth = d.getMonth();
    }
    this.updatePeriodISO();
    this.render();
  },

  applyAIData(data) {
    if (!data) return;
    
    // We try to map the AI data to existing consumables or suggest creation
    const linesHtml = (data.lignes || []).map((l, i) => {
      const art = App.data.consommables.find(c => c.nom.toUpperCase() === (l.nom || '').toUpperCase());
      return `
        <tr data-idx="${i}">
          <td>
            <input type="text" class="form-input c_nom" value="${l.nom || ''}" list="consList">
            ${art ? '<small style="color:var(--accent-green)">✓ Reconnu</small>' : '<small style="color:var(--accent-orange)">! Nouveau</small>'}
          </td>
          <td><input type="number" class="form-input c_qty" value="${l.quantite || 0}" style="width:80px"></td>
          <td><input type="number" class="form-input c_pu" value="${l.prixUnit || 0}" style="width:80px"></td>
        </tr>
      `;
    }).join('');

    App.showModal("🤖 Validation Réception IA", `
      <div style="display:flex; gap:15px; margin-bottom:15px;">
        <div style="flex:1;">
          <label class="form-label">Fournisseur</label>
          <input type="text" id="c_fournisseur" value="${data.fournisseur || ''}" class="form-input">
        </div>
        <div style="flex:1;">
          <label class="form-label">Date Réception</label>
          <input type="date" id="c_date" value="${data.date ? App.formatDateISO(data.date) : (this.selectedDay || new Date().toISOString().split('T')[0])}" class="form-input">
        </div>
      </div>
      <div class="table-container">
        <table class="table">
          <thead><tr><th>Article</th><th>Qté</th><th>P.U</th></tr></thead>
          <tbody id="aiConsTableBody">${linesHtml}</tbody>
        </table>
      </div>
      <datalist id="consList">
        ${App.data.consommables.map(c => `<option value="${c.nom}">`).join('')}
      </datalist>
    `, `
      <button class="btn btn-primary" onclick="Consommables.saveAI()">Valider & Mettre à jour les stocks</button>
    `);
  },

  saveAI() {
    const fournisseur = document.getElementById('c_fournisseur').value;
    const dateSaisie = document.getElementById('c_date').value || new Date().toISOString().split('T')[0];
    const rows = document.querySelectorAll('#aiConsTableBody tr');
    
    rows.forEach(row => {
      const nom = row.querySelector('.c_nom').value;
      const qty = parseFloat(row.querySelector('.c_qty').value) || 0;
      const pu = parseFloat(row.querySelector('.c_pu').value) || 0;

      if (nom && qty > 0) {
        let art = App.data.consommables.find(c => c.nom.toUpperCase() === nom.toUpperCase());
        if (!art) {
          art = { id: Date.now() + Math.random(), nom, stock: 0, unite: 'U', seuilAlerte: 10, seuilCritique: 5 };
          App.data.consommables.push(art);
        }
        
        art.stock += qty;
        if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
        App.data.mouvementsStock.unshift({
          id: Date.now() + Math.random(),
          consommable: art.nom,
          type: 'entree',
          quantite: qty,
          prixUnit: pu,
          motif: fournisseur ? 'Fournisseur: ' + fournisseur : 'Réception IA',
          date: dateSaisie + "T12:00:00Z"
        });
      }
    });

    App.saveData();
    App.closeModal();
    this.render();
    App.toast("Réception enregistrée et stocks mis à jour !");
  },

  render() {
    if (!this.selectedPeriod) this.updatePeriodISO();
    
    const content = document.getElementById('pageContent');
    if (!content) return;

    const alerts = App.getAlerts();
    let alertsHtml = '';
    const criticals = alerts.filter(a => a.type === 'critical');
    const warnings = alerts.filter(a => a.type === 'warning');

    if (alerts.length > 0) {
      if (criticals.length > 0) alertsHtml += `<div class="alerts-banner"><span class="alerts-banner-icon">🚨</span><div class="alerts-banner-text"><strong>STOCK CRITIQUE :</strong> ${criticals.map(a=>a.message).join(' | ')}</div></div>`;
      if (warnings.length > 0) alertsHtml += `<div class="alerts-banner warning"><span class="alerts-banner-icon">⚠️</span><div class="alerts-banner-text"><strong>Stock bas :</strong> ${warnings.map(a=>a.message).join(' | ')}</div></div>`;
    }

    const cons = App.data.consommables || [];
    const totalStockVal = cons.reduce((s, i) => s + ((i.stock || 0) * (i.prixUnitaire || 0)), 0);
    
    // Filtered Movements for KPI
    const allMvts = App.data.mouvementsStock || [];
    const filteredMvts = allMvts.filter(m => 
      this.viewType === 'month' ? m.date.startsWith(this.selectedPeriod) : m.date.startsWith(this.selectedDayISO)
    );
    
    const totalSorties = filteredMvts.filter(m => m.type === 'sortie').reduce((s, m) => s + (m.quantite || 0), 0);
    const totalEntrees = filteredMvts.filter(m => m.type === 'entree').reduce((s, m) => s + (m.quantite || 0), 0);

    content.innerHTML = `
      <div class="fade-in">
        ${alertsHtml}
        
        <!-- Module Header & Standardized Selectors -->
        <div class="page-header" style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <nav style="display:flex; gap:8px; margin-bottom:8px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
                <span>Logistique</span>
                <span>/</span>
                <span style="color:var(--accent-blue);">Gestion Consommables</span>
              </nav>
              <h2 class="page-title">Consommables & Fournitures</h2>
            </div>
            
            <div style="display:flex; gap:12px;">
              <button class="btn btn-outline" onclick="Consommables.showReception()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                <span>Réception</span>
              </button>
              <button class="btn btn-outline" onclick="Consommables.showSortie()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                <span>Sortie</span>
              </button>
              <button class="btn btn-primary" onclick="Consommables.showAddModal()">
                <span>+ Nouvel Article</span>
              </button>
            </div>
          </div>

          <div style="margin-top:24px; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:12px 20px; border-radius:var(--radius-lg); border:1px solid rgba(255,255,255,0.05); backdrop-filter:blur(10px);">
            <div style="display:flex; gap:12px; align-items:flex-end;">
              <div style="display:flex; background:rgba(0,0,0,0.2); padding:4px; border-radius:10px; display:flex; gap:4px; margin-bottom:2px;">
                <button onclick="Consommables.onViewTypeChange('day')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'day' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'day' ? 'white' : 'var(--text-muted)'};">Jour</button>
                <button onclick="Consommables.onViewTypeChange('month')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'month' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'month' ? 'white' : 'var(--text-muted)'};">Mois</button>
              </div>

              <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-size:0.72rem; margin-bottom:4px; opacity:0.8; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${this.viewType === 'day' ? 'Date' : 'Période'}</label>
                ${this.viewType === 'day' 
                  ? `<input type="date" class="form-input" value="${this.selectedDay}" onchange="Consommables.onDayChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:rgba(255,255,255,0.05); border-color:var(--accent-blue); font-weight:600; color:white;">`
                  : `<input type="month" class="form-input" value="${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}" onchange="Consommables.onPeriodChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:rgba(255,255,255,0.05); border-color:var(--accent-blue); font-weight:600; color:white;">`
                }
              </div>
            </div>

            <div class="period-navigation" style="display:flex; align-items:center; gap:16px;">
              <button class="nav-btn" onclick="Consommables.navigatePeriod(-1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div class="current-period-display" style="text-align:center; min-width:200px;">
                <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700; margin-bottom:2px;">
                  Période Sélectionnée
                </div>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent-blue);">
                  ${this.viewType === 'month' ? App.formatMonthFR(this.selectedPeriod) : App.formatDateFR(this.selectedDayISO)}
                </div>
              </div>

              <button class="nav-btn" onclick="Consommables.navigatePeriod(1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-icon blue">📦</div>
            <div class="kpi-label">Valeur du Stock</div>
            <div class="kpi-value">${App.formatNumber(totalStockVal, 0)}<span class="kpi-unit">DH</span></div>
            <div class="kpi-change">Total immobilisé</div>
          </div>
          <div class="kpi-card orange">
            <div class="kpi-icon orange">📤</div>
            <div class="kpi-label">Sorties (${this.viewType === 'month' ? 'Mois' : 'Jour'})</div>
            <div class="kpi-value">${App.formatNumber(totalSorties, 0)}</div>
            <div class="kpi-change">Unités consommées</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-icon green">📥</div>
            <div class="kpi-label">Entrées (${this.viewType === 'month' ? 'Mois' : 'Jour'})</div>
            <div class="kpi-value">${App.formatNumber(totalEntrees, 0)}</div>
            <div class="kpi-change">Unités reçues</div>
          </div>
          <div class="kpi-card red">
            <div class="kpi-icon red">🚨</div>
            <div class="kpi-label">Alertes Actives</div>
            <div class="kpi-value">${alerts.length}</div>
            <div class="kpi-change">${criticals.length} critiques</div>
          </div>
        </div>

        <div class="tabs" style="margin-bottom:32px;">
          <div class="tab ${this.currentTab === 'stock' ? 'active' : ''}" onclick="Consommables.switchTab('stock')">📋 État des Stocks</div>
          <div class="tab ${this.currentTab === 'mouvements' ? 'active' : ''}" onclick="Consommables.switchTab('mouvements')">🔄 Historique Mvts</div>
          <div class="tab ${this.currentTab === 'bl' ? 'active' : ''}" onclick="Consommables.switchTab('bl')">📄 Bons de Livraison</div>
        </div>

        <div id="consFormContainer"></div>

        <div class="slide-up">
          ${this.renderTabContent()}
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  renderTabContent() {
    switch(this.currentTab) {
      case 'stock': return `
        <div class="card">
          <div class="card-header"><span class="card-title">📦 Inventaire Détaillé</span></div>
          <div class="card-body"><div class="table-container">${this.buildStockTable()}</div></div>
        </div>
      `;
      case 'mouvements': return `
        <div class="card">
          <div class="card-header"><span class="card-title">🔄 Flux de Stock</span></div>
          <div class="card-body"><div class="table-container">${this.buildMouvementsTable()}</div></div>
        </div>
      `;
      case 'bl': return this.renderBL();
      default: return '';
    }
  },

  getStatus(c) {
    if (c.stock <= c.seuilCritique) return { label: 'CRITIQUE', cls: 'critical', pct: Math.min(100, (c.stock / c.seuilCritique) * 30) };
    if (c.stock <= c.seuilAlerte) return { label: 'ALERTE', cls: 'warning', pct: 30 + ((c.stock - c.seuilCritique) / (c.seuilAlerte - c.seuilCritique)) * 30 };
    return { label: 'OK', cls: 'ok', pct: Math.min(100, 60 + ((c.stock - c.seuilAlerte) / (c.seuilAlerte * 2)) * 40) };
  },

  guessCategory(nom) {
    const n = (nom || '').toUpperCase();
    if (n.includes('SACHET')) return 'Sachets';
    if (n.includes('CARTON')) return 'Conditionnement';
    if (n.includes('ETIQUETTE')) return 'Conditionnement';
    if (n.includes('FILM') || n.includes('SCOTCH') || n.includes('PALETTE')) return 'Emballage';
    if (n.includes('SEL')) return 'Intrant';
    return 'Autres';
  },

  buildStockTable() {
    const cons = App.data.consommables;
    
    // Enrich with categories if missing
    cons.forEach(c => {
      if (!c.categorie) c.categorie = this.guessCategory(c.nom);
    });

    const categories = [...new Set(cons.map(c => c.categorie || 'Autres'))];
    
    let html = '';
    categories.forEach(cat => {
      const items = cons.filter(c => (c.categorie || 'Autres') === cat);
      if (items.length === 0) return;

      html += `
        <div class="category-section" style="margin-top:24px; margin-bottom:12px;">
          <h3 style="font-size:1.1rem; color:var(--accent-blue); border-left:4px solid var(--accent-blue); padding-left:12px; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">${cat === 'Sachets' ? '🛍️' : cat === 'Conditionnement' ? '📦' : cat === 'Emballage' ? '🏷️' : '⚙️'}</span>
            ${cat}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th class="td-right">Stock</th>
                <th>Unité</th>
                <th class="td-right">Prix Unit.</th>
                <th class="td-right">Valeur Total</th>
                <th>Statut</th>
                <th>Observations / Reste</th>
                <th class="td-center" style="width:80px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(c => {
                const st = this.getStatus(c);
                const totalVal = (c.stock || 0) * (c.prixUnitaire || 0);
                return `
                  <tr>
                    <td class="td-bold">${c.nom}</td>
                    <td class="td-right td-bold" style="color:${st.cls==='critical'?'var(--accent-red)':st.cls==='warning'?'#F5A623':'inherit'}">${App.formatNumber(c.stock, 1)}</td>
                    <td>${c.unite}</td>
                    <td class="td-right">${App.formatNumber(c.prixUnitaire)} DH</td>
                    <td class="td-right td-bold" style="color:var(--accent-cyan)">${App.formatNumber(totalVal)} DH</td>
                    <td><span class="badge badge-${st.cls}">${st.cls === 'critical' ? '🔴' : st.cls === 'warning' ? '🟡' : '🟢'} ${st.label}</span></td>
                    <td style="font-size:0.8rem; color:var(--text-muted); max-width:200px;">${c.observation || '-'}</td>
                    <td class="td-center">
                      <div style="display:flex; gap:4px; justify-content:center;">
                        <button class="btn-icon" onclick="Consommables.editModal(${c.id})" title="Modifier"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                        <button class="btn-icon danger" onclick="Consommables.deleteItem(${c.id})" title="Supprimer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              <tr style="background:rgba(37, 99, 255, 0.05);">
                <td colspan="4" class="td-bold td-right">Sous-total ${cat} :</td>
                <td class="td-right td-bold" style="color:var(--accent-blue); font-size:1rem;">${App.formatNumber(items.reduce((s,i)=>(s+(i.stock*i.prixUnitaire)),0))} DH</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });

    const totalStock = cons.reduce((s,i)=>(s+(i.stock*i.prixUnitaire)),0);
    html += `
      <div style="margin-top:30px; padding:20px; background:var(--gradient-primary); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; color:white; box-shadow:var(--shadow-md);">
        <div>
          <div style="font-size:0.9rem; opacity:0.8; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Valeur totale du stock consommables</div>
          <div style="font-size:1.8rem; font-weight:800;">${App.formatNumber(totalStock)} DH</div>
        </div>
        <div style="font-size:2.5rem; opacity:0.3;">📦</div>
      </div>
    `;

    return html;
  },

  buildMouvementsTable() {
    const mvts = (App.data.mouvementsStock || []).filter(m => 
      this.viewType === 'month' ? m.date.startsWith(this.selectedPeriod) : m.date.startsWith(this.selectedDayISO)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (mvts.length === 0) return '<div class="empty-state"><div class="empty-state-icon">📋</div><div>Aucun mouvement sur cette période</div></div>';
    
    return `<table>
      <thead><tr><th>Date</th><th>Consommable</th><th>Type</th><th>Quantité</th><th>Motif</th></tr></thead>
      <tbody>${mvts.map(m => `<tr>
        <td>${App.formatDateFR(m.date)} ${this.viewType === 'month' ? '' : '<br><small style="color:var(--text-muted)">' + m.date.split('T')[1].substring(0, 5) + '</small>'}</td>
        <td class="td-bold">${m.consommable}</td>
        <td><span class="badge ${m.type==='entree'?'badge-success':'badge-warning'}">${m.type==='entree'?'📥 Entrée':'📤 Sortie'}</span></td>
        <td class="td-right td-bold">${m.type==='entree'?'+':'-'}${App.formatNumber(m.quantite, 1)}</td>
        <td>${m.motif||''}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  },

  showAddModal(entry = null) {
    const isEdit = !!entry;
    const cats = ['Sachets', 'Conditionnement', 'Emballage', 'Intrant', 'Autres'];
    const currentCat = entry?.categorie || this.guessCategory(entry?.nom);

    App.showModal(isEdit ? '✏️ Modifier consommable' : '➕ Ajouter un consommable', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nom</label><input type="text" class="form-input" id="cNom" value="${entry?.nom||''}"></div>
        <div class="form-group">
          <label class="form-label">Catégorie</label>
          <select class="form-select" id="cCategorie">
            ${cats.map(c => `<option value="${c}" ${currentCat===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Unité</label><input type="text" class="form-input" id="cUnite" value="${entry?.unite||'pièce'}"></div>
        <div class="form-group"><label class="form-label">Stock actuel</label><input type="number" step="0.1" class="form-input" id="cStock" value="${entry?.stock||0}"></div>
        <div class="form-group"><label class="form-label">Prix unitaire (DH)</label><input type="number" step="0.01" class="form-input" id="cPrix" value="${entry?.prixUnitaire||0}"></div>
        <div class="form-group"><label class="form-label">Seuil d'alerte 🟡</label><input type="number" class="form-input" id="cSeuilAlerte" value="${entry?.seuilAlerte||100}"></div>
        <div class="form-group"><label class="form-label">Seuil critique 🔴</label><input type="number" class="form-input" id="cSeuilCritique" value="${entry?.seuilCritique||50}"></div>
        <div class="form-group" style="grid-column: span 2;"><label class="form-label">Observations / Reste</label><input type="text" class="form-input" id="cObs" value="${entry?.observation||''}" placeholder="Ex: Reste 24 Rouleaux"></div>
      </div>
    `, `<button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
       <button class="btn btn-success" onclick="Consommables.saveItem(${entry?.id||0})">${isEdit ? 'Mettre à jour' : 'Ajouter'}</button>`);
  },

  editModal(id) {
    const c = App.data.consommables.find(c => c.id === id);
    if (c) this.showAddModal(c);
  },

  saveItem(editId) {
    const nom = document.getElementById('cNom').value.trim();
    if (!nom) { App.toast('Le nom est requis', 'error'); return; }
    const data = {
      nom: nom,
      categorie: document.getElementById('cCategorie').value,
      unite: document.getElementById('cUnite').value,
      stock: parseFloat(document.getElementById('cStock').value) || 0,
      prixUnitaire: parseFloat(document.getElementById('cPrix').value) || 0,
      seuilAlerte: parseFloat(document.getElementById('cSeuilAlerte').value) || 0,
      seuilCritique: parseFloat(document.getElementById('cSeuilCritique').value) || 0,
      observation: document.getElementById('cObs').value
    };
    if (data.stock < 0 || data.prixUnitaire < 0 || data.seuilAlerte < 0 || data.seuilCritique < 0) {
      App.toast('Les valeurs numériques doivent être positives', 'error');
      return;
    }
    if (data.seuilCritique > data.seuilAlerte && data.seuilAlerte > 0) {
      App.toast('Le seuil critique doit être inférieur ou égal au seuil alerte', 'error');
      return;
    }

    if (editId) {
      const idx = App.data.consommables.findIndex(c => c.id === editId);
      if (idx !== -1) {
        const oldStock = App.data.consommables[idx].stock || 0;
        App.data.consommables[idx] = { ...App.data.consommables[idx], ...data };
        const delta = data.stock - oldStock;
        if (delta !== 0) {
          if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
          App.data.mouvementsStock.push({
            date: new Date().toISOString(),
            consommable: data.nom,
            type: delta > 0 ? 'entree' : 'sortie',
            quantite: Math.abs(delta),
            motif: 'Ajustement manuel'
          });
        }
      }
    } else {
      data.id = App.nextId(App.data.consommables);
      App.data.consommables.push(data);
    }
    App.saveData();
    App.closeModal();
    this.render();
    App.toast(editId ? 'Consommable modifié' : 'Consommable ajouté', 'success');
  },

  deleteItem(id) {
    const item = App.data.consommables.find(c => c.id === id);
    if (item && (App.data.mouvementsStock || []).some(m => m.consommable === item.nom)) {
      App.toast('Suppression bloquée: ce consommable possède un historique de mouvements', 'error');
      return;
    }
    if (!confirm('Supprimer ce consommable ?')) return;
    App.data.consommables = App.data.consommables.filter(c => c.id !== id);
    App.saveData();
    this.render();
    App.toast('Consommable supprimé', 'info');
  },

  showReception() {
    const opts = App.data.consommables.map(c => `<option value="${c.id}">${c.nom} (stock: ${c.stock} ${c.unite})</option>`).join('');
    App.showModal('📥 Réception de stock', `
      <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
        <input type="file" id="scanConsInput" accept="image/*" style="display:none" onchange="Consommables.processOCR(event)">
        <button class="btn btn-outline" style="border-color:var(--accent-blue); color:var(--accent-blue);" onclick="document.getElementById('scanConsInput').click()">
          📸 Scanner document IA
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Consommable</label><select class="form-select" id="rConsommable">${opts}</select></div>
        <div class="form-group"><label class="form-label">Quantité reçue</label><input type="number" class="form-input" id="rQuantite" value="0"></div>
        <div class="form-group" style="grid-column: span 2;"><label class="form-label">Motif / Fournisseur</label><input type="text" class="form-input" id="rMotif" placeholder="Ex: Commande fournisseur X"></div>
      </div>
    `, `
      <button class="btn btn-success" onclick="Consommables.saveReception()">📥 Enregistrer la réception</button>
    `);
  },

  saveReception() {
    const id = parseInt(document.getElementById('rConsommable').value);
    const qty = parseFloat(document.getElementById('rQuantite').value) || 0;
    const motif = document.getElementById('rMotif').value;
    if (qty <= 0) { App.toast('Quantité invalide', 'error'); return; }
    const c = App.data.consommables.find(c => c.id === id);
    if (c) {
      c.stock += qty;
      if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
      App.data.mouvementsStock.unshift({ date: new Date().toISOString(), consommable: c.nom, type: 'entree', quantite: qty, motif });
      App.saveData();
      App.closeModal();
      this.render();
      App.toast(`+${qty} ${c.unite} de ${c.nom} ajoutés`, 'success');
    }
  },

  async processOCR(event) {
    const file = event.target.files[0];
    if (!file) return;

    App.AI.showOverlay("Analyse du Bon de Livraison / Réception...");
    
    try {
      const prompt = `Analyse ce document de réception de consommables. 
Extraits le fournisseur et la liste des articles avec leurs quantités.
Structure JSON attendue :
{
  "fournisseur": "Nom",
  "lignes": [
    { "nom": "ARTICLE", "quantite": 10, "prixUnit": 0 }
  ]
}
Notes: Sois précis sur les noms des articles (ex: SACHET 25x35).`;

      const data = await App.AI.analyzeImage(file, prompt);
      App.AI.hideOverlay();
      this.applyAIData(data);
    } catch (error) {
      App.AI.hideOverlay();
      App.toast("Erreur IA: " + error.message, "error");
    } finally {
      event.target.value = '';
    }
  },

  showSortie() {
    const opts = App.data.consommables.map(c => `<option value="${c.id}">${c.nom} (Dispo: ${c.stock} ${c.unite})</option>`).join('');
    App.showModal('📤 Sortie de stock', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Consommable</label><select class="form-select" id="sConsommable">${opts}</select></div>
        <div class="form-group"><label class="form-label">Quantité sortie</label><input type="number" class="form-input" id="sQuantite" value="0"></div>
        <div class="form-group" style="grid-column: span 2;"><label class="form-label">Motif / Destination</label><input type="text" class="form-input" id="sMotif" placeholder="Ex: Production du 12/05, Vente Client X"></div>
      </div>
    `, `
      <button class="btn btn-warning" onclick="Consommables.saveSortie()">📤 Enregistrer la sortie</button>
    `);
  },

  saveSortie() {
    const id = parseInt(document.getElementById('sConsommable').value);
    const qty = parseFloat(document.getElementById('sQuantite').value) || 0;
    const motif = document.getElementById('sMotif').value;

    if (qty <= 0) { App.toast('Quantité invalide', 'error'); return; }
    
    const c = App.data.consommables.find(c => c.id === id);
    if (!c) return;

    if (qty > c.stock) {
      if (!confirm(`Stock insuffisant (${c.stock} ${c.unite} disponibles). Voulez-vous forcer la sortie ?`)) return;
    }

    c.stock -= qty;
    if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
    App.data.mouvementsStock.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      consommable: c.nom,
      type: 'sortie',
      quantite: qty,
      motif: motif || 'Sortie manuelle'
    });

    App.saveData();
    App.closeModal();
    this.render();
    App.toast(`-${qty} ${c.unite} de ${c.nom} retirés`, 'info');
  },

  renderBL() {
    const allBLs = App.data.bonsLivraisonConsommables || [];
    const bls = allBLs.filter(b => 
      this.viewType === 'month' ? b.date.startsWith(this.selectedPeriod) : b.date.startsWith(this.selectedDayISO)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <span class="card-title">📄 Bons de Livraison (${this.viewType === 'month' ? 'Mois' : 'Jour'})</span>
          <button class="btn btn-primary" onclick="Consommables.showBLForm()">+ Nouveau BL</button>
        </div>
        <div class="card-body">
          <div class="table-container">
            ${bls.length === 0 ? '<div class="empty-state">Aucun BL sur cette période</div>' : `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>N° BL</th>
                    <th>Destinataire</th>
                    <th>Articles</th>
                    <th class="td-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${bls.map(b => `
                    <tr>
                      <td>${App.formatDateFR(b.date)}</td>
                      <td><span class="badge badge-info">${b.numero}</span></td>
                      <td class="td-bold">${b.destinataire}</td>
                      <td>${(b.lignes || []).map(l => `${l.nom} (${l.qty})`).join(', ')}</td>
                      <td class="td-center">
                        <button class="btn-icon" onclick="Consommables.printBL(${b.id})">🖨️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
  },

  showBLForm() {
    App.showModal('📄 Nouveau Bon de Livraison', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Destinataire</label><input type="text" class="form-input" id="blDest" placeholder="Ex: Client, Atelier..."></div>
        <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="blDate" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div id="blLines" style="margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-weight:600;">Articles à livrer</span>
          <button class="btn btn-outline btn-sm" onclick="Consommables.addBLLine()">+ Ajouter</button>
        </div>
        <div id="blLinesList"></div>
      </div>
    `, `
      <button class="btn btn-primary" onclick="Consommables.saveBL()">Générer le BL & Déduire du stock</button>
    `);
    this.addBLLine();
  },

  addBLLine() {
    const list = document.getElementById('blLinesList');
    const div = document.createElement('div');
    div.className = 'form-grid';
    div.style.gridTemplateColumns = '1fr 80px 40px';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <select class="form-select bl-item">
        ${App.data.consommables.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
      </select>
      <input type="number" class="form-input bl-qty" placeholder="Qté">
      <button class="btn-icon danger" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(div);
  },

  saveBL() {
    const dest = document.getElementById('blDest').value;
    const date = document.getElementById('blDate').value;
    const lines = Array.from(document.querySelectorAll('#blLinesList .form-grid')).map(div => ({
      id: parseInt(div.querySelector('.bl-item').value),
      qty: parseFloat(div.querySelector('.bl-qty').value) || 0
    })).filter(l => l.qty > 0);

    if (!dest || lines.length === 0) { App.toast('Veuillez remplir les informations', 'error'); return; }

    const blId = Date.now();
    const blNum = 'BLC-' + (App.data.bonsLivraisonConsommables?.length + 1 || 1).toString().padStart(4, '0');
    
    const bl = {
      id: blId,
      numero: blNum,
      date,
      destinataire: dest,
      lignes: []
    };

    lines.forEach(l => {
      const c = App.data.consommables.find(item => item.id === l.id);
      if (c) {
        c.stock -= l.qty;
        if (!App.data.mouvementsStock) App.data.mouvementsStock = [];
        const mDate = date.includes('T') ? date : (date + 'T' + new Date().toISOString().split('T')[1]);
        App.data.mouvementsStock.unshift({
          date: mDate, consommable: c.nom, type: 'sortie', quantite: l.qty, motif: 'Sortie via ' + blNum
        });
        bl.lignes.push({ nom: c.nom, qty: l.qty, unite: c.unite });
      }
    });

    if (!App.data.bonsLivraisonConsommables) App.data.bonsLivraisonConsommables = [];
    App.data.bonsLivraisonConsommables.unshift(bl);
    App.saveData();
    App.closeModal();
    this.render();
    App.toast('Bon de Livraison généré avec succès', 'success');
  },

  printBL(id) {
    const bl = (App.data.bonsLivraisonConsommables || []).find(b => b.id === id);
    if (!bl) return;
    App.toast("Impression du BL " + bl.numero + " en cours...", "info");
    // Implementation of print logic would go here
  }
};
