import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Package, MapPin, Printer } from 'lucide-react';
import type { Order } from '../types';
import { getOrder } from '../api/orders';
import { parseApiError } from '../utils/apiError';

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

function estimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(Number(orderId))
      .then((res) => setOrder(res.data))
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-6" />
          <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-3" />
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Order not found.'}</p>
          <Link to="/products" className="text-[#C9A84C] underline text-sm">Back to shopping</Link>
        </div>
      </div>
    );
  }

  const subtotal  = parseFloat(order.total_price) + parseFloat(order.discount_amount);
  const discount  = parseFloat(order.discount_amount);
  const total     = parseFloat(order.total_price);
  const addr      = order.shipping_address;

  return (
    <div className="min-h-screen bg-[#FAFAF8] print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Success hero ──────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="animate-success-pop w-24 h-24 rounded-full bg-[#C9A84C] flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle2 size={44} className="text-black" strokeWidth={2.5} />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-2">
            Thank you for your order!
          </h1>
          <p className="text-gray-500 text-base">
            Your order has been placed and is being processed.
          </p>

          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2 mt-4">
            <span className="text-xs text-gray-500">Order</span>
            <span className="font-semibold text-[#1C1C1C] text-sm">#{order.id}</span>
          </div>
        </div>

        {/* ── Order details grid ────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">

          {/* Delivery estimate */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-[#C9A84C]" />
              <h3 className="text-sm font-semibold text-[#1C1C1C]">Estimated Delivery</h3>
            </div>
            <p className="font-display text-lg font-bold text-[#1C1C1C]">{estimatedDelivery()}</p>
            <p className="text-xs text-gray-400 mt-1">Standard international shipping</p>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-[#C9A84C]" />
              <h3 className="text-sm font-semibold text-[#1C1C1C]">Shipping To</h3>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="font-medium text-[#1C1C1C]">{addr.full_name}</p>
              <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
              <p>{addr.city}, {addr.country} {addr.postal_code}</p>
            </div>
          </div>
        </div>

        {/* ── Items ordered ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-[#1C1C1C] mb-5">Items Ordered</h2>

          <div className="space-y-4">
            {order.items.map((item) => {
              const palette = PALETTES[item.product % PALETTES.length];
              return (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div
                    className="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product_slug}`}
                      className="font-medium text-sm text-[#1C1C1C] hover:text-[#C9A84C] transition-colors line-clamp-2"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.seller_name} · Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-[#1C1C1C]">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      ${parseFloat(item.unit_price).toFixed(2)} each
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 mt-5 pt-5 space-y-2.5 text-sm">
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
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span className="text-[#1C1C1C]">Total Paid</span>
              <span className="text-[#C9A84C] font-display text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── CTAs ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <Link
            to={`/orders`}
            className="flex-1 flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-3.5 rounded-xl text-sm transition-colors"
          >
            <Package size={15} />
            View My Orders
          </Link>
          <Link
            to="/products"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-[#C9A84C] text-[#1C1C1C] hover:text-[#C9A84C] font-semibold py-3.5 rounded-xl text-sm transition-colors"
          >
            <ShoppingBag size={15} />
            Continue Shopping
          </Link>
          <button
            onClick={() => window.print()}
            className="sm:w-auto flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-700 font-medium px-5 py-3.5 rounded-xl text-sm transition-colors"
          >
            <Printer size={15} />
            Print
          </button>
        </div>

        {/* ── What's next ───────────────────────────────────────────────── */}
        <div className="mt-8 bg-[#0A0A0A] rounded-xl p-6 print:hidden">
          <h3 className="text-[#C9A84C] text-sm font-semibold uppercase tracking-wider mb-3">What happens next?</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Your artisan will be notified and begin preparing your order.</p>
            <p>• You'll receive shipping updates once your item is dispatched.</p>
            <p>• Estimated delivery: {estimatedDelivery()}.</p>
            <p>• Questions? Contact us at <span className="text-[#C9A84C]">hello@goldenknot.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
