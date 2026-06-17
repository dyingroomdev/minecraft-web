import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ExternalLink, Gift, Loader2, Medal, Sparkles, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/$/, '');
const MEDIA_BASE = `${API_BASE}/api/media/emojis`;
const EMOJI_SPARKS = `${MEDIA_BASE}/433076-minecraft-diamond-sparkle.gif`;
const EMOJI_BEE = `${MEDIA_BASE}/31562-minecraft-bee.gif`;
const CARD_EMOJIS = [
  `${MEDIA_BASE}/713404-play.gif`,
  `${MEDIA_BASE}/80808-arrow.gif`,
  `${MEDIA_BASE}/83918-animatedarrowgreen.gif`,
  `${MEDIA_BASE}/5247-enderdragon.gif`,
];
const INFO_GIFS = {
  howTo: `${MEDIA_BASE}/713404-play.gif`,
  streak: `${MEDIA_BASE}/433076-minecraft-diamond-sparkle.gif`,
  love: `${MEDIA_BASE}/31562-minecraft-bee.gif`,
};

export function Vote() {
  const queryClient = useQueryClient();
  const {
    data: links,
    isLoading,
    error,
    isRefetching,
  } = useQuery({
    queryKey: ['vote-links'],
    queryFn: () => apiClient.getVoteLinks(),
  });
  const {
    data: topVoters,
    isLoading: isTopVotersLoading,
    error: topVotersError,
  } = useQuery({
    queryKey: ['top-voters', 'monthly-v2'],
    queryFn: () => apiClient.getTopVoters(),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const sortedLinks = useMemo(
    () =>
      (links ?? [])
        .slice()
        .sort((a, b) => {
          if (a.display_order === b.display_order) {
            return a.title.localeCompare(b.title);
          }
          return a.display_order - b.display_order;
        }),
    [links],
  );
  const sortedTopVoters = useMemo(
    () => [...(topVoters?.entries ?? [])].sort((a, b) => b.votes - a.votes || a.position - b.position),
    [topVoters?.entries],
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent px-6 py-10 shadow-lg">
        <div className="absolute -right-8 -top-10 opacity-80">
          <img src={EMOJI_SPARKS} alt="Sparkling diamond" className="h-28 w-28 drop-shadow-xl" />
        </div>
        <div className="absolute -left-6 bottom-0 opacity-70">
          <img src={EMOJI_BEE} alt="Minecraft bee" className="h-24 w-24 drop-shadow-lg" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Badge variant="outline" className="w-fit uppercase tracking-wide">
              Support the realm
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vote for AmzCraft ✨</h1>
            <p className="max-w-2xl text-muted-foreground">
              Every vote powers our worlds and keeps adventures flowing. Visit our partner lists, cheer us on,
              and scoop up sparkling goodies each day!
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-background/40 px-3 py-1">
                <Sparkles className="h-4 w-4 text-lime-500" />
                Earn crate keys, coins, cosmetics &amp; more
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-background/40 px-3 py-1">
                <ExternalLink className="h-4 w-4 text-primary" />
                Vote daily for bonus streak rewards
              </span>
            </div>
          </div>
          <Button asChild variant="outline" className="relative z-10">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vote links…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
            <p className="font-medium">Unable to load vote links.</p>
            <p className="mt-1 text-sm opacity-80">Please refresh the page or try again later.</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['vote-links'] })}
            >
              Retry
            </Button>
          </div>
        ) : sortedLinks.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-xl">Voting coming soon</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We’re setting up our voting partners. Check back shortly to start earning in-game rewards.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {sortedLinks.map((link, index) => {
              const displayOrder = link.display_order ?? index;
              const emoji = CARD_EMOJIS[index % CARD_EMOJIS.length];

              return (
                <Card key={link.id} className="border-border/70 shadow-sm transition hover:border-primary/60">
                  <CardHeader className="flex flex-col gap-3 pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <img
                            src={emoji}
                            alt=""
                            className="h-10 w-10 rounded-full border border-border/50 bg-card object-cover"
                          />
                          <CardTitle className="text-xl">{link.title}</CardTitle>
                        </div>
                        {link.description ? (
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        ) : null}
                      </div>
                      <Badge variant="secondary" className="uppercase tracking-wide">
                        #{displayOrder + 1}
                      </Badge>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="w-full sm:w-auto gap-2 bg-lime-500 text-forest-900 hover:bg-lime-400"
                    >
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.button_text || 'Vote now'}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-primary hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Gift className="h-4 w-4" />
                        Rewards
                      </h3>
                      {link.rewards.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {link.rewards.map((reward, rewardIndex) => (
                            <Badge key={`${link.id}-reward-${rewardIndex}`} variant="outline" className="bg-background">
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-muted-foreground">Rewards coming soon.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {isRefetching && !isLoading ? (
        <p className="mt-8 text-xs text-muted-foreground">Refreshing vote links…</p>
      ) : null}

      <section className="mt-12">
        <Card className="overflow-hidden border-border/70 bg-muted/30 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                <Trophy className="h-5 w-5 text-lime-500" />
              </span>
              <div>
                <CardTitle className="text-xl">Current month voters</CardTitle>
                <p className="text-sm text-muted-foreground">Updated daily from the in-game `/vote Top Monthly` leaderboard.</p>
              </div>
            </div>
            {topVoters?.updated_at ? (
              <Badge variant="outline" className="w-fit gap-2">
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(topVoters.updated_at).toLocaleDateString()}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            {isTopVotersLoading ? (
              <div className="flex items-center gap-3 p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading current month voters...
              </div>
            ) : topVotersError ? (
              <div className="p-6 text-sm text-destructive">
                Unable to load current month voters. Please try again later.
              </div>
            ) : sortedTopVoters.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Current month voters will appear after the next daily `/vote Top Monthly` sync.
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {sortedTopVoters.map((entry, index) => (
                  <div
                    key={`${entry.position}-${entry.player}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background font-semibold">
                      {index < 3 ? <Medal className="h-4 w-4 text-amber-400" /> : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{entry.player}</p>
                      <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {entry.votes.toLocaleString()} votes
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 bg-muted/40">
          <CardHeader className="flex items-center gap-3">
            <img src={INFO_GIFS.howTo} alt="Play icon" className="h-10 w-10" />
            <CardTitle className="text-lg font-semibold">How to vote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Click a voting button above.</p>
            <p>2. Enter your Minecraft username and submit the vote.</p>
            <p>3. Claim rewards in-game using `/rewards`.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-muted/40">
          <CardHeader className="flex items-center gap-3">
            <img src={INFO_GIFS.streak} alt="Sparkling diamond" className="h-10 w-10" />
            <CardTitle className="text-lg font-semibold">Current month top</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>The current month voter list refreshes once per day from the server.</p>
            <p>Keep voting daily to climb the leaderboard.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-muted/40">
          <CardHeader className="flex items-center gap-3">
            <img src={INFO_GIFS.love} alt="Friendly bee" className="h-10 w-10" />
            <CardTitle className="text-lg font-semibold">Share the love</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Voting helps new players discover AmzCraft.</p>
            <p>Invite friends and remind them to sparkle the scoreboard!</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
