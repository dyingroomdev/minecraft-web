import { useState, useEffect } from 'react';
import AdminTable from '@/components/admin/AdminTable';
import RoleGate from '@/components/RoleGate';

interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  is_active: boolean;
}

export default function AdminUsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/users/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    // TODO: Open modal for creating admin user
    console.log('Add admin user');
  };

  const handleEdit = (item: AdminUser) => {
    // TODO: Open modal for editing admin user
    console.log('Edit admin user:', item);
  };

  const handleDelete = async (item: AdminUser) => {
    if (!confirm(`Are you sure you want to delete admin user: ${item.email}?`)) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/users/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== item.id));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-brand/20 text-brand'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'is_active', 
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value ? 'bg-brand/20 text-brand' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <RoleGate 
      role="SUPER_ADMIN" 
      fallback={
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">You need Super Admin privileges to access this page.</p>
        </div>
      }
    >
      <AdminTable
        title="Admin Users Management"
        data={users}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addLabel="Create Admin User"
      />
    </RoleGate>
  );
}