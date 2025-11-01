import { HeroBanner } from './home/HeroBanner';
import { ServerOverview } from './home/ServerOverview';
import { NewsTeaser } from './home/NewsTeaser';
import { EventsTeaser } from './home/EventsTeaser';
import { RanksCTA } from './home/RanksCTA';

export function Home() {
  return (
    <div className="space-y-16">
      <HeroBanner />
      <ServerOverview />
      <NewsTeaser />
      <EventsTeaser />
      <RanksCTA />
    </div>
  );
}