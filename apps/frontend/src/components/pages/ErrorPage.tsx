import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const messages: Record<string, { title: string; description: string }> = {
  '401': {
    title: 'Authentication Required',
    description: 'You need to log in to access this page.',
  },
  '403': {
    title: 'Access Denied',
    description: 'You do not have permission to view this resource.',
  },
  '404': {
    title: 'Page Not Found',
    description: 'The page you are looking for could not be found.',
  },
  default: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};

export function ErrorPage() {
  const { code } = useParams<{ code: string }>();
  const message = messages[code ?? ''] ?? messages.default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">{message.title}</h1>
      <p className="max-w-md text-muted-foreground">{message.description}</p>
      <Button asChild>
        <Link to="/">Return home</Link>
      </Button>
    </div>
  );
}
