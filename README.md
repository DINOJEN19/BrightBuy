# Latest update: administrator controls

See `ADMIN_UPDATE.md` for setup, admin login and editable pictures/stock. Existing databases must run `npm run db:upgrade` once for `08_product_images.sql`.

# BrightBuy working prototype

React + Vite frontend, Express API, and MySQL 8.0 database. Existing catalogue, cart, order, stock and management-report features are connected through a shared app shell and authentication flow.

## Quick start — Docker Desktop

Open a terminal in `BrightBuy-main` (the folder containing `docker-compose.yml`):

```bash
docker compose up --build -d
```

Wait for initialization, then open **http://localhost:3001**. The application serves the built frontend and API together. MySQL data persists in a Docker volume.

```bash
docker compose ps
docker compose logs app db
```

First-time builds require internet access to download the base images and npm dependencies. Port 3001 must be free; MySQL is exposed on local port 3306. Change the left side of the Compose port mapping if your PC already uses either port.

## Demo accounts

All use the password **`BrightBuy123!`**.

| Role | Email | Features |
|---|---|---|
| Customer | customer@brightbuy.test | Catalogue, cart, checkout, orders, profile |
| Warehouse staff | warehouse@brightbuy.test | Customer features and stock adjustments |
| Administrator | admin@brightbuy.test | Customer features, inventory, catalogue administration, five reports |

The original five sample customer accounts also use this password on a freshly initialized database. You can register additional customers from the sign-in page. Demo accounts and default Compose secrets are for local development.

## Existing database / existing Docker volume

**Back up your database first. Do not delete the existing volume.** MySQL only imports the `database` directory when its data directory is empty.

After rebuilding the app, apply the non-destructive upgrade:

```bash
docker compose exec app npm --prefix backend run db:upgrade
```

This updates checkout locking and the top-selling report, creates missing demo accounts, and adds cart uniqueness constraints. It preserves existing customers, orders, inventory, and passwords. If an existing database has duplicate ACTIVE carts for one customer or duplicate variants in a cart, the upgrade stops at the affected constraint; reconcile those records before rerunning it. The SQL changes are not all transactional, so earlier steps may already have succeeded; the upgrade command is designed to be rerun.

## Local development — Windows / macOS / Linux

Requirements: Node.js 22 LTS, npm, and MySQL 8.0 (or Docker Desktop for the database).

1. Copy `backend/.env.example` to `backend/.env`. Set `JWT_SECRET` to a random value and match the database connection settings.
2. Install both applications:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

3. Start a database. With Docker, `docker compose up -d db` initializes it automatically. For a separately installed MySQL instance, run `npm --prefix backend run db:setup` to create a new database, or `npm --prefix backend run db:upgrade` for an existing BrightBuy database.
4. Start the API in one terminal:

```bash
npm --prefix backend run dev
```

5. Start the frontend in another terminal:

```bash
npm --prefix frontend run dev
```

Open **http://localhost:5173**. Vite proxies `/api/v1` to the API at port 3001. `frontend/.env.example` documents the optional API URL. If you change the API port, also update `frontend/vite.config.js`.

## Main routes

| URL | Purpose |
|---|---|
| `/products`, `/categories`, `/products/:id` | Browse, filter, search and choose variants |
| `/login`, `/register`, `/profile` | Account and profile |
| `/cart`, `/checkout`, `/order-confirmation` | Shopping flow |
| `/orders`, `/orders/:orderId` | Order history and tracking |
| `/inventory/stock-adjustments` | Warehouse/admin inventory changes |
| `/admin` | Catalogue administration and links to all five reports |

Card payment is **a simulation**; it does not contact a payment processor. Use the displayed test card only. Cash-on-delivery is the default. Delivery tracking displays stored statuses; live shipping and carrier integration are outside this prototype. New databases have no historical orders, so reports start empty until you place orders.

## Validation

```bash
npm test --prefix backend
npm run build --prefix frontend
```

The backend unit/HTTP tests use mocked database connections. The separate integration suite requires real MySQL and the demo accounts:

```bash
docker compose exec app npm --prefix backend run test:integration
```

Or, with a local `backend/.env` configured:

```bash
npm --prefix backend run test:integration
```

The integration suite creates unique test customers/products, verifies concurrent checkout, stock rollback, permissions and reports, then removes its fixtures. Run it against a development database.

Browser contract checks use explicitly mocked API responses. With the built app/API running on port 3001:

```bash
cd frontend
npx playwright install chromium
npm run test:ui
```

Set `BRIGHTBUY_URL` to test a different local server URL.

See `VALIDATION.md` for what was actually verified in the delivered environment, and `CHANGED_FILES.md` for every added/modified path relative to this root.

## Stop

```bash
docker compose down
```

This preserves the database volume. `docker compose down -v` deletes database data; it is only appropriate when intentionally discarding a disposable demo database.

## Product pictures

The 40 seeded products include local illustrative pictures. See `PRODUCT_IMAGES_UPDATE.md` for installation and changed paths. Run `npm run test:images` in frontend against the running app to check image loading.

Each of the 40 seeded products now has two locally bundled pictures, selectable using thumbnails on its detail page. See PRODUCT_IMAGES_UPDATE.md.
