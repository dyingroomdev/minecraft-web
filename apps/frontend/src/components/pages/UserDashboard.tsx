import { Navigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function UserDashboard() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <main className="min-h-screen bg-bg p-8 text-on">Loading your dashboard...</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-12 text-on">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">User Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">Welcome, {user.username}</h1>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <a href="/">Back to website</a>
            </Button>
            <Button onClick={() => void logout()}>Sign out</Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-gray-700 bg-surface">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <p><span className="text-gray-500">Username:</span> {user.username}</p>
              <p><span className="text-gray-500">Email:</span> {user.email ?? 'Not provided'}</p>
              <p><span className="text-gray-500">Role:</span> {user.roles.join(', ')}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-surface">
            <CardHeader>
              <CardTitle>Minecraft Account</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              Minecraft account linking and personal server statistics will appear here.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
