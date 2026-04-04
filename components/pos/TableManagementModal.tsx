import React, { useState, useMemo } from 'react';
import {
    X, ArrowLeftRight, Split, Move, Users,
    ShoppingCart, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Table, Order, TableStatus, OrderStatus } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TableManagementModalProps {
    sourceTable: Table;
    allTables: Table[];
    orders: Order[];
    onClose: () => void;
    onCloseTable: (tableId: string) => void;
    onMergeTables: (targetTableId: string, itemIds: string[]) => void;
    onTransferTable: (targetTableId: string) => void;
    onTransferItems: (targetTableId: string, itemIds: string[]) => void;
    onSplitTable: (targetTableId: string, itemIds: string[]) => void;
    onEditOrder: () => void;
    lang: 'en' | 'ar';
}

const TableManagementModal: React.FC<TableManagementModalProps> = ({
    sourceTable,
    allTables,
    orders,
    onClose,
    onCloseTable,
    onMergeTables,
    onTransferTable,
    onTransferItems,
    onSplitTable,
    onEditOrder,
    lang
}) => {
    const [mode, setMode] = useState<'ACTIONS' | 'TRANSFER_ALL' | 'TRANSFER_ITEMS' | 'SPLIT' | 'MERGE'>('ACTIONS');
    const [targetTableId, setTargetTableId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const isRTL = lang === 'ar';

    const activeOrder = useMemo(() =>
        orders.find(o => o.tableId === sourceTable.id && o.status !== OrderStatus.DELIVERED),
        [orders, sourceTable.id]);

    const availableTables = useMemo(() =>
        allTables.filter(t => t.id !== sourceTable.id && t.status === TableStatus.AVAILABLE),
        [allTables, sourceTable.id]);

    const occupiedTables = useMemo(() =>
        allTables.filter(
            t =>
                t.id !== sourceTable.id &&
                (
                    t.status === TableStatus.OCCUPIED ||
                    t.status === TableStatus.WAITING_FOOD ||
                    t.status === TableStatus.READY_TO_PAY
                )
        ),
        [allTables, sourceTable.id]);

    const toggleItem = (cartId: string) => {
        setSelectedItems(prev =>
            prev.includes(cartId) ? prev.filter(id => id !== cartId) : [...prev, cartId]
        );
    };

    const t = isRTL ? {
        title: `إدارة طاولة ${sourceTable.name}`,
        edit: 'تعديل الطلب / إضافة أصناف',
        transfer_all: 'نقل الطلب بالكامل',
        transfer_items: 'نقل أصناف محددة',
        split: 'تقسيم الطاولة (فتح طاولة جديدة)',
        merge: 'دمج الطلب مع طاولة مشغولة',
        select_target: 'اختر الطاولة المستهدفة',
        select_items: 'اختر الأصناف المراد نقلها',
        confirm: 'تأكيد العملية',
        cancel: 'إلغاء',
        no_order: 'لا يوجد طلب نشط لهذه الطاولة',
        items: 'الأصناف',
        available: 'طاولات متاحة',
        occupied: 'طاولات مشغولة'
    } : {
        title: `Manage Table ${sourceTable.name}`,
        edit: 'Edit Order / Add Items',
        transfer_all: 'Transfer Entire Order',
        transfer_items: 'Transfer Specific Items',
        split: 'Split Table (New Order)',
        merge: 'Merge With Occupied Table',
        select_target: 'Select Target Table',
        select_items: 'Select Items to Move',
        confirm: 'Confirm Action',
        cancel: 'Cancel',
        no_order: 'No active order found for this table',
        items: 'Items',
        available: 'Available Tables',
        occupied: 'Occupied Tables'
    };

    const renderHeader = () => (
        <div className="flex items-center justify-between p-6 border-b border-border/10 bg-elevated/40 relative shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-main text-app rounded-2xl flex items-center justify-center shadow-lg shadow-main/20">
                    <ShoppingCart size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-main uppercase tracking-tight leading-tight">{t.title}</h2>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${activeOrder ? 'text-indigo-500' : 'text-amber-500'}`}>
                        {activeOrder
                            ? `${(activeOrder.items?.length ?? 0)} ${t.items} • ${(activeOrder.total ?? 0).toFixed(2)}`
                            : t.no_order}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-muted hover:text-main hover:bg-elevated rounded-xl transition-all border border-transparent hover:border-border/20 active:scale-95 shadow-sm">
                <X size={20} />
            </button>
        </div>
    );

    const renderActions = () => (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 grid grid-cols-1 gap-3 bg-card overflow-y-auto no-scrollbar">
            <button
                onClick={onEditOrder}
                className="w-full p-5 bg-emerald-500 text-white rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20 active:scale-95 border border-emerald-400"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner pt-0.5"><CheckCircle2 size={24} /></div>
                    <span className="font-black text-sm uppercase tracking-widest">{t.edit}</span>
                </div>
                <ChevronRight size={24} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <button
                onClick={() => onCloseTable(sourceTable.id)}
                disabled={!activeOrder}
                className="w-full p-5 bg-main text-app rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-main/20 active:scale-95 border border-main disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-app/20 rounded-2xl flex items-center justify-center shadow-inner pt-0.5"><CheckCircle2 size={24} /></div>
                    <span className="font-black text-sm uppercase tracking-widest">
                        {isRTL ? 'إغلاق الترابيزة وطباعة الحساب' : 'Close Table & Print Bill'}
                    </span>
                </div>
                <ChevronRight size={24} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <div className="h-px bg-border/20 my-2 mx-4" />

            <button
                onClick={() => setMode('TRANSFER_ALL')} disabled={!activeOrder}
                className="w-full p-5 bg-elevated/40 border border-border/20 text-main rounded-3xl flex items-center justify-between transition-all group hover:bg-indigo-500 hover:text-white hover:border-indigo-500 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-elevated/40 disabled:hover:text-main"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-indigo-500 group-hover:text-white group-hover:bg-white/20 shadow-sm border border-border/20 group-hover:border-transparent transition-all"><ArrowLeftRight size={22} /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t.transfer_all}</span>
                </div>
                <ChevronRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <button
                onClick={() => setMode('TRANSFER_ITEMS')} disabled={!activeOrder}
                className="w-full p-5 bg-elevated/40 border border-border/20 text-main rounded-3xl flex items-center justify-between transition-all group hover:bg-amber-500 hover:text-white hover:border-amber-500 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-elevated/40 disabled:hover:text-main"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-amber-500 group-hover:text-white group-hover:bg-white/20 shadow-sm border border-border/20 group-hover:border-transparent transition-all"><Move size={22} /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t.transfer_items}</span>
                </div>
                <ChevronRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <button
                onClick={() => setMode('SPLIT')} disabled={!activeOrder}
                className="w-full p-5 bg-elevated/40 border border-border/20 text-main rounded-3xl flex items-center justify-between transition-all group hover:bg-rose-500 hover:text-white hover:border-rose-500 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-elevated/40 disabled:hover:text-main"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-rose-500 group-hover:text-white group-hover:bg-white/20 shadow-sm border border-border/20 group-hover:border-transparent transition-all"><Split size={22} /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t.split}</span>
                </div>
                <ChevronRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            <button
                onClick={() => setMode('MERGE')} disabled={!activeOrder}
                className="w-full p-5 bg-elevated/40 border border-border/20 text-main rounded-3xl flex items-center justify-between transition-all group hover:bg-teal-500 hover:text-white hover:border-teal-500 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-elevated/40 disabled:hover:text-main"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-teal-500 group-hover:text-white group-hover:bg-white/20 shadow-sm border border-border/20 group-hover:border-transparent transition-all"><ArrowLeftRight size={22} /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t.merge}</span>
                </div>
                <ChevronRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
        </motion.div>
    );

    const renderTableSelector = (targetStatus: TableStatus) => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full bg-card">
            <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" /> {t.select_target}
                    </h3>
                    <span className="text-[10px] font-bold text-muted bg-elevated/50 px-2 py-0.5 rounded-md border border-border/20">
                        {targetStatus === TableStatus.AVAILABLE ? t.available : t.occupied}
                    </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {(targetStatus === TableStatus.AVAILABLE ? availableTables : occupiedTables).map(table => (
                        <button
                            key={table.id} onClick={() => setTargetTableId(table.id)}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${targetTableId === table.id ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'border-border/20 bg-elevated/40 hover:bg-elevated hover:border-indigo-500/30 text-main shadow-sm'}`}
                        >
                            <span className="font-black text-lg">{table.name}</span>
                            <div className={`flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-card/50 ${targetTableId === table.id ? 'text-indigo-100' : 'text-muted'}`}>
                                <Users size={10} /> {table.seats}
                            </div>
                        </button>
                    ))}
                </div>
                {(targetStatus === TableStatus.AVAILABLE ? availableTables : occupiedTables).length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-3xl bg-elevated/10">
                        <ArrowLeftRight size={32} className="opacity-20 mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest">No tables available</p>
                    </div>
                )}
            </div>

            <div className="flex gap-4 p-5 border-t border-border/10 bg-elevated/40 shrink-0">
                <button onClick={() => setMode('ACTIONS')} className="flex-1 py-4 bg-card border border-border/20 rounded-2xl font-black text-xs uppercase tracking-widest text-main hover:bg-elevated transition-colors active:scale-95 shadow-sm">
                    {t.cancel}
                </button>
                <button
                    disabled={!targetTableId}
                    onClick={() => {
                        if (targetTableId) {
                            if (mode === 'TRANSFER_ALL') onTransferTable(targetTableId);
                            else if (mode === 'TRANSFER_ITEMS') onTransferItems(targetTableId, selectedItems);
                            else if (mode === 'SPLIT') onSplitTable(targetTableId, selectedItems);
                            else if (mode === 'MERGE') onMergeTables(targetTableId, selectedItems);
                        }
                    }}
                    className="flex-[2] py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95 transition-all border border-indigo-400"
                >
                    {t.confirm}
                </button>
            </div>
        </motion.div>
    );

    const renderItemSelector = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full bg-card">
            <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
                        <ShoppingCart size={16} className="text-indigo-500" /> {t.select_items}
                    </h3>
                    <span className="text-[10px] font-bold text-muted bg-elevated/50 px-2 py-0.5 rounded-md border border-border/20 uppercase tracking-widest">
                        {selectedItems.length} Selected
                    </span>
                </div>
                <div className="space-y-2 pr-1">
                    {(activeOrder?.items ?? []).map(item => (
                        <div
                            key={item.cartId} onClick={() => toggleItem(item.cartId)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm active:scale-[0.98] ${selectedItems.includes(item.cartId) ? 'border-indigo-500 bg-indigo-500/5' : 'border-border/20 bg-elevated/40 hover:bg-elevated'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${selectedItems.includes(item.cartId) ? 'bg-indigo-500 border-indigo-600 shadow-inner' : 'bg-card border-border/40'}`}>
                                    {selectedItems.includes(item.cartId) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                </div>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm border border-border/10 ${selectedItems.includes(item.cartId) ? 'bg-indigo-500 text-white' : 'bg-elevated text-main'}`}>
                                    {item.quantity}
                                </div>
                                <span className={`font-bold text-sm ${selectedItems.includes(item.cartId) ? 'text-indigo-600 dark:text-indigo-400' : 'text-main'}`}>{item.name}</span>
                            </div>
                            <span className="font-black text-sm text-main opacity-80 tabular-nums">{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 p-5 border-t border-border/10 bg-elevated/40 shrink-0">
                <button onClick={() => { setTargetTableId(null); setMode('ACTIONS'); }} className="flex-1 py-4 bg-card border border-border/20 rounded-2xl font-black text-xs uppercase tracking-widest text-main hover:bg-elevated transition-colors active:scale-95 shadow-sm">
                    {t.cancel}
                </button>
                <button
                    disabled={selectedItems.length === 0}
                    onClick={() => setMode(mode === 'SPLIT' ? 'SPLIT' : 'TRANSFER_ITEMS')}
                    className="flex-[2] py-4 flex flex-col items-center justify-center bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95 transition-all border border-indigo-400"
                >
                    <span className="text-xs">{isRTL ? 'التالي' : 'Next'}</span>
                    <span className="text-[8px] opacity-70">({t.select_target})</span>
                </button>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[300] flex items-end sm:items-center justify-center sm:p-4">
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div
                    initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-2xl bg-card sm:rounded-[3rem] rounded-t-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-border/20 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                    {renderHeader()}

                    <div className="flex-1 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {mode === 'ACTIONS' && renderActions()}

                            {(mode === 'TRANSFER_ALL' || mode === 'MERGE' || ((mode === 'TRANSFER_ITEMS' || mode === 'SPLIT') && selectedItems.length > 0 && !targetTableId)) && (
                                <motion.div key="table-selector" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
                                    {mode === 'MERGE'
                                        ? renderTableSelector(TableStatus.OCCUPIED)
                                        : mode === 'TRANSFER_ITEMS' || mode === 'SPLIT'
                                            ? renderTableSelector(mode === 'SPLIT' ? TableStatus.AVAILABLE : TableStatus.OCCUPIED)
                                            : renderTableSelector(TableStatus.AVAILABLE)}
                                </motion.div>
                            )}

                            {(mode === 'TRANSFER_ITEMS' || mode === 'SPLIT') && !targetTableId && (
                                <motion.div key="item-selector" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0">
                                    {renderItemSelector()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TableManagementModal;
