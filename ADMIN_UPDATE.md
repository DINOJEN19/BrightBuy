# BrightBuy admin update

## What is available

- Separate Customer and Admin choices on sign-in; administrator accounts open the admin dashboard.
- Search and manage every product, including hidden products.
- Upload PNG, JPEG or WebP pictures (up to 2 MB each, 8 per product), remove pictures, and choose the cover picture.
- Edit product name, brand, description, categories and shop visibility.
- Edit variant names, prices and availability.
- Set variant stock quantities with a required reason. Every actual change is recorded in STOCK_ADJUSTMENT.
- Existing product/category creation and management reports remain available. After creating a product, follow the new link to upload pictures.

Customer accounts cannot access admin APIs or gain admin rights by choosing the Admin sign-in option. Account roles are assigned in the database, not during public registration.

## Update your existing Windows project

1. Stop both development servers with Ctrl+C.
2. Extract BrightBuy-admin-update.zip. Copy its backend, frontend and database folders into your existing BrightBuy-main folder, merging folders and replacing matching files. Copy ADMIN_UPDATE.md and CHANGED_FILES.md if desired. Do not delete or replace your working backend/.env.
3. In PowerShell inside BrightBuy-main, run:

```powershell
cd backend
npm install
npm run db:upgrade
npm run dev
```

4. Open a second PowerShell terminal inside BrightBuy-main:

```powershell
cd frontend
npm install
npm run dev
```

5. Open the localhost URL printed by Vite (normally http://localhost:5173). Sign out of an old session, click Sign in, then Admin. You can also open http://localhost:5173/admin/login directly.

## Local demo admin

Email: admin@brightbuy.test
Password: BrightBuy123!

These credentials are for the seeded local demo account. The upgrade inserts it if absent and does not overwrite an existing account's password or role. If you previously changed that account, use its current credentials. JWT_SECRET is not an account password.

After login: Admin dashboard -> Manage Products & Photos -> select a product.

## Using the complete ZIP instead

Extract BrightBuy-prototype.zip and copy your working backend/.env into the new backend folder. Then follow the commands above. If you have no .env, run Copy-Item .env.example .env from backend, edit .env with your actual MySQL credentials, and set a private JWT_SECRET. Editing .env.example alone does not configure the running application.

Use db:upgrade for the existing BrightBuy database. Only use db:setup for a new database. The image-only update ZIP from the previous release is not sufficient for this feature.

## Database changes and persistence

The existing project already implements CUSTOMER, ADMIN and WAREHOUSE_STAFF roles through CUSTOMER.role. This update exposes the customer/admin distinction in the UI and enforces it in the API. It retains that implemented schema rather than restructuring existing accounts into the separate USER, ROLE and ADMIN tables shown in the ER diagram.

New database/08_product_images.sql creates PRODUCT_IMAGE and imports the 80 bundled pictures as gallery entries. Upgrade does not delete your products, customers or orders. Seed gallery rows use unique product/path pairs and soft deletion, so rerunning the upgrade does not duplicate images or restore removed pictures. Uploaded image bytes are stored in MySQL; they survive browser reloads and server restarts and are included in database backups. No separate upload folder or browser-local storage is used.

Renaming a product preserves its gallery because images are related by product ID. Removing every picture leaves the storefront placeholder. The first gallery picture is the cover. Hiding products/variants preserves order history.

Stock changes use a transaction, row lock and expected previous quantity. If checkout or another administrator changes stock after the page loads, the update is rejected. Click Reload product and enter the intended quantity again. Negative and fractional quantities are rejected.

## Verification

- Production frontend build passed.
- 85 backend tests passed, including admin access control, portal roles, upload validation/size limit and binary handling, stock conflicts/rollback and image ownership.
- Browser admin checks passed with fixture API responses and real bundled pictures: login, customer denial, product/price/stock editing, upload UI, cover selection, removal, reload, zero-image fallback, hiding and mobile layout.
- Existing shopping-flow browser checks and all 80 gallery-image checks passed.
- A real-MySQL integration test is included for photo persistence, stock conflict and visibility, but was not executed here because a MySQL server is unavailable. Run npm run test:integration in backend after a successful db:upgrade on a local test database. Docker startup was not verified here.

To repeat browser checks against a running production build on port 3001: npm run test:admin, npm run test:ui and npm run test:images from frontend. These are explicitly fixture-backed UI tests, not substitutes for MySQL integration.
