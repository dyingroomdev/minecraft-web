import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { HeroSlide, ServerFeature } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface HeroSlideForm {
  title: string;
  subtitle?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  display_order: number;
  is_active: boolean;
}

interface ServerFeatureForm {
  title: string;
  description: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

export function AdminContent() {
  const queryClient = useQueryClient();
  const { data: slides } = useQuery({ queryKey: ['admin-hero-slides'], queryFn: () => apiClient.getHeroSlidesAdmin() });
  const { data: features } = useQuery({ queryKey: ['admin-server-features'], queryFn: () => apiClient.getServerFeaturesAdmin() });

  const [slideForm, setSlideForm] = useState<HeroSlideForm>({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_url: '',
    display_order: 0,
    is_active: true,
  });

  const [featureForm, setFeatureForm] = useState<ServerFeatureForm>({
    title: '',
    description: '',
    icon: '',
    display_order: 0,
    is_active: true,
  });

  const resetSlideForm = () =>
    setSlideForm({
      title: '',
      subtitle: '',
      image_url: '',
      button_text: '',
      button_url: '',
      display_order: 0,
      is_active: true,
    });

  const resetFeatureForm = () =>
    setFeatureForm({
      title: '',
      description: '',
      icon: '',
      display_order: 0,
      is_active: true,
    });

  const invalidateContent = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
    queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    queryClient.invalidateQueries({ queryKey: ['admin-server-features'] });
    queryClient.invalidateQueries({ queryKey: ['server-features'] });
  };

  const toUndefined = (value: string | undefined) => (value && value.trim() === '' ? undefined : value);

  const createSlideMutation = useMutation({
    mutationFn: () =>
      apiClient.createHeroSlide({
        ...slideForm,
        subtitle: toUndefined(slideForm.subtitle),
        image_url: toUndefined(slideForm.image_url),
        button_text: toUndefined(slideForm.button_text),
        button_url: toUndefined(slideForm.button_url),
      }),
    onSuccess: () => {
      invalidateContent();
      resetSlideForm();
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HeroSlide> }) =>
      apiClient.updateHeroSlide(id, {
        ...data,
        subtitle: toUndefined(data.subtitle ?? undefined),
        image_url: toUndefined(data.image_url ?? undefined),
        button_text: toUndefined(data.button_text ?? undefined),
        button_url: toUndefined(data.button_url ?? undefined),
      }),
    onSuccess: invalidateContent,
  });

  const deleteSlideMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteHeroSlide(id),
    onSuccess: invalidateContent,
  });

  const createFeatureMutation = useMutation({
    mutationFn: () =>
      apiClient.createServerFeature({
        ...featureForm,
        icon: toUndefined(featureForm.icon),
      }),
    onSuccess: () => {
      invalidateContent();
      resetFeatureForm();
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServerFeature> }) =>
      apiClient.updateServerFeature(id, {
        ...data,
        icon: toUndefined(data.icon ?? undefined),
      }),
    onSuccess: invalidateContent,
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteServerFeature(id),
    onSuccess: invalidateContent,
  });

  return (
    <div className="space-y-10">
      <section>
        <header className="mb-6 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Homepage Content</h1>
          <p className="text-muted-foreground">
            Manage hero slider entries and highlight cards. Updates are reflected instantly on the public site.
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add hero slide</CardTitle>
            <CardDescription>Provide titles, imagery, and optional call-to-action button.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                createSlideMutation.mutate();
              }}
            >
              <div>
                <Label htmlFor="slide-title">Title</Label>
                <Input
                  id="slide-title"
                  value={slideForm.title}
                  onChange={(event) => setSlideForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slide-subtitle">Subtitle</Label>
                <Input
                  id="slide-subtitle"
                  value={slideForm.subtitle}
                  onChange={(event) => setSlideForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="slide-image">Background image URL</Label>
                <Input
                  id="slide-image"
                  type="url"
                  value={slideForm.image_url}
                  onChange={(event) => setSlideForm((prev) => ({ ...prev, image_url: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="slide-button-text">Button text</Label>
                  <Input
                    id="slide-button-text"
                    value={slideForm.button_text ?? ''}
                    onChange={(event) => setSlideForm((prev) => ({ ...prev, button_text: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="slide-button-url">Button URL</Label>
                  <Input
                    id="slide-button-url"
                    value={slideForm.button_url ?? ''}
                    onChange={(event) => setSlideForm((prev) => ({ ...prev, button_url: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="slide-order">Display order</Label>
                  <Input
                    id="slide-order"
                    type="number"
                    value={slideForm.display_order}
                    onChange={(event) => setSlideForm((prev) => ({ ...prev, display_order: Number(event.target.value) }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="slide-active"
                    type="checkbox"
                    checked={slideForm.is_active}
                    onChange={(event) => setSlideForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                  <Label htmlFor="slide-active">Active</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createSlideMutation.isLoading}>
                  {createSlideMutation.isLoading ? 'Saving…' : 'Add slide'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetSlideForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {slides?.map((slide) => (
            <Card key={slide.id}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{slide.title}</CardTitle>
                  {slide.subtitle ? (
                    <CardDescription>{slide.subtitle}</CardDescription>
                  ) : null}
                </div>
                <Badge variant={slide.is_active ? 'secondary' : 'outline'}>
                  {slide.is_active ? 'Active' : 'Hidden'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {slide.image_url ? (
                  <p>Background: {slide.image_url}</p>
                ) : null}
                {slide.button_url ? (
                  <p>Button: {slide.button_text || 'Learn more'} → {slide.button_url}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSlideMutation.mutate({
                        id: slide.id,
                        data: { is_active: !slide.is_active },
                      })
                    }
                  >
                    {slide.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteSlideMutation.mutate(slide.id)
                    }
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Add server feature</CardTitle>
            <CardDescription>Highlight core gameplay experiences and perks.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                createFeatureMutation.mutate();
              }}
            >
              <div>
                <Label htmlFor="feature-title">Title</Label>
                <Input
                  id="feature-title"
                  value={featureForm.title}
                  onChange={(event) => setFeatureForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="feature-description">Description</Label>
                <Textarea
                  id="feature-description"
                  value={featureForm.description}
                  onChange={(event) => setFeatureForm((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="feature-icon">Icon (Lucide name)</Label>
                  <Input
                    id="feature-icon"
                    value={featureForm.icon ?? ''}
                    onChange={(event) => setFeatureForm((prev) => ({ ...prev, icon: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="feature-order">Display order</Label>
                  <Input
                    id="feature-order"
                    type="number"
                    value={featureForm.display_order}
                    onChange={(event) => setFeatureForm((prev) => ({ ...prev, display_order: Number(event.target.value) }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="feature-active"
                    type="checkbox"
                    checked={featureForm.is_active}
                    onChange={(event) => setFeatureForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                  <Label htmlFor="feature-active">Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createFeatureMutation.isLoading}>
                  {createFeatureMutation.isLoading ? 'Saving…' : 'Add feature'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetFeatureForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {features?.map((feature) => (
            <Card key={feature.id}>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.icon || 'Default icon'}</CardDescription>
                </div>
                <Badge variant={feature.is_active ? 'secondary' : 'outline'}>
                  {feature.is_active ? 'Active' : 'Hidden'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{feature.description}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateFeatureMutation.mutate({
                        id: feature.id,
                        data: { is_active: !feature.is_active },
                      })
                    }
                  >
                    {feature.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFeatureMutation.mutate(feature.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
