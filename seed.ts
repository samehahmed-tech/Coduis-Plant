import { db } from './server/db';
import { users, branches, settings } from './src/db/schema';

async function seed() {
    try {
        console.log('--- Seeding Database ---');

        // 1. Seed Branch
        console.log('Seeding branch...');
        await db.insert(branches).values({
            id: 'b1',
            name: 'الفرع الرئيسي',
            address: 'القاهرة، مصر',
            phone: '0123456789',
            isActive: true,
        }).onConflictDoNothing();

        // 2. Seed Admin User
        console.log('Seeding admin user...');
        await db.insert(users).values({
            id: 'u1',
            name: 'مدير النظام',
            email: 'admin@coduiszen.com',
            role: 'SUPER_ADMIN',
            permissions: ["*"],
            assignedBranchId: 'b1',
            isActive: true,
            managerPin: '1234'
        }).onConflictDoNothing();

        // 3. Seed Default Settings
        console.log('Seeding default settings...');
        const defaultSettings = [
            { key: 'restaurantName', value: 'Restaurant ERP', category: 'general' },
            { key: 'currency', value: 'EGP', category: 'general' },
            { key: 'taxRate', value: 14, category: 'finance' },
            { key: 'serviceCharge', value: 0, category: 'finance' },
            { key: 'language', value: 'ar', category: 'general' },
            { key: 'theme', value: 'xen', category: 'ui' }
        ];

        for (const s of defaultSettings) {
            await db.insert(settings).values({
                key: s.key,
                value: s.value as any,
                category: s.category,
                updatedAt: new Date()
            }).onConflictDoUpdate({
                target: settings.key,
                set: {
                    value: s.value as any,
                    category: s.category,
                    updatedAt: new Date()
                }
            });
        }

        console.log('--- Seeding Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
