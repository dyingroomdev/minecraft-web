import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide, type HeroSlide } from '../../../hooks/useHeroSlides';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Plus, Edit, Trash2, Image, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

interface SlideForm {
  title: string;
  subtitle?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  display_order: number;
  is_active: boolean;
}

export default function HeroSlidesManager() {
  const { user } = useAdmin();
  const { data: slides, isLoading, error, refetch } = useHeroSlides();
  const createSlide = useCreateHeroSlide();
  const updateSlide = useUpdateHeroSlide();
  const deleteSlide = useDeleteHeroSlide();
  
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SlideForm>();

  const onSubmit = (data: SlideForm) => {
    if (isReadOnly) return;
    
    if (editingSlide) {
      updateSlide.mutate({ id: editingSlide.id, ...data });
    } else {
      createSlide.mutate(data);
    }
    
    reset();
    setEditingSlide(null);
    setShowForm(false);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setShowForm(true);
    reset({
      title: slide.title,
      subtitle: slide.subtitle || '',
      image_url: slide.image_url || '',
      button_text: slide.button_text || '',
      button_url: slide.button_url || '',
      display_order: slide.display_order,
      is_active: slide.is_active
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly || !confirm('Are you sure you want to delete this slide?')) return;
    deleteSlide.mutate(id);
  };

  const handleCancel = () => {
    setEditingSlide(null);
    setShowForm(false);
    reset();
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
        <p className="text-red-400 mb-4">Failed to load hero slides</p>
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
          <h1 className="text-2xl font-bold text-on">Hero Slides</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage homepage hero slider content
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-surface border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-on mb-4">
            {editingSlide ? 'Edit Slide' : 'Add New Slide'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="Slide title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  {...register('subtitle')}
                  className="bg-surface2 border-gray-600"
                  placeholder="Optional subtitle"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                {...register('image_url')}
                className="bg-surface2 border-gray-600"
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  {...register('button_text')}
                  className="bg-surface2 border-gray-600"
                  placeholder="Learn More"
                />
              </div>

              <div>
                <Label htmlFor="button_url">Button URL</Label>
                <Input
                  id="button_url"
                  {...register('button_url')}
                  className="bg-surface2 border-gray-600"
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  {...register('display_order', { valueAsNumber: true })}
                  className="bg-surface2 border-gray-600"
                  type="number"
                  min="0"
                  defaultValue={0}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="rounded border-gray-600 bg-surface2"
                  defaultChecked={true}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createSlide.isPending || updateSlide.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createSlide.isPending || updateSlide.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingSlide ? 'Update' : 'Create'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Slides List */}
      <div className="grid grid-cols-1 gap-4">
        {slides?.map((slide) => (
          <Card key={slide.id} className="bg-surface border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-on">{slide.title}</h3>
                  <div className="flex items-center gap-2">
                    {slide.is_active ? (
                      <Eye className="h-4 w-4 text-brand" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-400">Order: {slide.display_order}</span>
                  </div>
                </div>
                
                {slide.subtitle && (
                  <p className="text-gray-300 mb-2">{slide.subtitle}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {slide.image_url && (
                    <div className="flex items-center gap-1">
                      <Image className="h-4 w-4" />
                      <span>Has image</span>
                    </div>
                  )}
                  {slide.button_text && (
                    <span>Button: {slide.button_text}</span>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(slide)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(slide.id)}
                    disabled={deleteSlide.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {slides?.length === 0 && (
        <Card className="bg-surface border-gray-700 p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-on mb-2">No hero slides</h3>
          <p className="text-gray-400 mb-4">Create your first hero slide to get started</p>
          {!isReadOnly && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-brand hover:bg-brand/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Slide
            </Button>
          )}
        </Card>
      )}

      {isReadOnly && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30 p-4">
          <p className="text-yellow-400 text-sm">
            ℹ️ You have read-only access to hero slides. Contact a Super Admin to make changes.
          </p>
        </Card>
      )}
    </div>
  );
}