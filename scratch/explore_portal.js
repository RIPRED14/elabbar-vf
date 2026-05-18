const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("🚀 Starting explore_portal.js...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

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
        
        console.log("Submitting login...");
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

    // Wait 5 seconds on dashboard to settle
    console.log("Settling on home page...");
    await new Promise(r => setTimeout(r, 5000));

    // Capture screenshot of dashboard
    await page.screenshot({ path: '/Users/m/Downloads/ELABBAR-main 3/scratch/home_dashboard.png' });
    console.log("Saved dashboard screenshot to scratch/home_dashboard.png");

    // Extract all menu links and button labels
    const navigationInfo = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.innerText.trim(),
            href: a.getAttribute('href'),
            id: a.id,
            className: a.className
        }));

        const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({
            text: b.innerText.trim(),
            id: b.id,
            className: b.className
        }));

        return {
            title: document.title,
            currentUrl: window.location.href,
            bodyTextSample: document.body.innerText.substring(0, 1500),
            links,
            buttons
        };
    });

    console.log("Current URL:", navigationInfo.currentUrl);
    console.log("Page Title:", navigationInfo.title);
    console.log("\n--- Links found ---");
    navigationInfo.links.forEach(l => {
        if (l.text || l.href) {
            console.log(`- Text: "${l.text}" | Href: "${l.href}"`);
        }
    });

    console.log("\n--- Buttons found ---");
    navigationInfo.buttons.forEach(b => {
        if (b.text) {
            console.log(`- Text: "${b.text}"`);
        }
    });

    // Let's try navigating to the parent route /#/achats/factures or whatever if we find it, or let's search specifically for the menus.
    // If we have a sidebar or menu button, let's open it
    console.log("\nChecking if sidebar/menu button exists...");
    await page.evaluate(() => {
        // Try to click menu/sidebar toggle if any
        const menuBtn = document.querySelector('.menu-button, .sidebar-toggle, button[icon*="menu"]');
        if (menuBtn) {
            menuBtn.click();
            console.log("Clicked menu/sidebar button");
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check links again after clicking menu button
    const afterMenuLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.innerText.trim(),
            href: a.getAttribute('href')
        }));
    });
    
    console.log("\n--- Links found after attempting menu click ---");
    afterMenuLinks.forEach(l => {
        if (l.text || l.href) {
            console.log(`- Text: "${l.text}" | Href: "${l.href}"`);
        }
    });

    console.log("Closing browser.");
    await browser.close();
})();
