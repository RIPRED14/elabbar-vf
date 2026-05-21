const puppeteer = require('puppeteer');

const sbUrl = 'https://waqfodmwoldhusazcycg.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcWZvZG13b2xkaHVzYXpjeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTA3ODgsImV4cCI6MjA5NDM2Njc4OH0.LJTloQ8ch2LqVKK6sNo4SZ4xz-MbvsnuxAhsTzwzhlc';

(async () => {
  console.log("🚀 Starting Ntsamak automated invoice extraction...");
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  let page = null;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    let capturedToken = null;

    // Listen to network responses to catch Keycloak token exchange handshake
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/protocol/openid-connect/token')) {
        try {
          const json = await response.json();
          if (json && json.access_token) {
            capturedToken = json.access_token;
            console.log("🎯 Network Listener: Captured active OIDC access_token!");
          }
        } catch (e) {
          // ignore parsing error if it's options/preflight
        }
      }
    });

    console.log("🔑 Authenticating with Ntsamak Portal...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Wait for SPA rendering
    await new Promise(r => setTimeout(r, 5000));

    // Click Login
    console.log("👉 Clicking Login button...");
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const loginSpan = spans.find(s => s.textContent === 'Login');
      if (loginSpan) {
        const btn = loginSpan.closest('button');
        if (btn) btn.click();
      } else {
        const buttons = Array.from(document.querySelectorAll('button'));
        const lBtn = buttons.find(b => b.innerText && b.innerText.includes('Login'));
        if (lBtn) lBtn.click();
      }
    });

    console.log("⌛ Waiting for login form...");
    await page.waitForSelector('#username', { timeout: 30000 });
    await page.type('#username', 'ff-hamza');
    await page.type('#password', 'HAMZA357');
    
    console.log("📤 Submitting login form...");
    await Promise.all([
      page.click('#kc-login'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 35000 })
    ]);
    console.log("✅ Keycloak authentication submitted.");

    // Wait for the token to be captured by our network listener
    await new Promise(r => setTimeout(r, 8000));

    // Try localStorage fallback if network listener was somehow missed
    if (!capturedToken) {
      console.log("⚠️ Token not captured by network listener, trying localStorage fallback...");
      capturedToken = await page.evaluate(() => {
        return localStorage.getItem('capturedToken');
      });
    }

    if (!capturedToken) {
      await page.screenshot({ path: 'scratch/sync_error.png' });
      console.log("Saved failure screenshot to scratch/sync_error.png");
      throw new Error("Could not capture OIDC token. Keycloak handshake did not complete successfully.");
    }

    console.log("✅ Active OIDC token successfully acquired.");
    await browser.close();

    console.log("📡 Fetching supplier invoices from Ntsamak API...");
    const res = await fetch("https://ntsamak-api.ntwtec.com/factureFrs/byFilter", {
      method: "POST",
      headers: {
        "Authorization": capturedToken.startsWith("Bearer ") ? capturedToken : `Bearer ${capturedToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateDu: "2025-11-01T12:00:00.000Z",
        dateAu: "2026-05-18T12:00:00.000Z",
        fournisseurIds: [],
        societeIds: [47, 48, 49],
        types: ["FF", "FP"],
        usineIds: [],
        id: 0,
        origines: ["D"]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch from Ntsamak API (status ${res.status}): ${errText}`);
    }

    const invoices = await res.json();
    console.log(`✅ Retrieved ${invoices.length} invoices from Ntsamak.`);

    console.log("⚙️ Mapping invoices to Supabase lowercased schema...");
    const consumableSuppliers = [
      'FAST MOSK',
      'DARAA PRODUCT',
      'SARPINA',
      'SOLICOMA',
      'IGUER NEGOCE',
      'POLYMI',
      'GRAPHIC INO',
      'ADAM INDUSTRIES',
      'AIT MELLOUL CHIMIE',
      'LA GLOBALE MAROCAINE'
    ];

    const mappedInvoices = invoices.map(inv => {
      // Map payments to payment state
      const isPaid = !!(inv.datesReglements || inv.referencesReglements || (inv.montantReglement && inv.montantReglement >= inv.montantTtc));
      const status = isPaid ? "Payée" : "En attente";

      const defaultLine = [{
        description: inv.motif || 'Facture importée Ntsamak',
        quantite: 1,
        prixUnitaire: inv.montantHt || 0,
        totalLigne: inv.montantHt || 0
      }];

      // Determine allocation based on supplier type
      const supplierName = (inv.fournisseurRaisonSociale || '').toUpperCase().trim();
      const isConsumable = consumableSuppliers.some(s => supplierName.includes(s));
      const allocation = isConsumable ? 'emballage' : 'general';

      return {
        id: `nt_${inv.id}`,
        numero: inv.reference || `NT-${inv.id}`,
        date: inv.dateFacture ? inv.dateFacture.split('T')[0] : null,
        fournisseur: inv.fournisseurRaisonSociale || 'Inconnu',
        montantht: inv.montantHt || 0,
        tva: inv.montantTva || 0,
        montantttc: inv.montantTtc || 0,
        devise: inv.deviseSymbole === 'DH' ? 'MAD' : (inv.deviseSymbole || 'MAD'),
        motif: inv.motif || null,
        lignes: {
          items: defaultLine,
          societe: inv.societeRaisonSociale || 'FISH & FOOD TRAITEMENT',
          allocation: allocation,
          type: inv.type === 'FF' ? 'Facture' : (inv.type === 'FP' ? 'Proforma' : 'Facture'),
          origine: inv.origine === 'D' ? 'Divers achats' : (inv.origine || 'Divers achats'),
          dateEcheance: inv.dateEcheance ? inv.dateEcheance.split('T')[0] : null,
          etatPaiement: status,
          // New detailed columns from Ntsamak:
          usineRaisonSociale: inv.usineRaisonSociale || '',
          creeParNom: inv.creeParNom || '',
          tauxChange: inv.tauxChange || 1,
          remiseTtc: inv.remiseTtc || 0,
          netAPayer: inv.netAPayer || inv.montantTtc || 0,
          montantReglement: inv.montantReglement || 0,
          datesReglements: inv.datesReglements || '',
          referencesReglements: inv.referencesReglements || ''
        }
      };
    });

    console.log(`📤 Syncing ${mappedInvoices.length} invoices to Supabase 'factures' table...`);
    
    // We can upsert them in chunks to be safe
    const chunkSize = 50;
    let successCount = 0;

    for (let i = 0; i < mappedInvoices.length; i += chunkSize) {
      const chunk = mappedInvoices.slice(i, i + chunkSize);
      
      const syncRes = await fetch(`${sbUrl}/rest/v1/factures`, {
        method: "POST",
        headers: {
          "apikey": sbKey,
          "Authorization": `Bearer ${sbKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(chunk)
      });

      if (!syncRes.ok) {
        const syncErr = await syncRes.text();
        console.error(`❌ Error syncing chunk ${i / chunkSize + 1}:`, syncErr);
      } else {
        successCount += chunk.length;
        console.log(`   Processed ${successCount}/${mappedInvoices.length} invoices...`);
      }
    }

    console.log(`\n🎉 SUCCESS: Successfully synced ${successCount} invoices directly to Supabase cloud!`);

  } catch (error) {
    console.error("\n❌ CRITICAL SYNC ERROR:", error.message);
    if (page) {
      try {
        await page.screenshot({ path: 'scratch/sync_error.png' });
        console.log("📸 Saved failure screenshot to scratch/sync_error.png");
      } catch (screenshotError) {
        console.error("Could not capture failure screenshot:", screenshotError.message);
      }
    }
    if (browser) await browser.close();
    process.exit(1);
  }
})();
