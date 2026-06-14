import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AdminIcon, faPalette } from '@/components/admin/AdminIcons';
import { ControlPageHeader, ControlPanel } from '@/components/admin/ControlUI';
import { useAdmin } from '@/contexts/AdminContext';
import { apiClient } from '@/lib/api';

type BrandSettings = {
  site_name: string;
  tagline: string;
  logo_url_light?: string | null;
  logo_url_dark?: string | null;
  favicon_url?: string | null;
  theme_primary: string;
  theme_bg: string;
  theme_surface: string;
  updated_at?: string;
};

export default function AdminBrand() {
  const { isSuper } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<BrandSettings>();
  const values = watch();

  useEffect(() => {
    apiClient.request<BrandSettings>('/admin/brand')
      .then(reset)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load brand settings'))
      .finally(() => setLoading(false));
  }, [reset]);

  const save = async (data: BrandSettings) => {
    if (!isSuper) return;
    setSaving(true);
    try {
      const updated = await apiClient.request<BrandSettings>('/admin/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      reset(updated);
      toast.success('Brand settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save brand settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading brand settings...</div>;

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Brand Settings"
        subtitle={values.updated_at ? `Last updated ${new Date(values.updated_at).toLocaleString()}` : 'Manage the public AmzCraft identity'}
        actions={isSuper ? <button className="control-btn control-btn-primary" onClick={handleSubmit(save)} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}</button> : null}
      />
      {!isSuper ? <div className="control-readonly-notice">You have read-only access to brand settings.</div> : null}
      <ControlPanel title="Brand Configuration" icon={<AdminIcon icon={faPalette} />}>
        <form className="control-form-panel" onSubmit={handleSubmit(save)}>
          <div className="control-form-group"><label htmlFor="site-name">Server Name</label><input id="site-name" {...register('site_name')} disabled={!isSuper} /></div>
          <div className="control-form-group"><label htmlFor="tagline">Tagline</label><input id="tagline" {...register('tagline')} disabled={!isSuper} maxLength={140} /></div>
          <div className="control-form-grid">
            {[
              ['theme_primary', 'Primary Color'],
              ['theme_bg', 'Background Color'],
              ['theme_surface', 'Surface Color'],
            ].map(([field, label]) => (
              <div className="control-form-group" key={field}>
                <label htmlFor={field}>{label}</label>
                <div className="control-color-input">
                  <input
                    type="color"
                    value={(values[field as keyof BrandSettings] as string) || '#000000'}
                    disabled={!isSuper}
                    onChange={(event) => setValue(field as keyof BrandSettings, event.target.value)}
                    aria-label={`${label} picker`}
                  />
                  <input id={field} {...register(field as keyof BrandSettings)} disabled={!isSuper} />
                </div>
              </div>
            ))}
          </div>
          <div className="control-form-group"><label htmlFor="logo-light">Light Logo URL</label><input id="logo-light" {...register('logo_url_light')} disabled={!isSuper} placeholder="/api/media/logo-light.png" /></div>
          <div className="control-form-group"><label htmlFor="logo-dark">Dark Logo URL</label><input id="logo-dark" {...register('logo_url_dark')} disabled={!isSuper} placeholder="/api/media/logo-dark.png" /></div>
          <div className="control-form-group"><label htmlFor="favicon">Favicon URL</label><input id="favicon" {...register('favicon_url')} disabled={!isSuper} placeholder="/api/media/favicon.png" /></div>
          <div className="control-brand-preview" style={{ background: values.theme_surface || '#161625', borderColor: values.theme_primary || '#00e676' }}>
            <strong style={{ color: values.theme_primary || '#00e676' }}>{values.site_name || 'AmzCraft'}</strong>
            <span>{values.tagline || 'Build. Fight. Conquer.'}</span>
          </div>
          {isSuper ? <button className="control-btn control-btn-primary" disabled={saving}>Save Settings</button> : null}
        </form>
      </ControlPanel>
    </div>
  );
}
