import { ImagePlus, Loader2, Plus, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AdminIcon, faNewspaper } from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAdmin } from '@/contexts/AdminContext';
import { useUploadMedia } from '@/hooks/useMedia';
import { type NewsPost, useCreateNews, useDeleteNews, useNews, useUpdateNews } from '@/hooks/useNews';
import { resolveMediaUrl } from '@/lib/media';

type NewsForm = {
  slug?: string;
  title: string;
  summary?: string;
  content: string;
  published_at?: string;
  scheduled_publish_at?: string;
  cover_image_url?: string;
  is_pinned: boolean;
  is_draft: boolean;
};

const EMPTY_FORM: NewsForm = {
  title: '',
  content: '',
  is_pinned: false,
  is_draft: false,
};

export default function NewsManager() {
  const { user } = useAdmin();
  const { data: posts = [], isLoading, error, refetch } = useNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  const uploadMedia = useUploadMedia();
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<NewsForm>({ defaultValues: EMPTY_FORM });
  const isReadOnly = user?.role === 'ADMIN';
  const coverImageUrl = watch('cover_image_url');

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (post: NewsPost) => {
    setEditing(post);
    reset({
      slug: post.slug,
      title: post.title,
      summary: post.summary ?? '',
      content: post.content,
      published_at: post.published_at?.slice(0, 16) ?? '',
      scheduled_publish_at: post.scheduled_publish_at?.slice(0, 16) ?? '',
      cover_image_url: post.cover_image_url ?? '',
      is_pinned: post.is_pinned,
      is_draft: post.is_draft,
    });
    setShowForm(true);
  };

  const onSubmit = (data: NewsForm) => {
    if (isReadOnly) return;
    const payload = {
      ...data,
      summary: data.summary?.trim() || null,
      cover_image_url: data.cover_image_url?.trim() || null,
      published_at: data.published_at || null,
      scheduled_publish_at: data.scheduled_publish_at || null,
    };
    if (editing) updateNews.mutate({ id: editing.id, ...payload });
    else createNews.mutate(payload);
    setShowForm(false);
    setEditing(null);
    reset(EMPTY_FORM);
  };

  const uploadImage = async (file: File) => {
    const result = await uploadMedia.mutateAsync(file);
    return resolveMediaUrl(result.url);
  };

  const uploadCoverImage = async (file: File) => {
    try {
      const result = await uploadMedia.mutateAsync(file);
      setValue('cover_image_url', result.url, { shouldDirty: true, shouldValidate: true });
      toast.success('Cover image uploaded');
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="News"
        subtitle="Manage community news posts and announcements"
        actions={!isReadOnly ? <button className="control-btn control-btn-primary" onClick={openCreate}><Plus size={14} /> Create Post</button> : null}
      />
      {isReadOnly ? <div className="control-readonly-notice">You have read-only access. A super administrator must publish content changes.</div> : null}

      {showForm ? (
        <ControlPanel title={editing ? 'Edit News Post' : 'Create News Post'} icon={<AdminIcon icon={faNewspaper} />}>
          <form className="control-form-panel" onSubmit={handleSubmit(onSubmit)}>
            <div className="control-form-grid">
              <div className="control-form-group">
                <label htmlFor="news-title">Title *</label>
                <input id="news-title" {...register('title', { required: 'Title is required' })} placeholder="News title" />
                {errors.title ? <div className="text-red-400 text-xs mt-1">{errors.title.message}</div> : null}
              </div>
              <div className="control-form-group">
                <label htmlFor="news-slug">Slug</label>
                <input id="news-slug" {...register('slug')} placeholder="Generated automatically when empty" />
              </div>
            </div>
            <div className="control-form-group">
              <label htmlFor="news-summary">Summary</label>
              <textarea id="news-summary" {...register('summary')} placeholder="Brief summary for previews" />
            </div>
            <div className="control-form-group">
              <label htmlFor="news-content">Content *</label>
              <Controller
                name="content"
                control={control}
                rules={{ required: 'Content is required' }}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    onUploadImage={uploadImage}
                    placeholder="Write the full announcement..."
                    disabled={isReadOnly}
                  />
                )}
              />
              {errors.content ? <div className="text-red-400 text-xs mt-1">{errors.content.message}</div> : null}
            </div>
            <div className="control-form-grid">
              <div className="control-form-group">
                <label>Cover Image</label>
                <div className="control-news-image-uploader">
                  {coverImageUrl ? (
                    <div className="control-news-image-preview">
                      <img src={resolveMediaUrl(coverImageUrl)} alt="Cover preview" />
                      {!isReadOnly ? (
                        <button
                          type="button"
                          className="control-image-remove"
                          aria-label="Remove cover image"
                          onClick={() => setValue('cover_image_url', '', { shouldDirty: true })}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="control-news-image-placeholder"><ImagePlus size={24} /><span>No cover image selected</span></div>
                  )}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      className="control-btn control-btn-ghost"
                      disabled={uploadMedia.isPending}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {uploadMedia.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {coverImageUrl ? 'Replace Image' : 'Upload Image'}
                    </button>
                  ) : null}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadCoverImage(file);
                    }}
                  />
                </div>
                <details className="control-image-url-details">
                  <summary>Use an image URL instead</summary>
                  <input id="news-image" {...register('cover_image_url')} placeholder="/api/media/news-cover.png" />
                </details>
              </div>
              <div className="control-form-group">
                <label htmlFor="news-schedule">Scheduled Publish</label>
                <input id="news-schedule" type="datetime-local" {...register('scheduled_publish_at')} />
              </div>
            </div>
            <div className="control-filter-row">
              <label><input type="checkbox" {...register('is_pinned')} /> Pinned post</label>
              <label><input type="checkbox" {...register('is_draft')} /> Save as draft</label>
            </div>
            <div className="control-form-actions">
              <button className="control-btn control-btn-primary" disabled={createNews.isPending || updateNews.isPending}>
                {editing ? 'Update Post' : 'Create Post'}
              </button>
              <button className="control-btn control-btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </ControlPanel>
      ) : null}

      <ControlPanel title="All Posts" icon={<AdminIcon icon={faNewspaper} />}>
        {isLoading ? (
          <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading news...</div>
        ) : error ? (
          <div className="control-error-state"><span>Failed to load news.</span><button className="control-btn control-btn-ghost" onClick={() => refetch()}>Retry</button></div>
        ) : posts.length === 0 ? (
          <ControlEmpty icon={<AdminIcon icon={faNewspaper} />} text="No news posts have been created." />
        ) : (
          <div className="control-table-wrap">
            <table className="control-data-table">
              <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Publish Date</th><th>Schedule</th><th>Actions</th></tr></thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td><strong>{post.title}</strong><div className="subline">{post.slug}</div></td>
                    <td><span className={`control-status-badge ${post.is_pinned ? 'info' : 'pending'}`}>{post.is_pinned ? 'Pinned' : 'Standard'}</span></td>
                    <td><ControlStatusBadge status={post.is_draft ? 'Draft' : 'Published'} /></td>
                    <td>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Not published'}</td>
                    <td>{post.scheduled_publish_at ? new Date(post.scheduled_publish_at).toLocaleString() : '—'}</td>
                    <td>
                      <button className="control-row-action" onClick={() => openEdit(post)}>Edit</button>
                      {!isReadOnly ? <button className="control-row-action reject" onClick={() => confirm('Delete this news post?') && deleteNews.mutate(post.id)}>Delete</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ControlPanel>
    </div>
  );
}
