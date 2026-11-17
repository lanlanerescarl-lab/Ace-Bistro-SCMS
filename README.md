# Ace Bistro — Supply Chain Management System (front end, hand-off package)

The screens of the *Ace Bistro Supply Chain Management System* course proposal as plain HTML, Tailwind CSS (built locally) and vanilla JavaScript.
There is no backend in this package and it needs no internet connection. Every number you see is a sample row written in the page; the backend
developer replaces those rows with database rows. The sample "now" is frozen at **Friday, 6 November 2026, 11:30 AM**.

## Working demo vs hand-off package

| | Working demo (Phase 8 ZIP) | Hand-off package (this folder) |
|---|---|---|
| Purpose | click through the whole system on its own | give the backend developer pages that a server can fill |
| Login and roles | the login screen and each role's own menu work in the browser alone | no login logic: the server writes the role on `<html>` |
| Forms | close and show a confirmation without a server | real `<form method="post">` with named fields and routes |
| Lists | the browser hides rows, counts the cards, pages the rows | the server sends one page of rows and the numbers |
| Still the same | every page, every layout, the dialogs, calendars, charts and print styles | |

The Phase 8 ZIP is still the working demo; keep it for presentations. This folder is what goes to the backend developer.

## Open it

1. Open the `ace-bistro-scm` folder in Phoenix Code (or any editor that can serve files) and start **Live Preview** on `login.html`.
   Opening the files directly from disk also works.
2. There is no login step. Every page opens as the **Administrator / Owner** (`carljohn`), so the whole menu is visible.
   `login.html` is only the form that a real server will receive.
3. To look at another role, change one attribute on the first tag of the page: `<html … data-role="admin">` to `cashier`, `kitchen`,
   `inventory` or `procurement`. The sidebar and the Alerts menu then show only what that role may open. A page that role may not open stays
   readable, because the server (not the browser) must refuse it and show `access-denied.html`.
4. A form sends its fields to its route (for example `/login`). Until the backend has that route, the browser shows its own error page after
   a send; layout, dialogs, calendars and charts work without it.

## Pages

Sample data is consistent across pages (the same 25 ingredients, 15 dishes, 5 suppliers and 7 users), so a number on one page can be found on another.

| Page | Roles | What it is for |
|---|---|---|
| `login.html` | everyone | log in form; loading state on the button; message slots for a wrong, locked or expired account |
| `dashboard.html` | Administrator | today's sales, stock, purchasing and alerts |
| `orders.html` | Administrator, Cashier | Order Records: read-only list of orders by date, type and status; order dialog |
| `menu.html` | Administrator, Cashier, Kitchen | dishes with pictures, one shared recipe/edit dialog, add dish with picture upload |
| `inventory.html` | Admin, Kitchen, Inventory, Procurement | stock list with status filters, stock in / out / wastage / count dialogs |
| `inventory-item.html` | same | one ingredient: batches, history, prices (`?id=ING-06`) |
| `ingredient-new.html`, `ingredient-edit.html` | Administrator, Inventory | add and change an ingredient |
| `stock-movements.html` | Administrator, Inventory | every stock in, stock out, wastage, adjustment and count |
| `suppliers.html`, `supplier-detail.html` | Administrator, Procurement | suppliers, what each sells, price history |
| `supplier-price-comparison.html` | Administrator, Procurement | one ingredient's price across suppliers |
| `procurement.html` | Administrator, Procurement | suggested purchases grouped by supplier; create draft purchase orders |
| `purchase-orders.html`, `purchase-order-detail.html` | Administrator, Procurement | all purchase orders; one order with print |
| `receiving.html` | Admin, Inventory, Procurement | record deliveries against purchase orders |
| `demand.html` | Administrator, Procurement | simple demand estimation: 7-day averages, no model |
| `reports.html` + ten `report-*.html` | by role | printable reports (stock, purchasing, sales); each has a calendar |
| `user-accounts.html`, `role-permissions.html`, `settings.html` | Administrator | users, what each role can do, business settings |
| `profile.html` | every role | My account: own name and password; the Administrator can also change their own username |
| `access-denied.html`, `not-found.html` | every role | error pages |

`index.html` only forwards to `login.html`. Roles, landing pages and sidebar items follow the proposal (Administrator, Cashier, Kitchen Staff,
Inventory Staff, Procurement Officer). The top bar has one user chip (name and role, My account, Log out) and the Alerts menu; its links open pages the
role can open, and `inventory.html?status=…` / `purchase-orders.html?status=…` open the list with that filter already chosen.

## Folder

```
ace-bistro-scm/
├── *.html                 the pages (a header comment in each says what it is for, its roles, its scripts and its repeated markup)
├── assets/
│   ├── css/app.css        component styles (hand-written, loaded first)  ·  tailwind.css (built, loaded second)
│   ├── fonts/             Inter, self-hosted
│   ├── img/dishes/        one small SVG for each of the 15 dishes + placeholder.svg
│   └── js/                one file for each feature (list below); each starts with a header that names the data- hooks it reads
├── docs/
│   ├── BACKEND-HANDOFF.md      what the backend must build, page by page
│   └── DEVELOPMENT-REPORT.md   what was built in each phase, what was checked, what was not
└── tools/                 only for rebuilding tailwind.css (package.json, tailwind.config.cjs, input.css)
```

## Components and hooks

All behaviour is switched on by `data-` attributes in the markup. The header of each script lists them in full; the short version:

| Script | What it does | Main hooks |
|---|---|---|
| `shell.js` | menus, drawer, flash message, `Ace` helpers | `data-roles`, `data-toast-open`, `data-flash`, `data-dialog-open` |
| `dialogs.js` | native `<dialog>` open/close, backdrop click | `data-dialog-open`, `data-dialog-close`, `data-fill-*` |
| `forms.js` | double-submit guard (loading state), field errors, auto-submit selects | `data-loading-text`, `data-autosubmit`, `.field-error` |
| `row-dialog.js` | ONE dialog written once in a `<template>`, filled from a row | `data-row-dialog`, `data-bind`, `data-lines-body` |
| `rows.js` | add and remove rows in a form, live totals | `data-add-row`, `data-remove-row`, `data-calc-*` |
| `menu-images.js` | dish picture preview before sending | `data-image-upload`, `data-image-drop`, `data-image-remove` |
| `charts.js`, `line-chart.js` | chart tooltips and keyboard; line charts drawn from their table | `.hit[data-tip]`, `data-line-chart` |
| `calendar.js` | Year heat-map, Month grid, Day card from one JSON block | `data-cal`, `script[data-cal-data]` |

The CSS classes of the components (`.btn`, `.card`, `.badge`, `.table`, `.input`, `.modal`, `.stat-card`, …) are in `assets/css/app.css`. Colours and fonts
are in `tools/tailwind.config.cjs`. `app.css` loads before `tailwind.css` so a utility class in the markup can still override a component class.

**Lists** (Order Records, Stock Movements, Inventory, Purchase Orders, Menu, Users): the filters are GET forms and links, the pager is plain markup
(`?page=`, `per_page`), and the summary cards are buttons that set `status`. The sample page shows one page of rows; the server sends the right rows
and counts. Every list has a comment that says which table the rows come from and how each number is calculated.

**Calendars:** each is one `<script type="application/json" data-cal-data>` block (365 daily values, start date, colour steps, label text; Sales also has
31 day cards) and `calendar.js` draws everything from it. The contract is at the top of `calendar.js`, in a comment above every block and in
`docs/BACKEND-HANDOFF.md`. The heat-map cells are 20 px with a 4 px gap and the map scrolls sideways inside its own region, opening on today.

**Charts** are inline SVG with the data in a comment, an `sr-only` table, `data-tip` hit areas and one `.chart-tip`. Line charts are drawn from their
table at the width they have (`line-chart.js`).

## What the backend replaces

| In the pages now | The backend provides | Where it is described |
|---|---|---|
| `data-role="admin"` on `<html>` | the signed-in user's role | `BACKEND-HANDOFF.md`, "Shell and sign-in" |
| user chip: Carl John, `carljohn` | the signed-in user's name, username and role label | same |
| sample rows in tables, cards and dialogs | rows printed in a loop from the tables named in the comment above the first row | the comment above each repeated block |
| numbers in cards, badges, filter buttons | counts and sums by the rule in the `SUMMARY RULES` comment | same, and the page table in `BACKEND-HANDOFF.md` |
| filter forms and pager links | a query that reads `q`, `status`, `date_from`, `date_to`, `type`, `page`, `per_page` | page table |
| every `<form method="post">` | a route that validates, saves and redirects with a flash message | endpoint table |
| `#flash-slot` | the message after a save (`success`, `error` or `warning`) | `BACKEND-HANDOFF.md` |
| the BEGIN/END SHARED blocks (sidebar, top bar, flash slot) | one include used by every page | "Shell and sign-in" |
| the calendar JSON blocks | 365 daily values and the day cards, in the same shape | "Calendar data" |
| the `access-denied.html` and `not-found.html` pages | the response for a forbidden or missing page | page table |

Permissions must be checked on the server. `data-roles` hides menu items and `data-page-roles` only documents who may open a page.

## Rebuilding the stylesheet

`assets/css/tailwind.css` is already built. After you add Tailwind classes to a page or script:

```
cd tools
npm install
npm run build:css
```

The PHP project's `docs/conventions.md` asks for no Tailwind and no build step; `BACKEND-HANDOFF.md` ("Styles, scripts and the CSP") says how the
built file can be served as a plain static file.

## Beyond the proposal

Things the proposal's ERD does not have. Each is marked `EXTRA (not in the proposal ERD)` in a comment on the pages named here.

- **`sales_summary`** (one row for each day: `summary_date`, orders, sales, cancelled orders, cash sales): `report-sales-trend.html`.
- **Day-end history** (one stored value for each day): ingredients needing attention (`report-inventory-status.html`), ingredients at or below reorder
  level (`report-low-stock.html`), open purchase orders (`report-pending-orders.html`), suggested purchase value (`report-suggested-purchases.html`).
- **Supplier price changes** (one row for each price update): `report-supplier-prices.html`.
- **`menu_item.image_path`** and the picture upload (`image`, `remove_image`): `menu.html`.
- **`category`, `unit`, `payment_method` and `setting` tables**, including `setting.well_stocked_multiple` for the green stock bar: `settings.html`;
  `inventory.html` (the stock bar) and `orders.html` (payment method) read them.
- **`is_active` on users and suppliers** (archive instead of delete): `user-accounts.html`, `suppliers.html`, `supplier-detail.html`.
- **`user_account.last_login_at`**: `user-accounts.html`.
- **The Order Records and Stock Movements pages**: `orders.html`, `stock-movements.html`.
- **My account**, including the Administrator changing their own username: `profile.html`.
- **The user-chip menu, the Alerts menu, the flash slot and `data-role` on `<html>`**: the shared top bar, in every page.
- **The fixed role matrix** (a list of modules and actions with Yes, View only or No access for each role): `role-permissions.html`.
