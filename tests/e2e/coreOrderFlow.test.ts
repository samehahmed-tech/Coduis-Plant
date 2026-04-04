import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../server/app';
import { db } from '../../server/db';
import { branches, menuCategories, menuItems, shifts, users, warehouses } from '../../src/db/schema';

const FIXTURES = {
    branchId: 'test-branch-e2e',
    userId: 'test-user-e2e',
    warehouseId: 'test-warehouse-e2e',
    shiftId: 'test-shift-e2e',
    categoryId: 'test-category-e2e',
    itemId: 'test-item-e2e',
    email: 'e2e-admin@restoflow.local',
    password: 'Test123!',
};

describe('Core Order Flow E2E', () => {
    let testUserToken = '';

    beforeEach(async () => {
        await db.insert(branches).values({
            id: FIXTURES.branchId,
            name: 'E2E Branch',
            address: 'Cairo',
            isActive: true,
        }).onConflictDoNothing();

        await db.insert(users).values({
            id: FIXTURES.userId,
            name: 'E2E Admin',
            email: FIXTURES.email,
            role: 'SUPER_ADMIN',
            permissions: ['*'],
            assignedBranchId: FIXTURES.branchId,
            isActive: true,
            mfaEnabled: false,
        }).onConflictDoNothing();

        await db.insert(warehouses).values({
            id: FIXTURES.warehouseId,
            name: 'E2E Kitchen Warehouse',
            branchId: FIXTURES.branchId,
            type: 'KITCHEN',
            isActive: true,
        }).onConflictDoNothing();

        await db.insert(shifts).values({
            id: FIXTURES.shiftId,
            branchId: FIXTURES.branchId,
            userId: FIXTURES.userId,
            openingBalance: 0,
            status: 'OPEN',
        }).onConflictDoNothing();

        await db.insert(menuCategories).values({
            id: FIXTURES.categoryId,
            name: 'E2E Category',
            isActive: true,
            menuIds: ['menu-1'],
            printerIds: [],
            targetOrderTypes: ['TAKEAWAY'],
        }).onConflictDoNothing();

        await db.insert(menuItems).values({
            id: FIXTURES.itemId,
            categoryId: FIXTURES.categoryId,
            name: 'E2E Item',
            price: 150,
            cost: 50,
            isAvailable: true,
            printerIds: [],
            modifierGroups: [],
        }).onConflictDoNothing();

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: FIXTURES.email,
                password: FIXTURES.password,
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeTruthy();

        testUserToken = loginRes.body.token;
    });

    it('Environment Health Check', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('creates, progresses, and lists a takeaway order end-to-end', async () => {
        const orderPayload = {
            type: 'TAKEAWAY',
            branchId: FIXTURES.branchId,
            customerName: 'E2E Test User',
            items: [
                {
                    menu_item_id: FIXTURES.itemId,
                    name: 'E2E Item',
                    quantity: 2,
                    price: 150,
                    notes: 'Extra spicy',
                },
            ],
            subtotal: 300,
            tax: 42,
            total: 342,
        };

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${testUserToken}`)
            .send(orderPayload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('PENDING');
        const activeOrderId = res.body.id as string;

        let statusRes = await request(app)
            .put(`/api/orders/${activeOrderId}/status`)
            .set('Authorization', `Bearer ${testUserToken}`)
            .send({ status: 'PREPARING' });

        expect(statusRes.status).toBe(200);
        expect(statusRes.body.status).toBe('PREPARING');

        statusRes = await request(app)
            .put(`/api/orders/${activeOrderId}/status`)
            .set('Authorization', `Bearer ${testUserToken}`)
            .send({ status: 'READY' });

        expect(statusRes.status).toBe(200);
        expect(statusRes.body.status).toBe('READY');

        statusRes = await request(app)
            .put(`/api/orders/${activeOrderId}/status`)
            .set('Authorization', `Bearer ${testUserToken}`)
            .send({ status: 'DELIVERED' });

        expect(statusRes.status).toBe(200);
        expect(statusRes.body.status).toBe('DELIVERED');

        const historyRes = await request(app)
            .get(`/api/orders?branch_id=${FIXTURES.branchId}`)
            .set('Authorization', `Bearer ${testUserToken}`);

        expect(historyRes.status).toBe(200);
        const foundOrder = historyRes.body.find((order: any) => order.id === activeOrderId);
        expect(foundOrder).toBeDefined();
        expect(foundOrder.status).toBe('DELIVERED');
    });
});
