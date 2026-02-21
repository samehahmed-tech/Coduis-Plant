export interface PrintJob {
    content: string;
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
                return true;
            }
        }
    },

    async triggerCashDrawer(): Promise<boolean> {
        return this.print({ content: '\x1B\x70\x00\x19\xFA', type: 'RECEIPT' });
    }
};
