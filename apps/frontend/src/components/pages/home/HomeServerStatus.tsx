import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import MinecraftLive from '@/components/admin/MinecraftLive';

const JAVA_DEFAULT_HOST = 'play.amzcraft.xyz';
const JAVA_DEFAULT_PORT = 25565;
const BEDROCK_DEFAULT_HOST = 'bedrock.amzcraft.xyz';
const BEDROCK_DEFAULT_PORT = 25562;

const JAVA_HOST =
  import.meta.env.VITE_MC_JAVA_HOST?.trim() || JAVA_DEFAULT_HOST;
const JAVA_PORT = Number(import.meta.env.VITE_MC_JAVA_PORT ?? JAVA_DEFAULT_PORT);
const BEDROCK_HOST =
  import.meta.env.VITE_MC_BEDROCK_HOST?.trim() || BEDROCK_DEFAULT_HOST;
const BEDROCK_PORT = Number(import.meta.env.VITE_MC_BEDROCK_PORT ?? BEDROCK_DEFAULT_PORT);

const JAVA_ADDRESS = JAVA_PORT ? `${JAVA_HOST}:${JAVA_PORT}` : JAVA_HOST;
const BEDROCK_ADDRESS = BEDROCK_PORT ? `${BEDROCK_HOST}:${BEDROCK_PORT}` : BEDROCK_HOST;

type McJavaResponse = {
  online?: boolean;
  motd?: { clean?: string[]; html?: string[]; [key: string]: unknown };
  players?: { online?: number; max?: number };
  version?: string;
};

type McBedrockResponse = McJavaResponse;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function HomeServerStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['mcstats', JAVA_ADDRESS, BEDROCK_ADDRESS],
    queryFn: async () => {
      const [java, bedrock] = await Promise.all([
        fetchJson<McJavaResponse>(`https://api.mcsrvstat.us/3/${JAVA_ADDRESS}`),
        fetchJson<McBedrockResponse>(`https://api.mcsrvstat.us/bedrock/3/${BEDROCK_ADDRESS}`),
      ]);

      return {
        java,
        bedrock,
        fetchedAt: new Date().toISOString(),
      };
    },
    refetchInterval: 15_000,
  });

  const payload = useMemo(() => {
    if (!data) return null;

    const java = data.java ?? {};
    const bed = data.bedrock ?? {};

    const javaOnline = java.online ?? false;
    const bedOnline = bed.online ?? false;
    const motd =
      java.motd?.clean?.join(' ') ??
      bed.motd?.clean?.join(' ') ??
      '—';

    const totalPlayers =
      (java.players?.online ?? 0) + (bed.players?.online ?? 0);

    const version = java.version ?? bed.version ?? '—';

    return {
      online: javaOnline || bedOnline,
      player_count: totalPlayers,
      motd,
      version,
      java_ip: JAVA_ADDRESS,
      bedrock_ip: BEDROCK_ADDRESS,
      last_poll_utc: data.fetchedAt,
      ws_clients: 0,
    };
  }, [data]);

  if (isLoading && !payload) {
    return (
      <section id="server-status" className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-black/40" />
      </section>
    );
  }

  if (!payload) return null;

  return (
    <section
      id="server-status"
      className="mx-auto max-w-[1200px] px-6 py-12"
    >
      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/50 p-8 shadow-[0_0_24px_rgba(0,255,80,0.15)] backdrop-blur">
        <header className="space-y-2">
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
            🌐 Server Status
          </h2>
          <p className="text-sm text-white/70">
            Check real-time connection info for AmzCraft realms.
          </p>
        </header>
        <MinecraftLive data={payload} />
      </div>
    </section>
  );
}
