// Menu Store - Connected to Database API (Production Ready)
import { create } from 'zustand';
import { RestaurantMenu, MenuCategory, MenuItem, DeliveryPlatform, Printer } from '../types';
import { menuApi } from '../services/api';

interface MenuState {
    menus: RestaurantMenu[];
    categories: MenuCategory[];
    platforms: DeliveryPlatform[];
    printers: Printer[];
    isLoading: boolean;
    error: string | null;
    lastSynced: Date | null;
    activePriceListId: string | null;

    // Async Actions (API)
    fetchMenu: (availableOnly?: boolean) => Promise<void>;

    // Category Actions
    addCategory: (menuId: string, category: MenuCategory) => Promise<void>;
    updateCategory: (category: MenuCategory) => Promise<void>;
    deleteCategory: (menuId: string, categoryId: string) => Promise<void>;

    // Item Actions
    addMenuItem: (menuId: string, categoryId: string, item: MenuItem) => Promise<void>;
    updateMenuItem: (menuId: string, categoryId: string, item: MenuItem) => Promise<void>;
    deleteMenuItem: (menuId: string, categoryId: string, itemId: string) => Promise<void>;

    // Menu Actions
    addMenu: (menu: RestaurantMenu) => void;
    updateMenu: (menu: RestaurantMenu) => void;
    linkCategoryToMenu: (menuId: string, categoryId: string) => void;
    linkCategory: (menuId: string, categoryId: string) => void; // Alias for linkCategoryToMenu

    // Helpers
    clearError: () => void;
    setCategories: (categories: MenuCategory[]) => void;
    setPriceList: (id: string | null) => void;
}

import { persist } from 'zustand/middleware';

// Start with empty data - will be loaded from database
const INITIAL_MENUS: RestaurantMenu[] = [
    { id: 'menu-1', name: 'Main Menu', isDefault: true, status: 'ACTIVE', targetBranches: ['b1'] }
];

export const useMenuStore = create<MenuState>()(
    persist(
        (set, get) => ({
            menus: INITIAL_MENUS,
            categories: [], // Empty - loads from database
            platforms: [{ id: 'p1', name: 'Store Direct', isActive: true }],
            printers: [],
            isLoading: false,
            error: null,
            lastSynced: null,
            activePriceListId: null,

            // ============ API Actions ============

            fetchMenu: async (availableOnly?: boolean) => {
                set({ isLoading: true, error: null });
                try {
                    const menuData = await menuApi.getFullMenu(availableOnly);

                    // Transform API data to local format
                    const categories: MenuCategory[] = menuData.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        nameAr: cat.nameAr || cat.name_ar,
                        image: cat.image || cat.image_url,
                        icon: cat.icon,
                        targetOrderTypes: cat.targetOrderTypes || cat.target_order_types || [],
                        menuIds: cat.menuIds || cat.menu_ids || ['menu-1'],
                        items: (cat.items || []).map((item: any) => ({
                            id: item.id,
                            name: item.name,
                            nameAr: item.nameAr || item.name_ar,
                            description: item.description,
                            descriptionAr: item.descriptionAr || item.description_ar,
                            price: Number(item.price),
                            image: item.image || item.image_url,
                            categoryId: cat.id,
                            category: cat.name,
                            categoryAr: cat.nameAr || cat.name_ar || cat.name,
                            isAvailable: item.isAvailable !== false && item.is_available !== false,
                            isPopular: item.isPopular || item.is_popular || false,
                            preparationTime: item.preparationTime || item.preparation_time || 15,
                        }))
                    }));

                    set({ categories, isLoading: false, lastSynced: new Date() });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    console.error('Failed to fetch menu:', error);
                }
            },

            // ============ Category Actions ============

            addCategory: async (menuId, category) => {
                set({ isLoading: true, error: null });
                try {
                    await menuApi.createCategory({
                        id: category.id,
                        name: category.name,
                        nameAr: category.nameAr,
                        image: category.image,
                        icon: category.icon,
                        menuIds: category.menuIds,
                        targetOrderTypes: category.targetOrderTypes,
                        isActive: true
                    });

                    set((state) => ({
                        categories: [...state.categories, { ...category, menuIds: [menuId], items: category.items || [] }],
                        isLoading: false
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            updateCategory: async (category) => {
                set({ isLoading: true, error: null });
                try {
                    await menuApi.updateCategory(category.id, {
                        name: category.name,
                        nameAr: category.nameAr,
                        image: category.image,
                        icon: category.icon,
                        menuIds: category.menuIds,
                        targetOrderTypes: category.targetOrderTypes,
                    });

                    set((state) => ({
                        categories: state.categories.map(c => c.id === category.id ? category : c),
                        isLoading: false
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            deleteCategory: async (menuId, categoryId) => {
                try {
                    await menuApi.deleteCategory(categoryId);

                    set((state) => ({
                        categories: state.categories.filter(c => c.id !== categoryId)
                    }));
                } catch (error: any) {
                    console.error('Failed to delete category:', error);
                    throw error;
                }
            },

            // ============ Item Actions ============

            addMenuItem: async (menuId, categoryId, item) => {
                set({ isLoading: true });
                try {
                    await menuApi.createItem({
                        id: item.id,
                        categoryId: categoryId,
                        name: item.name,
                        nameAr: item.nameAr,
                        description: item.description,
                        descriptionAr: item.descriptionAr,
                        price: item.price,
                        image: item.image,
                        isAvailable: item.isAvailable !== false,
                        isPopular: item.isPopular,
                        preparationTime: item.preparationTime,
                    });

                    set((state) => {
                        const targetCat = state.categories.find(c => c.id === categoryId);
                        const itemWithCategory = {
                            ...item,
                            category: targetCat?.name || 'General',
                            categoryAr: targetCat?.nameAr || targetCat?.name || 'عام',
                            categoryId
                        };

                        return {
                            categories: state.categories.map(c =>
                                c.id === categoryId ? { ...c, items: [...c.items, itemWithCategory] } : c
                            ),
                            isLoading: false
                        };
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            updateMenuItem: async (menuId, categoryId, item) => {
                try {
                    await menuApi.updateItem(item.id, {
                        categoryId: categoryId,
                        name: item.name,
                        nameAr: item.nameAr,
                        description: item.description,
                        price: item.price,
                        image: item.image,
                        isAvailable: item.isAvailable,
                        isPopular: item.isPopular,
                    });

                    set((state) => {
                        const targetCat = state.categories.find(c => c.id === categoryId);
                        const updatedItem = {
                            ...item,
                            category: targetCat?.name || 'General',
                            categoryAr: targetCat?.nameAr || targetCat?.name || 'عام',
                            categoryId
                        };

                        // Remove item from its current category first (to handle moves)
                        const updatedCategories = state.categories.map(c => ({
                            ...c,
                            items: c.items.filter(i => i.id !== item.id)
                        }));

                        // Add/Update item in the target category
                        return {
                            categories: updatedCategories.map(c =>
                                c.id === categoryId ? { ...c, items: [...c.items, updatedItem] } : c
                            )
                        };
                    });
                    console.log('✅ Menu item updated successfully');
                } catch (error: any) {
                    console.error('Failed to update item:', error);
                    throw error;
                }
            },

            deleteMenuItem: async (menuId, categoryId, itemId) => {
                try {
                    await menuApi.deleteItem(itemId);

                    set((state) => ({
                        categories: state.categories.map(c =>
                            c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
                        )
                    }));
                } catch (error: any) {
                    console.error('Failed to delete item:', error);
                    throw error;
                }
            },

            // ============ Menu Actions ============

            addMenu: (menu) => set((state) => ({ menus: [...state.menus, menu] })),
            updateMenu: (menu) => set((state) => ({ menus: state.menus.map(m => m.id === menu.id ? menu : m) })),

            linkCategoryToMenu: (menuId, categoryId) => set((state) => ({
                categories: state.categories.map(c =>
                    c.id === categoryId && !c.menuIds.includes(menuId)
                        ? { ...c, menuIds: [...c.menuIds, menuId] }
                        : c
                )
            })),

            // Alias for linkCategoryToMenu (backward compatibility)
            linkCategory: (menuId, categoryId) => set((state) => ({
                categories: state.categories.map(c =>
                    c.id === categoryId && !c.menuIds.includes(menuId)
                        ? { ...c, menuIds: [...c.menuIds, menuId] }
                        : c
                )
            })),

            // ============ Helpers ============

            clearError: () => set({ error: null }),
            setCategories: (categories) => set({ categories }),
            setPriceList: (id) => set({ activePriceListId: id }),
        }),
        {
            name: 'menu-storage',
            // Only persist menus and UI state, NOT categories/items which must come from DB
            partialize: (state) => ({
                menus: state.menus,
                platforms: state.platforms,
                activePriceListId: state.activePriceListId
            }),
        }
    )
);
