import { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DiagnosticsHeader from '@/components/admin/DiagnosticsHeader';
import KpiTile from '@/components/admin/KpiTile';
import HealthList from '@/components/admin/HealthList';
import MinecraftLive from '@/components/admin/MinecraftLive';
import { useAdmin } from '@/contexts/AdminContext';

interface DiagnosticsData {
  service: {
    status: string;
    version: string;
    build_sha: string;
    uptime_sec: number;
    time_utc: string;
  };
  checks: {
    db: { ok: boolean; latency_ms: number };
    redis: { ok: boolean; latency_ms: number };
    rcon: { ok: boolean; latency_ms: number };
    discord_webhook: { ok: boolean; latency_ms: number };
    http_health: { ok: boolean; latency_ms: number };
  };
  minecraft: {
    online: boolean;
    player_count: number;
    motd: string;
    version: string;
    java_ip: string;
    bedrock_ip: string;
    last_poll_utc: string;
    ws_clients: number;
  };
  ops: {
    payments_pending: number;
    payments_failed_24h: number;
    fulfillment_dlq: number;
    last_expiry_job_utc: string;
    audit_events_1h: number;
  };
}

export default function AdminDiagnostics() {
  const { isSuper } = useAdmin();
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiagnostics = useCallback(async (noCache = false) => {
    try {
      const token = localStorage.getItem('admin_token');
      const url = `http://localhost:8001/admin/diagnostics/${noCache ? '?no_cache=1' : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const diagnostics = await response.json();
        setData(diagnostics);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(() => fetchDiagnostics(), 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchDiagnostics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDiagnostics(true);
  };

  const handleAction = async (endpoint: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/diagnostics/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // TODO: Show success toast
        fetchDiagnostics(true);
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      // TODO: Show error toast
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-surface/80 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 bg-surface/80 border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
        <p className="text-gray-400">Failed to load diagnostics data.</p>
      </div>
    );
  }

  const healthItems = Object.entries(data.checks).map(([name, check]) => ({
    name,
    ok: check.ok,
    latency_ms: check.latency_ms
  }));

  return (
    <div className="space-y-6">
      <DiagnosticsHeader
        updatedAt={data.service.time_utc}
        onRefresh={handleRefresh}
        onFlushCache={() => handleAction('cache/flush', 'flush cache')}
        onRconPing={() => handleAction('rcon/ping', 'ping RCON')}
        onRetryStuck={() => handleAction('retry-stuck', 'retry stuck fulfillments')}
        refreshing={refreshing}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiTile
          label="Service Status"
          value={data.service.status === 'ok' ? 'OK' : 'Degraded'}
          status={data.service.status === 'ok' ? 'ok' : 'warn'}
        />
        <KpiTile
          label="Uptime"
          value={formatUptime(data.service.uptime_sec)}
          status="ok"
        />
        <KpiTile
          label="DB Latency"
          value={data.checks.db.latency_ms}
          suffix="ms"
          status={data.checks.db.ok ? 'ok' : 'err'}
        />
        <KpiTile
          label="Redis Latency"
          value={data.checks.redis.latency_ms}
          suffix="ms"
          status={data.checks.redis.ok ? 'ok' : 'err'}
        />
        <KpiTile
          label="Pending Payments"
          value={data.ops.payments_pending}
          status={data.ops.payments_pending > 10 ? 'warn' : 'ok'}
        />
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minecraft Live */}
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border-gray-700 shadow-card rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-4">Minecraft Live</h3>
          <MinecraftLive data={data.minecraft} />
        </Card>

        {/* Subsystem Health */}
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border-gray-700 shadow-card rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-4">Subsystem Health</h3>
          <HealthList items={healthItems} />
        </Card>

        {/* Operational KPIs */}
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border-gray-700 shadow-card rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-4">Operational KPIs</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Payments Failed (24h)</span>
              <span className="font-mono text-red-400">{data.ops.payments_failed_24h}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Fulfillment DLQ</span>
              <span className="font-mono text-gray-300">{data.ops.fulfillment_dlq}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Audit Events (1h)</span>
              <span className="font-mono text-brand">{data.ops.audit_events_1h}</span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400">Last Expiry Job</p>
              <p className="font-mono text-sm text-gray-300">
                {new Date(data.ops.last_expiry_job_utc).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions & Logs */}
        <Card className="p-6 bg-surface/80 backdrop-blur-sm border-gray-700 shadow-card rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-4">Actions & Logs</h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              <p>Version: {data.service.version}</p>
              <p>Build: {data.service.build_sha}</p>
            </div>
            
            <Button
              onClick={() => window.open('/admin/audit/export?limit=1000', '_blank')}
              variant="outline"
              className="w-full border-gray-600 hover:border-brand"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Audit CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}