/* ============================================
   RAPPORTS — Génération automatique
   ============================================ */
const Rapports = {
  render() {
    const content = document.getElementById('pageContent');
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ value: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) });
    }

    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px;">
          <div>
            <nav style="display:flex; gap:8px; margin-bottom:12px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
              <span>Analytique</span>
              <span>/</span>
              <span style="color:var(--accent-blue);">Rapports Mensuels</span>
            </nav>
            <h2 class="page-title">Intelligence Opérationnelle</h2>
            <p class="page-subtitle">Génération automatique des rapports de performance et analyse des coûts.</p>
          </div>
          <div style="display:flex; gap:12px; align-items:center;">
            <select class="form-select" id="rapportMois" style="width:220px; padding:10px 14px; font-weight:600;">
              ${months.map((m,i) => `<option value="${m.value}" ${i===0?'selected':''}>${m.label}</option>`).join('')}
            </select>
            <button class="btn btn-primary" onclick="Rapports.generate()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7m9-9-9 9-4-4"/></svg>
              <span>Générer le rapport</span>
            </button>
          </div>
        </div>

        <div id="rapportContent">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">Veuillez sélectionner un mois pour visualiser les données analytiques.</div>
          </div>
        </div>
      </div>
    `;
  },

  getSelectedMonth() {
    const val = document.getElementById('rapportMois').value.split('-');
    return { year: parseInt(val[0]), month: parseInt(val[1]) };
  },

  generate() {
    const { year, month } = this.getSelectedMonth();
    const prod = App.getMonthProduction(year, month);
    const p = App.data.parametres;
    const monthName = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (prod.length === 0) {
      document.getElementById('rapportContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Aucune donnée pour ce mois</div></div>';
      return;
    }

    const totalPoidsPF = prod.reduce((s, p) => s + (p.poidsBrutPF || 0), 0);
    
    // NOUVEAU : Récupérer depuis le système de pointage
    const ptgStr = `${year}-${String(month).padStart(2, '0')}`;
    const ptg = App.data.pointage && App.data.pointage[ptgStr] ? App.data.pointage[ptgStr] : null;
    
    let totalCoutMOO = 0, totalCoutMOF = 0, totalHeuresOcc = 0, totalHeuresF = 0;
    let salaireProdFixe = 0, salaireQualite = 0, salaireAdmin = 0, salaireLogistique = 0;

    if (ptg) {
      totalCoutMOO = ptg.totalMontantOcc || 0;
      totalCoutMOF = ptg.totalSalairesOuvriersFixe || 0;
      totalHeuresOcc = ptg.totalHeuresOcc || 0;
      totalHeuresF = ptg.totalHeuresOuvriersFixe || 0;
      salaireProdFixe = ptg.totalSalairesOuvriersFixe || 0;
      salaireAdmin = ptg.totalSalairesFixeAdmin || 0;
      salaireLogistique = ptg.totalSalairesFixeAutre || 0; // Sécurité/Cariste etc
    } else {
      // Fallback
      totalCoutMOO = prod.reduce((s, p) => s + (p.coutMOO || 0), 0);
      totalCoutMOF = prod.reduce((s, p) => s + (p.coutPersonnelF || 0), 0);
      totalHeuresOcc = prod.reduce((s, p) => s + (p.heuresMOO || 0), 0);
      totalHeuresF = prod.reduce((s, p) => s + (p.heuresMOF || 0), 0);
      salaireQualite = p.salaireQualite || 9000;
      salaireAdmin = p.salaireAdmin || 25000;
      salaireLogistique = p.coutPersonnelLogistique || 4000;
      salaireProdFixe = App.data.personnel.filter(e => e.dept === 'Production' && e.type !== 'occasionnel').reduce((s, e) => s + e.salaire, 0);
    }

    const totalHeures = totalHeuresOcc + totalHeuresF;
    const totalCoutMO = totalCoutMOO + totalCoutMOF;
    
    const totalCarton = prod.reduce((s, p) => s + (p.coutCarton || 0), 0);
    const totalSachet = prod.reduce((s, p) => s + (p.coutSachet || 0), 0);
    const totalEtiqNoir = prod.reduce((s, p) => s + (p.coutEtiquetteNoir || 0), 0);
    const totalEtiq5075 = prod.reduce((s, p) => s + (p.coutEtiquette5075 || 0), 0);
    const totalScotch = prod.reduce((s, p) => s + (p.coutScotch || 0), 0);
    const totalEmballage = totalCarton + totalSachet + totalEtiqNoir + totalEtiq5075 + totalScotch;

    const totalMasseSalariale = totalCoutMOO + salaireProdFixe + salaireQualite + salaireLogistique + salaireAdmin;

    const productivite = totalHeures > 0 ? totalPoidsPF / totalHeures : 0;
    const coutMOParKg = totalPoidsPF > 0 ? totalCoutMO / totalPoidsPF : 0;
    const coutEmballageParKg = totalPoidsPF > 0 ? totalEmballage / totalPoidsPF : 0;

    const facture = Energie.calcFacture(year, month);
    const coutEnergieParKg = totalPoidsPF > 0 ? facture / totalPoidsPF : 0;
    const coutLogistique = (p.coutCarburant || 300) + 1101.34 + salaireLogistique;
    const coutLogParKg = totalPoidsPF > 0 ? coutLogistique / totalPoidsPF : 0;
    const coutDirectParKg = coutMOParKg + coutEmballageParKg + coutEnergieParKg + coutLogParKg;

    // Mid-month split
    const mid = new Date(year, month, 16);
    const p1 = prod.filter(e => new Date(e.date) < mid);
    const p2 = prod.filter(e => new Date(e.date) >= mid);
    const h1 = p1.reduce((s, e) => s + (e.heuresMOO || 0) + (e.heuresMOF || 0), 0);
    const h2 = p2.reduce((s, e) => s + (e.heuresMOO || 0) + (e.heuresMOF || 0), 0);
    const q1 = p1.reduce((s, e) => s + (e.poidsBrutPF || 0), 0);
    const q2 = p2.reduce((s, e) => s + (e.poidsBrutPF || 0), 0);
    const pr1 = h1 > 0 ? q1 / h1 : 0;
    const pr2 = h2 > 0 ? q2 / h2 : 0;

    // Nbr consommables
    const nCartons = prod.reduce((s, p) => s + (p.nbCartons || 0), 0);
    const nSachetsKg = prod.reduce((s, p) => s + (p.sachetsKg || 0), 0);
    const nEtiqNoir = prod.reduce((s, p) => s + (p.nbEtiqNoir || 0), 0);
    const nEtiq5075 = prod.reduce((s, p) => s + (p.nbEtiq5075 || 0), 0);
    const nScotch = prod.reduce((s, p) => s + (p.nbScotch || 0), 0);

    document.getElementById('rapportContent').innerHTML = `
      <div class="slide-up">
        <div class="card" style="border-top: 4px solid var(--accent-blue);">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:rgba(37,99,255,0.03);">
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="kpi-icon blue" style="width:40px; height:40px; font-size:1.2rem;">📊</div>
              <span class="card-title" style="font-size:1.2rem;">RAPPORT D'ACTIVITÉ — ${monthName.toUpperCase()}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="Rapports.exportPDF()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              Exporter PDF
            </button>
          </div>
          <div class="card-body">
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:40px;">
              <div>
                <h3 style="font-size:1rem; margin-bottom:16px; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                  <span style="width:4px; height:16px; background:var(--accent-blue); border-radius:2px;"></span>
                  Structure des Coûts Salariaux
                </h3>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Poste</th><th class="td-right">Fixe</th><th class="td-right">Variable</th><th class="td-right">Total</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Production</td><td class="td-right">${App.formatNumber(salaireProdFixe,0)}</td><td class="td-right">${App.formatNumber(totalCoutMOO,0)}</td><td class="td-right td-bold">${App.formatNumber(totalCoutMOO+salaireProdFixe,0)}</td></tr>
                      <tr><td>Qualité</td><td class="td-right">${App.formatNumber(salaireQualite,0)}</td><td class="td-right">0</td><td class="td-right">${App.formatNumber(salaireQualite,0)}</td></tr>
                      <tr><td>Logistique</td><td class="td-right">${App.formatNumber(salaireLogistique,0)}</td><td class="td-right">0</td><td class="td-right">${App.formatNumber(salaireLogistique,0)}</td></tr>
                      <tr style="background:rgba(37,99,255,0.05);">
                        <td class="td-bold">MASSE TOTALE</td>
                        <td class="td-right td-bold">${App.formatNumber(salaireProdFixe+salaireQualite+salaireLogistique+salaireAdmin,0)}</td>
                        <td class="td-right td-bold">${App.formatNumber(totalCoutMOO,0)}</td>
                        <td class="td-right td-bold" style="color:var(--accent-blue);">${App.formatNumber(totalMasseSalariale,0)} DH</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 style="font-size:1rem; margin-bottom:16px; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                  <span style="width:4px; height:16px; background:var(--accent-purple); border-radius:2px;"></span>
                  Productivité & Rendement
                </h3>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Période</th><th class="td-right">Heures</th><th class="td-right">Quantité</th><th class="td-right">Ratio</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Quinzaine 1</td><td class="td-right">${App.formatNumber(h1,1)} h</td><td class="td-right">${App.formatNumber(q1,0)} kg</td><td class="td-right td-bold">${App.formatNumber(pr1,2)}</td></tr>
                      <tr><td>Quinzaine 2</td><td class="td-right">${App.formatNumber(h2,1)} h</td><td class="td-right">${App.formatNumber(q2,0)} kg</td><td class="td-right td-bold">${App.formatNumber(pr2,2)}</td></tr>
                      <tr style="background:rgba(139,92,246,0.05);">
                        <td class="td-bold">MOYENNE MOIS</td>
                        <td class="td-right td-bold">${App.formatNumber(totalHeures,1)} h</td>
                        <td class="td-right td-bold">${App.formatNumber(totalPoidsPF,0)} kg</td>
                        <td class="td-right td-bold" style="color:var(--accent-purple);">${App.formatNumber(productivite,2)} kg/h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <h3 style="font-size:1rem; margin-bottom:16px; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
              <span style="width:4px; height:16px; background:var(--status-warning); border-radius:2px;"></span>
              Synthèse Économique (Coût Direct par Kg)
            </h3>
            <div class="summary-box" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; background:var(--bg-app); border:1px solid var(--border-color); border-radius:16px; padding:24px;">
              <div class="summary-item">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">Main-d'œuvre</div>
                <div style="font-size:1.4rem; font-weight:700; color:var(--text-primary);">${App.formatNumber(coutMOParKg,2)} <span style="font-size:0.8rem; font-weight:normal;">DH/kg</span></div>
              </div>
              <div class="summary-item">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">Emballage & Intrants</div>
                <div style="font-size:1.4rem; font-weight:700; color:var(--text-primary);">${App.formatNumber(coutEmballageParKg,2)} <span style="font-size:0.8rem; font-weight:normal;">DH/kg</span></div>
              </div>
              <div class="summary-item">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">Logistique & Énergie</div>
                <div style="font-size:1.4rem; font-weight:700; color:var(--text-primary);">${App.formatNumber(coutLogParKg + coutEnergieParKg,2)} <span style="font-size:0.8rem; font-weight:normal;">DH/kg</span></div>
              </div>
              <div class="summary-item" style="grid-column: span 3; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700; color:var(--accent-blue); font-size:1.1rem;">COÛT DIRECT TOTAL / KG PRODUIT</div>
                <div style="font-size:2rem; font-weight:800; color:var(--accent-blue);">${App.formatNumber(coutDirectParKg,2)} <span style="font-size:1rem; font-weight:normal;">DH/kg</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  exportPDF() {
    const { year, month } = this.getSelectedMonth();
    const prod = App.getMonthProduction(year, month);
    if (prod.length === 0) { App.toast('Aucune donnée pour ce mois', 'error'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const monthName = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text(stripAccents(`RAPPORT ${monthName.toUpperCase()}`), 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(stripAccents('Analyse des Performances — Station de Conditionnement'), 14, 28);

    // Calculate stats
    const totalPoidsPF = prod.reduce((s, p) => s + (p.poidsBrutPF || 0), 0);
    const ptgStr2 = `${year}-${String(month).padStart(2, '0')}`;
    const ptg2 = App.data.pointage && App.data.pointage[ptgStr2] ? App.data.pointage[ptgStr2] : null;
    let totalCoutMOO = 0, totalCoutMOF = 0, totalHeures = 0;
    if (ptg2) {
      totalCoutMOO = ptg2.totalMontantOcc || 0;
      totalCoutMOF = ptg2.totalSalairesOuvriersFixe || 0;
      totalHeures = (ptg2.totalHeuresOcc || 0) + (ptg2.totalHeuresOuvriersFixe || 0);
    } else {
      totalCoutMOO = prod.reduce((s, p) => s + (p.coutMOO || 0), 0);
      totalCoutMOF = prod.reduce((s, p) => s + (p.coutPersonnelF || 0), 0);
      totalHeures = prod.reduce((s, p) => s + (p.heuresMOO || 0) + (p.heuresMOF || 0), 0);
    }
    
    const totalEmballage = prod.reduce((s, p) => s + (p.coutCarton||0) + (p.coutSachet||0) + (p.coutEtiquetteNoir||0) + (p.coutEtiquette5075||0) + (p.coutScotch||0), 0);

    let y = 40;
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(stripAccents('Synthese Globale'), 14, y);
    y += 8;

    doc.autoTable({
      startY: y,
      head: [['Indicateur', 'Valeur']],
      body: [
        [stripAccents('Production totale'), `${totalPoidsPF.toFixed(0)} kg`],
        [stripAccents('Heures M.O. totales'), `${totalHeures.toFixed(1)} h`],
        [stripAccents('Productivite'), `${(totalHeures>0?totalPoidsPF/totalHeures:0).toFixed(2)} kg/h`],
        [stripAccents('Cout M.O. total'), `${(totalCoutMOO+totalCoutMOF).toFixed(0)} DH`],
        [stripAccents('Cout Emballage total'), `${totalEmballage.toFixed(0)} DH`],
        [stripAccents('Cout M.O./kg'), `${(totalPoidsPF>0?(totalCoutMOO+totalCoutMOF)/totalPoidsPF:0).toFixed(2)} DH`],
        [stripAccents('Cout Emballage/kg'), `${(totalPoidsPF>0?totalEmballage/totalPoidsPF:0).toFixed(2)} DH`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`rapport_${monthName.replace(' ', '_')}.pdf`);
    App.toast('PDF exporté avec succès', 'success');
  }
};
