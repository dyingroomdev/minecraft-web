import React from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useSocial, useSaveSocial, type SocialLinks } from '../../../hooks/useSocial';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, ExternalLink, Facebook, Twitter, MessageCircle, Youtube, Music, Instagram, Globe } from 'lucide-react';

const SOCIAL_PLATFORMS = [
  { key: 'discord' as keyof SocialLinks, label: 'Discord', icon: MessageCircle, placeholder: 'https://discord.gg/your-server' },
  { key: 'twitter' as keyof SocialLinks, label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { key: 'youtube' as keyof SocialLinks, label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
  { key: 'facebook' as keyof SocialLinks, label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/page' },
  { key: 'instagram' as keyof SocialLinks, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'tiktok' as keyof SocialLinks, label: 'TikTok', icon: Music, placeholder: 'https://tiktok.com/@username' },
  { key: 'website' as keyof SocialLinks, label: 'Website', icon: Globe, placeholder: 'https://your-website.com' },
];

export default function SocialSettings() {
  const { user } = useAdmin();
  const { data: social, isLoading, error, refetch } = useSocial();
  const saveSocial = useSaveSocial();
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, formState: { isDirty } } = useForm<SocialLinks>({
    values: social || {}
  });

  const onSubmit = (data: SocialLinks) => {
    if (isReadOnly) return;
    
    // Filter out empty strings and convert to null
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key as keyof SocialLinks] = value?.trim() || null;
      return acc;
    }, {} as SocialLinks);
    
    saveSocial.mutate(cleanedData);
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
        <p className="text-red-400 mb-4">Failed to load social links</p>
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
          <h1 className="text-2xl font-bold text-on">Social Links</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage social media links displayed on your website
          </p>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.open('http://localhost:8001/api/social', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Public JSON
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Social Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, placeholder }) => (
            <Card key={key} className="bg-surface border-gray-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-brand" />
                  <Label htmlFor={key} className="text-on font-medium">
                    {label}
                  </Label>
                </div>
                
                <Input
                  id={key}
                  {...register(key)}
                  disabled={isReadOnly}
                  className="bg-surface2 border-gray-600"
                  placeholder={placeholder}
                  type="url"
                />
                
                {social?.[key] && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <ExternalLink className="h-3 w-3" />
                    <a 
                      href={social[key]!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-brand transition-colors truncate"
                    >
                      {social[key]}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          {!isReadOnly ? (
            <Button
              type="submit"
              disabled={!isDirty || saveSocial.isPending}
              className="bg-brand hover:bg-brand/90"
            >
              {saveSocial.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                ℹ️ You have read-only access to social links. Contact a Super Admin to make changes.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}