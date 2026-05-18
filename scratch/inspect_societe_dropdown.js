const puppeteer = require('puppeteer');

(async () => {
    console.log("🚀 Starting inspect_societe_dropdown.js...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log("Logging in...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2' });
    
    try {
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
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
        ]);
        console.log("Login completed successfully!");
    } catch (err) {
        console.log("Login failed:", err.message);
        await browser.close();
        return;
    }

    await new Promise(r => setTimeout(r, 3000));

    console.log("Navigating to /#/facture-frs...");
    await page.goto('https://ntsamak.ntwtec.com/#/facture-frs', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 6000)); // Wait for data to load fully

    const result = await page.evaluate(() => {
        const el = document.getElementById('societeIds');
        if (!el) return 'ERROR: #societeIds not found in DOM!';
        
        let out = `--- #societeIds Inner HTML ---\n${el.outerHTML}\n\n`;
        
        // Click the trigger or multiselect
        const trigger = el.querySelector('.p-multiselect-trigger') || el.querySelector('.p-multiselect') || el;
        out += `Clicking element with classes: "${trigger.className}"\n`;
        trigger.click();
        
        return out;
    });
    console.log(result);

    console.log("Waiting 3s for overlay to appear...");
    await new Promise(r => setTimeout(r, 3000));

    const overlayResult = await page.evaluate(() => {
        let out = '';
        // Find all elements with classes containing 'multiselect' or 'panel' or 'overlay'
        const allElements = Array.from(document.querySelectorAll('*'));
        const matching = allElements.filter(el => {
            const classes = el.className || '';
            const tag = el.tagName.toLowerCase();
            return (typeof classes === 'string' && (classes.includes('multiselect') || classes.includes('p-overlay') || classes.includes('p-panel')))
                || tag.includes('multiselect') || tag.includes('overlay');
        });
        
        out += `Found ${matching.length} matching overlay/multiselect elements in the entire document:\n`;
        matching.forEach((el, index) => {
            out += `\n[${index}] <${el.tagName.toLowerCase()}> Classes: "${el.className}" ID: "${el.id || 'none'}"\n`;
            out += `    Text Content: "${el.textContent.trim().substring(0, 150)}"\n`;
            if (el.className.includes('panel') || el.className.includes('overlay')) {
                out += `    Raw HTML: ${el.outerHTML.substring(0, 800)}...\n`;
            }
        });
        
        return out;
    });
    console.log(overlayResult);

    await browser.close();
})();
