import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag, Tag,
  CheckCircle2, XCircle, ChevronDown, Loader2, Plus, Pencil, Trash2, X,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUser, deactivateUser, activateUser } from '../api/users';
import { getAllSellers, approveSellerProfile, rejectSellerProfile } from '../api/store';
import { getProducts, approveProduct, rejectProduct } from '../api/products';
import { getOrders, updateOrderStatus } from '../api/orders';
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from '../api/promotions';
import { parseApiError, parseFieldErrors } from '../utils/apiError';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import type { User, UserRole, SellerProfile, Product, Order, PromoCode } from '../types';

const NAV_ITEMS = [
  { key: 'overview',    label: 'Overview',    icon: <LayoutDashboard size={15} /> },
  { key: 'users',       label: 'Users',       icon: <Users size={15} /> },
  { key: 'sellers',     label: 'Sellers',     icon: <Store size={15} /> },
  { key: 'products',    label: 'Products',    icon: <Package size={15} /> },
  { key: 'orders',      label: 'Orders',      icon: <ShoppingBag size={15} /> },
  { key: 'promo_codes', label: 'Promo Codes', icon: <Tag size={15} /> },
];

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
const PAGE_SIZE = 10;

function Paginator({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-[#FAFAF8]">
      <p className="text-xs text-gray-400">
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="px-3 py-1 text-xs font-medium text-[#1C1C1C]">{page} / {pages}</span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewSection({
  users, sellers, products, orders,
}: {
  users: User[];
  sellers: SellerProfile[];
  products: Product[];
  orders: Order[];
}) {
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + parseFloat(o.total_price), 0);

  const pendingSellers  = sellers.filter((s) => s.status === 'pending').length;
  const pendingProducts = products.filter((p) => !p.is_approved).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={<Users size={18} />} value={users.length} label="Total Users" />
        <StatCard icon={<Store size={18} />} value={sellers.length} label="Sellers" iconColor="#8b5cf6" />
        <StatCard icon={<Package size={18} />} value={products.length} label="Products" iconColor="#3b82f6" />
        <StatCard icon={<ShoppingBag size={18} />} value={orders.length} label="Orders" iconColor="#f59e0b" />
        <StatCard icon={<DollarSign size={18} />} value={`$${totalRevenue.toFixed(0)}`} label="Revenue" iconColor="#22c55e" />
      </div>

      {/* Pending approvals */}
      {(pendingSellers > 0 || pendingProducts > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <h3 className="font-semibold text-sm text-yellow-900 mb-3">Pending Approvals</h3>
          <div className="flex flex-wrap gap-3">
            {pendingSellers > 0 && (
              <div className="bg-white rounded-xl border border-yellow-200 px-4 py-2.5 flex items-center gap-2">
                <Store size={14} className="text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  <span className="text-lg font-bold mr-1">{pendingSellers}</span>seller{pendingSellers !== 1 ? 's' : ''} awaiting approval
                </p>
              </div>
            )}
            {pendingProducts > 0 && (
              <div className="bg-white rounded-xl border border-yellow-200 px-4 py-2.5 flex items-center gap-2">
                <Package size={14} className="text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  <span className="text-lg font-bold mr-1">{pendingProducts}</span>product{pendingProducts !== 1 ? 's' : ''} awaiting review
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-sm text-[#1C1C1C] mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold text-[#1C1C1C]">#{order.id}</p>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs font-semibold text-[#1C1C1C]">${parseFloat(order.total_price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Users Section ────────────────────────────────────────────────────────────

function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: User; newRole: UserRole } | null>(null);
  const [roleChanging, setRoleChanging] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getUsers()
      .then(({ data }) => setUsers(data.results))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = userSearch.toLowerCase();
    const matchesSearch = !q || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [roleFilter, userSearch]);

  const toggleActive = async (user: User) => {
    setUpdatingId(user.id);
    try {
      const fn = user.is_active ? deactivateUser : activateUser;
      const { data } = await fn(user.id);
      setUsers((prev) => prev.map((u) => u.id === user.id ? data : u));
      toast.success(`User ${data.is_active ? 'activated' : 'suspended'}.`);
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = (user: User, newRole: UserRole) => {
    if (newRole === user.role) return;
    setRoleChangeTarget({ user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    setRoleChanging(true);
    try {
      const { data } = await updateUser(roleChangeTarget.user.id, { role: roleChangeTarget.newRole });
      setUsers((prev) => prev.map((u) => u.id === roleChangeTarget.user.id ? data : u));
      toast.success(`${roleChangeTarget.user.username} is now a ${roleChangeTarget.newRole}.`);
      setRoleChangeTarget(null);
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setRoleChanging(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Users</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by email or username…"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C9A84C] w-52"
          />
          {(['all', 'customer', 'seller', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                roleFilter === r ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#1C1C1C]">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          className={`appearance-none text-xs font-medium px-2.5 py-1 pr-6 rounded-full border focus:outline-none focus:ring-1 focus:ring-[#C9A84C] cursor-pointer capitalize ${
                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            user.role === 'seller' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          <option value="customer">customer</option>
                          <option value="seller">seller</option>
                          <option value="admin">admin</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={user.is_active ? 'active' : 'inactive'} size="sm" showDot />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={updatingId === user.id || user.role === 'admin'}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                          user.is_active
                            ? 'border border-red-200 text-red-500 hover:bg-red-50'
                            : 'border border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {updatingId === user.id ? (
                          <Loader2 size={12} className="animate-spin inline" />
                        ) : user.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={page} total={filtered.length} onChange={setPage} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        onConfirm={confirmRoleChange}
        loading={roleChanging}
        title={roleChangeTarget?.newRole === 'admin' ? 'Promote to Admin?' : 'Change User Role'}
        message={
          roleChangeTarget?.newRole === 'admin'
            ? `This will give ${roleChangeTarget.user.username} full admin access to the platform, including user management, product approval, and promo codes. Are you sure?`
            : `Change ${roleChangeTarget?.user.username}'s role from ${roleChangeTarget?.user.role} to ${roleChangeTarget?.newRole}?`
        }
        confirmLabel={roleChangeTarget?.newRole === 'admin' ? 'Yes, make admin' : 'Change role'}
        variant={roleChangeTarget?.newRole === 'admin' ? 'danger' : undefined}
      />
    </div>
  );
}

// ─── Sellers Section ──────────────────────────────────────────────────────────

function SellersSection() {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getAllSellers()
      .then(({ data }) => setSellers(data.results))
      .catch(() => toast.error('Failed to load sellers.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all'
    ? sellers
    : sellers.filter((s) => s.status === statusFilter);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [statusFilter]);

  const handleApprove = async (id: number) => {
    setUpdatingId(id);
    try {
      await approveSellerProfile(id);
      setSellers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'approved' } : s));
      toast.success('Seller approved!');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setUpdatingId(id);
    try {
      await rejectSellerProfile(id);
      setSellers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'suspended' } : s));
      toast.success('Seller suspended.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Sellers</h2>
        <div className="flex gap-1.5">
          {(['all', 'pending', 'approved', 'suspended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Store size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No {statusFilter !== 'all' ? statusFilter : ''} sellers found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Store</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((seller) => (
                  <tr key={seller.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#1C1C1C]">{seller.user_username}</p>
                      <p className="text-xs text-gray-400">{seller.user_email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-sm text-gray-700">{seller.store_name || '—'}</p>
                      {seller.location && <p className="text-xs text-gray-400">{seller.location}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={seller.status} size="sm" showDot />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {seller.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(seller.id)}
                            disabled={updatingId === seller.id}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updatingId === seller.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(seller.id)}
                            disabled={updatingId === seller.id}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle size={11} /> Reject
                          </button>
                        </div>
                      )}
                      {seller.status === 'approved' && (
                        <button
                          onClick={() => handleReject(seller.id)}
                          disabled={updatingId === seller.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {updatingId === seller.id ? <Loader2 size={11} className="animate-spin inline" /> : 'Suspend'}
                        </button>
                      )}
                      {seller.status === 'suspended' && (
                        <button
                          onClick={() => handleApprove(seller.id)}
                          disabled={updatingId === seller.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          {updatingId === seller.id ? <Loader2 size={11} className="animate-spin inline" /> : 'Reinstate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={page} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

function AdminProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getProducts()
      .then(({ data }) => setProducts(data.results))
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = approvalFilter === 'all'
    ? products
    : approvalFilter === 'pending'
    ? products.filter((p) => !p.is_approved)
    : products.filter((p) => p.is_approved);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [approvalFilter]);

  const handleApprove = async (slug: string) => {
    setUpdatingSlug(slug);
    try {
      await approveProduct(slug);
      setProducts((prev) => prev.map((p) => p.slug === slug ? { ...p, is_approved: true, rejection_reason: '' } : p));
      toast.success('Product approved!');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingSlug(null);
    }
  };

  const openRejectModal = (product: Product) => {
    setRejectTarget(product);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await rejectProduct(rejectTarget.slug, { reason: rejectReason });
      setProducts((prev) => prev.map((p) =>
        p.slug === rejectTarget.slug ? { ...p, is_approved: false, rejection_reason: rejectReason } : p
      ));
      toast.success('Product rejected.');
      setRejectTarget(null);
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Products</h2>
        <div className="flex gap-1.5">
          {[
            { key: 'all',      label: 'All' },
            { key: 'pending',  label: 'Pending Review' },
            { key: 'approved', label: 'Approved' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setApprovalFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                approvalFilter === key ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Seller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#1C1C1C] line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category_name}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-xs text-gray-600">{product.seller_name}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell font-medium text-[#1C1C1C]">
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={product.is_approved ? 'approved' : 'unapproved'} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!product.is_approved ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(product.slug)}
                            disabled={updatingSlug === product.slug}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updatingSlug === product.slug ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(product)}
                            disabled={updatingSlug === product.slug}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle size={11} /> Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openRejectModal(product)}
                          disabled={updatingSlug === product.slug}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {updatingSlug === product.slug ? <Loader2 size={11} className="animate-spin inline" /> : 'Revoke'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={page} total={filtered.length} onChange={setPage} />
        </div>
      )}

      {/* Reject / Revoke reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-bold text-[#1C1C1C]">
                {rejectTarget.is_approved ? 'Revoke Approval' : 'Reject Product'}
              </h3>
              <button onClick={() => setRejectTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              <span className="font-medium">{rejectTarget.name}</span>
              {' '}by {rejectTarget.seller_name}
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Reason <span className="text-gray-400 font-normal normal-case">(optional — shown to seller)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Images are too low quality, please upload clearer photos."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 transition-colors resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRejectTarget(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejecting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {rejecting && <Loader2 size={14} className="animate-spin" />}
                {rejectTarget.is_approved ? 'Revoke' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function AdminOrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getOrders()
      .then(({ data }) => setOrders(data.results))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [statusFilter]);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as Order['status'] } : o));
      toast.success('Order status updated.');
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const itemSummary = (order: Order) => {
    const first = order.items[0]?.product_name ?? '—';
    return order.items.length > 1 ? `${first} +${order.items.length - 1}` : first;
  };

  const sellerNames = (order: Order) =>
    [...new Set(order.items.map((i) => i.seller_name))].join(', ') || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Orders</h2>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Sellers</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Update</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#1C1C1C]">{order.customer_username ?? `User #${order.customer}`}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-gray-700 line-clamp-1">{itemSummary(order)}</p>
                      <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-gray-600 line-clamp-1">{sellerNames(order)}</p>
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
          <Paginator page={page} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

// ─── Promo Codes Section ──────────────────────────────────────────────────────

interface PromoFormData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  minimum_order: string;
  max_uses: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const EMPTY_PROMO: PromoFormData = {
  code: '', discount_type: 'percentage', discount_value: '',
  minimum_order: '0', max_uses: '', valid_from: '', valid_until: '', is_active: true,
};

function PromoModal({
  mode,
  initial,
  onClose,
  onSuccess,
}: {
  mode: 'add' | 'edit';
  initial?: PromoCode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<PromoFormData>(
    initial
      ? {
          code: initial.code,
          discount_type: initial.discount_type,
          discount_value: initial.discount_value,
          minimum_order: initial.minimum_order,
          max_uses: initial.max_uses?.toString() ?? '',
          valid_from: initial.valid_from ? initial.valid_from.slice(0, 16) : '',
          valid_until: initial.valid_until ? initial.valid_until.slice(0, 16) : '',
          is_active: initial.is_active,
        }
      : EMPTY_PROMO
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setErrors({});
    if (!form.code.trim()) { setErrors({ code: 'Code is required.' }); return; }
    if (!form.discount_value) { setErrors({ discount_value: 'Discount value is required.' }); return; }
    if (!form.valid_from) { setErrors({ valid_from: 'Start date is required.' }); return; }
    setLoading(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        minimum_order: form.minimum_order || '0',
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_from: form.valid_from,
        valid_until: form.valid_until || null,
        is_active: form.is_active,
      } as Omit<PromoCode, 'id' | 'uses_count'>;

      if (mode === 'add') {
        await createPromoCode(payload);
        toast.success('Promo code created!');
      } else if (initial) {
        await updatePromoCode(initial.id, payload);
        toast.success('Promo code updated!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const fieldErrs = parseFieldErrors(err);
      if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold text-[#1C1C1C]">
            {mode === 'add' ? 'Create Promo Code' : 'Edit Promo Code'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Code *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#C9A84C] transition-colors uppercase ${errors.code ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="SUMMER20"
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Value *</label>
              <input
                type="number" min="0" step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${errors.discount_value ? 'border-red-400' : 'border-gray-200'}`}
                placeholder={form.discount_type === 'percentage' ? '10' : '20.00'}
              />
              {errors.discount_value && <p className="text-xs text-red-500 mt-1">{errors.discount_value}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Min Order ($)</label>
              <input
                type="number" min="0"
                value={form.minimum_order}
                onChange={(e) => setForm({ ...form, minimum_order: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Max Uses</label>
              <input
                type="number" min="0"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valid From *</label>
              <input
                type="datetime-local"
                value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] ${errors.valid_from ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.valid_from && <p className="text-xs text-red-500 mt-1">{errors.valid_from}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valid Until</label>
              <input
                type="datetime-local"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? 'bg-[#C9A84C]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'add' ? 'Create Code' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoCodesSection() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editCode, setEditCode] = useState<PromoCode | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getPromoCodes()
      .then(({ data }) => setCodes(data.results))
      .catch(() => toast.error('Failed to load promo codes.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromoCode(deleteTarget.id);
      toast.success('Promo code deleted.');
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
        <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Promo Codes</h2>
        <button
          onClick={() => { setEditCode(undefined); setModalMode('add'); }}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={14} /> Create Code
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#C9A84C]" /></div>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Tag size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-4">No promo codes yet.</p>
          <button
            onClick={() => { setEditCode(undefined); setModalMode('add'); }}
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={13} /> Create First Code
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAF8]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Discount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Uses</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-[#1C1C1C] bg-gray-50 px-2 py-0.5 rounded-lg">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-700">
                      {code.discount_type === 'percentage'
                        ? `${code.discount_value}% off`
                        : `$${parseFloat(code.discount_value).toFixed(2)} off`}
                      {parseFloat(code.minimum_order) > 0 && (
                        <span className="text-xs text-gray-400 ml-1">(min ${code.minimum_order})</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-gray-500">
                      {code.uses_count}{code.max_uses ? ` / ${code.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={code.is_active ? 'active' : 'inactive'} size="sm" showDot />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditCode(code); setModalMode('edit'); }}
                          className="p-1.5 text-gray-400 hover:text-[#C9A84C] transition-colors rounded-lg hover:bg-[#C9A84C]/10"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(code)}
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
        <PromoModal
          mode={modalMode}
          initial={editCode}
          onClose={() => setModalMode(null)}
          onSuccess={load}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Promo Code"
        message={`Delete "${deleteTarget?.code}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');

  const [users, setUsers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    if (user && user.role !== 'admin') { navigate('/', { replace: true }); return; }
    Promise.all([
      getUsers(), getAllSellers(), getProducts(), getOrders(),
    ]).then(([u, s, p, o]) => {
      setUsers(u.data.results);
      setSellers(s.data.results);
      setProducts(p.data.results);
      setOrders(o.data.results);
    }).catch(() => {});
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout
      title="Admin Panel"
      subtitle="Golden Knot"
      navItems={NAV_ITEMS}
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === 'overview'    && <OverviewSection users={users} sellers={sellers} products={products} orders={orders} />}
      {section === 'users'       && <UsersSection />}
      {section === 'sellers'     && <SellersSection />}
      {section === 'products'    && <AdminProductsSection />}
      {section === 'orders'      && <AdminOrdersSection />}
      {section === 'promo_codes' && <PromoCodesSection />}
    </DashboardLayout>
  );
}
