# Backend hand-off — Ace Bistro SCMS front end

This file tells the backend developer what each page needs and what each form sends. The pages are plain HTML. Every number in them is a sample
value written next to a comment that says where the real value comes from. Route names below are **proposals**: change them freely, then change the
`action` of the form (one place) to match.

The sample "now" is Friday 6 November 2026, 11:30 AM. Dates in the pages are example values; the server prints the real ones.

## 1. Shell and sign-in

**One shell, three shared blocks.** Every page repeats the same three blocks, each wrapped in `<!-- BEGIN SHARED: name -->` … `<!-- END SHARED: name -->`:
`sidebar`, `topbar` (the Alerts menu and the user chip, with the log-out dialog) and `flash`. Turn each into one include. They are identical in every
page except one thing: the sidebar link of the current page carries `aria-current="page"` (the server sets it from the current route).
`login.html` and `index.html` have no shell.

**`data-role` on `<html>`.** The first tag of every signed-in page is `<html lang="en" class="h-full" data-role="admin" data-page-roles="…">`.

- `data-role` is written by the server: one of `admin`, `cashier`, `kitchen`, `inventory`, `procurement`.
- Elements with `data-roles="admin inventory"` (menu items, buttons, blocks) are shown only when the role is in their list. This is done in CSS, so the
  hiding is **visual only**. The server must still refuse a forbidden page (show `access-denied.html`, status 403) and a forbidden POST.
- `data-page-roles` lists who may open the page. It is documentation for you; nothing reads it.
- Check by hand: change `data-role` in a page and the menu and Alerts menu change with it.

**User chip.** The top bar prints the signed-in user in the chip (name, initials and role label) and again at the top of the account menu. On `profile.html`
the name and username are in the form (the username is an editable field for the Administrator and plain text for every other role). In the samples they read
**Carl John**, initials `CJ`, `carljohn`, Administrator / Owner. Replace them with `user_account.name`, the initials of the name, `user_account.username` and the role label. The role labels are: `admin` Administrator / Owner, `cashier` Cashier / Service Staff, `kitchen` Kitchen Staff / Cook, `inventory` Inventory Staff,
`procurement` Procurement Officer.

**Log out.** The chip menu opens a confirm dialog that holds `<form method="post" action="/logout">` (proposed). Destroy the session and redirect to `login.html`.

**Flash slot.** `<div id="flash-slot">` holds three hidden toasts: `data-flash="success"`, `"error"` and `"warning"`, each with an empty `[data-flash-text]`.
After a POST, redirect, then print the page with `hidden` removed from the one variant that applies and the text filled in. A success closes itself after
5 seconds; the others stay until dismissed. Only one `setTimeout` exists in all the scripts (that one).

**Login messages.** `login.html` has four hidden alerts: `data-login-alert="empty"`, `"invalid"`, `"locked"`, `"expired"`. After a failed `POST /login`
show the page again with `hidden` removed from the one that applies; keep the typed username in `value`; never print the password.

**Landing page after login** (from the proposal): Administrator `dashboard.html`; Cashier `orders.html`; Kitchen Staff and Inventory Staff `inventory.html`;
Procurement Officer `procurement.html`. `index.html` only forwards to `login.html`.

## 2. Pages

Columns: **Roles** · **Data** (what the server must print, with the source tables named in the comment above the first repeated row) · **Forms** (method, route,
fields) · **Params** (GET parameters; every list page also takes `page` and `per_page`, 20 / 50 / 100) · **Cards** (the rule for each summary number; the
full text is in the `SUMMARY RULES` comment of the page) · **Pieces** (shared pieces the page uses).

| Page | Roles | Data | Forms | Params | Cards | Pieces |
|---|---|---|---|---|---|---|
| `login.html` | everyone | none | POST `/login`: `username`, `password` | — | — | four alert slots |
| `dashboard.html` | admin | today's orders and sales; stock status rows; best and slow dishes; suggested purchases; pending purchase orders; near-expiry batches; recent receipts; three charts (daily sales, monthly sales, weekly purchase spending) | none | — | Today's Sales, Yesterday, Low-Stock, Pending Purchase Orders, Near-Expiry: counts and sums of the rows shown on Order Records, Inventory and Purchase Orders | charts (data comment + `sr-only` table each), link to the Sales calendar |
| `orders.html` | admin, cashier | `customer_order` + lines + payment + user, newest first; the shared order dialog is filled from the row | GET filter form `filter-orders` | `date_from`, `date_to`, `order_type` (`dine-in` / `take-out`), `q`, `status` (`all` / `completed` / `cancelled` / `sales`) | Orders, Completed, Cancelled, Sales: one grouped query for the chosen range, type and search; the status card does not narrow the other three | row dialog (`<template>`), pager |
| `menu.html` | admin, cashier, kitchen | `menu_item` + recipes + ingredients (usable stock); the recipe dialog is filled from the row | POST `/menu` (add), `/menu/update`, `/menu/delete` (add, edit and delete buttons are for the Administrator; the others see the recipe read-only) | `category` | counts on the category buttons = dishes per category | row dialog, recipe line template, picture upload |
| `inventory.html` | admin, kitchen, inventory, procurement | ingredient + batches: usable stock, status, bar; near-expiry list; wastage list | POST `/stock/in`, `/stock/out`, `/stock/wastage`, `/stock/count` | `q`, `status` (`all`, `attention`, `below`, `critical`, `low`, `near`, `ok`, `out`) | Low or out of stock, Near expiry (+ potential loss), Wastage last 30 days | pager, stock dialogs |
| `inventory-item.html` | same | one ingredient (`?id=ING-06`): batches, transactions of the last 30 days, supplier prices | POST `/ingredients/reorder-level`, `/stock/in`, `/stock/out`, `/stock/wastage`, `/stock/count` | `id`, `type` | counts on the type buttons | stock dialogs |
| `ingredient-new.html` | admin, inventory | category, unit and supplier lists | POST `/ingredients` | — | — | — |
| `ingredient-edit.html` | admin, inventory | one ingredient | POST `/ingredients/update`, `/ingredients/status`, `/ingredients/archive` | `id` | — | archive and delete dialogs |
| `stock-movements.html` | admin, inventory | `inventory_transaction` + ingredient + user, newest first | GET filter form `filter-mv` | `date_from`, `date_to`, `type`, `ingredient_id`, `user_id` | Movements, Stock in, Wastage, Adjustments and counts (grouped query; the Type menu only narrows the table) | pager |
| `suppliers.html` | admin, procurement | suppliers with items supplied and open orders | POST `/suppliers`, `/suppliers/update`, `/suppliers/delete` | — | — | add and edit dialogs |
| `supplier-detail.html` | admin, procurement | one supplier: price list with latest change, purchase orders | POST `/suppliers/update`, `/suppliers/delete` | `id` | — | one chart |
| `supplier-price-comparison.html` | admin, procurement | for each ingredient sold by more than one supplier: offers lowest first and price history by supplier and date (one tab panel each, `data-id` = ingredient) | none | — | gap to the cheapest | tab buttons |
| `procurement.html` | admin, procurement | suggested items grouped by preferred supplier | POST `/purchase-orders` (one form for the ticked rows of a supplier: `ingredient_id[]`, `quantity[]`, `unit_cost[]`; and the draft header: `supplier_id`, `order_date`, `expected_date`, `notes`) | — | Urgent / soon, Estimated cost, Suppliers, Pending purchase orders | add and remove rows with live totals (recalculate on the server) |
| `purchase-orders.html` | admin, procurement | `purchase_order` + lines + supplier, newest first | GET filter form `filter-po` | `status`, `q` | Pending, Overdue, Next delivery, Received over the whole list; counts on the status buttons (sample: 33 = 4 pending + 28 received + 1 cancelled) | pager |
| `purchase-order-detail.html` | admin, procurement | one order: lines, status history, deliveries | POST `/purchase-orders/cancel` | `id` | line totals, still to come, price variance | print button |
| `receiving.html` | admin, inventory, procurement | receivable orders (sent, partial), their lines; recent receipts | POST `/receiving`: `po_id`, `supplier_id`, `status`, `received_by`, and per line `ingredient_id[]`, `quantity[]`, `unit_cost[]`, `received_date[]`, `expiry_date[]` | — | Sent or partially received, Overdue, Due tomorrow, Received last 4 weeks | add and remove rows |
| `demand.html` | admin, procurement | one row per ingredient: forecast, to buy, days left; dish sales | GET `forecast_days`, `per_page` | `forecast_days`, `page`, `per_page` | forecast = average daily use of the last 7 complete days × `forecast_days` | line chart (drawn from its table), pager |
| `reports.html` | admin, inventory, procurement | the report cards the role may open | none | — | hint figures come from the same queries as the reports | — |
| `report-dish-ranking.html` | admin | dishes with units sold, change, portions possible | GET filter | `category`, `date_from`, `date_to` | Portions sold, Sales, best and slowest dish, average per dish | calendar *Portions sold* |
| `report-expiry-wastage.html` | admin, inventory | near-expiry batches; wastage entries | GET filter | `reason`, `date_from`, `date_to` | near-expiry batches and loss; wastage, 30 days; largest reason; most wasted ingredient | calendar *Wastage* |
| `report-ingredient-usage.html` | admin, inventory | ingredients by value used, with status | GET filter | `category`, `date_from`, `date_to` | Value used, change vs the week before, top ingredient | calendar *Ingredient value used* |
| `report-inventory-status.html` | admin, inventory | ingredients with status, most urgent first | GET filter | `category`, `status`, `date_to` | counts from the table; near-expiry loss | calendar *Ingredients needing attention* (day-end history) |
| `report-low-stock.html` | admin, inventory | ingredients at or below reorder level | GET filter | `category`, `supplier_id`, `date_to` | Low or out of stock, Critical, Already on order, To buy | calendar *Ingredients at or below reorder level* (day-end history) |
| `report-pending-orders.html` | admin, procurement | pending purchase orders with lines | GET filter | `status`, `supplier_id`, `date_to` | Pending, Pending value, Overdue, Next delivery | calendar *Open purchase orders* (day-end history) |
| `report-purchase-history.html` | admin, procurement | received orders; spend by supplier and week | GET filter | `supplier_id`, `date_from`, `date_to` | Received value, Average receipt, Top supplier, Busiest week | calendar *Purchase spend* |
| `report-sales-trend.html` | admin | daily, monthly and yearly sales | GET filter | `order_type`, `date_from`, `date_to` | Last 7 days, Best day, Month to date, Last full month: all add up from the calendar's daily values | calendar *Sales* with day cards, line chart |
| `report-suggested-purchases.html` | admin, procurement | replenishment rows | GET filter | `category`, `supplier_id`, `forecast_days` | Items, Estimated cost, Urgent, Suppliers | calendar *Suggested purchases (value)* (day-end history) |
| `report-supplier-prices.html` | admin, procurement | compared ingredients, cheapest and gap | GET filter | `category`, `supplier_id`, `date_to` | Widest gap, Preferred is not lowest | calendar *Supplier price changes* |
| `user-accounts.html` | admin | `user_account` by name | POST `/users`, `/users/update`, `/users/status`, `/users/reset-password`, `/users/delete` | `role`, `q` | counts on the role buttons | add, edit, reset and status dialogs |
| `role-permissions.html` | admin | the fixed role matrix | none | — | — | read-only table |
| `settings.html` | admin | `setting`, `category`, `unit`, `payment_method` | POST `/settings/business`, `/settings/inventory`, `/settings/payments`, `/settings/categories`, `/settings/categories/update`, `/settings/categories/archive`, `/settings/units`, `/settings/units/update` | — | ingredients / dishes / used-by counts per row | add and edit dialogs |
| `profile.html` | every role | the signed-in user | POST `/account` (`name`, and `username` for the Administrator only), `/account/password` | — | — | — |
| `access-denied.html` | every role | none | none | — | — | the server answers 403 with this page |
| `not-found.html` | every role | none | none | — | — | the server answers 404 with this page |
| `index.html` | — | none | none | — | — | forwards to `login.html` |

## 3. Endpoints (proposed)

Every POST: check the role, validate (section 6), save, **redirect** to the page it came from (or the next one) with a flash message. On a failed
validation show the same page again, the typed values in the fields, the field messages in the `*-error` slots (`hidden` removed) and an `error` flash.
Hidden fields named `…_id` carry the key of the row; the server must check that the row exists and that the role may change it.

| Method and route | Roles | Fields | After saving |
|---|---|---|---|
| POST `/login` | everyone | `username`, `password` | start page of the role; or the login page with one alert |
| POST `/logout` | signed in | — | `login.html` |
| POST `/account` | signed in | `user_id`, `name`, `username` (Administrator only, unique) | `profile.html`, success |
| POST `/account/password` | signed in | `user_id`, `current_password`, `new_password`, `confirm_password` | `profile.html`, success |
| POST `/users` | admin | `name`, `username`, `password`, `role` | `user-accounts.html` |
| POST `/users/update` | admin | `user_id`, `name`, `username`, `role` | `user-accounts.html` |
| POST `/users/status` | admin | `user_id`, `is_active` (0 or 1) | `user-accounts.html` |
| POST `/users/reset-password` | admin | `user_id`, `password` | `user-accounts.html` |
| POST `/users/delete` | admin | `user_id` | `user-accounts.html` |
| POST `/ingredients` | admin, inventory | `name`, `category`, `unit`, `reorder_level`, `near_expiry_days`, `preferred_supplier_id`, `opening_quantity`, `expiry_date` | `inventory.html` |
| POST `/ingredients/update` | admin, inventory | `ingredient_id`, same fields (no opening quantity) | `inventory-item.html` |
| POST `/ingredients/status`, `/ingredients/archive` | admin, inventory | `ingredient_id`, `is_active` or `action` (`archive` or `delete`; delete only when unused) | `inventory.html` |
| POST `/ingredients/reorder-level` | admin, inventory | `ingredient_id`, `reorder_level` | `inventory-item.html` |
| POST `/stock/in` | admin, inventory | `ingredient_id`, `quantity_received`, `unit_cost`, `received_on`, `expiry_date`, `supplier_id`, `po_id`, `note` | page it came from |
| POST `/stock/out` | admin, inventory | `ingredient_id`, `quantity_used`, `reason`, `note` | same |
| POST `/stock/wastage` | admin, inventory, kitchen | `ingredient_id`, `quantity_wasted`, `reason`, `note` | same |
| POST `/stock/count` | admin, inventory | `ingredient_id`, `previous_quantity`, `counted_quantity`, `adjustment_type`, `reason` | same |
| POST `/menu`, `/menu/update` | admin | `name`, `category`, `price`, `prep_minutes`, `availability`, `image` (file), `remove_image`, recipe lines `ingredient_id[]`, `quantity_used[]`; `item_id` on update | `menu.html` |
| POST `/menu/delete` | admin | `item_id`, `action` (`archive` when the dish has orders) | `menu.html` |
| POST `/suppliers`, `/suppliers/update` | admin, procurement | `name`, `contact`, `phone`, `email`, `address`, `lead_time_days`, `notes`; `supplier_id` on update | `suppliers.html` |
| POST `/suppliers/delete` | admin, procurement | `supplier_id`, `action` (archive when the supplier has orders or price rows) | `suppliers.html` |
| POST `/purchase-orders` | admin, procurement | `supplier_id`, `order_date`, `expected_date`, `notes`, `status`, lines `ingredient_id[]`, `quantity[]`, `unit_cost[]` | `purchase-orders.html` |
| POST `/purchase-orders/cancel` | admin, procurement | `po_id`, `action` (allowed while draft or sent and nothing is received) | `purchase-order-detail.html` |
| POST `/receiving` | admin, inventory, procurement | `po_id`, `supplier_id`, `status`, `received_by`, per line `ingredient_id[]`, `quantity[]`, `unit_cost[]`, `received_date[]`, `expiry_date[]` | `purchase-orders.html` |
| POST `/settings/business` | admin | `business_name`, `contact_number`, `address` | `settings.html` |
| POST `/settings/inventory` | admin | `default_near_expiry_days`, `safety_stock_days`, `critical_threshold_pct`, `well_stocked_multiple` | `settings.html` |
| POST `/settings/payments` | admin | `payment_label[id]`, `payment_enabled[id]` | `settings.html` |
| POST `/settings/categories`, `/update`, `/archive` | admin | `kind` (`ingredient` / `menu`), `name`; `category_id` | `settings.html` |
| POST `/settings/units`, `/update` | admin | `name`, `description`; `unit_id` | `settings.html` |

GET filter forms send only the named parameters of section 2; their `action` is the page itself, so the page reloads with the values in the query string.
Every pager link keeps the current filters in its query string and only changes `page`.

## 4. Calendar data

Ten calendars (the ten `report-*.html` pages). Each is one `<script type="application/json" data-cal-data>` block inside `<section data-cal>`; `calendar.js`
draws the Year heat-map, the Month grid and, when the JSON has `days`, the Day card. It adds up every figure on screen from `values`. The server prints this
JSON (one block per calendar):

```
name    "Portions sold"        used in the screen-reader texts
start   "2025-11-07"           date of values[0]; the last value is `today`
today   "2026-11-06"           last day with data
asOf    "11:30 AM"             optional: today is a partial day for this figure
kind    "total" | "peak"       how days combine into a week or month: sum (a flow, e.g. sales) or highest (a day-end level)
unit    "peso" | "count"       peso values show as ₱1,234, counts as 1,234
noun    "portions"             legend: "darker means more portions"
steps   [0, 40, 80, 120, 160]  lower bounds of colour steps c1…c5; a value of 0 or less is c0 ("None")
label   { one, many, zero? }   tooltip text after the day; `zero` replaces the whole text for 0
values  [365 numbers]          one per day, oldest first
orders  [365 numbers]          optional (Sales): orders per day
days    { "2026-11-06": { cancelled, cash, cashOrders, ewalletOrders, compare: { avg, n, basis: "day" | "by1130" },
                          hours: [[sales, orders] × 8 AM…], top: [[dish, quantity, sales] × 5] } }    optional: adds the Day view (Sales has 31)
scale   "warn"                 optional: amber/red scale instead of green (same as data-scale on the section)
```

Colour rule: c0 when `value ≤ 0`, otherwise `1 + the number of steps[1..4] the value reaches`. The source of each `values` array is in the comment above its block.

## 5. Numbers that cannot be derived from the rows

These come from data that the proposal's ERD does not keep. They are the "Beyond the proposal" list of the README, with what the server has to store.

| Number | Pages | What to store |
|---|---|---|
| Daily sales, orders, cancelled orders, cash sales | `report-sales-trend.html` (Sales calendar, day cards, yearly and monthly tables) | `sales_summary`: one row per day (`summary_date`, `orders`, `sales`, `cancelled_orders`, `cash_sales`), written at day end |
| Ingredients needing attention | `report-inventory-status.html` | a day-end snapshot count (out of stock + at or below reorder level + near-expiry), one value per day |
| Ingredients at or below reorder level | `report-low-stock.html` | a day-end snapshot count, one value per day |
| Open purchase orders at day end | `report-pending-orders.html` | purchase orders created on or before the day and not yet received at day end; can be rebuilt from status dates, else store one value per day |
| Suggested purchases (value) | `report-suggested-purchases.html` | the day-end total of the suggested list, one value per day |
| Supplier price changes | `report-supplier-prices.html`, `supplier-detail.html` | one row for each price update (`supplier_item`, date, old and new price) |

The rest of the page numbers (cards, badges, filter counts) are counts or sums of rows and each has a rule comment. Where a sample number was checked
against its rule, the check is listed in `DEVELOPMENT-REPORT.md` (Phase 9).

Three more things to confirm against your ERD: `ingredient.is_active` (the ingredient page archives instead of deleting), `user_account.last_login_at`
(user list) and `setting.well_stocked_multiple` (the green stock bar).

## 6. Validation rules to repeat on the server

The markup carries `required`, `min`, `max`, `step`, `maxlength` and `pattern`; the browser enforces them for the user, the server must enforce them again.

| Field | Rule |
|---|---|
| `username` | required, 3–60 characters, letters, digits, `.`, `_`, `-` (`[A-Za-z0-9._\-]{3,60}`), unique |
| `password` (new user), `new_password` | 8–72 characters; `new_password` also needs a letter and a digit (`(?=.*[A-Za-z])(?=.*[0-9]).{8,72}`); `confirm_password` must equal it |
| `name` | required: user 120, dish 100, supplier 120, ingredient 100, category and unit 60 (see each field) |
| `phone`, `contact_number` | `[0-9 +()-]`, 7–30 characters (7–20 for the business number) |
| `email` | valid e-mail, up to 100 characters |
| `lead_time_days` | whole number 0–60 |
| `price` (dish) | 0–99,999.99, two decimals |
| `prep_minutes` | whole number 1–240 |
| `reorder_level` | 0–9,999, up to three decimals |
| `near_expiry_days`, `default_near_expiry_days` | whole number 1–365 |
| `opening_quantity` | 0–99,999, up to three decimals |
| `quantity_received`, `quantity_used`, `quantity_wasted`, `counted_quantity`, `quantity[]` | number ≥ 0 |
| `unit_cost`, `unit_cost[]` | number ≥ 0, two decimals |
| dates (`received_on`, `order_date`, `expected_date`, `expiry_date`, `received_date[]`) | valid dates; `received_on`, `order_date` and `expiry_date` of a stock-in or receiving line are required |
| `notes` | up to 300 characters; stock `note` up to 200 |
| `safety_stock_days` | 0–14 in steps of 0.5 |
| `critical_threshold_pct` | whole number 1–100 |
| `well_stocked_multiple` | 1.5–5 in steps of 0.5 |
| `image` (dish picture) | JPEG, PNG or WebP only (check the file's real type, not its name), up to 2 MB; `remove_image=1` deletes the stored picture |
| `role` | one of the five role keys |
| `_csrf` | not in the pages yet: see section 7 |

Rules written in the page text that the server must also keep: usable stock never counts expired batches; a purchase order can be cancelled only while it is
draft or sent and nothing was received; an ingredient, dish or supplier that has records is archived, not deleted (the page says so next to the button).
We suggest the same for a user with records, and refusing a stock out, wastage or count that would take a batch below zero; the markup does not enforce these.

## 7. Styles, scripts and the CSP

Your `docs/conventions.md` says: no Tailwind, no build step, a Content-Security-Policy for the same origin only, no inline scripts, a `_csrf` field on state-changing
requests. These pages differ in five ways. None of them needs a build step on your side.

| Conflict | What the pages do | Options |
|---|---|---|
| Tailwind | `assets/css/tailwind.css` is **compiled** here (from `tools/`) and checked in; there is no Tailwind at run time and nothing to build when you serve it | Serve the file as a plain static asset from `public/assets/` next to `app.css`. Rebuild it only when someone adds a class (`npm run build:css` in `tools/`). If the rule must hold without exception, translate the used classes to your own CSS |
| Inline JSON blocks | the calendars use `<script type="application/json" data-cal-data>` | These are data blocks, not executed, so `script-src 'self'` does not block them; the server prints them in the page |
| Inline `style=` | 25 lines use `style="width:…"`, `left:`, `min-width` (bars and a few widths); the JavaScript sets styles through the DOM | `style-src` would block the attributes: allow `style-src-attr 'unsafe-inline'`, or move each width into a class or a `data-` value that a script applies |
| Scripts | nine classic scripts in `assets/js` that share one global, `Ace` (not ES modules) | Serve them from `public/assets/js/`; they need no inline code. Converting to modules means replacing `window.Ace` with imports |
| `_csrf` | the forms carry no token | add `<input type="hidden" name="_csrf" value="…">` to every `<form method="post">` in the include or in a form helper; no script reads it |

Fonts (Inter) are self-hosted in `assets/fonts` and no page loads anything from another host, so the same-origin policy for fonts, images and scripts holds.

## 8. What to replace first

1. The three shared blocks (section 1) as includes, with `data-role`, the user chip and `aria-current` printed by the server.
2. `POST /login` and `POST /logout`, then the permission check for every page and every POST (the pages only hide things).
3. The flash slot: redirect after each POST and print one variant.
4. The list pages, one by one: Order Records, Inventory, Stock Movements, Purchase Orders, Menu, Users. Print one page of rows, the pager links, the filter values and the
   card numbers by the rule comments.
5. The stock forms (`/stock/in`, `/stock/out`, `/stock/wastage`, `/stock/count`) and receiving: they change numbers shown on every other page.
6. The purchase list and purchase orders (`/purchase-orders`, `/receiving`, `/purchase-orders/cancel`).
7. Suppliers, ingredients, menu items, users and settings forms.
8. The reports and the ten calendar JSON blocks, then the dashboard charts.
9. Validation (section 6), `_csrf`, the image upload, and the CSP decisions of section 7.
