import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, type Event } from '../../../hooks/useEvents';
import { useAdmin } from '../../../contexts/AdminContext';
import { useUploadMedia } from '../../../hooks/useMedia';
import { Loader2, Plus, Edit, Trash2, Calendar, MapPin, Eye, EyeOff, Upload, X, Image } from 'lucide-react';

interface EventForm {
  slug: string;
  title: string;
  description: string;
  featured_image_url?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  is_active: boolean;
}

export default function EventsManager() {
  const { user } = useAdmin();
  const { data: events, isLoading, error, refetch } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const uploadMedia = useUploadMedia();
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EventForm>();
  
  const featuredImageUrl = watch('featured_image_url');

  const onSubmit = (data: EventForm) => {
    if (isReadOnly) return;
    
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...data });
    } else {
      createEvent.mutate(data);
    }
    
    reset();
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
    setUploadedImageUrl('');
    reset({
      slug: event.slug,
      title: event.title,
      description: event.description,
      featured_image_url: event.featured_image_url || '',
      start_at: event.start_at ? event.start_at.split('T')[0] : '',
      end_at: event.end_at ? event.end_at.split('T')[0] : '',
      location: event.location || '',
      is_active: event.is_active
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly || !confirm('Are you sure you want to delete this event?')) return;
    deleteEvent.mutate(id);
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setShowForm(false);
    setUploadedImageUrl('');
    reset();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadMedia.mutateAsync(file);
      setUploadedImageUrl(result.url);
      setValue('featured_image_url', result.url);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const clearUploadedImage = () => {
    setUploadedImageUrl('');
    setValue('featured_image_url', '');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <p className="text-red-400 mb-4">Failed to load events</p>
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
          <h1 className="text-2xl font-bold text-on">Events Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage server events and activities
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            You have read-only access. Contact a SUPER_ADMIN to make changes.
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="bg-surface border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-on mb-4">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="Event title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug', { required: 'Slug is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="event-slug"
                />
                {errors.slug && (
                  <p className="text-red-400 text-sm mt-1">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                className="bg-surface2 border-gray-600 min-h-[120px]"
                placeholder="Event description"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="featured_image_url">Featured Image</Label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    id="featured_image_url"
                    {...register('featured_image_url')}
                    className="bg-surface2 border-gray-600 flex-1"
                    placeholder="https://example.com/image.jpg or upload below"
                    type="url"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadMedia.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadMedia.isPending}
                      className="border-gray-600"
                    >
                      {uploadMedia.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {uploadedImageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-surface2 rounded border border-gray-600">
                    <img src={uploadedImageUrl} alt="Uploaded" className="w-12 h-12 object-cover rounded" />
                    <span className="text-sm text-gray-300 flex-1">Image uploaded successfully</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={clearUploadedImage}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {featuredImageUrl && !uploadedImageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-surface2 rounded border border-gray-600">
                    <img src={featuredImageUrl} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    <span className="text-sm text-gray-300">Current image</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_at">Start Date</Label>
                <Input
                  id="start_at"
                  {...register('start_at')}
                  className="bg-surface2 border-gray-600"
                  type="date"
                />
              </div>

              <div>
                <Label htmlFor="end_at">End Date</Label>
                <Input
                  id="end_at"
                  {...register('end_at')}
                  className="bg-surface2 border-gray-600"
                  type="date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                className="bg-surface2 border-gray-600"
                placeholder="Event location"
              />
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
                disabled={createEvent.isPending || updateEvent.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createEvent.isPending || updateEvent.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingEvent ? 'Update' : 'Create'}
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

      {/* Events List */}
      {events?.length === 0 ? (
        <Card className="bg-surface border-gray-700 p-8 text-center">
          <p className="text-gray-400">No events created yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events?.map((event) => (
            <Card key={event.id} className="bg-surface border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-on">{event.title}</h3>
                    {event.is_active ? (
                      <Badge className="bg-brand/20 text-brand">
                        <Eye className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-3">{event.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {event.featured_image_url && (
                      <div className="flex items-center gap-1">
                        <Image className="h-4 w-4" />
                        <span>Has image</span>
                      </div>
                    )}
                    {event.start_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {formatDate(event.start_at)}</span>
                      </div>
                    )}
                    {event.end_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>End: {formatDate(event.end_at)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(event.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}