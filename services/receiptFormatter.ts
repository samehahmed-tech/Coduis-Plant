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
    const boldLine = '='.repeat(width);
    const center = (value: string) => {
        const text = String(value || '').trim();
        if (text.length >= width) return text;
        const left = Math.floor((width - text.length) / 2);
        const right = width - text.length - left;
        return `${' '.repeat(left)}${text}${' '.repeat(right)}`;
    };
    const cap = (text: string, size: number) => text.length > size ? `${text.slice(0, Math.max(size - 1, 1))}...` : text;
    const padRight = (value: string, size: number) => (value.length >= size ? value.slice(0, size) : value + ' '.repeat(size - value.length));
    const padLeft = (value: string, size: number) => (value.length >= size ? value.slice(0, size) : ' '.repeat(size - value.length) + value);
    const row = (left: string, right: string) => `${padRight(cap(left, 24), 24)}${padLeft(right, 18)}`;

    const wrapLabel = (value: string, size: number) => {
        const words = String(value || '').split(' ').filter(Boolean);
        const out: string[] = [];
        let current = '';

        for (const word of words) {
            if (!current) {
                current = word;
                continue;
            }
            if (`${current} ${word}`.length <= size) {
                current = `${current} ${word}`;
            } else {
                out.push(current);
                current = word;
            }
        }
        if (current) out.push(current);
        if (out.length === 0) out.push(String(value || '').slice(0, size));
        return out;
    };

    const lines: string[] = [];

    lines.push(center(settings.restaurantName || 'Restaurant ERP'));
    if (branch?.name) lines.push(center(branch.name));
    if (settings.branchAddress) lines.push(center(cap(settings.branchAddress, width)));
    if (settings.phone) lines.push(center(`Tel: ${settings.phone}`));

    lines.push(boldLine);
    lines.push(center(title || (lang === 'ar' ? 'Sales Receipt' : 'Sales Receipt')));
    lines.push(boldLine);

    lines.push(row(`${t.order || 'Order'} #${order.id}`, createdAt.toLocaleDateString()));
    lines.push(row(`${t.order_type || 'Type'}: ${orderTypeText}`, createdAt.toLocaleTimeString()));
    if (order.tableId) lines.push(row(`${t.table || 'Table'}: ${order.tableId}`, ''));
    if (order.customerName) lines.push(row(`${lang === 'ar' ? 'Customer' : 'Customer'}: ${cap(order.customerName, 18)}`, ''));
    if (order.customerPhone) lines.push(row(`${lang === 'ar' ? 'Phone' : 'Phone'}: ${order.customerPhone}`, ''));
    if (order.deliveryAddress) {
        lines.push(row(lang === 'ar' ? 'Address' : 'Address', ''));
        wrapLabel(order.deliveryAddress, width).forEach(chunk => lines.push(chunk));
    }

    lines.push(line);
    lines.push(row(lang === 'ar' ? 'Item' : 'Item', lang === 'ar' ? 'Total' : 'Total'));
    lines.push(line);

    (order.items || []).forEach(item => {
        const mods = item.selectedModifiers?.map(m => `${m.optionName} (+${m.price})`).join(', ');
        const lineTotal = (item.price + (item.selectedModifiers || []).reduce((sum, m) => sum + m.price, 0)) * item.quantity;
        const label = `${item.quantity}x ${item.name}`;
        const totalText = `${currencySymbol}${lineTotal.toFixed(2)}`;

        const labelLines = wrapLabel(label, 24);
        lines.push(`${padRight(cap(labelLines[0], 24), 24)}${padLeft(totalText, 18)}`);
        for (let i = 1; i < labelLines.length; i += 1) {
            lines.push(`${padRight(cap(labelLines[i], 24), 24)}${padLeft('', 18)}`);
        }

        if (mods) lines.push(`  + ${mods}`);
        if (item.notes) lines.push(`  * ${item.notes}`);
    });

    lines.push(boldLine);
    lines.push(row(t.subtotal || 'Subtotal', `${currencySymbol}${(order.subtotal ?? 0).toFixed(2)}`));
    lines.push(row(t.tax || 'Tax', `${currencySymbol}${(order.tax ?? 0).toFixed(2)}`));
    if ((order.discount || 0) > 0) {
        const discountAmount = ((order.subtotal || 0) * (order.discount || 0)) / 100;
        lines.push(row(t.discount || 'Discount', `-${currencySymbol}${discountAmount.toFixed(2)}`));
    }
    lines.push(row(t.total || 'Total', `${currencySymbol}${(order.total ?? 0).toFixed(2)}`));
    if (order.paymentMethod) lines.push(row(lang === 'ar' ? 'Payment' : 'Payment', String(order.paymentMethod)));
    lines.push(boldLine);

    lines.push(center(lang === 'ar' ? 'Thank you for your order' : 'Thank you for your order'));

    if (settings.receiptQrUrl) {
        lines.push(center('[QR]'));
        lines.push(settings.receiptQrUrl);
    }
    if (settings.receiptLogoUrl) {
        lines.push(center(settings.receiptLogoUrl));
    }

    lines.push('\n');
    return lines.join('\n');
};
