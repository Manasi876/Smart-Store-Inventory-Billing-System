# StoreDesk POS

A full-stack Inventory & Billing Desk system for small retail stores — role-based staff management, real-time stock tracking, UPI/Card/Netbanking/Wallet payments via Razorpay, AI-assisted product descriptions, and automated low-stock email alerts.

Built with the MERN stack, structured as a single monorepo containing both `backend/` and `frontend/`.

---

## ✨ Features

**Authentication & Staff Management**
- JWT auth (access + refresh tokens) with role-based access control
- Self-registration always creates an `Employee` account — never a privileged role
- Employee → Staff verification workflow: submit Aadhar + PAN → Admin reviews → Accept / Reject / Keep as Employee
- Admin can promote/demote Managers, and view/delete any member from **All Members**
- Editable profile with avatar upload (Cloudinary)

**Inventory**
- Full CRUD for Categories and Products, linked together
- Live Stock view with low-stock highlighting and one-click Restock
- Instant client-side search across Categories, Products, Stock, and All Members

**Billing & Payments**
- Type-ahead product search that adds straight to cart, with +/− quantity steppers
- Cash billing settles instantly; Card/UPI/Netbanking/Wallet open **Razorpay Checkout**
- Stock is decremented atomically (MongoDB transactions) the moment a sale is created — never oversold, even under concurrent billing
- Payment signature verification server-side before any sale is marked paid
- A payment-in-progress lock prevents navigating away mid-checkout (and warns on accidental tab close)
- Stuck "pending" sales (abandoned checkout) can be **Retried** or **Cancelled** (auto-restores stock) from Invoice History

**Automation**
- AI-generated product/category descriptions via Groq (open-source LLM), triggered by a "Generate Description" button
- Automatic low-stock and out-of-stock email alerts to Admins/Managers (via Resend), de-duplicated so the same shortage doesn't spam repeatedly

**UI**
- Fully responsive — collapsible sidebar drawer on mobile, scrollable tables, stacking forms
- Role-aware sidebar: each role only sees what it's allowed to touch

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite), Tailwind CSS v4, React Router, Axios |
| Backend | Node.js, Express 5, MongoDB + Mongoose |
| Auth | JWT (access + refresh), bcrypt |
| File Storage | Cloudinary (avatars, Aadhar/PAN documents) |
| Payments | Razorpay (Checkout + signature verification) |
| AI | Groq API (open-source LLM inference) |
| Email | Resend |
| Deployment | Render (backend), Netlify (frontend) |

---

## 📁 Monorepo Structure

```
.
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── services/        # Business logic (DB queries, validation)
│   ├── controllers/     # Thin HTTP layer — req/res only
│   ├── routes/          # Route + middleware wiring
│   ├── middlewares/     # auth, multer, error handling
│   ├── utils/           # Third-party isolation (cloudinary, razorpay, groq, mailer)
│   ├── app.js
│   └── server.js
│
└── frontend/
    └── src/
        ├── api/          # Axios wrapper functions, one file per resource
        ├── components/   # Shared UI (Modal, SearchBar, ProtectedRoute)
        ├── context/      # AuthContext, PaymentLockContext
        └── pages/
            ├── Login.jsx / Register.jsx
            └── dashboard/    # Categories, Products, Stock, Billing,
                               # InvoiceHistory, Members, Verifications,
                               # Profile, Sidebar, DashboardLayout
```

### Architecture pattern (backend)

Every feature follows the same strict layering:

```
Route → Controller → Service → Model
```

- **Routes** declare paths, methods, and which auth/role middleware guards them — no logic.
- **Controllers** pull data from `req`, call a service, shape the response — no business logic.
- **Services** hold all validation, DB queries, and business rules — no knowledge of `req`/`res`.
- **Utils** isolate every third-party SDK (Cloudinary, Razorpay, Groq, Resend) into a single file each, so the rest of the app never touches a vendor SDK directly and swapping a provider only ever touches one file.

---

## 🔐 Roles & Access

| Role | Access |
|---|---|
| **Admin** | Everything, including Staff Verification and All Members |
| **Manager** | Categories, Products, Stock, Billing, Invoice History |
| **Cashier / Staff** | Billing only |
| **Employee** | Profile only, until verified as Staff |

---

## 🚀 Getting Started

### 1. Clone and install
```bash
git clone <your-repo-url>
cd <repo-name>

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables
Copy `.env.example` → `.env` in `backend/`, fill in real values (see table below). In `frontend/`, set:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Seed the first Admin
There's no way to self-register as Admin (by design) — run this once:
```bash
cd backend
npm run seed:admin
```

### 4. Run both servers
```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

---

## ⚙️ Environment Variables (backend)

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 8000) |
| `NODE_ENV` | `development` locally, `production` on Render — controls cookie security flags and error verbosity |
| `MONGODB_URI`, `DB_NAME` | MongoDB Atlas connection |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY` | JWT auth |
| `CORS_ORIGIN` | Exact frontend origin allowed to call this API |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | File uploads |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payments (use test-mode keys during development) |
| `GROQ_API_KEY` | AI description generation — check [console.groq.com/docs/models](https://console.groq.com/docs/models) for the current supported model, as Groq periodically deprecates older ones |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Stock alert emails |

---

## 🔌 API Overview

| Base path | Covers |
|---|---|
| `/api/v1/users` | Register, login, logout, refresh, profile, verification workflow, member management |
| `/api/v1/categories` | Category CRUD |
| `/api/v1/products` | Product CRUD, restock |
| `/api/v1/sales` | Create/list/cancel sales, invoice history |
| `/api/v1/payments` | Razorpay order verification, payment config |
| `/api/v1/ai` | AI description generation |

All protected routes require `Authorization: Bearer <accessToken>`.

---

## ☁️ Deployment

- **Backend → Render**: set every variable above plus `NODE_ENV=production`. MongoDB Atlas Network Access must allow `0.0.0.0/0` (Render's outbound IP isn't fixed).
- **Frontend → Netlify**: set `VITE_API_BASE_URL` to the deployed Render URL. `public/_redirects` is included so refreshing client-side routes (e.g. `/dashboard/billing`) doesn't 404.
- Auth uses `Authorization: Bearer` headers as the primary mechanism (not cookies) — this avoids cross-site cookie issues between the two separate domains.

---

## 🗺️ Known Limitations / Roadmap

- Razorpay webhook + cron-based reconciliation not yet implemented — currently relies on client-side verification plus manual Retry/Cancel for abandoned payments.
- Resend's sandbox sender can only deliver to the email the Resend account was created with, until a custom domain is verified.
- No automated test suite yet.