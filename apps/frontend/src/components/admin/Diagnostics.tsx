import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Database, Zap, Server, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiClient } from '../../lib/api';

export function Diagnostics() {
  const { data: diagnostics, isLoading, refetch } = useQuery({
    queryKey: ['admin-diagnostics'],
    queryFn: () => apiClient.request('/admin/diagnostics'),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  if (isLoading) {
    return <div>Loading diagnostics...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'unhealthy': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'degraded': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Monitor system health and connectivity
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {getStatusIcon(diagnostics?.overall_status)}
              <span className="ml-2">Overall System Status</span>
            </CardTitle>
            <Badge 
              variant={diagnostics?.overall_status === 'healthy' ? 'default' : 'destructive'}
            >
              {diagnostics?.overall_status?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database
            </CardTitle>
            <CardDescription>PostgreSQL connectivity and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={getStatusColor(diagnostics?.database?.status)}>
                {diagnostics?.database?.status}
              </span>
            </div>
            {diagnostics?.database?.response_time_ms && (
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span>{diagnostics.database.response_time_ms}ms</span>
              </div>
            )}
            {diagnostics?.database?.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {diagnostics.database.error}
              </div>
            )}
            {diagnostics?.database?.top_tables && (
              <div className="text-xs">
                <div className="font-medium mb-1">Top Tables:</div>
                {diagnostics.database.top_tables.slice(0, 3).map((table: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{table.table}</span>
                    <span>{table.operations}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Redis
            </CardTitle>
            <CardDescription>Cache and queue connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={getStatusColor(diagnostics?.redis?.status)}>
                {diagnostics?.redis?.status}
              </span>
            </div>
            {diagnostics?.redis?.response_time_ms && (
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span>{diagnostics.redis.response_time_ms}ms</span>
              </div>
            )}
            {diagnostics?.redis?.memory_used && (
              <div className="flex items-center justify-between">
                <span>Memory Used</span>
                <span>{diagnostics.redis.memory_used}</span>
              </div>
            )}
            {diagnostics?.redis?.connected_clients !== undefined && (
              <div className="flex items-center justify-between">
                <span>Clients</span>
                <span>{diagnostics.redis.connected_clients}</span>
              </div>
            )}
            {diagnostics?.redis?.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {diagnostics.redis.error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RCON */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              RCON
            </CardTitle>
            <CardDescription>Minecraft server connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={getStatusColor(diagnostics?.rcon?.status)}>
                {diagnostics?.rcon?.status}
              </span>
            </div>
            {diagnostics?.rcon?.response_time_ms && (
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span>{diagnostics.rcon.response_time_ms}ms</span>
              </div>
            )}
            {diagnostics?.rcon?.server_response && (
              <div className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-medium mb-1">Server Response:</div>
                <code className="text-xs">{diagnostics.rcon.server_response}</code>
              </div>
            )}
            {diagnostics?.rcon?.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {diagnostics.rcon.error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timestamp */}
      {diagnostics?.timestamp && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {new Date(diagnostics.timestamp * 1000).toLocaleString()}
        </div>
      )}
    </div>
  );
}