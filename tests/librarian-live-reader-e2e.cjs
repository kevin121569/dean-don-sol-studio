// Live HTTPS regression for the unlisted Librarian's Reading Desk.
// Public review URL, no credentials, site mutations, or media generation.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = 'https://theidealabstudio.com/studio-entrance-preview-v4-1/';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
      const page=await browser.newPage({viewport, reducedMotion:'reduce'});
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
      await page.locator('[data-enter="adult"]').first().click();
      await page.locator('#adultWorld').waitFor({state:'visible'});
      assert.equal(await page.locator('#deskDemoLink').evaluate(el=>el.tagName),'BUTTON',
        'the primary reader shortcut must be a native button');
      await page.locator('#deskDemoLink').click();
      await page.locator('#readingDesk').waitFor({state:'visible',timeout:15000});
      const frame=page.frameLocator('#readerFrame');
      await frame.locator('main').waitFor({state:'visible',timeout:20000});
      await frame.locator('main').getByText('Black.',{exact:true}).first().waitFor({state:'visible'});
      const chapter=await frame.locator('main').innerText();
      assert.ok(chapter.includes('Black.'),'published Harness prose visible inside reader');
      assert.ok(chapter.includes('GOOD LUCK WITH THAT'),'chapter title visible inside reader');
      assert.equal(await page.locator('#readerExternal').getAttribute('href'),'/samples/harness.html');
      const p=frame.locator('main p').first();
      const before=Number.parseFloat(await p.evaluate(el=>getComputedStyle(el).fontSize));
      await page.locator('#readerLarger').click();
      const after=Number.parseFloat(await p.evaluate(el=>getComputedStyle(el).fontSize));
      assert.ok(after>before,'A+ should enlarge paragraph: '+before+' -> '+after);
      await page.locator('#closeReadingDesk').click();
      assert.equal(await page.locator('#readingDesk').evaluate(el=>el.open),false);
      await page.locator('[data-mood="danger"]').click();
      await page.locator('#recommendedBooks [data-recommend-book="harness"]').click();
      await page.locator('#bookDialog').waitFor({state:'visible'});
      assert.ok((await page.locator('#pitchText').innerText()).includes('Four very different artificial minds'));
      await page.locator('#pitchReader').click();
      await page.locator('#readingDesk').waitFor({state:'visible'});
      await frame.locator('main').getByText('Black.',{exact:true}).first().waitFor({state:'visible'});
      await page.locator('#readerFooterClose').click();
      assert.equal(await page.locator('#readingDesk').evaluate(el=>el.open),false);
      assert.equal(await page.locator('#bookDialog').evaluate(el=>el.open),true,
        'close reading desk must restore book introduction');
      await page.locator('#pitchClose').click();
      await page.locator('#adultWorld [data-enter="kids"]').click();
      await page.locator('#kidsWorld').waitFor({state:'visible'});
      assert.equal(await page.locator('#kidsWorld a[href="/worlds-preview-v2/"]').count(),1);
      assert.deepEqual(errors,[],'unexpected webpage JavaScript errors');
      console.log('PASS '+viewport.width+'x'+viewport.height+': chapter Black. loaded, A+ '+before+'->'+after+', nested pitch return, kids link');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error('LIVE READING DESK FAIL:',error);process.exit(1);});
