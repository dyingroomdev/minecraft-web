import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price_bdt: number;
  coins: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export default function ProductList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/admin/shop/products', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`http://localhost:8001/api/admin/shop/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      toast({
        title: 'Success',
        description: 'Product deleted successfully'
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:8001/api/admin/shop/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update product');

      toast({
        title: 'Success',
        description: 'Product status updated'
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-white">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Product Management</h1>
        <Button
          onClick={() => navigate('/admin/shop/products/new')}
          className="bg-brand hover:bg-brand/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-6">
        {products.length === 0 ? (
          <Card className="bg-surface border-gray-600">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No products found. Create your first product!</p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="bg-surface border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {product.image_url && (
                    <img
                      src={`/api/media/${product.image_url}`}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                        <p className="text-gray-300 mt-1">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-brand font-bold">৳{product.price_bdt}</span>
                          <span className="text-yellow-400 text-sm">{product.coins} coins</span>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/shop/products/${product.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(product.id, product.is_active)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}