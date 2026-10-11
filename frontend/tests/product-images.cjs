// Browser integration check: real bundled assets + fixtures matching all seeded product names.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const assert=require('node:assert/strict');
(async()=>{
 const sql=fs.readFileSync(path.join(__dirname,'../../database/02_seeds.sql'),'utf8');
 const block=sql.split('INSERT INTO PRODUCT (')[1].split('-- Step 3:')[0];
 const names=[...block.matchAll(/^  \('([^']+)'/gm)].map(m=>m[1]);assert.equal(names.length,40);
 const products=names.map((productName,i)=>({productId:i+1,productName,brand:'BrightBuy',description:'Illustrative catalogue item',categories:[],variants:[]}));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/v1/**',route=>{
  const url=new URL(route.request().url());let data=[];let meta;
  if(url.pathname==='/api/v1/products'){data=products;meta={page:1,pageSize:40,total:40};}
  else if(url.pathname.startsWith('/api/v1/products/'))data=products[Number(url.pathname.split('/').pop())-1]||{productId:999,productName:'New Unlisted Product',variants:[]};
  return route.fulfill({contentType:'application/json',body:JSON.stringify({data,meta})});
 });
 const base=process.env.BRIGHTBUY_URL||'http://127.0.0.1:3001';
 try {
  await page.goto(base+'/products');await page.locator('.product-card img').first().waitFor();
  await page.evaluate(()=>document.querySelectorAll('.product-card img').forEach(img=>img.loading='eager'));
  await page.waitForFunction(()=>{const images=[...document.querySelectorAll('.product-card img')];return images.length===40&&images.every(img=>img.complete&&img.naturalWidth>0);});
  assert.equal(new Set(await page.locator('.product-card img').evaluateAll(imgs=>imgs.map(i=>i.src))).size,40);
  await page.screenshot({path:path.join(require('os').tmpdir(),'brightbuy-products-desktop.png'),fullPage:true});
  for(let id=1;id<=40;id++){
    await page.goto(base+'/products/'+id);
    const buttons=page.locator('.product-gallery-thumbnails button');await buttons.first().waitFor();assert.equal(await buttons.count(),2);
    await page.waitForFunction(()=>document.querySelector('.product-image-detail img')?.naturalWidth>0);
    const first=await page.locator('.product-image-detail img').getAttribute('src');
    await buttons.nth(1).click();
    await page.waitForFunction(()=>{const i=document.querySelector('.product-image-detail img');return i?.src.includes('-view-2.webp')&&i.complete&&i.naturalWidth>0;});
    assert.notEqual(await page.locator('.product-image-detail img').getAttribute('src'),first);
    assert.equal(await buttons.nth(1).getAttribute('aria-pressed'),'true');
  }
  await page.goto(base+'/products/26');await page.waitForFunction(()=>document.querySelector('.product-image-detail img')?.naturalWidth>0);
  assert.ok((await page.locator('.product-image-detail img').getAttribute('alt')).includes('LensCraft Mirrorless M100'));
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/products');await page.locator('.product-card img').first().waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile image grid overflows');
  await page.screenshot({path:path.join(require('os').tmpdir(),'brightbuy-products-mobile.png'),fullPage:true});
  await page.goto(base+'/products/26');
  await page.locator('.product-gallery-thumbnails button').nth(1).click();
  await page.waitForFunction(()=>{const i=document.querySelector('.product-image-detail img');return i?.src.includes('-view-2.webp')&&i.complete&&i.naturalWidth>0;});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile gallery overflows');
  await page.screenshot({path:path.join(require('os').tmpdir(),'brightbuy-gallery-mobile.png'),fullPage:true});
  await page.goto(base+'/products/999');await page.getByText('Product image coming soon').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: all 80 images load, each of 40 galleries switches pictures, detail image matches, mobile layout fits, unlisted-product fallback renders.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
