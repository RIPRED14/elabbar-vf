/* ============================================
   CONSOMMABLES — Stock + Seuils + Alertes
   ============================================ */
const AchatsVentes = {
  render() {
    const cons = App.data.consommables;
    const alerts = App.getAlerts();
    const content = document.getElementById('pageContent');

    let alertsHtml = '';
    if (alerts.length > 0) {
      const criticals = alerts.filter(a => a.type === 'critical');
      const warnings = alerts.filter(a => a.type === 'warning');
      if (criticals.length > 0) alertsHtml += `<div class="alerts-banner"><span class="alerts-banner-icon">🚨</span><div class="alerts-banner-text"><strong>STOCK CRITIQUE :</strong> ${criticals.map(a=>a.message).join(' | ')}</div></div>`;
      if (warnings.length > 0) alertsHtml += `<div class="alerts-banner warning"><span class="alerts-banner-icon">⚠️</span><div class="alerts-banner-text"><strong>Stock bas :</strong> ${warnings.map(a=>a.message).join(' | ')}</div></div>`;
    }

    content.innerHTML = `
      <div class="fade-in">
        ${alertsHtml}
        <div class="ntsamak-tabs" style="display:flex;gap:10px;margin-bottom:15px;border-bottom:2px solid #e0e0e0;padding-bottom:5px;">
          <button class="ntsamak-tab" onclick="AchatsVentes.switchTab('livraisons')" style="padding:8px 16px;border:none;background:transparent;color:#666;font-weight:600;cursor:pointer;">Bons de Livraison</button>
          <button class="ntsamak-tab active" onclick="AchatsVentes.switchTab('achats')" style="padding:8px 16px;border:none;background:transparent;border-bottom:3px solid var(--primary-color);color:var(--primary-color);font-weight:700;cursor:pointer;">Achats Consommables</button>
          <button class="ntsamak-tab" onclick="AchatsVentes.switchTab('facturation')" style="padding:8px 16px;border:none;background:transparent;color:#666;font-weight:600;cursor:pointer;">Facturation</button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
          <div><h2 class="page-title">Achats Consommables</h2><p class="page-subtitle">Stock, seuils critiques et alertes</p></div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-success btn-sm" onclick="AchatsVentes.showReception()">📥 Réception stock</button>
            <button class="btn btn-primary btn-sm" onclick="AchatsVentes.showAddModal()">+ Ajouter</button>
          </div>
        </div>

        <div class="card" style="margin-bottom:22px;">
          <div class="card-header"><span class="card-title">📦 État des stocks</span></div>
          <div class="card-body"><div class="table-container">${this.buildStockTable()}</div></div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">📋 Historique des mouvements</span></div>
          <div class="card-body"><div class="table-container">${this.buildMouvementsTable()}</div></div>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    const tabs = document.querySelectorAll('.ntsamak-tab');
    tabs.forEach(t => {
      t.style.borderBottom = 'none';
      t.style.color = '#666';
      t.style.fontWeight = '600';
    });
    
    // Find the clicked tab and set active
    const activeTab = Array.from(tabs).find(t => 
      (tab === 'livraisons' && t.textContent.includes('Livraison')) ||
      (tab === 'achats' && t.textContent.includes('Achats')) ||
      (tab === 'facturation' && t.textContent.includes('Facturation'))
    );
    if (activeTab) {
      activeTab.style.borderBottom = '3px solid var(--primary-color)';
      activeTab.style.color = 'var(--primary-color)';
      activeTab.style.fontWeight = '700';
    }

    // Logic for rendering views
    const content = document.getElementById('pageContent');
    if (tab === 'achats') {
      this.render(); // Re-render the standard consumable view
    } else if (tab === 'livraisons') {
      content.innerHTML = `
        <div class="fade-in">
          <div class="ntsamak-tabs" style="display:flex;gap:10px;margin-bottom:15px;border-bottom:2px solid #e0e0e0;padding-bottom:5px;">
            <button class="ntsamak-tab active" onclick="AchatsVentes.switchTab('livraisons')" style="padding:8px 16px;border:none;background:transparent;border-bottom:3px solid var(--primary-color);color:var(--primary-color);font-weight:700;cursor:pointer;">Bons de Livraison</button>
            <button class="ntsamak-tab" onclick="AchatsVentes.switchTab('achats')" style="padding:8px 16px;border:none;background:transparent;color:#666;font-weight:600;cursor:pointer;">Achats Consommables</button>
            <button class="ntsamak-tab" onclick="AchatsVentes.switchTab('facturation')" style="padding:8px 16px;border:none;background:transparent;color:#666;font-weight:600;cursor:pointer;">Facturation</button>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
            <button class="btn-ntsamak-green" onclick="AchatsVentes.showBLForm()">+ Nouveau Bon de Livraison</button>
          </div>
          <table>
            <thead><tr><th>N° BL</th><th>Date BL</th><th>Fournisseur / Client</th><th>Type</th><th>Montant HT</th><th>TVA</th><th>Montant TTC</th><th>Actions</th></tr></thead>
            <tbody>
              <tr><td colspan="8" class="td-center" style="color:#666;padding:20px;">Aucun bon de livraison enregistré</td></tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (tab === 'facturation') {
      content.innerHTML = `
        <div class="fade-in">
          <div class="ntsamak-tabs" style="display:flex;gap:10px;margin-bottom:15px;border-bottom:2px solid #e0e0e0;padding-bottom:5px;">
            <button class="ntsamak-tab" onclick="AchatsVentes.switchTab('livraisons')" style="padding:8px 16px;border:none;background:transparent;color:#666;font-weight:600;cursor:pointer;">Bons de Livraison</button>
            <button class="ntsamak-tab" onclick="AchatsVentes.switchTab('achats')" style="padding:8px 16px;border:none;background:transparent;color:#666;font-weight:600;cursor:pointer;">Achats Consommables</button>
            <button class="ntsamak-tab active" onclick="AchatsVentes.switchTab('facturation')" style="padding:8px 16px;border:none;background:transparent;border-bottom:3px solid var(--primary-color);color:var(--primary-color);font-weight:700;cursor:pointer;">Facturation</button>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;gap:10px;">
              <select class="form-select" style="width:200px;"><option>Tous les clients</option></select>
              <select class="form-select" style="width:200px;"><option>Statut: Tous</option><option>Payée</option><option>Non payée</option></select>
            </div>
            <button class="btn-ntsamak-green">+ Nouvelle Facture</button>
          </div>
          <table>
            <thead><tr><th>N° Facture</th><th>Date</th><th>Client / Fournisseur</th><th>Échéance</th><th>Montant TTC</th><th>Reste à payer</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              <tr><td colspan="8" class="td-center" style="color:#666;padding:20px;">Aucune facture enregistrée</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }
  },

  showBLForm() {
    App.showModal('📝 Nouveau Bon de Livraison', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Numéro BL</label><input type="text" class="form-input" value="BL-0001"></div>
        <div class="form-group"><label class="form-label">Date BL</label><input type="date" class="form-input" value="${App.formatDate(new Date())}"></div>
        <div class="form-group"><label class="form-label">Tiers (Client/Fournisseur)</label><select class="form-select"><option>Sélectionner...</option></select></div>
        <div class="form-group"><label class="form-label">Type</label><select class="form-select"><option>Vente (Sortie)</option><option>Achat (Entrée)</option></select></div>
      </div>
      <div style="margin-top:15px; border-top:1px solid #ccc; padding-top:15px;">
        <button class="btn btn-sm btn-success">+ Ajouter une ligne article</button>
        <table style="margin-top:10px;">
          <thead><tr><th>Désignation</th><th>Qté</th><th>Prix Unit.</th><th>TVA %</th><th>Total TTC</th></tr></thead>
          <tbody><tr><td colspan="5" class="td-center" style="color:#999;font-size:0.8rem;">Aucune ligne</td></tr></tbody>
        </table>
      </div>
    `, '<button class="btn btn-outline" onclick="App.closeModal()">Annuler</button><button class="btn-ntsamak-green" onclick="App.closeModal()">Enregistrer</button>');
  },

  getStatus(c) {
    if (c.stock <= c.seuilCritique) return { label: 'CRITIQUE', cls: 'critical', pct: Math.min(100, (c.stock / c.seuilCritique) * 30) };
    if (c.stock <= c.seuilAlerte) return { label: 'ALERTE', cls: 'warning', pct: 30 + ((c.stock - c.seuilCritique) / (c.seuilAlerte - c.seuilCritique)) * 30 };
    return { label: 'OK', cls: 'ok', pct: Math.min(100, 60 + ((c.stock - c.seuilAlerte) / (c.seuilAlerte * 2)) * 40) };
  },

  buildStockTable() {
    const cons = App.data.consommables;
    const categories = [...new Set(cons.map(c => c.categorie || 'Autres'))];
    
    let html = '';
    categories.forEach(cat => {
      const items = cons.filter(c => (c.categorie || 'Autres') === cat);
      if (items.length === 0) return;

      html += `
        <div class="category-section" style="margin-top:24px; margin-bottom:12px;">
          <h3 style="font-size:1.1rem; color:var(--accent-purple-light); border-left:4px solid var(--accent-purple); padding-left:12px; margin-bottom:14px;">${cat}</h3>
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Stock</th>
                <th>Unité</th>
                <th>Prix Unit.</th>
                <th>Valeur Total</th>
                <th>Statut</th>
                <th>Observations / Reste</th>
                <th style="width:80px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(c => {
                const st = this.getStatus(c);
                const totalVal = (c.stock || 0) * (c.prixUnitaire || 0);
                return `
                  <tr>
                    <td class="td-bold">${c.nom}</td>
                    <td class="td-right td-bold" style="color:${st.cls==='critical'?'var(--accent-red)':st.cls==='warning'?'var(--accent-yellow)':'inherit'}">${App.formatNumber(c.stock, 1)}</td>
                    <td>${c.unite}</td>
                    <td class="td-right">${App.formatNumber(c.prixUnitaire)} DH</td>
                    <td class="td-right td-bold" style="color:var(--accent-cyan)">${App.formatNumber(totalVal)} DH</td>
                    <td><span class="badge badge-${st.cls}">${st.cls === 'critical' ? '🔴' : st.cls === 'warning' ? '🟡' : '🟢'} ${st.label}</span></td>
                    <td style="font-size:0.8rem; color:var(--text-secondary); max-width:200px;">${c.observation || '-'}</td>
                    <td class="td-center">
                      <div style="display:flex; gap:4px; justify-content:center;">
                        <button class="btn-icon" onclick="AchatsVentes.editModal(${c.id})" title="Modifier"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                        <button class="btn-icon danger" onclick="AchatsVentes.deleteItem(${c.id})" title="Supprimer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              <tr style="background:rgba(99,102,241,0.05);">
                <td colspan="4" class="td-bold td-right">Sous-total ${cat} :</td>
                <td class="td-right td-bold" style="color:var(--accent-purple-light); font-size:1rem;">${App.formatNumber(items.reduce((s,i)=>(s+(i.stock*i.prixUnitaire)),0))} DH</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });

    const totalStock = cons.reduce((s,i)=>(s+(i.stock*i.prixUnitaire)),0);
    html += `
      <div style="margin-top:30px; padding:20px; background:var(--gradient-purple); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; color:white; box-shadow:var(--shadow-glow-purple);">
        <div>
          <div style="font-size:0.9rem; opacity:0.8; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Valeur totale du stock</div>
          <div style="font-size:1.8rem; font-weight:800;">${App.formatNumber(totalStock)} DH</div>
        </div>
        <div style="font-size:2.5rem; opacity:0.3;">📦</div>
      </div>
    `;

    return html;
  },

  buildMouvementsTable() {
    const mvts = (App.data.mouvementsStock || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
    if (mvts.length === 0) return '<div class="empty-state"><div class="empty-state-icon">📋</div><div>Aucun mouvement</div></div>';
    return `<table>
      <thead><tr><th>Date</th><th>Consommable</th><th>Type</th><th>Quantité</th><th>Motif</th></tr></thead>
      <tbody>${mvts.map(m => `<tr>
        <td>${App.formatDateFR(m.date)}</td>
        <td class="td-bold">${m.consommable}</td>
        <td><span class="badge ${m.type==='entree'?'badge-ok':'badge-warning'}">${m.type==='entree'?'📥 Entrée':'📤 Sortie'}</span></td>
        <td class="td-right td-bold">${m.type==='entree'?'+':'-'}${App.formatNumber(m.quantite, 1)}</td>
        <td>${m.motif||''}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  },

  showAddModal(entry = null) {
    const isEdit = !!entry;
    const cats = ['Sachets', 'Palettes', 'Supplies', 'Conditionnement', 'Autres'];
    App.showModal(isEdit ? '✏️ Modifier consommable' : '➕ Ajouter un consommable', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Nom</label><input type="text" class="form-input" id="cNom" value="${entry?.nom||''}"></div>
        <div class="form-group">
          <label class="form-label">Catégorie</label>
          <select class="form-select" id="cCategorie">
            ${cats.map(c => `<option value="${c}" ${entry?.categorie===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Unité</label><input type="text" class="form-input" id="cUnite" value="${entry?.unite||'pièce'}"></div>
        <div class="form-group"><label class="form-label">Stock actuel</label><input type="number" step="0.1" class="form-input" id="cStock" value="${entry?.stock||0}"></div>
        <div class="form-group"><label class="form-label">Prix unitaire (DH)</label><input type="number" step="0.01" class="form-input" id="cPrix" value="${entry?.prixUnitaire||0}"></div>
        <div class="form-group"><label class="form-label">Seuil d'alerte 🟡</label><input type="number" class="form-input" id="cSeuilAlerte" value="${entry?.seuilAlerte||100}"></div>
        <div class="form-group"><label class="form-label">Seuil critique 🔴</label><input type="number" class="form-input" id="cSeuilCritique" value="${entry?.seuilCritique||50}"></div>
        <div class="form-group" style="grid-column: span 2;"><label class="form-label">Observations / Reste</label><input type="text" class="form-input" id="cObs" value="${entry?.observation||''}" placeholder="Ex: Reste 24 R"></div>
      </div>
    `, `<button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
       <button class="btn btn-success" onclick="AchatsVentes.saveItem(${entry?.id||0})">${isEdit?'Mettre à jour':'Ajouter'}</button>`);
  },

  editModal(id) {
    const c = App.data.consommables.find(c => c.id === id);
    if (c) this.showAddModal(c);
  },

  saveItem(editId) {
    const nom = document.getElementById('cNom').value.trim();
    if (!nom) { App.toast('Le nom est requis', 'error'); return; }
    const data = {
      nom, 
      categorie: document.getElementById('cCategorie').value,
      unite: document.getElementById('cUnite').value,
      stock: parseFloat(document.getElementById('cStock').value) || 0,
      prixUnitaire: parseFloat(document.getElementById('cPrix').value) || 0,
      seuilAlerte: parseFloat(document.getElementById('cSeuilAlerte').value) || 0,
      seuilCritique: parseFloat(document.getElementById('cSeuilCritique').value) || 0,
      observation: document.getElementById('cObs').value,
    };
    if (editId) {
      const idx = App.data.consommables.findIndex(c => c.id === editId);
      if (idx !== -1) App.data.consommables[idx] = { ...App.data.consommables[idx], ...data };
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
    if (!confirm('Supprimer ce consommable ?')) return;
    App.data.consommables = App.data.consommables.filter(c => c.id !== id);
    App.saveData();
    this.render();
    App.toast('Consommable supprimé', 'info');
  },

  showReception() {
    const opts = App.data.consommables.map(c => `<option value="${c.id}">${c.nom} (stock: ${c.stock} ${c.unite})</option>`).join('');
    App.showModal('📥 Réception de stock <button class="btn-ai-magic" style="margin-left:12px;font-size:0.8rem;padding:4px 8px;" onclick="App.AiEngine.openScanner(\'consommables\', AchatsVentes.autoFillFromAI.bind(AchatsVentes))"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> Scan IA Facture</button>', `
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Consommable</label><select class="form-select" id="rConsommable">${opts}</select></div>
        <div class="form-group"><label class="form-label">Quantité reçue</label><input type="number" class="form-input" id="rQuantite" value="0"></div>
        <div class="form-group"><label class="form-label">Motif / Fournisseur</label><input type="text" class="form-input" id="rMotif" placeholder="Ex: Commande fournisseur X"></div>
      </div>
    `, `<button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
       <button class="btn btn-success" onclick="AchatsVentes.saveReception()">📥 Enregistrer</button>`);
  },

  saveReception() {
    const id = parseInt(document.getElementById('rConsommable').value);
    const qty = parseFloat(document.getElementById('rQuantite').value) || 0;
    const motif = document.getElementById('rMotif').value;
    if (qty <= 0) { App.toast('Quantité invalide', 'error'); return; }
    const c = App.data.consommables.find(c => c.id === id);
    if (c) {
      c.stock += qty;
      App.data.mouvementsStock.push({ date: new Date().toISOString(), consommable: c.nom, type: 'entree', quantite: qty, motif });
      App.saveData();
      App.closeModal();
      this.render();
      App.toast(`+${qty} ${c.unite} de ${c.nom} ajoutés`, 'success');
    }
  },

  autoFillFromAI(data) {
    if (!data || !data.articles || data.articles.length === 0) {
      App.toast("Aucun article trouvé dans la facture.", 'warning');
      return;
    }
    
    // Auto-fill the first article found
    const art = data.articles[0];
    
    // Find closest match in consumables list
    let matchedId = null;
    const consList = App.data.consommables;
    
    // exact match
    let match = consList.find(c => c.nom.toLowerCase() === art.designation.toLowerCase());
    
    // partial match
    if (!match) {
      match = consList.find(c => c.nom.toLowerCase().includes(art.designation.toLowerCase()) || art.designation.toLowerCase().includes(c.nom.toLowerCase()));
    }

    if (match) {
      document.getElementById('rConsommable').value = match.id;
    }
    
    if (art.quantite) {
      document.getElementById('rQuantite').value = art.quantite;
    }
    
    let motif = "";
    if (data.fournisseur) motif += `Fournisseur: ${data.fournisseur} `;
    if (data.date) motif += `(Date: ${data.date})`;
    document.getElementById('rMotif').value = motif.trim();
    
    if (data.articles.length > 1) {
      App.toast(`Attention: la facture contient ${data.articles.length} articles. Remplissage du 1er article uniquement.`, 'info');
    }
  }
};
