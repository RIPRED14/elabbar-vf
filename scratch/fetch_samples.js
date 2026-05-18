const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("🚀 Starting Ntsamak sampling script...");
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 1000 });

    let capturedToken = null;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/protocol/openid-connect/token')) {
        try {
          const json = await response.json();
          if (json && json.access_token) {
            capturedToken = json.access_token;
            console.log("🎯 Network Listener: Captured active OIDC access_token!");
          }
        } catch (e) {}
      }
    });

    console.log("🔑 Authenticating...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const loginSpan = spans.find(s => s.textContent === 'Login');
      if (loginSpan) loginSpan.closest('button').click();
    });

    await page.waitForSelector('#username', { timeout: 20000 });
    await page.type('#username', 'ff-hamza');
    await page.type('#password', 'HAMZA357');
    
    await Promise.all([
      page.click('#kc-login'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    console.log("✅ Logged in.");
    await new Promise(r => setTimeout(r, 6000));

    if (!capturedToken) {
      throw new Error("OIDC token not captured.");
    }

    const token = capturedToken.startsWith("Bearer ") ? capturedToken : `Bearer ${capturedToken}`;

    const dateDu = "2025-11-01T00:00:00.000Z";
    const dateAu = new Date().toISOString();

    console.log("\n📦 Fetching Entree Stock...");
    const entreeRes = await fetch("https://ntsamak-api.ntwtec.com/entreeStock/byFilter", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateDu,
        dateAu,
        societeIds: [48],
        clientFrsIds: [],
        type: "S",
        id: 0
      })
    });
    const entrees = await entreeRes.json();
    console.log(`✅ Retrieved ${entrees.length} entrees.`);
    if (entrees.length > 0) {
      fs.writeFileSync('scratch/entrees_sample.json', JSON.stringify(entrees.slice(0, 3), null, 2));
      console.log(`Saved entrees sample to scratch/entrees_sample.json`);
    }

    console.log("\n🚚 Fetching Sortie Stock (destinationType: S)...");
    const sortieSRes = await fetch("https://ntsamak-api.ntwtec.com/sortieStock/byFilter", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateDu,
        dateAu,
        societeIds: [48],
        clientFrsIds: [],
        type: "S",
        destinationType: "S",
        id: 0
      })
    });
    const sortiesS = await sortieSRes.json();
    console.log(`✅ Retrieved ${sortiesS.length} sorties stock.`);
    if (sortiesS.length > 0) {
      fs.writeFileSync('scratch/sorties_s_sample.json', JSON.stringify(sortiesS.slice(0, 3), null, 2));
      console.log(`Saved sorties stock sample to scratch/sorties_s_sample.json`);
    }

    console.log("\n🧪 Fetching Sortie Traitement (destinationType: T)...");
    const sortieTRes = await fetch("https://ntsamak-api.ntwtec.com/sortieStock/byFilter", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateDu,
        dateAu,
        societeIds: [],
        usineIds: [],
        frigoIds: [],
        clientFrsIds: [],
        type: "S",
        destinationType: "T",
        id: 0
      })
    });
    const sortiesT = await sortieTRes.json();
    console.log(`✅ Retrieved ${sortiesT.length} sorties traitement.`);
    if (sortiesT.length > 0) {
      fs.writeFileSync('scratch/sorties_t_sample.json', JSON.stringify(sortiesT.slice(0, 3), null, 2));
      console.log(`Saved sorties traitement sample to scratch/sorties_t_sample.json`);
    }

    console.log("Closing browser.");
    await browser.close();

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (browser) await browser.close();
  }
})();
