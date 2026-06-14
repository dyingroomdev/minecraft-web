import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const tokens = await apiClient.register(email, username, password);
      localStorage.setItem('access_token', tokens.access_token);
      apiClient.setToken(tokens.access_token);
      navigate('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 text-on">
      <Card className="w-full max-w-md border-gray-700 bg-surface">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <p className="text-sm text-gray-300">Register with email, username, and password.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" minLength={3} maxLength={32} value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button className="w-full bg-brand text-bg" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-300">
            Already registered? <Link className="text-brand hover:underline" to="/login">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
