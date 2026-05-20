import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api } from '../lib/apiClient';

const IVA_RATE = 0.19;

const computeTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const iva = subtotal * IVA_RATE;
  const taxes = iva;
  const total = subtotal + taxes;
  return { subtotal, taxes, total };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      deliveryMethod: 'pickup',
      pickupBranch: null,
      shippingCoords: null,
      subtotal: 0,
      taxes: 0,
      total: 0,
      setDeliveryMethod: (method) => set({ deliveryMethod: method }),
      setPickupBranch: (branch) => set({ pickupBranch: branch }),
      setShippingCoords: (coords) => set({ shippingCoords: coords }),
      recalc: () => {
        const { subtotal, taxes, total } = computeTotals(get().items);
        set({ subtotal, taxes, total });
      },
      addItem: (book, opts = {}) => {
        const id = book?.id || book?._id;
        if (!id) return;

        const format = opts.format || book.format || 'physical';
        const quantity = opts.quantity || 1;
        const price =
          typeof book.price === 'number'
            ? book.price
            : format === 'digital'
              ? book.price_digital ?? 0
              : book.price_physical ?? 0;

        const normalized = {
          id,
          title: book.title,
          author: book.author,
          image_url: book.image_url || book.cover_url || null,
          categories: book.categories || [],
          pickup_location: book.pickup_location || null,
          price,
          quantity,
          format,
          stock: typeof book.stock === 'number' ? book.stock : null,
        };

        const existing = get().items.find((i) => i.id === id && i.format === format);
        const items = existing
          ? get().items.map((i) => (i.id === id && i.format === format ? { ...i, quantity: i.quantity + quantity } : i))
          : [...get().items, normalized];

        set({ items, ...computeTotals(items) });
      },
      removeItem: (id, format = null) => {
        const items = get().items.filter((i) => !(i.id === id && (format ? i.format === format : true)));
        set({ items, ...computeTotals(items) });
      },
      clear: () => set({ items: [], deliveryMethod: 'pickup', pickupBranch: null, shippingCoords: null, ...computeTotals([]) }),
      syncWithInventory: async () => {
        const items = get().items;
        if (items.length === 0) return;

        const updates = await Promise.all(
          items.map(async (item) => {
            try {
              const { data } = await api.get(`/books/${item.id}`);
              const latestPrice =
                typeof data.price === 'number'
                  ? data.price
                  : item.format === 'digital'
                    ? data.price_digital ?? item.price
                    : data.price_physical ?? item.price;
              return {
                ...item,
                title: data.title,
                author: data.author,
                image_url: data.image_url || data.cover_url || item.image_url,
                categories: data.categories || item.categories,
                pickup_location: data.pickup_location || item.pickup_location,
                stock: typeof data.stock === 'number' ? data.stock : item.stock,
                price: latestPrice,
              };
            } catch {
              return item;
            }
          })
        );

        set({ items: updates, ...computeTotals(updates) });
      },
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({
        items: state.items,
        deliveryMethod: state.deliveryMethod,
        pickupBranch: state.pickupBranch,
        shippingCoords: state.shippingCoords,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totals = computeTotals(state.items || []);
          state.subtotal = totals.subtotal;
          state.taxes = totals.taxes;
          state.total = totals.total;
        }
      },
    }
  )
);
