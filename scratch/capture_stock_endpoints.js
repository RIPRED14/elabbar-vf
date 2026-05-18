const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("🚀 Starting Ntsamak network explorer...");
  
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
    await page.setViewport({ width: 1280, height: 800 });

    let capturedToken = null;
    const requests = [];

    // Intercept network requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('ntsamak-api')) {
        const authHeader = request.headers()['authorization'];
        if (authHeader && !capturedToken) {
          capturedToken = authHeader;
          console.log("🎯 Captured Auth Token from Request Headers!");
        }
        
        if (request.method() === 'POST') {
          try {
            const body = JSON.parse(request.postData() || '{}');
            requests.push({
              url,
              method: request.method(),
              postData: body
            });
            console.log(`📡 [POST Request] -> ${url}`);
            console.log('Payload:', JSON.stringify(body, null, 2));
          } catch(e) {
            requests.push({
              url,
              method: request.method(),
              postData: request.postData()
            });
          }
        } else {
          requests.push({
            url,
            method: request.method()
          });
          console.log(`📡 [${request.method()} Request] -> ${url}`);
        }
      }
      request.continue();
    });

    // Capture response data
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('ntsamak-api') && response.request().method() === 'POST') {
        try {
          const json = await response.json();
          console.log(`✅ [Response Received] <- ${url}`);
          console.log('Sample Data (first item):', Array.isArray(json) ? JSON.stringify(json[0], null, 2) : JSON.stringify(json, null, 2).substring(0, 1000));
          
          // Save responses to scratch files for inspection
          const fileName = url.split('/').pop().split('?')[0] + '_response.json';
          fs.writeFileSync(`/Users/m/Downloads/ELABBAR-main 3/scratch/${fileName}`, JSON.stringify(json, null, 2));
          console.log(`💾 Saved response to scratch/${fileName}`);
        } catch(e) {
          // ignore parsing error if not JSON or preflight
        }
      }
    });

    console.log("🔑 Authenticating with Ntsamak Portal...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Click Login
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
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 35000 })
    ]);
    console.log("✅ Logged in successfully.");
    await new Promise(r => setTimeout(r, 5000));

    // Navigating to Stock Entries
    console.log("\n🚗 Navigating to Stock Entries (#/entree-stock-s)...");
    await page.goto('https://ntsamak.ntwtec.com/#/entree-stock-s', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 6000));

    // Navigating to Stock Exits
    console.log("\n🚗 Navigating to Stock Exits (#/sortie-stock-s)...");
    await page.goto('https://ntsamak.ntwtec.com/#/sortie-stock-s', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 6000));

    // Navigating to Sortie Traitement
    console.log("\n🚗 Navigating to Sortie Traitement (#/sortie-traitement/S)...");
    await page.goto('https://ntsamak.ntwtec.com/#/sortie-traitement/S', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 6000));

    console.log("\n🎉 Finished scraping endpoints. Closing browser.");
    await browser.close();

    fs.writeFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/captured_requests.json', JSON.stringify(requests, null, 2));
    console.log("💾 Saved captured requests list to scratch/captured_requests.json");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (browser) await browser.close();
  }
})();
