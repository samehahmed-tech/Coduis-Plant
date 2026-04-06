/**
 * Marketplace Integration Service
 * Implements: Phase 3.14 (Talabat, Elmenus, Hungerstation)
 * 
 * Maps incoming orders from external delivery platforms into RestoFlow ERP schema.
 */

import { db } from '../db';
import { orders, orderItems } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

const log = logger.child({ service: 'marketplace' });

export type MarketplaceProvider = 'TALABAT' | 'ELMENUS' | 'HUNGERSTATION' | 'OTLOOB';

export interface MarketplaceOrder {
    orderNumber: string;
    items: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        modifiers?: any[];
    }[];
    total: number;
    customer: {
        name: string;
        phone: string;
        address: string;
    };
    notes?: string;
    provider: MarketplaceProvider;
}

export const marketplaceService = {

    /**
     * Common interface to ingest a marketplace order.
     */
    async ingestOrder(branchId: string, orderData: MarketplaceOrder) {
        log.info({ branchId, provider: orderData.provider, extId: orderData.orderNumber }, 'Ingesting marketplace order');

        try {
            // 1. Transactionally insert the order
            const orderId = `ext-${orderData.provider.toLowerCase()}-${orderData.orderNumber}`;

            await db.transaction(async (tx) => {
                await tx.insert(orders).values({
                    id: orderId,
                    branchId,
                    type: 'DELIVERY',
                    source: orderData.provider,
                    customerName: orderData.customer.name,
                    customerPhone: orderData.customer.phone,
                    deliveryAddress: orderData.customer.address,
                    total: orderData.total,
                    subtotal: orderData.total, // Assume pre-tax for now
                    tax: 0,
                    status: 'PENDING',
                    isPaid: true, // Marketplace orders are usually prepaid
                    paymentMethod: 'ONLINE',
                    notes: `[${orderData.provider}] ${orderData.notes || ''}`,
                    createdAt: new Date(),
                });

                for (const item of orderData.items) {
                    await tx.insert(orderItems).values({
                        orderId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.id, // we should map back menu items ideally
                    });
                }
            });

            log.info({ orderId }, 'Marketplace order successfully ingested');
            return { success: true, orderId };
        } catch (error: any) {
            log.error({ err: error.message, extId: orderData.orderNumber }, 'Marketplace ingestion failed');
            return { success: false, error: error.message };
        }
    }
};
