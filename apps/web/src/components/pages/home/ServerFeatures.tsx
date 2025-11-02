import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { Shield, Users, Sparkles, Trophy } from 'lucide-react';

import { apiClient } from '@/lib/api';
import { ServerFeature } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Shield,
  Users,
  Sparkles,
  Trophy,
};

function resolveIcon(name: string | null | undefined) {
  if (!name) return Sparkles;
  const Icon = iconMap[name as keyof typeof iconMap];
  return Icon ?? Sparkles;
}

export function ServerFeatures() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['server-features'],
    queryFn: () => apiClient.getServerFeatures(),
  });

  if (isLoading || error || !data?.length) {
    return null;
  }

  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="container mx-auto space-y-8 px-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-lime-500">Why players choose us</p>
          <h2 className="text-3xl font-bold tracking-tight">Server Features</h2>
          <p className="mt-2 text-muted-foreground">
            Hand-crafted experiences tailored for both competitive and casual players.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((feature) => {
            const Icon = resolveIcon(feature.icon);
            return (
              <Card key={feature.id} className="border border-border/80">
                <CardHeader className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-lime-500" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
