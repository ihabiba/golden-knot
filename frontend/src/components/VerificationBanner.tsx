import { useState } from 'react';
import { MailWarning, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { resendVerification } from '../api/users';

export default function VerificationBanner() {
  const { isAuthenticated, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!isAuthenticated || !user || user.is_email_verified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Could not send email. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <MailWarning size={16} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          Please verify your email address. Check your inbox for the verification link, or{' '}
          <button
            onClick={handleResend}
            disabled={sending}
            className="font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending…' : 'resend it'}
          </button>
          .
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
