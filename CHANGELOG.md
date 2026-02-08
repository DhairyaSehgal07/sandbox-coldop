# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
