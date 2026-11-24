import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Search,
  DollarSign,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../../types';

export const AdminProducts: React.FC = () => {
  const { products, saveProduct, deleteProduct, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingProduct({
      title: '',
      description: '',
      price: 25,
      dailyRewardAmount: 1.25,
      durationDays: 30,
      category: 'Mining Node',
      stock: 50,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      isAvailable: true,
      features: ['Daily Claim for 30 Days', '24/7 Node Uptime', 'Instant Settlement']
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.title || !editingProduct.price) {
      addToast('Title and price are required', 'error');
      return;
    }

    await saveProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Product Catalog & Pricing Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Any price adjustments or newly published products instantly update the Android app in real-time.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by title or category..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-4 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950 mb-3">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/90 text-amber-400 border border-amber-500/30">
                  {product.category}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-slate-300">
                  Stock: {product.stock}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {product.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {product.description}
              </p>

              {product.features && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-[9px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 tabular-nums">
                <div>
                  <span className="text-slate-400 block text-[10px]">Daily Earning</span>
                  <span className="font-bold text-emerald-400">
                    +${(product.dailyRewardAmount ?? 0).toFixed(2)} / day
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Validity</span>
                  <span className="font-bold text-white">{product.durationDays || 30} Days</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Price (USDT)</span>
                  <span className="text-base font-black text-amber-400 tabular-nums">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center space-x-1 border border-slate-700"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(product.id)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / ADD MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingProduct.id ? 'Edit Product Details & Price' : 'Add New Product to App'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  placeholder="e.g. Antminer Cloud Hashrate 10TH/s"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Price in USDT (BEP-20)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="e.g. Mining Node, Education, Security"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Daily Earning Reward (USDT / Day)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingProduct.dailyRewardAmount ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        dailyRewardAmount: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 tabular-nums focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Earning Duration (Days, default 30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={editingProduct.durationDays ?? 30}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        durationDays: parseInt(e.target.value) || 30
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white tabular-nums focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 flex items-center justify-between text-[11px] tabular-nums">
                <span className="text-slate-400">
                  Total Return ({editingProduct.durationDays ?? 30} Days):
                </span>
                <span className="font-bold text-amber-400">
                  $
                  {(
                    (editingProduct.dailyRewardAmount ?? 0) * (editingProduct.durationDays ?? 30)
                  ).toFixed(2)}{' '}
                  USDT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Product Image URL
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Describe the product benefits, node specs, or course indicators..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20"
                >
                  Save & Sync to App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Delete Product?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this product? It will immediately disappear from the Android app store.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
