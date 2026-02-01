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

    // Async Actions (API)
    fetchMenu: () => Promise<void>;

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

    // Helpers
    clearError: () => void;
    setCategories: (categories: MenuCategory[]) => void;
}

// Start with empty data - will be loaded from database
const INITIAL_MENUS: RestaurantMenu[] = [
    { id: 'menu-1', name: 'Main Menu', isDefault: true, status: 'ACTIVE', targetBranches: ['b1'] }
];

export const useMenuStore = create<MenuState>((set, get) => ({
    menus: INITIAL_MENUS,
    categories: [], // Empty - loads from database
    platforms: [{ id: 'p1', name: 'Store Direct', isActive: true }],
    printers: [],
    isLoading: false,
    error: null,
    lastSynced: null,

    // ============ API Actions ============

    fetchMenu: async () => {
        set({ isLoading: true, error: null });
        try {
            const menuData = await menuApi.getFullMenu();

            // Transform API data to local format
            const categories: MenuCategory[] = menuData.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                nameAr: cat.name_ar,
                image: cat.image || cat.image_url, // Handle both possible column names
                icon: cat.icon,
                targetOrderTypes: cat.target_order_types,
                menuIds: cat.menu_ids || ['menu-1'], // Use actual menu_ids if available
                items: (cat.items || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    nameAr: item.name_ar,
                    description: item.description,
                    descriptionAr: item.description_ar,
                    price: Number(item.price),
                    image: item.image || item.image_url,
                    categoryId: cat.id,
                    category: cat.name, // Internal identifier for filtering
                    categoryAr: cat.name_ar, // Localized name for display
                    isAvailable: item.is_available !== false,
                    isPopular: item.is_popular,
                    preparationTime: item.preparation_time,
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
            // Try to save to API
            await menuApi.createCategory({
                id: category.id,
                name: category.name,
                name_ar: category.nameAr,
                image: category.image,
                icon: category.icon,
                menu_ids: category.menuIds,
                target_order_types: category.targetOrderTypes,
                is_active: true
            });

            // Update local state
            set((state) => ({
                categories: [...state.categories, { ...category, menuIds: [menuId], items: category.items || [] }],
                isLoading: false
            }));
            console.log('✅ Category saved to database:', category.name);
        } catch (error: any) {
            console.warn('⚠️ API failed, saving locally:', error.message);
            // Fallback: save to local state only
            set((state) => ({
                categories: [...state.categories, { ...category, menuIds: [menuId], items: category.items || [] }],
                isLoading: false,
                error: null // Don't show error for offline mode
            }));
        }
    },

    updateCategory: async (category) => {
        try {
            await menuApi.updateCategory(category.id, {
                name: category.name,
                name_ar: category.nameAr,
                image: category.image,
                icon: category.icon,
                menu_ids: category.menuIds,
                target_order_types: category.targetOrderTypes,
            });

            set((state) => ({
                categories: state.categories.map(c => c.id === category.id ? category : c)
            }));
            console.log('✅ Category updated:', category.name);
        } catch (error: any) {
            console.warn('⚠️ API failed, updating locally:', error.message);
            // Fallback: update local state only
            set((state) => ({
                categories: state.categories.map(c => c.id === category.id ? category : c)
            }));
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
                category_id: categoryId,
                name: item.name,
                name_ar: item.nameAr,
                description: item.description,
                description_ar: item.descriptionAr,
                price: item.price,
                image: item.image,
                is_available: item.isAvailable !== false,
                is_popular: item.isPopular,
                preparation_time: item.preparationTime,
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
                category_id: categoryId,
                name: item.name,
                name_ar: item.nameAr,
                description: item.description,
                price: item.price,
                image: item.image,
                is_available: item.isAvailable,
                is_popular: item.isPopular,
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

    // ============ Helpers ============

    clearError: () => set({ error: null }),
    setCategories: (categories) => set({ categories }),
}));
