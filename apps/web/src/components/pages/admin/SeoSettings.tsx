import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useSeo, useSaveSeo, useRebuildSitemap, useUploadOg } from '../../../hooks/useSeo';
import { SeoSchema, type SeoFormData } from '../../../lib/seoValidation';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Upload, ExternalLink, AlertTriangle } from 'lucide-react';

export default function SeoSettings() {
  const { user } = useAdmin();
  const { data: seo, isLoading, error, refetch } = useSeo();
  const saveSeo = useSaveSeo();
  const rebuildSitemap = useRebuildSitemap();
  const uploadOg = useUploadOg();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<SeoFormData>({
    resolver: zodResolver(SeoSchema),
    values: seo ? {
      default_title: seo.default_title,
      title_template: seo.title_template,
      meta_description: seo.meta_description,
      canonical_base_url: seo.canonical_base_url,
      og_image_url: seo.og_image_url,
      twitter_handle: seo.twitter_handle,
      robots_policy: seo.robots_policy,
      sitemap_enabled: seo.sitemap_enabled,
    } : undefined
  });

  const watchedValues = watch();
  const titleTemplate = watchedValues.title_template || '';
  const metaDescription = watchedValues.meta_description || '';
  const twitterHandle = watchedValues.twitter_handle || '';
  
  const previewTitle = titleTemplate.includes('%s') 
    ? titleTemplate.replace('%s', 'Home')
    : 'Home';
    
  const hasTemplateWarning = titleTemplate && !titleTemplate.includes('%s');

  const onSubmit = (data: SeoFormData) => {
    if (isReadOnly) return;
    
    // Normalize twitter handle
    const normalizedData = {
      ...data,
      twitter_handle: data.twitter_handle 
        ? (data.twitter_handle.startsWith('@') ? data.twitter_handle : `@${data.twitter_handle}`)
        : null
    };
    
    saveSeo.mutate(normalizedData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isReadOnly) return;
    
    // Validate file type and size
    const validTypes = ['image/png', 'image/webp', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, WebP, or JPEG image');
      return;
    }
    
    if (file.size > 1024 * 1024) { // 1MB
      alert('File size must be less than 1MB');
      return;
    }
    
    uploadOg.mutate(file);
  };

  const handleTwitterBlur = () => {
    const value = twitterHandle.trim();
    if (value && !value.startsWith('@')) {
      setValue('twitter_handle', `@${value}`, { shouldDirty: true });
    }
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
        <p className="text-red-400 mb-4">Failed to load SEO settings</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on">SEO Settings</h1>
        {seo?.updated_at && (
          <p className="text-gray-400 text-sm mt-1">
            Updated {new Date(seo.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main SEO Form */}
        <Card className="bg-surface border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="default_title">Default Title</Label>
              <Input
                id="default_title"
                {...register('default_title')}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
              />
              {errors.default_title && (
                <p className="text-red-400 text-sm mt-1">{errors.default_title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="title_template">Title Template</Label>
              <Input
                id="title_template"
                {...register('title_template')}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
                placeholder="e.g., %s | AmzCraft"
              />
              {titleTemplate && (
                <p className="text-gray-400 text-sm mt-1">
                  Preview: {previewTitle}
                </p>
              )}
              {hasTemplateWarning && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  No placeholder (%s) for page title
                </div>
              )}
              {errors.title_template && (
                <p className="text-red-400 text-sm mt-1">{errors.title_template.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                {...register('meta_description')}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
                rows={3}
              />
              <div className="flex justify-between text-sm mt-1">
                <span className={metaDescription.length > 160 ? 'text-red-400' : 'text-gray-400'}>
                  {metaDescription.length}/160 characters
                </span>
              </div>
              {errors.meta_description && (
                <p className="text-red-400 text-sm mt-1">{errors.meta_description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="canonical_base_url">Canonical Base URL</Label>
              <Input
                id="canonical_base_url"
                {...register('canonical_base_url')}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
                placeholder="https://example.com"
              />
              {errors.canonical_base_url && (
                <p className="text-red-400 text-sm mt-1">{errors.canonical_base_url.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="robots_policy">Robots Policy</Label>
              <select
                id="robots_policy"
                {...register('robots_policy')}
                disabled={isReadOnly}
                className="w-full px-3 py-2 bg-surface2 border border-gray-600 rounded-md text-on"
              >
                <option value="index,follow">Index, Follow</option>
                <option value="noindex,nofollow">No Index, No Follow</option>
                <option value="index,nofollow">Index, No Follow</option>
                <option value="noindex,follow">No Index, Follow</option>
              </select>
              {errors.robots_policy && (
                <p className="text-red-400 text-sm mt-1">{errors.robots_policy.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="twitter_handle">Twitter Handle</Label>
              <Input
                id="twitter_handle"
                {...register('twitter_handle')}
                disabled={isReadOnly}
                className="bg-surface2 border-gray-600"
                placeholder="@AmazeGaming"
                onBlur={handleTwitterBlur}
              />
              {errors.twitter_handle && (
                <p className="text-red-400 text-sm mt-1">{errors.twitter_handle.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sitemap_enabled"
                {...register('sitemap_enabled')}
                disabled={isReadOnly}
                className="rounded border-gray-600 bg-surface2"
              />
              <Label htmlFor="sitemap_enabled">Enable Sitemap</Label>
            </div>
          </div>
        </Card>

        {/* Open Graph Image */}
        <Card className="bg-surface border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-on mb-4">Open Graph Image</h3>
          
          {seo?.og_image_url ? (
            <div className="space-y-4">
              <img
                src={seo.og_image_url}
                alt="OG Preview"
                className="max-w-md h-auto border border-gray-600 rounded"
              />
              {!isReadOnly && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadOg.isPending}
                  >
                    {uploadOg.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Replace Image
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No OG image uploaded</p>
              {!isReadOnly && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadOg.isPending}
                  >
                    {uploadOg.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Image
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            {!isReadOnly && (
              <>
                <Button
                  type="submit"
                  disabled={!isDirty || saveSeo.isPending}
                  className="bg-brand hover:bg-brand/90"
                >
                  {saveSeo.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => rebuildSitemap.mutate()}
                  disabled={!watchedValues.sitemap_enabled || rebuildSitemap.isPending}
                  title={!watchedValues.sitemap_enabled ? "Enable sitemap to rebuild" : ""}
                >
                  {rebuildSitemap.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Rebuild Sitemap
                </Button>
              </>
            )}
          </div>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.open('http://localhost:8001/api/seo', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public JSON
          </Button>
        </div>
      </form>
    </div>
  );
}