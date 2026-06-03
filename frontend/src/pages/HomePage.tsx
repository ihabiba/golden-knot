import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Grid3X3, Sparkles, Image, BookOpen, AlignLeft, Shield, Globe, Award } from 'lucide-react';
import type { Product } from '../types';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';

// ─── Static config ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 1, name: 'Hand-Knotted Rugs', count: 142, icon: Grid3X3, slug: 'hand-knotted-rugs', accentColor: '#C9A84C' },
  { id: 2, name: 'Kilim Rugs', count: 89, icon: Layers, slug: 'kilim-rugs', accentColor: '#8B2525' },
  { id: 3, name: 'Cushion Covers', count: 213, icon: Sparkles, slug: 'cushion-covers', accentColor: '#1C3A5E' },
  { id: 4, name: 'Wall Hangings', count: 67, icon: Image, slug: 'wall-hangings', accentColor: '#2D4A22' },
  { id: 5, name: 'Prayer Rugs', count: 95, icon: BookOpen, slug: 'prayer-rugs', accentColor: '#4A1942' },
  { id: 6, name: 'Table Runners', count: 48, icon: AlignLeft, slug: 'table-runners', accentColor: '#8B4A2A' },
];

const STATS = [
  { value: '200+', label: 'Artisan Weavers' },
  { value: '500+', label: 'Handcrafted Products' },
  { value: '50+',  label: 'Weaving Patterns' },
  { value: '4.8★', label: 'Average Rating' },
];

const WHY_US = [
  {
    icon: Shield,
    title: 'Authenticity Guaranteed',
    desc: 'Every product is verified and approved before listing. What you see is genuine handcrafted work.',
  },
  {
    icon: Globe,
    title: 'Global Delivery',
    desc: 'We ship worldwide. Your order is carefully packed and tracked from weaver to your doorstep.',
  },
  {
    icon: Award,
    title: 'Direct from Artisans',
    desc: 'No middlemen. Your purchase goes directly to the weaver, ensuring fair earnings for every artisan.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    getProducts({ ordering: '-avg_rating' })
      .then(({ data }) => setFeaturedProducts(data.results.slice(0, 8)))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  return (
    <main className="bg-[#FAFAF8]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0A0A]">

        {/* Background — subtle geometric textile pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="30" height="30" fill="#C9A84C" />
                <rect x="30" y="30" width="30" height="30" fill="#C9A84C" />
                <rect x="15" y="15" width="30" height="30" fill="#C9A84C" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        {/* Gold gradient orb — ambient light effect */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C9A84C] rounded-full opacity-[0.06] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#C9A84C] rounded-full opacity-[0.04] blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-screen lg:min-h-0 lg:py-32">

            {/* Left — Text */}
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-[#C9A84C]" />
                <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">
                  Afghan Heritage Collection
                </span>
              </div>

              <h1 className="font-display text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
                Handcrafted by{' '}
                <span className="text-[#C9A84C] italic">Afghan Women</span>{' '}
                Weavers
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                Discover authentic rugs, kilims, and textiles crafted with generations of skill.
                Every piece tells a story — and every purchase supports an artisan directly.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-7 py-3.5 rounded transition-colors duration-200 text-sm tracking-wide"
                >
                  Shop Now
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 border border-[#C9A84C]/60 hover:border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/5 font-semibold px-7 py-3.5 rounded transition-all duration-200 text-sm tracking-wide"
                >
                  Become a Seller
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap gap-6">
                {STATS.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-white font-bold text-xl">{value}</p>
                    <p className="text-gray-500 text-xs mt-0.5 tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Textile mosaic */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 lg:w-105 lg:h-105">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20" />
                <div className="absolute inset-4 rounded-full border border-[#C9A84C]/10" />

                {/* Main mosaic grid — simulates a woven rug */}
                <div className="absolute inset-8 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="grid grid-cols-6 grid-rows-6 w-full h-full">
                    {[
                      '#8B2525','#C9A84C','#1C3A5E','#8B2525','#2D4A22','#C9A84C',
                      '#C9A84C','#1C1C1C','#C9A84C','#4A1942','#C9A84C','#8B2525',
                      '#1C3A5E','#C9A84C','#8B4A2A','#C9A84C','#1C1C1C','#2D4A22',
                      '#2D4A22','#8B2525','#C9A84C','#1C3A5E','#8B2525','#C9A84C',
                      '#C9A84C','#4A1942','#1C1C1C','#C9A84C','#8B4A2A','#1C3A5E',
                      '#8B2525','#C9A84C','#2D4A22','#8B2525','#C9A84C','#4A1942',
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Floating label */}
                <div className="absolute -bottom-4 -right-4 bg-[#C9A84C] text-black px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-wider">Authentic</p>
                  <p className="text-[10px] font-medium opacity-80">Afghan Craftsmanship</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[10px] text-white uppercase tracking-[0.2em]">Scroll</span>
          <div className="w-px h-10 bg-linear-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ── Featured Categories ───────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">
              Browse by Type
            </span>
            <h2 className="font-display text-[#1C1C1C] text-3xl sm:text-4xl font-bold mt-2">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium text-[#C9A84C] hover:text-[#A8872F] flex items-center gap-1.5 transition-colors group shrink-0"
          >
            View all products
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              count={cat.count}
              icon={cat.icon}
              slug={cat.slug}
              accentColor={cat.accentColor}
            />
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">
                Curated Selection
              </span>
              <h2 className="font-display text-[#1C1C1C] text-3xl sm:text-4xl font-bold mt-2">
                Featured Products
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-medium text-[#C9A84C] hover:text-[#A8872F] flex items-center gap-1.5 transition-colors group shrink-0"
            >
              See all
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-56 bg-gray-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">No featured products available right now.</p>
              <Link to="/products" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#C9A84C] hover:text-[#A8872F] transition-colors">
                Browse all products <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Golden Knot ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">
            Why Choose Us
          </span>
          <h2 className="font-display text-[#1C1C1C] text-3xl sm:text-4xl font-bold mt-2">
            The Golden Knot Difference
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY_US.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="text-center group p-8 rounded-xl border border-gray-100 hover:border-[#C9A84C]/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-[#C9A84C]/20 transition-colors duration-300">
                <Icon size={24} className="text-[#C9A84C]" />
              </div>
              <h3 className="font-display text-[#1C1C1C] font-semibold text-lg mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission Banner ────────────────────────────────────────────────── */}
      <section className="bg-[#0A0A0A] relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mission-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#C9A84C" />
                <rect x="0" y="19" width="40" height="2" fill="#C9A84C" opacity="0.5" />
                <rect x="19" y="0" width="2" height="40" fill="#C9A84C" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mission-pattern)" />
          </svg>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-[#C9A84C]/5 to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">
                Our Mission
              </span>
            </div>

            <h2 className="font-display text-white text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Preserving Heritage,{' '}
              <span className="text-[#C9A84C] italic">Empowering Lives</span>
            </h2>

            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-4">
              Golden Knot was founded on a simple belief: every handcrafted piece tells a story.
              Behind each rug and kilim is a skilled Afghan woman who has spent years mastering
              a craft passed down through generations.
            </p>
            <p className="text-gray-500 text-base leading-relaxed mb-10">
              By connecting these artisans directly with buyers worldwide, we ensure fair earnings,
              preserve ancient weaving traditions, and bring a piece of authentic Afghan culture
              into homes across the globe.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-7 py-3 rounded transition-colors duration-200 text-sm"
              >
                Learn Our Story
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-[#C9A84C]/60 text-white hover:text-[#C9A84C] font-semibold px-7 py-3 rounded transition-all duration-200 text-sm"
              >
                Join as a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FAFAF8]">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">Stay Connected</span>
          <h2 className="font-display text-[#1C1C1C] text-2xl sm:text-3xl font-bold mt-2 mb-3">
            New arrivals, stories & more
          </h2>
          <p className="text-gray-500 text-sm mb-7">
            Subscribe to hear about new collections, artisan spotlights, and exclusive offers.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded border border-gray-200 bg-white text-sm text-[#1C1C1C] outline-none focus:border-[#C9A84C] transition-colors placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-6 py-3 rounded text-sm transition-colors duration-200 shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
