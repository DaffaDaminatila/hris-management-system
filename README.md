# HRIS Cuti — Leave Management System

Sistem informasi pengelolaan cuti karyawan dengan manajemen kuota otomatis, notifikasi, dan kontrol akses berbasis peran (STAFF, MANAGER, HR).

## Features

- **Authentication** — JWT (Web Crypto HMAC-SHA256), 3 roles, persistent sessions, role-based route guards
- **Leave Management** — Request, approve/reject, cancel with real-time quota validation
- **Quota System** — Annual (12), Sick (10), Personal (3) days/year; auto-deduct on approval, restore on reject/cancel
- **Notifications** — In-app notifications + mock email service with HTML templates
- **Testing** — 66 E2E (Playwright) + 75 unit tests (Vitest), all passing
- **Design** — CSS design tokens, dark mode, responsive, accessible

## Stack

React 19 · TypeScript · Vite · React Router · TanStack Query · Zustand · Playwright · Vitest · GitHub Actions

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run test:e2e   # E2E tests
npm run build      # production build
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| HR | hr@company.com | password |
| Manager | manager@company.com | password |
| Staff | staff@company.com | password |

## Notes

Frontend + mock services (localStorage). Production use requires a backend API, database, and SMTP integration.

## License

MIT
