import { Request, Response } from 'express';
import { db } from '../db';
import { branches, settings, users } from '../../src/db/schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const hasAnyUsers = async () => {
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    return existing.length > 0;
};

export const getSetupStatus = async (_req: Request, res: Response) => {
    try {
        const needsSetup = !(await hasAnyUsers());
        res.json({ needsSetup });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const bootstrapSetup = async (req: Request, res: Response) => {
    try {
        if (await hasAnyUsers()) {
            return res.status(409).json({ error: 'ALREADY_INITIALIZED' });
        }

        const body = req.body || {};
        const admin = body.admin || {};
        const branch = body.branch || {};
        const appSettings = body.settings || {};

        if (!admin.name || !admin.email || !admin.password) {
            return res.status(400).json({ error: 'ADMIN_FIELDS_REQUIRED' });
        }
        if (String(admin.password).length < 6) {
            return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
        }
        if (!branch.name) {
            return res.status(400).json({ error: 'BRANCH_NAME_REQUIRED' });
        }

        const branchId = branch.id || `branch-${crypto.randomUUID()}`;
        const userId = admin.id || `user-${crypto.randomUUID()}`;
        const passwordHash = await bcrypt.hash(String(admin.password), 10);

        await db.transaction(async (tx) => {
            await tx.insert(branches).values({
                id: branchId,
                name: branch.name,
                nameAr: branch.nameAr,
                location: branch.location || branch.address,
                address: branch.address,
                phone: branch.phone,
                email: branch.email,
                isActive: true,
                timezone: branch.timezone || 'Africa/Cairo',
                currency: branch.currency || appSettings.currency || 'EGP',
                taxRate: branch.taxRate ?? appSettings.taxRate ?? 14,
                serviceCharge: branch.serviceCharge ?? appSettings.serviceCharge ?? 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await tx.insert(users).values({
                id: userId,
                name: admin.name,
                email: admin.email,
                passwordHash,
                role: 'SUPER_ADMIN',
                permissions: [],
                assignedBranchId: branchId,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const settingsEntries = [
                { key: 'restaurantName', value: appSettings.restaurantName || branch.name },
                { key: 'phone', value: appSettings.phone || branch.phone || '' },
                { key: 'branchAddress', value: appSettings.branchAddress || branch.address || '' },
                { key: 'currency', value: appSettings.currency || 'EGP' },
                { key: 'currencySymbol', value: appSettings.currencySymbol || '\u062c.\u0645' },
                { key: 'taxRate', value: appSettings.taxRate ?? 14 },
                { key: 'serviceCharge', value: appSettings.serviceCharge ?? 0 },
                { key: 'language', value: appSettings.language || 'ar' },
                { key: 'theme', value: appSettings.theme || 'xen' },
                { key: 'isDarkMode', value: appSettings.isDarkMode ?? true },
                { key: 'isTouchMode', value: appSettings.isTouchMode ?? false },
            ];

            for (const entry of settingsEntries) {
                await tx.insert(settings)
                    .values({
                        key: entry.key,
                        value: entry.value,
                        category: 'setup',
                        updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: settings.key,
                        set: { value: entry.value, updatedAt: new Date() }
                    });
            }
        });

        res.status(201).json({ ok: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
