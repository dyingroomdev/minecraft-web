import { useQuery } from '@tanstack/react-query';
import { Copy, Server, Users, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import { apiClient } from '../../../lib/api';
import { useEffect, useState } from 'react';

export function ServerOverview() {
  const [wsStatus, setWsStatus] = useState<any>(null);

  const { data: serverStatus } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => apiClient.getServerStatus(),
    refetchInterval: 30000, // Fallback polling
  });

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/status`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'server_status') {
        setWsStatus(data.data);
      }
    };

    return () => ws.close();
  }, []);

  const status = wsStatus || serverStatus;
  const isOnline = status?.status === 'online';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section className="container mx-auto px-4">
      <div className="bg-card rounded-lg p-8 border">
        <h2 className="text-3xl font-bold mb-6 text-center">Server Status</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-lime-500' : 'bg-red-500'}`} />
              <span className="text-lg font-semibold">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {isOnline && (
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{status.players_online}/{status.players_max} players</span>
              </div>
            )}
            
            {status?.motd && (
              <div className="flex items-center space-x-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{status.motd}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Version: {status?.metadata?.version || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Java Edition</label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="bg-muted px-3 py-2 rounded text-sm flex-1">
                  play.amzcraft.xyz
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('play.amzcraft.xyz')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bedrock Edition</label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="bg-muted px-3 py-2 rounded text-sm flex-1">
                  bedrock.amzcraft.xyz:25562
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('bedrock.amzcraft.xyz:25562')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Location: Singapore</p>
              <p>Uptime: 99.9%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}