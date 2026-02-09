import { Request, Response } from 'express';
import { db } from '../db';
import { settings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

type HREmployee = {
    id: string;
    userId: string;
    nationalId?: string;
    joinDate: string;
    salary: number;
    salaryType: 'MONTHLY' | 'HOURLY';
    emergencyContact: string;
    activeShiftId?: string;
    bankAccount?: string;
};

type HRAttendance = {
    id: string;
    employeeId: string;
    clockIn: string;
    clockOut?: string;
    totalHours: number;
    branchId?: string;
    deviceId?: string;
};

const EMP_KEY = 'hr_employees';
const ATT_KEY = 'hr_attendance';
const CYCLES_KEY = 'hr_payroll_cycles';
const PAYOUT_KEY = 'hr_payout_ledger';

const readJsonSetting = async <T>(key: string, fallback: T): Promise<T> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return (row?.value as T) || fallback;
};

const writeJsonSetting = async (key: string, value: any, updatedBy?: string) => {
    const [existing] = await db.select().from(settings).where(eq(settings.key, key));
    if (existing) {
        await db.update(settings)
            .set({ value, category: 'hr', updatedBy: updatedBy || 'system', updatedAt: new Date() })
            .where(eq(settings.key, key));
    } else {
        await db.insert(settings).values({
            key,
            value,
            category: 'hr',
            updatedBy: updatedBy || 'system',
            updatedAt: new Date(),
        } as any);
    }
};

export const getEmployees = async (_req: Request, res: Response) => {
    try {
        const employees = await readJsonSetting<HREmployee[]>(EMP_KEY, []);
        res.json(employees);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const upsertEmployee = async (req: Request, res: Response) => {
    try {
        const employees = await readJsonSetting<HREmployee[]>(EMP_KEY, []);
        const body = req.body || {};
        const id = body.id || `EMP-${Date.now()}`;
        const record: HREmployee = {
            id,
            userId: body.userId || '',
            nationalId: body.nationalId,
            joinDate: body.joinDate || new Date().toISOString(),
            salary: Number(body.salary || 0),
            salaryType: body.salaryType || 'MONTHLY',
            emergencyContact: body.emergencyContact || '',
            activeShiftId: body.activeShiftId,
            bankAccount: body.bankAccount,
        };
        const idx = employees.findIndex(e => e.id === id);
        if (idx >= 0) employees[idx] = { ...employees[idx], ...record };
        else employees.unshift(record);
        await writeJsonSetting(EMP_KEY, employees, req.user?.id);
        res.json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAttendance = async (req: Request, res: Response) => {
    try {
        const employeeId = (req.query.employeeId as string | undefined) || '';
        const branchId = (req.query.branchId as string | undefined) || '';
        const records = await readJsonSetting<HRAttendance[]>(ATT_KEY, []);
        const filtered = records.filter(r => {
            if (employeeId && r.employeeId !== employeeId) return false;
            if (branchId && r.branchId !== branchId) return false;
            return true;
        });
        res.json(filtered);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const clockIn = async (req: Request, res: Response) => {
    try {
        const { employeeId, branchId, deviceId } = req.body || {};
        if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });
        const records = await readJsonSetting<HRAttendance[]>(ATT_KEY, []);
        const active = records.find(r => r.employeeId === employeeId && !r.clockOut);
        if (active) return res.json(active);
        const record: HRAttendance = {
            id: `ATT-${Date.now()}`,
            employeeId,
            clockIn: new Date().toISOString(),
            totalHours: 0,
            branchId,
            deviceId,
        };
        records.unshift(record);
        await writeJsonSetting(ATT_KEY, records, req.user?.id);
        res.status(201).json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.body || {};
        if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });
        const records = await readJsonSetting<HRAttendance[]>(ATT_KEY, []);
        const idx = records.findIndex(r => r.employeeId === employeeId && !r.clockOut);
        if (idx < 0) return res.status(404).json({ error: 'Active attendance not found' });
        const now = new Date();
        const inTime = new Date(records[idx].clockIn).getTime();
        const hours = Math.max(0, (now.getTime() - inTime) / (1000 * 60 * 60));
        records[idx] = { ...records[idx], clockOut: now.toISOString(), totalHours: hours };
        await writeJsonSetting(ATT_KEY, records, req.user?.id);
        res.json(records[idx]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const payrollSummary = async (req: Request, res: Response) => {
    try {
        const employeeId = req.query.employeeId as string;
        const startDate = new Date((req.query.startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const endDate = new Date((req.query.endDate as string) || new Date());

        const employees = await readJsonSetting<HREmployee[]>(EMP_KEY, []);
        const records = await readJsonSetting<HRAttendance[]>(ATT_KEY, []);
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const scoped = records.filter(r => {
            if (r.employeeId !== employeeId) return false;
            const inDate = new Date(r.clockIn);
            return inDate >= startDate && inDate <= endDate && Boolean(r.clockOut);
        });

        let amount = 0;
        if (employee.salaryType === 'HOURLY') {
            amount = scoped.reduce((sum, r) => sum + Number(r.totalHours || 0), 0) * employee.salary;
        } else {
            const attendedDays = new Set(scoped.map(r => new Date(r.clockIn).toDateString())).size;
            amount = (employee.salary / 30) * attendedDays;
        }

        res.json({
            employeeId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            records: scoped.length,
            amount,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPayrollCycles = async (_req: Request, res: Response) => {
    try {
        const cycles = await readJsonSetting<any[]>(CYCLES_KEY, []);
        res.json(cycles);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPayoutLedger = async (_req: Request, res: Response) => {
    try {
        const payouts = await readJsonSetting<any[]>(PAYOUT_KEY, []);
        res.json(payouts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const executePayrollCycle = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const startDate = new Date(body.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const endDate = new Date(body.endDate || new Date());
        const employees = await readJsonSetting<HREmployee[]>(EMP_KEY, []);
        const attendance = await readJsonSetting<HRAttendance[]>(ATT_KEY, []);
        const payouts = await readJsonSetting<any[]>(PAYOUT_KEY, []);
        const cycles = await readJsonSetting<any[]>(CYCLES_KEY, []);

        let total = 0;
        const entries = employees.map(emp => {
            const scoped = attendance.filter(r => {
                if (r.employeeId !== emp.id) return false;
                const d = new Date(r.clockIn);
                return d >= startDate && d <= endDate && Boolean(r.clockOut);
            });
            const amount = emp.salaryType === 'HOURLY'
                ? scoped.reduce((s, r) => s + Number(r.totalHours || 0), 0) * emp.salary
                : (emp.salary / 30) * new Set(scoped.map(r => new Date(r.clockIn).toDateString())).size;
            total += amount;
            return {
                id: `PAY-${Date.now()}-${emp.id}`,
                employeeId: emp.id,
                amount,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                status: 'POSTED',
                postedAt: new Date().toISOString(),
                branchId: body.branchId,
            };
        });

        const cycle = {
            id: `CYCLE-${Date.now()}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            branchId: body.branchId,
            totalAmount: total,
            entries: entries.length,
            status: 'CLOSED',
            createdAt: new Date().toISOString(),
        };

        await writeJsonSetting(PAYOUT_KEY, [...entries, ...payouts], req.user?.id);
        await writeJsonSetting(CYCLES_KEY, [cycle, ...cycles], req.user?.id);
        res.status(201).json(cycle);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
