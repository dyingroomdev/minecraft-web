import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SortableRule {
  id: string;
  title: string;
  content: string;
  display_order: number;
  is_pinned: boolean;
}

function reorder(list: SortableRule[], draggedId: string | null, targetId: string | null) {
  if (!draggedId || !targetId || draggedId === targetId) return list;
  const next = [...list];
  const fromIndex = next.findIndex((rule) => rule.id === draggedId);
  const toIndex = next.findIndex((rule) => rule.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return list;
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function AdminRules() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => apiClient.getAdminRules(),
  });

  const pinnedRules = useMemo(() => (data ?? []).filter((rule) => rule.is_pinned), [data]);
  const draggableSource = useMemo(() => (data ?? []).filter((rule) => !rule.is_pinned), [data]);

  const [orderedRules, setOrderedRules] = useState<SortableRule[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    setOrderedRules(draggableSource.map((rule) => ({ ...rule })));
  }, [draggableSource]);

  const reorderMutation = useMutation({
    mutationFn: (order: string[]) => apiClient.reorderRules(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
    },
  });

  const reorderErrorMessage = useMemo(() => {
    if (!reorderMutation.error) return null;
    if (reorderMutation.error instanceof Error) return reorderMutation.error.message;
    return typeof reorderMutation.error === 'string' ? reorderMutation.error : 'Unable to save order';
  }, [reorderMutation.error]);

  const hasChanges = useMemo(() => {
    if (orderedRules.length !== draggableSource.length) return false;
    return orderedRules.some((rule, index) => rule.id !== draggableSource[index]?.id);
  }, [orderedRules, draggableSource]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Manage Rules</h1>
        <p className="text-muted-foreground">
          Drag and drop to adjust ordering. Pinned rules are always displayed at the top for players.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Rule ordering</CardTitle>
          <CardDescription>Reorder rules to control their appearance on the public page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading rules…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">Unable to load rules. Please try again later.</p>
          ) : (
            <div className="space-y-4">
              {pinnedRules.length ? (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase">
                    <Badge variant="secondary">Pinned</Badge>
                    <span>Always shown first</span>
                  </div>
                  <div className="grid gap-3">
                    {pinnedRules.map((rule) => (
                      <article key={rule.id} className="rounded-lg border border-border bg-muted/30 p-4">
                        <header className="mb-2 flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{rule.title}</h3>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">Pinned</span>
                        </header>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rule.content}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Other rules</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!hasChanges}
                      onClick={() => setOrderedRules(draggableSource.map((rule) => ({ ...rule })))}
                    >
                      Reset order
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!hasChanges || reorderMutation.isPending}
                      onClick={() => reorderMutation.mutate(orderedRules.map((rule) => rule.id))}
                    >
                      {reorderMutation.isPending ? 'Saving…' : 'Save order'}
                    </Button>
                  </div>
                </div>

                {orderedRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional rules to reorder.</p>
                ) : (
                  <ul className="space-y-3">
                    {orderedRules.map((rule) => (
                      <li
                        key={rule.id}
                        className="cursor-grab rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/60"
                        draggable
                        onDragStart={() => setDraggedId(rule.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          setOrderedRules((prev) => reorder(prev, draggedId, rule.id));
                          setDraggedId(null);
                        }}
                        onDragEnd={() => setDraggedId(null)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">{rule.title}</h3>
                          <span className="text-xs text-muted-foreground">Drag to reorder</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{rule.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {reorderMutation.isError ? (
                  <p className="text-sm text-destructive">{reorderErrorMessage}</p>
                ) : reorderMutation.isSuccess && !reorderMutation.isPending ? (
                  <p className="text-sm text-lime-500">Order updated.</p>
                ) : null}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
