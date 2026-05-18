const puppeteer = require('puppeteer');

(async () => {
    console.log("🚀 Starting inspect_overlay.js...");
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
    } catch (err) {
        console.log("Login failed:", err.message);
        await browser.close();
        return;
    }

    console.log("Navigating to /#/facture-frs...");
    await page.goto('https://ntsamak.ntwtec.com/#/facture-frs', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));

    console.log("Clicking 'Sociétés' multiselect dropdown...");
    await page.click('#societeIds');
    await new Promise(r => setTimeout(r, 2000));

    const overlayInfo = await page.evaluate(() => {
        const panels = document.querySelectorAll('.p-multiselect-panel');
        if (panels.length === 0) return 'No .p-multiselect-panel found!';
        
        let info = `Found ${panels.length} panel(s):\n`;
        panels.forEach((panel, i) => {
            info += `\n--- Panel ${i} ---\n`;
            info += `Classes: ${panel.className}\n`;
            
            const headerCheckbox = panel.querySelector('.p-multiselect-header .p-checkbox-box');
            info += `Header Checkbox exists: ${!!headerCheckbox}\n`;
            if (headerCheckbox) {
                info += `Header Checkbox classes: ${headerCheckbox.className}\n`;
            }
            
            const items = panel.querySelectorAll('.p-multiselect-item');
            info += `Number of list items (.p-multiselect-item): ${items.length}\n`;
            items.forEach((item, j) => {
                info += `  Item ${j}: "${item.textContent.trim()}" (selected: ${item.classList.contains('p-highlight')})\n`;
                const cb = item.querySelector('.p-checkbox-box');
                info += `    Checkbox classes: "${cb ? cb.className : 'N/A'}"\n`;
            });
            
            // Also print entire HTML of the panel for raw analysis
            info += `\nRaw Panel HTML:\n${panel.outerHTML.substring(0, 1000)}...\n`;
        });
        
        return info;
    });

    console.log("\n=================== OVERLAY INFO ===================");
    console.log(overlayInfo);
    console.log("====================================================");

    await browser.close();
})();
