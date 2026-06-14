import {
  CalendarPlus,
  CreditCard,
  Download,
  FilePlus2,
  Loader2,
  RefreshCw,
  UserCog,
  Wrench,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import {
  AdminIcon,
  faBan,
  faBolt,
  faCalendarDays,
  faCircleExclamation,
  faCoins,
  faGlobe,
  faMoneyBillTransfer,
  faNewspaper,
  faServer,
  faStar,
  faUser,
  faUsers,
} from '@/components/admin/AdminIcons';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';

const COLORS = {
  emerald: '#00e676',
  warning: '#ffa502',
  diamond: '#5de0f0',
  gold: '#ffd700',
  purple: '#a855f7',
  danger: '#ff4757',
};

function formatNumber(value = 0) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCurrency(value = 0) {
  return `৳${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;
}

function formatTimeAgo(timestamp: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function activityStyle(action: string) {
  const value = action.toLowerCase();
  if (value.includes('payment') || value.includes('order')) return { icon: faMoneyBillTransfer, tone: 'payment' };
  if (value.includes('news')) return { icon: faNewspaper, tone: 'news' };
  if (value.includes('event')) return { icon: faCalendarDays, tone: 'event' };
  if (value.includes('user') || value.includes('login')) return { icon: faUser, tone: 'user' };
  if (value.includes('reject') || value.includes('fail') || value.includes('ban')) return { icon: faCircleExclamation, tone: 'danger' };
  return { icon: faBolt, tone: 'warning' };
}

function KpiCard({
  label,
  value,
  icon,
  color,
  footer,
  valueClass = '',
}: {
  label: string;
  value: React.ReactNode;
  icon: IconDefinition;
  color: string;
  footer: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div
      className="control-kpi-card"
      style={{ '--kpi-color': color, '--kpi-bg': `${color}1a` } as React.CSSProperties}
    >
      <div className="control-kpi-header">
        <div className="control-kpi-label">{label}</div>
        <div className="control-kpi-icon"><AdminIcon icon={icon} /></div>
      </div>
      <div className={`control-kpi-value ${valueClass}`}>{value}</div>
      <div className="control-kpi-footer">{footer}</div>
    </div>
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();
  const {
    data: activity = [],
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useRecentActivity();

  if (statsLoading) {
    return (
      <div className="control-loading-state">
        <Loader2 className="animate-spin" />
        Loading dashboard data...
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="control-error-state">
        <p>Failed to load dashboard data.</p>
        <button className="control-btn control-btn-ghost" onClick={() => refetchStats()}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
  const maxRevenue = Math.max(...stats.revenue_last_7_days.map((day) => day.total), 1);
  const maxRank = Math.max(...stats.rank_distribution.map((rank) => rank.count), 1);

  const exportReport = () => {
    const report = JSON.stringify({ generated_at: new Date().toISOString(), ...stats }, null, 2);
    const url = URL.createObjectURL(new Blob([report], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `amzcraft-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="control-page">
      <div className="control-page-header">
        <div>
          <div className="control-page-heading">Dashboard Overview</div>
          <div className="control-page-sub">{dateLabel} · Live administration data</div>
        </div>
        <div className="control-page-header-actions">
          <button className="control-btn control-btn-ghost" onClick={exportReport}>
            <Download size={14} /> Export Report
          </button>
          <button className="control-btn control-btn-primary" onClick={() => navigate('/admin/shop/products/new')}>
            + Add Product
          </button>
        </div>
      </div>

      <div className="control-kpi-row">
        <KpiCard
          label="Server Status"
          value={<span className={`control-badge ${stats.server_status}`}>{stats.server_status}</span>}
          icon={faGlobe}
          color={stats.server_status === 'online' ? COLORS.emerald : COLORS.danger}
          valueClass="colored"
          footer={
            <>
              <span className="control-kpi-delta up">●</span>
              <span>{stats.players_online} / {stats.players_max || 0} players · {stats.server_version ?? 'Unknown version'}</span>
            </>
          }
        />
        <KpiCard
          label="Pending Payments"
          value={stats.pending_payments}
          icon={faMoneyBillTransfer}
          color={COLORS.warning}
          valueClass="colored"
          footer={<><span className="control-kpi-delta up">Live</span><span>awaiting review</span></>}
        />
        <KpiCard
          label="Total News Posts"
          value={stats.total_news}
          icon={faNewspaper}
          color={COLORS.diamond}
          footer={<><span className="control-kpi-delta neutral">All</span><span>published and draft posts</span></>}
        />
        <KpiCard
          label="Active Events"
          value={stats.total_events}
          icon={faCalendarDays}
          color={COLORS.gold}
          footer={<><span className="control-kpi-delta neutral">—</span><span>{stats.upcoming_events} upcoming</span></>}
        />
      </div>

      <div className="control-kpi-row">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={faCoins}
          color={COLORS.purple}
          valueClass="colored compact"
          footer={<><span className="control-kpi-delta up">Live</span><span>approved payments</span></>}
        />
        <KpiCard
          label="Registered Users"
          value={formatNumber(stats.total_users)}
          icon={faUsers}
          color={COLORS.emerald}
          footer={<><span className="control-kpi-delta up">Total</span><span>platform accounts</span></>}
        />
        <KpiCard
          label="Premium Members"
          value={formatNumber(stats.premium_members)}
          icon={faStar}
          color={COLORS.gold}
          valueClass="colored"
          footer={<><span className="control-kpi-delta up">Active</span><span>rank entitlements</span></>}
        />
        <KpiCard
          label="Rejected Payments"
          value={formatNumber(stats.rejected_payments)}
          icon={faBan}
          color={COLORS.danger}
          valueClass="colored"
          footer={<><span className="control-kpi-delta neutral">Total</span><span>verification rejected</span></>}
        />
      </div>

      <div className="control-grid-3-1">
        <section className="control-panel">
          <div className="control-panel-header">
            <div className="control-panel-title"><AdminIcon icon={faBolt} /> Recent Activity</div>
            {activityLoading ? <Loader2 size={14} className="animate-spin" /> : <span className="control-panel-action">Live audit log</span>}
          </div>
          <div className="control-activity-list">
            {activity.length ? activity.slice(0, 7).map((item) => {
              const style = activityStyle(item.action);
              return (
                <div className="control-activity-item" key={item.id}>
                  <div className={`control-activity-icon ${style.tone}`}><AdminIcon icon={style.icon} /></div>
                  <div className="control-activity-content">
                    <div className="control-activity-text">
                      <span className="actor">{item.user ?? 'Admin'}</span> {item.action}
                    </div>
                    <div className="control-activity-meta">{item.notes ?? 'Administrative activity'}</div>
                  </div>
                  <div className="control-activity-time">{formatTimeAgo(item.timestamp)}</div>
                </div>
              );
            }) : (
              <div className="control-empty">No audit activity has been recorded yet.</div>
            )}
          </div>
        </section>

        <section className="control-panel">
          <div className="control-panel-header">
            <div className="control-panel-title"><AdminIcon icon={faCoins} /> Payment Summary</div>
            <Link className="control-panel-action" to="/admin/payments">Manage →</Link>
          </div>
          <div className="control-payment-total-highlight">
            <div className="label">Approved Revenue</div>
            <div className="val">{formatCurrency(stats.total_revenue)}</div>
          </div>
          <div className="control-payment-rows">
            {[
              ['Total Orders', stats.total_payments, 'total'],
              ['Pending', stats.pending_payments, 'pending'],
              ['Approved', stats.approved_payments, 'approved'],
              ['Rejected', stats.rejected_payments, 'rejected'],
            ].map(([label, value, tone]) => (
              <div className="control-payment-row" key={label}>
                <div className="control-payment-row-label"><span className={`payment-dot ${tone}`} />{label}</div>
                <div className={`control-payment-row-value ${tone}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="control-chart-block">
            <div className="control-chart-label">Revenue · Last 7 days</div>
            <div className="control-sparkline">
              {stats.revenue_last_7_days.map((day) => (
                <div
                  key={day.date}
                  className="control-sparkline-bar"
                  title={`${day.date}: ${formatCurrency(day.total)}`}
                  style={{ height: `${Math.max(6, (day.total / maxRevenue) * 100)}%` }}
                />
              ))}
            </div>
            <div className="control-chart-days">
              {stats.revenue_last_7_days.map((day) => (
                <span key={day.date}>{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="control-grid-3">
        <section className="control-panel">
          <div className="control-panel-header"><div className="control-panel-title"><AdminIcon icon={faBolt} /> Quick Actions</div></div>
          <div className="control-panel-body">
            {[
              { icon: CreditCard, name: 'Review Pending Payments', desc: `${stats.pending_payments} transactions awaiting approval`, path: '/admin/payments', primary: true },
              { icon: FilePlus2, name: 'Create News Post', desc: 'Announce updates to players', path: '/admin/news' },
              { icon: CalendarPlus, name: 'Manage Events', desc: `${stats.total_events} active · ${stats.upcoming_events} upcoming`, path: '/admin/events' },
              { icon: UserCog, name: 'Admin Users', desc: 'Manage staff permissions', path: '/admin/users' },
              { icon: Wrench, name: 'Run Diagnostics', desc: 'Check services and integrations', path: '/admin/diagnostics' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link className={`control-quick-action${action.primary ? ' primary' : ''}`} to={action.path} key={action.name}>
                  <span className="qa-icon"><Icon size={16} /></span>
                  <span className="qa-text"><strong>{action.name}</strong><small>{action.desc}</small></span>
                  <span className="qa-arrow">→</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="control-panel">
          <div className="control-panel-header">
            <div className="control-panel-title"><AdminIcon icon={faServer} /> System Health</div>
            <Link className="control-panel-action" to="/admin/diagnostics">Details</Link>
          </div>
          {[
            ['Server Status', <span className={`control-badge ${stats.server_status}`}>{stats.server_status}</span>],
            ['Players Online', `${stats.players_online} / ${stats.players_max || 0}`],
            ['Server Version', stats.server_version ?? 'Unknown'],
            ['Registered Users', formatNumber(stats.total_users)],
            ['Active Members', formatNumber(stats.premium_members)],
            ['API Uptime', stats.uptime],
          ].map(([label, value]) => (
            <div className="control-health-row" key={String(label)}>
              <div className="control-health-label">{label}</div>
              <div className="control-health-value">{value}</div>
            </div>
          ))}
          <button className="control-health-refresh" onClick={() => { refetchStats(); refetchActivity(); }}>
            <RefreshCw size={13} /> Refresh live metrics
          </button>
        </section>

        <section className="control-panel">
          <div className="control-panel-header">
            <div className="control-panel-title"><AdminIcon icon={faStar} /> Active Rank Distribution</div>
            <span className="control-panel-muted">{stats.premium_members} active</span>
          </div>
          <div className="control-rank-list">
            {stats.rank_distribution.length ? stats.rank_distribution.map((rank) => (
              <div className="control-rank-row" key={rank.name}>
                <div className="control-rank-name">{rank.name}</div>
                <div className="control-rank-bar"><span style={{ width: `${(rank.count / maxRank) * 100}%` }} /></div>
                <div className="control-rank-count">{rank.count}</div>
              </div>
            )) : <div className="control-empty">No active rank entitlements.</div>}
          </div>
          <div className="control-rank-summary">
            {stats.rank_distribution.slice(0, 3).map((rank, index) => (
              <div key={rank.name}>
                <strong style={{ color: [COLORS.emerald, COLORS.gold, COLORS.diamond][index] }}>{rank.count}</strong>
                <span>{rank.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
