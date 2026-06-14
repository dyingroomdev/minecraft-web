import { Loader2, RefreshCw, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AdminIcon, faMagnifyingGlass } from '@/components/admin/AdminIcons';
import { ControlPageHeader, ControlPanel } from '@/components/admin/ControlUI';
import { useAdmin } from '@/contexts/AdminContext';
import { type SeoSettings as SeoSettingsData, useRebuildSitemap, useSaveSeo, useSeo } from '@/hooks/useSeo';

export default function SeoSettings() {
  const { user } = useAdmin();
  const { data, isLoading, error, refetch } = useSeo();
  const saveSeo = useSaveSeo();
  const rebuildSitemap = useRebuildSitemap();
  const isReadOnly = user?.role === 'ADMIN';
  const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<SeoSettingsData>();
  const metaDescription = watch('meta_description') ?? '';

  useEffect(() => { if (data) reset(data); }, [data, reset]);

  if (isLoading) return <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading SEO settings...</div>;
  if (error) return <div className="control-error-state"><span>Failed to load SEO settings.</span><button className="control-btn control-btn-ghost" onClick={() => refetch()}>Retry</button></div>;

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="SEO Settings"
        subtitle={data?.updated_at ? `Last updated ${new Date(data.updated_at).toLocaleString()}` : 'Manage search and social metadata'}
        actions={!isReadOnly ? <button className="control-btn control-btn-primary" onClick={handleSubmit((values) => saveSeo.mutate(values))} disabled={!isDirty || saveSeo.isPending}><Save size={14} /> Save SEO</button> : null}
      />
      {isReadOnly ? <div className="control-readonly-notice">You have read-only access to SEO settings.</div> : null}
      <ControlPanel title="Search Metadata" icon={<AdminIcon icon={faMagnifyingGlass} />}>
        <form className="control-form-panel" onSubmit={handleSubmit((values) => saveSeo.mutate(values))}>
          <div className="control-form-group"><label htmlFor="seo-title">Page Title</label><input id="seo-title" {...register('default_title')} disabled={isReadOnly} /></div>
          <div className="control-form-group"><label htmlFor="seo-template">Title Template</label><input id="seo-template" {...register('title_template')} disabled={isReadOnly} placeholder="%s | AmzCraft" /></div>
          <div className="control-form-group">
            <label htmlFor="seo-description">Meta Description</label>
            <textarea id="seo-description" {...register('meta_description')} disabled={isReadOnly} />
            <div className="control-panel-muted">{metaDescription.length}/160 characters</div>
          </div>
          <div className="control-form-grid">
            <div className="control-form-group"><label htmlFor="canonical-url">Canonical Base URL</label><input id="canonical-url" {...register('canonical_base_url')} disabled={isReadOnly} /></div>
            <div className="control-form-group"><label htmlFor="twitter-handle">Twitter Handle</label><input id="twitter-handle" {...register('twitter_handle')} disabled={isReadOnly} placeholder="@amzcraft" /></div>
          </div>
          <div className="control-form-group"><label htmlFor="og-image">Open Graph Image URL</label><input id="og-image" {...register('og_image_url')} disabled={isReadOnly} /></div>
          <div className="control-form-grid">
            <div className="control-form-group">
              <label htmlFor="robots-policy">Robots Policy</label>
              <select id="robots-policy" {...register('robots_policy')} disabled={isReadOnly}>
                <option value="index,follow">Index, Follow</option><option value="noindex,nofollow">No Index, No Follow</option>
                <option value="index,nofollow">Index, No Follow</option><option value="noindex,follow">No Index, Follow</option>
              </select>
            </div>
            <div className="control-form-group"><label><input type="checkbox" {...register('sitemap_enabled')} disabled={isReadOnly} /> Enable Sitemap</label></div>
          </div>
          {!isReadOnly ? (
            <div className="control-form-actions">
              <button className="control-btn control-btn-primary" disabled={!isDirty || saveSeo.isPending}>Save SEO</button>
              <button className="control-btn control-btn-ghost" type="button" onClick={() => rebuildSitemap.mutate()} disabled={rebuildSitemap.isPending}><RefreshCw size={14} /> Rebuild Sitemap</button>
            </div>
          ) : null}
        </form>
      </ControlPanel>
    </div>
  );
}
