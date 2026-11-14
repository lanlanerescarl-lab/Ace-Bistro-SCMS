# Ace Bistro — Supply Chain Management System (front end)

The screens of the *Ace Bistro Supply Chain Management System* course proposal as plain HTML, Tailwind CSS (built locally) and vanilla JavaScript.
It has no backend and needs no internet connection. Every number you see is a sample row written in the page; the backend developer replaces
those rows with database rows. The sample "now" is frozen at **Friday, 6 November 2026, 11:30 AM**.

## Open it

1. Open the `ace-bistro-scm` folder in Phoenix Code (or any editor that can serve files) and start **Live Preview** on `login.html`.
   Opening the files directly from disk also works.
2. Log in with a test account (below). Every role lands on its own first page and sees only its own menu.

## Test accounts

`assets/js/test-accounts.js` holds these (testing only; the backend's login replaces that file).

| Username | Password | Role | First page | Notes |
|---|---|---|---|---|
| `carljohn` | `admin123` | Administrator / Owner | `dashboard.html` | sees everything |
| `jsantos` | `cashier123` | Cashier / Service Staff | `orders.html` | |
| `lramos` | `cashier456` | Cashier / Service Staff | `orders.html` | second cashier |
| `mdelacruz` | `kitchen123` | Kitchen Staff / Cook | `inventory.html` | |
| `cmendoza` | `inventory123` | Inventory Staff | `inventory.html` | |
| `pgarcia` | `procure123` | Procurement Officer | `procurement.html` | |
| `tvillanueva` | `locked123` | Kitchen Staff | — | shows the "account locked" message |
| `expired` | `expired123` | Cashier | — | shows the "password expired" message |

The session is kept in `sessionStorage` (`ace-bistro-scm:user`). Every page checks it before the first paint (script in `<head>`): no session goes to
`login.html`, a role that may not open the page goes to `access-denied.html` (its button leads to the role's own start page). Log out asks for confirmation.

## Pages

| Page | Roles | What it is for |
|---|---|---|
| `login.html` | everyone | log in; loading state on the button, clear messages for a wrong, locked or expired account |
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
| `reports.html` + ten `report-*.html` | by role | printable reports (stock, purchasing, sales); nine have a calendar |
| `user-accounts.html`, `role-permissions.html`, `settings.html` | Administrator | users, what each role can do, business settings |
| `profile.html` | every role | My account: own name and password; the Administrator can also change their own username |
| `access-denied.html`, `not-found.html` | every role | error pages |

Roles, landing pages and sidebar items follow the proposal (Administrator, Cashier, Kitchen Staff, Inventory Staff, Procurement Officer).
The top bar has one user chip (name and role from the session, My account, Log out) and the Alerts menu; its links open pages the role can open, and
`inventory.html?status=…` / `purchase-orders.html?status=…` open the list with that filter already chosen.

## Folder

```
ace-bistro-scm/
├── *.html                 the pages (a header comment in each says what it is for, its roles and its repeated markup)
├── assets/
│   ├── css/app.css        component styles (hand-written, loaded first)  ·  tailwind.css (built, loaded second)
│   ├── fonts/             Inter, self-hosted
│   ├── img/dishes/        one small SVG for each of the 15 dishes + placeholder.svg
│   └── js/                one file for each feature (list below); each starts with a header that names the data- hooks it reads
└── tools/                 only for rebuilding tailwind.css (package.json, tailwind.config.cjs, input.css)
```

## Components and hooks

All behaviour is switched on by `data-` attributes in the markup. The header of each script lists them in full; the short version:

| Script | What it does | Main hooks |
|---|---|---|
| `shell.js` | menus, drawer, toasts, `Ace` helpers | `data-toast-open`, `data-dialog-open`, `data-roles` |
| `session.js`, `login.js`, `test-accounts.js` | session, role view, login form | `data-page-roles` on `<html>`, `data-user-*` |
| `dialogs.js` | native `<dialog>` open/close, backdrop click | `data-dialog-open`, `data-dialog-close`, `data-fill-*` |
| `forms.js` | loading state, field errors, local save | `data-local-save`, `data-loading-text`, `.field-error` |
| `filters.js` | filter and search the rows in the page, cards and counts from the rows | `data-filter-in/-key`, `data-filter-group/-value`, `data-count`, `data-sum` |
| `pager.js` | 20 / 50 / 100 rows per page for a list | `nav[data-pager]`, rows get `hidden` |
| `row-dialog.js` | ONE dialog written once in a `<template>`, filled from a row | `data-row-dialog`, `data-bind`, `data-lines-body` |
| `rows.js` | add and remove rows, live totals | `data-add-row`, `data-remove-row`, `data-calc-*` |
| `menu-images.js` | dish picture upload preview (nothing is uploaded) | `data-image-upload`, `data-image-drop`, `data-image-remove` |
| `charts.js`, `line-chart.js` | chart tooltips and keyboard; line charts drawn from their table | `.hit[data-tip]`, `data-line-chart` |
| `calendar.js` | Year heat-map, Month grid, Day card from one JSON block | `data-cal`, `script[data-cal-data]` |

The CSS classes of the components (`.btn`, `.card`, `.badge`, `.table`, `.input`, `.modal`, `.stat-card`, …) are in `assets/css/app.css`. Colours and fonts
are in `tools/tailwind.config.cjs`. `app.css` loads before `tailwind.css` so a utility class in the markup can still override a component class.

**Lists** (Order Records, Stock Movements, Inventory, Purchase Orders, Menu): the rows are in the page; `filters.js` hides the rows that do not match and
`pager.js` shows one page of the rest. The cards and the counts on the filter buttons are counted from the rows, so a card always equals its list.

**Calendars:** each is one `<script type="application/json" data-cal-data>` block (365 daily values, start date, colour steps, label text; Sales also has
31 day cards) and `calendar.js` draws everything from it. The contract is at the top of `calendar.js` and in a comment above every block. The heat-map cells
are 20 px with a 4 px gap and the map scrolls sideways inside its own region, opening on today.

**Charts** are inline SVG with the data in a comment, an `sr-only` table, `data-tip` hit areas and one `.chart-tip`. Line charts are drawn from their
table at the width they have (`line-chart.js`).

## Rebuilding the stylesheet

`assets/css/tailwind.css` is already built. After you add Tailwind classes to a page or script:

```
cd tools
npm install
npm run build:css
```

## Notes for the backend developer

- Replace the BEGIN/END SHARED blocks (sidebar, top bar, flash) with includes; they are identical in every page except `aria-current`.
- Each repeated block (a table row, a template, a calendar JSON block) is documented by the comment above its first copy: source table, rule for derived values, and the `data-` attributes it carries.
- Summary cards carry a `SUMMARY RULES` comment: every number is a count or sum of the rows on its page, or of the rows named there.
- Forms are written for a real POST (`name`, `required`, `maxlength`, `min`/`max`/`step`, error slots, `enctype="multipart/form-data"` where a file is sent). `data-local-save` makes them close and show a toast without a server; remove it and the form posts.
- Filters are GET forms (`q`, `status`, `date_from`, `date_to`, …) and the pager is `page` / `per_page`; the script only hides rows that are already in the page, so a real query replaces it.
- `test-accounts.js` and the session check in `<head>` are testing only. Permissions must be checked on the server; `data-roles` and `data-page-roles` only hide things.
- The dish picture is posted as `name="image"` (JPEG, PNG or WebP, up to 2 MB, checked again on the server); `remove_image=1` asks to delete the stored one.

## Beyond the proposal

Things the proposal's ERD does not have; each is marked in a comment where it appears.

- `sales_summary` (one row for each day: orders, sales, cancelled orders, cash sales): feeds the Sales calendar and its day cards.
- Day-end history for five calendars (ingredients needing attention, at or below reorder level, open purchase orders, suggested purchase value) and supplier price changes: the ERD keeps no history for them.
- `menu_item.image_path` for the dish pictures.
- `category`, `unit`, `payment_method` and `setting` tables (the Settings page), including `setting.well_stocked_multiple` for the green "well stocked" stock bar.
- `is_active` on users and suppliers (archive instead of delete).
- Order Records and Stock Movements pages, the user-chip menu, My account, and the Alerts menu.

## Not built on purpose

Single branch only · no online payments · no accounting · no supplier integration · demand estimation is a plain average, no forecasting model ·
no barcode scanning · Order Records is read-only (orders are taken outside the system).
