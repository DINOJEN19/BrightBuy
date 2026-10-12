# BrightBuy

BrightBuy is a full-stack online shopping prototype built for a university semester project. It provides a customer catalogue and shopping flow, authenticated accounts, cart and checkout functionality, order history, warehouse inventory management, product administration, and administrator reports.

The application is implemented as a React and Vite frontend, a Node.js and Express REST API, and a MySQL 8.0 database. The frontend communicates with the API through a shared Axios client. Authentication uses JSON Web Tokens (JWT), and role-based middleware protects warehouse and administrator operations.

## Features

- Browse products, categories, variants, prices, stock, and product images
- Register, log in, and manage a customer profile
- Add, update, and remove cart items
- Checkout with delivery and payment details
- View order history, order details, payment information, and delivery status
- Adjust inventory as a warehouse staff member or administrator
- Manage products, categories, and variants as an administrator
- View five administrator reports
- Store and deliver database-backed product images
- Run the complete application with Docker Compose

Payment processing is simulated. The application does not contact an external payment provider. Delivery tracking displays stored order statuses and does not integrate with a live carrier.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Vite |
| Frontend HTTP client | Axios |
| Backend | Node.js, Express |
| Authentication | JSON Web Tokens, bcrypt |
| Validation | Joi and application-level validation |
| Database | MySQL 8.0 |
| Database driver | mysql2/promise |
| Local deployment | Docker Compose |
| Browser checks | Playwright |

## Repository structure

```text
BrightBuy/
├── backend/
│   ├── config/          Database pool configuration
│   ├── controllers/     HTTP request and response handlers
│   ├── middleware/      JWT, role, validation, and error middleware
│   ├── routes/          Express REST route modules
│   ├── services/        Application and business logic
│   ├── tests/           Backend unit and HTTP tests
│   └── server.js        Node.js application entry point
├── database/
│   ├── 01_schema.sql    Core relational schema
│   ├── 02_seeds.sql     Seed catalogue data
│   ├── 03_functions_triggers.sql
│   ├── 04_procedures.sql
│   ├── 05_reports_indexes.sql
│   ├── 06_demo_accounts.sql
│   ├── 07_cart_constraints.sql
│   └── 08_product_images.sql
├── frontend/
│   ├── public/products/  Bundled product images
│   ├── src/api/          Shared Axios client
│   ├── src/components/   Shared React components
│   ├── src/context/      Authentication context
│   ├── src/features/     Catalogue, auth, cart, orders, and admin features
│   └── vite.config.js    Development proxy configuration
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Quick start with Docker Compose

### Requirements

- Docker Desktop with Docker Compose
- Internet access for the initial image and dependency downloads
- Port 3001 available for the application
- Port 3306 available for MySQL

### Start the application

From the repository root:

```bash
docker compose up --build -d
```

Check the container status:

```bash
docker compose ps
```

Open the application at:

```text
http://localhost:3001
```

The Docker setup starts MySQL, initializes a new database from the SQL files when the database volume is empty, builds the React frontend, and starts the Express server. MySQL data is stored in the `db_data` Docker volume.

View application or database logs:

```bash
docker compose logs app
docker compose logs db
```

Stop the application without deleting database data:

```bash
docker compose down
```

To intentionally remove the database volume and all local database data:

```bash
docker compose down -v
```

Use the volume-removal command only for a disposable local database.

## Demo accounts

The freshly initialized database includes these demo roles:

| Role | Email | Main permissions |
|---|---|---|
| Customer | `customer@brightbuy.test` | Catalogue, cart, checkout, orders, profile |
| Warehouse staff | `warehouse@brightbuy.test` | Customer features and stock adjustments |
| Administrator | `admin@brightbuy.test` | Customer features, inventory, catalogue management, and reports |

The demo password is:

```text
BrightBuy123!
```

These credentials and the default Docker secrets are for local development only. Replace them before deploying the application.

## Local development

### Requirements

- Node.js 22 LTS
- npm
- MySQL 8.0, or Docker Desktop for the database

### Configure the backend

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Set the database connection values and replace `JWT_SECRET` with a strong local development secret. The important backend variables are:

```text
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=brightbuy
DB_CONNECTION_LIMIT=10
JWT_SECRET=replace-with-a-random-secret
JWT_EXPIRES_IN=2h
```

### Configure the frontend

The default frontend configuration is in `frontend/.env.example`:

```text
VITE_API_URL=/api/v1
```

The Vite development proxy forwards API requests to `http://127.0.0.1:3001`. If the backend uses another port, update `frontend/vite.config.js` and the frontend environment configuration accordingly.

### Install dependencies

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

### Initialize the database

For a new local database:

```bash
npm --prefix backend run db:setup
```

For an existing BrightBuy database:

```bash
npm --prefix backend run db:upgrade
```

Back up an existing database before applying an upgrade. The upgrade scripts add or update constraints, procedures, indexes, demo accounts, and product-image support while preserving existing application data where possible.

### Start the backend

In one terminal:

```bash
npm --prefix backend run dev
```

The API runs at:

```text
http://localhost:3001
```

The health endpoint is:

```text
http://localhost:3001/health
```

### Start the frontend

In another terminal:

```bash
npm --prefix frontend run dev
```

Open:

```text
http://localhost:5173
```

## Architecture

BrightBuy follows a layered architecture:

```text
Customer or staff browser
        |
        | HTTP/REST
        v
React/Vite frontend
        |
        | Axios, JWT bearer token, JSON
        v
Node.js/Express REST API
        |
        +-- JWT authentication and role authorization
        |
        +-- Controllers
        |
        +-- Catalogue, auth, cart, checkout, order,
        |   inventory, image, admin, and reporting services
        |
        | SQL through mysql2/promise connection pool
        v
MySQL 8.0
        |
        +-- Commerce tables and constraints
        +-- Stored procedures and triggers
        +-- Report indexes
        +-- Database-backed product images
```

The Express application is created in `backend/app.js` and started by `backend/server.js`. API routes are mounted under `/api/v1`. The frontend uses the shared Axios client in `frontend/src/api/client.js`, which configures the base URL, adds the JWT from `sessionStorage`, and handles API errors and unauthorized responses.


## Customer checkout flow

1. The customer opens the cart in the React frontend.
2. The frontend requests the cart using the shared Axios client.
3. Axios attaches the stored JWT as a bearer token.
4. The Express route runs `authenticateJWT` and identifies the customer.
5. The cart controller and cart service read the active cart and its items from MySQL.
6. The customer submits delivery and payment information.
7. The frontend sends `POST /api/v1/checkout`.
8. The checkout route verifies the JWT and calls the checkout controller.
9. The checkout service validates delivery, destination, payment, card, and optional cart input.
10. The service obtains a pooled MySQL connection and resolves the active cart when needed.
11. The service calls `sp_PlaceOrder`.
12. The stored procedure starts a `READ COMMITTED` transaction.
13. It locks the customer, cart, and relevant variant rows using `FOR UPDATE`.
14. It checks cart ownership, cart state, product validity, delivery requirements, and stock.
15. It inserts the order, order items, payment, delivery, and stock-adjustment records.
16. It decrements inventory and marks the cart as `CHECKED_OUT`.
17. The procedure commits all changes on success.
18. The service reads the output values, releases the connection, and returns the order response.
19. If a SQL business rule fails, the procedure rolls back and re-signals the error. The centralized error handler maps SQLSTATE `45000` to HTTP 422.



## API overview

All API routes use the `/api/v1` prefix.

| Route group | Purpose | Access |
|---|---|---|
| `/auth` | Registration and login | Public for registration and login |
| `/customers` | Customer profile operations | Authenticated customers |
| `/categories`, `/products`, `/variants` | Catalogue browsing | Public or route-specific |
| `/cart` | Cart reads and item mutations | Authenticated customers |
| `/checkout` | Atomic order placement | Authenticated customers |
| `/orders` | Order history and order details | Authenticated customers |
| `/inventory` | Stock adjustments | Warehouse staff or administrators |
| `/admin` | Product and category administration | Administrators |
| `/reports` | Sales, product, delivery, and customer reports | Administrators |
| `/product-images` | Database-backed image delivery | Route-specific |
| `/health` | Application health check | Public |

## Product images

BrightBuy supports two product-image sources:

1. Bundled images in `frontend/public/products`, served as frontend assets.
2. Database-backed images stored in the `PRODUCT_IMAGE` table as binary data.

The product-image route reads the stored data and returns the binary response with its MIME type. The database image schema is defined in `database/08_product_images.sql`.

## Testing and validation

Run the backend tests:

```bash
npm test --prefix backend
```

Build the frontend:

```bash
npm run build --prefix frontend
```

Run the integration suite against a development database:

```bash
npm --prefix backend run test:integration
```

The integration tests cover checkout behavior, concurrent checkout, stock rollback, permissions, and reports. They require a configured MySQL database and should not be run against production data.

Run frontend browser checks:

```bash
cd frontend
npx playwright install chromium
npm run test:ui
```

Set `BRIGHTBUY_URL` when the application is running at a URL other than the default local address.

## Security and deployment notes

- Do not commit `backend/.env`.
- Replace all default passwords and JWT secrets before deployment.
- Restrict database exposure to trusted hosts. Docker Compose binds MySQL to localhost by default.
- Use HTTPS for deployed frontend and API traffic.
- Use a production-grade secret manager for credentials and JWT secrets.
- Review CORS configuration and cookie or token storage before production deployment.
- Payment and delivery integrations are not implemented in this prototype.

## License

This repository is a university semester project. Add the project’s chosen license here if one is assigned.
