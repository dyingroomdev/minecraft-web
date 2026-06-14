import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';

const API_BASE = (import.meta.env.VITE_API_URL ?? window.location.origin).replace(/\/$/, '');
const RANKS_MEDIA_BASE = `${API_BASE}/api/media/ranks`;

interface Rank {
  id: string;
  name: string;
  display_name: string;
  priority: number;
  meta_data: {
    benefits?: string;
    description?: string;
    color?: string;
    icon?: string;
  };
  created_at: string;
  updated_at?: string;
}

interface RankFormData {
  name: string;
  display_name: string;
  priority: number;
  description: string;
  benefits: string;
  color: string;
  icon?: File;
}

export function AdminRanks() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [formData, setFormData] = useState<RankFormData>({
    name: '',
    display_name: '',
    priority: 0,
    description: '',
    benefits: '',
    color: '#ffffff',
  });
  const [iconPreview, setIconPreview] = useState<string>('');

  const getIconUrl = (rank: Rank) => {
    if (!rank.meta_data.icon) {
      return `${RANKS_MEDIA_BASE}/${rank.name.toLowerCase()}.png`;
    }
    
    // If it's already a full URL, return as is
    if (rank.meta_data.icon.startsWith('http')) {
      return rank.meta_data.icon;
    }
    
    // If it contains /api/media/, extract filename
    if (rank.meta_data.icon.includes('/api/media/')) {
      const filename = rank.meta_data.icon.split('/api/media/').pop();
      return `${API_BASE}/api/media/${filename}`;
    }
    
    // Otherwise treat as filename
    return `${API_BASE}/api/media/${rank.meta_data.icon}`;
  };

  const fetchRanks = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/ranks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
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

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      priority: 0,
      description: '',
      benefits: '',
      color: '#ffffff',
    });
    setIconPreview('');
    setEditingRank(null);
    setShowForm(false);
  };

  const handleEdit = (rank: Rank) => {
    setEditingRank(rank);
    setFormData({
      name: rank.name,
      display_name: rank.display_name,
      priority: rank.priority,
      description: rank.meta_data.description || '',
      benefits: rank.meta_data.benefits || '',
      color: rank.meta_data.color || '#ffffff',
    });
    setIconPreview(rank.meta_data.icon ? getIconUrl(rank) : '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload icon if provided
      let iconUrl = '';
      if (formData.icon) {
        const iconFormData = new FormData();
        iconFormData.append('file', formData.icon);
        
        const uploadResponse = await fetch(`${API_BASE}/admin/media/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          },
          body: iconFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          iconUrl = uploadResult.filename; // Save just the filename
        }
      }

      const rankData = {
        name: formData.name,
        display_name: formData.display_name,
        priority: formData.priority,
        meta_data: {
          description: formData.description,
          benefits: formData.benefits,
          color: formData.color,
          icon: iconUrl || (editingRank?.meta_data.icon || ''),
        },
      };

      const url = editingRank 
        ? `${API_BASE}/admin/ranks/${editingRank.id}`
        : `${API_BASE}/admin/ranks`;
      
      const method = editingRank ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(rankData),
      });

      if (response.ok) {
        await fetchRanks();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save rank:', error);
    }
  };

  const handleDelete = async (rank: Rank) => {
    if (!confirm(`Are you sure you want to delete ${rank.display_name}?`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/ranks/${rank.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (response.ok) {
        await fetchRanks();
      }
    } catch (error) {
      console.error('Failed to delete rank:', error);
    }
  };

  const handleIconSelect = (file: File) => {
    setFormData({ ...formData, icon: file });
    setIconPreview(URL.createObjectURL(file));
  };

  const handleIconRemove = () => {
    setFormData({ ...formData, icon: undefined });
    setIconPreview('');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rank Management</h1>
          <p className="text-muted-foreground">
            Create and manage server ranks with icons and benefits.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rank
        </Button>
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
                        src={getIconUrl(rank)}
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rank)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rank)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {rank.meta_data.description && (
                    <CardContent>
                      <p className="text-sm mb-3">{rank.meta_data.description}</p>
                      {rank.meta_data.benefits && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Benefits:</h4>
                          <div 
                            className="text-xs prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: rank.meta_data.benefits }}
                          />
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border shadow-lg">
            <CardHeader className="bg-white dark:bg-gray-900">
              <CardTitle>
                {editingRank ? `Edit Rank: ${editingRank.display_name}` : 'Create New Rank'}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-900">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rank Name (ID)</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., vip, elite, admin"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="e.g., VIP, Elite, Admin"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color (hex)</label>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Rank Icon</label>
                  <FileUpload
                    onFileSelect={handleIconSelect}
                    accept="image/*"
                    maxSize={2}
                    preview={iconPreview}
                    onRemove={handleIconRemove}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the rank..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Benefits (Rich Text)</label>
                  <RichTextEditor
                    value={formData.benefits}
                    onChange={(value) => setFormData({ ...formData, benefits: value })}
                    placeholder="Enter rank benefits and perks..."
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRank ? 'Update Rank' : 'Create Rank'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}