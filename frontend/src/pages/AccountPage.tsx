import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User as UserIcon, Package, Heart, MapPin, Settings,
  Camera, Eye, EyeOff, ChevronRight, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUser, changePassword } from '../api/users';
import { getOrders } from '../api/orders';
import { parseApiError, parseFieldErrors } from '../utils/apiError';
import StatusBadge from '../components/StatusBadge';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmModal from '../components/ConfirmModal';
import type { Order } from '../types';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, email: user.email, phone: user.phone ?? '' });
    }
  }, [user]);

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
        <div className="w-16 h-16 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-[#C9A84C] text-xl font-bold font-display shrink-0">
          {user?.username?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-[#1C1C1C] text-sm">{user?.username}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          <button className="mt-1.5 flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#D4B96A] transition-colors">
            <Camera size={12} /> Change photo
          </button>
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');

  useEffect(() => {
    getOrders()
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
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#1C1C1C]">Order #{order.id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <StatusBadge status={order.status} showDot />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {order.items.slice(0, 3).map((item) => (
                  <span key={item.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1">
                    {item.product_name} ×{item.quantity}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="text-xs text-gray-400 bg-gray-50 rounded-lg px-2 py-1">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <p className="font-semibold text-sm text-[#1C1C1C]">
                  ${parseFloat(order.total_price).toFixed(2)}
                </p>
                <Link
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#D4B96A] font-medium transition-colors"
                >
                  View Details <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
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
        onConfirm={() => { toast.error('Contact support to delete your account.'); setDeleteOpen(false); }}
        title="Delete Account"
        message="This is permanent. All your orders, reviews, and data will be removed. Are you sure?"
        confirmLabel="Delete My Account"
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
      {section === 'wishlist'  && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Heart size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-gray-300 mb-2">Wishlist</p>
          <p className="text-sm text-gray-400">Coming soon — save your favourite pieces here.</p>
        </div>
      )}
      {section === 'addresses' && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <MapPin size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-gray-300 mb-2">Saved Addresses</p>
          <p className="text-sm text-gray-400">Coming soon — manage delivery addresses here.</p>
        </div>
      )}
      {section === 'settings'  && <SettingsSection />}
    </DashboardLayout>
  );
}
