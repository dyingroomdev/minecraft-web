import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiClient, connectGameWS } from '../lib/api';
import type { NewsPost, RankProduct, ServerFeature, SocialLinks, TopVoters, VoteLink } from '../lib/types';

type LiveStatus = {
  online: boolean;
  player_count: number;
  max_players: number;
  java_ip?: string | null;
  bedrock_ip?: string | null;
  motd?: string | null;
  version?: string | null;
  ws_clients?: number | null;
};
import './FullSite.css';

type PageName = 'home' | 'news' | 'rules' | 'events' | 'ranks' | 'leaderboards' | 'vote' | 'contact';

type FullSiteProps = {
  page: string;
};

type ActivityEntry = {
  player?: string;
  action?: string;
  type?: string;
  message?: string;
  [key: string]: unknown;
};

type LeaderboardEntry = {
  player: string;
  score: number | string;
  position: number;
  metadata?: Record<string, unknown>;
};

type Dashboard = {
  season_stats: Record<string, number>;
  live_leaderboard: LeaderboardEntry[];
  live_activity: ActivityEntry[];
  leaderboard?: {
    season: string;
    title?: string | null;
    entries: LeaderboardEntry[];
    updated_at?: string;
  } | null;
};

type DiscordWidget = {
  available: boolean;
  name?: string;
  member_count?: number;
  presence_count?: number;
  invite_url?: string;
};

const MAX_ACTIVITY = 10;

function useHomepageData() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [rankProducts, setRankProducts] = useState<RankProduct[]>([]);
  const [social, setSocial] = useState<SocialLinks | null>(null);
  const [features, setFeatures] = useState<ServerFeature[]>([]);
  const [discord, setDiscord] = useState<DiscordWidget | null>(null);
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
  const [voteLinks, setVoteLinks] = useState<VoteLink[]>([]);
  const [topVoters, setTopVoters] = useState<TopVoters | null>(null);

  useEffect(() => {
    apiClient.getServerStatus().then((s) => setStatus(s as LiveStatus)).catch(() => {});
    const ws = connectGameWS({
      onStatus: (s) => setStatus(s as LiveStatus),
      onActivity: (event) => setActivity((prev) => [event, ...prev].slice(0, MAX_ACTIVITY)),
    });
    return () => ws.close();
  }, []);

  useEffect(() => {
    apiClient.getMinecraftDashboard().then((d) => {
      setDashboard(d);
      if (Array.isArray(d?.live_activity) && d.live_activity.length > 0) {
        setActivity(d.live_activity.slice(0, MAX_ACTIVITY));
      }
    }).catch(() => {});
    apiClient.getRankProducts().then(setRankProducts).catch(() => {});
    apiClient.getSocialLinks().then(setSocial).catch(() => {});
    apiClient.getPublicFeatures().then(setFeatures).catch(() => {});
    apiClient.getDiscordWidget().then(setDiscord).catch(() => {});
    apiClient.getTopVoters().then((tv) => {
      setTopVoters(tv);
      const map: Record<string, number> = {};
      for (const e of tv.entries ?? []) map[e.player.toLowerCase()] = e.votes;
      setVoteMap(map);
    }).catch(() => {});
    apiClient.getVoteLinks().then((links) =>
      setVoteLinks(links.filter((l) => l.is_active).sort((a, b) => a.display_order - b.display_order))
    ).catch(() => {});
  }, []);

  return { status, dashboard, activity, rankProducts, social, features, discord, voteMap, voteLinks, topVoters };
}

const pagePaths: Record<PageName, string> = {
  home: '/',
  news: '/news',
  rules: '/rules',
  events: '/events',
  ranks: '/ranks',
  leaderboards: '/leaderboards',
  vote: '/vote',
  contact: '/contact',
};

const navItems: Array<{ page: PageName; label: string }> = [
  { page: 'news', label: 'News' },
  { page: 'rules', label: 'Rules' },
  { page: 'events', label: 'Events' },
  { page: 'ranks', label: 'Ranks' },
  { page: 'leaderboards', label: 'Leaderboards' },
  { page: 'vote', label: 'Vote' },
];

const socialIconMap: Array<{ key: keyof SocialLinks; faClass: string; label: string }> = [
  { key: 'facebook',  faClass: 'fab fa-facebook-f',  label: 'Facebook' },
  { key: 'twitter',   faClass: 'fab fa-x-twitter',   label: 'Twitter/X' },
  { key: 'discord',   faClass: 'fab fa-discord',     label: 'Discord' },
  { key: 'youtube',   faClass: 'fab fa-youtube',     label: 'YouTube' },
  { key: 'tiktok',    faClass: 'fab fa-tiktok',      label: 'TikTok' },
  { key: 'instagram', faClass: 'fab fa-instagram',   label: 'Instagram' },
];

function cleanPage(page: string): PageName {
  return page in pagePaths ? (page as PageName) : 'home';
}

function Reveal({ children, className = '', style }: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <div className={`reveal vis ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function Footer({ full = false, goPage, social, javaIp }: { full?: boolean; goPage: (page: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  const activeSocials = socialIconMap.filter((s) => social?.[s.key]);
  const year = new Date().getFullYear();
  const serverIp = javaIp ?? 'play.amzcraft.top';

  return (
    <footer>
      <div className="footer-inner">
        {full && (
          <div className="footer-grid">
            <div>
              <span className="footer-logo">AMZ<span>CRAFT</span></span>
              <p className="footer-desc">Bangladesh's most active Minecraft community. Seasonal events, ranked gameplay, and a realm worth fighting for.</p>
              <div className="footer-ip">{serverIp}</div>
            </div>
            <div>
              <div className="footer-col-title">Navigate</div>
              <ul className="footer-links">
                {(['news', 'rules', 'events', 'ranks', 'vote'] as PageName[]).map((item) => (
                  <li key={item}><button onClick={() => goPage(item)}>{item[0].toUpperCase() + item.slice(1)}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Community</div>
              <ul className="footer-links">
                <li><button onClick={() => goPage('leaderboards')}>Leaderboards</button></li>
                <li>
                  {social?.discord
                    ? <a href={social.discord} target="_blank" rel="noopener noreferrer">Discord</a>
                    : <span style={{ color: 'var(--grey)' }}>Discord</span>}
                </li>
                <li><button onClick={() => goPage('news')}>News & Updates</button></li>
                <li><button onClick={() => goPage('events')}>Events</button></li>
                <li><button onClick={() => goPage('vote')}>Vote for Us</button></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><button onClick={() => goPage('contact')}>Submit a Bug</button></li>
                <li><button onClick={() => goPage('contact')}>Appeals</button></li>
                <li><button onClick={() => goPage('contact')}>Staff Apply</button></li>
                <li><button onClick={() => goPage('contact')}>Help Center</button></li>
              </ul>
            </div>
          </div>
        )}
        <div className="footer-bottom">
          <span className="footer-copy">© {year} Amaze Gaming × AmzCraft. All rights reserved.</span>
          <div className="socials">
            {activeSocials.map((s) => (
              <a className="social-btn" key={s.key} href={social![s.key]!} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                <i className={s.faClass} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function Nav({ active, scrolled, goPage }: { active: PageName; scrolled: boolean; goPage: (page: PageName) => void }) {
  return (
    <nav id="mainNav" style={{ background: scrolled ? 'rgba(10,10,11,.99)' : 'rgba(10,10,11,.94)' }}>
      <div className="nav-logo" onClick={() => goPage('home')}>
        AMZ<span>CRAFT</span>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.page}>
            <button className={active === item.page ? 'active' : ''} onClick={() => goPage(item.page)}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary btn-sm">Login</button>
    </nav>
  );
}

function activityDotClass(entry: ActivityEntry): string {
  const t = (entry.type ?? entry.action ?? '').toLowerCase();
  if (t.includes('join') || t.includes('connect')) return 'adg';
  if (t.includes('quit') || t.includes('leave') || t.includes('disconnect')) return 'adred';
  return 'adgold';
}

function activityLabel(entry: ActivityEntry): string {
  if (entry.message) return entry.message;
  const action = entry.action ?? entry.type ?? 'did something';
  return action;
}

function ServerCard({ status, activity }: { status: LiveStatus | null; activity: ActivityEntry[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const isOnline = status?.online === true;

  const copyIP = (ip: string) => {
    void navigator.clipboard?.writeText(ip).catch(() => undefined);
    setCopied(ip);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const ipRows: [string, string][] = [
    ['Java', status?.java_ip ?? 'play.amzcraft.top'],
    ['Bedrock', status?.bedrock_ip ?? 'play.amzcraft.top:25566'],
  ];

  return (
    <div className="server-card">
      <div className="sc-header">
        <span className="sc-name">AmzCraft Server</span>
        <div className="sc-online">
          <div className="dot-pulse" style={isOnline ? undefined : { background: '#ff3b3b', boxShadow: 'none' }} />
          {status ? (isOnline ? 'Online' : 'Offline') : 'Checking…'}
        </div>
      </div>
      <div className="sc-players">
        <span className="sc-count">{status?.player_count ?? '—'}</span>
        <div className="sc-max">/ {status?.max_players ?? 100} max players</div>
      </div>
      {ipRows.map(([label, ip]) => (
        <div className="ip-row" key={label}>
          <span className="ip-label">{label}</span>
          <span className="ip-val">{ip}</span>
          <button className="copy-btn" onClick={() => copyIP(ip)}>
            {copied === ip ? '✓ Done' : 'Copy'}
          </button>
        </div>
      ))}
      <div className="live-title">⚡ Live Activity</div>
      {activity.length > 0
        ? activity.slice(0, 4).map((entry, i) => (
            <div className="act-item" key={i}>
              <div className={`act-dot ${activityDotClass(entry)}`} />
              <span>
                {entry.player && <strong>{entry.player}</strong>} {activityLabel(entry)}
              </span>
            </div>
          ))
        : (
          <div className="act-item">
            <div className="act-dot adg" />
            <span>Waiting for live activity…</span>
          </div>
        )
      }
    </div>
  );
}

function ParticleField() {
  const particles = useMemo(
    () => Array.from({ length: 18 }, (_, index) => ({
      id: index,
      size: index % 2 === 0 ? 4 : 6,
      color: ['#00FF7F', '#FFD700', '#5CE0F5'][index % 3],
      left: `${6 + ((index * 17) % 52)}%`,
      bottom: `${(index * 11) % 20}%`,
      duration: `${6 + (index % 6)}s`,
      delay: `${(index % 8) * 0.7}s`,
    })),
    [],
  );

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            background: particle.color,
            opacity: 0,
            left: particle.left,
            bottom: particle.bottom,
            animation: `float-up ${particle.duration} ease-in infinite`,
            animationDelay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}

const RANK_TIER_MAP: Record<string, { label: string; tierClass: string; priceClass: string }> = {
  vip:     { label: '■ VIP',     tierClass: 'tier-v', priceClass: 'pv' },
  premium: { label: '■ PREMIUM', tierClass: 'tier-p', priceClass: 'pp' },
  legend:  { label: '■ LEGEND',  tierClass: 'tier-l', priceClass: 'pl' },
};

function rankTierInfo(rankCode: string) {
  const key = Object.keys(RANK_TIER_MAP).find((k) => rankCode.toLowerCase().includes(k));
  return key ? RANK_TIER_MAP[key] : { label: `■ ${rankCode.toUpperCase()}`, tierClass: 'tier-v', priceClass: 'pv' };
}

function formatDuration(days: number | null): string {
  if (days === null) return '/ lifetime';
  return `/ ${days} days`;
}

const FALLBACK_MODES = [
  ['⚔️', 'Survival', 'Explore, build, fight mobs, and survive the wilderness with fellow players.', 'badge-green', '4 players online'],
  ['🏹', 'PvP Arena', 'Ranked PvP with tournaments, leaderboards, and real prizes.', 'badge-grey', 'Upcoming'],
  ['🏗️', 'SkyBlock', 'Start from scratch on a floating island. Build your legacy in the sky.', 'badge-grey', 'Upcoming'],
  ['🎨', 'Creative', 'Unlimited resources. Build anything without limits in our creative sandbox.', 'badge-grey', 'Upcoming'],
];

const FALLBACK_FEATURES: [string, string, string][] = [
  ['fas fa-shield-halved', 'Fair Play Guaranteed', 'AI-powered anti-cheat with 99.6% accuracy. Zero false positives in the last 60 days. Report and we act — within the hour.'],
  ['fas fa-coins', 'Player Economy', 'Trade freely in the open market, run shops, and accumulate wealth across every season. The economy is entirely player-driven.'],
  ['fas fa-users', '2,400+ Community', 'Active Discord with dedicated channels for each game mode. Staff-moderated, event announcements, and 24/7 support.'],
  ['fas fa-gamepad', 'Java & Bedrock', 'Cross-play enabled. PC, mobile, console — everyone plays together on the same realm, no exceptions.'],
];

function CardIcon({ icon }: { icon: string | null | undefined }) {
  const cls = (icon ?? '').trim();
  if (cls.startsWith('fa')) return <i className={`${cls} card-icon`} />;
  return <i className="fas fa-star card-icon" />;
}

function lbRankClass(pos: number): string {
  if (pos === 1) return 'lb-rank r1';
  if (pos === 2) return 'lb-rank r2';
  if (pos === 3) return 'lb-rank r3';
  return 'lb-rank';
}

function lbRankIcon(pos: number): React.ReactNode {
  if (pos === 1) return <i className="fas fa-medal" style={{ fontSize: 14 }} />;
  if (pos === 2) return <i className="fas fa-medal" style={{ fontSize: 14, opacity: 0.8 }} />;
  if (pos === 3) return <i className="fas fa-medal" style={{ fontSize: 14, opacity: 0.65 }} />;
  return null;
}

function metaStat(meta: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!meta) return '—';
  for (const k of keys) {
    const v = meta[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '—';
}

function playerPrefix(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  const raw = meta.prefix ?? meta.rank_prefix ?? meta.lp_prefix ?? meta.rank ?? null;
  if (!raw) return null;
  // Strip Minecraft §color codes
  return String(raw).replace(/§[0-9A-FK-ORa-fk-or]/g, '').replace(/&[0-9A-FK-ORa-fk-or]/gi, '').trim() || null;
}

type HomeProps = {
  active: boolean;
  goPage: (page: PageName) => void;
  status: LiveStatus | null;
  dashboard: Dashboard | null;
  activity: ActivityEntry[];
  rankProducts: RankProduct[];
  social: SocialLinks | null;
  features: ServerFeature[];
  discord: DiscordWidget | null;
  voteMap: Record<string, number>;
};

function HomePage({ active, goPage, status, dashboard, activity, rankProducts, social, features, discord, voteMap }: HomeProps) {
  const onlinePlayers = status?.player_count ?? null;
  const seasonStats = dashboard?.season_stats ?? {};
  const uniquePlayers = seasonStats.unique_players ?? null;

  // Always prefer live RCON leaderboard — it has balance/kills/playtime in metadata
  const lbEntries: LeaderboardEntry[] = (dashboard?.live_leaderboard ?? []).slice(0, 5);
  const lbSeason = dashboard?.leaderboard?.season ?? 'Season 4';
  const lbUpdated = null;

  return (
    <div id="page-home" className={`page ${active ? 'active' : ''}`}>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-stars" />
        <ParticleField />
        <div className="hero-content">
          <div className="hero-eyebrow">Season 4 — Mother Kingdoms</div>
          <h1 className="hero-title">Build. Fight.<br /><span className="accent">Conquer.</span></h1>
          <p className="hero-sub">AmzCraft is Bangladesh's most active Minecraft server. Seasonal events, guild wars, ranked perks, and a community worth logging in for — every single day.</p>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg">▶ Play Now</button>
            {discord?.invite_url
              ? <a className="btn btn-ghost" href={discord.invite_url} target="_blank" rel="noopener noreferrer">🎮 Join Discord</a>
              : <button className="btn btn-ghost">🎮 Join Discord</button>
            }
            <button className="btn btn-ghost" onClick={() => goPage('ranks')}>View Ranks →</button>
          </div>
          <div className="hero-stats">
            {[
              [onlinePlayers !== null ? String(onlinePlayers) : '—', 'Online Now'],
              [uniquePlayers !== null ? `${uniquePlayers.toLocaleString()}+` : '2,400+', 'Total Players'],
              ['4', 'Seasons'],
              ['99.9%', 'Uptime'],
            ].map(([value, label]) => (
              <div key={label}><span className="stat-val">{value}</span><span className="stat-lbl">{label}</span></div>
            ))}
          </div>
        </div>
        <ServerCard status={status} activity={activity} />
        <div className="hero-terrain" />
      </section>

      <div className="divider" />
      <section className="sec" style={{ background: 'var(--coal)' }}>
        <div className="inner">
          <Reveal className="eyebrow">Game Modes</Reveal>
          <Reveal className="sec-title">Choose Your Adventure</Reveal>
          <Reveal className="sec-desc">Every mode runs on its own dedicated world — no lag, no compromises.</Reveal>
          <div className="modes-grid">
            {FALLBACK_MODES.map(([icon, title, desc, badge, statusLabel]) => (
              <Reveal className="card" key={title}>
                <span className="card-icon">{icon}</span>
                <div className="card-title">{title}</div>
                <p className="card-desc">{desc}</p>
                <br />
                <span className={`badge ${badge}`}><span className="bdot" /> {statusLabel}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />
      <section className="sec">
        <div className="inner">
          <Reveal className="eyebrow">Why AmzCraft</Reveal>
          <Reveal className="sec-title">Built for the Committed Player</Reveal>
          <Reveal className="sec-desc">Designed by players, for players who take their craft seriously.</Reveal>
          <div className="why-grid">
            <Reveal className="card" style={{ background: 'linear-gradient(135deg,rgba(0,255,127,.07),rgba(92,224,245,.04))', borderColor: 'rgba(0,255,127,.18)' }}>
              <i className="fas fa-trophy card-icon" /><div className="card-title">Seasonal Competitions</div>
              <p className="card-desc">Every 3 months the realm resets. Fight for a place on the permanent Hall of Legends. Guild wars, solo tournaments, and build contests — all with real prizes.</p>
              <div className="chips"><span className="chip">⚔ Guild Wars</span><span className="chip">🏹 Build Contests</span><span className="chip">🏆 Solo Tournaments</span></div>
            </Reveal>
            <Reveal className="card" style={{ background: 'linear-gradient(135deg,rgba(0,255,127,.07),rgba(92,224,245,.04))', borderColor: 'rgba(0,255,127,.18)' }}>
              <i className="fas fa-chart-bar card-icon" /><div className="card-title">Season 4 Live Stats</div>
              <div className="stats-inner">
                <div>
                  <div className="stat-row"><span className="stat-row-lbl">Player Kills</span><span className="stat-row-val">{seasonStats.total_kills ?? '—'}</span></div>
                  <div className="stat-row"><span className="stat-row-lbl">Unique Players</span><span className="stat-row-val">{seasonStats.unique_players ?? '—'}</span></div>
                </div>
                <div>
                  <div className="stat-row"><span className="stat-row-lbl">Active Teams</span><span className="stat-row-val">{seasonStats.active_teams ?? seasonStats.active_guilds ?? '—'}</span></div>
                  <div className="stat-row"><span className="stat-row-lbl">Total Playtime</span><span className="stat-row-val">{seasonStats.total_playtime_hours != null ? `${seasonStats.total_playtime_hours}h` : '—'}</span></div>
                </div>
              </div>
            </Reveal>
            {features.length > 0
              ? features.map((f) => (
                  <Reveal className="card" key={f.id}>
                    <CardIcon icon={f.icon} />
                    <div className="card-title">{f.title}</div>
                    <p className="card-desc">{f.description}</p>
                  </Reveal>
                ))
              : FALLBACK_FEATURES.map(([icon, title, desc]) => (
                  <Reveal className="card" key={title}>
                    <i className={`${icon} card-icon`} />
                    <div className="card-title">{title}</div>
                    <p className="card-desc">{desc}</p>
                  </Reveal>
                ))
            }
          </div>
        </div>
      </section>

      <div className="divider" />
      <RanksPreview goPage={goPage} rankProducts={rankProducts} />
      <div className="divider" />
      <LeaderboardPreview goPage={goPage} entries={lbEntries} season={lbSeason} updatedAt={lbUpdated} voteMap={voteMap} />
      <DiscordCta discord={discord} social={social} />
      <Footer full goPage={goPage} social={social} javaIp={status?.java_ip} />
    </div>
  );
}

function RanksPreview({ goPage, rankProducts }: { goPage: (page: PageName) => void; rankProducts: RankProduct[] }) {
  const activeProducts = rankProducts.filter((p) => p.is_active);

  return (
    <section className="sec" style={{ background: 'var(--coal)' }}>
      <div className="inner">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div><Reveal className="eyebrow">Premium Ranks</Reveal><Reveal className="sec-title" style={{ marginBottom: 0 }}>Unlock Your Full Potential</Reveal></div>
          <button className="btn btn-ghost btn-sm" onClick={() => goPage('ranks')}>Compare All Ranks →</button>
        </div>
        <div className="ranks-grid">
          {activeProducts.length > 0
            ? activeProducts.map((product, i) => {
                const tier = rankTierInfo(product.rank_code);
                const featured = product.rank_code.toLowerCase().includes('premium');
                return (
                  <Reveal className={`rank-card ${featured ? 'feat' : ''}`} key={product.id}>
                    {featured && <div className="rank-pop">⭐ Most Popular</div>}
                    <div className={`rank-tier ${tier.tierClass}`}>{tier.label}</div>
                    <div className="rank-name">{product.display_name}</div>
                    <div className={`rank-price ${tier.priceClass}`}>৳{product.price_bdt}</div>
                    <div className="rank-period">{formatDuration(product.duration_days)}</div>
                    {product.description && (
                      <p style={{ fontSize: 12, color: 'var(--grey2)', marginBottom: 16 }}>{product.description}</p>
                    )}
                    <button className="btn btn-gold btn-block">Coming Soon</button>
                  </Reveal>
                );
              })
            : (
              <Reveal style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--grey)' }}>
                Ranks loading…
              </Reveal>
            )
          }
        </div>
      </div>
    </section>
  );
}

function LeaderboardPreview({
  goPage,
  entries,
  season,
  updatedAt,
  voteMap,
}: {
  goPage: (page: PageName) => void;
  entries: LeaderboardEntry[];
  season: string;
  updatedAt: string | null;
  voteMap: Record<string, number>;
}) {
  return (
    <section className="sec">
      <div className="inner">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <Reveal className="eyebrow">{season}</Reveal>
            <Reveal className="sec-title" style={{ marginBottom: 4 }}>Top Adventurers</Reveal>
            <p style={{ color: 'var(--grey)', fontSize: 14 }}>Who's dominating the current season?</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => goPage('leaderboards')}>View All →</button>
        </div>
        {entries.length > 0
          ? (
            <Reveal className="lb-table">
              <div className="lb-head">
                <span>#</span>
                <span>Player</span>
                <span style={{ textAlign: 'right' }}>Balance</span>
                <span style={{ textAlign: 'right' }}>Kills</span>
                <span style={{ textAlign: 'right' }}>Playtime</span>
                <span style={{ textAlign: 'right' }}>Votes</span>
              </div>
              {entries.map((entry) => {
                const meta = entry.metadata;
                const prefix = playerPrefix(meta);
                const balance = metaStat(meta, 'balance', 'baltop', 'bal', 'money');
                const kills = metaStat(meta, 'kills', 'player_kills', 'pvp_kills');
                const playtime = metaStat(meta, 'playtime', 'playtime_hours', 'hours', 'time');
                const votesFromMap = voteMap[entry.player.toLowerCase()];
                const votes = votesFromMap != null ? String(votesFromMap) : metaStat(meta, 'votes', 'vote_count', 'monthly_votes', 'vote');
                return (
                  <div className="lb-row" key={entry.player}>
                    <span className={lbRankClass(entry.position)}>
                      {lbRankIcon(entry.position)}
                      {entry.position}
                    </span>
                    <div className="lb-player">
                      {prefix && <span className="lb-prefix">{prefix}</span>}
                      <span className="lb-uname">{entry.player}</span>
                    </div>
                    <span className={`lb-stat${balance === '—' ? ' dim' : ''}`} style={{ textAlign: 'right' }}>{balance}</span>
                    <span className={`lb-stat${kills === '—' ? ' dim' : ''}`} style={{ textAlign: 'right' }}>{kills}</span>
                    <span className={`lb-stat${playtime === '—' ? ' dim' : ''}`} style={{ textAlign: 'right' }}>
                      {playtime !== '—' ? (playtime.endsWith('h') ? playtime : `${playtime}h`) : '—'}
                    </span>
                    <span className={`lb-stat${votes === '—' ? ' dim' : ''}`} style={{ textAlign: 'right' }}>{votes}</span>
                  </div>
                );
              })}
              {updatedAt && (
                <div style={{ fontSize: 11, color: 'var(--grey)', padding: '10px 22px', textAlign: 'right' }}>
                  Updated {updatedAt}
                </div>
              )}
            </Reveal>
          )
          : (
            <Reveal className="lb-table" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--grey)' }}>
              No leaderboard data yet for this season.
            </Reveal>
          )
        }
      </div>
    </section>
  );
}

function DiscordCta({ discord, social }: { discord: DiscordWidget | null; social: SocialLinks | null }) {
  const inviteUrl = discord?.invite_url ?? social?.discord ?? undefined;
  const onlineCount = discord?.presence_count;
  const memberCount = discord?.member_count;

  return (
    <section className="disc-sec">
      <div className="disc-inner">
        <div>
          <div className="disc-icon">💬</div>
          <div className="disc-title">
            {discord?.name ? `Join the ${discord.name} Discord` : 'Join the AmzCraft Discord'}
          </div>
          <p className="disc-desc">Get notified first, coordinate guild wars, find teammates, and chat with the community — all in one place.</p>
          <div className="disc-stat">
            <div className="dot-pulse" />
            {onlineCount != null
              ? `${onlineCount.toLocaleString()} members online right now`
              : memberCount != null
                ? `${memberCount.toLocaleString()} total members`
                : 'Active community'
            }
          </div>
        </div>
        {inviteUrl
          ? <a className="btn btn-discord btn-lg" href={inviteUrl} target="_blank" rel="noopener noreferrer">🎮 Join Server →</a>
          : <button className="btn btn-discord btn-lg">🎮 Join Server →</button>
        }
      </div>
    </section>
  );
}

function fmtDate(dt: string | null | undefined) {
  if (!dt) return null;
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function NewsDetail({ post, onBack, goPage, social, javaIp }: { post: NewsPost; onBack: () => void; goPage: (p: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  return (
    <div id="page-news" className="page active">
      <div className="news-header">
        <div className="news-header-inner">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back to News
            </button>
            <div className="eyebrow">Newsroom Dispatch</div>
            <div className="sec-title" style={{ fontSize: 'clamp(18px,2.5vw,34px)', lineHeight: 1.3 }}>{post.title}</div>
            <div className="art-meta" style={{ marginTop: 12 }}>
              {post.published_at && <span className="art-date">{fmtDate(post.published_at)}</span>}
              {post.is_pinned && <span className="badge badge-gold"><i className="fas fa-thumbtack" style={{ marginRight: 4 }} />Pinned</span>}
            </div>
          </div>
          <div className="news-mascot"><span className="mascot-icon">🪲</span><span className="mascot-txt">Fresh buzz from spawn town!</span></div>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 72px' }}>
        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 2, marginBottom: 32, display: 'block', border: '2px solid rgba(255,255,255,.07)' }} />
        )}
        {post.summary && <p style={{ fontSize: 16, color: 'var(--grey2)', lineHeight: 1.7, marginBottom: 28, borderLeft: '3px solid var(--emerald)', paddingLeft: 16 }}>{post.summary}</p>}
        {post.content
          ? <div style={{ fontSize: 14, color: 'var(--grey)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{post.content}</div>
          : <p style={{ color: 'var(--grey)', opacity: .5 }}>No content available.</p>
        }
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid rgba(255,255,255,.06)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <i className="fas fa-arrow-left" style={{ marginRight: 8 }} />Back to News
          </button>
        </div>
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

function NewsPage({ active, goPage, social, javaIp }: { active: boolean; goPage: (page: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<NewsPost | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    apiClient.getNews().then(setPosts).finally(() => setLoading(false));
  }, [active]);

  useEffect(() => {
    if (!active || !slug) { setDetail(null); return; }
    setDetailLoading(true);
    apiClient.getNewsPost(slug).then(setDetail).catch(() => setDetail(null)).finally(() => setDetailLoading(false));
  }, [active, slug]);

  const featured = posts.find(p => p.is_pinned) ?? posts[0] ?? null;
  const rest = posts.filter(p => p !== featured);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rest;
    return posts.filter(p => p.title.toLowerCase().includes(q) || (p.summary ?? '').toLowerCase().includes(q));
  }, [search, posts, rest]);

  const archive = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) {
      const dt = p.published_at ?? p.scheduled_publish_at;
      if (!dt) continue;
      const key = new Date(dt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts);
  }, [posts]);

  const pinned = posts.filter(p => p.is_pinned);

  if (!active) return <div id="page-news" className="page" />;

  if (detailLoading) {
    return (
      <div id="page-news" className="page active">
        <div className="news-header"><div className="news-header-inner"><div><div className="eyebrow">Newsroom Dispatch</div><div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,40px)' }}>Loading…</div></div></div></div>
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--grey)' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 32 }} /></div>
      </div>
    );
  }

  if (slug && detail) {
    return <NewsDetail post={detail} onBack={() => navigate('/news')} goPage={goPage} social={social} javaIp={javaIp} />;
  }

  return (
    <div id="page-news" className={`page ${active ? 'active' : ''}`}>
      <div className="news-header">
        <div className="news-header-inner">
          <div>
            <div className="eyebrow">Newsroom Dispatch</div>
            <div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,40px)' }}>AmzCraft Community News</div>
            <p className="sec-desc" style={{ marginBottom: 20 }}>Patch notes, builder spotlights, tournament recaps, and everything buzzing around the realm.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-green"><span className="bdot" /> Pinned posts stay on top</span>
              <span className="badge badge-grey"><i className="fas fa-calendar" style={{ marginRight: 4 }} />Archives by month</span>
            </div>
            <div className="news-search-row">
              <input className="news-search" type="text" placeholder="Search by title or keyword…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="news-mascot"><span className="mascot-icon">🪲</span><span className="mascot-txt">Fresh buzz from spawn town!</span></div>
        </div>
      </div>

      <div className="news-body">
        <div className="news-main">
          {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--grey)' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }} /></div>}

          {!loading && posts.length === 0 && (
            <div className="news-article" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: .4 }}><i className="fas fa-newspaper" /></div>
              <div className="art-title">No posts published yet</div>
              <p className="art-excerpt">Check back soon for news, updates, and event recaps.</p>
            </div>
          )}

          {!loading && featured && !search && (
            <div className="news-featured" onClick={() => navigate(`/news/${featured.slug}`)} style={{ cursor: 'pointer' }}>
              {featured.cover_image_url
                ? <img className="news-featured-img" src={featured.cover_image_url} alt={featured.title} style={{ objectFit: 'cover', width: '100%', height: 240, display: 'block' }} />
                : <div className="news-featured-img"><i className="fas fa-newspaper" style={{ fontSize: 60, opacity: .3 }} /></div>
              }
              <div className="news-featured-body">
                {featured.is_pinned && <span className="badge badge-gold" style={{ marginBottom: 12 }}><i className="fas fa-thumbtack" style={{ marginRight: 4 }} />Pinned</span>}
                <div className="art-title" style={{ fontSize: 14, marginBottom: 10 }}>{featured.title}</div>
                {featured.summary && <p className="art-excerpt">{featured.summary}</p>}
                <div className="art-meta">
                  {featured.published_at && <span className="art-date">{fmtDate(featured.published_at)}</span>}
                  <span className="badge badge-grey" style={{ fontSize: 10 }}>Read More →</span>
                </div>
              </div>
            </div>
          )}

          {!loading && filtered.map(p => (
            <div className="news-article" key={p.id} onClick={() => navigate(`/news/${p.slug}`)}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {p.is_pinned && <span className="badge badge-gold"><i className="fas fa-thumbtack" style={{ marginRight: 4 }} />Pinned</span>}
                <span className="badge badge-grey">Post</span>
              </div>
              <div className="art-title">{p.title}</div>
              {p.summary && <p className="art-excerpt">{p.summary}</p>}
              <div className="art-meta">
                {p.published_at && <span className="art-date">{fmtDate(p.published_at)}</span>}
              </div>
            </div>
          ))}

          {!loading && search && filtered.length === 0 && (
            <div className="news-article" style={{ textAlign: 'center', padding: 32 }}>
              <div className="art-title">No results for "{search}"</div>
              <p className="art-excerpt">Try a different keyword.</p>
            </div>
          )}
        </div>

        <div className="news-sidebar">
          {pinned.length > 0 && (
            <div className="sidebar-card">
              <div className="sidebar-title"><i className="fas fa-fire" style={{ marginRight: 6, color: 'var(--emerald)' }} />Trending</div>
              {pinned.map(p => (
                <div className="trending-item" key={p.id} onClick={() => navigate(`/news/${p.slug}`)}>
                  <span className="badge badge-gold" style={{ marginBottom: 6, display: 'inline-flex' }}><i className="fas fa-thumbtack" style={{ marginRight: 4 }} />Pinned</span>
                  <div className="art-title" style={{ fontSize: 9 }}>{p.title}</div>
                  {p.published_at && <div className="art-meta" style={{ marginTop: 6 }}><span className="art-date">{fmtDate(p.published_at)}</span></div>}
                </div>
              ))}
            </div>
          )}
          {archive.length > 0 && (
            <div className="sidebar-card">
              <div className="sidebar-title"><i className="fas fa-folder" style={{ marginRight: 6, color: 'var(--emerald)' }} />Archive</div>
              {archive.map(([month, count]) => (
                <div className="archive-item" key={month}>
                  <span>{month}</span><span className="archive-count">{count}</span>
                </div>
              ))}
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="sidebar-card">
              <div className="sidebar-title">Community</div>
              {social?.discord
                ? <a className="btn btn-discord" href={social.discord} target="_blank" rel="noopener noreferrer" style={{ width: '100%', textAlign: 'center', fontSize: 12 }}><i className="fab fa-discord" style={{ marginRight: 6 }} />Join Discord</a>
                : null}
            </div>
          )}
        </div>
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

function RulesPage({ active, goPage, social, javaIp }: { active: boolean; goPage: (page: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  const [category, setCategory] = useState('All Rules');
  const [rules, setRules] = useState<import('../lib/types').Rule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    apiClient.getRules().then(setRules).finally(() => setLoading(false));
  }, [active]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rules) {
      const cat = r.category ?? 'General';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [rules]);

  const filtered = category === 'All Rules'
    ? rules
    : rules.filter(r => (r.category ?? 'General') === category);

  return (
    <div id="page-rules" className={`page ${active ? 'active' : ''}`}>
      <div className="rules-header" style={{ maxWidth: '100%' }}>
        <div style={{ maxWidth: 1260, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 180px', alignItems: 'start', gap: 40 }}>
          <div>
            <div className="eyebrow">Community Charter</div>
            <div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,40px)' }}>Server Rules & Fair Play</div>
            <p className="sec-desc" style={{ marginBottom: 20 }}>Friendly vibes keep AmzCraft thriving. Know the rules, play with honor, and keep the realm a place worth logging into.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-green"><span className="bdot" /> Pinned rules appear first</span>
              <span className="badge badge-grey"><i className="fas fa-folder" style={{ marginRight: 4 }} />Categories group everything else</span>
            </div>
          </div>
          <div className="news-mascot"><span className="mascot-icon">🤝</span><span className="mascot-txt">Buzzing with good vibes!</span></div>
        </div>
      </div>
      <div className="rules-body">
        <div className="rules-cats">
          <div className="rules-cats-title">Categories</div>
          <button className={`cat-btn ${category === 'All Rules' ? 'active' : ''}`} onClick={() => setCategory('All Rules')}>
            All Rules <span className="cat-count">{rules.length}</span>
          </button>
          {categories.map(([name, count]) => (
            <button className={`cat-btn ${category === name ? 'active' : ''}`} key={name} onClick={() => setCategory(name)}>
              {name} <span className="cat-count">{count}</span>
            </button>
          ))}
        </div>

        <div>
          {loading && (
            <div className="rule-card" style={{ textAlign: 'center', color: 'var(--grey)' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Loading rules…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rule-card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: .4 }}><i className="fas fa-scroll" /></div>
              <div className="rule-name">No rules published yet</div>
              <p className="rule-desc" style={{ marginTop: 8, marginBottom: 0 }}>Rules will appear here once they're added by staff.</p>
            </div>
          )}

          {!loading && filtered.map((rule, i) => (
            <div
              className="rule-card"
              key={rule.id}
              style={rule.is_pinned ? { borderColor: 'rgba(255,215,0,.25)' } : undefined}
            >
              <div className="rule-header">
                <div className="rule-name">
                  {rule.is_pinned && <i className="fas fa-thumbtack" style={{ color: '#ffd700', marginRight: 6, fontSize: 8 }} />}
                  {rule.title}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {rule.category && <span className="badge badge-grey">{rule.category}</span>}
                  {rule.is_pinned && <span className="badge badge-gold">Pinned</span>}
                </div>
              </div>
              <p className="rule-desc">{rule.content}</p>
              <span className="rule-num">Rule #{String(i + 1).padStart(3, '0')}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

type EventItem = {
  id: string; slug: string; title: string; description: string;
  featured_image_url?: string | null; start_at?: string | null; end_at?: string | null;
  location?: string | null; is_active: boolean; created_at: string;
};

function useCountdown(target: Date | null) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, past: false };
}

function eventStatus(ev: EventItem): 'live' | 'upcoming' | 'ended' {
  const now = Date.now();
  const start = ev.start_at ? new Date(ev.start_at).getTime() : null;
  const end = ev.end_at ? new Date(ev.end_at).getTime() : null;
  if (start && start > now) return 'upcoming';
  if (end && end < now) return 'ended';
  return 'live';
}

function fmt(dt: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!dt) return null;
  return new Date(dt).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

function EventCard({ ev, onClick }: { ev: EventItem; onClick: () => void }) {
  const st = eventStatus(ev);
  return (
    <div className="ev-card" onClick={onClick}>
      {ev.featured_image_url
        ? <img className="ev-card-img" src={ev.featured_image_url} alt={ev.title} />
        : <div className="ev-card-img ev-card-img-placeholder"><i className="fas fa-calendar-star" /></div>
      }
      <div className="ev-card-body">
        <div className="ev-card-badges">
          <span className={`ev-badge ev-badge-${st}`}>{st === 'live' ? '🔴 Live' : st === 'upcoming' ? '🟡 Upcoming' : '⚫ Ended'}</span>
          {ev.location && <span className="ev-badge ev-badge-loc"><i className="fas fa-location-dot" /> {ev.location}</span>}
        </div>
        <div className="ev-card-title">{ev.title}</div>
        <p className="ev-card-desc">{ev.description}</p>
        {(ev.start_at || ev.end_at) && (
          <div className="ev-card-dates">
            {ev.start_at && <span><i className="fas fa-calendar" /> {fmt(ev.start_at)}</span>}
            {ev.end_at && <span> – {fmt(ev.end_at)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function EventDetailModal({ ev, onClose }: { ev: EventItem; onClose: () => void }) {
  const st = eventStatus(ev);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div className="ev-overlay" onClick={onClose}>
      <div className="ev-modal" onClick={e => e.stopPropagation()}>
        <button className="ev-modal-close" onClick={onClose}><i className="fas fa-xmark" /></button>
        {ev.featured_image_url && <img className="ev-modal-img" src={ev.featured_image_url} alt={ev.title} />}
        <div className="ev-modal-body">
          <div className="ev-card-badges" style={{ marginBottom: 12 }}>
            <span className={`ev-badge ev-badge-${st}`}>{st === 'live' ? '🔴 Live' : st === 'upcoming' ? '🟡 Upcoming' : '⚫ Ended'}</span>
            {ev.location && <span className="ev-badge ev-badge-loc"><i className="fas fa-location-dot" /> {ev.location}</span>}
          </div>
          <div className="ev-modal-title">{ev.title}</div>
          {(ev.start_at || ev.end_at) && (
            <div className="ev-card-dates" style={{ marginBottom: 16 }}>
              {ev.start_at && <span><i className="fas fa-calendar" /> {fmt(ev.start_at, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>}
              {ev.end_at && <span> – {fmt(ev.end_at, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>}
            </div>
          )}
          <p className="ev-modal-desc">{ev.description}</p>
        </div>
      </div>
    </div>
  );
}

function EventsPage({ active, goPage, social, javaIp }: { active: boolean; goPage: (page: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  const [filter, setFilter] = useState('All');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EventItem | null>(null);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    apiClient.getEvents().then(data => setEvents(data as EventItem[])).finally(() => setLoading(false));
  }, [active]);

  const now = Date.now();
  const nextEvent = events
    .filter(ev => ev.start_at && new Date(ev.start_at).getTime() > now)
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime())[0] ?? null;
  const countdown = useCountdown(nextEvent?.start_at ? new Date(nextEvent.start_at) : null);

  const filtered = events.filter(ev => {
    if (filter === 'All') return true;
    const st = eventStatus(ev);
    if (filter === 'Live') return st === 'live';
    if (filter === 'Upcoming') return st === 'upcoming';
    return true;
  });

  const pad = (n: number) => String(n).padStart(2, '0');

  const downloadICS = async () => {
    try {
      const blob = await apiClient.downloadEventsCalendar();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'amzcraft-events.ics'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div id="page-events" className={`page ${active ? 'active' : ''}`}>
      {selected && <EventDetailModal ev={selected} onClose={() => setSelected(null)} />}
      <div className="events-header">
        <div style={{ maxWidth: 1260, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 40 }}>
          <div>
            <div className="eyebrow">Seasonal Happenings</div>
            <div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,40px)' }}>Events & Activities</div>
            <p className="sec-desc" style={{ marginBottom: 20 }}>Limited-time tournaments, quests, and server-wide celebrations. Subscribe to stay in sync.</p>
          </div>
          <div style={{ paddingTop: 40 }}>
            <button className="btn btn-ghost" onClick={downloadICS}><i className="fas fa-calendar-arrow-down" style={{ marginRight: 8 }} />Download ICS</button>
          </div>
        </div>
      </div>

      <div className="events-body">
        <div className="countdown-box">
          <div className="countdown-eyebrow">Next Major Event</div>
          {nextEvent
            ? <div className="countdown-title">{nextEvent.title}</div>
            : <div className="countdown-title">No Upcoming Event Scheduled</div>
          }
          <p className="countdown-sub">
            {nextEvent
              ? (nextEvent.start_at ? `Starts ${fmt(nextEvent.start_at, { weekday: 'long', month: 'long', day: 'numeric' })}` : '')
              : 'Check back soon — big things are brewing in the realm.'
            }
          </p>
          <div className="countdown-timer">
            {(['Days', 'Hours', 'Mins', 'Secs'] as const).map((label, index) => {
              const val = countdown && !countdown.past
                ? index === 0 ? countdown.d : index === 1 ? countdown.h : index === 2 ? countdown.m : countdown.s
                : 0;
              return (
                <span key={label} style={{ display: 'contents' }}>
                  <div className="timer-block"><span className="timer-num">{pad(val)}</span><span className="timer-lbl">{label}</span></div>
                  {index < 3 && <div className="timer-sep">:</div>}
                </span>
              );
            })}
          </div>
        </div>

        <div className="events-filter">
          <span className="events-filter-title">{filtered.length} Event{filtered.length !== 1 ? 's' : ''}</span>
          <div className="filter-tabs">
            {(['All', 'Live', 'Upcoming'] as const).map(item => (
              <button className={`filter-tab ${filter === item ? 'active' : ''}`} key={item} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
        </div>

        {loading && <div className="events-empty"><div className="events-empty-title">Loading events…</div></div>}

        {!loading && filtered.length === 0 && (
          <div className="events-empty">
            <span className="events-empty-icon"><i className="fas fa-calendar-xmark" style={{ opacity: .4 }} /></span>
            <div className="events-empty-title">{filter === 'All' ? 'No events published yet' : `No ${filter.toLowerCase()} events`}</div>
            <p className="events-empty-desc">Join the Discord to be the first to hear about upcoming tournaments, quests, and seasonal celebrations.</p>
            <br /><br />
            {social?.discord
              ? <a className="btn btn-discord" href={social.discord} target="_blank" rel="noopener noreferrer"><i className="fab fa-discord" style={{ marginRight: 8 }} />Join Discord for Updates</a>
              : <button className="btn btn-discord"><i className="fab fa-discord" style={{ marginRight: 8 }} />Join Discord for Updates</button>
            }
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="ev-grid">
            {filtered.map(ev => <EventCard key={ev.id} ev={ev} onClick={() => setSelected(ev)} />)}
          </div>
        )}
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

function RanksPage({ active, goPage, social, javaIp }: { active: boolean; goPage: (page: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  const features = [
    ['Custom nickname colors', '✓', '✓', '✓'],
    ['/sethome locations', '5', '15', '∞'],
    ['Priority queue access', '✓', '✓', '✓'],
    ['Monthly crate keys', '1', '3', '5 + quarterly drops'],
    ['Fly in lobby', '—', '✓', '✓'],
    ['Exclusive cosmetic kit', '—', '✓', '✓'],
    ['Private Discord channel', '—', '✓', '✓'],
    ['Custom join/leave message', '—', '—', '✓'],
    ['Legend particle effects', '—', '—', '✓'],
    ['Hall of Legends listing', '—', '—', '✓'],
    ['Staff-adjacent permissions', '—', '—', '✓'],
  ];
  return (
    <div id="page-ranks" className={`page ${active ? 'active' : ''}`}>
      <div className="ranks-page-header"><div style={{ maxWidth: 1260, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 200px', alignItems: 'start', gap: 40 }}><div><div className="eyebrow">Premium Ranks</div><div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,40px)' }}>Forge Your Legacy</div><p className="sec-desc" style={{ marginBottom: 0 }}>Choose a rank that matches your ambitions. Every tier unlocks a more powerful, more recognized version of you in the realm.</p></div><div style={{ paddingTop: 40 }}><div className="payment-badge"><div className="pay-label">Payment via</div><div className="pay-name">bKash</div><div className="pay-sub">Instant activation</div></div></div></div></div>
      <div className="ranks-page-body">
        <div className="compare-title">▶ Compare All Ranks</div><div className="sec-title" style={{ fontSize: 'clamp(18px,2vw,28px)', marginBottom: 28 }}>Side-by-Side Comparison</div>
        <div className="compare-table">
          <div className="cmp-header"><div className="cmp-col"><span style={{ fontSize: 12, color: 'var(--grey)' }}>Feature</span></div><div className="cmp-col"><div className="cmp-price pv">৳500</div><div className="cmp-tier-label">VIP · 30 Days</div></div><div className="cmp-col"><div className="cmp-price pp">৳1,000</div><div className="cmp-tier-label">Premium · 30 Days</div></div><div className="cmp-col"><div className="cmp-price pl">৳2,000</div><div className="cmp-tier-label">Legend · Lifetime</div></div></div>
          {features.map(([feature, vip, premium, legend]) => <div className="cmp-row" key={feature}><div className="cmp-feature">{feature}</div>{[vip, premium, legend].map((value, index) => <div className="cmp-val" key={`${feature}-${index}`}>{value === '✓' ? <span className="cmp-check">✓</span> : value === '—' ? <span className="cmp-dash">—</span> : value}</div>)}</div>)}
          <div className="cmp-btn-row"><div className="cmp-btn-cell" />{[0, 1, 2].map((item) => <div className="cmp-btn-cell" key={item}><button className="btn btn-gold btn-sm">Coming Soon</button></div>)}</div>
        </div>
        <div className="coming-banner"><span className="coming-icon">👑</span><div className="coming-title">Premium Ranks Will Be Coming Soon</div><p className="coming-sub">Exclusive premium tiers with powerful perks are on the way. Stay tuned!</p></div>
        <div className="eyebrow">Purchase Guide</div><div className="sec-title" style={{ fontSize: 'clamp(18px,2vw,28px)', marginBottom: 28 }}>How to Buy</div>
        <div className="how-grid">{[['1', 'Choose Your Rank', 'Pick the tier that suits your play style and click the bKash button.'], ['2', 'Pay via bKash', 'Complete the bKash payment and note your transaction ID for verification.'], ['3', 'Get Activated', 'Rank activates within 15 minutes. Use /rank in-game to confirm your new powers.']].map(([num, title, desc]) => <div className="how-card" key={num}><div className="how-num">{num}</div><div className="how-title">{title}</div><p className="how-desc">{desc}</p></div>)}</div>
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

type SortKey = 'position' | 'balance' | 'kills' | 'playtime' | 'votes';

function numericMeta(meta: Record<string, unknown> | undefined, ...keys: string[]): number {
  const raw = metaStat(meta, ...keys);
  if (raw === '—') return -1;
  return parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
}

function LeaderboardsPage({
  active, goPage, social, liveLeaderboard, voteMap, javaIp,
}: {
  active: boolean;
  goPage: (page: PageName) => void;
  social: SocialLinks | null;
  liveLeaderboard: LeaderboardEntry[];
  voteMap: Record<string, number>;
  javaIp?: string | null;
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(key === 'position' ? 1 : -1); }
  };

  const entries = liveLeaderboard
    .filter((e) => e.player.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === 'position') { av = a.position; bv = b.position; }
      else if (sortKey === 'balance') { av = numericMeta(a.metadata, 'balance', 'baltop', 'bal'); bv = numericMeta(b.metadata, 'balance', 'baltop', 'bal'); }
      else if (sortKey === 'kills') { av = numericMeta(a.metadata, 'kills', 'player_kills'); bv = numericMeta(b.metadata, 'kills', 'player_kills'); }
      else if (sortKey === 'playtime') { av = numericMeta(a.metadata, 'playtime', 'playtime_hours', 'hours'); bv = numericMeta(b.metadata, 'playtime', 'playtime_hours', 'hours'); }
      else if (sortKey === 'votes') { av = voteMap[a.player.toLowerCase()] ?? -1; bv = voteMap[b.player.toLowerCase()] ?? -1; }
      return (av - bv) * sortDir;
    });

  const SortHeader = ({ label, col, style }: { label: string; col: SortKey; style?: React.CSSProperties }) => (
    <button className={`lb-sort-btn${sortKey === col ? ' active' : ''}`} style={style} onClick={() => toggleSort(col)}>
      {label} {sortKey === col ? (sortDir === -1 ? '↓' : '↑') : ''}
    </button>
  );

  return (
    <div id="page-leaderboards" className={`page ${active ? 'active' : ''}`}>
      <div className="lb-page-header">
        <div style={{ maxWidth: 1260, margin: '0 auto' }}>
          <div className="eyebrow">Live Rankings</div>
          <div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,44px)' }}>Leaderboards</div>
          <p className="sec-desc" style={{ marginBottom: 0 }}>Rankings pulled live from the server — Balance · Kills · Playtime · Votes</p>
        </div>
      </div>
      <div className="lb-page-body">
        <div className="lb-meta">
          <div className="lb-season-title">Season 4 — Live Rankings</div>
          <span className="lb-updated">{liveLeaderboard.length > 0 ? `${liveLeaderboard.length} players ranked` : 'Loading…'}</span>
        </div>

        <input
          className="lb-search"
          type="text"
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="lb-table">
          <div className="lb-tabs">
            <button className="lb-tab active">Balance + Kills + Playtime + Votes</button>
          </div>
          <div className="lb-head2">
            <SortHeader label="#" col="position" />
            <span>Player</span>
            <SortHeader label="Balance" col="balance" style={{ justifyContent: 'flex-end' }} />
            <SortHeader label="Kills" col="kills" style={{ justifyContent: 'flex-end' }} />
            <SortHeader label="Playtime" col="playtime" style={{ justifyContent: 'flex-end' }} />
            <SortHeader label="Votes" col="votes" style={{ justifyContent: 'flex-end' }} />
          </div>

          {entries.length === 0 && (
            <div className="lb-empty">
              {liveLeaderboard.length === 0 ? 'Loading leaderboard data from server…' : 'No players match your search.'}
            </div>
          )}

          {entries.map((entry) => {
            const meta = entry.metadata;
            const prefix = playerPrefix(meta);
            const balance = metaStat(meta, 'balance', 'baltop', 'bal', 'money');
            const kills = metaStat(meta, 'kills', 'player_kills', 'pvp_kills');
            const playtime = metaStat(meta, 'playtime', 'playtime_hours', 'hours', 'time');
            const votesFromMap = voteMap[entry.player.toLowerCase()];
            const votes = votesFromMap != null ? String(votesFromMap) : metaStat(meta, 'votes', 'vote_count', 'monthly_votes', 'vote');

            return (
              <div className="lb-row2" key={entry.player}>
                <span className={lbRankClass(entry.position)}>
                  {lbRankIcon(entry.position)}
                  {entry.position}
                </span>
                <div className="lb-player">
                  {prefix && <span className="lb-prefix">{prefix}</span>}
                  <span className="lb-uname">{entry.player}</span>
                </div>
                <span className={balance === '—' ? 'lb-val-dim' : 'lb-val'}>
                  {balance !== '—' ? `$${Number(balance).toLocaleString()}` : '—'}
                </span>
                <span className={kills === '—' ? 'lb-val-dim' : 'lb-val'}>{kills}</span>
                <span className={playtime === '—' ? 'lb-val-dim' : 'lb-val'}>
                  {playtime !== '—' ? (playtime.endsWith('h') ? playtime : `${playtime}h`) : '—'}
                </span>
                <span className={votes === '—' ? 'lb-val-dim' : 'lb-val'}>{votes}</span>
              </div>
            );
          })}
        </div>
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

function VotePage({
  active, goPage, social, voteLinks, topVoters, javaIp,
}: {
  active: boolean;
  goPage: (page: PageName) => void;
  social: SocialLinks | null;
  voteLinks: VoteLink[];
  topVoters: TopVoters | null;
  javaIp?: string | null;
}) {
  const updatedLabel = topVoters?.updated_at
    ? `Updated ${new Date(topVoters.updated_at).toLocaleDateString()}`
    : 'Updating…';

  const voters = topVoters?.entries ?? [];

  return (
    <div id="page-vote" className={`page ${active ? 'active' : ''}`}>
      <div className="vote-header">
        <div style={{ maxWidth: 1260, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 40 }}>
          <div>
            <div className="eyebrow">Support the Realm</div>
            <div className="sec-title" style={{ fontSize: 'clamp(22px,3vw,40px)' }}>Vote for AmzCraft</div>
            <p className="sec-desc" style={{ marginBottom: 20 }}>Every vote powers the server and earns you in-game rewards. Vote daily for bonus streak rewards.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-green"><span className="bdot" /> Earn crate keys, coins & cosmetics</span>
              <span className="badge badge-grey"><i className="fas fa-rotate" style={{ marginRight: 4 }} />Vote daily for bonus streak</span>
            </div>
          </div>
          <div style={{ paddingTop: 40 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => goPage('home')}>← Back to Home</button>
          </div>
        </div>
      </div>

      <div className="vote-body">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Voting Partners</div>
        <div className="sec-title" style={{ fontSize: 'clamp(16px,2vw,24px)', marginBottom: 24 }}>Vote on These Sites</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18, marginBottom: 48 }}>
          {voteLinks.length > 0
            ? voteLinks.map((link) => {
                const domain = (() => { try { return new URL(link.url).hostname; } catch { return link.url; } })();
                return (
                  <div className="vote-site-card" key={link.id}>
                    <div className="vote-site-header">
                      <div className="vote-site-icon"><i className="fas fa-trophy" style={{ fontSize: 20 }} /></div>
                      <div>
                        <div className="vote-site-name">{link.title}</div>
                        <div className="vote-site-url">{domain}</div>
                      </div>
                    </div>
                    {link.description && <p className="vote-site-desc">{link.description}</p>}
                    {link.rewards.length > 0 && (
                      <div className="vote-reward-badge">
                        <strong>Rewards:</strong> {link.rewards.join(', ')}
                      </div>
                    )}
                    <a className="btn btn-primary btn-block" href={link.url} target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-arrow-up-right-from-square" /> {link.button_text}
                    </a>
                  </div>
                );
              })
            : (
              <>
                <div className="vote-site-card" style={{ opacity: 0.5 }}>
                  <div className="vote-site-header">
                    <div className="vote-site-icon"><i className="fas fa-globe" style={{ fontSize: 20 }} /></div>
                    <div><div className="vote-site-name">Loading…</div><div className="vote-site-url">—</div></div>
                  </div>
                </div>
                <div className="vote-site-card" style={{ opacity: 0.3 }}>
                  <div className="vote-site-header">
                    <div className="vote-site-icon"><i className="fas fa-globe" style={{ fontSize: 20 }} /></div>
                    <div><div className="vote-site-name">More Sites</div><div className="vote-site-url">Coming Soon</div></div>
                  </div>
                  <p className="vote-site-desc">Additional voting platforms will be added here.</p>
                  <button className="btn btn-ghost btn-block" disabled style={{ opacity: 0.5 }}>Coming Soon</button>
                </div>
              </>
            )
          }
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>What You Earn</div>
        <div className="sec-title" style={{ fontSize: 'clamp(16px,2vw,24px)', marginBottom: 24 }}>Vote Rewards</div>
        <div className="rewards-grid">
          {[
            ['fas fa-key', 'Vote Crate Keys', 'Unlock the exclusive Vote Crate for random cosmetics, coins, and rare enchantment books.'],
            ['fas fa-coins', 'In-Game Coins', 'Spend coins in the server marketplace for materials, perks, and seasonal items.'],
            ['fas fa-bolt', 'XP Boosters', 'Temporary boosts to XP gain, drop rates, and quest reward multipliers.'],
          ].map(([icon, title, desc]) => (
            <div className="reward-card" key={title}>
              <i className={`${icon} reward-icon`} />
              <div className="reward-name">{title}</div>
              <p className="reward-desc">{desc}</p>
            </div>
          ))}
        </div>

        <div className="voter-list" style={{ marginBottom: 28 }}>
          <div className="voter-list-header">
            <div className="voter-list-title"><i className="fas fa-trophy" style={{ marginRight: 8, color: 'var(--gold)' }} />Current Month Top Voters</div>
            <span className="voter-list-updated">{updatedLabel}</span>
          </div>
          {voters.length === 0 && (
            <div style={{ padding: '24px', color: 'var(--grey)', fontSize: 14, textAlign: 'center' }}>
              No voter data yet this month.
            </div>
          )}
          {voters.map((entry, index) => (
            <div className="voter-row" key={entry.player}>
              <div className="voter-left">
                <div className={`voter-rank-pill ${index === 0 ? 'v1' : ''}`}>#{entry.position}</div>
                <div>
                  <div className="voter-name">{entry.player}</div>
                  <div className="voter-role">Voting member</div>
                </div>
              </div>
              <span className="voter-votes">
                {(entry.metadata as Record<string, unknown>)?.votes_available === false
                  ? '— votes'
                  : `${entry.votes} ${entry.votes === 1 ? 'vote' : 'votes'}`}
              </span>
            </div>
          ))}
        </div>

        <div className="vote-info-grid">
          {[
            ['fas fa-computer-mouse', 'How to Vote', <>Click a voting site above. Enter your Minecraft username. Submit, then claim with <code>/rewards</code> in-game.</>],
            ['fas fa-trophy', 'Current Month Top', <>The voter list refreshes daily from <code>/vote Top Monthly</code>. Vote every day to climb the leaderboard.</>],
            ['fas fa-bullhorn', 'Share the Love', <>Voting helps new players discover AmzCraft. Invite friends and remind them to vote daily to grow our community.</>],
          ].map(([icon, title, desc]) => (
            <div className="vote-info-card" key={title as string}>
              <i className={`${icon as string} vi-icon`} />
              <div className="vi-title">{title}</div>
              <p className="vi-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

type ContactType = 'bug_report' | 'ban_appeal' | 'staff_application' | 'contact';

const CONTACT_TYPES: Array<{ value: ContactType; label: string; subject: string }> = [
  { value: 'bug_report',        label: 'Submit a Bug',  subject: 'Bug Report' },
  { value: 'ban_appeal',        label: 'Appeal',        subject: 'Ban Appeal' },
  { value: 'staff_application', label: 'Staff Apply',   subject: 'Staff Application' },
  { value: 'contact',           label: 'Help Center',   subject: 'General Help' },
];

function ContactPage({ active, goPage, social, javaIp }: { active: boolean; goPage: (p: PageName) => void; social: SocialLinks | null; javaIp?: string | null }) {
  const [type, setType] = useState<ContactType>('bug_report');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mcUsername, setMcUsername] = useState('');
  const [subject, setSubject] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleTypeChange = (v: ContactType) => {
    setType(v);
    const found = CONTACT_TYPES.find((t) => t.value === v);
    if (found) setSubject(found.subject);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await apiClient.submitContact({ request_type: type, name, email, minecraft_username: mcUsername || null, subject, message });
      setStatus('success');
      setName(''); setEmail(''); setMcUsername(''); setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div id="page-contact" className={`page ${active ? 'active' : ''}`}>
      <div className="contact-hero">
        <h1>Contact Us</h1>
        <p>Submit a bug report, appeal a ban, apply for staff, or get help — all in one place.</p>
      </div>
      <div className="contact-body">
        <div className="contact-tabs">
          {CONTACT_TYPES.map((t) => (
            <button
              key={t.value}
              className={`contact-tab${type === t.value ? ' active' : ''}`}
              onClick={() => handleTypeChange(t.value)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {status === 'success' ? (
          <div className="contact-success">
            <div className="contact-success-icon">✓</div>
            <h2>Message Sent!</h2>
            <p>We've received your {CONTACT_TYPES.find((t) => t.value === type)?.label.toLowerCase() ?? 'request'}. Our team will get back to you soon.</p>
            <button className="btn btn-primary" onClick={() => { setStatus('idle'); handleTypeChange(type); }}>Send Another</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={(e) => { void handleSubmit(e); }}>
            <div className="contact-form-row">
              <div className="contact-field">
                <label>Your Name</label>
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} />
              </div>
              <div className="contact-field">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="contact-form-row">
              <div className="contact-field">
                <label>Minecraft Username <span className="contact-optional">(optional)</span></label>
                <input type="text" placeholder="YourIGN" value={mcUsername} onChange={(e) => setMcUsername(e.target.value)} maxLength={32} />
              </div>
              <div className="contact-field">
                <label>Subject</label>
                <input type="text" placeholder="Brief subject line" value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={140} />
              </div>
            </div>
            <div className="contact-field">
              <label>Message</label>
              <textarea
                placeholder={
                  type === 'bug_report' ? 'Describe the bug, when it happened, and how to reproduce it…' :
                  type === 'ban_appeal' ? 'Explain why your ban should be lifted and any relevant context…' :
                  type === 'staff_application' ? 'Tell us about yourself, your experience, and why you want to join the team…' :
                  'Describe your question or issue in detail…'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={10}
                maxLength={5000}
                rows={7}
              />
              <div className="contact-char-count">{message.length} / 5000</div>
            </div>
            {status === 'error' && <div className="contact-error">{errorMsg}</div>}
            <div className="contact-form-footer">
              {social?.discord && (
                <span className="contact-alt">
                  Or reach us directly on{' '}
                  <a href={social.discord} target="_blank" rel="noopener noreferrer">Discord</a>
                </span>
              )}
              <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
      <Footer goPage={goPage} social={social} javaIp={javaIp} />
    </div>
  );
}

export default function FullSite({ page }: FullSiteProps) {
  const navigate = useNavigate();
  const active = cleanPage(page);
  const [scrolled, setScrolled] = useState(false);
  const { status, dashboard, activity, rankProducts, social, features, discord, voteMap, voteLinks, topVoters } = useHomepageData();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const goPage = (next: PageName) => navigate(pagePaths[next]);

  return (
    <>
      <Nav active={active} scrolled={scrolled} goPage={goPage} />
      <HomePage
        active={active === 'home'}
        goPage={goPage}
        status={status}
        dashboard={dashboard}
        activity={activity}
        rankProducts={rankProducts}
        social={social}
        features={features}
        discord={discord}
        voteMap={voteMap}
      />
      <NewsPage active={active === 'news'} goPage={goPage} social={social} javaIp={status?.java_ip} />
      <RulesPage active={active === 'rules'} goPage={goPage} social={social} javaIp={status?.java_ip} />
      <EventsPage active={active === 'events'} goPage={goPage} social={social} javaIp={status?.java_ip} />
      <RanksPage active={active === 'ranks'} goPage={goPage} social={social} javaIp={status?.java_ip} />
      <LeaderboardsPage
        active={active === 'leaderboards'}
        goPage={goPage}
        social={social}
        liveLeaderboard={dashboard?.live_leaderboard ?? []}
        voteMap={voteMap}
        javaIp={status?.java_ip}
      />
      <VotePage active={active === 'vote'} goPage={goPage} social={social} voteLinks={voteLinks} topVoters={topVoters} javaIp={status?.java_ip} />
      <ContactPage active={active === 'contact'} goPage={goPage} social={social} javaIp={status?.java_ip} />
    </>
  );
}
