import React, { useState } from 'react';
import { useSellerProducts, useCreateProduct, useUpdateStock, useUpdateProduct, useDeleteProduct, Product } from '@frontend/api-client';
import { Search, Plus, Save, Package, AlertCircle, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { data: products, isLoading, refetch } = useSellerProducts();
  const createProductMutation = useCreateProduct();
  const updateStockMutation = useUpdateStock();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 499,
    stockQuantity: 10,
    lowStockThreshold: 5,
    category: 'Electronics',
    returnType: 'NO_RETURN',
    returnPolicy: 'RETURN',
  });
  const [brand, setBrand] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  
  const [formError, setFormError] = useState('');
 
  const filteredProducts = (products || []).filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      description: '',
      price: 499,
      stockQuantity: 10,
      lowStockThreshold: 5,
      category: 'Electronics',
      returnType: 'NO_RETURN',
      returnPolicy: 'RETURN',
    });
    setBrand('');
    setImages(['']);
    setHighlights(['']);
    setSpecs([{ key: '', value: '' }]);
    setFormError('');
    setIsModalOpen(true);
  };
 
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold || 5,
      category: product.category,
      returnType: (product as any).returnType || 'NO_RETURN',
      returnPolicy: (product as any).returnPolicy || 'RETURN',
    });
    setBrand(product.brand || '');
    setImages(product.images && product.images.length > 0 ? [...product.images] : ['']);
    setHighlights(product.highlights && product.highlights.length > 0 ? [...product.highlights] : ['']);
    
    const mappedSpecs = product.specifications
      ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }];
    setSpecs(mappedSpecs);
    
    setFormError('');
    setIsModalOpen(true);
  };
 
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
 
    // Clean list data
    const cleanImages = images.map(img => img.trim()).filter(img => img !== '');
    const cleanHighlights = highlights.map(hl => hl.trim()).filter(hl => hl !== '');
    const cleanSpecs: { [key: string]: string } = {};
    specs.forEach(sp => {
      if (sp.key.trim() !== '' && sp.value.trim() !== '') {
        cleanSpecs[sp.key.trim()] = sp.value.trim();
      }
    });
 
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        category: form.category,
        brand: brand.trim(),
        images: cleanImages,
        highlights: cleanHighlights,
        specifications: cleanSpecs,
        returnType: form.returnType,
        returnPolicy: form.returnPolicy,
      } as any;
 
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          productData: payload,
        });
      } else {
        await createProductMutation.mutateAsync(payload);
      }

      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProductMutation.mutateAsync(id);
        refetch();
      } catch (err) {
        alert('Error deleting product.');
      }
    }
  };

  const handleStockSave = async (id: string) => {
    try {
      await updateStockMutation.mutateAsync({ id, quantity: newStockVal });
      setEditingStockId(null);
      refetch();
    } catch (err) {
      alert('Error updating stock value.');
    }
  };

  // List Management Helpers
  const addImageField = () => setImages([...images, '']);
  const updateImageField = (idx: number, val: string) => {
    const updated = [...images];
    updated[idx] = val;
    setImages(updated);
  };
  const removeImageField = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated.length > 0 ? updated : ['']);
  };
  const moveImage = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === images.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...images];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setImages(updated);
  };

  const addHighlightField = () => setHighlights([...highlights, '']);
  const updateHighlightField = (idx: number, val: string) => {
    const updated = [...highlights];
    updated[idx] = val;
    setHighlights(updated);
  };
  const removeHighlightField = (idx: number) => {
    const updated = highlights.filter((_, i) => i !== idx);
    setHighlights(updated.length > 0 ? updated : ['']);
  };

  const addSpecField = () => setSpecs([...specs, { key: '', value: '' }]);
  const updateSpecKeyField = (idx: number, keyVal: string) => {
    const updated = [...specs];
    updated[idx].key = keyVal;
    setSpecs(updated);
  };
  const updateSpecValueField = (idx: number, valueVal: string) => {
    const updated = [...specs];
    updated[idx].value = valueVal;
    setSpecs(updated);
  };
  const removeSpecField = (idx: number) => {
    const updated = specs.filter((_, i) => i !== idx);
    setSpecs(updated.length > 0 ? updated : [{ key: '', value: '' }]);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Manage catalog listings, specifications, and inventory stocks.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Control Actions Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-grow max-w-sm">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center">
          <Package className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Add a new item to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-6 py-3.5">Name / Brand</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock Level</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-900 block max-w-xs truncate" title={p.name}>{p.name}</span>
                        <span className="text-xs text-slate-400 block font-medium">{p.brand || 'No Brand'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs capitalize font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    INR {p.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {editingStockId === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-16 border border-slate-250 rounded px-2 py-1 text-xs focus:outline-none"
                          value={newStockVal}
                          onChange={(e) => setNewStockVal(Number(e.target.value))}
                        />
                        <button
                          onClick={() => handleStockSave(p.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Save Stock"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${p.stockQuantity <= (p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5) ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {p.stockQuantity}
                        </span>
                        <button
                          onClick={() => {
                            setEditingStockId(p.id);
                            setNewStockVal(p.stockQuantity);
                          }}
                          className="text-[10px] text-emerald-600 font-semibold hover:underline"
                        >
                          (Update)
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-3 h-full min-h-[64px]">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit Product"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation/Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-semibold text-slate-900 text-lg">
                {editingProduct ? 'Edit Catalog Item' : 'Add New Catalog Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs">{formError}</span>
                </div>
              )}

              {/* General Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-1">General Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Product Title</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Amazon-style long, keyword-rich title..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Brand name..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 h-[38px]"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Books">Books</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-1">Pricing & Inventory</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stock Level</label>
                    <input
                      type="number"
                      required
                      value={form.stockQuantity}
                      onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Low Alert Limit</label>
                    <input
                      type="number"
                      required
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Return Policy Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-1">Return & Replacement Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Return Option</label>
                    <select
                      value={form.returnType}
                      onChange={(e) => setForm({ ...form, returnType: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 h-[38px]"
                    >
                      <option value="NO_RETURN">No Return</option>
                      <option value="SEVEN_DAYS_RETURN">7 Days Return</option>
                      <option value="OTHER">Other / Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Action Type</label>
                    <select
                      value={form.returnPolicy}
                      onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 h-[38px]"
                    >
                      <option value="RETURN">Return (Refund)</option>
                      <option value="REPLACE">Replace (Replacement Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Highlights */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <h4 className="font-semibold text-sm text-slate-800">Bullet Highlights</h4>
                  <button
                    type="button"
                    onClick={addHighlightField}
                    className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Highlight
                  </button>
                </div>
                <div className="space-y-2">
                  {highlights.map((hl, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={hl}
                        onChange={(e) => updateHighlightField(index, e.target.value)}
                        className="flex-grow border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Bullet highlight (e.g. Waterproof up to 10m)..."
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlightField(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Specifications */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <h4 className="font-semibold text-sm text-slate-800">Specifications Table</h4>
                  <button
                    type="button"
                    onClick={addSpecField}
                    className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {specs.map((sp, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={sp.key}
                        onChange={(e) => updateSpecKeyField(index, e.target.value)}
                        className="w-1/3 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Key (e.g. Material)..."
                      />
                      <input
                        type="text"
                        value={sp.value}
                        onChange={(e) => updateSpecValueField(index, e.target.value)}
                        className="flex-grow border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Value (e.g. Leather)..."
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecField(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images Manager */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <h4 className="font-semibold text-sm text-slate-800">Product Image Gallery</h4>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Image URL
                  </button>
                </div>
                <div className="space-y-2.5">
                  {images.map((img, index) => (
                    <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {img.trim() !== '' ? (
                          <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <input
                        type="url"
                        value={img}
                        onChange={(e) => updateImageField(index, e.target.value)}
                        className="flex-grow border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Image URL (e.g. https://...)..."
                      />
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-200"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === images.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded hover:bg-slate-200"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter detailed description here..."
                />
              </div>

              {/* Form Actions Footer inside scrollable box */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
