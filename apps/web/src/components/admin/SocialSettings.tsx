import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { apiClient } from '../../lib/api';

export function SocialSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    facebook: '',
    twitter: '',
    discord: '',
    youtube: '',
    tiktok: '',
    instagram: '',
  });

  const { data: socialLinks, isLoading } = useQuery({
    queryKey: ['admin-social-links'],
    queryFn: () => apiClient.getSocialLinks(),
    onSuccess: (data) => {
      setFormData({
        facebook: data.facebook || '',
        twitter: data.twitter || '',
        discord: data.discord || '',
        youtube: data.youtube || '',
        tiktok: data.tiktok || '',
        instagram: data.instagram || '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.updateSocialLinks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (platform: string, value: string) => {
    setFormData(prev => ({ ...prev, [platform]: value }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Manage social media links displayed on the website
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(formData).map(([platform, url]) => (
              <div key={platform}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleChange(platform, e.target.value)}
                  placeholder={`https://${platform}.com/yourpage`}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            ))}
            
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}