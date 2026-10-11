// UI contract test with persistent in-memory API fixtures; backend permissions are tested separately.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1365,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 let role='CUSTOMER';const p={productId:1,productName:'TechNova Pulse 12',description:'Demo phone',brand:'TechNova',status:'ACTIVE',categoryIds:[1],images:[{imageId:1,url:'/products/technova-pulse-12.webp'},{imageId:2,url:'/products/technova-pulse-12-view-2.webp'}],variants:[{variantId:1,sku:'TN-001',variantName:'Midnight',price:100,stockQuantity:8,status:'ACTIVE'}],stockHistory:[]};
 const categories=[{categoryId:1,categoryName:'Smartphones'}];
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),pathname=url.pathname.replace('/api/v1',''),method=req.method();const body=(req.headers()['content-type']||'').includes('application/json')?req.postDataJSON():null;let data,status=200,meta;
  if(pathname==='/auth/login'){if(body.portal==='ADMIN'&&!body.email.startsWith('admin'))return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{message:'This account cannot sign in through the selected role.'}})});role=body.email.startsWith('admin')?'ADMIN':'CUSTOMER';data={token:'fixture-token',customer:{customerId:1,fullName:'Demo',role}};}
  else if(pathname==='/customers/me')data={customerId:1,fullName:'Demo',role};
  else if(pathname==='/categories')data=categories;
  else if(pathname==='/admin/products'){data=[{...p,variantCount:1,stockQuantity:p.variants[0].stockQuantity}];meta={total:1,page:1,pageSize:20};}
  else if(pathname==='/admin/products/1'){if(method==='PUT')Object.assign(p,body);data=p;}
  else if(pathname==='/admin/variants/1'){Object.assign(p.variants[0],body);data=p.variants[0];}
  else if(pathname==='/admin/variants/1/stock'){assert.equal(body.expectedStockQuantity,p.variants[0].stockQuantity);const delta=body.stockQuantity-p.variants[0].stockQuantity;p.variants[0].stockQuantity=body.stockQuantity;p.stockHistory.push({adjustmentId:1,sku:'TN-001',quantityChange:delta,reason:body.reason,adjustmentDate:'2026-10-07T12:00:00Z'});data=p.variants[0];}
  else if(pathname==='/admin/products/1/images'&&method==='POST'){assert.equal(req.headers()['content-type'],'image/webp');p.images.push({imageId:3,url:'/products/technova-pulse-12.webp'});data=p.images;status=201;}
  else if(pathname.endsWith('/cover')){const id=Number(pathname.split('/').at(-2));p.images.sort((a,b)=>a.imageId===id?-1:b.imageId===id?1:0);data=p.images;}
  else if(pathname.startsWith('/admin/products/1/images/')&&method==='DELETE'){const id=Number(pathname.split('/').at(-1));p.images=p.images.filter(i=>i.imageId!==id);data=p.images;}
  else if(pathname==='/products'){data=p.status==='ACTIVE'?[{...p,categories}]:[];meta={page:1,pageSize:20,total:data.length};}
  else if(pathname==='/products/1')data={...p,variants:p.variants.map(v=>({...v,inStock:v.stockQuantity}))};
  else throw Error('Unhandled fixture '+method+' '+pathname);
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify({data,meta})});
 });
 const base=process.env.BRIGHTBUY_URL||'http://127.0.0.1:3001';
 const login=async email=>{await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill('BrightBuy123!');await page.getByRole('button',{name:'Sign in',exact:true}).click();};
 try{
  await page.goto(base+'/admin/products');await page.waitForURL('**/admin/login');await page.getByRole('heading',{name:'Admin sign in'}).waitFor();await login('customer@brightbuy.test');await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>sessionStorage.getItem('brightbuy.token')),null);
  await login('admin@brightbuy.test');await page.waitForURL('**/admin');await page.getByRole('link',{name:/Manage Products & Photos/}).click();await page.getByRole('link',{name:'Manage TechNova Pulse 12',exact:true}).click();await page.getByRole('heading',{name:'Product pictures'}).waitFor();
  await page.getByLabel('Product name',{exact:true}).fill('Updated Phone');await page.getByRole('button',{name:'Save product details'}).click();await page.getByText('Product details saved.',{exact:true}).waitFor();assert.equal(p.productName,'Updated Phone');
  await page.getByLabel('New quantity',{exact:true}).fill('12');await page.getByLabel('Reason for adjustment').fill('Inventory count');await page.getByRole('button',{name:'Save stock quantity'}).click();await page.getByRole('cell',{name:'Inventory count',exact:true}).waitFor();assert.equal(p.variants[0].stockQuantity,12);
  await page.getByLabel('Price ($)',{exact:true}).fill('125.50');await page.getByRole('button',{name:'Save variant',exact:true}).click();await page.waitForFunction(()=>document.querySelector('input[name="price"]').value==='125.5');assert.equal(p.variants[0].price,125.5);
  await page.getByLabel('Choose picture').setInputFiles(path.join(__dirname,'../public/products/technova-pulse-12.webp'));await page.getByRole('button',{name:'Upload picture'}).click();await page.getByText('Picture uploaded.',{exact:true}).waitFor();assert.equal(p.images.length,3);
  await page.getByRole('button',{name:'Make cover',exact:true}).nth(1).click();await page.getByText('Cover picture changed.',{exact:true}).waitFor();assert.equal(p.images[0].imageId,2);
  await page.getByRole('button',{name:'Remove picture',exact:true}).last().click();await page.getByText('Picture removed.',{exact:true}).waitFor();assert.equal(p.images.length,2);
  await page.reload();await page.getByRole('heading',{name:'Updated Phone',exact:true}).waitFor();assert.equal(await page.getByLabel('New quantity',{exact:true}).inputValue(),'12');assert.equal(await page.locator('.admin-photo-grid img').first().getAttribute('src'),p.images[0].url);
  await page.screenshot({path:path.join(require('os').tmpdir(),'brightbuy-admin-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile editor overflows');await page.screenshot({path:path.join(require('os').tmpdir(),'brightbuy-admin-mobile.png'),fullPage:true});
  // Remove every picture: the storefront must not resurrect the bundled defaults.
  while(p.images.length){await page.getByRole('button',{name:'Remove picture',exact:true}).last().click();await page.getByText('Picture removed.',{exact:true}).waitFor();}
  await page.goto(base+'/products/1');await page.getByText('Product image coming soon').waitFor();await page.getByText('In Stock (12)',{exact:true}).waitFor();
  await page.goto(base+'/admin/products/1');await page.getByLabel('Shop visibility').selectOption('DISCONTINUED');await page.getByRole('button',{name:'Save product details'}).click();await page.getByText('Product details saved.',{exact:true}).waitFor();assert.equal(p.status,'DISCONTINUED');
  await page.getByRole('button',{name:'Sign out'}).click();await page.goto(base+'/login');await login('customer@brightbuy.test');await page.waitForURL('**/products');await page.goto(base+'/admin/products');await page.getByRole('heading',{name:'Access restricted'}).waitFor();assert.deepEqual(errors,[]);
  console.log('PASS: separate admin login, customer denial, product/price/stock editing, upload, cover, removal, reload, empty-gallery fallback, visibility and mobile layout (fixture API).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
