import { test, expect } from '@playwright/test';

test.describe('Dark mode visual tests', () => {
  test('Reference page should be readable in dark mode', async ({ page }) => {
    // ダークモードに設定
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // リファレンスページに移動
    await page.goto('/reference');
    
    // ページが読み込まれるまで待機
    await page.waitForSelector('h1');
    
    // コードブロックの背景色を確認
    const codeBlock = await page.locator('.code-block').first();
    const codeBlockBg = await codeBlock.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // インラインコードの背景色を確認
    const inlineCode = await page.locator('li code').first();
    const inlineCodeBg = await inlineCode.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    const inlineCodeColor = await inlineCode.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    
    // スクリーンショットを撮影
    await page.screenshot({ 
      path: 'tests/screenshots/reference-darkmode.png',
      fullPage: true 
    });
    
    console.log('Code block background:', codeBlockBg);
    console.log('Inline code background:', inlineCodeBg);
    console.log('Inline code text color:', inlineCodeColor);
    
    // 背景が白でないことを確認
    expect(codeBlockBg).not.toBe('rgb(255, 255, 255)');
    expect(inlineCodeBg).not.toBe('rgb(255, 255, 255)');
    
    // テキストが読めることを確認（十分なコントラスト）
    expect(inlineCodeColor).not.toBe('rgb(0, 0, 0)');
  });

  test('Light mode should also work correctly', async ({ page }) => {
    // ライトモードに設定
    await page.emulateMedia({ colorScheme: 'light' });
    
    // リファレンスページに移動
    await page.goto('/reference');
    
    // ページが読み込まれるまで待機
    await page.waitForSelector('h1');
    
    // スクリーンショットを撮影
    await page.screenshot({ 
      path: 'tests/screenshots/reference-lightmode.png',
      fullPage: true 
    });
  });
});