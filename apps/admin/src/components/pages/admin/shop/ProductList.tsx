import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { AdminIcon, faBox } from '@/components/admin/AdminIcons';
import { ControlEmpty, ControlPageHeader, ControlPanel, ControlStatusBadge } from '@/components/admin/ControlUI';
import { apiClient } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_bdt: number;
  coins: number;
  bonus_coins: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
};

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setProducts(await apiClient.request<Product[]>('/admin/shop/products'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchProducts(); }, []);

  const updateProduct = async (id: string, payload: Partial<Product>) => {
    await apiClient.request(`/admin/shop/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    toast.success('Product updated');
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await apiClient.request(`/admin/shop/products/${id}`, { method: 'DELETE' });
    toast.success('Product deleted');
    await fetchProducts();
  };

  return (
    <div className="control-manager-page">
      <ControlPageHeader
        title="Product List"
        subtitle="All shop products"
        actions={<button className="control-btn control-btn-primary" onClick={() => navigate('/admin/shop/products/new')}><Plus size={14} /> Add Product</button>}
      />
      <ControlPanel title="All Products" icon={<AdminIcon icon={faBox} />}>
        {loading ? (
          <div className="control-loading-state"><Loader2 className="animate-spin" /> Loading products...</div>
        ) : products.length === 0 ? (
          <ControlEmpty icon={<AdminIcon icon={faBox} />} text="No products found. Create your first product." />
        ) : (
          <div className="control-table-wrap">
            <table className="control-data-table">
              <thead><tr><th>Product</th><th>Price</th><th>Coins</th><th>Bonus</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><div className="subline">{product.description || 'No description'}</div></td>
                    <td className="mono" style={{ color: 'var(--control-gold)' }}>৳{product.price_bdt.toLocaleString()}</td>
                    <td className="mono">{product.coins.toLocaleString()}</td>
                    <td className="mono">{product.bonus_coins.toLocaleString()}</td>
                    <td><ControlStatusBadge status={product.is_active ? 'Active' : 'Inactive'} /></td>
                    <td>{new Date(product.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="control-row-action" onClick={() => navigate(`/admin/shop/products/${product.id}/edit`)}>Edit</button>
                      <button className="control-row-action" onClick={() => updateProduct(product.id, { is_active: !product.is_active })}>{product.is_active ? 'Disable' : 'Enable'}</button>
                      <button className="control-row-action reject" onClick={() => deleteProduct(product.id)}>Delete</button>
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
