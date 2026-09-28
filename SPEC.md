# SPEC: Auth Flow & Database Schema - HRIS Cuti

## Goal
Implement complete authentication system with JWT for 3 roles: Staff, Manager, HR.

## Stack
- React 18 + TypeScript + Vite
- React Router v6 (routing)
- TanStack Query v5 (server state)
- Zustand (client auth state)
- jsonwebtoken (JWT)
- ESLint + TypeScript strict

## Features Required

### 1. Database Schema (SQL for reference - implement as types + mock service)
```sql
users:
- id: UUID (PK)
- email: string (unique)
- password_hash: string
- full_name: string
- role: enum('STAFF', 'MANAGER', 'HR')
- department_id: UUID (FK, nullable)
- created_at: timestamp
- updated_at: timestamp

departments:
- id: UUID (PK)
- name: string
- manager_id: UUID (FK to users, nullable)

leave_requests:
- id: UUID (PK)
- user_id: UUID (FK)
- type: enum('ANNUAL', 'SICK', 'PERSONAL', 'OTHER')
- start_date: date
- end_date: date
- reason: text
- status: enum('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
- approved_by: UUID (FK, nullable)
- approved_at: timestamp (nullable)
- created_at: timestamp
```

### 2. Auth Pages
- `/login` — email + password, redirect based on role
- `/register` — HR only (create Staff/Manager), protected

### 3. JWT Implementation
- Access token: 15min expiry
- Refresh token: 7 days, httpOnly cookie
- Payload: `{ sub: userId, email, role, deptId }`
- Middleware: `requireAuth`, `requireRole('HR' | 'MANAGER' | 'STAFF')`

### 4. Protected Routes by Role
| Route | STAFF | MANAGER | HR |
|-------|-------|---------|-----|
| /dashboard | ✅ | ✅ | ✅ |
| /leave/request | ✅ | ✅ | ✅ |
| /leave/approval | ❌ | ✅ (own dept) | ✅ (all) |
| /users | ❌ | ❌ | ✅ |
| /departments | ❌ | ✅ (read) | ✅ (CRUD) |
| /settings | ❌ | ❌ | ✅ |

### 5. API Service Layer (mock for now)
- `authApi.login(email, password)` → `{ user, accessToken, refreshToken }`
- `authApi.register(data)` → `{ user }` (HR only)
- `authApi.refresh()` → `{ accessToken }`
- `authApi.me()` → `{ user }`
- `leaveApi.list(params)` → paginated
- `leaveApi.create(data)` → leave request
- `leaveApi.approve(id, status)` → Manager/HR

### 6. Components
- `AuthProvider` (Zustand + React Query)
- `PrivateRoute` + `RoleRoute` wrappers
- `LoginForm` / `RegisterForm` with validation
- Role-based sidebar navigation

## Acceptance Criteria
- [ ] Login works, JWT stored, redirect to role dashboard
- [ ] Refresh token works (silent refresh on 401)
- [ ] Role guards block unauthorized routes
- [ ] Register only accessible by HR
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Build succeeds (`npm run build`)

## File Structure Target
```
src/
├── types/
│   ├── auth.ts          # User, Role, Token types
│   └── leave.ts         # LeaveRequest, LeaveType
├── services/
│   ├── api.ts           # Axios/Fetch wrapper + interceptors
│   ├── auth.ts          # login, register, refresh, me
│   └── leave.ts         # leave CRUD
├── store/
│   └── authStore.ts     # Zustand: user, tokens, actions
├── hooks/
│   ├── useAuth.ts       # Auth state + actions
│   └── useLeave.ts      # TanStack Query hooks
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── guards/
│       ├── PrivateRoute.tsx
│       └── RoleRoute.tsx
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── LeaveRequest.tsx
│   ├── LeaveApproval.tsx
│   ├── Users.tsx
│   └── Settings.tsx
├── utils/
│   ├── jwt.ts           # decode, validate
│   └── roles.ts         # role helpers
└── routes/
    └── router.tsx       # React Router config
```

## Notes for Agent
- Mock API with in-memory data + localStorage persistence for demo
- Use `msw` (Mock Service Worker) for realistic API simulation if time permits
- Focus on type safety: no `any`, strict null checks
- Commit message format: `feat(auth): implement login/register with JWT`
- Branch: `feat/auth-flow`