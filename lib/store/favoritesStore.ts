import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
    favoriteIds: string[];
    toggleFavorite: (productId: string) => void;
    isFavorite: (productId: string) => boolean;
    clearFavorites: () => void;
}

export const useFavorites = create<FavoritesStore>()(
    persist(
        (set, get) => ({
            favoriteIds: [],

            toggleFavorite: (productId: string) => {
                const current = get().favoriteIds;
                if (current.includes(productId)) {
                    set({ favoriteIds: current.filter((id) => id !== productId) });
                } else {
                    set({ favoriteIds: [...current, productId] });
                }
            },

            isFavorite: (productId: string) => {
                return get().favoriteIds.includes(productId);
            },

            clearFavorites: () => {
                set({ favoriteIds: [] });
            },
        }),
        {
            name: "harvesthub-favorites",
        }
    )
);
