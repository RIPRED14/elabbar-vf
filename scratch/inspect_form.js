const puppeteer = require('puppeteer');

(async () => {
    console.log("🚀 Starting inspect_form.js...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log("Navigating and logging in...");
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
        console.log("Login completed!");
    } catch (err) {
        console.log("Login failed:", err.message);
        await browser.close();
        return;
    }

    await new Promise(r => setTimeout(r, 3000));

    console.log("Navigating to /#/facture-frs...");
    try {
        await page.goto('https://ntsamak.ntwtec.com/#/facture-frs', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        // Dump form info
        const formDetails = await page.evaluate(() => {
            const form = document.querySelector('form');
            if (!form) return 'Form not found!';
            
            const results = [];
            results.push(`Form Classes: ${form.className}`);
            
            const inputs = form.querySelectorAll('input, select, textarea, button, p-calendar, p-multiselect');
            results.push(`Found ${inputs.length} elements within form:`);
            
            inputs.forEach((el, index) => {
                const tag = el.tagName.toLowerCase();
                const id = el.id || 'no-id';
                const name = el.getAttribute('name') || 'no-name';
                const type = el.getAttribute('type') || '';
                const placeholder = el.getAttribute('placeholder') || '';
                const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';
                const disabled = el.hasAttribute('disabled') || el.disabled;
                const classes = el.className;
                
                results.push(`\n[${index}] <${tag}> ID: "${id}" Name: "${name}" Type: "${type}"`);
                results.push(`    Classes: "${classes}"`);
                results.push(`    Required: ${required}, Disabled: ${disabled}, Placeholder: "${placeholder}"`);
                
                // If it's a multiselect or calendar, inspect inner input or label
                if (tag === 'p-multiselect') {
                    const label = el.querySelector('.p-multiselect-label');
                    results.push(`    [p-multiselect Inner Label text]: "${label ? label.textContent.trim() : 'N/A'}"`);
                }
                if (tag === 'button') {
                    results.push(`    [Button Text]: "${el.textContent.trim()}"`);
                }
            });
            
            return results.join('\n');
        });

        console.log("\n=================== FORM DETAILS ===================");
        console.log(formDetails);
        console.log("====================================================");

    } catch (e) {
        console.log("Inspection failed:", e.message);
    }

    await browser.close();
})();
