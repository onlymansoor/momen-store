import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  product_id: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          if (state.items.find((i) => i.product_id === item.product_id)) {
            return state;
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },
      isInWishlist: (productId) => {
        return get().items.some((i) => i.product_id === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'momen-wishlist' }
  )
);
