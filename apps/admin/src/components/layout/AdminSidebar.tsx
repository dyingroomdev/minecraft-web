import {
  Activity,
  BarChart3,
  Calendar,
  CreditCard,
  Image,
  LayoutDashboard,
  LogOut,
  Mail,
  Newspaper,
  Package,
  Palette,
  Scroll,
  Search,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trophy,
  UserRound,
  Vote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { useAdmin } from '@/contexts/AdminContext';
import { useDashboardStats } from '@/hooks/useDashboard';

type NavItem = {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: 'payments';
  role?: 'SUPER_ADMIN';
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Dashboard',
    items: [
      { name: 'Overview', path: '/admin', icon: LayoutDashboard },
      { name: 'Payments', path: '/admin/payments', icon: CreditCard, badge: 'payments' },
    ],
  },
  {
    label: 'Content Management',
    items: [
      { name: 'News', path: '/admin/news', icon: Newspaper },
      { name: 'Events', path: '/admin/events', icon: Calendar },
      { name: 'Rules', path: '/admin/rules', icon: Scroll },
      { name: 'Votes', path: '/admin/votes', icon: Vote },
      { name: 'Features', path: '/admin/features', icon: Sparkles },
      { name: 'Hero Slides', path: '/admin/hero-slides', icon: Image },
      { name: 'Contact Requests', path: '/admin/contact-requests', icon: Mail },
    ],
  },
  {
    label: 'Shop',
    items: [
      { name: 'Add Product', path: '/admin/shop/products/new', icon: Package },
      { name: 'Product List', path: '/admin/shop/products', icon: ShoppingBag },
      { name: 'Orders', path: '/admin/shop/orders', icon: ShoppingCart },
      { name: 'Sales Overview', path: '/admin/shop/overview', icon: BarChart3 },
    ],
  },
  {
    label: 'Systems',
    items: [
      { name: 'Ranks', path: '/admin/ranks', icon: Shield },
      { name: 'Leaderboards', path: '/admin/leaderboards', icon: Trophy },
      { name: 'Social Links', path: '/admin/social', icon: Share2 },
      { name: 'Brand Settings', path: '/admin/brand', icon: Palette },
      { name: 'SEO Settings', path: '/admin/seo', icon: Search },
      { name: 'Diagnostics', path: '/admin/diagnostics', icon: Activity },
    ],
  },
  {
    label: 'Administration',
    items: [{ name: 'Admin Users', path: '/admin/users', icon: UserRound, role: 'SUPER_ADMIN' }],
  },
];

export default function AdminSidebar() {
  const { user, isSuper, logout } = useAdmin();
  const { data: stats } = useDashboardStats();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'AC';

  return (
    <aside className="control-sidebar">
      <div className="control-sidebar-brand">
        <div className="control-brand-logo">
          Amz<span>Craft</span> Control
        </div>
        <div className="control-brand-user">
          <div className="control-brand-avatar">{initials}</div>
          <div className="control-brand-user-info">
            <div className="control-brand-user-name">
              {isSuper ? 'Super Administrator' : 'Administrator'}
            </div>
            <div className="control-brand-user-email">{user?.email}</div>
            <div className="control-role-chip">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      <nav className="control-sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="control-nav-group-label">{section.label}</div>
            {section.items
              .filter((item) => !item.role || (item.role === 'SUPER_ADMIN' && isSuper))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) => `control-nav-item${isActive ? ' active' : ''}`}
                  >
                    <Icon className="control-nav-icon" />
                    <span>{item.name}</span>
                    {item.badge === 'payments' && Boolean(stats?.pending_payments) && (
                      <span className="control-nav-badge warning">{stats?.pending_payments}</span>
                    )}
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="control-sidebar-footer">
        <button className="control-sign-out-btn" onClick={logout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
