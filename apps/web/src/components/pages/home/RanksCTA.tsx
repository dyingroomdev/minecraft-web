import { Link } from 'react-router-dom';
import { Crown, Star, Zap } from 'lucide-react';
import { Button } from '../../ui/button';

export function RanksCTA() {
  return (
    <section className="container mx-auto px-4">
      <div className="bg-gradient-to-r from-forest-800 to-forest-600 rounded-lg p-8 text-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Unlock Premium Ranks</h2>
          <p className="text-forest-100">
            Get exclusive perks, commands, and privileges with our premium ranks
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <Star className="h-12 w-12 text-lime-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">VIP</h3>
            <p className="text-forest-100 text-sm">
              Basic perks and commands for casual players
            </p>
          </div>
          
          <div className="text-center">
            <Zap className="h-12 w-12 text-lime-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Premium</h3>
            <p className="text-forest-100 text-sm">
              Enhanced features and exclusive access
            </p>
          </div>
          
          <div className="text-center">
            <Crown className="h-12 w-12 text-lime-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Legend</h3>
            <p className="text-forest-100 text-sm">
              Ultimate rank with all privileges
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <Link to="/ranks">
            <Button size="lg" className="bg-lime-500 hover:bg-lime-600 text-forest-900">
              View Ranks & Pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}