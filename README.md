# Creative Collection — Premium Jewellery E-commerce

A complete, mobile-first jewellery e-commerce web app powered by **Angular 18** + **Firebase**.
Designed in a luxury **gold + black** theme. No custom Node.js backend — Firebase
handles everything (Firestore, Auth, Storage, Hosting).

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Firebase Setup](#step-by-step-firebase-setup)
5. [Local Development](#local-development)
6. [Project Structure](#project-structure)
7. [Admin Panel](#admin-panel)
8. [Deployment to Firebase Hosting](#deployment-to-firebase-hosting)
9. [Git Workflow (Branch `Jwlr`)](#git-workflow-branch-jwlr)
10. [Troubleshooting](#troubleshooting)

---

## Features

### Customer
- Premium gold/black luxury theme, fully responsive (Android + iPhone)
- Home page with hero banner, featured products & new arrivals
- Product listing with search, category filter, sort
- Product details with multi-image carousel, quantity selector
- Cart with live total, persistent across reloads (localStorage)
- Checkout flow: details → UPI payment → confirmation
- WhatsApp "Order Now" floating button + per-product WhatsApp order
- SEO-friendly meta tags + Open Graph
- Image lazy-loading and shimmer placeholders

### Admin
- Firebase Auth (email + password) login at `/admin/login`
- Add / edit / delete products
- Multi-image upload to Firebase Storage
- Toggle Featured / In Stock from list view
- Orders dashboard with payment-status filter (All/Pending/Paid/Completed/Cancelled)
- Click any order row to expand customer details + line items
- One-click status updates: **Pending → Paid → Completed → Cancelled**
- Live revenue + order stats

---

## Tech Stack

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| Framework    | Angular 18 (standalone components, signals)             |
| Styling      | Tailwind CSS 3 + Bootstrap 5 + custom SCSS              |
| Icons        | Bootstrap Icons                                         |
| Auth         | Firebase Authentication (email/password)                |
| Database     | Firebase Firestore                                      |
| Storage      | Firebase Storage                                        |
| Hosting      | Firebase Hosting                                        |
| Build        | Angular CLI 18 (`@angular-devkit/build-angular:application`) |

---

## Prerequisites

- **Node.js** ≥ 18.19.1 (you have 18.20.8 ✅)
- **npm** ≥ 9
- **Firebase CLI** ≥ 13 (`npm i -g firebase-tools`)
- A Google account to create a Firebase project

---

## Step-by-Step Firebase Setup

> ⚠️ Without this step the app will run but Firestore/Auth/Storage calls will fail
> (the app falls back to dummy products on the home/shop pages, but admin login
> and order placement will not work).

### 1. Create the Firebase project
1. Go to https://console.firebase.google.com/
2. Click **"Add project"** → name it `creative-collection` (or anything you like)
3. Disable Google Analytics (optional) → **Create project**

### 2. Enable services

#### a. Authentication
- Sidebar → **Build → Authentication** → **Get started**
- **Sign-in method** tab → enable **Email/Password** → Save
- Go to **Users** tab → **Add user**
  - Email: `prasadgodase1812@gmail.com`
  - Password: *(choose a strong password — this becomes your admin login)*

#### b. Firestore Database
- Sidebar → **Build → Firestore Database** → **Create database**
- Start in **production mode** → choose a region (e.g. `asia-south1` for India) → **Enable**

#### c. Storage
- Sidebar → **Build → Storage** → **Get started**
- Use default rules (we'll deploy our own) → choose same region → **Done**

### 3. Get your web app config
- Project Settings (⚙️ icon top-left) → **General** tab
- Scroll to **Your apps** → click the web icon `</>`
- Register app — nickname `Creative Collection Web` → skip Hosting step → **Register app**
- You'll see a `firebaseConfig = { ... }` object. Copy the values.

### 4. Paste config into the project
Open **both** files and replace the placeholders:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

```ts
firebase: {
  apiKey: 'AIzaSy....',                           // ← paste here
  authDomain: 'creative-collection.firebaseapp.com',
  projectId: 'creative-collection',
  storageBucket: 'creative-collection.appspot.com',
  messagingSenderId: '1234567890',                 // ← paste here
  appId: '1:1234567890:web:abcd...'                // ← paste here
}
```

> ℹ️ Firebase web API keys are **safe to commit** — they identify the project,
> not authorize access. Real security comes from Firestore + Storage rules.

### 5. Update `.firebaserc`
Replace `"creative-collection"` with your actual project ID if different:

```json
{ "projects": { "default": "your-project-id" } }
```

### 6. Deploy security rules + indexes (one-time)
```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## Local Development

```bash
# install
npm install

# run dev server (auto-reloads, opens browser)
npm start
# → http://localhost:4200
```

To build for production locally:
```bash
npm run build:prod
# Output: dist/creative-collection/browser
```

### Adding test data
You have two options:

**Option A — via the Admin panel (recommended)**
1. Run `npm start`
2. Go to `http://localhost:4200/admin/login` → sign in
3. Click **New Product** → add one or two products → upload images

**Option B — use the dummy data** (no setup needed)
The home/shop pages automatically fall back to `src/app/data/dummy-products.ts`
when Firestore is empty, so you can preview the UI immediately.

---

## Project Structure

```
D:\JWLR\
├── angular.json                       Angular CLI workspace
├── firebase.json                      Hosting + Firestore + Storage config
├── firestore.rules                    Security rules (public read, admin write)
├── firestore.indexes.json             Composite indexes
├── storage.rules                      Storage security (admin write, public read)
├── tailwind.config.js                 Custom gold/black palette
├── package.json                       Dependencies + scripts
├── README.md                          You're reading it
└── src/
    ├── index.html                     SEO meta tags, fonts, theme
    ├── main.ts                        Angular bootstrap
    ├── styles.scss                    Global theme + Tailwind directives
    ├── favicon.svg                    Brand icon
    ├── environments/
    │   ├── environment.ts             Dev Firebase config + brand info
    │   └── environment.prod.ts        Prod Firebase config + brand info
    ├── assets/
    │   └── placeholder.svg            Image fallback
    └── app/
        ├── app.config.ts              Providers (router, Firebase, animations)
        ├── app.routes.ts              Route map (lazy-loaded standalone components)
        ├── app.component.{ts,html,scss}
        ├── models/
        │   ├── product.model.ts
        │   ├── cart-item.model.ts
        │   └── order.model.ts
        ├── services/
        │   ├── product.service.ts     Firestore CRUD for /products
        │   ├── order.service.ts       Firestore CRUD for /orders
        │   ├── auth.service.ts        Firebase Auth wrapper
        │   ├── storage.service.ts     Image uploads
        │   └── cart.service.ts        Signal-based cart with localStorage
        ├── guards/
        │   └── admin.guard.ts         Protects /admin routes
        ├── data/
        │   └── dummy-products.ts      Sample data for first-run preview
        ├── components/
        │   ├── header/                Sticky nav + cart badge + mobile menu
        │   ├── footer/                Brand, links, contact
        │   ├── product-card/          Reusable card with shimmer-loading image
        │   └── whatsapp-button/       Floating "Order Now" pulse button
        └── pages/
            ├── home/                  Hero + value cards + featured + recent
            ├── products/              Grid + search + category pills + sort
            ├── product-details/       Carousel + qty + Buy/Cart/WhatsApp
            ├── cart/                  Item list + sticky summary
            ├── checkout/              3-step (details → UPI pay → success)
            └── admin/
                ├── admin-login/
                ├── admin-dashboard/   Sidebar shell with router-outlet
                ├── admin-products/    CRUD + image upload UI
                └── admin-orders/      Stats + filter + status updates
```

---

## Admin Panel

- URL: `/admin/login`
- Login uses Firebase Auth (any user you create in Firebase Console can log in).
- After login you land at `/admin/products`.
- Tabs in sidebar: **Products** and **Orders**.
- Logout from the sidebar bottom-left.

> 🔐 Security model: any signed-in Firebase user is treated as admin
> (see `firestore.rules` and `storage.rules`). For multi-role control,
> add Firebase custom claims and tighten the rules.

---

## Deployment to Firebase Hosting

After completing [Firebase Setup](#step-by-step-firebase-setup):

```bash
# 1. one-time login
firebase login

# 2. (only if you haven't) deploy rules
firebase deploy --only firestore:rules,firestore:indexes,storage

# 3. build + deploy hosting
npm run deploy
```

`npm run deploy` runs `ng build --configuration production && firebase deploy`.

After it finishes, the CLI prints your live URL, e.g.:

```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/creative-collection/overview
Hosting URL:     https://creative-collection.web.app
```

That URL is publicly accessible. You can also access via
`https://<project-id>.firebaseapp.com`.

### Custom domain (optional)
- Hosting → **Add custom domain** → follow DNS verification steps.

---

## Git Workflow (Branch `Jwlr`)

The repo at `D:\JWLR` already has `.git` initialised. The remote is **not yet set**.
Run these from `D:\JWLR`:

```bash
# 1. attach the GitHub remote
git remote add origin https://github.com/prasadgodase5/JewelleryMart.git

# 2. fetch and base your work on main (so README from "Initial commit" is preserved)
git fetch origin
git checkout -b Jwlr origin/main

# 3. stage everything (do NOT commit your real Firebase API keys
#    if your project is public — but Firebase web keys are public anyway)
git add .
git commit -m "feat: scaffold Creative Collection jewellery e-commerce (Angular 18 + Firebase)"

# 4. push the new branch
git push -u origin Jwlr
```

Then open https://github.com/prasadgodase5/JewelleryMart/branches and
either merge `Jwlr → main` via a Pull Request or keep working on `Jwlr`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `npm install` errors about peer deps | `npm install --legacy-peer-deps` |
| `ng: command not found` | Use `npx ng …` or install local CLI is already in `devDependencies` |
| App loads but products don't appear | Check Firestore is enabled and `environment.ts` has correct config; dummy data falls back automatically |
| Admin login fails with `auth/configuration-not-found` | Email/Password sign-in is not enabled in Firebase Console → Authentication → Sign-in method |
| Image upload fails | Make sure Storage is enabled and you deployed `storage.rules` |
| `Permission denied` on Firestore | Deploy `firestore.rules`: `firebase deploy --only firestore:rules` |
| Build size warning | Already configured to allow up to 2 MB initial; tweak `angular.json` budgets if needed |
| WhatsApp link opens with wrong number | Update `whatsapp` in both `environment.ts` files |

---

## Customising

| Want to change… | Edit |
|---|---|
| Brand name / phone / email | `src/environments/environment.ts` and `environment.prod.ts` |
| UPI ID | same files, `payment.upiId` |
| Payment QR | drop your QR image at `src/assets/payment-qr.png` |
| Theme colors | `src/styles.scss` (CSS vars) and `tailwind.config.js` |
| Hero image | `src/app/pages/home/home.component.scss` (`.hero` background) |
| Sample products | `src/app/data/dummy-products.ts` |

---

## Scripts (npm)

| Script | What it does |
|--------|--------------|
| `npm start` | Dev server at http://localhost:4200 |
| `npm run build` | Production build |
| `npm run build:prod` | Same as `build` (explicit prod config) |
| `npm test` | Karma unit tests |
| `npm run deploy` | Build + Firebase deploy (everything) |
| `npm run deploy:hosting` | Build + deploy only Hosting |

---

**Made with ♥ for Creative Collection.**
