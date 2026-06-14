import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AdminIcon, faLink } from '@/components/admin/AdminIcons';
import { ControlPageHeader, ControlPanel } from '@/components/admin/ControlUI';
import { useAdmin } from '@/contexts/AdminContext';
import { type SocialLinks, useSaveSocial, useSocial } from '@/hooks/useSocial';

const PLATFORMS: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/amzcraft' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/amzcraft' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@amzcraft' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@amzcraft' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/amzcraft' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/amzcraft' },
  { key: 'website', label: 'Website', placeholder: 'https://amzcraft.xyz' },
];

export default function SocialSettings() {
  const { user } = useAdmin();
  const { data: social, isLoading, error, refetch } = useSocial();
  const saveSocial = useSaveSocial();
  const isReadOnly = user?.role === 'ADMIN';
  const { register, handleSubmit, formState: { isDirty } } = useForm<SocialLinks>({ values: social ?? {} });

  const onSubmit = (data: SocialLinks) => {
    if (isReadOnly) return;
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value?.trim() || null]),
    ) as SocialLinks;
    saveSocial.mutate(cleaned);
  };

  if (isLoading) return <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading social links...</div>;
  if (error) return <div className="control-error-state"><span>Failed to load social links.</span><button className="control-btn control-btn-ghost" onClick={() => refetch()}>Retry</button></div>;

  return (
    <div className="control-manager-page">
      <ControlPageHeader title="Social Links" subtitle="Manage public community and social destinations" />
      {isReadOnly ? <div className="control-readonly-notice">You have read-only access to social links.</div> : null}
      <ControlPanel title="Public Links" icon={<AdminIcon icon={faLink} />}>
        <form className="control-form-panel" onSubmit={handleSubmit(onSubmit)}>
          {PLATFORMS.map((platform) => (
            <div className="control-form-group" key={platform.key}>
              <label htmlFor={`social-${platform.key}`}>{platform.label}</label>
              <input id={`social-${platform.key}`} type="url" {...register(platform.key)} disabled={isReadOnly} placeholder={platform.placeholder} />
            </div>
          ))}
          {!isReadOnly ? (
            <button className="control-btn control-btn-primary" disabled={!isDirty || saveSocial.isPending}>
              {saveSocial.isPending ? 'Saving...' : 'Save Links'}
            </button>
          ) : null}
        </form>
      </ControlPanel>
    </div>
  );
}
