import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User as UserIcon, Package, Heart, MapPin, Settings,
  Camera, Eye, EyeOff, ChevronRight, Loader2,
  Plus, Edit2, Trash2, Star, ShoppingCart, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { updateUser, changePassword, deactivateUser } from '../api/users';
import { getOrders } from '../api/orders';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/addresses';
import { getWishlist } from '../api/wishlist';
import { parseApiError, parseFieldErrors } from '../utils/apiError';
import { mediaUrl } from '../utils/mediaUrl';
import { addToCart } from '../api/cart';
import { useCart } from '../context/CartContext';
import StatusBadge from '../components/StatusBadge';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmModal from '../components/ConfirmModal';
import type { Order, Address, WishlistItem } from '../types';

const ORDER_STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const NAV_ITEMS = [
  { key: 'profile',   label: 'Profile',   icon: <UserIcon size={16} /> },
  { key: 'orders',    label: 'My Orders',  icon: <Package size={16} /> },
  { key: 'wishlist',  label: 'Wishlist',   icon: <Heart size={16} /> },
  { key: 'addresses', label: 'Addresses',  icon: <MapPin size={16} /> },
  { key: 'settings',  label: 'Settings',   icon: <Settings size={16} /> },
];

// ─── Profile Section ─────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, email: user.email, phone: user.phone ?? '' });
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await updateUser(user.id, fd);
      await refreshUser();
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setErrors({});
    try {
      await updateUser(user.id, form);
      await refreshUser();
      toast.success('Profile updated successfully.');
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

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-6">Profile Information</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-2xl border border-gray-100">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#C9A84C]/15 flex items-center justify-center text-[#C9A84C] text-xl font-bold font-display">
            {user?.avatar ? (
              <img src={mediaUrl(user.avatar)!} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.username?.charAt(0).toUpperCase() ?? '?'
            )}
          </div>
          {uploadingAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-[#1C1C1C] text-sm">{user?.username}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="mt-1.5 flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#D4B96A] transition-colors disabled:opacity-60"
          >
            <Camera size={12} /> {uploadingAvatar ? 'Uploading…' : 'Change photo'}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        {(['username', 'email', 'phone'] as const).map((field) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === 'email' ? 'email' : 'text'}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              placeholder={field === 'phone' ? '+1 234 567 8900' : ''}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#C9A84C] transition-colors ${
                errors[field] ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
          </div>
        ))}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Section ──────────────────────────────────────────────────────────

function OrdersSection() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');

  useEffect(() => {
    const params: Record<string, string | number> = user?.role === 'seller' ? { as_customer: 'true' } : {};
    getOrders(params)
      .then(({ data }) => setOrders(data.results))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === activeStatus);

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-6">My Orders</h2>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              activeStatus === s
                ? 'bg-[#1C1C1C] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {s === 'all' ? 'All Orders' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Package size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No {activeStatus !== 'all' ? activeStatus : ''} orders found.</p>
          <Link to="/products" className="mt-3 inline-block text-[#C9A84C] text-sm hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const primaryItem = order.items[0];
            const sellers = [...new Set(order.items.map((i) => i.seller_name))].join(', ');
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all group"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  {primaryItem?.product_image ? (
                    <img src={primaryItem.product_image} alt={primaryItem.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#C9A84C]/10" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold text-[#1C1C1C] leading-snug line-clamp-2 flex-1">
                      {order.items.map((i) => i.product_name).slice(0, 2).join(' & ')}
                      {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                    </p>
                    <StatusBadge status={order.status} showDot size="sm" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sellers} · {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <p className="font-semibold text-sm text-[#1C1C1C]">${parseFloat(order.total_price).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-[#C9A84C] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Wishlist Section ─────────────────────────────────────────────────────────

const PALETTES = [
  ['#8B2525', '#C9A84C', '#1C3A5E'],
  ['#2D4A22', '#C9A84C', '#8B2525'],
  ['#1C3A5E', '#C9A84C', '#F5F0E8'],
  ['#8B2525', '#1C1C1C', '#C9A84C'],
  ['#4A1942', '#C9A84C', '#E8D5A3'],
  ['#1C3A5E', '#8B2525', '#C9A84C'],
  ['#8B4A2A', '#C9A84C', '#2D4A22'],
  ['#C9A84C', '#1C1C1C', '#8B2525'],
] as const;

function WishlistSection() {
  const { wishlistIds, toggle } = useWishlist();
  const { setItemCount, itemCount } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [addingCart, setAddingCart] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    setFetchingItems(true);
    try {
      const { data } = await getWishlist();
      setWishlistItems(data.results);
    } catch {
      toast.error('Failed to load wishlist.');
    } finally {
      setFetchingItems(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Keep in sync when context removes an item (optimistic)
  useEffect(() => {
    setWishlistItems((prev) => prev.filter((w) => wishlistIds.has(w.product)));
  }, [wishlistIds]);

  const handleRemove = async (productId: number) => {
    await toggle(productId);
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setAddingCart(item.product);
    try {
      await addToCart(item.product, 1);
      setItemCount(itemCount + 1);
      toast.success(`${item.product_detail.name} added to cart!`);
    } catch {
      toast.error('Could not add to cart.');
    } finally {
      setAddingCart(null);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-6">My Wishlist</h2>

      {fetchingItems ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Heart size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="font-display text-lg font-bold text-gray-300 mb-2">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mb-6">
            Browse our collection and heart the pieces you love.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <ShoppingCart size={14} /> Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wishlistItems.map((item) => {
            const p = item.product_detail;
            const palette = PALETTES[p.id % PALETTES.length];
            const primaryImage = p.images.find((img) => img.is_primary) ?? p.images[0];
            const rating = p.avg_rating ?? 0;
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-sm transition-shadow group">
                <Link to={`/products/${p.slug}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden">
                    {primaryImage ? (
                      <img src={primaryImage.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)` }}
                      />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${p.slug}`}>
                    <p className="text-sm font-semibold text-[#1C1C1C] truncate hover:text-[#C9A84C] transition-colors">
                      {p.name}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{p.seller_name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={10} className={s <= Math.round(rating) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-[#C9A84C] mt-1">
                    ${parseFloat(p.price).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={addingCart === item.product}
                      className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#D4B96A] text-black text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {addingCart === item.product ? <Loader2 size={11} className="animate-spin" /> : <ShoppingCart size={11} />}
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.product)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Addresses Section ────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan', 'Australia', 'Canada', 'China', 'France', 'Germany',
  'India', 'Italy', 'Japan', 'Malaysia', 'Netherlands', 'New Zealand',
  'Norway', 'Pakistan', 'Saudi Arabia', 'Singapore', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'UAE', 'United Kingdom', 'United States',
  'Other',
];

const EMPTY_ADDR: Omit<Address, 'id' | 'created_at'> = {
  full_name: '', address_line1: '', address_line2: '',
  city: '', country: '', postal_code: '', phone: '', is_default: false,
};

function AddressModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Address;
  onClose: () => void;
  onSaved: (a: Address) => void;
}) {
  const [form, setForm] = useState<Omit<Address, 'id' | 'created_at'>>(
    initial
      ? { full_name: initial.full_name, address_line1: initial.address_line1, address_line2: initial.address_line2, city: initial.city, country: initial.country, postal_code: initial.postal_code, phone: initial.phone, is_default: initial.is_default }
      : EMPTY_ADDR,
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    (['full_name', 'address_line1', 'city', 'country', 'postal_code', 'phone'] as const).forEach((k) => {
      if (!form[k].trim()) errs[k] = 'Required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = initial
        ? await updateAddress(initial.id, form)
        : await createAddress(form);
      onSaved(res.data);
      toast.success(initial ? 'Address updated.' : 'Address added.');
      onClose();
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const inp = (hasErr?: boolean) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#1C1C1C] focus:outline-none focus:border-[#C9A84C] transition-colors ${hasErr ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-[#1C1C1C]">{initial ? 'Edit Address' : 'Add New Address'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {(([
            { key: 'full_name', label: 'Full Name', span: true, placeholder: 'Ahmad Karimi' },
            { key: 'address_line1', label: 'Address Line 1', span: true, placeholder: '123 Street' },
            { key: 'address_line2', label: 'Address Line 2 (optional)', span: true, placeholder: 'Apt, Suite…' },
            { key: 'city', label: 'City', placeholder: 'Kabul' },
            { key: 'postal_code', label: 'Postal Code', placeholder: '00000' },
            { key: 'phone', label: 'Phone', placeholder: '+93 70 000 0000' },
          ]) as Array<{ key: 'full_name' | 'address_line1' | 'address_line2' | 'city' | 'postal_code' | 'phone'; label: string; span?: boolean; placeholder: string }>).map(({ key, label, span, placeholder }) => (
            <div key={key} className={span ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input
                type={key === 'phone' ? 'tel' : 'text'}
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className={inp(!!errors[key])}
              />
              {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Country</label>
            <select value={form.country} onChange={set('country')} className={inp(!!errors.country)}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={form.is_default}
              onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
              className="w-4 h-4 accent-[#C9A84C]"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700 select-none cursor-pointer">Set as default address</label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getAddresses();
      setAddresses(data.results);
    } catch {
      toast.error('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (addr: Address) => {
    setAddresses((prev) => {
      const existing = prev.findIndex((a) => a.id === addr.id);
      let updated = existing >= 0
        ? prev.map((a) => (a.id === addr.id ? addr : a))
        : [addr, ...prev];
      if (addr.is_default) updated = updated.map((a) => ({ ...a, is_default: a.id === addr.id }));
      return updated;
    });
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      const { data } = await setDefaultAddress(addr.id);
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === data.id })));
      toast.success('Default address updated.');
    } catch {
      toast.error('Could not update default address.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAddress(deleteTarget.id);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success('Address removed.');
    } catch {
      toast.error('Could not delete address.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Saved Addresses</h2>
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={15} /> Add Address
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <MapPin size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="font-display text-lg font-bold text-gray-300 mb-2">No saved addresses</p>
          <p className="text-sm text-gray-400 mb-6">Add your delivery addresses for faster checkout.</p>
          <button
            onClick={() => { setEditing(undefined); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={14} /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${addr.is_default ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-[#1C1C1C]">{addr.full_name}</p>
                    {addr.is_default && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                        <Check size={9} /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}
                  </p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.country} {addr.postal_code}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="text-xs text-gray-500 hover:text-[#C9A84C] px-2 py-1 rounded-lg hover:bg-[#C9A84C]/10 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => { setEditing(addr); setModalOpen(true); }}
                    className="p-1.5 text-gray-400 hover:text-[#C9A84C] transition-colors rounded-lg hover:bg-[#C9A84C]/10"
                    aria-label="Edit address"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(addr)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    aria-label="Delete address"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AddressModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Address"
        message={`Remove ${deleteTarget?.full_name}'s address in ${deleteTarget?.city}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}

// ─── Settings Section ────────────────────────────────────────────────────────

function SettingsSection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pwForm, setPwForm] = useState({ old_password: '', password: '', confirm: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handlePasswordChange = async () => {
    setPwErrors({});
    if (pwForm.password !== pwForm.confirm) {
      setPwErrors({ confirm: 'Passwords do not match.' });
      return;
    }
    if (!user) return;
    setPwLoading(true);
    try {
      await changePassword(user.id, { old_password: pwForm.old_password, password: pwForm.password });
      toast.success('Password updated. Please sign in again.');
      logout();
      navigate('/login');
    } catch (err) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length) {
        setPwErrors(fieldErrs);
      } else {
        toast.error(parseApiError(err));
      }
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Settings</h2>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-sm text-[#1C1C1C] mb-4">Change Password</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={pwForm.old_password}
                onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${
                  pwErrors.old_password ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <button type="button" onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {pwErrors.old_password && <p className="text-xs text-red-500 mt-1">{pwErrors.old_password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={pwForm.password}
                onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${
                  pwErrors.password ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {pwErrors.password && <p className="text-xs text-red-500 mt-1">{pwErrors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${
                pwErrors.confirm ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {pwErrors.confirm && <p className="text-xs text-red-500 mt-1">{pwErrors.confirm}</p>}
          </div>

          <div className="pt-1">
            <button
              onClick={handlePasswordChange}
              disabled={pwLoading}
              className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#2a2a2a] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {pwLoading && <Loader2 size={14} className="animate-spin" />}
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h3 className="font-semibold text-sm text-red-600 mb-1">Danger Zone</h3>
        <p className="text-xs text-gray-500 mb-4">Permanently delete your account and all associated data.</p>
        <button
          onClick={() => setDeleteOpen(true)}
          className="border border-red-200 text-red-500 hover:bg-red-50 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
        >
          Delete Account
        </button>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!user) return;
          try {
            await deactivateUser(user.id);
            toast.success('Account deactivated. Goodbye!');
            logout();
            navigate('/');
          } catch {
            toast.error('Could not deactivate account. Contact support.');
          }
          setDeleteOpen(false);
        }}
        title="Delete Account"
        message="Your account will be deactivated immediately. All sessions will end. Are you sure?"
        confirmLabel="Deactivate My Account"
        variant="danger"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('profile');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout
      title="My Account"
      subtitle={user?.email ?? ''}
      navItems={NAV_ITEMS}
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === 'profile'   && <ProfileSection />}
      {section === 'orders'    && <OrdersSection />}
      {section === 'wishlist'  && <WishlistSection />}
      {section === 'addresses' && <AddressesSection />}
      {section === 'settings'  && <SettingsSection />}
    </DashboardLayout>
  );
}
