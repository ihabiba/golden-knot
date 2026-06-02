import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign, User as UserIcon,
  Plus, Pencil, Trash2, ChevronDown, Loader2, Star, TrendingUp, X,
  ImagePlus, Truck, Eye, Calendar, Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage } from '../api/products';
import { getOrders, updateOrderStatus } from '../api/orders';
import { getMySellerProfile, updateSellerProfile, getPayouts, requestPayout } from '../api/store';
import { getCategories } from '../api/products';
import { parseApiError, parseFieldErrors } from '../utils/apiError';
import { mediaUrl } from '../utils/mediaUrl';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import type { Product, Order, SellerProfile, Payout, Category } from '../types';

const NAV_ITEMS = [
  { key: 'overview',  label: 'Overview',  icon: <LayoutDashboard size={15} /> },
  { key: 'products',  label: 'Products',  icon: <Package size={15} /> },
  { key: 'orders',    label: 'Orders',    icon: <ShoppingBag size={15} /> },
  { key: 'earnings',  label: 'Earnings',  icon: <DollarSign size={15} /> },
  { key: 'profile',   label: 'My Store',  icon: <UserIcon size={15} /> },
];

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewSection({
  products, orders, profile,
}: {
  products: Product[];
  orders: Order[];
  profile: SellerProfile | null;
}) {
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_price), 0);

  const activeProducts = products.filter((p) => p.is_active).length;
  const avgRating = products.length
    ? products.reduce((s, p) => s + (p.avg_rating || 0), 0) / products.filter((p) => p.avg_rating).length || 0
    : 0;

  const recentOrders = orders.slice(0, 5);
  const topProducts = [...products]
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {profile?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0 text-sm font-bold">!</div>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Account under review</p>
            <p className="text-xs text-yellow-600">Your seller account is awaiting admin approval.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={18} />} value={`$${totalRevenue.toFixed(0)}`} label="Total Revenue" />
        <StatCard icon={<ShoppingBag size={18} />} value={orders.length} label="Total Orders" />
        <StatCard icon={<Package size={18} />} value={activeProducts} label="Active Products" iconColor="#22c55e" />
        <StatCard icon={<Star size={18} />} value={avgRating ? avgRating.toFixed(1) : '—'} label="Avg Rating" iconColor="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-[#1C1C1C] mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#1C1C1C] truncate max-w-[150px]">
                      {order.items[0]?.product_name ?? 'Order'}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                  <p className="text-xs font-semibold text-[#1C1C1C]">${parseFloat(order.total_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-sm text-[#1C1C1C] mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No products yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] shrink-0">
                    <Package size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1C1C1C] truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.review_count} reviews · ★ {p.avg_rating?.toFixed(1) ?? '—'}</p>
                  </div>
                  <p className="text-xs font-semibold text-[#C9A84C] shrink-0">${parseFloat(p.price).toFixed(0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Form Modal ────────────────────────────────────────────────────────

interface PendingImage { file: File; preview: string; isPrimary: boolean }

function ProductModal({
  mode,
  initial,
  categories,
  onClose,
  onSuccess,
}: {
  mode: 'add' | 'edit';
  initial?: Product;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    category: initial?.category?.toString() ?? '',
    price: initial?.price ?? '',
    stock: initial?.stock?.toString() ?? '',
    location: initial?.location ?? '',
    is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Image state
  const [existingImages, setExistingImages] = useState(initial?.images ?? []);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPending: PendingImage[] = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: existingImages.length === 0 && pendingImages.length === 0 && i === 0,
    }));
    setPendingImages((prev) => [...prev, ...newPending]);
    e.target.value = '';
  };

  const removeExisting = (id: number) => {
    setDeletedIds((prev) => [...prev, id]);
    setExistingImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      if (remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
        remaining[0] = { ...remaining[0], is_primary: true };
      }
      return remaining;
    });
  };

  const removePending = (idx: number) => {
    setPendingImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((p) => p.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const setPrimaryExisting = (id: number) => {
    setExistingImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === id })));
    setPendingImages((prev) => prev.map((p) => ({ ...p, isPrimary: false })));
  };

  const setPrimaryPending = (idx: number) => {
    setExistingImages((prev) => prev.map((img) => ({ ...img, is_primary: false })));
    setPendingImages((prev) => prev.map((p, i) => ({ ...p, isPrimary: i === idx })));
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!form.name.trim()) { setErrors({ name: 'Name is required.' }); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setErrors({ price: 'Enter a valid price.' }); return; }
    setLoading(true);
    try {
      const payload: Record<string, string | number | boolean> = {
        name: form.name,
        description: form.description,
        price: form.price,
        stock: parseInt(form.stock) || 0,
        location: form.location,
        is_active: form.is_active,
        ...(form.category ? { category: parseInt(form.category) } : {}),
      };

      let slug: string;
      if (mode === 'add') {
        const res = await createProduct(payload);
        slug = res.data.slug;
      } else {
        slug = initial!.slug;
        await updateProduct(slug, payload);
      }

      // Delete removed images
      await Promise.all(deletedIds.map((id) => deleteProductImage(slug, id)));

      // Upload new images
      for (const img of pendingImages) {
        await uploadProductImage(slug, img.file, img.isPrimary);
      }

      toast.success(mode === 'add' ? 'Product created!' : 'Product updated!');
      onSuccess();
      onClose();
    } catch (err) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
      else toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const inp = (err?: boolean) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${err ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp(!!errors.name)} placeholder="Afghan Hand-Knotted Rug" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none" placeholder="Describe the piece, materials, dimensions…" />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price (USD) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inp(!!errors.price)} placeholder="149.99" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inp()} placeholder="1" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors bg-white">
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location (Origin)</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inp()} placeholder="Kabul, Afghanistan" />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-[#C9A84C]' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Listed (visible to buyers)</span>
          </label>

          {/* ── Image Upload ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Product Images</label>
            <p className="text-[11px] text-gray-400 mb-3">Click the star to set the primary image shown in listings.</p>

            <div className="flex flex-wrap gap-3 mb-3">
              {/* Existing images */}
              {existingImages.map((img) => (
                <div key={img.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button type="button" onClick={() => setPrimaryExisting(img.id)} className={`p-1 rounded-full transition-colors ${img.is_primary ? 'bg-[#C9A84C] text-black' : 'bg-white/80 text-gray-700 hover:bg-[#C9A84C] hover:text-black'}`} title="Set as primary">★</button>
                    <button type="button" onClick={() => removeExisting(img.id)} className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors" title="Remove"><X size={12} /></button>
                  </div>
                  {img.is_primary && <span className="absolute top-1 left-1 bg-[#C9A84C] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">Primary</span>}
                </div>
              ))}

              {/* Pending new images */}
              {pendingImages.map((img, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-[#C9A84C]/40">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button type="button" onClick={() => setPrimaryPending(i)} className={`p-1 rounded-full transition-colors ${img.isPrimary ? 'bg-[#C9A84C] text-black' : 'bg-white/80 text-gray-700 hover:bg-[#C9A84C] hover:text-black'}`} title="Set as primary">★</button>
                    <button type="button" onClick={() => removePending(i)} className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors" title="Remove"><X size={12} /></button>
                  </div>
                  {img.isPrimary && <span className="absolute top-1 left-1 bg-[#C9A84C] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">Primary</span>}
                  <span className="absolute bottom-1 right-1 bg-blue-500 text-white text-[9px] px-1 py-0.5 rounded-full leading-none">New</span>
                </div>
              ))}

              {/* Add image button */}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#C9A84C] transition-colors">
                <ImagePlus size={18} />
                <span className="text-[10px] font-medium">Add</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Saving…' : mode === 'add' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      getProducts({ seller_only: true }),
      getCategories(),
    ])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data.results);
        setCategories(categoriesRes.data.results);
      })
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.slug);
      toast.success('Product deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">My Products</h2>
        <button
          onClick={() => { setEditProduct(undefined); setModalMode('add'); }}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Package size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="font-display text-lg font-bold text-gray-300 mb-1">No products yet</p>
          <p className="text-sm text-gray-400 mb-5">Start by adding your first handcrafted piece.</p>
          <button
            onClick={() => { setEditProduct(undefined); setModalMode('add'); }}
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={14} /> Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div>
                        <Link to={`/products/${product.slug}`} className="font-medium text-[#1C1C1C] hover:text-[#C9A84C] transition-colors line-clamp-1">
                          {product.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{product.category_name}</p>
                        {!product.is_approved && product.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1 leading-snug">
                            Rejected: {product.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell font-semibold text-[#1C1C1C]">
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={product.is_approved ? 'approved' : 'pending'} size="sm" />
                        {!product.is_active && <StatusBadge status="inactive" size="sm" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditProduct(product); setModalMode('edit'); }}
                          className="p-1.5 text-gray-400 hover:text-[#C9A84C] transition-colors rounded-lg hover:bg-[#C9A84C]/10"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalMode && (
        <ProductModal
          mode={modalMode}
          initial={editProduct}
          categories={categories}
          onClose={() => setModalMode(null)}
          onSuccess={load}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete Product"
        variant="danger"
      />
    </div>
  );
}

// ─── Customer Mini-Profile Modal ──────────────────────────────────────────────

function CustomerProfileModal({
  order,
  allOrders,
  onClose,
}: {
  order: Order;
  allOrders: Order[];
  onClose: () => void;
}) {
  const ordersFromCustomer = allOrders.filter((o) => o.customer === order.customer);
  const totalSpent = ordersFromCustomer
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + parseFloat(o.total_price), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A0A0A] px-6 py-5 flex items-center justify-between">
          <h3 className="font-display font-bold text-white">Customer Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Avatar + name */}
        <div className="px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-[#C9A84C]/15 overflow-hidden flex items-center justify-center text-[#C9A84C] text-xl font-bold font-display shrink-0">
            {order.customer_avatar
              ? <img src={mediaUrl(order.customer_avatar)!} alt={order.customer_username} className="w-full h-full object-cover" />
              : order.customer_username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1C1C1C]">{order.customer_username}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Mail size={11} /> {order.customer_email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-500"><Calendar size={14} /> Member since</span>
            <span className="font-medium text-[#1C1C1C]">
              {new Date(order.customer_joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-500"><ShoppingBag size={14} /> Orders from you</span>
            <span className="font-semibold text-[#1C1C1C]">{ordersFromCustomer.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-500"><DollarSign size={14} /> Total spent (delivered)</span>
            <span className="font-semibold text-[#C9A84C]">${totalSpent.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping address for this order */}
        <div className="px-6 pb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping address for Order #{order.id}</p>
          <div className="bg-[#FAFAF8] rounded-xl p-3 text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-[#1C1C1C]">{order.shipping_address.full_name}</p>
            <p>{order.shipping_address.address_line1}{order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ''}</p>
            <p>{order.shipping_address.city}, {order.shipping_address.country} {order.shipping_address.postal_code}</p>
            <p className="text-gray-400 text-xs">{order.shipping_address.phone}</p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function SellerOrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [profileOrder, setProfileOrder] = useState<Order | null>(null);

  // Tracking modal state
  const [shipTarget, setShipTarget] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [submittingShip, setSubmittingShip] = useState(false);

  useEffect(() => {
    getOrders()
      .then(({ data }) => setOrders(data.results))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (orderId: number, newStatus: string) => {
    if (newStatus === 'shipped') {
      setShipTarget(orderId);
      setTrackingNumber('');
      setCarrier('');
    } else {
      doStatusUpdate(orderId, { status: newStatus });
    }
  };

  const doStatusUpdate = useCallback(async (orderId: number, data: { status: string; tracking_number?: string; shipping_carrier?: string }) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, data);
      setOrders((prev) => prev.map((o) => o.id === orderId ? res.data : o));
      toast.success('Order updated.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleConfirmShip = async () => {
    if (!shipTarget) return;
    setSubmittingShip(true);
    await doStatusUpdate(shipTarget, {
      status: 'shipped',
      tracking_number: trackingNumber.trim(),
      shipping_carrier: carrier.trim(),
    });
    setSubmittingShip(false);
    setShipTarget(null);
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-6">Orders</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <ShoppingBag size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders yet. Share your store link to get started!</p>
        </div>
      ) : (
        <>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Ship To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">

                    {/* Order name + date + tracking */}
                    <td className="px-5 py-4">
                      <Link to={`/orders/${order.id}?mode=seller`} className="font-medium text-[#1C1C1C] hover:text-[#C9A84C] transition-colors line-clamp-1">
                        {order.items[0]?.product_name ?? 'Order'}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      {order.tracking_number && (
                        <p className="text-[11px] text-[#C9A84C] mt-0.5 flex items-center gap-1">
                          <Truck size={10} /> {order.shipping_carrier} · {order.tracking_number}
                        </p>
                      )}
                    </td>

                    {/* Customer avatar + name — clickable for profile */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setProfileOrder(order)}
                        className="flex items-center gap-2 group"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#C9A84C]/15 overflow-hidden flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0">
                          {order.customer_avatar
                            ? <img src={order.customer_avatar} alt={order.customer_username} className="w-full h-full object-cover" />
                            : order.customer_username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-[#1C1C1C] group-hover:text-[#C9A84C] transition-colors">
                          {order.customer_username}
                        </span>
                      </button>
                    </td>

                    {/* Ship-to city */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-xs text-gray-600">{order.shipping_address.full_name}</p>
                      <p className="text-xs text-gray-400">{order.shipping_address.city}, {order.shipping_address.country}</p>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 hidden sm:table-cell font-semibold text-[#1C1C1C]">
                      ${parseFloat(order.total_price).toFixed(2)}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>

                    {/* Update status + view */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/orders/${order.id}?mode=seller`}
                          className="p-1.5 text-gray-400 hover:text-[#C9A84C] transition-colors rounded-lg hover:bg-[#C9A84C]/10"
                          title="View order details"
                        >
                          <Eye size={14} />
                        </Link>
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#C9A84C] cursor-pointer disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer mini-profile modal */}
        {profileOrder && (
          <CustomerProfileModal
            order={profileOrder}
            allOrders={orders}
            onClose={() => setProfileOrder(null)}
          />
        )}
        </>
      )}

      {/* Tracking info modal — shown when seller marks an order as shipped */}
      {shipTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-[#1C1C1C]">Mark as Shipped</h3>
                <p className="text-xs text-gray-500">Order #{shipTarget}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Shipping Carrier</label>
                <input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. DHL, FedEx, Afghan Post"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tracking Number</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-400">Both fields are optional but recommended so buyers can track their order.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShipTarget(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirmShip}
                disabled={submittingShip}
                className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {submittingShip && <Loader2 size={13} className="animate-spin" />}
                Confirm Shipped
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Earnings Section ─────────────────────────────────────────────────────────

function EarningsSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  useEffect(() => {
    Promise.all([getOrders(), getPayouts()])
      .then(([ordersRes, payoutsRes]) => {
        setOrders(ordersRes.data.results);
        setPayouts(payoutsRes.data.results);
      })
      .catch(() => toast.error('Failed to load earnings.'))
      .finally(() => setLoading(false));
  }, []);

  const totalEarned = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + parseFloat(o.total_price), 0);

  const completedPayouts = payouts
    .filter((p) => p.status === 'completed')
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const pendingPayouts = payouts
    .filter((p) => p.status === 'requested' || p.status === 'processing')
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount.'); return; }
    setRequesting(true);
    try {
      await requestPayout(payoutAmount);
      toast.success('Payout requested!');
      setShowPayoutForm(false);
      setPayoutAmount('');
      const res = await getPayouts();
      setPayouts(res.data.results);
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Earnings & Payouts</h2>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp size={18} />} value={`$${totalEarned.toFixed(2)}`} label="Total Earned" />
        <StatCard icon={<DollarSign size={18} />} value={`$${completedPayouts.toFixed(2)}`} label="Paid Out" iconColor="#22c55e" />
        <StatCard icon={<DollarSign size={18} />} value={`$${pendingPayouts.toFixed(2)}`} label="Pending" iconColor="#f59e0b" />
      </div>

      {/* Request payout */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-[#1C1C1C]">Request Payout</h3>
            <p className="text-xs text-gray-400 mt-0.5">Available: ${(totalEarned - completedPayouts - pendingPayouts).toFixed(2)}</p>
          </div>
          <button
            onClick={() => setShowPayoutForm(!showPayoutForm)}
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            <DollarSign size={13} /> Request Payout
          </button>
        </div>
        {showPayoutForm && (
          <div className="flex gap-3 mt-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
            <button
              onClick={handleRequestPayout}
              disabled={requesting}
              className="flex items-center gap-1.5 bg-[#1C1C1C] hover:bg-[#2a2a2a] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {requesting && <Loader2 size={12} className="animate-spin" />}
              Submit
            </button>
          </div>
        )}
      </div>

      {/* Payouts table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-[#1C1C1C]">Payout History</h3>
        </div>
        {payouts.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No payouts yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3.5 text-gray-600">
                    {new Date(p.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-[#1C1C1C]">${parseFloat(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function StoreProfileSection() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    store_name: '',
    bio: '',
    location: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
  });

  useEffect(() => {
    getMySellerProfile()
      .then(({ data }) => {
        setProfile(data);
        setForm({
          store_name: data.store_name,
          bio: data.bio,
          location: data.location,
          bank_account_name: data.bank_account_details?.account_name ?? '',
          bank_account_number: data.bank_account_details?.account_number ?? '',
          bank_name: data.bank_account_details?.bank_name ?? '',
        });
      })
      .catch(() => toast.error('Failed to load store profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setErrors({});
    try {
      await updateSellerProfile(profile.id, {
        store_name: form.store_name,
        bio: form.bio,
        location: form.location,
        bank_account_details: {
          account_name: form.bank_account_name,
          account_number: form.bank_account_number,
          bank_name: form.bank_name,
        },
      });
      toast.success('Store profile updated!');
    } catch (err) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length) {
        setErrors(fieldErrs);
      } else {
        toast.error(parseApiError(err));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">My Store</h2>
        {profile && (
          <StatusBadge status={profile.status} showDot />
        )}
      </div>

      {/* Store info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-sm text-[#1C1C1C]">Store Information</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Store Name</label>
          <input
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${errors.store_name ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.store_name && <p className="text-xs text-red-500 mt-1">{errors.store_name}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Bio / Description</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Kabul, Afghanistan"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
        </div>
      </div>

      {/* Bank details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-sm text-[#1C1C1C]">Bank Account Details</h3>
        <p className="text-xs text-gray-400">Used for payout processing. Kept securely.</p>
        {[
          { key: 'bank_account_name', label: 'Account Holder Name' },
          { key: 'bank_account_number', label: 'Account Number' },
          { key: 'bank_name', label: 'Bank Name' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
            <input
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? 'Saving…' : 'Save Store Profile'}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellerDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');

  // Shared data for overview
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    if (user && user.role !== 'seller') { navigate('/', { replace: true }); return; }
    if (loadedRef.current) return;
    loadedRef.current = true;
    Promise.all([
      getProducts({ seller_only: true }),
      getOrders(),
      getMySellerProfile(),
    ]).then(([productsRes, ordersRes, profileRes]) => {
      setProducts(productsRes.data.results);
      setOrders(ordersRes.data.results);
      setProfile(profileRes.data);
    }).catch(() => {});
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout
      title="Seller Dashboard"
      subtitle={profile?.store_name ?? user?.username ?? ''}
      navItems={NAV_ITEMS}
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === 'overview' && (
        <OverviewSection products={products} orders={orders} profile={profile} />
      )}
      {section === 'products' && <ProductsSection />}
      {section === 'orders'   && <SellerOrdersSection />}
      {section === 'earnings' && <EarningsSection />}
      {section === 'profile'  && <StoreProfileSection />}
    </DashboardLayout>
  );
}
