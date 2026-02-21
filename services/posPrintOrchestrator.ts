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
  printers?: Printer[];
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

const isOperationalPrinter = (printer: Printer) => printer.isActive && printer.isOnline !== false;

const resolveBranchPrinters = (printers: Printer[], branchId: string) =>
  (printers || []).filter((p) => p.isActive && (!p.branchId || p.branchId === branchId));

const resolveOnlineBranchPrinters = (printers: Printer[], branchId: string) =>
  resolveBranchPrinters(printers, branchId).filter(isOperationalPrinter);

const resolvePrimaryCashierPrinter = (printers: Printer[], branchId: string, settings: any): Printer | undefined => {
  const branchPrinters = resolveBranchPrinters(printers, branchId);
  const onlineBranchPrinters = resolveOnlineBranchPrinters(printers, branchId);
  const bySetting = String(settings?.primaryCashierPrinterId || '').trim();

  if (bySetting) {
    const target = onlineBranchPrinters.find((p) => p.id === bySetting) || branchPrinters.find((p) => p.id === bySetting);
    if (target) return target;
  }

  return (
    onlineBranchPrinters.find((p) => p.isPrimaryCashier === true || p.role === 'CASHIER') ||
    branchPrinters.find((p) => p.isPrimaryCashier === true || p.role === 'CASHIER') ||
    onlineBranchPrinters[0] ||
    branchPrinters[0]
  );
};

const resolveItemPrinterIds = (
  item: OrderItem,
  categoryMap: Map<string, MenuCategory>,
  activePrinters: Printer[],
  onlinePrinters: Printer[],
  maxKitchenPrinters: number
): string[] => {
  const activePrinterIds = new Set(activePrinters.map((p) => p.id));
  const onlinePrinterIds = new Set(onlinePrinters.map((p) => p.id));

  const itemOnlinePrinterIds = (item.printerIds || []).filter((id) => onlinePrinterIds.has(id));
  if (itemOnlinePrinterIds.length > 0) return itemOnlinePrinterIds.slice(0, maxKitchenPrinters);

  const categoryOnlinePrinterIds = (categoryMap.get(item.categoryId)?.printerIds || []).filter((id) => onlinePrinterIds.has(id));
  if (categoryOnlinePrinterIds.length > 0) return categoryOnlinePrinterIds.slice(0, maxKitchenPrinters);

  const itemActivePrinterIds = (item.printerIds || []).filter((id) => activePrinterIds.has(id));
  if (itemActivePrinterIds.length > 0) return itemActivePrinterIds.slice(0, maxKitchenPrinters);

  const categoryActivePrinterIds = (categoryMap.get(item.categoryId)?.printerIds || []).filter((id) => activePrinterIds.has(id));
  if (categoryActivePrinterIds.length > 0) return categoryActivePrinterIds.slice(0, maxKitchenPrinters);

  if (onlinePrinters.length > 0) return [onlinePrinters[0].id];
  if (activePrinters.length > 0) return [activePrinters[0].id];
  return [];
};

const resolveFallbackKitchenPrinter = (activePrinters: Printer[], onlinePrinters: Printer[]) =>
  onlinePrinters[0] || activePrinters[0];

const buildKitchenTitle = (
  lang: 'en' | 'ar',
  t: any,
  targetPrinter?: Printer,
  isFallback?: boolean
) => {
  const roleLabel = targetPrinter?.role ? ` (${targetPrinter.role})` : '';
  const fallbackLabel = isFallback ? (lang === 'ar' ? ' - »œÌ·' : ' - Fallback') : '';
  const printerLabel = targetPrinter?.name ? ` - ${targetPrinter.name}${roleLabel}` : '';
  return `${t.kitchen_ticket || (lang === 'ar' ? '‘Ìﬂ «·„ÿ»Œ' : 'Kitchen Ticket')}${printerLabel}${fallbackLabel}`;
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
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const branchPrinters = resolveBranchPrinters(printers || [], branchId);
  const onlineBranchPrinters = resolveOnlineBranchPrinters(printers || [], branchId);

  const grouped = new Map<string, { items: OrderItem[]; isFallback: boolean }>();
  for (const item of order.items || []) {
    const resolvedPrinterIds = resolveItemPrinterIds(item, categoryMap, branchPrinters, onlineBranchPrinters, maxPrinters);
    const targets = resolvedPrinterIds.length > 0 ? resolvedPrinterIds : ['_fallback'];

    for (const printerId of targets) {
      const targetPrinter = printerId === '_fallback'
        ? resolveFallbackKitchenPrinter(branchPrinters, onlineBranchPrinters)
        : branchPrinters.find((p) => p.id === printerId) || resolveFallbackKitchenPrinter(branchPrinters, onlineBranchPrinters);

      const groupedPrinterId = targetPrinter?.id || '_fallback';
      if (!grouped.has(groupedPrinterId)) {
        const isFallback = printerId === '_fallback' || (targetPrinter ? targetPrinter.isOnline === false : false);
        grouped.set(groupedPrinterId, { items: [], isFallback });
      }
      grouped.get(groupedPrinterId)!.items.push(item);
    }
  }

  for (const [printerId, payload] of grouped.entries()) {
    const targetPrinter = printerId === '_fallback'
      ? resolveFallbackKitchenPrinter(branchPrinters, onlineBranchPrinters)
      : branchPrinters.find((p) => p.id === printerId) || resolveFallbackKitchenPrinter(branchPrinters, onlineBranchPrinters);

    await printService.print({
      type: 'KITCHEN',
      ...resolvePrinterDetails(targetPrinter),
      branchId,
      content: formatReceipt({
        order: { ...order, items: payload.items },
        title: buildKitchenTitle(lang, t, targetPrinter, payload.isFallback),
        settings,
        currencySymbol,
        lang,
        t,
        branch,
      }),
    });
  }
};

export const printOrderReceipt = async ({
  order,
  printers,
  settings,
  currencySymbol,
  lang,
  t,
  branch,
  title,
}: ReceiptPrintParams): Promise<void> => {
  const receiptBrandingByOrderType = settings?.receiptBrandingByOrderType || {};
  const override = receiptBrandingByOrderType?.[order.type] || {};
  const effectiveSettings = {
    ...settings,
    receiptLogoUrl: override.logoUrl || settings?.receiptLogoUrl || '',
    receiptQrUrl: override.qrUrl || settings?.receiptQrUrl || '',
  };
  const primaryCashierPrinter = resolvePrimaryCashierPrinter(printers || [], order.branchId, settings);

  await printService.print({
    type: 'RECEIPT',
    ...resolvePrinterDetails(primaryCashierPrinter),
    branchId: order.branchId,
    content: formatReceipt({
      order,
      title: title || t.order_receipt || (lang === 'ar' ? '≈Ì’«· «·ÿ·»' : 'Order Receipt'),
      settings: effectiveSettings,
      currencySymbol,
      lang,
      t,
      branch,
    }),
  });
};
