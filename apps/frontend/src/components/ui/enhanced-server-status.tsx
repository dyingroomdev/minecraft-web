import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notifications } from '@/lib/notifications';

interface ServerStatusProps {
  host: string;
  port: number;
  type: 'java' | 'bedrock';
}

interface ServerData {
  online: boolean;
  players: {
    online: number;
    max: number;
  };
  version: string;
  motd: string;
  ping: number;
}

export function EnhancedServerStatus({ host, port, type }: ServerStatusProps) {
  const [status, setStatus] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const serverAddress = `${host}:${port}`;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/status/${type}`);
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch server status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, [type]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(serverAddress);
      setCopied(true);
      notifications.success('Server address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      notifications.error('Failed to copy address');
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-32"></div>
          <div className="h-3 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {status?.online ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <WifiOff className="h-4 w-4 text-red-500" />
              <Badge variant="destructive">Offline</Badge>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={copyAddress}
          className="gap-2"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {serverAddress}
        </Button>
      </div>

      {status?.online && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {status.players.online}/{status.players.max} players
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{status.ping}ms</span>
          </div>
          
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Version</p>
            <p className="font-mono text-xs">{status.version}</p>
          </div>
          
          {status.motd && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">MOTD</p>
              <p className="text-xs">{status.motd}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}