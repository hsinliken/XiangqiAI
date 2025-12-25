const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'http://localhost:5173/';
  const outScreenshot = process.env.OUT || 'e2e-result.png';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('[E2E] Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for deck grid to appear
  await page.waitForSelector('.grid');
  console.log('[E2E] Grid found, selecting 5 cards...');

  // Click first 5 cards (if available)
  for (let i = 1; i <= 5; i++) {
    const selector = `.grid > div:nth-child(${i})`;
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      await page.click(selector);
      await page.waitForTimeout(300); // small delay for animation
    } catch (e) {
      console.warn(`[E2E] Could not click card ${i}:`, e.message);
    }
  }

  // Wait for gender radio to appear
  await page.waitForSelector('input[name="gender"]', { timeout: 5000 });
  // Select 男 if available
  try {
    await page.click('input[name="gender"][value="男"]');
  } catch (e) {
    // fallback to first gender input
    const genderInput = await page.$('input[name="gender"]');
    if (genderInput) await genderInput.click();
  }

  // Click first category button
  console.log('[E2E] Selecting category...');
  await page.waitForSelector('div.grid.grid-cols-1 button', { timeout: 5000 });
  await page.click('div.grid.grid-cols-1 button');

  // Wait for result container appear
  console.log('[E2E] Waiting for analysis/result...');
  try {
    await page.waitForSelector('.bg-white\/10', { timeout: 20000 });
  } catch (e) {
    console.warn('[E2E] Result container not found within timeout');
  }

  // Wait for chat input
  await page.waitForSelector('input[placeholder*="請輸入您的問題"]', { timeout: 10000 });
  await page.click('input[placeholder*="請輸入您的問題"]');
  await page.fill('input[placeholder*="請輸入您的問題"]', '這是一個自動化測試問題');
  await page.keyboard.press('Enter');

  // Give some time for AI response and for storage saves
  await page.waitForTimeout(8000);

  // Capture localStorage entries
  const conversations = await page.evaluate(() => localStorage.getItem('xiangqi_ai_conversations'));
  const results = await page.evaluate(() => localStorage.getItem('xiangqi_divination_results'));

  // Save screenshot
  await page.screenshot({ path: outScreenshot, fullPage: true });
  console.log('[E2E] Screenshot saved to', outScreenshot);

  console.log('---LOCALSTORAGE: xiangqi_ai_conversations---');
  console.log(conversations || 'null');
  console.log('---LOCALSTORAGE: xiangqi_divination_results---');
  console.log(results || 'null');

  await browser.close();
})();
