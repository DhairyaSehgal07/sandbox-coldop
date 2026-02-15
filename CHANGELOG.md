# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.15.0] - 2026-02-15

### Added
- Farmer profile (People): date range filter (From / To) for orders with DatePicker and Clear button; `useGetFarmerOrders` and API now support optional `from`/`to` query params
- DatePicker: `fullWidth` prop for full-width layout (e.g. mobile stacks)
- Incoming gate pass create: on success invalidate vouchers and navigate to daybook
- Incoming gate pass update and outgoing gate pass create: on success navigate to daybook

### Changed
- Incoming form: gate pass number and location (chamber, floor, row) inputs now auto-uppercase on change
- Incoming form: bag quantity number inputs prevent wheel scroll and ArrowUp/ArrowDown to avoid accidental changes
- Farmer profile: orders list filter layout with date range on the right; query key and prefetch support date range

## [0.14.0] - 2026-02-13

### Added
- My Finances: Financial Statements tab with Balance Sheet and Trading & P&amp;L Account
- Balance Sheet component: displays assets (fixed/current), liabilities and equity from GET /ledgers/balance-sheet; loading and error states
- Trading &amp; P&amp;L Account component: opening/closing stock, purchases, sales, direct expenses, gross profit, net profit/loss from ledgers
- My Finances: Closing Balances tab with date range filter and ledger balances grouped by type/category
- `useGetBalanceSheet` hook and types in `services/accounting/useGetBalanceSheet.tsx` for balance sheet API
- Ledger View tab in My Finances for ledger-level view

### Changed
- My Finances: tab layout updated with Ledgers, Vouchers, Ledger View, Financial Statements, and Closing Balances
- UI components and forms: styling/formatting updates (font-custom, class names) across shadcn components, app bottom nav, daybook cards, incoming/outgoing forms, mode toggle, Hero, and store

## [0.13.0] - 2026-02-12

### Added
- My Finances / Vouchers: full vouchers tab with list (DataTable), search, create, edit, and delete
- Vouchers service module under `services/accounting/vouchers/`: `useGetAllVouchers`, `useCreateVoucher`, `useUpdateVoucher`, `useDeleteVoucher` with query invalidation and toasts
- Vouchers table columns: voucher #, date, debit/credit ledger names, amount, narration, actions (edit/delete)
- Separate form components: `LedgerCreateForm`, `LedgerEditForm`, `VoucherCreateForm`, `VoucherEditForm` for reuse and clearer structure

### Changed
- My Finances / Ledgers: type dropdown in create and edit forms now uses `SearchSelector` (searchable combobox) for consistency with incoming form
- My Finances / Vouchers: debit and credit ledger dropdowns use `SearchSelector` with search by name, type, category; ledger options loaded via `useGetAllLedgers` in `VoucherCreateForm`
- Ledgers and Vouchers tabs: create/edit dialogs now render the new form components instead of inline form markup

## [0.12.0] - 2026-02-12

### Added
- My Finances / Ledgers: create-ledger dialog with form (name, type, subType, category, opening balance) and validation
- My Finances / Ledgers: edit-ledger dialog with update API integration and form validation
- My Finances / Ledgers: delete-ledger flow with confirmation AlertDialog (non-system ledgers only)
- Ledgers service module under `services/accounting/ledgers/`: `useGetAllLedgers`, `useCreateLedger`, `useUpdateLedger`, `useDeleteLedger` with query invalidation
- AlertDialog UI component (shadcn) for delete confirmation

### Changed
- My Finances: Ledgers tab now uses new ledgers module; table columns support edit/delete actions and type badges
- Ledgers data and API: moved from single `useGetAllLedgers.tsx` to `ledgers/` folder with separate hooks for CRUD

### Removed
- `src/services/accounting/useGetAllLedgers.tsx` (replaced by `ledgers/useGetAllLedgers.tsx`)

## [0.11.0] - 2026-02-12

### Added
- Edit history: new store-admin page at `/store-admin/edit-history` listing all edits for the current cold storage (GET /edit-history/storage)
- Edit history: entry cards with before/after snapshots, entity type, action, edited-by, and collapsible details (bag sizes, variety, status, location)
- Edit history: search (by editor, summary, type, action), sort (latest/oldest), and refresh
- Store admin hook `useGetEditHistory` and prefetch helper for edit history data
- App topbar: "Edit history" link in store-admin dropdown

## [0.10.0] - 2026-02-12

### Added
- Daybook: dedicated `IncomingGatePassCard` and `OutgoingGatePassCard` components with expandable details, bag sizes table, location/farmer info, and action buttons (edit, print)
- Daybook: reusable `DetailRow` component for key-value detail display
- Badge UI component (shadcn) for status and labels in daybook cards

### Changed
- Daybook: refactored entry list to use gate pass cards instead of generic voucher components; incoming/outgoing entries now render type-specific cards with full details

### Removed
- Daybook: removed `incoming-voucher.tsx` and `outgoing-voucher.tsx` in favor of gate pass card components

## [0.5.0] - 2026-02-11

### Added
- Outgoing gate pass service module with `useCreateOutgoingGatePass` hook for creating outgoing gate passes (farmer storage link, gate pass number, date, variety, from/to, incoming gate pass allocations, remarks)
- Outgoing form: create-outgoing integration, validation and submission using `createOutgoingGatePassBodySchema`, error handling for API errors (400, 404, 409)
- Outgoing summary sheet: expanded summary with incoming gate pass entries, allocations per size, and submit action wired to create API
- Outgoing vouchers table: support for displaying and managing outgoing voucher rows in the form

## [0.4.0] - 2026-02-08

### Added
- Add Farmer modal: form with validation, quick-add farmer integration, account number and mobile deduplication from existing links
- Incoming form: farmer selector from farmer-storage links, Add Farmer modal integration, refetch farmers on add
- Spinner UI component for loading states
- Farmer types: `Farmer`, `FarmerStorageLink`, `QuickRegisterFarmerInput`, and related API response types
- Store admin hooks: `useGetAllFarmers`, `useGetVoucherNumber`, `useQuickAddFarmer`
- Incoming gate pass service module with `useGetIncomingGatePasses` and `useCreateIncomingGatePass` hooks

## [0.3.0] - 2026-02-08

### Added
- Daybook component with order list, filters (all/incoming/outgoing), sort (latest/oldest), search, pagination, and entry cards with pipeline progress
- UI components: Item (ItemHeader, ItemMedia, ItemTitle, ItemActions, ItemFooter), Pagination, Progress, Tabs
- Store admin authenticated routes: Incoming (`/store-admin/.../incoming`), Outgoing (`/store-admin/.../outgoing`), People (`/store-admin/.../people`)

## [0.2.1] - 2026-02-08

### Added
- Error page component for route errors
- Not found (404) component for unknown routes
- Empty UI component for empty states
- Root route error and not-found handling

### Fixed
- Store admin login with wrong credentials now shows backend error message (e.g. invalid credentials) via toast instead of redirecting to the not-found page. Axios interceptor no longer redirects on 401 when the request is the login request; session-expired 401s still redirect to `/store-admin/login`.

## [0.1.0] - 2026-01-27

### Added
- Initial project setup with React 19, TypeScript, and Vite
- TanStack Router integration for routing
- Tailwind CSS v4 for styling
- ESLint and Prettier configuration for code quality
- Husky pre-commit hooks with lint-staged
- Basic home page with welcome message
- TypeScript configuration for React and Node.js
- Development and build scripts

### Technical Details
- React 19.2.0
- TypeScript 5.9.3
- Vite with Rolldown (rolldown-vite@7.2.5)
- TanStack Router 1.157.16
- Tailwind CSS 4.1.18
- React Compiler enabled
