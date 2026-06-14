import { useQuery } from '@tanstack/react-query';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Loader2, RefreshCw } from 'lucide-react';

import {
  AdminIcon,
  faBell,
  faBolt,
  faCheck,
  faDatabase,
  faGamepad,
  faGaugeHigh,
  faGlobe,
  faServer,
  faTerminal,
} from '@/components/admin/AdminIcons';
import { ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { apiClient } from '@/lib/api';

type HealthCheck = { ok: boolean; latency_ms: number };
type DiagnosticsResponse = {
  service: { status: string; version: string; build_sha: string; uptime_sec: number; time_utc: string };
  checks: Record<string, HealthCheck>;
  minecraft: {
    online: boolean;
    player_count: number;
    max_players?: number;
    motd: string;
    version: string;
    java_ip: string;
    bedrock_ip: string;
    last_poll_utc: string;
    source?: string;
  };
  ops: {
    payments_pending: number;
    payments_failed_24h: number;
    fulfillment_dlq: number;
    last_expiry_job_utc: string;
    audit_events_1h: number;
  };
};

const CHECK_LABELS: Record<string, { icon: IconDefinition; label: string }> = {
  db: { icon: faDatabase, label: 'Database' },
  redis: { icon: faBolt, label: 'Redis Cache' },
  rcon: { icon: faGamepad, label: 'Minecraft RCON' },
  discord_webhook: { icon: faBell, label: 'Discord Integration' },
  http_health: { icon: faGlobe, label: 'API Health' },
};

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days ? `${days}d ` : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function AdminDiagnostics() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<DiagnosticsResponse>({
    queryKey: ['admin-diagnostics'],
    queryFn: () => apiClient.getDiagnostics(),
    refetchInterval: 60_000,
  });

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Diagnostics"
        subtitle="Server health and system checks"
        actions={
          <button className="control-btn control-btn-ghost" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Re-run All
          </button>
        }
      />
      {isLoading ? <div className="control-loading-state"><Loader2 className="animate-spin" /> Running diagnostics...</div> : null}
      {error || (!data && !isLoading) ? <div className="control-error-state">Failed to load diagnostics. Check the API and admin session.</div> : null}
      {data ? (
        <div className="control-grid-2">
          <ControlPanel title="System Metrics" icon={<AdminIcon icon={faServer} />}>
            {[
              ['API Service', <ControlStatusBadge status={data.service.status === 'ok' ? 'Online' : 'Degraded'} />],
              ['API Version', data.service.version],
              ['Build', data.service.build_sha],
              ['API Uptime', formatUptime(data.service.uptime_sec)],
              ['Game Server', <ControlStatusBadge status={data.minecraft.online ? 'Online' : 'Offline'} />],
              ['Online Players', `${data.minecraft.player_count} / ${data.minecraft.max_players ?? 0}`],
              ['Minecraft Version', data.minecraft.version || 'Unknown'],
              ['Last Status Poll', new Date(data.minecraft.last_poll_utc).toLocaleString()],
            ].map(([label, value]) => (
              <div className="control-health-row" key={String(label)}>
                <div className="control-health-label">{label}</div>
                <div className="control-health-value">{value}</div>
              </div>
            ))}
          </ControlPanel>

          <ControlPanel
            title="Service Checks"
            icon={<AdminIcon icon={faCheck} />}
            action={<span className="control-panel-action">{Object.values(data.checks).every((check) => check.ok) ? 'All systems go' : 'Attention required'}</span>}
          >
            <div className="control-service-checks">
              {Object.entries(data.checks).map(([key, check]) => {
                const details = CHECK_LABELS[key] ?? { icon: faTerminal, label: key };
                return (
                  <div className={`control-service-check ${check.ok ? 'healthy' : 'failed'}`} key={key}>
                    <span><AdminIcon icon={details.icon} /> {details.label}</span>
                    <span className="control-check-meta">{check.latency_ms.toFixed(2)}ms</span>
                    <ControlStatusBadge status={check.ok ? 'Online' : 'Failed'} />
                  </div>
                );
              })}
              <div className={`control-service-check ${data.minecraft.online ? 'healthy' : 'failed'}`}>
                <span><AdminIcon icon={faGlobe} /> Game Server</span>
                <span className="control-check-meta">{data.minecraft.source ?? 'status poller'}</span>
                <ControlStatusBadge status={data.minecraft.online ? 'Online' : 'Offline'} />
              </div>
            </div>
          </ControlPanel>

          <ControlPanel title="Minecraft Gateways" icon={<AdminIcon icon={faGamepad} />}>
            <div className="control-health-row"><div className="control-health-label">Java</div><div className="control-health-value">{data.minecraft.java_ip}</div></div>
            <div className="control-health-row"><div className="control-health-label">Bedrock</div><div className="control-health-value">{data.minecraft.bedrock_ip}</div></div>
            <div className="control-health-row"><div className="control-health-label">MOTD</div><div className="control-health-value">{data.minecraft.motd || 'Unavailable'}</div></div>
          </ControlPanel>

          <ControlPanel title="Operations" icon={<AdminIcon icon={faGaugeHigh} />}>
            <div className="control-health-row"><div className="control-health-label">Pending Payments</div><div className="control-health-value">{data.ops.payments_pending}</div></div>
            <div className="control-health-row"><div className="control-health-label">Failed Payments · 24h</div><div className="control-health-value">{data.ops.payments_failed_24h}</div></div>
            <div className="control-health-row"><div className="control-health-label">Fulfillment Queue Errors</div><div className="control-health-value">{data.ops.fulfillment_dlq}</div></div>
            <div className="control-health-row"><div className="control-health-label">Audit Events · 1h</div><div className="control-health-value">{data.ops.audit_events_1h}</div></div>
            <div className="control-health-row"><div className="control-health-label">Last Expiry Job</div><div className="control-health-value">{new Date(data.ops.last_expiry_job_utc).toLocaleString()}</div></div>
          </ControlPanel>
        </div>
      ) : null}
    </div>
  );
}
