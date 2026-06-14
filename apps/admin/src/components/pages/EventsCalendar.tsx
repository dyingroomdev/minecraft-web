import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, MapPin, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiClient } from '../../lib/api';

export function EventsCalendar() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events-calendar'],
    queryFn: () => apiClient.request('/api/events/calendar'),
  });

  const handleDownloadICS = () => {
    window.open('/api/events/calendar.ics', '_blank');
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading events...</div>;
  }

  const upcomingEvents = events?.filter(event => 
    event.start_at && new Date(event.start_at) > new Date()
  ) || [];
  
  const pastEvents = events?.filter(event => 
    event.start_at && new Date(event.start_at) <= new Date()
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Events Calendar</h1>
          <p className="text-muted-foreground">
            Stay updated with all AmzCraft events and competitions
          </p>
        </div>
        <Button onClick={handleDownloadICS} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Calendar
        </Button>
      </div>

      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Events
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6">Past Events</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map(event => (
              <EventCard key={event.id} event={event} isPast />
            ))}
          </div>
        </section>
      )}

      {events?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
          <p className="text-muted-foreground">
            Check back later for upcoming events and competitions!
          </p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isPast = false }: { event: any; isPast?: boolean }) {
  const startDate = event.start_at ? new Date(event.start_at) : null;
  const endDate = event.end_at ? new Date(event.end_at) : null;

  return (
    <Card className={`${isPast ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          {event.is_active && !isPast && (
            <Badge className="bg-lime-500 text-forest-900">Active</Badge>
          )}
          {isPast && <Badge variant="secondary">Past</Badge>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {event.description}
        </p>
        
        {startDate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <div>
              <div>{startDate.toLocaleDateString()}</div>
              <div>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              {endDate && endDate.getTime() !== startDate.getTime() && (
                <div className="text-xs">
                  Until {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {event.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
        )}
      </CardContent>
    </Card>
  );
}