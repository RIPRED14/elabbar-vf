/* ============================================
   RAPPORTS — Génération automatique
   ============================================ */
const Rapports = {
  view: 'monthly', // 'monthly' ou 'daily'
  selectedDate: new Date().toISOString().split('T')[0],

  render() {
    const content = document.getElementById('pageContent');
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ 
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 
        label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) 
      });
    }

    content.innerHTML = `
      <div class="fade-in">
        <div class="dashboard-header-premium">
          <div class="dashboard-title-area">
            <nav class="breadcrumb-nav">
              <span>Analytique</span>
              <span>/</span>
              <span class="active">Rapports Experts</span>
            </nav>
            <h1 class="page-title">Intelligence Opérationnelle</h1>
            <p class="text-muted">Génération de rapports certifiés pour le contrôle de gestion senior</p>
          </div>
          
          <div class="dashboard-controls-glass">
            <div class="view-switcher">
              <button class="btn-switch ${this.view === 'monthly' ? 'active' : ''}" onclick="Rapports.switchView('monthly')">Mensuel</button>
              <button class="btn-switch ${this.view === 'daily' ? 'active' : ''}" onclick="Rapports.switchView('daily')">Quotidien</button>
            </div>
            
            <div class="date-picker-wrapper">
              ${this.view === 'monthly' ? `
                <select class="input-premium" id="rapportMois" onchange="Rapports.changeMonth(this.value)">
                  ${months.map((m,i) => `<option value="${m.value}" ${i===0?'selected':''}>${m.label}</option>`).join('')}
                </select>
              ` : `
                <input type="date" value="${this.selectedDate}" onchange="Rapports.changeDate(this.value)" class="input-premium">
              `}
            </div>

            <button class="btn btn-primary" onclick="Rapports.generate()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7m9-9-9 9-4-4"/></svg>
              <span>Calculer</span>
            </button>
          </div>
        </div>

        <div id="rapportContent">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">Veuillez lancer le calcul pour générer l'analyse.</div>
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
    // Just re-render if needed, or keep value
  },

  changeDate(v) {
    this.selectedDate = v;
  },

  generate() {
    let prod = [];
    let label = "";
    
    if (this.view === 'monthly') {
      const monthVal = document.getElementById('rapportMois').value.split('-');
      const year = parseInt(monthVal[0]);
      const month = parseInt(monthVal[1]) - 1;
      prod = App.getMonthProduction(year, month);
      label = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else {
      prod = App.data.production.filter(p => p.date === this.selectedDate);
      label = new Date(this.selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    if (prod.length === 0) {
      document.getElementById('rapportContent').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">Aucune donnée de production trouvée pour cette période.</div>
        </div>`;
      return;
    }

    // Calcul des statistiques harmonisé avec Dashboard
    // On force le contexte de Dashboard pour calcStats
    const oldView = Dashboard.view;
    const oldDate = Dashboard.selectedDate;
    Dashboard.view = this.view;
    Dashboard.selectedDate = this.selectedDate;
    
    const stats = Dashboard.calcStats(prod);
    
    // Restaurer le contexte Dashboard
    Dashboard.view = oldView;
    Dashboard.selectedDate = oldDate;

    const alloc = App.getFinancialAllocation(this.view === 'daily' ? this.selectedDate : prod[0].date);
    
    // Additional report-specific calcs
    const energy = stats.totalPoidsPF * 0.15 * alloc.avgTariff;
    const totalFixed = this.view === 'monthly' ? (alloc.dailyFixed * 26) : alloc.dailyFixed;
    const fullDirectCost = stats.totalCoutMO + stats.totalCoutEmballage + energy + totalFixed;
    const costPerKg = stats.totalPoidsPF > 0 ? fullDirectCost / stats.totalPoidsPF : 0;

    // Calcul des tendances
    const trend = this.calcTrends(stats, costPerKg);

    this.renderReportPreview(prod, stats, label, { energy, totalFixed, fullDirectCost, costPerKg, trend });
    
    // Initialiser les graphiques après le rendu
    setTimeout(() => this.initCharts(stats, { energy, totalFixed, fullDirectCost }), 100);
  },

  calcTrends(currentStats, currentCost) {
    let prevProd = [];
    if (this.view === 'monthly') {
      const monthVal = document.getElementById('rapportMois').value.split('-');
      const d = new Date(parseInt(monthVal[0]), parseInt(monthVal[1]) - 2, 1);
      prevProd = App.getMonthProduction(d.getFullYear(), d.getMonth());
    } else {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 1);
      const prevDate = d.toISOString().split('T')[0];
      prevProd = App.data.production.filter(p => p.date === prevDate);
    }

    if (prevProd.length === 0) return null;

    const prevStats = Dashboard.calcStats(prevProd);
    const prevAlloc = App.getFinancialAllocation(prevProd[0].date);
    const prevEnergy = prevStats.totalPoidsPF * 0.15 * prevAlloc.avgTariff;
    const prevFixed = this.view === 'monthly' ? (prevAlloc.dailyFixed * 26) : prevAlloc.dailyFixed;
    const prevTotal = prevStats.totalCoutMO + prevStats.totalCoutEmballage + prevEnergy + prevFixed;
    const prevCostPerKg = prevStats.totalPoidsPF > 0 ? prevTotal / prevStats.totalPoidsPF : 0;

    return {
      prod: ((currentStats.totalPoidsPF - prevStats.totalPoidsPF) / prevStats.totalPoidsPF) * 100,
      rend: currentStats.rendement - prevStats.rendement,
      cost: ((currentCost - prevCostPerKg) / prevCostPerKg) * 100
    };
  },

  renderReportPreview(prod, stats, label, extra) {
    const container = document.getElementById('rapportContent');
    
    container.innerHTML = `
      <div class="report-preview-container slide-up">
        <div class="report-toolbar">
          <div class="report-info">
            <span class="badge badge-accent" style="background: var(--accent-blue); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">ANALYSE CERTIFIÉE</span>
            <strong style="font-size: 1.1rem; color: var(--primary-color);">Rapport de Performance : ${label}</strong>
          </div>
          <div class="report-actions" style="display: flex; gap: 12px;">
            <button class="btn btn-outline btn-sm" onclick="Rapports.exportExcel()" style="display: flex; align-items: center; gap: 8px;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
               <span>Excel Expert</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="Rapports.exportPDF()" style="display: flex; align-items: center; gap: 8px; background: var(--primary-color); color: white;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
               <span>Exporter PDF</span>
            </button>
          </div>
        </div>

        <div class="report-sheet card fade-in">
          <div class="report-header-internal">
            <div class="company-brand">
              <div class="logo-placeholder">SP</div>
              <div>
                <h2 style="margin:0; font-size: 1.5rem; letter-spacing: -0.5px;">SEA PECHE / ELABBAR</h2>
                <p style="margin:0; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Unité de Traitement & Conditionnement</p>
              </div>
            </div>
            <div class="report-meta">
              <p style="margin:0; font-weight: 600; color: var(--primary-color);">Rapport Analytique #${Math.floor(Math.random()*9000)+1000}</p>
              <p style="margin:0;">Édité le : ${new Date().toLocaleString('fr-FR')}</p>
              <p style="margin:0;">Période : <strong>${label}</strong></p>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-title">I. RÉSUMÉ EXÉCUTIF DES KPI</h3>
            <div class="kpi-grid-report">
              <div class="kpi-card-mini shimmer">
                <span class="label">Production Totale</span>
                <span class="value">
                  ${App.formatNumber(stats.totalPoidsPF, 1)} <small style="font-size: 0.8rem;">kg</small>
                  ${extra.trend ? `
                    <span class="trend-indicator ${extra.trend.prod >= 0 ? 'trend-up' : 'trend-down'}">
                      ${extra.trend.prod >= 0 ? '↑' : '↓'} ${Math.abs(extra.trend.prod).toFixed(1)}%
                    </span>
                  ` : ''}
                </span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Rendement Industriel</span>
                <span class="value">
                  ${App.formatNumber(stats.rendement, 2)}%
                  ${extra.trend ? `
                    <span class="trend-indicator ${extra.trend.rend >= 0 ? 'trend-up' : 'trend-down'}">
                      ${extra.trend.rend >= 0 ? '↑' : '↓'} ${Math.abs(extra.trend.rend).toFixed(1)} pts
                    </span>
                  ` : ''}
                </span>
              </div>
              <div class="kpi-card-mini">
                <span class="label">Productivité MO</span>
                <span class="value">${App.formatNumber(stats.productivite, 2)} <small style="font-size: 0.8rem;">kg/h</small></span>
              </div>
              <div class="kpi-card-mini" style="border-color: var(--accent-blue); background: rgba(37, 99, 255, 0.02);">
                <span class="label">Coût de Revient</span>
                <span class="value color-accent" style="color: var(--accent-blue);">
                  ${App.formatNumber(extra.costPerKg, 2)} <small style="font-size: 0.8rem;">DH/kg</small>
                  ${extra.trend ? `
                    <span class="trend-indicator ${extra.trend.cost <= 0 ? 'trend-up' : 'trend-down'}">
                      ${extra.trend.cost <= 0 ? '↓' : '↑'} ${Math.abs(extra.trend.cost).toFixed(1)}%
                    </span>
                  ` : ''}
                </span>
              </div>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-title">II. STRUCTURE DÉTAILLÉE DES COÛTS</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Nature de Charge</th>
                  <th class="td-right">Montant (DH)</th>
                  <th class="td-right">Incidence (DH/Kg)</th>
                  <th class="td-right">Répartition (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 500;">Main d'œuvre Directe (Occ. + Fixe)</td>
                  <td class="td-right">${App.formatNumber(stats.totalCoutMO, 0)}</td>
                  <td class="td-right">${App.formatNumber(stats.totalCoutMO / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">
                    <div style="display:flex; align-items:center; justify-content: flex-end; gap: 8px;">
                      <span>${App.formatNumber((stats.totalCoutMO / extra.fullDirectCost) * 100, 1)}%</span>
                      <div style="width: 40px; height: 4px; background: #eee; border-radius: 2px;">
                        <div style="width: ${(stats.totalCoutMO / extra.fullDirectCost) * 100}%; height: 100%; background: var(--primary-color); border-radius: 2px;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 500;">Consommables & Emballages</td>
                  <td class="td-right">${App.formatNumber(stats.totalCoutEmballage, 0)}</td>
                  <td class="td-right">${App.formatNumber(stats.totalCoutEmballage / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">
                    <div style="display:flex; align-items:center; justify-content: flex-end; gap: 8px;">
                      <span>${App.formatNumber((stats.totalCoutEmballage / extra.fullDirectCost) * 100, 1)}%</span>
                      <div style="width: 40px; height: 4px; background: #eee; border-radius: 2px;">
                        <div style="width: ${(stats.totalCoutEmballage / extra.fullDirectCost) * 100}%; height: 100%; background: var(--accent-blue); border-radius: 2px;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 500;">Énergie & Fluides (Est. Ind.)</td>
                  <td class="td-right">${App.formatNumber(extra.energy, 0)}</td>
                  <td class="td-right">${App.formatNumber(extra.energy / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">
                    <div style="display:flex; align-items:center; justify-content: flex-end; gap: 8px;">
                      <span>${App.formatNumber((extra.energy / extra.fullDirectCost) * 100, 1)}%</span>
                      <div style="width: 40px; height: 4px; background: #eee; border-radius: 2px;">
                        <div style="width: ${(extra.energy / extra.fullDirectCost) * 100}%; height: 100%; background: var(--status-info); border-radius: 2px;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 500;">Alloc. Charges Fixes Structures</td>
                  <td class="td-right">${App.formatNumber(extra.totalFixed, 0)}</td>
                  <td class="td-right">${App.formatNumber(extra.totalFixed / stats.totalPoidsPF, 2)}</td>
                  <td class="td-right">
                    <div style="display:flex; align-items:center; justify-content: flex-end; gap: 8px;">
                      <span>${App.formatNumber((extra.totalFixed / extra.fullDirectCost) * 100, 1)}%</span>
                      <div style="width: 40px; height: 4px; background: #eee; border-radius: 2px;">
                        <div style="width: ${(extra.totalFixed / extra.fullDirectCost) * 100}%; height: 100%; background: var(--status-purple); border-radius: 2px;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr class="row-total">
                  <td>TOTAL COÛT DE REVIENT DIRECT</td>
                  <td class="td-right">${App.formatNumber(extra.fullDirectCost, 0)} DH</td>
                  <td class="td-right">${App.formatNumber(extra.costPerKg, 2)} DH</td>
                  <td class="td-right">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h3 class="section-title">III. PERFORMANCE COMPARATIVE PAR ESPÈCE</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Espèce Traitée</th>
                  <th class="td-right">Poids Produit Fini (kg)</th>
                  <th class="td-right">Poids Matière Première (kg)</th>
                  <th class="td-right">Rendement (%)</th>
                  <th class="td-right">Mix Production (%)</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(stats.bySpecies).sort((a,b) => b[1]-a[1]).map(([sp, qty]) => {
                  const spProd = prod.filter(p => p.espece === sp);
                  const spPI = spProd.reduce((s,p) => s + (p.poidsBrutPI || p.poidsMP || 0), 0);
                  const spRend = spPI > 0 ? (qty / spPI * 100) : 0;
                  return `
                  <tr>
                    <td style="font-weight: 600; color: var(--primary-color);">${sp}</td>
                    <td class="td-right">${App.formatNumber(qty, 1)}</td>
                    <td class="td-right">${App.formatNumber(spPI, 1)}</td>
                    <td class="td-right">
                      <span style="color: ${spRend > 80 ? 'var(--status-success)' : 'var(--status-warning)'}; font-weight: 700;">
                        ${App.formatNumber(spRend, 1)}%
                      </span>
                    </td>
                    <td class="td-right">${App.formatNumber((qty / stats.totalPoidsPF) * 100, 1)}%</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>

          <div class="report-section no-print">
            <h3 class="section-title">IV. ANALYSES GRAPHIQUES</h3>
            <div class="report-charts-grid">
               <div class="chart-container-report">
                  <h4>Structure des Coûts</h4>
                  <canvas id="chartCostStructure"></canvas>
               </div>
               <div class="chart-container-report">
                  <h4>Mix de Production</h4>
                  <canvas id="chartSpeciesMix"></canvas>
               </div>
            </div>
          </div>
          
          <div class="report-footer-internal">
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="max-width: 60%;">
                <p><strong>Note de Méthodologie :</strong> Les coûts de main-d'œuvre incluent les fixes et occasionnels proratisés. L'énergie est estimée sur une base forfaitaire de 0.15 DH/kg PF. Les charges fixes sont allouées sur la base de 26 jours ouvrés par mois.</p>
                <p style="margin-top: 8px;">Certifié conforme aux données du système ELABBAR ERP v2.0.</p>
              </div>
              <div style="text-align: right;">
                <div style="height: 60px; width: 120px; border: 1px dashed #ccc; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #ccc;">Cachet & Signature</div>
                <p style="font-weight: 700; font-size: 0.7rem; text-transform: uppercase;">Direction d'Exploitation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const now = new Date();
    const margin = 15;
    let y = 0;

    // --- Header Premium ---
    doc.setFillColor(11, 45, 107); // Ocean Blue
    doc.rect(0, 0, 210, 45, 'F');
    
    // Logo Shape
    doc.setFillColor(37, 99, 255); // Accent Blue
    doc.roundedRect(margin, 12, 18, 18, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SP', margin + 4, 25);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('SEA PECHE / ELABBAR', margin + 25, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RAPPORT ANALYTIQUE DE PERFORMANCE OPÉRATIONNELLE', margin + 25, 28);

    // Meta Info in Header
    doc.setFontSize(9);
    doc.text('Généré le: ' + now.toLocaleString('fr-FR'), 195, 15, { align: 'right' });
    doc.text('ID: REP-' + Math.floor(Math.random()*90000), 195, 20, { align: 'right' });

    y = 60;
    
    // --- Summary Section ---
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RÉSUMÉ EXÉCUTIF', margin, y);
    
    y += 10;
    const rapportEl = document.querySelector('.report-sheet');
    const kpis = Array.from(rapportEl.querySelectorAll('.kpi-card-mini')).map(card => [
        card.querySelector('.label').innerText,
        card.querySelector('.value').innerText.replace('\n', ' ')
    ]);

    doc.autoTable({
      startY: y,
      body: kpis,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 6, fontStyle: 'bold' },
      columnStyles: { 
          0: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'normal', width: 60 },
          1: { textColor: [11, 45, 107], halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 15;

    // --- Costs Section ---
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(14);
    doc.text('II. STRUCTURE DES COÛTS DIRECTS', margin, y);
    y += 8;

    const costData = Array.from(rapportEl.querySelectorAll('.report-table:nth-of-type(1) tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td'));
        return [
            cells[0].innerText,
            cells[1].innerText,
            cells[2].innerText,
            cells[3].innerText.split('\n')[0] // Clean percentage
        ];
    });

    doc.autoTable({
      startY: y,
      head: [['Nature de la Charge', 'Montant (DH)', 'DH / Kg', 'Part (%)']],
      body: costData,
      theme: 'striped',
      headStyles: { fillColor: [11, 45, 107], fontSize: 10 },
      styles: { fontSize: 9 },
      columnStyles: { 
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
      },
      didParseCell: function(data) {
          if (data.row.index === costData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [241, 245, 249];
          }
      }
    });

    y = doc.lastAutoTable.finalY + 15;

    // --- Species Section ---
    doc.setTextColor(11, 45, 107);
    doc.setFontSize(14);
    doc.text('III. PERFORMANCE PAR ESPÈCE', margin, y);
    y += 8;

    const speciesData = Array.from(rapportEl.querySelectorAll('.report-table:nth-of-type(2) tbody tr')).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => td.innerText)
    );

    doc.autoTable({
      startY: y,
      head: [['Espèce', 'Poids PF (kg)', 'Poids MP (kg)', 'Rendement', 'Mix %']],
      body: speciesData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 255] },
      styles: { fontSize: 9 },
      columnStyles: { 
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right' }
      }
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('SEA PECHE ERP Analytique — Page ' + i + ' sur ' + pageCount, 105, 285, { align: 'center' });
        doc.text('Document confidentiel à usage interne uniquement.', 105, 290, { align: 'center' });
    }

    doc.save(`Rapport_Performance_${label.replace(/ /g,'_')}.pdf`);
    App.toast('PDF Exporté avec succès', 'success');
  },

  exportExcel() {
    if (typeof XLSX === 'undefined') {
      App.toast("Bibliothèque Excel non chargée", "error");
      return;
    }

    const rapportEl = document.querySelector('.report-sheet');
    if (!rapportEl) return;

    // Re-fetch production data for the Raw Data sheet
    let rawProd = [];
    if (this.view === 'monthly') {
      const monthVal = document.getElementById('rapportMois').value.split('-');
      rawProd = App.getMonthProduction(parseInt(monthVal[0]), parseInt(monthVal[1]) - 1);
    } else {
      rawProd = App.data.production.filter(p => p.date === this.selectedDate);
    }

    const wb = XLSX.utils.book_new();

    // 1. Sheet Summary
    const summaryRows = [
       ['RAPPORT DE PERFORMANCE OPÉRATIONNELLE - SEA PECHE'],
       ['Généré le', new Date().toLocaleString()],
       ['Période', document.querySelector('.report-meta strong').innerText],
       [],
       ['INDICATEURS CLÉS', 'VALEUR', 'UNITÉ'],
       ['Production Totale', parseFloat(rapportEl.querySelector('.kpi-card-mini:nth-child(1) .value').innerText.replace('kg','')), 'kg'],
       ['Rendement Global', parseFloat(rapportEl.querySelector('.kpi-card-mini:nth-child(2) .value').innerText.replace('%','')), '%'],
       ['Productivité MO', parseFloat(rapportEl.querySelector('.kpi-card-mini:nth-child(3) .value').innerText.replace('kg/h','')), 'kg/h'],
       ['Coût de Revient', parseFloat(rapportEl.querySelector('.kpi-card-mini:nth-child(4) .value').innerText.replace('DH/kg','')), 'DH/kg']
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Synthèse");

    // 2. Sheet Costs
    const costRows = [['NATURE DE CHARGE', 'MONTANT (DH)', 'INCIDENCE (DH/KG)', 'PART (%)']];
    rapportEl.querySelectorAll('.report-table:nth-of-type(1) tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        costRows.push([
            tds[0].innerText,
            parseFloat(tds[1].innerText.replace(/ /g,'')),
            parseFloat(tds[2].innerText.replace(/ /g,'')),
            tds[3].innerText.split('\n')[0]
        ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(costRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Analyse Coûts");

    // 3. Sheet Species
    const specRows = [['ESPÈCE', 'POIDS PF (KG)', 'POIDS MP (KG)', 'RENDEMENT (%)', 'MIX (%)']];
    rapportEl.querySelectorAll('.report-table:nth-of-type(2) tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        specRows.push([
            tds[0].innerText,
            parseFloat(tds[1].innerText.replace(/ /g,'')),
            parseFloat(tds[2].innerText.replace(/ /g,'')),
            tds[3].innerText,
            tds[4].innerText
        ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(specRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Par Espèce");

    // 4. Sheet RAW DATA (The "Senior" touch)
    const rawRows = [['DATE', 'N° LOT', 'ESPÈCE', 'PRODUIT', 'PDS BRUT (MP)', 'PDS NET (PF)', 'RENDEMENT', 'MO OCC (H)', 'COÛT MO']];
    rawProd.forEach(p => {
        rawRows.push([
            p.date,
            p.lotInterne || '',
            p.espece,
            p.produit || '',
            p.poidsMP || p.poidsBrutPI || 0,
            p.poidsBrutPF || 0,
            p.poidsMP > 0 ? (p.poidsBrutPF / p.poidsMP) : 0,
            p.heuresMOO || 0,
            p.coutMOO || 0
        ]);
    });
    const ws4 = XLSX.utils.aoa_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, ws4, "Données Brutes");

    XLSX.writeFile(wb, `Rapport_Expert_ELABBAR_${new Date().toISOString().split('T')[0]}.xlsx`);
    App.toast('Workbook Excel généré avec 4 onglets', 'success');
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
            hoverOffset: 15,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, padding: 15, font: { size: 10, family: 'Inter' }, usePointStyle: true } },
            tooltip: {
                callbacks: {
                    label: (item) => ` ${item.label}: ${App.formatNumber(item.raw, 0)} DH`
                }
            }
          },
          cutout: '75%'
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
            backgroundColor: 'rgba(37, 99, 255, 0.7)',
            hoverBackgroundColor: 'rgba(37, 99, 255, 1)',
            borderRadius: 8,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }
  }
};

