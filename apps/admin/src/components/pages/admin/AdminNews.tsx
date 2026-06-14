import { useState, useEffect } from 'react';
import AdminTable from '@/components/admin/AdminTable';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface NewsPost {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  is_draft: boolean;
  published_at?: string;
  created_at: string;
}

export default function AdminNews() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/news`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    // TODO: Open modal for creating news
    console.log('Add news');
  };

  const handleEdit = (item: NewsPost) => {
    // TODO: Open modal for editing news
    console.log('Edit news:', item);
  };

  const handleDelete = async (item: NewsPost) => {
    if (!confirm('Are you sure you want to delete this news post?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/admin/news/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNews(news.filter(n => n.id !== item.id));
      }
    } catch (error) {
      console.error('Failed to delete news:', error);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { 
      key: 'is_draft', 
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value ? 'bg-yellow-500/20 text-yellow-400' : 'bg-brand/20 text-brand'
        }`}>
          {value ? 'Draft' : 'Published'}
        </span>
      )
    },
    { 
      key: 'published_at', 
      label: 'Published',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ];

  return (
    <AdminTable
      title="News Management"
      data={news}
      columns={columns}
      loading={loading}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      addLabel="Create News Post"
    />
  );
}