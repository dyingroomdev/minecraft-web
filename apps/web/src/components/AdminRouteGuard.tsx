import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiresSuper?: boolean;
}

export default function AdminRouteGuard({ children, requiresSuper = false }: AdminRouteGuardProps) {
  const { user, isLoading, isSuper } = useAdmin();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiresSuper && !isSuper) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return <>{children}</>;
}