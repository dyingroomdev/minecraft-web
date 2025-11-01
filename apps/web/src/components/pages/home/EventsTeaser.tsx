import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { apiClient } from '../../../lib/api';

export function EventsTeaser() {
  const { data: events } = useQuery({
    queryKey: ['active-events'],
    queryFn: () => apiClient.getActiveEvents(),
  });

  if (!events?.length) return null;

  return (
    <section className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Active Events</h2>
        <Link to="/events">
          <Button variant="outline">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className="bg-card rounded-lg border p-6"
          >
            <h3 className="font-semibold mb-2">{event.title}</h3>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
              {event.description}
            </p>
            
            <div className="space-y-2 text-sm">
              {event.start_at && (
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.start_at).toLocaleDateString()}
                </div>
              )}
              {event.location && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}