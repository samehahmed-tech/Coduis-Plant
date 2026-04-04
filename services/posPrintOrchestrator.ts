import { Branch, MenuCategory, Order, OrderItem, Printer } from '../types';
import { formatReceipt } from './receiptFormatter';
import { generateReceiptHTML } from './receiptTemplate';
import { generateKitchenTicketHTML } from './kitchenTicketTemplate';
import { PrintJob, printService } from '../src/services/printService';
import { findDefaultTemplate, findTemplateForPrinter, generateFromTemplate, generateHtmlFromTemplate } from './templateReceiptGenerator';
import { getPrinterReceiptMode } from './printerReceiptMode';

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

const resolveItemPrinterIds = (
    item: OrderItem,
    categoryMap: Map<string, MenuCategory>,
    branchPrinters: Printer[],
    onlineBranchPrinters: Printer[],
    maxPrinters: number
): string[] => {
    const itemCategory = categoryMap.get(item.categoryId || '');
    const assignedPrinterIds = (itemCategory as any)?.kitchenPrinterIds || [];

    if (assignedPrinterIds.length === 0) {
        const kitchenPrinters = onlineBranchPrinters.filter((p) => String(p.role).toUpperCase() === 'KITCHEN');
        return kitchenPrinters.slice(0, maxPrinters).map((p) => p.id);
    }

    const validIds: string[] = [];
    for (const pid of assignedPrinterIds) {
        const printer = branchPrinters.find((p) => p.id === pid);
        if (printer && isOperationalPrinter(printer)) {
            validIds.push(pid);
        }
    }
    return validIds.slice(0, maxPrinters);
};

const resolveFallbackKitchenPrinter = (
    branchPrinters: Printer[],
    onlineBranchPrinters: Printer[]
): Printer | undefined => {
    const kitchenPrinters = onlineBranchPrinters.filter((p) => String(p.role).toUpperCase() === 'KITCHEN');
    return kitchenPrinters[0] || onlineBranchPrinters[0] || branchPrinters[0];
};

const resolvePrimaryCashierPrinter = (
    printers: Printer[],
    branchId: string,
    settings: any
): Printer | undefined => {
    const branchPrinters = resolveBranchPrinters(printers, branchId);
    const online = branchPrinters.filter(isOperationalPrinter);

    if (settings?.defaultCashierPrinterId) {
        const found = online.find((p) => p.id === settings.defaultCashierPrinterId);
        if (found) return found;
    }

    const cashierPrinter = online.find((p) => ['CASHIER', 'RECEIPT'].includes(String(p.role).toUpperCase()));
    return cashierPrinter || online[0] || branchPrinters[0];
};

const resolvePrinterPaperWidth = (printer?: Printer, linkedTemplate?: { paperWidth?: '58mm' | '80mm' } | null): '58mm' | '80mm' => {
    if (linkedTemplate?.paperWidth) return linkedTemplate.paperWidth;
    const printerWidth = Number((printer as any)?.paperWidth || 0);
    return printerWidth > 0 && printerWidth <= 58 ? '58mm' : '80mm';
};

const buildKitchenTitle = (
    lang: 'en' | 'ar',
    t: any,
    targetPrinter?: Printer,
    isFallback?: boolean
) => {
    const roleLabel = targetPrinter?.role ? ` (${targetPrinter.role})` : '';
    const fallbackLabel = isFallback ? (lang === 'ar' ? ' - \u0628\u062F\u064A\u0644' : ' - Fallback') : '';
    const printerLabel = targetPrinter?.name ? ` - ${targetPrinter.name}${roleLabel}` : '';
    return `${t.kitchen_ticket || (lang === 'ar' ? '\u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u0645\u0637\u0628\u062E' : 'Kitchen Ticket')}${printerLabel}${fallbackLabel}`;
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

        const ticketTitle = buildKitchenTitle(lang, t, targetPrinter, payload.isFallback);
        const ticketOrder = { ...order, items: payload.items };

        // Determine if this is a network printer
        const isNetworkPrinter = targetPrinter
            && String(targetPrinter.type).toUpperCase() === 'NETWORK'
            && !!targetPrinter.address;

        let networkPrintSuccess = false;
        try {
            // Check for a designer template linked to this printer
            const linkedTemplate = targetPrinter ? findTemplateForPrinter(targetPrinter.id) : null;
            const content = linkedTemplate
                ? generateFromTemplate({ template: linkedTemplate, order: ticketOrder, settings, currencySymbol, lang, t, branch, title: ticketTitle })
                : formatReceipt({ order: ticketOrder, title: ticketTitle, settings, currencySymbol, lang, t, branch });

            const printOk = await printService.print({
                type: 'KITCHEN',
                ...resolvePrinterDetails(targetPrinter),
                branchId,
                content,
            });
            networkPrintSuccess = !!printOk;
        } catch (err) {
            console.warn('[Kitchen] printService.print() threw:', err);
        }

        // Browser fallback with styled HTML kitchen ticket
        if (!isNetworkPrinter || !networkPrintSuccess) {
            try {
                const htmlTicket = generateKitchenTicketHTML({
                    order: ticketOrder,
                    items: payload.items,
                    settings,
                    lang,
                    t,
                    branch,
                    title: ticketTitle,
                    printerName: targetPrinter?.name,
                });
                printService.printInBrowser(htmlTicket);
            } catch (browserErr) {
                console.warn('[Kitchen] Browser print fallback failed:', browserErr);
            }
        }
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
    console.log('[Receipt] printOrderReceipt called for order', order.id);

    const receiptBrandingByOrderType = settings?.receiptBrandingByOrderType || {};
    const override = receiptBrandingByOrderType?.[order.type] || {};
    const effectiveSettings = {
        ...settings,
        receiptLogoUrl: override.logoUrl || settings?.receiptLogoUrl || '',
        receiptQrUrl: override.qrUrl || settings?.receiptQrUrl || '',
    };
    const primaryCashierPrinter = resolvePrimaryCashierPrinter(printers || [], order.branchId, settings);

    const receiptTitle = title || t.order_receipt || (lang === 'ar' ? '\u0625\u064A\u0635\u0627\u0644 \u0628\u064A\u0639' : 'Order Receipt');

    const linkedTemplate = primaryCashierPrinter ? findTemplateForPrinter(primaryCashierPrinter.id) : null;
    const activeReceiptTemplate = linkedTemplate || findDefaultTemplate('receipt');
    const paperWidth = resolvePrinterPaperWidth(primaryCashierPrinter, activeReceiptTemplate);
    const receiptMode = primaryCashierPrinter ? getPrinterReceiptMode(primaryCashierPrinter.id) : 'RASTER_IMAGE';
    const hasDedicatedReceiptPrinter = !!primaryCashierPrinter;

    console.log('[Receipt] Using', activeReceiptTemplate ? `designer template "${activeReceiptTemplate.name}" (${receiptMode})` : `default receipt template (${receiptMode})`);

    // 1. Try sending to print server/bridge (thermal/local/network printers)
    let networkPrintSuccess = false;

    if (hasDedicatedReceiptPrinter) {
        // ── IMAGE MODE: Render styled HTML → image → print raster ──
        try {
            if (receiptMode === 'TEXT_RAW') {
                console.log('[Receipt] Generating raw text receipt from template...');
                const textReceipt = activeReceiptTemplate
                    ? generateFromTemplate({
                        template: activeReceiptTemplate,
                        order,
                        settings: effectiveSettings,
                        currencySymbol,
                        lang,
                        t,
                        branch,
                        title: receiptTitle,
                    })
                    : formatReceipt({
                        order,
                        title: receiptTitle,
                        settings: effectiveSettings,
                        currencySymbol,
                        lang,
                        t,
                        branch,
                    });

                const printOk = await printService.print({
                    type: 'RECEIPT',
                    ...resolvePrinterDetails(primaryCashierPrinter),
                    branchId: order.branchId,
                    content: textReceipt,
                    contentType: 'text',
                });
                networkPrintSuccess = !!printOk;
                console.log('[Receipt] Raw text print result:', printOk);
            } else {
            console.log('[Receipt] Generating styled HTML for image rendering...');
            const htmlReceipt = activeReceiptTemplate
                ? generateHtmlFromTemplate({
                    template: activeReceiptTemplate,
                    order,
                    settings: effectiveSettings,
                    currencySymbol,
                    lang,
                    t,
                    branch,
                    title: receiptTitle,
                })
                : generateReceiptHTML({
                    order,
                    settings: effectiveSettings,
                    currencySymbol,
                    lang,
                    t,
                    branch,
                    title: receiptTitle,
                });

            const { createImagePrintPayload } = await import('./receiptImageRenderer');
            const imagePayload = await createImagePrintPayload(htmlReceipt, paperWidth);

            console.log('[Receipt] Image rendered, base64 length:', imagePayload.content.length);

            const printOk = await printService.print({
                type: 'RECEIPT',
                ...resolvePrinterDetails(primaryCashierPrinter),
                branchId: order.branchId,
                content: imagePayload.content,
                contentType: 'image',
            });
            networkPrintSuccess = !!printOk;
            console.log('[Receipt] Image print result:', printOk);
            }
        } catch (imgErr) {
            console.warn('[Receipt] Image printing failed; skipping text fallback to avoid garbled thermal output:', imgErr);
        }
    }

    // 2. Browser print remains a last-resort fallback when no bridge printer is
    //    configured or image printing failed.
    if (!hasDedicatedReceiptPrinter || !networkPrintSuccess) {
        try {
            console.log('[Receipt] Generating HTML receipt for browser print...');
            const htmlReceipt = activeReceiptTemplate
                ? generateHtmlFromTemplate({
                    template: activeReceiptTemplate,
                    order,
                    settings: effectiveSettings,
                    currencySymbol,
                    lang,
                    t,
                    branch,
                    title: receiptTitle,
                })
                : generateReceiptHTML({
                    order,
                    settings: effectiveSettings,
                    currencySymbol,
                    lang,
                    t,
                    branch,
                    title: receiptTitle,
                });
            console.log('[Receipt] HTML generated, length:', htmlReceipt?.length, '— calling printInBrowser()');
            printService.printInBrowser(htmlReceipt);
        } catch (browserPrintError) {
            console.warn('[Receipt] Browser print fallback failed:', browserPrintError);
        }
    } else {
        console.log('[Receipt] Receipt printer resolved — skipping browser print dialog');
    }
};

