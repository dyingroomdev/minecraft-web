import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

export default function Vote() {
  const { data: voteLinks, isLoading } = useQuery({
    queryKey: ['vote-links'],
    queryFn: () => apiClient.getVoteLinks(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading vote links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-on mb-4">Vote for AmzCraft</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Support our server by voting on these platforms and earn amazing rewards!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {voteLinks?.map((link) => (
          <Card key={link.id} className="bg-surface border-gray-700 hover:border-brand/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-on">
                <Gift className="h-5 w-5 text-brand" />
                {link.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {link.description && (
                <p className="text-gray-300 text-sm">{link.description}</p>
              )}
              
              {link.rewards.length > 0 && (
                <div>
                  <h4 className="font-semibold text-brand mb-2">Rewards:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {link.rewards.map((reward, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                        {reward}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button 
                asChild 
                className="w-full bg-brand hover:bg-brand/90"
              >
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  {link.button_text}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!voteLinks || voteLinks.length === 0) && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Vote Links Available</h3>
          <p className="text-gray-500">Vote links will appear here when they are configured.</p>
        </div>
      )}
    </div>
  );
}