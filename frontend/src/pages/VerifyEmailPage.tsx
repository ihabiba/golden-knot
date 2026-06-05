import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setState('error'); return; }
    api.get(`/users/verify-email/${token}/`)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="bg-[#FAFAF8] min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center shadow-sm">

        {state === 'loading' && (
          <>
            <Loader2 size={48} className="text-[#C9A84C] animate-spin mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-2">Verifying your email…</h2>
            <p className="text-gray-400 text-sm">Just a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-2">Email Verified!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your email address has been verified. You now have full access to Golden Knot.
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle size={52} className="text-red-400 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-2">Link Invalid or Expired</h2>
            <p className="text-gray-500 text-sm mb-6">
              This verification link is no longer valid. Log in and request a new one from the banner on your screen.
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
