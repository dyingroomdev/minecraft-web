import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser, type AdminUser } from '../../../hooks/useAdminUsers';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Plus, Edit, Trash2, Shield, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface UserForm {
  email: string;
  password?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  is_active: boolean;
}

export default function AdminUsersManager() {
  const { user } = useAdmin();
  const { data: adminUsers, isLoading, error, refetch } = useAdminUsers();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>();

  const onSubmit = (data: UserForm) => {
    if (!isSuperAdmin) return;
    
    if (editingUser) {
      const updateData = { ...data };
      if (!updateData.password) delete updateData.password;
      updateUser.mutate({ id: editingUser.id, ...updateData });
    } else {
      createUser.mutate(data);
    }
    
    reset();
    setEditingUser(null);
    setShowForm(false);
  };

  const handleEdit = (adminUser: AdminUser) => {
    setEditingUser(adminUser);
    setShowForm(true);
    reset({
      email: adminUser.email,
      role: adminUser.role,
      is_active: adminUser.is_active
    });
  };

  const handleDelete = (id: string) => {
    if (!isSuperAdmin || !confirm('Are you sure you want to delete this admin user?')) return;
    deleteUser.mutate(id);
  };

  const handleCancel = () => {
    setEditingUser(null);
    setShowForm(false);
    reset();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Failed to load admin users</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on">Admin Users</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage admin panel users and permissions
          </p>
        </div>
        
        {isSuperAdmin && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Admin User
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            Only SUPER_ADMIN users can manage admin accounts.
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="bg-surface border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-on mb-4">
            {editingUser ? 'Edit Admin User' : 'Add New Admin User'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format'
                  }
                })}
                className="bg-surface2 border-gray-600"
                placeholder="admin@example.com"
                type="email"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="password"
                {...register('password', editingUser ? {} : { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
                className="bg-surface2 border-gray-600"
                placeholder="Enter password"
                type="password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                {...register('role', { required: 'Role is required' })}
                className="w-full p-2 bg-surface2 border border-gray-600 rounded-md text-on"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              {errors.role && (
                <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-gray-600 bg-surface2"
                defaultChecked={true}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createUser.isPending || updateUser.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingUser ? 'Update' : 'Create'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      {adminUsers?.length === 0 ? (
        <Card className="bg-surface border-gray-700 p-8 text-center">
          <p className="text-gray-400">No admin users found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {adminUsers?.map((adminUser) => (
            <Card key={adminUser.id} className="bg-surface border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-on">{adminUser.email}</h3>
                    <div className="flex items-center gap-2">
                      {adminUser.role === 'SUPER_ADMIN' ? (
                        <Badge className="bg-purple-500/20 text-purple-400">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {adminUser.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    Created: {formatDate(adminUser.created_at)}
                  </div>
                </div>

                {isSuperAdmin && adminUser.id !== user?.id && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(adminUser)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(adminUser.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}