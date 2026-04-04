export type PrinterReceiptMode = 'RASTER_IMAGE' | 'TEXT_RAW';

const STORAGE_KEY = 'restoflow_printer_receipt_modes';

type PrinterReceiptModeMap = Record<string, PrinterReceiptMode>;

export const loadPrinterReceiptModes = (): PrinterReceiptModeMap => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

export const getPrinterReceiptMode = (printerId?: string | null): PrinterReceiptMode => {
    if (!printerId) return 'RASTER_IMAGE';
    const modes = loadPrinterReceiptModes();
    return modes[printerId] || 'RASTER_IMAGE';
};

export const setPrinterReceiptMode = (printerId: string, mode: PrinterReceiptMode): PrinterReceiptModeMap => {
    const next = {
        ...loadPrinterReceiptModes(),
        [printerId]: mode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
};
