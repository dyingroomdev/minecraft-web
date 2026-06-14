import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AdminIcon, faShieldHalved, faUser } from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminUsers, useCreateAdminUser, useDeleteAdminUser } from '@/hooks/useAdminUsers';

type UserForm = {
  email: string;
  password: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
};

export default function AdminUsersManager() {
  const { user } = useAdmin();
  const { data: adminUsers = [], isLoading, error, refetch } = useAdminUsers();
  const createUser = useCreateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    defaultValues: { role: 'ADMIN' },
  });
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const createAdmin = (data: UserForm) => {
    if (!isSuperAdmin) return;
    createUser.mutate(data);
    setShowForm(false);
    reset({ email: '', password: '', role: 'ADMIN' });
  };

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Admin Users"
        subtitle="Manage staff and admin accounts"
        actions={isSuperAdmin ? <button className="control-btn control-btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Invite Admin</button> : null}
      />
      {!isSuperAdmin ? <div className="control-readonly-notice">Only super administrators can manage admin accounts.</div> : null}

      {showForm ? (
        <ControlPanel title="Invite Admin" icon={<AdminIcon icon={faUser} />}>
          <form className="control-form-panel" onSubmit={handleSubmit(createAdmin)}>
            <div className="control-form-grid">
              <div className="control-form-group">
                <label htmlFor="admin-email">Email *</label>
                <input id="admin-email" type="email" {...register('email', { required: 'Email is required' })} placeholder="staff@amzcraft.xyz" />
                {errors.email ? <div className="text-red-400 text-xs mt-1">{errors.email.message}</div> : null}
              </div>
              <div className="control-form-group">
                <label htmlFor="admin-role">Role *</label>
                <select id="admin-role" {...register('role')}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select>
              </div>
            </div>
            <div className="control-form-group">
              <label htmlFor="admin-password">Temporary Password *</label>
              <input id="admin-password" type="password" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
              {errors.password ? <div className="text-red-400 text-xs mt-1">{errors.password.message}</div> : null}
            </div>
            <div className="control-form-actions">
              <button className="control-btn control-btn-primary" disabled={createUser.isPending}>Create Admin</button>
              <button className="control-btn control-btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </ControlPanel>
      ) : null}

      <ControlPanel title="Staff Accounts" icon={<AdminIcon icon={faShieldHalved} />}>
        {isLoading ? (
          <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading administrators...</div>
        ) : error ? (
          <div className="control-error-state"><span>Failed to load admin users.</span><button className="control-btn control-btn-ghost" onClick={() => refetch()}>Retry</button></div>
        ) : adminUsers.length === 0 ? (
          <ControlEmpty icon={<AdminIcon icon={faUser} />} text="No admin users found." />
        ) : (
          <div className="control-table-wrap">
            <table className="control-data-table">
              <thead><tr><th>Account</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {adminUsers.map((adminUser) => (
                  <tr key={adminUser.id}>
                    <td><strong>{adminUser.email.split('@')[0]}</strong></td>
                    <td>{adminUser.email}</td>
                    <td><span className={`control-status-badge ${adminUser.role === 'SUPER_ADMIN' ? 'info' : 'approved'}`}>{adminUser.role.replace('_', ' ')}</span></td>
                    <td><ControlStatusBadge status={adminUser.is_active ? 'Active' : 'Inactive'} /></td>
                    <td>
                      {isSuperAdmin && adminUser.id !== user?.id ? (
                        <button className="control-row-action reject" onClick={() => confirm('Remove this admin user?') && deleteUser.mutate(adminUser.id)}>Remove</button>
                      ) : <span className="control-panel-muted">{adminUser.id === user?.id ? 'Current account' : 'Read only'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ControlPanel>
    </div>
  );
}
