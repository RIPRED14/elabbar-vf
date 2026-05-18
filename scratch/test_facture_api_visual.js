const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("🚀 Starting test_facture_api_visual.js...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

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
                    reqInfo.responseSample = JSON.stringify(json).substring(0, 400);
                    reqInfo.fullResponse = json;
                }
            } catch (err) {
                reqInfo.error = err.message;
            }
            
            requests.push(reqInfo);
            console.log(`[NET_API] ${method} ${url} -> Status ${response.status()}`);
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
        console.log("Login click error:", e.message);
    }

    console.log("Waiting for login form...");
    try {
        await page.waitForSelector('#username', { timeout: 10000 });
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

    console.log("Waiting 3s for dashboard setup...");
    await new Promise(r => setTimeout(r, 3000));

    console.log("Navigating to /#/facture-frs...");
    try {
        await page.goto('https://ntsamak.ntwtec.com/#/facture-frs', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log("Arrived at /#/facture-frs. Waiting 15 seconds for AJAX and rendering...");
        await new Promise(r => setTimeout(r, 15000));

        // Take a screenshot of the invoice page
        await page.screenshot({ path: '/Users/m/Downloads/ELABBAR-main 3/scratch/facture_page.png', fullPage: true });
        console.log("Saved page screenshot to scratch/facture_page.png");

        // Inspect body text and elements
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log("\n--- Visible Page Text Sample (first 1000 chars) ---");
        console.log(pageText.substring(0, 1000));

        const html = await page.content();
        fs.writeFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/facture_page_longer.html', html);

        // Check if there are date input elements
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                placeholder: i.placeholder,
                value: i.value,
                className: i.className
            }));
        });
        console.log("\n--- Input fields on the page ---");
        console.log(JSON.stringify(inputs, null, 2));

        // Save detailed network logs
        fs.writeFileSync('/Users/m/Downloads/ELABBAR-main 3/scratch/factures_api_network.json', JSON.stringify(requests, null, 2));
        console.log("Saved API network logs to scratch/factures_api_network.json");

    } catch (e) {
        console.log("Navigation to /#/facture-frs failed:", e.message);
    }

    console.log("Closing browser.");
    await browser.close();
})();
