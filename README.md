# 🍜 Restaurant Management Web

A full-featured restaurant ordering and management system built with React, Node.js, and MySQL. Designed for small to medium Vietnamese eateries, it provides a customer-facing ordering interface, real-time kitchen display, and a complete admin panel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, React Router 6 |
| **UI** | Bootstrap 5.3, Bootstrap Icons |
| **Charts** | Chart.js 4 |
| **Backend** | Node.js, Express 4 (CommonJS) |
| **Database** | MySQL 8 (mysql2 with connection pooling) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Real-time** | Server-Sent Events (SSE) via EventEmitter |
| **File Upload** | multer 2 |
| **Email** | nodemailer (Gmail SMTP) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Express Server                     │
│                                                      │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  Static Files │    │      REST API (/api/*)    │   │
│  │  (client/dist)│    │                          │   │
│  │  (public/)    │    │  /api/auth/*             │   │
│  │               │    │  /api/menu/*             │   │
│  │  SPA fallback │    │  /api/orders/*           │   │
│  │  → index.html │    │  /api/categories/*       │   │
│  └──────────────┘    │  /api/vouchers/*          │   │
│                      │  /api/settings/*          │   │
│                      └──────────────────────────┘   │
│                                    │                 │
│                      ┌─────────────▼─────────────┐  │
│                      │      MySQL Database        │  │
│                      │      (quan_an_ngon)        │  │
│                      └───────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Monolithic architecture:** A single Express server serves both the built React SPA (as static files) and the REST API. In development, Vite's dev server proxies API requests to Express on port 3000.

---

## Data Flow

### Order Lifecycle

```
Customer places order
        │
        ▼
   [pending] ──── 5-min window to cancel ────
        │
        ▼
  [confirmed]  ◄── Admin confirms payment (transfer) or auto-confirms (COD)
        │
        ▼
  [preparing]  ◄── Kitchen starts cooking
        │
        ▼
  [completed]  ◄── Kitchen marks done
```

### Real-time Updates (SSE)

```
Backend EventEmitter
        │
        ├── order:created  ──► Kitchen Display (Cooking page)
        │                    ──► Admin Dashboard
        │                    ──► Orders Tab
        │
        └── order:updated  ──► Kitchen Display
                             ──► Admin Dashboard
                             ──► Orders Tab
```

---

## Features

### Customer-facing
- Browse menu by category with search
- View item details with available toppings
- Add items to cart with quantity, toppings, and notes
- Apply voucher codes for discounts
- Checkout with delivery type (ship/pickup)
- Payment options: **COD** or **Bank Transfer** (VietQR)
- Track order status by phone number
- Cancel order within 5 minutes of placing

### Admin Panel
- **Dashboard** — Today's stats (orders, revenue, pending), 7-day revenue chart (Chart.js), recent orders
- **Order Management** — Paginated list with status filters, detail modal, status transitions, payment confirmation, CSV export, invoice printing
- **Menu Management** — CRUD with image upload (multer) + gradient color picker
- **Category Management** — CRUD with slug validation, delete protection
- **Voucher Management** — CRUD with percent/fixed discounts, usage limits, auto-expiry, toggle active
- **Settings** — Shop name, address, phone, email, hours, delivery fee, radius
- **Authentication** — JWT-based login with forgot password (PIN via email)

### Kitchen Display
- Real-time order feed via SSE
- Quick actions: confirm → cook → complete
- Audio notification (Web Audio API) on new orders

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `categories` | Menu categories (Com, Mi, Pho, Douong, Topping) |
| `menu_items` | Menu items with price, description, image/gradient |
| `orders` | Orders with status, payment, customer info |
| `order_items` | Denormalized line items (preserves history) |
| `admin_users` | Admin credentials (bcrypt + JWT) |
| `vouchers` | Discount codes (percent/fixed) |
| `settings` | Key-value shop configuration |
| `toppings` | Available add-ons |
| `menu_item_toppings` | Many-to-many relation |

---

## Getting Started

### Prerequisites
- **Node.js** 18+
- **MySQL** 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/Restaurant-Management-Web.git
cd Restaurant-Management-Web

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Configure environment
# Copy the .env.example or create .env with your settings:
# PORT=3000
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=quan_an_ngon
# JWT_SECRET=your-secret-key
# PUBLIC_DOMAIN=http://localhost:3000
# ADMIN_EMAIL=admin@example.com
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Build frontend and start server
npm start

# Or for development (run two terminals):
# Terminal 1: npm run dev (starts Express on :3000)
# Terminal 2: cd client && npm run dev (starts Vite on :5173 with proxy)
```

The database tables and seed data are auto-created on first server start via `init-db.js`.

### Create Admin Account

There is no default admin user. You must insert one manually:

```sql
INSERT INTO quan_an_ngon.admin_users (username, password, email)
VALUES ('admin', '<bcrypt-hashed-password>', 'admin@example.com');
```

Or use any Node.js script to hash a password with bcryptjs before inserting.

---

## Project Structure

```
├── .env                    # Environment variables
├── server.js               # Express entry point
├── db.js                   # MySQL connection pool
├── init-db.js              # Database initialization + seed
├── sse.js                  # SSE EventEmitter utility
├── routes/                 # API route handlers
│   ├── auth.js
│   ├── menu.js
│   ├── orders.js
│   ├── categories.js
│   ├── vouchers.js
│   └── settings.js
├── public/                 # Static assets
│   ├── images/             # Uploaded menu images
│   └── qr/                 # Bank QR images
├── client/                 # React frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx        # Entry point
│       ├── App.jsx         # Router
│       ├── styles.css      # Global styles
│       ├── utils.js        # API base, helpers
│       ├── context/        # React contexts
│       │   └── CartContext.jsx
│       ├── pages/          # Route pages
│       │   ├── Home.jsx
│       │   ├── GioiThieu.jsx
│       │   ├── TrackOrder.jsx
│       │   ├── Cooking.jsx
│       │   ├── AdminLogin.jsx
│       │   ├── AdminForgot.jsx
│       │   └── AdminPanel.jsx
│       └── components/     # Reusable components
└── sql/init.sql            # Manual SQL setup script
```

---

## API Overview

All admin endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/forgot` | Send reset PIN via email |
| POST | `/api/auth/verify-pin` | Verify reset PIN |
| POST | `/api/auth/reset` | Reset password |
| GET | `/api/menu` | Get menu items |
| POST | `/api/menu` | Create menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |
| POST | `/api/menu/upload/:id` | Upload item image |
| GET | `/api/orders` | List orders (paginated) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:code` | Get order by code |
| PUT | `/api/orders/:id/status` | Update order status |
| PUT | `/api/orders/:id/payment` | Confirm payment |
| GET | `/api/orders/cancel/:code` | Cancel order |
| GET | `/api/orders/search/:phone` | Search by phone |
| GET | `/api/orders/stream` | SSE stream |
| GET | `/api/orders/stats` | Today's stats |
| GET | `/api/orders/export` | CSV export |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/vouchers` | List vouchers |
| POST | `/api/vouchers` | Create voucher |
| PUT | `/api/vouchers/:id` | Update voucher |
| DELETE | `/api/vouchers/:id` | Delete voucher |
| POST | `/api/vouchers/validate` | Validate voucher code |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

---

## Key Design Decisions

- **No ORM** — Raw SQL with `mysql2/promise` for simplicity and full control over queries.
- **Denormalized `order_items`** — Stores `item_name` and `item_price` at order time so menu changes don't affect historical orders.
- **SSE over WebSocket** — Simpler unidirectional server→client push; sufficient for order notifications.
- **In-memory PIN store** — Forgot-password PINs are stored in memory (reset on server restart).
- **No customer accounts** — Orders are tracked by phone number only; all management is admin-only.
- **Cart in localStorage** — Customer cart persists across sessions without a backend.
- **Global toast** — `window.showToast` pattern for cross-component notifications without a context provider.

---

## License

MIT
