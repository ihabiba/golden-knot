import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';
import type { Product, Category, PaginatedResponse } from '../types';
import { getProducts, getCategories } from '../api/products';
import { parseApiError } from '../utils/apiError';
import ProductCard from '../components/ProductCard';

const PAGE_SIZE = 20;

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-52 sm:h-56 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="h-5 bg-gray-200 rounded w-1/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#C9A84C]/10 text-[#A8872F] text-xs font-medium px-3 py-1.5 rounded-full border border-[#C9A84C]/30">
      {label}
      <button onClick={onRemove} className="hover:text-[#1C1C1C] transition-colors" aria-label="Remove filter">
        <X size={12} />
      </button>
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function Pagination({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPage(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      {buildPageRange(current, total).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              p === current
                ? 'bg-[#C9A84C] text-black border border-[#C9A84C]'
                : 'border border-gray-200 text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C]'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(current + 1)}
        disabled={current === total}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <PackageOpen size={32} className="text-gray-400" />
      </div>
      <h3 className="font-display text-[#1C1C1C] text-xl font-semibold mb-2">No products found</h3>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        {hasFilters
          ? 'Try adjusting your filters or search terms to discover our handcrafted collection.'
          : 'No products are available right now. Check back soon.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-6 text-sm font-medium text-[#C9A84C] hover:text-[#A8872F] underline transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ─── Filter sidebar ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  categories: Category[];
  activeCategory: string;
  minInput: string;
  maxInput: string;
  onCategoryChange: (slug: string) => void;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  onApplyPrice: () => void;
  onClear: () => void;
  hasFilters: boolean;
}

function FilterSidebar({
  categories, activeCategory, minInput, maxInput,
  onCategoryChange, onMinChange, onMaxChange, onApplyPrice, onClear, hasFilters,
}: FilterSidebarProps) {
  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              !activeCategory ? 'bg-[#C9A84C]/10 text-[#A8872F] font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>All Products</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === cat.slug ? 'bg-[#C9A84C]/10 text-[#A8872F] font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{cat.name}</span>
              {activeCategory === cat.slug && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Price Range</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minInput}
              onChange={(e) => onMinChange(e.target.value)}
              className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>
          <span className="text-gray-400 text-sm shrink-0">—</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxInput}
              onChange={(e) => onMaxChange(e.target.value)}
              className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>
        </div>
        <button
          onClick={onApplyPrice}
          className="w-full py-2 bg-[#1C1C1C] hover:bg-black text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="w-full py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derived URL state
  const category  = searchParams.get('category')  ?? '';
  const ordering  = searchParams.get('ordering')  ?? '-created_at';
  const minPrice  = searchParams.get('min_price') ?? '';
  const maxPrice  = searchParams.get('max_price') ?? '';
  const page      = Number(searchParams.get('page') ?? '1');
  const searchQuery = searchParams.get('search') ?? '';

  // Local input state (search & price not immediately synced to URL)
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [minInput, setMinInput]       = useState(minPrice);
  const [maxInput, setMaxInput]       = useState(maxPrice);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  // Data state
  const [data, setData]           = useState<PaginatedResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const debouncedSearch = useDebounce(searchInput, 300);

  // Stable URL updater
  const updateParam = useCallback((key: string, value: string, replace = false) => {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      if (value) np.set(key, value); else np.delete(key);
      if (key !== 'page') np.delete('page');
      return np;
    }, { replace });
  }, [setSearchParams]);

  // Sync debounced search → URL (replace so history stays clean)
  useEffect(() => {
    const current = searchParams.get('search') ?? '';
    if (debouncedSearch !== current) updateParam('search', debouncedSearch, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch categories once
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.results))
      .catch(() => {/* categories failing is non-critical */});
  }, []);

  // Fetch products when any filter/page changes
  useEffect(() => {
    setLoading(true);
    setError('');
    const params: Record<string, string | number> = { page };
    if (searchQuery) params.search   = searchQuery;
    if (category)    params.category = category;
    if (ordering)    params.ordering = ordering;
    if (minPrice)    params.min_price = minPrice;
    if (maxPrice)    params.max_price = maxPrice;

    getProducts(params)
      .then((res) => setData(res.data))
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [page, searchQuery, category, ordering, minPrice, maxPrice]);

  const applyPrice = useCallback(() => {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      if (minInput) np.set('min_price', minInput); else np.delete('min_price');
      if (maxInput) np.set('max_price', maxInput); else np.delete('max_price');
      np.delete('page');
      return np;
    });
    setDrawerOpen(false);
  }, [minInput, maxInput, setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchInput('');
    setMinInput('');
    setMaxInput('');
    setSearchParams({});
    setDrawerOpen(false);
  }, [setSearchParams]);

  const hasFilters = !!(category || minPrice || maxPrice || searchQuery);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Link to="/" className="hover:text-[#C9A84C] transition-colors">Home</Link>
            <span>/</span>
            {activeCategory ? (
              <>
                <button onClick={() => updateParam('category', '')} className="hover:text-[#C9A84C] transition-colors">
                  All Products
                </button>
                <span>/</span>
                <span className="text-[#C9A84C]">{activeCategory.name}</span>
              </>
            ) : (
              <span className="text-[#C9A84C]">All Products</span>
            )}
          </div>
          <h1 className="font-display text-white text-3xl sm:text-4xl font-bold">
            {activeCategory ? activeCategory.name : 'All Products'}
          </h1>
          {activeCategory?.description && (
            <p className="text-gray-500 text-sm mt-2 max-w-xl">{activeCategory.description}</p>
          )}
          {!loading && data && (
            <p className="text-gray-600 text-sm mt-2">
              {data.count} {data.count === 1 ? 'product' : 'products'} found
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Top bar: search + sort + mobile filter ─────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search rugs, kilims, cushions…"
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); updateParam('search', ''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={ordering}
            onChange={(e) => updateParam('ordering', e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1C1C1C] outline-none focus:border-[#C9A84C] cursor-pointer min-w-[190px]"
          >
            <option value="-created_at">Sort: Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
          </select>

          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-[#1C1C1C] hover:border-[#C9A84C] transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />}
          </button>
        </div>

        <div className="flex gap-8">

          {/* ── Sidebar — desktop ───────────────────────────────────────── */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-display text-base font-semibold text-[#1C1C1C] mb-6">Filters</h2>
              <FilterSidebar
                categories={categories}
                activeCategory={category}
                minInput={minInput}
                maxInput={maxInput}
                onCategoryChange={(slug) => { updateParam('category', slug); }}
                onMinChange={setMinInput}
                onMaxChange={setMaxInput}
                onApplyPrice={applyPrice}
                onClear={clearAll}
                hasFilters={hasFilters}
              />
            </div>
          </aside>

          {/* ── Product grid ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Active filter pills */}
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {activeCategory && (
                  <FilterPill label={activeCategory.name} onRemove={() => updateParam('category', '')} />
                )}
                {(minPrice || maxPrice) && (
                  <FilterPill
                    label={`$${minPrice || '0'} – $${maxPrice || '∞'}`}
                    onRemove={() => {
                      setMinInput('');
                      setMaxInput('');
                      setSearchParams((prev) => {
                        const np = new URLSearchParams(prev);
                        np.delete('min_price');
                        np.delete('max_price');
                        np.delete('page');
                        return np;
                      });
                    }}
                  />
                )}
                {searchQuery && (
                  <FilterPill
                    label={`"${searchQuery}"`}
                    onRemove={() => { setSearchInput(''); updateParam('search', ''); }}
                  />
                )}
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
                  Clear all
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="text-center py-20">
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button
                  onClick={clearAll}
                  className="text-sm text-[#C9A84C] underline hover:text-[#A8872F] transition-colors"
                >
                  Reset and try again
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && data?.results.length === 0 && (
              <EmptyState onClear={clearAll} hasFilters={hasFilters} />
            )}

            {/* Products */}
            {!loading && !error && data && data.results.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data.results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    current={page}
                    total={totalPages}
                    onPage={(p) => updateParam('page', String(p))}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ───────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-display text-lg font-bold text-[#1C1C1C]">Filters</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-6">
              <FilterSidebar
                categories={categories}
                activeCategory={category}
                minInput={minInput}
                maxInput={maxInput}
                onCategoryChange={(slug) => { updateParam('category', slug); setDrawerOpen(false); }}
                onMinChange={setMinInput}
                onMaxChange={setMaxInput}
                onApplyPrice={applyPrice}
                onClear={clearAll}
                hasFilters={hasFilters}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
