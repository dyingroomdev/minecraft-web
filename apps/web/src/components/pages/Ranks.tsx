import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Crown, Star, Zap, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiClient } from '../../lib/api';

const rankIcons = {
  vip: Star,
  premium: Zap,
  legend: Crown,
};

export function Ranks() {
  const { data: ranks, isLoading } = useQuery({
    queryKey: ['rank-products'],
    queryFn: () => apiClient.getRankProducts(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading ranks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Premium Ranks</h1>
        <p className="text-muted-foreground text-lg">
          Unlock exclusive features and support the server
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {ranks?.map((rank) => {
          const Icon = rankIcons[rank.rank_code as keyof typeof rankIcons] || Star;
          
          return (
            <Card key={rank.id} className="relative">
              <CardHeader className="text-center">
                <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">{rank.display_name}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  ৳{rank.price_bdt}
                </div>
                {rank.duration_days && (
                  <Badge variant="secondary" className="w-fit mx-auto">
                    <Clock className="h-3 w-3 mr-1" />
                    {rank.duration_days} days
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="text-center">
                {rank.description && (
                  <CardDescription className="mb-6">
                    {rank.description}
                  </CardDescription>
                )}
                
                <Link to={`/ranks/buy/${rank.rank_code}`}>
                  <Button className="w-full" size="lg">
                    Purchase Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}