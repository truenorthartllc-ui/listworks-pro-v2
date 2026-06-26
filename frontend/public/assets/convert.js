const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file:///root/listworks-pro-v2/frontend/public/assets/guide-complete.html', { waitUntil: 'networkidle' });
  await page.pdf({
    path: 'listworks-guide.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
  });
  await browser.close();
  console.log('PDF generated successfully');
})();
