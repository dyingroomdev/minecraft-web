import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Newspaper,
  Calendar,
  Scroll,
  Vote,
  Sparkles,
  Image,
  Trophy,
  Share2,
  Activity,
  Shield,
  LogOut,
  Palette,
  Search,
  ShoppingCart,
  Package,
  ShoppingBag,
  BarChart3,
  X,
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

const NAV_SECTIONS = [
  { 
    label: 'Dashboard', 
    items: [
      { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    ]
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
    ]
  },
  { 
    label: 'Shop', 
    items: [
      { name: 'Add Product', path: '/admin/shop/products/new', icon: Package },
      { name: 'Product List', path: '/admin/shop/products', icon: ShoppingBag },
      { name: 'Orders', path: '/admin/shop/orders', icon: ShoppingCart },
      { name: 'Sales Overview', path: '/admin/shop/overview', icon: BarChart3 },
    ]
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
    ]
  },
  { 
    label: 'Administration', 
    items: [
      { name: 'Admin Users', path: '/admin/users', icon: Shield, role: 'SUPER_ADMIN' },
    ]
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const { user, isSuper, logout } = useAdmin();

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-gray-600 h-screen flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:translate-x-0 md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand">AmzCraft Control</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden rounded-lg p-1 text-gray-400 hover:bg-surface2 hover:text-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-300 mt-0.5">{user?.email}</p>
        <span className="inline-block px-2 py-1 text-xs bg-brand/20 text-brand rounded mt-1">
          {user?.role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              {section.label}
            </h3>
            <ul className="space-y-1">
              {section.items
                .filter(item => !item.role || (item.role === 'SUPER_ADMIN' && isSuper))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-brand/20 text-brand border border-brand/30'
                              : 'text-gray-200 hover:bg-surface2 hover:text-accent'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </NavLink>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-600">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-200 hover:bg-surface2 hover:text-minecraft-red rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
