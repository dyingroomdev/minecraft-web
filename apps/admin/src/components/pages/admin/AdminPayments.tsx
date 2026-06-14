import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';
import { PaymentRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = ['pending', 'approved', 'fulfilled', 'failed', 'rejected'];

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/40',
  approved: 'bg-sky-500/10 text-sky-300 border border-sky-500/40',
  fulfilled: 'bg-lime-500/10 text-lime-400 border border-lime-500/40',
  failed: 'bg-rose-500/10 text-rose-300 border border-rose-500/40',
  rejected: 'bg-rose-500/10 text-rose-300 border border-rose-500/40',
};

const FULFILLMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-500/10 text-slate-300 border border-slate-500/40',
  processing: 'bg-slate-500/10 text-slate-300 border border-slate-500/40',
  success: 'bg-lime-500/10 text-lime-400 border border-lime-500/40',
  failed: 'bg-rose-500/10 text-rose-300 border border-rose-500/40',
};

function PaymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes = PAYMENT_STATUS_STYLES[normalized] ?? 'bg-stone-700/30 text-stone-200 border border-stone-600';
  return (
    <Badge variant="outline" className={`text-xs font-semibold uppercase tracking-wide ${classes}`}>
      {status}
    </Badge>
  );
}

function FulfillmentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes = FULFILLMENT_STATUS_STYLES[normalized] ?? 'bg-stone-700/30 text-stone-200 border border-stone-600';
  return (
    <Badge variant="outline" className={`text-xs font-semibold uppercase tracking-wide ${classes}`}>
      {status}
    </Badge>
  );
}

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

  const isApproving = approveMutation.isLoading;
  const isRejecting = rejectMutation.isLoading;
  const isRetrying = retryMutation.isLoading;

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
          {payments.map((payment) => {
            const fulfillmentStatus = payment.fulfillment_status?.toUpperCase?.() ?? 'PENDING';
            const canRetry =
              ['approved', 'failed'].includes(payment.status.toLowerCase()) ||
              fulfillmentStatus.toLowerCase() === 'failed';

            return (
              <Card key={payment.id} className="border border-stone-700 bg-surface">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle>{payment.rank_product.display_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {payment.mc_username}
                      {payment.platform ? ` • ${payment.platform.toUpperCase()}` : null}
                      {' • '}
                      ৳{payment.amount_bdt}
                      {' • '}TXID {payment.bkash_txid}
                    </p>
                  </div>
                  <PaymentStatusBadge status={payment.status.toUpperCase()} />
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  {payment.screenshot_url ? (
                    <p>
                      Proof:{' '}
                      <a className="text-lime-500" href={payment.screenshot_url} target="_blank" rel="noreferrer">
                        View screenshot
                      </a>
                    </p>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h3>
                      <ul className="space-y-1">
                        <li>
                          <span className="text-foreground">Submitted:</span> {formatDate(payment.created_at)}
                        </li>
                        {payment.processed_at ? (
                          <li>
                            <span className="text-foreground">Processed:</span> {formatDate(payment.processed_at)}
                          </li>
                        ) : null}
                        {payment.fulfilled_at ? (
                          <li>
                            <span className="text-foreground">Fulfilled:</span> {formatDate(payment.fulfilled_at)}
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fulfillment</h3>
                      <div className="flex items-center gap-2">
                        <FulfillmentStatusBadge status={fulfillmentStatus} />
                        {payment.fulfilled_at ? (
                          <span>Last attempt {formatDate(payment.fulfilled_at)}</span>
                        ) : (
                          <span>Waiting for grant</span>
                        )}
                      </div>
                      {payment.fulfillment_log ? (
                        <details className="rounded border border-stone-700 bg-surface/60 p-3 text-xs text-foreground">
                          <summary className="cursor-pointer text-muted-foreground">Command transcript</summary>
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                            {payment.fulfillment_log}
                          </pre>
                        </details>
                      ) : null}
                      {payment.rejection_reason && payment.status.toLowerCase() === 'rejected' ? (
                        <p className="text-destructive">Rejected: {payment.rejection_reason}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {payment.status === 'pending' ? (
                      <>
                        <Button size="sm" onClick={() => handleApprove(payment)} disabled={isApproving}>
                          {isApproving ? 'Approving…' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(payment)}
                          disabled={isRejecting}
                        >
                          {isRejecting ? 'Rejecting…' : 'Reject'}
                        </Button>
                      </>
                    ) : null}
                    {canRetry ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryMutation.mutate(payment.id)}
                        disabled={isRetrying}
                      >
                        {isRetrying ? 'Re-enqueue…' : 'Retry Fulfillment'}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
