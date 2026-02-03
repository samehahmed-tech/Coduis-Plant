export interface PrintJob {
    content: string;
    type: 'RECEIPT' | 'KITCHEN';
    printerId?: string;
}

export const printService = {
    /**
     * Send a print job to the local Print Bridge.
     * In production, this would call the Node.js helper at localhost:3002
     */
    async print(job: PrintJob): Promise<boolean> {
        console.log(`🖨️ Sending ${job.type} job to local bridge...`);

        try {
            // Mock call to the local bridge
            const response = await fetch('http://localhost:3002/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(job),
            });

            return response.ok;
        } catch (error) {
            console.warn('⚠️ Local Print Bridge not found. Falling back to console simulation.');
            console.log('--- PRINT CONTENT ---');
            console.log(job.content);
            console.log('---------------------');
            return true;
        }
    },

    async triggerCashDrawer(): Promise<boolean> {
        console.log('💸 Pulsing cash drawer RJ11...');
        return this.print({ content: '\x1B\x70\x00\x19\xFA', type: 'RECEIPT' });
    }
};
