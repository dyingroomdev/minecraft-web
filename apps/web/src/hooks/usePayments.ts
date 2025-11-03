import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface RankProduct {
  id: string;
  rank_code: string;
  display_name: string;
  price_bdt: number;
  duration_days?: number;
  description?: string;
  is_active: boolean;
}

export interface Payment {
  id: string;
  rank_product: RankProduct;
  mc_username: string;
  mc_uuid?: string;
  bkash_txid: string;
  amount_bdt: number;
  screenshot_url?: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  processed_at?: string;
}

export const usePayments = (status: string = 'pending') => {
  return useQuery({
    queryKey: ['admin-payments', status],
    queryFn: async (): Promise<Payment[]> => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/payments?status_filter=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    }
  });
};

export const useApprovePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `approve-${paymentId}-${Date.now()}`,
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to approve payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success('Payment approved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useRejectPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success('Payment rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useRetryPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8001/admin/retry/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to retry payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success('Payment retry queued');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};