/* ═══════════════════════════════════════════════════════════════════════════
   Template-based receipt generator — reads designer templates from localStorage
   and produces ASCII-safe plain text for thermal printers.
   ─── Arabic NOT supported on most thermal printers — English fallback ───
   ═══════════════════════════════════════════════════════════════════════════ */

import { AppSettings, Order, OrderType, Branch } from '../types';
import { calculateOrderTotalsFromOrder } from './orderTotals';

// ── Types (must match ReceiptDesigner.tsx) ──

type BlockType =
    | 'header' | 'title' | 'orderInfo' | 'customerInfo'
    | 'items' | 'totals' | 'payment' | 'qrCode'
    | 'logo' | 'footer' | 'separator' | 'customText';

interface ReceiptBlock {
    id: string;
    type: BlockType;
    enabled: boolean;
    label: string;
    labelAr: string;
    config: Record<string, any>;
}

interface ReceiptTemplate {
    id: string;
    name: string;
    nameAr: string;
    type: 'receipt' | 'kitchen';
    blocks: ReceiptBlock[];
    fontSize: 'small' | 'normal' | 'large';
    paperWidth: '58mm' | '80mm';
    showLogo: boolean;
    linkedPrinterIds: string[];
    linkedDepartments: string[];
    isDefault: boolean;
    createdAt: string;
}

// ── Storage key (same as ReceiptDesigner) ──

const STORAGE_KEY = 'restoflow_receipt_templates';

// ── Arabic detection helpers ──

const hasArabic = (s: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(s);

const thermalSafe = (text: string | undefined, fallback = '---') => {
    if (!text) return fallback;
    if (!hasArabic(text)) return text;
    return fallback;
};

const safeCurrency = (symbol: string) => {
    if (!symbol || hasArabic(symbol)) return 'EGP';
    return symbol;
};

// ── Public API ──

/**
 * Find a template linked to the given printer ID.
 */
export const findTemplateForPrinter = (printerId: string): ReceiptTemplate | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const templates: ReceiptTemplate[] = JSON.parse(raw);
        return templates.find(t => t.linkedPrinterIds.includes(printerId)) || null;
    } catch {
        return null;
    }
};

/**
 * Find the default template of a given type.
 */
export const findDefaultTemplate = (type: 'receipt' | 'kitchen'): ReceiptTemplate | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const templates: ReceiptTemplate[] = JSON.parse(raw);
        return templates.find(t => t.type === type && t.isDefault)
            || templates.find(t => t.type === type)
            || null;
    } catch {
        return null;
    }
};

interface GenerateParams {
    template: ReceiptTemplate;
    order: Order;
    settings: AppSettings;
    currencySymbol: string;
    lang: 'en' | 'ar';
    t: any;
    branch?: Branch;
    title?: string;
}

/**
 * Generate ASCII-safe plain text from a designer template + order data.
 * All Arabic text is stripped/replaced with English for thermal printers.
 */
export const generateFromTemplate = ({
    template,
    order,
    settings,
    currencySymbol,
    lang,
    t,
    branch,
    title,
}: GenerateParams): string => {
    const WIDTH = template.paperWidth === '58mm' ? 32 : 42;
    const ITEM_COL = template.paperWidth === '58mm' ? 20 : 26;
    const AMT_COL = WIDTH - ITEM_COL;
    const cur = safeCurrency(currencySymbol);
    const totals = calculateOrderTotalsFromOrder(order, settings);

    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

    // ── Helpers (ASCII only) ──
    const THIN = '-'.repeat(WIDTH);
    const THICK = '='.repeat(WIDTH);
    const DASHED = '- '.repeat(Math.floor(WIDTH / 2));

    const center = (text: string) => {
        const s = String(text || '').trim();
        if (s.length >= WIDTH) return s.slice(0, WIDTH);
        return ' '.repeat(Math.floor((WIDTH - s.length) / 2)) + s;
    };

    const trunc = (s: string, max: number) =>
        s.length > max ? s.slice(0, max - 1) + '.' : s;

    const padR = (s: string, w: number) =>
        s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length);

    const padL = (s: string, w: number) =>
        s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s;

    const row = (left: string, right: string) =>
        padR(trunc(left, ITEM_COL), ITEM_COL) + padL(right, AMT_COL);

    const money = (n: number) => `${cur} ${Number(n || 0).toFixed(2)}`;

    // Always English labels for thermal
    const orderTypeLabel: Record<string, string> = {
        DINE_IN: 'Dine-In', DELIVERY: 'Delivery', PICKUP: 'Pickup', TAKEAWAY: 'Takeaway'
    };

    const friendlyTable = (id?: string) => {
        if (!id) return '';
        if ((order as any).tableName) {
            const tName = (order as any).tableName;
            return hasArabic(tName) ? `T-${id.split('-').pop()}` : tName;
        }
        if (id.startsWith('tbl-') || id.startsWith('TBL-')) {
            return `T-${id.split('-').pop()}`;
        }
        return id.length > 12 ? id.slice(0, 12) : id;
    };

    // ── Build lines from enabled blocks ──
    const L: string[] = [];
    L.push('');

    const enabledBlocks = template.blocks.filter(b => b.enabled);

    for (const block of enabledBlocks) {
        const cfg = block.config || {};

        switch (block.type) {
            case 'logo': {
                // Thermal printers can't print images — skip
                break;
            }

            case 'header': {
                const restName = thermalSafe(settings.restaurantName, 'Restaurant');
                L.push(center(restName));
                if (cfg.showBranch && branch?.name) {
                    const bName = thermalSafe(branch.name);
                    if (bName !== '---') L.push(center(bName));
                }
                if (cfg.showAddress && settings.branchAddress) {
                    const addr = thermalSafe(settings.branchAddress);
                    if (addr !== '---') L.push(center(trunc(addr, WIDTH)));
                }
                if (cfg.showPhone && settings.phone) {
                    L.push(center(`Tel: ${settings.phone}`));
                }
                break;
            }

            case 'title': {
                L.push(THICK);
                // Use English title for thermal
                let titleText = title || cfg.text || 'Sales Receipt';
                titleText = thermalSafe(titleText, 'Sales Receipt');
                L.push(center(titleText));
                L.push(THICK);
                break;
            }

            case 'orderInfo': {
                const dateStr = createdAt.toLocaleDateString('en-GB');
                const timeStr = createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                if (cfg.showOrderNum) L.push(row(`#${order.orderNumber || '---'}`, cfg.showDate ? dateStr : ''));
                if (cfg.showType) L.push(row(orderTypeLabel[order.type] || order.type, cfg.showTime ? timeStr : ''));
                break;
            }

            case 'customerInfo': {
                const tbl = friendlyTable(order.tableId);
                if (cfg.showTable && tbl) L.push(row('Table', tbl));
                if (cfg.showCustomer && order.customerName) {
                    const custName = thermalSafe(order.customerName, 'Customer');
                    L.push(row('Customer', trunc(custName, AMT_COL)));
                }
                if (cfg.showPhone && order.customerPhone) {
                    L.push(row('Phone', order.customerPhone));
                }
                if (cfg.showAddress && order.deliveryAddress) {
                    const addr = thermalSafe(order.deliveryAddress, '---');
                    if (addr !== '---') L.push(`Addr: ${trunc(addr, WIDTH - 6)}`);
                }
                break;
            }

            case 'items': {
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

                    // Always use English name for thermal
                    const itemName = thermalSafe(item.name, 'Item');
                    const qty = item.quantity || 1;
                    const label = `${qty}x ${itemName}`;
                    L.push(row(label, money(lineNet)));

                    if (cfg.showModifiers && item.selectedModifiers?.length) {
                        for (const m of item.selectedModifiers) {
                            const modName = thermalSafe(m.optionName || m.groupName, 'Mod');
                            const modPrice = m.price > 0 ? `+${m.price.toFixed(0)}` : '';
                            L.push(row(`  +${trunc(modName, ITEM_COL - 3)}`, modPrice));
                        }
                    }
                    if (itemDiscount > 0) {
                        L.push(row('  Disc', `-${money(itemDiscount)}`));
                    }
                    if (cfg.showNotes && item.notes) {
                        const safeNotes = thermalSafe(item.notes, '');
                        if (safeNotes) L.push(`  * ${trunc(safeNotes, WIDTH - 4)}`);
                    }
                }
                break;
            }

            case 'totals': {
                L.push(THICK);
                for (const item of order.items || []) {
                    const modsPrice = (item.selectedModifiers || []).reduce((s, m) => s + (m.price || 0), 0);
                    const lineGross = ((item.price || 0) + modsPrice) * (item.quantity || 1);
                    let itemDiscount = 0;
                    if ((item as any).itemDiscount && (item as any).itemDiscount > 0) {
                        itemDiscount = (item as any).itemDiscountType === 'percent'
                            ? lineGross * ((item as any).itemDiscount / 100)
                            : (item as any).itemDiscount;
                    }
                }

                if (cfg.showSubtotal) L.push(row('Subtotal', money(totals.subtotal)));
                if (cfg.showDiscount && totals.orderDiscountAmount > 0) {
                    L.push(row(`Disc ${order.discount}%`, `-${money(totals.orderDiscountAmount)}`));
                }
                if (cfg.showTax) L.push(row('Tax', money(totals.tax)));

                if (cfg.showTip && order.tipAmount && order.tipAmount > 0) {
                    L.push(row('Tip', money(order.tipAmount)));
                }

                L.push(THIN);
                if (cfg.showTotal) L.push(row('*** TOTAL ***', money(totals.total)));
                L.push(THIN);
                break;
            }

            case 'payment': {
                if (order.paymentMethod) {
                    const pmLabels: Record<string, string> = {
                        CASH: 'Cash', VISA: 'Visa', CARD: 'Card',
                        VODAFONE_CASH: 'V.Cash', INSTAPAY: 'InstaPay', SPLIT: 'Split'
                    };
                    const pmText = pmLabels[String(order.paymentMethod).toUpperCase()] || String(order.paymentMethod);
                    L.push(row('Payment', pmText));
                }
                break;
            }

            case 'qrCode': {
                if (cfg.url || (settings as any).receiptQrUrl) {
                    L.push(center('[QR]'));
                    const url = cfg.url || (settings as any).receiptQrUrl || '';
                    if (url) L.push(center(trunc(url, WIDTH)));
                }
                break;
            }

            case 'footer': {
                L.push(THICK);
                // Use English footer for thermal
                const footerText = thermalSafe(cfg.text || cfg.textAr, 'Thank you!');
                L.push(center(footerText));
                if (cfg.showTaxId && (settings as any).taxRegistrationNumber) {
                    L.push(center(`TIN: ${(settings as any).taxRegistrationNumber}`));
                }
                if (cfg.showPoweredBy) {
                    L.push(center('Powered by Coduis Zen'));
                }
                break;
            }

            case 'separator': {
                L.push(cfg.style === 'solid' ? THICK : cfg.style === 'dashed' ? DASHED : THIN);
                break;
            }

            case 'customText': {
                // Try English text first, then Arabic, skip if all Arabic
                const text = thermalSafe(cfg.text || cfg.textAr, '');
                if (text) {
                    if (cfg.alignment === 'center') {
                        L.push(center(text));
                    } else if (cfg.alignment === 'right') {
                        L.push(padL(text, WIDTH));
                    } else {
                        L.push(text);
                    }
                }
                break;
            }
        }
    }

    // Paper feed
    L.push('\n\n\n');

    return L.join('\n');
};

interface GenerateHtmlParams extends GenerateParams {}

const escapeHtml = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const formatCurrencyHtml = (currencySymbol: string, amount: number) =>
    `<span class="money" dir="ltr">${escapeHtml(currencySymbol || 'EGP')} ${Number(amount || 0).toFixed(2)}</span>`;

export const generateHtmlFromTemplate = ({
    template,
    order,
    settings,
    currencySymbol,
    lang,
    branch,
    title,
}: GenerateHtmlParams): string => {
    const isAr = lang === 'ar';
    const dir = isAr ? 'rtl' : 'ltr';
    const textAlign = isAr ? 'right' : 'left';
    const textAlignEnd = isAr ? 'left' : 'right';
    const paperWidth = template.paperWidth || '80mm';
    const widthMm = paperWidth === '58mm' ? 58 : 80;
    const bodyWidthMm = paperWidth === '58mm' ? 50 : 72;
    const fontSizePx = template.fontSize === 'small' ? 10 : template.fontSize === 'large' ? 14 : 12;
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const timeStr = createdAt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const totals = calculateOrderTotalsFromOrder(order, settings);

    const pickText = (en?: string, ar?: string, fallback = '') =>
        escapeHtml(isAr ? (ar || en || fallback) : (en || ar || fallback));

    const orderTypeLabels: Record<string, { ar: string; en: string }> = {
        [OrderType.DINE_IN]: { ar: 'داخلي', en: 'Dine-In' },
        [OrderType.DELIVERY]: { ar: 'توصيل', en: 'Delivery' },
        [OrderType.PICKUP]: { ar: 'استلام', en: 'Pickup' },
        [OrderType.TAKEAWAY]: { ar: 'تيك أواي', en: 'Takeaway' },
    };
    const paymentLabels: Record<string, { ar: string; en: string }> = {
        CASH: { ar: 'كاش', en: 'Cash' },
        CARD: { ar: 'بطاقة', en: 'Card' },
        VISA: { ar: 'فيزا', en: 'Visa' },
        VODAFONE_CASH: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
        INSTAPAY: { ar: 'انستا باي', en: 'InstaPay' },
        SPLIT: { ar: 'مقسم', en: 'Split' },
    };

    const summaryRows: string[] = [];
    const pushSummary = (enabled: boolean, labelEn: string, labelAr: string, value: number, cls = '') => {
        if (!enabled) return;
        summaryRows.push(`
            <tr class="summary-row ${cls}">
                <td>${pickText(labelEn, labelAr)}</td>
                <td>${formatCurrencyHtml(currencySymbol, value)}</td>
            </tr>
        `);
    };

    const blockHtml = template.blocks
        .filter((block) => block.enabled)
        .map((block) => {
            const cfg = block.config || {};

            switch (block.type) {
                case 'logo':
                    if (!cfg.url || template.showLogo === false) return '';
                    return `
                        <div class="block logo-block">
                            <img src="${escapeHtml(cfg.url)}" alt="logo" style="max-height:${Number(cfg.maxHeight || 60)}px;max-width:100%;object-fit:contain" />
                        </div>
                    `;

                case 'header':
                    return `
                        <div class="block header-block">
                            <div class="restaurant-name">${escapeHtml(settings.restaurantName || 'Restaurant')}</div>
                            ${cfg.showBranch && (branch?.name || branch?.nameAr)
                                ? `<div class="branch-name">${pickText(branch?.name, branch?.nameAr)}</div>` : ''}
                            ${cfg.showAddress && (settings.branchAddress || branch?.address)
                                ? `<div class="branch-info">${escapeHtml(settings.branchAddress || branch?.address || '')}</div>` : ''}
                            ${cfg.showPhone && (settings.phone || branch?.phone)
                                ? `<div class="branch-info">${pickText('Tel', 'هاتف')}: ${escapeHtml(settings.phone || branch?.phone || '')}</div>` : ''}
                        </div>
                    `;

                case 'title': {
                    const titleText = title || (isAr ? (cfg.textAr || cfg.text) : (cfg.text || cfg.textAr)) || (isAr ? 'إيصال بيع' : 'Sales Receipt');
                    return `<div class="block receipt-title">${escapeHtml(titleText)}</div>`;
                }

                case 'orderInfo': {
                    const orderType = orderTypeLabels[order.type] || orderTypeLabels[OrderType.TAKEAWAY];
                    return `
                        <div class="block order-meta">
                            ${cfg.showOrderNum ? `
                                <div class="meta-block">
                                    <span class="meta-label">${pickText('Order #', 'رقم الطلب')}</span>
                                    <span class="meta-value">${escapeHtml(order.orderNumber || order.id?.slice(0, 8) || '---')}</span>
                                </div>
                            ` : ''}
                            ${cfg.showType ? `
                                <div class="meta-block meta-center">
                                    <span class="meta-label">${pickText('Type', 'النوع')}</span>
                                    <span class="type-badge">${pickText(orderType.en, orderType.ar)}</span>
                                </div>
                            ` : ''}
                            ${(cfg.showDate || cfg.showTime) ? `
                                <div class="meta-block meta-end">
                                    ${cfg.showDate ? `<span class="meta-label">${pickText('Date', 'التاريخ')}</span><span class="meta-value">${escapeHtml(dateStr)}</span>` : ''}
                                    ${cfg.showTime ? `<span class="meta-time">${escapeHtml(timeStr)}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }

                case 'customerInfo':
                    return `
                        <div class="block customer-info">
                            ${cfg.showTable && order.tableId ? `<div class="info-chip">${pickText('Table', 'طاولة')}: <strong>${escapeHtml((order as any).tableName || order.tableId)}</strong></div>` : ''}
                            ${cfg.showCustomer && order.customerName ? `<div class="info-chip">${pickText('Customer', 'العميل')}: ${escapeHtml(order.customerName)}</div>` : ''}
                            ${cfg.showPhone && order.customerPhone ? `<div class="info-chip">${pickText('Phone', 'الهاتف')}: ${escapeHtml(order.customerPhone)}</div>` : ''}
                            ${cfg.showAddress && order.deliveryAddress ? `<div class="info-chip">${pickText('Address', 'العنوان')}: ${escapeHtml(order.deliveryAddress)}</div>` : ''}
                        </div>
                    `;

                case 'items': {
                    const itemRows = (order.items || []).map((item) => {
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

                        return `
                            <tr>
                                <td class="col-item">
                                    <span class="item-name">${pickText(item.name, (item as any).nameAr)}</span>
                                    ${cfg.showModifiers ? (item.selectedModifiers || []).map((modifier) => `
                                        <div class="item-mod">
                                            + ${escapeHtml(modifier.optionName || modifier.groupName || '')}
                                            ${modifier.price > 0 ? `<span class="mod-price">(${Number(modifier.price).toFixed(2)})</span>` : ''}
                                        </div>
                                    `).join('') : ''}
                                    ${cfg.showNotes && item.notes ? `<div class="item-note">${escapeHtml(item.notes)}</div>` : ''}
                                </td>
                                ${cfg.showQty ? `<td class="col-qty">${escapeHtml(item.quantity || 1)}</td>` : ''}
                                ${cfg.showPrice ? `<td class="col-price">${formatCurrencyHtml(currencySymbol, unitPrice)}</td>` : ''}
                                <td class="col-total">${formatCurrencyHtml(currencySymbol, lineNet)}</td>
                            </tr>
                        `;
                    }).join('');

                    return `
                        <div class="block">
                            <table class="items-table">
                                <tr class="items-header">
                                    <td class="col-item">${pickText('Item', 'الصنف')}</td>
                                    ${cfg.showQty ? `<td class="col-qty">${pickText('Qty', 'الكمية')}</td>` : ''}
                                    ${cfg.showPrice ? `<td class="col-price">${pickText('Price', 'السعر')}</td>` : ''}
                                    <td class="col-total">${pickText('Total', 'الإجمالي')}</td>
                                </tr>
                                ${itemRows}
                            </table>
                        </div>
                    `;
                }

                case 'totals':
                    summaryRows.length = 0;
                    pushSummary(Boolean(cfg.showSubtotal), 'Subtotal', 'المجموع الفرعي', totals.subtotal);
                    pushSummary(Boolean(cfg.showDiscount && totals.itemDiscountTotal > 0), 'Item Discounts', 'خصومات الأصناف', -totals.itemDiscountTotal, 'discount-row');
                    pushSummary(Boolean(cfg.showDiscount && totals.orderDiscountAmount > 0), `Discount ${order.discount || 0}%`, `خصم ${order.discount || 0}%`, -totals.orderDiscountAmount, 'discount-row');
                    pushSummary(Boolean(cfg.showTax), 'Tax', 'الضريبة', totals.tax);
                    pushSummary(Boolean(cfg.showTip && order.tipAmount && order.tipAmount > 0), 'Tip', 'البقشيش', order.tipAmount || 0);
                    return `
                        <div class="block">
                            <table class="summary-table">${summaryRows.join('')}</table>
                            ${cfg.showTotal ? `
                                <div class="grand-total">
                                    <span class="grand-total-label">${pickText('TOTAL', 'الإجمالي')}</span>
                                    <span class="grand-total-value">${formatCurrencyHtml(currencySymbol, totals.total)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;

                case 'payment': {
                    if (!order.paymentMethod) return '';
                    const payment = paymentLabels[String(order.paymentMethod).toUpperCase()];
                    const paymentText = payment ? pickText(payment.en, payment.ar) : escapeHtml(String(order.paymentMethod));
                    return `
                        <div class="block payment-section">
                            <span class="payment-pill">${pickText('Paid', 'الدفع')}: ${paymentText}</span>
                        </div>
                    `;
                }

                case 'qrCode': {
                    const qrValue = cfg.url || (settings as any).receiptQrUrl || '';
                    if (!qrValue) return '';
                    return `
                        <div class="block qr-block">
                            <div class="qr-box">QR</div>
                            <div class="qr-text">${escapeHtml(qrValue)}</div>
                        </div>
                    `;
                }

                case 'footer': {
                    const footerText = isAr ? (cfg.textAr || cfg.text) : (cfg.text || cfg.textAr);
                    return `
                        <div class="block receipt-footer">
                            <div class="footer-thanks">${escapeHtml(footerText || (isAr ? 'شكرا لزيارتكم!' : 'Thank you for your visit!'))}</div>
                            ${cfg.showTaxId && (settings as any).taxRegistrationNumber
                                ? `<div class="tax-id-line">${pickText('Tax ID', 'الرقم الضريبي')}: ${escapeHtml((settings as any).taxRegistrationNumber)}</div>` : ''}
                            ${cfg.showPoweredBy ? `<div class="powered-by">Powered by RestoFlow ERP</div>` : ''}
                        </div>
                    `;
                }

                case 'separator':
                    return `<hr class="${cfg.style === 'solid' ? 'thick-sep' : 'dashed-sep'}" />`;

                case 'customText': {
                    const customText = isAr ? (cfg.textAr || cfg.text) : (cfg.text || cfg.textAr);
                    if (!customText) return '';
                    const alignment = cfg.alignment === 'right'
                        ? textAlignEnd
                        : cfg.alignment === 'left'
                            ? textAlign
                            : 'center';
                    const fontWeight = cfg.bold ? 800 : 600;
                    const customFontSize = Number(cfg.fontSize || fontSizePx);
                    return `
                        <div class="block" style="text-align:${alignment};font-size:${customFontSize}px;font-weight:${fontWeight}">
                            ${escapeHtml(customText)}
                        </div>
                    `;
                }

                default:
                    return '';
            }
        })
        .join('');

    return `<!DOCTYPE html>
<html dir="${dir}" lang="${escapeHtml(lang)}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(settings.restaurantName || 'Receipt')}</title>
<style>
    @page { margin: 3mm; size: ${widthMm}mm auto; }
    * { box-sizing: border-box; }
    body {
        margin: 0 auto;
        padding: 3mm;
        width: ${bodyWidthMm}mm;
        max-width: 100%;
        color: #111;
        background: #fff;
        direction: ${dir};
        font-family: Cairo, "Segoe UI", Arial, sans-serif;
        font-size: ${fontSizePx}px;
        line-height: 1.4;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    img { display: block; margin: 0 auto; }
    .block { margin: 6px 0; }
    .logo-block, .payment-section, .qr-block, .receipt-footer { text-align: center; }
    .header-block { text-align: center; padding-bottom: 8px; border-bottom: 2px solid #111; }
    .restaurant-name { font-size: ${fontSizePx + 6}px; font-weight: 900; line-height: 1.2; }
    .branch-name { font-size: ${Math.max(fontSizePx - 1, 10)}px; font-weight: 700; color: #444; }
    .branch-info { font-size: ${Math.max(fontSizePx - 2, 9)}px; color: #666; }
    .receipt-title {
        text-align: center;
        padding: 6px 0;
        border: 1px dashed #999;
        border-radius: 4px;
        background: #f5f5f5;
        font-size: ${fontSizePx + 1}px;
        font-weight: 800;
    }
    .order-meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 6px;
        padding: 6px 0;
        border-bottom: 1px dashed #ccc;
    }
    .meta-block { display: flex; flex-direction: column; gap: 2px; }
    .meta-center { text-align: center; }
    .meta-end { text-align: ${textAlignEnd}; }
    .meta-label { font-size: ${Math.max(fontSizePx - 4, 8)}px; color: #888; font-weight: 800; text-transform: uppercase; }
    .meta-value, .meta-time { font-weight: 700; }
    .type-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        background: #111;
        color: #fff;
        font-size: ${Math.max(fontSizePx - 2, 10)}px;
        font-weight: 700;
    }
    .customer-info { padding: 2px 0; }
    .info-chip { padding: 2px 0; font-weight: 600; color: #333; }
    .items-table, .summary-table { width: 100%; border-collapse: collapse; }
    .items-header td {
        font-size: ${Math.max(fontSizePx - 3, 9)}px;
        font-weight: 800;
        text-transform: uppercase;
        color: #777;
        border-bottom: 2px solid #222;
    }
    .items-table td {
        padding: 4px 2px;
        vertical-align: top;
        border-bottom: 1px dashed #e5e5e5;
    }
    .col-item { width: 48%; text-align: ${textAlign}; }
    .col-qty { width: 12%; text-align: center; }
    .col-price { width: 20%; text-align: center; }
    .col-total { width: 20%; text-align: ${textAlignEnd}; font-weight: 700; }
    .item-name { display: block; font-weight: 700; }
    .item-mod, .item-note { font-size: ${Math.max(fontSizePx - 2, 10)}px; color: #666; margin-top: 1px; }
    .mod-price { color: #999; }
    .summary-row td { padding: 3px 0; font-weight: 600; }
    .summary-row td:last-child { text-align: ${textAlignEnd}; }
    .discount-row td { color: #2e7d32; }
    .money {
        display: inline-block;
        direction: ltr;
        unicode-bidi: isolate;
        white-space: nowrap;
    }
    .grand-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 6px;
        border-radius: 6px;
        background: #111;
        color: #fff;
        font-weight: 800;
        margin-top: 6px;
    }
    .grand-total-value { font-size: ${fontSizePx + 3}px; font-weight: 900; }
    .payment-pill {
        display: inline-block;
        border: 1.5px solid #333;
        border-radius: 999px;
        padding: 3px 12px;
        font-size: ${Math.max(fontSizePx - 2, 10)}px;
        font-weight: 700;
    }
    .qr-box {
        width: ${Math.max(Number(template.paperWidth === '58mm' ? 52 : 72), Number((template.blocks.find((b) => b.type === 'qrCode')?.config?.size || 72)))}px;
        height: ${Math.max(Number(template.paperWidth === '58mm' ? 52 : 72), Number((template.blocks.find((b) => b.type === 'qrCode')?.config?.size || 72)))}px;
        margin: 0 auto 6px;
        border: 2px solid #111;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
    }
    .qr-text { font-size: ${Math.max(fontSizePx - 3, 9)}px; color: #666; word-break: break-all; }
    .receipt-footer {
        padding-top: 8px;
        border-top: 2px solid #111;
        margin-top: 8px;
    }
    .footer-thanks { font-size: ${fontSizePx + 1}px; font-weight: 800; }
    .tax-id-line, .powered-by { font-size: ${Math.max(fontSizePx - 3, 8)}px; color: #777; margin-top: 4px; }
    .dashed-sep, .thick-sep { border: none; margin: 6px 0; }
    .dashed-sep { border-top: 1px dashed #bbb; }
    .thick-sep { border-top: 2px solid #222; }
</style>
</head>
<body>${blockHtml}</body>
</html>`;
};
