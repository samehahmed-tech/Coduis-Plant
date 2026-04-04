/**
 * receiptTemplate.ts — Generates styled HTML receipt for browser printing
 * Designed for 80mm thermal printer width with premium layout & full Arabic support
 */
import { Order, OrderType, Branch, AppSettings } from '../types';
import { calculateOrderTotalsFromOrder } from './orderTotals';

interface ReceiptTemplateParams {
   order: Order;
   settings: AppSettings;
   currencySymbol: string;
   lang: 'en' | 'ar';
   t: any;
   branch?: Branch;
   title?: string;
}

export const generateReceiptHTML = ({
   order,
   settings,
   currencySymbol,
   lang,
   t,
   branch,
   title,
}: ReceiptTemplateParams): string => {
   const isAr = lang === 'ar';
   const dir = isAr ? 'rtl' : 'ltr';
   const align = isAr ? 'right' : 'left';
   const alignEnd = isAr ? 'left' : 'right';
   const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
   const dateStr = createdAt.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
   const timeStr = createdAt.toLocaleTimeString(isAr ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

   const orderTypeLabels: Record<string, { ar: string; en: string; icon: string }> = {
      [OrderType.DINE_IN]: { ar: 'داخلي', en: 'Dine-In', icon: '🍽' },
      [OrderType.DELIVERY]: { ar: 'توصيل', en: 'Delivery', icon: '🚗' },
      [OrderType.PICKUP]: { ar: 'استلام', en: 'Pickup', icon: '🛍' },
      [OrderType.TAKEAWAY]: { ar: 'تيك أواي', en: 'Takeaway', icon: '📦' },
   };
   const typeInfo = orderTypeLabels[order.type] || orderTypeLabels[OrderType.TAKEAWAY];
   const orderTypeText = `${typeInfo.icon} ${isAr ? typeInfo.ar : typeInfo.en}`;

   const restaurantName = settings.restaurantName || 'Restaurant';
   const branchName = branch?.name || (isAr ? branch?.nameAr : branch?.name) || '';
   const branchAddr = settings.branchAddress || branch?.address || '';
   const phone = settings.phone || branch?.phone || '';
   const taxId = (settings as any).taxRegistrationNumber || '';

   // ─── Calculate totals ───
   const totals = calculateOrderTotalsFromOrder(order, settings);
   const subtotal = totals.subtotal;
   const totalItemDiscounts = totals.itemDiscountTotal;
   const itemRows = (order.items || []).map((item, idx) => {
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

      const name = isAr ? ((item as any).nameAr || item.name) : item.name;

      const modLines = (item.selectedModifiers || []).map(m =>
         `<div class="item-mod">+ ${m.optionName || m.groupName}${m.price > 0 ? ` <span class="mod-price">(${m.price.toFixed(2)})</span>` : ''}</div>`
      ).join('');

      const noteLine = item.notes
         ? `<div class="item-note">📝 ${item.notes}</div>`
         : '';

      const discountLine = itemDiscount > 0
         ? `<div class="item-discount">🏷 ${isAr ? 'خصم' : 'Disc'}: -${itemDiscount.toFixed(2)}</div>`
         : '';

      const rowBg = idx % 2 === 0 ? '' : ' class="alt-row"';

      return `
         <tr${rowBg}>
            <td class="col-item">
               <span class="item-name">${name}</span>
               ${modLines}${noteLine}${discountLine}
            </td>
            <td class="col-qty">${item.quantity || 1}</td>
            <td class="col-price">${unitPrice.toFixed(2)}</td>
            <td class="col-total">${lineNet.toFixed(2)}</td>
         </tr>
      `;
   }).join('');

   const orderDiscount = totals.orderDiscountAmount;
   const tax = totals.tax;
   const total = totals.total;

   // ─── Summary rows ───
   const summaryLines: { label: string; value: string; cls: string }[] = [];
   summaryLines.push({ label: isAr ? 'المجموع الفرعي' : 'Subtotal', value: `${subtotal.toFixed(2)}`, cls: '' });
   if (totalItemDiscounts > 0) {
      summaryLines.push({ label: isAr ? 'خصومات الأصناف' : 'Item Discounts', value: `-${totalItemDiscounts.toFixed(2)}`, cls: 'discount-row' });
   }
   if (orderDiscount > 0) {
      summaryLines.push({ label: isAr ? `خصم ${order.discount}%` : `Discount ${order.discount}%`, value: `-${orderDiscount.toFixed(2)}`, cls: 'discount-row' });
   }
   summaryLines.push({ label: isAr ? 'الضريبة' : 'Tax', value: tax.toFixed(2), cls: '' });
   if (order.tipAmount && order.tipAmount > 0) {
      summaryLines.push({ label: isAr ? 'البقشيش' : 'Tip', value: order.tipAmount.toFixed(2), cls: '' });
   }

   const summaryHTML = summaryLines.map(r => `
      <tr class="summary-line ${r.cls}">
         <td>${r.label}</td>
         <td>${r.value}</td>
      </tr>
   `).join('');

   // ─── Payment ───
   const pmStr = String(order.paymentMethod || '').toUpperCase();
   const paymentLabels: Record<string, { ar: string; en: string }> = {
      CASH: { ar: 'كاش', en: 'Cash' },
      CARD: { ar: 'بطاقة', en: 'Card' },
      VISA: { ar: 'فيزا', en: 'Visa' },
      VODAFONE_CASH: { ar: 'فودافون كاش', en: 'Vodafone Cash' },
      INSTAPAY: { ar: 'انستا باي', en: 'InstaPay' },
      SPLIT: { ar: 'مقسّم', en: 'Split' },
   };
   const pmInfo = paymentLabels[pmStr];
   const paymentMethodText = pmInfo ? (isAr ? pmInfo.ar : pmInfo.en) : (order.paymentMethod ? String(order.paymentMethod) : '');

   const receiptTitle = title || t?.order_receipt || (isAr ? 'إيصال بيع' : 'Sales Receipt');

   // ─── Customer / table info ───
   let customerBlock = '';
   if (order.tableId) {
      customerBlock += `<div class="info-chip">🪑 ${isAr ? 'طاولة' : 'Table'}: <strong>${order.tableId}</strong></div>`;
   }
   if (order.customerName) {
      customerBlock += `<div class="info-chip">👤 ${order.customerName}${order.customerPhone ? ` · ${order.customerPhone}` : ''}</div>`;
   }
   if (order.deliveryAddress) {
      customerBlock += `<div class="info-chip">📍 ${order.deliveryAddress}</div>`;
   }
   if (order.notes) {
      customerBlock += `<div class="info-chip order-note">📋 ${order.notes}</div>`;
   }

   return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${restaurantName} - ${receiptTitle}</title>
<style>
   @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

   @page { margin: 3mm; size: 80mm auto; }
   * { margin: 0; padding: 0; box-sizing: border-box; }

   body {
      font-family: 'Cairo', 'Segoe UI', 'Arial', sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      width: 72mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 3mm;
      direction: ${dir};
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
   }

   /* ── Header ── */
   .receipt-header {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #111;
   }
   .restaurant-name {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      line-height: 1.2;
   }
   .branch-name { font-size: 12px; font-weight: 700; color: #444; margin-top: 1px; }
   .branch-info { font-size: 10px; color: #777; margin-top: 1px; }

   /* ── Title ── */
   .receipt-title {
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 6px 0;
      margin: 6px 0;
      border: 1px dashed #999;
      border-radius: 4px;
      background: #f5f5f5;
   }

   /* ── Order Meta ── */
   .order-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
      padding: 6px 0;
      border-bottom: 1px dashed #ccc;
   }
   .meta-block {
      display: flex;
      flex-direction: column;
      gap: 1px;
   }
   .meta-label {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #999;
   }
   .meta-value {
      font-weight: 700;
      font-size: 12px;
   }
   .type-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #111;
      color: #fff;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
   }

   /* ── Customer Info ── */
   .customer-info {
      padding: 4px 0 6px;
   }
   .info-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 0;
      color: #333;
   }
   .order-note {
      font-style: italic;
      color: #666;
   }

   /* ── Items Table ── */
   .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
   }
   .items-header td {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #888;
      padding: 4px 0;
      border-bottom: 2px solid #222;
   }
   .col-item { text-align: ${align}; width: 48%; }
   .col-qty  { text-align: center; width: 12%; }
   .col-price { text-align: center; width: 18%; }
   .col-total { text-align: ${alignEnd}; width: 22%; font-weight: 700; }
   .items-table td {
      padding: 5px 2px;
      border-bottom: 1px dashed #e5e5e5;
      vertical-align: top;
      font-size: 12px;
   }
   .alt-row td { background: #fafafa; }
   .item-name { font-weight: 700; font-size: 12px; display: block; line-height: 1.3; }
   .item-mod {
      font-size: 10px;
      color: #666;
      padding-${align}: 8px;
      line-height: 1.3;
   }
   .mod-price { color: #999; }
   .item-note {
      font-size: 10px;
      color: #888;
      font-style: italic;
      padding-${align}: 8px;
      margin-top: 1px;
   }
   .item-discount {
      font-size: 10px;
      color: #2e7d32;
      font-weight: 600;
      padding-${align}: 8px;
   }

   /* ── Separator ── */
   .dashed-sep {
      border: none;
      border-top: 1px dashed #bbb;
      margin: 6px 0;
   }
   .thick-sep {
      border: none;
      border-top: 2px solid #222;
      margin: 8px 0;
   }

   /* ── Summary ── */
   .summary-table {
      width: 100%;
      border-collapse: collapse;
   }
   .summary-line td {
      padding: 3px 0;
      font-size: 11px;
      font-weight: 600;
      color: #444;
   }
   .summary-line td:last-child { text-align: ${alignEnd}; }
   .discount-row td { color: #2e7d32; }

   /* ── Grand Total ── */
   .grand-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 6px;
      margin: 6px 0;
      background: #111;
      color: #fff;
      border-radius: 6px;
   }
   .grand-total-label {
      font-size: 14px;
      font-weight: 800;
   }
   .grand-total-value {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.5px;
   }

   /* ── Payment ── */
   .payment-section {
      text-align: center;
      padding: 6px 0;
   }
   .payment-pill {
      display: inline-block;
      padding: 3px 14px;
      border: 1.5px solid #333;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
   }

   /* ── Footer ── */
   .receipt-footer {
      text-align: center;
      padding-top: 8px;
      border-top: 2px solid #111;
      margin-top: 8px;
   }
   .footer-thanks {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 2px;
   }
   .footer-sub {
      font-size: 10px;
      color: #888;
   }
   .tax-id-line {
      font-size: 9px;
      color: #aaa;
      margin-top: 4px;
   }
   .powered-by {
      font-size: 7px;
      color: #ccc;
      margin-top: 8px;
      letter-spacing: 0.5px;
   }

   @media print {
      body { width: 72mm; padding: 0; }
      .no-print { display: none !important; }
   }
</style>
</head>
<body>

   <!-- ═══ Header ═══ -->
   <div class="receipt-header">
      <div class="restaurant-name">${restaurantName}</div>
      ${branchName ? `<div class="branch-name">${branchName}</div>` : ''}
      ${branchAddr ? `<div class="branch-info">${branchAddr}</div>` : ''}
      ${phone ? `<div class="branch-info">${isAr ? 'هاتف' : 'Tel'}: ${phone}</div>` : ''}
   </div>

   <!-- ═══ Title ═══ -->
   <div class="receipt-title">${receiptTitle}</div>

   <!-- ═══ Order Meta ═══ -->
   <div class="order-meta">
      <div class="meta-block">
         <span class="meta-label">${isAr ? 'رقم الطلب' : 'ORDER #'}</span>
         <span class="meta-value">${order.orderNumber || order.id?.slice(0, 8) || '—'}</span>
      </div>
      <div class="meta-block" style="text-align:center;">
         <span class="meta-label">${isAr ? 'النوع' : 'TYPE'}</span>
         <span class="type-badge">${orderTypeText}</span>
      </div>
      <div class="meta-block" style="text-align:${alignEnd}">
         <span class="meta-label">${isAr ? 'التاريخ' : 'DATE'}</span>
         <span class="meta-value">${dateStr}</span>
         <span style="font-size:10px;color:#666;">${timeStr}</span>
      </div>
   </div>

   <!-- ═══ Customer / Table ═══ -->
   ${customerBlock ? `<div class="customer-info">${customerBlock}</div>` : ''}

   <hr class="dashed-sep">

   <!-- ═══ Items ═══ -->
   <table class="items-table">
      <tr class="items-header">
         <td class="col-item">${isAr ? 'الصنف' : 'Item'}</td>
         <td class="col-qty">${isAr ? 'كمية' : 'Qty'}</td>
         <td class="col-price">${isAr ? 'سعر' : 'Price'}</td>
         <td class="col-total">${isAr ? 'المبلغ' : 'Total'}</td>
      </tr>
      ${itemRows}
   </table>

   <hr class="thick-sep">

   <!-- ═══ Summary ═══ -->
   <table class="summary-table">
      ${summaryHTML}
   </table>

   <!-- ═══ Grand Total ═══ -->
   <div class="grand-total">
      <span class="grand-total-label">${isAr ? 'الإجمالي' : 'TOTAL'}</span>
      <span class="grand-total-value">${currencySymbol} ${total.toFixed(2)}</span>
   </div>

   <!-- ═══ Payment ═══ -->
   ${paymentMethodText ? `
   <div class="payment-section">
      <span class="payment-pill">${isAr ? 'الدفع' : 'Paid'}: ${paymentMethodText}</span>
   </div>
   ` : ''}

   <!-- ═══ Footer ═══ -->
   <div class="receipt-footer">
      <div class="footer-thanks">${(settings as any).receiptFooterMessage || (isAr ? 'شكراً لزيارتكم! 🙏' : 'Thank you for your visit! 🙏')}</div>
      <div class="footer-sub">${isAr ? 'نتمنى لكم تجربة سعيدة' : 'We hope you enjoyed your experience'}</div>
      ${taxId ? `<div class="tax-id-line">${isAr ? 'الرقم الضريبي' : 'Tax ID'}: ${taxId}</div>` : ''}
      <div class="powered-by">Powered by RestoFlow ERP</div>
   </div>

</body>
</html>`;
};
