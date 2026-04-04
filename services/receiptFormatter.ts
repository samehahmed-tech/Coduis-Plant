import { AppSettings, Order, OrderType, Branch } from '../types';
import { calculateOrderTotalsFromOrder } from './orderTotals';

interface ReceiptParams {
    order: Order;
    title?: string;
    settings: AppSettings;
    currencySymbol: string;
    lang: 'en' | 'ar';
    t: any;
    branch?: Branch;
}

/* ???????????????????????????????????????????????????????????????????????????
   Plain-text receipt formatter for ESC/POS thermal printers (32-col / 80mm)
   ??? Arabic NOT supported on most thermal printers — English fallback ???
   ??????????????????????????????????????????????????????????????????????????? */

/**
 * Check if a string contains Arabic/non-ASCII characters
 */
const hasArabic = (s: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(s);

/**
 * Strip Arabic from text — returns English fallback if available
 */
const thermalSafe = (arabic: string | undefined, english: string | undefined, fallback = '—') => {
    // Prefer English for thermal printers since Arabic garbles
    if (english && !hasArabic(english)) return english;
    if (arabic && !hasArabic(arabic)) return arabic;
    // If English also has Arabic or is missing, try to use what we have
    if (english) return english;
    if (arabic) return arabic;
    return fallback;
};

/**
 * Make currency symbol thermal-safe (e.g., "Ì.ã" ? "EGP")
 */
const safeCurrency = (symbol: string) => {
    if (!symbol || hasArabic(symbol)) return 'EGP';
    return symbol;
};

export const formatReceipt = ({
    order,
    title,
    settings,
    currencySymbol,
    lang,
    t,
    branch,
}: ReceiptParams): string => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const cur = safeCurrency(currencySymbol);
    const totals = calculateOrderTotalsFromOrder(order, settings);

    // ?? Printer column width ??
    const WIDTH = 32;
    const ITEM_COL = 20;
    const AMT_COL = WIDTH - ITEM_COL;

    // ?? Helpers ??
    const THIN = '-'.repeat(WIDTH);
    const THICK = '='.repeat(WIDTH);

    const center = (text: string) => {
        const s = String(text || '').trim();
        if (s.length >= WIDTH) return s.slice(0, WIDTH);
        const pad = Math.floor((WIDTH - s.length) / 2);
        return ' '.repeat(pad) + s;
    };

    const fmtMoney = (n: number) => {
        const val = Number(n || 0).toFixed(2);
        return `${cur} ${val}`;
    };

    const trunc = (s: string, max: number) =>
        s.length > max ? s.slice(0, max - 1) + '.' : s;

    const padR = (s: string, w: number) =>
        s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length);

    const padL = (s: string, w: number) =>
        s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s;

    const row = (left: string, right: string) =>
        padR(trunc(left, ITEM_COL), ITEM_COL) + padL(right, AMT_COL);

    // ?? Order type label (always English for thermal) ??
    const orderTypeLabel: Record<string, string> = {
        DINE_IN: 'Dine-In', DELIVERY: 'Delivery', PICKUP: 'Pickup', TAKEAWAY: 'Takeaway'
    };
    const orderTypeText = orderTypeLabel[order.type] || order.type;

    // ?? Friendly table name ??
    const friendlyTable = (id?: string) => {
        if (!id) return '';
        if ((order as any).tableName) {
            const tName = (order as any).tableName;
            return hasArabic(tName) ? `T-${id.split('-').pop()}` : tName;
        }
        if (id.startsWith('tbl-') || id.startsWith('TBL-')) {
            return `T-${id.split('-').pop()}`;
        }
        return id.length > 10 ? id.slice(0, 10) : id;
    };

    // ?? Build receipt (always English for thermal compatibility) ??
    const L: string[] = [];

    // ??? HEADER ???
    L.push('');
    const restName = thermalSafe(settings.restaurantName, settings.restaurantName, 'Restaurant');
    L.push(center(restName));

    if (branch?.name) {
        const bName = thermalSafe(branch.name, (branch as any).nameEn, branch.name);
        if (!hasArabic(bName)) L.push(center(bName));
    }
    if (settings.branchAddress) {
        const addr = thermalSafe(settings.branchAddress, (settings as any).branchAddressEn);
        if (!hasArabic(addr)) L.push(center(trunc(addr, WIDTH)));
    }
    if (settings.phone) L.push(center(`Tel: ${settings.phone}`));

    L.push(THICK);

    // ??? TITLE ???
    const receiptTitle = title || 'Sales Receipt';
    // If title has Arabic, fallback
    const safeTitleText = hasArabic(receiptTitle) ? 'Sales Receipt' : receiptTitle;
    L.push(center(safeTitleText));
    L.push(THICK);

    // ??? ORDER INFO ???
    const dateStr = createdAt.toLocaleDateString('en-GB');
    const timeStr = createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    L.push(row(`#${order.orderNumber || '---'}`, dateStr));
    L.push(row(orderTypeText, timeStr));

    const tbl = friendlyTable(order.tableId);
    if (tbl) L.push(row('Table', tbl));

    if (order.customerName) {
        const custName = thermalSafe(order.customerName, order.customerName);
        if (!hasArabic(custName)) {
            L.push(row('Customer', trunc(custName, AMT_COL)));
        }
    }
    if (order.customerPhone) {
        L.push(row('Phone', order.customerPhone));
    }

    // ??? ITEMS ???
    L.push(THIN);
    L.push(row('Item', 'Amount'));
    L.push(THIN);


    for (const item of order.items || []) {
        const modsPrice = (item.selectedModifiers || []).reduce((s, m) => s + (m.price || 0), 0);
        const unitPrice = (item.price || 0) + modsPrice;
        const lineGross = unitPrice * (item.quantity || 1);

        let itemDiscount = 0;
        if ((item as any).itemDiscount && (item as any).itemDiscount > 0) {
            itemDiscount = (item as any).itemDiscountType === 'percent'
                ? lineGross * ((item as any).itemDiscount / 100)
                : (item as any).itemDiscount;
        }
        const lineNet = lineGross - itemDiscount;

        // Use English name for thermal — Arabic garbles
        const itemName = thermalSafe((item as any).nameAr, item.name, item.name);
        const safeItemName = hasArabic(itemName) ? (item.name || 'Item') : itemName;
        const qty = item.quantity || 1;
        const label = `${qty}x ${safeItemName}`;
        const amtStr = fmtMoney(lineNet);

        L.push(row(label, amtStr));

        // Modifiers
        if (item.selectedModifiers?.length) {
            for (const m of item.selectedModifiers) {
                const modName = thermalSafe(m.optionName, m.optionName || m.groupName);
                const safeModName = hasArabic(modName) ? (m.groupName || 'Mod') : modName;
                const modPrice = m.price > 0 ? `+${m.price.toFixed(0)}` : '';
                L.push(row(`  +${trunc(safeModName, ITEM_COL - 3)}`, modPrice));
            }
        }

        // Item-level discount
        if (itemDiscount > 0) {
            L.push(row('  Disc', `-${fmtMoney(itemDiscount)}`));
        }

        // Notes
        if (item.notes) {
            const safeNotes = hasArabic(item.notes) ? '' : item.notes;
            if (safeNotes) L.push(`  * ${trunc(safeNotes, WIDTH - 4)}`);
        }
    }

    // ??? TOTALS ???
    L.push(THICK);
    L.push(row('Subtotal', fmtMoney(totals.subtotal)));

    if (totals.itemDiscountTotal > 0) {
        L.push(row('Item Disc.', `-${fmtMoney(totals.itemDiscountTotal)}`));
    }

    const orderDiscount = totals.orderDiscountAmount;
    if (orderDiscount > 0) {
        L.push(row(`Disc ${order.discount}%`, `-${fmtMoney(orderDiscount)}`));
    }

    L.push(row('Tax', fmtMoney(totals.tax)));

    if (order.tipAmount && order.tipAmount > 0) {
        L.push(row('Tip', fmtMoney(order.tipAmount)));
    }

    if (totals.serviceCharge > 0) {
        L.push(row('Service', fmtMoney(totals.serviceCharge)));
    }

    if (totals.deliveryFee > 0) {
        L.push(row('Delivery', fmtMoney(totals.deliveryFee)));
    }

    L.push(THIN);
    L.push(row('*** TOTAL ***', fmtMoney(totals.total)));
    L.push(THIN);

    // ??? PAYMENT ???
    if (order.paymentMethod) {
        const pmLabels: Record<string, string> = {
            CASH: 'Cash', VISA: 'Visa', CARD: 'Card',
            VODAFONE_CASH: 'V.Cash', INSTAPAY: 'InstaPay', SPLIT: 'Split'
        };
        const pmText = pmLabels[String(order.paymentMethod).toUpperCase()] || String(order.paymentMethod);
        L.push(row('Payment', pmText));
    }

    // ??? FOOTER ???
    L.push(THICK);
    L.push(center('Thank you for your visit!'));
    L.push(center('We hope you enjoyed'));

    if ((settings as any).taxRegistrationNumber) {
        L.push(center(`TIN: ${(settings as any).taxRegistrationNumber}`));
    }

    L.push('');
    L.push(center('Powered by Coduis Zen'));
    L.push('\n\n\n');

    return L.join('\n');
};

