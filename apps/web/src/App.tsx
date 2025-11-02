import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Home } from './components/pages/Home';
import { NewsList } from './components/pages/NewsList';
import { NewsDetail } from './components/pages/NewsDetail';
import { RulesPage } from './components/pages/RulesPage';
import { EventsPage } from './components/pages/EventsPage';
import { LeaderboardsPage } from './components/pages/LeaderboardsPage';
import { Ranks } from './components/pages/Ranks';
import { RankPurchase } from './components/pages/RankPurchase';
import { PurchaseStatus } from './components/pages/PurchaseStatus';
import { ProfilePage } from './components/pages/ProfilePage';
import { Vote } from './components/pages/Vote';
import { AuthCallback } from './components/pages/AuthCallback';
import { ErrorPage } from './components/pages/ErrorPage';
import { AdminDashboard } from './components/pages/admin/AdminDashboard';
import { AdminNews } from './components/pages/admin/AdminNews';
import { AdminEvents } from './components/pages/admin/AdminEvents';
import { AdminRules } from './components/pages/admin/AdminRules';
import { AdminPayments } from './components/pages/admin/AdminPayments';
import { AdminLeaderboards } from './components/pages/admin/AdminLeaderboards';
import { AdminIntegrations } from './components/pages/admin/AdminIntegrations';
import { AdminAudit } from './components/pages/admin/AdminAudit';
import { AdminSocial } from './components/pages/admin/AdminSocial';
import { AdminDiagnostics } from './components/pages/admin/AdminDiagnostics';
import { AdminContent } from './components/pages/admin/AdminContent';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="news" element={<NewsList />} />
                <Route path="news/:slug" element={<NewsDetail />} />
                <Route path="rules" element={<RulesPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="leaderboards/:season" element={<LeaderboardsPage />} />
                <Route path="ranks" element={<Ranks />} />
                <Route path="ranks/buy/:code" element={<RankPurchase />} />
                <Route path="purchase/:requestId" element={<PurchaseStatus />} />
                <Route path="profile/:username" element={<ProfilePage />} />
                <Route path="vote" element={<Vote />} />
              </Route>

              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/error/:code" element={<ErrorPage />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="rules" element={<AdminRules />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="leaderboards" element={<AdminLeaderboards />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="social" element={<AdminSocial />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="diagnostics" element={<AdminDiagnostics />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/error/404" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
