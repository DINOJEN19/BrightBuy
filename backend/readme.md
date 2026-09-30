# BrightBuy — Backend (Person 1)

Node.js + Express REST API for BrightBuy.

## Quick Start

```bash
cd backend
cp .env.example .env      # fill in DB credentials
npm install
npm run dev               # starts with nodemon on http://localhost:3001
```

## File Structure

```text
backend/
├── server.js                   # Entry point — loads .env, starts HTTP listener
├── app.js                      # Express app factory, route mounting (Person 1 only)
├── package.json
├── .env.example
├── config/
│   └── db.js                   # MySQL connection pool (mysql2/promise)
├── middleware/
│   ├── auth.js                 # authenticateJWT, requireRole (shared by all)
│   ├── validateBody.js         # Joi-based body validator factory (shared by all)
│   └── errorHandler.js         # Centralized error → HTTP mapping (mounted last)
├── routes/
│   ├── auth.routes.js          # POST /auth/register, /auth/login, /auth/logout
│   └── customers.routes.js     # GET/PUT /customers/me
├── controllers/
│   ├── auth.controller.js
│   └── customers.controller.js
└── services/
    ├── auth.service.js         # bcrypt hashing, JWT signing — password logic lives here only
    └── customers.service.js    # Profile read/update queries
```

## API Endpoints (Person 1)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | None | Create a new customer account |
| POST | `/api/v1/auth/login` | None | Authenticate and receive JWT |
| POST | `/api/v1/auth/logout` | Customer | Invalidate session |
| GET | `/api/v1/customers/me` | Customer | Get own profile |
| PUT | `/api/v1/customers/me` | Customer | Update own profile |
| GET | `/health` | None | Server health check |

## Shared Middleware (used by Persons 2–5)

```js
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validateBody');
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | `root` | MySQL password |
| `DB_NAME` | `brightbuy` | MySQL database name |
| `DB_CONNECTION_LIMIT` | `10` | Pool connection limit |
| `JWT_SECRET` | *(required)* | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `2h` | JWT expiry |
