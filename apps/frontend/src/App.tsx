import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthCallback } from './components/pages/AuthCallback';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import UserDashboard from './components/pages/UserDashboard';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import FullSite from './pages/FullSite';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster theme="dark" position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/auth/discord/callback" element={<AuthCallback />} />
              <Route path="/auth/google/callback" element={<AuthCallback provider="google" />} />
              <Route path="/" element={<FullSite page="home" />} />
              <Route path="/news" element={<FullSite page="news" />} />
              <Route path="/news/:slug" element={<FullSite page="news" />} />
              <Route path="/rules" element={<FullSite page="rules" />} />
              <Route path="/events" element={<FullSite page="events" />} />
              <Route path="/events/:slug" element={<FullSite page="events" />} />
              <Route path="/ranks" element={<FullSite page="ranks" />} />
              <Route path="/leaderboards" element={<FullSite page="leaderboards" />} />
              <Route path="/vote" element={<FullSite page="vote" />} />
              <Route path="/contact" element={<FullSite page="contact" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
