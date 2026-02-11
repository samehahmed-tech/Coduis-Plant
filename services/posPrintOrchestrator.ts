import { Branch, MenuCategory, Order, OrderItem, Printer } from '../types';
import { formatReceipt } from './receiptFormatter';
import { PrintJob, printService } from '../src/services/printService';

interface KitchenPrintParams {
  order: Order;
  categories: MenuCategory[];
  printers: Printer[];
  branchId: string;
  maxKitchenPrinters?: number;
  settings: any;
  currencySymbol: string;
  lang: 'en' | 'ar';
  t: any;
  branch?: Branch;
}

interface ReceiptPrintParams {
  order: Order;
  settings: any;
  currencySymbol: string;
  lang: 'en' | 'ar';
  t: any;
  branch?: Branch;
  title?: string;
}

const DEFAULT_MAX_KITCHEN_PRINTERS = 2;

const normalizeMaxPrinters = (value?: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_KITCHEN_PRINTERS;
  return Math.floor(parsed);
};

const resolvePrinterDetails = (printer: Printer | undefined): Partial<PrintJob> => {
  if (!printer) return {};
  return {
    printerId: printer.id,
    printerAddress: printer.address,
    printerType: printer.type,
  };
};

const resolveItemPrinterIds = (
  item: OrderItem,
  categoryMap: Map<string, MenuCategory>,
  activePrinters: Printer[],
  maxKitchenPrinters: number
): string[] => {
  const activePrinterIds = new Set(activePrinters.map(p => p.id));
  const itemPrinterIds = (item.printerIds || []).filter(id => activePrinterIds.has(id));
  if (itemPrinterIds.length > 0) return itemPrinterIds.slice(0, maxKitchenPrinters);

  const categoryPrinterIds = (categoryMap.get(item.categoryId)?.printerIds || []).filter(id => activePrinterIds.has(id));
  if (categoryPrinterIds.length > 0) return categoryPrinterIds.slice(0, maxKitchenPrinters);

  if (activePrinters.length > 0) return [activePrinters[0].id];
  return [];
};

export const printKitchenTicketsByRouting = async ({
  order,
  categories,
  printers,
  branchId,
  maxKitchenPrinters,
  settings,
  currencySymbol,
  lang,
  t,
  branch,
}: KitchenPrintParams): Promise<void> => {
  const maxPrinters = normalizeMaxPrinters(maxKitchenPrinters);
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const branchPrinters = (printers || []).filter(p => p.isActive && (!p.branchId || p.branchId === branchId));

  const grouped = new Map<string, OrderItem[]>();
  for (const item of order.items || []) {
    const resolvedPrinterIds = resolveItemPrinterIds(item, categoryMap, branchPrinters, maxPrinters);
    const targets = resolvedPrinterIds.length > 0 ? resolvedPrinterIds : ['_fallback'];
    for (const printerId of targets) {
      if (!grouped.has(printerId)) grouped.set(printerId, []);
      grouped.get(printerId)!.push(item);
    }
  }

  for (const [printerId, items] of grouped.entries()) {
    const targetPrinter = printerId === '_fallback' ? undefined : branchPrinters.find(p => p.id === printerId);
    const printerLabel = targetPrinter?.name ? ` - ${targetPrinter.name}` : '';

    await printService.print({
      type: 'KITCHEN',
      ...resolvePrinterDetails(targetPrinter),
      content: formatReceipt({
        order: { ...order, items },
        title: `${t.kitchen_ticket || (lang === 'ar' ? 'شيك المطبخ' : 'Kitchen Ticket')}${printerLabel}`,
        settings,
        currencySymbol,
        lang,
        t,
        branch
      })
    });
  }
};

export const printOrderReceipt = async ({
  order,
  settings,
  currencySymbol,
  lang,
  t,
  branch,
  title
}: ReceiptPrintParams): Promise<void> => {
  await printService.print({
    type: 'RECEIPT',
    content: formatReceipt({
      order,
      title: title || t.order_receipt || (lang === 'ar' ? 'إيصال الطلب' : 'Order Receipt'),
      settings,
      currencySymbol,
      lang,
      t,
      branch
    })
  });
};

