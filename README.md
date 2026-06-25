# Hometex IMS — Inventory Management System

Admin dashboard for Hometex Bangladesh — a multi-branch home textile retail business. Handles inventory, POS, order management, staff, RBAC, and reporting.

> **Portfolio project.** Business-sensitive configuration has been removed. Backend API repo: [hometex-api](https://github.com/ShahriarHim/hometex-api)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Bundler | Vite 5 + @vitejs/plugin-react |
| UI | Bootstrap 5 + React-Bootstrap |
| Data fetching | TanStack Query v5 |
| HTTP | Axios (single instance, all calls through `src/api/axiosInstance.js`) |
| Routing | React Router DOM v6 — lazy-loaded with Suspense |
| Auth | Sanctum Bearer token via sessionStorage |
| RBAC | Spatie Laravel Permission v6 — roles + permissions from `/api/me` |
| Charts | Recharts |
| Rich text | React-Quill |
| Dates | Day.js |
| HTML sanitization | DOMPurify via `SafeHtml` component |
| Error monitoring | Sentry (opt-in via `VITE_SENTRY_DSN`) |

---

## Modules (24 total)

| Module | Description |
|---|---|
| Auth | Login, AuthGuard, session management |
| Dashboard | Stat cards, sales charts, inventory drilldowns |
| Products | Full CRUD, photo gallery, barcode generation, CSV import |
| Catalog | Brand, Category, Sub-category, Child-category |
| Inventory | Stock transfers (multi-branch), manual adjustments |
| Orders | Create, list, detail — multi-branch POS flow |
| Store Orders | Branch-level order management |
| Customers | Customer list and detail |
| Suppliers | Supplier CRUD |
| Shops/Branches | Branch management |
| Employees | Staff profiles |
| Returns | Two-step return/refund flow |
| Product Attributes | Attribute + values management |
| Price Formula | Pricing rule engine |
| Approvals | Approval queue with inline actions |
| E-commerce Menus | Navigation menu CRUD for storefront |
| Banners | Banner slider management (full CRUD) |
| Barcode | Queue, generate, print barcodes |
| Reports | 7 report types — sales, inventory, staff |
| Staff Management | User accounts for all staff roles |
| Roles & Permissions | Permission matrix with role management |
| Activity Log | Full audit trail per user and system-wide |
| System Settings | 19 configurable settings across 5 groups |
| Analytics | Product-level analytics and rankings |

---

## RBAC Architecture

7 roles with granular permissions, all enforced backend-first:

- `admin` — 52 permissions (full access)
- `manager` — 38 permissions
- `product_manager` — 19 permissions
- `sales_staff` — 13 permissions
- `warehouse` — 8 permissions
- `customer` / `corporate` — ECOM-only roles

All role checks in the frontend are **cosmetic only** — every API route has backend middleware. Frontend derives user identity exclusively from `GET /api/me`, never from stored state.

```js
const { isAdmin, hasPermission } = useAuth();
const canCreate = isAdmin || hasPermission('module.create');
```

---

## Project Structure

```
src/
  api/              # axiosInstance, queryClient
  app/              # App.jsx, Providers.jsx
  assets/           # SCSS design system
  features/         # One folder per module (api.js + pages/ + components/)
  layout/           # Sidebar, Topbar, Footer, MasterLayout
  router/           # AppRouter, lazy-loaded routes
  shared/
    components/     # DataTable, PageHeader, AppModal, Skeleton, etc.
    hooks/          # useAuth, useTableParams, useDebounce
    utils/          # formatters, session, sanitize
```

---

## Getting Started

```bash
npm install
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm run dev
```

### Environment Variables

```env
VITE_API_URL=http://localhost:8000/api
VITE_SENTRY_DSN=           # Optional
```

---

## Design System

- Dark sidebar (`#1e2d3d`) + white topbar + light gray content (`#f1f5f9`)
- Accent: `#2563eb`
- Base font: 0.875rem — compact, information-dense tables
- Single SCSS file: `src/assets/css/style.scss`

---

## Related Repos

- [hometex-api](https://github.com/ShahriarHim/hometex-api) — Laravel 10 backend
- [hometex-ecom](https://github.com/ShahriarHim/hometex-ecom) — Next.js 16 storefront
