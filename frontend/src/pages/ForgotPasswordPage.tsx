import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { forgotPassword } from '../api/auth';
import { parseApiError } from '../utils/apiError';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="fp-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="#C9A84C" />
                <rect x="20" y="20" width="20" height="20" fill="#C9A84C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fp-bg)" />
          </svg>
        </div>

        <Link to="/" className="relative z-10">
          <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase">
            Golden Knot
          </span>
        </Link>

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-8">
            <Mail size={36} className="text-[#C9A84C]" />
          </div>
          <h2 className="font-display text-white text-3xl font-bold leading-tight mb-3">
            We'll get you<br />
            <span className="text-[#C9A84C] italic">back in.</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Enter your email and we'll send a secure link to reset your password within seconds.
          </p>
        </div>

        <p className="relative z-10 text-gray-700 text-xs">
          &copy; {new Date().getFullYear()} Golden Knot. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAFAF8]">
        <div className="w-full max-w-md">

          <Link to="/" className="lg:hidden block mb-8 text-center">
            <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase">
              Golden Knot
            </span>
          </Link>

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <h1 className="font-display text-[#1C1C1C] text-2xl font-bold mb-3">
                Check your inbox
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                If <span className="font-medium text-[#1C1C1C]">{email}</span> is registered,
                you'll receive a reset link shortly.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Don't see it? Check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-[#C9A84C] hover:text-[#A8872F] font-medium transition-colors"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            /* Form */
            <>
              <div className="mb-8">
                <h1 className="font-display text-[#1C1C1C] text-3xl font-bold mb-1">
                  Forgot password?
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                      autoFocus
                      autoComplete="email"
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[#C9A84C] hover:text-[#A8872F] font-medium transition-colors"
                >
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
