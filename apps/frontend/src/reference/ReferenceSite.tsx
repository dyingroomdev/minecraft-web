import { useEffect, useMemo, useRef } from 'react';

import referenceDocument from './amzcraft-reference.html?raw';

const PAGE_PATHS: Record<string, string> = {
  home: '/',
  news: '/news',
  rules: '/rules',
  events: '/events',
  ranks: '/ranks',
  leaderboards: '/leaderboards',
  vote: '/vote',
  contact: '/contact',
};

const ICONS: Record<string, string> = {
  '1️⃣': 'fa-solid fa-1',
  '2️⃣': 'fa-solid fa-2',
  '3️⃣': 'fa-solid fa-3',
  '⚔️': 'fa-solid fa-khanda',
  '🛡️': 'fa-solid fa-shield-halved',
  '☁️': 'fa-solid fa-cloud',
  '🏗️': 'fa-solid fa-hammer',
  '🗺️': 'fa-solid fa-map',
  '⚔': 'fa-solid fa-khanda',
  '💬': 'fa-brands fa-discord',
  '🌐': 'fa-solid fa-globe',
  '🏰': 'fa-solid fa-chess-rook',
  '🦅': 'fa-solid fa-crow',
  '🏆': 'fa-solid fa-trophy',
  '🗝': 'fa-solid fa-key',
  '🏗': 'fa-solid fa-hammer',
  '🎮': 'fa-solid fa-gamepad',
  '🌲': 'fa-solid fa-tree',
  '☁': 'fa-solid fa-cloud',
  '🎨': 'fa-solid fa-palette',
  '✦': 'fa-solid fa-star',
  '🎯': 'fa-solid fa-bullseye',
  '📊': 'fa-solid fa-chart-column',
  '🛡': 'fa-solid fa-shield-halved',
  '💰': 'fa-solid fa-coins',
  '👥': 'fa-solid fa-users',
  '⚡': 'fa-solid fa-bolt',
  '📱': 'fa-solid fa-mobile-screen-button',
  '🥇': 'fa-solid fa-medal',
  '🥈': 'fa-solid fa-medal',
  '🥉': 'fa-solid fa-medal',
  '🐺': 'fa-solid fa-dog',
  '🔥': 'fa-solid fa-fire',
  '🌙': 'fa-solid fa-moon',
  '📷': 'fa-solid fa-camera',
  '⭐': 'fa-solid fa-star',
  '📰': 'fa-solid fa-newspaper',
  '📅': 'fa-solid fa-calendar-days',
  '🔍': 'fa-solid fa-magnifying-glass',
  '🐝': 'fa-solid fa-bug',
  '📌': 'fa-solid fa-thumbtack',
  '👤': 'fa-solid fa-user',
  '👁': 'fa-solid fa-eye',
  '📂': 'fa-solid fa-folder-open',
  '🤝': 'fa-solid fa-handshake',
  '🔧': 'fa-solid fa-wrench',
  '👮': 'fa-solid fa-user-shield',
  '🎉': 'fa-solid fa-champagne-glasses',
  '🔴': 'fa-solid fa-circle',
  '📍': 'fa-solid fa-location-dot',
  '🌿': 'fa-solid fa-leaf',
  '🌾': 'fa-solid fa-wheat-awn',
  '📖': 'fa-solid fa-book-open',
  '👑': 'fa-solid fa-crown',
  '🏹': 'fa-solid fa-crosshairs',
  '🎊': 'fa-solid fa-gift',
  '🎁': 'fa-solid fa-gift',
  '🎆': 'fa-solid fa-burst',
  '💳': 'fa-solid fa-credit-card',
  '💎': 'fa-solid fa-gem',
  '🌱': 'fa-solid fa-seedling',
  '🐲': 'fa-solid fa-dragon',
  '🌊': 'fa-solid fa-water',
  '🦊': 'fa-solid fa-paw',
  '🌪': 'fa-solid fa-tornado',
  '✨': 'fa-solid fa-wand-magic-sparkles',
  '🔗': 'fa-solid fa-link',
  '🗳': 'fa-solid fa-check-to-slot',
  '🖱': 'fa-solid fa-computer-mouse',
  '💌': 'fa-solid fa-envelope',
  '✔': 'fa-solid fa-check',
  '▶': 'fa-solid fa-play',
};

const ICON_COLORS: Record<string, string> = {
  '🥇': ' icon-gold',
  '🥈': ' icon-silver',
  '🥉': ' icon-bronze',
  '🔴': ' icon-live',
};

function iconMarkup(symbol: string) {
  const classes = ICONS[symbol];
  return classes
    ? `<i class="fa-icon ${classes}${ICON_COLORS[symbol] ?? ''}" aria-hidden="true"></i>`
    : symbol;
}

function replaceEmojiWithIcons(source: string) {
  return Object.keys(ICONS)
    .sort((left, right) => right.length - left.length)
    .reduce((html, symbol) => html.split(symbol).join(iconMarkup(symbol)), source);
}

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '');

type ServerStatus = {
  online: boolean;
  player_count: number;
  max_players: number;
  motd?: string | null;
  version?: string | null;
  last_poll_utc: string;
};

type LeaderboardEntry = {
  player: string;
  score: number | string;
  position: number;
  metadata?: Record<string, unknown>;
};

type MinecraftDashboard = {
  season_stats: Record<string, number>;
  leaderboard?: {
    entries: LeaderboardEntry[];
  } | null;
  live_leaderboard: LeaderboardEntry[];
  live_activity: Array<{
    type: 'join' | 'leave';
    player: string;
    occurred_at: string;
  }>;
  live_activity_source: string;
};

type Rule = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  display_order: number;
  is_pinned: boolean;
};

type Event = {
  slug: string;
  title: string;
  description: string;
  featured_image_url?: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  is_active: boolean;
};

type VoteLink = {
  title: string;
  description: string | null;
  url: string;
  button_text: string;
  rewards: string[];
};

type NewsPost = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  scheduled_publish_at?: string | null;
  cover_image_url?: string | null;
  is_pinned: boolean;
};

type DiscordWidget = {
  available: boolean;
  guild_id: string;
  name: string | null;
  member_count: number | null;
  presence_count: number | null;
  invite_url: string | null;
};

type SocialLinks = Record<
  'facebook' | 'twitter' | 'discord' | 'youtube' | 'tiktok' | 'instagram' | 'website',
  string | null
>;

function extractReferenceDocument() {
  const style = referenceDocument.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
  const body = referenceDocument.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? '';
  const iconStyle = style
    .replace(
      "content: '💬';",
      String.raw`content: '\f392'; font-family: 'Font Awesome 6 Brands';`,
    )
    .replace(
      "content: '✦';",
      String.raw`content: '\f005'; font-family: 'Font Awesome 6 Free'; font-weight: 900;`,
    );
  return {
    style: `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');\n${iconStyle}
      .reference-site { display: contents; }
      .fa-icon { display: inline-block; width: 1.1em; text-align: center; line-height: 1; }
      .eyebrow .fa-icon, .event-info-row .fa-icon, .news-meta .fa-icon, .news-item-meta .fa-icon { margin-right: 0.28em; }
      .icon-gold { color: #ffd700; }
      .icon-silver { color: #c0c7d1; }
      .icon-bronze { color: #cd7f32; }
      .icon-live { color: #ff4757; font-size: 0.72em; }
      .social-link .fa-icon { width: auto; }
    `,
    body: replaceEmojiWithIcons(body.replace(/<script>[\s\S]*?<\/script>/i, '')),
  };
}

function pageFromPath(pathname: string) {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment && PAGE_PATHS[segment] ? segment : 'home';
}

export default function ReferenceSite() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reference = useMemo(extractReferenceDocument, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const previousBodyBackground = document.body.style.background;
    const previousBodyHeight = document.body.style.height;
    const previousHtmlBackground = document.documentElement.style.background;
    const previousHtmlHeight = document.documentElement.style.height;
    const appRoot = document.getElementById('root');
    const previousRootBackground = appRoot?.style.background ?? '';
    const previousRootHeight = appRoot?.style.height ?? '';
    document.body.style.background = '#0a0a0f';
    document.body.style.height = 'auto';
    document.documentElement.style.background = '#0a0a0f';
    document.documentElement.style.height = 'auto';
    if (appRoot) {
      appRoot.style.background = '#0a0a0f';
      appRoot.style.height = 'auto';
    }

    let toastTimer = 0;
    let frame = 0;
    let countdownTarget: number | null = null;
    const cleanup: Array<() => void> = [];

    const activatePage = (id: string, updateHistory = true) => {
      const page = PAGE_PATHS[id] ? id : 'home';
      root.querySelectorAll('.page').forEach((element) => {
        element.classList.toggle('active', element.id === `page-${page}`);
      });
      root.querySelectorAll('.nav-links a').forEach((element) => {
        element.classList.toggle('active', element.id === `nav-${page}`);
      });
      if (updateHistory && window.location.pathname !== PAGE_PATHS[page]) {
        window.history.pushState({ page }, '', PAGE_PATHS[page]);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const showContact = (requestType = 'contact') => {
      activatePage('contact', false);
      const url = new URL('/contact', window.location.origin);
      url.searchParams.set('type', requestType);
      window.history.pushState({ page: 'contact' }, '', `${url.pathname}${url.search}`);
      const select = root.querySelector<HTMLSelectElement>('#contact-request-type');
      if (select) select.value = requestType;
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const copyIP = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      const toast = root.querySelector<HTMLElement>('#toast');
      if (!toast) return;
      toast.innerHTML = `<i class="fa-icon fa-solid fa-check" aria-hidden="true"></i> Copied: ${text}`;
      toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
    };

    Object.assign(window, { showPage: activatePage, showContact, copyIP });
    activatePage(pageFromPath(window.location.pathname), false);

    const handlePopState = () => activatePage(pageFromPath(window.location.pathname), false);
    window.addEventListener('popstate', handlePopState);
    cleanup.push(() => window.removeEventListener('popstate', handlePopState));

    // Mobile hamburger menu
    const hamburger = root.querySelector<HTMLButtonElement>('#nav-hamburger');
    const navLinks = root.querySelector<HTMLUListElement>('.nav-links');
    if (hamburger && navLinks) {
      const closeNav = () => {
        navLinks.classList.remove('open');
        hamburger.textContent = '☰';
        hamburger.setAttribute('aria-expanded', 'false');
      };
      const handleHamburger = () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.textContent = isOpen ? '✕' : '☰';
        hamburger.setAttribute('aria-expanded', String(isOpen));
      };
      hamburger.addEventListener('click', handleHamburger);
      cleanup.push(() => hamburger.removeEventListener('click', handleHamburger));

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeNav);
        cleanup.push(() => link.removeEventListener('click', closeNav));
      });
    }

    root.querySelectorAll<HTMLButtonElement>('.btn-login').forEach((button) => {
      const authenticated = Boolean(localStorage.getItem('access_token'));
      if (authenticated) button.textContent = 'Dashboard';
      const handleLogin = () => {
        window.location.href = authenticated ? '/dashboard' : '/login';
      };
      button.addEventListener('click', handleLogin);
      cleanup.push(() => button.removeEventListener('click', handleLogin));
    });

    root.querySelectorAll<HTMLElement>('.lb-tab').forEach((tab) => {
      const handleTab = () => {
        tab.parentElement?.querySelectorAll('.lb-tab').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');
      };
      tab.addEventListener('click', handleTab);
      cleanup.push(() => tab.removeEventListener('click', handleTab));
    });

    root.querySelectorAll<HTMLElement>('.rules-nav-item').forEach((item) => {
      const handleRule = () => {
        root.querySelectorAll('.rules-nav-item').forEach((navItem) => navItem.classList.remove('active'));
        item.classList.add('active');
      };
      item.addEventListener('click', handleRule);
      cleanup.push(() => item.removeEventListener('click', handleRule));
    });

    const canvas = root.querySelector<HTMLCanvasElement>('#particleCanvas');
    if (canvas) {
      const context = canvas.getContext('2d');
      const colors = ['rgba(0,230,118,', 'rgba(93,224,240,', 'rgba(255,215,0,'];
      let width = 0;
      let height = 0;
      type Particle = {
        x: number;
        y: number;
        size: number;
        speed: number;
        opacity: number;
        color: string;
        drift: number;
        life: number;
        maxLife: number;
      };
      let particles: Particle[] = [];

      const createParticle = (): Particle => ({
        x: Math.random() * width,
        y: height + 10,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.6 + 0.2,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: (Math.random() - 0.5) * 0.4,
        life: 0,
        maxLife: Math.random() * 300 + 200,
      });

      const resize = () => {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      };
      resize();
      particles = Array.from({ length: 40 }, () => {
        const particle = createParticle();
        particle.y = Math.random() * height;
        particle.life = Math.random() * particle.maxLife;
        return particle;
      });

      const draw = () => {
        if (!context) return;
        context.clearRect(0, 0, width, height);
        particles.forEach((particle, index) => {
          particle.y -= particle.speed;
          particle.x += particle.drift;
          particle.life += 1;
          const alpha = particle.opacity * Math.sin((particle.life / particle.maxLife) * Math.PI);
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fillStyle = `${particle.color}${alpha})`;
          context.fill();
          if (particle.life >= particle.maxLife || particle.y < -10) {
            particles[index] = createParticle();
          }
        });
        if (particles.length < 60) particles.push(createParticle());
        frame = window.requestAnimationFrame(draw);
      };

      window.addEventListener('resize', resize);
      cleanup.push(() => window.removeEventListener('resize', resize));
      draw();
    }

    const setText = (selector: string, value: string) => {
      const element = root.querySelector(selector);
      if (element) element.textContent = value;
    };

    const renderLeaderboards = (entries: LeaderboardEntry[]) => {
      const homeLeaderboard = root.querySelector('#home-leaderboard');
      const fullLeaderboard = root.querySelector('.lb-full');
      homeLeaderboard?.querySelectorAll('.lb-row').forEach((row) => row.remove());
      fullLeaderboard?.querySelectorAll('.lb-full-row').forEach((row) => row.remove());

      if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'lb-row';
        empty.style.display = 'block';
        empty.style.color = 'var(--text-muted)';
        empty.textContent = 'No synchronized leaderboard data yet.';
        homeLeaderboard?.append(empty);

        const fullEmpty = document.createElement('div');
        fullEmpty.className = 'lb-full-row';
        fullEmpty.style.display = 'block';
        fullEmpty.style.color = 'var(--text-muted)';
        fullEmpty.textContent = 'No synchronized leaderboard data yet.';
        fullLeaderboard?.append(fullEmpty);
        return;
      }

      entries.slice(0, 5).forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = 'lb-row';
        const rank = document.createElement('div');
        rank.className = `lb-rank${index < 3 ? ` r${index + 1}` : ''}`;
        rank.textContent = String(entry.position);
        const player = document.createElement('div');
        player.className = 'lb-player';
        const name = document.createElement('div');
        name.className = 'lb-name';
        name.textContent = entry.player;
        player.append(name);
        const score = document.createElement('div');
        score.className = 'lb-score';
        const numericScore = Number(entry.score);
        const isBalance = entry.metadata?.metric === 'balance';
        score.textContent = isBalance
          ? `$${Number.isFinite(numericScore) ? numericScore.toLocaleString(undefined, { maximumFractionDigits: 2 }) : entry.score}`
          : `${Number.isFinite(numericScore) ? numericScore.toLocaleString() : entry.score} pts`;
        const detail = document.createElement('div');
        detail.style.fontSize = '0.75rem';
        detail.style.color = 'var(--text-muted)';
        detail.textContent = isBalance
          ? `${String(entry.metadata?.playtime ?? '0h')} · ${String(entry.metadata?.kills ?? 0)} kills`
          : String(entry.metadata?.rank ?? '');
        row.append(rank, player, score, detail);
        homeLeaderboard?.append(row);
      });

      entries.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = `lb-full-row${index < 3 ? ` top${index + 1}` : ''}`;
        const values = [
          String(entry.position),
          entry.player,
          entry.metadata?.metric === 'balance'
            ? `$${Number(entry.score).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : String(entry.score),
          String(entry.metadata?.kills ?? '—'),
          String(entry.metadata?.playtime ?? '—'),
        ];
        values.forEach((value, column) => {
          const cell = document.createElement('div');
          cell.className = column === 1 ? 'lb-name' : column > 1 ? 'lb-stat-cell' : 'lb-rank';
          cell.textContent = value;
          row.append(cell);
        });
        fullLeaderboard?.append(row);
      });
    };

    const renderActivity = (events: MinecraftDashboard['live_activity']) => {
      const feed = root.querySelector('#liveFeed');
      if (!feed) return;
      feed.replaceChildren();

      if (events.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'feed-item';
        empty.innerHTML = '<i class="fa-icon fa-solid fa-clock" aria-hidden="true"></i> <span class="feed-action">No recent player activity.</span>';
        feed.append(empty);
        return;
      }

      events.slice(0, 5).forEach((event) => {
        const item = document.createElement('div');
        item.className = 'feed-item';
        const icon = document.createElement('i');
        icon.className = `fa-icon fa-solid ${event.type === 'join' ? 'fa-right-to-bracket' : 'fa-right-from-bracket'}`;
        icon.setAttribute('aria-hidden', 'true');
        const player = document.createElement('span');
        player.className = 'feed-name';
        player.textContent = event.player;
        const action = document.createElement('span');
        action.className = 'feed-action';
        action.textContent = event.type === 'join' ? ' joined the realm' : ' left the realm';
        const time = document.createElement('span');
        time.className = 'feed-time';
        time.textContent = new Date(event.occurred_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        item.append(icon, player, action, time);
        feed.append(item);
      });
    };

    const showLoading = (selector: string, message: string) => {
      const container = root.querySelector<HTMLElement>(selector);
      if (!container) return;
      container.replaceChildren();
      const loading = document.createElement('div');
      loading.style.color = 'var(--text-muted)';
      loading.textContent = message;
      container.append(loading);
    };

    const renderRules = (rules: Rule[]) => {
      const nav = root.querySelector<HTMLElement>('#dynamic-rules-nav');
      const content = root.querySelector<HTMLElement>('#dynamic-rules-content');
      if (!nav || !content) return;

      const categories = Array.from(
        new Set(rules.map((rule) => rule.category || 'General')),
      ).sort();

      const drawRules = (category: string | null) => {
        content.replaceChildren();
        const visible = category
          ? rules.filter((rule) => (rule.category || 'General') === category)
          : rules;
        if (visible.length === 0) {
          content.textContent = 'No rules have been published yet.';
          return;
        }
        visible.forEach((rule, index) => {
          const card = document.createElement('div');
          card.className = `rule-card${rule.is_pinned ? ' pinned' : ''}`;
          const header = document.createElement('div');
          header.className = 'rule-header';
          const title = document.createElement('div');
          title.className = 'rule-title';
          title.textContent = rule.title;
          const tag = document.createElement('span');
          tag.className = 'cat-tag';
          tag.textContent = rule.category || 'General';
          header.append(title, tag);
          const body = document.createElement('div');
          body.className = 'rule-body';
          body.textContent = rule.content;
          const number = document.createElement('div');
          number.className = 'rule-num';
          number.textContent = `Rule #${String(rule.display_order || index + 1).padStart(3, '0')}`;
          card.append(header, body, number);
          content.append(card);
        });
      };

      nav.replaceChildren();
      const heading = document.createElement('div');
      heading.className = 'rules-nav-title';
      heading.textContent = 'Categories';
      nav.append(heading);

      const addFilter = (label: string, category: string | null, count: number) => {
        const item = document.createElement('div');
        item.className = `rules-nav-item${category === null ? ' active' : ''}`;
        item.append(document.createTextNode(label));
        const badge = document.createElement('span');
        badge.className = 'rules-nav-count';
        badge.textContent = String(count);
        item.append(badge);
        item.addEventListener('click', () => {
          nav.querySelectorAll('.rules-nav-item').forEach((entry) => entry.classList.remove('active'));
          item.classList.add('active');
          drawRules(category);
        });
        nav.append(item);
      };

      addFilter('All Rules ', null, rules.length);
      categories.forEach((category) => {
        addFilter(
          `${category} `,
          category,
          rules.filter((rule) => (rule.category || 'General') === category).length,
        );
      });
      drawRules(null);
    };

    const renderEvents = (events: Event[]) => {
      const grid = root.querySelector<HTMLElement>('#dynamic-events-grid');
      if (!grid) return;
      grid.replaceChildren();
      const now = Date.now();
      const sorted = [...events].sort((left, right) => {
        return new Date(left.start_at || 0).getTime() - new Date(right.start_at || 0).getTime();
      });
      const nextEvent = sorted.find((event) => event.start_at && new Date(event.start_at).getTime() > now);
      countdownTarget = nextEvent?.start_at ? new Date(nextEvent.start_at).getTime() : null;
      setText('#next-event-title', nextEvent?.title || 'No upcoming event scheduled');
      setText(
        '#next-event-date',
        nextEvent?.start_at ? new Date(nextEvent.start_at).toLocaleString() : 'Check back soon.',
      );

      if (sorted.length === 0) {
        grid.textContent = 'No events have been published yet.';
        return;
      }

      sorted.forEach((event) => {
        const start = event.start_at ? new Date(event.start_at) : null;
        const end = event.end_at ? new Date(event.end_at) : null;
        const live = event.is_active || Boolean(start && start.getTime() <= now && (!end || end.getTime() >= now));
        const card = document.createElement('div');
        card.className = 'event-card';
        const banner = document.createElement('div');
        banner.className = 'event-banner community';
        if (event.featured_image_url) {
          banner.style.backgroundImage = `url("${event.featured_image_url}")`;
          banner.style.backgroundSize = 'cover';
          banner.style.backgroundPosition = 'center';
        }
        const status = document.createElement('div');
        status.className = `event-status-badge ${live ? 'live' : 'upcoming'}`;
        status.textContent = live ? 'Live' : 'Upcoming';
        banner.append(status);
        const body = document.createElement('div');
        body.className = 'event-body';
        const type = document.createElement('div');
        type.className = 'event-type';
        type.textContent = live ? 'Active Event' : 'Scheduled Event';
        const name = document.createElement('div');
        name.className = 'event-name';
        name.textContent = event.title;
        const description = document.createElement('div');
        description.className = 'event-desc';
        description.textContent = event.description;
        const info = document.createElement('div');
        info.className = 'event-info';
        if (start) {
          const date = document.createElement('div');
          date.className = 'event-info-row';
          date.textContent = end
            ? `${start.toLocaleString()} - ${end.toLocaleString()}`
            : start.toLocaleString();
          info.append(date);
        }
        if (event.location) {
          const location = document.createElement('div');
          location.className = 'event-info-row';
          location.textContent = event.location;
          info.append(location);
        }
        body.append(type, name, description, info);
        card.append(banner, body);
        grid.append(card);
      });
    };

    const renderNews = (posts: NewsPost[]) => {
      const main = root.querySelector<HTMLElement>('#dynamic-news-main');
      const trending = root.querySelector<HTMLElement>('#dynamic-news-trending');
      const archive = root.querySelector<HTMLElement>('#dynamic-news-archive');
      if (!main || !trending || !archive) return;

      const searchInput = root.querySelector<HTMLInputElement>('#news-search-input');
      const resolveMediaUrl = (value?: string | null) => {
        if (!value) return '';
        if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
        return `${API_BASE}${value.startsWith('/') ? value : `/${value}`}`;
      };
      const postDate = (post: NewsPost) => post.published_at ?? post.scheduled_publish_at ?? '';
      const formatDate = (post: NewsPost) => {
        const date = new Date(postDate(post));
        return Number.isNaN(date.getTime())
          ? 'Unscheduled'
          : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      };
      const sorted = [...posts].sort((left, right) => {
        if (left.is_pinned !== right.is_pinned) return Number(right.is_pinned) - Number(left.is_pinned);
        return new Date(postDate(right)).getTime() - new Date(postDate(left)).getTime();
      });

      const createCategory = (text: string, tone: 'patch' | 'event' | 'update' | 'community') => {
        const category = document.createElement('span');
        category.className = `news-cat ${tone}`;
        category.textContent = text;
        return category;
      };

      const createMeta = (post: NewsPost, compact = false) => {
        const meta = document.createElement('div');
        meta.className = compact ? 'news-item-meta' : 'news-meta';
        const date = document.createElement('span');
        date.innerHTML = `<i class="fa-icon fa-solid fa-calendar-days" aria-hidden="true"></i> ${formatDate(post)}`;
        meta.append(date);
        return meta;
      };

      const createRegularPost = (post: NewsPost) => {
        const item = document.createElement('a');
        item.className = 'news-item';
        item.href = `/news/${encodeURIComponent(post.slug)}`;
        item.style.display = 'block';
        item.style.color = 'inherit';
        item.style.textDecoration = 'none';
        item.append(createCategory(post.is_pinned ? 'Pinned' : 'News', post.is_pinned ? 'event' : 'update'));
        const title = document.createElement('div');
        title.className = 'news-item-title';
        title.textContent = post.title;
        item.append(title, createMeta(post, true));
        return item;
      };

      const draw = (query = '') => {
        const needle = query.trim().toLowerCase();
        const visible = needle
          ? sorted.filter((post) =>
              post.title.toLowerCase().includes(needle) ||
              post.summary?.toLowerCase().includes(needle),
            )
          : sorted;
        main.replaceChildren();
        trending.replaceChildren();
        archive.replaceChildren();

        if (visible.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'news-item';
          empty.textContent = needle ? 'No news posts match your search.' : 'No news posts have been published yet.';
          main.append(empty);
          return;
        }

        const featured = visible.filter((post) => post.is_pinned);
        const featuredPosts = featured.length > 0 ? featured : visible.slice(0, 1);
        featuredPosts.forEach((post) => {
          const tag = document.createElement('div');
          tag.style.marginBottom = '.5rem';
          const pinned = document.createElement('div');
          pinned.className = 'pinned-tag';
          pinned.innerHTML = '<i class="fa-icon fa-solid fa-thumbtack" aria-hidden="true"></i> Featured';
          tag.append(pinned);

          const card = document.createElement('a');
          card.className = 'news-featured';
          card.href = `/news/${encodeURIComponent(post.slug)}`;
          card.style.color = 'inherit';
          card.style.textDecoration = 'none';
          card.style.marginBottom = '1.5rem';
          const image = document.createElement('div');
          image.className = 'news-featured-img';
          const imageUrl = resolveMediaUrl(post.cover_image_url);
          if (imageUrl) {
            image.style.backgroundImage = `url("${imageUrl}")`;
            image.style.backgroundPosition = 'center';
            image.style.backgroundSize = 'cover';
          } else {
            image.innerHTML = '<i class="fa-icon fa-solid fa-newspaper" aria-hidden="true"></i>';
          }
          const body = document.createElement('div');
          body.className = 'news-featured-body';
          body.append(createCategory(post.is_pinned ? 'Pinned' : 'Latest', post.is_pinned ? 'event' : 'patch'));
          const title = document.createElement('div');
          title.className = 'news-title-big';
          title.textContent = post.title;
          const excerpt = document.createElement('p');
          excerpt.className = 'news-excerpt';
          excerpt.textContent = post.summary || 'Open this post to read the full announcement.';
          body.append(title, excerpt, createMeta(post));
          card.append(image, body);
          main.append(tag, card);
        });

        const featuredIds = new Set(featuredPosts.map((post) => post.id));
        const regular = visible.filter((post) => !featuredIds.has(post.id));
        const groups = new Map<string, NewsPost[]>();
        regular.forEach((post) => {
          const date = new Date(postDate(post));
          const key = Number.isNaN(date.getTime())
            ? 'Unscheduled'
            : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
          groups.set(key, [...(groups.get(key) ?? []), post]);
        });
        groups.forEach((groupPosts, label) => {
          const section = document.createElement('div');
          section.style.marginTop = '2rem';
          const heading = document.createElement('div');
          heading.style.cssText = "font-family:'Cinzel',serif;font-size:.85rem;font-weight:700;color:var(--text-muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem";
          heading.innerHTML = `<span style="height:1px;flex:1;background:var(--border)"></span>${label}<span style="height:1px;flex:1;background:var(--border)"></span>`;
          const list = document.createElement('div');
          list.style.cssText = 'display:flex;flex-direction:column;gap:.875rem';
          groupPosts.forEach((post) => list.append(createRegularPost(post)));
          section.append(heading, list);
          main.append(section);
        });

        visible.slice(0, 3).forEach((post) => trending.append(createRegularPost(post)));
        const archiveCounts = new Map<string, number>();
        sorted.forEach((post) => {
          const date = new Date(postDate(post));
          const label = Number.isNaN(date.getTime())
            ? 'Unscheduled'
            : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
          archiveCounts.set(label, (archiveCounts.get(label) ?? 0) + 1);
        });
        archiveCounts.forEach((count, label) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:.6rem .75rem;border-radius:6px';
          const name = document.createElement('span');
          name.style.cssText = 'font-size:.875rem;color:var(--text-secondary)';
          name.textContent = label;
          const badge = document.createElement('span');
          badge.style.cssText = 'font-size:.75rem;color:var(--text-muted);background:var(--surface);padding:.1rem .4rem;border-radius:4px';
          badge.textContent = String(count);
          row.append(name, badge);
          archive.append(row);
        });
      };

      draw();
      const handleSearch = () => draw(searchInput?.value ?? '');
      searchInput?.addEventListener('input', handleSearch);
      cleanup.push(() => searchInput?.removeEventListener('input', handleSearch));
    };

    const renderVotes = (votes: VoteLink[]) => {
      const container = root.querySelector<HTMLElement>('#dynamic-vote-sites');
      if (!container) return;
      container.replaceChildren();
      if (votes.length === 0) {
        container.textContent = 'No voting sites have been published yet.';
        return;
      }
      votes.forEach((vote) => {
        const card = document.createElement('div');
        card.className = 'vote-site-card';
        const header = document.createElement('div');
        header.className = 'vote-site-header';
        const icon = document.createElement('div');
        icon.className = 'vote-site-icon';
        icon.innerHTML = '<i class="fa-solid fa-check-to-slot" aria-hidden="true"></i>';
        const details = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'vote-site-name';
        name.textContent = vote.title;
        const domain = document.createElement('div');
        domain.className = 'vote-site-domain';
        try {
          domain.textContent = new URL(vote.url).hostname;
        } catch {
          domain.textContent = vote.url;
        }
        details.append(name, domain);
        header.append(icon, details);
        const description = document.createElement('div');
        description.className = 'vote-cooldown';
        description.textContent = vote.description || 'Support AmzCraft by voting on this server list.';
        const rewards = document.createElement('div');
        rewards.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0.6rem;font-size:0.8rem;color:var(--text-secondary);';
        rewards.textContent = vote.rewards.length > 0 ? `Rewards: ${vote.rewards.join(' + ')}` : 'Vote rewards apply in-game.';
        const link = document.createElement('a');
        link.className = 'btn-vote';
        link.href = vote.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = vote.button_text || 'Vote Now';
        card.append(header, description, rewards, link);
        container.append(card);
      });
    };

    const renderSocialLinks = (links: SocialLinks) => {
      const platforms = [
        ['facebook', 'fa-brands fa-facebook-f', 'Facebook'],
        ['twitter', 'fa-brands fa-x-twitter', 'X'],
        ['discord', 'fa-brands fa-discord', 'Discord'],
        ['youtube', 'fa-brands fa-youtube', 'YouTube'],
        ['tiktok', 'fa-brands fa-tiktok', 'TikTok'],
        ['instagram', 'fa-brands fa-instagram', 'Instagram'],
        ['website', 'fa-solid fa-globe', 'Website'],
      ] as const;

      root.querySelectorAll<HTMLElement>('.social-links').forEach((container) => {
        container.replaceChildren();
        platforms.forEach(([platform, icon, label]) => {
          const url = links[platform];
          if (!url) return;
          const anchor = document.createElement('a');
          anchor.className = 'social-link';
          anchor.href = url;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.title = label;
          anchor.setAttribute('aria-label', label);
          anchor.innerHTML = `<i class="fa-icon ${icon}" aria-hidden="true"></i>`;
          container.append(anchor);
        });
      });

      root.querySelectorAll<HTMLAnchorElement>('[data-social-platform]').forEach((anchor) => {
        const platform = anchor.dataset.socialPlatform as keyof SocialLinks | undefined;
        const url = platform ? links[platform] : null;
        if (url) {
          anchor.href = url;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
        } else {
          anchor.hidden = true;
        }
      });

      const discordJoinLink = root.querySelector<HTMLAnchorElement>('#discord-join-link');
      if (discordJoinLink && links.discord && !discordJoinLink.dataset.widgetInvite) {
        discordJoinLink.href = links.discord;
      }
    };

    const loadDiscordWidget = async () => {
      const count = root.querySelector<HTMLElement>('#discord-member-count');
      const joinLink = root.querySelector<HTMLAnchorElement>('#discord-join-link');
      try {
        const response = await fetch(`${API_BASE}/api/discord/widget`);
        if (!response.ok) throw new Error('Discord widget request failed');
        const widget = await response.json() as DiscordWidget;
        if (widget.invite_url && joinLink) {
          joinLink.href = widget.invite_url;
          joinLink.dataset.widgetInvite = 'true';
        }
        if (!count) return;
        if (widget.available && widget.member_count !== null) {
          const members = widget.member_count.toLocaleString();
          const online = widget.presence_count !== null
            ? `${widget.presence_count.toLocaleString()} online right now`
            : 'live community';
          count.innerHTML = `<span>${members} members</span> · ${online}`;
        } else {
          count.innerHTML = '<span>Join our community</span> · Discord guild 1118248694236590131';
        }
      } catch {
        if (count) count.innerHTML = '<span>Join our community</span> · Connect with AmzCraft players';
      }
    };

    const loadPublicContent = async () => {
      showLoading('#dynamic-rules-content', 'Loading rules...');
      showLoading('#dynamic-events-grid', 'Loading events...');
      showLoading('#dynamic-vote-sites', 'Loading voting sites...');
      try {
        const [rulesResponse, eventsResponse, votesResponse] = await Promise.all([
          fetch(`${API_BASE}/api/rules`),
          fetch(`${API_BASE}/api/events`),
          fetch(`${API_BASE}/api/votes`),
        ]);
        if (!rulesResponse.ok || !eventsResponse.ok || !votesResponse.ok) {
          throw new Error('Public content request failed');
        }
        const [rules, events, votes] = await Promise.all([
          rulesResponse.json() as Promise<Rule[]>,
          eventsResponse.json() as Promise<Event[]>,
          votesResponse.json() as Promise<VoteLink[]>,
        ]);
        renderRules(rules);
        renderEvents(events);
        renderVotes(votes);
      } catch {
        showLoading('#dynamic-rules-content', 'Unable to load rules.');
        showLoading('#dynamic-events-grid', 'Unable to load events.');
        showLoading('#dynamic-vote-sites', 'Unable to load voting sites.');
      }
    };

    const loadNews = async () => {
      showLoading('#dynamic-news-main', 'Loading news...');
      try {
        const response = await fetch(`${API_BASE}/api/news`);
        if (!response.ok) throw new Error('News request failed');
        renderNews(await response.json() as NewsPost[]);
      } catch {
        showLoading('#dynamic-news-main', 'Unable to load news.');
        showLoading('#dynamic-news-trending', '');
        showLoading('#dynamic-news-archive', '');
      }
    };

    const loadSocialLinks = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/social`);
        if (!response.ok) throw new Error('Social links request failed');
        renderSocialLinks(await response.json() as SocialLinks);
      } catch {
        root.querySelectorAll<HTMLElement>('.social-links').forEach((container) => {
          container.replaceChildren();
        });
      }
    };

    root.querySelectorAll('.footer-copy').forEach((element) => {
      element.textContent = '© 2026 Amaze Gaming × AmzCraft. All rights reserved.';
    });

    const contactForm = root.querySelector<HTMLFormElement>('#contact-form');
    const requestType = new URLSearchParams(window.location.search).get('type');
    const requestTypeSelect = root.querySelector<HTMLSelectElement>('#contact-request-type');
    if (
      requestTypeSelect
      && requestType
      && ['ban_appeal', 'bug_report', 'staff_application', 'contact'].includes(requestType)
    ) {
      requestTypeSelect.value = requestType;
    }
    if (contactForm) {
      const handleContactSubmit = async (event: SubmitEvent) => {
        event.preventDefault();
        const submitButton = contactForm.querySelector<HTMLButtonElement>('button[type="submit"]');
        const feedback = root.querySelector<HTMLElement>('#contact-form-feedback');
        const formData = new FormData(contactForm);
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Sending...';
        }
        if (feedback) {
          feedback.className = 'contact-feedback';
          feedback.textContent = '';
        }
        try {
          const response = await fetch(`${API_BASE}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              request_type: formData.get('request_type'),
              name: formData.get('name'),
              email: formData.get('email'),
              minecraft_username: formData.get('minecraft_username') || null,
              subject: formData.get('subject'),
              message: formData.get('message'),
            }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
            throw new Error(
              typeof payload?.detail === 'string' ? payload.detail : 'Unable to send your request.',
            );
          }
          contactForm.reset();
          if (requestTypeSelect) requestTypeSelect.value = 'contact';
          if (feedback) {
            feedback.className = 'contact-feedback success';
            feedback.textContent = 'Request submitted. Our team will reply using the email you provided.';
          }
        } catch (error) {
          if (feedback) {
            feedback.className = 'contact-feedback error';
            feedback.textContent = error instanceof Error ? error.message : 'Unable to send your request.';
          }
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
          }
        }
      };
      contactForm.addEventListener('submit', handleContactSubmit);
      cleanup.push(() => contactForm.removeEventListener('submit', handleContactSubmit));
    }

    renderLeaderboards([]);
    renderActivity([]);
    void loadPublicContent();
    void loadNews();
    void loadSocialLinks();
    void loadDiscordWidget();

    const loadServerStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/status`);
        if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
        const status = await response.json() as ServerStatus;
        const maximum = status.max_players || 100;
        setText('#stat-players', String(status.player_count));
        setText(
          '#survival-player-count',
          `${status.player_count} ${status.player_count === 1 ? 'player' : 'players'} online`,
        );
        setText('#server-player-count', `${status.player_count} / ${maximum}`);
        setText('#server-status-pill', status.online ? 'Online' : 'Offline');
        setText('#server-motd', status.motd || 'AmzCraft Minecraft Server');
        setText('#server-version', `Version: ${status.version || 'unknown'}`);
        setText('#server-last-polled', `Last polled: ${new Date(status.last_poll_utc).toLocaleTimeString()}`);
        const bar = root.querySelector<HTMLElement>('#server-player-bar');
        if (bar) bar.style.width = `${Math.min(100, (status.player_count / maximum) * 100)}%`;
      } catch {
        setText('#server-status-pill', 'Unavailable');
        setText('#survival-player-count', 'Status unavailable');
        setText('#server-motd', 'Unable to reach the website API.');
      }
    };

    const loadMinecraftDashboard = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/minecraft/dashboard`);
        if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
        const dashboard = await response.json() as MinecraftDashboard;
        root.querySelectorAll<HTMLElement>('[data-minecraft-stat]').forEach((element) => {
          const key = element.dataset.minecraftStat;
          const value = key ? dashboard.season_stats[key] : undefined;
          const suffix = element.dataset.suffix ?? '';
          element.textContent = typeof value === 'number' ? `${value.toLocaleString()}${suffix}` : '—';
        });
        setText('#live-feed-source', dashboard.live_activity_source === 'rcon' ? 'live' : 'unavailable');
        renderActivity(dashboard.live_activity);

        renderLeaderboards(dashboard.leaderboard?.entries ?? dashboard.live_leaderboard);
      } catch {
        root.querySelectorAll<HTMLElement>('[data-minecraft-stat]').forEach((element) => {
          element.textContent = 'Unavailable';
        });
        renderLeaderboards([]);
        setText('#live-feed-source', 'unavailable');
      }
    };

    void loadServerStatus();
    void loadMinecraftDashboard();
    const statusInterval = window.setInterval(loadServerStatus, 15000);
    const dashboardInterval = window.setInterval(loadMinecraftDashboard, 15000);

    const countdownInterval = window.setInterval(() => {
      const difference = Math.max(0, (countdownTarget ?? Date.now()) - Date.now());
      const values = {
        'cd-days': Math.floor(difference / 86400000),
        'cd-hours': Math.floor((difference % 86400000) / 3600000),
        'cd-mins': Math.floor((difference % 3600000) / 60000),
        'cd-secs': Math.floor((difference % 60000) / 1000),
      };
      Object.entries(values).forEach(([id, value]) => {
        const element = root.querySelector(`#${id}`);
        if (element) element.textContent = String(value).padStart(2, '0');
      });
    }, 1000);

    const calendarButton = root.querySelector<HTMLButtonElement>('#download-events-calendar');
    if (calendarButton) {
      const downloadCalendar = () => {
        window.location.href = `${API_BASE}/api/events/calendar.ics`;
      };
      calendarButton.addEventListener('click', downloadCalendar);
      cleanup.push(() => calendarButton.removeEventListener('click', downloadCalendar));
    }

    cleanup.push(
      () => window.clearInterval(statusInterval),
      () => window.clearInterval(dashboardInterval),
      () => window.clearInterval(countdownInterval),
      () => window.clearTimeout(toastTimer),
      () => window.cancelAnimationFrame(frame),
    );

    return () => {
      cleanup.forEach((dispose) => dispose());
      document.body.style.background = previousBodyBackground;
      document.body.style.height = previousBodyHeight;
      document.documentElement.style.background = previousHtmlBackground;
      document.documentElement.style.height = previousHtmlHeight;
      if (appRoot) {
        appRoot.style.background = previousRootBackground;
        appRoot.style.height = previousRootHeight;
      }
      delete (window as Window & { showPage?: unknown }).showPage;
      delete (window as Window & { showContact?: unknown }).showContact;
      delete (window as Window & { copyIP?: unknown }).copyIP;
    };
  }, []);

  return (
    <>
      <style>{reference.style}</style>
      <div
        ref={rootRef}
        className="reference-site"
        dangerouslySetInnerHTML={{ __html: reference.body }}
      />
    </>
  );
}
