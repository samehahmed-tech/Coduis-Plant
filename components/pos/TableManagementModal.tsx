import React, { useState, useMemo } from 'react';
import {
    X, ArrowLeftRight, Split, Move, Users,
    ShoppingCart, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { Table, Order, OrderItem, TableStatus, OrderStatus } from '../../types';

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

    const activeOrder = useMemo(() =>
        orders.find(o => o.tableId === sourceTable.id && o.status !== OrderStatus.DELIVERED),
        [orders, sourceTable.id]);

    const availableTables = useMemo(() =>
        allTables.filter(t => t.id !== sourceTable.id && t.status === TableStatus.AVAILABLE),
        [allTables, sourceTable.id]);

    const occupiedTables = useMemo(() =>
        allTables.filter(t => t.id !== sourceTable.id && t.status === TableStatus.OCCUPIED),
        [allTables, sourceTable.id]);

    const toggleItem = (cartId: string) => {
        setSelectedItems(prev =>
            prev.includes(cartId) ? prev.filter(id => id !== cartId) : [...prev, cartId]
        );
    };

    const t = lang === 'ar' ? {
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
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <ShoppingCart size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.title}</h2>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        {activeOrder
                            ? `${(activeOrder.items?.length ?? 0)} ${t.items} • ج.م ${(activeOrder.total ?? 0).toFixed(2)}`
                            : t.no_order}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X size={20} />
            </button>
        </div>
    );

    const renderActions = () => (
        <div className="p-6 grid grid-cols-1 gap-4">
            <button
                onClick={onEditOrder}
                className="w-full p-6 bg-emerald-500 text-white rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <span className="font-black text-sm uppercase tracking-widest">{t.edit}</span>
                </div>
                <ChevronRight size={20} />
            </button>

            <button
                onClick={() => onCloseTable(sourceTable.id)}
                disabled={!activeOrder}
                className="w-full p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <span className="font-black text-sm uppercase tracking-widest">
                        {lang === 'ar' ? 'إغلاق الترابيزة وطباعة الحساب' : 'Close Table & Print Bill'}
                    </span>
                </div>
                <ChevronRight size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setMode('TRANSFER_ALL')}
                    className="p-6 bg-indigo-50 dark:bg-slate-800/50 hover:bg-indigo-600 hover:text-white rounded-3xl flex flex-col items-center gap-3 transition-all group"
                >
                    <ArrowLeftRight size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{t.transfer_all}</span>
                </button>
                <button
                    onClick={() => setMode('TRANSFER_ITEMS')}
                    className="p-6 bg-amber-50 dark:bg-slate-800/50 hover:bg-amber-500 hover:text-white rounded-3xl flex flex-col items-center gap-3 transition-all group"
                >
                    <Move size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{t.transfer_items}</span>
                </button>
                <button
                    onClick={() => setMode('SPLIT')}
                    className="p-6 bg-rose-50 dark:bg-slate-800/50 hover:bg-rose-500 hover:text-white rounded-3xl flex flex-col items-center gap-3 transition-all group"
                >
                    <Split size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{t.split}</span>
                </button>
            </div>
            <button
                onClick={() => setMode('MERGE')}
                className="w-full p-5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-900 hover:text-white rounded-3xl flex items-center justify-between transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/40 rounded-2xl flex items-center justify-center"><ArrowLeftRight size={22} /></div>
                    <span className="font-black text-[10px] uppercase tracking-widest">{t.merge}</span>
                </div>
                <ChevronRight size={20} />
            </button>
        </div>
    );

    const renderTableSelector = (targetStatus: TableStatus) => (
        <div className="p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> {t.select_target}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {(targetStatus === TableStatus.AVAILABLE ? availableTables : occupiedTables).map(table => (
                    <button
                        key={table.id}
                        onClick={() => setTargetTableId(table.id)}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${targetTableId === table.id
                                ? 'border-primary bg-primary/10 scale-105'
                                : 'border-slate-100 dark:border-slate-800 hover:border-primary/30'
                            }`}
                    >
                        <span className="font-black text-sm">{table.name}</span>
                        <div className="flex items-center gap-1 text-[8px] text-slate-400">
                            <Users size={10} /> {table.seats}
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setMode('ACTIONS')}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500"
                >
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
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                    {t.confirm}
                </button>
            </div>
        </div>
    );

    const renderItemSelector = () => (
        <div className="p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart size={14} /> {t.select_items}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {(activeOrder?.items ?? []).map(item => (
                    <div
                        key={item.cartId}
                        onClick={() => toggleItem(item.cartId)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedItems.includes(item.cartId)
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">
                                {item.quantity}
                            </div>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                        </div>
                        <span className="font-black text-sm text-slate-500">ج.م {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => { setTargetTableId(null); setMode('ACTIONS'); }}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500"
                >
                    {t.cancel}
                </button>
                <button
                    disabled={selectedItems.length === 0}
                    onClick={() => setMode(mode === 'SPLIT' ? 'SPLIT' : 'TRANSFER_ITEMS')} // Proceed to table selection
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                    {t.confirm} (Next)
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {renderHeader()}

                {mode === 'ACTIONS' && renderActions()}
                {(mode === 'TRANSFER_ALL' || mode === 'MERGE' || ((mode === 'TRANSFER_ITEMS' || mode === 'SPLIT') && selectedItems.length > 0 && !targetTableId)) && (
                    mode === 'MERGE'
                        ? renderTableSelector(TableStatus.OCCUPIED)
                        : mode === 'TRANSFER_ITEMS' || mode === 'SPLIT'
                            ? renderTableSelector(mode === 'SPLIT' ? TableStatus.AVAILABLE : TableStatus.OCCUPIED)
                            : renderTableSelector(TableStatus.AVAILABLE)
                )}
                {(mode === 'TRANSFER_ITEMS' || mode === 'SPLIT') && !targetTableId && renderItemSelector()}
                {/* Refined the flow: Mode chooses what to do, then if needed choose items, then choose target table */}

                {/* Adjusting the rendering logic for clarity */}
                {mode === 'ACTIONS' ? null : (
                    mode === 'TRANSFER_ITEMS' || mode === 'SPLIT' ? (
                        // If no items selected yet, show items
                        selectedItems.length === 0 ? null : (
                            // If items selected but no target table yet, show table selector
                            targetTableId ? null : null // Handled above
                        )
                    ) : null
                )}
            </div>
        </div>
    );
};

export default TableManagementModal;
