import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { apiClient } from '@/lib/api';

export function AuthCallback({ provider = 'discord' }: { provider?: 'discord' | 'google' }) {
  const location = useLocation();
  const [status, setStatus] = useState<'pending' | 'error'>('pending');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      setStatus('error');
      return;
    }

    async function exchangeCode(oauthCode: string, oauthState: string) {
      try {
        const tokenResponse = provider === 'google'
          ? await apiClient.googleOAuthCallback(oauthCode, oauthState)
          : await apiClient.discordOAuthCallback(oauthCode, oauthState);
        localStorage.setItem('access_token', tokenResponse.access_token);
        apiClient.setToken(tokenResponse.access_token);
        await apiClient.getMe();
        window.location.replace('/');
      } catch (err) {
        console.error('OAuth callback failed', err);
        setStatus('error');
      }
    }

    void exchangeCode(code, state);
  }, [location.search, provider]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {status === 'pending' ? (
        <div className="text-center">
          <p className="text-xl font-semibold">Signing you in…</p>
          <p className="text-sm text-muted-foreground">Please wait while we finish authentication.</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl font-semibold text-destructive">Authentication failed.</p>
          <p className="text-sm text-muted-foreground">
            Please close this window and try logging in again.
          </p>
        </div>
      )}
    </div>
  );
}
