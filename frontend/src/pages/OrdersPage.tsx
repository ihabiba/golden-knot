import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../api/orders';
import StatusBadge from '../components/StatusBadge';
import type { Order } from '../types';

const TABS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const PALETTES = [
  ['#8B2525', '#C9A84C', '#1C3A5E'],
  ['#2D4A22', '#C9A84C', '#8B2525'],
  ['#1C3A5E', '#C9A84C', '#F5F0E8'],
  ['#8B2525', '#1C1C1C', '#C9A84C'],
] as const;

function itemSummary(items: Order['items']) {
  const names = items.map((i) => i.product_name);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} +${names.length - 1} more`;
}

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    // Sellers using "My Orders" always see orders they placed as buyers
    const params = user?.role === 'seller' ? { as_customer: 'true' } : {};
    getOrders(params)
      .then(({ data }) => setOrders(data.results))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, user?.role]);

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[#1C1C1C]">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 flex-wrap mb-6 bg-white border border-gray-100 rounded-2xl p-1.5">
          {TABS.map((tab) => {
            const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#1C1C1C] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#1C1C1C] hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#C9A84C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="font-display text-lg font-bold text-gray-300 mb-1">No orders yet</p>
            <p className="text-sm text-gray-400 mb-6">
              {activeTab !== 'all'
                ? `No ${activeTab} orders found.`
                : 'Your orders will appear here once you start shopping.'}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <ShoppingBag size={14} /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const palette = PALETTES[order.items[0]?.product % PALETTES.length];
              const primaryItem = order.items[0];
              const sellers = [...new Set(order.items.map((i) => i.seller_name))].join(', ');
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Primary item thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                      {primaryItem?.product_image ? (
                        <img src={primaryItem.product_image} alt={primaryItem.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${palette?.[0]} 0%, ${palette?.[1]} 55%, ${palette?.[2]} 100%)` }} />
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-[#1C1C1C] leading-snug line-clamp-2">
                            {itemSummary(order.items)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {sellers} · {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <StatusBadge status={order.status} showDot size="sm" />
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <p className="font-display font-bold text-[#1C1C1C]">
                          ${parseFloat(order.total_price).toFixed(2)}
                          {parseFloat(order.discount_amount) > 0 && (
                            <span className="ml-2 text-xs text-green-600 font-normal">
                              −${parseFloat(order.discount_amount).toFixed(2)}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-300">ref #{order.id}</span>
                          <span className="text-xs text-[#C9A84C] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            View <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
