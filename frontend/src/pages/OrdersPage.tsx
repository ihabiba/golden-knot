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

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    getOrders()
      .then(({ data }) => setOrders(data.results))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

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
            {filtered.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                {/* Order header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-[#1C1C1C]">Order #{order.id}</p>
                      <StatusBadge status={order.status} showDot size="sm" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#C9A84C] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ChevronRight size={12} />
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 4).map((item, i) => {
                      const palette = PALETTES[item.product % PALETTES.length];
                      return (
                        <div
                          key={item.id}
                          className="w-9 h-9 rounded-lg border-2 border-white"
                          style={{
                            background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
                            zIndex: 4 - i,
                          }}
                        />
                      );
                    })}
                    {order.items.length > 4 && (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500 font-medium z-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <p className="font-display font-bold text-[#1C1C1C]">
                    ${parseFloat(order.total_price).toFixed(2)}
                  </p>
                  {parseFloat(order.discount_amount) > 0 && (
                    <p className="text-xs text-green-600">
                      Saved ${parseFloat(order.discount_amount).toFixed(2)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
