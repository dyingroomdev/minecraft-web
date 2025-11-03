export type HeroSlide = { title:string; subtitle?:string; imageUrl:string; ctaText?:string; ctaUrl?:string; order:number };
export type ServerStatus = {
  online:boolean; player_count:number; motd?:string; version?:string; uptime?:string;
  metadata?: { java_ip?:string; bedrock_ip?:string; region?:string }
};
export type VoteLink = { id:string; title:string; description?:string; url:string; button_text:string; rewards:string[]; display_order:number; is_active:boolean };
export type Feature = { title:string; description:string; icon?:string; order:number };
export type Product = { code:string; name:string; price_bdt?:number; duration_days?:number; description?:string };
export type NewsItem = { slug:string; title:string; summary:string; pinned?:boolean; published_at:string };

const j = <T>(r:Response) => r.ok ? r.json() as Promise<T> : Promise.reject(new Error(r.statusText));

export const api = {
  hero: () => fetch("/api/hero-slides").then(j<HeroSlide[]>) ,
  status: () => fetch("/api/status").then(j<ServerStatus>),
  votes: () => fetch("/api/votes").then(j<VoteLink[]>) ,
  features: () => fetch("/api/features").then(j<Feature[]>) ,
  products: () => fetch("/api/payments/products").then(j<Product[]>) ,
  news: () => fetch("/api/news?limit=6").then(j<NewsItem[]>) ,
};

export function connectStatusWS(onMsg:(s:ServerStatus)=>void) {
  const ws = new WebSocket(`${location.protocol==="https:"?"wss":"ws"}://${location.host}/ws/status`);
  ws.onmessage = (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      if (payload?.type === "server_status") onMsg(payload);
    } catch {}
  };
  return ws;
}