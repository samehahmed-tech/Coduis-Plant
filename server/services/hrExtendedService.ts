/**
 * HR Extended Service — Leave Management, Departments, Overtime
 * Section 6 of the ERP Launch Readiness Checklist
 */

import { db } from '../db';
import { settings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

// =============================================================================
// Types
// =============================================================================

export interface Department {
    id: string;
    name: string;
    nameAr?: string;
    managerId?: string;
    parentId?: string;
    isActive: boolean;
    createdAt: string;
}

export interface JobTitle {
    id: string;
    name: string;
    nameAr?: string;
    departmentId?: string;
    salaryRange?: { min: number; max: number };
    isActive: boolean;
}

export interface LeaveType {
    id: string;
    name: string;
    nameAr?: string;
    daysPerYear: number;
    isPaid: boolean;
    requiresApproval: boolean;
    carryOver: boolean;
    maxCarryOverDays: number;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveTypeId: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    approvedBy?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface LeaveBalance {
    employeeId: string;
    leaveTypeId: string;
    leaveTypeName: string;
    entitled: number;
    used: number;
    pending: number;
    remaining: number;
    carriedOver: number;
}

export interface OvertimeEntry {
    id: string;
    employeeId: string;
    date: string;
    regularHours: number;
    overtimeHours: number;
    overtimeRate: number; // multiplier (1.5x, 2x)
    overtimeAmount: number;
    approvedBy?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// =============================================================================
// Storage Keys
// =============================================================================

const DEPARTMENTS_KEY = 'hr_departments_v1';
const JOB_TITLES_KEY = 'hr_job_titles_v1';
const LEAVE_TYPES_KEY = 'hr_leave_types_v1';
const LEAVE_REQUESTS_KEY = 'hr_leave_requests_v1';
const OVERTIME_KEY = 'hr_overtime_v1';

// Helpers
const readSetting = async <T>(key: string, fallback: T): Promise<T> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return (row?.value as T) || fallback;
};

const writeSetting = async (key: string, value: any, updatedBy?: string) => {
    const [existing] = await db.select().from(settings).where(eq(settings.key, key));
    if (existing) {
        await db.update(settings)
            .set({ value, category: 'hr', updatedBy: updatedBy || 'system', updatedAt: new Date() })
            .where(eq(settings.key, key));
    } else {
        await db.insert(settings).values({
            key, value, category: 'hr', updatedBy: updatedBy || 'system', updatedAt: new Date(),
        } as any);
    }
};

// Default leave types for Egypt
const defaultLeaveTypes = (): LeaveType[] => ([
    { id: 'LT-ANNUAL', name: 'Annual Leave', nameAr: 'إجازة سنوية', daysPerYear: 21, isPaid: true, requiresApproval: true, carryOver: true, maxCarryOverDays: 5 },
    { id: 'LT-SICK', name: 'Sick Leave', nameAr: 'إجازة مرضية', daysPerYear: 30, isPaid: true, requiresApproval: true, carryOver: false, maxCarryOverDays: 0 },
    { id: 'LT-CASUAL', name: 'Casual Leave', nameAr: 'إجازة عارضة', daysPerYear: 6, isPaid: true, requiresApproval: true, carryOver: false, maxCarryOverDays: 0 },
    { id: 'LT-MATERNITY', name: 'Maternity Leave', nameAr: 'إجازة أمومة', daysPerYear: 90, isPaid: true, requiresApproval: true, carryOver: false, maxCarryOverDays: 0 },
    { id: 'LT-UNPAID', name: 'Unpaid Leave', nameAr: 'إجازة بدون مرتب', daysPerYear: 365, isPaid: false, requiresApproval: true, carryOver: false, maxCarryOverDays: 0 },
    { id: 'LT-PILGRIMAGE', name: 'Pilgrimage Leave', nameAr: 'إجازة حج', daysPerYear: 30, isPaid: true, requiresApproval: true, carryOver: false, maxCarryOverDays: 0 },
]);

// =============================================================================
// Service
// =============================================================================

export const hrExtendedService = {

    // =========================================================================
    // Departments
    // =========================================================================
    async getDepartments(): Promise<Department[]> {
        return readSetting<Department[]>(DEPARTMENTS_KEY, []);
    },

    async upsertDepartment(dept: Partial<Department> & { name: string }, updatedBy?: string): Promise<Department> {
        const departments = await this.getDepartments();
        const existing = dept.id ? departments.find(d => d.id === dept.id) : null;

        if (existing) {
            Object.assign(existing, { ...dept, updatedAt: new Date().toISOString() });
            await writeSetting(DEPARTMENTS_KEY, departments, updatedBy);
            return existing;
        }

        const newDept: Department = {
            id: `DEPT-${Date.now()}`,
            name: dept.name,
            nameAr: dept.nameAr,
            managerId: dept.managerId,
            parentId: dept.parentId,
            isActive: dept.isActive !== false,
            createdAt: new Date().toISOString(),
        };
        departments.push(newDept);
        await writeSetting(DEPARTMENTS_KEY, departments, updatedBy);
        return newDept;
    },

    // =========================================================================
    // Job Titles
    // =========================================================================
    async getJobTitles(): Promise<JobTitle[]> {
        return readSetting<JobTitle[]>(JOB_TITLES_KEY, []);
    },

    async upsertJobTitle(title: Partial<JobTitle> & { name: string }, updatedBy?: string): Promise<JobTitle> {
        const titles = await this.getJobTitles();
        const existing = title.id ? titles.find(t => t.id === title.id) : null;

        if (existing) {
            Object.assign(existing, title);
            await writeSetting(JOB_TITLES_KEY, titles, updatedBy);
            return existing;
        }

        const newTitle: JobTitle = {
            id: `JOB-${Date.now()}`,
            name: title.name,
            nameAr: title.nameAr,
            departmentId: title.departmentId,
            salaryRange: title.salaryRange,
            isActive: title.isActive !== false,
        };
        titles.push(newTitle);
        await writeSetting(JOB_TITLES_KEY, titles, updatedBy);
        return newTitle;
    },

    // =========================================================================
    // Leave Types
    // =========================================================================
    async getLeaveTypes(): Promise<LeaveType[]> {
        const types = await readSetting<LeaveType[]>(LEAVE_TYPES_KEY, []);
        if (types.length === 0) {
            const defaults = defaultLeaveTypes();
            await writeSetting(LEAVE_TYPES_KEY, defaults, 'system');
            return defaults;
        }
        return types;
    },

    // =========================================================================
    // Leave Requests
    // =========================================================================
    async getLeaveRequests(filters?: { employeeId?: string; status?: string }): Promise<LeaveRequest[]> {
        let requests = await readSetting<LeaveRequest[]>(LEAVE_REQUESTS_KEY, []);

        if (filters?.employeeId) {
            requests = requests.filter(r => r.employeeId === filters.employeeId);
        }
        if (filters?.status) {
            requests = requests.filter(r => r.status === filters.status);
        }

        return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async createLeaveRequest(data: {
        employeeId: string;
        employeeName: string;
        leaveTypeId: string;
        startDate: string;
        endDate: string;
        reason: string;
    }): Promise<LeaveRequest> {
        const requests = await readSetting<LeaveRequest[]>(LEAVE_REQUESTS_KEY, []);
        const leaveTypes = await this.getLeaveTypes();
        const leaveType = leaveTypes.find(t => t.id === data.leaveTypeId);
        if (!leaveType) throw new Error('Invalid leave type');

        // Calculate working days
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        let totalDays = 0;
        const current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 5) { // Friday is weekend in Egypt
                totalDays++;
            }
            current.setDate(current.getDate() + 1);
        }

        // Check balance
        const balance = await this.getLeaveBalance(data.employeeId, data.leaveTypeId);
        if (balance.remaining < totalDays) {
            throw new Error(`Insufficient leave balance. Remaining: ${balance.remaining} days, Requested: ${totalDays} days`);
        }

        // Check for overlapping leaves
        const overlap = requests.find(r =>
            r.employeeId === data.employeeId &&
            r.status !== 'REJECTED' && r.status !== 'CANCELLED' &&
            new Date(r.startDate) <= end && new Date(r.endDate) >= start
        );
        if (overlap) {
            throw new Error('Overlapping leave request exists');
        }

        const request: LeaveRequest = {
            id: `LR-${Date.now()}`,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            leaveTypeId: data.leaveTypeId,
            leaveTypeName: leaveType.name,
            startDate: data.startDate,
            endDate: data.endDate,
            totalDays,
            reason: data.reason,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        };

        requests.unshift(request);
        await writeSetting(LEAVE_REQUESTS_KEY, requests, data.employeeId);
        return request;
    },

    async approveLeaveRequest(requestId: string, approvedBy: string): Promise<LeaveRequest> {
        const requests = await readSetting<LeaveRequest[]>(LEAVE_REQUESTS_KEY, []);
        const request = requests.find(r => r.id === requestId);
        if (!request) throw new Error('Leave request not found');
        if (request.status !== 'PENDING') throw new Error('Leave request is not pending');

        request.status = 'APPROVED';
        request.approvedBy = approvedBy;
        request.updatedAt = new Date().toISOString();

        await writeSetting(LEAVE_REQUESTS_KEY, requests, approvedBy);
        return request;
    },

    async rejectLeaveRequest(requestId: string, rejectedBy: string, reason: string): Promise<LeaveRequest> {
        const requests = await readSetting<LeaveRequest[]>(LEAVE_REQUESTS_KEY, []);
        const request = requests.find(r => r.id === requestId);
        if (!request) throw new Error('Leave request not found');
        if (request.status !== 'PENDING') throw new Error('Leave request is not pending');

        request.status = 'REJECTED';
        request.approvedBy = rejectedBy;
        request.rejectionReason = reason;
        request.updatedAt = new Date().toISOString();

        await writeSetting(LEAVE_REQUESTS_KEY, requests, rejectedBy);
        return request;
    },

    // =========================================================================
    // Leave Balance
    // =========================================================================
    async getLeaveBalance(employeeId: string, leaveTypeId?: string): Promise<LeaveBalance> {
        const leaveTypes = await this.getLeaveTypes();
        const requests = await readSetting<LeaveRequest[]>(LEAVE_REQUESTS_KEY, []);

        const type = leaveTypeId
            ? leaveTypes.find(t => t.id === leaveTypeId)
            : leaveTypes[0]; // default to annual

        if (!type) throw new Error('Leave type not found');

        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

        const employeeRequests = requests.filter(r =>
            r.employeeId === employeeId &&
            r.leaveTypeId === type.id &&
            r.createdAt >= yearStart
        );

        const used = employeeRequests
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => sum + r.totalDays, 0);

        const pending = employeeRequests
            .filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + r.totalDays, 0);

        return {
            employeeId,
            leaveTypeId: type.id,
            leaveTypeName: type.name,
            entitled: type.daysPerYear,
            used,
            pending,
            remaining: type.daysPerYear - used,
            carriedOver: 0, // Could calculate from last year
        };
    },

    async getAllBalances(employeeId: string): Promise<LeaveBalance[]> {
        const leaveTypes = await this.getLeaveTypes();
        return Promise.all(leaveTypes.map(t => this.getLeaveBalance(employeeId, t.id)));
    },

    // =========================================================================
    // Overtime
    // =========================================================================
    async getOvertimeEntries(filters?: { employeeId?: string; status?: string; month?: string }): Promise<OvertimeEntry[]> {
        let entries = await readSetting<OvertimeEntry[]>(OVERTIME_KEY, []);

        if (filters?.employeeId) entries = entries.filter(e => e.employeeId === filters.employeeId);
        if (filters?.status) entries = entries.filter(e => e.status === filters.status);
        if (filters?.month) entries = entries.filter(e => e.date.startsWith(filters.month));

        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    async recordOvertime(data: {
        employeeId: string;
        date: string;
        regularHours: number;
        overtimeHours: number;
        overtimeRate?: number; // default 1.5x
        baseSalaryPerHour?: number;
    }): Promise<OvertimeEntry> {
        const entries = await readSetting<OvertimeEntry[]>(OVERTIME_KEY, []);

        const rate = data.overtimeRate || 1.5;
        const hourlyRate = data.baseSalaryPerHour || 0;
        const amount = data.overtimeHours * hourlyRate * rate;

        const entry: OvertimeEntry = {
            id: `OT-${Date.now()}`,
            employeeId: data.employeeId,
            date: data.date,
            regularHours: data.regularHours,
            overtimeHours: data.overtimeHours,
            overtimeRate: rate,
            overtimeAmount: Math.round(amount * 100) / 100,
            status: 'PENDING',
        };

        entries.unshift(entry);
        await writeSetting(OVERTIME_KEY, entries, data.employeeId);
        return entry;
    },

    async approveOvertime(entryId: string, approvedBy: string): Promise<OvertimeEntry> {
        const entries = await readSetting<OvertimeEntry[]>(OVERTIME_KEY, []);
        const entry = entries.find(e => e.id === entryId);
        if (!entry) throw new Error('Overtime entry not found');
        if (entry.status !== 'PENDING') throw new Error('Entry is not pending');

        entry.status = 'APPROVED';
        entry.approvedBy = approvedBy;

        await writeSetting(OVERTIME_KEY, entries, approvedBy);
        return entry;
    },
};

export default hrExtendedService;
