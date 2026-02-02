import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    vendorId: string;
    vendorName: string;
    quantity: number;
    stock: number;
    variant?: string;
}

interface CartStore {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    getItem: (productId: string) => CartItem | undefined;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,

            addItem: (item) => {
                const existingItem = get().items.find((i) => i.productId === item.productId);

                if (existingItem) {
                    // Update quantity if item already exists
                    const newQuantity = existingItem.quantity + (item.quantity || 1);
                    const limitedQuantity = Math.min(newQuantity, item.stock);

                    set((state) => {
                        const newItems = state.items.map((i) =>
                            i.productId === item.productId
                                ? { ...i, quantity: limitedQuantity }
                                : i
                        );
                        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
                        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

                        return { items: newItems, totalItems, totalPrice };
                    });
                } else {
                    // Add new item
                    const newItem: CartItem = {
                        ...item,
                        quantity: Math.min(item.quantity || 1, item.stock),
                    };

                    set((state) => {
                        const newItems = [...state.items, newItem];
                        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
                        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

                        return { items: newItems, totalItems, totalPrice };
                    });
                }
            },

            updateQuantity: (productId, quantity) => {
                set((state) => {
                    const newItems = state.items.map((item) =>
                        item.productId === productId
                            ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) }
                            : item
                    );
                    const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
                    const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

                    return { items: newItems, totalItems, totalPrice };
                });
            },

            removeItem: (productId) => {
                set((state) => {
                    const newItems = state.items.filter((item) => item.productId !== productId);
                    const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
                    const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

                    return { items: newItems, totalItems, totalPrice };
                });
            },

            clearCart: () => {
                set({ items: [], totalItems: 0, totalPrice: 0 });
            },

            getItem: (productId) => {
                return get().items.find((item) => item.productId === productId);
            },
        }),
        {
            name: "harvesthub-cart",
        }
    )
);
