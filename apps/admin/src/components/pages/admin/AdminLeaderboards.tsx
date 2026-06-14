import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LeaderboardForm {
  season: string;
  type: string;
  title: string;
}

export function AdminLeaderboards() {
  const [form, setForm] = useState<LeaderboardForm>({ season: '', type: '', title: '' });
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (payload: { season: string; type: string; title?: string | null; file: File }) =>
      apiClient.uploadLeaderboard(payload),
  });

  const uploadErrorMessage = useMemo(() => {
    if (!uploadMutation.error) return null;
    if (uploadMutation.error instanceof Error) return uploadMutation.error.message;
    return typeof uploadMutation.error === 'string' ? uploadMutation.error : 'Upload failed';
  }, [uploadMutation.error]);

  const availableTypes = useMemo(() => {
    const meta = uploadMutation.data?.metadata;
    if (!meta) return [] as string[];
    const raw = (meta as Record<string, unknown>).available_types;
    return Array.isArray(raw) ? raw.map(String) : [];
  }, [uploadMutation.data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    uploadMutation.mutate({
      season: form.season.trim(),
      type: form.type.trim(),
      title: form.title.trim() || undefined,
      file,
    });
  }

  const isSubmitting = uploadMutation.isPending;
  const isDisabled = !form.season.trim() || !form.type.trim() || !file || isSubmitting;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Manage Leaderboards</h1>
        <p className="text-muted-foreground">
          Upload CSV or JSON exports to refresh seasonal leaderboards. Responses are cached for players, so
          updates propagate instantly once uploaded.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload leaderboard data</CardTitle>
          <CardDescription>Accepts UTF-8 CSV with player/score columns or JSON arrays.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Input
                  id="season"
                  value={form.season}
                  onChange={(event) => setForm((prev) => ({ ...prev, season: event.target.value }))}
                  placeholder="s1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Leaderboard type</Label>
                <Input
                  id="type"
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                  placeholder="kills"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Display title (optional)</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Kill Leaders"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload file</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.json"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum size 5&nbsp;MB. CSV files must contain <code>player</code> and <code>score</code> columns.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isDisabled}>
                {isSubmitting ? 'Uploading…' : 'Upload leaderboard'}
              </Button>
              {uploadMutation.isError ? (
                <p className="text-sm text-destructive">{uploadErrorMessage}</p>
              ) : uploadMutation.isSuccess ? (
                <p className="text-sm text-lime-500">Upload complete! Cached views refreshed.</p>
              ) : null}
            </div>
          </form>

          {uploadMutation.data ? (
            <div className="mt-8 space-y-3 rounded-md border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Last upload summary
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  Season <span className="font-semibold text-foreground">{uploadMutation.data.season}</span> →{' '}
                  <span className="font-semibold text-foreground">{uploadMutation.data.leaderboard_type}</span>
                </li>
                <li>Entries imported: {uploadMutation.data.entries.length}</li>
                {availableTypes.length ? (
                  <li className="flex flex-wrap items-center gap-2">
                    <span>Available types:</span>
                    {availableTypes.map((value) => (
                      <Badge key={value} variant="secondary">
                        {value}
                      </Badge>
                    ))}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
