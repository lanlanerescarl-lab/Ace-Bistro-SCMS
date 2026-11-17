# Development report — Ace Bistro SCMS front end

One section per phase, in order. Each section holds the date, the request, what was built, what already existed, the checks and their results, what was
untested or not possible, and the decisions with their defaults.

**Where the facts come from.** The final summary messages of Phases 1 to 8 were not available when this report was written. A section marked
**rebuilt from the brief** is written only from the project notes and the written briefs (the Phase 7, Phase 8 and Phase 9 briefs and the notes kept for the
project). It says what was asked and delivered, and says "not recorded" where no result was kept. Nothing in it is a remembered number. Phase 8 uses the
report that was written into the Phase 9 brief. Phase 9 was done in the same session as this file, so its numbers are measured.

Dates are the dates in the project notes. A delivery date is the day the ZIP was handed over.

## Phase 1 — Design system, app shell, role switcher, data layer, Dashboard (rebuilt from the brief)

- **Date:** requested 2026-11-06.
- **Request:** the whole UI/UX front end as a downloadable codebase for the BSIS course proposal: HTML5, Tailwind CSS from the CDN and vanilla JavaScript, running in Phoenix Code Live Preview.
  Phase 1 was the design system, the app shell, the role switcher, the data layer and the Administrator Dashboard.
- **Built:** the green design direction (brand `#15803D`), the shell (sidebar, top bar), five roles (Administrator / Owner, Cashier, Kitchen, Inventory, Procurement), mock data behind one
  data layer (`assets/js/data.js`) with browser storage for the demo state and a reset button, and the Dashboard following the proposal's wireframe row order.
- **Revision on the same day:** the purchase quantity rule (forecast demand + safety stock − usable stock − incoming stock, never below zero; safety stock is one day of forecast use),
  computed once and read by the dashboard, forecast, purchase list and alert counts; a glanceable dashboard; one badge system with a severity ladder; one segmented control; keyboard-accessible tooltips;
  readable secondary text; a self-check that asserts that numbers on different widgets agree. The dashboard dish card became a ranking (rank, units, % against the prior period).
- **Already existed:** nothing (first phase).
- **Checks:** a self-check script was asked for. Its result is not recorded.
- **Untested or not possible:** not recorded.
- **Decisions:** the revision brief asked for at most three open decisions, each with a default; the decisions themselves are not recorded.
- **Delivered:** the full project as a ZIP with one top-level folder `ace-bistro-scm`.

## The rebase to static pages (rebuilt from the brief)

- **Date:** brief of 2026-11-07; approved with "go" and delivered together with Phase 2 on 2026-11-08.
- **Request:** the site had to become plain, hand-editable static HTML, one file per screen with sample values written in the markup, because PHP would replace the sample values later.
  No runtime data layer, seed or browser storage; `data.js`, the self-check and the tests moved to `_archive/`; one small `ui-behaviors.js` that only toggles existing markup;
  the shared sidebar, top bar and flash block between `BEGIN SHARED` / `END SHARED` comments; PHP-ready conventions (loop comments, `data-id` rows, ERD-named form fields);
  `docs/DATA-REFERENCE.md` as the single list of sample values; every link to a real page; screens rendered at the frozen date Friday 6 November 2026.
  The user supplied `ace-bistro-scm-phase1-adjusted.zip` as the baseline (their edits win: daily sales limit 25,000, today's sales target 10,000, higher order volumes, eggs sold per tray of 30 pieces, admin name Carl John, chart axis options, `jsconfig.json` kept).
- **Built:** the static conversion of Phase 1 and the pages of Phase 2 in the static style.
- **Already existed:** the Phase 1 design system, shell and screens.
- **Checks and untested items:** not recorded.
- **Decisions and defaults:** two static chart variants (narrow and wide); egg recipes written as "1 pc (1/30 tray)" while stock, supplier and demand tables stay in trays.
  The workflow was: report the differences from the baseline, plan with at most three decisions, then build.

## Phase 2 — Orders, Menu and Recipes (rebuilt from the brief)

- **Date:** asked on 2026-11-07, delivered 2026-11-08 as `ace-bistro-scm-static-phase2.zip`.
- **Request:** Orders (entry, list, kitchen queue) and Menu & Recipes, in the same design system, shell and data approach, added to the existing project.
- **Built:** the order and menu screens. (The order entry and kitchen queue screens were removed again in Phase 7.)
- **Already existed:** the design system, the shell and the conversion rules.
- **Checks, untested items:** not recorded.
- **Decisions:** see the rebase section above.

## Phase 3 — Inventory and Suppliers (rebuilt from the brief)

- **Date:** requested 2026-11-08; delivered as `ace-bistro-scm-phase3.zip`.
- **Request:** the same static style; report conflicts before coding; wastage reasons Spoilage, Expired, Preparation waste, Damaged; Kitchen Staff can only report waste; Procurement is read-only on stock.
- **Built:** the Inventory and Supplier screens. The list of pages in that brief is not available, so none is named here.
- **Already existed:** the shell, design system and sample data list.
- **Checks, untested items, decisions:** not recorded.

## Phase 4 — Chart hover, Procurement, Demand Estimation (rebuilt from the brief)

- **Date:** requested 2026-11-08 ("proceed with phase 4"); delivered as `ace-bistro-scm-phase4.zip`.
- **Request:** Part A, a chart hover revision first: `data-tip` on transparent hit areas, one `chart-tip` per chart, no `<title>`, a shared function for the tooltip, CSS-only animation, keyboard stepping,
  a README section "Editing charts". Part B, Procurement: purchase list, purchase order list and detail with a print layout, receiving (including the Inventory Staff view).
  Part C, finish Demand Estimation: sales and usage trend charts, 7 / 14 / 30-day static panels, a per-dish demand table. A short report (chart inventory, screens, sample values, order statuses, conflicts) came before coding.
- **Built:** the three parts as listed.
- **Already existed:** the charts of Phases 1 to 3 and the shell.
- **Checks, untested items, decisions:** not recorded.

## Phase 5 — Reports, User Management, Login, states, quality pass (rebuilt from the brief)

- **Date:** requested 2026-11-08, delivered 2026-11-09 as `ace-bistro-scm-phase5.zip`.
- **Request:** a Reports hub and ten printable report pages (the proposal's Section 13 list, limited by role); User Management with a role-permission table; the finished login page; empty and error states
  (`states.html`, `access-denied.html`, `not-found.html`); a quality pass (accessibility, overflow, console, a lighter `demand.html` and `menu.html` without changing the look); a final review against the proposal's
  eight modules; a README table "Handover to PHP"; the final ZIP. A report came before coding (pages, sample values, keeping pages lean, conflicts).
- **Built:** as requested. The project notes then recorded the five-phase build as finished.
- **Already existed:** every earlier screen.
- **Checks, untested items, decisions:** not recorded.

## Phase 6 — Missing screens and server-ready forms (rebuilt from the brief)

- **Date:** requested 2026-11-09 ("proceed with the final phase"); delivered 2026-11-11 as `ace-bistro-scm-phase6.zip` after several "continue" messages.
- **Request:** the missing screens (Settings, ingredient add and edit, order receipt, kitchen ticket, Stock Movements, style guide, My account, pagination for lists over 20 rows); server-ready forms
  (validation attributes, error slots, CSRF placeholders, confirm dialogs for POST, GET filter forms, rows cloned from a template, live totals); preparation for PHP (`data-var` marking, a generated variable list,
  `data/*.php`, `includes/`, `php-examples/`, `database/schema.sql` and `seed.sql`, field map, page queries); a production Tailwind build in `tools/`; small fixes. Fields beyond the ERD marked "EXTRA (not in the proposal ERD)".
- **Built:** all parts, as the project notes record. The Phase 7 brief gives the delivered size: **41 pages, 3.52 MB, `demand.html` 440 KB**.
- **Already existed:** every earlier screen and the static conventions.
- **Checks, untested items, decisions:** not recorded.

## Phase 7 — Fixes: order screens removed, no flashing panels, stock colours, calendars (rebuilt from the brief)

- **Date:** brief of 2026-11-11; delivery date not recorded.
- **Request:** (A) remove the flash of the Alerts panel and the staff profile while a page loads; (B) Out of Stock a darker red than Critical and a green stock bar when stock is far above the reorder level;
  (C) this is a supply chain system, so the New Order and Kitchen Queue screens go; (D) a Sales Calendar (day, month, year) and a calendar for every report; (E) docs, checks, delivery.
- **What the brief measured before the fix (the user's numbers):** with scripts blocked, `dashboard.html` showed the Alerts popover, the Account popover, 5 user chips instead of 1 and 2 alert badges instead of 1.
- **Built (as the Phase 8 brief describes the delivered build):** the role view painted from the first frame; a five-level stock status ladder (Out of Stock, Critical, Low, Near-Expiry, OK) and a green bar for well-stocked ingredients;
  the Sales Calendar on Sales Trend and calendars on the other reports; the roles re-cut for a supply chain system; the four point-of-sale pages (`orders-new`, `orders-kitchen`, `order-receipt`, `kitchen-ticket`) were to be deleted by the plan, and the page count fell from 41 to 37, which fits.
  Delivered as `ace-bistro-scm-phase7.zip`: **37 pages, about 4.04 MB**.
- **Already existed:** the shell, the dashboard, the report pages, the stock list and the five roles.
- **Checks:** the brief asked for a link check, consistency check, data-file check, page-variables check, a new flash check, an accessibility audit, overflow at 1440 / 1024 / 390 px, behaviours and a form validity check. Their results are not recorded.
- **Untested or not possible:** not recorded. The sandbox could not reach the Tailwind CDN, so pages were rendered with a compiled stylesheet as the stand-in.
- **Decisions in the brief (with defaults):** link the compiled stylesheet before the CDN script; well-stocked means usable stock at least twice the reorder level (a Settings value `well_stocked_multiple`);
  one new table `sales_summary` for the daily history; keep the five proposal roles but give Cashier and Kitchen supply-chain access; Order Records stays read-only.

## Phase 8 — A clean, front-end-only build

- **Date:** brief of 2026-11-13; delivered 2026-11-14 as `ace-bistro-scm-phase8.zip`. This section follows the Phase 8 report that was kept in the Phase 9 brief.
- **Request:** the project manager's revisions: remove everything that is not front end; test accounts, a login with a loading state, a session guard, one signed-in user everywhere, a confirmed log out, role-safe Alerts links;
  local Tailwind and self-hosted fonts instead of the CDN; a working pager, rows per page and filters with summary numbers that add up; menu pictures with an upload preview; a larger heat-map; files under the line limits with comments for the next developer; a new README.
- **Delivered:** 35 pages, 2.70 MB (Phase 7: 37 pages, 4.04 MB). Backend material, the style guide, `states.html` and the demo tools were deleted. Renamed: `purchase-order.html` → `purchase-order-detail.html`,
  `supplier-prices.html` → `supplier-price-comparison.html`, `users.html` → `user-accounts.html`, `users-roles.html` → `role-permissions.html`.
- **Built:** test accounts, login with loading state, session guard, one user chip, log-out confirmation, role-safe Alerts links; local Tailwind 3.4.17 and self-hosted Inter; component classes in `app.css` (about 510 lines);
  one pager and real sample rows; Order Records with clickable cards and one shared order dialog; Stock Movements whose cards equal their rows; Menu with pictures, upload preview and one shared recipe dialog;
  a heat-map with 20 px cells and one calendar component with a JSON block per calendar (10 calendars); 14 JS files (largest 251 lines); header and section comments on every page; a README of 136 lines.
- **Line counts after Phase 8:** dashboard 1,289 · user-accounts 1,194 · demand 1,186 · inventory-item 1,057 · inventory 926 · report-sales-trend about 755 · orders about 751 · menu about 740.
  Before (Phase 7): menu 3,969 · demand 3,926 · orders 2,419 · report-sales-trend 2,061 · dashboard 2,040 · inventory 1,906.
- **Already existed:** the pages, the look, the sample data and the ERD field names; the Phase 7 behaviours were kept.
- **Checks that passed:** behaviour tests with 0 failures, axe clean on all pages at both widths, the first-frame test, a link check (35 pages), no 4xx or 5xx responses, line charts identical to Phase 7 at 1440 and 390.
- **Not derivable from rows:** the Ingredient Usage prior-week figure was ₱68,425 but the daily values add up to ₱68,424, so it became ₱68,424; "Highest month" counts complete months only; Order Records holds only 3 days of rows (Nov 4–6)
  while the calendars cover 365 days; the day-end history for five calendars and the supplier price changes are not in the ERD.
- **After delivery (2026-11-14):** stability fixes for the "shaking" report (scrollbar gutter, no sidebar animation on wide screens, all four font weights preloaded; it could not be reproduced); the admin username changed from `areyes` to `carljohn`
  and became editable on My account for the Administrator only; the username `pattern` was being ignored by the browser (a `-` at the end of a character class) and was fixed in all pages.
- **Decisions and defaults:** frozen clock; SVG dish pictures with a placeholder; upload checks for JPEG, PNG and WebP up to 2 MB with nothing sent; 20 rows per page with 50 and 100 as options.

## Phase 9 — Backend hand-off: remove the mock behaviour, document the build

- **Date:** brief of 2026-11-16 (the repository was checked that day: 3 commits from 2026-11-14); work done 2026-11-16 and 2026-11-17 on the branch `frontend-handoff`, started from commit `a072579` of `main`.
- **Request:** hand the front end to the backend developer: remove or turn into a clear seam every piece of mock behaviour (the fake login, the fake saves, numbers counted by the browser), keep the look and the markup,
  and document the whole development. The Phase 8 ZIP stays as the working demo; this phase makes a second package, `ace-bistro-scm-handoff.zip`.
- **Built:**
  - **Login and role (D1).** Deleted `test-accounts.js`, `login.js` and `session.js` and the session guard in 33 pages. Each page carries `data-role="admin"` on `<html>`; the CSS no longer hides the body.
    The user chip, My account and the log-out confirm are written in the markup (Carl John, `carljohn`); the login form posts to `/login`; log out is a form that posts to `/logout`.
  - **Saving (D2).** Removed `data-local-save` and the 600 ms timer. The forms post to named routes. `forms.js` keeps the double-submit guard (the submit button is disabled and shows its `data-loading-text` until the page reloads).
    The toast component stayed, and a `flash` slot (success, error, warning) was added to the shared shell. The only `setTimeout` left is the 5-second close of a success toast in `shell.js`.
  - **Lists (D3).** Deleted `filters.js` and `pager.js`. Filters are GET forms and links (`q`, `status`, `date_from`, `date_to`, `type`, `page`, `per_page`), summary cards are submit buttons that carry `name="status"`, the pager is plain markup with `?page=` links,
    and every number is plain text with a rule comment. Order Records, Inventory, Stock Movements and Purchase Orders now show one page of 20 rows.
  - **Seams and comments.** About 70 forms have a named route (list in `docs/BACKEND-HANDOFF.md`); repeated blocks have a source comment; every derived number has a rule comment; pages and comments carry `EXTRA (not in the proposal ERD)` markers
    (the README list "Beyond the proposal" was rebuilt from them); the PHP and SQL wording in comments was rewritten in plain words; the login page has a comment for its four alert slots.
  - **Documents.** `docs/BACKEND-HANDOFF.md`, this report, and a README of 151 lines (working demo vs hand-off package, no login, how to preview another role, what the backend replaces, no test-account text, and the last section replaced as the project manager asked).
- **Already existed:** every page, the look, the calendar, line chart, row-dialog, rows, menu-images, dialogs and charts scripts (unchanged except that no longer needed hooks were removed from `shell.js` and `forms.js`), the sample data, the `SUMMARY RULES` comments of Phase 8.
- **Line counts, Phase 8 build (`main`) → this build:** HTML 22,379 → 21,698 lines in 35 pages; JavaScript 1,416 lines in 14 files → 1,057 lines in 9 files (largest still 251: `calendar.js`); `app.css` 510 → 503; README 136 → 151.
  Pages that changed by more than 20 lines: orders 753 → 449, stock-movements 662 → 366, settings 655 → 604, inventory 928 → 894, user-accounts 1,196 → 1,147, inventory-item 1,059 → 1,020. The largest page is `dashboard.html` with 1,300 lines.
- **Checks that ran, with results:**
  - Cleanliness (script outside the project, 48 front-end files): no `sessionStorage`, `localStorage`, `test-accounts`, `data-local-save`, `ACE_TEST`, "testing only" or "demo"; one `setTimeout` (the toast); no `https://` script, link or font URL; no `href="#"`; no duplicate ids; every script, link, image and font target exists; every script file is loaded by a page; every page has a header comment with a SCRIPTS line that matches the scripts it loads; all pages under 1,500 lines, all scripts under 400, `app.css` under 600. Two false alarms of the script were checked by hand.
  - README match: every item of "Beyond the proposal" is in a page comment, and every `EXTRA` comment of a page (outside the shared shell comments, which are listed under the shell item) is in the list; the README's last section was removed completely and nothing in the package points to it.
  - Pages: all 34 pages except `index.html` (which only forwards to `login.html`) opened at 1440 and 390 px with no console error, no failed request and no blank body. axe-core found no violations on any of them at both widths. No horizontal overflow at 1440, 1024 or 390 px.
  - Roles: with `data-role` changed in the test to each of the five roles on 8 pages (dashboard, inventory, orders, menu, purchase-orders, procurement, suppliers, reports), every `data-roles` element was shown exactly when its role is listed (40 combinations, 0 failures).
    The sidebar of each role (Administrator 10 links, Cashier 2, Kitchen 2, Inventory 3, Procurement 5) holds only pages that role may open, and so do the Alerts links of each role (Cashier has none, by design).
  - Behaviour: a dialog opens and closes with Escape; the Order Records dialog opens filled with the order; the Menu recipe dialog opens with its ingredient lines; the Sales calendar draws 365 day cells of 20 px and its Year, Month and Day views switch (the Day card shows ₱10,085 and 68 orders); a chart tooltip appears; the line chart is drawn; the live total on Procurement changes when a row is unticked;
    the Menu picture preview shows a PNG and refuses a text file and a file over 2 MB with messages; a posted login form reaches a static server that answers 405 and the page does not break; three quick clicks on Log in send one request, and the button shows "Logging in…" and is disabled.
  - Numbers: calendar block lengths (10 blocks × 365 values, last day = start + 364); the Sales monthly totals (Jun ₱521,441, Jul ₱561,400, Aug ₱557,555, Sep ₱561,589, Oct ₱578,920, Nov to date ₱104,100) and the last 7 days (₱129,800) equal the sums of the Sales calendar values;
    today's ₱10,085 and 68 orders equal the Nov 6 values, and 69 orders = 68 + 1 cancelled; wastage ₱1,567 equals the wastage calendar for Oct 8 to Nov 6; purchase receipts ₱298,028 equal the purchase-history calendar for Oct 10 to Nov 6; portions sold 1,191 and ingredient usage ₱67,482 and ₱68,424 equal their calendars;
    pending purchase orders ₱20,028 = 2,400 + 8,750 + 3,690 + 5,188 (the four pending rows); suggested purchases ₱20,174 equal the five rows of Procurement (quantity × price) and of the Demand page; purchase order buttons 33 = 4 pending + 28 received + 1 cancelled; Menu 15 = 7 + 4 + 3 + 1; users 7 = 1 + 2 + 2 + 1 + 1;
    inventory 25 ingredients, 9 needing attention = 1 out + 4 critical + 0 low + 4 near expiry, 16 OK; stock movements 330 = 136 + 175 + 14 + 5. All matched; no number was changed.
  - Screenshots at 1440 and 390 px (login, Dashboard, Order Records, Menu, Menu with the add-dish dialog, the Sales calendar report, My account) were compared with the Phase 8 build (`main`) by pixel difference: 12 of 14 are identical; the two Menu views differ by 94 and 160 pixels in the category buttons only (anti-aliasing of the text). The visible differences are therefore none; what changed is behind the pages.
  - A form audit against the ERD field names (names, `required`, `maxlength`, `pattern`, one error slot each, `enctype` where a file is sent, no CSRF field) ran with no open finding.
- **Untested or not possible:**
  - The branch could not be pushed: no GitHub account is linked to this session, so the result is the ZIP and a patch (`git diff main`) to apply, committed locally on `frontend-handoff`.
  - The comparison is with the Phase 8 build in the repository (`main`), not with the Phase 8 ZIP, which was not available in this session. The Phase 8 ZIP was not touched.
  - The role view was tested on 8 pages (the brief asks for at least 6), not on all 34. Only the Sales report calendar was driven by hand; the other nine calendars were checked for correct data and for console errors. Print layouts and other browsers than Chrome were not tested. There is no backend, so no form was tested beyond reaching the server.
  - The pages show one page of rows. The totals of the list pages (for example 69 orders and 330 stock movements) cannot be derived from those rows: the comments give the rule, and the numbers were checked against other pages as listed above. The stock-in count (136) was not checked against rows.
  - `ingredient.is_active` (the ingredient page archives instead of deleting) is not marked as `EXTRA`, because the proposal ERD was not available to check; it is listed in `BACKEND-HANDOFF.md` under "to confirm".
- **Decisions and defaults:** D1, D2 and D3 as in the brief. Lists keep one page of sample rows (20). The user chip prints the name, initials and role label and the username only on My account. Log out is a confirm dialog with a posting form. `index.html` forwards to `login.html`. The route names are proposals.
  The compiled `tailwind.css` is kept and the conflict with the PHP project's "no Tailwind, no build step" rule is written down, not changed. None of the PHP project's files were touched.

## Files deleted over the whole development

Files of the PHP project in the same repository belong to the backend developer and are not part of this table. The Phase 8 rows follow the Phase 8 brief; the rebase and Phase 7 rows follow the notes and briefs and are marked as rebuilt.

| Phase | Deleted | Why |
|---|---|---|
| Rebase (rebuilt) | `assets/js/data.js`, `selfcheck.js` and the tests moved to `_archive/` (not deleted yet) | the site became static: no runtime data layer |
| Phase 7 (rebuilt) | `orders-new.html`, `orders-kitchen.html`, `order-receipt.html`, `kitchen-ticket.html` (41 pages became 37) | the order entry and kitchen queue screens were removed; Order Records stays as a read-only list |
| Phase 8 | `data/` (18 PHP files and its README), `includes/` (5 PHP files), `php-examples/` (2), `database/` (SQL), `partials/`, `docs/` (4 files, with `DATA-REFERENCE.md`), `ASSUMPTIONS.md` | backend material does not belong to the front-end deliverable |
| Phase 8 | `_archive/` (`legacy-src`, `render`, `tests`, two baseline copies), `jsconfig.json`, `tools/node_modules` | not part of the product |
| Phase 8 | `styleguide.html`, `states.html` (37 pages became 35), the "Demo tools" box and its script | replaced by the README component list; the states live in real pages |
| Phase 8 | `assets/js/ui-behaviors.js` (one 480-line file), `assets/js/tailwind.config.js` | split by feature; local Tailwind build |
| Phase 9 | `assets/js/session.js`, `login.js`, `test-accounts.js` | the real login replaces the fake one |
| Phase 9 | `assets/js/filters.js`, `pager.js` | lists are filtered and paged by the server |

Renamed in Phase 8: `purchase-order.html` → `purchase-order-detail.html`, `supplier-prices.html` → `supplier-price-comparison.html`, `users.html` → `user-accounts.html`, `users-roles.html` → `role-permissions.html`. Nothing was renamed in Phase 9.
