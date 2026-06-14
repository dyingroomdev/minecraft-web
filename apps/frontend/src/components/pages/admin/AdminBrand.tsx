import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Palette, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAdmin } from '@/contexts/AdminContext';
import { useUploadMedia } from '@/hooks/useMedia';
import RoleGate from '@/components/RoleGate';

interface BrandSettings {
  site_name: string;
  tagline: string;
  logo_url_light?: string;
  logo_url_dark?: string;
  favicon_url?: string;
  theme_primary: string;
  theme_bg: string;
  theme_surface: string;
  updated_at: string;
}

export default function AdminBrand() {
  const { isSuper } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<BrandSettings>();
  const uploadMedia = useUploadMedia();
  
  const watchedValues = watch();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/brand', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        reset(data);
      }
    } catch (error) {
      console.error('Failed to fetch brand settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BrandSettings) => {
    if (!isSuper) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/brand', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const updated = await response.json();
        reset(updated);
        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Failed to save brand settings:', error);
      // TODO: Show error toast
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Brand Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 bg-surface border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!watchedValues.site_name && !loading) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
        <p className="text-gray-400">Failed to load brand settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Brand Settings</h1>
        <RoleGate role="SUPER_ADMIN">
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={saving}
            className="bg-brand hover:bg-brand/80"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </RoleGate>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="site_name" className="text-gray-300">Site Name</Label>
              <Input
                id="site_name"
                {...register('site_name')}
                disabled={!isSuper}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="tagline" className="text-gray-300">Tagline</Label>
              <Input
                id="tagline"
                {...register('tagline')}
                disabled={!isSuper}
                className="bg-gray-700 border-gray-600 text-white"
                maxLength={140}
              />
              <p className="text-xs text-gray-400 mt-1">
                {(watchedValues.tagline || '').length}/140 characters
              </p>
            </div>
          </div>
        </Card>

        {/* Theme Colors */}
        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Theme Colors
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme_primary" className="text-gray-300">Primary Color</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="theme_primary"
                  type="color"
                  {...register('theme_primary')}
                  disabled={!isSuper}
                  className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  {...register('theme_primary')}
                  disabled={!isSuper}
                  className="bg-gray-700 border-gray-600 text-white"
                  pattern="^#(?:[0-9a-fA-F]{3}){1,2}$"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="theme_bg" className="text-gray-300">Background Color</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="theme_bg"
                  type="color"
                  {...register('theme_bg')}
                  disabled={!isSuper}
                  className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  {...register('theme_bg')}
                  disabled={!isSuper}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="theme_surface" className="text-gray-300">Surface Color</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="theme_surface"
                  type="color"
                  {...register('theme_surface')}
                  disabled={!isSuper}
                  className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  {...register('theme_surface')}
                  disabled={!isSuper}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Logo & Assets */}
        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Logo & Assets</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Light Logo</Label>
              <div className="flex items-center space-x-3">
                <Input
                  {...register('logo_url_light')}
                  disabled={!isSuper}
                  placeholder="https://example.com/logo-light.png"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <RoleGate role="SUPER_ADMIN">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const result = await uploadMedia.mutateAsync(file);
                            setValue('logo_url_light', result.url);
                          } catch (error) {
                            console.error('Upload failed:', error);
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadMedia.isPending}
                    />
                    <Button size="sm" variant="outline" className="border-gray-600" disabled={uploadMedia.isPending}>
                      {uploadMedia.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                </RoleGate>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Dark Logo</Label>
              <div className="flex items-center space-x-3">
                <Input
                  {...register('logo_url_dark')}
                  disabled={!isSuper}
                  placeholder="https://example.com/logo-dark.png"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <RoleGate role="SUPER_ADMIN">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const result = await uploadMedia.mutateAsync(file);
                            setValue('logo_url_dark', result.url);
                          } catch (error) {
                            console.error('Upload failed:', error);
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadMedia.isPending}
                    />
                    <Button size="sm" variant="outline" className="border-gray-600" disabled={uploadMedia.isPending}>
                      {uploadMedia.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                </RoleGate>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Favicon</Label>
              <div className="flex items-center space-x-3">
                <Input
                  {...register('favicon_url')}
                  disabled={!isSuper}
                  placeholder="https://example.com/favicon.ico"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <RoleGate role="SUPER_ADMIN">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const result = await uploadMedia.mutateAsync(file);
                            setValue('favicon_url', result.url);
                          } catch (error) {
                            console.error('Upload failed:', error);
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadMedia.isPending}
                    />
                    <Button size="sm" variant="outline" className="border-gray-600" disabled={uploadMedia.isPending}>
                      {uploadMedia.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                </RoleGate>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6 bg-surface border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
          <div className="space-y-4">
            <div 
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: watchedValues.theme_surface,
                borderColor: (watchedValues.theme_primary || '#000') + '40'
              }}
            >
              <h4 
                className="font-bold text-lg"
                style={{ color: watchedValues.theme_primary }}
              >
                {watchedValues.site_name || 'Site Name'}
              </h4>
              <p className="text-gray-300 text-sm">{watchedValues.tagline || 'Tagline'}</p>
            </div>
            
            <div className="flex space-x-2">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: watchedValues.theme_primary }}
                title="Primary"
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: watchedValues.theme_bg }}
                title="Background"
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: watchedValues.theme_surface }}
                title="Surface"
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {!isSuper && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <p className="text-yellow-400 text-sm">
            ℹ️ You have read-only access to brand settings. Contact a Super Admin to make changes.
          </p>
        </Card>
      )}
    </div>
  );
}