import { RefreshCw, Trash2, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoleGate from '@/components/RoleGate';

interface DiagnosticsHeaderProps {
  updatedAt?: string;
  onRefresh: () => void;
  onFlushCache: () => void;
  onRconPing: () => void;
  onRetryStuck: () => void;
  refreshing?: boolean;
}

export default function DiagnosticsHeader({
  updatedAt,
  onRefresh,
  onFlushCache,
  onRconPing,
  onRetryStuck,
  refreshing = false
}: DiagnosticsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-on">System Diagnostics</h1>
        {updatedAt && (
          <p className="text-sm text-gray-300 mt-1">
            Last updated: {new Date(updatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          variant="outline"
          className="border-gray-500 text-gray-200 hover:bg-surface2"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <RoleGate role="SUPER_ADMIN">
          <Button
            onClick={onFlushCache}
            variant="outline"
            className="border-gray-500 text-gray-200 hover:border-accent hover:bg-surface2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Flush Cache
          </Button>
        </RoleGate>
        
        <RoleGate role="SUPER_ADMIN">
          <Button
            onClick={onRconPing}
            variant="outline"
            className="border-gray-500 text-gray-200 hover:border-minecraft-blue hover:bg-surface2"
          >
            <Zap className="w-4 h-4 mr-2" />
            RCON Ping
          </Button>
        </RoleGate>
        
        <RoleGate role="SUPER_ADMIN">
          <Button
            onClick={onRetryStuck}
            variant="outline"
            className="border-gray-500 text-gray-200 hover:border-minecraft-red hover:bg-surface2"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Retry Stuck
          </Button>
        </RoleGate>
      </div>
    </div>
  );
}