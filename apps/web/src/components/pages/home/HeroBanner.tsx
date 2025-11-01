import { Button } from '../../ui/button';

export function HeroBanner() {
  return (
    <section className="bg-gradient-to-r from-forest-900 to-forest-700 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Amaze Gaming × <span className="text-lime-400">AmzCraft</span>
        </h1>
        <p className="text-xl mb-8 text-forest-100">
          Experience the ultimate Minecraft adventure with our community
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-lime-500 hover:bg-lime-600 text-forest-900"
            onClick={() => window.open('https://discord.gg/amzcraft', '_blank')}
          >
            Join Discord
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-forest-900"
          >
            Play Now
          </Button>
        </div>
      </div>
    </section>
  );
}