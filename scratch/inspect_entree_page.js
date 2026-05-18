const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("🚀 Starting Ntsamak page inspection...");
  
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

    // Listen to all network requests
    page.on('request', request => {
      if (request.url().includes('ntsamak-api')) {
        console.log(`📡 Request: [${request.method()}] ${request.url()}`);
        if (request.method() === 'POST') {
          console.log(`   Payload: ${request.postData()}`);
        }
      }
    });

    console.log("\n🚗 Going to Stock Entries...");
    await page.goto('https://ntsamak.ntwtec.com/#/entree-stock-s', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));

    // Get all buttons and inputs on the page
    const pageDetails = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select')).map(el => ({
        tagName: el.tagName,
        type: el.type,
        id: el.id,
        name: el.name,
        value: el.value,
        placeholder: el.placeholder,
        className: el.className
      }));

      const buttons = Array.from(document.querySelectorAll('button')).map(el => ({
        text: el.innerText.trim(),
        className: el.className,
        id: el.id
      }));

      const divs = Array.from(document.querySelectorAll('div')).map(el => el.innerText ? el.innerText.trim() : '');
      const hasSearchButton = buttons.some(b => b.text && b.text.includes('Rechercher'));

      return {
        inputs,
        buttons,
        hasSearchButton,
        htmlSample: document.body.innerHTML.substring(0, 5000)
      };
    });

    console.log("Buttons found:", JSON.stringify(pageDetails.buttons, null, 2));
    console.log("Inputs found:", JSON.stringify(pageDetails.inputs, null, 2));

    await page.screenshot({ path: '/Users/m/Downloads/ELABBAR-main 3/scratch/entree_page.png' });
    console.log("Saved screenshot to scratch/entree_page.png");

    if (pageDetails.hasSearchButton) {
      console.log("👉 Clicking 'Rechercher' button...");
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Rechercher'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 5000));
      await page.screenshot({ path: '/Users/m/Downloads/ELABBAR-main 3/scratch/entree_page_after_search.png' });
      console.log("Saved search results screenshot to scratch/entree_page_after_search.png");
    } else {
      console.log("❌ No 'Rechercher' button found.");
    }

    console.log("Closing browser.");
    await browser.close();

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (browser) await browser.close();
  }
})();
