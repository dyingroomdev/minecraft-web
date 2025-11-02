import { HeroBanner } from './home/HeroBanner';
import { ServerOverview } from './home/ServerOverview';
import { NewsTeaser } from './home/NewsTeaser';
import { EventsTeaser } from './home/EventsTeaser';
import { RanksCTA } from './home/RanksCTA';
import { SocialBar } from './home/SocialBar';
import { ServerFeatures } from './home/ServerFeatures';

export function Home() {
  return (
    <div className="space-y-16">
      <HeroBanner />
      <ServerOverview />
      <ServerFeatures />
      <NewsTeaser />
      <EventsTeaser />
      <RanksCTA />
      <SocialBar />
    </div>
  );
}
