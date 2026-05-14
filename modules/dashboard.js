/* ============================================
   DASHBOARD — Tableau de bord RCG-HAMZA
   ============================================ */
const Dashboard = {
  render() {
    const prod = App.getCurrentMonthProduction();
    const alerts = App.getAlerts();
    const stats = this.calcStats(prod);
    const stockStats = this.calcStockStats();
    const content = document.getElementById('pageContent');

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

    const now = new Date();
    const moisNom = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    content.innerHTML = `
      <div class="fade-in">
        ${alertsHtml}

        <!-- Hero Welcome Section with Cinematic Video -->
        <div class="card" style="margin-bottom:32px; border:none; overflow:hidden; position:relative; min-height:280px; border-radius: var(--radius-xl); box-shadow: var(--shadow-float);">
          <video autoplay muted loop playsinline style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; filter: brightness(0.65);">
            <source src="Cinematic_satellite_zoom_in_.mp4" type="video/mp4">
          </video>
          <div style="position:relative; z-index:1; padding:40px; background:linear-gradient(90deg, rgba(11, 45, 107, 0.85) 0%, rgba(11, 45, 107, 0) 100%); min-height:280px; display:flex; flex-direction:column; justify-content:center;">
            <h2 style="font-size:2.4rem; font-weight:800; color:white; margin-bottom:12px; font-family:'Poppins', sans-serif; text-shadow: 0 4px 15px rgba(0,0,0,0.5); letter-spacing:-1px;">SEA PECHE ERP</h2>
            <p style="color:rgba(255,255,255,0.95); font-size:1.2rem; max-width:550px; margin-bottom:28px; line-height:1.4; font-weight:500;">Propulsez votre station de conditionnement vers l'excellence. <br><span style="color:var(--accent-color); font-weight:700;">Performance</span> • <span style="color:var(--accent-color); font-weight:700;">Contrôle</span> • <span style="color:var(--accent-color); font-weight:700;">Innovation</span></p>
            <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
               <div style="background:rgba(255,255,255,0.1); backdrop-filter:blur(15px); padding:10px 20px; border-radius:40px; border:1px solid rgba(255,255,255,0.25); color:white; font-size:0.95rem; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
                 📅 ${moisNom.charAt(0).toUpperCase() + moisNom.slice(1)}
               </div>
               <button class="btn btn-primary" onclick="App.navigate('saisie')" style="padding:14px 28px; font-size:1rem; box-shadow: 0 10px 25px rgba(37, 99, 255, 0.4);">
                 <span>🚀 Saisie Journalière</span>
               </button>
               <button class="btn btn-outline" onclick="Dashboard.printDashboard()" style="padding:14px 24px; border-color:white; color:white; background:rgba(255,255,255,0.1); backdrop-filter:blur(10px);">
                 <span>🖨️ Rapport Flash</span>
               </button>
            </div>
          </div>
        </div>


        <!-- KPI Row 1: Production -->
        <div class="kpi-grid">
          <div class="kpi-card purple">
            <div class="kpi-icon purple">🏭</div>
            <div class="kpi-label">Production PF totale</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.totalPoidsPF}" data-decimals="0">0</span><span class="kpi-unit">kg</span></div>
            <div class="kpi-change">${prod.length} jours de production</div>
          </div>
          <div class="kpi-card blue">
            <div class="kpi-icon blue">📥</div>
            <div class="kpi-label">Réceptions du mois</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stockStats.nbReceptions}" data-decimals="0">0</span></div>
            <div class="kpi-change">${App.formatNumber(stockStats.totalPoidsRecu, 0)} kg reçus</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-icon green">📊</div>
            <div class="kpi-label">Rendement global</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.rendement}" data-decimals="1">0</span><span class="kpi-unit">%</span></div>
            <div class="kpi-change ${stats.rendement >= 80 ? 'up' : 'down'}">${stats.rendement >= 80 ? '↑ Bon rendement' : '↓ À surveiller'}</div>
          </div>
          <div class="kpi-card cyan">
            <div class="kpi-icon cyan">⚡</div>
            <div class="kpi-label">Productivité</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.productivite}" data-decimals="1">0</span><span class="kpi-unit">kg/h</span></div>
            <div class="kpi-change ${stats.productivite >= 15 ? 'up' : 'down'}">${stats.productivite >= 15 ? '↑ Objectif atteint' : '↓ Objectif: 15 kg/h'}</div>
          </div>
        </div>

        <!-- KPI Row 2: Coûts & Stock -->
        <div class="kpi-grid">
          <div class="kpi-card yellow">
            <div class="kpi-icon yellow">💰</div>
            <div class="kpi-label">Coût M.O. Total</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.totalCoutMO}" data-decimals="0">0</span><span class="kpi-unit">DH</span></div>
            <div class="kpi-change">${App.formatNumber(stats.coutMOParKg, 2)} DH/kg</div>
          </div>
          <div class="kpi-card red">
            <div class="kpi-icon red">📦</div>
            <div class="kpi-label">Coût Direct / kg</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stats.coutDirectParKg}" data-decimals="2">0</span><span class="kpi-unit">DH</span></div>
            <div class="kpi-change">M.O. + Emballage</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-icon green">🐟</div>
            <div class="kpi-label">Espèces traitées</div>
            <div class="kpi-value"><span class="animate-num" data-target="${Object.keys(stats.bySpecies).length}" data-decimals="0">0</span></div>
            <div class="kpi-change">${Object.keys(stats.bySpecies).slice(0, 3).join(', ') || 'Aucune'}</div>
          </div>
          <div class="kpi-card cyan">
            <div class="kpi-icon cyan">❄️</div>
            <div class="kpi-label">Lots en stock froid</div>
            <div class="kpi-value"><span class="animate-num" data-target="${stockStats.lotsEnStock}" data-decimals="0">0</span></div>
            <div class="kpi-change">${App.formatNumber(stockStats.poidsEnStock, 0)} kg en chambre</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="card">
            <div class="card-header wave-header"><span class="card-title">📈 Production journalière (kg PF)</span></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartProdJour"></canvas></div></div>
          </div>
          <div class="card">
            <div class="card-header wave-header"><span class="card-title">🐟 Répartition par espèce</span></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartEspece"></canvas></div></div>
          </div>
          <div class="card">
            <div class="card-header wave-header"><span class="card-title">💼 Structure des coûts</span></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartCouts"></canvas></div></div>
          </div>
          <div class="card">
            <div class="card-header wave-header"><span class="card-title">📉 Évolution productivité (kg/h)</span></div>
            <div class="card-body"><div class="chart-container"><canvas id="chartProductivite"></canvas></div></div>
          </div>
        </div>

        <!-- Recent entries -->
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
      </div>
    `;

    this.renderCharts(prod, stats);
    this.animateNumbers();
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
    
    // NOUVEAU : Récupérer depuis le système de pointage (Mois en cours)
    const now = new Date();
    const ptgStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ptg = App.data.pointage && App.data.pointage[ptgStr] ? App.data.pointage[ptgStr] : null;

    let totalHeures = 0, totalCoutMOO = 0, totalCoutMOF = 0, totalHeuresTotales = 0;
    
    if (ptg) {
      totalHeures = ptg.totalHeuresOcc || 0;
      totalCoutMOO = ptg.totalMontantOcc || 0;
      totalCoutMOF = ptg.totalSalairesOuvriersFixe || 0;
      totalHeuresTotales = totalHeures + (ptg.totalHeuresOuvriersFixe || 0);
    } else {
      totalHeures = prod.reduce((s, p) => s + (p.heuresMOO || 0), 0);
      totalCoutMOO = prod.reduce((s, p) => s + (p.coutMOO || 0), 0);
      totalCoutMOF = prod.reduce((s, p) => s + (p.coutPersonnelF || 0), 0);
      totalHeuresTotales = totalHeures + prod.reduce((s, p) => s + (p.heuresMOF || 0), 0);
    }
    
    const totalCoutMO = totalCoutMOO + totalCoutMOF;
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
    const totalPoidsRecu = monthEntries.reduce((s, e) => s + e.lignes.reduce((ss, l) => ss + (l.pdsNetTotal || 0), 0), 0);

    let lotsEnStock = 0;
    let poidsEnStock = 0;
    entries.forEach(e => {
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
    });

    return { nbReceptions, totalPoidsRecu, lotsEnStock, poidsEnStock };
  },

  renderRecentTable(prod) {
    const recent = [...prod].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    if (recent.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Aucune saisie ce mois</div><div style="color:var(--text-muted);">Commencez par ajouter une saisie journalière</div></div>`;
    }
    return `<table>
      <thead><tr><th>Date</th><th>Activité</th><th>Espèce</th><th>Calibre</th><th class="td-right">Poids PI</th><th class="td-right">Poids PF</th><th class="td-right">Heures M.O.</th><th class="td-right">Coût Total</th></tr></thead>
      <tbody>${recent.map(p => {
        const act = p.activite === 'traitement' ? '🔧 Trait.' : p.activite === 'divers' ? '📋 Div.' : '📦 Recond.';
        const coutEmb = (p.coutCarton||0)+(p.coutSachet||0)+(p.coutEtiquetteNoir||0)+(p.coutEtiquette5075||0)+(p.coutScotch||0);
        const coutTotal = (p.coutMOJ||0)+coutEmb+(p.totalIntrants||0);
        return `<tr>
        <td>${App.formatDateFR(p.date)}</td>
        <td><span class="badge badge-info">${act}</span></td>
        <td><span class="badge badge-purple">${p.espece || '-'}</span></td>
        <td>${p.calibre || '-'}</td>
        <td class="td-right">${App.formatNumber(p.poidsBrutPI || p.poidsMP || 0, 1)}</td>
        <td class="td-right td-bold">${App.formatNumber(p.poidsBrutPF, 1)}</td>
        <td class="td-right">${App.formatNumber((p.heuresMOO || 0) + (p.heuresMOF || 0), 1)}</td>
        <td class="td-right td-bold">${App.formatNumber(coutTotal, 0)} DH</td>
      </tr>`}).join('')}</tbody>
    </table>`;
  },

  printDashboard() {
    window.print();
  },

  renderCharts(prod, stats) {
    App.destroyCharts();
    const colors = ['#2563FF', '#16C784', '#F5A623', '#FF4D4F', '#4DA3FF', '#7B61FF', '#0B2D6B', '#10B981'];
    const ctxProd = document.getElementById('chartProdJour').getContext('2d');
    const gradProd = ctxProd.createLinearGradient(0, 0, 0, 400);
    gradProd.addColorStop(0, 'rgba(37, 99, 255, 0.8)');
    gradProd.addColorStop(1, 'rgba(37, 99, 255, 0.1)');

    const ctxProdLine = document.getElementById('chartProductivite').getContext('2d');
    const gradLine = ctxProdLine.createLinearGradient(0, 0, 0, 400);
    gradLine.addColorStop(0, 'rgba(22, 199, 132, 0.5)');
    gradLine.addColorStop(1, 'rgba(22, 199, 132, 0.0)');

    const tooltipOptions = {
      backgroundColor: '#FFFFFF',
      titleColor: '#0B2D6B',
      bodyColor: '#334155',
      borderColor: '#E5EAF2',
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      boxPadding: 4
    };

    // Production by day
    const byDay = {};
    prod.forEach(p => {
      const d = App.formatDateFR(p.date);
      byDay[d] = (byDay[d] || 0) + (p.poidsBrutPF || 0);
    });
    const dayLabels = Object.keys(byDay);
    if (dayLabels.length > 0) {
      new Chart(ctxProd, {
        type: 'bar',
        data: { labels: dayLabels, datasets: [{ label: 'Poids PF (kg)', data: Object.values(byDay), backgroundColor: gradProd, borderColor: '#2563FF', borderWidth: 1, borderRadius: 6, hoverBackgroundColor: '#4DA3FF' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipOptions }, scales: { x: { ticks: { color: '#64748B', maxRotation: 45 }, grid: { color: '#E5EAF2', display: false } }, y: { ticks: { color: '#64748B' }, grid: { color: '#E5EAF2' } } }, animation: { duration: 1500, easing: 'easeOutQuart' } }
      });
    }

    // By species
    const speciesLabels = Object.keys(stats.bySpecies);
    if (speciesLabels.length > 0) {
      new Chart(document.getElementById('chartEspece'), {
        type: 'doughnut',
        data: { labels: speciesLabels, datasets: [{ data: Object.values(stats.bySpecies), backgroundColor: colors.slice(0, speciesLabels.length), borderWidth: 0, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#334155', padding: 12, font: { size: 11 } } }, tooltip: tooltipOptions }, cutout: '70%', animation: { animateScale: true, animateRotate: true, duration: 1500 } }
      });
    }

    // Costs
    const costData = [stats.totalCoutMO, stats.totalCoutEmballage];
    if (costData.some(v => v > 0)) {
      new Chart(document.getElementById('chartCouts'), {
        type: 'pie',
        data: { labels: ['Main-d\'œuvre', 'Emballage'], datasets: [{ data: costData, backgroundColor: ['#2563FF', '#F5A623'], borderWidth: 0, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#334155', padding: 12 } }, tooltip: tooltipOptions }, animation: { animateScale: true, animateRotate: true, duration: 1500 } }
      });
    }

    // Productivity over days
    const prodByDay = {};
    prod.forEach(p => {
      const d = App.formatDateFR(p.date);
      if (!prodByDay[d]) prodByDay[d] = { poids: 0, heures: 0 };
      prodByDay[d].poids += (p.poidsBrutPF || 0);
      prodByDay[d].heures += (p.heuresMOO || 0) + (p.heuresMOF || 0);
    });
    const prodLabels = Object.keys(prodByDay);
    const prodValues = prodLabels.map(d => prodByDay[d].heures > 0 ? prodByDay[d].poids / prodByDay[d].heures : 0);
    if (prodLabels.length > 0) {
      new Chart(ctxProdLine, {
        type: 'line',
        data: { labels: prodLabels, datasets: [
          { label: 'Productivité (kg/h)', data: prodValues, borderColor: '#16C784', backgroundColor: gradLine, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#16C784', pointHoverRadius: 6 },
          { label: 'Objectif (15 kg/h)', data: prodLabels.map(() => 15), borderColor: 'rgba(255, 77, 79, 0.5)', borderDash: [5,5], pointRadius: 0, fill: false }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#334155' } }, tooltip: tooltipOptions }, scales: { x: { ticks: { color: '#64748B', maxRotation: 45 }, grid: { color: '#E5EAF2', display: false } }, y: { ticks: { color: '#64748B' }, grid: { color: '#E5EAF2' } } }, animation: { duration: 1500, easing: 'easeOutQuart' } }
      });
    }
  }
};
