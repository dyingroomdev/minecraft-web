import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAdminRankProducts, useLuckPermsGroups, useUpdateRankProduct } from '@/hooks/useAdminRanks';
import type { RankProductAdmin, StackMode } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const API_BASE = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/$/, '');
const RANKS_MEDIA_BASE = `${API_BASE}/api/media/ranks`;

type RankFormState = Record<string, { lp_group: string | null; stack_mode: StackMode }>;

export function AdminRanks() {
  const { data: products, isLoading, isError, refetch } = useAdminRankProducts();
  const {
    data: groups,
    isFetching: groupsLoading,
    refetch: refetchGroups,
  } = useLuckPermsGroups();
  const updateRank = useUpdateRankProduct();

  const [search, setSearch] = useState('');
  const [formState, setFormState] = useState<RankFormState>({});

  useEffect(() => {
    if (!products) return;
    const next: RankFormState = {};
    products.forEach((product) => {
      next[product.id] = {
        lp_group: product.lp_group ?? null,
        stack_mode: product.stack_mode ?? 'SET',
      };
    });
    setFormState(next);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [] as RankProductAdmin[];
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const source = `${product.display_name} ${product.rank_code}`.toLowerCase();
      return source.includes(term);
    });
  }, [products, search]);

  const handleGroupChange = (id: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        lp_group: value === '' ? null : value,
        stack_mode: prev[id]?.stack_mode ?? 'SET',
      },
    }));
  };

  const handleStackChange = (id: string, value: StackMode) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        lp_group: prev[id]?.lp_group ?? null,
        stack_mode: value,
      },
    }));
  };

  const handleSave = (id: string) => {
    const state = formState[id];
    if (!state) return;
    updateRank.mutate({ id, lp_group: state.lp_group, stack_mode: state.stack_mode });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rank Products</h1>
        <p className="text-muted-foreground">
          Map store products to LuckPerms groups and control how upgrades are applied.
        </p>
      </header>

      <Card className="border border-stone-700 bg-surface">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <CardTitle>LuckPerms groups</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sync groups from the Minecraft network to populate selectable options below.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Total products: {products?.length ?? 0}</Badge>
              <Badge variant="outline">Groups loaded: {groups?.length ?? 0}</Badge>
            </div>
          </div>
          <Button
            onClick={() => refetchGroups()}
            variant="outline"
            disabled={groupsLoading}
            className="border-stone-700"
          >
            {groupsLoading ? 'Syncing…' : 'Sync from LuckPerms'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              placeholder="Search rank or code…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-coal-900/40 border-stone-700"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Stack mode “SET” removes lower tiers before granting the target group. “ADD” keeps existing groups.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading rank products…</p>
      ) : isError ? (
        <Card className="border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          Unable to load rank products. <Button variant="link" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="border border-stone-700 bg-surface p-6 text-sm text-muted-foreground">
          No products matched your filters.
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => {
            const state = formState[product.id];
            return (
              <Card key={product.id} className="border border-stone-700 bg-surface/80">
                <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <CardTitle>{product.display_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Code: {product.rank_code} • Price: ৳{product.price_bdt}
                      {product.duration_days ? ` • Duration: ${product.duration_days} days` : ' • Lifetime'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Active:</span>
                    <Badge variant={product.is_active ? 'default' : 'outline'}>
                      {product.is_active ? 'Enabled' : 'Hidden'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          LuckPerms group
                        </label>
                        {state?.lp_group ? (
                          <img
                            src={`${RANKS_MEDIA_BASE}/${state.lp_group}.png`}
                            alt={`${state.lp_group} emblem`}
                            className="h-8 w-8 rounded border border-stone-700 bg-coal-900/60 object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>
                      <select
                        className="w-full rounded-md border border-stone-700 bg-coal-900/40 px-3 py-2 text-sm text-foreground"
                        value={state?.lp_group ?? ''}
                        onChange={(event) => handleGroupChange(product.id, event.target.value)}
                      >
                        <option value="">
                          {groups && groups.length > 0 ? 'Unassigned' : groupsLoading ? 'Loading groups…' : 'Sync groups to enable'}
                        </option>
                        {(groups ?? []).map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Stack mode
                      </label>
                      <select
                        className="w-full rounded-md border border-stone-700 bg-coal-900/40 px-3 py-2 text-sm text-foreground"
                        value={state?.stack_mode ?? 'SET'}
                        onChange={(event) => handleStackChange(product.id, event.target.value as StackMode)}
                      >
                        <option value="SET">SET – replace lower tiers</option>
                        <option value="ADD">ADD – keep existing ranks</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Last updated: {formatDate(product.updated_at ?? product.created_at)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(product.id)}
                      disabled={updateRank.isLoading}
                      className="bg-brand hover:bg-brand/90"
                    >
                      {updateRank.isLoading ? 'Saving…' : 'Save mapping'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleGroupChange(product.id, product.lp_group ?? '');
                        handleStackChange(product.id, product.stack_mode ?? 'SET');
                      }}
                      className="border-stone-700"
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
