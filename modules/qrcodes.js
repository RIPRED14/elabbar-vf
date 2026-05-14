/* ============================================
   QR CODES — Codes QR uniques & immuables
   ============================================ */
const QRCodes = {
  SERVICES: ['Congélation', 'Frais', 'Traitement'],
  currentTab: 'generate',
  
  getQRForLot(client, espece, calibre) {
    const list = App.data.qrCodes || [];
    const c = (client || '').trim().toUpperCase();
    const e = (espece || '').trim().toUpperCase();
    const cal = (calibre || '').trim().toUpperCase();

    // 1. Chercher un QR de type 'service' (ex: Traitement) pour cette espèce/calibre
    // On essaie avec 'Traitement' par défaut car on est dans le module saisie
    let found = list.find(q => q.type === 'service' && q.value.toUpperCase() === 'TRAITEMENT' && q.espece.toUpperCase() === e && q.calibre.toUpperCase() === cal);
    if (found) return found;

    // 2. Chercher un QR de type 'espece'
    found = list.find(q => q.type === 'espece' && q.value.toUpperCase() === e);
    if (found) return found;

    // 3. Chercher un QR de type 'client'
    found = list.find(q => q.type === 'client' && q.value.toUpperCase() === c);
    if (found) return found;

    return null;
  },

  getEspeces() {
    return (App.data.especes || [])
      .map(e => typeof e === 'string' ? e : e?.nom)
      .filter(Boolean)
      .map(e => e.trim())
      .filter(Boolean);
  },

  getCalibresForEspece(espece) {
    const item = (App.data.especes || []).find(e => (typeof e === 'string' ? e : e?.nom) === espece);
    if (item && Array.isArray(item.calibres)) return item.calibres;
    if (App.data.especeCalibres?.[espece]) return App.data.especeCalibres[espece];
    return App.data.calibres || [];
  },

  getClients() {
    const names = new Set();
    (App.data.stockage || []).forEach(e => {
      if (e.client) names.add(e.client);
      if (e.fournisseur) names.add(e.fournisseur);
      if (e.consignataire) names.add(e.consignataire);
    });
    (App.data.production || []).forEach(e => {
      if (e.client) names.add(e.client);
    });
    (App.data.factures || []).forEach(e => {
      if (e.client) names.add(e.client);
    });
    [
      'FISH & FOOD TRAITEMENT',
      'FISH AND FOOD PROCESS',
      'LAMBDA FISH SUD',
      'A.O.C',
      'ALIA PECHE',
      'ARCHI FOOD',
      'ASMAK KHALIL ADAM',
      'ATLANTIC FISH MOROCCO',
      'ATLANTIC FISH SUD',
      'DIVERS'
    ].forEach(name => names.add(name));
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'));
  },

  render() {
    const qrList = App.data.qrCodes || [];
    const content = document.getElementById('pageContent');
    content.innerHTML = `
      <div class="fade-in">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px;">
          <div>
            <nav style="display:flex; gap:8px; margin-bottom:12px; font-size:0.85rem; font-weight:600; color:var(--text-muted);">
              <span>Logistique</span>
              <span>/</span>
              <span style="color:var(--accent-blue);">Traçabilité QR</span>
            </nav>
            <h2 class="page-title">Système d'Identification</h2>
            <p class="page-subtitle">Génération et gestion des codes QR immuables pour une traçabilité totale.</p>
          </div>
          <div style="display:flex; gap:12px;">
            <div class="kpi-mini">
              <span class="kpi-mini-label">Total Codes</span>
              <span class="kpi-mini-value">${qrList.length}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="tabs-header" style="display:flex; gap:32px; border-bottom:1px solid var(--border-color); padding:0 32px; background:rgba(37,99,255,0.02);">
            <button class="tab-btn ${this.currentTab==='generate'?'active':''}" onclick="QRCodes.switchTab('generate')" style="padding:18px 0; border:none; background:transparent; font-weight:700; font-size:0.9rem; position:relative; cursor:pointer; color:${this.currentTab==='generate'?'var(--accent-blue)':'var(--text-muted)'};">
              ✨ NOUVEAU CODE
              ${this.currentTab==='generate' ? '<div style="position:absolute; bottom:0; left:0; width:100%; height:3px; background:var(--accent-blue); border-radius:3px 3px 0 0;"></div>' : ''}
            </button>
            <button class="tab-btn ${this.currentTab==='list'?'active':''}" onclick="QRCodes.switchTab('list')" style="padding:18px 0; border:none; background:transparent; font-weight:700; font-size:0.9rem; position:relative; cursor:pointer; color:${this.currentTab==='list'?'var(--accent-blue)':'var(--text-muted)'};">
              📁 BIBLIOTHÈQUE
              ${this.currentTab==='list' ? '<div style="position:absolute; bottom:0; left:0; width:100%; height:3px; background:var(--accent-blue); border-radius:3px 3px 0 0;"></div>' : ''}
            </button>
          </div>
          <div class="card-body" id="qrContent" style="padding:32px;">
            ${this.buildTab()}
          </div>
        </div>
      </div>`;
  },

  switchTab(t) { this.currentTab = t; document.getElementById('qrContent').innerHTML = this.buildTab(); this.render(); },

  buildTab() { return this.currentTab === 'generate' ? this.buildGenerateTab() : this.buildListTab(); },

  makeKey(type, value, espece, calibre) {
    if (type === 'service' && espece && calibre) return `${type}::${value.trim().toUpperCase()}|${espece.trim().toUpperCase()}|${calibre.trim().toUpperCase()}`;
    if (type === 'service' && espece) return `${type}::${value.trim().toUpperCase()}|${espece.trim().toUpperCase()}`;
    return `${type}::${value.trim().toUpperCase()}`;
  },

  exists(type, value, espece, calibre) {
    const key = this.makeKey(type, value, espece, calibre);
    return (App.data.qrCodes || []).some(q => q.uniqueKey === key);
  },

  buildGenerateTab() {
    const especes = this.getEspeces();
    return `
      <div style="max-width:900px; margin:0 auto;">
        <div style="background:rgba(37,99,255,0.05); border:1px solid rgba(37,99,255,0.2); border-radius:16px; padding:24px; margin-bottom:32px; display:flex; gap:20px; align-items:center;">
          <div class="kpi-icon blue" style="width:48px; height:48px; font-size:1.4rem; flex-shrink:0;">🛡️</div>
          <div style="font-size:0.95rem; color:var(--text-primary); line-height:1.6;">
            <strong style="color:var(--accent-blue);">Protocole d'Intégrité :</strong> Les codes QR générés sont stockés avec une signature unique (SHA-256). Toute modification ultérieure des données invalidera la traçabilité physique.
          </div>
        </div>

        <div class="form-grid" style="grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:24px;">
          <div class="form-group">
            <label class="form-label">Classification du Code</label>
            <select class="form-select" id="qrType" onchange="QRCodes.onTypeChange()" style="height:48px; font-weight:600;">
              <option value="">-- Choisir une catégorie --</option>
              <option value="client">👤 Entité Client</option>
              <option value="espece">🐟 Ressource Halieutique</option>
              <option value="service">🏭 Unité de Traitement</option>
            </select>
          </div>
          <div class="form-group" id="qrValueGroup" style="display:none;">
            <label class="form-label" id="qrValueLabel">Valeur de Référence</label>
            <select class="form-select" id="qrValue" style="height:48px; font-weight:600;"></select>
          </div>
          <div class="form-group" id="qrEspeceGroup" style="display:none;">
            <label class="form-label">Espèce Associée</label>
            <select class="form-select" id="qrServiceEspece" style="height:48px; font-weight:600;">
              <option value="">-- Sélectionner l'espèce --</option>
              ${especes.map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" id="qrCalibreGroup" style="display:none;">
            <label class="form-label">Spécification Calibre</label>
            <select class="form-select" id="qrServiceCalibre" style="height:48px; font-weight:600;">
              <option value="">-- En attente espèce --</option>
            </select>
          </div>
        </div>

        <div id="qrDupWarning" style="margin-top:24px; display:none;"></div>

        <div style="margin-top:40px; text-align:center;">
          <button class="btn btn-primary" style="padding:14px 48px; font-size:1rem; box-shadow:var(--shadow-lg);" onclick="QRCodes.generate()" id="qrGenBtn" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Générer la Signature Unique
          </button>
        </div>

        <div id="qrPreviewArea" style="margin-top:48px;"></div>
      </div>`;
  },

  onTypeChange() {
    const type = document.getElementById('qrType').value;
    const vg = document.getElementById('qrValueGroup');
    const eg = document.getElementById('qrEspeceGroup');
    const cg = document.getElementById('qrCalibreGroup');
    const sel = document.getElementById('qrValue');
    const lbl = document.getElementById('qrValueLabel');
    const btn = document.getElementById('qrGenBtn');
    const warn = document.getElementById('qrDupWarning');
    warn.style.display = 'none';
    eg.style.display = 'none';
    cg.style.display = 'none';
    if (!type) { vg.style.display = 'none'; btn.disabled = true; return; }
    vg.style.display = '';
    let opts = '';
    if (type === 'client') {
      lbl.textContent = 'Client';
      opts = this.getClients().map(c => `<option value="${c}">${c}</option>`).join('');
    } else if (type === 'espece') {
      lbl.textContent = 'Espèce';
      opts = this.getEspeces().map(e => `<option value="${e}">${e}</option>`).join('');
    } else {
      lbl.textContent = 'Service';
      opts = this.SERVICES.map(s => `<option value="${s}">${s}</option>`).join('');
      eg.style.display = '';
      cg.style.display = '';
      document.getElementById('qrServiceEspece').onchange = () => this.onServiceEspeceChange();
      document.getElementById('qrServiceCalibre').onchange = () => this.checkDuplicate();
    }
    sel.innerHTML = '<option value="">-- Sélectionner --</option>' + opts;
    sel.onchange = () => this.checkDuplicate();
    btn.disabled = true;
  },

  onServiceEspeceChange() {
    const espece = document.getElementById('qrServiceEspece')?.value?.trim() || '';
    const calSel = document.getElementById('qrServiceCalibre');
    if (!calSel) return;
    const calibres = espece ? this.getCalibresForEspece(espece) : [];
    calSel.innerHTML = '<option value="">-- Calibre --</option>' + calibres.map(c => `<option value="${c}">${c}</option>`).join('');
    this.checkDuplicate();
  },

  checkDuplicate() {
    const type = document.getElementById('qrType').value;
    const value = document.getElementById('qrValue').value;
    const espece = type === 'service' ? (document.getElementById('qrServiceEspece')?.value || '') : '';
    const calibre = type === 'service' ? (document.getElementById('qrServiceCalibre')?.value || '') : '';
    const warn = document.getElementById('qrDupWarning');
    const btn = document.getElementById('qrGenBtn');
    if (!value || (type === 'service' && (!espece || !calibre))) { warn.style.display = 'none'; btn.disabled = true; return; }
    
    if (this.exists(type, value, espece, calibre)) {
      warn.style.display = 'block';
      warn.innerHTML = `<div style="color:var(--status-danger); font-size:0.85rem; font-weight:600; text-align:center;">⚠️ Ce QR Code existe déjà dans la base.</div>`;
      btn.disabled = true;
    } else {
      warn.style.display = 'block';
      warn.innerHTML = `<div style="color:var(--status-success); font-size:0.85rem; font-weight:600; text-align:center;">✅ Combinaison disponible.</div>`;
      btn.disabled = false;
    }
  },

  async generate() {
    const type = document.getElementById('qrType').value;
    const value = document.getElementById('qrValue').value;
    const espece = type === 'service' ? (document.getElementById('qrServiceEspece')?.value || '') : '';
    const calibre = type === 'service' ? (document.getElementById('qrServiceCalibre')?.value || '') : '';
    
    const uniqueKey = this.makeKey(type, value, espece, calibre);
    const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const qrString = stripAccents(uniqueKey);

    const area = document.getElementById('qrPreviewArea');
    area.innerHTML = `
      <div class="card" style="background:var(--bg-app); border:1px solid var(--border-color);">
        <div class="card-body" style="display:flex; gap:30px; align-items:center; justify-content:center; padding:30px;">
          <div id="qrRenderDiv" style="background:white; padding:15px; border-radius:12px; box-shadow:var(--shadow-md);"></div>
          <div style="flex:1; max-width:400px;">
            <h3 style="margin:0 0 10px 0;">QR Code Généré</h3>
            <div style="font-size:0.9rem; margin-bottom:20px;">
              <div style="margin-bottom:6px;">Type: <strong>${type.toUpperCase()}</strong></div>
              <div style="margin-bottom:6px;">Valeur: <strong>${value}</strong></div>
              ${espece ? `<div style="margin-bottom:6px;">Espèce: <strong>${espece}</strong></div>` : ''}
              ${calibre ? `<div style="margin-bottom:6px;">Calibre: <strong>${calibre}</strong></div>` : ''}
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline" onclick="QRCodes.printQR()">🖨️ Imprimer</button>
              <button class="btn btn-outline" onclick="QRCodes.downloadQR()">⬇️ PNG</button>
            </div>
          </div>
        </div>
      </div>`;

    new QRCode(document.getElementById('qrRenderDiv'), {
      text: qrString, width: 180, height: 180, colorDark: '#0B2D6B', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.L
    });

    await new Promise(r => setTimeout(r, 300));
    const qrImg = document.querySelector('#qrRenderDiv img') || document.querySelector('#qrRenderDiv canvas');
    let imageData = qrImg.tagName === 'CANVAS' ? qrImg.toDataURL('image/png') : qrImg.src;

    if (!App.data.qrCodes) App.data.qrCodes = [];
    App.data.qrCodes.push({
      id: App.nextId(App.data.qrCodes),
      type, value: value.trim(), espece: espece.trim(), calibre: calibre.trim(), uniqueKey,
      imageData, createdAt: new Date().toISOString()
    });
    
    App.saveData();
    this._lastQR = { type, value, espece, calibre, uniqueKey };
    this._lastImageData = imageData;
    App.toast('QR Code enregistré définitivement', 'success');
  },

  printQR() {
    const d = this._lastQR || {};
    const imgSrc = this._lastImageData || '';
    const w = window.open('','_blank');
    w.document.write(`<html><body style="text-align:center;font-family:sans-serif;padding:40px;">
      <div style="border:2px solid #000;padding:20px;display:inline-block;border-radius:10px;">
        <h2 style="margin:0;">SEA PECHE ERP</h2>
        <p>${d.type.toUpperCase()}: ${d.value} ${d.espece?'| '+d.espece:''} ${d.calibre?'| '+d.calibre:''}</p>
        <img src="${imgSrc}" width="200">
        <p style="font-size:0.8rem;color:#666;">ID: ${d.uniqueKey}</p>
      </div>
      <script>setTimeout(()=>window.print(),500)<\/script>
    </body></html>`);
  },

  downloadQR() {
    const a = document.createElement('a');
    a.download = `QR_${this._lastQR.value}.png`;
    a.href = this._lastImageData;
    a.click();
  },

  buildListTab() {
    const qrList = App.data.qrCodes || [];
    if (qrList.length === 0) return `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-text">Votre bibliothèque de codes QR est vide.</div>
      </div>`;

    return `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:24px;">
        ${qrList.map(q => `
          <div class="card glass-card h-100" style="overflow:hidden; transition:transform 0.3s ease;">
            <div style="background:rgba(37,99,255,0.05); padding:12px 20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <span class="badge ${q.type==='client'?'badge-active':'badge-pending'}" style="font-size:0.7rem; letter-spacing:1px;">${q.type.toUpperCase()}</span>
              <button class="btn-icon danger" onclick="QRCodes.deleteQR(${q.id})" style="width:32px; height:32px; border-radius:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div style="padding:24px; text-align:center;">
              <div style="background:white; padding:12px; display:inline-block; border-radius:16px; box-shadow:var(--shadow-sm); margin-bottom:20px;">
                <img src="${q.imageData}" width="140" style="display:block;">
              </div>
              <div style="font-weight:800; font-size:1rem; color:var(--text-primary); margin-bottom:4px;">${q.value}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">${q.espece || ''} ${q.calibre ? '· '+q.calibre : ''}</div>
            </div>
            <div style="padding:16px 20px; background:rgba(0,0,0,0.02); border-top:1px solid var(--border-color); display:flex; gap:10px;">
              <button class="btn btn-sm btn-primary" style="flex:1;" onclick="QRCodes.useInSaisie(${q.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Utiliser
              </button>
              <button class="btn btn-sm btn-outline" style="width:40px; justify-content:center; padding:0;" onclick="QRCodes.printQRStored(${q.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>`;
  },

  printQRStored(id) {
    const q = (App.data.qrCodes||[]).find(x => x.id === id);
    if (!q) return;
    this._lastQR = q;
    this._lastImageData = q.imageData;
    this.printQR();
  },

  deleteQR(id) {
    if (!confirm('Supprimer ce QR Code ?')) return;
    App.data.qrCodes = (App.data.qrCodes||[]).filter(q => q.id !== id);
    App.saveData();
    this.render();
  },

  useInSaisie(id) {
    const qr = (App.data.qrCodes||[]).find(q => q.id === id);
    if (!qr) return;
    App.navigate('saisie');
    setTimeout(() => {
      if (qr.type === 'client') {
        const s = document.getElementById('tClient');
        if (s) s.value = qr.value;
      } else if (qr.type === 'espece') {
        const s = document.getElementById('tEspece');
        if (s) { s.value = qr.value; Saisie.onEspeceChange('tEspece', 'tCalibre'); }
      }
      App.toast('Données appliquées au formulaire', 'success');
    }, 150);
  }
};
