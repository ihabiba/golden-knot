import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight, Check, Edit2, Loader2, AlertCircle,
  MapPin, CreditCard, Package, Plus,
} from 'lucide-react';
import type { Cart, ShippingAddress, PromoValidation, Address } from '../types';
import { getCart } from '../api/cart';
import { createOrderFromCart } from '../api/orders';
import { getAddresses } from '../api/addresses';
import { parseApiError } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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

const COUNTRIES = [
  'Afghanistan', 'Australia', 'Canada', 'China', 'France', 'Germany',
  'India', 'Italy', 'Japan', 'Malaysia', 'Netherlands', 'New Zealand',
  'Norway', 'Pakistan', 'Saudi Arabia', 'Singapore', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'UAE', 'United Kingdom', 'United States',
  'Other',
];

const EMPTY_ADDRESS: ShippingAddress = {
  full_name: '', address_line1: '', address_line2: '',
  city: '', country: '', postal_code: '', phone: '',
};

type Step = 1 | 2 | 3;

interface LocationState {
  appliedPromo?: PromoValidation | null;
  discountAmount?: string;
}

// ─── Progress indicator ───────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: 'Shipping Info', icon: MapPin },
    { n: 2 as Step, label: 'Review',   icon: Package },
    { n: 3 as Step, label: 'Payment',  icon: CreditCard },
  ];

  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map(({ n, label, icon: Icon }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                n < current
                  ? 'bg-green-600 text-white'
                  : n === current
                  ? 'bg-[#C9A84C] text-black shadow-md'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {n < current ? <Check size={16} /> : <Icon size={16} />}
            </div>
            <span
              className={`text-xs font-medium mt-1.5 ${
                n === current ? 'text-[#C9A84C]' : n < current ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-px mx-2 mb-5 transition-colors duration-300 ${
                n < current ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({
  cart,
  discount,
  promoCode,
}: {
  cart: Cart;
  discount: number;
  promoCode?: PromoValidation | null;
}) {
  const subtotal   = parseFloat(cart.total);
  const total      = Math.max(subtotal - discount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
      <h3 className="font-display text-base font-bold text-[#1C1C1C] mb-4">Order Summary</h3>

      <div className="space-y-3 max-h-56 overflow-y-auto mb-4">
        {cart.items.map((item) => {
          const palette = PALETTES[item.product % PALETTES.length];
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className="w-12 h-12 rounded-lg overflow-hidden"
                  style={
                    item.product_image
                      ? undefined
                      : { background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)` }
                  }
                >
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C9A84C] text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#1C1C1C] font-medium truncate">{item.product_name}</p>
                <p className="text-[10px] text-gray-400">{item.seller_name}</p>
              </div>
              <span className="text-xs font-semibold text-[#1C1C1C] shrink-0">
                ${parseFloat(item.subtotal).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && promoCode && (
          <div className="flex justify-between text-green-600">
            <span>{promoCode.code}</span>
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
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label, required = false, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full bg-[#FAFAF8] border rounded-lg px-4 py-2.5 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none transition-colors ${
    hasError
      ? 'border-red-300 focus:border-red-400'
      : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10'
  }`;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isAuthenticated } = useAuth();
  const { setItemCount } = useCart();

  const state = location.state as LocationState | null;
  const appliedPromo    = state?.appliedPromo ?? null;
  const discountAmount  = parseFloat(state?.discountAmount ?? '0');

  const [step, setStep]         = useState<Step>(1);
  const [cart, setCart]         = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [address, setAddress]   = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError]     = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    getCart()
      .then((res) => {
        if (res.data.items.length === 0) {
          navigate('/cart');
        } else {
          setCart(res.data);
        }
      })
      .catch(() => navigate('/cart'))
      .finally(() => setCartLoading(false));

    getAddresses().then(({ data }) => {
      setSavedAddresses(data.results);
      const def = data.results.find((a) => a.is_default) ?? data.results[0];
      if (def) {
        setSelectedSavedId(def.id);
        setAddress({
          full_name: def.full_name,
          address_line1: def.address_line1,
          address_line2: def.address_line2 ?? '',
          city: def.city,
          country: def.country,
          postal_code: def.postal_code,
          phone: def.phone,
        });
      } else {
        setShowNewForm(true);
      }
    }).catch(() => setShowNewForm(true));
  }, [isAuthenticated, navigate]);

  const selectSavedAddress = (addr: Address) => {
    setSelectedSavedId(addr.id);
    setAddress({
      full_name: addr.full_name,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? '',
      city: addr.city,
      country: addr.country,
      postal_code: addr.postal_code,
      phone: addr.phone,
    });
    setShowNewForm(false);
    setFieldErrors({});
  };

  const setField = (key: keyof ShippingAddress) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setAddress((prev) => ({ ...prev, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateStep1 = (): boolean => {
    const required: (keyof ShippingAddress)[] = [
      'full_name', 'address_line1', 'city', 'country', 'postal_code', 'phone',
    ];
    const errors: Partial<Record<keyof ShippingAddress, string>> = {};
    required.forEach((k) => {
      if (!address[k].trim()) errors[k] = 'This field is required.';
    });
    // Phone must contain at least 7 digits
    if (address.phone.trim()) {
      const digits = address.phone.replace(/\D/g, '');
      if (digits.length < 7) errors.phone = 'Enter a valid phone number.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!cart) return;
    setPlaceError('');
    setPlaceLoading(true);
    try {
      const res = await createOrderFromCart({
        shipping_address: address,
        promo_code: appliedPromo?.id ?? null,
        discount_amount: appliedPromo?.discount_amount ?? '0.00',
      });
      setItemCount(0);
      window.dispatchEvent(new CustomEvent('goldenknotOrderPlaced'));
      navigate(`/orders/${res.data.id}/confirmation`);
    } catch (err) {
      setPlaceError(parseApiError(err));
      setStep(2); // go back to review on error
    } finally {
      setPlaceLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!cart) return null;

  const subtotal = parseFloat(cart.total);
  const total    = Math.max(subtotal - discountAmount, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* Header */}
      <div className="bg-[#0A0A0A] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-gray-500 mb-3 flex items-center gap-2">
            <Link to="/" className="hover:text-[#C9A84C] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/cart" className="hover:text-[#C9A84C] transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-[#C9A84C]">Checkout</span>
          </nav>
          <h1 className="font-display text-white text-3xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StepIndicator current={step} />

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">

          {/* ── Left: Step content ──────────────────────────────────────── */}
          <div>

            {/* ── Step 1: Shipping ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="animate-step-in bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-black text-sm font-bold flex items-center justify-center">1</div>
                  <h2 className="font-display text-xl font-bold text-[#1C1C1C]">Shipping Address</h2>
                </div>

                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your saved addresses</p>
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => selectSavedAddress(addr)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedSavedId === addr.id && !showNewForm
                              ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-[#1C1C1C]">{addr.full_name}</p>
                                {addr.is_default && (
                                  <span className="text-[10px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded-full">Default</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {addr.address_line1}, {addr.city}, {addr.country}
                              </p>
                              <p className="text-xs text-gray-400">{addr.phone}</p>
                            </div>
                            {selectedSavedId === addr.id && !showNewForm && (
                              <Check size={16} className="text-[#C9A84C] shrink-0 mt-1" />
                            )}
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setShowNewForm(true); setSelectedSavedId(null); setAddress(EMPTY_ADDRESS); }}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm ${
                          showNewForm
                            ? 'border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C] font-semibold'
                            : 'border-dashed border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Plus size={15} /> Enter a new address
                      </button>
                    </div>
                  </div>
                )}

                {/* New address form — shown when no saved addresses or user chose new */}
                {(showNewForm || savedAddresses.length === 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Full Name" required error={fieldErrors.full_name}>
                      <input
                        type="text"
                        value={address.full_name}
                        onChange={setField('full_name')}
                        placeholder="Ahmad Karimi"
                        autoComplete="name"
                        className={inputClass(!!fieldErrors.full_name)}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Address Line 1" required error={fieldErrors.address_line1}>
                      <input
                        type="text"
                        value={address.address_line1}
                        onChange={setField('address_line1')}
                        placeholder="123 Street Name"
                        autoComplete="address-line1"
                        className={inputClass(!!fieldErrors.address_line1)}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Address Line 2" error={fieldErrors.address_line2}>
                      <input
                        type="text"
                        value={address.address_line2}
                        onChange={setField('address_line2')}
                        placeholder="Apartment, suite, etc. (optional)"
                        autoComplete="address-line2"
                        className={inputClass(false)}
                      />
                    </Field>
                  </div>

                  <Field label="City" required error={fieldErrors.city}>
                    <input
                      type="text"
                      value={address.city}
                      onChange={setField('city')}
                      placeholder="City"
                      autoComplete="address-level2"
                      className={inputClass(!!fieldErrors.city)}
                    />
                  </Field>

                  <Field label="Country" required error={fieldErrors.country}>
                    <select
                      value={address.country}
                      onChange={setField('country')}
                      className={inputClass(!!fieldErrors.country)}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Postal / ZIP Code" required error={fieldErrors.postal_code}>
                    <input
                      type="text"
                      value={address.postal_code}
                      onChange={setField('postal_code')}
                      placeholder="00000"
                      autoComplete="postal-code"
                      className={inputClass(!!fieldErrors.postal_code)}
                    />
                  </Field>

                  <Field label="Phone Number" required error={fieldErrors.phone}>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => {
                        // Allow only digits, +, spaces, hyphens, parentheses
                        const cleaned = e.target.value.replace(/[^\d+\s\-()]/g, '');
                        setAddress((prev) => ({ ...prev, phone: cleaned }));
                        setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="+60 12 345 6789"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClass(!!fieldErrors.phone)}
                    />
                  </Field>
                </div>

                )}

                <button
                  onClick={() => { if (validateStep1()) setStep(2); }}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-md"
                >
                  Continue to Review
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* ── Step 2: Review ────────────────────────────────────────── */}
            {step === 2 && (
              <div className="animate-step-in space-y-4">

                {/* Shipping address card */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-green-600" />
                      <h3 className="font-semibold text-sm text-[#1C1C1C]">Shipping to</h3>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#A8872F] transition-colors"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p className="font-medium text-[#1C1C1C]">{address.full_name}</p>
                    <p>{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}</p>
                    <p>{address.city}, {address.country} {address.postal_code}</p>
                    <p className="mt-0.5">{address.phone}</p>
                  </div>
                </div>

                {/* Cart items review */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-sm text-[#1C1C1C] mb-4">
                    Items ({cart.item_count})
                  </h3>
                  <div className="space-y-4">
                    {cart.items.map((item) => {
                      const palette = PALETTES[item.product % PALETTES.length];
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div
                            className="w-14 h-14 rounded-lg overflow-hidden shrink-0"
                            style={
                              item.product_image
                                ? undefined
                                : { background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)` }
                            }
                          >
                            {item.product_image && (
                              <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1C1C1C] truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-400">{item.seller_name} · Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-semibold text-[#1C1C1C] shrink-0">
                            ${parseFloat(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm space-y-2.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span>{appliedPromo.code}</span><span>−${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span><span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#C9A84C] font-display">${total.toFixed(2)}</span>
                  </div>
                </div>

                {placeError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    {placeError}
                  </div>
                )}

                <button
                  onClick={() => setStep(3)}
                  className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-md"
                >
                  Continue to Payment
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-500 hover:text-[#1C1C1C] transition-colors py-2"
                >
                  ← Back to Shipping
                </button>
              </div>
            )}

            {/* ── Step 3: Payment ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="animate-step-in space-y-4">

                {/* Cash on Delivery */}
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-4">
                    <Package size={28} className="text-[#C9A84C]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#1C1C1C] mb-2">
                    Cash on Delivery
                  </h3>
                  <p className="text-gray-500 text-sm mb-1">
                    Pay when your order arrives at your door.
                  </p>
                  <p className="text-gray-400 text-xs mb-8">
                    Online payment via HesabPay is coming soon.
                  </p>

                  {/* Order total reminder */}
                  <div className="bg-[#FAFAF8] rounded-xl p-4 mb-6 inline-block min-w-55">
                    <p className="text-xs text-gray-500 mb-1">Order Total</p>
                    <p className="font-display text-3xl font-bold text-[#C9A84C]">
                      ${total.toFixed(2)}
                    </p>
                  </div>

                  {placeError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 text-left">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      {placeError}
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placeLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 text-black font-semibold py-4 rounded-xl text-sm transition-colors shadow-lg hover:shadow-xl"
                  >
                    {placeLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Placing order…</>
                    ) : (
                      <><Check size={16} /> Place Order — Pay on Delivery (${total.toFixed(2)})</>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full text-sm text-gray-500 hover:text-[#1C1C1C] transition-colors py-2"
                >
                  ← Back to Review
                </button>
              </div>
            )}
          </div>

          {/* ── Right: sticky summary ────────────────────────────────────── */}
          <div className="hidden lg:block">
            <OrderSummary
              cart={cart}
              discount={discountAmount}
              promoCode={appliedPromo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
