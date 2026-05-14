const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Dictionary to store intercepted JSON
    const database = {};

    page.on('response', async (response) => {
        const url = response.url();
        const request = response.request();
        // We want all API calls. They might be from ntsamak.ntwtec.com/api or backend.
        if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
            try {
                const contentType = response.headers()['content-type'];
                if (contentType && contentType.includes('application/json')) {
                    const json = await response.json();
                    const path = new URL(url).pathname;
                    
                    if (!database[path]) database[path] = [];
                    database[path].push(json);
                    console.log(`[DATA] Intercepted JSON from: ${path}`);
                }
            } catch (err) {
                // Ignore parsing errors for empty responses
            }
        }
    });

    console.log("Navigating to home page...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2' });
    
    console.log("Looking for Login button...");
    try {
        // The Login button contains a span with text "Login"
        await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const loginSpan = spans.find(s => s.textContent === 'Login');
            if (loginSpan) loginSpan.closest('button').click();
        });
    } catch(e) { console.log(e); }

    console.log("Waiting for Keycloak login form...");
    try {
        await page.waitForSelector('#username', { timeout: 15000 });
        console.log("Entering credentials...");
        await page.type('#username', 'ff-hamza');
        await page.type('#password', 'HAMZA357');
        
        console.log("Submitting login form...");
        await Promise.all([
            page.click('#kc-login'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
        ]);
    } catch (err) {
        console.log("Failed to find login form. Taking screenshot...");
        await page.screenshot({ path: 'debug_login.png' });
        console.log("Saved debug_login.png");
        await browser.close();
        return;
    }
    
    console.log("Login successful! Navigating to modules to trigger API fetching...");
    
    // Helper to navigate and wait
    async function scrapeModule(urlHash) {
        console.log(`Scraping module: ${urlHash}`);
        try {
            await page.goto(`https://ntsamak.ntwtec.com/${urlHash}`, { waitUntil: 'networkidle2', timeout: 15000 });
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.log(`Timeout/error on ${urlHash}: ${e.message}`);
        }
    }

    // List of modules to visit
    const modules = [
        '#/home',
        '#/societes',
        '#/societe',
        '#/clients',
        '#/client',
        '#/fournisseurs',
        '#/fournisseur',
        '#/bateaux',
        '#/bateau',
        '#/especes',
        '#/espece',
        '#/calibres',
        '#/calibre',
        '#/emballages',
        '#/emballage',
        '#/chambre-froide',
        '#/chambres',
        '#/stockage',
        '#/traitement'
    ];

    for (const mod of modules) {
        await scrapeModule(mod);
    }
    
    console.log("Saving database dump...");
    fs.writeFileSync('database_dump.json', JSON.stringify(database, null, 2));
    
    console.log("Extraction complete!");
    await browser.close();
})();
