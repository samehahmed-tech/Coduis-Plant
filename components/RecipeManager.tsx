
import React, { useState, useMemo } from 'react';
import {
    ChefHat,
    Plus,
    Trash2,
    Calculator,
    Scale,
    Save,
    Search,
    ArrowRight,
    AlertCircle,
    TrendingUp,
    DollarSign,
    Package,
    ChevronRight
} from 'lucide-react';
import {
    MenuItem,
    InventoryItem,
    RecipeIngredient,
    MenuCategory
} from '../types';

interface RecipeManagerProps {
    menuItems: MenuItem[];
    inventoryItems: InventoryItem[];
    categories: MenuCategory[];
    onUpdateRecipe: (menuItemId: string, recipe: RecipeIngredient[]) => void;
    lang: 'en' | 'ar';
    t: any;
    currencySymbol: string;
}

const RecipeManager: React.FC<RecipeManagerProps> = ({
    menuItems,
    inventoryItems,
    categories,
    onUpdateRecipe,
    lang,
    t,
    currencySymbol
}) => {
    const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [recipeSearch, setRecipeSearch] = useState('');

    const selectedMenuItem = useMemo(() =>
        menuItems.find(item => item.id === selectedMenuItemId),
        [menuItems, selectedMenuItemId]
    );

    const [currentRecipe, setCurrentRecipe] = useState<RecipeIngredient[]>([]);

    // Local state for temporary recipe edits
    React.useEffect(() => {
        if (selectedMenuItem) {
            setCurrentRecipe(selectedMenuItem.recipe || []);
        }
    }, [selectedMenuItem]);

    const filteredMenuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const availableInventory = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(recipeSearch.toLowerCase())
    );

    const addIngredient = (item: InventoryItem) => {
        if (currentRecipe.some(ing => ing.itemId === item.id)) return;
        setCurrentRecipe([...currentRecipe, {
            itemId: item.id,
            quantity: 1,
            unit: item.unit
        }]);
    };

    const removeIngredient = (itemId: string) => {
        setCurrentRecipe(currentRecipe.filter(ing => ing.itemId !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        setCurrentRecipe(currentRecipe.map(ing =>
            ing.itemId === itemId ? { ...ing, quantity } : ing
        ));
    };

    const calculateRecipeCost = () => {
        return currentRecipe.reduce((total, ing) => {
            const invItem = inventoryItems.find(i => i.id === ing.itemId);
            return total + (invItem ? invItem.costPrice * ing.quantity : 0);
        }, 0);
    };

    const totalCost = calculateRecipeCost();
    const margin = selectedMenuItem ? (selectedMenuItem.price - totalCost) : 0;
    const marginPercentage = selectedMenuItem ? (margin / selectedMenuItem.price) * 100 : 0;

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <ChefHat className="text-indigo-600" />
                        {lang === 'ar' ? 'إدارة الوصفات والتكاليف' : 'Recipe & BOM Manager'}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold">
                        {lang === 'ar' ? 'اربط أصناف المنيو بالمكونات الخام وحساب التكلفة تلقائياً.' : 'Link menu items to raw materials and automate cost calculation.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Menu Selection Panel */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                    <div className="card-primary !p-4">
                        <div className="relative mb-4">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={lang === 'ar' ? 'بحث عن صنف...' : 'Search Menu...'}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 font-bold text-xs"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1 max-h-[600px] overflow-y-auto no-scrollbar">
                            {filteredMenuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedMenuItemId(item.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group ${selectedMenuItemId === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-[10px] ${selectedMenuItemId === item.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-lg" /> : item.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-black uppercase truncate leading-tight">{item.name}</p>
                                        <p className={`text-[10px] font-bold ${selectedMenuItemId === item.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {item.price} {currencySymbol}
                                        </p>
                                    </div>
                                    <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedMenuItemId === item.id ? 'text-white' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recipe Editor */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedMenuItem ? (
                        <div className="space-y-6">
                            {/* Statistics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="card-primary !p-4 border-l-4 border-l-indigo-600">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'ar' ? 'سعر البيع' : 'Sale Price'}</p>
                                    <h4 className="text-xl font-black text-slate-800 dark:text-white">{selectedMenuItem.price} {currencySymbol}</h4>
                                </div>
                                <div className="card-primary !p-4 border-l-4 border-l-rose-500">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'ar' ? 'التكلفة المقدرة' : 'Estimated Cost'}</p>
                                    <h4 className="text-xl font-black text-slate-800 dark:text-white">{totalCost.toFixed(2)} {currencySymbol}</h4>
                                </div>
                                <div className="card-primary !p-4 border-l-4 border-l-emerald-500">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{lang === 'ar' ? 'هامش الربح' : 'Profit Margin'}</p>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{margin.toFixed(2)} {currencySymbol}</h4>
                                        <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 px-2 py-0.5 rounded-full">
                                            {marginPercentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Left: Recipe Ingredients */}
                                <div className="card-primary !p-6">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Scale size={18} className="text-indigo-600" />
                                            {lang === 'ar' ? 'المكونات الحالية' : 'Active Ingredients'}
                                        </div>
                                        <button
                                            onClick={() => onUpdateRecipe(selectedMenuItem.id, currentRecipe)}
                                            className="btn-theme bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                        >
                                            <Save size={14} />
                                            <span className="text-[10px] font-black uppercase">{lang === 'ar' ? 'حفظ الوصفة' : 'Save Recipe'}</span>
                                        </button>
                                    </h3>

                                    <div className="space-y-2">
                                        {currentRecipe.length === 0 ? (
                                            <div className="py-12 flex flex-col items-center text-slate-400">
                                                <AlertCircle size={40} className="mb-4 opacity-20" />
                                                <p className="text-xs font-bold">{lang === 'ar' ? 'لم يتم إضافة مكونات بعد' : 'No ingredients added yet.'}</p>
                                            </div>
                                        ) : (
                                            currentRecipe.map(ing => {
                                                const invItem = inventoryItems.find(i => i.id === ing.itemId);
                                                return (
                                                    <div key={ing.itemId} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                            <Package size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black uppercase text-slate-800 dark:text-white leading-tight">{invItem?.name || 'Unknown'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">Cost: {invItem?.costPrice} / {invItem?.unit}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                className="w-16 bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-1 px-2 font-black text-xs text-center focus:ring-2 focus:ring-indigo-500/20"
                                                                value={ing.quantity}
                                                                onChange={e => updateQuantity(ing.itemId, parseFloat(e.target.value) || 0)}
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-500 w-8">{ing.unit}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeIngredient(ing.itemId)}
                                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Right: Inventory Picker */}
                                <div className="card-primary !p-6 h-fit">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                        <Search size={18} className="text-indigo-600" />
                                        {lang === 'ar' ? 'إضافة من المخزن' : 'Add from Warehouse'}
                                    </h3>

                                    <div className="relative mb-6">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={lang === 'ar' ? 'بحث في المخزون...' : 'Search Inventory...'}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 font-bold text-xs"
                                            value={recipeSearch}
                                            onChange={e => setRecipeSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                        {availableInventory.map(item => {
                                            const isAdded = currentRecipe.some(ing => ing.itemId === item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    disabled={isAdded}
                                                    onClick={() => addIngredient(item)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isAdded ? 'opacity-50 grayscale border-slate-100' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 group'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600">
                                                        <Package size={16} />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate">{item.name}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{item.category}</p>
                                                    </div>
                                                    <Plus size={14} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Insight/Recipe Logic Alert */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600">
                                    <Calculator size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-tight">
                                        {lang === 'ar' ? 'ذكاء المكونات' : 'Inventory Logic'}
                                    </p>
                                    <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400/80 mt-1 leading-relaxed">
                                        {lang === 'ar'
                                            ? 'سيقوم النظام تلقائياً بخصم هذه المكونات من المخزن المحدد بمجرد تنفيذ طلب يحتوي على هذا الصنف. تأكد من دقة الكميات لضمان صحة تقارير الهالك والمخزون.'
                                            : 'The system will automatically deduct these ingredients from the assigned warehouse upon order delivery. Verify quantities to ensure accurate wastage and stock reports.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-primary !p-32 flex flex-col items-center justify-center text-center opacity-50">
                            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-8 border-4 border-white dark:border-slate-900 shadow-xl">
                                <ChefHat size={48} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">{lang === 'ar' ? 'اختار صنف للبدء' : 'Select an Item to Start'}</h3>
                            <p className="text-sm text-slate-500 font-bold mt-2 max-w-sm mx-auto">
                                {lang === 'ar'
                                    ? 'قم باختيار صنف من القائمة الجانبية لتعريف مكونات الوصفة الخاصة به وحساب الهامش الربحي.'
                                    : 'Choose an item from the sidebar to define its recipe components and calculate profit margins.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecipeManager;
