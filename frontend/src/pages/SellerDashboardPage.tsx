import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign, User as UserIcon,
  Plus, Pencil, Trash2, ChevronDown, Loader2, Star, TrendingUp, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { getOrders, updateOrderStatus } from '../api/orders';
import { getMySellerProfile, updateSellerProfile, getPayouts, requestPayout } from '../api/store';
import { getCategories } from '../api/products';
import { parseApiError, parseFieldErrors } from '../utils/apiError';
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
                    <p className="text-xs font-medium text-[#1C1C1C]">#{order.id}</p>
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

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  location: string;
  is_active: boolean;
}

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
  const [form, setForm] = useState<ProductFormData>({
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

  const handleSubmit = async () => {
    setErrors({});
    if (!form.name.trim()) { setErrors({ name: 'Name is required.' }); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setErrors({ price: 'Enter a valid price.' }); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category ? parseInt(form.category) : undefined,
        price: form.price,
        stock: parseInt(form.stock) || 0,
        location: form.location,
        is_active: form.is_active,
      };
      if (mode === 'add') {
        await createProduct(payload);
        toast.success('Product created!');
      } else if (initial) {
        await updateProduct(initial.slug, payload);
        toast.success('Product updated!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length) {
        setErrors(fieldErrs);
      } else {
        toast.error(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="Afghan Hand-Knotted Rug"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
              placeholder="Describe the piece, materials, dimensions…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price (USD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${errors.price ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="149.99"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location (Origin)</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
              placeholder="Kabul, Afghanistan"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-[#C9A84C]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Listed (visible to buyers)</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'add' ? 'Create Product' : 'Save Changes'}
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

// ─── Orders Section ───────────────────────────────────────────────────────────

function SellerOrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    getOrders()
      .then(({ data }) => setOrders(data.results))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as Order['status'] } : o));
      toast.success('Order status updated.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#1C1C1C]">#{order.id}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#1C1C1C]">
                      ${parseFloat(order.total_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#C9A84C] cursor-pointer disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
