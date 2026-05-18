const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("🚀 Starting Ntsamak pages explorer for exits...");
  
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
    await new Promise(r => setTimeout(r, 5000));

    page.on('request', request => {
      if (request.url().includes('ntsamak-api')) {
        console.log(`📡 Request: [${request.method()}] ${request.url()}`);
        if (request.method() === 'POST') {
          console.log(`   Payload: ${request.postData()}`);
        }
      }
    });

    console.log("\n🚗 Navigating to Stock Exits (#/sortie-stock-s)...");
    await page.goto('https://ntsamak.ntwtec.com/#/sortie-stock-s', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));

    console.log("👉 Clicking 'Rechercher' on Sortie Stock page...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Rechercher'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    console.log("\n🚗 Navigating to Sortie Traitement (#/sortie-traitement/S)...");
    await page.goto('https://ntsamak.ntwtec.com/#/sortie-traitement/S', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));

    console.log("👉 Clicking 'Rechercher' on Sortie Traitement page...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Rechercher'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    console.log("Closing browser.");
    await browser.close();

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (browser) await browser.close();
  }
})();
