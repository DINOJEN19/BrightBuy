# Frontend

React + Vite application. See the root `README.md` for the full database/API setup.

```bash
npm ci
npm run dev
```

Open http://localhost:5173. The development proxy expects the API at http://127.0.0.1:3001.

`npm run build` writes `dist`; the Express backend serves it automatically in production. The session token is kept in sessionStorage; protected routes restore the user via `/customers/me`. API failures and expired sessions are handled by `src/api/client.js`.

`npm run test:ui` runs browser contract checks using mocked API responses. Install Chromium with `npx playwright install chromium` first and run the app at port 3001.
