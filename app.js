/* ============================================
   APP.JS — Module Principal
   ============================================ */

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Erreur globale:', message, source, lineno);
  if (typeof App !== 'undefined' && App.toast) {
    App.toast('Erreur système: ' + message, 'error');
  }
  return false;
};
window.addEventListener('unhandledrejection', function(event) {
  console.error('Promise rejetée:', event.reason);
  if (typeof App !== 'undefined' && App.toast) {
    App.toast('Erreur async: ' + (event.reason?.message || event.reason), 'error');
  }
});

const App = {
  currentPage: 'dashboard',
  data: {},
  charts: {},
  
  // --- Supabase Config ---
  supabase: null,
  sbUrl: 'https://waqfodmwoldhusazcycg.supabase.co',
  sbKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc',

  // --- Default Data ---
  defaults: {
    personnel: [
      // === Charges Fixes Admin (76 100 DH) ===
      { id: 1, nom: 'RESPONSABLE QUALITE', prenom: '', type: 'fixe_admin', poste: 'Resp. Qualité', dept: 'Qualité', salaire: 9000, actif: true },
      { id: 2, nom: 'COMPTABILITE', prenom: '', type: 'fixe_admin', poste: 'Comptable', dept: 'Administration', salaire: 6000, actif: true },
      { id: 3, nom: 'RESPONSABLE STOCK', prenom: '1', type: 'fixe_admin', poste: 'Resp. Stock', dept: 'Logistique', salaire: 5000, actif: true },
      { id: 4, nom: 'FEMME DE MENAGE', prenom: '', type: 'fixe_admin', poste: 'Ménage', dept: 'Administration', salaire: 3200, actif: true },
      { id: 5, nom: 'CONTRÔLE ET SECURITE', prenom: '', type: 'fixe_admin', poste: 'Sécurité', dept: 'Administration', salaire: 6000, actif: true },
      { id: 6, nom: 'Controleur de gestion', prenom: '', type: 'fixe_admin', poste: 'Contrôleur', dept: 'Administration', salaire: 8000, actif: true },
      { id: 7, nom: 'AIDE FRIGORISTE', prenom: '', type: 'fixe_admin', poste: 'Aide Frigoriste', dept: 'Maintenance', salaire: 3400, actif: true },
      { id: 8, nom: 'FRIGORISTE', prenom: '', type: 'fixe_admin', poste: 'Frigoriste', dept: 'Maintenance', salaire: 8000, actif: true },
      { id: 9, nom: 'CONTRÔLE QUALITE', prenom: '', type: 'fixe_admin', poste: 'Contrôle Qualité', dept: 'Qualité', salaire: 6000, actif: true },
      { id: 10, nom: 'KABRANE', prenom: '', type: 'fixe_admin', poste: 'Kabrane', dept: 'Production', salaire: 4500, actif: true },
      { id: 11, nom: 'RESPONSABLE STOCK', prenom: '2', type: 'fixe_admin', poste: 'Resp. Stock', dept: 'Logistique', salaire: 4500, actif: true },
      { id: 12, nom: 'RESPONSABLE ST/CONSOMMABLE', prenom: '', type: 'fixe_admin', poste: 'Resp. Consommable', dept: 'Logistique', salaire: 4500, actif: true },
      { id: 13, nom: 'RESPONSABLE PRODUCTION', prenom: '', type: 'fixe_admin', poste: 'Resp. Production', dept: 'Production', salaire: 8000, actif: true },
      // === Charges Fixes Autres (10 200 DH) ===
      { id: 14, nom: 'CLARISTE', prenom: '', type: 'fixe_autre', poste: 'Cariste', dept: 'Logistique', salaire: 4000, actif: true },
      { id: 15, nom: 'SECURITE (nuit)', prenom: '', type: 'fixe_autre', poste: 'Sécurité', dept: 'Administration', salaire: 3100, actif: true },
      { id: 16, nom: 'SECURITE (jour)', prenom: '', type: 'fixe_autre', poste: 'Sécurité', dept: 'Administration', salaire: 3100, actif: true },
      // === Ouvriers Fixes Production (40 000 DH) ===
      { id: 17, nom: 'BOUACHIR', prenom: 'Zahra', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 3200, actif: true },
      { id: 18, nom: 'BOUCHALA', prenom: 'Ilham', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 19, nom: 'BOUHRAM', prenom: 'MBARKA', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 20, nom: 'FINNA', prenom: 'Fatima', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 21, nom: 'JRARI', prenom: 'Malika', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 22, nom: 'KARDAD', prenom: 'Zohra', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4500, actif: true },
      { id: 23, nom: 'OUMAST', prenom: 'Khadija', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 24, nom: 'OUMASTE', prenom: 'Fatima', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 25, nom: 'SIDIR', prenom: 'Zahra', type: 'ouvrier_fixe', poste: 'Ouvrière', dept: 'Production', salaire: 4000, actif: true },
      { id: 26, nom: 'ALLIMOURI', prenom: 'BOUCHAIB', type: 'ouvrier_fixe', poste: 'Ouvrier', dept: 'Production', salaire: 4300, actif: true },
      // === Ouvriers Occasionnels Production ===
      { id: 27, nom: "BAADI KHADOUJ", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 28, nom: "ELBELGHITI LAILA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 29, nom: "EL-GHARRADI HANANE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 30, nom: "ESSALMI TOURIA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 31, nom: "ZAROUAL GHIZLANE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 32, nom: "EL KAKI SANA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 33, nom: "GHIZLANE ESSABBAHI", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 34, nom: "AHERDANE FATIMA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 35, nom: "NOUHAILA EL JANATY", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 36, nom: "AKIL SAADIA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 37, nom: "AARAB HICHAM", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 38, nom: "BELLAQTOUB REDOUANE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 39, nom: "BOUALI RADOUANE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 40, nom: "IDOUFSOU M’HAND", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 41, nom: "LAFQIRI BILAL", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 42, nom: "MORJANE WALID", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 43, nom: "OUJAA MOUAD", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 44, nom: "OUTFRIT ALI", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 45, nom: "RISSAMI HICHAM", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 46, nom: "RISSAMI MOUAD", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 47, nom: "SOUITER WASSIM", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 48, nom: "TOUGHZAOUI AMINE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 49, nom: "YABBA SALAH EDDINE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 50, nom: "ZAMHAR MOHAMED", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 51, nom: "MARZAK ISMAIL", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 52, nom: "M'HAND BOUABIA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 53, nom: "AREHAL HICHAM", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 54, nom: "ER-RAFIKY ACHRAF", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 55, nom: "ABOUNAIME SALAH EDDINE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 56, nom: "FAJRI AMIN", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 57, nom: "MOUFRIH IMAD", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 58, nom: "LAFQIRI AHMED", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 59, nom: "EL ALAMI OUSSAMA", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 60, nom: "HABIB ALLAH AZZE-EDDINE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 61, nom: "AABBAJ MOHAMED", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 62, nom: "SAID EL BICH", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 63, nom: "AHMED NEHARI", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
      { id: 64, nom: "ZEROUAL GHIZLANE", prenom: "", type: "occasionnel", poste: "Ouvrier", dept: "Production", salaire: 0, actif: true },
    ],
    pointage: {},
    consommables: [
      // ── SACHETS (tailles réelles inventaire) ──
      { id: 1, nom: 'SACHET 23x38', unite: 'kg', stock: 160, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 24.00 },
      { id: 2, nom: 'SACHET 25x35', unite: 'kg', stock: 628.8, seuilCritique: 50, seuilAlerte: 100, prixUnitaire: 25.28 },
      { id: 3, nom: 'SACHET 40x40 (1.5KG)', unite: 'kg', stock: 354.9, seuilCritique: 50, seuilAlerte: 100, prixUnitaire: 24.00 },
      { id: 4, nom: 'SACHET 40x50 (2KG)', unite: 'kg', stock: 304, seuilCritique: 50, seuilAlerte: 100, prixUnitaire: 24.00 },
      { id: 5, nom: 'SACHET 77x80', unite: 'kg', stock: 159.9, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 25.20 },
      { id: 6, nom: 'SACHET 40x60', unite: 'kg', stock: 550, seuilCritique: 50, seuilAlerte: 100, prixUnitaire: 24.00 },
      { id: 7, nom: 'SACHET 12x30', unite: 'kg', stock: 150, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 27.60 },
      { id: 8, nom: 'SACHET 14x40', unite: 'kg', stock: 150, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 27.60 },
      { id: 9, nom: 'SACHET 14x50', unite: 'kg', stock: 150, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 27.60 },
      { id: 10, nom: 'SACHET 40x65', unite: 'kg', stock: 150, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 27.60 },
      { id: 11, nom: 'SACHET 6/45x120x80', unite: 'kg', stock: 157.2, seuilCritique: 30, seuilAlerte: 60, prixUnitaire: 25.12 },
      { id: 12, nom: 'SACHET 60*5(16)x80', unite: 'kg', stock: 208.1, seuilCritique: 30, seuilAlerte: 60, prixUnitaire: 25.20 },
      { id: 13, nom: 'SACHET 43x53', unite: 'kg', stock: 174.3, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 24.00 },
      { id: 14, nom: 'SACHET 58x85', unite: 'kg', stock: 164.6, seuilCritique: 20, seuilAlerte: 50, prixUnitaire: 24.00 },
      // ── CARTONS ──
      { id: 15, nom: 'CARTON 12KG', unite: 'pièce', stock: 11372, seuilCritique: 500, seuilAlerte: 1000, prixUnitaire: 11.64 },
      { id: 16, nom: 'CARTON 13KG', unite: 'pièce', stock: 0, seuilCritique: 200, seuilAlerte: 500, prixUnitaire: 12.50 },
      { id: 17, nom: 'CARTON 15KG', unite: 'pièce', stock: 0, seuilCritique: 200, seuilAlerte: 500, prixUnitaire: 14.00 },
      { id: 18, nom: 'CARTON 17KG', unite: 'pièce', stock: 0, seuilCritique: 100, seuilAlerte: 300, prixUnitaire: 15.00 },
      { id: 19, nom: 'CARTON 19KG', unite: 'pièce', stock: 0, seuilCritique: 100, seuilAlerte: 300, prixUnitaire: 16.50 },
      { id: 20, nom: 'CARTON 20KG', unite: 'pièce', stock: 0, seuilCritique: 100, seuilAlerte: 300, prixUnitaire: 18.00 },
      // ── ETIQUETTES ──
      { id: 21, nom: 'ETIQUETTE 50*75', unite: 'pièce', stock: 200, seuilCritique: 20, seuilAlerte: 40, prixUnitaire: 45.00 },
      { id: 22, nom: 'ETIQUETTE NOIR', unite: 'pièce', stock: 100, seuilCritique: 10, seuilAlerte: 20, prixUnitaire: 78.00 },
      // ── EMBALLAGE ──
      { id: 23, nom: 'FILM ETIRABLE', unite: 'rouleau', stock: 40, seuilCritique: 10, seuilAlerte: 20, prixUnitaire: 39.60 },
      { id: 24, nom: 'SCOTCH', unite: 'rouleau', stock: 200, seuilCritique: 30, seuilAlerte: 60, prixUnitaire: 10.80 },
      { id: 25, nom: 'PALETTE', unite: 'pièce', stock: 50, seuilCritique: 5, seuilAlerte: 10, prixUnitaire: 0 },
      // ── INTRANT ──
      { id: 26, nom: 'SEL', unite: 'kg', stock: 500, seuilCritique: 50, seuilAlerte: 100, prixUnitaire: 0.60 },
    ],
    chambresSpecs: {
      chambre1: { nom: 'CS 01', surfaceToit: 202.98, surfaceSol: 67.2, tempSol: 8, epaisseur: 150, isolation: 0.28, moteurs: 35, dureeMoteurs: 12, projecteur: 165, dureeProj: 1, degivrage: 3, echangeAir: 540.36, tonnage: 400 },
      chambre2: { nom: 'CS 02', surfaceToit: 202.98, surfaceSol: 67.2, tempSol: 8, epaisseur: 150, isolation: 0.28, moteurs: 35, dureeMoteurs: 12, projecteur: 165, dureeProj: 1, degivrage: 3, echangeAir: 540.36, tonnage: 400 },
      entreposage: { nom: 'Entreposage', surfaceToit: 245.9, surfaceSol: 69, tempSol: 10, epaisseur: 150, isolation: 0.28, moteurs: 35, dureeMoteurs: 10, projecteur: 165, dureeProj: 1, degivrage: 3, echangeAir: 629.8, tonnage: 400 },
      tunnel1: { nom: 'Tunnel 01', surfaceToit: 39.89, surfaceSol: 16.61, tempSol: -1, epaisseur: 200, isolation: 0.18, moteurs: 90, dureeMoteurs: 8, projecteur: 150, dureeProj: 0.2, degivrage: 1, echangeAir: 0, tonnage: 8000 },
      tunnel2: { nom: 'Tunnel 02', surfaceToit: 39.89, surfaceSol: 16.61, tempSol: -1, epaisseur: 200, isolation: 0.18, moteurs: 90, dureeMoteurs: 8, projecteur: 150, dureeProj: 0.2, degivrage: 1, echangeAir: 0, tonnage: 8000 },
      tunnel3: { nom: 'Tunnel 03', surfaceToit: 80, surfaceSol: 32, tempSol: -1, epaisseur: 200, isolation: 0.18, moteurs: 160, dureeMoteurs: 8, projecteur: 150, dureeProj: 0.2, degivrage: 1, echangeAir: 0, tonnage: 160000 }
    },
    chambresHistory: [],
    parametres: {
      productivityTarget: 25,
      yieldTargets: {
        'OCTOPUS': 75,
        'SEICHE': 72,
        'CALAMAR': 78,
        'CREVETTE': 45,
        'DEFAULT': 70
      },
      stockCapacityTotal: 1200, // 400 * 3
      fixedCostTarget: 3000, // Daily target
      marginTarget: 15, // %
    },
    especes: [
        {
            "nom": "ACEDIA",
            "prixMoyenVente": 45,
            "calibres": [
                "ACEDIA",
                "ACEDIA G",
                "ACEDIA M",
                "ACEDIA P"
            ]
        },
        {
            "nom": "ACEDIA KG",
            "calibres": [
                "ACEDIA KG"
            ]
        },
        {
            "nom": "AF-MIX",
            "calibres": [
                "AF-MIX",
                "VARIOS",
                "LEMPRO",
                "RUFO",
                "EMPREUR",
                "AJI",
                "PELUDA"
            ]
        },
        {
            "nom": "ANCHOIS",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "ARANA",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "BAILLA",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "BALISTE",
            "calibres": [
                "SURIMI",
                "SURIMI 5KG"
            ]
        },
        {
            "nom": "BESUGO",
            "calibres": [
                "BESUGO",
                "BESUGO KG",
                "BOGUE"
            ]
        },
        {
            "nom": "BOGUE",
            "calibres": [
                "BOGUE"
            ]
        },
        {
            "nom": "BRECA",
            "calibres": [
                "BRICA"
            ]
        },
        {
            "nom": "BURRO",
            "calibres": [
                "BURRO S/C",
                "BURRO",
                "BURRO R",
                "BURRO RRR",
                "BURRO G",
                "FILET BURRO",
                "BURRO KG",
                "ABADECHE"
            ]
        },
        {
            "nom": "BURRO S/C",
            "calibres": [
                "PALOMA"
            ]
        },
        {
            "nom": "CABEZOTE",
            "calibres": [
                "CABEZOTE"
            ]
        },
        {
            "nom": "CABRETA",
            "calibres": [
                "CABRETA"
            ]
        },
        {
            "nom": "CALAMAR",
            "calibres": [
                "CALAMAR GG",
                "CALAMAR G",
                "CALAMAR M",
                "CALAMAR P",
                "CALAMAR 2P",
                "CALAMAR 3P",
                "CALAMAR MIX"
            ]
        },
        {
            "nom": "CATCHOCHO",
            "calibres": [
                "CATCHOCHO",
                "CATCHOCHO M",
                "CATCHOCHO P"
            ]
        },
        {
            "nom": "CHERNE",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "CHOCO",
            "calibres": [
                "CHOCO GG",
                "CHOCO G",
                "CHOCO M",
                "CHOCO P",
                "CHOCO 2P",
                "CHOCO 3P",
                "CHOCO MIX"
            ]
        },
        {
            "nom": "CHOPA",
            "calibres": [
                "CHOPA"
            ]
        },
        {
            "nom": "CONGRIO",
            "calibres": [
                "CONGRIO S/C",
                "CONGRIO"
            ]
        },
        {
            "nom": "CORVINA",
            "calibres": [
                "CORVINA S/C",
                "CORVINA M",
                "CORVINA G",
                "CORVINA R",
                "CORVINA P",
                "CORVINA F",
                "CORVINA RG",
                "CORVINA RM",
                "CORVINA RP",
                "CORVINA PCS",
                "CORVINA TRANCHE"
            ]
        },
        {
            "nom": "CRABE",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "CREVETTE",
            "calibres": [
                "1/2",
                "2/3",
                "3/4",
                "4/5",
                "5/6",
                "6/7",
                "7/8",
                "8/9",
                "9/10",
                "10/12",
                "12/14",
                "14/16",
                "16/20",
                "20/30",
                "30/40",
                "40/60",
                "60/80",
                "80/UP"
            ]
        },
        {
            "nom": "crevette G/5",
            "calibres": [
                "CREVETTE G/5"
            ]
        },
        {
            "nom": "CROQUETTE",
            "calibres": [
                "BAILLA"
            ]
        },
        {
            "nom": "DENTON",
            "calibres": [
                "DENTON GG",
                "DENTON G",
                "DENTON M",
                "DENTON P",
                "DENTON 2P",
                "DENTON 3P",
                "DENTON 4P",
                "DENTON MIX",
                "DENTON P IQF",
                "DENTON FILET"
            ]
        },
        {
            "nom": "DENTON KG",
            "calibres": [
                "DENTON KG"
            ]
        },
        {
            "nom": "DORADA",
            "calibres": [
                "DORADA GG",
                "DORADA G",
                "DORADA M",
                "DORADA P",
                "DORADA"
            ]
        },
        {
            "nom": "EU-MIX",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "EUR-MIX",
            "calibres": [
                "SOYA",
                "TRIPOT",
                "LEMA"
            ]
        },
        {
            "nom": "FOLA",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "FRITE",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "GABRITA",
            "calibres": [
                "CONGRIO S/C",
                "CONGRIO"
            ]
        },
        {
            "nom": "GALINA",
            "calibres": [
                "GALINA",
                "GALINITA"
            ]
        },
        {
            "nom": "GALLO",
            "calibres": [
                "GALLO",
                "GALLO M",
                "GALLO P",
                "GALLO G",
                "FILET GALLO"
            ]
        },
        {
            "nom": "GAMBAS",
            "calibres": [
                "1/2",
                "2/3",
                "3/4",
                "4/5",
                "5/6",
                "6/7",
                "7/8",
                "8/9",
                "9/10",
                "10/12",
                "12/14",
                "14/16",
                "16/20",
                "20/30",
                "30/40",
                "40/60",
                "60/80",
                "80/UP"
            ]
        },
        {
            "nom": "GAZON",
            "calibres": [
                "GAZON",
                "REQUIN"
            ]
        },
        {
            "nom": "HAMADAY",
            "calibres": [
                "HAMADAY"
            ]
        },
        {
            "nom": "HERRERA",
            "calibres": [
                "HERRERA"
            ]
        },
        {
            "nom": "JUREL",
            "calibres": [
                "JUREL",
                "JUREL G"
            ]
        },
        {
            "nom": "LAMELLE DE CALAMAR",
            "calibres": [
                "ST PIERRE",
                "ST PIERRE S/C",
                "ST PIERRE P",
                "ST PIERRE M",
                "ST PIERRE G",
                "ST PIERRE S/C P",
                "ST PIERRE S/C M",
                "ST PIERRE S/C G"
            ]
        },
        {
            "nom": "LANGOUSTE",
            "calibres": [
                "200/300",
                "300/500",
                "500/1000",
                "1000/2000",
                "2000/3000"
            ]
        },
        {
            "nom": "LENGUADO",
            "calibres": [
                "LENGUADO K",
                "LENGUADO G",
                "LENGUADO M",
                "LENGUADO 2PP",
                "LENGUADO P",
                "LENGUADO 3P",
                "LENGUADO 4P"
            ]
        },
        {
            "nom": "LIRIO",
            "calibres": [
                "LIRIO"
            ]
        },
        {
            "nom": "LONGUE",
            "calibres": [
                "LONGUE P",
                "LONGUE M",
                "LONGUE G",
                "LONGUE K"
            ]
        },
        {
            "nom": "MAQUEREAU",
            "calibres": [
                "PETIT",
                "MOYEN",
                "GROS",
                "MIXTE"
            ]
        },
        {
            "nom": "MERLAN",
            "calibres": [
                "MERLAN"
            ]
        },
        {
            "nom": "MERLUZA",
            "calibres": [
                "MERLUZA",
                "MERLUZA M",
                "MERLUZA P",
                "MERLUZA SC",
                "MERLUZA MIX",
                "MERLUZA GG",
                "MERLUZA G",
                "MERLUZA 00SC",
                "MERLUZA 0SC",
                "MERLUZA X",
                "MERLUZA CC GG",
                "MERLUZA MIX CC",
                "MERLUZA CC G",
                "MERLUZA CC",
                "MERLAN FILET"
            ]
        },
        {
            "nom": "MOSTEL",
            "calibres": [
                "SALMONETE",
                "SALMONETTE G",
                "SALMONETTE M"
            ]
        },
        {
            "nom": "MOULE",
            "calibres": [
                "CHERNE",
                "CHERNE G",
                "CHERNE SC",
                "CHERNE GGG"
            ]
        },
        {
            "nom": "PALOMA",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "PAMPANO",
            "calibres": [
                "PAMPANO"
            ]
        },
        {
            "nom": "PARGO",
            "calibres": [
                "PARGO G",
                "PARGO P",
                "PARGO",
                "PARGO M",
                "PARGO KG",
                "PETIT PAGEOT"
            ]
        },
        {
            "nom": "PASSAMAR",
            "calibres": [
                "CHOCO G",
                "CHOCO M",
                "CHOCO P",
                "CHOCO 2P",
                "CHOCO 3P",
                "CHOCO 4P",
                "CHOCO MIX",
                "CHOCO 2P (2° CLS)",
                "CHOCO MIX (2° CLS)",
                "CHOCO GM",
                "CHOCO MM",
                "CHOCO PM",
                "CHOCO 2PM",
                "CHOCO ROTO"
            ]
        },
        {
            "nom": "PELAGIQUES",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "PELUDA",
            "calibres": [
                "EUR-MIX"
            ]
        },
        {
            "nom": "PESCADILLA",
            "calibres": [
                "TAKO 1",
                "TAKO 2",
                "TAKO 3",
                "TAKO 4",
                "TAKO 5",
                "TAKO 6",
                "TAKO 7",
                "TAKO 8",
                "TAKO 9",
                "TAKO 1 (2° CLS)",
                "TAKO 2 (2° CLS)",
                "TAKO 3 (2° CLS)",
                "TAKO 4 (2° CLS)",
                "TAKO 5 (2° CLS)",
                "TAKO 6 (2° CLS)",
                "TAKO 7 (2° CLS)",
                "TAKO 8 (2° CLS)",
                "TAKO-GG",
                "TAKO-G"
            ]
        },
        {
            "nom": "PINTA ROJA",
            "calibres": [
                "PINTA ROJA"
            ]
        },
        {
            "nom": "POTON",
            "calibres": [
                "GG",
                "G",
                "M",
                "P",
                "2P",
                "3P",
                "4P",
                "MX",
                "TUBE",
                "TENTACULE",
                "COURONNE"
            ]
        },
        {
            "nom": "POULPE",
            "calibres": [
                "TAKO 1",
                "TAKO 2",
                "TAKO 3",
                "TAKO 4",
                "TAKO 5",
                "TAKO 6",
                "TAKO 7",
                "TAKO 8",
                "TAKO 9",
                "TAKO 1 (2° CLS)",
                "TAKO 2 (2° CLS)",
                "TAKO 3 (2° CLS)",
                "TAKO 4 (2° CLS)",
                "TAKO 5 (2° CLS)",
                "TAKO 6 (2° CLS)",
                "TAKO 7 (2° CLS)",
                "TAKO 8 (2° CLS)",
                "TAKO-GG",
                "TAKO-G"
            ]
        },
        {
            "nom": "PULUDA",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "RAPE",
            "calibres": [
                "RAPE",
                "LA LOTTE",
                "FOGO NIGRO"
            ]
        },
        {
            "nom": "RASCASIO",
            "calibres": [
                "RASCASIO",
                "FILET RASCASE"
            ]
        },
        {
            "nom": "RATA",
            "calibres": [
                "RATA S/C",
                "RATA R",
                "RATA P",
                "FILET RATA"
            ]
        },
        {
            "nom": "RAYA",
            "calibres": [
                "RAYA S/C",
                "RAYA R",
                "RAYA G SC",
                "RAYA P SC",
                "RAYA M SC"
            ]
        },
        {
            "nom": "REKODAY",
            "calibres": [
                "REKODAY"
            ]
        },
        {
            "nom": "RENKO",
            "calibres": [
                "RATA S/C",
                "RATA R",
                "RATA P",
                "FILET RATA"
            ]
        },
        {
            "nom": "RONCADOR",
            "calibres": [
                "RONCADOR"
            ]
        },
        {
            "nom": "RONCADOR KG",
            "calibres": [
                "ACEDIA KG"
            ]
        },
        {
            "nom": "ROQUERA",
            "calibres": [
                "ROQUERA",
                "ROQUERA G",
                "ROQUERA M",
                "ROQUERA MIX",
                "ROQUERA GG"
            ]
        },
        {
            "nom": "SABLE",
            "calibres": [
                "SABLE",
                "SABLE TRANCHE"
            ]
        },
        {
            "nom": "SALMONE",
            "calibres": [
                "SALMONE",
                "SALMON S/C"
            ]
        },
        {
            "nom": "SALMONETE",
            "calibres": [
                "SALMONETE",
                "SALMONETTE G",
                "SALMONETTE M",
                "SALMONETTE P",
                "SALMONETTE MIX"
            ]
        },
        {
            "nom": "SAMA PLUMA",
            "calibres": [
                "SAMA PLUMA G",
                "SAMA PLUMA M",
                "SAMA PLUMA GGG",
                "SAMA PLUMA GG"
            ]
        },
        {
            "nom": "SAMPIETRO",
            "calibres": [
                "SAMPIETRO S/C",
                "SAMPIETRO G",
                "SAMPIETRO M",
                "SAMPIETRO P",
                "SAMPIETRO R",
                "SAMPIER P/R",
                "SAMPIER",
                "SAMPIETRO G S/C",
                "SAMPIETRO M S/C",
                "SAMPIETRO P S/C",
                "FILLET SAMPIETRO",
                "SAMPIETRO MIX S/C"
            ]
        },
        {
            "nom": "SARDINE",
            "calibres": [
                "PETIT",
                "MOYEN",
                "GROS",
                "MIXTE"
            ]
        },
        {
            "nom": "SARGO",
            "calibres": [
                "SARGO G",
                "SARGO M",
                "SARGO P",
                "SARGO",
                "SARGO MIX",
                "SARGO PF",
                "SARGO MF",
                "SARGO GF"
            ]
        },
        {
            "nom": "SARGO KG",
            "calibres": [
                "RONCADOR KG"
            ]
        },
        {
            "nom": "SAUMON",
            "calibres": [
                "SAUMON PAVE",
                "SAUMON FUMÉ",
                "SAUMON MIETTES"
            ]
        },
        {
            "nom": "SEPIA",
            "calibres": [
                "MONGO 1",
                "MONGO 2",
                "MONGO 3",
                "MONGO 4",
                "MONGO 5",
                "MONGO 6",
                "MONGO 7",
                "MONGO 8",
                "MONGO MX",
                "MONGO 1 (2°CLS)",
                "MONGO 2 (2°CLS)",
                "MONGO 3 (2°CLS)",
                "MONGO 4 (2°CLS)",
                "MONGO 5 (2°CLS)",
                "MONGO 6 (2°CLS)",
                "MONGO 7 (2°CLS)",
                "MONGO 8 (2°CLS)",
                "MONGO 6M",
                "MONGO 7M"
            ]
        },
        {
            "nom": "SEPIOLA",
            "calibres": [
                "SEPIOLA",
                "SEPIOLA G",
                "SEPIOLA M",
                "SEPIOLA P",
                "SEPIOLA NETTOYER",
                "OEUF DE SEICHE"
            ]
        },
        {
            "nom": "SOLE",
            "calibres": [
                "SOLETTE",
                "SOLE LONG G",
                "SOLE TIGRE",
                "SOLE LONG M",
                "SOLE LONG P",
                "SOLE TIGRE MIXTE",
                "SOLE",
                "SOLE LONG MIXTE",
                "SOLE LONG 100/200",
                "SOLE LONG 200/300",
                "SOLE LONG 300/400",
                "SOLE LONG 400/500",
                "SOLE LONG +500",
                "SOLE TURBO",
                "SOLE N.c",
                "SOLETTE 12KG",
                "SOLETTE 20KG",
                "SOLETTE 15KG",
                "SOLE TIGRE 300/400"
            ]
        },
        {
            "nom": "SOYA",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "SPRING ROLL PASTRY",
            "calibres": [
                "1",
                "2",
                "3",
                "4"
            ]
        },
        {
            "nom": "ST PIERRE",
            "calibres": [
                "ST PIERRE",
                "ST PIERRE S/C",
                "ST PIERRE P",
                "ST PIERRE M",
                "ST PIERRE G",
                "ST PIERRE S/C P",
                "ST PIERRE S/C M",
                "ST PIERRE S/C G"
            ]
        },
        {
            "nom": "SURIMI",
            "calibres": [
                "LANGOUSTE 300/500",
                "LANGOUSTE",
                "CIGALA"
            ]
        },
        {
            "nom": "TAKO MIX",
            "calibres": [
                "SAUMON PAVE",
                "SAUMON FUMÉ",
                "SAUMON MIETTES"
            ]
        },
        {
            "nom": "THON",
            "calibres": [
                "FILET CRABE"
            ]
        },
        {
            "nom": "VARIOS",
            "calibres": [
                "VARIOUS/AF",
                "QUINOA SALAD",
                "GYOZA SEA FOOD",
                "GYOZA VEGETABLE",
                "GYOZA TOFU",
                "GYOZA QUINOA",
                "GYOZA MINI SPING",
                "HARKAO",
                "SIMOSA VEGETABLE",
                "SPING PRIMOVRS",
                "LA DINDE",
                "BONITE",
                "MERLAN",
                "MERLAN HGT"
            ]
        },
        {
            "nom": "VERRUGATO",
            "calibres": [
                "VERRUGATTO"
            ]
        }
    ],
    parametres: {
      salaireHoraireOcc: 17.92,
      heuresMensuelles: 191,
      tarifHP: 1.45,   // Heures de Pointe (18h-22h)
      tarifHPl: 1.15,  // Heures Pleines (07h-18h)
      tarifHC: 0.85,   // Heures Creuses (22h-07h)
      tvaEnergetique: 0.14, // 14% TVA sur l'électricité
      taxeCollectivite: 0.01, // Taxe collectivité locale (estimée)
      redevancePuissance: 17087.58,
      redevanceEntretien: 391.20,
      redevanceLocation: 215.05,
      puissanceKVA: 400,
      coutCarburant: 300,
      coutPersonnelLogistique: 4000,
      salaireQualite: 9000,
      salaireAdmin: 25000,
      coutStructureEstime: 1.50, // Fallback si pas de factures saisies
      geminiApiKey: '',
      groqApiKey: '',
      openRouterApiKey: '',
      productivityTarget: 25, // KG per hour target
      yieldTargets: {
        'OCTOPUS': 75,
        'SEICHE': 72,
        'CALAMAR': 78,
        'CREVETTE': 45,
        'DEFAULT': 70
      }
    },
    production: [],
    mouvementsStock: [],
    energieMensuelle: {},
    stockage: [],
    sortiesStockage: [],
    qrCodes: [],
    factures: [],
    clients: [
          {
                "nom": "FISH & FOOD TRAITE...",
                "type": "Client , Fournisseur poisson, Usine de traitement...",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "FISH AND FOOD PROC...",
                "type": "Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "LAMBDA FISH SUD",
                "type": "Client , Fournisseur poisson",
                "ville": "Dakhla",
                "bateaux": []
          },
          {
                "nom": "4A LOGISTIC",
                "type": "Frigo",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "A.O.C",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "ESSALAM 1",
                            "type": "Congelateur",
                            "agrement": "CO 8801"
                      },
                      {
                            "nom": "ESSALAM 2",
                            "type": "Congelateur",
                            "agrement": "CO 8502"
                      }
                ]
          },
          {
                "nom": "ADAM INDUSTRIES",
                "type": "Fournisseur divers achats",
                "ville": "Casablanca",
                "bateaux": []
          },
          {
                "nom": "AGADIR ICE",
                "type": "Frigo",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "AGORAPOLIS",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "AIT MELLOUL CHIMIE...",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "ALIA PECHE",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "LE VIZIR",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "EL KHALIFA",
                            "type": "Congelateur",
                            "agrement": "CO 1901"
                      }
                ]
          },
          {
                "nom": "ARCADE EQUIPEMENT",
                "type": "Fournisseur divers achats",
                "ville": "Casablanca",
                "bateaux": []
          },
          {
                "nom": "ARCHI FOOD",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "AMGHASS 1",
                            "type": "Congelateur",
                            "agrement": "CO 6306"
                      }
                ]
          },
          {
                "nom": "ASMAK KHALIL ADAM",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "KENZA 3",
                            "type": "Congelateur",
                            "agrement": "CO 2703"
                      }
                ]
          },
          {
                "nom": "ASMAK RAHAL",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "AGDAL 2",
                            "type": "Congelateur",
                            "agrement": "CO 1002"
                      },
                      {
                            "nom": "AL FARAZDAK",
                            "type": "Congelateur",
                            "agrement": "CO 3205"
                      },
                      {
                            "nom": "AL YACOUBI",
                            "type": "Congelateur",
                            "agrement": "CO 3212"
                      }
                ]
          },
          {
                "nom": "ATLANTIC FISH MORO...",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "AGDAL 1",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AGDAL 3",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL BAIROUMI",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL HAMADANI",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL KENDY",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL HARIRI",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL MESSAOUDI",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL KHAWARIZMY",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "ATLANTIC FISH SUD",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "IBNOU NOUASS",
                            "type": "Congelateur",
                            "agrement": "CO 3214"
                      },
                      {
                            "nom": "MASSIRA 6",
                            "type": "Congelateur",
                            "agrement": "CO 0501"
                      },
                      {
                            "nom": "MASSIRA 7",
                            "type": "Congelateur",
                            "agrement": "CO 0502"
                      },
                      {
                            "nom": "MASSIRA 8",
                            "type": "Congelateur",
                            "agrement": "CO 0503"
                      },
                      {
                            "nom": "AGDAL 4",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "ATLANTIC GAMBA SUD...",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Boujdour",
                "bateaux": [
                      {
                            "nom": "LA ROJA-1",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "AVENIR NEGOCE",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "BIOB SHRIMP",
                "type": "Armateur, Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "LILIA",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "MARANTARTINCO 2",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "CEPHALOPECHE",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "BRAHAM 2",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "ASSA ZAK",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "ALBERTO 2",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AFOUDRAR",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "DAR RAHA",
                "type": "Frigo",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "DARAA PRODUCT",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "DEEP BLEU",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "KENZ AL ATLAS",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AARK SOUSS",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "SAYAD",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "KENZ ERRIF",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "MOUSSALIM",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "HITA",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "KSAR AL BAHR",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "DIVERS/DEEP BLEU",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "AL MANAR 2",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "DHAF PESCA",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "MANSOUR EDDAHBI",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "YAKOUB AL MANSOUR",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "DIVERS",
                "type": "Armateur, Client , Fournisseur poisson, Consignat...",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "DIVERS",
                            "type": "Frais",
                            "agrement": ""
                      },
                      {
                            "nom": "IMPORT",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "ECO PELAGIQUE (HAM...",
                "type": "Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "ESSAIES ASMAK SUD",
                "type": "Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "FAST MOSK",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "FENNEC PECHE",
                "type": "Armateur, Fournisseur poisson, Fournisseur divers...",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "FILAKA PECHE",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "FILAKA 1",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "FILAKA 2",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "FILAKA 3",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "FILAKA 4",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "FREIRIE MAR",
                "type": "Armateur, Client",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "GEFS",
                "type": "Frigo",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "GPC PAPIER ET CAR...",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "GRAPHIC INO",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "GREAT SIDE CONSIGN...",
                "type": "Consignataire",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "GUADAZUL",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "AL BOUKHARI",
                            "type": "Congelateur",
                            "agrement": "CO 0402"
                      },
                      {
                            "nom": "AL GHAZALI",
                            "type": "Congelateur",
                            "agrement": "CO 0401"
                      },
                      {
                            "nom": "IBN SINA",
                            "type": "Congelateur",
                            "agrement": "CO 8602"
                      },
                      {
                            "nom": "IBN ROCHD",
                            "type": "Congelateur",
                            "agrement": "CO 8601"
                      },
                      {
                            "nom": "KENZA 2",
                            "type": "Congelateur",
                            "agrement": "CO 2702"
                      },
                      {
                            "nom": "SIP II",
                            "type": "Congelateur",
                            "agrement": "CO 5702"
                      }
                ]
          },
          {
                "nom": "HAI SHENG FISHERIE...",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "TALOUMA 1",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "TALOUMA 2",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "HAIFEN FROID",
                "type": "Frigo",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "HAIFEN-FISHERIES",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "NAMIA 1",
                            "type": "Congelateur",
                            "agrement": "CO 5301"
                      },
                      {
                            "nom": "NAMIA 10",
                            "type": "Congelateur",
                            "agrement": "CO 5001"
                      }
                ]
          },
          {
                "nom": "HAJ HAMID",
                "type": "Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "HAKIM ETTOUHAMY",
                "type": "Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "HANDLING SERVICES",
                "type": "Consignataire",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "HYGITECH 3D SARL",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "IDF",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "IBNOU AL KHATIB",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "IDOU PESCA",
                "type": "Fournisseur poisson, Usine de traitement, Frigo",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "IDOU PESCA",
                            "type": "Usine",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "IGUER NEGOCE",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "ISKA PESCA",
                "type": "Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "JEAN DUFLOT",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "KHALID FISHERIES",
                "type": "Armateur, Client , Fournisseur poisson",
                "ville": "Agadir",
                "bateaux": [
                      {
                            "nom": "ANZAR 1",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "TAMEGRA",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "IGOUDAR",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "TILILA",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "TODRA",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "ALICANTE",
                            "type": "Congelateur",
                            "agrement": ""
                      },
                      {
                            "nom": "KELTI",
                            "type": "Congelateur",
                            "agrement": ""
                      }
                ]
          },
          {
                "nom": "KITEA GEANT AGADIR...",
                "type": "Fournisseur divers achats",
                "ville": "Agadir",
                "bateaux": []
          },
          {
                "nom": "KMT CODING",
                "type": "Fournisseur divers achats",
                "ville": "Casablanca",
                "bateaux": []
          }
    ],
    pendingStorageEntries: [],
  },

  // --- Init ---
  getHeuresJour(dateStr, filterActivite = null) {
    if(!this.data.pointage) return { hOcc: 0, hFixe: 0, occCount: 0, fixeCount: 0 };
    const monthStr = dateStr.substring(0, 7);
    const ptg = this.data.pointage[monthStr];
    if(!ptg || !ptg.jours || !ptg.jours[dateStr]) return { hOcc: 0, hFixe: 0, occCount: 0, fixeCount: 0 };
    
    let hOcc = 0, hFixe = 0;
    let occCount = 0, fixeCount = 0;
    const day = ptg.jours[dateStr];
    
    // On récupère toutes les présences (anciennes directes ou nouvelles dans 'fiches')
    let allPresences = [];
    if (day.fiches && day.fiches.length > 0) {
      day.fiches.forEach(f => {
        if (!filterActivite || f.activite.toUpperCase() === filterActivite.toUpperCase()) {
          allPresences = allPresences.concat(f.presences || []);
        }
      });
    } else if (day.presences) {
      allPresences = day.presences.filter(p => !filterActivite || (p.activite && p.activite.toUpperCase() === filterActivite.toUpperCase()));
    }
    
    allPresences.forEach(p => {
      const emp = this.data.personnel.find(e => e.id === p.personnelId);
      if(emp) {
        if(emp.type === 'occasionnel' && p.heures > 0) {
          hOcc += p.heures;
          occCount++;
        } else if(emp.type === 'ouvrier_fixe' && p.heures > 0) {
          hFixe += p.heures;
          fixeCount++;
        }
      }
    });
    
    return { hOcc, hFixe, occCount, fixeCount };
  },

  getFinancialAllocation(dateStr) {
    if (!this.data.parametres) return { dailyFixed: 0, avgTariff: 1.15 };
    const p = this.data.parametres;
    
    // 1. Calculate Monthly Fixed Base from Personnel
    const adminSalaries = (this.data.personnel || []).filter(emp => emp.type === 'fixe_admin' && emp.actif).reduce((s, emp) => s + (emp.salaire || 0), 0);
    const otherSalaries = (this.data.personnel || []).filter(emp => emp.type === 'fixe_autre' && emp.actif).reduce((s, emp) => s + (emp.salaire || 0), 0);
    
    // 26 working days for daily allocation
    const dailyFixed = (adminSalaries + otherSalaries) / 26;
    
    // 2. Average ONEE Tariff
    const avgTariff = ((p.tarifHP || 1.45) + (p.tarifHPl || 1.15) + (p.tarifHC || 0.85)) / 3;
    
    return { dailyFixed, avgTariff };
  },

  async init() {
    console.log("🚀 Initialisation App...");
    this.initSupabase();
    await this.loadData();
    this.updateHeaderDate();
    this.navigate('dashboard');
    this.updateAlertsBadge();
    setInterval(() => this.updateHeaderDate(), 60000);
  },

  initSupabase() {
    if (typeof supabase !== 'undefined') {
      this.supabase = supabase.createClient(this.sbUrl, this.sbKey);
      console.log("✅ Supabase Client Initialisé");
    } else {
      console.warn("⚠️ Supabase JS non chargé");
    }
  },

  // --- Storage ---
  async loadData() {
    // Toujours initialiser avec les valeurs par défaut pour éviter les erreurs de nullité
    this.data = JSON.parse(JSON.stringify(this.defaults));

    // 1. Charger d'abord depuis localStorage (Fallback / Cache)
    const saved = localStorage.getItem('gestprod_data');
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        // Migration logic pour les nouveaux réglages
        if (!this.data.parametres) this.data.parametres = { ...this.defaults.parametres };
        if (this.data.parametres.groqApiKey === undefined) this.data.parametres.groqApiKey = this.defaults.parametres.groqApiKey;
        if (this.data.parametres.openRouterApiKey === undefined) this.data.parametres.openRouterApiKey = this.defaults.parametres.openRouterApiKey;
        console.log("📂 Données locales chargées");
      } catch (err) {
        console.error('Données locales corrompues, réinitialisation.', err);
        this.data = JSON.parse(JSON.stringify(this.defaults));
      }
    }

    // 2. Tenter de charger depuis Supabase (Source de Vérité)
    if (this.supabase) {
      try {
        console.log("📥 Synchronisation avec Supabase...");
        const tables = ['personnel', 'production', 'stockage', 'factures', 'clients', 'consommables', 'sortiesStockage', 'mouvementsStock', 'qrCodes'];
        const results = await Promise.all([
          this.supabase.from('settings').select('*').eq('id', 'global').maybeSingle(),
          this.supabase.from('pointage').select('*'),
          ...tables.map(t => this.supabase.from(t).select('*'))
        ]);

        const [settings, pointage, ...others] = results;

        let hasCloudData = false;

        if (settings.data && settings.data.data) {
          this.data.parametres = settings.data.data;
          hasCloudData = true;
        }
        
        tables.forEach((tableName, index) => {
          const result = others[index];
          if (result && result.data && result.data.length > 0) {
            this.data[tableName] = result.data;
            hasCloudData = true;
            console.log(`✅ Table '${tableName}' hydratée depuis le cloud (${result.data.length} lignes)`);
          }
        });

        if (pointage.data && pointage.data.length > 0) {
          this.data.pointage = {};
          pointage.data.forEach(p => {
            if (!this.data.pointage[p.date]) this.data.pointage[p.date] = {};
            this.data.pointage[p.date][p.employee_id] = p.hours;
          });
          hasCloudData = true;
          console.log(`✅ Pointage hydraté (${pointage.data.length} entrées)`);
        }

        if (!hasCloudData && saved) {
          console.log("☁️ Supabase est vide. Déclenchement de la migration vers le cloud...");
          this.syncToSupabase();
        } else {
          console.log("🚀 Données Cloud à jour.");
        }

        // Mettre à jour le cache local avec ce qu'on a récupéré du cloud
        localStorage.setItem('gestprod_data', JSON.stringify(this.data));
        return;
      } catch (err) {
        console.error("❌ Erreur critique Supabase (chargement):", err);
      }
    }

    // Ensure all keys exist
    for (const key in this.defaults) {
      if (!(key in this.data)) this.data[key] = JSON.parse(JSON.stringify(this.defaults[key]));
    }

    // Force sync of new detailed especes (Version 4)
    if (!localStorage.getItem('gestprod_v8_ntsamak_especes_v4_force')) {
      this.data.especes = JSON.parse(JSON.stringify(this.defaults.especes));
      localStorage.setItem('gestprod_v8_ntsamak_especes_v4_force', 'true');
      this.saveData();
    }
    // Force sync of full scraped clients (Version 4)
    if (!localStorage.getItem('gestprod_v8_ntsamak_clients_v4_force')) {
      this.data.clients = JSON.parse(JSON.stringify(this.defaults.clients));
      localStorage.setItem('gestprod_v8_ntsamak_clients_v4_force', 'true');
      this.saveData();
    }
    // Force sync of personnel from Excel import
    if (!localStorage.getItem('gestprod_v8_personnel_excel_force')) {
      this.data.personnel = JSON.parse(JSON.stringify(this.defaults.personnel));
      localStorage.setItem('gestprod_v8_personnel_excel_force', 'true');
      this.saveData();
    }
    
    // Patch: Force taux horaire occasionnel à 16.95
    if (this.data.parametres && (this.data.parametres.salaireHoraireOcc === 17 || this.data.parametres.salaireHoraireOcc === 16.8)) {
      this.data.parametres.salaireHoraireOcc = 16.95;
      this.saveData();
    }

    // Senior Control Migration (V9)
    if (!localStorage.getItem('gestprod_v9_senior_control_init')) {
      if (!this.data.parametres) this.data.parametres = {};
      if (this.data.parametres.productivityTarget === undefined) this.data.parametres.productivityTarget = 25;
      if (!this.data.parametres.yieldTargets) {
        this.data.parametres.yieldTargets = {
          'OCTOPUS': 75,
          'SEICHE': 72,
          'CALAMAR': 78,
          'CREVETTE': 45,
          'DEFAULT': 70
        };
      }
      localStorage.setItem('gestprod_v9_senior_control_init', 'true');
      this.saveData();
    }

    // Enterprise Cockpit Migration (V10)
    if (!localStorage.getItem('gestprod_v10_enterprise_init')) {
      if (!this.data.parametres.stockCapacityTotal) this.data.parametres.stockCapacityTotal = 1200;
      if (this.data.parametres.marginTarget === undefined) this.data.parametres.marginTarget = 15;
      if (this.data.parametres.fixedCostTarget === undefined) this.data.parametres.fixedCostTarget = 3000;
      
      // Sync prices for species
      this.data.especes.forEach(esp => {
        if (esp.prixMoyenVente === undefined) {
          const def = this.defaults.especes.find(e => e.nom === esp.nom);
          esp.prixMoyenVente = def ? (def.prixMoyenVente || 50) : 50;
        }
      });
      
      localStorage.setItem('gestprod_v10_enterprise_init', 'true');
      this.saveData();
    }
  },

  saveData() {
    // 1. Sauvegarde locale immédiate (Performance + Offline fallback)
    localStorage.setItem('gestprod_data', JSON.stringify(this.data));
    this.updateAlertsBadge();
    
    // 2. Synchronisation Supabase en arrière-plan
    this.syncToSupabase();
  },

  async syncToSupabase() {
    if (!this.supabase) return;

    try {
      console.log("☁️ Début synchronisation arrière-plan...");
      
      // 1. Settings
      await this.supabase.from('settings').upsert({ id: 'global', data: this.data.parametres });

      // 2. Pointage (Transformation)
      if (this.data.pointage) {
        const pointages = [];
        for (const date in this.data.pointage) {
          for (const empId in this.data.pointage[date]) {
            pointages.push({
              date: date,
              employee_id: parseInt(empId),
              hours: parseFloat(this.data.pointage[date][empId]) || 0
            });
          }
        }
        if (pointages.length > 0) {
          // Chunking for pointage if very large
          const chunkSize = 1000;
          for (let i = 0; i < pointages.length; i += chunkSize) {
            await this.supabase.from('pointage').upsert(pointages.slice(i, i + chunkSize));
          }
        }
      }

      // 3. Simple Array Tables
      const arrayTables = ['personnel', 'production', 'stockage', 'factures', 'clients', 'consommables', 'sortiesStockage', 'mouvementsStock', 'qrCodes'];
      
      for (const table of arrayTables) {
        if (Array.isArray(this.data[table]) && this.data[table].length > 0) {
          const { error } = await this.supabase.from(table).upsert(this.data[table]);
          if (error) {
            console.error(`❌ Erreur sync table '${table}':`, error.message);
          } else {
            console.log(`✅ Table '${table}' synchronisée.`);
          }
        }
      }

      console.log("✅ Synchronisation réussie.");
    } catch (err) {
      console.error("❌ Erreur critique Sync Supabase:", err);
    }
  },

  resetData() {
    if (confirm('⚠️ Voulez-vous vraiment réinitialiser TOUTES les données ? Cette action est irréversible.')) {
      this.data = JSON.parse(JSON.stringify(this.defaults));
      this.saveData();
      this.navigate(this.currentPage);
      this.toast('Données réinitialisées', 'info');
    }
  },

  exportData() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestprod_backup_${this.formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('Données exportées avec succès', 'success');
  },

  importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
          throw new Error('Format racine invalide');
        }
        const merged = JSON.parse(JSON.stringify(this.defaults));
        for (const key in imported) merged[key] = imported[key];
        ['stockage', 'production', 'consommables', 'personnel', 'factures', 'sortiesStockage', 'mouvementsStock', 'qrCodes'].forEach(key => {
          if (!Array.isArray(merged[key])) throw new Error(`Table ${key} invalide`);
        });
        this.data = merged;
        this.saveData();
        this.navigate(this.currentPage);
        this.toast('Données importées avec succès', 'success');
      } catch (err) {
        this.toast('Erreur: fichier invalide', 'error');
      }
    };
    reader.readAsText(file);
  },

  // --- Navigation ---
  navigate(page) {
    this.currentPage = page;
    // Auto-close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    const titles = {
      dashboard: 'Tableau de bord',
      stockage: 'Réception / Stockage',
      chambres: 'Plan des Chambres',
      saisie: 'Saisie Journalière',
      personnel: 'Gestion du Personnel',
      consommables: 'Gestion des Consommables',
      energie: 'Analyse Énergétique',
      rapports: 'Rapports',
      parametres: 'Paramètres',
      facturation: 'Facturation & Charges',
      qrcodes: 'Gestion des QR Codes',
    };
    document.getElementById('headerTitle').textContent = titles[page] || page;

    const content = document.getElementById('pageContent');
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><div>Chargement...</div></div>';

    // Small delay for smooth transition
    setTimeout(() => {
      switch (page) {
        case 'dashboard': Dashboard.render(); break;
        case 'stockage': Stockage.render(); break;
        case 'chambres': Chambres.render(); break;
        case 'saisie': Saisie.render(); break;
        case 'personnel': Personnel.render(); break;
        case 'consommables': Consommables.render(); break;
        case 'energie': Energie.render(); break;
        case 'facturation': Facturation.render(); break;
        case 'rapports': Rapports.render(); break;
        case 'parametres': Parametres.render(); break;
        case 'qrcodes': QRCodes.render(); break;
      }
    }, 50);
  },

  // --- Alerts ---
  getAlerts() {
    const alerts = [];
    (this.data.consommables || []).forEach(c => {
      if (c.stock <= c.seuilCritique) {
        alerts.push({ type: 'critical', message: `${c.nom} : stock critique (${c.stock} ${c.unite})` });
      } else if (c.stock <= c.seuilAlerte) {
        alerts.push({ type: 'warning', message: `${c.nom} : stock bas (${c.stock} ${c.unite})` });
      }
    });
    return alerts;
  },

  updateAlertsBadge() {
    const alerts = this.getAlerts();
    const badge = document.getElementById('navBadgeConsommables');
    const dot = document.getElementById('alertDot');
    const criticals = alerts.filter(a => a.type === 'critical').length;
    const total = alerts.length;
    if (badge) {
      badge.style.display = total > 0 ? 'inline' : 'none';
      badge.textContent = total;
    }
    if (dot) dot.style.display = total > 0 ? 'block' : 'none';
  },

  // --- Toast ---
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  },

  // --- Helpers ---
  formatDate(d) {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  },

  formatDateISO(d) {
    if (!d) return new Date().toISOString().split('T')[0];
    // Gestion du format JJ/MM/AAAA
    if (typeof d === 'string' && d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    try {
      const date = d instanceof Date ? d : new Date(d);
      return date.toISOString().split('T')[0];
    } catch(e) {
      return new Date().toISOString().split('T')[0];
    }
  },

  formatDateFR(d) {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  formatNumber(n, decimals = 2) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },

  updateHeaderDate() {
    const el = document.getElementById('headerDate');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  },

  getMonthProduction(year, month) {
    return (this.data.production || []).filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  getCurrentMonthProduction() {
    const now = new Date();
    return this.getMonthProduction(now.getFullYear(), now.getMonth());
  },

  nextId(arr) {
    if (!arr || arr.length === 0) return 1;
    return Math.max(...arr.map(i => i.id || 0)) + 1;
  },

  // --- Modal helper ---
  showModal(title, bodyHtml, footerHtml) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  },

  closeModal() {
    const m = document.querySelector('.modal-overlay');
    if (m) m.remove();
  },

  // --- AI Centralization ---
  AI: {
    async analyzeImage(file, prompt) {
      const p = App.data.parametres;
      
      // Nettoyage de sécurité
      if (App.data.bestAiModel && (App.data.bestAiModel.includes('2.5') || App.data.bestAiModel.includes('3.1'))) {
        App.data.bestAiModel = null;
      }

      // 1. OPENROUTER - Priorité aux modèles gratuits généreux (Groq/Gemma via OpenRouter)
      if (p?.openRouterApiKey) {
        const models = [
          "meta-llama/llama-3.2-11b-vision-instruct:free", // Rapide et efficace
          "google/gemma-4-31b-it:free",                   // Nouveau 2026
          "google/gemma-4-26b-a4b-it:free",               // Nouveau 2026
          "openrouter/auto"                                // Routeur automatique intelligent
        ];
        
        for (const modelId of models) {
          try {
            console.log(`Tentative OpenRouter avec : ${modelId}`);
            return await this.analyzeWithOpenRouter(file, prompt, modelId);
          } catch (error) {
            console.warn(`Modèle ${modelId} échoué, essai suivant...`);
          }
        }
      }

      // 2. GEMINI DIRECT - En dernier recours car quota limité (2/min)
      if (p?.geminiApiKey) {
        try {
          return await this.analyzeWithGemini(file, prompt);
        } catch (error) {
          console.warn("Gemini Direct failed.", error);
        }
      }

      throw new Error("Désolé, tous les services IA sont actuellement surchargés. Réessayez dans 1 minute.");
    },

    async analyzeWithGemini(file, prompt) {
      const apiKey = App.data.parametres?.geminiApiKey;
      if (!App.data.bestAiModel) {
        try {
          const mRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const mData = await mRes.json();
          if (mData.models) {
             const available = mData.models.filter(m => 
                m.supportedGenerationMethods?.includes("generateContent") && 
                m.name.includes("gemini") &&
                (m.name.includes("1.5-flash") || m.name.includes("2.0-flash") || m.name.includes("1.5-pro"))
             );
             const pref = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];
             for (let p of pref) {
               const found = available.find(m => m.name.includes(p));
               if (found) { App.data.bestAiModel = found.name.split('/').pop(); break; }
             }
             if (!App.data.bestAiModel && available.length > 0) {
                 App.data.bestAiModel = available[0].name.split('/').pop();
             }
          }
        } catch(e) {}
      }
      const targetModel = App.data.bestAiModel || "gemini-1.5-flash";

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: file.type || "image/jpeg", data: base64Data } }] }]
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || "Gemini Error");
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return this.parseAIResponse(text);
    },

    async analyzeWithOpenRouter(file, prompt, model = "google/gemini-flash-1.5") {
      const apiKey = App.data.parametres?.openRouterApiKey;
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ELABBAR ERP'
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt + " \nIMPORTANT: Tu es un système d'extraction. Réponds UNIQUEMENT par un objet JSON. Si c'est une fiche manuscrite avec des noms d'employés et des heures, classe-la impérativement en 'PERSONNEL'." },
              { type: "image_url", image_url: { url: base64Data } }
            ]
          }],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || "OpenRouter Error");
      }
      const res = await response.json();
      if (!res.choices || res.choices.length === 0) throw new Error("OpenRouter: Réponse vide");
      const text = res.choices[0].message.content;
      return this.parseAIResponse(text);
    },

    parseAIResponse(text) {
      if (!text) throw new Error("Réponse vide.");
      
      // Nettoyage radical : on cherche le premier '{' et le dernier '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonContent = text.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(jsonContent);
        } catch (e) {
          console.error("Extraction JSON échouée sur :", jsonContent);
          throw new Error("Format JSON corrompu dans la réponse IA.");
        }
      }
      
      throw new Error("Aucun objet JSON trouvé dans la réponse IA.");
    },

    showOverlay(text = "Analyse en cours...") {
      const overlay = document.createElement('div');
      overlay.id = 'ai-overlay';
      overlay.className = 'ai-scan-overlay';
      overlay.innerHTML = `
        <div class="ai-scan-content">
          <div class="ai-scan-scanner"></div>
          <div class="ai-scan-icon">🤖</div>
          <div class="ai-scan-text">${text}</div>
          <div class="ai-scan-subtext">L'Intelligence Artificielle traite votre document...</div>
        </div>
      `;
      document.body.appendChild(overlay);
    },

    hideOverlay() {
      const el = document.getElementById('ai-overlay');
      if (el) el.remove();
    },

    initGlobalScan() {
      const input = document.getElementById('globalAiScanInput');
      if (input) input.click();
    },

    async routeDocument(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        this.showOverlay("Classification du document...");
        
        // Prompt global pour classer ET extraire
        const prompt = `Analyse ce document pour l'ERP d'une usine de poisson (SEA PECHE / ELABBAR). 
Tu es l'assistant IA expert de l'ERP. Ton rôle est d'analyser ce document et d'en extraire intelligemment les informations.

Renvoie UNIQUEMENT un objet JSON avec cette structure :
{
  "category": "FACTURE | PERSONNEL | PRODUCTION | RECEPTION | CONSOMMABLE | ENERGIE",
  "data": { ... }
}

Structures de "data" par catégorie :
- FACTURE: { numero, date, fournisseur, montantHT, tva, montantTTC, devise, motif, lignes: [{ desc, qte, pu, total }] }
- PERSONNEL: { date, activite (Traitement/Reconditionnement), lignes: [{ nom, heures }] }
- PRODUCTION: { date, client, espece, calibre, poidsMP, caissesPI, poidsPF, caissesPF, produitFini, conditionnement, reliquatNom, reliquatPoids }
- RECEPTION: { bateau, client, fournisseur, date, bl_numero, lignes: [{ espece, calibre, nbCaisses, quantite }] }
- CONSOMMABLE: { fournisseur, date, lignes: [{ nom, quantite, prixUnit }] }
- ENERGIE: { type: 'facture', mois (YYYY-MM), consoHP, consoHPl, consoHC, montantTTC } ou { type: 'thermographe', temperatures: [{ zone, temp_moyenne }] }

CONSIGNES STRICTES :
1. DATES: Toujours ISO YYYY-MM-DD.
2. NOMBRES: Séparateur point (.), pas d'unités (ex: 150.5 au lieu de 150,5 kg).
3. INCONNU: Mettre null ou 0.
4. ESPECES: Utiliser les noms techniques (SEPIA, CALAMAR, POULPE).`;

        this.currentFile = file;
        const result = await this.analyzeImage(file, prompt);
        this.hideOverlay();

        if (result && result.category) {
          this.showGlobalReviewModal(result);
        } else {
          throw new Error("Impossible de classer le document.");
        }

      } catch (error) {
        this.hideOverlay();
        App.toast("Erreur de scan: " + error.message, "error");
      } finally {
        event.target.value = '';
      }
    },

    showGlobalReviewModal(result) {
      const catNames = {
        'RECEPTION': '📦 Réception / Stockage',
        'PRODUCTION': '🏭 Saisie Journalière',
        'FACTURE': '💰 Facturation & Charges',
        'CONSOMMABLE': '🛍️ Consommables',
        'PERSONNEL': '👥 Personnel',
        'ENERGIE': '⚡ Énergie & Thermographes'
      };

      const modulePages = {
        'RECEPTION': 'stockage',
        'PRODUCTION': 'saisie',
        'FACTURE': 'facturation',
        'CONSOMMABLE': 'consommables',
        'PERSONNEL': 'personnel',
        'ENERGIE': 'energie'
      };

      const catName = catNames[result.category] || result.category;
      
      let formattedDataHtml = '';
      if (result.data) {
        formattedDataHtml = '<div style="display:grid; grid-template-columns: 1fr; gap: 8px;">';
        for (const [key, value] of Object.entries(result.data)) {
          if (Array.isArray(value)) {
            formattedDataHtml += `
              <div style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
                <strong style="text-transform: capitalize; color: var(--accent-blue);">${key} :</strong>
                <div style="margin-top: 8px; display:flex; flex-direction:column; gap:6px;">
                  ${value.map(item => `
                    <div style="background: #fff; border: 1px solid #eee; border-radius: 4px; padding: 8px; font-size: 0.8rem;">
                      ${Object.entries(item).map(([k,v]) => `<span style="display:inline-block; margin-right:10px;"><b style="color:var(--text-muted);">${k}</b>: ${v}</span>`).join('')}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else if (typeof value !== 'object') {
            formattedDataHtml += `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                <span style="color: var(--text-muted); text-transform: capitalize;">${key.replace(/_/g, ' ')}</span>
                <strong style="color: var(--text-color); text-align: right;">${value}</strong>
              </div>
            `;
          }
        }
        formattedDataHtml += '</div>';
      }

      App.showModal("🤖 Scan Intelligent — " + catName, `
        <div style="padding: 10px;">
          <div class="ai-badge" style="background:var(--bg-sidebar-hover); color:var(--accent-blue); padding:10px; border-radius:8px; margin-bottom:15px; display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.5rem;">🎯</span>
            <div style="flex:1;">
              <div style="font-size:0.7rem; text-transform:uppercase; opacity:0.7; margin-bottom: 4px;">Catégorie (Modifiable)</div>
              <select class="form-select" style="background: white; border: 1px solid var(--border-color); font-weight: bold; color: var(--text-color); padding: 6px 10px; width: 100%; font-size: 0.9rem; cursor: pointer;" onchange="App.AI.reAnalyze(this.value)">
                ${Object.entries(catNames).map(([k, v]) => `<option value="${k}" ${k === result.category ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:5px;">Résumé de l'analyse</label>
            <p style="font-weight:500;">${result.summary || 'Analyse terminée avec succès.'}</p>
          </div>

          <div class="ai-data-preview" style="background:#f8fafc; border:1px solid var(--border-color); border-radius:8px; padding:12px; font-size:0.9rem;">
            ${formattedDataHtml}
          </div>
        </div>
      `, `
        <div style="display:flex; gap:12px; width:100%;">
          <button class="btn btn-primary" id="btnConfirmGlobalAI" style="flex:1;">Valider et Ouvrir le Module</button>
          <button class="btn btn-outline" onclick="App.closeModal()">Annuler</button>
        </div>
      `);

      const btn = document.getElementById('btnConfirmGlobalAI');
      if (btn) {
        btn.onclick = () => {
          App.closeModal();
          const page = modulePages[result.category];
          if (page) {
            App.navigate(page);
            // On attend le rendu de la page pour injecter les données
            setTimeout(() => {
              const moduleObj = {
                'RECEPTION': Stockage,
                'PRODUCTION': Saisie,
                'FACTURE': Facturation,
                'CONSOMMABLE': Consommables,
                'PERSONNEL': Personnel
              }[result.category];

              if (moduleObj && typeof moduleObj.applyAIData === 'function') {
                moduleObj.applyAIData(result.data);
              } else {
                App.toast("Module auto-remplissage non implémenté pour: " + result.category, "info");
              }
            }, 500);
          }
        };
      }
    },

    async reAnalyze(newCategory) {
      if (!this.currentFile) {
        App.toast("Le fichier original n'est plus en mémoire.", "error");
        return;
      }
      App.closeModal(); // Fermer la modale actuelle
      this.showOverlay("Re-analyse en cours sous: " + newCategory + "...");
      
      try {
        const prompt = `
          Tu dois re-traiter le document fourni de manière stricte comme s'il appartenait obligatoirement à la catégorie: "${newCategory}".
          Ignore ce que le document semble être visuellement, extrais les informations pour qu'elles correspondent à la structure de cette catégorie spécifique.
          
          Rappel des structures JSON obligatoires selon la catégorie :
          - RECEPTION: { "category": "RECEPTION", "summary": "...", "data": { "bateau": "", "client": "", "fournisseur": "", "date": "", "bl_numero": "", "lignes": [{ "espece": "", "calibre": "", "nbCaisses": 0, "quantite": 0.0 }] } }
          - PRODUCTION: { "category": "PRODUCTION", "summary": "...", "data": { "date": "", "lot": "", "palette": "", "client": "", "espece": "", "calibre": "", "poidsMP": 0, "caissesPI": 0, "poidsPF": 0, "caissesPF": 0, "produitFini": "", "conditionnement": "" } }
          - FACTURE: { "category": "FACTURE", "summary": "...", "data": { "numero": "", "date": "", "fournisseur": "", "montantHT": 0.0, "tva": 0.0, "montantTTC": 0.0, "devise": "MAD", "motif": "", "lignes": [{ "description": "", "quantite": 0, "prixUnitaire": 0.0, "totalLigne": 0.0 }] } }
          - CONSOMMABLE: { "category": "CONSOMMABLE", "summary": "...", "data": { "date": "", "fournisseur": "", "bl_numero": "", "lignes": [{ "nom": "", "quantite": 0, "prixUnit": 0.0, "unite": "" }] } }
          - PERSONNEL: { "category": "PERSONNEL", "summary": "...", "data": { "nom": "", "prenom": "", "poste": "", "dept": "", "salaire": 0, "date_embauche": "" } }
          - ENERGIE: { "category": "ENERGIE", "summary": "...", "data": { "type": "facture", "mois": "", "consoHP": 0, "consoHPl": 0, "consoHC": 0, "montantTTC": 0 } }

          Retourne UNIQUEMENT le JSON valide correspondant à ${newCategory}.
        `;

        const result = await this.analyzeImage(this.currentFile, prompt);
        this.hideOverlay();

        if (result && result.data) {
          result.category = newCategory; // Force category
          this.showGlobalReviewModal(result);
        } else {
          throw new Error("L'IA n'a pas pu extraire de données valides.");
        }
      } catch (error) {
        this.hideOverlay();
        App.toast("Erreur: " + error.message, "error");
      }
    },

    fuzzyMatch(text, list) {
      if (!text) return null;
      const t = text.toUpperCase().trim();
      // Exact match first
      if (list.includes(t)) return t;
      // Simple inclusion or starts with
      const match = list.find(item => t.includes(item) || item.includes(t));
      return match || t;
    }
  },

  // Chart.js destroy helper
  destroyCharts() {
    // 1. Destroy Chart.js instances if available
    if (typeof Chart !== 'undefined' && Chart.instances) {
      Object.keys(Chart.instances).forEach(key => {
        try { Chart.instances[key].destroy(); } catch(e) {}
      });
    }
    // 2. Clear App.charts tracking object
    this.charts = {};
  },
};
