import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface MockProduct {
  id: number;
  name: string;
  seller: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  colors: string[];
  slug: string;
}

interface ProductCardProps {
  product: MockProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { incrementCount } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    incrementCount();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted((w) => !w);
  };

  // Build a textile-inspired gradient from the product's color palette
  const gradientStyle = {
    background: `linear-gradient(135deg, ${product.colors[0]} 0%, ${product.colors[1]} 45%, ${product.colors[2]} 100%)`,
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100">

        {/* Image / Textile pattern placeholder */}
        <div className="relative overflow-hidden h-52 sm:h-56">
          <div className="w-full h-full" style={gradientStyle} />

          {/* Geometric overlay suggesting textile pattern */}
          <div className="absolute inset-0 opacity-20">
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

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
              {product.category}
            </span>
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-200"
            aria-label="Add to wishlist"
          >
            <Heart
              size={15}
              className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}
            />
          </button>

          {/* Add to cart — slides up on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-200 ${
                addedToCart
                  ? 'bg-green-600 text-white'
                  : 'bg-[#C9A84C] hover:bg-[#D4B96A] text-black'
              }`}
            >
              <ShoppingCart size={15} />
              {addedToCart ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-1 tracking-wide">{product.seller}</p>
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
                  className={
                    star <= Math.round(product.rating)
                      ? 'fill-[#C9A84C] text-[#C9A84C]'
                      : 'text-gray-200 fill-gray-200'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {product.rating} ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-semibold text-[#C9A84C]">
              ${product.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
              Handcrafted
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
