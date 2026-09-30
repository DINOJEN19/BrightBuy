BrightBuy Full-Stack Development
Team Build Guide - Backend + Frontend, 5-Person Edition
Vertical-slice ownership across Node.js/Express API and React UI, built for a tight deadline

With a tight deadline, splitting frontend and backend into 10 separate assignments across 5 people creates more coordination overhead than it saves every feature would need two people to agree on a contract before either can finish. Instead, this guide gives each of the 5 developers a full vertical slice: their own backend routes AND the matching React pages that call them. Because the same person writes both sides of their feature, there is no API-contract negotiation within a slice only between slices, and those boundaries are frozen up front in Section 4.

The remaining conflict risk is shared/infrastructure files that everyone's code depends on (the Express app entrypoint, the DB pool, the React app shell, the shared API client, the shared component library). Section 5 assigns every one of those files to a single owner so no two people ever edit the same infrastructure file.

Stack: Node.js + Express, JSON over HTTPS, JWT-based session auth, MySQL 8.0 backend (the schema and procedures from the BrightBuy MIMS Database Build Guide), React.js frontend.

1. Introduction
Each person's job spans the full request path for their feature area: a React page/component, an API call, an Express route/controller, and (where applicable) a MySQL stored procedure/function call. Business logic that guarantees ACID behaviour - stock validation, atomic order placement, delivery-estimate calculation already lives in the database layer (sp_PlaceOrder, fn_calculate_delivery_estimate, trg_prevent_negative_stock); no one reimplements that logic in JavaScript on either the frontend or the backend, they orchestrate and display it.

The 5 people below own independent, end-to-end feature slices so that work can proceed in full parallel with minimal merge conflicts. Cross-cutting infrastructure the Express app entrypoint, the shared JWT/auth middleware, the centralized error handler, the DB connection pool, the React app shell/router, the shared API client, and the shared component library is explicitly owned by single individuals in Section 5, so it exists (even as a stub) before anyone else's feature work needs it.

2. Master Naming Reference

2.1 Route Modules and Owners
File | Owner | Covers
--- | --- | ---
auth.routes.js / customers.routes.js | Person 1 | Registration, login, session, profile
catalogue.routes.js | Person 2 | Categories, products, variants, search
cart.routes.js / checkout.routes.js | Person 3 | Cart CRUD, checkout orchestration
orders.routes.js / inventory.routes.js | Person 4 | Order history, delivery/payment status, stock adjustments
reports.routes.js / admin.routes.js | Person 5 | 5 management reports, catalogue admin

2.1b Full-Stack Ownership Matrix (Backend + Frontend, same person)
Person | Backend (Express + MySQL) | Frontend (React)
--- | --- | ---
Person 1 | auth/customers routes + platform infra | Login/Register pages, Auth context, App shell, shared API client, shared component library
Person 2 | catalogue routes | Category/Product/ProductDetail pages, ProductCard, SearchBar, Category Filter components
Person 3 | cart/checkout routes | Cart page, Checkout flow, Order-confirmation page, Delivery Mode Selector, PaymentMethodSelector
Person 4 | orders/inventory routes | Order-history page, Order-detail page, Stock-adjustment page (staff), OrderStatusBadge
Person 5 | reports/admin routes | Admin dashboard, 5 report views, Product/Category admin forms

Because the same person writes both the API and the UI for a feature, there is no cross-person negotiation needed inside a slice only at the boundaries between slices (e.g., Person 3's checkout page reading Person 2's product/variant shape), which Section 4 freezes as fixed contracts.

2.2 Shared Middleware
Middleware | Owner | Purpose
--- | --- | ---
authenticateJWT | Person 1 (built), all (consumed) | Verifies the Bearer token, attaches req.user
requireRole(role) | Person 1 (built), all (consumed) | Blocks access unless req.user.role is in the allowed set
validateBody(schema) | Person 1 (built), all (consumed) | Rejects malformed request bodies before hitting a controller
errorHandler | Person 1 | Centralized Express error middleware; maps DB SIGNAL text to HTTP codes

2.3 Fixed Conventions (apply to every route, every person)
Convention | Value | Notes
--- | --- | ---
Base API path | /api/v1 | All routes
Auth header | Authorization: Bearer | All protected routes
JWT payload | {customerId, role, iat, exp} | roles: GUEST is unauthenticated (no token)
JWT expiry | 2 hours (access token) | Person 1
User roles | CUSTOMER, WAREHOUSE_STAFF, ADMIN | Matches SRS Section 2.3 user classes
Pagination defaults | page=1, pageSize=20 max pageSize=100 | GET list endpoints (catalogue, orders, reports)
Success envelope | { "data": ..., "meta": ... } | All 2xx JSON responses
Error envelope | { "error": { "code": ..., "message": ... } } | All 4xx/5xx JSON responses
DB error mapping | SQLSTATE '45000' -> HTTP 422 | Any SIGNALed business-rule violation from a procedure/trigger

3. Syntax Patterns
Generic, unrelated example patterns not the literal BrightBuy answer. Adapt the shape to the exact route/procedure names given in Sections 2 and 4.

Pattern: an Express route + controller skeleton
// routes/example.routes.js
const router = require('express').Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/example.controller');

router.get('/items/:id', ctrl.getItem);
router.post('/items', authenticateJWT, requireRole('ADMIN'), ctrl.createItem);
module.exports = router;

// controllers/example.controller.js
exports.getItem = async (req, res, next) => {
  try {
    const item = await itemService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    res.json({ data: item });
  } catch (err) { next(err) }
};

Pattern: JWT authentication middleware
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid' } });
  }
}

Pattern: calling a stored procedure from a service function
// services/example.service.js
async function placeExampleOrder(pool, params) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'CALL sp_example_procedure(?, ?, ?)',
      [params.a, params.b, params.c]
    );
    return rows[0][0]; // first result set, first row
  } catch (err) {
    // MySQL SIGNAL SQLSTATE 45000 surfaces here as err.sqlState === '45000'
    throw err;
  } finally {
    conn.release();
  }
}

Pattern: centralized error-handling middleware
// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  if (err.sqlState === '45000') {
    return res.status(422).json({ error: { code: 'BUSINESS_RULE_VIOLATION', message: err.sqlMessage } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
}
module.exports = errorHandler;

Pattern: a feature's frontend routes exported as a fragment (avoids everyone editing App.jsx)
// features/example/routes.jsx (owned by whichever person owns this feature)
import { Route } from 'react-router-dom';
import ExampleListPage from './ExampleListPage';
import ExampleDetailPage from './ExampleDetailPage';

export const exampleRoutes = [
  <Route key="example-list" path="/examples" element={<ExampleListPage />} />,
  <Route key="example-detail" path="/examples/:id" element={<ExampleDetailPage />} />
];

// App.jsx (owned only by Person 1 imports and spreads every feature's routes)
import { exampleRoutes } from './features/example/routes';
import { catalogueRoutes } from './features/catalogue/routes';
// ...one import per feature, added once when a feature module is first created
<Routes>
  {exampleRoutes}
  {catalogueRoutes}
</Routes>

Pattern: a shared API client used by every feature (never duplicated per feature)
// api/client.js (owned by Person 1)
import axios from 'axios';

const client = axios.create({ baseURL: '/api/v1' });

client.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) authStore.logout();
    return Promise.reject(err.response?.data?.error ?? err);
  }
);

export default client;

// features/example/api.js (owned by the feature's person imports the shared client, never recreates it)
import client from '../../api/client';
export const getExample = (id) => client.get(`/examples/${id}`);


4. The Backend Build Tasks (5-Person Split)
Each person builds and unit-tests their own route module independently against a running instance of the BrightBuy database (see the companion Database Build Guide). Integration happens once all five modules are mounted on the shared Express app in Section 4.6.

PERSON 1 - Auth, Customers & Platform Infrastructure
Owns: registration/login, JWT/session middleware, customer profile, the shared Express app skeleton, and the centralized error handler.

POST /api/v1/auth/register
Auth required: None (guest)
Purpose: Create a new customer account.
Calls into DB layer: INSERT into CUSTOMER (password hashed with bcrypt before insert; REQ-2.2)
Request: { fullName, email, password, phone, address, city }
Success response: 201 { data: { customerId, email } }
Error responses:
409 EMAIL_TAKEN: "An account with this email already exists."
400 VALIDATION_ERROR: "Missing or invalid registration fields."

POST /api/v1/auth/login
Auth required: None (guest)
Purpose: Authenticate a customer and issue a JWT.
Calls into DB layer: SELECT from CUSTOMER by email; bcrypt.compare against password_hash (REQ-2.3)
Request: { email, password }
Success response: 200 { data: { token, expiresIn, customer: {...} } }
Error responses:
401 INVALID_CREDENTIALS: "Email or password is incorrect."

POST /api/v1/auth/logout
Auth required: Customer
Purpose: Invalidate the current session (client discards token; optional server-side blacklist).
Success response: 204 No Content

GET /api/v1/customers/me
Auth required: Customer
Purpose: Return the logged-in customer's own profile.
Calls into DB layer: SELECT from CUSTOMER by req.user.customerId
Success response: 200 { data: { customerId, fullName, email, phone, address, city } }

PUT /api/v1/customers/me
Auth required: Customer
Purpose: Update the logged-in customer's own profile fields.
Calls into DB layer: UPDATE CUSTOMER by req.user.customerId
Request: { fullName?, phone?, address?, city? }
Success response: 200 { data: { ...updated profile } }

4.1.1 Also owned by Person 1: Platform Infrastructure
• server.js / app.js: Express app bootstrap, JSON body parsing, HTTPS enforcement, mounting all 5 route modules under /api/v1.
• config/db.js: the MySQL connection pool (mysql2/promise), read from environment variables, exported for every service module to reuse.
• middleware/auth.js: authenticateJWT and requireRole(role), as specified in Section 2.2, used by all other 4 people.
• middleware/validateBody.js: a generic JSON-schema/Joi-based body validator factory, used by all other 4 people.
• middleware/errorHandler.js: the centralized error handler from Section 3, mounted last in app.js.
• Password hashing: bcrypt with a minimum cost factor of 10, applied only in the auth service, never in a controller (REQ-5.3, Security Requirements).

4.1.2 Frontend Responsibilities (Person 1)
File | Purpose
--- | ---
pages/LoginPage.jsx | Login form, calls POST /auth/login, stores token via AuthContext
pages/RegisterPage.jsx | Registration form, calls POST /auth/register
pages/ProfilePage.jsx | View/edit own profile, calls GET/PUT /customers/me
App.jsx | Route table — imports every feature's routes.jsx fragment (Section 3 pattern)
context/AuthContext.jsx | Holds the logged-in user + token; exposes useAuth() hook to all 5 people
api/client.js | Shared Axios instance with auth header + 401 handling (Section 3 pattern)
components/layout/* | Navbar, Footer, PageLayout — used, never edited, by the other 4 people
components/common/* | Button, Input, Spinner, ErrorBanner — the shared design-system primitives
components/RequireRole.jsx | Route guard component; wraps ADMIN/STAFF-only pages (used by Persons 4 and 5)

Anyone needing a new shared component or a change to Navbar/Footer/AuthContext raises it with Person 1 rather than editing these files directly — see Section 5.


PERSON 2 - Product Catalogue & Search
Owns: categories, products, variants, browsing, keyword search, and stock/price display for guests and customers.

GET /api/v1/categories
Auth required: None (guest)
Purpose: List all active categories.
Calls into DB layer: SELECT * FROM CATEGORY (REQ-1.1)
Success response: 200 { data: [ { categoryId, categoryName, description } ] }

GET /api/v1/products
Auth required: None (guest)
Purpose: Browse/search the catalogue with optional filters and pagination.
Calls into DB layer: SELECT from PRODUCT JOIN PRODUCT_CATEGORY, filtered by category_id and/or product_name LIKE (REQ-1.2, REQ-1.4)
Request: Query params: ?category=&q=&page=&pageSize=
Success response: 200 { data: [ { productId, productName, brand, categories: [...] } ], meta: { page, pageSize, total } }

GET /api/v1/products/:productId
Auth required: None (guest)
Purpose: Return full product detail including every variant, price, and stock availability.
Calls into DB layer: SELECT from PRODUCT + SELECT from VARIANT WHERE product_id (REQ-1.3)
Success response: 200 { data: { productId, productName, description, brand, variants: [ { variantId, sku, variantName, colour, memorySize, price, inStock } ] } }
Error responses:
404 NOT_FOUND: "Product not found."

GET /api/v1/variants/:variantId
Auth required: None (guest)
Purpose: Return a single variant's live price and stock status (used by the cart page to re-check availability).
Calls into DB layer: SELECT from VARIANT WHERE variant_id
Success response: 200 { data: { variantId, sku, price, stockQuantity, inStock } }
Error responses:
404 NOT_FOUND: "Variant not found."

Note: this module is read-only from the customer-facing side. Catalogue writes (creating products/categories/variants) belong to Person 5's admin routes (Section 4.5), since only Management/Admin users may modify the catalogue (Business Rule 5.5).

4.2.1 Frontend Responsibilities (Person 2)
File | Purpose
--- | ---
pages/CategoryListPage.jsx | Grid of categories, calls GET /categories
pages/ProductListPage.jsx | Search/filter/paginated product grid, calls GET /products
pages/ProductDetailPage.jsx | Full product view with variant picker, calls GET /products/:id
components/ProductCard.jsx | Reusable product summary tile (used within this feature only)
components/SearchBar.jsx, CategoryFilter.jsx | Search/filter controls, local to this feature
features/catalogue/routes.jsx | Exports this feature's fragment (Section 3 pattern)
features/catalogue/api.js | Wraps the shared api/client.js for this feature's endpoints only

Contract Person 3 depends on: the variant shape returned by GET /products/:productId (variantId, sku, price, inStock) is frozen from Section 4.2's backend spec - Person 3's cart page consumes it as-is.


PERSON 3 — Shopping Cart & Checkout Orchestration
Owns: cart CRUD for logged-in customers, and the checkout endpoint that wraps the atomic sp_PlaceOrder call.

GET /api/v1/cart
Auth required: Customer
Purpose: Return the logged-in customer's active cart with line items and a running total.
Calls into DB layer: SELECT from CART WHERE customer_id AND cart_status='ACTIVE', JOIN CART_ITEM/VARIANT
Success response: 200 { data: { cartId, items: [ { cartItemId, variantId, variantName, quantity, unitPrice, subtotal } ], total } }

POST /api/v1/cart/items
Auth required: Customer
Purpose: Add a variant and quantity to the cart (creates the cart row on first use).
Calls into DB layer: INSERT/UPDATE CART, INSERT into CART_ITEM (REQ-3.1)
Request: { variantId, quantity }
Success response: 201 { data: { cartItemId } }
Error responses:
400 INVALID_QUANTITY: "Quantity must be a positive integer."
404 NOT_FOUND: "Variant not found."

PUT /api/v1/cart/items/:cartItemId
Auth required: Customer
Purpose: Update the quantity of an existing cart line.
Calls into DB layer: UPDATE CART_ITEM (REQ-3.2)
Request: { quantity }
Success response: 200 { data: { cartItemId, quantity } }
Error responses:
404 NOT_FOUND: "Cart item not found."

DELETE /api/v1/cart/items/:cartItemId
Auth required: Customer
Purpose: Remove a line item from the cart.
Calls into DB layer: DELETE FROM CART_ITEM (REQ-3.2)
Success response: 204 No Content

POST /api/v1/checkout
Auth required: Customer
Purpose: Convert the active cart into a confirmed order. This is the single most important endpoint in the system — it is a thin wrapper around sp_PlaceOrder and must not duplicate any of that procedure's validation in JavaScript.
Calls into DB layer: CALL sp_PlaceOrder(customerId, cartId, deliveryMode, deliveryAddress, destinationCity, paymentMethod) — the entire atomic transaction (REQ-4.1 through REQ-4.6)
Request: { deliveryMode: 'STORE_PICKUP'|'STANDARD_DELIVERY', deliveryAddress?, destinationCity, paymentMethod: 'CASH_ON_DELIVERY'|'CARD_PAYMENT', cardDetails? }
Success response: 201 { data: { orderId, estimatedDeliveryDate, orderStatus: 'CONFIRMED' } }
Error responses:
422 BUSINESS_RULE_VIOLATION: surfaces sp_PlaceOrder's exact SIGNAL text verbatim (e.g. insufficient stock, empty cart, missing address) — see the Database Build Guide, Task 4.
400 VALIDATION_ERROR: "Card details failed basic format validation." (checked before calling the procedure, for CARD_PAYMENT)

Rule for this module: the checkout controller performs zero stock arithmetic itself. Its only jobs are (a) basic card-format checks before calling the procedure for CARD_PAYMENT, and (b) translating the procedure's single result set / SIGNAL error into the HTTP response shapes above.

4.3.1 Frontend Responsibilities (Person 3)
File | Purpose
--- | ---
pages/CartPage.jsx | Line items, quantity edit/remove, calls GET/POST/PUT/DELETE /cart(/items)
pages/CheckoutPage.jsx | Delivery/payment form, calls POST /checkout, renders 422 business-rule errors inline
pages/OrderConfirmationPage.jsx | Shows orderId + estimatedDeliveryDate returned by checkout
components/DeliveryModeSelector.jsx, PaymentMethodSelector.jsx | Form controls local to this feature
features/cart/routes.jsx, features/cart/api.js | This feature's route fragment + API wrapper

Contract this slice depends on: Person 2's variant price/stock shape (read in the cart), and Person 1's AuthContext (checkout requires a logged-in customer). Contract this slice produces for others: the CUSTOMER_ORDER/ORDER_ITEM/PAYMENT/DELIVERY rows that Person 4's order-history page reads.


PERSON 4 Orders, Payment, Delivery & Inventory Ops
Owns: customer order history/detail, delivery and payment status lookups, and staff-facing stock-adjustment endpoints.

GET /api/v1/orders
Auth required: Customer
Purpose: List the logged-in customer's own past and current orders.
Calls into DB layer: SELECT from CUSTOMER_ORDER JOIN PAYMENT WHERE customer_id (REQ-8.1)
Request: Query params: ?page=&pageSize=
Success response: 200 { data: [ { orderId, orderDate, orderStatus, totalAmount, deliveryMode, paymentStatus } ], meta: {...} }

GET /api/v1/orders/:orderId
Auth required: Customer (own order only)
Purpose: Full order detail: line items, delivery estimate, and payment status.
Calls into DB layer: SELECT from CUSTOMER_ORDER + ORDER_ITEM + DELIVERY + PAYMENT, ownership checked against req.user.customerId (REQ-8.2)
Success response: 200 { data: { orderId, items: [...], delivery: {...}, payment: {...} } }
Error responses:
403 FORBIDDEN: "This order does not belong to you."
404 NOT_FOUND: "Order not found."

GET /api/v1/orders/:orderId/delivery
Auth required: Customer (own order only)
Purpose: Delivery mode, destination, status, and estimated/actual delivery date for one order.
Calls into DB layer: SELECT from DELIVERY WHERE order_id
Success response: 200 { data: { deliveryMode, destinationCity, deliveryStatus, estimatedDeliveryDate, actualDeliveryDate } }

GET /api/v1/orders/:orderId/payment
Auth required: Customer (own order only)
Purpose: Payment method and status for one order.
Calls into DB layer: SELECT from PAYMENT WHERE order_id (REQ-7.1)
Success response: 200 { data: { paymentMethod, paymentStatus, amount, paymentDate } }

POST /api/v1/inventory/stock-adjustments
Auth required: WAREHOUSE_STAFF or ADMIN
Purpose: Manually adjust a variant's stock (restock, correction, damage write-off).
Calls into DB layer: UPDATE VARIANT.stock_quantity + INSERT into STOCK_ADJUSTMENT, guarded by trg_prevent_negative_stock (REQ-5.4)
Request: { variantId, adjustmentType: 'RESTOCK'|'CORRECTION'|'DAMAGE', quantityChange, reason }
Success response: 201 { data: { adjustmentId, newStockQuantity } }
Error responses:
422 BUSINESS_RULE_VIOLATION: "Stock adjustment rejected: resulting stock quantity cannot fall below zero." (surfaced from trg_prevent_negative_stock)

Ownership check pattern: for every /orders/:orderId route, the controller MUST verify req.user.customerId matches the order's customer_id before returning data do this in JavaScript, not by trusting the URL parameter alone.

4.4.1 Frontend Responsibilities (Person 4)
File | Purpose
--- | ---
pages/OrderHistoryPage.jsx | Customer's own orders, calls GET /orders
pages/OrderDetailPage.jsx | Line items + delivery + payment status, calls GET /orders/:id(/delivery/payment)
pages/StockAdjustmentPage.jsx | Staff-only form, calls POST /inventory/stock-adjustments
components/OrderStatusBadge.jsx, DeliveryTracker.jsx | Display components local to this feature
features/orders/routes.jsx, features/orders/api.js | This feature's route fragment + API wrapper

This slice's pages render data that only exists after Person 3's checkout has run, so this person's UI is easiest to demo/test once a few real orders exist - build against mocked order JSON first rather than waiting.


PERSON 5 — Management Reporting & Catalogue Administration
Owns: the five mandated management reports and the admin-only catalogue-management endpoints (create/update product, category, variant).

GET /api/v1/reports/quarterly-sales
Auth required: ADMIN
Purpose: Quarterly sales report for a given year (REQ-9.1).
Calls into DB layer: SUM(total_amount) from CUSTOMER_ORDER grouped by quarter of order_date
Request: Query params: ?year=2026
Success response: 200 { data: [ { quarter: 'Q1', totalSales } ] }

GET /api/v1/reports/top-selling-products
Auth required: ADMIN
Purpose: Top-selling products for a given period, by quantity and/or revenue (REQ-9.2).
Calls into DB layer: SUM(quantity), SUM(subtotal) from ORDER_ITEM joined to VARIANT/PRODUCT
Request: Query params: ?from=&to=&limit=10
Success response: 200 { data: [ { productId, productName, unitsSold, revenue } ] }

GET /api/v1/reports/category-order-counts
Auth required: ADMIN
Purpose: Category-wise total number of orders (REQ-9.3).
Calls into DB layer: COUNT(DISTINCT order_id) via ORDER_ITEM → VARIANT → PRODUCT → PRODUCT_CATEGORY → CATEGORY
Success response: 200 { data: [ { categoryId, categoryName, orderCount } ] }

GET /api/v1/reports/delivery-estimates
Auth required: ADMIN
Purpose: Delivery time estimates for upcoming (undelivered) orders (REQ-9.4).
Calls into DB layer: SELECT from DELIVERY WHERE delivery_status <> 'DELIVERED'
Success response: 200 { data: [ { orderId, destinationCity, estimatedDeliveryDate, deliveryStatus } ] }

GET /api/v1/reports/customer-summary
Auth required: ADMIN
Purpose: Customer-wise order summary with payment status (REQ-9.5).
Calls into DB layer: SELECT from CUSTOMER_ORDER JOIN PAYMENT, grouped by customer_id
Success response: 200 { data: [ { customerId, fullName, orders: [ { orderId, totalAmount, paymentStatus } ] } ] }

POST /api/v1/admin/categories
Auth required: ADMIN
Purpose: Create a new category.
Calls into DB layer: INSERT into CATEGORY
Request: { categoryName, description? }
Success response: 201 { data: { categoryId } }
Error responses:
409 CATEGORY_EXISTS: "A category with this name already exists."

POST /api/v1/admin/products
Auth required: ADMIN
Purpose: Create a new product with its category links and initial variant(s).
Calls into DB layer: INSERT into PRODUCT, PRODUCT_CATEGORY, VARIANT (REQ-1.4, Business Rule 5.5)
Request: { productName, description?, brand?, categoryIds: [...], variants: [ { sku, variantName, colour?, memorySize?, price, stockQuantity } ] }
Success response: 201 { data: { productId, variantIds: [...] } }
Error responses:
400 VALIDATION_ERROR: "Every product requires at least one category and one variant."
409 SKU_TAKEN: "This SKU is already in use."

PUT /api/v1/admin/variants/:variantId
Auth required: ADMIN
Purpose: Update a variant's price, name, or status (does not directly touch stock_quantity — use inventory endpoint for that).
Calls into DB layer: UPDATE VARIANT
Request: { variantName?, price?, status? }
Success response: 200 { data: { variantId, ...updated fields } }

All routes in this module MUST be mounted behind requireRole('ADMIN') (REQ-9.6, Business Rule 5.5). Report queries should be written to use the indexes specified in the Database Build Guide, Task 5, rather than full table scans.

4.5.1 Frontend Responsibilities (Person 5)
File | Purpose
--- | ---
pages/AdminDashboardPage.jsx | Landing page for ADMIN role, links to the 5 report views
pages/reports/*.jsx | One view per report (quarterly sales, top-selling, category counts, delivery estimates, customer summary)
pages/admin/ProductFormPage.jsx, CategoryFormPage.jsx | Create/edit catalogue entries, calls POST /admin/products, /admin/categories
components/ReportChart.jsx | Reusable chart wrapper for the 5 report views
features/admin/routes.jsx | This feature's route fragment + API wrapper
features/admin/api.js | This feature's route fragment + API wrapper

This slice's routes must be wrapped in a shared guard component (owned by Person 1 alongside AuthContext) rather than each page re-implementing its own role check.


4.6 Integration Checklist (all 5, after individual modules pass their own tests)
1. Person 1 merges server.js, config/db.js, and both shared middleware files first, so a running (even empty) app exists for everyone else to mount into.
2. Each person mounts their route module under /api/v1 in server.js and confirms their own endpoints respond correctly against a shared dev database seeded per the Database Build Guide, Task 2.
3. Run an end-to-end smoke test across module boundaries: register (Person 1) → browse catalogue (Person 2) → add to cart and checkout (Person 3) → view order history (Person 4) → confirm the order appears in the customer-summary report (Person 5).
4. Confirm every protected route correctly rejects a missing/expired token (401) and a wrong-role token (403) before considering the module done.
5. Load-test /api/v1/checkout specifically with concurrent requests against the same low-stock variant, to confirm sp_PlaceOrder's row-level locking prevents overselling end-to-end through the API, not just at the database layer.


5. Shared/Dependency File Registry (Single-Owner Rule)
Every file below is touched by more than one person's feature work, either directly (they import it) or indirectly (they need it to exist to run their own code). Each one has exactly one owner who is the only person allowed to edit it. Everyone else imports/consumes it as-is; if a change is needed, it goes through the owner rather than a direct edit - this is what actually prevents merge conflicts, more than the branching strategy does.

5.1 Backend Shared Files
File | Owner | Why it's shared
--- | --- | ---
server.js / app.js | Person 1 | Bootstraps Express, auto-loads every routes/ file by filename - nobody else ever edits this
config/db.js | Person 1 | The MySQL connection pool every service module imports
middleware/auth.js | Person 1 | authenticateJWT, requireRole - consumed by all 4 other people
middleware/validateBody.js | Person 1 | Generic request-body validator factory
middleware/errorHandler.js | Person 1 | Central error-to-HTTP mapping, including DB SIGNAL text
package.json (backend) | Person 1 | New dependencies announced in team channel before merging

5.2 Frontend Shared Files
File | Owner | Why it's shared
--- | --- | ---
App.jsx | Person 1 | Route table imports each feature's routes.jsx fragment (Section 3 pattern); features never edit this file directly, only their own routes.jsx
context/AuthContext.jsx | Person 1 | Session/token/role state, consumed by all 4 other people
api/client.js | Person 1 | Shared Axios instance with auth header + 401 handling
components/layout/* | Person 1 | Navbar, Footer, PageLayout
components/common/* | Person 1 | Button, Input, Spinner, ErrorBanner design-system primitives
components/RequireRole.jsx | Person 1 | Route guard used by Persons 4 and 5's admin/staff pages
package.json (frontend) | Person 1 | New dependencies announced in team channel before merging
index.html / main.jsx / global theme/CSS | Person 1 | App bootstrap and design tokens (colours, spacing) referenced by every feature's styles

Person 1 ends up owning every cross-cutting file on both stacks by design they are already building the backend infra in Section 4.1, so consolidating the matching frontend infra under the same person means there is exactly one person to sync with for any shared-file change, not two.

Everything each of the other 4 people creates pages, feature-local components, features/*/routes.jsx, features/*/api.js lives inside that person's own feature folder and is never imported by anyone except through the shared files above, so two people are never editing the same file for two different features.


6. Sequencing Strategy & Branching Plan
The 5 task blocks in Section 4 are written as independent, full-stack ownership areas, not as a strict hand-off chain — but Persons 2–5 all depend on the shared files Person 1 owns (Section 5) on both the backend and the frontend. Without a plan, the project becomes accidentally sequential on Day 1. Given a tight deadline, the goal is to make all 5 people productive immediately, using stubs for the shared files, then swap stubs for the real implementation without pausing anyone's work.

6.1 Repository & Branching Conventions
• One shared repo (or two repos, frontend/backend — either works), one long-lived branch each: main. No long-lived per-person branches.
• Each person works in short-lived feature branches (e.g., feat/cart-endpoints, feat/cart-frontend) and opens a PR against main at least once a day.
• Backend routes/ and frontend features/*/routes.jsx both use the auto-loading/fragment-export pattern from Section 3, so nobody edits app.js or App.jsx after Day 1.
• package.json changes (either stack) are announced before merging.
• Each person's files live entirely inside their own backend route module and their own frontend features/*/ folder; the only files outside those folders they ever touch are the shared files in Section 5, and only to import from them.

6.2 Recommended Day-by-Day Sequencing
When | Who | What happens
--- | --- | ---
Day 0 (kickoff) | All 5 | Freeze the endpoint contracts and page/component list in Section 4 as-is. Any changes after this point go through a team announcement, not a silent edit.
Day 1, morning | Person 1 | Push minimal versions of every file in Section 5: a MOCK authenticateJWT (hardcodes req.user), a stub errorHandler, the DB pool config, a bare App.jsx + AuthContext that returns a fake logged-in user, and a stub api/client.js. Merge to main within hours.
Day 1, afternoon onward | Persons 2, 3, 4, 5 | Start immediately, full-stack, against the mocks: backend controllers/services/procedure calls AND React pages/components calling their own endpoints. The mocks make every route and every page reachable without waiting for real login to exist.
Day 1–2 (in parallel) | Person 1 | Builds the real authenticateJWT, requireRole, AuthContext, login/register pages, and RequireRole guard — not blocking anyone, since everyone else is already using the mocks.
Day 2–3 | Person 1 | Swaps each mock for its real implementation behind the same function/component signature. Persons 2–5 need zero code changes if the mock's shape matched the real one.
Day 3 onward | All 5 | Fully simultaneous, unblocked work for the remainder of the project on both stacks: independent feature slices, daily small PRs, integration smoke-tests (Section 4.6) run continuously.

6.3 When Can All 5 Actually Work Simultaneously?
Answer: from Day 1, afternoon on both backend and frontend at once not after Person 1 finishes the real auth system. The only hard dependency Persons 2-5 have on Person 1 is a set of function/component shapes: authenticateJWT(req, res, next), a DB pool, useAuth() from AuthContext, and the shared api/client.js. None of those require the finished feature to exist - same-shaped mocks are enough, take under a day to write, and let all 5 people build and demo real, working vertical slices from Day 1.

This is the key move for a tight deadline: giving each person a full slice (rather than splitting frontend/backend across 10 people) already removes the API-contract-negotiation delay within a feature. Stubbing the shared files removes the remaining delay caused by waiting on Person 1's infrastructure. Together, that means 4 of the 5 people are never blocked at any point in the project, and Person 1 is only blocking themselves.

Residual sequencing that cannot be fully removed, even with mocks: Person 3's checkout page is easiest to test once Person 2's product/variant endpoints return real data, and Person 4's order-history page is easiest to verify once Person 3's checkout has produced a few real orders. Neither blocks development - only full end-to-end verification - so schedule the Section 4.6 integration smoke test for Day 3-4 rather than Day 1.