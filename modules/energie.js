/* ============================================
   ENERGIE — Analyse énergétique
   ============================================ */
const Energie = {
  viewType: 'month', // 'day' or 'month'
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  selectedDay: new Date().toISOString().split('T')[0],
  selectedPeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
  selectedDayISO: new Date().toISOString().substring(0, 10), // YYYY-MM-DD
  activeTab: 'electricity', // 'electricity' or 'water'

  setActiveTab(tab) {
    this.activeTab = tab;
    this.render();
  },

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

    if (data.type === 'thermographe') {
      const temps = data.temperatures || [];
      temps.forEach(t => {
        const zone = App.AI.fuzzyMatch(t.zone, ['TUNNEL 1', 'TUNNEL 2', 'CHAMBRE 1', 'CHAMBRE 2', 'SAS', 'RECEPTION']);
        if (zone) {
          if (!App.data.stockage) App.data.stockage = {};
          if (!App.data.stockage.temperatures) App.data.stockage.temperatures = {};
          App.data.stockage.temperatures[zone] = t.temp_moyenne;
        }
      });
      App.toast("Températures des zones mises à jour via IA.", "success");
      this.render();
    } else {
      // Normalisation du mois (IA peut renvoyer JJ/MM/AAAA ou MM/AAAA)
      let finalMonth = data.mois || "";
      if (finalMonth.includes('/')) {
        const parts = finalMonth.split('/');
        if (parts.length >= 2) {
          const m = parts[parts.length - 2].padStart(2, '0');
          const y = parts[parts.length - 1];
          finalMonth = `${y}-${m}`;
        }
      }

      App.showModal("⚡ Facture Énergie (IA)", `
        <div class="form-grid">
          <div class="form-group"><label>Mois</label><input type="month" id="ai_eMois" value="${finalMonth || this.selectedPeriod}"></div>
          <div class="form-group"><label>Conso HP (kWh)</label><input type="number" id="ai_eHP" value="${data.consoHP || 0}"></div>
          <div class="form-group"><label>Conso HPl (kWh)</label><input type="number" id="ai_eHPl" value="${data.consoHPl || 0}"></div>
          <div class="form-group"><label>Conso HC (kWh)</label><input type="number" id="ai_eHC" value="${data.consoHC || 0}"></div>
          <div class="form-group"><label>Montant TTC (DH)</label><input type="number" id="ai_eTotal" value="${data.montantTTC || 0}"></div>
        </div>
      `, `
        <button class="btn btn-primary" onclick="Energie.saveAI()">Enregistrer la facture</button>
      `);
    }
  },

  saveAI() {
    const mois = document.getElementById('ai_eMois').value;
    if (!App.data.energie) App.data.energie = {};
    if (!App.data.energie.history) App.data.energie.history = {};
    
    App.data.energie.history[mois] = {
      consoHP: parseFloat(document.getElementById('ai_eHP').value) || 0,
      consoHPl: parseFloat(document.getElementById('ai_eHPl').value) || 0,
      consoHC: parseFloat(document.getElementById('ai_eHC').value) || 0,
      montantTTC: parseFloat(document.getElementById('ai_eTotal').value) || 0
    };
    
    App.saveData();
    App.closeModal();
    App.toast("Données énergétiques enregistrées", "success");
  },

  render() {
    if (!this.selectedPeriod) this.updatePeriodISO();

    const p = App.data.parametres;
    const e = this.getMonthData(); // This uses this.selectedPeriod
    const content = document.getElementById('pageContent');
    if (!content) return;

    const computedZones = this.getComputedZones(); // This uses this.selectedDayISO
    const facture = this.calcFacture();
    
    // Fetch water month data
    const w = App.data.energieMensuelle?.eauMonths?.[this.selectedPeriod] || { mois: this.selectedPeriod, indexAncien: 0, indexNouveau: 0, consommation: 0, montantTTC: 0, lignes: [] };

    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header" style="margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <nav style="display:flex; gap:8px; margin-bottom:8px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
                <span>Infrastructure</span>
                <span>/</span>
                <span style="color:var(--accent-blue);">Analyse Énergétique & Fluides</span>
              </nav>
              <h2 class="page-title">Management de l'Énergie & Fluides</h2>
            </div>
            <div style="display:flex; gap:12px;">
              ${this.activeTab === 'electricity' ? `
                <button class="btn btn-primary" onclick="Energie.saveEnergie()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  <span>Enregistrer Électricité</span>
                </button>
              ` : `
                <button class="btn btn-primary" style="background:#0ea5e9; box-shadow: 0 4px 12px rgba(14,165,233,0.25);" onclick="Energie.saveWaterManual()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  <span>Enregistrer Eau</span>
                </button>
              `}
            </div>
          </div>

          <!-- Onglets Premium -->
          <div class="tabs" style="margin-top: 24px; margin-bottom: 16px;">
            <div class="tab ${this.activeTab === 'electricity' ? 'active' : ''}" onclick="Energie.setActiveTab('electricity')" style="display:flex; align-items:center; gap:8px;">
              <span>⚡ Électricité & Froid</span>
            </div>
            <div class="tab ${this.activeTab === 'water' ? 'active' : ''}" onclick="Energie.setActiveTab('water')" style="display:flex; align-items:center; gap:8px; border-bottom-color: ${this.activeTab === 'water' ? '#0ea5e9 !important' : 'transparent'}; color: ${this.activeTab === 'water' ? '#0ea5e9 !important' : ''}">
              <span>💧 Fluides & Eau</span>
            </div>
          </div>

          <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:12px 20px; border-radius:var(--radius-lg); border:1px solid rgba(255,255,255,0.05); backdrop-filter:blur(10px);">
            <div style="display:flex; gap:12px; align-items:flex-end;">
              ${this.activeTab === 'electricity' ? `
                <div style="display:flex; background:rgba(0,0,0,0.2); padding:4px; border-radius:10px; display:flex; gap:4px; margin-bottom:2px;">
                  <button onclick="Energie.onViewTypeChange('day')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'day' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'day' ? 'white' : 'var(--text-muted)'};">Simulation Jour</button>
                  <button onclick="Energie.onViewTypeChange('month')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'month' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'month' ? 'white' : 'var(--text-muted)'};">Facturation Mois</button>
                </div>
              ` : `
                <div style="padding: 8px 12px; font-size:0.75rem; font-weight:700; background:rgba(14, 165, 233, 0.1); border:1px solid rgba(14, 165, 233, 0.2); border-radius:8px; color:#0ea5e9; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">
                  Facturation Eau SRM
                </div>
              `}

              <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-size:0.72rem; margin-bottom:4px; opacity:0.8; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Période d'analyse</label>
                ${this.activeTab === 'electricity' && this.viewType === 'day' 
                  ? `<input type="date" class="form-input" value="${this.selectedDay}" onchange="Energie.onDayChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:rgba(255,255,255,0.05); border-color:var(--accent-blue); font-weight:600; color:white;">`
                  : `<input type="month" class="form-input" value="${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}" onchange="Energie.onPeriodChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:rgba(255,255,255,0.05); border-color:${this.activeTab === 'water' ? '#0ea5e9' : 'var(--accent-blue)'}; font-weight:600; color:white;">`
                }
              </div>
            </div>

            <div class="period-navigation" style="display:flex; align-items:center; gap:16px;">
              <button class="nav-btn" onclick="Energie.navigatePeriod(-1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div class="current-period-display" style="text-align:center; min-width:200px;">
                <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700; margin-bottom:2px;">
                  Période d'Analyse
                </div>
                <div style="font-size:1.1rem; font-weight:800; color:${this.activeTab === 'water' ? '#0ea5e9' : 'var(--accent-blue)'};">
                  ${this.activeTab === 'water' || this.viewType === 'month' ? App.formatMonthFR(this.selectedPeriod) : App.formatDateFR(this.selectedDayISO)}
                </div>
              </div>

              <button class="nav-btn" onclick="Energie.navigatePeriod(1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>

        ${this.activeTab === 'electricity' ? `
          <div class="kpi-grid" style="margin-bottom:24px;">
            <div class="kpi-card cyan">
              <div class="kpi-icon cyan">❄️</div>
              <div class="kpi-label">Charge Froid Simulation</div>
              <div class="kpi-value">${App.formatNumber(this.calcTotalFroid(computedZones),0)} <span class="kpi-unit">kWh/j</span></div>
              <div class="kpi-change">${this.viewType === 'day' ? 'Basé sur thermographe' : 'Moyenne mensuelle estimée'}</div>
            </div>
            <div class="kpi-card blue">
              <div class="kpi-icon blue">🏢</div>
              <div class="kpi-label">Consommation RDC</div>
              <div class="kpi-value">${App.formatNumber(this.calcTotalRDC(),1)} <span class="kpi-unit">kWh/j</span></div>
              <div class="kpi-change">Hors froid industriel</div>
            </div>
            <div class="kpi-card yellow">
              <div class="kpi-icon yellow">💡</div>
              <div class="kpi-label">Conso. Réelle (Mois)</div>
              <div class="kpi-value">${App.formatNumber((e.consoHP||0)+(e.consoHPl||0)+(e.consoHC||0),0)}<span class="kpi-unit">kWh</span></div>
              <div class="kpi-change">Données facturées</div>
            </div>
            <div class="kpi-card red">
              <div class="kpi-icon red">💰</div>
              <div class="kpi-label">Estimation Facture</div>
              <div class="kpi-value">${App.formatNumber(facture.total,0)}<span class="kpi-unit">DH</span></div>
              <div class="kpi-change">Incl. taxes et redevances</div>
            </div>
          </div>

          <div class="slide-up">
            ${this.viewType === 'day' ? this.renderDayView(computedZones) : this.renderMonthView(e, p, facture)}
          </div>
        ` : `
          <div class="kpi-grid" style="margin-bottom:24px;">
            <div class="kpi-card cyan" style="border-color: rgba(14, 165, 233, 0.2);">
              <div class="kpi-icon cyan" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9;">💧</div>
              <div class="kpi-label">Volume Consommé</div>
              <div class="kpi-value">${App.formatNumber(w.consommation || 0, 0)} <span class="kpi-unit">m³</span></div>
              <div class="kpi-change">Volume facturé SRM</div>
            </div>
            <div class="kpi-card blue" style="border-color: rgba(14, 165, 233, 0.2);">
              <div class="kpi-icon blue" style="background: rgba(14, 165, 233, 0.1); color: #3b82f6;">📈</div>
              <div class="kpi-label">Relevé Index</div>
              <div class="kpi-value" style="font-size:1.4rem; padding-top: 8px;">${w.indexAncien || 0} ➡️ ${w.indexNouveau || 0}</div>
              <div class="kpi-change">Ancien vs Nouveau</div>
            </div>
            <div class="kpi-card yellow" style="border-color: rgba(14, 165, 233, 0.2);">
              <div class="kpi-icon yellow" style="background: rgba(14, 165, 233, 0.1); color: #f59e0b;">💰</div>
              <div class="kpi-label">Facturation Réelle</div>
              <div class="kpi-value">${App.formatNumber(w.montantTTC || 0, 2)} <span class="kpi-unit">DH</span></div>
              <div class="kpi-change">Net à payer TTC</div>
            </div>
            <div class="kpi-card red" style="border-color: rgba(14, 165, 233, 0.2);">
              <div class="kpi-icon red" style="background: rgba(14, 165, 233, 0.1); color: #ef4444;">⚖️</div>
              <div class="kpi-label">Coût Moyen Unitaire</div>
              <div class="kpi-value">${w.consommation > 0 ? App.formatNumber(w.montantTTC / w.consommation, 2) : 0} <span class="kpi-unit">DH/m³</span></div>
              <div class="kpi-change">Rendement de fluide</div>
            </div>
          </div>

          <div class="slide-up">
            ${this.renderWaterView(w)}
          </div>
        `}
      </div>
    `;
    if (this.activeTab === 'electricity' && this.viewType === 'month') this.updateKPI();
  },

  renderDayView(computedZones) {
    return `
      <div class="charts-grid" style="margin-bottom:24px;">
        <div class="card" style="grid-column: span 2;">
          <div class="card-header">
            <span class="card-title">❄️ Simulation des Charges de Refroidissement (kWh/jour)</span>
            <span class="badge badge-info">Calculé à partir des relevés thermographes du jour</span>
          </div>
          <div class="card-body" style="padding:0;">
            <div class="table-container">${this.renderFroidTable(computedZones)}</div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns: 1fr; gap:24px;">
        <div class="card">
          <div class="card-header"><span class="card-title">🏢 Détail Consommation RDC (Estimation standard)</span></div>
          <div class="card-body" style="padding:0;">
            <div class="table-container">${this.renderRDCTable()}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderMonthView(e, p, facture) {
    const currentMonth = this.selectedPeriod;
    return `
      <div style="display:grid;grid-template-columns: 1fr 1.5fr; gap:24px;">
        <div class="card">
          <div class="card-header"><span class="card-title">🏢 Profil de Consommation Mensuelle</span></div>
          <div class="card-body">
            <div style="padding:20px; text-align:center; background:rgba(37, 99, 255, 0.05); border-radius:12px; margin-bottom:20px;">
              <div style="font-size:0.9rem; color:var(--text-muted);">Total kWh ce mois</div>
              <div style="font-size:2rem; font-weight:800; color:var(--accent-blue);">${App.formatNumber((e.consoHP||0)+(e.consoHPl||0)+(e.consoHC||0), 0)}</div>
            </div>
            <div class="table-container">
              <table class="table">
                <tbody>
                  <tr><td>Heures de Pointe (HP)</td><td class="td-right td-bold">${App.formatNumber(e.consoHP||0)} kWh</td></tr>
                  <tr><td>Heures Pleines (HPl)</td><td class="td-right td-bold">${App.formatNumber(e.consoHPl||0)} kWh</td></tr>
                  <tr><td>Heures Creuses (HC)</td><td class="td-right td-bold">${App.formatNumber(e.consoHC||0)} kWh</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">📝 Saisie Mensuelle & Tarification ONEE</span>
            <button class="btn btn-small btn-outline" onclick="Energie.distributeConso()" title="Répartir la consommation totale selon le profil théorique">⚡ Auto-répartir</button>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-group" style="grid-column: span 2;">
                <label class="form-label">Mois de la facture</label>
                <input type="month" class="form-input" id="eMois" value="${e.mois || currentMonth}" onchange="Energie.selectedYear=parseInt(this.value.split('-')[0]); Energie.selectedMonth=parseInt(this.value.split('-')[1]); Energie.updatePeriodISO(); Energie.render();">
              </div>
              
              <div class="form-group"><label class="form-label">Conso. HP (kWh)</label><input type="number" class="form-input" id="eConsoHP" value="${e.consoHP||0}" onchange="Energie.updateKPI()"></div>
              <div class="form-group"><label class="form-label">Tarif HP (DH)</label><input type="number" step="0.0001" class="form-input" id="eTarifHP" value="${p.tarifHP||1.45}" onchange="Energie.updateKPI()"></div>
              
              <div class="form-group"><label class="form-label">Conso. HPl (kWh)</label><input type="number" class="form-input" id="eConsoHPl" value="${e.consoHPl||0}" onchange="Energie.updateKPI()"></div>
              <div class="form-group"><label class="form-label">Tarif HPl (DH)</label><input type="number" step="0.0001" class="form-input" id="eTarifHPl" value="${p.tarifHPl||1.15}" onchange="Energie.updateKPI()"></div>
              
              <div class="form-group"><label class="form-label">Conso. HC (kWh)</label><input type="number" class="form-input" id="eConsoHC" value="${e.consoHC||0}" onchange="Energie.updateKPI()"></div>
              <div class="form-group"><label class="form-label">Tarif HC (DH)</label><input type="number" step="0.0001" class="form-input" id="eTarifHC" value="${p.tarifHC||0.85}" onchange="Energie.updateKPI()"></div>
              
              <div class="form-group"><label class="form-label">Redevances Fixes</label><input type="number" class="form-input" id="eRedFixe" value="${(p.redevancePuissance||0)+(p.redevanceEntretien||0)+(p.redevanceLocation||0)}" onchange="Energie.updateKPI()"></div>
              <div class="form-group"><label class="form-label">TVA (%)</label><input type="number" step="0.1" class="form-input" id="eTva" value="${(p.tvaEnergetique||0.14)*100}" onchange="Energie.updateKPI()"></div>
            </div>

            <div class="summary-box" style="margin-top:24px; padding:20px; background:rgba(0,0,0,0.2); border-radius:12px;">
              <h3 style="margin-bottom:16px; font-size: 1rem; color: var(--accent-blue);">Détail de la Facture Estimée</h3>
              <div class="summary-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="summary-label">Montant Consommation</span><span class="summary-value" id="eFactConso">0 DH</span></div>
              <div class="summary-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="summary-label">Redevances HT</span><span class="summary-value" id="eFactRedev">0 DH</span></div>
              <div class="summary-row" style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="summary-label">TVA & Taxes</span><span class="summary-value" id="eFactTaxes">0 DH</span></div>
              <div class="summary-row" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
                <span class="summary-label" style="font-weight:700; color:white;">TOTAL TTC ESTIMÉ</span>
                <span class="summary-value summary-total" id="eFactTotal" style="font-size:1.6rem; color:var(--accent-red); font-weight:800;">0 DH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getComputedZones() {
    const specs = App.data.chambresSpecs || {};
    const today = this.selectedDayISO || App.formatDate(new Date());
    const history = (App.data.chambresHistory || []);
    const lastReading = history.find(h => h.date === today) || history[history.length - 1] || {};
    
    const tempExt = 28; // Température ambiante moyenne (Agadir/Sud)

    return Object.keys(specs).map(key => {
      const s = specs[key];
      const avgTemp = typeof Chambres !== 'undefined' ? Chambres.getAvgTemp(lastReading, key) : null;
      const tempInt = avgTemp !== null ? avgTemp : (key.includes('tunnel') ? -35 : -18);
      
      // 1. Transmission (Q1)
      const deltaT = tempExt - tempInt;
      const surfaceTotale = s.surfaceToit + s.surfaceSol + (4 * Math.sqrt(s.surfaceSol) * (key.includes('tunnel') ? 3 : 5));
      const transmission = (s.isolation * surfaceTotale * deltaT * 24) / 1000;

      // 2. Produit (Q2)
      const produit = this.calcProduitCharge(key, today);

      // 3. Interne (Q3)
      const ventilateur = s.moteurs * s.dureeMoteurs; // kWh
      const eclairage = (s.projecteur * s.dureeProj) / 1000;
      const personnel = key.includes('tunnel') ? 0 : 0.27; // kW moyen

      // 4. Infiltration / Air (Q4)
      const infiltration = (s.echangeAir * 0.0011 * deltaT) || 0;

      return {
        nom: s.nom,
        tempInt,
        transmission,
        produit,
        respiration: key.includes('tunnel') ? 3.11 : 0,
        personnel,
        eclairage,
        ventilateur,
        infiltration,
        total: transmission + produit + personnel + eclairage + ventilateur + infiltration + (key.includes('tunnel') ? 3.11 : 0)
      };
    });
  },

  calcProduitCharge(zoneKey, date) {
    let poids = 0;
    const cpFish = 3.5; // kJ/kg.K

    if (zoneKey.startsWith('chambre') || zoneKey === 'entreposage') {
      (App.data.stockage || []).forEach(entry => {
        if (entry.dateEntree === date) {
          (entry.lignes || []).forEach(line => {
            if (line.chambre === zoneKey) poids += (line.pdsNetTotal || 0);
          });
        }
      });
      // De +5°C à -18°C = 23K
      return (poids * cpFish * 23) / 3600;
    } else if (zoneKey.startsWith('tunnel')) {
      (App.data.production || []).forEach(p => {
        if (p.date === date) poids += (p.poidsMP || 0);
      });
      // On divise la production par 3 tunnels
      const poidsTunnel = poids / 3;
      // De +15°C à -35°C = 50K
      return (poidsTunnel * cpFish * 50) / 3600;
    }
    return 0;
  },

  equipRDC: [
    { nom: 'Réglettes doubles (Lumières)', puissance: 36, quantite: 74, heures: 8 },
    { nom: 'Balances de pesage', puissance: 9, quantite: 4, heures: 8 },
    { nom: 'Clark électrique (Charge)', puissance: 2500, quantite: 1, heures: 4 },
    { nom: 'Portes automatiques', puissance: 750, quantite: 2, heures: 1 },
    { nom: 'Tue-mouches', puissance: 30, quantite: 9, heures: 12 },
    { nom: 'Bureaux / Informatique', puissance: 500, quantite: 1, heures: 8 },
  ],

  renderFroidTable(zones) {
    const labels = [
      { l: 'Temp. Moyenne', k: 'tempInt', u: '°C' },
      { l: 'Transmission', k: 'transmission', u: '' },
      { l: 'Charge Produit', k: 'produit', u: '' },
      { l: 'Infiltration / Air', k: 'infiltration', u: '' },
      { l: 'Ventilation (Moteurs)', k: 'ventilateur', u: '' },
      { l: 'Autres (Pers./Ecl.)', k: 'extra', u: '' }
    ];

    return `<table>
      <thead>
        <tr>
          <th>Poste (kWh/j)</th>
          ${zones.map(z => `<th class="td-right">${z.nom}</th>`).join('')}
          <th class="td-right td-bold">Total</th>
        </tr>
      </thead>
      <tbody>
        ${labels.map(label => `
          <tr>
            <td>${label.l}</td>
            ${zones.map(z => {
              let val = z[label.k];
              if (label.k === 'extra') val = z.personnel + z.eclairage + z.respiration;
              return `<td class="td-right">${App.formatNumber(val, label.u === '°C' ? 1 : 2)}${label.u}</td>`;
            }).join('')}
            <td class="td-right td-bold">${label.u === '°C' ? '-' : App.formatNumber(zones.reduce((s,z) => {
              let val = z[label.k];
              if (label.k === 'extra') val = z.personnel + z.eclairage + z.respiration;
              return s + (val || 0);
            }, 0), 2)}</td>
          </tr>
        `).join('')}
        <tr style="background:var(--bg-app); border-top:2px solid var(--primary-color);">
          <td class="td-bold">Total Zone (kWh/j)</td>
          ${zones.map(z => `<td class="td-right td-bold" style="color:var(--primary-color);">${App.formatNumber(z.total, 1)}</td>`).join('')}
          <td class="td-right td-bold" style="background:var(--primary-color); color:white; font-size:1.1rem;">
            ${App.formatNumber(zones.reduce((s,z) => s + z.total, 0), 0)}
          </td>
        </tr>
      </tbody>
    </table>`;
  },

  renderRDCTable() {
    return `<table>
      <thead><tr><th>Équipement</th><th class="td-right">W</th><th class="td-right">Qté</th><th class="td-right">H/j</th><th class="td-right">kWh/j</th></tr></thead>
      <tbody>
        ${this.equipRDC.map(e => {
          const conso = (e.puissance * e.quantite * e.heures) / 1000;
          return `<tr><td>${e.nom}</td><td class="td-right">${e.puissance}</td><td class="td-right">${e.quantite}</td><td class="td-right">${e.heures}</td><td class="td-right td-bold">${App.formatNumber(conso, 2)}</td></tr>`;
        }).join('')}
        <tr style="background:var(--bg-app);">
          <td colspan="4" class="td-bold">Total RDC Estimé</td>
          <td class="td-right td-bold" style="color:var(--accent-purple);">${App.formatNumber(this.calcTotalRDC(), 2)} kWh</td>
        </tr>
      </tbody>
    </table>`;
  },

  calcTotalFroid(zones) {
    if (!zones) zones = this.getComputedZones();
    return zones.reduce((s, z) => s + z.total, 0);
  },

  calcTotalRDC() {
    return this.equipRDC.reduce((s, e) => s + (e.puissance * e.quantite * e.heures / 1000), 0);
  },

  getTarifTier(hour) {
    // Standard ONEE MT (Moyenne Tension) Schedule
    if (hour >= 18 && hour < 22) return 'HP';  // Pointe (4h)
    if (hour >= 7 && hour < 18) return 'HPl'; // Pleines (11h)
    return 'HC';                              // Creuses (9h)
  },

  distributeConso() {
    const totalConso = parseFloat(prompt("Entrez la consommation totale à répartir (kWh):", "150000")) || 0;
    if (!totalConso) return;

    // Calcul du profil théorique moyen
    const zones = this.getComputedZones();
    const theoriqueParHeure = new Array(24).fill(0);

    for (let h = 0; h < 24; h++) {
      zones.forEach(z => {
        // Transmission est constante (1/24)
        theoriqueParHeure[h] += (z.transmission / 24);
        
        // Ventilation/Eclairage: on suppose plus d\'activité le jour (07h-20h)
        if (h >= 7 && h <= 20) {
          theoriqueParHeure[h] += (z.ventilateur + z.eclairage + z.personnel) / 14;
        }
        
        // Produit (Charge thermique): Tunnels tournent le jour
        if (z.nom.includes('Tunnel') && h >= 8 && h <= 20) {
          theoriqueParHeure[h] += (z.produit / 12);
        } else if (!z.nom.includes('Tunnel')) {
          theoriqueParHeure[h] += (z.produit / 24);
        }
      });
      // Ajout RDC (08h-18h)
      if (h >= 8 && h <= 18) theoriqueParHeure[h] += this.calcTotalRDC() / 10;
    }

    let totalTheorique = theoriqueParHeure.reduce((a, b) => a + b, 0);
    let ratioHP = 0, ratioHPl = 0, ratioHC = 0;

    for (let h = 0; h < 24; h++) {
      const tier = this.getTarifTier(h);
      if (tier === 'HP') ratioHP += theoriqueParHeure[h];
      else if (tier === 'HPl') ratioHPl += theoriqueParHeure[h];
      else ratioHC += theoriqueParHeure[h];
    }

    document.getElementById('eConsoHP').value = Math.round(totalConso * (ratioHP / totalTheorique));
    document.getElementById('eConsoHPl').value = Math.round(totalConso * (ratioHPl / totalTheorique));
    document.getElementById('eConsoHC').value = Math.round(totalConso * (ratioHC / totalTheorique));
    
    this.updateKPI();
    App.toast('Répartition effectuée selon le profil théorique', 'info');
  },

  getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  getMonthKey() {
    return this.selectedPeriod || this.getCurrentMonthKey();
  },

  getMonthData() {
    const key = this.getMonthKey();
    const e = App.data.energieMensuelle || {};
    const months = e.months || {};
    return months[key] || { mois: key, consoHP: 0, consoHPl: 0, consoHC: 0 };
  },

  calcFacture() {
    const e = this.getMonthData();
    const p = App.data.parametres;
    
    const htConso = (e.consoHP * (p.tarifHP || 1.45)) + 
                   (e.consoHPl * (p.tarifHPl || 1.15)) + 
                   (e.consoHC * (p.tarifHC || 0.85));
    
    const htRedev = (p.redevancePuissance || 0) + (p.redevanceEntretien || 0) + (p.redevanceLocation || 0);
    const tva = (htConso + htRedev) * (p.tvaEnergetique || 0.14);
    const taxes = (htConso + htRedev) * (p.taxeCollectivite || 0.01);

    return { htConso, htRedev, tva, taxes, total: htConso + htRedev + tva + taxes };
  },

  loadMonthForm() {
    const e = this.getMonthData();
    if (document.getElementById('eConsoHP')) {
      document.getElementById('eConsoHP').value = e.consoHP || 0;
      document.getElementById('eConsoHPl').value = e.consoHPl || 0;
      document.getElementById('eConsoHC').value = e.consoHC || 0;
    }
    this.updateKPI();
  },

  updateKPI() {
    const p = App.data.parametres;
    const cHP = parseFloat(document.getElementById('eConsoHP')?.value) || 0;
    const cHPl = parseFloat(document.getElementById('eConsoHPl')?.value) || 0;
    const cHC = parseFloat(document.getElementById('eConsoHC')?.value) || 0;
    
    const tHP = parseFloat(document.getElementById('eTarifHP')?.value) || p.tarifHP || 1.45;
    const tHPl = parseFloat(document.getElementById('eTarifHPl')?.value) || p.tarifHPl || 1.15;
    const tHC = parseFloat(document.getElementById('eTarifHC')?.value) || p.tarifHC || 0.85;
    
    const redevHT = parseFloat(document.getElementById('eRedFixe')?.value) || 0;
    const tvaRate = (parseFloat(document.getElementById('eTva')?.value) || 14) / 100;
    const taxCollRate = p.taxeCollectivite || 0.01;

    const consoHT = (cHP * tHP) + (cHPl * tHPl) + (cHC * tHC);
    const taxes = (consoHT + redevHT) * (tvaRate + taxCollRate);
    const totalTTC = consoHT + redevHT + taxes;

    if (document.getElementById('eFactConso')) {
      document.getElementById('eFactConso').textContent = App.formatNumber(consoHT, 2) + ' DH';
      document.getElementById('eFactRedev').textContent = App.formatNumber(redevHT, 2) + ' DH';
      document.getElementById('eFactTaxes').textContent = App.formatNumber(taxes, 2) + ' DH';
      document.getElementById('eFactTotal').textContent = App.formatNumber(totalTTC, 0) + ' DH';
    }

    // Update charts if needed or KPI values
    const kpiFacture = document.querySelector('.kpi-card.red .kpi-value');
    if (kpiFacture) kpiFacture.innerHTML = `${App.formatNumber(totalTTC, 0)}<span class="kpi-unit">DH</span>`;
    
    const kpiReal = document.querySelector('.kpi-card.yellow .kpi-value');
    if (kpiReal) kpiReal.innerHTML = `${App.formatNumber(cHP + cHPl + cHC, 0)}<span class="kpi-unit">kWh</span>`;
  },

  saveEnergie() {
    const mois = document.getElementById('eMois')?.value || this.getCurrentMonthKey();
    const e = {
      mois,
      consoHP: parseFloat(document.getElementById('eConsoHP').value) || 0,
      consoHPl: parseFloat(document.getElementById('eConsoHPl').value) || 0,
      consoHC: parseFloat(document.getElementById('eConsoHC').value) || 0
    };

    const current = App.data.energieMensuelle || {};
    App.data.energieMensuelle = {
      ...current,
      months: {
        ...(current.months || {}),
        [mois]: e
      }
    };

    // Mettre à jour les paramètres globaux
    App.data.parametres.tarifHP = parseFloat(document.getElementById('eTarifHP').value);
    App.data.parametres.tarifHPl = parseFloat(document.getElementById('eTarifHPl').value);
    App.data.parametres.tarifHC = parseFloat(document.getElementById('eTarifHC').value);
    App.data.parametres.redevancePuissance = parseFloat(document.getElementById('eRedFixe').value);
    App.data.parametres.tvaEnergetique = parseFloat(document.getElementById('eTva').value) / 100;

    App.saveData();
    App.toast('Facturation ONEE enregistrée', 'success');
    this.render();
  },

  renderWaterView(w) {
    let tranchesHTML = '';
    if (w.lignes && w.lignes.length > 0) {
      tranchesHTML = `
        <table class="table" style="font-size:0.85rem;">
          <thead>
            <tr>
              <th>Désignation</th>
              <th class="td-right">Volume (m³)</th>
              <th class="td-right">P.U. (DH)</th>
              <th class="td-right">Total (DH)</th>
            </tr>
          </thead>
          <tbody>
            ${w.lignes.map(line => `
              <tr>
                <td style="color:#e2e8f0; font-weight:500;">${line.designation}</td>
                <td class="td-right">${App.formatNumber(line.quantite || 0, 1)}</td>
                <td class="td-right">${App.formatNumber(line.prixUnitaire || 0, 2)}</td>
                <td class="td-right td-bold" style="color:#0ea5e9;">${App.formatNumber(line.totalLigne || 0, 2)} DH</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      tranchesHTML = `
        <div style="text-align:center; padding: 40px 20px; background: rgba(255, 255, 255, 0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">
          <div style="font-size:2.5rem; margin-bottom:12px; filter: grayscale(0.3);">📄</div>
          <h4 style="color:#cbd5e1; font-size:0.95rem; margin-bottom:6px;">Aucun détail de tranche disponible</h4>
          <p style="color:#64748b; font-size:0.8rem; max-width:280px; margin:0 auto;">Scannez une facture avec l'IA Gemini pour extraire automatiquement les tranches d'eau et d'assainissement.</p>
        </div>
      `;
    }

    return `
      <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:24px;">
        <!-- Colonne Gauche: Saisie & OCR -->
        <div class="card" style="border-color: rgba(14, 165, 233, 0.15); background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(16px); border-radius: var(--radius-xl);">
          <div class="card-header" style="border-bottom: 1px solid rgba(14, 165, 233, 0.1); padding: 16px 20px;">
            <span class="card-title" style="color:#0ea5e9; display:flex; align-items:center; gap:8px; font-weight:700;">
              <span style="font-size:1.2rem;">💧</span> Saisie Facture SRM
            </span>
          </div>
          <div class="card-body" style="padding: 20px;">
            <!-- Zone OCR Premium -->
            <div style="margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(59, 130, 246, 0.04)); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: 12px; text-align:center; box-shadow: 0 8px 32px rgba(14, 165, 233, 0.05);">
              <h4 style="color:white; font-size:1rem; margin-bottom:6px; font-weight:700; letter-spacing:0.5px;">Scanner avec Gemini AI</h4>
              <p style="color:#94a3b8; font-size:0.8rem; margin-bottom:16px; line-height:1.4;">Téléversez votre facture d'eau SRM pour que l'IA Gemini la scanne, la lise et insère directement les données.</p>
              <button class="btn" style="background:#0ea5e9; box-shadow: 0 4px 14px rgba(14,165,233,0.3); border:none; display:inline-flex; align-items:center; gap:8px; margin:0 auto; padding: 10px 20px; font-weight:700; color:white; border-radius:8px; transition: all 0.2s;" onclick="App.AiEngine.openScanner('eau', data => Energie.applyAIEauData(data))">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>DÉPOSER ET SCANNER LA FACTURE</span>
              </button>
            </div>

            <!-- Formulaire -->
            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:16px;">
              <div class="form-group" style="grid-column: span 2; margin-bottom:4px;">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Mois facturé</label>
                <input type="month" class="form-input" id="wMois" value="${w.mois || this.selectedPeriod}" onchange="Energie.selectedYear=parseInt(this.value.split('-')[0]); Energie.selectedMonth=parseInt(this.value.split('-')[1]); Energie.updatePeriodISO(); Energie.render();" style="height:42px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:10px 14px;">
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Index Ancien (m³)</label>
                <input type="number" class="form-input" id="wIndexAncien" value="${w.indexAncien || 0}" oninput="Energie.calcWaterManualVolume()" style="height:42px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:10px 14px;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Index Nouveau (m³)</label>
                <input type="number" class="form-input" id="wIndexNouveau" value="${w.indexNouveau || 0}" oninput="Energie.calcWaterManualVolume()" style="height:42px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:10px 14px;">
              </div>
              
              <div class="form-group" style="grid-column: span 2; margin-bottom:4px;">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Volume Consommé Calculé (m³)</label>
                <input type="number" class="form-input" id="wConsommation" value="${w.consommation || 0}" readonly style="height:42px; border-radius:8px; background:rgba(14, 165, 233, 0.05); border: 1px solid rgba(14, 165, 233, 0.25); color:#0ea5e9; font-weight:700; padding:10px 14px;">
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Montant HT (DH)</label>
                <input type="number" step="0.01" class="form-input" id="wMontantHT" value="${w.montantHT || 0}" style="height:42px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:10px 14px;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">TVA (DH)</label>
                <input type="number" step="0.01" class="form-input" id="wTva" value="${w.tva || 0}" style="height:42px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:10px 14px;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Droit de Timbre (DH)</label>
                <input type="number" step="0.01" class="form-input" id="wTimbre" value="${w.timbre || 0}" style="height:42px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:10px 14px;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Net à Payer TTC (DH)</label>
                <input type="number" step="0.01" class="form-input" id="wMontantTTC" value="${w.montantTTC || 0}" style="height:42px; border-radius:8px; background:rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25); color:#ef4444; font-weight:700; padding:10px 14px;">
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne Droite: Infos SRM & Tranches -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          <div class="card" style="border-color: rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(16px); border-radius: var(--radius-xl);">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span class="card-title" style="font-weight:700;">🧾 Détails & Références Administratives</span>
              <span class="badge" style="background:rgba(14, 165, 233, 0.1); color:#0ea5e9; border:1px solid rgba(14, 165, 233, 0.2); padding:4px 8px; font-weight:700; font-size:0.7rem; border-radius:6px;">SOUSS MASSA</span>
            </div>
            <div class="card-body" style="padding:20px;">
              <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">N° Facture</label>
                  <input type="text" class="form-input" id="wFactureNo" value="${w.factureNo || ''}" placeholder="Ex: 55387371" style="height:40px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:8px 12px;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">N° Police</label>
                  <input type="text" class="form-input" id="wPoliceNo" value="${w.policeNo || ''}" placeholder="Ex: 553856" style="height:40px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:8px 12px;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Référence SRM</label>
                  <input type="text" class="form-input" id="wReference" value="${w.reference || ''}" placeholder="Ex: 50 G 001 006 023" style="height:40px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:8px 12px;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Date de Facturation</label>
                  <input type="date" class="form-input" id="wDateFacture" value="${w.dateFacture || ''}" style="height:40px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:8px 12px;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Raison Sociale</label>
                  <input type="text" class="form-input" id="wClientNom" value="${w.clientNom || 'STE FISH AND FOOD PROCESS'}" style="height:40px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:8px 12px;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">ICE Client</label>
                  <input type="text" class="form-input" id="wIceClient" value="${w.iceClient || '003047045000044'}" style="height:40px; border-radius:8px; background:rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color:white; font-weight:600; padding:8px 12px;">
                </div>
              </div>
            </div>
          </div>

          <div class="card" style="border-color: rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(16px); border-radius: var(--radius-xl);">
            <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span class="card-title" style="font-weight:700;">📊 Ventilation des Tranches SRM</span>
            </div>
            <div class="card-body" style="padding:0;">
              <div class="table-container">
                ${tranchesHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  calcWaterManualVolume() {
    const anc = parseFloat(document.getElementById('wIndexAncien')?.value) || 0;
    const nouv = parseFloat(document.getElementById('wIndexNouveau')?.value) || 0;
    const diff = Math.max(0, nouv - anc);
    const inputConso = document.getElementById('wConsommation');
    if (inputConso) {
      inputConso.value = diff;
    }
  },

  saveWaterManual() {
    const mois = document.getElementById('wMois')?.value || this.selectedPeriod;
    const indexAncien = parseFloat(document.getElementById('wIndexAncien')?.value) || 0;
    const indexNouveau = parseFloat(document.getElementById('wIndexNouveau')?.value) || 0;
    const consommation = parseFloat(document.getElementById('wConsommation')?.value) || 0;
    const montantHT = parseFloat(document.getElementById('wMontantHT')?.value) || 0;
    const tva = parseFloat(document.getElementById('wTva')?.value) || 0;
    const timbre = parseFloat(document.getElementById('wTimbre')?.value) || 0;
    const montantTTC = parseFloat(document.getElementById('wMontantTTC')?.value) || 0;

    const factureNo = document.getElementById('wFactureNo')?.value || '';
    const policeNo = document.getElementById('wPoliceNo')?.value || '';
    const reference = document.getElementById('wReference')?.value || '';
    const dateFacture = document.getElementById('wDateFacture')?.value || `${mois}-27`;
    const clientNom = document.getElementById('wClientNom')?.value || 'STE FISH AND FOOD PROCESS';
    const iceClient = document.getElementById('wIceClient')?.value || '003047045000044';

    const currentWater = App.data.energieMensuelle?.eauMonths?.[mois] || {};
    const lines = currentWater.lignes || [];

    const wData = {
      mois,
      indexAncien,
      indexNouveau,
      consommation,
      montantHT,
      tva,
      timbre,
      montantTTC,
      factureNo,
      policeNo,
      reference,
      dateFacture,
      clientNom,
      iceClient,
      lignes: lines
    };

    if (!App.data.energieMensuelle) App.data.energieMensuelle = {};
    if (!App.data.energieMensuelle.eauMonths) App.data.energieMensuelle.eauMonths = {};
    App.data.energieMensuelle.eauMonths[mois] = wData;

    App.data.factures = App.data.factures || [];
    let existingIdx = App.data.factures.findIndex(f => f.origine === 'eau' && f.date.substring(0, 7) === mois);
    if (existingIdx === -1 && factureNo) {
      existingIdx = App.data.factures.findIndex(f => f.numero === factureNo);
    }

    const factureEntry = {
      id: existingIdx !== -1 ? App.data.factures[existingIdx].id : App.nextId(App.data.factures),
      date: dateFacture || `${mois}-28`,
      dateEcheance: dateFacture ? new Date(new Date(dateFacture).getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : `${mois}-28`,
      fournisseur: 'SRM SOUSS MASSA',
      numero: factureNo,
      etatPaiement: existingIdx !== -1 ? App.data.factures[existingIdx].etatPaiement : 'non_paye',
      motif: `Facture d'eau SRM - Période ${mois}`,
      montantHT: montantHT,
      tva: tva,
      montant: montantTTC,
      devise: 'MAD',
      lignes: lines.length > 0 ? lines.map((l, i) => ({
        id: i + 1,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        totalHT: l.totalLigne
      })) : [{
        id: 1,
        designation: `Volume Consommé ${consommation} m³`,
        quantite: consommation,
        prixUnitaire: consommation > 0 ? (montantHT / consommation) : 0,
        totalHT: montantHT
      }],
      allocation: 'general',
      societe: clientNom,
      origine: 'eau',
      type: 'achat',
      iceClient: iceClient
    };

    if (existingIdx !== -1) {
      App.data.factures[existingIdx] = factureEntry;
    } else {
      App.data.factures.push(factureEntry);
    }

    App.saveData('factures', factureEntry);
    App.saveData();
    App.toast('Données Eau & Assainissement SRM enregistrées', 'success');
    this.render();
  },

  applyAIEauData(data) {
    if (!data) return;
    
    let period = data.periode || this.selectedPeriod;
    if (period.includes('/')) {
      const parts = period.split('/');
      if (parts.length >= 2) {
        period = `${parts[1]}-${parts[0].padStart(2, '0')}`;
      }
    }

    this.pendingWaterAIData = data;

    let linesSummaryHTML = '';
    if (data.lignes && data.lignes.length > 0) {
      linesSummaryHTML = `
        <div style="margin-top:16px;">
          <h4 style="font-size:0.85rem; font-weight:700; color:#0ea5e9; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Détail des Tranches Détectées</h4>
          <div class="table-container" style="max-height: 200px; overflow-y: auto;">
            <table class="table" style="font-size:0.8rem; background:rgba(0,0,0,0.25); border-radius:8px;">
              <thead>
                <tr>
                  <th>Tranche / Rubrique</th>
                  <th class="td-right">Vol (m³)</th>
                  <th class="td-right">P.U.</th>
                  <th class="td-right">Total (DH)</th>
                </tr>
              </thead>
              <tbody>
                ${data.lignes.map(line => `
                  <tr>
                    <td style="color:#e2e8f0; font-weight:500;">${line.designation}</td>
                    <td class="td-right">${line.quantite || 0}</td>
                    <td class="td-right">${App.formatNumber(line.prixUnitaire || 0, 2)}</td>
                    <td class="td-right td-bold" style="color:#0ea5e9;">${App.formatNumber(line.totalLigne || 0, 2)} DH</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    App.showModal("💧 Facture Eau SRM (Analyse IA)", `
      <div style="margin-bottom:16px; padding:12px; background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.2); border-radius:8px; font-size:0.82rem; color:#e2e8f0; line-height:1.4;">
        <strong style="color:#0ea5e9;">Extraction réussie !</strong> Veuillez valider les détails extraits de la facture d'eau SRM Souss Massa avant de l'enregistrer dans les calculs et le tableau de bord.
      </div>
      <div class="form-grid" style="grid-template-columns: 1fr 1fr; max-height:400px; overflow-y:auto; padding-right:8px; gap:12px;">
        <div class="form-group"><label class="form-label">Mois Facturation</label><input type="month" id="ai_wMois" value="${period}" class="form-input"></div>
        <div class="form-group"><label class="form-label">Date Émission</label><input type="date" id="ai_wDate" value="${data.dateFacture || ''}" class="form-input"></div>
        <div class="form-group"><label class="form-label">N° Facture</label><input type="text" id="ai_wNo" value="${data.factureNo || ''}" class="form-input"></div>
        <div class="form-group"><label class="form-label">N° Police</label><input type="text" id="ai_wPolice" value="${data.policeNo || ''}" class="form-input"></div>
        <div class="form-group" style="grid-column: span 2;"><label class="form-label">Référence SRM</label><input type="text" id="ai_wRef" value="${data.reference || ''}" class="form-input"></div>
        <div class="form-group"><label class="form-label">Index Ancien (m³)</label><input type="number" id="ai_wAnc" value="${data.indexAncien || 0}" oninput="Energie.calcWaterAIModalVolume()" class="form-input"></div>
        <div class="form-group"><label class="form-label">Index Nouveau (m³)</label><input type="number" id="ai_wNouv" value="${data.indexNouveau || 0}" oninput="Energie.calcWaterAIModalVolume()" class="form-input"></div>
        <div class="form-group" style="grid-column: span 2;"><label class="form-label">Volume Consommé (m³)</label><input type="number" id="ai_wConso" value="${data.consommation || 0}" readonly style="background:rgba(14, 165, 233, 0.05); color:#0ea5e9; font-weight:700;" class="form-input"></div>
        <div class="form-group"><label class="form-label">Montant HT (DH)</label><input type="number" step="0.01" id="ai_wHT" value="${data.montantHT || 0}" class="form-input"></div>
        <div class="form-group"><label class="form-label">TVA (DH)</label><input type="number" step="0.01" id="ai_wTva" value="${data.tva || 0}" class="form-input"></div>
        <div class="form-group"><label class="form-label">Timbre (DH)</label><input type="number" step="0.01" id="ai_wTimbre" value="${data.timbre || 0}" class="form-input"></div>
        <div class="form-group"><label class="form-label">Net à Payer TTC (DH)</label><input type="number" step="0.01" id="ai_wTTC" value="${data.montantTTC || 0}" style="color:#ef4444; font-weight:700;" class="form-input"></div>
      </div>
      ${linesSummaryHTML}
    `, `
      <button class="btn" style="background:#0ea5e9; box-shadow:0 4px 12px rgba(14,165,233,0.3); border:none; font-weight:700; color:white;" onclick="Energie.saveAIEau()">Valider et Enregistrer</button>
    `);
  },

  calcWaterAIModalVolume() {
    const anc = parseFloat(document.getElementById('ai_wAnc')?.value) || 0;
    const nouv = parseFloat(document.getElementById('ai_wNouv')?.value) || 0;
    const diff = Math.max(0, nouv - anc);
    const inputConso = document.getElementById('ai_wConso');
    if (inputConso) {
      inputConso.value = diff;
    }
  },

  saveAIEau() {
    const mois = document.getElementById('ai_wMois').value;
    const indexAncien = parseFloat(document.getElementById('ai_wAnc').value) || 0;
    const indexNouveau = parseFloat(document.getElementById('ai_wNouv').value) || 0;
    const consommation = parseFloat(document.getElementById('ai_wConso').value) || 0;
    const montantHT = parseFloat(document.getElementById('ai_wHT').value) || 0;
    const tva = parseFloat(document.getElementById('ai_wTva').value) || 0;
    const timbre = parseFloat(document.getElementById('ai_wTimbre').value) || 0;
    const montantTTC = parseFloat(document.getElementById('ai_wTTC').value) || 0;

    const factureNo = document.getElementById('ai_wNo').value;
    const policeNo = document.getElementById('ai_wPolice').value;
    const reference = document.getElementById('ai_wRef').value;
    const dateFacture = document.getElementById('ai_wDate').value || `${mois}-27`;

    const originalData = this.pendingWaterAIData || {};
    const lines = originalData.lignes || [];

    const wData = {
      mois,
      indexAncien,
      indexNouveau,
      consommation,
      montantHT,
      tva,
      timbre,
      montantTTC,
      factureNo,
      policeNo,
      reference,
      dateFacture,
      clientNom: originalData.clientNom || 'STE FISH AND FOOD PROCESS',
      iceClient: originalData.iceClient || '003047045000044',
      lignes: lines
    };

    if (!App.data.energieMensuelle) App.data.energieMensuelle = {};
    if (!App.data.energieMensuelle.eauMonths) App.data.energieMensuelle.eauMonths = {};
    App.data.energieMensuelle.eauMonths[mois] = wData;

    App.data.factures = App.data.factures || [];
    let existingIdx = App.data.factures.findIndex(f => f.origine === 'eau' && f.date.substring(0, 7) === mois);
    if (existingIdx === -1 && factureNo) {
      existingIdx = App.data.factures.findIndex(f => f.numero === factureNo);
    }

    const factureEntry = {
      id: existingIdx !== -1 ? App.data.factures[existingIdx].id : App.nextId(App.data.factures),
      date: dateFacture || `${mois}-28`,
      dateEcheance: dateFacture ? new Date(new Date(dateFacture).getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : `${mois}-28`,
      fournisseur: 'SRM SOUSS MASSA',
      numero: factureNo,
      etatPaiement: existingIdx !== -1 ? App.data.factures[existingIdx].etatPaiement : 'non_paye',
      motif: `Facture d'eau SRM - Période ${mois}`,
      montantHT: montantHT,
      tva: tva,
      montant: montantTTC,
      devise: 'MAD',
      lignes: lines.length > 0 ? lines.map((l, i) => ({
        id: i + 1,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        totalHT: l.totalLigne
      })) : [{
        id: 1,
        designation: `Volume Consommé ${consommation} m³`,
        quantite: consommation,
        prixUnitaire: consommation > 0 ? (montantHT / consommation) : 0,
        totalHT: montantHT
      }],
      allocation: 'general',
      societe: originalData.clientNom || 'STE FISH AND FOOD PROCESS',
      origine: 'eau',
      type: 'achat',
      iceClient: originalData.iceClient || '003047045000044'
    };

    if (existingIdx !== -1) {
      App.data.factures[existingIdx] = factureEntry;
    } else {
      App.data.factures.push(factureEntry);
    }

    App.saveData('factures', factureEntry);
    App.saveData();
    App.closeModal();
    App.toast("Facture d'Eau SRM (IA) enregistrée", "success");
    
    const parts = mois.split('-');
    this.selectedYear = parseInt(parts[0]);
    this.selectedMonth = parseInt(parts[1]) - 1;
    this.updatePeriodISO();
    this.render();
  }
};
