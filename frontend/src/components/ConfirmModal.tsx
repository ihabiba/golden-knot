import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-red-50' : 'bg-yellow-50'
          }`}
        >
          <AlertTriangle
            size={22}
            className={variant === 'danger' ? 'text-red-500' : 'text-yellow-500'}
          />
        </div>

        <h3 className="font-display text-lg font-bold text-[#1C1C1C] mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800 font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#C9A84C] hover:bg-[#D4B96A] text-black'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
