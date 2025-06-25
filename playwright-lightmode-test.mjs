import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light' // ライトモードを強制
  });
  const page = await context.newPage();

  // スクリーンショット保存用ディレクトリ
  const screenshotDir = 'playwright-screenshots';
  await fs.mkdir(screenshotDir, { recursive: true });

  // テストするページ一覧
  const pages = [
    { url: 'http://localhost:5173/', name: 'home' },
    { url: 'http://localhost:5173/tutorial', name: 'tutorial-list' },
    { url: 'http://localhost:5173/tutorial/getting-started/webgpu-init', name: 'tutorial-init' },
    { url: 'http://localhost:5173/tutorial/first-triangle/basic-triangle', name: 'tutorial-triangle' },
    { url: 'http://localhost:5173/playground', name: 'playground' }
  ];

  console.log('Starting light mode screenshot capture...');

  for (const pageInfo of pages) {
    try {
      console.log(`Capturing ${pageInfo.name}...`);
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });
      
      // ページが完全に読み込まれるまで少し待つ
      await page.waitForTimeout(2000);
      
      // フルページスクリーンショット
      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-light.png`),
        fullPage: true
      });
      
      // ビューポート内のスクリーンショット
      await page.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-light-viewport.png`)
      });
      
      console.log(`✓ ${pageInfo.name} captured`);
    } catch (error) {
      console.error(`✗ Failed to capture ${pageInfo.name}:`, error.message);
    }
  }

  // ダークモードでも撮影（比較用）
  console.log('\nStarting dark mode screenshot capture for comparison...');
  
  const darkContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark'
  });
  const darkPage = await darkContext.newPage();

  for (const pageInfo of pages) {
    try {
      console.log(`Capturing ${pageInfo.name} (dark)...`);
      await darkPage.goto(pageInfo.url, { waitUntil: 'networkidle' });
      await darkPage.waitForTimeout(2000);
      
      await darkPage.screenshot({
        path: path.join(screenshotDir, `${pageInfo.name}-dark.png`),
        fullPage: true
      });
      
      console.log(`✓ ${pageInfo.name} (dark) captured`);
    } catch (error) {
      console.error(`✗ Failed to capture ${pageInfo.name} (dark):`, error.message);
    }
  }

  await darkContext.close();
  await context.close();
  await browser.close();
  
  console.log('\nScreenshot capture completed!');
  console.log(`Screenshots saved in: ${screenshotDir}/`);
}

// 実行
captureScreenshots().catch(console.error);