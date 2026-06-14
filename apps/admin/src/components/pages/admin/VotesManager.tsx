import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useVotes, useCreateVote, useUpdateVote, useDeleteVote, type VoteLink } from '../../../hooks/useVotes';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Plus, Edit, Trash2, Vote, Eye, EyeOff, ExternalLink, Gift } from 'lucide-react';

interface VoteForm {
  title: string;
  description?: string;
  url: string;
  button_text: string;
  rewards: string;
  display_order: number;
  is_active: boolean;
}

export default function VotesManager() {
  const { user } = useAdmin();
  const { data: votes, isLoading, error, refetch } = useVotes();
  const createVote = useCreateVote();
  const updateVote = useUpdateVote();
  const deleteVote = useDeleteVote();
  
  const [editingVote, setEditingVote] = useState<VoteLink | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VoteForm>();

  const onSubmit = (data: VoteForm) => {
    if (isReadOnly) return;
    
    const voteData = {
      ...data,
      rewards: data.rewards.split(',').map(r => r.trim()).filter(Boolean)
    };
    
    if (editingVote) {
      updateVote.mutate({ id: editingVote.id, ...voteData });
    } else {
      createVote.mutate(voteData);
    }
    
    reset();
    setEditingVote(null);
    setShowForm(false);
  };

  const handleEdit = (vote: VoteLink) => {
    setEditingVote(vote);
    setShowForm(true);
    reset({
      title: vote.title,
      description: vote.description || '',
      url: vote.url,
      button_text: vote.button_text,
      rewards: vote.rewards.join(', '),
      display_order: vote.display_order,
      is_active: vote.is_active
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly || !confirm('Are you sure you want to delete this vote link?')) return;
    deleteVote.mutate(id);
  };

  const handleCancel = () => {
    setEditingVote(null);
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
        <p className="text-red-400 mb-4">Failed to load vote links</p>
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
          <h1 className="text-2xl font-bold text-on">Vote Links</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage voting sites and rewards for players
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vote Link
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-surface border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-on mb-4">
            {editingVote ? 'Edit Vote Link' : 'Add New Vote Link'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="Vote site name"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="button_text">Button Text *</Label>
                <Input
                  id="button_text"
                  {...register('button_text', { required: 'Button text is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="Vote Now"
                />
                {errors.button_text && (
                  <p className="text-red-400 text-sm mt-1">{errors.button_text.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="url">Vote URL *</Label>
              <Input
                id="url"
                {...register('url', { required: 'URL is required' })}
                className="bg-surface2 border-gray-600"
                placeholder="https://vote-site.com/server/123"
                type="url"
              />
              {errors.url && (
                <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                className="bg-surface2 border-gray-600"
                placeholder="Optional description of the voting site..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="rewards">Rewards</Label>
              <Input
                id="rewards"
                {...register('rewards')}
                className="bg-surface2 border-gray-600"
                placeholder="$100, 5 diamonds, vote key"
              />
              <p className="text-gray-400 text-xs mt-1">
                Comma-separated list of rewards
              </p>
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
                disabled={createVote.isPending || updateVote.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createVote.isPending || updateVote.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingVote ? 'Update' : 'Create'}
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

      {/* Vote Links List */}
      <div className="grid grid-cols-1 gap-4">
        {votes?.map((vote) => (
          <Card key={vote.id} className="bg-surface border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Vote className="h-5 w-5 text-brand" />
                  <h3 className="text-lg font-semibold text-on">{vote.title}</h3>
                  <div className="flex items-center gap-2">
                    {vote.is_active ? (
                      <Eye className="h-4 w-4 text-brand" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-400">Order: {vote.display_order}</span>
                  </div>
                </div>
                
                {vote.description && (
                  <p className="text-gray-300 mb-3">{vote.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={vote.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-brand transition-colors"
                    >
                      {vote.url}
                    </a>
                  </div>
                  <span>Button: {vote.button_text}</span>
                </div>

                {vote.rewards.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Gift className="h-4 w-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Rewards:</p>
                      <div className="flex flex-wrap gap-1">
                        {vote.rewards.map((reward, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-accent/20 text-accent text-xs rounded"
                          >
                            {reward}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(vote)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(vote.id)}
                    disabled={deleteVote.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {votes?.length === 0 && (
        <Card className="bg-surface border-gray-700 p-12 text-center">
          <Vote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-on mb-2">No vote links</h3>
          <p className="text-gray-400 mb-4">Create your first vote link to get started</p>
          {!isReadOnly && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-brand hover:bg-brand/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Vote Link
            </Button>
          )}
        </Card>
      )}

      {isReadOnly && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30 p-4">
          <p className="text-yellow-400 text-sm">
            ℹ️ You have read-only access to vote links. Contact a Super Admin to make changes.
          </p>
        </Card>
      )}
    </div>
  );
}