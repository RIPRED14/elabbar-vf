const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    console.log("Goto...");
    await page.goto('https://ntsamak.ntwtec.com/', { waitUntil: 'domcontentloaded' });
    console.log("Waiting for network idle...");
    await new Promise(r => setTimeout(r, 5000));
    console.log("Current URL:", page.url());
    const html = await page.content();
    fs.writeFileSync('debug.html', html);
    await browser.close();
})();
