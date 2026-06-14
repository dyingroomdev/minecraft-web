import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '');

export default function AdminAuthCallback() {
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      setError('Missing OAuth response parameters.');
      return;
    }

    void fetch(`${API_BASE}/admin/auth/discord/callback?${new URLSearchParams({ code, state })}`, {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail || 'Admin authentication failed');
        }
        localStorage.setItem('admin_token', payload.access_token);
        window.location.replace('/admin');
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Admin authentication failed');
      });
  }, [location.search]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 text-on">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{error ? 'Authentication failed' : 'Signing in'}</h1>
        <p className={error ? 'mt-2 text-sm text-red-400' : 'mt-2 text-sm text-gray-300'}>
          {error || 'Checking your admin account...'}
        </p>
      </div>
    </main>
  );
}
