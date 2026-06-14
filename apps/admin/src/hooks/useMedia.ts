import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MediaUploadResponse {
  filename: string;
  url: string;
  content_type: string;
  size: number;
}

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '');

const uploadMedia = async (file: File): Promise<MediaUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const response = await fetch(`${API_BASE}/admin/media/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      throw new Error('Session expired. Please log in again.');
    }
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
};

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: uploadMedia,
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
};
