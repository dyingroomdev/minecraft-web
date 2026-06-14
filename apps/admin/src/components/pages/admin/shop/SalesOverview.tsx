import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import {
  AdminIcon,
  faBox,
  faCartShopping,
  faChartColumn,
  faCoins,
  faGaugeHigh,
  faTrophy,
  faUsers,
} from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { apiClient } from '@/lib/api';

type SalesData = {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  revenue_change: number;
  orders_change: number;
  top_products: Array<{ name: string; sales: number; revenue: number }>;
  recent_orders: Array<{ id: string; total_amount: number; status: string; created_at: string }>;
  monthly_revenue: Array<{ month: string; revenue: number }>;
};

const currency = (value: number) => `৳${value.toLocaleString()}`;

export default function SalesOverview() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    setLoading(true);
    apiClient.request<SalesData>(`/admin/shop/analytics?period=${period}`)
      .then(setData)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load sales data'))
      .finally(() => setLoading(false));
  }, [period]);

  const exportReport = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `amzcraft-sales-${period}-days.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading sales overview...</div>;
  if (!data) return <div className="control-error-state">No sales data available.</div>;

  const averageOrder = data.total_orders ? data.total_revenue / data.total_orders : 0;
  const chartMax = Math.max(...data.monthly_revenue.map((item) => item.revenue), 1);
  const metrics: Array<[string, string, IconDefinition, string, string]> = [
    ['Total Revenue', currency(data.total_revenue), faCoins, '#00e676', `${data.revenue_change >= 0 ? '↑' : '↓'}${Math.abs(data.revenue_change).toFixed(1)}% vs prior period`],
    ['Avg Order Value', currency(averageOrder), faGaugeHigh, '#ffd700', `${data.total_orders} orders in period`],
    ['Total Orders', data.total_orders.toLocaleString(), faCartShopping, '#5de0f0', `${data.orders_change >= 0 ? '+' : ''}${data.orders_change.toFixed(1)}% vs prior period`],
    ['Customers', data.total_customers.toLocaleString(), faUsers, '#a855f7', `${data.total_products} active products`],
  ];

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Sales Overview"
        subtitle={`Revenue analytics for the last ${period} days`}
        actions={
          <>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option>
            </select>
            <button className="control-btn control-btn-ghost" onClick={exportReport}><Download size={14} /> Export</button>
          </>
        }
      />
      <div className="control-kpi-row">
        {metrics.map(([label, value, icon, color, footer]) => (
          <div className="control-kpi-card" key={label} style={{ '--kpi-color': color } as React.CSSProperties}>
            <div className="control-kpi-header"><div className="control-kpi-label">{label}</div><div className="control-kpi-icon"><AdminIcon icon={icon} /></div></div>
            <div className="control-kpi-value compact colored">{value}</div>
            <div className="control-kpi-footer"><span className="control-kpi-delta up">{footer}</span></div>
          </div>
        ))}
      </div>

      <ControlPanel title="Monthly Revenue" icon={<AdminIcon icon={faChartColumn} />}>
        {data.monthly_revenue.length ? (
          <div className="control-revenue-chart">
            <div className="control-revenue-bars">
              {data.monthly_revenue.map((item, index) => (
                <div className="control-revenue-column" key={item.month}>
                  <div className={`control-revenue-bar${index === data.monthly_revenue.length - 1 ? ' current' : ''}`} style={{ height: `${Math.max(5, item.revenue / chartMax * 100)}%` }} title={`${item.month}: ${currency(item.revenue)}`} />
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <ControlEmpty icon={<AdminIcon icon={faChartColumn} />} text="No completed-order revenue exists for this period." />}
      </ControlPanel>

      <div className="control-grid-3-1">
        <ControlPanel title="Top Selling Products" icon={<AdminIcon icon={faTrophy} />}>
          {data.top_products.length ? (
            <div className="control-table-wrap">
              <table className="control-data-table"><thead><tr><th>Product</th><th>Sales</th><th>Revenue</th></tr></thead>
                <tbody>{data.top_products.map((product) => <tr key={product.name}><td><strong>{product.name}</strong></td><td>{product.sales}</td><td className="mono">{currency(product.revenue)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <ControlEmpty icon={<AdminIcon icon={faBox} />} text="No completed product sales for this period." />}
        </ControlPanel>
        <ControlPanel title="Recent Orders" icon={<AdminIcon icon={faCartShopping} />}>
          {data.recent_orders.map((order) => (
            <div className="control-payment-row" key={order.id}>
              <div><strong>#{order.id.slice(0, 8)}</strong><div className="subline">{new Date(order.created_at).toLocaleDateString()}</div></div>
              <div><ControlStatusBadge status={order.status} /> <span className="mono">{currency(order.total_amount)}</span></div>
            </div>
          ))}
        </ControlPanel>
      </div>
    </div>
  );
}
