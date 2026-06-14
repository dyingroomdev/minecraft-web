import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price_bdt: number;
  coins: number;
  image_url?: string;
  is_active: boolean;
}

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_active: true,
    image: null as File | null
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/admin/shop/products/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      setProduct(data);
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price_bdt.toString(),
        is_active: data.is_active,
        image: null
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive'
      });
      navigate('/admin/shop/products');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = product?.image_url || '';
      
      // Upload new image if provided
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.image);
        
        const imageResponse = await fetch('http://localhost:8001/admin/media/', {
          method: 'POST',
          body: imageFormData,
          credentials: 'include'
        });
        
        if (!imageResponse.ok) throw new Error('Failed to upload image');
        const imageResult = await imageResponse.json();
        imageUrl = imageResult.filename;
      }

      // Update product
      const response = await fetch(`http://localhost:8001/api/admin/shop/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price_bdt: parseFloat(formData.price),
          coins: parseFloat(formData.price) * 10,
          image_url: imageUrl,
          is_active: formData.is_active
        })
      });

      if (!response.ok) throw new Error('Failed to update product');

      toast({
        title: 'Success',
        description: 'Product updated successfully'
      });
      
      navigate('/admin/shop/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return <div className="text-white">Loading product...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/shop/products')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold text-white">Edit Product</h1>
      </div>

      <Card className="bg-surface border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-200">Price (BDT)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-200">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Product Image</Label>
              {product.image_url && (
                <div className="mb-4">
                  <img
                    src={`/api/media/${product.image_url}`}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <p className="text-sm text-gray-400 mt-2">Current image</p>
                </div>
              )}
              <FileUpload
                accept="image/*"
                onFileSelect={(file) => setFormData(prev => ({ ...prev, image: file }))}
                className="w-full"
              />
              {formData.image && (
                <p className="text-sm text-gray-400">
                  New image selected: {formData.image.name}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-gray-200">
                Product is active
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand hover:bg-brand/80"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Updating...' : 'Update Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/shop/products')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}