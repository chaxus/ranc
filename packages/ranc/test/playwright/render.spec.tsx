import { expect, test, chromium, Page, Browser } from '@playwright/test';
import { DEV_SERVER } from '../../build/config';
import { render, _jsx } from '../../index';

let page: Page;
let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  page = await context.newPage();
});


test('render 函数：挂载指定元素到对应的元素上', async ({ page }) => {
  await page.goto(DEV_SERVER, { waitUntil: 'load' });
  await expect(page).toHaveTitle(/ranc/);
  // const indexUrl = 'https://www.baidu.com/';
  // await page.goto(indexUrl);
  await page.waitForTimeout(10000);
  // await page.evaluate(async () => {
  //   render(<h1 className="render">hello world</h1>, document.getElementById('render'))  
  //   return new Promise(resolve => setTimeout(resolve, 1000))
  // });
  // const name = page.innerText('.render');
  // expect(name).toBe('hello world');
});
