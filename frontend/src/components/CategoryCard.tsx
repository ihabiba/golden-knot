import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  name: string;
  count: number;
  icon: LucideIcon;
  slug: string;
  accentColor: string;
}

export default function CategoryCard({ name, count, icon: Icon, slug, accentColor }: CategoryCardProps) {
  return (
    <Link
      to={`/products?category=${slug}`}
      className="group relative bg-[#1C1C1C] rounded-xl p-6 flex flex-col items-start gap-4 overflow-hidden border border-white/5 hover:border-[#C9A84C]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
    >
      {/* Background accent on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{ backgroundColor: accentColor }}
      />

      {/* Icon container */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <Icon size={22} style={{ color: accentColor }} />
      </div>

      {/* Text */}
      <div>
        <h3 className="font-display text-white font-medium text-base leading-snug group-hover:text-[#C9A84C] transition-colors duration-200">
          {name}
        </h3>
        <p className="text-gray-500 text-sm mt-1">{count} items</p>
      </div>

      {/* Arrow indicator */}
      <div className="mt-auto self-end opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
        <span className="text-[#C9A84C] text-xl leading-none">&rarr;</span>
      </div>
    </Link>
  );
}
