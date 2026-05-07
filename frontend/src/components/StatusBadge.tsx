interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

const CONFIG: Record<string, StatusConfig> = {
  pending:    { bg: 'bg-yellow-50',         text: 'text-yellow-700',  dot: 'bg-yellow-400', label: 'Pending' },
  confirmed:  { bg: 'bg-blue-50',           text: 'text-blue-700',    dot: 'bg-blue-400',   label: 'Confirmed' },
  processing: { bg: 'bg-purple-50',         text: 'text-purple-700',  dot: 'bg-purple-400', label: 'Processing' },
  shipped:    { bg: 'bg-orange-50',         text: 'text-orange-700',  dot: 'bg-orange-400', label: 'Shipped' },
  delivered:  { bg: 'bg-green-50',          text: 'text-green-700',   dot: 'bg-green-500',  label: 'Delivered' },
  cancelled:  { bg: 'bg-red-50',            text: 'text-red-600',     dot: 'bg-red-400',    label: 'Cancelled' },
  refunded:   { bg: 'bg-gray-100',          text: 'text-gray-600',    dot: 'bg-gray-400',   label: 'Refunded' },
  approved:   { bg: 'bg-[#C9A84C]/10',      text: 'text-[#7a5f1a]',  dot: 'bg-[#C9A84C]', label: 'Approved' },
  suspended:  { bg: 'bg-red-50',            text: 'text-red-600',     dot: 'bg-red-400',    label: 'Suspended' },
  requested:  { bg: 'bg-yellow-50',         text: 'text-yellow-700',  dot: 'bg-yellow-400', label: 'Requested' },
  completed:  { bg: 'bg-green-50',          text: 'text-green-700',   dot: 'bg-green-500',  label: 'Completed' },
  failed:     { bg: 'bg-red-50',            text: 'text-red-600',     dot: 'bg-red-400',    label: 'Failed' },
  active:     { bg: 'bg-green-50',          text: 'text-green-700',   dot: 'bg-green-500',  label: 'Active' },
  inactive:   { bg: 'bg-gray-100',          text: 'text-gray-600',    dot: 'bg-gray-400',   label: 'Inactive' },
  unapproved: { bg: 'bg-yellow-50',         text: 'text-yellow-700',  dot: 'bg-yellow-400', label: 'Pending Review' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export default function StatusBadge({ status, size = 'md', showDot = false }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const cfg = CONFIG[key] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${cfg.bg} ${cfg.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}
