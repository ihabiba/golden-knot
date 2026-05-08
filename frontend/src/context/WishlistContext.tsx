import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist } from '../api/wishlist';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  wishlistIds: Set<number>;
  itemIdMap: Map<number, number>; // productId → wishlistItemId
  loading: boolean;
  toggle: (productId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlistIds: new Set(),
  itemIdMap: new Map(),
  loading: false,
  toggle: async () => {},
  refresh: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [itemIdMap, setItemIdMap] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistIds(new Set());
      setItemIdMap(new Map());
      return;
    }
    setLoading(true);
    try {
      const { data } = await getWishlist();
      const ids = new Set(data.results.map((w) => w.product));
      const map = new Map(data.results.map((w) => [w.product, w.id]));
      setWishlistIds(ids);
      setItemIdMap(map);
    } catch {
      // silently fail — wishlist just won't show
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async (productId: number) => {
    if (!isAuthenticated) return;
    const isWishlisted = wishlistIds.has(productId);

    // Optimistic update
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      if (isWishlisted) {
        const itemId = itemIdMap.get(productId);
        if (itemId) {
          await removeFromWishlist(itemId);
          setItemIdMap((prev) => { const m = new Map(prev); m.delete(productId); return m; });
        }
      } else {
        const { data } = await addToWishlist(productId);
        setItemIdMap((prev) => new Map(prev).set(productId, data.id));
      }
    } catch {
      // Revert optimistic update on failure
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (isWishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  }, [isAuthenticated, wishlistIds, itemIdMap]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, itemIdMap, loading, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
