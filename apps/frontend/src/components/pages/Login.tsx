import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '');

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const tokens = await apiClient.login(email, password);
      localStorage.setItem('access_token', tokens.access_token);
      apiClient.setToken(tokens.access_token);
      navigate('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 text-on">
      <Card className="w-full max-w-md border-gray-700 bg-surface">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <p className="text-sm text-gray-300">Use your account or a connected provider.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button className="w-full bg-brand text-bg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <a href={`${API_BASE}/auth/discord/login`}>Discord</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`${API_BASE}/auth/google/login`}>Google</a>
            </Button>
          </div>

          <p className="text-center text-sm text-gray-300">
            New here? <Link className="text-brand hover:underline" to="/register">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
