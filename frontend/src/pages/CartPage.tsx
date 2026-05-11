import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight,
  Tag, CheckCircle2, AlertCircle, Loader2, X,
} from 'lucide-react';
import type { Cart, PromoValidation } from '../types';
import { getCart, updateCartItem, removeCartItem } from '../api/cart';
import { validatePromoCode } from '../api/promotions';
import { parseApiError } from '../utils/apiError';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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

function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-5 flex gap-4 border border-gray-100">
          <div className="w-5 h-5 bg-gray-200 rounded mt-1" />
          <div className="w-20 h-20 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-3/5" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
            <div className="h-5 w-16 bg-gray-200 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <ShoppingBag size={36} className="text-gray-300" />
      </div>
      <h2 className="font-display text-2xl font-bold text-[#1C1C1C] mb-2">Your cart is empty</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        Looks like you haven't added anything yet. Explore our collection of handcrafted textiles.
      </p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-7 py-3 rounded-lg text-sm transition-colors"
      >
        Continue Shopping
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { setItemCount } = useCart();

  const [cart, setCart]       = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Per-item loading
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Promo code
  const [promoInput, setPromoInput]     = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoValidation | null>(null);
  const [promoError, setPromoError]     = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const syncCart = useCallback((updatedCart: Cart) => {
    setCart(updatedCart);
    setItemCount(updatedCart.item_count);
    // Keep selection in sync — remove any IDs that no longer exist
    setSelectedIds((prev) => {
      const validIds = new Set(updatedCart.items.map((i) => i.id));
      return new Set([...prev].filter((id) => validIds.has(id)));
    });
  }, [setItemCount]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true);
    getCart()
      .then((res) => {
        syncCart(res.data);
        // Select all items by default on first load
        setSelectedIds(new Set(res.data.items.map((i) => i.id)));
      })
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, syncCart]);

  // ── Selection helpers ────────────────────────────────────────────────────────

  const allSelected  = cart ? cart.items.length > 0 && selectedIds.size === cart.items.length : false;
  const noneSelected = selectedIds.size === 0;
  const someSelected = !allSelected && !noneSelected;

  const toggleSelectAll = () => {
    if (!cart) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cart.items.map((i) => i.id)));
    }
  };

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Cart actions ─────────────────────────────────────────────────────────────

  const handleQtyChange = async (itemId: number, newQty: number) => {
    if (!cart || updatingId === itemId) return;
    setUpdatingId(itemId);
    try {
      const res = await updateCartItem(itemId, newQty);
      syncCart(res.data);
      if (appliedPromo) {
        const newSelected = res.data.items.filter((i) => selectedIds.has(i.id));
        const newSubtotal = newSelected.reduce((s, i) => s + parseFloat(i.subtotal), 0).toFixed(2);
        const check = await validatePromoCode(appliedPromo.code, newSubtotal).catch(() => null);
        if (!check) setAppliedPromo(null);
        else setAppliedPromo(check.data);
      }
    } catch {
      // silent fail
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    if (!cart) return;
    setRemovingId(itemId);
    try {
      const res = await removeCartItem(itemId);
      syncCart(res.data);
    } catch {
      // silent fail
    } finally {
      setRemovingId(null);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !cart) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const res = await validatePromoCode(promoInput.trim(), selectedSubtotal.toFixed(2));
      setAppliedPromo(res.data);
      setPromoInput('');
    } catch (err) {
      setPromoError(parseApiError(err));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleProceedToCheckout = () => {
    if (!cart || noneSelected) return;
    setCheckoutLoading(true);
    navigate('/checkout', {
      state: {
        appliedPromo,
        discountAmount: appliedPromo?.discount_amount ?? '0.00',
        selectedItemIds: [...selectedIds],
      },
    });
  };

  // ── Derived values ───────────────────────────────────────────────────────────

  const selectedItems   = cart?.items.filter((i) => selectedIds.has(i.id)) ?? [];
  const selectedSubtotal = selectedItems.reduce((s, i) => s + parseFloat(i.subtotal), 0);
  const discount         = parseFloat(appliedPromo?.discount_amount ?? '0');
  const orderTotal       = Math.max(selectedSubtotal - discount, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* Header */}
      <div className="bg-[#0A0A0A] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-gray-500 mb-3 flex items-center gap-2">
            <Link to="/" className="hover:text-[#C9A84C] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#C9A84C]">Cart</span>
          </nav>
          <h1 className="font-display text-white text-3xl font-bold">
            Your Cart{' '}
            {!loading && cart && (
              <span className="text-[#C9A84C] text-2xl">
                ({cart.item_count} {cart.item_count === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading && <CartSkeleton />}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && cart && cart.items.length === 0 && <EmptyCart />}

        {!loading && !error && cart && cart.items.length > 0 && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">

            {/* ── Cart items ──────────────────────────────────────────────── */}
            <div>

              {/* Select all row */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2.5 group"
                  aria-label="Select all items"
                >
                  <span
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      allSelected
                        ? 'bg-[#C9A84C] border-[#C9A84C]'
                        : someSelected
                        ? 'bg-[#C9A84C]/30 border-[#C9A84C]'
                        : 'border-gray-300 group-hover:border-[#C9A84C]'
                    }`}
                  >
                    {(allSelected || someSelected) && (
                      <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                        {allSelected
                          ? <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          : <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        }
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-gray-600 group-hover:text-[#1C1C1C] transition-colors select-none">
                    {allSelected ? 'Deselect all' : 'Select all'}
                    {' '}
                    <span className="text-gray-400">({cart.items.length} items)</span>
                  </span>
                </button>

                {!allSelected && !noneSelected && (
                  <span className="text-xs text-[#C9A84C] ml-auto">
                    {selectedIds.size} of {cart.items.length} selected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {cart.items.map((item) => {
                  const palette    = PALETTES[item.product % PALETTES.length];
                  const isUpdating = updatingId === item.id;
                  const isRemoving = removingId === item.id;
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl border p-4 sm:p-5 flex gap-4 transition-all duration-200 ${
                        isRemoving ? 'opacity-40' : ''
                      } ${isSelected ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="mt-1 shrink-0"
                        aria-label={isSelected ? 'Deselect item' : 'Select item'}
                      >
                        <span
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#C9A84C] border-[#C9A84C]'
                              : 'border-gray-300 hover:border-[#C9A84C]'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </button>

                      {/* Image */}
                      <Link
                        to={`/products/${item.product_slug}`}
                        className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden group"
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 45%, ${palette[2]} 100%)` }}
                          />
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-0.5">{item.seller_name}</p>
                        <Link
                          to={`/products/${item.product_slug}`}
                          className="font-display text-sm sm:text-base font-medium text-[#1C1C1C] hover:text-[#C9A84C] transition-colors line-clamp-2"
                        >
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          ${parseFloat(item.product_price).toLocaleString()} each
                        </p>

                        {/* Mobile qty + remove */}
                        <div className="flex items-center gap-3 mt-3 sm:hidden">
                          <QtySelector
                            quantity={item.quantity}
                            maxQty={item.product_stock}
                            loading={isUpdating}
                            onDecrease={() => handleQtyChange(item.id, item.quantity - 1)}
                            onIncrease={() => handleQtyChange(item.id, item.quantity + 1)}
                          />
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="ml-auto p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Desktop: qty + subtotal + remove */}
                      <div className="hidden sm:flex items-start gap-4 shrink-0">
                        <QtySelector
                          quantity={item.quantity}
                          maxQty={item.product_stock}
                          loading={isUpdating}
                          onDecrease={() => handleQtyChange(item.id, item.quantity - 1)}
                          onIncrease={() => handleQtyChange(item.id, item.quantity + 1)}
                        />
                        <div className="text-right min-w-[80px]">
                          <p className={`font-semibold ${isSelected ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                            ${parseFloat(item.subtotal).toLocaleString()}
                          </p>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 mt-6 text-sm text-gray-500 hover:text-[#C9A84C] transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                Continue Shopping
              </Link>
            </div>

            {/* ── Order summary (sticky) ───────────────────────────────────── */}
            <div>
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="font-display text-lg font-bold text-[#1C1C1C] mb-1">Order Summary</h2>
                {!allSelected && !noneSelected && (
                  <p className="text-xs text-[#C9A84C] mb-4">
                    {selectedIds.size} of {cart.items.length} items selected
                  </p>
                )}
                {allSelected && <div className="mb-4" />}

                {/* Line items */}
                <div className="space-y-3 text-sm pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Subtotal{' '}
                      <span className="text-gray-400">
                        ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'})
                      </span>
                    </span>
                    <span className="font-medium text-[#1C1C1C]">${selectedSubtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1.5">
                        <Tag size={12} />
                        {appliedPromo.code}
                      </span>
                      <span>−${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 mb-6">
                  <span className="font-semibold text-[#1C1C1C]">Total</span>
                  <span className="font-display text-2xl font-bold text-[#C9A84C]">
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>

                {/* Promo code */}
                <div className="mb-5">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">{appliedPromo.code}</span>
                        <span className="text-xs text-green-600">−${discount.toFixed(2)}</span>
                      </div>
                      <button onClick={handleRemovePromo} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                            placeholder="Promo code"
                            className="w-full bg-[#FAFAF8] border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] transition-colors"
                          />
                        </div>
                        <button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoInput.trim() || noneSelected}
                          className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-black disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                        >
                          {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-red-500 text-xs flex items-center gap-1 mt-1.5">
                          <AlertCircle size={11} /> {promoError}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Nothing selected warning */}
                {noneSelected && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-center">
                    Select at least one item to checkout
                  </p>
                )}

                {/* Checkout button */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={checkoutLoading || noneSelected}
                  className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-md hover:shadow-lg"
                >
                  {checkoutLoading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  {allSelected
                    ? 'Checkout All Items'
                    : noneSelected
                    ? 'Select Items to Checkout'
                    : `Checkout ${selectedIds.size} ${selectedIds.size === 1 ? 'Item' : 'Items'}`}
                </button>

                <p className="text-center text-[10px] text-gray-400 mt-4">
                  🔒 Cash on delivery · Secure checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface QtySelectorProps {
  quantity: number;
  maxQty: number;
  loading: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

function QtySelector({ quantity, maxQty, loading, onDecrease, onIncrease }: QtySelectorProps) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onDecrease}
        disabled={loading || quantity <= 1}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Minus size={13} />}
      </button>
      <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-[#1C1C1C] border-x border-gray-200">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={loading || quantity >= maxQty}
        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
