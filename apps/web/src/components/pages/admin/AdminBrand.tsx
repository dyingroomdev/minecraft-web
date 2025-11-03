import { useState, useEffect } from 'react';
import { Save, Upload, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAdmin } from '@/contexts/AdminContext';
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
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch brand settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !isSuper) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/admin/brand', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Failed to save brand settings:', error);
      // TODO: Show error toast
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BrandSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
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

  if (!settings) {
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
            onClick={handleSave} 
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
                value={settings.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                disabled={!isSuper}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="tagline" className="text-gray-300">Tagline</Label>
              <Input
                id="tagline"
                value={settings.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                disabled={!isSuper}
                className="bg-gray-700 border-gray-600 text-white"
                maxLength={140}
              />
              <p className="text-xs text-gray-400 mt-1">
                {settings.tagline.length}/140 characters
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
                  value={settings.theme_primary}
                  onChange={(e) => handleInputChange('theme_primary', e.target.value)}
                  disabled={!isSuper}
                  className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  value={settings.theme_primary}
                  onChange={(e) => handleInputChange('theme_primary', e.target.value)}
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
                  value={settings.theme_bg}
                  onChange={(e) => handleInputChange('theme_bg', e.target.value)}
                  disabled={!isSuper}
                  className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  value={settings.theme_bg}
                  onChange={(e) => handleInputChange('theme_bg', e.target.value)}
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
                  value={settings.theme_surface}
                  onChange={(e) => handleInputChange('theme_surface', e.target.value)}
                  disabled={!isSuper}
                  className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                />
                <Input
                  value={settings.theme_surface}
                  onChange={(e) => handleInputChange('theme_surface', e.target.value)}
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
                  value={settings.logo_url_light || ''}
                  onChange={(e) => handleInputChange('logo_url_light', e.target.value)}
                  disabled={!isSuper}
                  placeholder="https://example.com/logo-light.png"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <RoleGate role="SUPER_ADMIN">
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <Upload className="w-4 h-4" />
                  </Button>
                </RoleGate>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Dark Logo</Label>
              <div className="flex items-center space-x-3">
                <Input
                  value={settings.logo_url_dark || ''}
                  onChange={(e) => handleInputChange('logo_url_dark', e.target.value)}
                  disabled={!isSuper}
                  placeholder="https://example.com/logo-dark.png"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <RoleGate role="SUPER_ADMIN">
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <Upload className="w-4 h-4" />
                  </Button>
                </RoleGate>
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Favicon</Label>
              <div className="flex items-center space-x-3">
                <Input
                  value={settings.favicon_url || ''}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  disabled={!isSuper}
                  placeholder="https://example.com/favicon.ico"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <RoleGate role="SUPER_ADMIN">
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <Upload className="w-4 h-4" />
                  </Button>
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
                backgroundColor: settings.theme_surface,
                borderColor: settings.theme_primary + '40'
              }}
            >
              <h4 
                className="font-bold text-lg"
                style={{ color: settings.theme_primary }}
              >
                {settings.site_name}
              </h4>
              <p className="text-gray-300 text-sm">{settings.tagline}</p>
            </div>
            
            <div className="flex space-x-2">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: settings.theme_primary }}
                title="Primary"
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: settings.theme_bg }}
                title="Background"
              ></div>
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: settings.theme_surface }}
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