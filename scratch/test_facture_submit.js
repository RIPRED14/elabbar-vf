const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("🚀 Starting test_facture_submit.js...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Enable console logs from page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const requests = [];
    page.on('response', async (response) => {
        const url = response.url();
        const request = response.request();
        const method = request.method();
        
        if (url.includes('ntsamak-api') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
            const reqInfo = {
                url,
                method,
                status: response.status(),
                headers: response.headers(),
                postData: request.postData() || null
            };
            
            try {
                const contentType = response.headers()['content-type'];
                if (contentType && contentType.includes('application/json')) {
                    const json = await response.json();
                    reqInfo.responseLength = JSON.stringify(json).length;
                    reqInfo.responseSample = JSON.stringify(json).substring(0, 300);
                    reqInfo.fullResponse = json;
                }
            } catch (err) {
                reqInfo.error = err.message;
            }
            
            requests.push(reqInfo);
            console.log(`[NET_API] ${method} ${url} -> Status ${response.status()}`);
        }
    });

    try {
        console.log("Navigating to home page...");
        await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2' });
        
        console.log("Clicking Login button...");
        try {
            await page.evaluate(() => {
                const spans = Array.from(document.querySelectorAll('span'));
                const loginSpan = spans.find(s => s.textContent === 'Login');
                if (loginSpan) {
                    const btn = loginSpan.closest('button');
                    if (btn) btn.click();
                } else {
                    console.log("Login span not found, trying fallback...");
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const lBtn = buttons.find(b => b.innerText && b.innerText.includes('Login'));
                    if (lBtn) lBtn.click();
                }
            });
        } catch(e) {
            console.log("Login button click error:", e.message);
        }

        console.log("Waiting for login form...");
        await page.waitForSelector('#username', { timeout: 30000 });
        await page.type('#username', 'ff-hamza');
        await page.type('#password', 'HAMZA357');
        
        console.log("Submitting login form...");
        await Promise.all([
            page.click('#kc-login'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 40000 })
        ]);
        console.log("Login completed! Waiting 5s for dashboard data loading...");
        await new Promise(r => setTimeout(r, 5000));

        console.log("Navigating to /#/facture-frs...");
        await page.goto('https://ntsamak.ntwtec.com/#/facture-frs', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log("Invoice module loaded! Waiting 5s for initial table rendering...");
        await new Promise(r => setTimeout(r, 5000));

        // Get the datepicker inputs
        console.log("Selecting datepicker elements...");
        const dateInputs = await page.$$('.p-datepicker-input');
        if (dateInputs.length >= 2) {
            console.log(`Found ${dateInputs.length} datepickers. Entering dates...`);
            
            // Set Start Date
            await dateInputs[0].click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await dateInputs[0].type('01/11/2025');
            await dateInputs[0].press('Enter');
            console.log("Entered start date: 01/11/2025");

            // Set End Date
            await dateInputs[1].click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await dateInputs[1].type('18/05/2026');
            await dateInputs[1].press('Enter');
            console.log("Entered end date: 18/05/2026");
        } else {
            console.log("Error: datepicker inputs not found!");
        }

        // Open the societeIds dropdown
        console.log("Clicking 'Sociétés' multiselect dropdown...");
        await page.evaluate(() => {
            const el = document.getElementById('societeIds');
            if (el) {
                const clickable = el.querySelector('.p-multiselect') || el;
                clickable.click();
            } else {
                console.log("ERROR: #societeIds element not found!");
            }
        });
        await new Promise(r => setTimeout(r, 2000)); // wait for overlay animation

        // Perform robust diagnostic selection
        console.log("Selecting options in dropdown overlay...");
        const selectionResult = await page.evaluate(() => {
            const panels = document.querySelectorAll('.p-multiselect-overlay, .p-multiselect-panel, #societeIds_list, [data-pc-name="pcoverlay"]');
            if (panels.length === 0) {
                return 'ERROR: No overlay panels found in DOM!';
            }
            
            const panel = panels[panels.length - 1]; // Use the active/last panel
            
            // Log raw options for debugging
            const items = Array.from(panel.querySelectorAll('.p-multiselect-option, .p-multiselect-item'));
            const itemTexts = items.map(item => item.textContent.trim());
            console.log(`Found panel with items: ${JSON.stringify(itemTexts)}`);
            
            if (items.length > 0) {
                items.forEach(item => {
                    item.click();
                });
                return `Clicked all ${items.length} items manually.`;
            }
            
            return `ERROR: Panel found but has no options! HTML: ${panel.outerHTML.substring(0, 500)}`;
        });
        console.log(`Dropdown selection result: ${selectionResult}`);

        await new Promise(r => setTimeout(r, 1000));

        // Close dropdown
        console.log("Closing dropdown...");
        await page.keyboard.press('Escape'); 
        await new Promise(r => setTimeout(r, 1500));

        // Click the submit button (Rechercher)
        console.log("Clicking Rechercher button...");
        await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) {
                console.log(`Button state before click: disabled=${btn.disabled}`);
                btn.click();
            } else {
                console.log("Search button not found!");
            }
        });

        console.log("Waiting 12 seconds for query results and API traffic...");
        await new Promise(r => setTimeout(r, 12000));

        // Save screenshot of the populated list
        await page.screenshot({ path: '/Users/m/Downloads/ELABBAR-main 3/scratch/factures_results.png', fullPage: true });
        console.log("Saved results screenshot to scratch/factures_results.png");

        // Save network logs
        fs.writeFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/factures_search_network.json', JSON.stringify(requests, null, 2));
        console.log("Saved search network logs to scratch/factures_search_network.json");

    } catch (e) {
        console.error("Test execution failed:", e);
    } finally {
        console.log("Closing browser.");
        await browser.close();
    }
})();
