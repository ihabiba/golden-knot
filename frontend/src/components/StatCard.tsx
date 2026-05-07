import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Trend {
  value: number;
  direction: 'up' | 'down';
  label?: string;
}

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: Trend;
  iconColor?: string;
}

export default function StatCard({ icon, value, label, trend, iconColor = '#C9A84C' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.direction === 'up'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {trend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-[#1C1C1C] tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {trend?.label && <p className="text-xs text-gray-400 mt-0.5">{trend.label}</p>}
    </div>
  );
}
