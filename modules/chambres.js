/* ============================================
   CHAMBRES — Gestion des Chambres de Stockage
   ============================================ */
const Chambres = {
  getDefaultHistory() {
    return [];
  },

  render() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    if (!App.data.chambresHistory) {
      App.data.chambresHistory = this.getDefaultHistory();
      App.saveData();
    }

    const lastReading = App.data.chambresHistory[App.data.chambresHistory.length - 1] || {};
    const capacity = this.getCapacityStats();
    const inventory = this.getInventoryByChambre();
    
    const tonCh1 = capacity.chambre1 / 1000;
    const tonCh2 = capacity.chambre2 / 1000;
    const tonEnt = capacity.entreposage / 1000;
    const tonUnassigned = capacity.non_affecte / 1000;
    
    const invCh1 = inventory.chambre1;
    const invCh2 = inventory.chambre2;
    const invEnt = inventory.entreposage;
    const invDirect = inventory.direct || { lots: [], caisses: 0, poids: 0 };
    const processing = this.getProcessingInventory();

    content.innerHTML = `
      <div class="fade-in">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
          <div>
            <h2 class="page-title">Gestion des Chambres Froides</h2>
            <p class="page-subtitle">Suivi des capacités, températures (Thermographe 24h) et stocks</p>
          </div>
          <button class="btn btn-primary" onclick="Chambres.showLogTempModal()">🌡️ Relever Thermographe</button>
        </div>

        <!-- Alerte Température -->
        ${this.getTemperatureAlertsHtml(lastReading)}
        ${this.getUnassignedStockHtml(tonUnassigned)}

        <!-- Grille des Chambres -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:22px;margin-bottom:28px;">
          
          <!-- CHAMBRE 1 -->
          <div class="card" onclick="Chambres.showChambreDetail('chambre1')" style="position:relative;cursor:pointer;">
            <div class="card-header">
              <span class="card-title">❄️ Chambre 1</span>
              <span class="badge ${this.getAvgTemp(lastReading, 'chambre1') > -14 ? 'badge-danger' : 'badge-success'}">${this.getAvgTemp(lastReading, 'chambre1') > -14 ? 'Alerte' : 'Normal'}</span>
            </div>
            <div class="card-body">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div>
                  <div style="font-size:0.85rem;color:var(--text-muted);">Occupation</div>
                  <div style="font-size:1.4rem;font-weight:800;">${tonCh1.toFixed(1)} <span style="font-size:0.9rem;font-weight:500;color:var(--text-secondary);">/ 400 T</span></div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem;color:var(--text-muted);">Moyenne 24h</div>
                  ${this.renderTempValue(this.getAvgTemp(lastReading, 'chambre1'))}
                </div>
              </div>
              <div class="stock-bar" style="height:8px; background:var(--bg-app); border-radius:10px; overflow:hidden;">
                <div class="stock-bar-fill" style="width:${Math.min(100, (tonCh1 / 400 * 100))}%; background:var(--primary-color); height:100%;"></div>
              </div>
              <div style="height:140px;margin-top:20px;background:rgba(0,0,0,0.02);border-radius:8px;padding:5px;">
                <canvas id="chartCh1"></canvas>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <span class="badge badge-info">${invCh1.lots.length} lots</span>
                <span class="badge badge-purple">${App.formatNumber(invCh1.poids/1000,2)} T net</span>
              </div>
            </div>
          </div>

          <!-- CHAMBRE 2 -->
          <div class="card" onclick="Chambres.showChambreDetail('chambre2')" style="position:relative;cursor:pointer;">
            <div class="card-header">
              <span class="card-title">❄️ Chambre 2</span>
              <span class="badge ${this.getAvgTemp(lastReading, 'chambre2') > -14 ? 'badge-danger' : 'badge-success'}">${this.getAvgTemp(lastReading, 'chambre2') > -14 ? 'Alerte' : 'Normal'}</span>
            </div>
            <div class="card-body">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div>
                  <div style="font-size:0.85rem;color:var(--text-muted);">Occupation</div>
                  <div style="font-size:1.4rem;font-weight:800;">${tonCh2.toFixed(1)} <span style="font-size:0.9rem;font-weight:500;color:var(--text-secondary);">/ 400 T</span></div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem;color:var(--text-muted);">Moyenne 24h</div>
                  ${this.renderTempValue(this.getAvgTemp(lastReading, 'chambre2'))}
                </div>
              </div>
              <div class="stock-bar" style="height:8px; background:var(--bg-app); border-radius:10px; overflow:hidden;">
                <div class="stock-bar-fill" style="width:${Math.min(100, (tonCh2 / 400 * 100))}%; background:var(--accent-purple); height:100%;"></div>
              </div>
              <div style="height:140px;margin-top:20px;background:rgba(0,0,0,0.02);border-radius:8px;padding:5px;">
                <canvas id="chartCh2"></canvas>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <span class="badge badge-info">${invCh2.lots.length} lots</span>
                <span class="badge badge-purple">${App.formatNumber(invCh2.poids/1000,2)} T net</span>
              </div>
            </div>
          </div>

          <!-- ENTREPOSAGE -->
          <div class="card" onclick="Chambres.showChambreDetail('entreposage')" style="position:relative;cursor:pointer;">
            <div class="card-header">
              <span class="card-title">📦 Entreposage</span>
              <span class="badge ${this.getAvgTemp(lastReading, 'entreposage') > -14 ? 'badge-danger' : 'badge-success'}">${this.getAvgTemp(lastReading, 'entreposage') > -14 ? 'Alerte' : 'Normal'}</span>
            </div>
            <div class="card-body">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div>
                  <div style="font-size:0.85rem;color:var(--text-muted);">Occupation</div>
                  <div style="font-size:1.4rem;font-weight:800;">${tonEnt.toFixed(1)} <span style="font-size:0.9rem;font-weight:500;color:var(--text-secondary);">/ 500 T</span></div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem;color:var(--text-muted);">Moyenne 24h</div>
                  ${this.renderTempValue(this.getAvgTemp(lastReading, 'entreposage'))}
                </div>
              </div>
              <div class="stock-bar" style="height:8px; background:var(--bg-app); border-radius:10px; overflow:hidden;">
                <div class="stock-bar-fill" style="width:${Math.min(100, (tonEnt / 500 * 100))}%; background:var(--status-success); height:100%;"></div>
              </div>
              <div style="height:140px;margin-top:20px;background:rgba(0,0,0,0.02);border-radius:8px;padding:5px;">
                <canvas id="chartEnt"></canvas>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <span class="badge badge-info">${invEnt.lots.length} lots</span>
                <span class="badge badge-purple">${App.formatNumber(invEnt.poids/1000,2)} T net</span>
              </div>
            </div>
          </div>


          <!-- FLUX DIRECT -->
          <div class="card" onclick="Chambres.showChambreDetail('direct')" style="position:relative;cursor:pointer;border-top:4px solid var(--accent-orange); background:linear-gradient(to bottom, rgba(245,158,11,0.03), transparent);">
            <div class="card-header">
              <span class="card-title">🚀 Flux Direct</span>
              <span class="badge badge-warning">Hors Froid</span>
            </div>
            <div class="card-body">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div>
                  <div style="font-size:0.85rem;color:var(--text-muted);">Poids Transféré</div>
                  <div style="font-size:1.4rem;font-weight:800;">${(invDirect.poids/1000).toFixed(1)} <span style="font-size:0.9rem;font-weight:500;color:var(--text-secondary);">T</span></div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.85rem;color:var(--text-muted);">Statut</div>
                  <div style="font-size:1.1rem;font-weight:700;color:var(--accent-orange);">TRANSIT</div>
                </div>
              </div>
              <div style="background:rgba(245,158,11,0.05);border-radius:8px;padding:12px;margin-top:10px;">
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">Lots en transit direct vers activité</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                  <span class="badge badge-info">${invDirect.lots.length} lots</span>
                  <span class="badge badge-purple">${App.formatNumber(invDirect.poids,0)} kg</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- SALLE DE TRAITEMENT -->
        <div class="card" onclick="Chambres.showProcessingDetail()" style="margin-top:20px;cursor:pointer;">
          <div class="card-header">
            <span class="card-title">🔧 Salle de Traitement & Tunnels</span>
            <div style="display:flex;gap:10px;">
              <span class="badge badge-warning">${processing.items.length} Lots en cours</span>
              <span class="badge badge-info">${App.formatNumber(processing.poids/1000,1)} T</span>
            </div>
          </div>
          <div class="card-body" style="padding:0;">
             <div class="table-container">
               <table style="margin:0;">
                 <thead>
                   <tr>
                     <th>Date</th>
                     <th>Client</th>
                     <th>Espèce</th>
                     <th>Calibre</th>
                     <th class="td-right">Poids (kg)</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${processing.items.length === 0 ? '<tr><td colspan="5" class="td-center">Aucun lot en traitement</td></tr>' : 
                     processing.items.slice(0, 5).map(item => `
                       <tr>
                         <td>${App.formatDateFR(item.date)}</td>
                         <td>${item.client}</td>
                         <td class="td-bold">${item.espece}</td>
                         <td>${item.calibre}</td>
                         <td class="td-right td-bold">${App.formatNumber(item.poids,0)}</td>
                       </tr>
                     `).join('')}
                 </tbody>
               </table>
             </div>
          </div>
        </div>


      </div>
    `;

    this.renderCharts();
  },

  getAvgTemp(reading, key) {
    if (!reading || !reading.hourly) return reading[key] || null;
    const values = Object.values(reading.hourly).map(h => h[key]).filter(v => typeof v === 'number');
    if (values.length === 0) return null;
    return values.reduce((s,v) => s+v, 0) / values.length;
  },

  getTemperatureAlertsHtml(reading) {
    const alerts = [];
    ['chambre1', 'chambre2', 'entreposage'].forEach(key => {
      const avg = this.getAvgTemp(reading, key);
      if (avg !== null && avg > -14) {
        alerts.push(`${key === 'entreposage' ? 'Entreposage' : 'Chambre ' + key.slice(-1)} (${avg.toFixed(1)}°C)`);
      }
    });

    if (alerts.length === 0) return '';

    return `
      <div class="alerts-banner" style="background:rgba(239,68,68,0.1); border:1px solid var(--status-danger); border-radius:8px; padding:12px; margin-bottom:20px; display:flex; gap:12px; align-items:center;">
        <span style="font-size:1.5rem;">⚠️</span>
        <div style="color:var(--text-primary); font-size:0.9rem;">
          <strong style="color:var(--status-danger)">ALERTE TEMPÉRATURE :</strong> Moyenne hors normes dans : <strong>${alerts.join(', ')}</strong>
        </div>
      </div>
    `;
  },

  renderTempValue(value) {
    if (value === null || typeof value !== 'number') return `<div style="font-size:1.5rem;font-weight:800;color:var(--text-muted);">-- °C</div>`;
    const color = value > -14 ? 'var(--status-danger)' : 'var(--primary-color)';
    return `<div style="font-size:1.5rem;font-weight:800;color:${color};">${value.toFixed(1)}°C</div>`;
  },

  getUnassignedStockHtml(tonUnassigned) {
    if (tonUnassigned <= 0) return '';
    return `
      <div class="alerts-banner" style="background:rgba(245,158,11,0.1); border:1px solid var(--status-warning); border-radius:8px; padding:12px; margin-bottom:20px; display:flex; gap:12px; align-items:center;">
        <span style="font-size:1.5rem;">📦</span>
        <div style="color:var(--text-primary); font-size:0.9rem;">
          <strong style="color:var(--status-warning)">Stock non affecté :</strong> ${App.formatNumber(tonUnassigned, 2)} T ne sont pas rattachées à une chambre.
        </div>
      </div>
    `;
  },

  getCapacityStats() {
    const stats = { chambre1: 0, chambre2: 0, entreposage: 0, direct: 0, non_affecte: 0 };
    (App.data.stockage || []).forEach(entry => {
      (entry.lignes || []).forEach((line, idx) => {
        const emplacement = line.chambre && stats[line.chambre] !== undefined ? line.chambre : 'non_affecte';
        const available = typeof Stockage !== 'undefined' && Stockage.getLineAvailable
          ? Stockage.getLineAvailable(entry, idx)
          : { poids: line.pdsNetTotal || 0 };
        stats[emplacement] += Math.max(0, available.poids || 0);
      });
    });
    return stats;
  },

  getInventoryByChambre() {
    const inventory = {
      chambre1: { lots: [], caisses: 0, poids: 0 },
      chambre2: { lots: [], caisses: 0, poids: 0 },
      entreposage: { lots: [], caisses: 0, poids: 0 },
      direct: { lots: [], caisses: 0, poids: 0 },
      non_affecte: { lots: [], caisses: 0, poids: 0 }
    };

    (App.data.stockage || []).forEach(entry => {
      (entry.lignes || []).forEach((line, idx) => {
        const chambre = line.chambre && inventory[line.chambre] ? line.chambre : 'non_affecte';
        const available = typeof Stockage !== 'undefined' && Stockage.getLineAvailable
          ? Stockage.getLineAvailable(entry, idx)
          : { quantite: line.nbCaisses || 0, poids: line.pdsNetTotal || 0 };

        if ((available.quantite || 0) <= 0 && (available.poids || 0) <= 0) return;

        const lot = {
          recId: entry.id,
          lineIdx: idx,
          reference: entry.reference,
          date: entry.dateEntree,
          client: entry.client || '-',
          espece: line.espece || '-',
          calibre: line.calibre || '-',
          caisses: available.quantite || 0,
          poids: available.poids || 0
        };

        inventory[chambre].lots.push(lot);
        inventory[chambre].caisses += lot.caisses;
        inventory[chambre].poids += lot.poids;
      });
    });
    return inventory;
  },

  showChambreDetail(chambre) {
    const inventory = this.getInventoryByChambre();
    const group = inventory[chambre] || { lots: [], caisses: 0, poids: 0 };
    const label = chambre.charAt(0).toUpperCase() + chambre.slice(1);

    const body = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Lot</th>
              <th>Client</th>
              <th>Produit</th>
              <th class="td-right">Caisses</th>
              <th class="td-right">Poids Net</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${group.lots.length === 0 ? '<tr><td colspan="7" class="td-center">Aucun stock</td></tr>' : 
              group.lots.map(lot => `
                <tr>
                  <td>${App.formatDateFR(lot.date)}</td>
                  <td class="td-bold">${lot.reference}</td>
                  <td>${lot.client}</td>
                  <td><strong>${lot.espece}</strong><br><small>${lot.calibre}</small></td>
                  <td class="td-right">${App.formatNumber(lot.caisses,0)}</td>
                  <td class="td-right td-bold">${App.formatNumber(lot.poids,2)} kg</td>
                  <td>
                    <button class="btn-icon" title="Déplacer" onclick="App.closeModal(); Stockage.showMoveChambreModal(${lot.recId})">🔄</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    `;

    App.showModal(`Détail ${label}`, body, `<button class="btn btn-outline" onclick="App.closeModal()">Fermer</button>`);
  },

  getProcessingInventory() {
    const items = (App.data.production || [])
      .filter(p => !p.poidsPF) 
      .map(p => ({
        id: p.id,
        date: p.date,
        client: p.client || '-',
        espece: p.espece || '-',
        calibre: p.calibre || '-',
        poids: p.poidsMP || p.poidsPI || 0
      }));

    return { items, poids: items.reduce((s, i) => s + i.poids, 0) };
  },

  showProcessingDetail() {
    const processing = this.getProcessingInventory();
    const body = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Produit</th>
              <th class="td-right">Poids Entrée</th>
            </tr>
          </thead>
          <tbody>
            ${processing.items.length === 0 ? '<tr><td colspan="4" class="td-center">Aucun lot en cours</td></tr>' : 
              processing.items.map(item => `
                <tr>
                  <td>${App.formatDateFR(item.date)}</td>
                  <td>${item.client}</td>
                  <td><strong>${item.espece}</strong><br><small>${item.calibre}</small></td>
                  <td class="td-right td-bold">${App.formatNumber(item.poids,2)} kg</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    `;
    App.showModal('Salle de Traitement', body, `<button class="btn btn-outline" onclick="App.closeModal()">Fermer</button>`);
  },

  renderCharts() {
    App.destroyCharts();
    const lastReading = App.data.chambresHistory[App.data.chambresHistory.length - 1];
    if (!lastReading || !lastReading.hourly) return;

    const labels = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`);
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 9 }, maxRotation: 0 } },
        y: { min: -30, max: 0, ticks: { font: { size: 9 } } }
      },
      elements: { line: { tension: 0.3 }, point: { radius: 2, hoverRadius: 4 } }
    };

    const keys = ['chambre1', 'chambre2', 'entreposage'];
    const ids = ['chartCh1', 'chartCh2', 'chartEnt'];
    const colors = ['#0B2D6B', '#2563FF', '#16C784'];

    keys.forEach((key, i) => {
      const ctx = document.getElementById(ids[i]);
      if (!ctx) return;
      const data = labels.map(time => lastReading.hourly[time]?.[key] ?? null);
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: colors[i],
            backgroundColor: colors[i] + '22',
            borderWidth: 2,
            fill: true
          }]
        },
        options: chartOptions
      });
    });
  },

  showLogTempModal() {
    const date = App.formatDate(new Date());
    const existing = (App.data.chambresHistory || []).find(h => h.date === date) || {};
    const hourly = existing.hourly || {};

    const hours = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const body = `
      <div style="margin-bottom:15px;">
        <label class="form-label">Date des relevés</label>
        <input type="date" class="form-input" id="logTempDate" value="${date}" onchange="Chambres.refreshLogModal(this.value)">
      </div>
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
        <table class="table-compact">
          <thead style="position: sticky; top: 0; background: white; z-index: 10;">
            <tr>
              <th>Heure</th>
              <th>CH 1 (°C)</th>
              <th>CH 2 (°C)</th>
              <th>ENT (°C)</th>
            </tr>
          </thead>
          <tbody id="hourlyTableBody">
            ${hours.map(h => `
              <tr>
                <td style="font-weight:700;">${h}</td>
                <td><input type="number" step="0.1" class="form-input-sm" data-hour="${h}" data-key="chambre1" value="${hourly[h]?.chambre1 ?? ''}"></td>
                <td><input type="number" step="0.1" class="form-input-sm" data-hour="${h}" data-key="chambre2" value="${hourly[h]?.chambre2 ?? ''}"></td>
                <td><input type="number" step="0.1" class="form-input-sm" data-hour="${h}" data-key="entreposage" value="${hourly[h]?.entreposage ?? ''}"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    App.showModal('🌡️ Relevés Thermographe (24h)', body, `
      <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="Chambres.saveHourlyReadings()">💾 Enregistrer</button>
    `);
  },

  refreshLogModal(date) {
    const existing = (App.data.chambresHistory || []).find(h => h.date === date) || {};
    const hourly = existing.hourly || {};
    const inputs = document.querySelectorAll('#hourlyTableBody input');
    inputs.forEach(input => {
      const h = input.dataset.hour;
      const key = input.dataset.key;
      input.value = hourly[h]?.[key] ?? '';
    });
  },

  saveHourlyReadings() {
    const date = document.getElementById('logTempDate').value;
    if (!date) return;

    const hourly = {};
    document.querySelectorAll('#hourlyTableBody tr').forEach(tr => {
      const hour = tr.querySelector('td').textContent;
      const ch1Input = tr.querySelector('[data-key="chambre1"]');
      const ch2Input = tr.querySelector('[data-key="chambre2"]');
      const entInput = tr.querySelector('[data-key="entreposage"]');
      
      const ch1 = parseFloat(ch1Input.value);
      const ch2 = parseFloat(ch2Input.value);
      const ent = parseFloat(entInput.value);
      
      if (!isNaN(ch1) || !isNaN(ch2) || !isNaN(ent)) {
        hourly[hour] = {
          chambre1: isNaN(ch1) ? null : ch1,
          chambre2: isNaN(ch2) ? null : ch2,
          entreposage: isNaN(ent) ? null : ent
        };
      }
    });

    if (Object.keys(hourly).length === 0) {
      App.toast('Veuillez saisir au moins un relevé', 'error');
      return;
    }

    const history = App.data.chambresHistory || [];
    const idx = history.findIndex(h => h.date === date);
    const entry = { date, hourly };

    if (idx >= 0) history[idx] = entry;
    else history.push(entry);

    // Keep history sorted by date
    App.data.chambresHistory = history.sort((a,b) => a.date.localeCompare(b.date));
    
    App.saveData();
    App.closeModal();
    this.render();
    App.toast('Relevés enregistrés', 'success');
  }
};
