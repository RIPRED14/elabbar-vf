const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log("🚀 Starting test_facture_api.js...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Log console messages from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Store network info
    const requests = [];
    page.on('response', async (response) => {
        const url = response.url();
        const request = response.request();
        const method = request.method();
        
        if (url.includes('/api/') || url.includes('/realms/') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
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
            console.log(`[NET] ${method} ${url} -> Status ${response.status()}`);
        }
    });

    console.log("Navigating to home page...");
    await page.goto('https://ntsamak.ntwtec.com/#/home', { waitUntil: 'networkidle2' });
    
    console.log("Clicking Login...");
    try {
        await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const loginSpan = spans.find(s => s.textContent === 'Login');
            if (loginSpan) loginSpan.closest('button').click();
        });
    } catch(e) {
        console.log("Login button click error:", e.message);
    }

    console.log("Waiting for login form...");
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
        console.log("Login completed!");
    } catch (err) {
        console.log("Login failed:", err.message);
        await browser.close();
        return;
    }

    console.log("Navigating to /#/facture-frs...");
    try {
        await page.goto('https://ntsamak.ntwtec.com/#/facture-frs', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log("Arrived at /#/facture-frs. Waiting for rendering...");
        await new Promise(r => setTimeout(r, 6000)); // wait for rendering and all AJAX requests to complete

        // Capture page content
        const html = await page.content();
        fs.writeFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/facture_page.html', html);
        console.log("Saved page HTML to scratch/facture_page.html");

        // Analyze page table
        const tableSummary = await page.evaluate(() => {
            const rows = document.querySelectorAll('.p-datatable-tbody tr, tbody tr');
            const data = [];
            rows.forEach((row, i) => {
                const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
                data.push({ row: i, cells });
            });
            return {
                rowCount: rows.length,
                rows: data.slice(0, 5), // show first 5
                pageText: document.body.innerText.substring(0, 1000)
            };
        });

        console.log("Table structure analyzed:");
        console.log(`- Row Count: ${tableSummary.rowCount}`);
        console.log("- Sample rows:", JSON.stringify(tableSummary.rows, null, 2));

        // Save network log
        fs.writeFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/factures_network.json', JSON.stringify(requests, null, 2));
        console.log("Saved network log to scratch/factures_network.json");

    } catch (e) {
        console.log("Navigation to facture-frs failed:", e.message);
    }

    console.log("Closing browser.");
    await browser.close();
})();
