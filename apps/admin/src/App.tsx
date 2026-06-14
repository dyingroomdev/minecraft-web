import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import AdminRouteGuard from './components/AdminRouteGuard';
import AdminLayout from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import AdminForbidden from './components/pages/AdminForbidden';
import AdminLogin from './components/pages/AdminLogin';
import AdminAuthCallback from './components/pages/AdminAuthCallback';
import { EventDetailPage } from './components/pages/EventDetailPage';
import { EventsPage } from './components/pages/EventsPage';
import { RulesPage } from './components/pages/RulesPage';
import { Vote } from './components/pages/Vote';
import AdminBrand from './components/pages/admin/AdminBrand';
import { AdminDiagnostics } from './components/pages/admin/AdminDiagnostics';
import AdminOverview from './components/pages/admin/AdminOverview';
import { AdminRanks } from './components/pages/admin/AdminRanks';
import AdminSEO from './components/pages/admin/AdminSEO';
import AdminUsersManager from './components/pages/admin/AdminUsersManager';
import EventsManager from './components/pages/admin/EventsManager';
import FeaturesManager from './components/pages/admin/FeaturesManager';
import HeroSlidesManager from './components/pages/admin/HeroSlidesManager';
import LeaderboardManager from './components/pages/admin/LeaderboardManager';
import NewsManager from './components/pages/admin/NewsManager';
import PaymentsManager from './components/pages/admin/PaymentsManager';
import RulesManager from './components/pages/admin/RulesManager';
import SocialSettings from './components/pages/admin/SocialSettings';
import VotesManager from './components/pages/admin/VotesManager';
import ContactRequestsManager from './components/pages/admin/ContactRequestsManager';
import AddProduct from './components/pages/admin/shop/AddProduct';
import EditProduct from './components/pages/admin/shop/EditProduct';
import Orders from './components/pages/admin/shop/Orders';
import ProductList from './components/pages/admin/shop/ProductList';
import SalesOverview from './components/pages/admin/shop/SalesOverview';
import { AdminProvider } from './contexts/AdminContext';

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
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" />
          <Routes>
            <Route element={<PublicOutlet />}>
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />
              <Route path="/vote" element={<Vote />} />
            </Route>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/auth/discord/callback" element={<AdminAuthCallback />} />
            <Route path="/admin/forbidden" element={<AdminForbidden />} />
            <Route
              path="/admin"
              element={
                <AdminRouteGuard>
                  <AdminLayout />
                </AdminRouteGuard>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="dashboard" element={<AdminOverview />} />
              <Route path="payments" element={<PaymentsManager />} />
              <Route path="news" element={<NewsManager />} />
              <Route path="events" element={<EventsManager />} />
              <Route path="rules" element={<RulesManager />} />
              <Route path="votes" element={<VotesManager />} />
              <Route path="features" element={<FeaturesManager />} />
              <Route path="hero-slides" element={<HeroSlidesManager />} />
              <Route path="contact-requests" element={<ContactRequestsManager />} />
              <Route path="leaderboards" element={<LeaderboardManager />} />
              <Route path="ranks" element={<AdminRanks />} />
              <Route path="social" element={<SocialSettings />} />
              <Route path="brand" element={<AdminBrand />} />
              <Route path="seo" element={<AdminSEO />} />
              <Route path="diagnostics" element={<AdminDiagnostics />} />
              <Route path="users" element={<AdminUsersManager />} />
              <Route path="shop/products/new" element={<AddProduct />} />
              <Route path="shop/products" element={<ProductList />} />
              <Route path="shop/products/:id/edit" element={<EditProduct />} />
              <Route path="shop/orders" element={<Orders />} />
              <Route path="shop/overview" element={<SalesOverview />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </QueryClientProvider>
  );
}
