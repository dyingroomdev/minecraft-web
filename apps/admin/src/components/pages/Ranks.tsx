import { useQuery } from '@tanstack/react-query';
import { Crown, Star, Zap, Shield, Diamond, Gem } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const rankIcons = {
  member: Star,
  vip: Zap,
  vipplus: Diamond,
  mvp: Gem,
  mvpplus: Crown,
  elite: Shield,
  eliteplus: Crown,
  donator: Star,
  helper: Shield,
  mod: Shield,
  admin: Crown,
  owner: Crown,
};

interface Rank {
  id: string;
  name: string;
  display_name: string;
  priority: number;
  benefits: string; // Changed from string[] to string for rich text
  description: string;
  color: string;
  icon: string;
  image_url: string;
}

export function Ranks() {
  const { data: ranks, isLoading } = useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const response = await fetch(`${window.location.origin.replace(':5173', ':8001')}/api/ranks`);
      if (!response.ok) throw new Error('Failed to fetch ranks');
      return response.json() as Promise<Rank[]>;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="h-10 bg-muted rounded w-64 mx-auto mb-4"></div>
          <div className="h-6 bg-muted rounded w-96 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="text-center">
                <div className="h-12 w-12 bg-muted rounded mx-auto mb-4"></div>
                <div className="h-6 bg-muted rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-muted rounded w-20 mx-auto"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Server Ranks</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover the different ranks available on AmzCraft and their unique benefits. 
          Ranks are earned through gameplay, achievements, or special contributions to the community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {ranks?.map((rank) => {
          const Icon = rankIcons[rank.name.toLowerCase() as keyof typeof rankIcons] || Star;
          
          return (
            <Card 
              key={rank.id} 
              className="relative hover:shadow-lg transition-shadow border-2"
              style={{ borderColor: rank.color + '40' }}
            >
              <CardHeader className="text-center">
                <div className="relative">
                  <img 
                    src={rank.image_url} 
                    alt={rank.display_name}
                    className="h-16 w-16 mx-auto mb-4 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Icon 
                    className="h-16 w-16 mx-auto mb-4 hidden" 
                    style={{ color: rank.color }}
                  />
                </div>
                <CardTitle 
                  className="text-2xl" 
                  style={{ color: rank.color }}
                >
                  {rank.display_name}
                </CardTitle>
                <Badge 
                  variant="secondary" 
                  className="w-fit mx-auto"
                  style={{ backgroundColor: rank.color + '20', color: rank.color }}
                >
                  Priority: {rank.priority}
                </Badge>
              </CardHeader>
              
              <CardContent>
                {rank.description && (
                  <CardDescription className="mb-4 text-center">
                    {rank.description}
                  </CardDescription>
                )}
                
                {rank.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-center">Benefits & Perks</h4>
                    <div 
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: rank.benefits }}
                    />
                  </div>
                )}
                
                <div className="mt-6 p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">
                    This rank is earned through gameplay and community participation
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-16 text-center">
        <div className="bg-card border rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">How to Earn Ranks</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Active Participation
              </h3>
              <p className="text-sm text-muted-foreground">
                Play regularly, participate in events, and contribute to the community
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Special Contributions
              </h3>
              <p className="text-sm text-muted-foreground">
                Help other players, create content, or support server development
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
