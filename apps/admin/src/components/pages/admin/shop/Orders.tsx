import { Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AdminIcon, faCartShopping, faCheck } from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { apiClient } from '@/lib/api';

type Order = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  transaction_id: string;
  minecraft_username: string;
  status: string;
  created_at: string;
  items: Array<{ product_name: string; quantity: number; unit_price: number; coins: number }>;
};

const ORDER_STATUSES = ['pending', 'paid', 'completed', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      setOrders(await apiClient.request<Order[]>('/admin/shop/orders'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchOrders(); }, []);

  const visibleOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((order) =>
      (statusFilter === 'all' || order.status === statusFilter)
      && (!needle
        || order.order_number.toLowerCase().includes(needle)
        || order.minecraft_username.toLowerCase().includes(needle)
        || order.transaction_id.toLowerCase().includes(needle))
    );
  }, [orders, search, statusFilter]);

  const updateStatus = async (orderId: string, status: string) => {
    await apiClient.request(`/admin/shop/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    toast.success('Order status updated');
    await fetchOrders();
  };

  const verifyPayment = async (orderId: string) => {
    await apiClient.request(`/admin/shop/orders/${orderId}/verify-payment`, { method: 'POST' });
    toast.success('Payment marked for processing');
    await fetchOrders();
  };

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Orders"
        subtitle="Review shop orders and fulfillment status"
        actions={
          <div className="control-search-bar">
            <Search size={13} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders..." />
          </div>
        }
      />
      <ControlPanel
        title="All Orders"
        icon={<AdminIcon icon={faCartShopping} />}
        action={
          <div className="control-filter-row">
            {['all', ...ORDER_STATUSES].map((status) => (
              <button className={`control-filter-button${statusFilter === status ? ' active' : ''}`} key={status} onClick={() => setStatusFilter(status)}>
                {status[0].toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading orders...</div>
        ) : visibleOrders.length === 0 ? (
          <ControlEmpty icon={<AdminIcon icon={faCartShopping} />} text="No orders match this filter." />
        ) : (
          <div className="control-table-wrap">
            <table className="control-data-table">
              <thead><tr><th>Order</th><th>Player</th><th>Amount</th><th>Payment</th><th>Items</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.order_number}</strong><div className="subline mono">{order.transaction_id}</div></td>
                    <td><strong>{order.minecraft_username}</strong></td>
                    <td className="mono" style={{ color: 'var(--control-gold)' }}>৳{order.total_amount.toLocaleString()}</td>
                    <td>{order.payment_method.toUpperCase()}</td>
                    <td>{order.items?.length ? order.items.map((item) => `${item.product_name} ×${item.quantity}`).join(', ') : '—'}</td>
                    <td><ControlStatusBadge status={order.status} /></td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      {order.status === 'pending' ? <button className="control-row-action approve" onClick={() => verifyPayment(order.id)}><AdminIcon icon={faCheck} /> Verify</button> : null}
                      <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} aria-label={`Status for order ${order.order_number}`}>
                        {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
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
