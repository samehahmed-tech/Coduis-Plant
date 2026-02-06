import { AppSettings, Order, OrderType, Branch } from '../types';

interface ReceiptParams {
    order: Order;
    title?: string;
    settings: AppSettings;
    currencySymbol: string;
    lang: 'en' | 'ar';
    t: any;
    branch?: Branch;
}

export const formatReceipt = ({
    order,
    title,
    settings,
    currencySymbol,
    lang,
    t,
    branch
}: ReceiptParams) => {
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const orderTypeText =
        order.type === OrderType.DINE_IN
            ? t.dine_in
            : order.type === OrderType.DELIVERY
                ? t.delivery
                : order.type === OrderType.PICKUP
                    ? (t.pickup || 'Pickup')
                    : t.takeaway;

    const width = 42;
    const line = '-'.repeat(width);
    const center = (value: string) => {
        const text = value.trim();
        if (text.length >= width) return text;
        const left = Math.floor((width - text.length) / 2);
        const right = width - text.length - left;
        return `${' '.repeat(left)}${text}${' '.repeat(right)}`;
    };
    const padRight = (value: string, size: number) => (value.length >= size ? value.slice(0, size) : value + ' '.repeat(size - value.length));
    const padLeft = (value: string, size: number) => (value.length >= size ? value.slice(0, size) : ' '.repeat(size - value.length) + value);

    const lines: string[] = [];
    if (settings.receiptLogoUrl) {
        lines.push(center('[LOGO]'));
        lines.push(settings.receiptLogoUrl);
    }
    lines.push(center(settings.restaurantName || 'Restaurant'));
    if (branch?.name) lines.push(center(branch.name));
    if (settings.branchAddress) lines.push(settings.branchAddress);
    if (settings.phone) lines.push(`Tel: ${settings.phone}`);
    lines.push(line);
    if (title) lines.push(center(title));
    lines.push(`${t.order || 'Order'} #${order.id}`);
    lines.push(`${t.order_type || 'Type'}: ${orderTypeText}`);
    if (order.tableId) lines.push(`${t.table}: ${order.tableId}`);
    if (order.customerName) lines.push(`${lang === 'ar' ? 'العميل' : 'Customer'}: ${order.customerName}`);
    if (order.customerPhone) lines.push(`${lang === 'ar' ? 'الهاتف' : 'Phone'}: ${order.customerPhone}`);
    if (order.deliveryAddress) lines.push(`${lang === 'ar' ? 'العنوان' : 'Address'}: ${order.deliveryAddress}`);
    lines.push(createdAt.toLocaleString());
    lines.push(line);
    lines.push(`${padRight(lang === 'ar' ? 'الصنف' : 'Item', 24)}${padLeft(lang === 'ar' ? 'الإجمالي' : 'Total', 18)}`);
    lines.push(line);

    (order.items || []).forEach(item => {
        const mods = item.selectedModifiers?.map(m => `${m.optionName} (+${m.price})`).join(', ');
        const lineTotal = (item.price + (item.selectedModifiers || []).reduce((sum, m) => sum + m.price, 0)) * item.quantity;
        const label = `${item.quantity}x ${item.name}`;
        const totalText = `${currencySymbol}${lineTotal.toFixed(2)}`;
        lines.push(`${padRight(label, 24)}${padLeft(totalText, 18)}`);
        if (mods) lines.push(`  + ${mods}`);
        if (item.notes) lines.push(`  * ${item.notes}`);
    });

    lines.push(line);
    lines.push(`${padRight(t.subtotal, 24)}${padLeft(`${currencySymbol}${(order.subtotal ?? 0).toFixed(2)}`, 18)}`);
    lines.push(`${padRight(t.tax, 24)}${padLeft(`${currencySymbol}${(order.tax ?? 0).toFixed(2)}`, 18)}`);
    lines.push(`${padRight(t.total, 24)}${padLeft(`${currencySymbol}${(order.total ?? 0).toFixed(2)}`, 18)}`);
    lines.push(line);
    lines.push(center(lang === 'ar' ? 'شكراً لزيارتكم' : 'Thank you'));
    if (settings.receiptQrUrl) {
        lines.push(center('[QR]'));
        lines.push(settings.receiptQrUrl);
    }
    lines.push('\n');

    return lines.join('\n');
};
