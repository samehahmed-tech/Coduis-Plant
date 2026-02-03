import { db } from '../db';
import { inventoryStock, stockMovements, recipes, recipeIngredients } from '../../src/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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

            // 3. Update stock (deduct)
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

            // 4. Record stock movement
            await tx.insert(stockMovements).values({
                itemId: ingredient.inventoryItemId,
                fromWarehouseId: warehouseId,
                quantity: deductionQty,
                type: 'SALE_CONSUMPTION',
                reason: 'Automatic deduction from Order',
                referenceId: orderId,
                performedBy: actorId,
                createdAt: new Date(),
            });
        }
    }
};
