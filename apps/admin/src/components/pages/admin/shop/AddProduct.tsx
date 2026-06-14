import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ControlPageHeader } from '@/components/admin/ControlUI';
import { apiClient } from '@/lib/api';

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
        const imageResult = await apiClient.uploadMedia(formData.image);
        imageUrl = imageResult.filename;
      }

      await apiClient.request('/admin/shop/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price_bdt: parseFloat(formData.price),
          coins: parseFloat(formData.price) * 10,
          image_url: imageUrl
        })
      });

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
    <div className="control-manager-page">
      <ControlPageHeader title="Add Product" subtitle="Create a new shop item" />

      <Card className="bg-surface border-gray-600">
        <CardContent className="p-6">
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
