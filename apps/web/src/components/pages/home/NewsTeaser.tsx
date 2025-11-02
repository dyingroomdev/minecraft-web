import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function NewsTeaser() {
  const { data: news } = useQuery({
    queryKey: ['news'],
    queryFn: () => apiClient.getNews(),
  });

  const latestNews = news?.slice(0, 3) || [];

  return (
    <section className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Latest News</h2>
        <Link to="/news">
          <Button variant="outline">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {latestNews.map((post) => (
          <Link
            key={post.id}
            to={`/news/${post.slug}`}
            className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow"
          >
            {post.is_pinned && (
              <span className="inline-block bg-lime-500 text-forest-900 text-xs px-2 py-1 rounded mb-3">
                Pinned
              </span>
            )}
            <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
            {post.summary && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                {post.summary}
              </p>
            )}
                {post.published_at ? (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(post.published_at)}
                  </div>
                ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
