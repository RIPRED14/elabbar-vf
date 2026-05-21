/* ============================================
   RAPPORTS EXPERTS — Génération automatique
   SEA PECHE / ELABBAR - RCG-HAMZA
   ============================================ */
const Rapports = {
  view: 'monthly',
  selectedDate: new Date().toISOString().split('T')[0],

  render() {
    const content = document.getElementById('pageContent');
    let controlsHtml = '';
    
    if (this.view === 'daily') {
      controlsHtml = `
        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Sélectionner le Jour</label>
          <input type="date" class="input-premium" id="rapportJour" value="${this.selectedDate}" onchange="Rapports.changeDate(this.value)">
        </div>
      `;
    } else if (this.view === 'monthly') {
      const currentMonth = this.selectedDate.substring(0, 7);
      controlsHtml = `
        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Sélectionner le Mois</label>
          <input type="month" class="input-premium" id="rapportMois" value="${currentMonth}">
        </div>
      `;
    } else if (this.view === 'quarterly') {
      const year = new Date(this.selectedDate).getFullYear();
      const currentMonth = new Date(this.selectedDate).getMonth();
      const quarter = Math.floor(currentMonth / 3) + 1;
      
      controlsHtml = `
        <div class="form-group" style="margin: 0; display: flex; gap: 8px;">
          <div>
            <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Année</label>
            <select class="input-premium" id="rapportAnnee">
              <option value="${year}">${year}</option>
              <option value="${year - 1}">${year - 1}</option>
              <option value="${year - 2}">${year - 2}</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Trimestre</label>
            <select class="input-premium" id="rapportTrim">
              <option value="1" ${quarter === 1 ? 'selected' : ''}>T1 (Jan - Mar)</option>
              <option value="2" ${quarter === 2 ? 'selected' : ''}>T2 (Avr - Juin)</option>
              <option value="3" ${quarter === 3 ? 'selected' : ''}>T3 (Juil - Sept)</option>
              <option value="4" ${quarter === 4 ? 'selected' : ''}>T4 (Oct - Déc)</option>
            </select>
          </div>
        </div>
      `;
    } else if (this.view === 'yearly') {
      const year = new Date(this.selectedDate).getFullYear();
      controlsHtml = `
        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Sélectionner l'Année</label>
          <select class="input-premium" id="rapportAnnee">
            <option value="${year}">${year}</option>
            <option value="${year - 1}">${year - 1}</option>
            <option value="${year - 2}">${year - 2}</option>
          </select>
        </div>
      `;
    } else if (this.view === 'custom') {
      const defaultStart = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const defaultEnd = new Date().toISOString().split('T')[0];
      controlsHtml = `
        <div class="form-group" style="margin: 0; display: flex; gap: 8px;">
          <div>
            <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Date Début</label>
            <input type="date" class="input-premium" id="rapportDateDebut" value="${defaultStart}">
          </div>
          <div>
            <label class="form-label" style="margin-bottom: 4px; font-size: 0.75rem;">Date Fin</label>
            <input type="date" class="input-premium" id="rapportDateFin" value="${defaultEnd}">
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="fade-in">
        <div class="dashboard-header-premium">
          <div class="view-switcher">
            <button class="btn-switch ${this.view === 'daily' ? 'active' : ''}" onclick="Rapports.switchView('daily')">Quotidien</button>
            <button class="btn-switch ${this.view === 'monthly' ? 'active' : ''}" onclick="Rapports.switchView('monthly')">Mensuel</button>
            <button class="btn-switch ${this.view === 'quarterly' ? 'active' : ''}" onclick="Rapports.switchView('quarterly')">Trimestriel</button>
            <button class="btn-switch ${this.view === 'yearly' ? 'active' : ''}" onclick="Rapports.switchView('yearly')">Annuel</button>
            <button class="btn-switch ${this.view === 'custom' ? 'active' : ''}" onclick="Rapports.switchView('custom')">Personnalisé</button>
          </div>
          
          <div class="dashboard-controls-glass">
            ${controlsHtml}
            <button class="btn btn-primary" onclick="Rapports.generate()" style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7m9-9-9 9-4-4"/></svg>
              <span>Calculer</span>
            </button>
          </div>
        </div>

        <div id="rapportContent">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">Veuillez lancer le calcul pour générer l'analyse de performance.</div>
          </div>
        </div>
      </div>
    `;
  },

  switchView(v) {
    this.view = v;
    this.render();
  },

  changeMonth(v) {
    // Keep reference
  },

  changeDate(v) {
    this.selectedDate = v;
  },

  getWorkingDaysCount(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    if (start > end) return 0;

    let count = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0) { // Exclude Sunday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  },

  generate() {
    let prod = [];
    let label = "";
    let dateForAlloc = this.selectedDate;

    if (this.view === 'quarterly') {
      const year = parseInt(document.getElementById('rapportAnnee').value);
      const trim = parseInt(document.getElementById('rapportTrim').value);
      prod = App.getQuarterProduction(year, trim);
      label = App.formatQuarter(year, trim);
      dateForAlloc = `${year}-${String((trim - 1) * 3 + 1).padStart(2, '0')}-01`;
    } else if (this.view === 'monthly') {
      const monthVal = document.getElementById('rapportMois').value.split('-');
      const year = parseInt(monthVal[0]);
      const month = parseInt(monthVal[1]) - 1;
      prod = App.getMonthProduction(year, month);
      label = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      dateForAlloc = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    } else if (this.view === 'yearly') {
      const year = parseInt(document.getElementById('rapportAnnee').value);
      prod = App.getYearProduction(year);
      label = `Année ${year}`;
      dateForAlloc = `${year}-01-01`;
    } else if (this.view === 'daily') {
      const dateVal = document.getElementById('rapportJour').value;
      prod = App.data.production.filter(p => p.date === dateVal);
      label = new Date(dateVal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      dateForAlloc = dateVal;
    } else if (this.view === 'custom') {
      const startVal = document.getElementById('rapportDateDebut').value;
      const endVal = document.getElementById('rapportDateFin').value;
      prod = App.getCustomRangeProduction(startVal, endVal);
      
      const dStart = new Date(startVal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      const dEnd = new Date(endVal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      label = `Du ${dStart} au ${dEnd}`;
      dateForAlloc = startVal;
    }

    if (prod.length === 0) {
      document.getElementById('rapportContent').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">Aucune donnée de production trouvée pour cette période.</div>
        </div>`;
      return;
    }

    const oldView = Dashboard.view;
    const oldDate = Dashboard.selectedDate;
    Dashboard.view = this.view;
    Dashboard.selectedDate = dateForAlloc;
    
    const stats = Dashboard.calcStats(prod);
    
    Dashboard.view = oldView;
    Dashboard.selectedDate = oldDate;

    const alloc = App.getFinancialAllocation(dateForAlloc);
    const energy = stats.totalPoidsPF * 0.15 * alloc.avgTariff;
    
    let totalFixed = 0;
    if (this.view === 'daily') {
      totalFixed = alloc.dailyFixed;
    } else if (this.view === 'monthly') {
      totalFixed = alloc.dailyFixed * 26;
    } else if (this.view === 'quarterly') {
      totalFixed = alloc.dailyFixed * 78;
    } else if (this.view === 'yearly') {
      totalFixed = alloc.dailyFixed * 312;
    } else if (this.view === 'custom') {
      const startVal = document.getElementById('rapportDateDebut').value;
      const endVal = document.getElementById('rapportDateFin').value;
      const workingDays = this.getWorkingDaysCount(startVal, endVal);
      totalFixed = alloc.dailyFixed * workingDays;
    }

    const fullDirectCost = stats.totalCoutMO + stats.totalCoutEmballage + energy + totalFixed;

    // Coût d'achat de la matière première réelle engagée
    const totalCoutMP = prod.reduce((sum, p) => {
      let val = p.valeurMP || ((p.prixMP || 0) * (p.poidsMP || p.poidsBrutPI || p.poidsPI || 0));
      if (val === 0) {
        const sp = App.data.especes?.find(e => e.nom === p.espece);
        const sellPrice = sp?.prixMoyenVente || 65;
        const estBuyPrice = sellPrice * 0.45;
        val = estBuyPrice * (p.poidsMP || p.poidsBrutPI || p.poidsPI || 0);
      }
      return sum + val;
    }, 0);

    // Chiffre d'Affaires Commercial Estimé
    let totalCA = 0;
    Object.entries(stats.bySpecies).forEach(([spName, qty]) => {
      const sp = App.data.especes?.find(e => e.nom === spName);
      const price = sp?.prixMoyenVente || 65;
      totalCA += qty * price;
    });

    const margeBrute = totalCA - totalCoutMP;
    const tauxMargeBrute = totalCA > 0 ? (margeBrute / totalCA) * 100 : 0;

    const coutRevientTotal = totalCoutMP + fullDirectCost;
    const costPerKg = stats.totalPoidsPF > 0 ? coutRevientTotal / stats.totalPoidsPF : 0;

    const margeNette = totalCA - coutRevientTotal;
    const margeParKg = stats.totalPoidsPF > 0 ? margeNette / stats.totalPoidsPF : 0;
    const tauxMarge = totalCA > 0 ? (margeNette / totalCA) * 100 : 0;

    // Pertes et déchets
    const totalPerte = Math.max(0, stats.totalPoidsPI - stats.totalPoidsPF);
    const tauxPerte = stats.totalPoidsPI > 0 ? (totalPerte / stats.totalPoidsPI) * 100 : 0;

    // NEW operational ratios
    const activeDays = [...new Set(prod.map(p => p.date))].filter(Boolean).length || 1;
    const avgDailyPF = stats.totalPoidsPF / activeDays;
    const avgDailyMP = stats.totalPoidsPI / activeDays;
    const capacityRate = Math.min(100, (avgDailyPF / 5000) * 100); // 5000 kg as standard capacity limit
    const unitTransCost = stats.totalPoidsPF > 0 ? (fullDirectCost / stats.totalPoidsPF) : 0;
    const unitPurchaseCost = stats.totalPoidsPF > 0 ? (totalCoutMP / stats.totalPoidsPF) : 0;
    const pruPoissonBrut = stats.totalPoidsPI > 0 ? (totalCoutMP / stats.totalPoidsPI) : 0;
    const avgSellingPrice = stats.totalPoidsPF > 0 ? (totalCA / stats.totalPoidsPF) : 0;

    const trend = this.calcTrends(stats, costPerKg);
    const execComment = this.generateExecutiveComment(stats, { totalCA, margeNette, margeParKg, tauxMarge, totalPerte, tauxPerte });

    this.lastGeneratedData = {
      prod,
      stats,
      label,
      extra: { 
        energy, 
        totalFixed, 
        fullDirectCost, 
        totalCoutMP,
        margeBrute,
        tauxMargeBrute,
        coutRevientTotal,
        costPerKg, 
        trend,
        totalCA,
        margeNette,
        margeParKg,
        tauxMarge,
        totalPerte,
        tauxPerte,
        execComment,
        activeDays,
        avgDailyPF,
        avgDailyMP,
        capacityRate,
        unitTransCost,
        unitPurchaseCost,
        pruPoissonBrut,
        avgSellingPrice
      }
    };

    this.renderReportPreview(prod, stats, label, this.lastGeneratedData.extra);
    
    setTimeout(() => this.initCharts(stats, { energy, totalFixed, fullDirectCost }), 100);
  },

  generateExecutiveComment(stats, extra) {
    const vol = stats.totalPoidsPF;
    const rend = stats.rendement;
    const margeRate = extra.tauxMarge;
    
    let volComment = "";
    if (vol > 20000) {
      volComment = "Un volume de production exceptionnel a été traité sur la période, témoignant d'une forte sollicitation des capacités industrielles.";
    } else if (vol > 5000) {
      volComment = "L'activité opérationnelle se maintient à un niveau régulier et parfaitement en ligne avec la capacité nominale cible.";
    } else {
      volComment = "La période enregistre des volumes modérés, suggérant un approvisionnement restreint ou des arrêts programmés.";
    }

    let rendComment = "";
    if (rend >= 78) {
      rendComment = "Le rendement industriel moyen est excellent (" + App.formatNumber(rend, 1) + "%), supérieur au standard de 74%, ce qui démontre la qualité supérieure de la matière première et la rigueur de découpe des opérateurs.";
    } else if (rend >= 74) {
      rendComment = "Le rendement global est conforme à l'objectif cible de 74%, traduisant un respect global des fiches techniques d'étêtage/filetage.";
    } else {
      rendComment = "ALERTE RENDEMENT MATIÈRE : Le rendement est sous le seuil critique de 74%. Un audit des postes de découpe/parage et une analyse de la fraîcheur de la matière brute sont impératifs.";
    }

    let profitComment = "";
    if (margeRate >= 20) {
      profitComment = "Financièrement, la performance est remarquable avec un taux de marge nette estimé de " + App.formatNumber(margeRate, 1) + "%, portée par un mix produit très valorisant et une absorption idéale des charges fixes.";
    } else if (margeRate >= 10) {
      profitComment = "La marge nette reste saine et équilibrée à " + App.formatNumber(margeRate, 1) + "%. Les coûts opérationnels sont bien maîtrisés.";
    } else if (margeRate >= 0) {
      profitComment = "La rentabilité nette est très faible (" + App.formatNumber(margeRate, 1) + "%). Il est préconisé de contrôler la MO unitaire ou de revaloriser les prix commerciaux.";
    } else {
      profitComment = "ALERTE FINANCIÈRE DE SEUIL : La marge nette est négative (" + App.formatNumber(margeRate, 1) + "%). Il y a une dérive critique sur les coûts (matière première, consommables ou sous-activité structurelle). Action immédiate requise.";
    }

    return `${volComment} ${rendComment} ${profitComment}`;
  },

  calcTrends(currentStats, currentCost) {
    let prevProd = [];
    let prevFixed = 0;
    let prevTariff = 1.15;
    
    if (this.view === 'daily') {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 1);
      const prevDate = d.toISOString().split('T')[0];
      prevProd = App.data.production.filter(p => p.date === prevDate);
      const prevAlloc = App.getFinancialAllocation(prevDate);
      prevFixed = prevAlloc.dailyFixed;
      prevTariff = prevAlloc.avgTariff;
    } else if (this.view === 'monthly') {
      const monthVal = document.getElementById('rapportMois').value.split('-');
      const d = new Date(parseInt(monthVal[0]), parseInt(monthVal[1]) - 2, 1);
      prevProd = App.getMonthProduction(d.getFullYear(), d.getMonth());
      const prevDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const prevAlloc = App.getFinancialAllocation(prevDateStr);
      prevFixed = prevAlloc.dailyFixed * 26;
      prevTariff = prevAlloc.avgTariff;
    } else if (this.view === 'quarterly') {
      const year = parseInt(document.getElementById('rapportAnnee').value);
      const trim = parseInt(document.getElementById('rapportTrim').value);
      let prevYear = year;
      let prevTrim = trim - 1;
      if (prevTrim === 0) {
        prevTrim = 4;
        prevYear = year - 1;
      }
      prevProd = App.getQuarterProduction(prevYear, prevTrim);
      const prevDateStr = `${prevYear}-${String((prevTrim - 1) * 3 + 1).padStart(2, '0')}-01`;
      const prevAlloc = App.getFinancialAllocation(prevDateStr);
      prevFixed = prevAlloc.dailyFixed * 78;
      prevTariff = prevAlloc.avgTariff;
    } else if (this.view === 'yearly') {
      const year = parseInt(document.getElementById('rapportAnnee').value);
      const prevYear = year - 1;
      prevProd = App.getYearProduction(prevYear);
      const prevDateStr = `${prevYear}-01-01`;
      const prevAlloc = App.getFinancialAllocation(prevDateStr);
      prevFixed = prevAlloc.dailyFixed * 312;
      prevTariff = prevAlloc.avgTariff;
    } else if (this.view === 'custom') {
      const startVal = document.getElementById('rapportDateDebut').value;
      const endVal = document.getElementById('rapportDateFin').value;
      const start = new Date(startVal);
      const end = new Date(endVal);
      
      const duration = end.getTime() - start.getTime() + (24 * 60 * 60 * 1000);
      const prevStart = new Date(start.getTime() - duration);
      const prevEnd = new Date(end.getTime() - duration);
      
      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];
      
      prevProd = App.getCustomRangeProduction(prevStartStr, prevEndStr);
      const prevAlloc = App.getFinancialAllocation(prevStartStr);
      
      const prevWorkingDays = this.getWorkingDaysCount(prevStartStr, prevEndStr);
      prevFixed = prevAlloc.dailyFixed * prevWorkingDays;
      prevTariff = prevAlloc.avgTariff;
    }

    if (prevProd.length === 0) return null;

    const oldView = Dashboard.view;
    const oldDate = Dashboard.selectedDate;
    Dashboard.view = 'monthly';
    Dashboard.selectedDate = prevProd[0].date;
    
    const prevStats = Dashboard.calcStats(prevProd);
    
    Dashboard.view = oldView;
    Dashboard.selectedDate = oldDate;

    const prevEnergy = prevStats.totalPoidsPF * 0.15 * prevTariff;
    const prevTotal = prevStats.totalCoutMO + prevStats.totalCoutEmballage + prevEnergy + prevFixed;
    const prevCostPerKg = prevStats.totalPoidsPF > 0 ? prevTotal / prevStats.totalPoidsPF : 0;

    return {
      prod: prevStats.totalPoidsPF > 0 ? ((currentStats.totalPoidsPF - prevStats.totalPoidsPF) / prevStats.totalPoidsPF) * 100 : 0,
      rend: currentStats.rendement - prevStats.rendement,
      cost: prevCostPerKg > 0 ? ((currentCost - prevCostPerKg) / prevCostPerKg) * 100 : 0
    };
  },

  renderReportPreview(prod, stats, label, extra) {
    const container = document.getElementById('rapportContent');
    
    // Audit alerts
    const alerts = [];
    if (stats.rendement < 74) {
      alerts.push({
        type: 'danger',
        title: '🚨 RENDEMENT MATIÈRE SOUS LES LIMITES',
        text: `Le rendement moyen de transformation de ${App.formatNumber(stats.rendement, 2)}% est inférieur à la cible de 74%. Il y a un gâchis matière. Surveillez les postes d'étêtage.`
      });
    } else {
      alerts.push({
        type: 'success',
        title: '✅ CONFORMITÉ RENDEMENT MATIÈRE',
        text: `Le rendement industriel global (${App.formatNumber(stats.rendement, 2)}%) est au-dessus du standard cible de 74%.`
      });
    }

    if (stats.productivite < 20) {
      alerts.push({
        type: 'warning',
        title: '⚠️ PRODUCTIVITÉ MAIN-D\'ŒUVRE BASSE',
        text: `Le rendement horaire de ${App.formatNumber(stats.productivite, 2)} kg/h est sous le seuil d'efficacité (20 kg/h). Rationalisez les équipes temporaires.`
      });
    } else {
      alerts.push({
        type: 'success',
        title: '✅ EXCELLENTE GESTION HORAIRE DE LA MO',
        text: `Productivité horaire de la main-d'œuvre (${App.formatNumber(stats.productivite, 2)} kg/h) optimale.`
      });
    }

    if (extra.tauxMarge < 15) {
      alerts.push({
        type: 'danger',
        title: '📉 OPTIMISATION DE LA RENTABILITÉ NETTE',
        text: `Le taux de marge d'exploitation nette (${App.formatNumber(extra.tauxMarge, 2)}%) est sous la cible de 15%. Réduisez les coûts fixes et consommables.`
      });
    } else {
      alerts.push({
        type: 'success',
        title: '✅ SEUIL DE RENTABILITÉ TRÈS SATISFAISANT',
        text: `La profitabilité nette d'exploitation est sécurisée à ${App.formatNumber(extra.tauxMarge, 2)}% sur la période.`
      });
    }

    if (extra.tauxPerte > 26) {
      alerts.push({
        type: 'danger',
        title: '🍂 REBUTS & DÉCHETS EN EXCÈS',
        text: `Le taux de perte matière brute est de ${App.formatNumber(extra.tauxPerte, 2)}% (tolérance max 26%). Contrôlez les calibres à la réception.`
      });
    } else {
      alerts.push({
        type: 'success',
        title: '✅ PERTES ET FRACTILE DE COUPE MAÎTRISÉS',
        text: `Les pertes industrielles brutes sont de ${App.formatNumber(extra.tauxPerte, 2)}%, sous le plafond autorisé.`
      });
    }

    const recsHtml = alerts.map(a => `
      <div style="background: ${a.type === 'danger' ? 'rgba(239, 68, 68, 0.04)' : a.type === 'warning' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(16, 185, 129, 0.04)'}; 
                  border-left: 4px solid ${a.type === 'danger' ? 'var(--status-danger)' : a.type === 'warning' ? 'var(--status-warning)' : 'var(--status-success)'}; 
                  padding: 12px; margin-bottom: 10px; border-radius: 0 8px 8px 0;">
        <h5 style="margin: 0 0 4px 0; font-size: 0.85rem; font-weight: 700; color: ${a.type === 'danger' ? 'var(--status-danger)' : a.type === 'warning' ? 'var(--status-warning)' : 'var(--status-success)'};">${a.title}</h5>
        <p style="margin: 0; font-size: 0.8rem; color: #444; line-height: 1.4;">${a.text}</p>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="report-preview-container slide-up">
        <div class="report-toolbar">
          <div class="report-info">
            <span class="badge badge-accent" style="background: var(--accent-blue); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">AUDIT EXPERT (RCG-HAMZA)</span>
            <strong style="font-size: 1.1rem; color: var(--primary-color);">Rapport Global : ${label}</strong>
          </div>
          <div class="report-actions" style="display: flex; gap: 12px;">
            <button class="btn btn-outline btn-sm" onclick="Rapports.exportExcel()" style="display: flex; align-items: center; gap: 8px;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
               <span>Excel 6 Onglets</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="Rapports.exportPDF()" style="display: flex; align-items: center; gap: 8px; background: var(--primary-color); color: white;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
               <span>PDF Premium 6 Pages</span>
            </button>
          </div>
        </div>
 
        <div class="report-sheet card fade-in">
          <div class="report-header-internal">
            <div class="company-brand">
              <div class="logo-placeholder">SP</div>
              <div>
                <h2 style="margin:0; font-size: 1.5rem; letter-spacing: -0.5px; color: var(--primary-color);">SEA PECHE / ELABBAR</h2>
                <p style="margin:0; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Contrôle de Gestion Opérationnel & Financier</p>
              </div>
            </div>
            <div class="report-meta">
              <p style="margin:0; font-weight: 600; color: var(--primary-color);">Rapport de Performance RCG-${Math.floor(Math.random()*9000)+1000}</p>
              <p style="margin:0;">Généré le : ${new Date().toLocaleString('fr-FR')}</p>
              <p style="margin:0;">Période : <strong>${label}</strong></p>
            </div>
          </div>
 
          <div class="report-section">
            <h3 class="section-title">I. TABLEAU DE BORD DE PILOTAGE SYNTHÉTIQUE (16 KPI CIBLES)</h3>
            <div class="kpi-grid-report" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
              <div class="kpi-card-mini">
                <span class="label">Production Totale (PF)</span>
                <span class="value">
                  ${App.formatNumber(stats.totalPoidsPF, 1)} <small style="font-size: 0.7rem;">kg</small>
                  ${extra.trend ? `
                    <span class="trend-indicator ${extra.trend.prod >= 0 ? 'trend-up' : 'trend-down'}">
                      ${extra.trend.prod >= 0 ? '↑' : '↓'} ${Math.abs(extra.trend.prod).toFixed(1)}%
                    </span>
                  ` : ''}
                </span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Matière Première Traitée</span>
                <span class="value">${App.formatNumber(stats.totalPoidsPI, 1)} <small style="font-size: 0.7rem;">kg</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Rendement Industriel</span>
                <span class="value" style="color: ${stats.rendement >= 74 ? 'var(--status-success)' : 'var(--status-danger)'};">
                  ${App.formatNumber(stats.rendement, 2)}%
                  ${extra.trend ? `
                    <span class="trend-indicator ${extra.trend.rend >= 0 ? 'trend-up' : 'trend-down'}">
                      ${extra.trend.rend >= 0 ? '↑' : '↓'} ${Math.abs(extra.trend.rend).toFixed(1)} pts
                    </span>
                  ` : ''}
                </span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Déchets & Pertes</span>
                <span class="value" style="color: var(--status-danger);">
                  ${App.formatNumber(extra.totalPerte, 1)} <small style="font-size: 0.7rem;">kg</small>
                  <span style="font-size: 0.65rem; font-weight: 500;">(${App.formatNumber(extra.tauxPerte, 1)}%)</span>
                </span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Productivité MO Directe</span>
                <span class="value">${App.formatNumber(stats.productivite, 2)} <small style="font-size: 0.7rem;">kg/h</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Coût Achat Poisson (MP)</span>
                <span class="value" style="color: var(--status-purple);">${App.formatNumber(extra.totalCoutMP, 0)} <small style="font-size: 0.7rem;">DH</small></span>
              </div>
              <div class="kpi-card-mini" style="background: rgba(37, 99, 255, 0.02);">
                <span class="label">Marge Brute Matière</span>
                <span class="value" style="color: var(--accent-blue);">${App.formatNumber(extra.margeBrute, 0)} <small style="font-size: 0.7rem;">DH</small>
                  <span style="font-size: 0.65rem; font-weight: 600;">(${App.formatNumber(extra.tauxMargeBrute, 1)}%)</span>
                </span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Frais de Transformation</span>
                <span class="value" style="color: #64748b;">${App.formatNumber(extra.fullDirectCost, 0)} <small style="font-size: 0.7rem;">DH</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Chiffre d'Affaires</span>
                <span class="value" style="color: var(--status-success);">${App.formatNumber(extra.totalCA, 0)} <small style="font-size: 0.7rem;">DH</small></span>
              </div>
              <div class="kpi-card-mini" style="background: ${extra.margeNette >= 0 ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)'}; border-color: ${extra.margeNette >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">
                <span class="label">Marge Nette Consolidée</span>
                <span class="value" style="color: ${extra.margeNette >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">
                  ${App.formatNumber(extra.margeNette, 0)} <small style="font-size: 0.7rem;">DH</small>
                  <span style="font-size: 0.65rem; font-weight: 600;">(${App.formatNumber(extra.tauxMarge, 1)}%)</span>
                </span>
              </div>
              <!-- NEW KPIs in the screen preview -->
              <div class="kpi-card-mini">
                <span class="label">Jours Industriels Actifs</span>
                <span class="value">${extra.activeDays} <small style="font-size: 0.7rem;">jours</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Moyenne Daily (PF)</span>
                <span class="value">${App.formatNumber(extra.avgDailyPF, 1)} <small style="font-size: 0.7rem;">kg/j</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Moyenne Daily (MP)</span>
                <span class="value">${App.formatNumber(extra.avgDailyMP, 1)} <small style="font-size: 0.7rem;">kg/j</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Utilisation Capacité</span>
                <span class="value">${App.formatNumber(extra.capacityRate, 1)}%</span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Incidence Transformation</span>
                <span class="value">${App.formatNumber(extra.unitTransCost, 2)} <small style="font-size: 0.7rem;">DH/kg</small></span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Marge Nette par kg PF</span>
                <span class="value">${App.formatNumber(extra.margeParKg, 2)} <small style="font-size: 0.7rem;">DH/kg</small></span>
              </div>
            </div>
            
            <div style="background: rgba(11, 45, 107, 0.02); border-left: 4px solid var(--primary-color); padding: 16px; border-radius: 0 12px 12px 0; margin-top: 15px;">
              <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase;">Note Stratégique du Contrôle de Gestion</h4>
              <p style="margin: 0; font-size: 0.85rem; line-height: 1.5; color: #334155; font-style: italic;">"${extra.execComment}"</p>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-title">II. RENDEMENTS TECHNIQUES & PERFORMANCE INDUSTRIELLE</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Indicateur Technique</th>
                  <th class="td-right">Volume / Période</th>
                  <th class="td-right">Objectif nominal / Cible</th>
                  <th class="td-right">Écart / Efficacité</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Taux de rendement matière unitaire (Global)</td>
                  <td class="td-right" style="font-weight: 600;">${App.formatNumber(stats.rendement, 2)} %</td>
                  <td class="td-right">74.00 %</td>
                  <td class="td-right" style="font-weight: 600; color: ${stats.rendement >= 74 ? 'var(--status-success)' : 'var(--status-danger)'};">
                    ${App.formatNumber(stats.rendement - 74, 2)} pts
                  </td>
                </tr>
                <tr>
                  <td>Taux de pertes industrielles de découpe</td>
                  <td class="td-right">${App.formatNumber(extra.tauxPerte, 2)} %</td>
                  <td class="td-right">26.00 %</td>
                  <td class="td-right" style="font-weight: 600; color: ${extra.tauxPerte <= 26 ? 'var(--status-success)' : 'var(--status-danger)'};">
                    ${App.formatNumber(26 - extra.tauxPerte, 2)} pts
                  </td>
                </tr>
                <tr>
                  <td>Productivité horaire main d'œuvre directe (MO)</td>
                  <td class="td-right">${App.formatNumber(stats.productivite, 2)} kg/h</td>
                  <td class="td-right">20.00 kg/h</td>
                  <td class="td-right" style="font-weight: 600; color: ${stats.productivite >= 20 ? 'var(--status-success)' : 'var(--status-danger)'};">
                    ${App.formatNumber((stats.productivite - 20) / 20 * 100, 1)} %
                  </td>
                </tr>
                <tr>
                  <td>Production journalière moyenne (Produit Fini)</td>
                  <td class="td-right">${App.formatNumber(extra.avgDailyPF, 1)} kg/j</td>
                  <td class="td-right">5 000 kg/j</td>
                  <td class="td-right">${App.formatNumber(extra.capacityRate, 1)} % d'usage</td>
                </tr>
                <tr>
                  <td>Total Heures Main d'œuvre Occasionnelle</td>
                  <td class="td-right">${App.formatNumber(stats.totalHeures, 1)} heures</td>
                  <td class="td-right">-</td>
                  <td class="td-right">Coût direct : ${App.formatNumber(stats.totalCoutMO, 0)} DH</td>
                </tr>
              </tbody>
            </table>
          </div>
 
          <div class="report-section">
            <h3 class="section-title">III. COMPTE DE RÉSULTAT ANALYTIQUE (P&L STATION)</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Poste du Compte de Résultat</th>
                  <th class="td-right">Montant Global (DH)</th>
                  <th class="td-right">Incidence (DH/Kg PF)</th>
                  <th class="td-right">Part relative (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 600; color: var(--primary-color);">Chiffre d'Affaires Commercial Estimé</td>
                  <td class="td-right" style="font-weight: 600; color: var(--status-success);">${App.formatNumber(extra.totalCA, 0)}</td>
                  <td class="td-right" style="font-weight: 600;">${App.formatNumber(extra.avgSellingPrice, 2)}</td>
                  <td class="td-right">100.0%</td>
                </tr>
                <tr>
                  <td style="padding-left: 20px;">- Coût d'Achat Poisson (MP brut engagé)</td>
                  <td class="td-right" style="color: var(--status-danger);">${App.formatNumber(extra.totalCoutMP, 0)}</td>
                  <td class="td-right">${App.formatNumber(extra.unitPurchaseCost, 2)}</td>
                  <td class="td-right">${App.formatNumber((extra.totalCoutMP / extra.totalCA) * 100, 1)}%</td>
                </tr>
                <tr style="font-weight: 600; background: rgba(37, 99, 255, 0.02);">
                  <td style="color: var(--accent-blue); padding-left: 10px;">MARGE BRUTE MATIÈRE COMMERCIALE</td>
                  <td class="td-right" style="color: var(--accent-blue);">${App.formatNumber(extra.margeBrute, 0)}</td>
                  <td class="td-right" style="color: var(--accent-blue);">${App.formatNumber(extra.margeBrute / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right" style="color: var(--accent-blue);">${App.formatNumber(extra.tauxMargeBrute, 1)}%</td>
                </tr>
                <tr>
                  <td style="padding-left: 20px;">- Coût Variable de Main-d'œuvre Directe</td>
                  <td class="td-right" style="color: var(--status-danger);">${App.formatNumber(stats.totalCoutMO, 0)}</td>
                  <td class="td-right">${App.formatNumber(stats.totalCoutMO / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">${App.formatNumber((stats.totalCoutMO / extra.totalCA) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td style="padding-left: 20px;">- Consommables, Cartons & Emballage</td>
                  <td class="td-right" style="color: var(--status-danger);">${App.formatNumber(stats.totalCoutEmballage, 0)}</td>
                  <td class="td-right">${App.formatNumber(stats.totalCoutEmballage / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">${App.formatNumber((stats.totalCoutEmballage / extra.totalCA) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td style="padding-left: 20px;">- Estimation Coût Énergétique Fluides</td>
                  <td class="td-right" style="color: var(--status-danger);">${App.formatNumber(extra.energy, 0)}</td>
                  <td class="td-right">${App.formatNumber(extra.energy / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">${App.formatNumber((extra.energy / extra.totalCA) * 100, 1)}%</td>
                </tr>
                <tr>
                  <td style="padding-left: 20px;">- Charges Fixes de Structure Proratisées</td>
                  <td class="td-right" style="color: var(--status-danger);">${App.formatNumber(extra.totalFixed, 0)}</td>
                  <td class="td-right">${App.formatNumber(extra.totalFixed / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">${App.formatNumber((extra.totalFixed / extra.totalCA) * 100, 1)}%</td>
                </tr>
                <tr style="background: ${extra.margeNette >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'}; font-weight: bold; border-top: 2px solid rgba(0,0,0,0.1);">
                  <td style="color: var(--primary-color);">MARGE NETTE OPÉRATIONNELLE DE STATION</td>
                  <td class="td-right" style="color: ${extra.margeNette >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">${App.formatNumber(extra.margeNette, 0)} DH</td>
                  <td class="td-right" style="color: ${extra.margeNette >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">${App.formatNumber(extra.margeParKg, 2)} DH/kg</td>
                  <td class="td-right" style="color: ${extra.margeNette >= 0 ? 'var(--status-success)' : 'var(--status-danger)'};">${App.formatNumber(extra.tauxMarge, 2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
 
          <div class="report-section">
            <h3 class="section-title">IV. PERFORMANCE COMMERCIALES PAR ESPÈCES</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Espèce de Poisson</th>
                  <th class="td-right">Poids Net PF (kg)</th>
                  <th class="td-right">Poids Brut MP (kg)</th>
                  <th class="td-right">Rendement (%)</th>
                  <th class="td-right">Part Mix (%)</th>
                  <th class="td-right">Prix Moyen Vente</th>
                  <th class="td-right">CA Estimé (DH)</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(stats.bySpecies).sort((a,b) => b[1]-a[1]).map(([sp, qty]) => {
                  const spProd = prod.filter(p => p.espece === sp);
                  const spPI = spProd.reduce((s,p) => s + (p.poidsBrutPI || p.poidsMP || 0), 0);
                  const spRend = spPI > 0 ? (qty / spPI * 100) : 0;
                  const spObj = App.data.especes?.find(e => e.nom === sp);
                  const price = spObj?.prixMoyenVente || 65;
                  const ca = qty * price;
                  return `
                  <tr>
                    <td style="font-weight: 600; color: var(--primary-color);">${sp}</td>
                    <td class="td-right">${App.formatNumber(qty, 1)}</td>
                    <td class="td-right">${App.formatNumber(spPI, 1)}</td>
                    <td class="td-right">
                      <span style="color: ${spRend >= 74 ? 'var(--status-success)' : 'var(--status-danger)'}; font-weight: 700;">
                        ${App.formatNumber(spRend, 1)}%
                      </span>
                    </td>
                    <td class="td-right">${App.formatNumber((qty / stats.totalPoidsPF) * 100, 1)}%</td>
                    <td class="td-right">${App.formatNumber(price, 0)} DH/kg</td>
                    <td class="td-right" style="font-weight: 600; color: var(--status-success);">${App.formatNumber(ca, 0)}</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h3 class="section-title">V. RECOMMANDATIONS TECHNIQUES & DIAGNOSTICS D'AUDIT</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${recsHtml}
            </div>
          </div>
 
          <div class="report-section no-print">
            <h3 class="section-title">VI. VISUALISATIONS GRAPHIQUES</h3>
            <div class="report-charts-grid">
               <div class="chart-container-report">
                  <h4>Structure Directe/Indirecte des Charges</h4>
                  <canvas id="chartCostStructure"></canvas>
               </div>
               <div class="chart-container-report">
                  <h4>Mix de Transformation par Espèce (kg PF)</h4>
                  <canvas id="chartSpeciesMix"></canvas>
               </div>
            </div>
          </div>
          
          <div class="report-footer-internal" style="margin-top: 35px;">
            <p style="font-size: 0.7rem; color: #64748b; line-height: 1.45; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 10px; margin-bottom: 20px;">
              <strong>Note méthodologique d'Audit :</strong> Ce rapport automatisé intègre les salaires de l'onglet Personnel (fixe_admin, fixe_autre, ouvriers) pour calculer le seuil de rentabilité et l'absorption des coûts fixes. Les consommables sont évalués sur la base des sorties déclarées dans les lots. L'énergie intègre une formule industrielle au prorata des volumes de congelés.
            </p>
            <div class="report-signatures-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div style="text-align: left;">
                <p style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: var(--primary-color); margin: 0 0 8px 0;">Direction d'Exploitation</p>
                <div style="height: 65px; width: 170px; border: 1px dashed rgba(11, 45, 107, 0.2); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #94a3b8; border-radius: 4px;">Cachet & Signature</div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                <p style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: var(--primary-color); margin: 0 0 8px 0;">Contrôle de Gestion / Direction Financière</p>
                <div style="height: 65px; width: 170px; border: 1px dashed rgba(11, 45, 107, 0.2); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #94a3b8; border-radius: 4px;">Cachet & Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  exportPDF() {
    if (!this.lastGeneratedData) {
      App.toast("Veuillez d'abord générer un rapport à l'écran", "error");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const data = this.lastGeneratedData;
    const stats = data.stats;
    const extra = data.extra;
    const label = data.label;
    const prod = data.prod;
    const now = new Date();
    const margin = 15;
    const docWidth = 210;
    const docHeight = 297;
    const totalPages = 6; // strictly 6 pages

    const drawHeader = (doc, title) => {
      // Top header band in ocean deep blue
      doc.setFillColor(11, 45, 107);
      doc.rect(0, 0, docWidth, 40, 'F');

      // Decorative golden line
      doc.setFillColor(197, 160, 89);
      doc.rect(0, 40, docWidth, 1.5, 'F');

      // Accent rounded block
      doc.setFillColor(37, 99, 255);
      doc.roundedRect(margin, 8, 16, 16, 3, 3, 'F');
      
      // Logo text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SP', margin + 3.5, 18.5);

      // Main Brand Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SEA PECHE / ELABBAR', margin + 22, 15);
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(title.toUpperCase(), margin + 22, 21);

      // Metadata info on top right
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
      doc.text('Édité le : ' + now.toLocaleString('fr-FR'), docWidth - margin, 12, { align: 'right' });
      doc.text('Code Unique : RCG-AUDIT-' + Math.floor(Math.random() * 90000 + 10000), docWidth - margin, 17, { align: 'right' });
      doc.text('Période d\'analyse : ' + label, docWidth - margin, 22, { align: 'right' });
    };

    const drawFooter = (doc, pageNum) => {
      // Small grey rule at bottom
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, docHeight - 16, docWidth - margin, docHeight - 16);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`SEA PECHE ERP Analytique — Page ${pageNum} sur ${totalPages}`, docWidth / 2, docHeight - 11, { align: 'center' });
      doc.setFont('helvetica', 'italic');
      doc.text('Document Confidentiel Interne — Direction Générale Elabbar', docWidth / 2, docHeight - 7, { align: 'center' });
    };

    // ==========================================
    // PAGE 1 : Page de Garde & Tableau Synthèse des KPI
    // ==========================================
    drawHeader(doc, "Page 1: Synthèse Stratégique & Tableau de Bord Exécutif");

    let y = 52;
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDIT ANALYTIQUE DE LA STATION DE CONDITIONNEMENT', margin, y);
    
    doc.setDrawColor(11, 45, 107);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, docWidth - margin, y + 2);

    y += 10;
    
    // Grille condensée des KPI prioritaires
    const kpiRowsPage1 = [
      ['Production Totale (Produit Fini - PF)', App.formatNumber(stats.totalPoidsPF, 1) + ' kg', 'Tonnage net congelé, pesé et emballé.'],
      ['Matière Première Engagée (MP brut)', App.formatNumber(stats.totalPoidsPI, 1) + ' kg', 'Tonnage total de poisson brut entré en chaîne.'],
      ['Rendement Industriel Moyen', App.formatNumber(stats.rendement, 2) + ' %', 'Indice d\'efficacité de découpe (Standard Target >= 74%).'],
      ['Pertes & Déchets Physiques brut', App.formatNumber(extra.totalPerte, 1) + ' kg', 'Perte de poids matière (Viscères, têtes, cuts).'],
      ['Productivité Directe de la Main d\'œuvre', App.formatNumber(stats.productivite, 2) + ' kg/h', 'Rendement de parage par heure-homme (Target >= 20 kg/h).'],
      ['Coût total d\'Achat du Poisson', App.formatNumber(extra.totalCoutMP, 0) + ' DH', 'Valorisation d\'achat théorique de la marée engagée.'],
      ['Marge Commerciale Brute', App.formatNumber(extra.margeBrute, 0) + ' DH', 'CA théorique brut diminué des achats matière première.'],
      ['Chiffre d\'Affaires Commercial Estimé', App.formatNumber(extra.totalCA, 0) + ' DH', 'Valorisation commerciale des ventes théoriques PF.'],
      ['Coût de Transformation Direct de Station', App.formatNumber(extra.fullDirectCost, 0) + ' DH', 'Main d\'œuvre occasionnelle + emballages + énergie + fixes.'],
      ['Marge Opérationnelle Nette Finale', App.formatNumber(extra.margeNette, 0) + ' DH', 'Marge nette dégagée d\'exploitation de la période.'],
      ['Taux de Marge Nette d\'Exploitation', App.formatNumber(extra.tauxMarge, 2) + ' %', 'Indicateur final de rentabilité d\'exploitation nette.'],
      ['Coût de Revient Unitaire Consolidated (PRU)', App.formatNumber(extra.costPerKg, 2) + ' DH/kg PF', 'Coût total complet (Poisson + transformation) par kg PF.']
    ];

    doc.autoTable({
      startY: y,
      head: [['Axe Analytique / Indicateur', 'Valeur', 'Description Opérationnelle']],
      body: kpiRowsPage1,
      theme: 'grid',
      headStyles: { fillColor: [11, 45, 107], fontSize: 8.5 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 60 },
        1: { halign: 'right', fontStyle: 'bold', width: 35, textColor: [37, 99, 255] },
        2: { textColor: [71, 85, 105], width: 85 }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 8;

    // Commentary Section Box
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SYNTHÈSE DE L\'AUDITEUR DU CONTRÔLE DE GESTION', margin, y);
    
    y += 3;
    
    // Callout card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, docWidth - (margin * 2), 34, 2, 2, 'F');
    doc.setFillColor(11, 45, 107);
    doc.rect(margin, y, 2, 34, 'F');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `" ${extra.execComment} "`,
      margin + 6,
      y + 6,
      { maxWidth: docWidth - (margin * 2) - 12, lineHeight: 4 }
    );

    drawFooter(doc, 1);

    // ==========================================
    // PAGE 2 : Performance Technique Industrielle & MO
    // ==========================================
    doc.addPage();
    drawHeader(doc, "Page 2: Performance Industrielle, Pertes & Main-d'Œuvre");

    y = 52;
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('II. ANALYSE DU RENDEMENT OPÉRATIONNEL & PERTES', margin, y);

    y += 5;

    // Yield metrics and stats details
    const technicalRows = [
      ['Rendement industriel moyen global de la station', App.formatNumber(stats.rendement, 2) + ' %', '74.00 %', App.formatNumber(stats.rendement - 74, 2) + ' pts', stats.rendement >= 74 ? 'Conforme' : 'Sous-Performance Matière'],
      ['Taux d\'incidence des déchets et gâchis', App.formatNumber(extra.tauxPerte, 2) + ' %', '26.00 %', App.formatNumber(extra.tauxPerte - 26, 2) + ' pts', extra.tauxPerte <= 26 ? 'Maîtrisé' : 'Pertes excessives de parage'],
      ['Poids physique total des rebuts (têtes/viscères)', App.formatNumber(extra.totalPerte, 1) + ' kg', '-', '-', 'Volume de matière organique non valorisée'],
      ['Jours d\'activité industrielle effective', extra.activeDays + ' jours active', '-', '-', 'Jours réels avec lots de production saisis'],
      ['Production de produit fini unitaire par jour actif', App.formatNumber(extra.avgDailyPF, 1) + ' kg/jour', '5 000 kg/jour', App.formatNumber(extra.avgDailyPF - 5000, 1) + ' kg/j', App.formatNumber(extra.capacityRate, 1) + ' % de charge nominale'],
      ['Volume matière première brut traité par jour actif', App.formatNumber(extra.avgDailyMP, 1) + ' kg/jour', '-', '-', 'Débit d\'approvisionnement moyen quotidien']
    ];

    doc.autoTable({
      startY: y,
      head: [['Indicateur Technique', 'Valeur Réelle', 'Standard Cible', 'Écart Cible', 'Diagnostic Opérationnel']],
      body: technicalRows,
      theme: 'grid',
      headStyles: { fillColor: [11, 45, 107], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 58 },
        1: { halign: 'right', fontStyle: 'bold', width: 28 },
        2: { halign: 'right', width: 24 },
        3: { halign: 'right', width: 24, fontStyle: 'bold' },
        4: { textColor: [71, 85, 105], width: 46 }
      },
      didParseCell: function(cellData) {
        if (cellData.column.index === 3 && cellData.cell.raw) {
          if (cellData.cell.raw.includes('-') && !cellData.cell.raw.startsWith('- ')) {
            cellData.cell.styles.textColor = [220, 38, 38]; // Red for negative gap on yield
          } else if (cellData.cell.raw.includes('pts') || cellData.cell.raw.includes('%')) {
            // green or default
          }
        }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setTextColor(11, 45, 107);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('III. PRODUCTIVITÉ ET COÛT DE LA MAIN-D\'ŒUVRE DIRECTE', margin, y);

    y += 5;

    const moRows = [
      ['Total des heures travaillées (Personnel occasionnel)', App.formatNumber(stats.totalHeures, 1) + ' H', 'Temps direct passé sur les lignes de conditionnement.'],
      ['Productivité horaire opérationnelle unitaire', App.formatNumber(stats.productivite, 2) + ' kg/h', 'Volume net (PF) traité par heure de travail (Cible 20 kg/h).'],
      ['Coût global de la main-d\'œuvre occasionnelle', App.formatNumber(stats.totalCoutMO, 0) + ' DH', 'Salaires variables de la main d\'œuvre de la période.'],
      ['Incidence de la MO directe par kilogramme de produit fini', App.formatNumber(stats.totalCoutMO / stats.totalPoidsPF, 2) + ' DH/kg PF', 'Rapport de coût salarial variable appliqué au kg de PF.'],
      ['Indice d\'efficacité de la MO directe', App.formatNumber((stats.productivite / 20) * 100, 1) + ' %', 'Niveau de productivité par rapport à l\'objectif d\'usine.']
    ];

    doc.autoTable({
      startY: y,
      head: [['Ratios Main d\'œuvre', 'Valeur Calculée', 'Analyse du Contrôle de Gestion']],
      body: moRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 65 },
        1: { halign: 'right', fontStyle: 'bold', width: 35, textColor: [37, 99, 255] },
        2: { textColor: [71, 85, 105], width: 80 }
      },
      margin: { left: margin, right: margin }
    });

    drawFooter(doc, 2);

    // ==========================================
    // PAGE 3 : Compte de Résultat Analytique (P&L)
    // ==========================================
    doc.addPage();
    drawHeader(doc, "Page 3: Compte de Résultat Analytique (P&L Station)");

    y = 52;
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IV. STRUCTURE COMPTABLE DU COMPTE DE RÉSULTAT DE LA PÉRIODE', margin, y);

    y += 5;

    const plRows = [
      ['CHIFFRE D\'AFFAIRES COMMERCIALE ESTIMÉ', App.formatNumber(extra.totalCA, 0) + ' DH', App.formatNumber(extra.avgSellingPrice, 2) + ' DH/kg PF', '100.00 %', 'Valorisation commerciale des ventes théoriques.'],
      ['Moins : Coût d\'achat de la Matière Première (Poisson)', App.formatNumber(extra.totalCoutMP, 0) + ' DH', App.formatNumber(extra.unitPurchaseCost, 2) + ' DH/kg PF', App.formatNumber((extra.totalCoutMP / extra.totalCA) * 100, 1) + ' %', 'Valorisation d\'achat estimée du poisson brut.'],
      ['MARGE BRUTE MATIÈRE COMMERCIALE', App.formatNumber(extra.margeBrute, 0) + ' DH', App.formatNumber(extra.margeBrute / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber(extra.tauxMargeBrute, 2) + ' %', 'Rentabilité commerciale de base (poisson brut).'],
      ['Moins : Coût variable direct de main-d\'œuvre (MO)', App.formatNumber(stats.totalCoutMO, 0) + ' DH', App.formatNumber(stats.totalCoutMO / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((stats.totalCoutMO / extra.totalCA) * 100, 1) + ' %', 'Main d\'œuvre occasionnelle de découpe/parage.'],
      ['Moins : Consommables direct, emballages, cartons', App.formatNumber(stats.totalCoutEmballage, 0) + ' DH', App.formatNumber(stats.totalCoutEmballage / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((stats.totalCoutEmballage / extra.totalCA) * 100, 1) + ' %', 'Sachets, cartons réels consommés dans les lots.'],
      ['Moins : Coût estimé d\'énergie industrielle (Fluides)', App.formatNumber(extra.energy, 0) + ' DH', App.formatNumber(extra.energy / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((extra.energy / extra.totalCA) * 100, 1) + ' %', 'Quote-part d\'électricité/eau de congélation.'],
      ['Moins : Coût fixe de structure indirect absorbé', App.formatNumber(extra.totalFixed, 0) + ' DH', App.formatNumber(extra.totalFixed / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((extra.totalFixed / extra.totalCA) * 100, 1) + ' %', 'Prorata des charges administratives de structure.'],
      ['MARGE OPÉRATIONNELLE NETTE DE LA STATION', App.formatNumber(extra.margeNette, 0) + ' DH', App.formatNumber(extra.margeParKg, 2) + ' DH/kg PF', App.formatNumber(extra.tauxMarge, 2) + ' %', 'Résultat d\'exploitation net global estimé de la station.']
    ];

    doc.autoTable({
      startY: y,
      head: [['Poste du Compte de Résultat', 'Montant (DH)', 'Incidence (Kg PF)', 'Ratio CA (%)', 'Analyse du Contrôle de Gestion']],
      body: plRows,
      theme: 'grid',
      headStyles: { fillColor: [11, 45, 107], fontSize: 7.5 },
      styles: { fontSize: 7.2, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 62 },
        1: { halign: 'right', fontStyle: 'bold', width: 28 },
        2: { halign: 'right', width: 22 },
        3: { halign: 'right', fontStyle: 'bold', width: 20 },
        4: { textColor: [71, 85, 105], width: 48 }
      },
      didParseCell: function(cellData) {
        if (cellData.row.index === 0) {
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
        if (cellData.row.index === 2) {
          cellData.cell.styles.fillColor = [239, 246, 255];
          cellData.cell.styles.textColor = [29, 78, 216];
        }
        if (cellData.row.index === plRows.length - 1) {
          if (extra.margeNette >= 0) {
            cellData.cell.styles.fillColor = [220, 252, 231];
            cellData.cell.styles.textColor = [21, 128, 61];
          } else {
            cellData.cell.styles.fillColor = [254, 226, 226];
            cellData.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
      margin: { left: margin, right: margin }
    });

    drawFooter(doc, 3);

    // ==========================================
    // PAGE 4 : Structure Détaillée des Charges & Graphique Doughnut
    // ==========================================
    doc.addPage();
    drawHeader(doc, "Page 4: Structure Consolidée des Charges & Répartition Graphique");

    y = 52;
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('V. STRUCTURE ANALYTIQUE COMPLÈTE DES DÉPENSES DE REVIENT', margin, y);

    y += 5;

    const chargeRows = [
      ['Coût d\'Achat Matière Première (Poisson)', App.formatNumber(extra.totalCoutMP, 0) + ' DH', App.formatNumber(extra.unitPurchaseCost, 2) + ' DH/kg PF', App.formatNumber((extra.totalCoutMP / extra.coutRevientTotal) * 100, 1) + ' %', 'Coût réel direct matière première'],
      ['Main-d\'œuvre Directe (Proratisée)', App.formatNumber(stats.totalCoutMO, 0) + ' DH', App.formatNumber(stats.totalCoutMO / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((stats.totalCoutMO / extra.coutRevientTotal) * 100, 1) + ' %', 'Main d\'œuvre ouvrière variables'],
      ['Consommables & Emballages réels', App.formatNumber(stats.totalCoutEmballage, 0) + ' DH', App.formatNumber(stats.totalCoutEmballage / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((stats.totalCoutEmballage / extra.coutRevientTotal) * 100, 1) + ' %', 'Cartons et sachets de stockage'],
      ['Énergie & Fluides (Estimation)', App.formatNumber(extra.energy, 0) + ' DH', App.formatNumber(extra.energy / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((extra.energy / extra.coutRevientTotal) * 100, 1) + ' %', 'Consommation électrique chambres & tunnels'],
      ['Charges Fixes Structure Prorata', App.formatNumber(extra.totalFixed, 0) + ' DH', App.formatNumber(extra.totalFixed / stats.totalPoidsPF, 2) + ' DH/kg PF', App.formatNumber((extra.totalFixed / extra.coutRevientTotal) * 100, 1) + ' %', 'Loyer, direction administrative et sécurité'],
      ['TOTAL COÛT DE REVIENT PRODUCTION', App.formatNumber(extra.coutRevientTotal, 0) + ' DH', App.formatNumber(extra.costPerKg, 2) + ' DH/kg PF', '100.0 %', 'Coût de revient complet consolidé']
    ];

    doc.autoTable({
      startY: y,
      head: [['Nature de la Charge d\'Exploitation', 'Montant (DH)', 'Incidence (DH/Kg PF)', 'Part relative (%)', 'Notes de Gestion']],
      body: chargeRows,
      theme: 'striped',
      headStyles: { fillColor: [11, 45, 107], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 62 },
        1: { halign: 'right', fontStyle: 'bold', width: 28 },
        2: { halign: 'right', width: 24 },
        3: { halign: 'right', fontStyle: 'bold', width: 20 },
        4: { textColor: [71, 85, 105], width: 46 }
      },
      didParseCell: function(cellData) {
        if (cellData.row.index === chargeRows.length - 1) {
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 10;

    // Cost Structure Chart image integration
    const canvasCost = document.getElementById('chartCostStructure');
    if (canvasCost && y < 225) {
      try {
        const chartDataUrl = canvasCost.toDataURL('image/png');
        doc.setFontSize(9.5);
        doc.setTextColor(11, 45, 107);
        doc.setFont('helvetica', 'bold');
        doc.text('STRUCTURE FINANCIÈRE DE TRANSFORMATION & MATIÈRES', docWidth / 2, y + 4, { align: 'center' });
        doc.addImage(chartDataUrl, 'PNG', (docWidth - 100) / 2, y + 8, 100, 50);
      } catch (err) {
        console.error("Erreur lors de l'intégration du graphique", err);
      }
    }

    drawFooter(doc, 4);

    // ==========================================
    // PAGE 5 : Performance par Espèce & Mix Produit
    // ==========================================
    doc.addPage();
    drawHeader(doc, "Page 5: Performance Commerciale par Espèce & Mix Produit");

    y = 52;
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VI. ANALYSE COMPARATIVE ET VOLUMÉTRIQUE PAR ESPÈCE', margin, y);

    y += 5;

    const speciesRows = Object.entries(stats.bySpecies).sort((a,b) => b[1]-a[1]).map(([sp, qty]) => {
      const spProd = prod.filter(p => p.espece === sp);
      const spPI = spProd.reduce((s,p) => s + (p.poidsBrutPI || p.poidsMP || 0), 0);
      const spRend = spPI > 0 ? (qty / spPI * 100) : 0;
      const spObj = App.data.especes?.find(e => e.nom === sp);
      const price = spObj?.prixMoyenVente || 65;
      const ca = qty * price;
      return [
        sp,
        App.formatNumber(qty, 0) + ' kg',
        App.formatNumber(spPI, 0) + ' kg',
        App.formatNumber(spRend, 1) + ' %',
        App.formatNumber((qty / stats.totalPoidsPF) * 100, 1) + ' %',
        App.formatNumber(price, 0) + ' DH/kg',
        App.formatNumber(ca, 0) + ' DH'
      ];
    });

    doc.autoTable({
      startY: y,
      head: [['Espèce Poisson', 'Poids PF', 'Poids MP', 'Rendement Real', 'Mix %', 'Prix Vente Moyen', 'CA Estimé (DH)']],
      body: speciesRows,
      theme: 'grid',
      headStyles: { fillColor: [11, 45, 107], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 35 },
        1: { halign: 'right', width: 24 },
        2: { halign: 'right', width: 24 },
        3: { halign: 'right', fontStyle: 'bold', width: 22 },
        4: { halign: 'right', width: 20 },
        5: { halign: 'right', width: 25 },
        6: { halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61], width: 30 }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 12;

    // Mix Species Bar Chart image integration
    const canvasMix = document.getElementById('chartSpeciesMix');
    if (canvasMix && y < 220) {
      try {
        const chartMixDataUrl = canvasMix.toDataURL('image/png');
        doc.setFontSize(9.5);
        doc.setTextColor(11, 45, 107);
        doc.setFont('helvetica', 'bold');
        doc.text('MIX DE PRODUCTION (EN KG PF HAUTE RÉSOLUTION)', docWidth / 2, y + 4, { align: 'center' });
        doc.addImage(chartMixDataUrl, 'PNG', (docWidth - 110) / 2, y + 8, 110, 52);
      } catch (err) {
        console.error("Erreur lors de l'intégration du bar chart", err);
      }
    }

    drawFooter(doc, 5);

    // ==========================================
    // PAGE 6 : Diagnostics d'Audit & Signatures
    // ==========================================
    doc.addPage();
    drawHeader(doc, "Page 6: Moteur d'Audit Expert RCG-HAMZA & Signatures");

    y = 52;
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VII. AXES D\'AUDIT STRATÉGIQUES & PLAN DE RECOMMANDATION', margin, y);

    y += 5;

    const alertRows = [];
    
    // Axis 1: Yield
    if (stats.rendement < 74) {
      alertRows.push([
        'RENDEMENT MATIÈRE',
        'ALERTE ROUGE (CRITIQUE)',
        `Le rendement global (${App.formatNumber(stats.rendement, 2)}%) est inférieur au standard cible de 74%. Gâchis matière critique. Planifiez une surveillance stricte du parage.`
      ]);
    } else {
      alertRows.push([
        'RENDEMENT MATIÈRE',
        'CONFORME & STABLE',
        `Le rendement global de transformation (${App.formatNumber(stats.rendement, 2)}%) respecte les fiches techniques nominales.`
      ]);
    }

    // Axis 2: Labor
    if (stats.productivite < 20) {
      alertRows.push([
        'MAIN-D\'ŒUVRE DIRECTE',
        'OPTIMISATION REQUISE',
        `Productivité horaire (${App.formatNumber(stats.productivite, 2)} kg/h) sous les seuils. Réévaluez la taille des équipes ouvrières d'occasionnels.`
      ]);
    } else {
      alertRows.push([
        'MAIN-D\'ŒUVRE DIRECTE',
        'EFFICIENCE VÉRUSTE',
        `Efficience horaire de parage optimale de ${App.formatNumber(stats.productivite, 2)} kg/h. Respect des fiches de cadencement.`
      ]);
    }

    // Axis 3: Margins
    if (extra.tauxMarge < 15) {
      alertRows.push([
        'RENTABILITÉ FINANCIÈRE',
        'VIGILANCE FINANCIÈRE',
        `Rentabilité de station basse à ${App.formatNumber(extra.tauxMarge, 2)}% (cible >= 15%). Contrôlez les coûts d'emballage unitaire.`
      ]);
    } else {
      alertRows.push([
        'RENTABILITÉ FINANCIÈRE',
        'MARGE CONFORME',
        `La marge nette consolidée est très saine à ${App.formatNumber(extra.tauxMarge, 2)}%, absorption optimale des charges fixes.`
      ]);
    }

    // Axis 4: Losses & Waste
    if (extra.tauxPerte > 26) {
      alertRows.push([
        'PERTES & GÂCHIS MATIÈRE',
        'ALERTE SÉVÈRE',
        `Le taux de pertes physiques est excessif (${App.formatNumber(extra.tauxPerte, 2)}%). Audit obligatoire de la qualité de la marée et du parage.`
      ]);
    } else {
      alertRows.push([
        'PERTES & GÂCHIS MATIÈRE',
        'CONFORME',
        `Perte physique sous contrôle à ${App.formatNumber(extra.tauxPerte, 2)}% du poids de poisson brut engagé.`
      ]);
    }

    doc.autoTable({
      startY: y,
      head: [['Axe d\'Audit', 'Diagnostic Analytique', 'Directives Techniques Correctives']],
      body: alertRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', width: 35 },
        1: { fontStyle: 'bold', width: 40 },
        2: { textColor: [51, 65, 85], width: 105 }
      },
      didParseCell: function(cellData) {
        if (cellData.column.index === 1) {
          if (cellData.cell.raw.includes('ALERTE') || cellData.cell.raw.includes('CRITIQUE')) {
            cellData.cell.styles.textColor = [220, 38, 38];
          } else if (cellData.cell.raw.includes('OPTIMISATION') || cellData.cell.raw.includes('VIGILANCE')) {
            cellData.cell.styles.textColor = [217, 119, 6];
          } else {
            cellData.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 12;

    // Dual Official Signature Blocks with elegant styles
    if (y < 240) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, docWidth - margin, y);
      
      y += 6;
      
      doc.setTextColor(11, 45, 107);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      
      doc.text('DIRECTION D\'EXPLOITATION', margin, y);
      doc.text('CONTRÔLE DE GESTION / CONTRÔLE FINANCIER', docWidth - margin, y, { align: 'right' });
      
      y += 4;
      
      doc.setDrawColor(180, 180, 180);
      doc.setLineDashPattern([2, 2], 0);
      
      // dotted signature boxes
      doc.rect(margin, y, 60, 22);
      doc.rect(docWidth - margin - 60, y, 60, 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text('[ Cachet et Signature Officiels ]', margin + 30, y + 12, { align: 'center' });
      doc.text('[ Cachet et Signature Officiels ]', docWidth - margin - 30, y + 12, { align: 'center' });
    }

    drawFooter(doc, 6);

    // Save the PDF file
    const cleanLabel = label.replace(/[^a-zA-Z0-9_\-]/g, '_');
    doc.save(`Rapport_Performance_Analytique_SP_6P_${cleanLabel}.pdf`);
    App.toast("Rapport d'Audit PDF Expert 6 pages généré avec succès", "success");
  },

  exportExcel() {
    if (typeof XLSX === 'undefined') {
      App.toast("Bibliothèque SheetJS non chargée", "error");
      return;
    }

    if (!this.lastGeneratedData) {
      App.toast("Veuillez d'abord générer un rapport à l'écran", "error");
      return;
    }

    const data = this.lastGeneratedData;
    const stats = data.stats;
    const extra = data.extra;
    const label = data.label;
    const prod = data.prod;

    const wb = XLSX.utils.book_new();

    // Formatteurs de cellule Premium
    const safeVal = (v) => (typeof v === 'number' && !isNaN(v) && isFinite(v)) ? v : 0;
    const num = (val) => ({ v: safeVal(val), t: 'n', z: '#,##0' });
    const kg = (val) => ({ v: safeVal(val), t: 'n', z: '#,##0" kg"' });
    const dh = (val) => ({ v: safeVal(val), t: 'n', z: '#,##0.00" DH"' });
    const pct = (val) => ({ v: safeVal(val), t: 'n', z: '0.0%' });
    const hrs = (val) => ({ v: safeVal(val), t: 'n', z: '#,##0" H"' });
    const kgh = (val) => ({ v: safeVal(val), t: 'n', z: '0.0" kg/h"' });
    const dhkg = (val) => ({ v: safeVal(val), t: 'n', z: '#,##0.00" DH/kg"' });

    // ==========================================
    // SH 1 : TABLEAU DE BORD (SYNTHÈSE)
    // ==========================================
    const summaryRows = [
      ['SEA PECHE / ELABBAR — SYSTEME D\'AUDIT OPÉRATIONNEL & FINANCIER'],
      ['Période d\'Analyse :', label],
      ['Date d\'Édition :', new Date().toLocaleString('fr-FR')],
      ['ID du Rapport :', 'REP-XL-' + Math.floor(Math.random() * 90000 + 10000)],
      [],
      ['========================================================================================'],
      ['AXE ANALYTIQUE', 'INDICATEUR DE GESTION', 'VALEUR', 'UNITÉ', 'DIAGNOSTIC & COMMENTAIRE EXÉCUTIF'],
      ['========================================================================================'],
      ['Volumes Physiques', 'Production Totale (PF)', kg(stats.totalPoidsPF), 'kg', 'Volume net traité et emballé.'],
      ['Volumes Physiques', 'Matière Première Engagée (MP)', kg(stats.totalPoidsPI), 'kg', 'Volume brut de poisson engagé.'],
      ['Volumes Physiques', 'Rendement Industriel Global', pct(stats.rendement / 100), '%', stats.rendement >= 74 ? 'Rendement optimal et conforme aux objectifs.' : 'Alerte Rendement: Rendement inférieur aux cibles.'],
      ['Volumes Physiques', 'Pertes & Déchets Totaux', kg(extra.totalPerte), 'kg', 'Pertes physiques de coupe.'],
      ['Volumes Physiques', 'Taux de Perte Brut', pct(extra.tauxPerte / 100), '%', extra.tauxPerte <= 26 ? 'Niveau de gâchis matière sous contrôle.' : 'Alerte Pertes: Excès de pertes matière.'],
      ['Efficacité MO', 'Productivité Horaire MO', kgh(stats.productivite), 'kg/h', stats.productivite >= 20 ? 'Productivité horaire satisfaisante.' : 'Alerte Productivité: Efficacité horaire faible.'],
      ['Efficacité MO', 'Total Heures Travaillées', hrs(stats.totalHeures), 'H', 'Cumul des heures de travail des ouvriers.'],
      ['Efficacité MO', 'Coût Variable de la MO', dh(stats.totalCoutMO), 'DH', 'Quote-part des salaires variables directes.'],
      ['Efficacité MO', 'Coût MO par kg Produit Fini', dhkg(stats.totalCoutMO / stats.totalPoidsPF), 'DH/kg PF', 'Rapport direct salaires variables / volume PF.'],
      ['Performance Commerciale', 'Chiffre d\'Affaires Commercial Estimé', dh(extra.totalCA), 'DH', 'Valorisation commerciale des ventes.'],
      ['Performance Commerciale', 'Coût Achat Matière Première (Poisson)', dh(extra.totalCoutMP), 'DH', 'Valorisation d\'achat estimée.'],
      ['Performance Commerciale', 'Marge Commerciale Brute', dh(extra.margeBrute), 'DH', 'Marge brute dégagée.'],
      ['Performance Commerciale', 'Taux de Marge Commerciale Brute', pct(extra.tauxMargeBrute / 100), '%', 'Performance commerciale brute unitaire.'],
      ['Performance Industrielle', 'Frais Directs de Transformation', dh(extra.fullDirectCost), 'DH', 'Main d\'œuvre + Emballages + Énergie + Fixes.'],
      ['Performance Industrielle', 'PRU Global Consolidé', dh(extra.coutRevientTotal), 'DH', 'Poisson brute + Frais de transformation.'],
      ['Performance Industrielle', 'PRU Unitaire de Production', dhkg(extra.costPerKg), 'DH/kg PF', 'Coût de revient d\'un kilogramme de produit fini.'],
      ['Rentabilité d\'Exploitation', 'Marge Nette Opérationnelle de la Station', dh(extra.margeNette), 'DH', extra.margeNette >= 0 ? 'Résultat opérationnel bénéficiaire.' : 'Déficit opérationnel enregistré.'],
      ['Rentabilité d\'Exploitation', 'Marge Nette par kg de Produit Fini', dhkg(extra.margeParKg), 'DH/kg PF', 'Contribution nette d\'un kg de PF.'],
      ['Rentabilité d\'Exploitation', 'Taux de Marge Nette d\'Exploitation', pct(extra.tauxMarge / 100), '%', extra.tauxMarge >= 15 ? 'Rentabilité nette sécurisée.' : 'Vigilance: Profitabilité opérationnelle basse.']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Synthèse & KPI");

    // ==========================================
    // SH 2 : COMPTE DE RÉSULTAT (P&L)
    // ==========================================
    const plRows = [
      ['SEA PECHE / ELABBAR — COMPTE DE RÉSULTAT OPÉRATIONNEL ANALYTIQUE (P&L)'],
      ['Période d\'Analyse :', label],
      [],
      ['========================================================================================'],
      ['POSTE DU COMPTE DE RÉSULTAT', 'VALEUR GLOBALE (DH)', 'INCIDENCE UNITAIRE (DH/KG PF)', 'RATIO SUR CA (%)', 'ANALYSE DU CONTRÔLE DE GESTION'],
      ['========================================================================================'],
      ['Chiffre d\'Affaires Commercial Estimé', dh(extra.totalCA), dhkg(extra.avgSellingPrice), pct(1.0), 'Valorisation commerciale théorique.'],
      ['Moins : Achat Matière Première (Poisson)', dh(extra.totalCoutMP), dhkg(extra.unitPurchaseCost), pct(extra.totalCoutMP / extra.totalCA), 'Coût d\'achat poisson brute.'],
      ['----------------------------------------------------------------------------------------'],
      ['MARGE BRUTE MATIÈRE / COMMERCIALE', dh(extra.margeBrute), dhkg(extra.margeBrute / stats.totalPoidsPF), pct(extra.tauxMargeBrute / 100), 'Rentabilité commerciale de base.'],
      ['Moins : Coût direct de main-d\'œuvre variable', dh(stats.totalCoutMO), dhkg(stats.totalCoutMO / stats.totalPoidsPF), pct(stats.totalCoutMO / extra.totalCA), 'Salaires temporaires directes.'],
      ['Moins : Consommables direct, emballages, cartons', dh(stats.totalCoutEmballage), dhkg(stats.totalCoutEmballage / stats.totalPoidsPF), pct(stats.totalCoutEmballage / extra.totalCA), 'Cartons et sachets réels.'],
      ['Moins : Coût estimé d\'énergie industrielle (Fluides)', dh(extra.energy), dhkg(extra.energy / stats.totalPoidsPF), pct(extra.energy / extra.totalCA), 'Quote-part d\'électricité de congélation.'],
      ['Moins : Charges Fixes de Structure Proratisées', dh(extra.totalFixed), dhkg(extra.totalFixed / stats.totalPoidsPF), pct(extra.totalFixed / extra.totalCA), 'Charges fixes et structurelles.'],
      ['----------------------------------------------------------------------------------------'],
      ['MARGE OPÉRATIONNELLE NETTE DE LA STATION', dh(extra.margeNette), dhkg(extra.margeParKg), pct(extra.tauxMarge / 100), 'Marge nette finale dégagée.']
    ];

    const wsPL = XLSX.utils.aoa_to_sheet(plRows);
    wsPL['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsPL, "Compte de Résultat (P&L)");

    // ==========================================
    // SH 3 : STRUCTURE DES COÛTS
    // ==========================================
    const costRows = [
      ['ANALYSE DÉTAILLÉE DE LA STRUCTURE DES CHARGES DE PRODUCTION'],
      ['Période d\'Analyse :', label],
      [],
      ['========================================================================================'],
      ['NATURE DE LA CHARGE D\'EXPLOITATION', 'MONTANT GLOBAL (DH)', 'INCIDENCE UNITAIRE (DH/KG PF)', 'PART RELATIVE (%)'],
      ['========================================================================================'],
      ['Achat Matière Première (Poisson engagé)', dh(extra.totalCoutMP), dhkg(extra.unitPurchaseCost), pct(extra.totalCoutMP / extra.coutRevientTotal)],
      ['Main-d\'œuvre Directe (Proratisée Fixe + Occ.)', dh(stats.totalCoutMO), dhkg(stats.totalCoutMO / stats.totalPoidsPF), pct(stats.totalCoutMO / extra.coutRevientTotal)],
      ['Consommables & Emballages (Réels Saisis)', dh(stats.totalCoutEmballage), dhkg(stats.totalCoutEmballage / stats.totalPoidsPF), pct(stats.totalCoutEmballage / extra.coutRevientTotal)],
      ['Énergie & Fluides (Estimation Industrielle)', dh(extra.energy), dhkg(extra.energy / stats.totalPoidsPF), pct(extra.energy / extra.coutRevientTotal)],
      ['Charges Fixes de Structure Absorbées', dh(extra.totalFixed), dhkg(extra.totalFixed / stats.totalPoidsPF), pct(extra.totalFixed / extra.coutRevientTotal)],
      ['----------------------------------------------------------------------------------------'],
      ['TOTAL COÛT DE REVIENT DE PRODUCTION GLOBAL', dh(extra.coutRevientTotal), dhkg(extra.costPerKg), pct(1.0)]
    ];

    const wsCosts = XLSX.utils.aoa_to_sheet(costRows);
    wsCosts['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsCosts, "Structure des Coûts");

    // ==========================================
    // SH 4 : PERFORMANCE ESPÈCES
    // ==========================================
    const specRows = [
      ['PERFORMANCE ET RENTABILITÉ COMPARATIVE PAR ESPÈCE DE POISSON'],
      ['Période d\'Analyse :', label],
      [],
      ['================================================================================================================================'],
      ['ESPÈCE TRAITÉE', 'POIDS NET PF (KG)', 'POIDS BRUT MP (KG)', 'RENDEMENT INDUSTRIEL (%)', 'MIX DE PRODUCTION (%)', 'PRIX MOYEN VENTE (DH/KG)', 'CHIFFRE D\'AFFAIRES ESTIMÉ (DH)'],
      ['================================================================================================================================'],
    ];

    Object.entries(stats.bySpecies).sort((a,b) => b[1]-a[1]).forEach(([sp, qty]) => {
      const spProd = prod.filter(p => p.espece === sp);
      const spPI = spProd.reduce((s,p) => s + (p.poidsBrutPI || p.poidsMP || 0), 0);
      const spRend = spPI > 0 ? (qty / spPI) : 0;
      const spObj = App.data.especes?.find(e => e.nom === sp);
      const price = spObj?.prixMoyenVente || 65;
      const ca = qty * price;

      specRows.push([
        sp,
        kg(qty),
        kg(spPI),
        pct(spRend),
        pct(qty / stats.totalPoidsPF),
        dhkg(price),
        dh(ca)
      ]);
    });

    const wsSpecies = XLSX.utils.aoa_to_sheet(specRows);
    wsSpecies['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(wb, wsSpecies, "Performance Espèces");

    // ==========================================
    // SH 5 : ÉVOLUTION INDUSTRIELLE QUOTIDIENNE
    // ==========================================
    const dailyData = {};
    prod.forEach(p => {
      if (!p.date) return;
      if (!dailyData[p.date]) {
        dailyData[p.date] = { mp: 0, pf: 0, hours: 0, costMO: 0, lotCount: 0 };
      }
      dailyData[p.date].mp += p.poidsMP || p.poidsBrutPI || 0;
      dailyData[p.date].pf += p.poidsBrutPF || p.poidsPF || 0;
      dailyData[p.date].hours += p.heuresMOO || 0;
      dailyData[p.date].costMO += p.coutMOO || 0;
      dailyData[p.date].lotCount += 1;
    });

    const dailyRows = [
      ['SEA PECHE / ELABBAR — ACTIVITÉ OPÉRATIONNELLE ET RENDEMENT QUOTIDIEN'],
      ['Période d\'Analyse :', label],
      [],
      ['================================================================================================================================'],
      ['DATE DE LA JOURNÉE', 'NOMBRE DE LOTS', 'POIDS BRUT MP (KG)', 'POIDS NET PF (KG)', 'RENDEMENT INDUSTRIEL (%)', 'HEURES DIRECTES WORKED (H)', 'COÛT MO VARIABLE (DH)', 'PRODUCTIVITÉ HORAIRE (KG/H)'],
      ['================================================================================================================================']
    ];

    Object.entries(dailyData).sort((a,b) => a[0].localeCompare(b[0])).forEach(([date, dayStats]) => {
      const rend = dayStats.mp > 0 ? (dayStats.pf / dayStats.mp) : 0;
      const prodMO = dayStats.hours > 0 ? (dayStats.pf / dayStats.hours) : 0;
      dailyRows.push([
        date,
        num(dayStats.lotCount),
        kg(dayStats.mp),
        kg(dayStats.pf),
        pct(rend),
        hrs(dayStats.hours),
        dh(dayStats.costMO),
        kgh(prodMO)
      ]);
    });

    const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
    wsDaily['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 25 }, { wch: 28 }, { wch: 25 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsDaily, "Suivi Quotidien");

    // ==========================================
    // SH 6 : LOG DES LOTS DE PRODUCTION DE BRUT
    // ==========================================
    const rawRows = [
      ['LOT DE PRODUCTION DÉTAILLÉ (EXTRACT BRUT CONTROLE)'],
      ['Période d\'Analyse :', label],
      [],
      ['================================================================================================================================'],
      ['DATE SAISIE', 'N° DE LOT INTERNE', 'ESPÈCE POISSON', 'TYPE PRODUIT FINI', 'POIDS BRUT MP (KG)', 'POIDS NET PF (KG)', 'RENDEMENT (%)', 'HEURES MO VARIABLE (H)', 'COÛT MO VARIABLE (DH)', 'SAISI PAR / OPÉRATEUR'],
      ['================================================================================================================================'],
    ];

    prod.forEach(p => {
      const mp = p.poidsMP || p.poidsBrutPI || 0;
      const pf = p.poidsBrutPF || p.poidsPF || 0;
      const rend = mp > 0 ? (pf / mp) : 0;

      rawRows.push([
        p.date || '',
        p.lotInterne || '',
        p.espece || '',
        p.produit || '',
        kg(mp),
        kg(pf),
        pct(rend),
        hrs(p.heuresMOO || 0),
        dh(p.coutMOO || 0),
        p.chargeDeSaisie || p.operateur || ''
      ]);
    });

    const wsRaw = XLSX.utils.aoa_to_sheet(rawRows);
    wsRaw['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
      { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 22 },
      { wch: 22 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRaw, "Données Brutes");

    // Save workbook
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Rapport_Controle_Gestion_SP_6S_${dateStr}.xlsx`);
    App.toast("Classeur Excel Expert 6 onglets exporté avec succès", "success");
  },

  charts: {},

  initCharts(stats, extra) {
    if (typeof Chart === 'undefined') return;
    
    // Cleanup previous charts
    if (this.charts.cost) this.charts.cost.destroy();
    if (this.charts.mix) this.charts.mix.destroy();

    const ctxCost = document.getElementById('chartCostStructure');
    if (ctxCost) {
      this.charts.cost = new Chart(ctxCost, {
        type: 'doughnut',
        data: {
          labels: ['Main d\'œuvre', 'Emballages', 'Énergie', 'Charges Fixes'],
          datasets: [{
            data: [stats.totalCoutMO, stats.totalCoutEmballage, extra.energy, extra.totalFixed],
            backgroundColor: ['#0B2D6B', '#2563FF', '#00CFE8', '#8E24AA'],
            hoverOffset: 12,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10, family: 'Inter' }, usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (item) => ` ${item.label}: ${App.formatNumber(item.raw, 0)} DH`
              }
            }
          },
          cutout: '72%'
        }
      });
    }

    const ctxMix = document.getElementById('chartSpeciesMix');
    if (ctxMix) {
      const labels = Object.keys(stats.bySpecies);
      const values = Object.values(stats.bySpecies);
      this.charts.mix = new Chart(ctxMix, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Production (kg)',
            data: values,
            backgroundColor: 'rgba(37, 99, 255, 0.75)',
            hoverBackgroundColor: 'rgba(37, 99, 255, 1)',
            borderRadius: 8,
            maxBarThickness: 38
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 } } },
            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
          }
        }
      });
    }
  }
};
