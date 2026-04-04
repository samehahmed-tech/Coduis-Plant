export interface PrintJob {
    content: string;
    contentType?: 'text' | 'image';
    type: 'RECEIPT' | 'KITCHEN';
    printerId?: string;
    printerAddress?: string;
    printerType?: 'LOCAL' | 'NETWORK';
    branchId?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthToken = () => {
    try {
        return localStorage.getItem('auth_token');
    } catch {
        return null;
    }
};

export const printService = {
    /**
     * Primary mode: enqueue print job in backend queue.
     * Fallback mode: send directly to local print bridge.
     */
    async print(job: PrintJob): Promise<boolean> {
        const token = getAuthToken();
        const payload = {
            type: job.type,
            content: job.content,
            contentType: job.contentType || 'text',
            printerId: job.printerId,
            printerAddress: job.printerAddress,
            printerType: job.printerType,
            branchId: job.branchId,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/print-gateway/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) return true;

            // If backend queue is not reachable/authorized, fallback to local bridge.
            const fallbackResponse = await fetch('http://localhost:3002/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(job),
            });
            return fallbackResponse.ok;
        } catch {
            try {
                const fallbackResponse = await fetch('http://localhost:3002/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(job),
                });
                return fallbackResponse.ok;
            } catch {
                console.warn('Print queue and local bridge unavailable; fallback to console simulation.');
                console.log('--- PRINT CONTENT ---');
                console.log(job.content);
                console.log('---------------------');
                return false;
            }
        }
    },

    async triggerCashDrawer(): Promise<boolean> {
        return this.print({ content: '\x1B\x70\x00\x19\xFA', type: 'RECEIPT' });
    },

    /**
     * Browser-based print — injects receipt into main document and calls window.print().
     * This approach is never blocked by browsers unlike iframe or popup approaches.
     */
    printInBrowser(html: string): boolean {
        try {
            console.log('[PrintService] printInBrowser — injecting receipt and calling window.print()');

            const OVERLAY_ID = '__receipt_print_overlay__';
            const STYLE_ID = '__receipt_print_style__';
            const CONTENT_STYLE_ID = '__receipt_print_content_style__';

            // Clean up any previous print overlay
            document.getElementById(OVERLAY_ID)?.remove();
            document.getElementById(STYLE_ID)?.remove();
            document.getElementById(CONTENT_STYLE_ID)?.remove();

            // Inject print-only CSS: hide everything except our overlay during print
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
                @media print {
                    body > *:not(#${OVERLAY_ID}) { display: none !important; visibility: hidden !important; }
                    #${OVERLAY_ID} { display: block !important; visibility: visible !important; position: static !important; }
                }
            `;
            document.head.appendChild(style);

            // Extract just the <body> content from the HTML string
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const bodyContent = bodyMatch ? bodyMatch[1] : html;
            const htmlDirMatch = html.match(/<html[^>]*\sdir=["']([^"']+)["']/i);
            const bodyDirMatch = html.match(/<body[^>]*\sdir=["']([^"']+)["']/i);
            const contentDir = bodyDirMatch?.[1] || htmlDirMatch?.[1] || 'ltr';
            const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
            const rawStyles = styleMatches
                ? styleMatches.map((block) => block.replace(/<\/?style[^>]*>/gi, '')).join('\n')
                : '';
            const inlineStyles = rawStyles ? `${rawStyles}\n${rawStyles.replace(/\bbody\b/g, '.receipt-print-root')}` : '';

            if (inlineStyles) {
                const contentStyle = document.createElement('style');
                contentStyle.id = CONTENT_STYLE_ID;
                contentStyle.textContent = inlineStyles;
                document.head.appendChild(contentStyle);
            }

            // Inject receipt content into a hidden div (visible only during print)
            const overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;
            overlay.className = 'receipt-print-root';
            overlay.dir = contentDir as 'ltr' | 'rtl' | 'auto';
            overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:-1;background:white;';
            overlay.innerHTML = bodyContent;
            document.body.appendChild(overlay);

            // Trigger print
            window.print();

            // Clean up after print dialog closes
            setTimeout(() => {
                document.getElementById(OVERLAY_ID)?.remove();
                document.getElementById(STYLE_ID)?.remove();
                document.getElementById(CONTENT_STYLE_ID)?.remove();
            }, 2000);

            return true;
        } catch (error) {
            console.warn('[PrintService] Browser print failed:', error);
            return false;
        }
    }
};
