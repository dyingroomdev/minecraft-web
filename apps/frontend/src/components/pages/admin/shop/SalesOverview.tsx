import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SalesData {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  revenue_change: number;
  orders_change: number;
  top_products: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recent_orders: Array<{
    id: number;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function SalesOverview() {
  const { toast } = useToast();
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/admin/shop/analytics?period=${period}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch sales data');
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sales data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading sales overview...</div>;
  }

  if (!salesData) {
    return <div className="text-white">No sales data available.</div>;
  }

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-400' : 'text-red-400';
    return <span className={color}>{sign}{change.toFixed(1)}%</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sales Overview</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(salesData.total_revenue)}</p>
                <p className="text-sm mt-1">{formatChange(salesData.revenue_change)} from last period</p>
              </div>
              <DollarSign className="w-8 h-8 text-brand" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{salesData.total_orders}</p>
                <p className="text-sm mt-1">{formatChange(salesData.orders_change)} from last period</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-brand" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-white">{salesData.total_products}</p>
                <p className="text-sm mt-1 text-gray-400">Active products</p>
              </div>
              <Package className="w-8 h-8 text-brand" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-white">{salesData.total_customers}</p>
                <p className="text-sm mt-1 text-gray-400">Unique buyers</p>
              </div>
              <Users className="w-8 h-8 text-brand" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="bg-surface border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.top_products.length === 0 ? (
                <p className="text-gray-400">No sales data available</p>
              ) : (
                salesData.top_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-gray-400 text-sm">{product.sales} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brand font-bold">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-surface border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.recent_orders.length === 0 ? (
                <p className="text-gray-400">No recent orders</p>
              ) : (
                salesData.recent_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Order #{order.id}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                      <p className="text-brand font-bold">{formatCurrency(order.total_amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="bg-surface border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData.monthly_revenue.length === 0 ? (
              <p className="text-gray-400">No revenue data available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {salesData.monthly_revenue.map((month, index) => (
                  <div key={index} className="text-center">
                    <p className="text-gray-400 text-sm">{month.month}</p>
                    <p className="text-white font-bold">{formatCurrency(month.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}