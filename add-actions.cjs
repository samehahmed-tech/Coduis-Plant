const fs = require('fs');
let c = fs.readFileSync('e:/WorkSpace/restoflow-erp/components/CallCenter.tsx', 'utf8');

// ============================================================================
// Add action buttons to GRID view tracking cards
// Find the closing </div> after the urgent section in grid cards
// We insert before the card's last closing </div>
// ============================================================================

const gridCardEnd = `                                    </div>
                                ))}
                            </div>
                        ) : (`;

const gridActionButtons = `                                        {/* Action Buttons */}
                                        <div className="mt-4 flex gap-2 relative z-10">
                                            {order.status === OrderStatus.READY && (
                                                <button
                                                    onClick={() => { setSelectedTrackingOrder(order); setShowDriverModal(true); }}
                                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
                                                >
                                                    <Truck size={14} /> {lang === 'ar' ? '\u062a\u0639\u064a\u064a\u0646 \u0645\u0646\u062f\u0648\u0628' : 'Dispatch'}
                                                </button>
                                            )}
                                            {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await updateOrderStatus(order.id, OrderStatus.DELIVERED);
                                                            showToast(lang === 'ar' ? '\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0648\u0635\u064a\u0644' : 'Delivery confirmed', 'success');
                                                            await fetchOrders();
                                                        } catch (e) {
                                                            showToast(getActionableErrorMessage(e, lang), 'error');
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={14} /> {lang === 'ar' ? '\u062a\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644' : 'Delivered'}
                                                </button>
                                            )}
                                        </div>
`;

// Normalize line endings for matching
const norm = c.replace(/\r\n/g, '\n');
if (norm.includes(gridCardEnd)) {
    c = c.replace(
        gridCardEnd.replace(/\n/g, '\r\n'),
        gridActionButtons.replace(/\n/g, '\r\n') + gridCardEnd.replace(/\n/g, '\r\n')
    );
    // Also try with \n endings
    if (!c.includes(gridActionButtons.substring(0, 30))) {
        c = c.replace(
            gridCardEnd,
            gridActionButtons + gridCardEnd
        );
    }
    console.log('Added action buttons to grid view');
} else {
    console.log('WARNING: Grid card end pattern not found');
}

fs.writeFileSync('e:/WorkSpace/restoflow-erp/components/CallCenter.tsx', c);
console.log('Done! Total lines:', c.split(/\r?\n/).length);
