import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Pin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { apiClient } from '../../lib/api';

interface Rule {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string | null;
  display_order: number;
  is_pinned: boolean;
}

export function RulesManager() {
  const queryClient = useQueryClient();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: () => apiClient.request('/admin/rules', {}, z.array(RuleSchema)),
    onSuccess: (data) => setRules(data),
  });

  const reorderMutation = useMutation({
    mutationFn: (updates: Array<{ rule_id: string; display_order: number }>) =>
      apiClient.request('/admin/rules/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const handleDragStart = (e: React.DragEvent, ruleId: string) => {
    setDraggedItem(ruleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedRule = rules.find(r => r.id === draggedItem);
    const targetRule = rules.find(r => r.id === targetId);
    
    if (!draggedRule || !targetRule || draggedRule.is_pinned || targetRule.is_pinned) {
      setDraggedItem(null);
      return;
    }

    // Reorder rules array
    const newRules = [...rules];
    const draggedIndex = newRules.findIndex(r => r.id === draggedItem);
    const targetIndex = newRules.findIndex(r => r.id === targetId);
    
    // Remove dragged item and insert at target position
    const [removed] = newRules.splice(draggedIndex, 1);
    newRules.splice(targetIndex, 0, removed);
    
    // Update display orders for non-pinned rules only
    const updates: Array<{ rule_id: string; display_order: number }> = [];
    let order = 1;
    
    newRules.forEach(rule => {
      if (!rule.is_pinned) {
        rule.display_order = order;
        updates.push({ rule_id: rule.id, display_order: order });
        order++;
      }
    });
    
    setRules(newRules);
    reorderMutation.mutate(updates);
    setDraggedItem(null);
  };

  if (isLoading) {
    return <div>Loading rules...</div>;
  }

  const pinnedRules = rules.filter(rule => rule.is_pinned);
  const regularRules = rules.filter(rule => !rule.is_pinned);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rules Management</h1>
        <Button>Add New Rule</Button>
      </div>

      {pinnedRules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Pin className="h-4 w-4 mr-2" />
            Pinned Rules
          </h2>
          <div className="space-y-2">
            {pinnedRules.map(rule => (
              <Card key={rule.id} className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{rule.title}</CardTitle>
                    <Badge variant="secondary">Pinned</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {rule.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Regular Rules</h2>
        <div className="space-y-2">
          {regularRules.map(rule => (
            <Card
              key={rule.id}
              className={`cursor-move transition-colors ${
                draggedItem === rule.id ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, rule.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, rule.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{rule.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    {rule.category && (
                      <Badge variant="outline">{rule.category}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      #{rule.display_order}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {rule.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}