import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function ControlPageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="control-page-header">
      <div>
        <div className="control-page-heading">{title}</div>
        {subtitle ? <div className="control-page-sub">{subtitle}</div> : null}
      </div>
      {actions ? <div className="control-page-header-actions">{actions}</div> : null}
    </div>
  );
}

export function ControlPanel({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`control-panel ${className}`}>
      {title || action ? (
        <div className="control-panel-header">
          <div className="control-panel-title">{icon}{title}</div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ControlStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === 'approved' || normalized === 'published' || normalized === 'active' || normalized === 'completed'
      ? 'approved'
      : normalized === 'rejected' || normalized === 'failed' || normalized === 'cancelled' || normalized === 'inactive'
        ? 'rejected'
        : normalized === 'live'
          ? 'live'
          : normalized === 'upcoming' || normalized === 'processing'
            ? 'info'
            : 'pending';

  return <span className={`control-status-badge ${tone}`}>{status}</span>;
}

export function ControlEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="control-empty-state">
      <div className="control-empty-state-icon">{icon}</div>
      <div>{text}</div>
    </div>
  );
}
