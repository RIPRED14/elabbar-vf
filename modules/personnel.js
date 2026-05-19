/* ============================================
   PERSONNEL — Gestion du personnel & Pointage
   ============================================ */
const Personnel = {
  currentTab: 'resume',
  viewType: 'month',
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  selectedDay: new Date().toISOString().split('T')[0],
  selectedPeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
  selectedDayISO: new Date().toISOString().substring(0, 10), // YYYY-MM-DD
  currentDailyActivite: 'Traitement',
  currentFicheId: null,
  pendingScanData: null,

  applyAIData(data) {
    if (!data) return;
    
    // On bascule sur l'onglet journalier
    this.currentTab = 'daily';
    const fallbackDate = this.selectedDay || new Date().toISOString().split('T')[0];
    const finalDate = data.date ? App.formatDateISO(data.date) : fallbackDate;
    
    this.selectedDay = finalDate;
    const parts = this.selectedDay.split('-');
    this.selectedYear = parseInt(parts[0]);
    this.selectedMonth = parseInt(parts[1]) - 1;
    this.viewType = 'day';
    this.updatePeriodISO();
    
    const activite = data.activite || 'Traitement';
    const dateAffichage = data.date || new Date().toLocaleDateString('fr-FR');
    const titre = `Fiche ${activite} — ${dateAffichage}`;
    
    // Créer la fiche
    this.addNewFiche(activite, titre);
    
    const employesIA = data.lignes || data.employes || [];
    if (employesIA.length > 0) {
      const fiche = this.getFiche(this.currentFicheId);
      if (!fiche) return;

      // 1. Initialiser TOUS les ouvriers actifs à 0 (évite les cases vides)
      const ouvriers = App.data.personnel.filter(p => (p.type === 'ouvrier_fixe' || p.type === 'occasionnel') && p.actif);
      fiche.presences = ouvriers.map(emp => ({ personnelId: emp.id, heures: 0, matinHeures: 0, soirHeures: 0 }));

      // 2. Matching intelligent des heures extraites
      let matchCount = 0;
      employesIA.forEach(aiEmp => {
        const nameToMatch = (aiEmp.nom || aiEmp.nomPrenom || "").toUpperCase().trim();
        if (!nameToMatch) return;

        const pres = fiche.presences.find(p => {
          const emp = App.data.personnel.find(e => e.id === p.personnelId);
          return emp && emp.nom.toUpperCase().includes(nameToMatch);
        });

        if (pres) {
          const hours = parseFloat(aiEmp.heures) || 0;
          pres.matinHeures = hours;
          pres.heures = hours;
          matchCount++;
        }
      });

      this.recalcPointageMensuel(this.selectedPeriod);
      this.render();
      
      if (matchCount > 0) {
        App.toast(`${matchCount} employés pointés automatiquement via le scan.`, "success");
      } else {
        App.toast("Le scan a été importé, mais aucun nom n'a pu être matché avec la base de données.", "warning");
      }
    }
  },
  
  // Onglets disponibles
  tabs: [
    { id: 'resume', icon: '📊', label: 'Résumé Mensuel' },
    { id: 'pointage', icon: '⏱️', label: 'Pointage Mensuel' },
    { id: 'daily', icon: '📅', label: 'Pointage Journalier' },
    { id: 'ouvriers', icon: '👷', label: 'Ouvriers Fixes' },
    { id: 'admin', icon: '🏢', label: 'Charges Fixes (Admin)' },
    { id: 'occasionnels', icon: '👥', label: 'Occasionnels' }
  ],

  // Calcul du mois courant
  getPointageData(monthStr) {
    if (!App.data.pointage) App.data.pointage = {};
    if (!App.data.pointage[monthStr]) {
      App.data.pointage[monthStr] = {
        mois: monthStr,
        tauxHoraireOcc: App.data.parametres.salaireHoraireOcc || 16.95,
        jours: {},
        totalHeuresOcc: 0,
        totalMontantOcc: 0,
        totalSalairesFixeAdmin: 0,
        totalSalairesFixeAutre: 0,
        totalSalairesOuvriersFixe: 0,
        totalHeuresOuvriersFixe: 0
      };
    }
    return App.data.pointage[monthStr];
  },

  recalcPointageMensuel(monthStr) {
    const ptg = this.getPointageData(monthStr);
    let hOcc = 0, hFixe = 0, hAdmin = 0;
    
    // Recalculer les heures par jour
    Object.values(ptg.jours).forEach(jour => {
      const presences = this.getDayPresences(jour);
      presences.forEach(p => {
        const emp = App.data.personnel.find(e => e.id === p.personnelId);
        if (emp) {
          if (emp.type === 'occasionnel') hOcc += p.heures;
          else if (emp.type === 'ouvrier_fixe') hFixe += p.heures;
          else if (emp.type === 'fixe_admin' || emp.type === 'fixe_autre') hAdmin += p.heures;
        }
      });
    });

    ptg.totalHeuresOcc = hOcc;
    ptg.totalHeuresOuvriersFixe = hFixe;
    ptg.totalHeuresAdmin = hAdmin;
    ptg.totalMontantOcc = hOcc * ptg.tauxHoraireOcc;
    
    // Helper inline pour obtenir le ratio d'activité du mois (0 à 1)
    const getRatio = (p) => this.getPersonnelActiveRatio(p, monthStr);

    // Salaires fixes — SALAIRE FIXE MENSUEL, calculé au prorata des jours de présence dans le mois
    // Les ouvriers fixes travaillent 191h/mois, salaire proportionnel au mois
    ptg.totalSalairesFixeAdmin = App.data.personnel.filter(p => p.type === 'fixe_admin').reduce((s, p) => s + (p.salaire || 0) * getRatio(p), 0);
    ptg.totalSalairesFixeAutre = App.data.personnel.filter(p => p.type === 'fixe_autre').reduce((s, p) => s + (p.salaire || 0) * getRatio(p), 0);
    ptg.totalSalairesOuvriersFixe = App.data.personnel.filter(p => p.type === 'ouvrier_fixe').reduce((s, p) => s + (p.salaire || 0) * getRatio(p), 0);
    
    // Heures contractuelles fixes = 191h/mois par ouvrier fixe (au prorata aussi)
    ptg.heuresContractuellesFixe = App.data.personnel.filter(p => p.type === 'ouvrier_fixe').reduce((s, p) => s + 191 * getRatio(p), 0);
    
    // Cloud Sync: Flat pointage table
    this.syncFlatPointage(monthStr);
    
    App.saveData();
  },

  getPersonnelActiveRatio(p, monthStr) {
    if (!monthStr || monthStr.length < 7) return 0;
    
    const parts = monthStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let startDay = 1;
    let endDay = daysInMonth;

    if (p.dateEmbauche && p.dateEmbauche.startsWith(monthStr)) {
      startDay = parseInt(p.dateEmbauche.split('-')[2]);
    } else if (p.dateEmbauche && p.dateEmbauche.substring(0, 7) > monthStr) {
      return 0; // Hired after this month
    }

    if (p.dateDepart && p.dateDepart.startsWith(monthStr)) {
      endDay = parseInt(p.dateDepart.split('-')[2]);
    } else if (p.dateDepart && p.dateDepart.substring(0, 7) < monthStr) {
      return 0; // Left before this month
    } else if (!p.actif && !p.dateDepart) {
      // Legacy behavior: if no departure date is set but they are inactive, assume inactive always
      return 0;
    }
    
    return Math.max(0, (endDay - startDay + 1) / daysInMonth);
  },

  async syncFlatPointage(monthStr) {
    if (!App.supabase) return;
    const ptg = this.getPointageData(monthStr);
    const flatEntries = [];
    
    Object.keys(ptg.jours).forEach(date => {
      const presences = this.getDayPresences(ptg.jours[date]);
      // Group by employee to sum hours if multiple fiches
      const empHours = {};
      presences.forEach(p => {
        empHours[p.personnelId] = (empHours[p.personnelId] || 0) + (p.heures || 0);
      });
      
      Object.keys(empHours).forEach(empId => {
        flatEntries.push({
          date: date,
          employee_id: parseInt(empId),
          hours: empHours[empId]
        });
      });
    });

    if (flatEntries.length > 0) {
      try {
        const { error } = await App.supabase.from('pointage').upsert(flatEntries, { onConflict: 'date, employee_id' });
        if (error) console.error("Sync Flat Pointage Error:", error);
      } catch (e) {
        console.error("Sync Flat Pointage Exception:", e);
      }
    }
  },

  render() {
    // Nettoyage automatique des erreurs d'import OCR ou Excel (En-têtes scannés par erreur)
    if (App.data && App.data.personnel) {
      const initialLength = App.data.personnel.length;
      App.data.personnel = App.data.personnel.filter(p => {
        const n = (p.nom || '').toUpperCase();
        return n !== 'NOM ET PRENOM' && n !== 'NOMS ET PRENOMS' && n !== 'TOTAL' && n !== 'POINTAGE';
      });
      if (App.data.personnel.length < initialLength) {
        App.saveData(); // Sauvegarder la suppression
      }
    }

    this.updatePeriodISO();
    this.recalcPointageMensuel(this.selectedPeriod);
    const content = document.getElementById('pageContent');
    content.innerHTML = `
      <div class="fade-in">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; gap:20px; flex-wrap:wrap;">
          <div>
            <h2 class="page-title">Personnel & Pointage</h2>
            <p class="page-subtitle">Gestion des effectifs, pointage journalier et calcul des coûts de main d'œuvre</p>
          </div>
          
          <div style="display:flex; gap:12px; align-items:flex-end;">
            <div style="display:flex; background:var(--bg-card); padding:4px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:2px;">
              <button onclick="Personnel.onViewTypeChange('day')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'day' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'day' ? 'white' : 'var(--text-muted)'};">Jour</button>
              <button onclick="Personnel.onViewTypeChange('month')" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:600; transition:all 0.2s; background:${this.viewType === 'month' ? 'var(--accent-blue)' : 'transparent'}; color:${this.viewType === 'month' ? 'white' : 'var(--text-muted)'};">Mois</button>
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.72rem; margin-bottom:4px; opacity:0.8; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${this.viewType === 'day' ? 'Date' : 'Période'}</label>
              ${this.viewType === 'day' 
                ? `<input type="date" class="form-input" value="${this.selectedDay}" onchange="Personnel.onDayChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">`
                : `<input type="month" class="form-input" value="${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}" onchange="Personnel.onPeriodChange(event)" style="padding:8px 12px; font-size:0.85rem; width:160px; height:38px; background:var(--bg-card); border-color:var(--accent-blue); font-weight:600;">`
              }
            </div>

            <div style="width:1px; height:24px; background:var(--border-color); margin:0 8px;"></div>

            <label class="btn btn-success btn-sm" style="cursor:pointer; padding: 8px 12px;" title="Importer le fichier Excel H POINTAGE">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
              <span>Import</span>
              <input type="file" accept=".xlsx,.xls" style="display:none" onchange="Personnel.importExcel(event)">
            </label>
            <button class="btn btn-primary btn-sm" onclick="Personnel.showAddModal()">+ Employé</button>
          </div>
        </div>

        <div class="tabs" style="margin-bottom:24px;">
          ${this.tabs.filter(t => {
            if (this.viewType === 'day' && (t.id === 'resume' || t.id === 'pointage')) return false;
            if (this.viewType === 'month' && t.id === 'daily') return false;
            return true;
          }).map(t => `
            <div class="tab ${this.currentTab === t.id ? 'active' : ''}" onclick="Personnel.switchTab('${t.id}')">
              ${t.icon} ${t.label}
            </div>
          `).join('')}
        </div>

        <div id="personnelTabContent">
          ${this.renderCurrentTab()}
        </div>
      </div>
    `;
  },

  onViewTypeChange(type) {
    this.viewType = type;
    if (type === 'day') {
      this.currentTab = 'daily';
    } else {
      this.currentTab = 'resume';
    }
    this.updatePeriodISO();
    this.render();
  },

  onDayChange(e) {
    this.selectedDay = e.target.value;
    const parts = this.selectedDay.split('-');
    this.selectedYear = parseInt(parts[0]);
    this.selectedMonth = parseInt(parts[1]) - 1;
    this.updatePeriodISO();
    this.render();
  },

  onPeriodChange(e) {
    const val = e.target.value;
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    this.selectedYear = y;
    this.selectedMonth = m - 1;
    this.updatePeriodISO();
    this.render();
  },

  toggleView(mode) {
    this.onViewTypeChange(mode);
  },

  updatePeriod(type, val) {
    if (type === 'year') this.selectedYear = parseInt(val);
    if (type === 'month') this.selectedMonth = parseInt(val) - 1;
    if (type === 'day') {
       // Support for old day selector if needed, but we'll replace the UI
       const d = String(val).padStart(2, '0');
       this.selectedDay = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}-${d}`;
    }
    this.updatePeriodISO();
    this.render();
  },

  navigatePeriod(dir) {
    if (this.viewType === 'day') {
      const d = new Date(this.selectedDay);
      d.setDate(d.getDate() + dir);
      this.selectedDay = d.toISOString().split('T')[0];
      this.selectedYear = d.getFullYear();
      this.selectedMonth = d.getMonth();
    } else {
      let m = this.selectedMonth + dir;
      const d = new Date(this.selectedYear, m, 1);
      this.selectedYear = d.getFullYear();
      this.selectedMonth = d.getMonth();
    }
    this.updatePeriodISO();
    this.render();
  },

  updatePeriodISO() {
    this.selectedPeriod = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}`;
    this.selectedDayISO = this.selectedDay;
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    this.render();
  },

  changeMonth(monthStr) {
    if (!monthStr) return;
    this.selectedPeriod = monthStr;
    const [y, m] = monthStr.split('-');
    this.selectedYear = parseInt(y);
    this.selectedMonth = parseInt(m) - 1;
    this.render();
  },

  renderCurrentTab() {
    switch(this.currentTab) {
      case 'resume': return this.renderResume();
      case 'pointage': return this.renderPointage();
      case 'daily': return this.renderDaily();
      case 'admin': return this.renderListe('fixe_admin', '🏢 Charges Fixes Administratives', 'Salaire fixe mensuel — pointage de suivi');
      case 'ouvriers': return this.renderListe('ouvrier_fixe', '👷 Ouvriers Fixes (Production)', 'Salaire fixe mensuel — base 191h/mois, pas d\'heures sup');
      case 'occasionnels': return this.renderListe('occasionnel', '👥 Ouvriers Occasionnels', 'Payés au taux horaire × heures travaillées');
      default: return '';
    }
  },

  renderResume() {
    const isDay = this.viewType === 'day';
    const ptg = this.getPointageData(this.selectedPeriod);
    const HEURES_BASE_FIXE = 191;
    
    let nbAdmin, nbAutre, nbFixe, nbOcc, totalFixe, totalMOProd, totalHeures;

    if (isDay) {
      const dayData = ptg.jours[this.selectedDayISO] || { fiches: [] };
      const presences = this.getDayPresences(dayData);
      
      nbAdmin = App.data.personnel.filter(p => p.type === 'fixe_admin' && p.actif).length;
      nbAutre = App.data.personnel.filter(p => p.type === 'fixe_autre' && p.actif).length;
      nbFixe = new Set(presences.filter(p => {
        const e = App.data.personnel.find(emp => emp.id === p.personnelId);
        return e && e.type === 'ouvrier_fixe';
      }).map(p => p.personnelId)).size;
      nbOcc = new Set(presences.filter(p => {
        const e = App.data.personnel.find(emp => emp.id === p.personnelId);
        return e && e.type === 'occasionnel';
      }).map(p => p.personnelId)).size;

      const hOcc = presences.reduce((s, p) => {
        const e = App.data.personnel.find(emp => emp.id === p.personnelId);
        return (e && e.type === 'occasionnel') ? s + p.heures : s;
      }, 0);
      const hFixe = presences.reduce((s, p) => {
        const e = App.data.personnel.find(emp => emp.id === p.personnelId);
        return (e && e.type === 'ouvrier_fixe') ? s + p.heures : s;
      }, 0);

      // Estimation journalière : salaires fixes / 26 jours ouvrés
      totalFixe = (ptg.totalSalairesFixeAdmin + ptg.totalSalairesFixeAutre) / 26;
      // Coût M.O. prod jour : salaires ouvriers fixes / 26 + occasionnels réels
      totalMOProd = (ptg.totalSalairesOuvriersFixe / 26) + (hOcc * ptg.tauxHoraireOcc);
      totalHeures = hOcc + hFixe;
    } else {
      nbAdmin = App.data.personnel.filter(p => p.type === 'fixe_admin' && p.actif).length;
      nbAutre = App.data.personnel.filter(p => p.type === 'fixe_autre' && p.actif).length;
      nbFixe = App.data.personnel.filter(p => p.type === 'ouvrier_fixe' && p.actif).length;
      
      const occIds = new Set();
      Object.values(ptg.jours).forEach(jour => {
        const presences = this.getDayPresences(jour);
        presences.forEach(p => {
          const emp = App.data.personnel.find(e => e.id === p.personnelId);
          if (emp && emp.type === 'occasionnel') occIds.add(p.personnelId);
        });
      });
      nbOcc = occIds.size;

      totalFixe = ptg.totalSalairesFixeAdmin + ptg.totalSalairesFixeAutre;
      // Coût M.O. Prod = Salaires Ouvriers Fixes (FIXE!) + Montant Occasionnels (heures × taux)
      totalMOProd = ptg.totalSalairesOuvriersFixe + ptg.totalMontantOcc;
      totalHeures = ptg.totalHeuresOcc + ptg.totalHeuresOuvriersFixe;
    }
    
    const labelSuffix = isDay ? "Jour" : "Mois";
    // Taux horaire réel des fixes = salaire / 191h (constant, base contractuelle)
    const tauxHoraireReelFixe = nbFixe > 0 ? (ptg.totalSalairesOuvriersFixe / (nbFixe * HEURES_BASE_FIXE)) : 0;

    return `
      <div class="kpi-grid" style="margin-bottom:24px;">
        <div class="kpi-card purple">
          <div class="kpi-icon purple">👥</div>
          <div class="kpi-label">Effectif Total ${labelSuffix}</div>
          <div class="kpi-value">${nbAdmin + nbAutre + nbFixe + nbOcc}</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-icon blue">💰</div>
          <div class="kpi-label">Masse Salariale ${labelSuffix}</div>
          <div class="kpi-value">${App.formatNumber(totalFixe + totalMOProd, 0)}<span class="kpi-unit">DH</span></div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon green">🏭</div>
          <div class="kpi-label">Coût M.O. Production</div>
          <div class="kpi-value">${App.formatNumber(totalMOProd, 0)}<span class="kpi-unit">DH</span></div>
        </div>
        <div class="kpi-card yellow">
          <div class="kpi-icon yellow">⏱️</div>
          <div class="kpi-label">Heures Prod Totales</div>
          <div class="kpi-value">${App.formatNumber(totalHeures, 1)}<span class="kpi-unit">h</span></div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 1fr; gap:24px;">
        <!-- Détail Fixes -->
        <div class="card">
          <div class="card-header"><span class="card-title">🏢 Charges Fixes (Admin & Autres)</span></div>
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
              <span style="color:var(--text-secondary)">Administration (${nbAdmin} pers.)</span>
              <span style="font-weight:bold">${App.formatNumber(ptg.totalSalairesFixeAdmin, 0)} DH</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
              <span style="color:var(--text-secondary)">Autres (Sécurité/Cariste) (${nbAutre} pers.)</span>
              <span style="font-weight:bold">${App.formatNumber(ptg.totalSalairesFixeAutre, 0)} DH</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(99,102,241,0.05); border-radius:4px; margin-top:8px;">
              <span style="font-weight:bold; color:var(--primary-color)">Total Charges Fixes</span>
              <span style="font-weight:bold; color:var(--primary-color)">${App.formatNumber(totalFixe, 0)} DH</span>
            </div>
          </div>
        </div>

        <!-- Détail Production -->
        <div class="card">
          <div class="card-header"><span class="card-title">👷 Main d'Œuvre Production</span></div>
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
              <div>
                <div style="color:var(--text-secondary)">Ouvriers Fixes (${nbFixe} pers.)</div>
                <div style="font-size:0.8rem; color:var(--text-muted)">Base ${HEURES_BASE_FIXE}h/mois • Taux: ${tauxHoraireReelFixe.toFixed(2)} DH/h • Pointé: ${ptg.totalHeuresOuvriersFixe}h</div>
              </div>
              <span style="font-weight:bold">${App.formatNumber(ptg.totalSalairesOuvriersFixe, 0)} DH</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
              <div>
                <div style="color:var(--text-secondary)">Occasionnels (${nbOcc} pers.)</div>
                <div style="font-size:0.8rem; color:var(--text-muted)">${ptg.totalHeuresOcc}h à ${ptg.tauxHoraireOcc} DH/h</div>
              </div>
              <span style="font-weight:bold">${App.formatNumber(ptg.totalMontantOcc, 0)} DH</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(16,185,129,0.05); border-radius:4px; margin-top:8px;">
              <span style="font-weight:bold; color:var(--status-success)">Total M.O. Prod</span>
              <span style="font-weight:bold; color:var(--status-success)">${App.formatNumber(totalMOProd, 0)} DH</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderDaily() {
    const dateStr = this.selectedDayISO;
    const monthStr = this.selectedPeriod;
    const ptg = this.getPointageData(monthStr);
    const dayData = ptg.jours[dateStr] || { date: dateStr, fiches: [] };
    
    // Migration si nécessaire des anciennes données vers une fiche
    if (!dayData.fiches && dayData.presences && dayData.presences.length > 0) {
      dayData.fiches = [{ id: 1, titre: "Fiche Importée", activite: "Traitement", presences: dayData.presences }];
      delete dayData.presences;
    }
    if (!dayData.fiches) dayData.fiches = [];

    // Calcul du résumé du jour
    let totalTraitement = 0, totalEmballage = 0, totalRecon = 0;
    dayData.fiches.forEach(f => {
      const h = f.presences.reduce((s,p) => s + (p.heures || 0), 0);
      if (f.activite === 'Traitement') totalTraitement += h;
      else if (f.activite === 'Emballage') totalEmballage += h;
      else if (f.activite === 'Reconditionnement') totalRecon += h;
    });

    return `
      <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
        <div class="kpi-card blue" style="padding: 12px;">
          <div style="font-size:0.75rem; opacity:0.8;">🐟 Traitement Total</div>
          <div style="font-size:1.2rem; font-weight:800;">${totalTraitement} <span style="font-size:0.8rem">h</span></div>
        </div>
        <div class="kpi-card purple" style="padding: 12px;">
          <div style="font-size:0.75rem; opacity:0.8;">📦 Emballage Total</div>
          <div style="font-size:1.2rem; font-weight:800;">${totalEmballage} <span style="font-size:0.8rem">h</span></div>
        </div>
        <div class="kpi-card green" style="padding: 12px;">
          <div style="font-size:0.75rem; opacity:0.8;">♻️ Reconditionnement</div>
          <div style="font-size:1.2rem; font-weight:800;">${totalRecon} <span style="font-size:0.8rem">h</span></div>
        </div>
      </div>

      <div class="card fade-in" style="margin-bottom:24px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-app);">
          <div style="display:flex; gap:12px; align-items:center;">
             <h3 style="margin:0;">📅 Journée du ${App.formatDateFR(this.selectedDayISO)}</h3>
             <div style="display:flex; gap:4px;">
               <button class="btn btn-sm btn-outline" onclick="Personnel.navigatePeriod(-1)">◀</button>
               <input type="date" class="form-input" style="width:140px; height:32px; font-size:0.85rem;" value="${this.selectedDayISO}" onchange="Personnel.onDayChange(event)">
               <button class="btn btn-sm btn-outline" onclick="Personnel.navigatePeriod(1)">▶</button>
             </div>
          </div>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-primary" onclick="Personnel.showScanDailyModal()" style="background:var(--accent-blue);">
              📸 Scanner une feuille
            </button>
            <button class="btn btn-success" onclick="Personnel.addNewFiche()" style="background:var(--status-success);">
              + Nouvelle feuille manuelle
            </button>
          </div>
        </div>
        <div class="card-body">
           <h4 style="margin-top:0; margin-bottom:12px; color:var(--text-muted); font-size:0.9rem;">FEUILLES ENREGISTRÉES (${dayData.fiches.length})</h4>
           ${dayData.fiches.length === 0 ? `
             <div style="text-align:center; padding:40px; background:#f8fafc; border-radius:12px; border:2px dashed #e2e8f0;">
               <div style="font-size:2rem; margin-bottom:10px;">📄</div>
               <div style="font-weight:600; color:var(--text-secondary);">Aucune feuille pour ce jour</div>
               <div style="font-size:0.85rem; color:var(--text-muted);">Scannez une feuille de présence ou créez-en une manuellement.</div>
             </div>
           ` : `
             <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
               ${dayData.fiches.map(f => `
                 <div class="fiche-card ${this.currentFicheId === f.id ? 'active' : ''}" onclick="Personnel.selectFiche(${f.id})" style="cursor:pointer; border:1px solid var(--border-color); border-radius:12px; padding:16px; background:var(--bg-card); transition:all 0.2s; position:relative;">
                   <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                     <span class="badge ${f.activite==='Traitement'?'badge-info':f.activite==='Emballage'?'badge-purple':'badge-success'}">${f.activite}</span>
                     <button class="btn-icon danger" onclick="event.stopPropagation(); Personnel.deleteFiche(${f.id})" style="padding:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                   </div>
                   <div style="font-weight:700; color:var(--text-primary);">${f.titre || 'Feuille sans titre'}</div>
                   <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                     ${f.presences.length} ouvriers • <b>${f.presences.reduce((s,p)=>s+p.heures,0)}h total</b>
                   </div>
                   ${this.currentFicheId === f.id ? '<div style="position:absolute; bottom:-1px; left:20%; right:20%; height:3px; background:var(--accent-blue); border-radius:3px 3px 0 0;"></div>' : ''}
                 </div>
               `).join('')}
             </div>
           `}
        </div>
      </div>

      ${this.currentFicheId ? this.renderFicheEditor() : ''}
      
      <style>
        .fiche-card:hover { border-color: var(--accent-blue); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .fiche-card.active { border-color: var(--accent-blue); background: rgba(37,99,235,0.02); }
      </style>
    `;
  },

  renderFicheEditor() {
    const dateStr = this.selectedDayISO;
    const ptg = this.getPointageData(this.selectedPeriod);
    const fiche = ptg.jours[dateStr].fiches.find(f => f.id === this.currentFicheId);
    if (!fiche) return '';

    const categoryIcons = {
      'ouvrier_fixe': '👷 [Fixe]',
      'fixe_admin': '💼 [Admin]',
      'fixe_autre': '🚨 [Support]',
      'occasionnel': '⏱️ [Occas]'
    };
    const categoryOrder = {
      'ouvrier_fixe': 1,
      'fixe_admin': 2,
      'fixe_autre': 3,
      'occasionnel': 4
    };

    const ouvriers = App.data.personnel
      .filter(p => (p.type === 'ouvrier_fixe' || p.type === 'occasionnel' || p.type === 'fixe_admin' || p.type === 'fixe_autre') && p.actif)
      .sort((a, b) => {
        const orderA = categoryOrder[a.type] || 99;
        const orderB = categoryOrder[b.type] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.nom.localeCompare(b.nom);
      });

    return `
      <div class="card slide-up" style="border: 2px solid var(--accent-blue);">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
          <div style="display:flex; gap:16px; align-items:center;">
            <select class="form-select" style="width:180px;" onchange="Personnel.updateFicheActivite(${fiche.id}, this.value)">
              <option value="Traitement" ${fiche.activite === 'Traitement' ? 'selected' : ''}>🐟 Traitement</option>
              <option value="Emballage" ${fiche.activite === 'Emballage' ? 'selected' : ''}>📦 Emballage</option>
              <option value="Reconditionnement" ${fiche.activite === 'Reconditionnement' ? 'selected' : ''}>♻️ Reconditionnement</option>
            </select>
            <input type="text" class="form-input" style="width:250px; font-weight:700;" value="${fiche.titre}" placeholder="Nom de l'équipe / feuille" onchange="Personnel.updateFicheTitre(${fiche.id}, this.value)">
          </div>
          <button class="btn btn-outline" onclick="Personnel.selectFiche(null)">Fermer l'édition</button>
        </div>
        <div class="card-body" style="padding:0; overflow-x:auto;">
          <table class="table pointage-detail-table" style="min-width:1000px;">
            <thead>
              <tr style="background:var(--bg-app);">
                <th rowspan="2" style="vertical-align:middle; width:250px;">Employé</th>
                <th colspan="3" style="text-align:center; background:rgba(37,99,235,0.05);">MATIN</th>
                <th colspan="3" style="text-align:center; background:rgba(139,92,246,0.05);">SOIR</th>
                <th rowspan="2" style="vertical-align:middle; text-align:center; width:100px;">Total</th>
              </tr>
              <tr style="background:var(--bg-app); font-size:0.75rem;">
                <th style="text-align:center;">Entrée</th>
                <th style="text-align:center;">Sortie</th>
                <th style="text-align:center; background:rgba(37,99,235,0.1);">Heures</th>
                <th style="text-align:center;">Entrée</th>
                <th style="text-align:center;">Sortie</th>
                <th style="text-align:center; background:rgba(139,92,246,0.1);">Heures</th>
              </tr>
            </thead>
            <tbody>
              ${ouvriers.map(emp => {
                const pres = fiche.presences.find(p => p.personnelId === emp.id) || {};
                const icon = categoryIcons[emp.type] || '';
                return `
                  <tr>
                    <td style="font-weight:600;">
                      <span style="font-size: 0.85em; opacity: 0.7; margin-right: 6px;">${icon}</span>
                      ${emp.nom} ${emp.prenom||''}
                    </td>
                    <td><input type="text" class="ptg-mini-input" value="${pres.matinEntree || ''}" onchange="Personnel.updateFicheField(${emp.id}, 'matinEntree', this.value)"></td>
                    <td><input type="text" class="ptg-mini-input" value="${pres.matinSortie || ''}" onchange="Personnel.updateFicheField(${emp.id}, 'matinSortie', this.value)"></td>
                    <td style="background:rgba(37,99,235,0.05);"><input type="number" step="0.5" class="ptg-mini-input" value="${pres.matinHeures ?? 0}" onchange="Personnel.updateFicheField(${emp.id}, 'matinHeures', this.value)"></td>
                    <td><input type="text" class="ptg-mini-input" value="${pres.soirEntree || ''}" onchange="Personnel.updateFicheField(${emp.id}, 'soirEntree', this.value)"></td>
                    <td><input type="text" class="ptg-mini-input" value="${pres.soirSortie || ''}" onchange="Personnel.updateFicheField(${emp.id}, 'soirSortie', this.value)"></td>
                    <td style="background:rgba(139,92,246,0.05);"><input type="number" step="0.5" class="ptg-mini-input" value="${pres.soirHeures ?? 0}" onchange="Personnel.updateFicheField(${emp.id}, 'soirHeures', this.value)"></td>
                    <td style="text-align:center; font-weight:800;">${pres.heures ?? 0}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  addNewFiche(activite = 'Traitement', titre = 'Nouvelle Feuille') {
    const dateStr = this.selectedDayISO;
    const monthStr = this.selectedPeriod;
    const ptg = this.getPointageData(monthStr);
    if (!ptg.jours[dateStr]) ptg.jours[dateStr] = { date: dateStr, fiches: [] };
    const day = ptg.jours[dateStr];
    if (!day.fiches) day.fiches = [];

    const newId = App.nextId(App.data.fiches_pointage || []);
    const newFiche = { id: newId, date: dateStr, activite, titre, presences: [] };
    
    // Add to nested for UI
    day.fiches.push(newFiche);
    // Add to flat for Sync
    if (!App.data.fiches_pointage) App.data.fiches_pointage = [];
    App.data.fiches_pointage.push(newFiche);
    
    this.currentFicheId = newId;
    this.render();
    App.saveData('fiches_pointage', newFiche);
    App.toast("Nouvelle feuille créée", "success");
  },

  selectFiche(id) {
    this.currentFicheId = id;
    this.render();
  },

  async deleteFiche(id) {
    if (!confirm("Supprimer cette feuille de présence ?")) return;
    const dateStr = this.selectedDayISO;
    const ptg = this.getPointageData(this.selectedPeriod);
    const day = ptg.jours[dateStr];
    
    day.fiches = day.fiches.filter(f => f.id !== id);
    if (App.data.fiches_pointage) {
      App.data.fiches_pointage = App.data.fiches_pointage.filter(f => f.id !== id);
    }
    
    if (this.currentFicheId === id) this.currentFicheId = null;
    
    // Cloud sync deletion
    await App.deleteFromCloud('fiches_pointage', id);
    
    this.recalcPointageMensuel(dateStr.substring(0, 7));
    this.render();
    App.toast("Feuille supprimée", "info");
  },

  updateFicheActivite(id, val) {
    const fiche = this.getFiche(id);
    if (fiche) {
      fiche.activite = val;
      this.recalcPointageMensuel(this.selectedPeriod);
      this.render();
    }
  },

  updateFicheTitre(id, val) {
    const fiche = this.getFiche(id);
    if (fiche) {
      fiche.titre = val;
      App.saveData('fiches_pointage', fiche);
      this.render();
    }
  },

  getFiche(id) {
    const dateStr = this.selectedDayISO;
    const ptg = this.getPointageData(this.selectedPeriod);
    return ptg.jours[dateStr]?.fiches?.find(f => f.id === id);
  },

  updateFicheField(empId, field, val) {
    const fiche = this.getFiche(this.currentFicheId);
    if (!fiche) return;

    let pres = fiche.presences.find(p => p.personnelId === empId);
    if (!pres) {
      pres = { personnelId: empId, heures: 0 };
      fiche.presences.push(pres);
    }

    if (field.includes('Heures')) pres[field] = parseFloat(val) || 0;
    else pres[field] = val;

    pres.heures = (pres.matinHeures || 0) + (pres.soirHeures || 0);
    this.recalcPointageMensuel(this.selectedPeriod);
    App.saveData('fiches_pointage', fiche);
    this.render();
  },

  getDayPresences(dayData) {
    if (!dayData) return [];
    if (dayData.fiches && dayData.fiches.length > 0) {
      let all = [];
      dayData.fiches.forEach(f => all = all.concat(f.presences || []));
      return all;
    }
    return dayData.presences || [];
  },

  processDailyScan(results) {
    const dateStr = this.selectedDayISO;
    const monthStr = this.selectedPeriod;
    const ptg = this.getPointageData(monthStr);
    if (!ptg.jours[dateStr]) ptg.jours[dateStr] = { date: dateStr, fiches: [] };
    const day = ptg.jours[dateStr];
    
    // Pour chaque scan, on crée une nouvelle fiche
    results.forEach((scanData, index) => {
      const newId = day.fiches.length > 0 ? Math.max(...day.fiches.map(f => f.id)) + 1 : 1;
      day.fiches.push({
        id: newId,
        titre: `Scan ${new Date().toLocaleTimeString()}`,
        activite: 'Traitement',
        presences: scanData
      });
    });

    this.recalcPointageMensuel(monthStr);
    this.render();
    App.toast("Scan traité et ajouté.", "success");
  },

  renderListe(type, title, subtitle) {
    let list = App.data.personnel.filter(p => p.type === type || (type === 'fixe_admin' && p.type === 'fixe_autre'));
    const ptg = this.getPointageData(this.selectedPeriod);
    const HEURES_BASE_FIXE = 191;
    const isFixe = type === 'ouvrier_fixe';
    const isOcc = type === 'occasionnel';
    const isAdmin = type === 'fixe_admin';
    
    // Calculate hours per employee this month
    const empHoursMap = {};
    Object.values(ptg.jours).forEach(jour => {
      const presences = this.getDayPresences(jour);
      presences.forEach(p => {
        empHoursMap[p.personnelId] = (empHoursMap[p.personnelId] || 0) + (p.heures || 0);
      });
    });

    // Totals
    const totalSalaire = list.filter(p => p.actif).reduce((s, p) => s + (p.salaire || 0), 0);
    const totalHeures = list.reduce((s, p) => s + (empHoursMap[p.id] || 0), 0);
    const totalMontantOcc = isOcc ? totalHeures * ptg.tauxHoraireOcc : 0;

    return `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span class="card-title">${title}</span>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${subtitle}</div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-outline btn-sm" onclick="Personnel.showScanDailyModal()" style="display:flex; align-items:center; gap:6px;">
              📸 <span>Scan Feuille</span>
            </button>
            ${isFixe ? `<span class="badge badge-info" style="font-size:0.75rem;">Base ${HEURES_BASE_FIXE}h/mois</span>` : ''}
            ${isOcc ? `<span class="badge badge-purple" style="font-size:0.75rem;">Taux: ${ptg.tauxHoraireOcc} DH/h</span>` : ''}
          </div>
        </div>
        <div class="card-body">
          <div class="table-container">
            ${list.length === 0 ? '<div class="empty-state"><div>Aucun employé dans cette catégorie</div></div>' : `
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom & Prénom</th>
                    <th>Poste</th>
                    ${isFixe ? `<th class="td-right">Heures Pointées</th><th class="td-center">vs ${HEURES_BASE_FIXE}h</th>` : ''}
                    ${isOcc ? '<th class="td-right">Heures Mois</th><th class="td-right">Montant (DH)</th>' : ''}
                    ${isAdmin ? '<th class="td-right">Heures Pointées</th>' : ''}
                    <th class="td-right">Salaire (DH)</th>
                    <th class="td-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.map((p, i) => {
                    const h = empHoursMap[p.id] || 0;
                    const diff = isFixe ? h - HEURES_BASE_FIXE : 0;
                    const montantOcc = isOcc ? h * ptg.tauxHoraireOcc : 0;
                    return `
                    <tr style="${!p.actif ? 'opacity:0.5' : ''}">
                      <td>${i + 1}</td>
                      <td class="td-bold">${p.nom} ${p.prenom || ''} ${!p.actif ? '<span class="badge">Inactif</span>' : ''}</td>
                      <td><span class="badge badge-purple">${p.poste || '-'}</span></td>
                      ${isFixe ? `
                        <td class="td-right" style="font-family:var(--font-mono);">${h > 0 ? h + 'h' : '-'}</td>
                        <td class="td-center">
                          ${h > 0 ? `<span class="badge ${diff >= 0 ? 'badge-success' : 'badge-warning'}" style="font-size:0.7rem;">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h</span>` : '-'}
                        </td>
                      ` : ''}
                      ${isOcc ? `
                        <td class="td-right" style="font-family:var(--font-mono);">${h > 0 ? h + 'h' : '-'}</td>
                        <td class="td-right td-bold" style="color:var(--accent-blue);">${h > 0 ? App.formatNumber(montantOcc, 0) : '-'}</td>
                      ` : ''}
                      ${isAdmin ? `<td class="td-right" style="font-family:var(--font-mono);">${h > 0 ? h + 'h' : '-'}</td>` : ''}
                      <td class="td-right td-bold">${p.salaire ? App.formatNumber(p.salaire, 0) : '-'}</td>
                      <td class="td-center">
                        <button class="btn-icon" onclick="Personnel.editModal(${p.id})" title="Modifier">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                      </td>
                    </tr>
                  `;}).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
        <div class="card-footer" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:16px; font-size:0.85rem; color:var(--text-muted);">
            ${isFixe ? `<span>📊 Total pointé: <b>${totalHeures}h</b> / ${list.filter(p=>p.actif).length * HEURES_BASE_FIXE}h contractuelles</span>` : ''}
            ${isOcc ? `<span>📊 Total heures: <b>${totalHeures}h</b> → <b style="color:var(--accent-blue)">${App.formatNumber(totalMontantOcc, 0)} DH</b></span>` : ''}
            ${isAdmin ? `<span>📊 Total pointé: <b>${totalHeures}h</b></span>` : ''}
          </div>
          <strong>${isOcc ? `Total à payer : ${App.formatNumber(totalMontantOcc, 0)} DH` : `Total Salaires (Actifs) : ${App.formatNumber(totalSalaire, 0)} DH/mois`}</strong>
        </div>
      </div>
    `;
  },

  // --- Grille de Pointage ---
  renderPointage() {
    const ptg = this.getPointageData(this.selectedPeriod);
    
    // Générer les jours du mois
    const [year, month] = this.selectedPeriod.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${year}-${month}-${String(i).padStart(2, '0')}`);
    }

    // Récupérer les employés concernés par le pointage (ouvrier_fixe, occasionnel, fixe_admin et fixe_autre)
    const empList = App.data.personnel.filter(p => p.type === 'ouvrier_fixe' || p.type === 'occasionnel' || p.type === 'fixe_admin' || p.type === 'fixe_autre');
    // Trier : Ouvriers Fixes d'abord, puis Admin, puis Support, puis Occasionnels, puis par nom
    const typeOrder = {
      'ouvrier_fixe': 1,
      'fixe_admin': 2,
      'fixe_autre': 3,
      'occasionnel': 4
    };
    empList.sort((a, b) => {
      const oa = typeOrder[a.type] || 99;
      const ob = typeOrder[b.type] || 99;
      if (oa !== ob) return oa - ob;
      return a.nom.localeCompare(b.nom);
    });

    return `
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <span class="card-title">Grille de Pointage - ${this.selectedPeriod}</span>
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="font-size:0.9rem; font-weight:600;">
              Taux Occasionnel: 
              <input type="number" step="0.01" class="form-input" style="width:70px; display:inline-block; padding:4px;" value="${ptg.tauxHoraireOcc}" onchange="Personnel.updateTaux(this.value)"> DH/h
            </div>
            <button class="btn btn-outline btn-sm" onclick="Personnel.showScanDailyModal()">📸 Scan Feuille</button>
          </div>
        </div>
        <div class="card-body" style="padding:0; overflow-x:auto;">
          <table class="pointage-table" style="min-width: 1500px; font-size:0.85rem;">
            <thead>
              <tr>
                <th style="position:sticky; left:0; background:var(--bg-card); z-index:10; width:200px; border-right:2px solid var(--border-color);">Employé</th>
                <th style="position:sticky; left:200px; background:var(--bg-card); z-index:10; width:80px; border-right:2px solid var(--border-color);">Type</th>
                ${days.map(d => `<th style="text-align:center; min-width:50px;">${parseInt(d.split('-')[2])}</th>`).join('')}
                <th class="td-right" style="position:sticky; right:0; background:var(--bg-card); z-index:10; border-left:2px solid var(--border-color);">Total</th>
                <th class="td-right" style="position:sticky; right:80px; background:var(--bg-card); z-index:10;">Salaire</th>
              </tr>
            </thead>
            <tbody>
              ${empList.map(emp => {
                let totalHeuresEmp = 0;
                const rowCells = days.map(d => {
                  const dayData = ptg.jours[d];
                  let h = '';
                  if (dayData) {
                    const presences = this.getDayPresences(dayData);
                    const presList = presences.filter(p => p.personnelId === emp.id);
                    if (presList.length > 0) {
                      const sumH = presList.reduce((s, p) => s + p.heures, 0);
                      h = sumH;
                      totalHeuresEmp += sumH;
                    }
                  }
                  return `<td style="padding:0;">
                    <input type="text" class="ptg-input" value="${h}" 
                           onchange="Personnel.updatePointage('${d}', ${emp.id}, this.value)"
                           style="width:100%; height:100%; border:none; text-align:center; background:transparent; outline:none; font-family:var(--font-mono); font-size:0.85rem;">
                  </td>`;
                }).join('');

                let badgeClass = 'badge-info';
                let badgeLabel = 'Occas';
                if (emp.type === 'ouvrier_fixe') {
                  badgeClass = 'badge-success';
                  badgeLabel = 'Ouv. Fixe';
                } else if (emp.type === 'fixe_admin') {
                  badgeClass = 'badge-warning';
                  badgeLabel = 'Admin';
                } else if (emp.type === 'fixe_autre') {
                  badgeClass = 'badge-secondary';
                  badgeLabel = 'Support';
                }

                const isHourly = emp.type === 'occasionnel';
                const salaire = isHourly ? (totalHeuresEmp * ptg.tauxHoraireOcc) : (emp.salaire || 0);
                const contractInfo = isHourly ? '' : `<div style="font-size:0.65rem; color:var(--text-muted);">/ 191h</div>`;

                return `
                  <tr>
                    <td style="position:sticky; left:0; background:var(--bg-card); z-index:5; font-weight:600; border-right:2px solid var(--border-color);">${emp.nom} ${emp.prenom||''}</td>
                    <td style="position:sticky; left:200px; background:var(--bg-card); z-index:5; border-right:2px solid var(--border-color);"><span class="badge ${badgeClass}" style="font-size:0.7rem;">${badgeLabel}</span></td>
                    ${rowCells}
                    <td class="td-right td-bold" style="position:sticky; right:0; background:var(--bg-card); z-index:5; border-left:2px solid var(--border-color); color:var(--accent-blue);">${totalHeuresEmp > 0 ? totalHeuresEmp : ''}${contractInfo}</td>
                    <td class="td-right" style="position:sticky; right:80px; background:var(--bg-card); z-index:5; font-size:0.8rem; font-weight:600; color:${isHourly ? 'var(--accent-blue)' : 'var(--text-primary)'};">${App.formatNumber(salaire, 0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <style>
        .pointage-table th, .pointage-table td { border-bottom: 1px solid var(--border-color); border-right: 1px solid var(--border-color); padding: 8px 4px; }
        .ptg-input:focus { background: rgba(37,99,255,0.1) !important; }
      </style>
    `;
  },

  updateTaux(val) {
    const ptg = this.getPointageData(this.selectedPeriod);
    ptg.tauxHoraireOcc = parseFloat(val) || 16.8;
    this.recalcPointageMensuel(this.selectedPeriod);
    this.render();
  },

  updatePointage(dateStr, empId, val) {
    const ptg = this.getPointageData(this.selectedPeriod);
    if (!ptg.jours[dateStr]) ptg.jours[dateStr] = { date: dateStr, fiches: [] };
    const day = ptg.jours[dateStr];

    // On récupère la liste cible (soit day.presences, soit la première fiche)
    let targetList = [];
    if (day.fiches && day.fiches.length > 0) {
      targetList = day.fiches[0].presences;
    } else {
      if (!day.presences) day.presences = [];
      targetList = day.presences;
    }
    
    const h = parseFloat(val);
    let pres = targetList.find(p => p.personnelId === empId);
    
    if (isNaN(h) || h <= 0) {
      if (pres) {
        const idx = targetList.indexOf(pres);
        targetList.splice(idx, 1);
      }
    } else {
      if (pres) {
        pres.heures = h;
      } else {
        targetList.push({ personnelId: empId, heures: h });
      }
    }
    
    this.recalcPointageMensuel(this.currentMonth);
    this.render();
  },

  // --- Modals Formulaires ---
  showAddModal(entry = null) {
    const isEdit = !!entry;
    App.showModal(isEdit ? '✏️ Fiche Employé' : '➕ Nouvel Employé', `
      <style>
        .section-title { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin: 16px 0 12px 0; display:flex; align-items:center; gap:8px;}
      </style>
      <div style="max-height: 70vh; overflow-y: auto; padding-right: 8px;">
        <!-- Identité & Contact -->
        <div class="section-title"><span>👤</span> Identité & Contact</div>
        <div class="form-grid">
          <div class="form-group"><label class="form-label">Nom <span style="color:red">*</span></label><input type="text" class="form-input" id="pNom" value="${entry?.nom||''}" placeholder="Ex: BOUACHIR"></div>
          <div class="form-group"><label class="form-label">Prénom</label><input type="text" class="form-input" id="pPrenom" value="${entry?.prenom||''}" placeholder="Ex: Zahra"></div>
          <div class="form-group"><label class="form-label">CIN</label><input type="text" class="form-input" id="pCin" value="${entry?.cin||''}" placeholder="Ex: J123456"></div>
          <div class="form-group"><label class="form-label">Téléphone</label><input type="text" class="form-input" id="pTel" value="${entry?.telephone||''}" placeholder="06 XX XX XX XX"></div>
        </div>

        <!-- Statut Professionnel -->
        <div class="section-title"><span>💼</span> Statut Professionnel</div>
        <div class="form-grid">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Catégorie de Contrat <span style="color:red">*</span></label>
            <select class="form-select" id="pType" onchange="Personnel.toggleSalaireField()">
              <option value="ouvrier_fixe" ${entry?.type==='ouvrier_fixe'?'selected':''}>Ouvrier Fixe (Production, Mensuel)</option>
              <option value="occasionnel" ${entry?.type==='occasionnel'?'selected':''}>Ouvrier Occasionnel (Taux Horaire)</option>
              <option value="fixe_admin" ${entry?.type==='fixe_admin'?'selected':''}>Administration (Mensuel, Hors Prod)</option>
              <option value="fixe_autre" ${entry?.type==='fixe_autre'?'selected':''}>Support (Sécurité, Cariste, etc.)</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Poste</label><input type="text" class="form-input" id="pPoste" value="${entry?.poste||'Ouvrière'}"></div>
          <div class="form-group"><label class="form-label">Département</label>
            <select class="form-select" id="pDept">
              <option value="Production" ${entry?.dept==='Production'?'selected':''}>Production</option>
              <option value="Qualité" ${entry?.dept==='Qualité'?'selected':''}>Qualité</option>
              <option value="Logistique" ${entry?.dept==='Logistique'?'selected':''}>Logistique</option>
              <option value="Administration" ${entry?.dept==='Administration'?'selected':''}>Administration</option>
              <option value="Maintenance" ${entry?.dept==='Maintenance'?'selected':''}>Maintenance</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Date d'embauche</label><input type="date" class="form-input" id="pDateEmb" value="${entry?.dateEmbauche||''}"></div>
          <div class="form-group"><label class="form-label">Date de départ</label><input type="date" class="form-input" id="pDateDepart" value="${entry?.dateDepart||''}"></div>
          <div class="form-group">
            <label class="form-label">Statut Actif</label>
            <select class="form-select" id="pActif">
              <option value="true" ${entry && !entry.actif ? '' : 'selected'}>En fonction (Actif)</option>
              <option value="false" ${entry && !entry.actif ? 'selected' : ''}>Ancien / Départ (Inactif)</option>
            </select>
          </div>
        </div>

        <!-- Paie & Administration -->
        <div class="section-title"><span>🏦</span> Paie & Administration</div>
        <div class="form-grid">
          <div class="form-group" id="salaireContainer"><label class="form-label">Salaire net mensuel (DH)</label><input type="number" class="form-input" id="pSalaire" value="${entry?.salaire||4000}"></div>
          <div class="form-group"><label class="form-label">N° CNSS</label><input type="text" class="form-input" id="pCnss" value="${entry?.cnss||''}" placeholder="N° d'immatriculation"></div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Observations</label>
            <textarea class="form-input" id="pObs" rows="2" placeholder="Remarques éventuelles...">${entry?.observations||''}</textarea>
          </div>
        </div>
      </div>
    `, `<button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
       <button class="btn btn-primary" onclick="Personnel.savePersonnel(${entry?.id||0})" style="background:var(--accent-blue); color:white; border:none;">${isEdit?'Enregistrer les modifications':'Créer la Fiche Employé'}</button>`);
       
    this.toggleSalaireField();
  },

  toggleSalaireField() {
    const type = document.getElementById('pType')?.value;
    const cont = document.getElementById('salaireContainer');
    if (cont) {
      if (type === 'occasionnel') cont.style.display = 'none';
      else cont.style.display = 'block';
    }
  },

  editModal(id) {
    const entry = App.data.personnel.find(p => p.id === id);
    if (entry) this.showAddModal(entry);
  },

  savePersonnel(editId) {
    const nom = document.getElementById('pNom').value.trim().toUpperCase();
    const prenom = document.getElementById('pPrenom').value.trim();
    const cin = document.getElementById('pCin').value.trim().toUpperCase();
    const telephone = document.getElementById('pTel').value.trim();
    
    const type = document.getElementById('pType').value;
    const poste = document.getElementById('pPoste').value;
    const dept = document.getElementById('pDept').value;
    const dateEmbauche = document.getElementById('pDateEmb').value;
    const dateDepart = document.getElementById('pDateDepart').value;
    const actif = document.getElementById('pActif').value === 'true';
    
    const salaire = type === 'occasionnel' ? null : (parseFloat(document.getElementById('pSalaire').value) || 0);
    const cnss = document.getElementById('pCnss').value.trim();
    const observations = document.getElementById('pObs').value.trim();

    if (!nom) { App.toast('Le nom est requis pour la fiche', 'error'); return; }

    const data = { nom, prenom, cin, telephone, type, poste, dept, dateEmbauche, dateDepart, actif, salaire, cnss, observations };

    if (editId) {
      const idx = App.data.personnel.findIndex(p => p.id === editId);
      if (idx !== -1) App.data.personnel[idx] = { ...App.data.personnel[idx], ...data };
    } else {
      data.id = App.nextId(App.data.personnel);
      App.data.personnel.push(data);
    }
    
    App.saveData();
    App.closeModal();
    this.recalcPointageMensuel(this.currentMonth);
    this.render();
    App.toast(editId ? 'Fiche employé mise à jour' : 'Nouvel employé créé avec succès', 'success');
  },

  // --- LOGIQUE IMPORT EXCEL POINTAGE ---
  async importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        App.toast("Analyse du fichier Excel en cours...", "info");
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, {type: 'array'});
        
        // Extraire depuis 'POINTAGE 1ER QUINZ MARS' et 'POINTAGE 2EME QUINZ MARS'
        const pointages = {};
        let detectedRate = null;
        let fixedSalaries = {};

        const parseSheet = (sheetName) => {
          const sheet = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});
          
          // --- Cas 1: Feuille de Pointage ---
          let headerIdx = -1;
          for(let i=0; i<Math.min(15, rows.length); i++) {
             if(String(rows[i][0] || '').toUpperCase().includes('NOM ET PRENOM')) {
               headerIdx = i; break;
             }
          }

          if(headerIdx !== -1) {
            const headers = rows[headerIdx];
            const dateCols = [];
            for(let c=1; c<headers.length; c++) {
              let val = headers[c];
              if(typeof val === 'number' && val > 40000) { // Probablement une date Excel serial
                const dateObj = new Date((val - 25569) * 86400 * 1000);
                dateCols.push({ col: c, date: dateObj.toISOString().split('T')[0] });
              }
            }

            for(let i=headerIdx+1; i<rows.length; i++) {
               let nom = String(rows[i][0] || '').trim().toUpperCase();
               if(!nom || nom === 'TOTAL' || nom === '0' || nom.includes('PAGE') || nom.includes('PRENOM') || nom === 'NOM ET PRENOM') continue;
               if(!pointages[nom]) pointages[nom] = {};
               
               dateCols.forEach(dc => {
                 const v = rows[i][dc.col];
                 if(typeof v === 'number' && v > 0) {
                   // Si c'est une fraction < 1, c'est une fraction de jour (ex: 0.33 = 8h)
                   // Si c'est > 1, c'est peut-être déjà en heures.
                   let h = v < 1 ? Math.round(v * 24 * 10) / 10 : v;
                   pointages[nom][dc.date] = h;
                 }
               });
            }
          }

          // --- Cas 2: Feuille Récap (TOTAL) ---
          if(sheetName.toUpperCase().includes('TOTAL')) {
            rows.forEach(row => {
               // Chercher le taux horaire via MONTANT / TOTALE HEURE
               const mIdx = row.findIndex(c => String(c).toUpperCase() === 'MONTANT');
               const hIdx = row.findIndex(c => String(c).toUpperCase() === 'TOTALE HEURE');
               if(mIdx !== -1 && hIdx !== -1 && rows[rows.indexOf(row)+1]) {
                 const nextRow = rows[rows.indexOf(row)+3] || rows[rows.indexOf(row)+1]; // Souvent quelques lignes plus bas
                 // On cherche la ligne "MOIS MARS"
                 const moisRow = rows.find(r => String(r[hIdx-2] || '').toUpperCase().includes('MOIS'));
                 if(moisRow) {
                    const totalH = parseFloat(moisRow[hIdx]);
                    const totalM = parseFloat(moisRow[mIdx]);
                    if(totalH > 0 && totalM > 0) detectedRate = Math.round((totalM / totalH) * 100) / 100;
                 }
               }
               
               // Chercher les salaires fixes (PROFESSION -> SALAIRE)
               row.forEach((cell, cIdx) => {
                 if(String(cell).toUpperCase().includes('PROFESSION')) {
                   const salIdx = cIdx + 1;
                   for(let i=rows.indexOf(row)+1; i<rows.length; i++) {
                     let prof = String(rows[i][cIdx] || '').trim();
                     let sal = parseFloat(rows[i][salIdx]);
                     if(prof && sal > 0 && prof !== 'TOTAL') fixedSalaries[prof.toUpperCase()] = sal;
                   }
                 }
               });
            });
          }
        };

        wb.SheetNames.forEach(name => parseSheet(name));
        
        // Mettre à jour App.data
        let addedEmps = 0;
        let datesUpdated = new Set();
        
        Object.keys(pointages).forEach(nom => {
           // Chercher l'employé avec la nouvelle fonction matchPersonnel
           let emp = this.matchPersonnel(nom);
           if(!emp) {
             // S'il n'existe pas, l'ajouter comme occasionnel
             emp = {
               id: App.nextId(App.data.personnel),
               nom: nom,
               prenom: '',
               type: 'occasionnel',
               poste: 'Ouvrier',
               dept: 'Production',
               salaire: null,
               actif: true
             };
             App.data.personnel.push(emp);
             addedEmps++;
           }
           
           // Ajouter les pointages
           Object.keys(pointages[nom]).forEach(dateStr => {
              const monthStr = dateStr.substring(0, 7);
              const ptg = this.getPointageData(monthStr);
              if(!ptg.jours[dateStr]) ptg.jours[dateStr] = { date: dateStr, fiches: [] };
              const day = ptg.jours[dateStr];
              let targetList = day.fiches && day.fiches.length > 0 ? day.fiches[0].presences : (day.presences || (day.presences = []));
              
              let pres = targetList.find(p => p.personnelId === emp.id);
              if(pres) pres.heures = pointages[nom][dateStr];
              else targetList.push({ personnelId: emp.id, heures: pointages[nom][dateStr] });
              
              datesUpdated.add(monthStr);
           });
        });
        
        App.saveData();
         
        // Appliquer le taux détecté s'il existe
        if(detectedRate) {
          datesUpdated.forEach(m => {
            const ptg = this.getPointageData(m);
            ptg.tauxHoraireOcc = detectedRate;
          });
        }

        // Appliquer les salaires fixes détectés
        Object.keys(fixedSalaries).forEach(prof => {
          App.data.personnel.forEach(emp => {
             if(emp.poste && emp.poste.toUpperCase() === prof) {
               emp.salaire = fixedSalaries[prof];
             }
          });
        });

        datesUpdated.forEach(m => this.recalcPointageMensuel(m));
        
        // Changer pour le mois mis à jour s'il y en a
        if(datesUpdated.size > 0) {
          const firstMonth = Array.from(datesUpdated)[0];
          this.currentMonth = firstMonth;
          const parts = firstMonth.split('-');
          this.selectedYear = parseInt(parts[0]);
          this.selectedMonth = parseInt(parts[1]) - 1;
          this.viewType = 'month';
        }
        this.switchTab('pointage');
        
        App.toast(`Import réussi : ${Object.keys(pointages).length} personnes trouvées. Nouveaux employés : ${addedEmps}.`, 'success');
        
      } catch (err) {
        console.error(err);
        App.toast('Erreur de lecture du fichier Excel', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset
  },

  // --- LOGIQUE SCAN IA FEUILLE JOURNALIÈRE ---
  showScanDailyModal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.processDailyScan(e);
    input.click();
  },

  async processDailyScan(event) {
    const file = event.target.files[0];
    if (!file) return;

    App.AI.showOverlay("Analyse de la feuille de pointage journalière...");
    
    try {
      const prompt = `Tu es un expert en extraction de données de feuilles de pointage pour SEA PECHE.
Analyse cette image d'une FEUILLE DE PRÉSENCE journalière.

STRUCTURE DE LA FEUILLE :
1. EN-TÊTE : Contient l'activité (ex: EQUIPE D'EMBALLAGE) et la Date.
2. GRILLE PRINCIPALE : Colonnes N°, Nom, MATIN (Entrée, Sortie, Nbr Heures), SOIR (Entrée, Sortie, Nbr Heures), Total Heures.
3. DEUXIÈME GRILLE (bas de page) : Il y a souvent un deuxième bloc d'employés en bas après un séparateur. Extrais-les AUSSI.

LIVRABLE JSON :
{
  "date": "YYYY-MM-DD",
  "activite": "EMBALLAGE" | "TRAITEMENT" | "RECONDITIONNEMENT",
  "titre": "Nom de l'équipe (ex: Equipe d'Emballage)",
  "presences": [
    { 
      "nom": "NOM COMPLET", 
      "matinEntree": "HH:MM", "matinSortie": "HH:MM", "matinHeures": 4.0,
      "soirEntree": "HH:MM", "soirSortie": "HH:MM", "soirHeures": 4.0,
      "totalHeures": 8.0
    },
    ...
  ]
}

RÈGLES CRUCIALES :
- L'activité est obligatoire. Si tu vois "EMBALLAGE", mets "EMBALLAGE".
- Si une ligne est vide (pas d'heures), ne l'inclus pas ou mets des heures à 0.
- Si tu vois une croix ou un trait dans "Nbr Heures", cela signifie généralement 4h pour la session (8h total).
- Capture TOUS les noms, y compris ceux dans le petit tableau en bas de la feuille.
- N'inclus PAS les entêtes de colonnes tels que "NOM ET PRENOM", "NOM & PRENOM" ou "TOTAL" en tant qu'employés.
- Sois très précis sur l'orthographe des noms.`;

      const result = await App.AI.analyzeImage(file, prompt);
      App.AI.hideOverlay();
      
      if (!result || !result.presences) {
        throw new Error("Aucune donnée de présence trouvée.");
      }

      const scanData = result;
      this.pendingScanData = scanData;
      this.showScanValidationModal();
    } catch (error) {
      App.AI.hideOverlay();
      console.error(error);
      App.toast("Erreur lors du scan : " + error.message, "error");
    } finally {
      event.target.value = '';
    }
  },

  showScanValidationModal() {
    if (!this.pendingScanData) return;
    const data = this.pendingScanData;
    
    const html = `
      <div class="modal-header">
        <h2 class="modal-title">🔍 Validation du Scan</h2>
        <button class="btn-close" onclick="App.closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--bg-app); padding:16px; border-radius:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Activité Détectée</div>
            <div style="font-weight:700; color:var(--accent-blue);">${data.activite || 'Non détectée'}</div>
          </div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Date Détectée</div>
            <div style="font-weight:700;">${data.date || this.currentDailyDate}</div>
          </div>
          <div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Titre</div>
            <input type="text" class="form-input" id="vFicheTitre" value="${data.titre || ''}" style="width:200px; height:32px;">
          </div>
        </div>

        <div style="max-height:400px; overflow-y:auto; border:1px solid var(--border-color); border-radius:8px;">
          <table class="table">
            <thead>
              <tr style="position:sticky; top:0; background:white; z-index:1;">
                <th>Nom Scanné</th>
                <th>Employé Matché</th>
                <th style="text-align:center;">Matin</th>
                <th style="text-align:center;">Soir</th>
                <th style="text-align:center;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.presences.map((p, idx) => {
                const emp = this.matchPersonnel(p.nom);
                return `
                  <tr class="${!emp ? 'row-warning' : ''}">
                    <td style="font-weight:600;">${p.nom}</td>
                    <td>
                      ${emp ? `
                        <div style="color:var(--status-success); font-weight:700; font-size:0.85rem;">✅ ${emp.nom}</div>
                      ` : `
                        <div style="color:var(--status-danger); font-weight:700; font-size:0.85rem;">❌ Non reconnu</div>
                        <select class="form-select" style="font-size:0.75rem; padding:2px;" onchange="Personnel.manualMatchScan(${idx}, this.value)">
                          <option value="">Associer manuellement...</option>
                          ${App.data.personnel.filter(e => e.type.includes('ouvrier') || e.type === 'occasionnel').map(e => `<option value="${e.id}">${e.nom}</option>`).join('')}
                        </select>
                      `}
                    </td>
                    <td style="text-align:center; font-size:0.85rem;">${p.matinHeures || 0}h</td>
                    <td style="text-align:center; font-size:0.85rem;">${p.soirHeures || 0}h</td>
                    <td style="text-align:center; font-weight:800;">${p.totalHeures || (parseFloat(p.matinHeures)||0) + (parseFloat(p.soirHeures)||0)}h</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
        <button class="btn btn-primary" onclick="Personnel.confirmScanValidation()">Valider et Enregistrer</button>
      </div>
      <style>
        .row-warning { background: rgba(239, 68, 68, 0.05); }
      </style>
    `;
    
    App.showModal(html, '900px');
  },

  manualMatchScan(idx, empId) {
    if (!this.pendingScanData) return;
    const emp = App.data.personnel.find(e => e.id == empId);
    if (emp) {
      // On triche un peu : on remplace le nom scanné par le nom de l'employé pour que matchPersonnel le trouve
      this.pendingScanData.presences[idx].nom = emp.nom;
      this.showScanValidationModal(); // Rafraîchir la modal
    }
  },

  confirmScanValidation() {
    if (!this.pendingScanData) return;
    const data = this.pendingScanData;
    const targetDate = data.date || this.currentDailyDate;
    const targetActivite = data.activite ? (data.activite.charAt(0).toUpperCase() + data.activite.slice(1).toLowerCase()) : this.currentDailyActivite;
    const titre = document.getElementById('vFicheTitre').value || data.titre || `Scan ${targetActivite}`;

    const monthStr = targetDate.substring(0, 7);
    const ptg = this.getPointageData(monthStr);
    if (!ptg.jours[targetDate]) ptg.jours[targetDate] = { date: targetDate, fiches: [] };
    const day = ptg.jours[targetDate];
    if (!day.fiches) day.fiches = [];

    const newId = day.fiches.length > 0 ? Math.max(...day.fiches.map(f => f.id)) + 1 : 1;
    const fiche = { id: newId, activite: targetActivite, titre, presences: [] };

    let matchedCount = 0;
    data.presences.forEach(pScan => {
      const emp = this.matchPersonnel(pScan.nom);
      if (emp) {
        fiche.presences.push({
          personnelId: emp.id,
          matinEntree: pScan.matinEntree || '',
          matinSortie: pScan.matinSortie || '',
          matinHeures: parseFloat(pScan.matinHeures) || 0,
          soirEntree: pScan.soirEntree || '',
          soirSortie: pScan.soirSortie || '',
          soirHeures: parseFloat(pScan.soirHeures) || 0,
          heures: (parseFloat(pScan.matinHeures) || 0) + (parseFloat(pScan.soirHeures) || 0)
        });
        matchedCount++;
      }
    });

    day.fiches.push(fiche);
    this.currentFicheId = newId;
    this.currentDailyDate = targetDate;
    
    this.recalcPointageMensuel(monthStr);
    App.closeModal();
    this.pendingScanData = null;
    this.render();
    App.toast(`${matchedCount} ouvriers enregistrés dans la nouvelle feuille.`, "success");
  },

  matchPersonnel(nom) {
    const excelNom = nom.toUpperCase().replace(/\s+/g, ' ');
    return App.data.personnel.find(p => {
      const pNom = (p.nom || '').toUpperCase();
      const pPrenom = (p.prenom || '').toUpperCase();
      const pNomComplet = `${pNom} ${pPrenom}`.trim().replace(/\s+/g, ' ');
      const pNomInvers = `${pPrenom} ${pNom}`.trim().replace(/\s+/g, ' ');
      return pNom === excelNom || pNomComplet === excelNom || pNomInvers === excelNom || pNom.includes(excelNom) || excelNom.includes(pNomComplet);
    });
  }
};
