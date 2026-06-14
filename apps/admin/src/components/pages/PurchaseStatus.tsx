import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500 text-forest-900',
  approved: 'bg-blue-500 text-white',
  rejected: 'bg-destructive text-destructive-foreground',
  fulfilled: 'bg-lime-500 text-forest-900',
};

export function PurchaseStatus() {
  const { requestId } = useParams<{ requestId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-status', requestId],
    queryFn: () => {
      if (!requestId) throw new Error('Missing purchase request ID');
      return apiClient.getPaymentRequest(requestId);
    },
    enabled: Boolean(requestId),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Checking payment status…</div>;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-10 text-destructive">
        Unable to find this payment request.
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-wide text-lime-500">Purchase Status</p>
        <h1 className="text-3xl font-bold">Order #{data.id.slice(0, 8)}</h1>
        <p className="text-muted-foreground">We will notify you via Discord once the rank is active.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{data.rank_product.display_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Purchased by {data.mc_username} on {formatDate(data.created_at)}
            </p>
          </div>
          <Badge className={STATUS_COLOR[data.status] ?? 'bg-muted text-foreground'}>{data.status.toUpperCase()}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Transaction ID</p>
              <p className="font-medium">{data.bkash_txid}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount Paid</p>
              <p className="font-medium">৳{data.amount_bdt}</p>
            </div>
            {data.processed_at ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Processed</p>
                <p className="font-medium">{formatDate(data.processed_at)}</p>
              </div>
            ) : null}
            {data.rejection_reason ? (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rejection reason</p>
                <p className="font-medium text-destructive">{data.rejection_reason}</p>
              </div>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-lime-500">Payment submitted and pending staff review.</p>
          <p className="text-sm text-muted-foreground">
            Need help? Contact staff in the Amaze Gaming Discord server with your transaction ID.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
