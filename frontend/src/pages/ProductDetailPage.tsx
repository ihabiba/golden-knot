import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Star, Heart, ShoppingCart, Minus, Plus, Share2,
  MapPin, Package, ChevronLeft, Loader2, AlertCircle, CheckCircle2, User,
} from 'lucide-react';
import type { Product, Review } from '../types';
import { getProduct, getProducts } from '../api/products';
import { getReviews, createReview } from '../api/reviews';
import { addToCart } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { parseApiError } from '../utils/apiError';
import ProductCard from '../components/ProductCard';

// ─── Colour palettes (mirrors ProductCard) ────────────────────────────────────

const PALETTES = [
  ['#8B2525', '#C9A84C', '#1C3A5E'],
  ['#2D4A22', '#C9A84C', '#8B2525'],
  ['#1C3A5E', '#C9A84C', '#F5F0E8'],
  ['#8B2525', '#1C1C1C', '#C9A84C'],
  ['#4A1942', '#C9A84C', '#E8D5A3'],
  ['#1C3A5E', '#8B2525', '#C9A84C'],
  ['#8B4A2A', '#C9A84C', '#2D4A22'],
  ['#C9A84C', '#1C1C1C', '#8B2525'],
] as const;

// ─── Star display ─────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

// ─── Interactive star selector (for review form) ──────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
        >
          <Star
            size={28}
            className={s <= (hovered || value) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'fill-gray-200 text-gray-200'}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-8 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-4 bg-gray-200 rounded w-48 mb-8" />
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-square rounded-2xl bg-gray-200 mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="w-16 h-16 rounded-lg bg-gray-200" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded w-1/4" />
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-full mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image gallery ────────────────────────────────────────────────────────────

function ImageGallery({ product }: { product: Product }) {
  const [selected, setSelected] = useState(0);
  const palette = PALETTES[product.id % PALETTES.length];
  const hasImages = product.images.length > 0;
  const currentImage = hasImages ? product.images[selected] : null;

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg mb-4">
        {currentImage ? (
          <img
            src={currentImage.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 45%, ${palette[2]} 100%)`,
              }}
            />
            {/* Textile pattern overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="detail-weave" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="15" height="15" fill="rgba(255,255,255,0.4)" />
                    <rect x="15" y="15" width="15" height="15" fill="rgba(255,255,255,0.4)" />
                    <rect x="7" y="7" width="16" height="16" fill="rgba(0,0,0,0.08)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#detail-weave)" />
              </svg>
            </div>
            <div className="absolute bottom-4 right-4">
              <span className="text-[10px] uppercase tracking-widest text-white/60 bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                Textile Preview
              </span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — only shown when multiple real images exist */}
      {hasImages && product.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {product.images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === selected ? 'border-[#C9A84C] shadow-md' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={img.image} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A84C]/15 flex items-center justify-center shrink-0">
            <User size={15} className="text-[#C9A84C]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1C1C1C]">{review.customer_name}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>
        <StarDisplay rating={review.rating} size={13} />
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'description' | 'reviews';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const { isAuthenticated } = useAuth();
  const { setItemCount, itemCount } = useCart();

  // Product + related
  const [product, setProduct]           = useState<Product | null>(null);
  const [related, setRelated]           = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState('');

  // Reviews
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Cart / wishlist UI
  const [qty, setQty]                   = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart]   = useState(false);
  const [cartError, setCartError]       = useState('');
  const [wishlisted, setWishlisted]     = useState(false);

  // Tabs
  const [activeTab, setActiveTab]       = useState<Tab>('description');

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError]   = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch product
  useEffect(() => {
    if (!slug) return;
    setProductLoading(true);
    setProductError('');
    getProduct(slug)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        const msg = parseApiError(err);
        setProductError(msg.includes('404') || msg.toLowerCase().includes('not found')
          ? 'Product not found.'
          : msg);
      })
      .finally(() => setProductLoading(false));
  }, [slug]);

  // Fetch reviews + related products once we have the product
  useEffect(() => {
    if (!product) return;

    setReviewsLoading(true);
    getReviews(product.id)
      .then((res) => setReviews(res.data.results))
      .catch(() => {/* non-critical */})
      .finally(() => setReviewsLoading(false));

    if (product.category_slug) {
      getProducts({ category: product.category_slug, page: 1 })
        .then((res) => {
          setRelated(res.data.results.filter((p) => p.id !== product.id).slice(0, 4));
        })
        .catch(() => {/* non-critical */});
    }
  }, [product]);

  // Add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!product || addingToCart) return;
    setCartError('');
    setAddingToCart(true);
    try {
      await addToCart(product.id, qty);
      setItemCount(itemCount + qty);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      setCartError(parseApiError(err));
    } finally {
      setAddingToCart(false);
    }
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (reviewRating === 0) { setReviewError('Please select a rating.'); return; }
    setReviewError('');
    setReviewLoading(true);
    try {
      const res = await createReview({
        product: product.id,
        rating: reviewRating as 1 | 2 | 3 | 4 | 5,
        comment: reviewComment,
      });
      setReviews((prev) => [res.data, ...prev]);
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment('');
    } catch (err) {
      const msg = parseApiError(err);
      setReviewError(msg.toLowerCase().includes('unique')
        ? 'You have already reviewed this product.'
        : msg);
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (productLoading) return <ProductDetailSkeleton />;

  // ── Error / not found ────────────────────────────────────────────────────────
  if (productError || !product) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#1C1C1C] mb-2">
            {productError || 'Product not found'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            <ChevronLeft size={15} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.avg_rating;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#C9A84C] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#C9A84C] transition-colors">Products</Link>
          {product.category_slug && (
            <>
              <span>/</span>
              <Link
                to={`/products?category=${product.category_slug}`}
                className="hover:text-[#C9A84C] transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#1C1C1C] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Main grid ─────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Left: Image gallery */}
          <ImageGallery product={product} />

          {/* Right: Product info */}
          <div className="flex flex-col">
            {/* Category + share */}
            <div className="flex items-center justify-between mb-3">
              <Link
                to={`/products?category=${product.category_slug ?? ''}`}
                className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#C9A84C] hover:text-[#A8872F] transition-colors border border-[#C9A84C]/30 px-2.5 py-1 rounded-full"
              >
                {product.category_name}
              </Link>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Share product"
              >
                <Share2 size={15} />
              </button>
            </div>

            {/* Title */}
            <h1 className="font-display text-[#1C1C1C] text-2xl sm:text-3xl font-bold leading-tight mb-3">
              {product.name}
            </h1>

            {/* Seller */}
            <p className="text-sm text-gray-500 mb-4">
              Sold by{' '}
              <Link
                to={`/store/${product.seller}`}
                className="text-[#C9A84C] hover:text-[#A8872F] font-medium transition-colors"
              >
                {product.seller_name}
              </Link>
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <StarDisplay rating={avgRating} size={16} />
              <span className="text-sm font-medium text-[#1C1C1C]">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-sm text-gray-400 hover:text-[#C9A84C] transition-colors"
              >
                ({reviews.length > 0 ? reviews.length : product.review_count}{' '}
                {(reviews.length > 0 ? reviews.length : product.review_count) === 1 ? 'review' : 'reviews'})
              </button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-display text-3xl font-bold text-[#C9A84C]">
                ${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">USD</span>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-100">
              <Package size={14} className={inStock ? 'text-green-500' : 'text-red-400'} />
              {inStock ? (
                <span className="text-sm text-green-600 font-medium">
                  {product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In Stock'}
                </span>
              ) : (
                <span className="text-sm text-red-500 font-medium">Out of Stock</span>
              )}
              {product.location && (
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} />
                  {product.location}
                </span>
              )}
            </div>

            {/* Quantity selector */}
            {inStock && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-gray-600">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#1C1C1C] border-x border-gray-200">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Cart error */}
            {cartError && (
              <p className="text-red-500 text-xs flex items-center gap-1.5 mb-3">
                <AlertCircle size={12} /> {cartError}
              </p>
            )}

            {/* Add to cart + wishlist */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : inStock
                    ? 'bg-[#C9A84C] hover:bg-[#D4B96A] text-black shadow-md hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {addingToCart ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : addedToCart ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <ShoppingCart size={16} />
                )}
                {addedToCart ? 'Added to Cart!' : addingToCart ? 'Adding…' : inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button
                onClick={() => setWishlisted((w) => !w)}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                  wishlisted
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'border-gray-200 text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                }`}
                aria-label="Add to wishlist"
              >
                <Heart size={18} className={wishlisted ? 'fill-red-500' : ''} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🔒', label: 'Secure Payment', sub: 'Cash on Delivery' },
                { icon: '🌍', label: 'Worldwide Shipping', sub: 'Fully tracked' },
                { icon: '✋', label: 'Handcrafted', sub: 'Authenticity guaranteed' },
                { icon: '↩️', label: 'Easy Returns', sub: '30-day policy' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2.5 p-3 bg-white rounded-lg border border-gray-100">
                  <span className="text-base leading-none mt-0.5">{icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#1C1C1C]">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs: Description + Reviews ────────────────────────────────────── */}
        <div className="mt-16">
          {/* Tab nav */}
          <div className="flex border-b border-gray-200 mb-8">
            {([
              { key: 'description', label: 'Description' },
              {
                key: 'reviews',
                label: `Reviews (${reviews.length > 0 ? reviews.length : product.review_count})`,
              },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-[#C9A84C] text-[#C9A84C]'
                    : 'border-transparent text-gray-500 hover:text-[#1C1C1C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description tab */}
          {activeTab === 'description' && (
            <div className="max-w-3xl">
              <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'No description available for this product.'}
              </div>
              {product.location && (
                <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-5">
                  <MapPin size={14} className="text-[#C9A84C]" />
                  Crafted in <span className="font-medium text-[#1C1C1C] ml-1">{product.location}</span>
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="max-w-3xl">
              {/* Average rating summary */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-6 p-6 bg-white rounded-xl border border-gray-100 mb-8">
                  <div className="text-center">
                    <p className="font-display text-5xl font-bold text-[#C9A84C]">
                      {avgRating.toFixed(1)}
                    </p>
                    <StarDisplay rating={avgRating} size={16} />
                    <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                          <Star size={10} className="fill-[#C9A84C] text-[#C9A84C] shrink-0" />
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-[#C9A84C] h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-4">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Write a review */}
              {isAuthenticated && !reviewSuccess && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
                  <h3 className="font-display text-base font-semibold text-[#1C1C1C] mb-4">
                    Share Your Experience
                  </h3>
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Your Rating
                      </label>
                      <StarSelector value={reviewRating} onChange={setReviewRating} />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Comment <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        placeholder="Tell other buyers about your experience with this product…"
                        className="w-full bg-[#FAFAF8] border border-gray-200 rounded-lg px-4 py-3 text-sm text-[#1C1C1C] placeholder-gray-400 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-colors resize-none"
                      />
                    </div>
                    {reviewError && (
                      <p className="text-red-500 text-xs flex items-center gap-1.5 mb-3">
                        <AlertCircle size={12} /> {reviewError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      {reviewLoading && <Loader2 size={14} className="animate-spin" />}
                      {reviewLoading ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {reviewSuccess && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-8">
                  <CheckCircle2 size={16} />
                  Thank you! Your review has been published.
                </div>
              )}

              {!isAuthenticated && (
                <div className="bg-[#FAFAF8] border border-gray-200 rounded-xl p-5 mb-8 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    <Link to="/login" className="text-[#C9A84C] font-medium hover:underline">Sign in</Link>
                    {' '}to leave a review
                  </p>
                </div>
              )}

              {/* Reviews list */}
              {reviewsLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                      <div className="flex gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/3" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                  ))}
                </div>
              )}

              {!reviewsLoading && reviews.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">
                  No reviews yet. Be the first to review this product!
                </p>
              )}

              {!reviewsLoading && reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Related products ───────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.25em]">
                  You May Also Like
                </span>
                <h2 className="font-display text-[#1C1C1C] text-2xl font-bold mt-1">
                  More from {product.category_name}
                </h2>
              </div>
              {product.category_slug && (
                <Link
                  to={`/products?category=${product.category_slug}`}
                  className="text-sm text-[#C9A84C] hover:text-[#A8872F] transition-colors shrink-0"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
