import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Save,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Scale,
  LayoutGrid,
  Printer as PrinterIcon,
  Layers,
  Clock,
  DollarSign,
  Globe,
  History,
  Package,
  ImageIcon,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Tag,
  ShoppingBag,
  Info,
  Lightbulb,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import {
  MenuItem,
  MenuCategory,
  Printer,
  Branch,
  InventoryItem,
  ModifierGroup,
  ModifierOption,
  ItemSize,
  PlatformPrice,
  RecipeIngredient,
} from "../../types";
import ImageUploader from "../common/ImageUploader";
import BarcodeScanner from "../common/BarcodeScanner";
import { barcodeApi } from "../../services/api";

type DrawerTab =
  | "BASIC"
  | "SIZES"
  | "MODIFIERS"
  | "RECIPE"
  | "PRICING"
  | "PLATFORMS"
  | "SCHEDULE"
  | "HISTORY";

interface Props {
  item: MenuItem;
  mode: "ADD" | "EDIT";
  categoryId: string;
  categories: MenuCategory[];
  printers: Printer[];
  branches: Branch[];
  inventory: InventoryItem[];
  onSave: (item: MenuItem, categoryId: string) => void;
  onClose: () => void;
  onDelete?: () => void;
  lang: string;
  currency: string;
}

const ItemDrawer: React.FC<Props> = ({
  item: initialItem,
  mode,
  categoryId: initialCategoryId,
  categories,
  printers,
  branches,
  inventory,
  onSave,
  onClose,
  onDelete,
  lang,
  currency,
}) => {
  // State
  const [item, setItem] = useState<MenuItem>({ ...initialItem });
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [tab, setTab] = useState<DrawerTab>("BASIC");
  const [generatingBarcode, setGeneratingBarcode] = useState(false);

  // Sync state with props
  useEffect(() => {
    setItem({ ...initialItem });
    setActiveCategoryId(initialCategoryId);
  }, [initialItem, initialCategoryId]);

  // Update helper
  const update = (changes: Partial<MenuItem>) =>
    setItem((prev) => ({ ...prev, ...changes }));

  // Handlers
  const handleGenerateBarcode = useCallback(async () => {
    setGeneratingBarcode(true);
    try {
      const result = await barcodeApi.generate();
      update({ barcode: result.barcode });
    } catch (err) {
      console.error("Failed to generate barcode:", err);
    } finally {
      setGeneratingBarcode(false);
    }
  }, []);

  const addSize = () =>
    update({
      sizes: [
        ...(item.sizes || []),
        {
          id: `sz-${Date.now()}`,
          name: "",
          price: item.price,
          isAvailable: true,
        },
      ],
    });
  const updateSize = (sizeId: string, changes: Partial<ItemSize>) =>
    update({
      sizes: (item.sizes || []).map((s) =>
        s.id === sizeId ? { ...s, ...changes } : s,
      ),
    });
  const removeSize = (sizeId: string) =>
    update({ sizes: (item.sizes || []).filter((s) => s.id !== sizeId) });

  const addModGroup = () =>
    update({
      modifierGroups: [
        ...(item.modifierGroups || []),
        {
          id: `mod-${Date.now()}`,
          name: "",
          minSelection: 0,
          maxSelection: 1,
          options: [],
        },
      ],
    });
  const updateModGroup = (gId: string, changes: Partial<ModifierGroup>) =>
    update({
      modifierGroups: (item.modifierGroups || []).map((g) =>
        g.id === gId ? { ...g, ...changes } : g,
      ),
    });
  const removeModGroup = (gId: string) =>
    update({
      modifierGroups: (item.modifierGroups || []).filter((g) => g.id !== gId),
    });
  const addModOption = (gId: string) =>
    update({
      modifierGroups: (item.modifierGroups || []).map((g) =>
        g.id === gId
          ? {
              ...g,
              options: [
                ...g.options,
                { id: `opt-${Date.now()}`, name: "", price: 0 },
              ],
            }
          : g,
      ),
    });
  const updateModOption = (
    gId: string,
    oId: string,
    changes: Partial<ModifierOption>,
  ) =>
    update({
      modifierGroups: (item.modifierGroups || []).map((g) =>
        g.id === gId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === oId ? { ...o, ...changes } : o,
              ),
            }
          : g,
      ),
    });
  const removeModOption = (gId: string, oId: string) =>
    update({
      modifierGroups: (item.modifierGroups || []).map((g) =>
        g.id === gId
          ? { ...g, options: g.options.filter((o) => o.id !== oId) }
          : g,
      ),
    });

  const addPlatformPrice = () =>
    update({
      platformPricing: [
        ...(item.platformPricing || []),
        { platformId: "", price: item.price },
      ],
    });
  const updatePlatformPrice = (idx: number, changes: Partial<PlatformPrice>) =>
    update({
      platformPricing: (item.platformPricing || []).map((p, i) =>
        i === idx ? { ...p, ...changes } : p,
      ),
    });
  const removePlatformPrice = (idx: number) =>
    update({
      platformPricing: (item.platformPricing || []).filter((_, i) => i !== idx),
    });

  const [recipeIngredientId, setRecipeIngredientId] = useState("");
  const [recipeIngredientQty, setRecipeIngredientQty] = useState(0);

  const addRecipeIngredient = () => {
    if (!recipeIngredientId || recipeIngredientQty <= 0) return;
    const inv = inventory.find((i) => i.id === recipeIngredientId);
    if (!inv) return;
    const existing = item.recipe || [];
    const found = existing.find((r) => r.itemId === recipeIngredientId);
    if (found) {
      update({
        recipe: existing.map((r) =>
          r.itemId === recipeIngredientId
            ? { ...r, quantity: r.quantity + recipeIngredientQty }
            : r,
        ),
      });
    } else {
      update({
        recipe: [
          ...existing,
          {
            itemId: recipeIngredientId,
            quantity: recipeIngredientQty,
            unit: String(inv.unit),
          },
        ],
      });
    }
    setRecipeIngredientId("");
    setRecipeIngredientQty(0);
  };

  const removeRecipeIngredient = (itemId: string) => {
    update({
      recipe: (item.recipe || []).filter((ingredient) => ingredient.itemId !== itemId),
    });
  };

  const recipeCost = (item.recipe || []).reduce((sum, r) => {
    const inv = inventory.find((i) => i.id === r.itemId);
    return sum + (inv ? inv.costPrice * r.quantity : 0);
  }, 0);
  const recipeMargin =
    item.price > 0 && recipeCost > 0
      ? ((item.price - recipeCost) / item.price) * 100
      : null;
  const margin =
    item.cost && item.price > 0
      ? ((item.price - item.cost) / item.price) * 100
      : null;
  const activeCategoryLabel =
    categories.find((category) => category.id === activeCategoryId)?.name || "Unassigned";
  const sizeCount = item.sizes?.length || 0;
  const modifierCount = item.modifierGroups?.length || 0;
  const canDelete = mode === "EDIT" && typeof onDelete === "function";

  const toggleBadge = (badgeId: string) => {
    const current = item.dietaryBadges || [];
    update({
      dietaryBadges: current.includes(badgeId)
        ? current.filter((b) => b !== badgeId)
        : [...current, badgeId],
    });
  };

  const toggleDay = (dayId: string) => {
    const current = item.availableDays || [];
    update({
      availableDays: current.includes(dayId)
        ? current.filter((d) => d !== dayId)
        : [...current, dayId],
    });
  };

  const togglePrinter = (pId: string) => {
    const current = item.printerIds || [];
    update({
      printerIds: current.includes(pId)
        ? current.filter((id) => id !== pId)
        : [...current, pId],
    });
  };

  // Guidance Content Engine
  const getGuidance = () => {
    switch (tab) {
      case "BASIC":
        return {
          titleAr: "ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط©",
          titleEn: "Main Identity",
          tipsAr: [
            "ط§ط­ط±طµ ط¹ظ„ظ‰ ظƒطھط§ط¨ط© ط§ط³ظ… ط¬ط°ط§ط¨ ط¨ط§ظ„ظ„ط؛طھظٹظ†.",
            "ط§ظ„ط³ط¹ط± ظ‡ظˆ ط³ط¹ط± ط§ظ„ط¨ظٹط¹ ط§ظ„ظ†ظ‡ط§ط¦ظٹ ظ„ظ„ط¹ظ…ظٹظ„.",
            "ط¨ط§ط±ظƒظˆط¯ ط§ظ„ظ…ظ†طھط¬ ظٹط³ط§ط¹ط¯ظƒ ظپظٹ ط³ط±ط¹ط© ط§ظ„ط¬ط±ط¯ ظˆط§ظ„ط¨ظٹط¹.",
          ],
          tipsEn: [
            "Write catchy names in both languages.",
            "The price is the final retail price.",
            "Barcode helps with inventory and speed.",
          ],
          icon: Info,
        };
      case "SIZES":
        return {
          titleAr: "ط¥ط¯ط§ط±ط© ط§ظ„ط£ط­ط¬ط§ظ…",
          titleEn: "Size Management",
          tipsAr: [
            "ط£ط¶ظپ ط£ط­ط¬ط§ظ… ظ…ط®طھظ„ظپط© ظ„ظ†ظپط³ ط§ظ„ظ…ظ†طھط¬ (طµط؛ظٹط±طŒ ظˆط³ط·طŒ ظƒط¨ظٹط±).",
            "ظƒظ„ ط­ط¬ظ… ظٹظ…ظƒظ† ط£ظ† ظٹظƒظˆظ† ظ„ظ‡ ط³ط¹ط± ظˆطھظƒظ„ظپط© ظ…ط³طھظ‚ظ„ط©.",
            "ظٹظ…ظƒظ†ظƒ ط¥ط®ظپط§ط، ط£ط­ط¬ط§ظ… ظ…ط¹ظٹظ†ط© ظ…ط¤ظ‚طھط§ظ‹.",
          ],
          tipsEn: [
            "Add multiple sizes (S, M, L).",
            "Each size can have its own price/cost.",
            "Hide sizes temporarily if needed.",
          ],
          icon: Package,
        };
      case "MODIFIERS":
        return {
          titleAr: "ط§ظ„ط¥ط¶ط§ظپط§طھ ظˆط§ظ„طھط¹ط¯ظٹظ„ط§طھ",
          titleEn: "Customization",
          tipsAr: [
            'ط£ظ†ط´ط¦ ظ…ط¬ظ…ظˆط¹ط§طھ ظ…ط«ظ„ "ط¥ط¶ط§ظپط§طھ ط§ظ„طµظˆطµ" ط£ظˆ "ط¯ط±ط¬ط© ط§ظ„طھط³ظˆظٹط©".',
            "ط­ط¯ط¯ ط§ط®طھظٹط§ط± ط¥ط¬ط¨ط§ط±ظٹ (Min 1) ط£ظˆ ط§ط®طھظٹط§ط±ظٹ (Min 0).",
            "ظٹظ…ظƒظ†ظƒ ظˆط¶ط¹ طھظƒظ„ظپط© ط¥ط¶ط§ظپظٹط© ظ„ظƒظ„ ط®ظٹط§ط±.",
          ],
          tipsEn: [
            "Create groups for sauces or toppings.",
            "Set mandatory (Min 1) or optional (Min 0).",
            "Add extra costs to specific options.",
          ],
          icon: Layers,
        };
      case "RECIPE":
        return {
          titleAr: "طھظƒظˆظٹظ† ط§ظ„ط±ظٹط³ط¨ظٹ",
          titleEn: "Recipe Tracking",
          tipsAr: [
            "ط§ط±ط¨ط· ط§ظ„ظ…ظ†طھط¬ ط¨ظ…ظˆط§ط¯ ظ…ظ† ط§ظ„ظ…ط®ط²ظˆظ† ظ„ط­ط³ط§ط¨ ط§ظ„طھظƒظ„ظپط© ط¨ط¯ظ‚ط©.",
            "ط¹ظ†ط¯ ط¨ظٹط¹ ط§ظ„ظ…ظ†طھط¬طŒ ط³ظٹطھظ… ط®طµظ… ط§ظ„ظ…ظƒظˆظ†ط§طھ طھظ„ظ‚ط§ط¦ظٹط§ظ‹.",
            "ط±ط§ظ‚ط¨ ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­ ظ„ط¶ظ…ط§ظ† ط§ظ„ط¬ط¯ظˆظ‰ ط§ظ„ظ…ط§ظ„ظٹط©.",
          ],
          tipsEn: [
            "Link items to inventory for exact costing.",
            "Ingredient stock decreases automatically on sale.",
            "Monitor profit margin for financial health.",
          ],
          icon: Scale,
        };
      case "PLATFORMS":
        return {
          titleAr: "ظ‚ظ†ظˆط§طھ ط§ظ„ط¨ظٹط¹ ط§ظ„ط®ط§ط±ط¬ظٹط©",
          titleEn: "Sales Channels",
          tipsAr: [
            "ط­ط¯ط¯ ط£ط³ط¹ط§ط± ظ…ط®طھظ„ظپط© ظ„طھط·ط¨ظٹظ‚ط§طھ ط§ظ„طھظˆطµظٹظ„ (ط·ظ„ط¨ط§طھطŒ ط§ظ„ظ…ظ†ظٹظˆط²).",
            "ط£ط¶ظپ ظ†ط³ط¨ط© ط¹ظ…ظˆظ„ط© ط§ظ„ظ…ظ†طµط© ظ„ط­ط³ط§ط¨ ط±ط¨ط­ظƒ ط§ظ„طµط§ظپظٹ.",
            "طھظ…طھط¹ ط¨ظ…ط±ظˆظ†ط© ط§ظ„طھط³ط¹ظٹط± ظ„ظƒظ„ ظ‚ظ†ط§ط© ط¨ظٹط¹.",
          ],
          tipsEn: [
            "Price items differently for delivery apps.",
            "Add commission % to calculate net profit.",
            "Enjoy pricing flexibility per channel.",
          ],
          icon: Globe,
        };
      default:
        return {
          titleAr: "ط¥ط¹ط¯ط§ط¯ط§طھ ظ…طھظ‚ط¯ظ…ط©",
          titleEn: "Advanced Settings",
          tipsAr: [
            "طھط­ظƒظ… ظپظٹ ظ…ظˆط§ط¹ظٹط¯ ط¸ظ‡ظˆط± ط§ظ„ظ…ظ†طھط¬ ظپظٹ ط§ظ„ظ…ظ†ظٹظˆ.",
            "ط±ط§ط¬ط¹ ط³ط¬ظ„ ط§ظ„طھط؛ظٹظٹط±ط§طھ ظ„ظ„طھط£ظƒط¯ ظ…ظ† ط¯ظ‚ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ.",
            "ط§ط®طھط± ط§ظ„ط·ط§ط¨ط¹ط§طھ ط§ظ„طھظٹ ط³ظٹظڈط·ط¨ط¹ ط¹ظ„ظٹظ‡ط§ ط§ظ„ط·ظ„ط¨.",
          ],
          tipsEn: [
            "Control when an item is visible.",
            "Audit history ensures data integrity.",
            "Select routing for order tickets.",
          ],
          icon: Lightbulb,
        };
    }
  };

  const guidance = getGuidance();

  const tabs: {
    id: DrawerTab;
    icon: React.ElementType;
    labelEn: string;
    labelAr: string;
  }[] = [
    { id: "BASIC", icon: LayoutGrid, labelEn: "General", labelAr: "ط§ظ„ط¹ط§ظ…" },
    { id: "SIZES", icon: Package, labelEn: "Sizes", labelAr: "ط§ظ„ط£ط­ط¬ط§ظ…" },
    {
      id: "MODIFIERS",
      icon: Layers,
      labelEn: "Modifiers",
      labelAr: "ط§ظ„ط¥ط¶ط§ظپط§طھ",
    },
    { id: "RECIPE", icon: Scale, labelEn: "Recipe", labelAr: "ط§ظ„ظ…ظƒظˆظ†ط§طھ" },
    { id: "PRICING", icon: DollarSign, labelEn: "Branches", labelAr: "ط§ظ„ظپط±ظˆط¹" },
    { id: "PLATFORMS", icon: Globe, labelEn: "Delivery", labelAr: "ط§ظ„طھظˆطµظٹظ„" },
    { id: "SCHEDULE", icon: Clock, labelEn: "Schedule", labelAr: "ط§ظ„ط¬ط¯ظˆظ„ط©" },
    { id: "HISTORY", icon: History, labelEn: "Audit", labelAr: "ط§ظ„ط³ط¬ظ„" },
  ];

  const dietaryOptions = [
    { id: "vegan", labelEn: "Vegan", labelAr: "ظ†ط¨ط§طھظٹ طµط±ظپ" },
    { id: "vegetarian", labelEn: "Vegetarian", labelAr: "ظ†ط¨ط§طھظٹ" },
    { id: "spicy", labelEn: "Spicy", labelAr: "ط­ط§ط±" },
    { id: "gluten-free", labelEn: "Gluten Free", labelAr: "ط®ط§ظ„ظٹ ط¬ظ„ظˆطھظٹظ†" },
    { id: "new", labelEn: "New", labelAr: "ط¬ط¯ظٹط¯" },
  ];

  const dayOptions = [
    { id: "mon", en: "Mon", ar: "ط§ظ„ط§ط«ظ†ظٹظ†" },
    { id: "tue", en: "Tue", ar: "ط§ظ„ط«ظ„ط§ط«ط§ط،" },
    { id: "wed", en: "Wed", ar: "ط§ظ„ط£ط±ط¨ط¹ط§ط،" },
    { id: "thu", en: "Thu", ar: "ط§ظ„ط®ظ…ظٹط³" },
    { id: "fri", en: "Fri", ar: "ط§ظ„ط¬ظ…ط¹ط©" },
    { id: "sat", en: "Sat", ar: "ط§ظ„ط³ط¨طھ" },
    { id: "sun", en: "Sun", ar: "ط§ظ„ط£ط­ط¯" },
  ];

  const platformOptions = [
    { id: "talabat", name: "Talabat" },
    { id: "elmenus", name: "elmenus" },
    { id: "uber_eats", name: "Uber Eats" },
    { id: "store_direct", name: "Store Direct" },
  ];

  const inputCls =
    "w-full rounded-[18px] border border-border/20 bg-white/70 px-4 text-[14px] font-semibold text-main shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15 outline-none";
  const subLabelCls =
    "mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-muted/60";
  const sectionCardCls =
    "rounded-[24px] border border-border/15 bg-white/78 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-end p-2 sm:p-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Backdrop â€” High Blurs optimized */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Main Centered Modal Window */}
      <div className="relative z-10 flex w-full max-w-[1380px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-card/92 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl animate-in fade-in slide-in-from-right-8 duration-500">
        {/* Header â€” Floating Style */}
        {/* Header â€” Floating Style */}
        <div className="border-b border-white/10 bg-card/78 px-6 py-5 backdrop-blur-2xl lg:px-8">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-primary/15 bg-primary/10 text-primary">
                <ShoppingBag size={20} />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-[24px] font-black text-main tracking-tight leading-none">
                    {item.name ||
                      (lang === "ar" ? "إضافة صنف جديد" : "Add New Item")}
                  </h2>
                  <p className="text-[12px] font-semibold text-muted/75">
                    {lang === "ar"
                      ? "محرر شامل للهوية والتسعير والتشغيل"
                      : "Edit item details, pricing, availability, and recipe in one place."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                    {mode === "EDIT" ? "Live Edit" : "New Item"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-main">
                    {activeCategoryLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-muted">
                    {sizeCount} {lang === "ar" ? "حجم" : "Sizes"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-muted">
                    {modifierCount} {lang === "ar" ? "إضافة" : "Modifiers"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 p-1.5 backdrop-blur-md no-scrollbar">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`h-10 px-3.5 rounded-[14px] shrink-0 flex items-center gap-2 transition-all duration-300 ${tab === t.id ? "bg-main text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)]" : "text-muted/75 hover:text-main hover:bg-white/7"}`}
                  >
                    <t.icon size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] hidden xl:block">
                      {lang === "ar" ? t.labelAr : t.labelEn}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 text-muted/70 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Body â€” Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content (Left/Center) */}
          <div
            className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 no-scrollbar space-y-10"
            style={{ scrollBehavior: "smooth" }}
          >
            {tab === "BASIC" && (
              <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                {/* First Bento Row: Two huge prominent cards */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left: Identity Card */}
                  <div className={`${sectionCardCls} flex flex-col gap-6`}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                        <Info size={20} />
                      </div>
                      <h3 className="text-[15px] font-black text-main uppercase tracking-[0.14em]">
                        {lang === "ar" ? "ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ†طھط¬" : "Product Identity"}
                      </h3>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label className={subLabelCls}>
                          {lang === "ar" ? "ط§ظ„ط§ط³ظ… ط§ظ„طھط¬ط§ط±ظٹ" : "Trading Name"}
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => update({ name: e.target.value })}
                          className={`${inputCls} !text-[16px] !font-bold !h-14 !rounded-[16px]`}
                          placeholder="e.g. Alfredo Pasta"
                        />
                      </div>
                      <div>
                        <label className={subLabelCls}>
                          {lang === "ar"
                            ? "ط§ظ„ط§ط³ظ… ط¨ط§ظ„ظ„ط؛ط© ط§ظ„ط¹ط±ط¨ظٹط©"
                            : "Arabic Name"}
                        </label>
                        <input
                          type="text"
                          value={item.nameAr || ""}
                          onChange={(e) => update({ nameAr: e.target.value })}
                          className={`${inputCls} text-right font-sans !text-[16px] !font-bold !h-14 !rounded-[16px]`}
                          placeholder="ظ…ط«ط§ظ„: ط¨ط§ط³طھط§ ط§ظ„ظپط±ظٹط¯ظˆ"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Studio & Barcode Card */}
                  <div className="flex flex-col gap-8">
                    <div className={`${sectionCardCls} p-3`}>
                      <div className="relative aspect-[21/10] w-full overflow-hidden rounded-[18px] bg-elevated/50">
                        <ImageUploader
                          value={item.image || ""}
                          onChange={(url) => update({ image: url })}
                          type="item"
                          label=""
                          lang={lang as "en" | "ar"}
                        />
                        {!item.image && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-55">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                              <ImageIcon size={28} strokeWidth={1.5} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                              {lang === "ar"
                                ? "ط§ط±ظپط¹ طµظˆط±ط© ط§ظ„ظ…ظ†طھط¬"
                                : "Studio Asset"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Embedded Barcodes inside the same column */}
                    <div className={`${sectionCardCls} grid grid-cols-2 gap-5 items-center`}>
                      <div className="relative">
                        <label className={subLabelCls}>SKU Code</label>
                        <input
                          type="text"
                          value={item.sku || ""}
                          onChange={(e) => update({ sku: e.target.value })}
                          className={`${inputCls} !h-14 !rounded-[16px] !font-mono`}
                          placeholder="REF-00"
                        />
                      </div>
                      <div className="relative">
                        <label className={subLabelCls}>
                          {lang === "ar" ? "ط¨ط§ط±ظƒظˆط¯" : "Barcode"}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.barcode || ""}
                            onChange={(e) =>
                              update({ barcode: e.target.value })
                            }
                            className={`${inputCls} !h-14 !rounded-[16px]`}
                          />
                          <button
                            onClick={handleGenerateBarcode}
                            disabled={generatingBarcode}
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                          >
                            <Sparkles size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Bento Row: Pricing & Tags spanning full width visually separated */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Pricing - Compact yet aggressive styling */}
                  <div className={`${sectionCardCls} col-span-1 flex flex-col justify-center`}>
                    <label className={subLabelCls}>
                      {lang === "ar" ? "ط§ظ„ط³ط¹ط± ط§ظ„ط­ط§ظ„ظٹ" : "Market Price"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-[18px] font-black text-primary">
                        {currency}
                      </span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          update({ price: parseFloat(e.target.value) || 0 })
                        }
                        className={`${inputCls} !h-16 !rounded-[18px] !pl-14 !text-[28px] !font-black`}
                      />
                    </div>
                  </div>

                  {/* Strategic Tags - Spans 2 cols */}
                  <div className={`${sectionCardCls} col-span-2`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                        <Tag size={20} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-black text-main uppercase tracking-[0.14em]">
                          {lang === "ar"
                            ? "ط§ظ„طھطµظ†ظٹظپ ظˆط§ظ„ظˆط³ظˆظ…"
                            : "Category & Tags"}
                        </h3>
                      </div>
                    </div>
                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="space-y-2">
                        <label className={subLabelCls}>Main Layer</label>
                        <select
                          value={activeCategoryId}
                          onChange={(e) => setActiveCategoryId(e.target.value)}
                          className={`${inputCls} !h-14 !rounded-[16px] text-[14px]`}
                        >
                          <option value="" disabled>
                            Select Layer Category
                          </option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={subLabelCls}>Badges</label>
                        <div className="flex flex-wrap gap-2">
                          {dietaryOptions.map((badge) => (
                            <button
                              key={badge.id}
                              onClick={() => toggleBadge(badge.id)}
                              className={`px-4 h-10 rounded-full text-[11px] font-bold transition-all duration-300 border ${item.dietaryBadges?.includes(badge.id) ? "bg-main border-main text-white" : "bg-white/40 border-border/20 text-muted hover:text-main"}`}
                            >
                              {lang === "ar" ? badge.labelAr : badge.labelEn}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "SIZES" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <Package className="text-primary" />
                    <h3 className="text-[18px] font-black text-white uppercase tracking-widest">
                      {lang === "ar" ? "ظ‚ط§ط¦ظ…ط© ط§ظ„ط£ط­ط¬ط§ظ…" : "Size Inventory"}
                    </h3>
                  </div>
                  <button
                    onClick={addSize}
                    className="px-6 h-11 bg-primary text-white rounded-2xl text-[12px] font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    <Plus size={18} />{" "}
                    {lang === "ar" ? "ط¥ط¶ط§ظپط© ط­ط¬ظ…" : "Add Size"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(item.sizes || []).map((size, idx) => (
                    <div
                      key={size.id}
                      className="glass-1 p-6 flex flex-col md:flex-row items-center gap-6 group"
                    >
                      <div className="w-10 h-10 rounded-[14px] bg-elevated/50 flex items-center justify-center font-black text-primary border border-subtle">
                        {idx + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-6 w-full">
                        <div className="col-span-1">
                          <label className={subLabelCls}>Name</label>
                          <input
                            type="text"
                            value={size.name}
                            onChange={(e) =>
                              updateSize(size.id, { name: e.target.value })
                            }
                            className={`${inputCls} !h-12 !rounded-[14px] text-center font-bold`}
                            placeholder="S / M / L"
                          />
                        </div>
                        <div>
                          <label className={subLabelCls}>Price</label>
                          <input
                            type="number"
                            value={size.price}
                            onChange={(e) =>
                              updateSize(size.id, {
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`${inputCls} !h-12 !rounded-[14px] !bg-emerald-500/[0.04] !border-emerald-500/20 text-emerald-400 font-bold`}
                          />
                        </div>
                        <div>
                          <label className={subLabelCls}>Cost</label>
                          <input
                            type="number"
                            value={size.cost || ""}
                            onChange={(e) =>
                              updateSize(size.id, {
                                cost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`${inputCls} !h-12 !rounded-[14px] !bg-amber-500/[0.04] !border-amber-500/20 text-amber-500 font-bold`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-end">
                        <button
                          onClick={() =>
                            updateSize(size.id, {
                              isAvailable: !size.isAvailable,
                            })
                          }
                          className={`h-12 px-6 rounded-[14px] font-black text-[10px] border transition-all uppercase tracking-wider ${size.isAvailable ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}
                        >
                          {size.isAvailable ? "Active" : "Hidden"}
                        </button>
                        <button
                          onClick={() => removeSize(size.id)}
                          className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-elevated/30 border border-subtle text-muted hover:text-rose-400 hover:border-rose-400/20 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "MODIFIERS" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <Layers className="text-primary" />
                    <h3 className="text-[18px] font-black text-main uppercase tracking-widest">
                      {lang === "ar" ? "طھط®طµظٹطµ ط§ظ„ط®ظٹط§ط±ط§طھ" : "Customization Ops"}
                    </h3>
                  </div>
                  <button
                    onClick={addModGroup}
                    className="px-6 h-11 bg-primary text-white rounded-2xl text-[12px] font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                  >
                    <Plus size={18} />{" "}
                    {lang === "ar" ? "ط¥ط¶ط§ظپط© ظ…ط¬ظ…ظˆط¹ط©" : "Add Group"}
                  </button>
                </div>
                <div className="space-y-8">
                  {(item.modifierGroups || []).map((group) => (
                    <div
                      key={group.id}
                      className="glass-1 p-8 rounded-[32px] relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -z-10" />
                      <div className="flex items-start justify-between gap-8 mb-8">
                        <div className="flex-1 grid md:grid-cols-3 gap-8">
                          <div className="col-span-2">
                            <label className={subLabelCls}>Group Name</label>
                            <input
                              type="text"
                              value={group.name}
                              onChange={(e) =>
                                updateModGroup(group.id, {
                                  name: e.target.value,
                                })
                              }
                              className="bg-transparent border-0 border-b-2 border-subtle text-[24px] font-black text-main w-full focus:ring-0 focus:border-primary pb-2 transition-all placeholder-muted/30"
                              placeholder="e.g. Choose Toppings"
                            />
                          </div>
                          <div className="flex items-center gap-6 bg-elevated/40 p-4 rounded-[16px] border border-subtle">
                            <div className="flex-1">
                              <label className={subLabelCls}>Min</label>
                              <input
                                type="number"
                                value={group.minSelection}
                                onChange={(e) =>
                                  updateModGroup(group.id, {
                                    minSelection: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full h-12 bg-transparent text-center font-black text-[18px] focus:outline-none"
                              />
                            </div>
                            <div className="w-[1px] h-full bg-subtle" />
                            <div className="flex-1">
                              <label className={subLabelCls}>Max</label>
                              <input
                                type="number"
                                value={group.maxSelection}
                                onChange={(e) =>
                                  updateModGroup(group.id, {
                                    maxSelection: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full h-12 bg-transparent text-center font-black text-[18px] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeModGroup(group.id)}
                          className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-elevated/40 border border-subtle text-muted hover:text-rose-400 hover:border-rose-400/20 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="glass-2 p-6 rounded-[24px] space-y-4">
                        <h4 className={subLabelCls}>Options List</h4>
                        {group.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex flex-col sm:flex-row items-center gap-4 group/opt bg-elevated/50 p-3 rounded-[16px] border border-subtle"
                          >
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) =>
                                updateModOption(group.id, opt.id, {
                                  name: e.target.value,
                                })
                              }
                              className="bg-transparent border-none text-[15px] font-bold text-main w-full focus:ring-0"
                              placeholder="Option Name"
                            />
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-black text-emerald-500/40">
                                  +
                                </span>
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) =>
                                    updateModOption(group.id, opt.id, {
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-32 h-12 pl-8 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-[12px] text-center font-black text-emerald-500"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  removeModOption(group.id, opt.id)
                                }
                                className="w-10 h-10 flex items-center justify-center rounded-[12px] text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                              >
                                <Minus size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => addModOption(group.id)}
                          className="mt-2 flex items-center justify-center w-full h-12 border-2 border-dashed border-subtle hover:border-primary/40 rounded-[16px] text-[12px] font-black text-muted hover:text-primary transition-all"
                        >
                          <Plus size={16} className="mr-2" /> ADD NEW CHOICE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "RECIPE" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                {/* Overview Metrics Bento */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="glass-2 p-8 border-amber-500/20 text-center flex flex-col justify-center shadow-[inset_0_2px_15px_rgba(245,158,11,0.03)]">
                    <p className="text-[11px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-3">
                      {lang === "ar" ? "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھظƒظ„ظپط©" : "Total Material Cost"}
                    </p>
                    <h4 className="text-[32px] font-black text-amber-500 leading-none">
                      {currency}
                      {recipeCost.toFixed(2)}
                    </h4>
                  </div>
                  <div className="glass-2 p-8 border-emerald-500/20 text-center flex flex-col justify-center shadow-[inset_0_2px_15px_rgba(16,185,129,0.03)]">
                    <p className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-3">
                      {lang === "ar"
                        ? "ط³ط¹ط± ط§ظ„ط¨ظٹط¹ ط§ظ„ظ…ظ‚طھط±ط­"
                        : "Retail Sale Price"}
                    </p>
                    <h4 className="text-[32px] font-black text-emerald-500 leading-none">
                      {currency}
                      {item.price.toFixed(2)}
                    </h4>
                  </div>
                  <div className="glass-2 p-8 border-primary/20 text-center flex flex-col justify-center shadow-[inset_0_2px_15px_rgba(var(--primary),0.05)] bg-primary/5">
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-3">
                      {lang === "ar" ? "طµط§ظپظٹ ط§ظ„ط±ط¨ط­" : "Projected Margin"}
                    </p>
                    <h4 className="text-[32px] font-black text-primary leading-none">
                      {recipeMargin !== null
                        ? recipeMargin.toFixed(0) + "%"
                        : "â€”"}
                    </h4>
                  </div>
                </div>

                <div className="glass-1 p-10">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-subtle">
                    <h3 className="text-[18px] font-black text-main tracking-widest uppercase flex items-center gap-3">
                      <Scale size={20} className="text-primary" />
                      {lang === "ar"
                        ? "ط§ظ„ظ…ظƒظˆظ†ط§طھ ط§ظ„ظ…ط±ط¨ظˆط·ط©"
                        : "Linked Inventory Assets"}
                    </h3>
                    <div className="h-8 px-4 flex items-center bg-elevated rounded-full text-[10px] font-black text-muted uppercase tracking-widest border border-subtle">
                      {(item.recipe || []).length} ASSETS
                    </div>
                  </div>

                  {/* Add New Ingredient */}
                  <div className="glass-2 p-8 mb-8 border-primary/10 flex flex-col sm:flex-row items-end gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[50px] -z-10 group-focus-within:bg-primary/10 transition-colors" />
                    <div className="flex-1 grid sm:grid-cols-2 gap-6 w-full">
                      <div>
                        <label className={subLabelCls}>Select Asset</label>
                        <select
                          value={recipeIngredientId}
                          onChange={(e) =>
                            setRecipeIngredientId(e.target.value)
                          }
                          className={`${inputCls} !h-14 !rounded-[16px]`}
                        >
                          <option value="">Choose data asset...</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={subLabelCls}>Net Quantity</label>
                        <input
                          type="number"
                          value={recipeIngredientQty || ""}
                          onChange={(e) =>
                            setRecipeIngredientQty(
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className={`${inputCls} !h-14 !rounded-[16px] text-lg font-bold`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addRecipeIngredient}
                      disabled={!recipeIngredientId || recipeIngredientQty <= 0}
                      className="h-14 px-10 bg-primary text-white rounded-[16px] text-[12px] font-black shadow-xl shadow-primary/20 hover:-translate-y-1 transition-transform w-full sm:w-auto uppercase tracking-wider"
                    >
                      Link
                    </button>
                  </div>

                  {/* List */}
                  <div className="space-y-4">
                    {(item.recipe || []).map((ri) => {
                      const inv = inventory.find((i) => i.id === ri.itemId);
                      return (
                        <div
                          key={ri.itemId}
                          className="flex items-center p-6 rounded-[24px] bg-elevated/30 border border-subtle group hover:bg-elevated/60 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-[16px] font-black text-main">
                              {inv?.name || ri.itemId}
                            </p>
                            <p className="text-[12px] font-bold text-muted/60 uppercase tracking-widest">
                              {ri.quantity} {ri.unit} linked
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <p className="text-[18px] font-black text-amber-500 w-24 text-right">
                              {currency}
                              {(inv ? inv.costPrice * ri.quantity : 0).toFixed(
                                2,
                              )}
                            </p>
                            <input
                              type="number"
                              value={ri.quantity}
                              onChange={(e) => {
                                const qty = parseFloat(e.target.value) || 0;
                                update({
                                  recipe: (item.recipe || []).map((r) =>
                                    r.itemId === ri.itemId
                                      ? { ...r, quantity: qty }
                                      : r,
                                  ),
                                });
                              }}
                              className="w-24 h-12 bg-elevated border border-subtle focus:border-primary focus:ring-1 focus:ring-primary rounded-[14px] text-center font-black text-main transition-all"
                            />
                            <button
                              onClick={() => removeRecipeIngredient(ri.itemId)}
                              className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-elevated/50 text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === "SCHEDULE" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                <div className="glass-1 p-10 border-subtle transition-all">
                  <h4 className={subLabelCls}>
                    {lang === "ar"
                      ? "ط£ظٹط§ظ… ط§ظ„طھظˆظپط± ط§ظ„ط£ط³ط¨ظˆط¹ظٹط©"
                      : "WEEKLY AVAILABILITY PROTOCOL"}
                  </h4>
                  <div className="flex flex-wrap gap-4 mt-6">
                    {dayOptions.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => toggleDay(d.id)}
                        className={`flex-1 min-w-[100px] h-14 rounded-[16px] transition-all font-black text-[12px] uppercase tracking-widest border ${item.availableDays?.includes(d.id) ? "bg-primary border-primary text-white shadow-[0_4px_16px_rgba(var(--primary),0.2)]" : "bg-elevated/40 border-subtle text-muted hover:text-main"}`}
                      >
                        {lang === "ar" ? d.ar : d.en}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 p-8 glass-2 rounded-[24px]">
                    <div>
                      <label className={subLabelCls}>Auto-Enable Time</label>
                      <input
                        type="time"
                        value={item.availableFrom || ""}
                        onChange={(e) =>
                          update({ availableFrom: e.target.value })
                        }
                        className={`${inputCls} !h-16 !text-2xl !font-black !px-6 bg-elevated/50 !rounded-[20px] text-center`}
                      />
                    </div>
                    <div>
                      <label className={subLabelCls}>Auto-Disable Time</label>
                      <input
                        type="time"
                        value={item.availableTo || ""}
                        onChange={(e) =>
                          update({ availableTo: e.target.value })
                        }
                        className={`${inputCls} !h-16 !text-2xl !font-black !px-6 bg-elevated/50 !rounded-[20px] text-center`}
                      />
                    </div>
                  </div>
                </div>
                <div className="glass-1 p-10 border-subtle">
                  <h4 className={subLabelCls}>
                    {lang === "ar"
                      ? "طھظˆط¬ظٹظ‡ ط·ظ„ط¨ط§طھ ط§ظ„ظ…ط·ط¨ط®"
                      : "PRODUCTION ROUTING"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    {printers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => togglePrinter(p.id)}
                        className={`h-16 rounded-[16px] border flex items-center justify-center gap-3 transition-all ${item.printerIds?.includes(p.id) ? "bg-amber-500 border-amber-500 text-black shadow-[0_4px_16px_rgba(245,158,11,0.2)]" : "bg-elevated/40 border-subtle text-muted hover:text-main"}`}
                      >
                        <PrinterIcon size={20} />
                        <span className="text-[13px] font-black uppercase tracking-widest">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "HISTORY" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-[18px] font-black text-main tracking-widest uppercase px-4 flex items-center gap-3">
                  <History size={20} className="text-primary" />
                  {lang === "ar"
                    ? "ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„طھظ‚ظ†ظٹ"
                    : "TECHNICAL SYSTEM AUDIT"}
                </h3>
                <div className="glass-1 p-8">
                  <div className="space-y-4">
                    {(!item.versionHistory ||
                      item.versionHistory.length === 0) && (
                      <div className="text-center p-12 text-muted font-bold uppercase tracking-widest border-2 border-dashed border-subtle rounded-[24px]">
                        No history recorded yet
                      </div>
                    )}
                    {[...(item.versionHistory || [])]
                      .reverse()
                      .map((entry, idx) => (
                        <div
                          key={idx}
                          className="p-6 rounded-[24px] bg-elevated/30 border border-subtle flex flex-col md:flex-row items-start md:items-center gap-6 group hover:bg-elevated/60 transition-colors"
                        >
                          <div className="w-1.5 h-full min-h-[40px] rounded-full bg-primary/40 hidden md:block" />
                          <div className="flex-1 w-full">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[12px] font-black text-primary uppercase tracking-widest">
                                {entry.field}
                              </span>
                              <span className="text-[11px] font-bold text-muted/50">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-4 text-[15px] font-bold mt-2 bg-elevated/40 p-3 rounded-[12px] border border-subtle">
                              <span className="text-rose-500/60 line-through decoration-2 px-2 py-1 bg-rose-500/5 rounded-md">
                                {String(entry.oldValue)}
                              </span>
                              <ArrowRight size={16} className="text-muted/30" />
                              <span className="text-emerald-500 px-2 py-1 bg-emerald-500/5 rounded-md">
                                {String(entry.newValue)}
                              </span>
                            </div>
                          </div>
                          <div className="text-left md:text-right w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-subtle">
                            <span className="text-[10px] font-black text-muted/40 uppercase tracking-[0.3em] block mb-1">
                              Operator
                            </span>
                            <span className="text-[13px] font-black text-main bg-elevated px-3 py-1.5 rounded-full border border-subtle">
                              {entry.userName}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guidance Sidebar (Right) â€” Smooth Contextual Info */}
          <div className="hidden w-[320px] shrink-0 border-l border-white/10 bg-white/[0.03] p-6 xl:flex xl:flex-col xl:gap-5 overflow-y-auto no-scrollbar">
            <div
              className="mb-2 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary"
              style={{ "--i": 0 } as any}
            >
              <guidance.icon size={20} />
            </div>
            <h4
              className="text-[14px] font-black text-main uppercase tracking-[0.14em]"
              style={{ "--i": 1 } as any}
            >
              {lang === "ar" ? "ملاحظات سريعة" : "Quick Notes"}
            </h4>
            <p className="mb-4 text-[12px] text-muted/70">
              {lang === "ar" ? guidance.titleAr : guidance.titleEn}
            </p>

            <div className="w-full space-y-3">
              {(lang === "ar" ? guidance.tipsAr : guidance.tipsEn).map(
                (tip, idx) => (
                  <div
                    key={idx}
                    className="rounded-[16px] border border-border/15 bg-white/50 px-4 py-3 text-left"
                    style={{ "--i": idx + 3 } as any}
                  >
                    <p className="text-[13px] font-medium leading-6 text-muted/85">
                      {tip}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div
              className="mt-2 w-full"
              style={{ "--i": 7 } as any}
            >
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-5">
                <h5 className="text-[13px] font-black uppercase tracking-[0.14em] text-main">
                  {lang === "ar" ? "ملخص التشغيل" : "Operational Summary"}
                </h5>
                <p className="hidden">
                  {lang === "ar" ? "ط§ط­طµظ„ ط¹ظ„ظ‰ ط§ظ„ط¯ط¹ظ…" : "LIVE ASSISTANCE"}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-[16px] border border-border/15 bg-white/40 px-4 py-3 text-[13px]">
                    <span className="text-muted/75">{lang === "ar" ? "الأحجام" : "Sizes"}</span>
                    <span className="font-bold text-main">{sizeCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[16px] border border-border/15 bg-white/40 px-4 py-3 text-[13px]">
                    <span className="text-muted/75">{lang === "ar" ? "الإضافات" : "Modifiers"}</span>
                    <span className="font-bold text-main">{modifierCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[16px] border border-border/15 bg-white/40 px-4 py-3 text-[13px]">
                    <span className="text-muted/75">{lang === "ar" ? "المكونات" : "Recipe Items"}</span>
                    <span className="font-bold text-main">{item.recipe?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer â€” Massive Single Action */}
        <div className="min-h-24 border-t border-white/10 bg-card/72 px-6 py-4 backdrop-blur-2xl lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button
              onClick={onClose}
              className="theme-btn-ghost h-12 px-6 text-[13px] font-bold text-muted"
            >
              {lang === "ar" ? "ط¥ظ„ط؛ط§ط، ط§ظ„طھط؛ظٹظٹط±ط§طھ" : "Discard All"}
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                className="h-12 px-5 rounded-[14px] border border-rose-500/20 bg-rose-500/10 text-[12px] font-bold text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
              >
                {lang === "ar" ? "ط­ط°ظپ ط§ظ„طµظ†ظپ" : "Delete Item"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {mode === "EDIT" && (
              <div className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-4 text-[12px] font-semibold text-emerald-500">
                <CheckCircle2 size={15} />
                {lang === "ar" ? "بيانات الصنف جاهزة للحفظ" : "Item is ready to save"}
              </div>
            )}
            <button
              onClick={() => onSave(item, activeCategoryId)}
              disabled={!item.name?.trim()}
              className="group relative h-12 overflow-hidden rounded-[16px] bg-primary px-8 shadow-[0_16px_40px_rgba(var(--primary),0.28)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:grayscale disabled:opacity-30 disabled:translate-y-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <div className="relative flex items-center gap-3">
                <Save size={18} className="text-white" />
                <span className="text-[13px] font-black uppercase tracking-[0.18em] text-white">
                  {lang === "ar" ? "طھط·ط¨ظٹظ‚ ظˆط­ظپط¸" : "Deploy & Sync"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ItemDrawer };
export default ItemDrawer;
