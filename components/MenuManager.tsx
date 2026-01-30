
import React, { useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Tag, 
  Layers, Clock, CheckCircle2, AlertCircle, 
  ChevronRight, MoreVertical, Image as ImageIcon,
  DollarSign, Percent, Gift, Eye, EyeOff, Scale, 
  Save, X, Info
} from 'lucide-react';
import { RestaurantMenu, MenuItem, Offer, MenuCategory, InventoryItem, RecipeIngredient } from '../types';

interface MenuManagerProps {
  inventory: InventoryItem[];
  menus: RestaurantMenu[];
  onUpdateMenuItem: (menuId: string, categoryId: string, updatedItem: MenuItem) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({ inventory, menus, onUpdateMenuItem }) => {
  const [activeTab, setActiveTab] = useState<'MENUS' | 'OFFERS'>('MENUS');
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || '');
  
  // Track which item we're editing recipes for
  const [editingRecipe, setEditingRecipe] = useState<{
    menuId: string;
    categoryId: string;
    item: MenuItem;
    tempRecipe: RecipeIngredient[];
  } | null>(null);

  // New Ingredient Input State
  const [newIngredientId, setNewIngredientId] = useState('');
  const [newIngredientQty, setNewIngredientQty] = useState<number>(0);

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  const handleOpenRecipe = (menuId: string, categoryId: string, item: MenuItem) => {
    setEditingRecipe({
      menuId,
      categoryId,
      item,
      tempRecipe: item.recipe ? [...item.recipe] : []
    });
  };

  const addIngredientToTemp = () => {
    if (!newIngredientId || newIngredientQty <= 0) return;
    
    setEditingRecipe(prev => {
      if (!prev) return null;
      // Check if already exists, update qty instead
      const existingIdx = prev.tempRecipe.findIndex(ri => ri.inventoryItemId === newIngredientId);
      let nextRecipe = [...prev.tempRecipe];
      
      if (existingIdx !== -1) {
        nextRecipe[existingIdx] = { ...nextRecipe[existingIdx], quantityNeeded: nextRecipe[existingIdx].quantityNeeded + newIngredientQty };
      } else {
        nextRecipe.push({ inventoryItemId: newIngredientId, quantityNeeded: newIngredientQty });
      }
      
      return { ...prev, tempRecipe: nextRecipe };
    });
    
    setNewIngredientId('');
    setNewIngredientQty(0);
  };

  const removeIngredientFromTemp = (inventoryItemId: string) => {
    setEditingRecipe(prev => {
      if (!prev) return null;
      return { ...prev, tempRecipe: prev.tempRecipe.filter(ri => ri.inventoryItemId !== inventoryItemId) };
    });
  };

  const handleSaveRecipe = () => {
    if (!editingRecipe) return;
    const updatedItem = { ...editingRecipe.item, recipe: editingRecipe.tempRecipe };
    onUpdateMenuItem(editingRecipe.menuId, editingRecipe.categoryId, updatedItem);
    setEditingRecipe(null);
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors animate-fade-in relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Menu Catalog</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Link your menu to your stock with precision recipes.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all">
            <Plus size={20} /> Create New Menu
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setActiveTab('MENUS')} className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'MENUS' ? 'text-indigo-600' : 'text-slate-400'}`}>
          Active Menus {activeTab === 'MENUS' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('OFFERS')} className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative ${activeTab === 'OFFERS' ? 'text-indigo-600' : 'text-slate-400'}`}>
          Promotions {activeTab === 'OFFERS' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           {menus.map(menu => (
              <button key={menu.id} onClick={() => setSelectedMenuId(menu.id)} className={`w-full text-left p-5 rounded-3xl border transition-all ${selectedMenuId === menu.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-1' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm">{menu.name}</span>
                  {menu.isDefault && <CheckCircle2 size={14} className="text-indigo-200"/>}
                </div>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{menu.status} • {menu.categories.length} Groups</span>
              </button>
           ))}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-10">
          {selectedMenu?.categories.map(category => (
            <div key={category.id} className="space-y-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">{category.name}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {category.items.map(item => {
                  const hasRecipe = item.recipe && item.recipe.length > 0;
                  return (
                    <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <ImageIcon size={24} />
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-800 dark:text-white">${item.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <h5 className="font-black text-lg text-slate-800 dark:text-white mb-1">{item.name}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 h-8">{item.description}</p>

                      <div className="mt-auto space-y-3">
                        {hasRecipe ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-100 dark:border-green-800/50">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Recipe Linked ({item.recipe!.length} items)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-100 dark:border-amber-800/50">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">No Ingredients Linked</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenRecipe(selectedMenu.id, category.id, item)} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
                              hasRecipe 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            <Scale size={14}/> {hasRecipe ? 'Edit Recipe' : 'Link Stock Items'}
                          </button>
                          <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-red-600 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECIPE MANAGEMENT MODAL */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                       <Scale size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800 dark:text-white">Recipe: {editingRecipe.item.name}</h3>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage components from inventory</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingRecipe(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                   <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 {/* Existing Ingredients List */}
                 <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Info size={14} /> Current Ingredients
                    </h4>
                    <div className="space-y-2">
                       {editingRecipe.tempRecipe.map((ri, idx) => {
                          const inv = inventory.find(i => i.id === ri.inventoryItemId);
                          return (
                            <div key={ri.inventoryItemId} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                                     {inv?.name.charAt(0) || '?'}
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-800 dark:text-white leading-tight">{inv?.name || 'Unknown Item'}</p>
                                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Stock: {inv?.quantity || 0} {inv?.unit}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     <span className="text-lg font-black text-indigo-600">{ri.quantityNeeded}</span>
                                     <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-tight">{inv?.unit}</span>
                                  </div>
                                  <button onClick={() => removeIngredientFromTemp(ri.inventoryItemId)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16}/>
                                  </button>
                               </div>
                            </div>
                          );
                       })}
                       {editingRecipe.tempRecipe.length === 0 && (
                         <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Layers size={32} className="mx-auto text-slate-300 mb-2 opacity-50" />
                            <p className="text-sm text-slate-500 font-medium">No ingredients linked. Orders won't affect stock.</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Add New Ingredient Section */}
                 <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/40">
                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">Add Ingredient</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-indigo-400 ml-1 tracking-wider">Stock Item</label>
                          <select 
                            value={newIngredientId}
                            onChange={(e) => setNewIngredientId(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none outline-none text-sm font-bold shadow-sm dark:text-white"
                          >
                             <option value="">Select Item...</option>
                             {inventory.map(inv => (
                               <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-indigo-400 ml-1 tracking-wider">Qty Needed</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={newIngredientQty || ''}
                            onChange={(e) => setNewIngredientQty(parseFloat(e.target.value))}
                            placeholder="0.00" 
                            className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-none outline-none text-sm font-bold shadow-sm dark:text-white" 
                          />
                       </div>
                    </div>
                    <button 
                      onClick={addIngredientToTemp}
                      disabled={!newIngredientId || newIngredientQty <= 0}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                       <Plus size={18} /> Add Component
                    </button>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-950/50">
                 <button onClick={() => setEditingRecipe(null)} className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">
                   Cancel
                 </button>
                 <button 
                  onClick={handleSaveRecipe}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                 >
                   <Save size={20} /> Update Stock Link
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
