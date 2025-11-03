import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { PaymentRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = ['pending', 'approved', 'fulfilled', 'rejected'];

export function AdminPayments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', statusFilter],
    queryFn: () => apiClient.getPayments(statusFilter),
  });

  const refreshPayments = () => queryClient.invalidateQueries({ queryKey: ['payments'] });

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiClient.approvePayment(id, crypto.randomUUID()),
    onSuccess: refreshPayments,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.rejectPayment(id, reason),
    onSuccess: refreshPayments,
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => apiClient.retryPayment(id),
    onSuccess: refreshPayments,
  });

  const handleApprove = (payment: PaymentRequest) => {
    approveMutation.mutate({ id: payment.id });
  };

  const handleReject = (payment: PaymentRequest) => {
    const reason = prompt('Provide a rejection reason:');
    if (!reason) return;
    rejectMutation.mutate({ id: payment.id, reason });
  };

  const payments = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Review player rank purchases submitted via bKash.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <select
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading payments…</p>
      ) : error ? (
        <p className="text-destructive">Failed to load payments.</p>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground">No records found for this status.</p>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{payment.rank_product.display_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {payment.mc_username} • ৳{payment.amount_bdt} • TXID {payment.bkash_txid}
                  </p>
                </div>
                <Badge>{payment.status.toUpperCase()}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {payment.screenshot_url ? (
                  <p>
                    Screenshot: <a className="text-lime-500" href={payment.screenshot_url} target="_blank" rel="noreferrer">View proof</a>
                  </p>
                ) : null}
                <div className="flex gap-2">
                  {payment.status === 'pending' ? (
                    <>
                      <Button size="sm" onClick={() => handleApprove(payment)} disabled={approveMutation.isLoading}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(payment)}
                        disabled={rejectMutation.isLoading}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {['approved', 'failed'].includes(payment.status) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryMutation.mutate(payment.id)}
                      disabled={retryMutation.isLoading}
                    >
                      {retryMutation.isLoading ? 'Re-enqueue…' : 'Retry Fulfillment'}
                    </Button>
                  ) : null}
                  {payment.status === 'rejected' && payment.rejection_reason ? (
                    <span className="text-destructive">
                      Reason: {payment.rejection_reason}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
