import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const API_BASE = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/$/, '');
const RANKS_MEDIA_BASE = `${API_BASE}/api/media/ranks`;

interface Rank {
  id: string;
  name: string;
  display_name: string;
  priority: number;
  meta_data: {
    benefits?: string[];
    description?: string;
    color?: string;
    icon?: string;
  };
  created_at: string;
  updated_at?: string;
}

export function AdminRanks() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingRank, setEditingRank] = useState<Rank | null>(null);

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/admin/ranks');
      if (response.ok) {
        const data = await response.json();
        setRanks(data);
      }
    } catch (error) {
      console.error('Failed to fetch ranks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  const filteredRanks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ranks;
    return ranks.filter((rank) => {
      const source = `${rank.display_name} ${rank.name}`.toLowerCase();
      return source.includes(term);
    });
  }, [ranks, search]);

  const handleSaveRank = async (rank: Rank) => {
    try {
      const response = await fetch(`/api/admin/ranks/${rank.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rank),
      });
      if (response.ok) {
        await fetchRanks();
        setEditingRank(null);
      }
    } catch (error) {
      console.error('Failed to save rank:', error);
    }
  };

  const updateRankField = (field: string, value: any) => {
    if (!editingRank) return;
    if (field.startsWith('meta_data.')) {
      const metaField = field.replace('meta_data.', '');
      setEditingRank({
        ...editingRank,
        meta_data: {
          ...editingRank.meta_data,
          [metaField]: value,
        },
      });
    } else {
      setEditingRank({ ...editingRank, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rank Management</h1>
        <p className="text-muted-foreground">
          Manage server ranks, their benefits, and display information.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Server Ranks</CardTitle>
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search ranks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Badge variant="outline">Total: {ranks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading ranks...</p>
          ) : filteredRanks.length === 0 ? (
            <p className="text-muted-foreground">No ranks found.</p>
          ) : (
            <div className="grid gap-4">
              {filteredRanks.map((rank) => (
                <Card key={rank.id} className="border">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={`${RANKS_MEDIA_BASE}/${rank.name.toLowerCase()}.png`}
                        alt={rank.display_name}
                        className="h-12 w-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <h3 className="font-semibold" style={{ color: rank.meta_data.color }}>
                          {rank.display_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {rank.name} • Priority: {rank.priority}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRank(rank)}
                    >
                      Edit
                    </Button>
                  </CardHeader>
                  
                  {rank.meta_data.description && (
                    <CardContent>
                      <p className="text-sm">{rank.meta_data.description}</p>
                      {rank.meta_data.benefits && rank.meta_data.benefits.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Benefits:</h4>
                          <ul className="text-xs space-y-1">
                            {rank.meta_data.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingRank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Rank: {editingRank.display_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={editingRank.display_name}
                    onChange={(e) => updateRankField('display_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Input
                    type="number"
                    value={editingRank.priority}
                    onChange={(e) => updateRankField('priority', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingRank.meta_data.description || ''}
                  onChange={(e) => updateRankField('meta_data.description', e.target.value)}
                  placeholder="Rank description..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Color (hex)</label>
                <Input
                  value={editingRank.meta_data.color || '#ffffff'}
                  onChange={(e) => updateRankField('meta_data.color', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Benefits (one per line)</label>
                <Textarea
                  value={(editingRank.meta_data.benefits || []).join('\n')}
                  onChange={(e) => updateRankField('meta_data.benefits', e.target.value.split('\n').filter(b => b.trim()))}
                  placeholder="Enter benefits, one per line..."
                  rows={6}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingRank(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveRank(editingRank)}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}