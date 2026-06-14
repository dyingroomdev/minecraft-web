import { Bell, RefreshCw, Search } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { AdminIcon, faTerminal } from '@/components/admin/AdminIcons';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';
import AdminSidebar from './AdminSidebar';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  payments: 'Payments',
  news: 'News',
  events: 'Events',
  rules: 'Rules',
  votes: 'Votes',
  features: 'Features',
  'hero-slides': 'Hero Slides',
  'contact-requests': 'Contact Requests',
  leaderboards: 'Leaderboards',
  ranks: 'Ranks',
  social: 'Social Links',
  brand: 'Brand Settings',
  seo: 'SEO Settings',
  diagnostics: 'Diagnostics',
  users: 'Admin Users',
  shop: 'Shop',
};

export default function AdminLayout() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: stats } = useDashboardStats();
  const { data: activity = [] } = useRecentActivity();
  const segment = location.pathname.split('/').filter(Boolean)[1] ?? 'dashboard';
  const pageLabel = PAGE_LABELS[segment] ?? 'Overview';
  const tickerItems = activity.length
    ? activity.map((item) => item.action)
    : ['Dashboard connected. Live activity will appear here as actions are recorded.'];
  const repeatedTicker = [...tickerItems, ...tickerItems];

  return (
    <div className="admin-control">
      <AdminSidebar />
      <div className="control-main-wrap">
        <header className="control-topbar">
          <div className="control-breadcrumb">
            <span>AmzCraft</span>
            <span className="sep">/</span>
            <span>{pageLabel}</span>
          </div>
          <div className="control-topbar-right">
            <div className="control-search-bar">
              <Search size={13} />
              <input aria-label="Search players and orders" placeholder="Search players, orders..." />
            </div>
            <div className="control-uptime-chip">
              <span className={`dot ${stats?.server_status === 'offline' ? 'offline' : ''}`} />
              Uptime: <span>{stats?.uptime ?? '--'}</span>
            </div>
            <button className="control-topbar-btn" aria-label="Notifications">
              <Bell size={14} />
            </button>
            <button
              className="control-topbar-btn"
              onClick={() => queryClient.invalidateQueries()}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </header>

        <div className="control-console-ticker">
          <div className="control-ticker-label">
            <span className="ticker-dot" />
            SERVER LOG
          </div>
          <div className="control-ticker-divider" />
          <div className="control-ticker-track">
            <div className="control-ticker-inner">
              {repeatedTicker.map((item, index) => (
                <span className="control-ticker-event" key={`${item}-${index}`}>
                  <span className="te-name"><AdminIcon icon={faTerminal} /></span> {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <main className="control-content-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
