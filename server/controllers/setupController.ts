import { Request, Response } from 'express';
import { db, pool } from '../db';
import { branches, floorZones, printers, roles, settings, tables, users } from '../../src/db/schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const tableExists = async (tableName: string) => {
    const result = await pool.query<{ exists: boolean }>(
        `select exists(
            select 1
            from information_schema.tables
            where table_schema = 'public'
              and table_name = $1
        )`,
        [tableName.toLowerCase()],
    );
    return Boolean(result.rows[0]?.exists);
};

const hasAnyUsers = async () => {
    const usersTableExists = await tableExists('users');
    if (!usersTableExists) return false;
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
        const setupPrinters = Array.isArray(body.printers) ? body.printers : [];
        const setupRoles = Array.isArray(body.roles) ? body.roles : [];
        const setupTables = Array.isArray(body.tables) ? body.tables : [];

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
        const defaultZoneId = `zone-${branchId}-main`;

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

            if (setupPrinters.length > 0) {
                for (const rawPrinter of setupPrinters) {
                    const name = String(rawPrinter?.name || '').trim();
                    if (!name) continue;
                    const type = String(rawPrinter?.type || 'RECEIPT').trim().toUpperCase();
                    const printerId = rawPrinter?.id || `PRN-${crypto.randomUUID()}`;

                    await tx.insert(printers)
                        .values({
                            id: printerId,
                            name,
                            type,
                            address: rawPrinter?.address || '',
                            location: rawPrinter?.location || '',
                            branchId,
                            isActive: rawPrinter?.isActive !== false,
                            paperWidth: Number(rawPrinter?.paperWidth || 80),
                            createdAt: new Date(),
                        })
                        .onConflictDoNothing({ target: printers.id });
                }
            }

            if (setupRoles.length > 0) {
                for (const rawRole of setupRoles) {
                    const roleName = String(rawRole?.name || '').trim();
                    if (!roleName) continue;
                    const roleId = rawRole?.id || `role-${crypto.randomUUID()}`;
                    const rolePermissions = Array.isArray(rawRole?.permissions) ? rawRole.permissions : [];

                    await tx.insert(roles)
                        .values({
                            id: roleId,
                            name: roleName,
                            nameAr: rawRole?.nameAr || null,
                            description: rawRole?.description || 'Custom role from setup wizard',
                            descriptionAr: rawRole?.descriptionAr || null,
                            permissions: rolePermissions,
                            isSystem: false,
                            isActive: true,
                            priority: Number(rawRole?.priority || 0),
                            color: rawRole?.color || '#6366f1',
                            icon: rawRole?.icon || 'user',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .onConflictDoNothing({ target: roles.name });
                }
            }

            if (setupTables.length > 0) {
                await tx.insert(floorZones)
                    .values({
                        id: defaultZoneId,
                        name: branch.zoneName || 'Main Hall',
                        branchId,
                        width: 1600,
                        height: 1200,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: floorZones.id,
                        set: {
                            name: branch.zoneName || 'Main Hall',
                            branchId,
                            updatedAt: new Date(),
                        },
                    });

                for (const rawTable of setupTables) {
                    const tableName = String(rawTable?.name || '').trim();
                    if (!tableName) continue;
                    const tableId = rawTable?.id || `TBL-${crypto.randomUUID()}`;
                    const seats = Math.max(1, Number(rawTable?.capacity || rawTable?.seats || 4));

                    await tx.insert(tables)
                        .values({
                            id: tableId,
                            name: tableName,
                            branchId,
                            zoneId: rawTable?.zoneId || defaultZoneId,
                            x: Number(rawTable?.x || 0),
                            y: Number(rawTable?.y || 0),
                            width: Number(rawTable?.width || 100),
                            height: Number(rawTable?.height || 100),
                            shape: rawTable?.shape || 'rectangle',
                            seats,
                            status: 'AVAILABLE',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .onConflictDoNothing({ target: tables.id });
                }
            }
        });

        res.status(201).json({ ok: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
