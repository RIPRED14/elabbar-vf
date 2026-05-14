const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("Launching browser for UI extraction...");
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Store UI elements
    const uiStructure = {};

    console.log("Navigating to home page...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2' });
    
    try {
        await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const loginSpan = spans.find(s => s.textContent === 'Login');
            if (loginSpan) loginSpan.closest('button').click();
        });
    } catch(e) {}

    try {
        await page.waitForSelector('#username', { timeout: 15000 });
        console.log("Entering credentials...");
        await page.type('#username', 'ff-hamza');
        await page.type('#password', 'HAMZA357');
        await Promise.all([
            page.click('#kc-login'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
        ]);
    } catch (err) {
        console.log("Login failed");
        await browser.close();
        return;
    }
    
    console.log("Login successful! Extracting UI...");
    
    async function scrapeUI(urlHash) {
        console.log(`Scraping UI of: ${urlHash}`);
        try {
            await page.goto(`https://ntsamak.ntwtec.com/${urlHash}`, { waitUntil: 'networkidle2', timeout: 15000 });
            await new Promise(r => setTimeout(r, 3000)); // wait for rendering
            
            const data = await page.evaluate(() => {
                const headers = Array.from(document.querySelectorAll('th')).map(th => th.innerText.trim()).filter(t => t);
                const labels = Array.from(document.querySelectorAll('label')).map(l => l.innerText.trim()).filter(l => l);
                const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(b => b);
                return { headers, labels, buttons };
            });
            uiStructure[urlHash] = data;
        } catch (e) {
            console.log(`Timeout/error on ${urlHash}`);
        }
    }

    const modules = [
        '#/stockage/entrees', '#/stockage/sorties', '#/stockage/transferts', '#/stockage/mouvements',
        '#/traitement/reception', '#/traitement/fiche', '#/traitement/mouvements',
        '#/achats/livraisons', '#/achats/factures', '#/achats/reglements'
    ];

    for (const mod of modules) {
        await scrapeUI(mod);
    }
    
    fs.writeFileSync('scratch/ui_structure.json', JSON.stringify(uiStructure, null, 2));
    console.log("UI Extraction complete!");
    await browser.close();
})();
