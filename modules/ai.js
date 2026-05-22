/* ============================================
   AI ENGINE — Scanner OCR avec Google Gemini
   ============================================ */
App.AiEngine = {
  currentCallback: null,
  currentType: null,

  prompts: {
    'stockage': `Extrait les informations de ce bon de livraison. Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte (remplace les null par les valeurs trouvées) :
{
  "reference": "string (ex: BL-123)",
  "date": "YYYY-MM-DD",
  "fournisseur": "string (Nom complet du fournisseur)",
  "bateau": "string (Nom du bateau si présent, sinon chaine vide)",
  "lignes": [
    {
      "calibre": "string",
      "emballage": "string (ex: C12 ou Cs)",
      "quantite": "number (nombre de caisses)",
      "pdsBrut": "number (poids brut total en kg)",
      "pdsNet": "number (poids net total en kg)"
    }
  ]
}`,
    'traitement': `Extrait les informations de cette fiche de production ou d'atelier. Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "date": "YYYY-MM-DD",
  "poidsMP": "number (Poids Matière Première totale en kg)",
  "produitFini": "string (Ex: TUBE, FILET...)",
  "poidsPF": "number (Poids Produit Fini total en kg)",
  "intrants": [
    {
      "article": "string (Nom de l'intrant, ex: Sachet, Carton, Scotch)",
      "quantite": "number"
    }
  ]
}`,
    'consommables': `Extrait les informations de cette facture d'achat. Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte :
{
  "fournisseur": "string",
  "date": "YYYY-MM-DD",
  "articles": [
    {
      "designation": "string (ex: Sachet 30x40, Scotch, Palette...)",
      "quantite": "number",
      "prixUnitaire": "number (en DH, sans le sigle)"
    }
  ]
}`,
    'eau': `Extrait les informations de cette facture d'eau et d'assainissement liquide (SRM Souss Massa / SRM / Amendis / Lydec / ONEE). Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte (remplace les null par les valeurs trouvées) :
{
  "factureNo": "string (ex: 55387371)",
  "policeNo": "string (ex: 553856)",
  "reference": "string (ex: 50 G 001 006 023)",
  "dateFacture": "YYYY-MM-DD (ex: 2026-02-27)",
  "periode": "YYYY-MM (ex: 2026-01)",
  "clientNom": "string (ex: STE FISH AND FOOD PROCESS)",
  "iceClient": "string (ex: 003047045000044)",
  "indexAncien": "number (ex: 380)",
  "indexNouveau": "number (ex: 671)",
  "consommation": "number (consommation en m³, ex: 291)",
  "montantHT": "number (montant hors TVA et droit de timbre, ex: 4003.51)",
  "tva": "number (dont TVA, ex: 400.35)",
  "timbre": "number (timbre, ex: 11.01)",
  "montantTTC": "number (net à payer TTC, ex: 4414.87)",
  "lignes": [
    {
      "designation": "string (ex: 5éme tranche eau sélective, 1ère tranche assainissement, Redevance fixe...)",
      "quantite": "number",
      "prixUnitaire": "number",
      "totalLigne": "number"
    }
  ]
}`
  },

  init() {
    if (document.getElementById('aiScannerOverlay')) return;
    
    const div = document.createElement('div');
    div.id = 'aiScannerOverlay';
    div.className = 'ai-scanner-overlay';
    div.innerHTML = `
      <div class="ai-scanner-modal">
        <div class="ai-scanner-header">
          <button class="ai-scanner-close" onclick="App.AiEngine.closeScanner()">✕</button>
          <h3><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4-4 4 4"/></svg> Scanner avec Gemini AI</h3>
        </div>
        <div class="ai-scanner-body">
          <div id="aiDropzone" class="ai-dropzone" onclick="document.getElementById('aiFileInput').click()">
            <div class="ai-dropzone-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <h4 style="font-size:1.1rem;margin-bottom:8px;color:#1e293b;">Glissez ou cliquez pour sélectionner</h4>
            <p style="color:#64748b;font-size:0.85rem;">Formats supportés : JPG, PNG, PDF, XLSX</p>
            <input type="file" id="aiFileInput" style="display:none" accept="image/*,application/pdf,.xlsx" onchange="App.AiEngine.handleFileSelect(event)">
          </div>

          <div id="aiProcessing" class="ai-processing">
            <div class="ai-scanner-ring">
              <div class="ai-scanner-line"></div>
            </div>
            <div>
              <h4 style="font-size:1.1rem;color:#1e293b;margin-bottom:4px;">Gemini analyse le document...</h4>
              <p style="color:#64748b;font-size:0.85rem;">Veuillez patienter quelques instants.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    const dropzone = document.getElementById('aiDropzone');
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.processFile(e.dataTransfer.files[0]);
      }
    });
  },

  dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  },

  openScanner(type, callback) {
    const p = App.data.parametres || {};
    const hasGemini = !!(p.geminiApiKey || p.geminiKey);
    const hasGroq = !!p.groqApiKey;
    const hasOpenRouter = !!p.openRouterApiKey;
    
    if (!hasGemini && !hasGroq && !hasOpenRouter) {
      App.toast('Erreur : Aucune clé API configurée. Veuillez configurer Gemini, Groq ou OpenRouter dans les Paramètres.', 'error');
      App.navigate('parametres');
      return;
    }

    this.init();

    this.currentType = type;
    this.currentCallback = callback;
    document.getElementById('aiDropzone').style.display = 'block';
    document.getElementById('aiProcessing').classList.remove('active');
    document.getElementById('aiScannerOverlay').classList.add('active');
  },

  closeScanner() {
    document.getElementById('aiScannerOverlay').classList.remove('active');
    document.getElementById('aiFileInput').value = '';
  },

  handleFileSelect(event) {
    if (event.target.files && event.target.files[0]) {
      this.processFile(event.target.files[0]);
    }
  },

  async processFile(file) {
    document.getElementById('aiDropzone').style.display = 'none';
    document.getElementById('aiProcessing').classList.add('active');

    try {
      const prompt = this.prompts[this.currentType] || "Extrait les données en JSON";

      if (file.type === 'application/pdf') {
        const base64Data = await this.extractPdfImage(file);
        const fileToAnalyze = this.dataURLtoFile(base64Data, "page1.jpg");
        const extractedJson = await App.AI.analyzeImage(fileToAnalyze, prompt);
        App.toast("Extraction réussie !", 'success');
        if (this.currentCallback) {
          this.currentCallback(extractedJson);
        }
      } else if (file.type.startsWith('image/')) {
        const extractedJson = await App.AI.analyzeImage(file, prompt);
        App.toast("Extraction réussie !", 'success');
        if (this.currentCallback) {
          this.currentCallback(extractedJson);
        }
      } else if (file.name.endsWith('.xlsx')) {
        // Special case: Excel to Text for AI
        const text = await this.excelToText(file);
        const fullPrompt = prompt + "\n\nVoici le contenu du fichier Excel :\n" + text;
        const extractedJson = await App.AI.analyzeText(fullPrompt);
        App.toast("Intelligence IA : Analyse réussie !", 'success');
        if (this.currentCallback) {
          this.currentCallback(extractedJson);
        }
      } else {
        throw new Error('Format de fichier non supporté. Veuillez utiliser un PDF, une Image ou un Excel.');
      }

    } catch (err) {
      console.error("AI Processing Error:", err);
      if (!err.handled) {
        App.toast(err.message || "Une erreur s'est produite lors de l'analyse.", 'error');
      }
    } finally {
      this.closeScanner();
    }
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  async extractPdfImage(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const page = await pdf.getPage(1); // Read first page only
          
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport }).promise;
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (e) {
          reject(e);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  },

  async excelToText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          let fullText = "";
          workbook.SheetNames.forEach(sheetName => {
            const ws = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
            fullText += `--- Sheet: ${sheetName} ---\n`;
            json.forEach(row => {
              fullText += row.map(cell => cell === null ? "" : cell).join("\t") + "\n";
            });
          });
          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  showOverlay(text) {
    App.toast(text, 'info');
  }
};
