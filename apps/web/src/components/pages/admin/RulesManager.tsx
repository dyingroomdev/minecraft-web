import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { useRules, useCreateRule, useUpdateRule, useDeleteRule, useReorderRules, type Rule } from '../../../hooks/useRules';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, Plus, Edit, Trash2, Pin, GripVertical, Save, X } from 'lucide-react';

interface RuleForm {
  title: string;
  content: string;
  category?: string;
  display_order: number;
  is_pinned: boolean;
}

export default function RulesManager() {
  const { user } = useAdmin();
  const { data: rules, isLoading, error, refetch } = useRules();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const reorderRules = useReorderRules();
  
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RuleForm>();

  const { pinnedRules, unpinnedRules } = useMemo(() => {
    if (!rules) return { pinnedRules: [], unpinnedRules: [] };
    return {
      pinnedRules: rules.filter((rule: Rule) => rule.is_pinned),
      unpinnedRules: rules.filter((rule: Rule) => !rule.is_pinned),
    };
  }, [rules]);

  const onSubmit = (data: RuleForm) => {
    if (isReadOnly) return;
    
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...data });
    } else {
      createRule.mutate(data);
    }
    
    reset();
    setEditingRule(null);
    setShowForm(false);
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setShowForm(true);
    reset({
      title: rule.title,
      content: rule.content,
      category: rule.category || '',
      display_order: rule.display_order,
      is_pinned: rule.is_pinned
    });
  };

  const handleDelete = (id: string) => {
    if (isReadOnly || !confirm('Are you sure you want to delete this rule?')) return;
    deleteRule.mutate(id);
  };

  const handleCancel = () => {
    setEditingRule(null);
    setShowForm(false);
    reset();
  };

  const handleReorder = (draggedId: string, targetId: string) => {
    if (isReadOnly || draggedId === targetId) return;
    
    const newOrder = [...unpinnedRules];
    const draggedIndex = newOrder.findIndex(rule => rule.id === draggedId);
    const targetIndex = newOrder.findIndex(rule => rule.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [draggedRule] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedRule);
    
    reorderRules.mutate(newOrder.map(rule => rule.id));
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
        <p className="text-red-400 mb-4">Failed to load rules</p>
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
          <h1 className="text-2xl font-bold text-on">Rules Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage server rules and their display order
          </p>
        </div>
        
        {!isReadOnly && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-brand hover:bg-brand/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
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
            {editingRule ? 'Edit Rule' : 'Add New Rule'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="bg-surface2 border-gray-600"
                  placeholder="Rule title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  className="bg-surface2 border-gray-600"
                  placeholder="Optional category"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...register('content', { required: 'Content is required' })}
                className="bg-surface2 border-gray-600 min-h-[120px]"
                placeholder="Rule description (supports markdown)"
              />
              {errors.content && (
                <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
              )}
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
                  id="is_pinned"
                  {...register('is_pinned')}
                  className="rounded border-gray-600 bg-surface2"
                />
                <Label htmlFor="is_pinned">Pin to top</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createRule.isPending || updateRule.isPending}
                className="bg-brand hover:bg-brand/90"
              >
                {(createRule.isPending || updateRule.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingRule ? 'Update' : 'Create'}
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

      {/* Pinned Rules */}
      {pinnedRules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-brand/20 text-brand">
              <Pin className="h-3 w-3 mr-1" />
              Pinned Rules
            </Badge>
            <span className="text-sm text-gray-400">Always shown first</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {pinnedRules.map((rule) => (
              <Card key={rule.id} className="bg-surface border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-on">{rule.title}</h3>
                      {rule.category && (
                        <Badge variant="outline" className="text-xs">
                          {rule.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{rule.content}</p>
                  </div>

                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(rule.id)}
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
        </div>
      )}

      {/* Unpinned Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on">Other Rules</h2>
          {!isReadOnly && unpinnedRules.length > 1 && (
            <p className="text-sm text-gray-400">Drag to reorder</p>
          )}
        </div>
        
        {unpinnedRules.length === 0 ? (
          <Card className="bg-surface border-gray-700 p-8 text-center">
            <p className="text-gray-400">No rules created yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {unpinnedRules.map((rule) => (
              <Card 
                key={rule.id} 
                className={`bg-surface border-gray-700 p-6 ${!isReadOnly ? 'cursor-grab' : ''}`}
                draggable={!isReadOnly}
                onDragStart={() => setDraggedId(rule.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId) {
                    handleReorder(draggedId, rule.id);
                    setDraggedId(null);
                  }
                }}
                onDragEnd={() => setDraggedId(null)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {!isReadOnly && (
                      <GripVertical className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-on">{rule.title}</h3>
                        {rule.category && (
                          <Badge variant="outline" className="text-xs">
                            {rule.category}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">Order: {rule.display_order}</span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{rule.content}</p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(rule.id)}
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

      {reorderRules.isPending && (
        <div className="fixed bottom-4 right-4 bg-surface border border-gray-700 rounded-lg p-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          <span className="text-sm text-gray-300">Saving order...</span>
        </div>
      )}
    </div>
  );
}