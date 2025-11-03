import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminForbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Card className="w-full max-w-md p-6 text-center bg-surface border-gray-600">
        <div className="mb-6">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-minecraft-red mb-2">Access Denied</h1>
          <p className="text-gray-300">
            You don't have sufficient privileges to access this resource.
            This action requires Super Admin permissions.
          </p>
        </div>

        <div className="space-y-2">
          <Button onClick={() => navigate('/admin')} className="w-full bg-brand hover:bg-brand2 text-gray-900">
            Back to Admin Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="w-full border-gray-600 text-gray-200 hover:bg-surface2"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}