import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { SocialLinks } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fields: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/...' },
  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'website', label: 'Website', placeholder: 'https://amzcraft.xyz' },
];

export function AdminSocial() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['social-links'],
    queryFn: () => apiClient.getSocialLinks(),
  });

  const [formData, setFormData] = useState<Record<keyof SocialLinks, string | undefined>>({
    facebook: '',
    twitter: '',
    discord: '',
    youtube: '',
    tiktok: '',
    instagram: '',
    website: '',
  });

  useEffect(() => {
    if (data) {
      setFormData({ ...data });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<SocialLinks>) => apiClient.updateSocialLinks(payload),
    onSuccess: (updated) => {
      setFormData({ ...updated });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
    },
  });

  const handleChange = (key: keyof SocialLinks, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Social Links</h1>
        <p className="text-muted-foreground">
          Update official social links. Changes propagate instantly to the public site and footer.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Community channels</CardTitle>
          <CardDescription>Leave a field blank to hide it from the public-facing widgets.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading social links…</p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    value={formData[field.key] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                  />
                </div>
              ))}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={mutation.isLoading}>
                  {mutation.isLoading ? 'Saving…' : 'Save changes'}
                </Button>
                {mutation.isSuccess ? (
                  <span className="text-sm text-lime-500">Changes saved.</span>
                ) : null}
                {mutation.isError ? (
                  <span className="text-sm text-destructive">Failed to save. Try again.</span>
                ) : null}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
