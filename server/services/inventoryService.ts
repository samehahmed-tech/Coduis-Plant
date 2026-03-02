import { db } from '../db';
import { inventoryStock, stockMovements, recipes, recipeIngredients, inventoryBatches, batchTransactions } from '../../src/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';

export const inventoryService = {
    /**
     * Deduct ingredients for a given menu item from a warehouse.
     */
    async deductIngredients(tx: any, menuItemId: string, quantity: number, warehouseId: string, orderId: string, actorId: string = 'system') {
        // 1. Get the recipe for this menu item
        const [recipe] = await tx.select().from(recipes).where(eq(recipes.menuItemId, menuItemId));
        if (!recipe) return; // No recipe, no deduction needed

        // 2. Get all ingredients for this recipe
        const ingredients = await tx.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipe.id));

        for (const ingredient of ingredients) {
            const deductionQty = ingredient.quantity * quantity;

            // 3. Update stock (deduct) - Simple approach (Legacy)
            await tx.update(inventoryStock)
                .set({
                    quantity: sql`quantity - ${deductionQty}`,
                    lastUpdated: new Date(),
                })
                .where(
                    and(
                        eq(inventoryStock.itemId, ingredient.inventoryItemId),
                        eq(inventoryStock.warehouseId, warehouseId)
                    )
                );

            // 4. Try FEFO Deduction (P0 blocker requirement)
            try {
                await this.deductInventoryFEFO(tx, ingredient.inventoryItemId, warehouseId, deductionQty, orderId, 'FEFO Menu Order Deduction');
            } catch (err) {
                console.warn(`FEFO Deduction error:`, err);
                // We record stock movements in the old way if FEFO fails or is empty, to preserve functionality
                await tx.insert(stockMovements).values({
                    itemId: ingredient.inventoryItemId,
                    fromWarehouseId: warehouseId,
                    quantity: deductionQty,
                    type: 'SALE_CONSUMPTION',
                    reason: 'Automatic deduction from Order (Fallback)',
                    referenceId: orderId,
                    performedBy: actorId,
                    createdAt: new Date(),
                });
            }
        }
    },

    /**
     * FEFO (First Expired First Out) Algorithm Logic
     */
    async deductInventoryFEFO(tx: any, itemId: string, warehouseId: string, quantityToDeduct: number, referenceId?: string, reason?: string) {
        // 1. Fetch available active batches sorted by Expiry Date ASC
        const batches = await tx.select()
            .from(inventoryBatches)
            .where(and(
                eq(inventoryBatches.itemId, itemId),
                eq(inventoryBatches.warehouseId, warehouseId),
                eq(inventoryBatches.status, 'ACTIVE'),
                sql`${inventoryBatches.currentQty} > 0`
            ))
            .orderBy(asc(inventoryBatches.expiryDate));

        if (batches.length === 0) {
            throw new Error(`No active batches found for item ${itemId}`);
        }

        let remainingQty = quantityToDeduct;
        let totalCost = 0;
        const transactionsToCreate = [];

        // 2. We need a stock movement record to link the batch transactions
        const [movement] = await tx.insert(stockMovements).values({
            itemId,
            fromWarehouseId: warehouseId,
            quantity: quantityToDeduct,
            type: 'SALE_CONSUMPTION',
            referenceId,
            reason: reason || 'FEFO Auto-Deduction'
        }).returning();

        // 3. Loop through batches to fulfill quantity
        for (const batch of batches) {
            if (remainingQty <= 0) break;

            const batchQty = batch.currentQty;
            let usedQty = 0;

            if (batchQty <= remainingQty) {
                // Deplete this batch completely
                usedQty = batchQty;
                remainingQty -= batchQty;

                await tx.update(inventoryBatches)
                    .set({
                        currentQty: 0,
                        status: 'DEPLETED'
                    })
                    .where(eq(inventoryBatches.id, batch.id));
            } else {
                // Partially deplete this batch
                usedQty = remainingQty;
                remainingQty = 0;

                await tx.update(inventoryBatches)
                    .set({
                        currentQty: sql`${inventoryBatches.currentQty} - ${usedQty}`
                    })
                    .where(eq(inventoryBatches.id, batch.id));
            }

            totalCost += (usedQty * batch.unitCost);

            transactionsToCreate.push({
                batchId: batch.id,
                stockMovementId: movement.id,
                quantityUsed: usedQty,
                costAtTime: batch.unitCost
            });
        }

        if (remainingQty > 0) {
            console.error(`FEFO Deduction Warning: Insufficient stock for Item ${itemId}. Short by ${remainingQty}`);
            throw new Error(`Insufficient inventory: Unable to fulfill ${remainingQty} units from batches.`);
        }

        // 4. Record the batch transactions
        if (transactionsToCreate.length > 0) {
            await tx.insert(batchTransactions).values(transactionsToCreate);
        }

        return { movementId: movement.id, totalCostCalculated: totalCost };
    },

    /**
     * Mark expired batches automatically (Cron Job)
     */
    async markExpiredBatches() {
        const currentDate = new Date();
        const result = await db.update(inventoryBatches)
            .set({ status: 'EXPIRED' })
            .where(and(
                eq(inventoryBatches.status, 'ACTIVE'),
                sql`${inventoryBatches.expiryDate} < ${currentDate}`
            ));

        console.log(`Updated EXPIRED status for elapsed inventory batches`);
    }
};
