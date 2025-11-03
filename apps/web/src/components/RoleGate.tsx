import { useAdmin } from '@/contexts/AdminContext';

interface RoleGateProps {
  role?: 'ADMIN' | 'SUPER_ADMIN';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const { user, isSuper } = useAdmin();

  if (!user) return fallback;
  
  if (role === 'SUPER_ADMIN' && !isSuper) {
    return fallback;
  }

  return <>{children}</>;
}