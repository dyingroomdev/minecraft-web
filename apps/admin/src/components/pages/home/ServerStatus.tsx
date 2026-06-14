import { useMemo, useState } from 'react';

import { useStatus, useStatusWS } from '@/lib/hooks';
import type { HomepageServerStatus } from '@/lib/types';

function StatusSkeleton() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-12">
      <div className="animate-pulse rounded-2xl bg-surface2 p-6 md:p-8">
        <div className="h-6 w-48 rounded bg-surface" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="h-24 rounded-xl bg-surface" />
          <div className="space-y-4">
            <div className="h-16 rounded-xl bg-surface" />
            <div className="h-16 rounded-xl bg-surface" />
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPlayers(status?: HomepageServerStatus) {
  if (!status) return '0 players';
  return `${status.player_count ?? 0} players`;
}

export default function ServerStatus() {
  const { data, isLoading } = useStatus();
  const live = useStatusWS(data);
  const status = live ?? data;
  const online = status?.online ?? false;
  const [copied, setCopied] = useState<string | null>(null);

  const motd = useMemo(() => status?.motd ?? '—', [status?.motd]);

  if (isLoading && !status) {
    return <StatusSkeleton />;
  }

  if (!status) return null;

  const copyWithToast = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <section id="status" className="mx-auto max-w-[1200px] px-6 pb-12">
      <div className="rounded-2xl bg-surface shadow-card p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-on md:text-3xl">Server Status</h2>
          {copied ? (
            <div className="rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold text-brand2">
              {copied} copied
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-on">
              <span
                className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-brand2 animate-pulse' : 'bg-red-500'}`}
              />
              <span className="font-semibold">{online ? 'Online' : 'Offline'}</span>
              <span className="text-on/70">• {formatPlayers(status)}</span>
            </div>
            <div className="rounded-xl border border-accent/30 bg-surface2/60 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-on/40">MOTD</div>
              <div className="mt-1 font-mono text-sm text-on">{motd}</div>
            </div>
            <div className="text-sm text-on/70">
              Version: {status.version ?? 'Unknown'} · Uptime: {status.uptime ?? '—'}
            </div>
          </div>
          <div className="grid gap-4">
            <IPTile
              label="Java Edition"
              value={status.java_ip ?? 'play.amzcraft.xyz:25565'}
              onCopy={() => copyWithToast('Java IP', status.java_ip ?? 'play.amzcraft.xyz:25565')}
            />
            <IPTile
              label="Bedrock Edition"
              value={status.bedrock_ip ?? 'bedrock.amzcraft.xyz:19132'}
              onCopy={() => copyWithToast('Bedrock IP', status.bedrock_ip ?? 'bedrock.amzcraft.xyz:19132')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function IPTile({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-surface2 px-4 py-3">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-on/50">{label}</div>
        <div className="font-mono text-sm text-on">{value}</div>
      </div>
      <button
        onClick={onCopy}
        className="rounded-lg border border-brand/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-on transition hover:bg-brand/10"
      >
        Copy
      </button>
    </div>
  );
}
