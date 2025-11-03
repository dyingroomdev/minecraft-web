import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/news', label: 'News' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/rules', label: 'Rules' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/leaderboards', label: 'Leaderboards' },
  { to: '/admin/integrations', label: 'Integrations' },
  { to: '/admin/audit', label: 'Audit Logs' },
  { to: '/admin/social', label: 'Social Links' },
  { to: '/admin/content', label: 'Homepage Content' },
  { to: '/admin/media', label: 'Media Library' },
  { to: '/admin/diagnostics', label: 'Diagnostics' },
];

export function AdminLayout() {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Validating session…</div>;
  }

  if (!user) {
    return <Navigate to="/error/401" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/error/403" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-10 lg:px-8">
        <aside className="hidden w-64 flex-shrink-0 rounded-lg border border-border bg-card p-6 lg:block">
          <h2 className="mb-6 text-lg font-semibold">Admin Console</h2>
          <nav className="space-y-2">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted',
                    isActive ? 'bg-lime-500 text-forest-900' : 'text-muted-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
