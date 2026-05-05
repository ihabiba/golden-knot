import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, User, Phone,
  AlertCircle, Loader2, CheckCircle2, ShoppingBag, Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/auth';
import { parseApiError, parseFieldErrors } from '../utils/apiError';

const MOSAIC = [
  '#1C3A5E','#C9A84C','#8B2525','#2D4A22','#C9A84C',
  '#C9A84C','#8B4A2A','#C9A84C','#1C1C1C','#8B2525',
  '#4A1942','#C9A84C','#1C3A5E','#C9A84C','#2D4A22',
  '#8B2525','#1C1C1C','#C9A84C','#4A1942','#C9A84C',
  '#C9A84C','#2D4A22','#8B2525','#C9A84C','#1C3A5E',
];

interface FormState {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  role: 'customer' | 'seller';
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    username: '', email: '', phone: '', password: '', confirm: '', role: 'customer',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: '' }));
    setError('');
  };

  // Password strength
  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][pwStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const localErrors: Record<string, string> = {};
    if (!form.username.trim()) localErrors.username = 'Username is required.';
    if (!form.email.trim()) localErrors.email = 'Email is required.';
    if (form.password.length < 8) localErrors.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) localErrors.confirm = 'Passwords do not match.';
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
      });
      // Auto-login after registration
      await login(form.email.trim(), form.password);
      navigate('/');
    } catch (err) {
      const fields = parseFieldErrors(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none transition-colors ${
      fieldErrors[field]
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15'
    }`;

  return (
    <div className="min-h-[calc(100vh-64px)] flex">

      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] bg-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="reg-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="#C9A84C" />
                <rect x="20" y="20" width="20" height="20" fill="#C9A84C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reg-bg)" />
          </svg>
        </div>

        <Link to="/" className="relative z-10">
          <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase">
            Golden Knot
          </span>
        </Link>

        <div className="relative z-10">
          <div className="w-48 h-48 grid grid-cols-5 grid-rows-5 rounded-xl overflow-hidden shadow-2xl mb-8">
            {MOSAIC.map((color, i) => (
              <div key={i} className="border border-black/10" style={{ backgroundColor: color }} />
            ))}
          </div>
          <h2 className="font-display text-white text-3xl font-bold leading-tight mb-3">
            Join a community<br />
            <span className="text-[#C9A84C] italic">of artisans.</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Whether you're a buyer discovering authentic textiles or a weaver ready to share
            your craft — your journey starts here.
          </p>

          {/* Role benefits */}
          <div className="mt-8 space-y-3">
            {[
              'Access to 2,500+ handcrafted products',
              'Direct support to Afghan artisans',
              'Secure payments via HesabPay',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-[#C9A84C] flex-shrink-0" />
                <span className="text-gray-400 text-xs">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-700 text-xs">
          &copy; {new Date().getFullYear()} Golden Knot. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-[#FAFAF8] overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden block mb-8 text-center">
            <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase">
              Golden Knot
            </span>
          </Link>

          <div className="mb-7">
            <h1 className="font-display text-[#1C1C1C] text-3xl font-bold mb-1">
              Create account
            </h1>
            <p className="text-gray-500 text-sm">
              Join the Golden Knot community today
            </p>
          </div>

          {/* Global error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'customer', label: 'Shop & Buy', icon: ShoppingBag, sub: 'Discover handcrafted textiles' },
                  { value: 'seller',   label: 'Sell & Earn', icon: Store, sub: 'List your woven products' },
                ] as const).map(({ value, label, icon: Icon, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: value }))}
                    className={`flex flex-col items-start gap-1 p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      form.role === value
                        ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={form.role === value ? 'text-[#C9A84C]' : 'text-gray-400'}
                    />
                    <span className={`text-sm font-semibold ${form.role === value ? 'text-[#C9A84C]' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-tight">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="yourname"
                  required
                  autoComplete="username"
                  className={inputClass('username')}
                />
              </div>
              {fieldErrors.username && <FieldError msg={fieldErrors.username} />}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={inputClass('email')}
                />
              </div>
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Phone number{' '}
                <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+93 700 000 000"
                  autoComplete="tel"
                  className={inputClass('phone')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                  className={`${inputClass('password')} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= pwStrength ? strengthColor : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${
                    pwStrength <= 1 ? 'text-red-500' : pwStrength === 2 ? 'text-yellow-600' : pwStrength === 3 ? 'text-blue-500' : 'text-green-600'
                  }`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
              {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className={`${inputClass('confirm')} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Match indicator */}
              {form.confirm && form.password && (
                <p className={`text-[11px] mt-1.5 flex items-center gap-1 font-medium ${
                  form.password === form.confirm ? 'text-green-600' : 'text-red-500'
                }`}>
                  {form.password === form.confirm
                    ? <><CheckCircle2 size={11} /> Passwords match</>
                    : <><AlertCircle size={11} /> Passwords do not match</>
                  }
                </p>
              )}
              {fieldErrors.confirm && <FieldError msg={fieldErrors.confirm} />}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-[#C9A84C] transition-colors">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline hover:text-[#C9A84C] transition-colors">Privacy Policy</Link>.
            </p>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-7">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#C9A84C] hover:text-[#A8872F] font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
      <AlertCircle size={11} className="flex-shrink-0" />
      {msg}
    </p>
  );
}
