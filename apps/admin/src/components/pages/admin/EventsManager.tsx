import { ImagePlus, Loader2, Plus, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AdminIcon, faCalendarDays } from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { useAdmin } from '@/contexts/AdminContext';
import { type Event, useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from '@/hooks/useEvents';
import { useUploadMedia } from '@/hooks/useMedia';
import { resolveMediaUrl } from '@/lib/media';

type EventForm = {
  slug: string;
  title: string;
  description: string;
  featured_image_url?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  is_active: boolean;
};

const EMPTY_FORM: EventForm = { slug: '', title: '', description: '', is_active: false };

function eventStatus(event: Event) {
  const now = Date.now();
  const start = event.start_at ? new Date(event.start_at).getTime() : null;
  const end = event.end_at ? new Date(event.end_at).getTime() : null;
  if (event.is_active && (!end || end >= now) && (!start || start <= now)) return 'Live';
  if (start && start > now) return 'Upcoming';
  return event.is_active ? 'Active' : 'Inactive';
}

export default function EventsManager() {
  const { user } = useAdmin();
  const { data: events = [], isLoading, error, refetch } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const uploadMedia = useUploadMedia();
  const [editing, setEditing] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset, setError, setValue, watch, formState: { errors } } = useForm<EventForm>({ defaultValues: EMPTY_FORM });
  const isReadOnly = user?.role === 'ADMIN';
  const featuredImageUrl = watch('featured_image_url');

  const openEdit = (event: Event) => {
    setEditing(event);
    reset({
      slug: event.slug,
      title: event.title,
      description: event.description,
      featured_image_url: event.featured_image_url ?? '',
      start_at: event.start_at?.slice(0, 16) ?? '',
      end_at: event.end_at?.slice(0, 16) ?? '',
      location: event.location ?? '',
      is_active: event.is_active,
    });
    setShowForm(true);
  };

  const onSubmit = (data: EventForm) => {
    if (isReadOnly) return;
    if (data.start_at && data.end_at && new Date(data.end_at) < new Date(data.start_at)) {
      setError('end_at', { message: 'End date must be after the start date' });
      return;
    }
    const payload = {
      ...data,
      featured_image_url: data.featured_image_url?.trim() || undefined,
      start_at: data.start_at || undefined,
      end_at: data.end_at || undefined,
      location: data.location?.trim() || undefined,
    };
    const closeForm = () => {
      setEditing(null);
      setShowForm(false);
      reset(EMPTY_FORM);
    };
    if (editing) updateEvent.mutate({ id: editing.id, ...payload }, { onSuccess: closeForm });
    else createEvent.mutate(payload, { onSuccess: closeForm });
  };

  const uploadFeaturedImage = async (file: File) => {
    try {
      const result = await uploadMedia.mutateAsync(file);
      setValue('featured_image_url', result.url, { shouldDirty: true, shouldValidate: true });
      toast.success('Event image uploaded');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Events"
        subtitle="Schedule and manage server events"
        actions={!isReadOnly ? <button className="control-btn control-btn-primary" onClick={() => { setEditing(null); reset(EMPTY_FORM); setShowForm(true); }}><Plus size={14} /> Create Event</button> : null}
      />
      {isReadOnly ? <div className="control-readonly-notice">You have read-only access. A super administrator must change events.</div> : null}

      {showForm ? (
        <ControlPanel title={editing ? 'Edit Event' : 'Create Event'} icon={<AdminIcon icon={faCalendarDays} />}>
          <form className="control-form-panel" onSubmit={handleSubmit(onSubmit)}>
            <div className="control-form-grid">
              <div className="control-form-group">
                <label htmlFor="event-title">Event Title *</label>
                <input id="event-title" {...register('title', { required: 'Title is required' })} placeholder="Guild War Championship" />
                {errors.title ? <div className="text-red-400 text-xs mt-1">{errors.title.message}</div> : null}
              </div>
              <div className="control-form-group">
                <label htmlFor="event-slug">Slug *</label>
                <input id="event-slug" {...register('slug', { required: 'Slug is required' })} placeholder="guild-war-championship" />
              </div>
            </div>
            <div className="control-form-group">
              <label htmlFor="event-description">Description *</label>
              <textarea id="event-description" {...register('description', { required: 'Description is required' })} placeholder="Describe this event..." />
            </div>
            <div className="control-form-grid">
              <div className="control-form-group"><label htmlFor="event-start">Starts</label><input id="event-start" type="datetime-local" {...register('start_at')} /></div>
              <div className="control-form-group">
                <label htmlFor="event-end">Ends</label>
                <input id="event-end" type="datetime-local" {...register('end_at')} />
                {errors.end_at ? <div className="text-red-400 text-xs mt-1">{errors.end_at.message}</div> : null}
              </div>
              <div className="control-form-group"><label htmlFor="event-location">Location</label><input id="event-location" {...register('location')} placeholder="PvP Arena" /></div>
              <div className="control-form-group">
                <label>Featured Image</label>
                <div className="control-news-image-uploader">
                  {featuredImageUrl ? (
                    <div className="control-news-image-preview">
                      <img src={resolveMediaUrl(featuredImageUrl)} alt="Event preview" />
                      {!isReadOnly ? (
                        <button
                          type="button"
                          className="control-image-remove"
                          aria-label="Remove event image"
                          onClick={() => setValue('featured_image_url', '', { shouldDirty: true })}
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="control-news-image-placeholder"><ImagePlus size={24} /><span>No event image selected</span></div>
                  )}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      className="control-btn control-btn-ghost"
                      disabled={uploadMedia.isPending}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {uploadMedia.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {featuredImageUrl ? 'Replace Image' : 'Upload Image'}
                    </button>
                  ) : null}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadFeaturedImage(file);
                    }}
                  />
                </div>
                <details className="control-image-url-details">
                  <summary>Use an image URL instead</summary>
                  <input id="event-image" {...register('featured_image_url')} placeholder="/api/media/event.png" />
                </details>
              </div>
            </div>
            <label><input type="checkbox" {...register('is_active')} /> Event is active</label>
            <div className="control-form-actions">
              <button className="control-btn control-btn-primary" disabled={createEvent.isPending || updateEvent.isPending}>{editing ? 'Update Event' : 'Create Event'}</button>
              <button className="control-btn control-btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </ControlPanel>
      ) : null}

      <ControlPanel title="All Events" icon={<AdminIcon icon={faCalendarDays} />}>
        {isLoading ? (
          <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading events...</div>
        ) : error ? (
          <div className="control-error-state"><span>Failed to load events.</span><button className="control-btn control-btn-ghost" onClick={() => refetch()}>Retry</button></div>
        ) : events.length === 0 ? (
          <ControlEmpty icon={<AdminIcon icon={faCalendarDays} />} text="No events have been scheduled." />
        ) : (
          <div className="control-table-wrap">
            <table className="control-data-table">
              <thead><tr><th>Event</th><th>Location</th><th>Dates</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td><strong>{event.title}</strong><div className="subline">{event.slug}</div></td>
                    <td>{event.location || 'Server-wide'}</td>
                    <td>{event.start_at ? new Date(event.start_at).toLocaleDateString() : 'TBD'}{event.end_at ? ` – ${new Date(event.end_at).toLocaleDateString()}` : ''}</td>
                    <td><ControlStatusBadge status={eventStatus(event)} /></td>
                    <td>{new Date(event.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="control-row-action" onClick={() => openEdit(event)}>Edit</button>
                      {!isReadOnly ? <button className="control-row-action reject" onClick={() => confirm('Delete this event?') && deleteEvent.mutate(event.id)}>Delete</button> : null}
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
