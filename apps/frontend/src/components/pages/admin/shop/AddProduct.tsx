import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AddProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null as File | null,
    imagePreview: null as string | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.image);
        
        const token = localStorage.getItem('admin_token');
        const imageResponse = await fetch('http://localhost:8001/admin/media/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
          credentials: 'include'
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`Failed to upload image: ${errorText}`);
        }
        const imageResult = await imageResponse.json();
        imageUrl = imageResult.filename;
      }

      // Create product
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8001/api/admin/shop/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price_bdt: parseFloat(formData.price),
          coins: parseFloat(formData.price) * 10,
          image_url: imageUrl
        })
      });

      if (!response.ok) throw new Error('Failed to create product');

      toast({
        title: 'Success',
        description: 'Product created successfully'
      });
      
      navigate('/admin/shop/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-white">Add New Product</h1>
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
              <FileUpload
                accept="image/*"
                onFileSelect={(file) => {
                  const preview = URL.createObjectURL(file);
                  setFormData(prev => ({ ...prev, image: file, imagePreview: preview }));
                }}
                className="w-full"
              />
              {formData.imagePreview && (
                <div className="mt-4">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Selected: {formData.image?.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand hover:bg-brand/80"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Product'}
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