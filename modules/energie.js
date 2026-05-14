/* ============================================
   ENERGIE — Analyse énergétique
   ============================================ */
const Energie = {
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
          <div class="form-group"><label>Mois</label><input type="month" id="ai_eMois" value="${finalMonth}"></div>
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
    if (!App.data.energie.history) App.data.energie.history = {};
    App.data.energie.history[mois] = {
      consoHP: parseFloat(document.getElementById('ai_eHP').value) || 0,
      consoHPl: parseFloat(document.getElementById('ai_eHPl').value) || 0,
      consoHC: parseFloat(document.getElementById('ai_eHC').value) || 0,
      montantTTC: parseFloat(document.getElementById('ai_eTotal').value) || 0
    };
    App.saveData();
    App.closeModal();
    this.render();
    App.toast("Données énergétiques enregistrées !");
  },
  render() {
    const p = App.data.parametres;
    const currentMonth = this.getCurrentMonthKey();
    const e = this.getMonthData();
    const content = document.getElementById('pageContent');
    const computedZones = this.getComputedZones();

    content.innerHTML = `
      <div class="fade-in">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <div>
            <h2 class="page-title">Analyse Énergétique</h2>
            <p class="page-subtitle">Suivi basé sur les spécifications techniques et thermographes réels</p>
          </div>
          <button class="btn btn-primary" onclick="Energie.saveEnergie()">💾 Enregistrer les données</button>
        </div>

        <div class="kpi-grid" style="margin-bottom:24px;">
          <div class="kpi-card cyan">
            <div class="kpi-icon cyan">⚡</div>
            <div class="kpi-label">Charge Froid Totale</div>
            <div class="kpi-value">${App.formatNumber(this.calcTotalFroid(computedZones),0)} <span class="kpi-unit">kWh/j</span></div>
          </div>
          <div class="kpi-card blue">
            <div class="kpi-icon blue">🏢</div>
            <div class="kpi-label">Conso. RDC (Est.)</div>
            <div class="kpi-value">${App.formatNumber(this.calcTotalRDC(),1)} <span class="kpi-unit">kWh/j</span></div>
          </div>
          <div class="kpi-card yellow">
            <div class="kpi-icon yellow">💡</div>
            <div class="kpi-label">Facture Réelle (Mois)</div>
            <div class="kpi-value">${App.formatNumber(e.consoMensuelle||0,0)}<span class="kpi-unit">kWh</span></div>
          </div>
          <div class="kpi-card red">
            <div class="kpi-icon red">💰</div>
            <div class="kpi-label">Montant Facture</div>
            <div class="kpi-value">${App.formatNumber(this.calcFacture(),0)}<span class="kpi-unit">DH</span></div>
          </div>
        </div>

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

        <div style="display:grid;grid-template-columns: 1fr 1.5fr; gap:24px;">
          <div class="card">
            <div class="card-header"><span class="card-title">🏢 Détail Consommation RDC</span></div>
            <div class="card-body" style="padding:0;">
              <div class="table-container">${this.renderRDCTable()}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">📝 Saisie Mensuelle & Tarification ONEE</span>
              <button class="btn btn-small" onclick="Energie.distributeConso()" title="Répartir la consommation totale selon le profil théorique">⚡ Auto-répartir</button>
            </div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-group" style="grid-column: span 2;"><label class="form-label">Mois</label><input type="month" class="form-input" id="eMois" value="${e.mois || currentMonth}" onchange="Energie.loadMonthForm()"></div>
                
                <div class="form-group"><label class="form-label">Conso. HP (kWh)</label><input type="number" class="form-input" id="eConsoHP" value="${e.consoHP||0}" onchange="Energie.updateKPI()"></div>
                <div class="form-group"><label class="form-label">Tarif HP (DH)</label><input type="number" step="0.0001" class="form-input" id="eTarifHP" value="${p.tarifHP||1.45}" onchange="Energie.updateKPI()"></div>
                
                <div class="form-group"><label class="form-label">Conso. HPl (kWh)</label><input type="number" class="form-input" id="eConsoHPl" value="${e.consoHPl||0}" onchange="Energie.updateKPI()"></div>
                <div class="form-group"><label class="form-label">Tarif HPl (DH)</label><input type="number" step="0.0001" class="form-input" id="eTarifHPl" value="${p.tarifHPl||1.15}" onchange="Energie.updateKPI()"></div>
                
                <div class="form-group"><label class="form-label">Conso. HC (kWh)</label><input type="number" class="form-input" id="eConsoHC" value="${e.consoHC||0}" onchange="Energie.updateKPI()"></div>
                <div class="form-group"><label class="form-label">Tarif HC (DH)</label><input type="number" step="0.0001" class="form-input" id="eTarifHC" value="${p.tarifHC||0.85}" onchange="Energie.updateKPI()"></div>
                
                <div class="form-group"><label class="form-label">Redevances Fixes</label><input type="number" class="form-input" id="eRedFixe" value="${(p.redevancePuissance||0)+(p.redevanceEntretien||0)+(p.redevanceLocation||0)}" onchange="Energie.updateKPI()"></div>
                <div class="form-group"><label class="form-label">TVA (%)</label><input type="number" step="0.1" class="form-input" id="eTva" value="${(p.tvaEnergetique||0.14)*100}" onchange="Energie.updateKPI()"></div>
              </div>

              <div class="summary-box" style="margin-top:24px;">
                <h3 style="margin-bottom:16px; font-size: 1rem; color: var(--primary-color);">Détail de la Facture Estimée</h3>
                <div class="summary-row"><span class="summary-label">Montant HP / HPl / HC</span><span class="summary-value" id="eFactConso">0 DH</span></div>
                <div class="summary-row"><span class="summary-label">Redevances HT</span><span class="summary-value" id="eFactRedev">0 DH</span></div>
                <div class="summary-row"><span class="summary-label">TVA & Taxes</span><span class="summary-value" id="eFactTaxes">0 DH</span></div>
                <div class="summary-row" style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-color);">
                  <span class="summary-label" style="font-weight:700;">TOTAL TTC</span>
                  <span class="summary-value summary-total" id="eFactTotal" style="font-size:1.4rem; color:var(--status-danger);">0 DH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    this.updateKPI();
  },

  getComputedZones() {
    const specs = App.data.chambresSpecs || {};
    const today = App.formatDate(new Date());
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
    return document.getElementById('eMois')?.value || this.getCurrentMonthKey();
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
  }
};
