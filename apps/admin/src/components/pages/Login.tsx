import { useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export default function Login() {
  useEffect(() => {
    window.location.replace(`${API_BASE}/auth/discord/login`);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-on">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Connecting to Discord</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You will be redirected to Discord to sign in.
        </p>
        <a
          href={`${API_BASE}/auth/discord/login`}
          className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2 font-semibold text-bg"
        >
          Continue to Discord
        </a>
      </div>
    </main>
  );
}
