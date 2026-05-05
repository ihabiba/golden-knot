import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addToCart } from '../api/cart';

// Deterministic palette — generated from product.id so same product always looks the same
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

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { setItemCount, itemCount } = useCart();
  const navigate = useNavigate();

  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);

  const palette = PALETTES[product.id % PALETTES.length];
  const primaryImage = product.images.find((img) => img.is_primary) ?? product.images[0];
  const rating = product.avg_rating ?? 0;
  const reviewCount = product.review_count ?? 0;

  const gradientStyle = {
    background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 45%, ${palette[2]} 100%)`,
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (adding || addedToCart) return;
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setItemCount(itemCount + 1);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1500);
    } catch {
      // silently fail — user will see error on cart page if needed
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted((w) => !w);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#C9A84C]/20">

        {/* Image area */}
        <div className="relative overflow-hidden h-52 sm:h-56">
          {primaryImage ? (
            <img
              src={primaryImage.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <>
              <div className="w-full h-full group-hover:scale-105 transition-transform duration-500" style={gradientStyle} />
              {/* Woven textile overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`weave-${product.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect x="0" y="0" width="10" height="10" fill="rgba(255,255,255,0.3)" />
                      <rect x="10" y="10" width="10" height="10" fill="rgba(255,255,255,0.3)" />
                      <rect x="5" y="5" width="10" height="10" fill="rgba(0,0,0,0.1)" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#weave-${product.id})`} />
                </svg>
              </div>
            </>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
              {product.category_name}
            </span>
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-200"
            aria-label="Add to wishlist"
          >
            <Heart size={15} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>

          {/* Add to cart — slides up on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-200 ${
                addedToCart
                  ? 'bg-green-600 text-white'
                  : 'bg-[#C9A84C] hover:bg-[#D4B96A] text-black'
              }`}
            >
              <ShoppingCart size={15} />
              {addedToCart ? 'Added!' : adding ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-1 tracking-wide">{product.seller_name}</p>
          <h3 className="font-display text-[#1C1C1C] font-medium text-base leading-snug group-hover:text-[#C9A84C] transition-colors duration-200 line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={star <= Math.round(rating) ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-200 fill-gray-200'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : 'No reviews yet'}
            </span>
          </div>

          {/* Price + stock */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-semibold text-[#C9A84C]">
              ${parseFloat(product.price).toLocaleString()}
            </span>
            {product.stock <= 3 && product.stock > 0 ? (
              <span className="text-[10px] text-orange-600 font-medium border border-orange-200 bg-orange-50 px-2 py-0.5 rounded-full">
                Only {product.stock} left
              </span>
            ) : product.stock === 0 ? (
              <span className="text-[10px] text-red-500 font-medium border border-red-200 bg-red-50 px-2 py-0.5 rounded-full">
                Out of stock
              </span>
            ) : (
              <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                Handcrafted
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
