// UI contract smoke test with explicit mocked API responses; no MySQL assertions.
const {chromium}=require('playwright'); const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1365,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let role='CUSTOMER',cartQuantity=0,placed=false;
 const product={productId:1,productName:'Everyday Headphones',brand:'Bright Audio',description:'Comfortable wireless audio.',categories:[{categoryId:1,categoryName:'Electronics'}],variants:[{variantId:1,sku:'BB-001',variantName:'Midnight',price:49.9,inStock:10}]};
 let user={customerId:1,fullName:'Demo Customer',email:'customer@brightbuy.test',phone:'1234567890',address:'10 Test Road',city:'Austin',role};
 const item=()=>({cartItemId:1,variantId:1,variantName:'Midnight',quantity:cartQuantity,unitPrice:49.9,subtotal:49.9*cartQuantity});
 await page.route('**/api/v1/**',async route=>{
  const req=route.request();const path=new URL(req.url()).pathname.replace('/api/v1','');const method=req.method();const body=req.postDataJSON();
  let data,meta,status=200;
  if(path==='/auth/login'){role=body.email.startsWith('admin')?'ADMIN':body.email.startsWith('warehouse')?'WAREHOUSE_STAFF':'CUSTOMER';user={...user,role};data={token:'fixture-token',customer:user};}
  else if(path==='/auth/register'){data={customerId:1,email:body.email};status=201;}
  else if(path==='/customers/me'){if(method==='PUT')user={...user,...body};data=user;}
  else if(path==='/categories')data=product.categories;
  else if(path==='/products'){data=[product];meta={page:1,pageSize:20,total:1};}
  else if(path==='/products/1')data=product;
  else if(path==='/cart')data={cartId:1,items:cartQuantity?[item()]:[],total:cartQuantity*49.9};
  else if(path==='/cart/items'&&method==='POST'){assert.equal(body.variantId,1);cartQuantity+=body.quantity;data={cartItemId:1};status=201;}
  else if(path==='/cart/items/1'){cartQuantity=method==='DELETE'?0:body.quantity;data={cartItemId:1,quantity:cartQuantity};}
  else if(path==='/checkout'){assert.equal(body.paymentMethod,'CASH_ON_DELIVERY');assert.ok(body.deliveryAddress);placed=true;cartQuantity=0;data={orderId:1,estimatedDeliveryDate:'2026-10-12',orderStatus:'CONFIRMED'};status=201;}
  else if(path==='/orders'){data=placed?[{orderId:1,orderDate:'2026-10-07',orderStatus:'CONFIRMED',totalAmount:49.9,deliveryMode:'STANDARD_DELIVERY',paymentStatus:'PENDING'}]:[];meta={page:1,pageSize:20,total:data.length};}
  else if(path==='/orders/1')data={orderId:1,items:[{...item(),quantity:1,subtotal:49.9}],delivery:{deliveryMode:'STANDARD_DELIVERY',destinationCity:'Austin',deliveryStatus:'PENDING',estimatedDeliveryDate:'2026-10-12'},payment:{paymentMethod:'CASH_ON_DELIVERY',paymentStatus:'PENDING',amount:49.9}};
  else if(path.startsWith('/reports/'))data=[];
  else if(path==='/inventory/stock-adjustments'){data={adjustmentId:1,newStockQuantity:12};status=201;}
  else throw new Error(`Unhandled fixture: ${method} ${path}`);
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify({data,...(meta?{meta}:{})})});
 });
 const base=process.env.BRIGHTBUY_URL||'http://127.0.0.1:3001';
 try {
  await page.goto(base+'/products');await page.getByRole('link',{name:'View Details'}).click();
  await page.getByRole('button',{name:'Add to Cart',exact:true}).click();await page.waitForURL('**/login');
  await page.getByLabel('Email',{exact:true}).fill('customer@brightbuy.test');await page.getByLabel('Password',{exact:true}).fill('BrightBuy123!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/products/1');
  await page.getByRole('button',{name:'Add to Cart',exact:true}).click();await page.getByRole('link',{name:'View cart',exact:true}).click();
  await page.getByRole('button',{name:/Proceed to Checkout/}).click();await page.getByPlaceholder('e.g. 1044 Main Parkway, Suite 200, TX 75001').fill('10 Test Road');
  await page.getByRole('button',{name:'Confirm & Place Order'}).click();await page.waitForURL('**/order-confirmation');assert.ok(placed);
  await page.goto(base+'/orders/1');await page.getByRole('heading',{name:'Order #1',exact:true}).waitFor();
  await page.goto(base+'/profile');await page.getByLabel('City',{exact:true}).fill('Dallas');await page.getByRole('button',{name:'Save changes'}).click();await page.getByRole('status').waitFor();assert.equal(user.city,'Dallas');
  await page.goto(base+'/admin');await page.getByRole('heading',{name:'Access restricted'}).waitFor();
  await page.getByRole('button',{name:'Sign out'}).click();await page.goto(base+'/register');
  for(const [label,value] of [['Full name','New User'],['Email','new@example.com'],['Password','Password123!'],['Phone','12345678'],['Address','10 Test Rd'],['City','Austin']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByRole('button',{name:'Create account',exact:true}).click();await page.waitForURL('**/products');
  await page.getByRole('button',{name:'Sign out'}).click();await page.goto(base+'/admin/login');
  await page.getByLabel('Email',{exact:true}).fill('admin@brightbuy.test');await page.getByLabel('Password',{exact:true}).fill('BrightBuy123!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/admin');
  for(const path of ['/admin','/admin/categories/new','/admin/products/new','/admin/reports/quarterly-sales','/admin/reports/top-selling-products','/admin/reports/category-order-counts','/admin/reports/delivery-estimates','/admin/reports/customer-summary','/inventory/stock-adjustments']) {
    await page.goto(base+path);await page.locator('main h1').waitFor();assert.ok(!await page.getByRole('heading',{name:'Access restricted'}).count(),path);
  }
  await page.goto(base+'/products');await page.getByRole('link',{name:'View Details'}).waitFor();
  await page.screenshot({path:process.env.BRIGHTBUY_SCREENSHOT||require('path').join(require('os').tmpdir(),'brightbuy-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/checkout');await page.locator('main').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'mobile layout overflows');
  assert.deepEqual(errors,[]);console.log('PASS: guest redirect, login, add to cart, checkout, order detail, profile, registration, role guards, admin routes, mobile layout. API responses are mocked.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
