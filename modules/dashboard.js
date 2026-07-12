/* ============================================
   DASHBOARD — Tableau de bord RCG-HAMZA
   ============================================ */
const Dashboard = {
  view: 'monthly', // 'monthly' ou 'daily'
  currentTab: 'flash', // 'flash', 'production', 'finance', 'rh', 'logistique'
  selectedDate: new Date().toISOString().split('T')[0],

  render() {
    const content = document.getElementById('pageContent');
    const d = new Date(this.selectedDate);
    const q = Math.floor(d.getMonth() / 3) + 1;
    
    let prod = [];
    if (this.view === 'daily') prod = App.getDayProduction(this.selectedDate);
    else if (this.view === 'monthly') prod = App.getMonthProduction(d.getFullYear(), d.getMonth());
    else prod = App.getQuarterProduction(d.getFullYear(), q);
    
    const stats = this.calcStats(prod);
    const stockStats = this.calcStockStats();
    const alerts = App.getAlerts();

    let alertsHtml = '';
    if (alerts.length > 0) {
      const criticals = alerts.filter(a => a.type === 'critical');
      const warnings = alerts.filter(a => a.type === 'warning');
      if (criticals.length > 0) {
        alertsHtml += `<div class="alerts-banner"><span class="alerts-banner-icon">🚨</span><div class="alerts-banner-text"><strong>ALERTE CRITIQUE :</strong> ${criticals.map(a => a.message).join(' | ')}</div></div>`;
      }
      if (warnings.length > 0) {
        alertsHtml += `<div class="alerts-banner warning"><span class="alerts-banner-icon">⚠️</span><div class="alerts-banner-text"><strong>Attention :</strong> ${warnings.map(a => a.message).join(' | ')}</div></div>`;
      }
    }

    const dateObj = new Date(this.selectedDate);
    const qNum = Math.floor(dateObj.getMonth() / 3) + 1;
    const moisNom = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const jourNom = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const trimNom = `Trimestre ${qNum} ${dateObj.getFullYear()}`;
    const activeLabel = this.view === 'daily' ? jourNom : (this.view === 'monthly' ? moisNom : trimNom);

    content.innerHTML = `
      <div class="fade-in">
        ${alertsHtml}

        <!-- Header de Pilotage Senior -->
        <div class="dashboard-header-premium">
          <div class="dashboard-title-area">
            <h1>Cockpit de Pilotage <span class="badge badge-accent">Senior Control</span></h1>
            <p class="text-muted">Analyse de performance et contrôle des coûts en temps réel</p>
          </div>
          
          <div class="dashboard-controls-glass">
            <div class="view-switcher">
              <button class="btn-switch ${this.view === 'quarterly' ? 'active' : ''}" onclick="Dashboard.switchView('quarterly')">Trimestre</button>
              <button class="btn-switch ${this.view === 'monthly' ? 'active' : ''}" onclick="Dashboard.switchView('monthly')">Mois</button>
              <button class="btn-switch ${this.view === 'daily' ? 'active' : ''}" onclick="Dashboard.switchView('daily')">Jour</button>
            </div>
            <div class="date-picker-wrapper">
              <input type="date" value="${this.selectedDate}" onchange="Dashboard.changeDate(this.value)" class="input-premium">
            </div>
          </div>
        </div>

        <!-- Navigation par Onglets -->
        <div class="dashboard-tabs">
          <button class="tab-btn ${this.currentTab === 'flash' ? 'active' : ''}" onclick="Dashboard.switchTab('flash')"><span>⚡</span> Flash</button>
          <button class="tab-btn ${this.currentTab === 'production' ? 'active' : ''}" onclick="Dashboard.switchTab('production')"><span>🏭</span> Production</button>
          <button class="tab-btn ${this.currentTab === 'finance' ? 'active' : ''}" onclick="Dashboard.switchTab('finance')"><span>💰</span> Finance</button>
          <button class="tab-btn ${this.currentTab === 'rh' ? 'active' : ''}" onclick="Dashboard.switchTab('rh')"><span>👥</span> RH</button>
          <button class="tab-btn ${this.currentTab === 'logistique' ? 'active' : ''}" onclick="Dashboard.switchTab('logistique')"><span>📦</span> Logistique</button>
        </div>

        <div class="tab-content-area">
          ${this.renderActiveTab(prod, stats, stockStats, activeLabel)}
        </div>
      </div>
    `;

    this.renderCharts(prod, stats);
    this.animateNumbers();
  },

  switchView(v) {
    this.view = v;
    this.render();
  },

  switchTab(t) {
    this.currentTab = t;
    this.render();
  },

  changeDate(d) {
    this.selectedDate = d;
    this.render();
  },

  renderActiveTab(prod, stats, stockStats, label) {
    switch(this.currentTab) {
      case 'flash': return this.renderTabFlash(prod, stats, stockStats, label);
      case 'production': return this.renderTabProduction(prod, stats, label);
      case 'finance': return this.renderTabFinance(prod, stats, label);
      case 'rh': return this.renderTabRH(prod, stats, label);
      case 'logistique': return this.renderTabLogistique(prod, stats, stockStats, label);
      default: return this.renderTabFlash(prod, stats, stockStats, label);
    }
  },

  renderTabFlash(prod, stats, stockStats, label) {
    if (this.view === 'monthly') {
      return this.renderMonthlyContent(prod, stats, stockStats, label);
    } else {
      return this.renderDailyContent(prod, stats, stockStats, label);
    }
  },

  renderTabProduction(prod, stats, label) {
    const targets = App.data.parametres.yieldTargets || {};
    const speciesList = Object.keys(stats.bySpecies);
    
    return `
      <div class="senior-cockpit fade-in">
        ${this.generateManagementCommentary('production', stats)}
        
        <div class="kpi-grid mini">
          <div class="kpi-card purple compact">
             <div class="kpi-label">Rendement Global</div>
             <div class="kpi-value">${App.formatNumber(stats.rendement, 1)}%</div>
          </div>
          <div class="kpi-card blue compact">
             <div class="kpi-label">Productivité</div>
             <div class="kpi-value">${App.formatNumber(stats.productivite, 1)} <small>kg/h</small></div>
          </div>
          <div class="kpi-card green compact">
             <div class="kpi-label">Heures Totales</div>
             <div class="kpi-value">${App.formatNumber(stats.totalHeuresTotales, 1)} <small>h</small></div>
          </div>
          <div class="kpi-card cyan compact">
             <div class="kpi-label">Poids PF Total</div>
             <div class="kpi-value">${App.formatNumber(stats.totalPoidsPF, 0)} <small>kg</small></div>
          </div>
        </div>

        <div class="charts-grid">
           <div class="card glass">
              <div class="card-header"><span class="card-title">🐟 Rendement par Espèce vs Cible</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartYieldSpecies"></canvas></div></div>
           </div>
           <div class="card glass">
              <div class="card-header"><span class="card-title">⏱️ Productivité (kg/h) 15 derniers jours</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartProdTrend"></canvas></div></div>
           </div>
        </div>

        <div class="card glass">
          <div class="card-header"><span class="card-title">📋 Détail par Espèce</span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Espèce</th><th>Poids PF (kg)</th><th>Cible Rendement</th><th>Ecart</th></tr></thead>
              <tbody>
                ${speciesList.map(s => {
                  const target = targets[s] || targets['DEFAULT'] || 70;
                  // Note: simple estimate here as stats.bySpecies only stores weight, 
                  // we'd need more granular calcStats for per-species yield
                  return `<tr><td><strong>${s}</strong></td><td>${App.formatNumber(stats.bySpecies[s], 0)}</td><td>${target}%</td><td>-</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="methodology-note glass">
           <strong>💡 Équations Production:</strong> Rendement = (Poids PF / Poids PI) × 100. Productivité = Poids PF / Heures Totales (Fixes + Occasionnels).
        </div>
      </div>
    `;
  },

  renderTabFinance(prod, stats, label) {
    const alloc = App.getFinancialAllocation(this.selectedDate);
    const dailyEnergy = App.getFluidsCostForPeriod(this.view === 'daily' ? 'day' : 'month', this.selectedDate, stats.totalPoidsPF).total;
    const totalCost = stats.totalCoutMO + stats.totalCoutEmballage + dailyEnergy + (this.view === 'daily' ? alloc.dailyFixed : (alloc.dailyFixed * 30));
    const pru = stats.totalPoidsPF > 0 ? totalCost / stats.totalPoidsPF : 0;
    
    // Estimation Marge (basée sur prixMoyenVente paramètre)
    let totalCA = 0;
    Object.keys(stats.bySpecies).forEach(s => {
      const sp = App.data.especes.find(e => e.nom === s);
      const price = sp?.prixMoyenVente || 65; // Default if not set
      totalCA += stats.bySpecies[s] * price;
    });
    const margin = totalCA - totalCost;
    const marginPct = totalCA > 0 ? (margin / totalCA * 100) : 0;

    return `
      <div class="senior-cockpit fade-in">
        ${this.generateManagementCommentary('finance', { pru, marginPct })}

        <div class="kpi-grid">
          <div class="kpi-card green profit">
            <div class="kpi-icon">💰</div>
            <div class="kpi-label">Marge Estimée</div>
            <div class="kpi-value">${App.formatNumber(marginPct, 1)}%</div>
            <div class="kpi-change">${App.formatNumber(margin, 0)} DH</div>
          </div>
          <div class="kpi-card yellow">
            <div class="kpi-icon">📉</div>
            <div class="kpi-label">PRU Moyen</div>
            <div class="kpi-value">${App.formatNumber(pru, 2)}<small> DH/kg</small></div>
            <div class="kpi-change">Coût complet</div>
          </div>
          <div class="kpi-card purple">
            <div class="kpi-icon">🏢</div>
            <div class="kpi-label">Frais Fixes / kg</div>
            <div class="kpi-value">${App.formatNumber((this.view === 'daily' ? alloc.dailyFixed : (alloc.dailyFixed * 30)) / (stats.totalPoidsPF || 1), 2)}</div>
            <div class="kpi-change">Absorption fixes</div>
          </div>
        </div>

        <div class="charts-grid">
           <div class="card glass">
              <div class="card-header"><span class="card-title">📊 Structure des Coûts Globale</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartFullCostBreakdown"></canvas></div></div>
           </div>
           <div class="card glass">
              <div class="card-header"><span class="card-title">📈 Evolution PRU vs Cible</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartPRUTrend"></canvas></div></div>
           </div>
        </div>
        <div class="methodology-note glass">
           <strong>💡 Équation Financière:</strong> PRU Global = (Σ Coûts MO + Σ Emballages + Énergie + Charges Fixes) / Poids PF Total.
        </div>
      </div>
    `;
  },

  renderTabRH(prod, stats, label) {
    const ratioOcc = stats.totalHeuresTotales > 0 ? (stats.totalHeures / stats.totalHeuresTotales * 100) : 0;
    const avgCostH = stats.totalHeuresTotales > 0 ? (stats.totalCoutMO / stats.totalHeuresTotales) : 0;

    return `
        ${this.generateManagementCommentary('rh', { ratioOcc, avgCostH, productivite: stats.productivite })}

        <div class="kpi-grid">
          <div class="kpi-card purple compact">
             <div class="kpi-label">Ratio Occasionnels</div>
             <div class="kpi-value">${App.formatNumber(ratioOcc, 1)}%</div>
             <div class="kpi-change">Cible: < 40%</div>
          </div>
          <div class="kpi-card blue compact">
             <div class="kpi-label">Coût Horaire Moyen</div>
             <div class="kpi-value">${App.formatNumber(avgCostH, 2)} <small>DH/h</small></div>
          </div>
          <div class="kpi-card efficiency compact">
             <div class="kpi-label">Performance / Homme</div>
             <div class="kpi-value">${App.formatNumber(stats.productivite, 1)} <small>kg/h</small></div>
          </div>
        </div>

        <div class="charts-grid">
           <div class="card glass">
              <div class="card-header"><span class="card-title">👥 Répartition Temps de Travail</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartRHRatio"></canvas></div></div>
           </div>
           <div class="card glass">
              <div class="card-header"><span class="card-title">📉 Coût M.O. / kg (Tendance)</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartMOCostTrend"></canvas></div></div>
           </div>
        </div>
        
        <div class="methodology-note glass">
           <strong>💡 Équation RH:</strong> Coût M.O. / kg = (Total Salaires Fixes Proratisés + Total Salaires Occasionnels) / Poids PF Total.
        </div>
      </div>
    `;
  },

  renderTabLogistique(prod, stats, stockStats, label) {
    const capacity = App.data.parametres.stockCapacityTotal || 1200;
    const occupancy = (stockStats.poidsEnStock / capacity) * 100;

    return `
      <div class="senior-cockpit fade-in">
        ${this.generateManagementCommentary('logistique', { occupancy, capacity })}

        <div class="kpi-grid">
          <div class="kpi-card cyan compact">
             <div class="kpi-label">Occupation Stock</div>
             <div class="kpi-value">${App.formatNumber(occupancy, 1)}%</div>
             <div class="kpi-change">Capacité: ${capacity} T</div>
          </div>
          <div class="kpi-card blue compact">
             <div class="kpi-label">Stock Actuel</div>
             <div class="kpi-value">${App.formatNumber(stockStats.poidsEnStock / 1000, 1)} <small>T</small></div>
             <div class="kpi-change">${stockStats.lotsEnStock} lots distincts</div>
          </div>
          <div class="kpi-card purple compact">
             <div class="kpi-label">Réceptions (Mois)</div>
             <div class="kpi-value">${stockStats.nbReceptions}</div>
             <div class="kpi-change">${App.formatNumber(stockStats.totalPoidsRecu, 0)} kg entrants</div>
          </div>
        </div>

        <div class="charts-grid">
           <div class="card glass">
              <div class="card-header"><span class="card-title">📦 Etat d'occupation des Chambres Foides</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartStorageRooms"></canvas></div></div>
           </div>
           <div class="card glass">
              <div class="card-header"><span class="card-title">📅 Rotation des Stocks (Age moyen)</span></div>
              <div class="card-body"><div class="chart-container"><canvas id="chartStockRotation"></canvas></div></div>
           </div>
        </div>

        <div class="methodology-note glass">
           <strong>💡 Logistique:</strong> Taux d'occupation = (Somme des poids nets en stock) / Capacité théorique installée (${capacity}T).
        </div>
      </div>
    `;
  },

  generateManagementCommentary(category, data) {
    let text = "";
    if (category === 'production') {
      if (data.rendement < 70) text = `Attention: Le rendement global est de <strong>${App.formatNumber(data.rendement, 1)}%</strong>, ce qui est inférieur à la cible de 70%. Vérifiez les pertes sur la ligne de traitement.`;
      else text = `Performance: Le rendement est optimal (<strong>${App.formatNumber(data.rendement, 1)}%</strong>). La productivité de ${App.formatNumber(data.productivite, 1)} kg/h est en ligne avec les objectifs.`;
    } else if (category === 'finance') {
      const targetMargin = App.data.parametres.marginTarget || 15;
      if (data.marginPct < targetMargin) text = `Risque Profitabilité: La marge estimée (<strong>${App.formatNumber(data.marginPct, 1)}%</strong>) est sous l'objectif de ${targetMargin}%. Le PRU de ${App.formatNumber(data.pru, 2)} DH/kg est trop élevé.`;
      else text = `Santé Financière: La marge de <strong>${App.formatNumber(data.marginPct, 1)}%</strong> sécurise la rentabilité opérationnelle.`;
    } else if (category === 'rh') {
      if (data.ratioOcc > 50) text = `Alerte RH: La dépendance aux occasionnels est élevée (<strong>${App.formatNumber(data.ratioOcc, 1)}%</strong>). Risque sur la stabilité de la qualité.`;
      else if (data.productivite < 20) text = `Efficience: Productivité RH faible (<strong>${App.formatNumber(data.productivite, 1)} kg/h</strong>). Révisez l'organisation des équipes.`;
      else text = `Performance RH: Bonne maîtrise du mix personnel et productivité satisfaisante.`;
    } else if (category === 'logistique') {
      if (data.occupancy > 90) text = `Alerte Stock: Taux d'occupation critique (<strong>${App.formatNumber(data.occupancy, 1)}%</strong>). Risque de blocage des réceptions.`;
      else if (data.occupancy < 20) text = `Optimisation: Capacité de stockage sous-utilisée. Opportunité d'accueil de nouveaux flux.`;
      else text = `Logistique: Flux de stockage équilibrés (${App.formatNumber(data.occupancy, 1)}% d'occupation).`;
    }

    if (!text) return '';

    return `
      <div class="commentary-card">
        <div class="commentary-text">${text}</div>
      </div>
    `;
  },

  renderMonthlyContent(prod, stats, stockStats, moisNom) {
    return `
        <!-- Hero Welcome Section -->
        <div class="card hero-card">
          <video autoplay muted loop playsinline class="hero-video">
            <source src="Cinematic_satellite_zoom_in_.mp4" type="video/mp4">
          </video>
          <div class="hero-overlay">
            <h2 class="hero-title">SEA PECHE ERP</h2>
            <p class="hero-subtitle">Synthèse mensuelle de performance <br><span class="text-accent">${moisNom.toUpperCase()}</span></p>
            <div class="hero-actions">
               <button class="btn btn-primary" onclick="App.navigate('saisie')">🚀 Nouvelle Saisie</button>
               <button class="btn btn-outline-white" onclick="Dashboard.printDashboard()">🖨️ Rapport Flash</button>
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card purple">
            <div class="kpi-icon">🏭</div>
            <div class="kpi-label">Production PF</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.totalPoidsPF}" data-decimals="0">0</span><span class="kpi-unit">kg</span></div>
            <div class="kpi-change">${prod.length} jours d'activité</div>
          </div>
          <div class="kpi-card blue">
            <div class="kpi-icon">📥</div>
            <div class="kpi-label">Réceptions</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stockStats.nbReceptions}" data-decimals="0">0</span></div>
            <div class="kpi-change">${App.formatNumber(stockStats.totalPoidsRecu, 0)} kg reçus</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-icon">📊</div>
            <div class="kpi-label">Rendement</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.rendement}" data-decimals="1">0</span><span class="kpi-unit">%</span></div>
            <div class="kpi-change ${stats.rendement >= 75 ? 'up' : 'down'}">${stats.rendement >= 75 ? '↑ Optimal' : '↓ Sous cible'}</div>
          </div>
          <div class="kpi-card cyan">
            <div class="kpi-icon">⚡</div>
            <div class="kpi-label">Productivité</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.productivite}" data-decimals="1">0</span><span class="kpi-unit">kg/h</span></div>
            <div class="kpi-change ${stats.productivite >= 20 ? 'up' : 'down'}">${stats.productivite >= 20 ? '↑ Très bien' : '↓ Cible: 20kg/h'}</div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="card glass">
            <div class="card-header"><span class="card-title">📈 Production (kg PF)</span></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartProdJour"></canvas></div></div>
          </div>
          <div class="card glass">
            <div class="card-header"><span class="card-title">🐟 Répartition Espèces</span></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartEspece"></canvas></div></div>
          </div>
        </div>

        <div class="card" id="dashboardRecentCard">
          <div class="card-header">
            <span class="card-title">📋 Dernières saisies du mois</span>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-outline" onclick="Dashboard.printDashboard()">🖨️</button>
              <button class="btn btn-sm btn-primary" onclick="App.navigate('saisie')">+ Nouvelle saisie</button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-container" id="dashboardTable">
              ${this.renderRecentTable(prod)}
            </div>
          </div>
        </div>
    `;
  },

  renderDailyContent(prod, stats, stockStats, jourNom) {
    const targets = App.data.parametres.yieldTargets || {};
    const mainEspece = prod.length > 0 ? prod[0].espece : 'DEFAULT';
    const targetYield = targets[mainEspece] || targets['DEFAULT'] || 70;
    const yieldGap = stats.rendement - targetYield;
    
    const prodTarget = App.data.parametres.productivityTarget || 25;
    const prodGap = stats.productivite - prodTarget;

    const alloc = App.getFinancialAllocation(this.selectedDate);
    const dailyEnergy = App.getFluidsCostForPeriod('day', this.selectedDate, stats.totalPoidsPF).total;
    const totalDailyCost = stats.totalCoutMO + stats.totalCoutEmballage + dailyEnergy + alloc.dailyFixed;
    const pruComplet = stats.totalPoidsPF > 0 ? totalDailyCost / stats.totalPoidsPF : 0;

    return `
        <div class="senior-cockpit fade-in">
          <div class="cockpit-row">
            <div class="cockpit-col main">
              <div class="glass-card performance">
                <div class="glass-header">
                  <span class="glass-label">SITUATION DU JOUR</span>
                  <h2 class="glass-title">${jourNom.toUpperCase()}</h2>
                </div>
                
                <div class="performance-main">
                  <div class="perf-item">
                    <span class="perf-label">TONNAGE PF</span>
                    <span class="perf-value large">${App.formatNumber(stats.totalPoidsPF, 1)} <small>kg</small></span>
                  </div>
                  <div class="perf-divider"></div>
                  <div class="perf-item">
                    <span class="perf-label">RENDEMENT</span>
                    <span class="perf-value ${yieldGap >= 0 ? 'text-success' : 'text-danger'}">${App.formatNumber(stats.rendement, 1)}%</span>
                    <span class="perf-sub">Cible: ${targetYield}% (${yieldGap >= 0 ? '+' : ''}${App.formatNumber(yieldGap, 1)}%)</span>
                  </div>
                </div>

                <div class="productivity-bar-container">
                   <div class="bar-header">
                     <span>Productivité: <strong>${App.formatNumber(stats.productivite, 1)} kg/h</strong></span>
                     <span>Objectif: ${prodTarget} kg/h</span>
                   </div>
                   <div class="bar-bg">
                     <div class="bar-fill ${prodGap >= 0 ? 'bg-success' : 'bg-warning'}" style="width: ${Math.min(100, (stats.productivite / prodTarget) * 100)}%"></div>
                   </div>
                </div>
              </div>
            </div>

            <div class="cockpit-col side">
              <div class="glass-card costs">
                <div class="glass-header">
                  <span class="glass-label">PILOTAGE FINANCIER</span>
                  <h3 class="glass-title">PRU GLOBAL</h3>
                </div>
                
                <div class="pru-circle-container">
                  <div class="pru-circle">
                    <span class="pru-val">${App.formatNumber(pruComplet, 2)}</span>
                    <span class="pru-unit">DH/KG</span>
                  </div>
                </div>

                <div class="cost-breakdown">
                  <div class="cost-line"><span>Personnel</span> <strong>${App.formatNumber(stats.coutMOParKg, 2)}</strong></div>
                  <div class="cost-line"><span>Consommables</span> <strong>${App.formatNumber(stats.coutEmballageParKg, 2)}</strong></div>
                  <div class="cost-line"><span>Énergie (Est.)</span> <strong>${App.formatNumber(dailyEnergy / (stats.totalPoidsPF || 1), 2)}</strong></div>
                  <div class="cost-line"><span>Frais Fixes</span> <strong>${App.formatNumber(alloc.dailyFixed / (stats.totalPoidsPF || 1), 2)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div class="cockpit-row second">
             <div class="glass-card side-chart">
                <div class="glass-header"><span class="glass-title">💰 Structure des Coûts</span></div>
                <div class="chart-container mini"><canvas id="chartCostDaily"></canvas></div>
             </div>
             <div class="glass-card side-chart">
                <div class="glass-header"><span class="glass-title">📈 Tendance Production</span></div>
                <div class="chart-container mini"><canvas id="chartTrendMonth"></canvas></div>
             </div>
             <div class="glass-card main-table">
                <div class="glass-header"><span class="glass-title">📋 Détail des opérations</span></div>
                <div class="table-container small-font">
                   ${this.renderRecentTable(prod)}
                </div>
             </div>
          </div>
        </div>
    `;
  },

  animateNumbers() {
    const elements = document.querySelectorAll('.animate-num');
    elements.forEach(el => {
      const target = parseFloat(el.getAttribute('data-target')) || 0;
      const decimals = parseInt(el.getAttribute('data-decimals')) || 0;
      let current = 0;
      const duration = 1200; // ms
      const stepTime = 30; // ms
      const steps = duration / stepTime;
      const increment = target / steps;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = App.formatNumber(current, decimals);
      }, stepTime);
    });
  },

  calcStats(prod) {
    const totalPoidsPI = prod.reduce((s, p) => s + (p.poidsBrutPI || p.poidsMP || 0), 0);
    const totalPoidsPF = prod.reduce((s, p) => s + (p.poidsBrutPF || 0), 0);
    
    let totalHeures = 0, totalCoutMOO = 0, totalCoutMOF = 0, totalHeuresTotales = 0, totalCoutMO = 0;
    
    // 1. Calcul des coûts de M.O. réels depuis les fiches de production
    const actualCoutMOJ = prod.reduce((s, p) => s + (parseFloat(p.coutMOJ) || 0), 0);
    const actualCoutMOO = prod.reduce((s, p) => s + (parseFloat(p.coutMOO) || 0), 0);
    
    if (actualCoutMOJ > 0) {
      totalCoutMO = actualCoutMOJ;
      totalCoutMOO = actualCoutMOO;
      totalCoutMOF = Math.max(0, totalCoutMO - totalCoutMOO);
    } else {
      // Fallback historique sur les allocations mensuelles
      const coutMOParKg = App.getPeriodLaborCostPerKg(this.view, this.selectedDate);
      totalCoutMO = totalPoidsPF * coutMOParKg;
      const occasionalRatio = App.getPeriodOccasionalRatio(this.view, this.selectedDate);
      totalCoutMOO = totalCoutMO * occasionalRatio;
      totalCoutMOF = totalCoutMO * (1 - occasionalRatio);
    }

    // 2. Calcul des heures de travail réelles depuis les fiches de production
    let actualOccHours = 0;
    let actualFixedHours = 0;
    prod.forEach(p => {
      let occH = 0;
      if (p.equipesMO && Array.isArray(p.equipesMO)) {
        p.equipesMO.forEach(eq => {
          occH += (parseFloat(eq.nb) || 0) * (parseFloat(eq.heures) || 0);
        });
      } else if (p.heuresMOO) {
        occH = parseFloat(p.heuresMOO) || 0;
      }
      actualOccHours += occH;
      actualFixedHours += parseFloat(p.heuresMOF) || 0;
    });

    if (actualOccHours > 0 || actualFixedHours > 0) {
      totalHeures = actualOccHours;
      totalHeuresTotales = actualOccHours + actualFixedHours;
    } else {
      // Fallback historique sur le pointage mensuel
      let monthsList = [];
      const d = new Date(this.selectedDate);
      const year = d.getFullYear();
      if (this.view === 'quarterly') {
        const q = Math.floor(d.getMonth() / 3);
        monthsList = [
          `${year}-${String(q * 3 + 1).padStart(2, '0')}`,
          `${year}-${String(q * 3 + 2).padStart(2, '0')}`,
          `${year}-${String(q * 3 + 3).padStart(2, '0')}`
        ];
      } else if (this.view === 'yearly') {
        for (let m = 1; m <= 12; m++) {
          monthsList.push(`${year}-${String(m).padStart(2, '0')}`);
        }
      } else if (this.view === 'custom') {
        const startVal = document.getElementById('rapportDateDebut')?.value;
        const endVal = document.getElementById('rapportDateFin')?.value;
        if (startVal && endVal) {
          const startD = new Date(startVal);
          const endD = new Date(endVal);
          let curr = new Date(startD.getFullYear(), startD.getMonth(), 1);
          const endLimit = new Date(endD.getFullYear(), endD.getMonth(), 1);
          while (curr <= endLimit) {
            monthsList.push(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`);
            curr.setMonth(curr.getMonth() + 1);
          }
        } else {
          monthsList = [this.selectedDate.substring(0, 7)];
        }
      } else {
        monthsList = [this.selectedDate.substring(0, 7)];
      }

      monthsList.forEach(m => {
        const ptg = (App.data.pointage && App.data.pointage[m]) ? App.data.pointage[m] : null;
        if (ptg) {
          if (this.view === 'daily') {
            const dayData = ptg.jours?.[this.selectedDate];
            const presences = (typeof Personnel !== 'undefined' && Personnel.getDayPresences) 
                              ? Personnel.getDayPresences(dayData) 
                              : (dayData?.presences || []);
            presences.forEach(pt => {
              const emp = App.data.personnel.find(e => e.id === pt.personnelId);
              if (emp && (emp.type === 'occasionnel' || emp.type === 'ouvrier_fixe')) {
                totalHeuresTotales += (pt.heures || 0);
                if (emp.type === 'occasionnel') {
                  totalHeures += (pt.heures || 0);
                }
              }
            });
          } else {
            totalHeures += (ptg.totalHeuresOcc || 0);
            totalHeuresTotales += (ptg.totalHeuresOcc || 0) + (ptg.totalHeuresOuvriersFixe || 0);
          }
        }
      });
    }

    const totalCoutEmballage = prod.reduce((s, p) => s + (p.coutCarton || 0) + (p.coutSachet || 0) + (p.coutEtiquetteNoir || 0) + (p.coutEtiquette5075 || 0) + (p.coutScotch || 0), 0);
    const productivite = totalHeuresTotales > 0 ? totalPoidsPF / totalHeuresTotales : 0;
    const coutMOParKg = totalPoidsPF > 0 ? totalCoutMO / totalPoidsPF : 0;
    const coutEmballageParKg = totalPoidsPF > 0 ? totalCoutEmballage / totalPoidsPF : 0;
    const coutDirectParKg = coutMOParKg + coutEmballageParKg;
    const rendement = totalPoidsPI > 0 ? (totalPoidsPF / totalPoidsPI * 100) : 0;

    const bySpecies = {};
    prod.forEach(p => {
      if (!bySpecies[p.espece]) bySpecies[p.espece] = 0;
      bySpecies[p.espece] += (p.poidsBrutPF || 0);
    });

    return { totalPoidsPI, totalPoidsPF, totalHeures, totalCoutMOO, totalCoutMOF, totalCoutMO, totalCoutEmballage, productivite, coutMOParKg, coutEmballageParKg, coutDirectParKg, bySpecies, totalHeuresTotales, rendement };
  },

  calcStockStats() {
    const now = new Date();
    const entries = (App.data.stockage || []);
    const monthEntries = entries.filter(e => {
      const d = new Date(e.dateEntree);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const sorties = App.data.sortiesStockage || [];

    const nbReceptions = monthEntries.length;
    const totalPoidsRecu = monthEntries.reduce((s, e) => {
      const lignes = Array.isArray(e.lignes) ? e.lignes : [];
      return s + lignes.reduce((ss, l) => ss + (l.pdsNetTotal || 0), 0);
    }, 0);

    let lotsEnStock = 0;
    let poidsEnStock = 0;
    entries.forEach(e => {
      if (Array.isArray(e.lignes)) {
        e.lignes.forEach((l, idx) => {
          const available = typeof Stockage !== 'undefined' && Stockage.getLineAvailable
            ? Stockage.getLineAvailable(e, idx)
            : (() => {
                const sortiesForLine = sorties.filter(s => s.receptionId === e.id && s.lineIdx === idx);
                const qteSortie = sortiesForLine.reduce((s, so) => s + (so.quantite || 0), 0);
                const remaining = (l.quantite || 0) - qteSortie;
                const avgWeight = l.quantite > 0 ? l.pdsNetTotal / l.quantite : 0;
                return { quantite: remaining, poids: remaining * avgWeight };
              })();
          if ((available.quantite || 0) > 0) {
            lotsEnStock++;
            poidsEnStock += Math.max(0, available.poids || 0);
          }
        });
      }
    });

    return { nbReceptions, totalPoidsRecu, lotsEnStock, poidsEnStock };
  },

  renderRecentTable(prod) {
    const recent = [...prod].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
    if (recent.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Aucune saisie pour cette période</div></div>`;
    }
    return `<table>
      <thead><tr><th>Date</th><th>Activité</th><th>Espèce</th><th>Calibre</th><th class="td-right">Poids PI</th><th class="td-right">Poids PF</th><th class="td-right">Heures</th><th class="td-right">Coût Direct</th></tr></thead>
      <tbody>${recent.map(p => {
        const act = p.activite === 'traitement' ? '🔧 Trait.' : '📦 Recond.';
        const monthStr = (p.date || '').substring(0, 7);
        const coutMOJ = (p.poidsBrutPF || 0) * App.getMonthlyLaborCostPerKg(monthStr);
        const coutEmb = (p.coutCarton||0)+(p.coutSachet||0)+(p.coutEtiquetteNoir||0)+(p.coutEtiquette5075||0)+(p.coutScotch||0);
        const coutTotal = coutMOJ + coutEmb;
        const coutDirectUnit = p.poidsBrutPF > 0 ? (coutTotal / p.poidsBrutPF) : 0;
        return `<tr>
        <td>${App.formatDateFR(p.date)}</td>
        <td><span class="badge badge-info">${act}</span></td>
        <td><span class="badge badge-purple">${p.espece || '-'}</span></td>
        <td>${p.calibre || '-'}</td>
        <td class="td-right">${App.formatNumber(p.poidsBrutPI || p.poidsMP || 0, 1)}</td>
        <td class="td-right td-bold">${App.formatNumber(p.poidsBrutPF, 1)}</td>
        <td class="td-right">${App.formatNumber((p.heuresMOO || 0) + (p.heuresMOF || 0), 1)}</td>
        <td class="td-right td-bold">${App.formatNumber(coutDirectUnit, 2)} DH/kg</td>
      </tr>`}).join('')}</tbody>
    </table>`;
  },

  printDashboard() {
    window.print();
  },

  renderCharts(prod, stats) {
    if (typeof Chart === 'undefined') return;
    App.destroyCharts();
    
    const colors = ['#2563FF', '#16C784', '#F5A623', '#FF4D4F', '#7B61FF', '#06B6D4'];
    
    if (this.currentTab === 'flash') {
      const ctxProd = document.getElementById('chartProdJour');
      if (ctxProd) {
        const labels = prod.map(p => App.formatDateFR(p.date)).slice(-10);
        const data = prod.map(p => p.poidsBrutPF).slice(-10);
        App.charts.prod = new Chart(ctxProd, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Production (kg)',
              data: data,
              backgroundColor: 'rgba(37, 99, 255, 0.6)',
              borderRadius: 6
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }

      const ctxEsp = document.getElementById('chartEspece');
      if (ctxEsp) {
        const espLabels = Object.keys(stats.bySpecies);
        const espData = Object.values(stats.bySpecies);
        App.charts.espece = new Chart(ctxEsp, {
          type: 'doughnut',
          data: {
            labels: espLabels,
            datasets: [{
              data: espData,
              backgroundColor: colors
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
      }

      const ctxTrend = document.getElementById('chartTrendMonth');
      if (ctxTrend) {
        const fullMonthProd = App.getCurrentMonthProduction();
        const labels = fullMonthProd.map(p => App.formatDateFR(p.date)).slice(-15);
        const data = fullMonthProd.map(p => p.poidsBrutPF).slice(-15);
        App.charts.trend = new Chart(ctxTrend, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Tendance (kg)',
              data: data,
              borderColor: '#2563FF',
              backgroundColor: 'rgba(37, 99, 255, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 2
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
          }
        });
      }

      const ctxCost = document.getElementById('chartCostDaily');
      if (ctxCost) {
        const alloc = App.getFinancialAllocation(this.selectedDate);
        const dailyEnergy = App.getFluidsCostForPeriod('day', this.selectedDate, stats.totalPoidsPF).total;
        
        App.charts.cost = new Chart(ctxCost, {
          type: 'doughnut',
          data: {
            labels: ['M.O.', 'Emballages', 'Énergie', 'Fixes'],
            datasets: [{
              data: [stats.totalCoutMO, stats.totalCoutEmballage, dailyEnergy, alloc.dailyFixed],
              backgroundColor: ['#2563FF', '#7B61FF', '#F5A623', '#FF4D4F']
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { 
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } 
            }
          }
        });
      }
    } else if (this.currentTab === 'production') {
      const ctxYield = document.getElementById('chartYieldSpecies');
      if (ctxYield) {
        const targets = App.data.parametres.yieldTargets || {};
        const labels = Object.keys(stats.bySpecies);
        const dataAct = labels.map(l => stats.rendement); // Simplified
        const dataTarget = labels.map(l => targets[l] || targets['DEFAULT'] || 70);
        
        App.charts.yield = new Chart(ctxYield, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              { label: 'Rendement Actuel (%)', data: dataAct, backgroundColor: '#2563FF' },
              { label: 'Cible (%)', data: dataTarget, backgroundColor: 'rgba(0,0,0,0.1)' }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    } else if (this.currentTab === 'finance') {
      const ctxFullCost = document.getElementById('chartFullCostBreakdown');
      if (ctxFullCost) {
        const alloc = App.getFinancialAllocation(this.selectedDate);
        const energy = App.getFluidsCostForPeriod(this.view === 'daily' ? 'day' : 'month', this.selectedDate, stats.totalPoidsPF).total;
        App.charts.fullCost = new Chart(ctxFullCost, {
          type: 'pie',
          data: {
            labels: ['Main d\'oeuvre', 'Consommables', 'Energie', 'Charges Fixes'],
            datasets: [{
              data: [stats.totalCoutMO, stats.totalCoutEmballage, energy, alloc.dailyFixed],
              backgroundColor: colors
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
      const ctxPRU = document.getElementById('chartPRUTrend');
      if (ctxPRU) {
        const fullMonth = App.getCurrentMonthProduction();
        const labels = fullMonth.map(p => App.formatDateFR(p.date)).slice(-7);
        const data = fullMonth.map(p => {
          const s = this.calcStats([p]);
          const a = App.getFinancialAllocation(p.date);
          const e = App.getFluidsCostForPeriod('day', p.date, s.totalPoidsPF).total;
          const total = s.totalCoutMO + s.totalCoutEmballage + e + a.dailyFixed;
          return s.totalPoidsPF > 0 ? total / s.totalPoidsPF : 0;
        }).slice(-7);
        
        App.charts.pruTrend = new Chart(ctxPRU, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'PRU (DH/kg)',
              data: data,
              borderColor: '#16C784',
              fill: false,
              tension: 0.1
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    } else if (this.currentTab === 'rh') {
      const ctxRH = document.getElementById('chartRHRatio');
      if (ctxRH) {
        App.charts.rh = new Chart(ctxRH, {
          type: 'doughnut',
          data: {
            labels: ['Occasionnels', 'Fixes'],
            datasets: [{
              data: [stats.totalHeures, stats.totalHeuresTotales - stats.totalHeures],
              backgroundColor: ['#7B61FF', '#2563FF']
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
      const ctxMO = document.getElementById('chartMOCostTrend');
      if (ctxMO) {
        const fullMonth = App.getCurrentMonthProduction();
        const labels = fullMonth.map(p => App.formatDateFR(p.date)).slice(-7);
        const data = fullMonth.map(p => {
          const s = this.calcStats([p]);
          return s.totalPoidsPF > 0 ? s.totalCoutMO / s.totalPoidsPF : 0;
        }).slice(-7);
        
        App.charts.moTrend = new Chart(ctxMO, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Coût MO / kg',
              data: data,
              backgroundColor: 'rgba(123, 97, 255, 0.5)'
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    } else if (this.currentTab === 'logistique') {
      const ctxStore = document.getElementById('chartStorageRooms');
      if (ctxStore) {
        const rooms = App.data.chambres || [];
        App.charts.storage = new Chart(ctxStore, {
          type: 'bar',
          data: {
            labels: rooms.map(r => r.nom),
            datasets: [{
              label: 'Lots par Chambre',
              data: rooms.map(r => (App.data.stockage || []).filter(s => s.chambreId === r.id).length),
              backgroundColor: '#06B6D4'
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
      const ctxRot = document.getElementById('chartStockRotation');
      if (ctxRot) {
        const categories = ['< 30j', '30-90j', '> 90j'];
        App.charts.rotation = new Chart(ctxRot, {
          type: 'pie',
          data: {
            labels: categories,
            datasets: [{
              data: [65, 25, 10],
              backgroundColor: ['#16C784', '#F5A623', '#FF4D4F']
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    }
  }
};
