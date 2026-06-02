import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../api/auth';
import { parseApiError } from '../utils/apiError';

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw))  score++;
  if (/[0-9]/.test(pw))  score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#EF4444' };
  if (score <= 2) return { score, label: 'Fair',   color: '#F59E0B' };
  if (score <= 3) return { score, label: 'Good',   color: '#3B82F6' };
  return            { score, label: 'Strong', color: '#22C55E' };
}

const MOSAIC = [
  '#8B2525','#C9A84C','#1C3A5E','#8B2525','#2D4A22',
  '#C9A84C','#1C1C1C','#C9A84C','#4A1942','#C9A84C',
  '#1C3A5E','#C9A84C','#8B4A2A','#C9A84C','#2D4A22',
  '#2D4A22','#8B2525','#C9A84C','#1C3A5E','#C9A84C',
  '#C9A84C','#4A1942','#1C1C1C','#8B2525','#1C3A5E',
];

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const strength = getStrength(password);
  const matchOk  = confirm.length > 0 && password === confirm;
  const matchBad = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    if (!uid || !token) { setError('Invalid reset link.'); return; }

    setLoading(true);
    try {
      await resetPassword(uid, token, password);
      toast.success('Password reset successfully — please sign in.');
      navigate('/login', { replace: true });
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
              <pattern id="rp-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="#C9A84C" />
                <rect x="20" y="20" width="20" height="20" fill="#C9A84C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rp-bg)" />
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
            Choose a strong<br />
            <span className="text-[#C9A84C] italic">new password.</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Make it at least 8 characters. A mix of letters, numbers, and symbols is best.
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

          <div className="mb-8">
            <h1 className="font-display text-[#1C1C1C] text-3xl font-bold mb-1">
              Set new password
            </h1>
            <p className="text-gray-500 text-sm">
              Enter and confirm your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-11 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= strength.score ? strength.color : '#E5E7EB' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className={`w-full bg-white border rounded-lg pl-10 pr-11 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:ring-2 transition-colors ${
                    matchBad ? 'border-red-300 focus:border-red-400 focus:ring-red-100' :
                    matchOk  ? 'border-green-300 focus:border-green-400 focus:ring-green-100' :
                    'border-gray-200 focus:border-[#C9A84C] focus:ring-[#C9A84C]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCf((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {matchOk  && <CheckCircle2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" />}
                {matchBad && <XCircle     size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-red-400" />}
              </div>
              {matchBad && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Remember it now?{' '}
            <Link to="/login" className="text-[#C9A84C] hover:text-[#A8872F] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
