import { eq, desc } from 'drizzle-orm';
import { db } from '../server/db';
import { branches, orders, orderItems, payments, fiscalLogs } from '../src/db/schema';
import { submitOrderToFiscal } from '../server/services/fiscalSubmitService';

const run = async () => {
    const [branch] = await db.select().from(branches).limit(1);
    if (!branch) {
        throw new Error('No branch found in database');
    }

    const ts = Date.now();
    const orderId = `ETA-E2E-${ts}`;
    const paymentId = `PAY-${ts}`;

    await db.insert(orders).values({
        id: orderId,
        type: 'TAKEAWAY',
        source: 'POS',
        branchId: branch.id,
        status: 'COMPLETED',
        subtotal: 100,
        tax: 14,
        total: 114,
        isPaid: true,
        paymentMethod: 'CASH',
        paidAmount: 114,
        syncStatus: 'SYNCED',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.insert(orderItems).values({
        orderId,
        name: 'ETA Smoke Item',
        price: 100,
        quantity: 1,
        status: 'SERVED',
    });

    await db.insert(payments).values({
        id: paymentId,
        orderId,
        method: 'CASH',
        amount: 114,
        status: 'COMPLETED',
        processedBy: 'eta-smoke',
        createdAt: new Date(),
    });

    let submitError: string | null = null;
    try {
        await submitOrderToFiscal(orderId, { force: true });
    } catch (error: any) {
        submitError = error?.message || 'Unknown ETA submission error';
    }

    const [log] = await db
        .select()
        .from(fiscalLogs)
        .where(eq(fiscalLogs.orderId, orderId))
        .orderBy(desc(fiscalLogs.createdAt))
        .limit(1);

    console.log(JSON.stringify({
        orderId,
        branchId: branch.id,
        fiscalLogStatus: log?.status || null,
        fiscalAttempts: log?.attempt || 0,
        hasResponse: Boolean(log?.response),
        lastError: log?.lastError || null,
        submitError
    }, null, 2));
};

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
