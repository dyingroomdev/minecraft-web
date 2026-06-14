import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useFeatures, useCreateFeature, useUpdateFeature, useDeleteFeature, type ServerFeature } from '../../../hooks/useFeatures';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Plus, Edit, Trash2, Star, Eye, EyeOff, Sparkles } from 'lucide-react';

interface FeatureForm {
  title: string;
  description: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

export default function FeaturesManager() {
  const { user } = useAdmin();
  const { data: features, isLoading, error, refetch } = useFeatures();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();
  
  const [editingFeature, setEditingFeature] = useState<ServerFeature | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FeatureForm>();

  const onSubmit = (data: FeatureForm) => {
    if (isReadOnly) return;
    
    if (editingFeature) {
      updateFeature.mutate({ id: editingFeature.id, ...data });
    } else {
      createFeature.mutate(data);
    }
    
    reset();
    setEditingFeature(null);
    setShowForm(false);
  };

  const handleEdit = (feature: ServerFeature) => {
    setEditingFeature(feature);
    setShowForm(true);
    reset({
      title: feature.title,
      description: feature.description,
      icon: feature.icon || '',
      display_order: feature.display_order,
      is_active: feature.is_active
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly || !confirm('Are you sure you want to delete this feature?')) return;
    deleteFeature.mutate(id);
  };

  const handleCancel = () => {
    setEditingFeature(null);
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
        <p className="text-red-400 mb-4">Failed to load features</p>
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
          <h1 className="text-2xl font-bold text-on">Server Features</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage homepage server feature highlights
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-surface border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-on mb-4">
            {editingFeature ? 'Edit Feature' : 'Add New Feature'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                className="bg-surface2 border-gray-600"
                placeholder="Feature title"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                className="bg-surface2 border-gray-600"
                placeholder="Describe this server feature..."
                rows={3}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon (Optional)</Label>
                <Input
                  id="icon"
                  {...register('icon')}
                  className="bg-surface2 border-gray-600"
                  placeholder="e.g., star, shield, zap"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Lucide icon name or emoji
                </p>
              </div>

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
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-gray-600 bg-surface2"
                defaultChecked={true}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createFeature.isPending || updateFeature.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createFeature.isPending || updateFeature.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingFeature ? 'Update' : 'Create'}
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

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features?.map((feature) => (
          <Card key={feature.id} className="bg-surface border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {feature.icon ? (
                  <div className="w-8 h-8 bg-brand/20 rounded-lg flex items-center justify-center">
                    <span className="text-brand text-sm">{feature.icon}</span>
                  </div>
                ) : (
                  <Sparkles className="h-8 w-8 text-brand" />
                )}
                
                <div>
                  <h3 className="text-lg font-semibold text-on">{feature.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {feature.is_active ? (
                      <Eye className="h-3 w-3 text-brand" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                    <span>Order: {feature.display_order}</span>
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(feature)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(feature.id)}
                    disabled={deleteFeature.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              {feature.description}
            </p>
          </Card>
        ))}
      </div>

      {features?.length === 0 && (
        <Card className="bg-surface border-gray-700 p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-on mb-2">No server features</h3>
          <p className="text-gray-400 mb-4">Create your first server feature to get started</p>
          {!isReadOnly && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-brand hover:bg-brand/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Feature
            </Button>
          )}
        </Card>
      )}

      {isReadOnly && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30 p-4">
          <p className="text-yellow-400 text-sm">
            ℹ️ You have read-only access to server features. Contact a Super Admin to make changes.
          </p>
        </Card>
      )}
    </div>
  );
}