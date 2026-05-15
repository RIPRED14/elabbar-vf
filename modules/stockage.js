/* ============================================
   STOCKAGE — Réception, Sorties et Traçabilité
   ============================================ */
const Stockage = {
  applyAIData(data) {
    if (!data) return;
    this.currentTab = 'entrees';
    
    // Normalisation de la date
    if (data.date) data.date = App.formatDateISO(data.date);

    // Préparation des lignes avec Fuzzy Matching
    if (data.lignes && data.lignes.length > 0) {
      const speciesList = (App.data.especes || []).map(e => e.nom);
      this.currentLignes = data.lignes.map(l => ({
        ...this.emptyLigne(),
        espece: App.AI.fuzzyMatch(l.espece, speciesList),
        calibre: l.calibre || '',
        nbCaisses: parseInt(l.nbCaisses) || 0,
        quantite: parseFloat(l.quantite) || 0,
        pdsNetTotal: parseFloat(l.quantite) || 0, // Par défaut Pds Net = Qté Reçue
        pdsBrutMoy: (parseFloat(l.quantite) || 0) / (parseInt(l.nbCaisses) || 1)
      }));
    } else {
      this.currentLignes = [this.emptyLigne()];
    }

    this.render();
    this.showForm(); // showForm utilisera this.currentLignes s'il est défini

    // Injection des métadonnées dans le DOM
    setTimeout(() => {
      const setVal = (id, val) => { 
        const el = document.getElementById(id); 
        if (el && val) el.value = val; 
      };

      setVal('sDateEntree', data.date);
      setVal('sBateau', data.bateau);
      setVal('sClient', data.client);
      setVal('sFournisseur', data.fournisseur || data.client);
      
      if (data.client) this.onClientChange();
      this.calcTotals();
      
      App.toast("Données de réception injectées par l'IA.", "success");
    }, 150);
  },

  renderLignes() {
    const body = document.getElementById('lignesBody');
    if (!body) return;
    const lines = this.currentLignes || [this.emptyLigne()];
    body.innerHTML = lines.map((l, i) => this.renderLigneRow(l, i)).join('');
    this.calcTotals();
  },

  editingId: null,
  currentTab: 'entrees',

  render() {
    this.currentTab = this.currentTab || 'entrees';
    const content = document.getElementById('pageContent');
    if (!content) return;

    const pendingCount = (App.data.pendingStorageEntries || []).filter(e => e.status === 'pending').length;

    let tabContent = '';
    if (this.currentTab === 'entrees') {
      tabContent = this.renderEntrees();
    } else if (this.currentTab === 'sorties') {
      tabContent = this.renderSorties();
    } else if (this.currentTab === 'pending') {
      tabContent = this.renderPendingEntries();
    } else if (this.currentTab === 'direct') {
      tabContent = this.renderDirectFlow();
    } else if (this.currentTab === 'mouvements') {
      tabContent = this.renderMouvements();
    }

    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px;">
          <div>
            <nav style="display:flex; gap:8px; margin-bottom:12px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
              <span>Stockage</span>
              <span>/</span>
              <span style="color:var(--accent-blue);">${this.currentTab === 'entrees' ? 'Réceptions' : this.currentTab === 'sorties' ? 'Sorties' : this.currentTab === 'pending' ? 'Attente' : 'Traçabilité'}</span>
            </nav>
            <h2 class="page-title">Réception & Stockage</h2>
            <p class="page-subtitle">Gestion intelligente des flux de marchandise et traçabilité temps réel.</p>
          </div>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-outline" onclick="Stockage.printList()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
              <span>Imprimer</span>
            </button>
            ${this.currentTab === 'entrees' ? `
              <button class="btn btn-outline" onclick="Stockage.startScanner()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h2v2H7z"/><path d="M7 15h2v2H7z"/><path d="M15 7h2v2h-2z"/><path d="M15 15h2v2h-2z"/></svg>
                <span>Scanner QR</span>
              </button>
              <button class="btn btn-primary" onclick="Stockage.showForm()">
                <span>+ Nouvelle Entrée</span>
              </button>
            ` : ''}
            ${this.currentTab === 'sorties' ? `
              <button class="btn btn-primary" onclick="Stockage.showSortieForm()">
                <span>+ Nouvelle Sortie</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="tabs" style="margin-bottom:32px;">
          <div class="tab ${this.currentTab==='entrees'?'active':''}" onclick="Stockage.switchTab('entrees')">📥 Réceptions</div>
          <div class="tab ${this.currentTab==='sorties'?'active':''}" onclick="Stockage.switchTab('sorties')">📤 Sorties</div>
          <div class="tab ${this.currentTab==='pending'?'active':''}" onclick="Stockage.switchTab('pending')">
            ⏳ Attente 
            ${pendingCount > 0 ? `<span class="badge" style="background:var(--status-danger); color:white; padding:2px 6px; margin-left:6px;">${pendingCount}</span>` : ''}
          </div>
          <div class="tab ${this.currentTab==='direct'?'active':''}" onclick="Stockage.switchTab('direct')">🚀 Flux Direct</div>
          <div class="tab ${this.currentTab==='mouvements'?'active':''}" onclick="Stockage.switchTab('mouvements')">🔄 Traçabilité</div>
        </div>

        <div id="stockageFormContainer"></div>

        <div class="slide-up">
          ${tabContent}
        </div>
      </div>
    `;

    if (this.currentTab === 'entrees') {
      this.calcTotals();
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  /* --- ONGLET ENTRÉES --- */
  renderEntrees() {
    const entries = App.data.stockage || [];
    const monthEntries = this.getMonthEntries();
    return `
      <div class="kpi-grid">
        <div class="kpi-card blue">
          <div class="kpi-icon blue">📥</div>
          <div class="kpi-label">Entrées ce mois</div>
          <div class="kpi-value">${monthEntries.length}</div>
          <div class="kpi-change up">↑ Actif</div>
        </div>
        <div class="kpi-card purple">
          <div class="kpi-icon purple">📦</div>
          <div class="kpi-label">Total Caisses</div>
          <div class="kpi-value">${App.formatNumber(monthEntries.reduce((s,e)=>s+e.lignes.reduce((ss,l)=>ss+(l.nbCaisses||0),0),0),0)}</div>
          <div class="kpi-change">Volumes mensuels</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon green">⚖️</div>
          <div class="kpi-label">Poids Net Total</div>
          <div class="kpi-value">${App.formatNumber(monthEntries.reduce((s,e)=>s+e.lignes.reduce((ss,l)=>ss+(l.pdsNetTotal||0),0),0),0)}<span class="kpi-unit">kg</span></div>
          <div class="kpi-change up">↑ Stock stable</div>
        </div>
        <div class="kpi-card cyan">
          <div class="kpi-icon cyan">🚢</div>
          <div class="kpi-label">Navires actifs</div>
          <div class="kpi-value">${new Set(monthEntries.flatMap(e=>[e.bateau, ...e.lignes.map(l=>l.bateau)]).filter(Boolean)).size}</div>
          <div class="kpi-change">Diversité d'origine</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Historique des Réceptions</span>
          <div class="badge badge-info">${entries.length} entrées totales</div>
        </div>
        <div class="card-body">
          <div class="table-container" id="stockageListTable">
            ${this.buildListTable()}
          </div>
        </div>
      </div>
    `;
  },

  getMonthEntries() {
    const now = new Date();
    return (App.data.stockage || []).filter(e => {
      const d = new Date(e.dateEntree);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  },

  getLineSorties(receptionId, lineIdx) {
    return (App.data.sortiesStockage || []).filter(s => s.receptionId === receptionId && s.lineIdx === lineIdx);
  },

  getLineUsedQty(receptionId, lineIdx) {
    return this.getLineSorties(receptionId, lineIdx).reduce((s, sortie) => s + (sortie.quantite || 0), 0);
  },

  getLineUsedWeight(receptionId, lineIdx) {
    return this.getLineSorties(receptionId, lineIdx).reduce((s, sortie) => s + (sortie.poidsSorti || 0), 0);
  },

  getLineAvailable(entry, lineIdx) {
    const line = entry?.lignes?.[lineIdx];
    if (!line) return { quantite: 0, poids: 0, usedQty: 0, usedWeight: 0 };
    const usedQty = this.getLineUsedQty(entry.id, lineIdx);
    const usedWeight = this.getLineUsedWeight(entry.id, lineIdx);
    return {
      quantite: Math.max(0, (line.nbCaisses || 0) - usedQty),
      poids: Math.max(0, (line.pdsNetTotal || 0) - usedWeight),
      usedQty,
      usedWeight
    };
  },

  renderDirectFlow() {
    const entries = (App.data.stockage || []).filter(e => 
      e.lignes.some(l => l.chambre === 'direct')
    ).sort((a,b) => new Date(b.dateEntree) - new Date(a.dateEntree));

    return `
      <div class="card">
        <div class="card-header" style="background:linear-gradient(135deg, rgba(245,158,11,0.1), transparent); border-bottom:1px solid rgba(245,158,11,0.2);">
          <span class="card-title">🚀 Lots en Passage Direct</span>
          <div class="badge badge-warning">${entries.length} flux en cours</div>
        </div>
        <div class="card-body">
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:20px;">
            Ces lots sont enregistrés dans le système mais contournent le stockage en chambre froide pour une utilisation immédiate en production.
          </p>
          <div class="table-container">
            ${this.buildListTable(entries)}
          </div>
        </div>
      </div>
    `;
  },

  buildListTable(filteredEntries) {
    const entries = (filteredEntries || App.data.stockage || []).sort((a,b) => new Date(b.dateEntree) - new Date(a.dateEntree));
    if (entries.length === 0) return '<div class="empty-state"><div class="empty-state-icon">📥</div><div class="empty-state-text">Aucune entrée de stockage</div></div>';
    return `<table>
      <thead><tr><th>Référence</th><th>N° / Info Palette</th><th>Date</th><th>Client</th><th>Fournisseur</th><th>Origine</th><th>Emplacement</th><th class="td-right">Lignes</th><th class="td-right">Qté (Cs)</th><th class="td-right">Pds Brut</th><th class="td-right">Pds Net</th><th>Actions</th></tr></thead>
      <tbody>${entries.map(e => {
        const totalNbCs = e.lignes.reduce((s,l) => s + (l.nbCaisses||0), 0);
        const totalBrut = e.lignes.reduce((s,l) => s + (l.quantite||l.pdsBrutTotal||0), 0);
        const totalNet = e.lignes.reduce((s,l) => s + (l.pdsNetTotal||0), 0);
        const palettes = e.lignes.map((l, idx) => this.getKanbanLabel(e, l, idx)).filter(Boolean);
        const paletteSummary = palettes.length > 1
          ? `${palettes[0]} <span class="badge badge-info" style="margin-left:6px;">+${palettes.length - 1}</span>`
          : (palettes[0] || '-');
        
        const isTransfer = !!e.sourceProductionId;
        const originClass = (e.origine === 'Traitement' || e.sourceProductionType === 'traitement') ? 'badge-warning' : 
                           (e.origine === 'Reconditionnement' || e.sourceProductionType === 'reconditionnement') ? 'badge-purple' : 'badge-info';
        
        let originLabel = e.origine;
        if (isTransfer) {
          const typeLabel = e.sourceProductionType === 'traitement' ? 'Traitement' : 'Reconditionnement';
          originLabel = `${typeLabel} ${e.bateau ? `<span style="opacity:0.8;font-size:0.65rem;">(${e.bateau})</span>` : ''}`;
        }

        const chambers = [...new Set(e.lignes.map(l => l.chambre || 'non_affecte'))];
        const chamberBadges = chambers.map(ch => {
          const cls = ch === 'direct' ? 'badge-warning' : (ch === 'non_affecte' ? 'badge-danger' : 'badge-info');
          const label = ch === 'direct' ? '🚀 Flux Direct' : (ch === 'chambre1' ? '❄️ CH 1' : ch === 'chambre2' ? '❄️ CH 2' : ch === 'entreposage' ? '📦 Ent.' : 'N/A');
          return `<span class="badge ${cls}" style="font-size:0.65rem; padding:2px 6px;">${label}</span>`;
        }).join(' ');

        return `<tr>
          <td class="td-bold"><span class="badge badge-purple">${e.reference}</span></td>
          <td><span style="font-size:0.72rem;color:var(--accent-cyan);font-weight:700;max-width:240px;display:inline-block;white-space:normal;word-break:break-word;line-height:1.45;">${paletteSummary}</span></td>
          <td>${App.formatDateFR(e.dateEntree)}</td>
          <td>${e.client}</td>
          <td>${e.fournisseur}</td>
          <td><span class="badge ${originClass}">${originLabel}</span></td>
          <td>${chamberBadges}</td>
          <td class="td-right">${e.lignes.length}</td>
          <td class="td-right td-bold">${App.formatNumber(totalNbCs,0)}</td>
          <td class="td-right">${App.formatNumber(totalBrut,2)} kg</td>
          <td class="td-right">${App.formatNumber(totalNet,2)} kg</td>
          <td class="td-center" style="white-space:nowrap;">
            <button class="btn-icon" onclick="Stockage.viewEntry(${e.id})" title="Voir détail"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="btn-icon" onclick="Stockage.showMoveChambreModal(${e.id})" title="Changer d'emplacement" style="color:var(--accent-orange);">🔄</button>
            ${!isTransfer ? `<button class="btn-icon" onclick="Stockage.editEntry(${e.id})" title="Modifier"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>` : ''}
            <button class="btn-icon" onclick="Stockage.printBon(${e.id})" title="Imprimer le Bon">🖨️</button>
            <button class="btn-icon" style="color:var(--accent-red);" onclick="Stockage.deleteEntry(${e.id})" title="Supprimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  getKanbanLabel(entry, line, idx = 0) {
    if (line?.palette) return line.palette;
    if (!entry || !line) return '';
    const dateFormatted = App.formatDateFR ? App.formatDateFR(entry.dateEntree) : entry.dateEntree;
    const tare = line.tarePalette || entry.tarePaletteDefaut || 25;
    return `P${idx + 1} | T:${tare}kg | ${entry.client || '-'} | ${entry.fournisseur || '-'} | ${line.espece || '-'} | ${line.pdsNetTotal || 0}kg | ${dateFormatted}`;
  },

  showForm(entry = null) {
    this.editingId = entry ? entry.id : null;
    
    // Si on a des lignes pré-chargées (via IA) et qu'on n'édite pas une entrée existante
    let lignes = [this.emptyLigne()];
    if (entry) {
      lignes = entry.lignes;
    } else if (this.currentLignes && this.currentLignes.length > 0) {
      lignes = this.currentLignes;
      // On vide currentLignes après usage pour éviter les effets de bord au prochain showForm manuel
      this.currentLignes = null; 
    }
    
    const container = document.getElementById('stockageFormContainer');
    const nextRef = entry ? entry.reference : this.generateRef();

    container.innerHTML = `
      <div class="card slide-up" style="margin-bottom:22px;">
        <div class="card-header" style="background:var(--bg-card);border-radius:var(--radius-md) var(--radius-md) 0 0;display:flex;justify-content:space-between;align-items:center;padding:1.5rem;">
          <span class="card-title" style="color:var(--primary-color);font-size:1.2rem;font-weight:700;">${entry ? '✏️ Modifier l\'entrée' : '📥 Nouvelle Entrée Stockage'}</span>
          <button class="btn-icon" style="background:var(--bg-app);" onclick="Stockage.hideForm()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="card-body">
          ${entry && entry.sourceProductionId ? `
            <div style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:8px; padding:12px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
              <div style="font-size:1.5rem;">ℹ️</div>
              <div style="font-size:0.85rem; color:var(--primary-color);">
                <strong>Fiche en lecture seule</strong> — Ce lot provient d\'un transfert de production (#${entry.sourceProductionId}). 
                Les données sont verrouillées pour garantir l\'intégrité de la traçabilité.
              </div>
            </div>
          ` : ''}
          <div class="form-section">
            <div class="form-section-title">🔹 Informations de réception</div>
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div class="form-group"><label class="form-label">Référence *</label><input type="text" class="form-input" id="sRef" value="${nextRef}"></div>
              <div class="form-group"><label class="form-label">Date entrée *</label><input type="date" class="form-input" id="sDateEntree" value="${entry ? App.formatDate(entry.dateEntree) : App.formatDate(new Date())}" onchange="Stockage.calcDateSortie()"></div>
              <div class="form-group"><label class="form-label">🚢 Bateau *</label>
                <select class="form-select" id="sBateau" onchange="Stockage.onBateauChange()">
                  <option value="">-- Choisir Bateau --</option>
                  ${this.getBateauOptions(entry?.client, entry?.bateau || (entry?.lignes?.[0]?.bateau) || '')}
                </select>
              </div>
              <div class="form-group"><label class="form-label">Client *</label>
                <select class="form-select" id="sClient" onchange="Stockage.onClientChange()">
                  <option value="">-- Choisir Client --</option>
                  ${(App.data.clients||[]).map(c => `<option value="${c.nom}" ${entry?.client===c.nom?'selected':''}>${c.nom}</option>`).join('')}
                </select>
              </div>
              <div class="form-group"><label class="form-label">Fournisseur *</label>
                <select class="form-select" id="sFournisseur">
                  <option value="">-- Choisir Fournisseur --</option>
                  ${(App.data.clients||[]).map(c => `<option value="${c.nom}" ${entry?.fournisseur===c.nom?'selected':''}>${c.nom}</option>`).join('')}
                </select>
              </div>
              <div class="form-group"><label class="form-label">Consignataire</label><input type="text" class="form-input" id="sConsignataire" value="${entry?.consignataire||''}" placeholder="Ex: WEST MAGHREB SHIPPING" list="consignatairesList">
                <datalist id="consignatairesList">${[...new Set((App.data.stockage||[]).map(e=>e.consignataire).filter(Boolean))].map(c=>`<option value="${c}">`).join('')}</datalist>
              </div>
              <div class="form-group"><label class="form-label">Véhicule</label><input type="text" class="form-input" id="sVehicule" value="${entry?.vehicule||''}" placeholder="Ex: 22246-A-59"></div>
              <div class="form-group"><label class="form-label">Origine *</label>
                <select class="form-select" id="sOrigine">
                  <option value="Congelé" ${entry?.origine==='Congelé'?'selected':''}>Congelé</option>
                  <option value="Frais" ${entry?.origine==='Frais'?'selected':''}>Frais</option>
                  <option value="Traitement" ${entry?.origine==='Traitement'?'selected':''}>Traitement</option>
                  <option value="Reconditionnement" ${entry?.origine==='Reconditionnement'?'selected':''}>Reconditionnement</option>
                </select>
              </div>
            </div>
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top:14px;">
              <div class="form-group"><label class="form-label">Référence capture</label><input type="text" class="form-input" id="sRefCapture" value="${entry?.refCapture||''}"></div>
              <div class="form-group"><label class="form-label">Séjour prév. (jours)</label><input type="number" class="form-input" id="sSejour" value="${entry?.sejour||''}" placeholder="Ex: 30" onchange="Stockage.calcDateSortie()"></div>
              <div class="form-group"><label class="form-label">Date sortie prév.</label><input type="date" class="form-input" id="sDateSortie" value="${entry?.dateSortie||''}"></div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center; margin-bottom: 15px;">
              <span style="font-size: 1.1rem;">🔹 Lignes de réception</span>
              <div style="display:flex; gap:10px;">
                <input type="file" id="ocrInputStock" accept="image/*" capture="environment" style="display:none" onchange="Stockage.processOCR(event)">
                <button class="btn btn-primary btn-sm" style="background:#0ea5e9;border-color:#0ea5e9;" onclick="document.getElementById('ocrInputStock').click()">📸 Lire Bon (IA)</button>
                <button class="btn btn-success btn-sm" onclick="Stockage.addLigne()">+ Ajouter une ligne</button>
                <button class="btn btn-primary btn-sm" onclick="Stockage.startScanner()">📷 Scanner QR</button>
              </div>
            </div>
            <div id="ocrLoadingAreaStock" style="display:none; text-align:center; padding:15px; background:rgba(15,23,42,0.45); border:1px dashed var(--accent-cyan); border-radius:8px; margin-bottom:15px;">
              <div style="color:var(--accent-cyan); font-weight:bold; margin-bottom:5px;">🤖 Analyse du bon par l\'IA...</div>
              <div style="font-size:12px; color:var(--text-muted);">Extraction des espèces, calibres et poids en cours.</div>
            </div>
            <div style="overflow-x:auto; margin-top: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <table id="lignesTable" style="width:100%; min-width: 1200px;">
                <thead style="background: var(--bg-tertiary);"><tr>
                  <th style="width:40px">#</th>
                  <th style="width:140px">N° / Info Palette</th>
                  <th>Espèce</th>
                  <th>Calibre</th>
                  <th style="width:80px">Emb.</th>
                  <th style="width:70px">Nb Cs</th>
                  <th style="width:80px">Qté BL (kg)</th>
                  <th style="width:80px">Qté Reçue (kg)</th>
                  <th style="width:80px">Tare Emb.</th>
                  <th style="width:80px">Tare Pal.</th>
                  <th style="width:90px">Pds Brut Moy</th>
                  <th style="width:100px">Pds Net Tot</th>
                  <th style="width:70px">Temp.</th>
                  <th>Emplacement</th>
                  <th>Note</th>
                  <th style="width:40px"></th>
                </tr></thead>
                <tbody id="lignesBody">
                  ${lignes.map((l, i) => this.renderLigneRow(l, i)).join('')}
                </tbody>
                <tfoot>
                  <tr style="background:rgba(99,102,241,0.15); font-weight: 700;">
                    <td colspan="5" style="padding: 12px; text-align: right; color: var(--text-secondary);">TOTAUX RÉCEPTION :</td>
                    <td class="td-right" id="totalNbCs" style="color: var(--text-primary);">0</td>
                    <td class="td-right" id="totalQtyBL" style="color: var(--accent-cyan);">0</td>
                    <td class="td-right" id="totalQty" style="color: var(--accent-green);">0</td>
                    <td></td><td></td><td></td>
                    <td class="td-right" id="totalNet" style="color: var(--accent-orange);">0</td>
                    <td colspan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style="display:flex;gap:15px;justify-content:center;margin-top:30px;padding:25px 0; border-top: 1px solid var(--border-color);">
            <button class="btn btn-outline" style="min-width: 150px;" onclick="Stockage.hideForm()">✕ ${entry && entry.sourceProductionId ? 'Fermer' : 'Annuler'}</button>
            ${!(entry && entry.sourceProductionId) ? `
              <button class="btn btn-primary" style="min-width: 250px; font-size: 1.1rem; box-shadow: var(--shadow-glow-purple);" onclick="Stockage.saveEntry()">
                💾 ${entry ? 'Mettre à jour la réception' : 'Enregistrer la réception'}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    this.calcTotals();
  },

  emptyLigne() {
    return { palette: '', espece: '', calibre: '', emballage: 'Cs', nbCaisses: 0, quantiteBL: 0, quantite: 0, tareEmballage: 0.5, tarePalette: 25, pdsBrutMoy: 0, pdsNetTotal: 0, temperature: -18, chambre: '', notaBene: '' };
  },

  updateDefaultTarePal() {
    // Cette fonction n\'est plus utilisée, on la garde vide par sécurité
  },

  getBateauOptions(clientNom, selectedBateau) {
    const client = (App.data.clients || []).find(c => c.nom === clientNom);
    const clientBateaux = client ? (client.bateaux || []).map(b => b.nom) : [];
    
    // Si un client est sélectionné, on montre d\'abord ses bateaux officiels
    // On ajoute les bateaux historiques seulement s'ils ne sont pas déjà dans la liste du client
    const historicalBateaux = [...new Set((App.data.stockage||[]).flatMap(e => [e.bateau, ...e.lignes.map(l => l.bateau)]).filter(Boolean))];
    
    let allBateaux = [];
    if (clientNom) {
      // Filtrage : Bateaux du client + Bateaux historiques qui ont été utilisés AVEC ce client auparavant
      const clientHistorical = [...new Set((App.data.stockage||[]).filter(e => e.client === clientNom).map(e => e.bateau).filter(Boolean))];
      allBateaux = [...new Set([...clientBateaux, ...clientHistorical])];
    } else {
      allBateaux = [...new Set([...clientBateaux, ...historicalBateaux])];
    }
    
    if (allBateaux.length === 0 && !clientNom) return '';
    
    return allBateaux.map(b => `<option value="${b}" ${selectedBateau === b ? 'selected' : ''}>${b}</option>`).join('');
  },

  onClientChange() {
    const clientNom = document.getElementById('sClient')?.value || '';
    const bateauSelect = document.getElementById('sBateau');
    if (!bateauSelect) return;
    
    // On met à jour la liste des options
    const optionsHtml = this.getBateauOptions(clientNom, '');
    bateauSelect.innerHTML = '<option value="">-- Choisir Bateau --</option>' + optionsHtml;
    
    // Feedback si aucun bateau n\'est trouvé
    if (clientNom && optionsHtml === '') {
      App.toast(`Aucun bateau enregistré pour le client "${clientNom}"`, 'warning');
    }
    
    // Auto-sélection du premier bateau disponible
    if (bateauSelect.options.length > 1) {
      bateauSelect.selectedIndex = 1; // Sélectionne le premier bateau de la liste
      App.toast(`Bateau "${bateauSelect.value}" sélectionné automatiquement`, 'info');
    }

    // Auto-sélection du fournisseur avec le nom du client
    const fournisseurField = document.getElementById('sFournisseur');
    if (fournisseurField && (!fournisseurField.value || fournisseurField.value === "")) {
      fournisseurField.value = clientNom;
    }
  },

  onBateauChange() {
    const bateau = document.getElementById('sBateau')?.value;
    if (!bateau) return;
    const clientSelect = document.getElementById('sClient');
    if (clientSelect && !clientSelect.value) {
      const client = (App.data.clients || []).find(c => (c.bateaux || []).some(b => b.nom === bateau));
      if (client) {
        clientSelect.value = client.nom;
        App.toast(`Client "${client.nom}" sélectionné automatiquement`, 'info');
        this.onClientChange();
        setTimeout(() => { document.getElementById('sBateau').value = bateau; }, 50);
      }
    }
  },

  calcDateSortie() {
    const dEntree = document.getElementById('sDateEntree')?.value;
    const jours = parseInt(document.getElementById('sSejour')?.value, 10);
    if (dEntree && !isNaN(jours) && jours > 0) {
      const d = new Date(dEntree);
      d.setDate(d.getDate() + jours);
      document.getElementById('sDateSortie').value = d.toISOString().split('T')[0];
    }
  },

  getCalibreOptions(especeNom, selectedCalibre) {
    const esp = (App.data.especes || []).find(e => e.nom === especeNom);
    const calibres = esp ? esp.calibres : [];
    let html = '<option value="">-- Calibre --</option>';
    calibres.forEach(c => {
      html += `<option value="${c}" ${selectedCalibre === c ? 'selected' : ''}>${c}</option>`;
    });
    return html;
  },

  onEspeceChangeLigne(idx) {
    const row = document.querySelector(`tr[data-idx="${idx}"]`);
    if (!row) return;
    const especeSelect = row.querySelector('[data-field="espece"]');
    const calibreSelect = row.querySelector('[data-field="calibre"]');
    if (!especeSelect || !calibreSelect) return;
    calibreSelect.innerHTML = this.getCalibreOptions(especeSelect.value, '');
  },

  renderLigneRow(l, idx) {
    const especes = App.data.especes || [];
    return `<tr data-idx="${idx}">
      <td class="td-center" style="color:var(--text-muted)">${idx+1}</td>
      <td><input type="text" class="form-input" style="width:130px;padding:5px;font-size:0.75rem;font-weight:600;background:var(--bg-tertiary);color:var(--text-muted);cursor:not-allowed;" value="${l.palette||''}" data-field="palette" placeholder="Auto-généré" readonly title="Généré automatiquement à l\'enregistrement"></td>
      <td>
        <select class="form-select" style="width:120px;padding:6px" data-field="espece" onchange="Stockage.onEspeceChangeLigne(${idx})">
          <option value="">-- Espèce --</option>
          ${especes.map(e => `<option value="${e.nom}" ${l.espece===e.nom?'selected':''}>${e.nom}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="form-select" style="width:100px;padding:6px" data-field="calibre" id="ligneCalibre_${idx}">
          ${this.getCalibreOptions(l.espece, l.calibre)}
        </select>
      </td>
      <td><select class="form-select" style="width:70px;padding:6px" data-field="emballage">
        <option value="Cs" ${l.emballage==='Cs'?'selected':''}>Cs</option>
        <option value="MST1" ${l.emballage==='MST1'?'selected':''}>MST1</option>
        <option value="Carton" ${l.emballage==='Carton'?'selected':''}>Carton</option>
        <option value="Sac" ${l.emballage==='Sac'?'selected':''}>Sac</option>
        <option value="Palette" ${l.emballage==='Palette'?'selected':''}>Palette</option>
      </select></td>
      <td><input type="number" class="form-input" style="width:60px;padding:6px" value="${l.nbCaisses||''}" data-field="nbCaisses" placeholder="Nb Cs" onchange="Stockage.calcRow(${idx})"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:75px;padding:6px" value="${l.quantiteBL||''}" data-field="quantiteBL" placeholder="Qté BL" onchange="Stockage.calcRow(${idx})"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:75px;padding:6px;font-weight:700" value="${l.quantite||''}" data-field="quantite" placeholder="Qté Reçue" onchange="Stockage.calcRow(${idx}, 'quantite')"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:65px;padding:6px" value="${l.tareEmballage!==undefined?l.tareEmballage:0.5}" data-field="tareEmballage" onchange="Stockage.calcRow(${idx})"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:65px;padding:6px" value="${l.tarePalette!==undefined?l.tarePalette:25}" data-field="tarePalette" onchange="Stockage.calcRow(${idx})"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:70px;padding:6px" value="${l.pdsBrutMoy||''}" data-field="pdsBrutMoy" onchange="Stockage.calcRow(${idx}, 'pdsBrutMoy')"></td>
      <td><input type="number" step="0.01" class="form-input" style="width:80px;padding:6px;font-weight:700" value="${l.pdsNetTotal||''}" data-field="pdsNetTotal" readonly></td>
      <td><input type="number" step="0.1" class="form-input" style="width:55px;padding:6px" value="${l.temperature||-18}" data-field="temperature"></td>
      <td><select class="form-select" style="width:120px;padding:6px;${!l.chambre || l.chambre===''?'border:1px solid var(--accent-orange);':''}" data-field="chambre" required>
        <option value="" ${!l.chambre || l.chambre==='' || l.chambre==='non_affecte'?'selected':''} disabled>⚠️ Obligatoire</option>
        <option value="chambre1" ${l.chambre==='chambre1'?'selected':''}>Chambre 1</option>
        <option value="chambre2" ${l.chambre==='chambre2'?'selected':''}>Chambre 2</option>
        <option value="entreposage" ${l.chambre==='entreposage'?'selected':''}>Entreposage</option>
        <option value="direct" ${l.chambre==='direct'?'selected':''}>🚀 Passage Direct</option>
      </select></td>
      <td><input type="text" class="form-input" style="width:100px;padding:6px;font-size:0.75rem" value="${l.notaBene||''}" data-field="notaBene" placeholder="N.B."></td>
      <td style="display:flex; gap:4px; padding-top:6px;">
        <button class="btn-icon" onclick="Stockage.printKanban(${idx})" title="Imprimer Kanban" style="width:28px;height:28px;background:var(--bg-secondary)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg></button>
        <button class="btn-icon danger" onclick="Stockage.removeLigne(${idx})" title="Supprimer" style="width:28px;height:28px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </td>
    </tr>`;
  },

  addLigne() {
    const body = document.getElementById('lignesBody');
    const idx = body.children.length;
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;
    tr.innerHTML = this.renderLigneRow(this.emptyLigne(), idx).replace(/^<tr[^>]*>/, '').replace(/<\/tr>$/, '');
    body.appendChild(tr);
  },

  addLigneWithData(espece, calibre) {
    const body = document.getElementById('lignesBody');
    const idx = body.children.length;
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;
    const l = this.emptyLigne();
    l.espece = espece;
    l.calibre = calibre;
    tr.innerHTML = this.renderLigneRow(l, idx).replace(/^<tr[^>]*>/, '').replace(/<\/tr>$/, '');
    body.appendChild(tr);
    this.calcTotals();
  },

  printKanban(idx) {
    const row = document.querySelector(`#lignesBody tr[data-idx="${idx}"]`);
    if (!row) return;

    const numPalette = row.querySelector('[data-field="palette"]').value || 'N/A';
    const espece = row.querySelector('[data-field="espece"]').value || '';
    const calibre = row.querySelector('[data-field="calibre"]').value || '';
    const pdsNet = row.querySelector('[data-field="pdsNetTotal"]').value || '0.00';
    const nbCaisses = row.querySelector('[data-field="nbCaisses"]').value || '0';
    
    const dateEntree = document.getElementById('sDateEntree')?.value || App.formatDate(new Date());
    const client = document.getElementById('sClient')?.value || 'Client inconnu';

    if (!espece) {
      App.toast("Veuillez sélectionner une espèce pour imprimer le Kanban.", "warning");
      return;
    }

    const qrData = {
      type: 'palette',
      palette: numPalette,
      client: client,
      date: dateEntree,
      espece: espece,
      calibre: calibre,
      net: parseFloat(pdsNet)
    };
    const qrString = JSON.stringify(qrData);

    let printDiv = document.getElementById('printKanbanContainer');
    if (!printDiv) {
      printDiv = document.createElement('div');
      printDiv.id = 'printKanbanContainer';
      printDiv.className = 'print-only';
      document.body.appendChild(printDiv);
    }

    // A6 label format style
    printDiv.innerHTML = `
      <div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:#000; background:#fff; width:100%; max-width:100mm; margin:0 auto; padding:15px; border:2px solid #000; border-radius:8px; text-align:center; box-sizing:border-box;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
          <h1 style="font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase;">PALETTE ${numPalette}</h1>
          <div style="font-size: 18px; margin-top: 5px; font-weight: bold;">${client}</div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 16px; text-align: left; margin-bottom:15px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
            <span style="font-weight: bold; color: #555;">PRODUIT</span>
            <span style="font-weight: bold; font-size: 18px;">${espece} ${calibre ? '- ' + calibre : ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
            <span style="font-weight: bold; color: #555;">DATE</span>
            <span style="font-weight: bold; font-size: 18px;">${App.formatDateFR(dateEntree)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
            <span style="font-weight: bold; color: #555;">CAISSES</span>
            <span style="font-weight: bold; font-size: 18px;">${nbCaisses}</span>
          </div>
        </div>

        <div style="background: #000; color: #fff; font-size: 26px; font-weight: bold; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
          ${pdsNet} KG NET
        </div>
        
        <div id="qrcode_kanban" style="display:flex; justify-content:center; margin-bottom:10px;"></div>
        
        <div style="font-size: 12px; color: #777;">ELABBAR ERP - Traçabilité Kanban</div>
      </div>
    `;

    if (typeof QRCode === 'undefined') {
      App.toast("Erreur: Bibliothèque QRCode introuvable", "error");
      return;
    }

    setTimeout(() => {
      document.getElementById("qrcode_kanban").innerHTML = "";
      new QRCode(document.getElementById("qrcode_kanban"), {
        text: qrString,
        width: 140,
        height: 140,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });
      setTimeout(() => { window.print(); }, 300);
    }, 100);
  },

  startScanner(targetCallback) {
    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div id="reader" style="width:100%;max-width:400px;background:black;border-radius:8px;overflow:hidden;"></div>
        <div id="scannerResult" style="text-align:center;color:var(--text-secondary);">En attente de scan...</div>
      </div>
    `;
    
    App.showModal('📷 Scanner un QR Code', html, `<button class="btn btn-outline" onclick="Stockage.stopScanner()">Fermer</button>`);
    
    const html5QrCode = new Html5Qrcode("reader");
    this.currentScanner = html5QrCode;
    
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      try {
        const data = JSON.parse(decodedText);
        if (data.type === 'espece_calibre') {
          if (targetCallback) {
            targetCallback(data.espece, data.calibre);
          } else {
            this.addLigneWithData(data.espece, data.calibre);
            App.toast(`Ajouté: ${data.espece} (Cal: ${data.calibre})`, 'success');
          }
          this.stopScanner();
        } else {
          document.getElementById('scannerResult').textContent = "QR Code invalide (pas une espèce)";
        }
      } catch (e) {
        document.getElementById('scannerResult').textContent = "QR Code non reconnu";
      }
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
      .catch(err => {
        document.getElementById('scannerResult').textContent = "Erreur caméra: " + err;
      });
  },

  stopScanner() {
    if (this.currentScanner) {
      this.currentScanner.stop().then(() => {
        this.currentScanner = null;
        App.closeModal();
      }).catch(err => {
        console.error(err);
        App.closeModal();
      });
    } else {
      App.closeModal();
    }
  },

  async processOCR(event) {
    const file = event.target.files[0];
    if (!file) return;

    App.AI.showOverlay("Analyse du Bon de Réception...");
    
    try {
      const prompt = `Extrait les informations de ce bon de réception de poisson. 
Renvoie un objet JSON avec la structure exacte suivante :
{
  "bateau": "Nom du bateau",
  "client": "Nom du client",
  "fournisseur": "Nom du fournisseur",
  "lignes": [
    { "espece": "Nom espece", "calibre": "Taille", "nbCaisses": 0, "quantite": 0.0, "emballage": "Plastique/Carton" }
  ]
}
Notes:
- Si le bateau/client n\'est pas clair, laisse vide.
- Pour les espèces, utilise les noms standards (SEPIA, POULPE, CALAMAR, etc.).
- "quantite" est le poids brut total par ligne.
- Les nombres doivent être au format décimal avec un point.`;

      const data = await App.AI.analyzeImage(file, prompt);
      
      // Fuzzy matching
      const speciesList = (App.data.especes || []).map(e => e.nom.toUpperCase());
      const clientsList = (App.data.clients || []).map(c => c.nom.toUpperCase());
      
      if (data.client) data.client = App.AI.fuzzyMatch(data.client, clientsList);
      
      if (data.lignes) {
        data.lignes.forEach(l => {
          l.espece = App.AI.fuzzyMatch(l.espece, speciesList);
        });
      }

      App.AI.hideOverlay();
      this.showAIReviewModal(data);
      
    } catch (error) {
      App.AI.hideOverlay();
      console.error(error);
      App.toast("Erreur OCR: " + error.message, "error");
    } finally {
      event.target.value = '';
    }
  },

  showAIReviewModal(data) {
    const linesHtml = (data.lignes || []).map((l, i) => `
      <div class="ai-review-card">
        <div style="font-weight:700; margin-bottom:8px; color:var(--primary-color);">Ligne #${i+1}</div>
        <div class="ai-review-field">
          <span class="ai-review-label">Espèce:</span>
          <span class="ai-review-value">${l.espece || '-'}</span>
        </div>
        <div class="ai-review-field">
          <span class="ai-review-label">Calibre:</span>
          <span class="ai-review-value">${l.calibre || '-'}</span>
        </div>
        <div class="ai-review-field">
          <span class="ai-review-label">Nb Caisses:</span>
          <span class="ai-review-value">${l.nbCaisses || 0}</span>
        </div>
        <div class="ai-review-field">
          <span class="ai-review-label">Poids:</span>
          <span class="ai-review-value">${l.quantite || 0} kg</span>
        </div>
      </div>
    `).join('');

    App.showModal("🤖 Validation de l'Extraction IA", `
      <div style="max-height:60vh; overflow-y:auto; padding-right:10px;">
        <p style="margin-bottom:15px; font-size:0.9rem; color:var(--text-secondary);">
          Veuillez vérifier les informations extraites par l\'IA avant de les insérer dans le formulaire.
        </p>
        
        <div class="ai-review-card">
          <div class="ai-review-field">
            <span class="ai-review-label">Bateau:</span>
            <span class="ai-review-value">${data.bateau || '-'}</span>
          </div>
          <div class="ai-review-field">
            <span class="ai-review-label">Client:</span>
            <span class="ai-review-value">${data.client || '-'}</span>
          </div>
          <div class="ai-review-field">
            <span class="ai-review-label">Fournisseur:</span>
            <span class="ai-review-value">${data.fournisseur || '-'}</span>
          </div>
        </div>

        <h4 style="margin:15px 0 10px 0; font-size:1rem;">📦 Lignes de réception</h4>
        ${linesHtml}
      </div>
    `, `
      <div style="display:flex; gap:12px;">
        <button class="btn btn-primary" id="btnConfirmAI">Importer les données</button>
        <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      </div>
    `);

    const btn = document.getElementById('btnConfirmAI');
    if (btn) {
      btn.onclick = () => {
        this.applyAIData(data);
        App.closeModal();
        App.toast("Données importées avec succès", "success");
      };
    }
  },

  applyAIData(data) {
    if (data.bateau) {
      const sel = document.getElementById('sBateau');
      if (sel) {
        if (![...sel.options].some(o => o.value === data.bateau)) {
          const opt = new Option(data.bateau, data.bateau);
          sel.add(opt);
        }
        sel.value = data.bateau;
      }
    }
    if (data.client) {
      const sel = document.getElementById('sClient');
      if (sel) {
        sel.value = data.client;
        this.onClientChange();
      }
    }
    if (data.fournisseur) {
      const sel = document.getElementById('sFournisseur');
      if (sel) sel.value = data.fournisseur;
    }

    if (data.lignes && data.lignes.length > 0) {
      const tbody = document.getElementById('lignesBody');
      if (tbody) {
        // Clear empty first line if present
        if (tbody.children.length === 1 && !tbody.querySelector('[data-field="espece"]')?.value) {
          tbody.innerHTML = '';
        }
        
        data.lignes.forEach((l) => {
          this.addLigne();
          const row = tbody.lastElementChild;
          if (row) {
            const idx = row.dataset.idx;
            const fEspece = row.querySelector('[data-field="espece"]');
            const fCalibre = row.querySelector('[data-field="calibre"]');
            const fNbCaisses = row.querySelector('[data-field="nbCaisses"]');
            const fQty = row.querySelector('[data-field="quantite"]');
            const fEmb = row.querySelector('[data-field="emballage"]');

            if (fEspece) {
              fEspece.value = l.espece || '';
              this.onEspeceChangeLigne(idx);
            }
            if (fCalibre) fCalibre.value = l.calibre || '';
            if (fNbCaisses) fNbCaisses.value = l.nbCaisses || 0;
            if (fQty) fQty.value = l.quantite || 0;
            if (fEmb && l.emballage) fEmb.value = l.emballage;
            
            this.calcRow(idx);
          }
        });
        this.calcTotals();
      }
    }
  },

  removeLigne(idx) {
    const rows = document.getElementById('lignesBody').querySelectorAll('tr');
    if (rows.length <= 1) { App.toast('Il faut au moins une ligne', 'error'); return; }
    rows[idx]?.remove();
    document.getElementById('lignesBody').querySelectorAll('tr').forEach((tr, i) => {
      tr.dataset.idx = i;
      tr.querySelector('td:first-child').textContent = i + 1;
    });
    this.calcTotals();
  },

  calcRow(idx, changedField = 'quantite') {
    const row = document.querySelector(`#lignesBody tr[data-idx="${idx}"]`);
    if (!row) return;
    const qtyBL = parseFloat(row.querySelector('[data-field="quantiteBL"]')?.value) || 0;
    const qtyRecue = parseFloat(row.querySelector('[data-field="quantite"]').value) || 0; // Ceci est le Poids Brut Total !
    const nbCaisses = parseFloat(row.querySelector('[data-field="nbCaisses"]')?.value) || 0;
    const tareEmb = parseFloat(row.querySelector('[data-field="tareEmballage"]').value) || 0;
    const tarePal = parseFloat(row.querySelector('[data-field="tarePalette"]').value) || 0;
    const palettes = parseFloat(row.querySelector('[data-field="palette"]').value) || 0;
    
    let brutMoy = parseFloat(row.querySelector('[data-field="pdsBrutMoy"]').value) || 0;

    // Si on modifie le Poids Brut Moyen, on calcule la Qté Reçue (Poids Brut Total)
    if (changedField === 'pdsBrutMoy') {
      if (nbCaisses > 0) {
        const calculatedTotal = brutMoy * nbCaisses;
        row.querySelector('[data-field="quantite"]').value = calculatedTotal.toFixed(2);
      }
    } else {
      // Sinon, on calcule le Poids Brut Moyen à partir de la Qté Reçue et du Nb Caisses
      if (nbCaisses > 0) {
        brutMoy = qtyRecue / nbCaisses;
        row.querySelector('[data-field="pdsBrutMoy"]').value = brutMoy.toFixed(2);
      }
    }

    // Le Poids Brut Total est la Qté Reçue
    const brutTotal = parseFloat(row.querySelector('[data-field="quantite"]').value) || 0;

    // Poids Net = Poids Brut Total - (Nb Caisses * Tare Emb)
    // NB: La tare palette n\'est plus déduite du calcul selon la règle métier
    const netTotal = Math.max(0, brutTotal - (nbCaisses * tareEmb));

    row.querySelector('[data-field="pdsNetTotal"]').value = netTotal.toFixed(2);

    const nbField = row.querySelector('[data-field="notaBene"]');
    if (nbField) {
      if (qtyBL > 0 && qtyRecue !== qtyBL) {
        nbField.value = `Écart: BL ${qtyBL} vs Reçu ${qtyRecue}`;
      } else if (qtyBL > 0 && qtyRecue === qtyBL) {
        if (nbField.value.startsWith('Écart:')) nbField.value = '';
      }
    }

    this.calcTotals();
  },

  calcTotals() {
    let totalNbCs = 0, totalQtyBL = 0, totalQty = 0, totalNet = 0;
    document.querySelectorAll('#lignesBody tr').forEach(row => {
      totalNbCs += parseFloat(row.querySelector('[data-field="nbCaisses"]')?.value) || 0;
      totalQtyBL += parseFloat(row.querySelector('[data-field="quantiteBL"]')?.value) || 0;
      totalQty += parseFloat(row.querySelector('[data-field="quantite"]')?.value) || 0; // C'est le Poids Brut
      totalNet += parseFloat(row.querySelector('[data-field="pdsNetTotal"]')?.value) || 0;
    });
    const el = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = App.formatNumber(v, 2); };
    el('totalNbCs', totalNbCs);
    el('totalQtyBL', totalQtyBL); el('totalQty', totalQty); el('totalNet', totalNet);
  },

  collectLignes() {
    const lignes = [];
    const globalBateau = document.getElementById('sBateau')?.value?.trim() || '';
    document.querySelectorAll('#lignesBody tr').forEach(row => {
      const g = (f) => row.querySelector(`[data-field="${f}"]`);
      lignes.push({
        palette: g('palette')?.value || '',
        bateau: globalBateau,
        espece: g('espece')?.value || '',
        calibre: g('calibre')?.value || '',
        emballage: g('emballage')?.value || 'Cs',
        nbCaisses: parseFloat(g('nbCaisses')?.value) || 0,
        quantiteBL: parseFloat(g('quantiteBL')?.value) || 0,
        quantite: parseFloat(g('quantite')?.value) || 0, // Poids Brut
        tareEmballage: parseFloat(g('tareEmballage')?.value) || 0,
        tarePalette: parseFloat(g('tarePalette')?.value) || 0,
        pdsBrutMoy: parseFloat(g('pdsBrutMoy')?.value) || 0,
        pdsBrutTotal: parseFloat(g('quantite')?.value) || 0, // Dupliqué pour la compatibilité
        pdsNetTotal: parseFloat(g('pdsNetTotal')?.value) || 0,
        temperature: parseFloat(g('temperature')?.value) || -18,
        chambre: g('chambre')?.value || 'non_affecte',
        notaBene: g('notaBene')?.value || ''
      });
    });
    return lignes;
  },

  generateRef() {
    const now = new Date();
    const yr = now.getFullYear().toString().slice(-2);
    const count = (App.data.stockage || []).length + 1;
    return `${yr}-${String(count).padStart(5, '0')}S`;
  },

  hideForm() { document.getElementById('stockageFormContainer').innerHTML = ''; this.editingId = null; },

  saveEntry() {
    const ref = document.getElementById('sRef').value.trim();
    const dateEntree = document.getElementById('sDateEntree').value;
    const client = document.getElementById('sClient').value.trim();
    const fournisseur = document.getElementById('sFournisseur').value.trim();
    if (!ref || !dateEntree || !client || !fournisseur) { App.toast('Remplissez les champs obligatoires (*)', 'error'); return; }

    const lignes = this.collectLignes();
    if (lignes.some(l => !l.espece || !l.calibre || l.quantite <= 0 || l.pdsNetTotal <= 0)) {
      App.toast('Chaque ligne doit avoir espèce, calibre, quantité reçue et poids net', 'error');
      return;
    }

    // Validation: Emplacement obligatoire
    if (lignes.some(l => !l.chambre || l.chambre === '' || l.chambre === 'non_affecte')) {
      App.toast('⚠️ L\'emplacement est obligatoire pour chaque ligne. Veuillez sélectionner une chambre.', 'error');
      return;
    }

    if (this.editingId) {
      const existing = (App.data.stockage || []).find(e => e.id === this.editingId);
      const invalidLine = lignes.find((line, idx) => {
        const used = this.getLineUsedQty(this.editingId, idx);
        return used > (line.quantite || 0);
      });
      if (existing && invalidLine) {
        App.toast('Modification impossible: une ligne a déjà plus de sorties que la nouvelle quantité reçue', 'error');
        return;
      }
    }

    // Auto-génération du N° Info Palette (Kanban) pour chaque ligne
    const dateFormatted = App.formatDateFR ? App.formatDateFR(dateEntree) : dateEntree;
    lignes.forEach((l, idx) => {
      const numPalette = idx + 1;
      const tare = l.tarePalette || 25;
      l.palette = `P${numPalette} | T:${tare}kg | ${client} | ${fournisseur} | ${l.espece} | ${l.pdsNetTotal}kg | ${dateFormatted}`;
    });

    const entry = {
      id: this.editingId || App.nextId(App.data.stockage || []),
      reference: ref, dateEntree, client, fournisseur,
      bateau: document.getElementById('sBateau').value.trim(),
      consignataire: document.getElementById('sConsignataire').value.trim(),
      vehicule: document.getElementById('sVehicule').value.trim(),
      refCapture: document.getElementById('sRefCapture').value.trim(),
      sejour: document.getElementById('sSejour').value.trim(),
      dateSortie: document.getElementById('sDateSortie').value,
      origine: document.getElementById('sOrigine').value,
      tarePaletteDefaut: parseFloat(document.getElementById('sTarePalDefaut')?.value) || 25,
      lignes,
    };

    if (!App.data.stockage) App.data.stockage = [];
    if (this.editingId) {
      const idx = App.data.stockage.findIndex(e => e.id === this.editingId);
      if (idx !== -1) App.data.stockage[idx] = entry;
    } else {
      App.data.stockage.push(entry);
    }

    App.saveData();
    this.hideForm();
    this.render();
    App.toast(this.editingId ? 'Entrée mise à jour' : 'Entrée enregistrée', 'success');
  },

  editEntry(id) {
    const entry = (App.data.stockage || []).find(e => e.id === id);
    if (entry) {
      // Logic for read-only entries from Production
      if (['Traitement', 'Reconditionnement'].includes(entry.origine)) {
        App.toast('🔍 Cette fiche provient d\'un transfert de production. Elle est consultable en lecture seule pour garantir l\'intégrité des données.', 'warning');
        this.viewEntry(id);
        return;
      }
      this.showForm(entry);
    }
  },

  deleteEntry(id) {
    const hasSorties = (App.data.sortiesStockage || []).some(s => s.receptionId === id);
    const hasProduction = (App.data.production || []).some(p => p.receptionId === id);
    if (hasSorties || hasProduction) {
      App.toast('Suppression bloquée: cette réception est liée à des sorties ou des saisies', 'error');
      return;
    }
    const entry = (App.data.stockage || []).find(e => e.id === id);
    const refLabel = entry ? entry.reference : id;
    App.showModal('🗑️ Confirmer la suppression', `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:2.5rem;margin-bottom:10px;">⚠️</div>
        <p style="font-size:1.1rem;margin-bottom:8px;">Voulez-vous vraiment supprimer l\'entrée <strong>${refLabel}</strong> ?</p>
        <p style="color:var(--text-muted);font-size:0.9rem;">Cette action est irréversible.</p>
      </div>
    `, `
      <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      <button class="btn btn-primary" style="background:var(--accent-red, #ef4444);" onclick="Stockage.confirmDelete(${id})">🗑️ Supprimer</button>
    `);
  },

  confirmDelete(id) {
    App.closeModal();
    App.data.stockage = (App.data.stockage || []).filter(e => e.id !== id);
    App.saveData();
    this.render();
    App.toast('Entrée supprimée', 'info');
  },

  viewEntry(id) {
    const e = (App.data.stockage || []).find(x => x.id === id);
    if (!e) return;
    const totalQty = e.lignes.reduce((s,l) => s+(l.quantite||0), 0);
    const totalBrut = e.lignes.reduce((s,l) => s+(l.pdsBrutTotal||0), 0);
    const totalNet = e.lignes.reduce((s,l) => s+(l.pdsNetTotal||0), 0);

    const isTransfer = !!e.sourceProductionId;
    const originClass = (e.origine === 'Traitement' || e.sourceProductionType === 'traitement') ? 'badge-warning' : 
                       (e.origine === 'Reconditionnement' || e.sourceProductionType === 'reconditionnement') ? 'badge-purple' : 'badge-info';
    const originLabel = isTransfer 
      ? `${e.origine} ${e.bateau ? `(${e.bateau})` : ''}`
      : e.origine;

    App.showModal(`📥 Entrée ${e.reference}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Date</span><br><strong>${App.formatDateFR(e.dateEntree)}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Client</span><br><strong>${e.client}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Fournisseur</span><br><strong>${e.fournisseur}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Consignataire</span><br><strong>${e.consignataire||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Véhicule</span><br><strong>${e.vehicule||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Origine</span><br><span class="badge ${originClass}">${originLabel}</span></div>
      </div>

      ${isTransfer ? `
        <div style="background:rgba(59,130,246,0.06); border-left:4px solid var(--primary-color); padding:14px; margin-bottom:18px; border-radius:4px;">
          <div style="font-weight:700; color:var(--primary-color); font-size:0.95rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
            <span>🏗️</span> Détails de Production
          </div>
          <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
            Ce lot est issu d\'un processus interne (<strong>${e.sourceProductionType === 'traitement' ? 'Traitement' : 'Reconditionnement'}</strong>). 
            Les paramètres de production ont été verrouillés pour garantir une traçabilité sans faille.
          </div>
          <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px solid rgba(0,0,0,0.05); padding-top:10px;">
             <div><span style="font-size:0.75rem; color:var(--text-muted);">ID Production:</span> <span class="badge badge-outline">#${e.sourceProductionId||'-'}</span></div>
             <div><span style="font-size:0.75rem; color:var(--text-muted);">Bateau Source:</span> <strong>${e.bateau || 'N/A'}</strong></div>
          </div>
        </div>
      ` : ''}

      <div class="table-container">
        <table>
          <thead><tr><th>#</th><th>Kanban Palette</th><th>Bateau</th><th>Espèce</th><th>Calibre</th><th>Emb.</th><th class="td-right">Nb Cs</th><th class="td-right">Qté Reçue</th><th class="td-right">Pds Net</th><th>Emplacement</th></tr></thead>
          <tbody>
            ${e.lignes.map((l,i) => `<tr>
              <td>${i+1}</td>
              <td><span style="font-size:0.7rem;color:var(--accent-cyan);font-weight:600;max-width:200px;display:inline-block;word-break:break-all;">${l.palette||'-'}</span></td>
              <td>${l.bateau}</td><td><span class="badge badge-info">${l.espece||'-'}</span></td><td class="td-bold">${l.calibre}</td><td>${l.emballage}</td>
              <td class="td-right">${App.formatNumber(l.nbCaisses||0,0)}</td>
              <td class="td-right">${App.formatNumber(l.quantite,2)}</td>
              <td class="td-right td-bold">${App.formatNumber(l.pdsNetTotal,2)}</td>
              <td><span class="badge badge-purple">${l.chambre||'-'}</span></td>
            </tr>`).join('')}
            <tr style="background:rgba(99,102,241,0.1);">
              <td colspan="6" class="td-bold">TOTAL</td>
              <td class="td-right td-bold">${App.formatNumber(e.lignes.reduce((s,l)=>s+(l.nbCaisses||0),0),0)}</td>
              <td class="td-right td-bold">${App.formatNumber(totalQty,2)} kg</td>
              <td class="td-right td-bold">${App.formatNumber(totalNet,2)} kg</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    `, `
      <div style="display:flex;gap:12px;">
        <button class="btn btn-primary" onclick="Stockage.printTransferQR(${e.id}, 'final')">🏷️ Imprimer QR</button>
        <button class="btn btn-outline" onclick="App.closeModal()">Fermer</button>
      </div>
    `);
  },

  /* --- ONGLET SORTIES --- */
  renderSorties() {
    const sorties = App.data.sortiesStockage || [];
    return `
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Historique des sorties (${sorties.length})</span>
        </div>
        <div class="card-body">
          <div class="table-container">
            ${sorties.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📤</div><div class="empty-state-text">Aucune sortie enregistrée</div></div>' : `
              <table>
                <thead><tr><th>Date</th><th>Lot Source</th><th>Espèce</th><th>Calibre</th><th class="td-right">Qté Sortie</th><th class="td-right">Poids Sorti</th><th>Destination</th><th>Actions</th></tr></thead>
                <tbody>${sorties.map(s => `<tr>
                  <td>${App.formatDateFR(s.dateSortie)}</td>
                  <td class="td-bold"><span class="badge badge-purple">${s.lotRef}</span></td>
                  <td><span class="badge badge-info">${s.espece}</span></td>
                  <td>${s.calibre}</td>
                  <td class="td-right td-bold">${App.formatNumber(s.quantite,0)}</td>
                  <td class="td-right">${App.formatNumber(s.poidsSorti,2)} kg</td>
                  <td><span class="badge ${s.destination==='Sortie pour traitement'?'badge-warning':'badge-success'}">${s.destination}</span></td>
                  <td class="td-center">
                    <button class="btn-icon" onclick="Stockage.printBonSortie(${s.id})" title="Imprimer le Bon">🖨️</button>
                    <button class="btn-icon danger" onclick="Stockage.deleteSortie(${s.id})" title="Supprimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                  </td>
                </tr>`).join('')}</tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
  },

  showSortieForm() {
    const container = document.getElementById('stockageFormContainer');
    const availableLots = [];
    (App.data.stockage || []).forEach(e => {
      e.lignes.forEach((l, idx) => {
        const available = this.getLineAvailable(e, idx);
        if (available.quantite <= 0 && available.poids <= 0) return;
        availableLots.push({
          id: `${e.id}_${idx}`,
          receptionId: e.id,
          lineIdx: idx,
          ref: e.reference,
          espece: l.espece || '-',
          calibre: l.calibre || '-',
          quantite: available.quantite,
          pdsNetTotal: available.poids,
          quantiteRecue: l.nbCaisses || 0,
          poidsRecu: l.pdsNetTotal || 0,
          client: e.client
        });
      });
    });

    container.innerHTML = `
      <div class="card slide-up" style="margin-bottom:22px;">
        <div class="card-header" style="background:var(--bg-card);border-radius:var(--radius-md) var(--radius-md) 0 0;display:flex;justify-content:space-between;align-items:center;padding:1.5rem;">
          <span class="card-title" style="color:var(--primary-color);font-size:1.2rem;font-weight:700;">📤 Nouvelle Sortie Stockage</span>
          <button class="btn-icon" style="background:var(--bg-app);" onclick="Stockage.hideForm()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <div class="card-body">
          <div class="form-grid" style="grid-template-columns:repeat(2,1fr);">
            <div class="form-group">
              <label class="form-label">Date Sortie *</label>
              <input type="date" class="form-input" id="oDateSortie" value="${App.formatDate(new Date())}">
            </div>
            <div class="form-group">
              <label class="form-label">Lot Source *</label>
              <select class="form-select" id="oLotSource" onchange="Stockage.getSortieLotInfo()">
                <option value="">-- Sélectionner un lot --</option>
                ${availableLots.map(l => `<option value="${l.id}">${l.ref} — ${l.espece} (${l.calibre}) [Disponible: ${App.formatNumber(l.quantite,0)} Cs / ${App.formatNumber(l.pdsNetTotal,2)} kg] / ${l.client}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-grid" style="grid-template-columns:repeat(4,1fr);margin-top:14px;">
            <div class="form-group"><label class="form-label">Espèce</label><input type="text" class="form-input" id="oEspece" readonly></div>
            <div class="form-group"><label class="form-label">Calibre</label><input type="text" class="form-input" id="oCalibre" readonly></div>
            <div class="form-group"><label class="form-label">Qté à sortir (Cs) *</label><input type="number" class="form-input" id="oQuantite" onchange="Stockage.calcSortiePoids()"></div>
            <div class="form-group"><label class="form-label">Poids Sorti (kg)</label><input type="number" step="0.01" class="form-input" id="oPoidsSorti"></div>
          </div>

          <div class="form-grid" style="grid-template-columns:1fr;margin-top:14px;">
            <div class="form-group">
              <label class="form-label">Destination *</label>
              <select class="form-select" id="oDestination">
                <option value="Sortie pour traitement">🔧 Sortie pour traitement</option>
                <option value="Sortie pour reconditionnement">📦 Sortie pour reconditionnement (Emballage)</option>
                <option value="Sortie définitive du stock">🚚 Sortie définitive du stock</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
            <button class="btn btn-outline" onclick="Stockage.hideForm()">Annuler</button>
            <button class="btn btn-success" onclick="Stockage.saveSortie()">📤 Enregistrer la sortie</button>
          </div>
        </div>
      </div>
    `;
  },

  getSortieLotInfo() {
    const lotId = document.getElementById('oLotSource').value;
    if (!lotId) return;
    const [recId, lineIdx] = lotId.split('_').map(Number);
    const entry = (App.data.stockage || []).find(e => e.id === recId);
    if (!entry || !entry.lignes[lineIdx]) return;
    const line = entry.lignes[lineIdx];
    const available = this.getLineAvailable(entry, lineIdx);

    document.getElementById('oEspece').value = line.espece || '';
    document.getElementById('oCalibre').value = line.calibre || '';
    document.getElementById('oQuantite').value = available.quantite || 0;
    
    // Auto-calc weight
    this.calcSortiePoids();
  },

  calcSortiePoids() {
    const lotId = document.getElementById('oLotSource').value;
    const qteSortie = parseFloat(document.getElementById('oQuantite').value) || 0;
    if (!lotId) return;
    const [recId, lineIdx] = lotId.split('_').map(Number);
    const entry = (App.data.stockage || []).find(e => e.id === recId);
    if (!entry || !entry.lignes[lineIdx]) return;
    const line = entry.lignes[lineIdx];

    const available = this.getLineAvailable(entry, lineIdx);
    if (available.quantite > 0) {
      const pdsMoy = available.poids / available.quantite;
      document.getElementById('oPoidsSorti').value = (qteSortie * pdsMoy).toFixed(2);
    }
  },

  saveSortie() {
    const dateSortie = document.getElementById('oDateSortie').value;
    const lotId = document.getElementById('oLotSource').value;
    const quantite = parseFloat(document.getElementById('oQuantite').value) || 0;
    const poidsSorti = parseFloat(document.getElementById('oPoidsSorti').value) || 0;
    const destination = document.getElementById('oDestination').value;

    if (!dateSortie || !lotId || quantite <= 0) { App.toast('Remplissez les champs obligatoires', 'error'); return; }

    const [recId, lineIdx] = lotId.split('_').map(Number);
    const entry = (App.data.stockage || []).find(e => e.id === recId);
    if (!entry) return;
    const line = entry.lignes[lineIdx];
    const available = this.getLineAvailable(entry, lineIdx);
    if (quantite > available.quantite) {
      App.toast(`Quantité indisponible: reste ${App.formatNumber(available.quantite, 0)} caisses`, 'error');
      return;
    }
    if (poidsSorti > available.poids + 0.01) {
      App.toast(`Poids indisponible: reste ${App.formatNumber(available.poids, 2)} kg`, 'error');
      return;
    }

    const sortie = {
      id: App.nextId(App.data.sortiesStockage || []),
      dateSortie,
      receptionId: recId,
      lineIdx,
      lotRef: entry.reference,
      espece: line.espece,
      calibre: line.calibre,
      quantite,
      poidsSorti,
      destination,
      client: entry.client
    };

    if (!App.data.sortiesStockage) App.data.sortiesStockage = [];
    App.data.sortiesStockage.push(sortie);

    // Deduct from available quantity in reception line?
    // The user says "la qte disponible signifie la qte reçue", but logically sorties reduce available stock.
    // Let's reduce line.quantite? Wait, if line.quantite is "Qté Reçue", we shouldn't change it.
    // We should compute available stock dynamically in the UI!
    // Let's keep the received quantity intact.

    // "du coup la sortie pour traitement elle doivent s\'afficher directement dans la gestion du traitement"
    if (destination === 'Sortie pour traitement') {
      if (!App.data.production) App.data.production = [];
      const prodEntry = {
        id: App.nextId(App.data.production),
        sourceSortieId: sortie.id,
        activite: 'traitement',
        receptionId: recId,
        sourceLineIdx: lineIdx,
        date: dateSortie,
        espece: line.espece,
        calibre: line.calibre,
        client: entry.client,
        poidsMP: poidsSorti,
        caissesPI: quantite,
        phases: [
          { nom: 'Décongélation', seuil: 97, qteInit: poidsSorti, qteFinale: poidsSorti },
          { nom: 'Nettoyage', seuil: 77, qteInit: poidsSorti, qteFinale: poidsSorti }
        ],
        phasesPF: [
          { nom: 'Trempage', seuil: 110, qteInit: 0, qteFinale: 0 },
          { nom: 'Congélation', seuil: 100, qteInit: 0, qteFinale: 0 },
          { nom: 'Glasurage', seuil: 107, qteInit: 0, qteFinale: 0 },
          { nom: 'Emballage', seuil: 100, qteInit: 0, qteFinale: 0 }
        ],
        conditionnement: 'C12S1000',
        intrants: typeof Saisie !== 'undefined' && Saisie.getDefaultIntrants ? Saisie.getDefaultIntrants('C12S1000') : []
      };
      App.data.production.push(prodEntry);
      App.toast('Lot envoyé en Traitement', 'success');
    } else if (destination === 'Sortie pour reconditionnement') {
      if (!App.data.production) App.data.production = [];
      const prodEntry = {
        id: App.nextId(App.data.production),
        sourceSortieId: sortie.id,
        activite: 'reconditionnement',
        receptionId: recId,
        sourceLineIdx: lineIdx,
        date: dateSortie,
        espece: line.espece,
        calibre: line.calibre,
        client: entry.client,
        caissesPI: quantite,
        poidsBrutPI: poidsSorti,
      };
      App.data.production.push(prodEntry);
      App.toast('Lot envoyé en Reconditionnement', 'success');
    }

    App.saveData();
    this.hideForm();
    this.render();
    App.toast('Sortie enregistrée', 'success');
  },

  deleteSortie(id) {
    const linkedProduction = (App.data.production || []).find(p => p.sourceSortieId === id);
    if (linkedProduction) {
      App.toast('Suppression bloquée: cette sortie a déjà une saisie traitement liée', 'error');
      return;
    }
    if (!confirm('Supprimer cette sortie ?')) return;
    App.data.sortiesStockage = (App.data.sortiesStockage || []).filter(s => s.id !== id);
    App.saveData();
    this.render();
    App.toast('Sortie supprimée', 'info');
  },

  /* --- ONGLET TRAÇABILITÉ --- */
  /* --- ONGLET TRAÇABILITÉ --- */
  renderMouvements() {
    const clients = [...new Set((App.data.stockage || []).map(e => e.client).filter(Boolean))];
    const especes = [...new Set((App.data.stockage || []).flatMap(e => e.lignes.map(l => l.espece)).filter(Boolean))];

    return `
      <div class="card" style="margin-bottom:22px;">
        <div class="card-header" style="background:var(--bg-card);border-radius:var(--radius-md) var(--radius-md) 0 0;padding:1.5rem;">
          <span class="card-title" style="color:var(--primary-color);font-size:1.2rem;font-weight:700;">🔍 Recherche Avancée (Traçabilité)</span>
        </div>
        <div class="card-body">
          <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom:15px;">
            <div class="form-group">
              <label class="form-label">Client</label>
              <select class="form-select" id="traceFilterClient" onchange="Stockage.filterTraceability()">
                <option value="">-- Tous les clients --</option>
                ${clients.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Espèce</label>
              <select class="form-select" id="traceFilterEspece" onchange="Stockage.filterTraceability()">
                <option value="">-- Toutes les espèces --</option>
                ${especes.map(e => `<option value="${e}">${e}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Du (Date d\'entrée)</label>
              <input type="date" class="form-input" id="traceFilterDateDebut" onchange="Stockage.filterTraceability()">
            </div>
            <div class="form-group">
              <label class="form-label">Au</label>
              <input type="date" class="form-input" id="traceFilterDateFin" onchange="Stockage.filterTraceability()">
            </div>
            <div class="form-group">
              <label class="form-label">Recherche libre</label>
              <input type="text" class="form-input" id="traceFilterSearch" placeholder="N° Palette ou Réf..." onkeyup="Stockage.filterTraceability()">
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end;">
            <button class="btn btn-outline btn-sm" onclick="Stockage.resetTraceFilters()">Réinitialiser les filtres</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:22px;">
        <div class="card-header"><span class="card-title">📋 Lots trouvés</span></div>
        <div class="card-body" style="padding:0;">
          <div id="traceabilityResults">
            <!-- Table filled by filterTraceability() -->
          </div>
        </div>
      </div>

      <div id="traceResultContainer"></div>
      <script>setTimeout(() => Stockage.filterTraceability(), 50);</script>
    `;
  },

  resetTraceFilters() {
    ['traceFilterClient', 'traceFilterEspece', 'traceFilterDateDebut', 'traceFilterDateFin', 'traceFilterSearch'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    this.filterTraceability();
  },

  filterTraceability() {
    const client = document.getElementById('traceFilterClient')?.value;
    const espece = document.getElementById('traceFilterEspece')?.value;
    const dateDebut = document.getElementById('traceFilterDateDebut')?.value;
    const dateFin = document.getElementById('traceFilterDateFin')?.value;
    const search = (document.getElementById('traceFilterSearch')?.value || '').toLowerCase();

    const results = [];
    (App.data.stockage || []).forEach(e => {
      const entryDate = e.dateEntree.split('T')[0];
      
      // Basic filters
      if (client && e.client !== client) return;
      if (dateDebut && entryDate < dateDebut) return;
      if (dateFin && entryDate > dateFin) return;

      e.lignes.forEach((l, idx) => {
        // Line level filters
        if (espece && l.espece !== espece) return;
        
        const paletteStr = (l.palette || '').toString().toLowerCase();
        const refStr = (e.reference || '').toLowerCase();
        
        if (search && !paletteStr.includes(search) && !refStr.includes(search)) return;

        results.push({
          recId: e.id,
          lineIdx: idx,
          date: e.dateEntree,
          ref: e.reference,
          palette: l.palette || '-',
          client: e.client,
          espece: l.espece || '-',
          calibre: l.calibre || '-',
          poids: l.pdsNetTotal || 0
        });
      });
    });

    const container = document.getElementById('traceabilityResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:40px;">Aucun lot ne correspond à vos critères.</div>`;
      return;
    }

    container.innerHTML = `
      <table class="table-hover">
        <thead>
          <tr>
            <th>Date</th>
            <th>Référence</th>
            <th>N° / Info Palette</th>
            <th>Client</th>
            <th>Produit</th>
            <th class="td-right">Poids Net</th>
            <th style="width:100px">Action</th>
          </tr>
        </thead>
        <tbody>
          ${results.sort((a,b) => new Date(b.date) - new Date(a.date)).map(r => `
            <tr>
              <td>${App.formatDateFR(r.date)}</td>
              <td class="td-bold">${r.ref}</td>
              <td style="color:var(--accent-purple); font-weight:600;">${r.palette}</td>
              <td>${r.client}</td>
              <td>${r.espece} (${r.calibre})</td>
              <td class="td-right">${App.formatNumber(r.poids, 2)} kg</td>
              <td class="td-center">
                <button class="btn btn-sm btn-primary" style="padding:4px 10px;" onclick="Stockage.traceLot(${r.recId}, ${r.lineIdx})">🔍 Tracer</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  traceLot(recId, lineIdx) {
    const container = document.getElementById('traceResultContainer');
    if (recId === undefined || lineIdx === undefined) { 
      container.innerHTML = ''; 
      return; 
    }

    const entry = (App.data.stockage || []).find(e => e.id === recId);
    if (!entry || !entry.lignes[lineIdx]) { 
      container.innerHTML = '<div class="card"><div class="card-body">Lot introuvable</div></div>'; 
      return; 
    }
    const line = entry.lignes[lineIdx];

    // Find sorties
    const sorties = (App.data.sortiesStockage || []).filter(s => s.receptionId === recId && s.lineIdx === lineIdx);
    
    // Find treatment entries
    const treatments = (App.data.production || []).filter(p => p.activite === 'traitement' && p.receptionId === recId && p.espece === line.espece);

    container.innerHTML = `
      <div class="card slide-up">
        <div class="card-header" style="background:var(--bg-card);border-radius:var(--radius-md) var(--radius-md) 0 0;padding:1.5rem;">
          <span class="card-title" style="color:var(--primary-color);font-size:1.2rem;font-weight:700;">🔄 Parcours du Lot ${entry.reference} — Palette: ${line.palette || '-'}</span>
        </div>
        <div class="card-body">
          <div class="timeline" style="position:relative;padding-left:30px;border-left:3px solid var(--accent-purple);">
            
            <!-- ETAPE 1 : ENTREE -->
            <div class="timeline-item" style="margin-bottom:24px;position:relative;">
              <div class="timeline-dot" style="position:absolute;left:-37px;top:4px;width:16px;height:16px;border-radius:50%;background:var(--accent-purple);border:3px solid white;"></div>
              <h4 style="color:var(--accent-purple);margin-bottom:4px;">📥 Entrée en Stock (Réception)</h4>
              <p style="margin-bottom:6px;font-size:0.85rem;color:var(--text-muted);">Le ${App.formatDateFR(entry.dateEntree)}</p>
              <div style="background:rgba(99,102,241,0.05);padding:12px;border-radius:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Fournisseur</span><br><strong>${entry.fournisseur}</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Client</span><br><strong>${entry.client}</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Bateau</span><br><strong>${line.bateau||'-'}</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Espèce</span><br><span class="badge badge-info">${line.espece||'-'}</span></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Calibre</span><br><strong>${line.calibre}</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Emballage</span><br><strong>${line.emballage}</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Nb Cs reçues</span><br><strong>${App.formatNumber(line.nbCaisses||0,0)} Cs</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Qté BL</span><br><strong>${App.formatNumber(line.quantiteBL||0,2)} kg</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Poids brut reçu</span><br><strong>${App.formatNumber(line.quantite||0,2)} kg</strong></div>
                <div><span style="color:var(--text-muted);font-size:0.75rem;">Poids Net</span><br><strong>${App.formatNumber(line.pdsNetTotal,2)} kg</strong></div>
              </div>
            </div>

            <!-- ETAPE 2 : SORTIES -->
            ${sorties.map(s => `
              <div class="timeline-item" style="margin-bottom:24px;position:relative;">
                <div class="timeline-dot" style="position:absolute;left:-37px;top:4px;width:16px;height:16px;border-radius:50%;background:var(--accent-yellow);border:3px solid white;"></div>
                <h4 style="color:var(--accent-yellow);margin-bottom:4px;">📤 Sortie de Stock</h4>
                <p style="margin-bottom:6px;font-size:0.85rem;color:var(--text-muted);">Le ${App.formatDateFR(s.dateSortie)}</p>
                <div style="background:rgba(245,158,11,0.05);padding:12px;border-radius:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                  <div><span style="color:var(--text-muted);font-size:0.75rem;">Destination</span><br><span class="badge ${s.destination==='Sortie pour traitement'?'badge-warning':'badge-success'}">${s.destination}</span></div>
                  <div><span style="color:var(--text-muted);font-size:0.75rem;">Qté Sortie</span><br><strong>${s.quantite} Cs</strong></div>
                  <div><span style="color:var(--text-muted);font-size:0.75rem;">Poids Sorti</span><br><strong>${App.formatNumber(s.poidsSorti,2)} kg</strong></div>
                </div>
              </div>
            `).join('')}

            <!-- ETAPE 3 : TRAITEMENT -->
            ${treatments.map(t => `
              <div class="timeline-item" style="margin-bottom:24px;position:relative;">
                <div class="timeline-dot" style="position:absolute;left:-37px;top:4px;width:16px;height:16px;border-radius:50%;background:var(--accent-green);border:3px solid white;"></div>
                <h4 style="color:var(--accent-green);margin-bottom:4px;">🔧 Suivi Traitement</h4>
                <p style="margin-bottom:6px;font-size:0.85rem;color:var(--text-muted);">Le ${App.formatDateFR(t.date)}</p>
                <div style="background:rgba(16,185,129,0.05);padding:12px;border-radius:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                  <div><span style="color:var(--text-muted);font-size:0.75rem;">Produit Fini</span><br><strong>${t.produitFini||'-'}</strong></div>
                  <div><span style="color:var(--text-muted);font-size:0.75rem;">Poids PF</span><br><strong>${App.formatNumber(t.poidsBrutPF,2)} kg</strong></div>
                  <div><span style="color:var(--text-muted);font-size:0.75rem;">Rendement Global</span><br><span class="badge badge-success">${App.formatNumber(t.rendement,2)}%</span></div>
                </div>
              </div>
            `).join('')}

            ${sorties.length === 0 ? `
              <div class="timeline-item" style="margin-bottom:24px;position:relative;color:var(--text-muted);">
                <div class="timeline-dot" style="position:absolute;left:-37px;top:4px;width:16px;height:16px;border-radius:50%;background:#ccc;border:3px solid white;"></div>
                <span>Aucune sortie enregistrée pour ce lot.</span>
              </div>
            ` : ''}

          </div>
        </div>
      </div>
    `;
  },

  printList() {
    try {
      const tableContainer = document.querySelector('.card-body .table-container');
      if (!tableContainer) return;
      const tableHTML = tableContainer.innerHTML;
      
      let printDiv = document.getElementById('printBonContainer');
      if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'printBonContainer';
        printDiv.className = 'print-only';
        document.body.appendChild(printDiv);
      }
      
      printDiv.innerHTML = `
        <div style="font-family:Arial, sans-serif; color:#000; background:#fff; font-size:12px; width:100%; max-width:1050px; margin:0 auto; padding:20px;">
          <!-- HEADER -->
          <table style="width:100%; border-bottom:2px solid #000; margin-bottom:15px; padding-bottom:10px;">
            <tr>
              <td style="width:120px; vertical-align:middle;">
                <img src="logo.png?v=${Date.now()}" style="max-height:70px; max-width:120px;" onerror="this.style.display='none'">
              </td>
              <td style="vertical-align:middle; text-align:center;">
                <h1 style="margin:0; font-size:20px; font-weight:bold;">FISH AND FOOD SARL</h1>
                <p style="margin:2px 0; font-size:11px;">Zone industrielle ANZA</p>
              </td>
              <td style="width:120px; text-align:right; vertical-align:middle;">
                <div style="border:1px solid #000; padding:5px;">
                  <span style="font-weight:bold; font-size:12px;">Date d'édition :</span><br>
                  ${App.formatDateFR(new Date())}
                </div>
              </td>
            </tr>
          </table>
          
          <h2 style="text-align:center; font-size:16px; margin:10px 0 20px 0; text-transform:uppercase;">ÉTAT DES STOCKS / RÉCEPTIONS</h2>
          
          <!-- TABLE -->
          <div style="margin-bottom:40px;">
            ${tableHTML}
          </div>
          
          <!-- SIGNATURES -->
          <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr>
              <td style="width:33%; text-align:center; padding-bottom:70px;">
                <span style="font-weight:bold; text-decoration:underline;">Chef Magasinier</span>
              </td>
              <td style="width:33%; text-align:center; padding-bottom:70px;">
                <span style="font-weight:bold; text-decoration:underline;">Contrôle de Gestion</span>
              </td>
              <td style="width:33%; text-align:center; padding-bottom:70px;">
                <span style="font-weight:bold; text-decoration:underline;">Direction Générale</span>
              </td>
            </tr>
          </table>
        </div>
      `;

      const tables = printDiv.querySelectorAll('table');
      tables.forEach(t => { t.style.width = '100%'; t.style.borderCollapse = 'collapse'; t.style.fontSize = '11px'; t.style.border = '1px solid #000'; });
      const ths = printDiv.querySelectorAll('th');
      ths.forEach(th => { th.style.border = '1px solid #000'; th.style.padding = '5px'; th.style.background = '#f2f2f2'; th.style.color = '#000'; });
      const tds = printDiv.querySelectorAll('td');
      tds.forEach(td => { td.style.border = '1px solid #000'; td.style.padding = '4px'; });
      
      // Hide actions column
      const headerCols = printDiv.querySelectorAll('th');
      let actionColIdx = -1;
      headerCols.forEach((th, i) => { if((th.textContent || '').includes('Actions')) actionColIdx = i; });
      if(actionColIdx > -1) {
        printDiv.querySelectorAll('tr').forEach(tr => {
          if(tr.children[actionColIdx]) tr.children[actionColIdx].style.display = 'none';
        });
      }

      document.body.classList.add('printing-bon');
      setTimeout(() => {
        try { window.print(); } catch(err) { App.toast('Print error: ' + err.message, 'error'); }
        document.body.classList.remove('printing-bon');
      }, 500);
    } catch (err) {
      App.toast('Erreur PrintList: ' + err.message, 'error');
      console.error(err);
    }
  },

  showMoveChambreModal(entryId) {
    const entry = App.data.stockage.find(e => e.id === entryId);
    if (!entry) return;

    const modalHtml = `
      <div id="moveChambreModal" class="modal-overlay" style="display:flex;">
        <div class="modal-content slide-up" style="max-width:450px;">
          <div class="modal-header">
            <h3 class="modal-title">📦 Changer l'emplacement du lot</h3>
            <button class="btn-icon" onclick="document.getElementById('moveChambreModal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom:20px; padding:12px; background:rgba(99,102,241,0.05); border-radius:8px;">
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">Lot : <strong>${entry.reference}</strong></div>
              <div style="font-size:0.85rem;">Client : <strong>${entry.client}</strong></div>
              <div style="font-size:0.85rem;">Produit : <strong>${entry.lignes[0]?.espece || 'N/A'}</strong></div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Nouvel Emplacement</label>
              <select class="form-select" id="newChambreSelect" style="font-size:1rem; padding:12px;">
                <option value="direct">🚀 Flux Direct (Hors Froid)</option>
                <option value="chambre1">❄️ Chambre Froide 1</option>
                <option value="chambre2">❄️ Chambre Froide 2</option>
                <option value="entreposage">📦 Entreposage / Quai</option>
                <option value="non_affecte">❌ Non Affecté</option>
              </select>
            </div>
            
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:15px;">
              * Cette action déplacera l'intégralité des lignes de ce lot vers le nouvel emplacement sélectionné.
            </p>
          </div>
          <div class="modal-footer" style="display:flex; gap:12px;">
            <button class="btn btn-outline" style="flex:1;" onclick="document.getElementById('moveChambreModal').remove()">Annuler</button>
            <button class="btn btn-primary" style="flex:2;" onclick="Stockage.applyMoveChambre(${entry.id})">Confirmer le Transfert</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  applyMoveChambre(entryId) {
    const entry = App.data.stockage.find(e => e.id === entryId);
    if (!entry) return;

    const newChambre = document.getElementById('newChambreSelect').value;
    entry.lignes.forEach(l => {
      l.chambre = newChambre;
    });

    App.saveData();
    document.getElementById('moveChambreModal').remove();
    App.toast("Emplacement mis à jour avec succès.", "success");
    this.render();
  },

  printBon(id) {
    try {
      const e = (App.data.stockage || []).find(x => x.id === id);
      if (!e) return;
      
      const lignes = e.lignes || [];
      const totalNbCs = lignes.reduce((s,l) => s + (l.nbCaisses||0), 0);
      const totalBrut = lignes.reduce((s,l) => s + (l.pdsBrutTotal||l.quantite||0), 0);
      const totalNet = lignes.reduce((s,l) => s + (l.pdsNetTotal||0), 0);
      const observations = lignes.filter(l => l.notaBene).map(l => l.notaBene).join(' | ');

      let printDiv = document.getElementById('printBonContainer');
      if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'printBonContainer';
        printDiv.className = 'print-only';
        document.body.appendChild(printDiv);
      }

      const border = '1px solid #222';
      const cell = `border:${border};padding:6px 8px;color:#111;background:#fff;`;
      const label = `border:${border};padding:6px 8px;color:#111;font-weight:800;background:#eef2f7;`;
      const head = `border:${border};padding:6px 8px;color:#fff;background:#1a2332;font-weight:800;`;
      const right = cell + 'text-align:right;';
      const qrText = [
        'REC',
        e.reference || '',
        e.id || '',
        e.dateEntree || '',
        App.formatNumber(totalNbCs, 0),
        App.formatNumber(totalNet, 2)
      ].join('|');
      
      const totalTareEmb = lignes.reduce((s,l) => s + ((l.tareEmballage||0.5) * (l.nbCaisses||0)), 0);
      const totalTarePal = lignes.reduce((s,l) => s + (l.tarePalette||0), 0);

      printDiv.innerHTML = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;font-size:11px;width:100%;max-width:900px;margin:0 auto;padding:22px 28px;">
          
          <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
            <tr>
              <td style="width:130px;vertical-align:middle;color:#111;background:#fff;border:0;">
                <img src="logo.png?v=${Date.now()}" style="max-height:65px;max-width:120px;" onerror="this.style.display='none'">
              </td>
              <td style="vertical-align:middle;text-align:center;color:#111;background:#fff;border:0;">
                <div style="font-size:18px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#111;">FISH AND FOOD SARL</div>
                <div style="font-size:10px;color:#333;margin-top:2px;">Zone industrielle ANZA — Agadir</div>
              </td>
              <td style="width:92px;text-align:right;vertical-align:middle;color:#111;background:#fff;border:0;">
                <div style="border:${border};padding:5px 8px;text-align:center;">
                  <div style="font-size:8px;color:#555;">Date édition</div>
                  <div style="font-weight:800;font-size:11px;">${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </td>
            </tr>
          </table>

          <div style="background:#1a2332;color:#fff;text-align:center;padding:9px 0;margin:8px 0 12px 0;border-radius:4px;">
            <div style="font-size:16px;font-weight:800;letter-spacing:2px;">FICHE D'ENTRÉE EN STOCK</div>
            <div style="font-size:12px;margin-top:3px;color:#f8fafc;">${e.reference} - ${App.formatDateFR(e.dateEntree)}</div>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;">
            <tr>
              <td style="${label}width:14%;">Date</td>
              <td style="${cell}width:19%;">${App.formatDateFR(e.dateEntree)}</td>
              <td style="${label}width:14%;">Référence</td>
              <td style="${cell}width:19%;font-weight:800;">${e.reference}</td>
              <td style="${label}width:14%;">Origine</td>
              <td style="${cell}width:20%;font-weight:800;">${e.origine || '-'}</td>
            </tr>
            <tr>
              <td style="${label}">Client</td>
              <td style="${cell}font-weight:800;" colspan="2">${e.client || '-'}</td>
              <td style="${label}">Fournisseur</td>
              <td style="${cell}font-weight:800;" colspan="2">${e.fournisseur || '-'}</td>
            </tr>
            <tr>
              <td style="${label}">Bateau</td>
              <td style="${cell}" colspan="2">${e.bateau || '-'}</td>
              <td style="${label}">Consignataire</td>
              <td style="${cell}" colspan="2">${e.consignataire || '-'}</td>
            </tr>
          </table>

          <div style="font-size:12px;font-weight:800;margin-bottom:6px;border-bottom:2px solid #1a2332;padding-bottom:3px;color:#111;">DÉTAIL DES LIGNES</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10px;">
            <thead>
              <tr>
                <th style="${head}text-align:center;width:30px;">N°</th>
                <th style="${head}">Espèce</th>
                <th style="${head}">Calibre</th>
                <th style="${head}text-align:center;">Emb.</th>
                <th style="${head}text-align:right;">Nb Cs</th>
                <th style="${head}text-align:right;">Pds Brut (kg)</th>
                <th style="${head}text-align:right;">Tare Emb.</th>
                <th style="${head}text-align:right;">Tare Pal.</th>
                <th style="${head}text-align:right;font-weight:900;">Pds Net (kg)</th>
                <th style="${head}text-align:center;">T°C</th>
                <th style="${head}text-align:center;">Chambre</th>
                <th style="${head}">N.B.</th>
              </tr>
            </thead>
            <tbody>
              ${lignes.map((l, i) => {
                const pdsBrut = l.pdsBrutTotal || l.quantite || 0;
                return `<tr style="${i%2===1?'background:#f8f9fb;':''}">
                  <td style="${cell}text-align:center;">${i+1}</td>
                  <td style="${cell}font-weight:700;">${l.espece || '-'}</td>
                  <td style="${cell}">${l.calibre || '-'}</td>
                  <td style="${cell}text-align:center;">${l.emballage || 'Cs'}</td>
                  <td style="${right}">${App.formatNumber(l.nbCaisses||0, 0)}</td>
                  <td style="${right}">${App.formatNumber(pdsBrut, 2)}</td>
                  <td style="${right}">${App.formatNumber((l.tareEmballage||0.5) * (l.nbCaisses||0), 2)}</td>
                  <td style="${right}">${App.formatNumber(l.tarePalette||0, 0)}</td>
                  <td style="${right}font-weight:800;">${App.formatNumber(l.pdsNetTotal||0, 2)}</td>
                  <td style="${cell}text-align:center;">${l.temperature !== undefined ? l.temperature : '-18'}°</td>
                  <td style="${cell}text-align:center;">${l.chambre || '-'}</td>
                  <td style="${cell}font-size:9px;">${l.notaBene || ''}</td>
                </tr>`;
              }).join('')}
              <tr style="background:#e9eef5;font-weight:800;">
                <td style="${cell}" colspan="4">TOTAUX</td>
                <td style="${right}font-weight:800;">${App.formatNumber(totalNbCs, 0)}</td>
                <td style="${right}font-weight:800;">${App.formatNumber(totalBrut, 2)}</td>
                <td style="${right}font-weight:800;">${App.formatNumber(totalTareEmb, 2)}</td>
                <td style="${right}font-weight:800;">${App.formatNumber(totalTarePal, 0)}</td>
                <td style="${right}font-weight:900;font-size:12px;">${App.formatNumber(totalNet, 2)}</td>
                <td style="${cell}" colspan="3"></td>
              </tr>
            </tbody>
          </table>

          ${observations ? `
            <div style="border:${border};padding:7px 10px;margin-bottom:12px;min-height:24px;background:#fafbfc;">
              <span style="font-weight:800;font-size:10px;color:#333;">OBSERVATIONS :</span>
              <span style="font-size:10px;margin-left:8px;color:#111;">${observations}</span>
            </div>
          ` : ''}

          <div style="font-size:12px;font-weight:800;margin-bottom:8px;border-bottom:2px solid #1a2332;padding-bottom:3px;color:#111;">VISAS ET SIGNATURES</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:25%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">Visa Client</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
              <td style="width:25%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">RS Stockage</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
              <td style="width:25%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">RS Qualité</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
              <td style="width:25%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">RS Contrôle Gestion</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
            </tr>
          </table>

          <div style="margin-top:18px;border:2px dashed #222;padding:12px 14px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:18px;break-inside:avoid;">
            <div style="flex:1;color:#111;">
              <div style="font-size:12px;font-weight:900;letter-spacing:1px;margin-bottom:6px;">ÉTIQUETTE PALETTE - QR TRAÇABILITÉ</div>
              <div style="font-size:11px;line-height:1.45;">
                <strong>Réf :</strong> ${e.reference}<br>
                <strong>Date :</strong> ${App.formatDateFR(e.dateEntree)}<br>
                <strong>Client :</strong> ${e.client || '-'}<br>
                <strong>Total :</strong> ${App.formatNumber(totalNbCs,0)} Cs / ${App.formatNumber(totalNet,2)} kg net
              </div>
              <div style="font-size:8px;color:#555;margin-top:8px;">Découper cette zone et la fixer sur la palette.</div>
            </div>
            <div style="width:230px;height:230px;border:${border};display:flex;align-items:center;justify-content:center;background:#fff;flex:0 0 auto;">
              <div id="bonQrCodeLarge"></div>
            </div>
          </div>

          <div style="margin-top:10px;text-align:center;font-size:8px;color:#666;border-top:1px solid #ddd;padding-top:6px;">
            ELABBAR ERP - Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - ${e.reference}
          </div>
        </div>
      `;

      document.body.classList.add('printing-bon');

      setTimeout(() => {
        if (typeof QRCode !== 'undefined') {
          document.getElementById("bonQrCodeLarge").innerHTML = '';
          new QRCode(document.getElementById("bonQrCodeLarge"), {
            text: qrText,
            width: 210,
            height: 210,
            correctLevel: QRCode.CorrectLevel.L
          });
          
          // Force canvas to img for reliable printing
          setTimeout(() => {
            const canvas = document.querySelector('#bonQrCodeLarge canvas');
            const img = document.querySelector('#bonQrCodeLarge img');
            if (canvas && img && (!img.src || img.src === '')) {
              img.src = canvas.toDataURL('image/png');
              img.style.display = 'block';
              canvas.style.display = 'none';
            }
          }, 50);
        }

        setTimeout(() => {
          try { window.print(); } catch(err) { App.toast('Print error: ' + err.message, 'error'); }
          document.body.classList.remove('printing-bon');
        }, 500);
      }, 50);
    } catch (err) {
      App.toast('Erreur PrintBon: ' + err.message, 'error');
      console.error(err);
    }
  },

  printBonSortie(id) {
    try {
      const s = (App.data.sortiesStockage || []).find(x => x.id === id);
      if (!s) return;
      const sourceEntry = (App.data.stockage || []).find(e => e.id === s.receptionId);
      const sourceLine = sourceEntry?.lignes?.[s.lineIdx];
      const sourceQty = sourceLine?.nbCaisses || 0;
      const sourceWeight = sourceLine?.pdsNetTotal || 0;
      const usedQty = sourceEntry ? this.getLineUsedQty(sourceEntry.id, s.lineIdx) : s.quantite;
      const usedWeight = sourceEntry ? this.getLineUsedWeight(sourceEntry.id, s.lineIdx) : s.poidsSorti;
      const remainingQty = Math.max(0, sourceQty - usedQty);
      const remainingWeight = Math.max(0, sourceWeight - usedWeight);
      const border = '1px solid #222';
      const cell = `border:${border};padding:6px 8px;color:#111;background:#fff;`;
      const label = `border:${border};padding:6px 8px;color:#111;font-weight:800;background:#eef2f7;`;
      const head = `border:${border};padding:6px 8px;color:#fff;background:#1a2332;font-weight:800;`;
      const right = cell + 'text-align:right;';
      const qrText = [
        'SORTIE',
        s.id || '',
        s.lotRef || '',
        s.dateSortie || '',
        App.formatNumber(s.quantite || 0, 0),
        App.formatNumber(s.poidsSorti || 0, 2),
        (s.destination || '').replace(/\|/g, '/')
      ].join('|');

      let printDiv = document.getElementById('printBonContainer');
      if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'printBonContainer';
        printDiv.className = 'print-only';
        document.body.appendChild(printDiv);
      }
      
      printDiv.innerHTML = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;font-size:11px;width:100%;max-width:900px;margin:0 auto;padding:22px 28px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
            <tr>
              <td style="width:130px;vertical-align:middle;color:#111;background:#fff;border:0;">
                <img src="logo.png?v=${Date.now()}" style="max-height:65px;max-width:120px;" onerror="this.style.display='none'">
              </td>
              <td style="vertical-align:middle;text-align:center;color:#111;background:#fff;border:0;">
                <div style="font-size:18px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#111;">FISH AND FOOD SARL</div>
                <div style="font-size:10px;color:#333;margin-top:2px;">Zone industrielle ANZA</div>
              </td>
              <td style="width:92px;color:#111;background:#fff;border:0;"></td>
            </tr>
          </table>
          
          <div style="background:#1a2332;color:#fff;text-align:center;padding:9px 0;margin:8px 0 12px 0;border-radius:4px;">
            <div style="font-size:16px;font-weight:800;letter-spacing:2px;">FICHE DE SORTIE STOCK</div>
            <div style="font-size:12px;margin-top:3px;color:#f8fafc;">Sortie N° ${s.id} - ${App.formatDateFR(s.dateSortie)}</div>
          </div>
          
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;">
            <tr>
              <td style="${label}width:14%;">Date sortie</td>
              <td style="${cell}width:22%;">${App.formatDateFR(s.dateSortie)}</td>
              <td style="${label}width:14%;">Lot source</td>
              <td style="${cell}width:22%;font-weight:800;">${s.lotRef || '-'}</td>
              <td style="${label}width:14%;">Destination</td>
              <td style="${cell}width:14%;font-weight:800;">${s.destination || '-'}</td>
            </tr>
            <tr>
              <td style="${label}">Client</td>
              <td style="${cell}font-weight:800;" colspan="2">${s.client || sourceEntry?.client || '-'}</td>
              <td style="${label}">Produit</td>
              <td style="${cell}font-weight:800;" colspan="2">${s.espece || '-'} / ${s.calibre || '-'}</td>
            </tr>
            <tr>
              <td style="${label}">Qté sortie</td>
              <td style="${cell}font-weight:900;font-size:13px;" colspan="2">${App.formatNumber(s.quantite || 0, 0)} caisses</td>
              <td style="${label}">Poids sorti</td>
              <td style="${cell}font-weight:900;font-size:13px;" colspan="2">${App.formatNumber(s.poidsSorti || 0, 2)} kg</td>
            </tr>
          </table>

          <div style="font-size:13px;font-weight:800;margin-bottom:6px;border-bottom:2px solid #1a2332;padding-bottom:3px;color:#111;">MOUVEMENT DE STOCK</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10px;">
            <thead>
              <tr>
                <th style="${head}text-align:left;">Info palette</th>
                <th style="${head}text-align:right;">Stock initial</th>
                <th style="${head}text-align:right;">Sortie</th>
                <th style="${head}text-align:right;">Reste estimé</th>
                <th style="${head}text-align:center;">Emplacement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="${cell}font-size:8px;max-width:260px;word-break:break-word;color:#003b7a;font-weight:800;">${sourceLine?.palette || '-'}</td>
                <td style="${right}">${App.formatNumber(sourceQty,0)} Cs / ${App.formatNumber(sourceWeight,2)} kg</td>
                <td style="${right}font-weight:900;">${App.formatNumber(s.quantite || 0,0)} Cs / ${App.formatNumber(s.poidsSorti || 0,2)} kg</td>
                <td style="${right}font-weight:800;">${App.formatNumber(remainingQty,0)} Cs / ${App.formatNumber(remainingWeight,2)} kg</td>
                <td style="${cell}text-align:center;font-weight:800;">${sourceLine?.chambre || '-'}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size:12px;font-weight:800;margin-bottom:8px;border-bottom:2px solid #1a2332;padding-bottom:3px;color:#111;">VISAS ET SIGNATURES</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:33.33%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">Magasinier Départ</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
              <td style="width:33.33%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">Réception Destination</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
              <td style="width:33.33%;border:${border};text-align:center;vertical-align:top;padding:7px 5px;">
                <div style="font-weight:800;font-size:10px;text-transform:uppercase;background:#e9eef5;color:#111;padding:5px;margin:-8px -5px 0 -5px;border-bottom:1px solid #222;">Contrôle Gestion</div>
                <div style="height:54px;"></div>
                <div style="border-top:1px dashed #999;padding-top:4px;font-size:9px;color:#777;">Nom & Signature</div>
              </td>
            </tr>
          </table>

          <div style="margin-top:18px;border:2px dashed #222;padding:12px 14px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:18px;break-inside:avoid;">
            <div style="flex:1;color:#111;">
              <div style="font-size:12px;font-weight:900;letter-spacing:1px;margin-bottom:6px;">ÉTIQUETTE SORTIE - QR TRAÇABILITÉ</div>
              <div style="font-size:11px;line-height:1.45;">
                <strong>Sortie :</strong> N° ${s.id}<br>
                <strong>Lot :</strong> ${s.lotRef || '-'}<br>
                <strong>Produit :</strong> ${s.espece || '-'} / ${s.calibre || '-'}<br>
                <strong>Qté sortie :</strong> ${App.formatNumber(s.quantite || 0,0)} Cs / ${App.formatNumber(s.poidsSorti || 0,2)} kg<br>
                <strong>Destination :</strong> ${s.destination || '-'}
              </div>
              <div style="font-size:8px;color:#555;margin-top:8px;">Découper cette zone et la joindre au mouvement sorti.</div>
            </div>
            <div style="width:230px;height:230px;border:${border};display:flex;align-items:center;justify-content:center;background:#fff;flex:0 0 auto;">
              <div id="bonQrCodeSortie"></div>
            </div>
          </div>

          <div style="margin-top:10px;text-align:center;font-size:8px;color:#666;border-top:1px solid #ddd;padding-top:6px;">
            ELABBAR ERP - Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} - Sortie N° ${s.id}
          </div>
        </div>
      `;

      document.body.classList.add('printing-bon');

      setTimeout(() => {
        if (typeof QRCode !== 'undefined') {
          document.getElementById("bonQrCodeSortie").innerHTML = '';
          new QRCode(document.getElementById("bonQrCodeSortie"), {
            text: qrText,
            width: 210,
            height: 210,
            correctLevel: QRCode.CorrectLevel.L
          });
          
          setTimeout(() => {
            const canvas = document.querySelector('#bonQrCodeSortie canvas');
            const img = document.querySelector('#bonQrCodeSortie img');
            if (canvas && img && (!img.src || img.src === '')) {
              img.src = canvas.toDataURL('image/png');
              img.style.display = 'block';
              canvas.style.display = 'none';
            }
          }, 50);
        }

        setTimeout(() => {
          try { window.print(); } catch(err) { App.toast('Print error: ' + err.message, 'error'); }
          document.body.classList.remove('printing-bon');
        }, 500);
      }, 50);
    } catch (err) {
      App.toast('Erreur PrintBonSortie: ' + err.message, 'error');
      console.error(err);
    }
  },

  /* ============================================
     ÉLÉMENTS EN ATTENTE — Post-Traitement/Reconditionnement
     ============================================ */
  renderPendingEntries() {
    const pending = (App.data.pendingStorageEntries || []).filter(e => e.status === 'pending');
    const validated = (App.data.pendingStorageEntries || []).filter(e => e.status !== 'pending');
    const all = [...pending, ...validated].sort((a,b) => new Date(b.dateEnvoi) - new Date(a.dateEnvoi));
    const chambreLabels = { chambre1: 'Chambre 1', chambre2: 'Chambre 2', entreposage: 'Entreposage', direct: '🚀 Passage Direct' };

    return `
      <div class="kpi-grid">
        <div class="kpi-card orange">
          <div class="kpi-icon orange">⏳</div>
          <div class="kpi-label">En attente</div>
          <div class="kpi-value">${pending.length}</div>
          <div class="kpi-change">À valider</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon green">✅</div>
          <div class="kpi-label">Validés</div>
          <div class="kpi-value">${validated.length}</div>
          <div class="kpi-change">Historique</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-icon blue">⚖️</div>
          <div class="kpi-label">Poids Total en Attente</div>
          <div class="kpi-value">${App.formatNumber(pending.reduce((s,e) => s + (e.poidsPF||0), 0), 0)}<span class="kpi-unit">kg</span></div>
        </div>
      </div>

      <div class="card slide-up" style="border:1px solid var(--border-color); border-top: 4px solid var(--accent-purple);">
        <div class="card-header" style="background:var(--bg-card); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span class="card-title" style="color:var(--primary-color);">📦 Historique des Éléments en Attente</span>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Suivi des transferts de production vers le stock principal</div>
          </div>
          <div class="badge badge-info">${all.length} éléments au total</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            ${all.length === 0
              ? `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Aucun élément dans l'historique</div></div>`
              : `<table>
                <thead><tr>
                  <th>Date Envoi</th><th>Origine</th><th>Bateau / Source</th><th>Espèce</th><th>Calibre</th><th>Client</th>
                  <th class="td-right">Poids PF</th><th class="td-right">Caisses</th><th>Chambre</th><th>Statut</th><th>Actions</th>
                </tr></thead>
                <tbody>${all.map(e => {
                  const isPending = e.status === 'pending';
                  const statusBadge = isPending
                    ? '<span class="badge badge-warning" style="font-size:0.72rem;">⏳ En attente</span>'
                    : '<span class="badge badge-success" style="font-size:0.72rem;">✅ Validé</span>';
                  
                  return `<tr style="${!isPending ? 'opacity:0.75; background:rgba(255,255,255,0.02);' : ''}">
                    <td>${App.formatDateFR(e.dateEnvoi)}</td>
                    <td><span class="badge ${e.origine==='Traitement'?'badge-warning':'badge-info'}">${e.origine}</span></td>
                    <td><span style="font-size:0.85rem; font-weight:600;">${e.bateau||'-'}</span></td>
                    <td><span class="badge badge-purple">${e.espece||'-'}</span></td>
                    <td class="td-bold">${e.calibre||'-'}</td>
                    <td>${e.client||'-'}</td>
                    <td class="td-right td-bold">${App.formatNumber(e.poidsPF,2)} kg</td>
                    <td class="td-right">${App.formatNumber(e.caissesPF||0,0)}</td>
                    <td><span class="badge badge-purple">${chambreLabels[e.chambreDestination]||e.chambreDestination}</span></td>
                    <td class="td-center">${statusBadge}</td>
                    <td class="td-center" style="white-space:nowrap;">
                      <button class="btn-icon" onclick="Stockage.viewPendingEntry('${e.id}')" title="Voir détails"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                      ${isPending ? `<button class="btn-icon" onclick="Stockage.validatePendingEntry('${e.id}')" title="Valider l\'entrée en stock" style="background:rgba(16,185,129,0.15);color:var(--accent-green);border-color:var(--accent-green);">✅</button>` : ''}
                      ${isPending ? `<button class="btn-icon danger" onclick="Stockage.deletePendingEntry('${e.id}')" title="Annuler"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>` : ''}
                    </td>
                  </tr>`;
                }).join('')}</tbody>
              </table>`
            }
          </div>
        </div>
      </div>
    `;
  },

  viewPendingEntry(id) {
    const e = (App.data.pendingStorageEntries || []).find(x => x.id === id);
    if (!e) return;
    const chambreLabels = { chambre1: 'Chambre 1', chambre2: 'Chambre 2', entreposage: 'Entreposage', direct: '🚀 Passage Direct' };
    const isPending = e.status === 'pending';

    const phasesHTML = (phases, title) => {
      if (!phases || phases.length === 0) return '';
      return `
        <div style="margin-top:16px;">
          <div style="font-weight:700;font-size:0.9rem;margin-bottom:8px;color:var(--text-secondary);">${title}</div>
          <table><thead><tr><th>Phase</th><th>Seuil %</th><th class="td-right">Qté Init</th><th class="td-right">Qté Finale</th><th class="td-right">Rend.</th></tr></thead>
          <tbody>${phases.map(ph => {
            const rend = ph.qteInit > 0 ? (ph.qteFinale / ph.qteInit * 100) : 0;
            return `<tr><td class="td-bold">${ph.nom}</td><td>${App.formatNumber(ph.seuil,1)}</td><td class="td-right">${App.formatNumber(ph.qteInit,2)}</td><td class="td-right td-bold">${App.formatNumber(ph.qteFinale,2)}</td><td class="td-right td-bold">${App.formatNumber(rend,2)}%</td></tr>`;
          }).join('')}</tbody></table>
        </div>`;
    };

    const intrantsHTML = (e.intrants && e.intrants.length > 0) ? `
      <div style="margin-top:16px;">
        <div style="font-weight:700;font-size:0.9rem;margin-bottom:8px;color:var(--text-secondary);">Intrants</div>
        <table><thead><tr><th>Article</th><th class="td-right">Qté</th><th class="td-right">Prix</th><th class="td-right">Valeur</th></tr></thead>
        <tbody>${e.intrants.map(it => `<tr><td>${it.article}</td><td class="td-right">${App.formatNumber(it.qte,2)}</td><td class="td-right">${App.formatNumber(it.prix,2)}</td><td class="td-right td-bold">${App.formatNumber((it.qte||0)*(it.prix||0),2)}</td></tr>`).join('')}
        <tr style="background:rgba(99,102,241,0.1);"><td colspan="3" class="td-bold">Total</td><td class="td-right td-bold">${App.formatNumber(e.totalIntrants||0,2)} DH</td></tr>
        </tbody></table>
      </div>` : '';

    const qrData = JSON.stringify({
      type: 'pending_transfer', 
      id: e.id, 
      productionId: e.productionId,
      source: e.origine, 
      bateau: e.bateau,
      espece: e.espece, 
      calibre: e.calibre,
      client: e.client, 
      poids: e.poidsPF, 
      chambre: e.chambreDestination,
      date: e.dateEnvoi
    });

    App.showModal(`📦 Transfert Production — ${e.origine}`, `
      <div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:8px; padding:12px; margin-bottom:18px; display:flex; align-items:center; gap:12px;">
        <span style="font-size:1.5rem;">📥</span>
        <div>
          <div style="font-weight:700; color:var(--primary-color);">Élément en attente de stockage</div>
          <div style="font-size:0.85rem; color:var(--text-secondary);">Ce lot provient de la production (${e.origine}) et attend d'être intégré au stock principal.</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Date d\'envoi</span><br><strong>${App.formatDateFR(e.dateEnvoi)}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Date production</span><br><strong>${App.formatDateFR(e.dateProd)}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Origine</span><br><span class="badge ${e.origine==='Traitement'?'badge-warning':'badge-info'}">${e.origine}</span></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Bateau source</span><br><strong>${e.bateau||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Client</span><br><strong>${e.client||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Espèce</span><br><span class="badge badge-info">${e.espece||'-'}</span></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Calibre</span><br><strong>${e.calibre||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Produit fini</span><br><strong>${e.produitFini||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Conditionnement</span><br><strong>${e.conditionnement||'-'}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Poids PF</span><br><strong style="color:var(--accent-green);font-size:1.15rem;">${App.formatNumber(e.poidsPF,2)} kg</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Caisses PF</span><br><strong>${App.formatNumber(e.caissesPF||0,0)}</strong></div>
        <div><span style="color:var(--text-muted);font-size:0.8rem;">Chambre destination</span><br><span class="badge badge-purple">${chambreLabels[e.chambreDestination]||e.chambreDestination}</span></div>
      </div>

      ${phasesHTML(e.phases, '🔹 Phases Matière Première')}
      ${phasesHTML(e.phasesPF, '🔹 Phases Produits Finis')}
      ${intrantsHTML}

      <div style="margin-top:20px;text-align:center;padding:16px;border:2px dashed var(--border-color);border-radius:12px;">
        <div style="font-weight:700;margin-bottom:10px;color:var(--text-secondary);">🏷️ QR Code — Traçabilité</div>
        <div id="pendingQrCode" style="display:inline-block;"></div>
        <div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted);">
          ${e.origine} | ${e.espece} ${e.calibre} | ${e.client} | ${App.formatDateFR(e.dateEnvoi)}
        </div>
      </div>
    `, `
      <div style="display:flex;gap:12px;justify-content:flex-end;width:100%;">
        <button class="btn btn-primary" onclick="Stockage.printTransferQR('${e.id}', 'pending')">🏷️ Imprimer QR</button>
        <button class="btn btn-outline" onclick="App.closeModal()">Fermer</button>
        ${isPending ? `<button class="btn btn-success" onclick="App.closeModal(); Stockage.validatePendingEntry('${e.id}')">✅ Valider Entrée en Stock</button>` : ''}
      </div>
    `);

    if (typeof QRCode !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('pendingQrCode');
        if (el) new QRCode(el, { text: qrData, width: 150, height: 150, correctLevel: QRCode.CorrectLevel.M });
      }, 100);
    }
  },

  validatePendingEntry(id) {
    const e = (App.data.pendingStorageEntries || []).find(x => x.id === id);
    if (!e || e.status !== 'pending') { App.toast('Élément introuvable ou déjà validé', 'error'); return; }

    const chambreLabels = { chambre1: 'Chambre 1', chambre2: 'Chambre 2', entreposage: 'Entreposage', direct: '🚀 Passage Direct' };

    App.showModal('✅ Confirmer Validation', `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:2.5rem;margin-bottom:10px;">✅</div>
        <p style="font-size:1.1rem;margin-bottom:8px;">Valider l\'entrée en stock de ce lot ?</p>
        <p style="color:var(--text-muted);font-size:0.9rem;">
          <strong>${e.espece} ${e.calibre}</strong> — ${App.formatNumber(e.poidsPF,2)} kg<br>
          Origine: <span class="badge ${e.origine==='Traitement'?'badge-warning':'badge-info'}">${e.origine}</span><br>
          Destination: <span class="badge badge-purple">${chambreLabels[e.chambreDestination]||e.chambreDestination}</span>
        </p>
        <p style="color:var(--text-muted);font-size:0.82rem;margin-top:12px;">
          Cela va créer une entrée dans le <strong>stock principal</strong> et retirer l'élément de la liste d\'attente.
        </p>
      </div>
    `, `
      <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
      <button class="btn btn-success" onclick="Stockage.doValidatePending('${id}')">✅ Confirmer</button>
    `);
  },

  doValidatePending(id) {
    const e = (App.data.pendingStorageEntries || []).find(x => x.id === id);
    if (!e || e.status !== 'pending') return;

    if (!App.data.stockage) App.data.stockage = [];

    const ref = this.generateRef();
    const dateFormatted = App.formatDateFR ? App.formatDateFR(e.dateEnvoi) : e.dateEnvoi;
    const palette = `P1 | ${e.client} | ${e.espece} | ${App.formatNumber(e.poidsPF,2)}kg | ${dateFormatted} | ${e.origine}`;

    const stockEntry = {
      id: App.nextId(App.data.stockage),
      reference: ref,
      dateEntree: e.dateEnvoi,
      client: e.client || '',
      fournisseur: e.fournisseur || e.client || '',
      bateau: e.bateau || '',
      consignataire: '',
      vehicule: '',
      refCapture: '',
      sejour: '',
      dateSortie: '',
      origine: e.origine,
      sourceProductionId: e.productionId,
      sourceProductionType: (e.origine||'').toLowerCase(),
      notaBene: `Lot transféré depuis ${e.origine} #${e.productionId} - ${e.bateau ? `Bateau: ${e.bateau}` : 'Sans bateau'}`,
      lignes: [{
        palette: palette,
        bateau: e.bateau || '',
        espece: e.espece || '',
        calibre: e.calibre || '',
        emballage: e.conditionnement || 'Cs',
        nbCaisses: e.caissesPF || 0,
        quantiteBL: 0,
        quantite: e.poidsPF || 0,
        tareEmballage: 0,
        tarePalette: 0,
        pdsBrutMoy: 0,
        pdsBrutTotal: e.poidsPF || 0,
        pdsNetTotal: e.poidsPF || 0,
        temperature: -18,
        chambre: e.chambreDestination || 'chambre1',
        notaBene: `Validé depuis attente le ${new Date().toLocaleDateString('fr-FR')}`
      }]
    };

    App.data.stockage.push(stockEntry);

    e.status = 'validated';
    e.validatedDate = new Date().toISOString();
    e.stockageEntryId = stockEntry.id;

    App.saveData();
    App.closeModal();
    this.render();
    App.toast(`✅ Entrée en stock validée — Réf: ${ref}`, 'success');
  },

  deletePendingEntry(id) {
    const e = (App.data.pendingStorageEntries || []).find(x => x.id === id);
    if (!e || e.status !== 'pending') return;

    App.showModal('🗑️ Annuler l\'envoi', `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:2.5rem;margin-bottom:10px;">⚠️</div>
        <p style="font-size:1.1rem;">Voulez-vous annuler cet envoi vers le stockage ?</p>
        <p style="color:var(--text-muted);font-size:0.9rem;">${e.espece} ${e.calibre} — ${App.formatNumber(e.poidsPF,2)} kg</p>
      </div>
    `, `
      <button class="btn btn-outline" onclick="App.closeModal()">Non, garder</button>
      <button class="btn btn-primary" style="background:var(--accent-red,#ef4444);" onclick="Stockage.doDeletePending('${id}')">🗑️ Oui, annuler</button>
    `);
  },

  doDeletePending(id) {
    const e = (App.data.pendingStorageEntries || []).find(x => x.id === id);
    if (!e) return;

    // Restore the production entry flag
    const prod = (App.data.production || []).find(p => p.id === e.productionId);
    if (prod) {
      prod.sentToStorage = false;
      delete prod.sentToStorageDate;
      delete prod.sentToChambre;
    }

    App.data.pendingStorageEntries = (App.data.pendingStorageEntries || []).filter(x => x.id !== id);
    App.saveData();
    App.closeModal();
    this.render();
    App.toast('Envoi annulé — La saisie peut être renvoyée', 'info');
  },

  printTransferQR(id, type = 'final') {
    let e;
    if (type === 'pending') {
      e = (App.data.pendingStorageEntries || []).find(x => x.id === id);
    } else {
      e = (App.data.stockage || []).find(x => x.id === id);
    }
    if (!e) return;

    const qrData = JSON.stringify({
      type: type === 'pending' ? 'pending_transfer' : 'stock_entry',
      id: e.id,
      ref: e.reference || '',
      origin: e.origine,
      bateau: e.bateau || '',
      espece: e.espece || (e.lignes && e.lignes[0] ? e.lignes[0].espece : ''),
      calibre: e.calibre || (e.lignes && e.lignes[0] ? e.lignes[0].calibre : ''),
      poids: e.poidsPF || (e.lignes ? e.lignes.reduce((s,l)=>s+(l.pdsNetTotal||0),0) : 0),
      date: e.dateEnvoi || e.dateEntree
    });

    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px;">
        <div id="print_qrcode"></div>
        <div style="text-align:center;font-family:sans-serif;">
          <div style="font-size:1.4rem;font-weight:700;margin-bottom:4px;">${e.espece || 'PRODUIT'}</div>
          <div style="font-size:1.1rem;color:#444;">Calibre: ${e.calibre || '-'}</div>
          <div style="margin:10px 0;padding:5px 15px;background:#eee;border-radius:4px;display:inline-block;font-weight:600;">
            ${e.origine} ${e.bateau ? `(${e.bateau})` : ''}
          </div>
          <div style="font-size:1.2rem;font-weight:700;color:#222;margin-top:5px;">
            ${App.formatNumber(e.poidsPF || (e.lignes ? e.lignes.reduce((s,l)=>s+(l.pdsNetTotal||0),0) : 0), 2)} kg
          </div>
          <div style="font-size:0.8rem;color:#666;margin-top:10px;">
            Client: ${e.client}<br>
            Date: ${App.formatDateFR(e.dateEnvoi || e.dateEntree)}
          </div>
        </div>
      </div>
    `;

    const printWin = window.open('', '_blank');
    printWin.document.write('<html><head><title>QR Code Transfert</title></head><body>' + html + '</body></html>');
    
    // We need to include the QRCode library in the print window if we want to render it there, 
    // but a better way is to render it in a hidden div in the current window and copy the canvas/img.
    // However, since we are in the same app, we can just render it in the print window using a script.
    
    const script = printWin.document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      new printWin.QRCode(printWin.document.getElementById("print_qrcode"), {
        text: qrData,
        width: 250,
        height: 250
      });
      setTimeout(() => {
        printWin.print();
        printWin.close();
      }, 500);
    };
    printWin.document.head.appendChild(script);
    printWin.document.close();
  }
};
