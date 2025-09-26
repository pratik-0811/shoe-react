import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import imageUploadService from '../../services/imageUploadService';
import { Product, Category } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ProductFormData {
  name: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  brand: string;
  countInStock: number;
  description: string;
  isFeatured: boolean;
  gender: string;
  material: string;
  style: string;
  season: string;
  sizes: Array<{ size: string; stock: number }>;
  colors: Array<{ name: string; hexCode: string; stock: number }>;
  features: string[];
}

const ProductManagement: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    image: '',
    images: [],
    category: '',
    brand: '',
    countInStock: 0,
    description: '',
    isFeatured: false,
    gender: 'Unisex',
    material: '',
    style: '',
    season: 'All Season',
    sizes: [],
    colors: [],
    features: []
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await api.get(`/products?${params}`);
      
      if (response.data && response.data.products) {
        setProducts(response.data.products);
        setTotalPages(response.data.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setProducts(response.data);
        setTotalPages(1);
      } else {
        // Unexpected response format - fallback to empty
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      // Silent fail - error handled by UI state
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      
      if (response.data && response.data.success && response.data.categories) {
        setCategories(response.data.categories);
      } else if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        // Unexpected response format - fallback to empty
        setCategories([]);
      }
    } catch (err) {
      // Silent fail - fallback to empty categories
      setCategories([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload new images if files are selected
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadResponse = await imageUploadService.uploadProductImages(selectedFiles);
        if (uploadResponse.success && uploadResponse.files) {
          imageUrls = uploadResponse.files.map(file => file.url);
        }
      }
      
      // Prepare product data
      const productData = {
        ...formData,
        images: imageUrls.length > 0 ? imageUrls : formData.images,
        image: imageUrls.length > 0 ? imageUrls[0] : formData.image
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData);
      } else {
        await api.post('/products', productData);
      }
      
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      images: product.images || [product.image],
      category: typeof product.category === 'object' ? product.category._id : product.category,
      brand: product.brand,
      countInStock: product.countInStock,
      description: product.description,
      isFeatured: product.isFeatured,
      gender: product.gender || 'Unisex',
      material: product.material || '',
      style: product.style || '',
      season: product.season || 'All Season',
      sizes: product.sizes || [],
      colors: product.colors || [],
      features: product.features || []
    });
    setImagePreview(product.images || [product.image]);
    setSelectedFiles(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      image: '',
      images: [],
      category: '',
      brand: '',
      countInStock: 0,
      description: '',
      isFeatured: false,
      gender: 'Unisex',
      material: '',
      style: '',
      season: 'All Season',
      sizes: [],
      colors: [],
      features: []
    });
    setSelectedFiles(null);
    setImagePreview([]);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length > 5) {
        setError('Maximum 5 images allowed');
        return;
      }
      
      setSelectedFiles(files);
      
      // Create preview URLs
      const previewUrls: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            previewUrls.push(e.target.result as string);
            if (previewUrls.length === files.length) {
              setImagePreview(previewUrls);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImagePreview(newPreviews);
    
    if (selectedFiles) {
      const dt = new DataTransfer();
      Array.from(selectedFiles).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      setSelectedFiles(dt.files);
    } else {
      // Remove from existing images
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages, image: newImages[0] || '' });
    }
  };

  // Authentication state tracking removed for production

  return (
    <div className="p-6">
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
        <strong>Debug Info:</strong> User: {user?.name || 'None'} | Admin: {user?.isAdmin ? 'Yes' : 'No'} | 
        Auth: {isAuthenticated ? 'Yes' : 'No'} | Loading: {authLoading ? 'Yes' : 'No'} | 
        Products: {products.length} | Categories: {categories.length}
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setSearchTerm('');
            setCategoryFilter('');
            setCurrentPage(1);
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images (Max 5)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload JPEG, PNG, or WebP images. Max 5MB per image.
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Preview
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat.isActive).map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="number"
                  placeholder="Stock Count"
                  value={formData.countInStock}
                  onChange={(e) => setFormData({ ...formData, countInStock: parseInt(e.target.value) })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Kids">Kids</option>
                </select>
                <input
                  type="text"
                  placeholder="Material (e.g., Leather, Canvas)"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Style (e.g., Casual, Formal)"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                  <option value="Fall">Fall</option>
                  <option value="Winter">Winter</option>
                  <option value="All Season">All Season</option>
                </select>
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
              
              {/* Sizes Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Available Sizes</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['6', '7', '8', '9', '10', '11', '12', '13'].map((size) => {
                    const sizeData = formData.sizes.find(s => s.size === size);
                    return (
                      <div key={size} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`size-${size}`}
                          checked={!!sizeData}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                sizes: [...formData.sizes, { size, stock: 0 }]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                sizes: formData.sizes.filter(s => s.size !== size)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`size-${size}`} className="text-sm">{size}</label>
                        {sizeData && (
                          <input
                            type="number"
                            placeholder="Stock"
                            value={sizeData.stock}
                            onChange={(e) => {
                              const newSizes = formData.sizes.map(s => 
                                s.size === size ? { ...s, stock: parseInt(e.target.value) || 0 } : s
                              );
                              setFormData({ ...formData, sizes: newSizes });
                            }}
                            className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                            min="0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Colors Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Available Colors</label>
                <div className="space-y-2">
                  {formData.colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Color name"
                        value={color.name}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[index] = { ...color, name: e.target.value };
                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="color"
                        value={color.hexCode}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[index] = { ...color, hexCode: e.target.value };
                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="w-12 h-10 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={color.stock}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[index] = { ...color, stock: parseInt(e.target.value) || 0 };
                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="w-20 border border-gray-300 rounded px-2 py-2 text-sm"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newColors = formData.colors.filter((_, i) => i !== index);
                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        colors: [...formData.colors, { name: '', hexCode: '#000000', stock: 0 }]
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Color
                  </button>
                </div>
              </div>
              
              {/* Features Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Features</label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Feature description"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...formData.features];
                          newFeatures[index] = e.target.value;
                          setFormData({ ...formData, features: newFeatures });
                        }}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = formData.features.filter((_, i) => i !== index);
                          setFormData({ ...formData, features: newFeatures });
                        }}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        features: [...formData.features, '']
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Featured Product</span>
              </label>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>
                    {uploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-lg object-cover" src={product.image} alt={product.name} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof product.category === 'object' ? product.category.name : product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.countInStock > 10 ? 'bg-green-100 text-green-800' :
                        product.countInStock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.countInStock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.rating.toFixed(1)} ({product.numReviews})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isFeatured ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Featured</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products found.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 border rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductManagement;