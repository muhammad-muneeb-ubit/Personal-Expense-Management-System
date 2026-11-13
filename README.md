# Pocketwise — Expense & Budget Management System

A JavaScript-only personal finance application. This project has been upgraded from the original dashboard starter into a full-stack expense manager.

## Technology stack

- **Frontend:** React 18, Vite 6, JavaScript, React Router, Tailwind CSS 4, Lucide React, Recharts
- **Backend:** Node.js, Express 4, JavaScript REST API
- **Database:** MongoDB + Mongoose
- **Authentication:** bcryptjs password hashing, short-lived JWT access tokens, rotating opaque refresh tokens in HttpOnly cookies
- **Email:** Nodemailer (optional SMTP configuration for verification and password-reset links)

No Next.js, TypeScript, Bun, Supabase, Firebase, or hosted authentication service is used.

## Features implemented

### Account and security
- Registration and login
- Password hashing with bcrypt (12 rounds)
- JWT access token held in frontend memory (15-minute default)
- Random refresh tokens stored only as SHA-256 hashes in MongoDB
- HttpOnly, SameSite refresh-token cookie; refresh-token rotation and reuse detection
- Logout and session revocation
- Password reset and change-password flows
- Email verification and resend-verification flow
- Authentication rate limiting, Helmet security headers, CORS allowlist, input validation, and user-scoped database queries
- Each API request for private data is scoped to the authenticated user; client-supplied user IDs are never trusted

### Expenses
- Create, list, edit, delete expenses
- Category, date, amount, payment method, optional notes
- Search and filter by category/month
- PKR default; amounts are stored as whole units (no decimal/paisa entry in this version)

### Categories
- Create, rename, recolour, archive, restore, and delete categories
- Default categories created for each new user
- Categories with expense or budget history are archived instead of physically deleted

### Budgets
- Set one budget per category per month/year
- Updating an existing category/month budget replaces its amount
- Budget progress, remaining amount, and overspending indicator
- View budgets for previous/future months

### Dashboard and reports
- Current-month spending, transaction count, total budget, remaining budget
- Six-month spending trend and category breakdown
- Recent transactions
- Annual reports with monthly totals, category breakdown, transaction count, and average transaction value

### Settings
- Update profile name and display currency
- Email verification status and resend link
- Change password

## Project structure

```text
expense-management-system/
  client/
    src/
      App.jsx
      main.jsx
      styles.css
      lib/api.js
    .env.example
    package.json
    vite.config.js
  server/
    src/
      config/db.js
      middleware/auth.js
      models/
      routes/
      utils/
      server.js
    .env.example
    package.json
  README.md
```

## Requirements

- Node.js **22.12 or newer** (Node 22 LTS recommended)
- npm
- MongoDB Community Server running locally, or a MongoDB connection URI

Do not use Bun for this project.

## Run locally on Windows PowerShell

### 1. Start MongoDB

Install/start MongoDB Community Server, or configure a MongoDB URI from your own MongoDB host. The default is:

```text
mongodb://127.0.0.1:27017
```

### 2. Configure and start the backend

Open Terminal 1:

```powershell
cd expense-management-system\server
Copy-Item .env.example .env
```

Edit `server/.env`. Set `JWT_ACCESS_SECRET` to a random secret of at least 32 characters. For example, in PowerShell:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Copy the printed value into `JWT_ACCESS_SECRET` in `.env`, then run:

```powershell
npm install
npm run dev
```

The API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 3. Configure and start the frontend

Open Terminal 2:

```powershell
cd expense-management-system\client
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

### 4. Create your account

Register from the app. Each new account gets its own default categories. Sign in, add expenses, create budgets, and review your reports.

## Email verification and password reset

Email delivery is optional during local development. If SMTP is not configured, the backend prints verification and password-reset links in the **server terminal**. Open those links in your browser.

For real email delivery, set these values in `server/.env`:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Pocketwise <no-reply@your-domain.example>
```

Never commit `.env` files or share SMTP credentials. In production, configure a real SMTP provider and a verified sender domain. The API does not return raw verification or password-reset tokens in its JSON responses.

## Environment variables

### Server (`server/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port, default `5000` |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection URI |
| `MONGODB_DATABASE` | Database name, default `expense_manager` |
| `CLIENT_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `JWT_ACCESS_SECRET` | Random secret, minimum 32 characters |
| `ACCESS_TOKEN_MINUTES` | Access token lifetime, default `15` |
| `REFRESH_TOKEN_DAYS` | Refresh session lifetime, default `30` |
| `COOKIE_SECURE` | Set `true` when served over HTTPS |
| `COOKIE_SAME_SITE` | `strict` by default; see deployment note below |
| `SMTP_*` | Optional SMTP delivery configuration |

### Frontend (`client/.env`)

```env
API_URL=http://localhost:5000/api
```

## API overview

All routes below are prefixed with `/api`. Except `/health` and `/auth/*`, routes require a valid access token in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/refresh` | Rotate refresh session |
| POST | `/auth/logout` | Revoke current refresh session |
| GET | `/auth/me` | Current account |
| POST | `/auth/verify-email` | Verify email link |
| POST | `/auth/resend-verification` | Resend verification link |
| POST | `/auth/forgot-password` | Request reset link |
| POST | `/auth/reset-password` | Set new password from reset link |
| POST | `/auth/change-password` | Change password while signed in |
| GET/POST | `/expenses` | List/create expenses |
| PATCH/DELETE | `/expenses/:id` | Edit/delete an expense |
| GET/POST | `/categories` | List/create categories |
| PATCH/DELETE | `/categories/:id` | Update/archive/delete category |
| GET/POST | `/budgets` | List/create or update a monthly category budget |
| DELETE | `/budgets/:id` | Delete a budget |
| GET | `/insights/dashboard` | Dashboard aggregates |
| GET | `/insights/reports?year=2026` | Annual analytics |
| PATCH | `/settings/profile` | Update name and currency |

## Production deployment notes

This is a working development implementation, but review and test it before exposing it publicly or entering real financial data.

- Use HTTPS for both frontend and API. Set `COOKIE_SECURE=true` and use a strong, unique `JWT_ACCESS_SECRET`.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin(s), not `*`.
- If the frontend and API are on different sites (for example, separate `vercel.app` and API-host domains), the refresh cookie may need `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`. The refresh and logout endpoints also validate the browser `Origin` against `CLIENT_ORIGIN`; keep that allowlist exact. Prefer deploying under the same registrable site where practical.
- Use a dedicated MongoDB database user with least-privilege access, TLS, network restrictions, and automated backups.
- Configure SMTP and verify that email delivery works before relying on account recovery.
- Add monitoring, automated tests, dependency scanning, and a security review before production use.
- Currency selection changes display formatting only; no foreign-exchange conversion is performed.
- This version intentionally does not include income tracking, recurring expenses, receipt uploads, CSV export, or multi-currency conversion.

## Notes about financial amounts

Expense and budget amounts are stored as safe whole-number units in the selected display currency. PKR is the default. This initial version does not collect paisa/decimal values and does not convert between currencies. Use the same currency consistently for a user's records.
