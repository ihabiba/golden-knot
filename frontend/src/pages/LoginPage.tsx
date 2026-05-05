import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';

// Decorative textile mosaic colours — same palette as hero
const MOSAIC = [
  '#8B2525','#C9A84C','#1C3A5E','#8B2525','#2D4A22',
  '#C9A84C','#1C1C1C','#C9A84C','#4A1942','#C9A84C',
  '#1C3A5E','#C9A84C','#8B4A2A','#C9A84C','#2D4A22',
  '#2D4A22','#8B2525','#C9A84C','#1C3A5E','#C9A84C',
  '#C9A84C','#4A1942','#1C1C1C','#8B2525','#1C3A5E',
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">

      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="login-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="#C9A84C" />
                <rect x="20" y="20" width="20" height="20" fill="#C9A84C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-bg)" />
          </svg>
        </div>

        {/* Logo */}
        <Link to="/" className="relative z-10">
          <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase">
            Golden Knot
          </span>
        </Link>

        {/* Centre content */}
        <div className="relative z-10">
          {/* Textile mosaic */}
          <div className="w-48 h-48 grid grid-cols-5 grid-rows-5 rounded-xl overflow-hidden shadow-2xl mb-8">
            {MOSAIC.map((color, i) => (
              <div key={i} className="border border-black/10" style={{ backgroundColor: color }} />
            ))}
          </div>

          <h2 className="font-display text-white text-3xl font-bold leading-tight mb-3">
            Every thread tells<br />
            <span className="text-[#C9A84C] italic">a story.</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Sign in to discover authentic handcrafted textiles from Afghan women weavers —
            crafted with generations of skill.
          </p>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-gray-700 text-xs">
          &copy; {new Date().getFullYear()} Golden Knot. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden block mb-8 text-center">
            <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase">
              Golden Knot
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-[#1C1C1C] text-3xl font-bold mb-1">
              Welcome back
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Global error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#C9A84C] hover:text-[#A8872F] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-11 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((r) => !r)}
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  rememberMe
                    ? 'bg-[#C9A84C] border-[#C9A84C]'
                    : 'bg-white border-gray-300'
                }`}
              >
                {rememberMe && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4l2.5 2.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className="text-sm text-gray-600 cursor-pointer select-none"
                onClick={() => setRememberMe((r) => !r)}
              >
                Keep me signed in
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#FAFAF8] px-3 text-xs text-gray-400 uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            {/* Google placeholder */}
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-400 font-medium py-3 rounded-lg text-sm cursor-not-allowed opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-normal">Soon</span>
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-[#C9A84C] hover:text-[#A8872F] font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
