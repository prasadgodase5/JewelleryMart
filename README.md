# PG E-Mart — Mini E-commerce Admin Panel

A complete Mini E-commerce Admin Panel built with **Angular 17 (standalone)** + **Node.js/Express** with a JSON file as the data store. Includes a simulated **UPI QR Code Payment** flow.

## Tech Stack
- **Frontend:** Angular 17 (standalone components), Tailwind CSS, RxJS, Reactive Forms
- **Backend:** Node.js, Express.js
- **Storage:** Local `db.json` file (no database)

## Project Structure
```
AngularCrudWithNode/
├── backend/        # Express REST API + db.json
└── frontend/       # Angular 17 standalone app
```

## Setup & Run

### 1. Backend
```bash
cd backend
npm install
npm start
```
Runs at `http://localhost:3000`.

### 2. Frontend
In a second terminal:
```bash
cd frontend
npm install
npm start
```
Runs at `http://localhost:4200`. The frontend proxies `/api/*` to the backend.

## Features
- **Dashboard** with summary cards
- **Products / Categories / Orders / Users** — full CRUD with search, sort, filter, pagination
- **Modal forms** for add/edit, **confirm dialog** for delete
- **Toast notifications** and **loading spinner**
- **Responsive** (Desktop sidebar, Tablet collapsible, Mobile hamburger)
- **Checkout + UPI QR Payment** with 5-minute countdown and "I Have Paid" confirmation

## REST APIs
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/products          | List products |
| POST   | /api/products          | Create product |
| PUT    | /api/products/:id      | Update product |
| DELETE | /api/products/:id      | Delete product |
| (same pattern for /api/categories, /api/orders, /api/users) |
| POST   | /api/confirm-payment   | Mark order as Paid |

## Sample db.json
Sample data is auto-seeded if `db.json` is missing.

## Notes
- UPI verification is **simulated** — the "I Have Paid" button simply marks the order as Paid.
- All data lives in `backend/db.json`.
