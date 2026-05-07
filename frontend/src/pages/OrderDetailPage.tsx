import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Package, MapPin, Printer, ShoppingBag, CheckCircle2, Truck,
  Clock, XCircle, RotateCcw, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrder } from '../api/orders';
import { addToCart } from '../api/cart';
import { parseApiError } from '../utils/apiError';
import StatusBadge from '../components/StatusBadge';
import type { Order, OrderStatus } from '../types';

const PALETTES = [
  ['#8B2525', '#C9A84C', '#1C3A5E'],
  ['#2D4A22', '#C9A84C', '#8B2525'],
  ['#1C3A5E', '#C9A84C', '#F5F0E8'],
  ['#8B2525', '#1C1C1C', '#C9A84C'],
  ['#4A1942', '#C9A84C', '#E8D5A3'],
] as const;

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
}

const TIMELINE: TimelineStep[] = [
  { status: 'pending',    label: 'Order Placed',  icon: <Clock size={14} /> },
  { status: 'confirmed',  label: 'Confirmed',     icon: <CheckCircle2 size={14} /> },
  { status: 'processing', label: 'Processing',    icon: <Package size={14} /> },
  { status: 'shipped',    label: 'Shipped',       icon: <Truck size={14} /> },
  { status: 'delivered',  label: 'Delivered',     icon: <CheckCircle2 size={14} /> },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    if (!id) return;
    getOrder(Number(id))
      .then(({ data }) => setOrder(data))
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, navigate]);

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    try {
      await Promise.all(order.items.map((item) => addToCart(item.product, item.quantity)));
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch {
      toast.error('Some items could not be added to cart.');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Order not found.'}</p>
          <Link to="/orders" className="text-[#C9A84C] text-sm hover:underline">Back to orders</Link>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(order.total_price) + parseFloat(order.discount_amount);
  const discount = parseFloat(order.discount_amount);
  const total    = parseFloat(order.total_price);
  const addr     = order.shipping_address;
  const isCancelledOrRefunded = order.status === 'cancelled' || order.status === 'refunded';

  // Timeline progress
  const currentIdx = STATUS_ORDER.indexOf(order.status as OrderStatus);

  return (
    <div className="min-h-screen bg-[#F5F5F3] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-[#1C1C1C] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-[#1C1C1C]">Order #{order.id}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={order.status} showDot size="md" />
          </div>
        </div>

        {/* Status timeline */}
        {!isCancelledOrRefunded && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-[#C9A84C] transition-all duration-700"
                style={{
                  width: currentIdx >= 0
                    ? `${(currentIdx / (TIMELINE.length - 1)) * 100}%`
                    : '0%',
                }}
              />

              {TIMELINE.map((step, i) => {
                const done    = currentIdx >= i;
                const current = currentIdx === i;
                return (
                  <div key={step.status} className="relative flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                        done
                          ? 'bg-[#C9A84C] border-[#C9A84C] text-black shadow-md'
                          : 'bg-white border-gray-200 text-gray-300'
                      } ${current ? 'scale-110' : ''}`}
                    >
                      {step.icon}
                    </div>
                    <p className={`text-center text-xs leading-tight hidden sm:block ${
                      done ? 'text-[#1C1C1C] font-medium' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelledOrRefunded && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <XCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium capitalize">
              This order was {order.status}.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-[#C9A84C]" />
              <h3 className="text-sm font-semibold text-[#1C1C1C]">Shipping Address</h3>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed space-y-0.5">
              <p className="font-medium text-[#1C1C1C]">{addr.full_name}</p>
              <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
              <p>{addr.city}, {addr.country} {addr.postal_code}</p>
              <p className="text-gray-400 text-xs mt-1">{addr.phone}</p>
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={15} className="text-[#C9A84C]" />
              <h3 className="text-sm font-semibold text-[#1C1C1C]">Payment Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span className="text-[#1C1C1C]">Total</span>
                <span className="text-[#C9A84C] font-display">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="font-display text-base font-bold text-[#1C1C1C] mb-5">
            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => {
              const palette = PALETTES[item.product % PALETTES.length];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div
                    className="w-14 h-14 rounded-xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product_slug}`}
                      className="text-sm font-medium text-[#1C1C1C] hover:text-[#C9A84C] transition-colors line-clamp-2"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {item.seller_name} · Qty {item.quantity} · ${parseFloat(item.unit_price).toFixed(2)} each
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-[#1C1C1C] shrink-0">
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {reordering ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            {reordering ? 'Adding to cart…' : 'Reorder'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-700 font-medium px-6 py-3 rounded-xl text-sm transition-colors"
          >
            <Printer size={14} /> Print Invoice
          </button>
          <Link
            to="/products"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-[#C9A84C] text-gray-600 hover:text-[#C9A84C] font-medium py-3 rounded-xl text-sm transition-colors"
          >
            <ShoppingBag size={14} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
