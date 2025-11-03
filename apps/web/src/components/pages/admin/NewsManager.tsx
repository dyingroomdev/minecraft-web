import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { useNews, useCreateNews, useUpdateNews, useDeleteNews, type NewsPost } from '../../../hooks/useNews';
import { useAdmin } from '../../../contexts/AdminContext';
import { useUploadMedia } from '../../../hooks/useMedia';
import { Loader2, Plus, Edit, Trash2, Pin, FileText, Calendar, Eye, EyeOff, Upload, X } from 'lucide-react';

interface NewsForm {
  slug?: string;
  title: string;
  summary?: string;
  content: string;
  published_at?: string;
  scheduled_publish_at?: string;
  cover_image_url?: string;
  is_pinned: boolean;
  is_draft: boolean;
}

export default function NewsManager() {
  const { user } = useAdmin();
  const { data: news, isLoading, error, refetch } = useNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const uploadMedia = useUploadMedia();
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<NewsForm>();
  
  const coverImageUrl = watch('cover_image_url');

  const onSubmit = (data: NewsForm) => {
    if (isReadOnly) return;
    
    if (editingNews) {
      updateNews.mutate({ id: editingNews.id, ...data });
    } else {
      createNews.mutate(data);
    }
    
    reset();
    setEditingNews(null);
    setShowForm(false);
  };

  const handleEdit = (newsPost: NewsPost) => {
    setEditingNews(newsPost);
    setShowForm(true);
    setUploadedImageUrl('');
    reset({
      slug: newsPost.slug,
      title: newsPost.title,
      summary: newsPost.summary || '',
      content: newsPost.content,
      published_at: newsPost.published_at ? newsPost.published_at.split('T')[0] : '',
      scheduled_publish_at: newsPost.scheduled_publish_at ? newsPost.scheduled_publish_at.split('T')[0] : '',
      cover_image_url: newsPost.cover_image_url || '',
      is_pinned: newsPost.is_pinned,
      is_draft: newsPost.is_draft
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly || !confirm('Are you sure you want to delete this news post?')) return;
    deleteNews.mutate(id);
  };

  const handleCancel = () => {
    setEditingNews(null);
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
      setValue('cover_image_url', result.url);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const clearUploadedImage = () => {
    setUploadedImageUrl('');
    setValue('cover_image_url', '');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
        <p className="text-red-400 mb-4">Failed to load news</p>
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
          <h1 className="text-2xl font-bold text-on">News Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage news posts and announcements
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add News
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
            {editingNews ? 'Edit News Post' : 'Add New News Post'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="News title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  className="bg-surface2 border-gray-600"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                {...register('summary')}
                className="bg-surface2 border-gray-600 min-h-[80px]"
                placeholder="Brief summary for previews"
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...register('content', { required: 'Content is required' })}
                className="bg-surface2 border-gray-600 min-h-[200px]"
                placeholder="Full article content (supports markdown)"
              />
              {errors.content && (
                <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cover_image_url">Featured Image *</Label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    id="cover_image_url"
                    {...register('cover_image_url', { required: 'Featured image is required' })}
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
                
                {coverImageUrl && !uploadedImageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-surface2 rounded border border-gray-600">
                    <img src={coverImageUrl} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    <span className="text-sm text-gray-300">Current image</span>
                  </div>
                )}
              </div>
              {errors.cover_image_url && (
                <p className="text-red-400 text-sm mt-1">{errors.cover_image_url.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="published_at">Published Date</Label>
                <Input
                  id="published_at"
                  {...register('published_at')}
                  className="bg-surface2 border-gray-600"
                  type="date"
                />
              </div>

              <div>
                <Label htmlFor="scheduled_publish_at">Scheduled Publish</Label>
                <Input
                  id="scheduled_publish_at"
                  {...register('scheduled_publish_at')}
                  className="bg-surface2 border-gray-600"
                  type="date"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  {...register('is_pinned')}
                  className="rounded border-gray-600 bg-surface2"
                />
                <Label htmlFor="is_pinned">Pin to top</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_draft"
                  {...register('is_draft')}
                  className="rounded border-gray-600 bg-surface2"
                />
                <Label htmlFor="is_draft">Save as draft</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createNews.isPending || updateNews.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createNews.isPending || updateNews.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingNews ? 'Update' : 'Create'}
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

      {/* News List */}
      {news?.length === 0 ? (
        <Card className="bg-surface border-gray-700 p-8 text-center">
          <p className="text-gray-400">No news posts created yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {news?.map((newsPost) => (
            <Card key={newsPost.id} className="bg-surface border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-on">{newsPost.title}</h3>
                    <div className="flex items-center gap-2">
                      {newsPost.is_pinned && (
                        <Badge className="bg-brand/20 text-brand">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {newsPost.is_draft ? (
                        <Badge variant="outline" className="text-gray-400">
                          <FileText className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400">
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {newsPost.summary && (
                    <p className="text-gray-300 mb-3">{newsPost.summary}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Slug: {newsPost.slug}</span>
                    {newsPost.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Published: {formatDate(newsPost.published_at)}</span>
                      </div>
                    )}
                    {newsPost.scheduled_publish_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Scheduled: {formatDate(newsPost.scheduled_publish_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(newsPost)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(newsPost.id)}
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