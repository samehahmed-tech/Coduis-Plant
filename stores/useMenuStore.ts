
import { create } from 'zustand';
import { RestaurantMenu, MenuCategory, MenuItem, DeliveryPlatform, Printer } from '../types';

interface MenuState {
    menus: RestaurantMenu[];
    categories: MenuCategory[];
    platforms: DeliveryPlatform[];
    printers: Printer[];

    // Actions
    addMenuItem: (menuId: string, categoryId: string, item: MenuItem) => void;
    updateMenuItem: (menuId: string, categoryId: string, item: MenuItem) => void;
    deleteMenuItem: (menuId: string, categoryId: string, itemId: string) => void;

    addCategory: (menuId: string, category: MenuCategory) => void;
    updateCategory: (category: MenuCategory) => void;
    deleteCategory: (menuId: string, categoryId: string) => void;

    addMenu: (menu: RestaurantMenu) => void;
    updateMenu: (menu: RestaurantMenu) => void;
    linkCategoryToMenu: (menuId: string, categoryId: string) => void;
}

const INITIAL_MENUS: RestaurantMenu[] = [
    { id: 'menu-1', name: 'Main Menu', isDefault: true, status: 'ACTIVE', targetBranches: ['b1'] }
];

const INITIAL_CATEGORIES: MenuCategory[] = [
    {
        id: 'cat-1', name: 'Burgers', nameAr: 'برجر', menuIds: ['menu-1'], items: [
            {
                id: 'itm-1', name: 'Classic Beef Burger', nameAr: 'برجر لحم كلاسيك', price: 150, categoryId: 'cat-1', isAvailable: true, description: 'Juicy beef patty with fresh lettuce and tomato',
                modifierGroups: [
                    {
                        id: 'mod-g-1', name: 'Addons', minSelection: 0, maxSelection: 3, options: [
                            { id: 'opt-1', name: 'Extra Cheese', price: 20 },
                            { id: 'opt-2', name: 'Bacon', price: 35 }
                        ]
                    }
                ],
                recipe: [
                    { itemId: 'inv-1', quantity: 1, unit: 'pcs' }, // Beef Patty
                    { itemId: 'inv-2', quantity: 1, unit: 'pcs' }, // Bun
                    { itemId: 'inv-4', quantity: 0.1, unit: 'head' }, // Lettuce
                    { itemId: 'inv-3', quantity: 0.1, unit: 'kg' }, // Tomato
                ]
            },
            { id: 'itm-2', name: 'Cheese Burger', nameAr: 'تشيز برجر', price: 170, categoryId: 'cat-1', isAvailable: true, recipe: [{ itemId: 'inv-1', quantity: 1, unit: 'pcs' }, { itemId: 'inv-2', quantity: 1, unit: 'pcs' }, { itemId: 'inv-5', quantity: 0.05, unit: 'kg' }] },
            { id: 'itm-3', name: 'Double Trouble', nameAr: 'دبل برجر', price: 240, categoryId: 'cat-1', isAvailable: true, recipe: [{ itemId: 'inv-1', quantity: 2, unit: 'pcs' }, { itemId: 'inv-2', quantity: 1, unit: 'pcs' }] }
        ]
    },
    {
        id: 'cat-2', name: 'Pizza', nameAr: 'بيتزا', menuIds: ['menu-1'], items: [
            { id: 'itm-4', name: 'Margherita', nameAr: 'مارجريتا', price: 120, categoryId: 'cat-2', isAvailable: true, recipe: [{ itemId: 'inv-6', quantity: 1, unit: 'pcs' }, { itemId: 'inv-5', quantity: 0.2, unit: 'kg' }] },
            { id: 'itm-5', name: 'Pepperoni', nameAr: 'بيبروني', price: 160, categoryId: 'cat-2', isAvailable: true, recipe: [{ itemId: 'inv-6', quantity: 1, unit: 'pcs' }, { itemId: 'inv-5', quantity: 0.2, unit: 'kg' }] },
            { id: 'itm-6', name: 'BBQ Chicken', nameAr: 'دجاج باربيكيو', price: 180, categoryId: 'cat-2', isAvailable: true, recipe: [{ itemId: 'inv-6', quantity: 1, unit: 'pcs' }, { itemId: 'inv-5', quantity: 0.2, unit: 'kg' }] }
        ]
    },
    {
        id: 'cat-3', name: 'Drinks', nameAr: 'مشروبات', menuIds: ['menu-1'], items: [
            { id: 'itm-7', name: 'Cola', nameAr: 'كولا', price: 30, categoryId: 'cat-3', isAvailable: true, recipe: [{ itemId: 'inv-7', quantity: 1, unit: 'pcs' }] },
            { id: 'itm-8', name: 'Water', nameAr: 'مياه', price: 15, categoryId: 'cat-3', isAvailable: true },
            { id: 'itm-9', name: 'Fresh Orange Juice', nameAr: 'عصير برتقال', price: 50, categoryId: 'cat-3', isAvailable: true }
        ]
    }
];

export const useMenuStore = create<MenuState>((set) => ({
    menus: INITIAL_MENUS,
    categories: INITIAL_CATEGORIES,
    platforms: [{ id: 'p1', name: 'Store Direct', isActive: true }],
    printers: [],

    addMenuItem: (menuId, categoryId, item) => set((state) => ({
        categories: state.categories.map(c =>
            c.id === categoryId ? { ...c, items: [...c.items, item] } : c
        )
    })),

    updateMenuItem: (menuId, categoryId, item) => set((state) => ({
        categories: state.categories.map(c =>
            c.id === categoryId ? { ...c, items: c.items.map(i => i.id === item.id ? item : i) } : c
        )
    })),

    deleteMenuItem: (menuId, categoryId, itemId) => set((state) => ({
        categories: state.categories.map(c =>
            c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
        )
    })),

    addCategory: (menuId, category) => set((state) => ({
        categories: [...state.categories, { ...category, menuIds: [menuId] }]
    })),

    updateCategory: (category) => set((state) => ({
        categories: state.categories.map(c => c.id === category.id ? category : c)
    })),

    deleteCategory: (menuId, categoryId) => set((state) => ({
        categories: state.categories.map(c => {
            if (c.id !== categoryId) return c;
            return { ...c, menuIds: c.menuIds.filter(id => id !== menuId) };
        }).filter(c => c.menuIds.length > 0)
    })),

    addMenu: (menu) => set((state) => ({ menus: [...state.menus, menu] })),
    updateMenu: (menu) => set((state) => ({ menus: state.menus.map(m => m.id === menu.id ? menu : m) })),

    linkCategoryToMenu: (menuId, categoryId) => set((state) => ({
        categories: state.categories.map(c =>
            c.id === categoryId && !c.menuIds.includes(menuId)
                ? { ...c, menuIds: [...c.menuIds, menuId] }
                : c
        )
    }))
}));
