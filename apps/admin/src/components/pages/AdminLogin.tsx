import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '');

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Card className="w-full max-w-md p-6 bg-surface border-gray-600">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-on">Admin Login</h1>
          <p className="text-gray-300">Sign in to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-surface2 border-gray-600 text-on"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-200">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-surface2 border-gray-600 text-on"
            />
          </div>

          {error && (
            <div className="text-minecraft-red text-sm">{error}</div>
          )}

          <Button type="submit" className="w-full bg-brand hover:bg-brand2 text-gray-900" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-700" />
          OR
          <span className="h-px flex-1 bg-gray-700" />
        </div>

        <Button asChild variant="outline" className="w-full border-gray-600">
          <a href={`${API_BASE}/admin/auth/discord/login`}>Continue with Discord</a>
        </Button>
      </Card>
    </div>
  );
}
