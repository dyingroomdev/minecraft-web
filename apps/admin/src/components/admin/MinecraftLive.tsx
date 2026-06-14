import { Copy, Users, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MinecraftData {
  online: boolean;
  player_count: number;
  motd: string;
  version: string;
  java_ip: string;
  bedrock_ip: string;
  last_poll_utc: string;
  ws_clients: number;
}

interface MinecraftLiveProps {
  data: MinecraftData;
}

export default function MinecraftLive({ data }: MinecraftLiveProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${data.online ? 'bg-brand animate-pulse' : 'bg-minecraft-red'}`} />
          <span className={`font-semibold ${data.online ? 'text-brand' : 'text-minecraft-red'}`}>
            {data.online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span className="font-mono">{data.player_count}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Server className="w-4 h-4" />
            <span className="font-mono">{data.ws_clients} WS</span>
          </div>
        </div>
      </div>

      {/* MOTD */}
      <div className="p-3 bg-surface2/50 rounded-lg">
        <p className="text-xs text-gray-300 mb-1">Message of the Day</p>
        <p className="font-mono text-sm text-gray-100">{data.motd}</p>
      </div>

      {/* Server Info */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between p-3 bg-surface2/50 rounded-lg">
          <div>
            <p className="text-xs text-gray-300">Java Edition</p>
            <p className="font-mono text-sm text-gray-100">{data.java_ip}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(data.java_ip)}
            className="border-gray-500 text-gray-200 hover:bg-surface2"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-surface2/50 rounded-lg">
          <div>
            <p className="text-xs text-gray-300">Bedrock Edition</p>
            <p className="font-mono text-sm text-gray-100">{data.bedrock_ip}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(data.bedrock_ip)}
            className="border-gray-500 text-gray-200 hover:bg-surface2"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Version & Last Poll */}
      <div className="flex justify-between text-xs text-gray-300">
        <span>Version: {data.version}</span>
        <span>Last poll: {new Date(data.last_poll_utc).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}