# Admin RBAC System

## Overview

The AMZCraft platform now includes a role-based access control (RBAC) system with two discrete admin roles:

- **ADMIN**: Can manage content (news, events, rules, payment approvals) but cannot modify system configs or sensitive settings
- **SUPER_ADMIN**: Full control over every admin-scope API and dashboard module

## Database Changes

### New Tables
- `admin_users`: Separate admin authentication with email/password
- Added `actor_role` column to `audit_logs` for tracking admin actions

### Migrations
Run the following migrations:
```bash
cd apps/api
alembic upgrade head
```

## Creating Admin Users

### Option 1: Using Management CLI (with virtual environment)
```bash
cd apps/api
# Activate virtual environment first
source .venv/bin/activate  # or activate your venv
python manage.py create-admin --email admin@amzcraft.xyz --role SUPER_ADMIN
```

### Option 2: Direct SQL (if CLI doesn't work)
```sql
-- Connect to your PostgreSQL database and run:
INSERT INTO admin_users (id, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@amzcraft.xyz',
    '$2b$12$LQv3c1yqBwEHxPuNUjNudOzoPQLjXvJkLadGsSDGdVeOHJmqiluDW',
    'SUPER_ADMIN',
    true,
    NOW(),
    NOW()
);
-- Default password: 'admin123'
```

## Access Matrix

| Feature / Endpoint | ADMIN | SUPER_ADMIN |
|-------------------|-------|-------------|
| News, Events, Rules CRUD | ✅ | ✅ |
| Payments (Approve/Reject) | ✅ | ✅ |
| Leaderboards Upload | ✅ | ✅ |
| Social Links Edit | ❌ | ✅ |
| Diagnostics, Retry Jobs | ❌ | ✅ |
| Admin User Management | ❌ | ✅ |
| Config, Secrets | ❌ | ✅ |

## API Endpoints

### Admin Authentication
- `POST /admin/auth/login` - Admin login with email/password
- `GET /admin/auth/me` - Get current admin profile

### Admin User Management (SUPER_ADMIN only)
- `GET /admin/users/` - List all admin users
- `POST /admin/users/` - Create new admin user
- `DELETE /admin/users/{user_id}` - Delete admin user

## Frontend Integration

### Admin Context
The frontend includes a separate `AdminContext` for admin authentication:

```tsx
import { useAdmin } from '@/contexts/AdminContext';

function MyComponent() {
  const { user, isSuper, login, logout } = useAdmin();
  
  if (isSuper) {
    // Show super admin features
  }
}
```

### Route Guards
Use `AdminRouteGuard` to protect admin routes:

```tsx
<AdminRouteGuard requiresSuper={true}>
  <SuperAdminComponent />
</AdminRouteGuard>
```

## Security Features

- Passwords hashed with bcrypt
- JWT tokens include role claims
- Role checks enforced at API layer
- Audit logs record actor_role for all admin actions
- Privilege escalation prevention (only via CLI or direct DB)

## Testing

Run the RBAC tests:
```bash
cd apps/api
pytest tests/test_admin_rbac.py -v
```