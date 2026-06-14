import { useState } from 'react';
import { Search, User, Trophy, Calendar, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Player {
  id: string;
  username: string;
  rank: string;
  joinDate: string;
  lastSeen: string;
  playtime: number;
  achievements: number;
  avatar?: string;
}

export function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const searchPlayers = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.players || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlaytime = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
            className="pl-10"
          />
        </div>
        <Button onClick={searchPlayers} disabled={loading || !query.trim()}>
          Search
        </Button>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((player) => (
            <Card 
              key={player.id} 
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.username} className="rounded-full" />
                  ) : (
                    player.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{player.username}</h3>
                  <Badge variant="secondary">{player.rank}</Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(player.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-3 w-3" />
                  <span>{player.achievements} achievements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  <span>{formatPlaytime(player.playtime)} played</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedPlayer && (
        <PlayerProfile 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
        />
      )}
    </div>
  );
}

interface PlayerProfileProps {
  player: Player;
  onClose: () => void;
}

function PlayerProfile({ player, onClose }: PlayerProfileProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Player Profile</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {player.avatar ? (
                <img src={player.avatar} alt={player.username} className="rounded-full" />
              ) : (
                player.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{player.username}</h3>
              <Badge variant="secondary" className="mt-1">{player.rank}</Badge>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold">Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Playtime:</span>
                  <span>{formatPlaytime(player.playtime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Achievements:</span>
                  <span>{player.achievements}</span>
                </div>
                <div className="flex justify-between">
                  <span>Join Date:</span>
                  <span>{new Date(player.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Seen:</span>
                  <span>{new Date(player.lastSeen).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Recent Activity</h4>
              <div className="text-sm text-muted-foreground">
                Activity data will be displayed here when available.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}