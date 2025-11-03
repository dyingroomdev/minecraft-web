import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import Home from './pages/Home';
import { AdminProvider } from './contexts/AdminContext';
import AdminLogin from './components/pages/AdminLogin';
import AdminForbidden from './components/pages/AdminForbidden';
import AdminRouteGuard from './components/AdminRouteGuard';
import AdminLayout from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import AdminOverview from './components/pages/admin/AdminOverview';
import AdminNews from './components/pages/admin/AdminNews';
import AdminUsers from './components/pages/admin/AdminUsers';
import AdminUsersManagement from './components/pages/admin/AdminUsersManagement';
import AdminBrand from './components/pages/admin/AdminBrand';
import AdminSEO from './components/pages/admin/AdminSEO';
import NewsManager from './components/pages/admin/NewsManager';
import EventsManager from './components/pages/admin/EventsManager';
import RulesManager from './components/pages/admin/RulesManager';
import VotesManager from './components/pages/admin/VotesManager';
import FeaturesManager from './components/pages/admin/FeaturesManager';
import HeroSlidesManager from './components/pages/admin/HeroSlidesManager';
import LeaderboardManager from './components/pages/admin/LeaderboardManager';
import SocialSettings from './components/pages/admin/SocialSettings';
import PaymentsManager from './components/pages/admin/PaymentsManager';
import AdminUsersManager from './components/pages/admin/AdminUsersManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-bg text-on">
            <Toaster theme="dark" position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              } />
              
              {/* Admin Auth Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forbidden" element={<AdminForbidden />} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <AdminRouteGuard>
                  <AdminLayout />
                </AdminRouteGuard>
              }>
                <Route index element={<AdminOverview />} />
                <Route path="dashboard" element={<AdminOverview />} />
                <Route path="payments" element={<PaymentsManager />} />
                <Route path="news" element={<NewsManager />} />
                <Route path="events" element={<EventsManager />} />
                <Route path="rules" element={<RulesManager />} />
                <Route path="votes" element={<VotesManager />} />
                <Route path="features" element={<FeaturesManager />} />
                <Route path="hero-slides" element={<HeroSlidesManager />} />
                <Route path="leaderboards" element={<LeaderboardManager />} />
                <Route path="social" element={<SocialSettings />} />
                <Route path="brand" element={<AdminBrand />} />
                <Route path="seo" element={<AdminSEO />} />
                <Route path="diagnostics" element={<AdminUsers />} />
                <Route path="users" element={<AdminUsersManager />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </AdminProvider>
    </QueryClientProvider>
  );
}

export default App;
