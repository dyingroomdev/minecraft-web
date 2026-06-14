import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, ScrollText, ShieldCheck, Sparkles } from 'lucide-react';

import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const COMMUNITY_GIF = `${API_BASE}/api/media/emojis/31562-minecraft-bee.gif`;

type RuleGroup = {
  id: string;
  label: string;
  rules: Array<{
    id: string;
    title: string;
    content: string;
    category: string | null;
    is_pinned: boolean;
  }>;
};

export function RulesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiClient.getRules(),
  });

  const rules = data ?? [];
  const pinnedRules = rules.filter((rule) => rule.is_pinned);
  const groupedRules: RuleGroup[] = useMemo(() => {
    const map = new Map<string, RuleGroup>();

    rules
      .filter((rule) => !rule.is_pinned)
      .forEach((rule) => {
        const key = rule.category?.toLowerCase() ?? 'general';
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            label: rule.category ? rule.category : 'General conduct',
            rules: [],
          });
        }
        map.get(key)?.rules.push(rule);
      });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rules]);

  return (
    <section className="container mx-auto max-w-4xl px-4 py-12 space-y-8">
      <header className="grid gap-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-lg md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-400">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Community charter
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            🛡️ Server Rules & Fair Play
          </h1>
          <p className="text-muted-foreground">
            Friendly vibes keep AmzCraft thriving. Brush up on the golden rules, then dive back in for another epic build, raid, or redstone invention.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Pinned rules appear first
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 px-3 py-1 text-slate-200">
              <ScrollText className="h-4 w-4" />
              Categories group everything else
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 flex w-fit items-center gap-2"
            onClick={() => refetch()}
          >
            Refresh rules
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center">
          <figure className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/60 p-3">
            <img
              src={COMMUNITY_GIF}
              alt="Bee holding a heart"
              className="h-28 w-28 rounded-lg object-cover"
            />
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              Buzzing with good vibes!
            </figcaption>
          </figure>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`rule-skeleton-${index}`}
              className="h-28 animate-pulse rounded-xl border border-border/60 bg-card/60"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <p className="font-semibold">Failed to load rules.</p>
            <p className="text-sm opacity-80">Please try again in a moment.</p>
          </div>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-emerald-500/50 p-10 text-center text-muted-foreground">
          No rules have been published yet. Check back soon!
        </div>
      ) : (
        <div className="space-y-10">
          {pinnedRules.length > 0 ? (
            <section className="space-y-4">
              <header className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                <h2 className="text-2xl font-semibold tracking-tight text-emerald-200">
                  Pinned rules
                </h2>
              </header>
              <div className="space-y-4">
                {pinnedRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} highlight />
                ))}
              </div>
            </section>
          ) : null}

          {groupedRules.map((group) => (
            <section key={group.id} className="space-y-4">
              <header className="flex items-center gap-3">
                <ScrollText className="h-5 w-5 text-emerald-300" />
                <h3 className="text-xl font-semibold text-emerald-100">{group.label}</h3>
              </header>
              <div className="space-y-4">
                {group.rules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function RuleCard({
  rule,
  highlight = false,
}: {
  rule: {
    id: string;
    title: string;
    content: string;
    category?: string | null;
    is_pinned?: boolean;
  };
  highlight?: boolean;
}) {
  return (
    <Card className={`border ${highlight ? 'border-emerald-400/70 bg-card/80' : 'border-border/70 bg-card/70'}`}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg">{rule.title}</CardTitle>
          {rule.category ? (
            <Badge variant="outline" className="mt-2 w-fit border-emerald-400/60 text-xs uppercase tracking-wide text-emerald-300">
              {rule.category}
            </Badge>
          ) : null}
        </div>
        {rule.is_pinned ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">
            <Sparkles className="h-3 w-3" />
            Pinned
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {rule.content}
        </p>
      </CardContent>
    </Card>
  );
}
