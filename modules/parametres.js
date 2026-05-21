/* ============================================
   PARAMETRES — Configuration générale
   ============================================ */
const Parametres = {
  currentTab: 'general',
  searchEspece: '',
  searchClient: '',

  render() {
    const p = App.data.parametres;
    const content = document.getElementById('pageContent');
    
    // Header with Tabs
    let html = `
      <div class="fade-in">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
          <div><h2 class="page-title">Paramètres</h2><p class="page-subtitle">Configuration générale du système</p></div>
          <button class="btn btn-success" onclick="Parametres.save()">💾 Enregistrer les modifications</button>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:10px; overflow-x:auto; scrollbar-width: none;">
          ${this.renderTabBtn('general', '⚙️ Général')}
          ${this.renderTabBtn('especes', '🐟 Espèces & Calibres')}
          ${this.renderTabBtn('clients', '🚢 Clients & Bateaux')}
          ${this.renderTabBtn('systeme', '💾 Système')}
        </div>
        
        <div id="paramContent">
    `;

    if (this.currentTab === 'general') {
      html += this.renderTabGeneral(p);
    } else if (this.currentTab === 'especes') {
      html += this.renderTabEspeces();
    } else if (this.currentTab === 'clients') {
      html += this.renderTabClients();
    } else if (this.currentTab === 'systeme') {
      html += this.renderTabSysteme();
    }

    html += `
        </div>
      </div>
    `;

    content.innerHTML = html;
  },

  renderTabBtn(id, label) {
    const isActive = this.currentTab === id;
    const bg = isActive ? 'var(--accent-blue)' : 'var(--bg-card)';
    const color = isActive ? '#fff' : 'var(--text-main)';
    const border = isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)';
    return `<button style="padding:10px 18px; border-radius:8px; background:${bg}; color:${color}; border:${border}; font-weight:600; cursor:pointer; white-space:nowrap; transition:all 0.2s; box-shadow:var(--shadow-sm);" onclick="Parametres.switchTab('${id}')">${label}</button>`;
  },

  switchTab(tab) {
    // Si on quitte l'onglet général, on sauvegarde silencieusement les valeurs saisies
    if (this.currentTab === 'general') {
        this.silentSaveGeneral();
    }
    this.currentTab = tab;
    this.render();
  },

  silentSaveGeneral() {
    const v = (id) => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : null;
    };
    if (document.getElementById('pSalaireOcc')) {
      App.data.parametres = {
        ...App.data.parametres,
        salaireHoraireOcc: v('pSalaireOcc') ?? App.data.parametres.salaireHoraireOcc,
        heuresMensuelles: v('pHeuresMens') ?? App.data.parametres.heuresMensuelles,
        salaireQualite: v('pSalaireQualite') ?? App.data.parametres.salaireQualite,
        salaireAdmin: v('pSalaireAdmin') ?? App.data.parametres.salaireAdmin,
        tarifKwh: v('pTarifKwh') ?? App.data.parametres.tarifKwh,
        puissanceKVA: v('pPuissance') ?? App.data.parametres.puissanceKVA,
        redevancePuissance: v('pRedPuiss') ?? App.data.parametres.redevancePuissance,
        redevanceEntretien: v('pRedEntr') ?? App.data.parametres.redevanceEntretien,
        redevanceLocation: v('pRedLoc') ?? App.data.parametres.redevanceLocation,
        coutCarburant: v('pCarburant') ?? App.data.parametres.coutCarburant,
        coutPersonnelLogistique: v('pPersLog') ?? App.data.parametres.coutPersonnelLogistique,
        coutStructureEstime: v('pCoutStrEstime') ?? App.data.parametres.coutStructureEstime,
        geminiApiKey: document.getElementById('pGeminiKey')?.value ?? App.data.parametres.geminiApiKey,
        geminiKey: document.getElementById('pGeminiKey')?.value ?? App.data.parametres.geminiKey,
        groqApiKey: document.getElementById('pGroqKey')?.value ?? App.data.parametres.groqApiKey,
        openRouterApiKey: document.getElementById('pOpenRouterKey')?.value ?? App.data.parametres.openRouterApiKey,
        ntsamakToken: document.getElementById('pNtsamakToken')?.value ?? App.data.parametres.ntsamakToken,
      };
    }
  },

  renderTabGeneral(p) {
    return `
      <div class="card" style="margin-bottom:18px;">
        <div class="card-header"><span class="card-title">💰 Main-d'œuvre</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Salaire horaire M.O. Occ. (DH)</label><input type="number" class="form-input" id="pSalaireOcc" value="${p.salaireHoraireOcc||17.92}"></div>
            <div class="form-group"><label class="form-label">Heures mensuelles (fixe)</label><input type="number" class="form-input" id="pHeuresMens" value="${p.heuresMensuelles||191}"></div>
            <div class="form-group"><label class="form-label">Salaire Qualité (DH/mois)</label><input type="number" class="form-input" id="pSalaireQualite" value="${p.salaireQualite||9000}"></div>
            <div class="form-group"><label class="form-label">Salaire Administration (DH/mois)</label><input type="number" class="form-input" id="pSalaireAdmin" value="${p.salaireAdmin||25000}"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card-header"><span class="card-title">⚡ Énergie</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Tarif kWh (DH)</label><input type="number" step="0.01" class="form-input" id="pTarifKwh" value="${p.tarifKwh||1.01}"></div>
            <div class="form-group"><label class="form-label">Puissance souscrite (KVA)</label><input type="number" class="form-input" id="pPuissance" value="${p.puissanceKVA||400}"></div>
            <div class="form-group"><label class="form-label">Redevance puissance (DH)</label><input type="number" class="form-input" id="pRedPuiss" value="${p.redevancePuissance||17087.58}"></div>
            <div class="form-group"><label class="form-label">Redevance entretien (DH)</label><input type="number" class="form-input" id="pRedEntr" value="${p.redevanceEntretien||391.20}"></div>
            <div class="form-group"><label class="form-label">Redevance location (DH)</label><input type="number" class="form-input" id="pRedLoc" value="${p.redevanceLocation||215.05}"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card-header"><span class="card-title">🚚 Logistique</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Coût carburant (DH/mois)</label><input type="number" class="form-input" id="pCarburant" value="${p.coutCarburant||300}"></div>
            <div class="form-group"><label class="form-label">Personnel logistique (DH/mois)</label><input type="number" class="form-input" id="pPersLog" value="${p.coutPersonnelLogistique||4000}"></div>
            <div class="form-group"><label class="form-label">Coût structure estimé (DH/kg)</label><input type="number" step="0.01" class="form-input" id="pCoutStrEstime" value="${p.coutStructureEstime||1.50}"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card-header"><span class="card-title">🤖 Intelligence Artificielle (OCR)</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label class="form-label" style="margin-bottom:0;">Clé API Google Gemini (Principal)</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size:0.75rem; color:var(--accent-blue); text-decoration:none;">🔗 Récupérer la clé</a>
              </div>
              <input type="password" class="form-input" id="pGeminiKey" value="${p.geminiApiKey||''}" placeholder="AIzaSy...">
            </div>
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label class="form-label" style="margin-bottom:0;">Clé API Groq (Fallback 1)</label>
                <a href="https://console.groq.com/keys" target="_blank" style="font-size:0.75rem; color:var(--accent-blue); text-decoration:none;">🔗 Récupérer la clé</a>
              </div>
              <input type="password" class="form-input" id="pGroqKey" value="${p.groqApiKey||''}" placeholder="gsk_...">
            </div>
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label class="form-label" style="margin-bottom:0;">Clé API OpenRouter (Fallback 2)</label>
                <a href="https://openrouter.ai/keys" target="_blank" style="font-size:0.75rem; color:var(--accent-blue); text-decoration:none;">🔗 Récupérer la clé</a>
              </div>
              <input type="password" class="form-input" id="pOpenRouterKey" value="${p.openRouterApiKey||''}" placeholder="sk-or-v1-...">
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px; margin-bottom: 15px;">
                Le système bascule automatiquement sur Groq ou OpenRouter si Gemini atteint son quota.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card-header"><span class="card-title">🔌 Portail Externe Ntsamak</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <label class="form-label" style="margin-bottom:0;">Jeton JWT Ntsamak (Bearer Token)</label>
                <div style="font-size:0.75rem; color:var(--text-muted);">Configuré par défaut avec votre clé de session active</div>
              </div>
              <input type="password" class="form-input" id="pNtsamakToken" value="${p.ntsamakToken||''}" placeholder="Bearer eyJhbGciOiJSUzI1Ni...">
            </div>
          </div>
      </div>
    `;
  },

  renderTabEspeces() {
    const list = App.data.especes || [];
    const filtered = list.filter(e => e.nom.toUpperCase().includes(this.searchEspece.toUpperCase()));

    return `
      <div class="card" style="margin-bottom:18px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span class="card-title">🐟 Espèces de poisson & Calibres</span>
          <div style="position:relative; flex:1; max-width:300px;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.5;">🔍</span>
            <input type="text" class="form-input" placeholder="Rechercher une espèce..." value="${this.searchEspece}" oninput="Parametres.searchEspece = this.value; Parametres.render()" style="padding-left:36px; width:100%;">
          </div>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:8px;margin-bottom:20px; background:var(--bg-tertiary); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
            <input type="text" class="form-input" id="newEspece" placeholder="Nouvelle espèce (ex: SARDINE)..." style="flex:1">
            <button class="btn btn-primary" onclick="Parametres.addEspece()">+ Ajouter Espèce</button>
          </div>
          
          <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; font-weight:600;">Affichage de ${filtered.length} espèce(s) sur ${list.length}</div>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:16px;" id="especesList">
            ${filtered.map(e => `
              <div class="card" style="padding:16px;background:var(--bg-tertiary);border:1px solid var(--border-color);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <strong style="font-size:1.1rem;color:var(--primary-color);">${e.nom}</strong>
                  <button class="btn-icon danger" onclick="Parametres.removeEspece('${e.nom}')" style="width:24px;height:24px;" title="Supprimer l'espèce">✕</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                  ${e.calibres.map(c => `
                    <span class="badge badge-purple" style="font-size:0.8rem;padding:4px 10px;">
                      ${c}
                      <span style="cursor:pointer;margin-left:8px;opacity:0.7" onclick="Parametres.generateQR('${e.nom}', '${c}')" title="Générer QR">QR</span>
                      <span style="cursor:pointer;margin-left:8px;opacity:0.7" onclick="Parametres.removeCalibre('${e.nom}', '${c}')" title="Supprimer calibre">✕</span>
                    </span>
                  `).join('')}
                </div>
                <div style="display:flex;gap:8px;">
                  <input type="text" class="form-input" id="newCalibre_${e.nom.replace(/\s+/g, '_')}" placeholder="Nouveau calibre..." style="padding:6px 12px;font-size:0.85rem;flex:1">
                  <button class="btn btn-primary btn-sm" onclick="Parametres.addCalibre('${e.nom}')">Add</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderTabClients() {
    const list = App.data.clients || [];
    const filtered = list.filter(c => c.nom.toUpperCase().includes(this.searchClient.toUpperCase()));

    return `
      <div class="card" style="margin-bottom:18px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span class="card-title">🚢 Clients / Fournisseurs & Bateaux</span>
          <div style="position:relative; flex:1; max-width:300px;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.5;">🔍</span>
            <input type="text" class="form-input" placeholder="Rechercher un client..." value="${this.searchClient}" oninput="Parametres.searchClient = this.value; Parametres.render()" style="padding-left:36px; width:100%;">
          </div>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns: 2fr 2fr 1fr auto; gap:12px; margin-bottom:20px; background:var(--bg-tertiary); padding:16px; border-radius:8px; border:1px solid var(--border-color);">
            <input type="text" class="form-input" id="newClientNom" placeholder="Raison sociale...">
            <select class="form-select" id="newClientType">
              <option value="Armateur, Client, Fournisseur poisson">Armateur/Client/Fournisseur</option>
              <option value="Client, Fournisseur poisson">Client/Fournisseur</option>
              <option value="Fournisseur divers achats">Fournisseur divers</option>
              <option value="Frigo">Frigo</option>
            </select>
            <input type="text" class="form-input" id="newClientVille" placeholder="Ville...">
            <button class="btn btn-primary" onclick="Parametres.addClient()">+ Ajouter</button>
          </div>
          
          <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; font-weight:600;">Affichage de ${filtered.length} client(s) sur ${list.length}</div>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;" id="clientsList">
            ${filtered.map((c) => {
              const ci = App.data.clients.indexOf(c); // Use original index for actions
              return `
              <div class="card" style="padding:16px;background:var(--bg-tertiary);border:1px solid var(--border-color);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <strong style="font-size:1rem;color:var(--accent-blue);">${c.nom}</strong>
                  <button class="btn-icon danger" onclick="Parametres.removeClient(${ci})" style="width:24px;height:24px;" title="Supprimer">✕</button>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;">${c.type} — ${c.ville}</div>
                <div style="font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--primary-color);">🚢 Bateaux:</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                  ${(c.bateaux||[]).length === 0 ? '<span style="font-size:0.8rem;color:var(--text-muted);font-style:italic;">Aucun bateau</span>' :
                    (c.bateaux||[]).map((b, bi) => `
                      <span class="badge badge-info" style="font-size:0.8rem;padding:4px 10px;">
                        ${b.nom} <span style="opacity:0.7;font-size:0.75rem;margin-left:4px;">${b.agrement||''}</span>
                        <span style="cursor:pointer;margin-left:8px;opacity:0.7" onclick="Parametres.removeBateau(${ci},${bi})">✕</span>
                      </span>
                    `).join('')}
                </div>
                <div style="display:flex;gap:6px;">
                  <input type="text" class="form-input" id="newBat_${ci}" placeholder="Nom bateau..." style="padding:6px 12px;font-size:0.85rem;flex:1">
                  <select class="form-select" id="newBatType_${ci}" style="padding:6px 12px;font-size:0.85rem;width:110px;">
                    <option value="Congelateur">Congel.</option>
                    <option value="RSW">RSW</option>
                    <option value="Glaciere">Glacière</option>
                  </select>
                  <button class="btn btn-success btn-sm" onclick="Parametres.addBateau(${ci})" style="font-size:0.85rem;">+</button>
                </div>
              </div>
            `}).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderTabSysteme() {
    return `
      <div class="card" style="margin-bottom:18px;">
        <div class="card-header"><span class="card-title">💾 Système & Sauvegardes</span></div>
        <div class="card-body">
          <p style="margin-bottom:20px; color:var(--text-muted);">Gérez les sauvegardes globales de votre application, exportez vos données ou restaurez le système.</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap; align-items:center;">
            <button class="btn btn-outline" onclick="App.exportData()" style="padding:12px 24px; display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.4rem;">📤</span> 
              <div style="text-align:left;">
                <div style="font-weight:600;">Exporter les données</div>
                <div style="font-size:0.75rem; opacity:0.7;">Télécharger un fichier JSON</div>
              </div>
            </button>
            <label class="btn btn-outline" style="cursor:pointer; padding:12px 24px; display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.4rem;">📥</span> 
              <div style="text-align:left;">
                <div style="font-weight:600;">Importer des données</div>
                <div style="font-size:0.75rem; opacity:0.7;">Restaurer depuis un JSON</div>
              </div>
              <input type="file" accept=".json" style="display:none" onchange="App.importData(this.files[0])">
            </label>
            <button class="btn" style="background:var(--status-info); color:white; padding:12px 24px; display:flex; align-items:center; gap:8px;" onclick="App.syncToSupabase()">
              <span style="font-size:1.4rem;">☁️</span> 
              <div style="text-align:left;">
                <div style="font-weight:600;">Synchronisation Cloud</div>
                <div style="font-size:0.75rem; opacity:0.9;">Forcer l'envoi maintenant</div>
              </div>
            </button>
            <div style="flex:1;"></div>
            <button class="btn btn-danger" onclick="App.resetData()" style="padding:12px 24px; display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.4rem;">🗑️</span> 
              <div style="text-align:left;">
                <div style="font-weight:600;">Réinitialiser le système</div>
                <div style="font-size:0.75rem; opacity:0.9;">Action irréversible</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  save() {
    if (this.currentTab === 'general') {
      this.silentSaveGeneral();
    }
    App.saveData();
    App.toast('Paramètres enregistrés avec succès', 'success');
  },

  addEspece() {
    const input = document.getElementById('newEspece');
    const val = input.value.trim().toUpperCase();
    if (!val) return;
    if (App.data.especes.some(e => e.nom === val)) { App.toast('Cette espèce existe déjà', 'error'); return; }
    const newEsp = { nom: val, calibres: ['1', '2', '3', '4'] };
    App.data.especes.push(newEsp);
    App.saveData('especes', newEsp);
    input.value = '';
    this.render();
    App.toast(`Espèce "${val}" ajoutée`, 'success');
  },

  removeEspece(nom) {
    const usedInStock = (App.data.stockage || []).some(e => (e.lignes || []).some(l => l.espece === nom));
    const usedInProduction = (App.data.production || []).some(p => p.espece === nom);
    const usedInQR = (App.data.qrCodes || []).some(q => q.value === nom || q.espece === nom);
    if (usedInStock || usedInProduction || usedInQR) {
      App.toast('Suppression bloquée: cette espèce est utilisée dans les données', 'error');
      return;
    }
    if (!confirm(`Supprimer l'espèce "${nom}" ?`)) return;
    App.data.especes = App.data.especes.filter(e => e.nom !== nom);
    App.deleteFromCloud('especes', nom, 'nom');
    App.saveData();
    this.render();
    App.toast(`Espèce "${nom}" supprimée`, 'info');
  },

  addCalibre(nomEspece) {
    const inputId = 'newCalibre_' + nomEspece.replace(/\s+/g, '_');
    const input = document.getElementById(inputId);
    const val = input.value.trim().toUpperCase();
    if (!val) return;
    const esp = App.data.especes.find(e => e.nom === nomEspece);
    if (esp) {
      if (esp.calibres.includes(val)) { App.toast('Ce calibre existe déjà', 'error'); return; }
      esp.calibres.push(val);
      App.saveData();
      this.render();
      App.toast(`Calibre "${val}" ajouté à ${nomEspece}`, 'success');
    }
  },

  removeCalibre(nomEspece, calibre) {
    const esp = App.data.especes.find(e => e.nom === nomEspece);
    if (esp) {
      const usedInStock = (App.data.stockage || []).some(e => (e.lignes || []).some(l => l.espece === nomEspece && l.calibre === calibre));
      const usedInProduction = (App.data.production || []).some(p => p.espece === nomEspece && p.calibre === calibre);
      const usedInQR = (App.data.qrCodes || []).some(q => q.espece === nomEspece && q.calibre === calibre);
      if (usedInStock || usedInProduction || usedInQR) {
        App.toast('Suppression bloquée: ce calibre est utilisé dans les données', 'error');
        return;
      }
      esp.calibres = esp.calibres.filter(c => c !== calibre);
      App.saveData();
      this.render();
      App.toast(`Calibre "${calibre}" supprimé de ${nomEspece}`, 'info');
    }
  },

  generateQR(espece, calibre) {
    const data = JSON.stringify({ type: 'espece_calibre', espece, calibre });
    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div id="qrcode" style="padding:16px;background:white;border-radius:8px;"></div>
        <div style="text-align:center;">
          <strong style="font-size:1.2rem;color:var(--text-primary);">${espece}</strong><br>
          <span class="badge badge-purple" style="font-size:1rem;margin-top:6px;">Calibre: ${calibre}</span>
        </div>
        <button class="btn btn-primary" onclick="Parametres.printQR()">🖨️ Imprimer</button>
      </div>
    `;
    App.showModal(`QR Code — ${espece} (Calibre ${calibre})`, html);
    setTimeout(() => {
      new QRCode(document.getElementById("qrcode"), {
        text: data,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
    }, 100);
  },

  printQR() {
    const printContents = document.querySelector('.modal-body').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Impression QR Code</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            #qrcode { margin-bottom: 20px; }
            strong { font-size: 24px; }
            .badge { font-size: 18px; border: 1px solid #ccc; padding: 5px 10px; border-radius: 5px; margin-top: 10px; display: inline-block; }
            button { display: none; }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  },

  // --- Clients / Bateaux CRUD ---
  addClient() {
    const nom = document.getElementById('newClientNom')?.value?.trim();
    const type = document.getElementById('newClientType')?.value || '';
    const ville = document.getElementById('newClientVille')?.value?.trim() || 'Agadir';
    if (!nom) { App.toast('Saisissez le nom du client', 'error'); return; }
    if (!App.data.clients) App.data.clients = [];
    if (App.data.clients.some(c => c.nom.toUpperCase() === nom.toUpperCase())) {
      App.toast('Ce client existe déjà', 'error'); return;
    }
    App.data.clients.push({ nom: nom.toUpperCase(), type, ville, bateaux: [] });
    App.data.clients.sort((a, b) => a.nom.localeCompare(b.nom));
    App.saveData();
    this.render();
    App.toast('Client ajouté', 'success');
  },

  removeClient(idx) {
    if (!confirm('Supprimer ce client ?')) return;
    App.data.clients.splice(idx, 1);
    App.saveData();
    this.render();
    App.toast('Client supprimé', 'info');
  },

  addBateau(clientIdx) {
    const nom = document.getElementById(`newBat_${clientIdx}`)?.value?.trim();
    const type = document.getElementById(`newBatType_${clientIdx}`)?.value || 'Congelateur';
    if (!nom) { App.toast('Saisissez le nom du bateau', 'error'); return; }
    const client = App.data.clients[clientIdx];
    if (!client.bateaux) client.bateaux = [];
    if (client.bateaux.some(b => b.nom.toUpperCase() === nom.toUpperCase())) {
      App.toast('Ce bateau existe déjà pour ce client', 'error'); return;
    }
    client.bateaux.push({ nom: nom.toUpperCase(), type, agrement: '' });
    App.saveData();
    this.render();
    App.toast(`Bateau "${nom}" ajouté à ${client.nom}`, 'success');
  },

  removeBateau(clientIdx, bateauIdx) {
    App.data.clients[clientIdx].bateaux.splice(bateauIdx, 1);
    App.saveData();
    this.render();
    App.toast('Bateau supprimé', 'info');
  }
};
