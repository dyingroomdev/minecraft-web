import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthCallback } from './components/pages/AuthCallback';
import { EventDetailPage } from './components/pages/EventDetailPage';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import UserDashboard from './components/pages/UserDashboard';
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ReferenceSite from './reference/ReferenceSite';
import Events from './pages/Events';
import NewsArticle from './pages/NewsArticle';
import Rules from './pages/Rules';

function PublicOutlet() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}

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
              <Route path="/" element={<ReferenceSite />} />
              <Route element={<PublicOutlet />}>
                <Route path="/rules" element={<Rules />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:slug" element={<EventDetailPage />} />
                <Route path="/news/:slug" element={<NewsArticle />} />
              </Route>
              <Route path="/news" element={<ReferenceSite />} />
              <Route path="/vote" element={<ReferenceSite />} />
              <Route path="/ranks" element={<ReferenceSite />} />
              <Route path="/leaderboards" element={<ReferenceSite />} />
              <Route path="/contact" element={<ReferenceSite />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
