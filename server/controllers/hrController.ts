import { Request, Response } from 'express';
import { db } from '../db';
import { employees, attendance, payrollCycles, payrollPayouts } from '../../src/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// Employees
// ============================================================================

export const getEmployees = async (req: Request, res: Response) => {
    try {
        const result = await db.query.employees.findMany({
            where: eq(employees.isActive, true),
        });
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

export const upsertEmployee = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        if (!data.branchId) {
            const branches = await db.query.branches.findMany({ limit: 1 });
            if (branches.length > 0) {
                data.branchId = branches[0].id;
            } else {
                return res.status(400).json({ error: 'Branch is required' });
            }
        }

        if (data.id && !data.id.startsWith('EMP-')) {
            const [updated] = await db.update(employees)
                .set({
                    name: data.name,
                    role: data.role,
                    basicSalary: data.basicSalary || data.salary || 0,
                    hourlyRate: data.hourlyRate || 0,
                    phone: data.phone,
                    email: data.email,
                    updatedAt: new Date(),
                })
                .where(eq(employees.id, data.id))
                .returning();
            res.json(updated);
        } else {
            const id = data.id || nanoid();
            const [created] = await db.insert(employees)
                .values({
                    id: id,
                    branchId: data.branchId,
                    name: data.name,
                    role: data.role || 'STAFF',
                    basicSalary: data.basicSalary || data.salary || 0,
                    hourlyRate: data.hourlyRate || 0,
                    phone: data.phone,
                    email: data.email,
                })
                .returning();
            res.json(created);
        }
    } catch (error: any) {
        console.error('Error upserting employee:', error);
        res.status(500).json({ error: 'Failed to save employee' });
    }
};

// ============================================================================
// Attendance
// ============================================================================

export const getAttendance = async (req: Request, res: Response) => {
    try {
        const { employeeId, branchId } = req.query;
        let conditions = [];
        if (employeeId) conditions.push(eq(attendance.employeeId, employeeId as string));
        if (branchId) conditions.push(eq(attendance.branchId, branchId as string));

        const result = await db.query.attendance.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: (attendance, { desc }) => [desc(attendance.date)],
            limit: 100,
        });
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const clockIn = async (req: Request, res: Response) => {
    try {
        const { employeeId, branchId, deviceId } = req.body;

        // Find employee to get their branch if not provided
        let actualBranchId = branchId;
        if (!actualBranchId) {
            const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
            if (!emp) return res.status(404).json({ error: 'Employee not found' });
            actualBranchId = emp.branchId;
        }

        const [record] = await db.insert(attendance)
            .values({
                id: nanoid(),
                employeeId,
                branchId: actualBranchId,
                date: new Date(),
                clockIn: new Date(),
                deviceId,
                status: 'PRESENT',
            })
            .returning();
        res.json(record);
    } catch (error: any) {
        console.error('Error clocking in:', error);
        res.status(500).json({ error: 'Failed to clock in' });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.body;

        // Find latest open attendance record
        const openRecord = await db.query.attendance.findFirst({
            where: and(
                eq(attendance.employeeId, employeeId),
                sql`${attendance.clockOut} IS NULL`
            ),
            orderBy: (attendance, { desc }) => [desc(attendance.clockIn)]
        });

        if (!openRecord) {
            return res.status(400).json({ error: 'No active clock-in found' });
        }

        const clockOutTime = new Date();
        const diffMs = clockOutTime.getTime() - new Date(openRecord.clockIn).getTime();
        const totalHours = diffMs / (1000 * 60 * 60);

        const [updated] = await db.update(attendance)
            .set({
                clockOut: clockOutTime,
                totalHours: Number(totalHours.toFixed(2)),
            })
            .where(eq(attendance.id, openRecord.id))
            .returning();

        res.json(updated);
    } catch (error: any) {
        console.error('Error clocking out:', error);
        res.status(500).json({ error: 'Failed to clock out' });
    }
};

// ============================================================================
// Payroll
// ============================================================================

export const payrollSummary = async (req: Request, res: Response) => {
    try {
        const employeeId = req.query.employeeId as string;
        const startDate = new Date((req.query.startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const endDate = new Date((req.query.endDate as string) || new Date());

        const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
        if (!emp) return res.status(404).json({ error: 'Employee not found' });

        const records = await db.query.attendance.findMany({
            where: and(
                eq(attendance.employeeId, employeeId),
                gte(attendance.date, startDate),
                lte(attendance.date, endDate)
            )
        });

        let totalHours = 0;
        records.forEach(r => totalHours += (r.totalHours || 0));

        let amount = 0;
        // Simple logic mirroring mock: 
        if (emp.hourlyRate && emp.hourlyRate > 0) {
            amount = totalHours * emp.hourlyRate;
        } else {
            // Rough day calculation based on attendance count
            const attendedDays = records.filter(r => r.totalHours && r.totalHours > 0).length;
            amount = (emp.basicSalary / 30) * attendedDays;
        }

        res.json({
            employeeId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            records: records.length,
            amount,
        });
    } catch (error: any) {
        console.error('Error fetching payroll summary:', error);
        res.status(500).json({ error: 'Failed to fetch payroll summary' });
    }
};

export const getPayrollCycles = async (req: Request, res: Response) => {
    try {
        const result = await db.query.payrollCycles.findMany({
            orderBy: (cycles, { desc }) => [desc(cycles.periodStart)]
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch payroll cycles' });
    }
};

export const getPayoutLedger = async (req: Request, res: Response) => {
    try {
        const result = await db.query.payrollPayouts.findMany({});
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch payouts' });
    }
};

export const executePayrollCycle = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const startDate = new Date(body.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const endDate = new Date(body.endDate || new Date());

        let targetBranchId = body.branchId;
        if (!targetBranchId) {
            const branches = await db.query.branches.findMany({ limit: 1 });
            if (branches.length > 0) targetBranchId = branches[0].id;
            else return res.status(400).json({ error: 'Branch is required' });
        }

        // Create cycle
        const [cycle] = await db.insert(payrollCycles)
            .values({
                id: nanoid(),
                branchId: targetBranchId,
                periodStart: startDate,
                periodEnd: endDate,
                status: 'CLOSED', // Using closed to match original mock behavior
            })
            .returning();

        // Get all employees
        const allEmps = await db.query.employees.findMany({
            where: eq(employees.isActive, true)
        });

        const allAttendance = await db.query.attendance.findMany({
            where: and(
                gte(attendance.date, startDate),
                lte(attendance.date, endDate)
            )
        });

        let cycleTotal = 0;

        // Create payouts
        for (const emp of allEmps) {
            const scoped = allAttendance.filter(r => r.employeeId === emp.id && r.totalHours);
            let amount = 0;
            if (emp.hourlyRate && emp.hourlyRate > 0) {
                const totalHours = scoped.reduce((sum, r) => sum + (r.totalHours || 0), 0);
                amount = totalHours * emp.hourlyRate;
            } else {
                amount = (emp.basicSalary / 30) * scoped.length;
            }

            cycleTotal += amount;

            await db.insert(payrollPayouts)
                .values({
                    id: nanoid(),
                    cycleId: cycle.id,
                    employeeId: emp.id,
                    basicSalary: emp.basicSalary,
                    netPay: amount || 0,
                    status: 'POSTED'
                });
        }

        // Update cycle total
        const [updatedCycle] = await db.update(payrollCycles)
            .set({ totalAmount: cycleTotal })
            .where(eq(payrollCycles.id, cycle.id))
            .returning();

        res.status(201).json({
            ...updatedCycle,
            entries: allEmps.length
        });
    } catch (error: any) {
        console.error('Error executing payroll:', error);
        res.status(500).json({ error: 'Failed to execute payroll' });
    }
};
