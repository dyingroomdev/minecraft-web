import { Download, ExternalLink, Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AdminIcon, faCheck, faMoneyBillTransfer, faXmark } from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { useAdmin } from '@/contexts/AdminContext';
import { useDashboardStats } from '@/hooks/useDashboard';
import {
  type Payment,
  useApprovePayment,
  usePayments,
  useRejectPayment,
  useRetryPayment,
} from '@/hooks/usePayments';

type RejectForm = { reason: string };

export default function PaymentsManager() {
  const { user } = useAdmin();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [rejectingPayment, setRejectingPayment] = useState<Payment | null>(null);
  const { data: payments = [], isLoading, error, refetch } = usePayments(statusFilter);
  const { data: stats } = useDashboardStats();
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();
  const retryPayment = useRetryPayment();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RejectForm>();
  const isReadOnly = user?.role === 'ADMIN';

  const filteredPayments = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return payments;
    return payments.filter((payment) =>
      payment.mc_username.toLowerCase().includes(needle)
      || payment.bkash_txid.toLowerCase().includes(needle)
      || payment.rank_product.display_name.toLowerCase().includes(needle)
    );
  }, [payments, search]);

  const exportCsv = () => {
    const rows = [
      ['Player', 'Rank', 'Amount BDT', 'Transaction ID', 'Submitted', 'Status'],
      ...filteredPayments.map((payment) => [
        payment.mc_username,
        payment.rank_product.display_name,
        payment.amount_bdt,
        payment.bkash_txid,
        payment.created_at,
        payment.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `amzcraft-payments-${statusFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitRejection = (data: RejectForm) => {
    if (!rejectingPayment || isReadOnly) return;
    rejectPayment.mutate({ paymentId: rejectingPayment.id, reason: data.reason });
    setRejectingPayment(null);
    reset();
  };

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Payments"
        subtitle="Review and approve bKash rank purchases"
        actions={
          <>
            <div className="control-search-bar">
              <Search size={13} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player or TXN..." />
            </div>
            <button className="control-btn control-btn-ghost" onClick={exportCsv}>
              <Download size={14} /> Export CSV
            </button>
          </>
        }
      />

      <div className="control-filter-row">
        <div className="control-summary-chip pending"><Loader2 size={12} /> {stats?.pending_payments ?? 0} Pending</div>
        <div className="control-summary-chip approved"><AdminIcon icon={faCheck} /> {stats?.approved_payments ?? 0} Approved · ৳{(stats?.total_revenue ?? 0).toLocaleString()}</div>
        <div className="control-summary-chip rejected"><AdminIcon icon={faXmark} /> {stats?.rejected_payments ?? 0} Rejected</div>
      </div>

      {isReadOnly ? <div className="control-readonly-notice">You have read-only access. A super administrator must approve or reject payments.</div> : null}

      {rejectingPayment ? (
        <ControlPanel title={`Reject Payment · ${rejectingPayment.mc_username}`} icon={<AdminIcon icon={faXmark} />}>
          <form className="control-form-panel" onSubmit={handleSubmit(submitRejection)}>
            <div className="control-form-group">
              <label htmlFor="reason">Rejection Reason *</label>
              <textarea id="reason" {...register('reason', { required: 'Reason is required' })} placeholder="Explain why this payment is being rejected..." />
              {errors.reason ? <div className="text-red-400 text-xs mt-1">{errors.reason.message}</div> : null}
            </div>
            <div className="control-form-actions">
              <button className="control-btn control-btn-primary" type="submit" disabled={rejectPayment.isPending}>Reject Payment</button>
              <button className="control-btn control-btn-ghost" type="button" onClick={() => { setRejectingPayment(null); reset(); }}>Cancel</button>
            </div>
          </form>
        </ControlPanel>
      ) : null}

      <ControlPanel
        title="All Transactions"
        icon={<AdminIcon icon={faMoneyBillTransfer} />}
        action={
          <div className="control-filter-row">
            {['pending', 'approved', 'rejected', 'failed', 'all'].map((status) => (
              <button
                className={`control-filter-button${statusFilter === status ? ' active' : ''}`}
                key={status}
                onClick={() => setStatusFilter(status)}
              >
                {status[0].toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading payments...</div>
        ) : error ? (
          <div className="control-error-state"><span>Failed to load payments.</span><button className="control-btn control-btn-ghost" onClick={() => refetch()}>Retry</button></div>
        ) : filteredPayments.length === 0 ? (
          <ControlEmpty icon={<AdminIcon icon={faMoneyBillTransfer} />} text={`No ${statusFilter === 'all' ? '' : statusFilter} payments found.`} />
        ) : (
          <div className="control-table-wrap">
            <table className="control-data-table">
              <thead>
                <tr><th>Player</th><th>Rank</th><th>Amount</th><th>TXN ID</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td><strong>{payment.mc_username}</strong><div className="subline">{payment.mc_uuid ? 'Minecraft account linked' : 'UUID pending'}</div></td>
                    <td><span className="control-status-badge info">{payment.rank_product.display_name}</span></td>
                    <td className="mono" style={{ color: 'var(--control-gold)' }}>৳{Number(payment.amount_bdt).toLocaleString()}</td>
                    <td className="mono">{payment.bkash_txid}</td>
                    <td>{new Date(payment.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td><ControlStatusBadge status={payment.status} /></td>
                    <td>
                      {payment.screenshot_url ? <a className="control-row-action" href={payment.screenshot_url} target="_blank" rel="noreferrer"><ExternalLink size={12} /></a> : null}
                      {!isReadOnly && payment.status === 'pending' ? (
                        <>
                          <button className="control-row-action approve" onClick={() => confirm('Approve this payment?') && approvePayment.mutate(payment.id)}><AdminIcon icon={faCheck} /> Approve</button>
                          <button className="control-row-action reject" onClick={() => setRejectingPayment(payment)}><AdminIcon icon={faXmark} /> Reject</button>
                        </>
                      ) : null}
                      {!isReadOnly && ['approved', 'failed'].includes(payment.status) ? (
                        <button className="control-row-action" onClick={() => retryPayment.mutate(payment.id)}>↻ Retry</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ControlPanel>
    </div>
  );
}
