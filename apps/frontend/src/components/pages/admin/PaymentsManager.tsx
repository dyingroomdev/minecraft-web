import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { usePayments, useApprovePayment, useRejectPayment, useRetryPayment, type Payment } from '../../../hooks/usePayments';
import { useAdmin } from '../../../contexts/AdminContext';
import { Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink, Calendar, DollarSign } from 'lucide-react';

interface RejectForm {
  reason: string;
}

export default function PaymentsManager() {
  const { user } = useAdmin();
  const [statusFilter, setStatusFilter] = useState('pending');
  const { data: payments, isLoading, error, refetch } = usePayments(statusFilter);
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();
  const retryPayment = useRetryPayment();
  
  const [rejectingPayment, setRejectingPayment] = useState<Payment | null>(null);
  
  const isReadOnly = user?.role === 'ADMIN';
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RejectForm>();

  const handleApprove = (paymentId: string) => {
    if (isReadOnly || !confirm('Are you sure you want to approve this payment?')) return;
    approvePayment.mutate(paymentId);
  };

  const handleReject = (data: RejectForm) => {
    if (!rejectingPayment || isReadOnly) return;
    rejectPayment.mutate({ paymentId: rejectingPayment.id, reason: data.reason });
    setRejectingPayment(null);
    reset();
  };

  const handleRetry = (paymentId: string) => {
    if (isReadOnly || !confirm('Are you sure you want to retry this payment?')) return;
    retryPayment.mutate(paymentId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
        <p className="text-red-400 mb-4">Failed to load payments</p>
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
          <h1 className="text-2xl font-bold text-on">Payment Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and manage payment requests
          </p>
        </div>
        
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'failed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-brand hover:bg-brand/90' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            You have read-only access. Contact a SUPER_ADMIN to approve/reject payments.
          </p>
        </div>
      )}

      {/* Reject Form Modal */}
      {rejectingPayment && (
        <Card className="bg-surface border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-on mb-4">
            Reject Payment - {rejectingPayment.mc_username}
          </h2>
          
          <form onSubmit={handleSubmit(handleReject)} className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                {...register('reason', { required: 'Reason is required' })}
                className="bg-surface2 border-gray-600 min-h-[100px]"
                placeholder="Explain why this payment is being rejected..."
              />
              {errors.reason && (
                <p className="text-red-400 text-sm mt-1">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={rejectPayment.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectPayment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Reject Payment
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRejectingPayment(null);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Payments List */}
      {payments?.length === 0 ? (
        <Card className="bg-surface border-gray-700 p-8 text-center">
          <p className="text-gray-400">No {statusFilter} payments found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments?.map((payment) => (
            <Card key={payment.id} className="bg-surface border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-on">{payment.mc_username}</h3>
                    {getStatusBadge(payment.status)}
                    <Badge className="bg-brand/20 text-brand">
                      {payment.rank_product.display_name}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">৳{payment.amount_bdt} BDT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">bKash TxID:</span>
                        <span className="text-gray-300 font-mono">{payment.bkash_txid}</span>
                      </div>
                      {payment.mc_uuid && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">MC UUID:</span>
                          <span className="text-gray-300 font-mono text-xs">{payment.mc_uuid}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">Created: {formatDate(payment.created_at)}</span>
                      </div>
                      {payment.processed_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">Processed: {formatDate(payment.processed_at)}</span>
                        </div>
                      )}
                      {payment.screenshot_url && (
                        <div className="flex items-center gap-2">
                          <a
                            href={payment.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:text-brand/80 flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Screenshot
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {payment.rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-3">
                      <p className="text-red-400 text-sm">
                        <strong>Rejection Reason:</strong> {payment.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {!isReadOnly && (
                  <div className="flex gap-2 ml-4">
                    {payment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(payment.id)}
                          disabled={approvePayment.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {approvePayment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRejectingPayment(payment)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {(payment.status === 'approved' || payment.status === 'failed') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRetry(payment.id)}
                        disabled={retryPayment.isPending}
                        className="text-brand hover:text-brand/80"
                      >
                        {retryPayment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}