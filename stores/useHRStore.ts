import { create } from 'zustand';
import { Employee } from '../types';
import { hrApi } from '../services/api';

interface AttendanceRecord {
    id: string;
    employeeId: string;
    clockIn: Date;
    clockOut?: Date;
    totalHours: number;
}

interface HRState {
    employees: Employee[];
    attendance: AttendanceRecord[];
    payrollCycles: Array<{ id: string; startDate: string; endDate: string; totalAmount: number; entries: number; status: string }>;
    payoutLedger: Array<{ id: string; employeeId: string; amount: number; postedAt: string; status: string }>;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchEmployees: () => Promise<void>;
    clockIn: (employeeId: string) => Promise<void>;
    clockOut: (employeeId: string) => Promise<void>;
    calculatePayroll: (employeeId: string, startDate: Date, endDate: Date) => number;
    executePayrollCycle: (startDate: Date, endDate: Date, branchId?: string) => Promise<void>;
}

export const useHRStore = create<HRState>((set, get) => ({
    employees: [],
    attendance: [],
    payrollCycles: [],
    payoutLedger: [],
    isLoading: false,
    error: null,

    fetchEmployees: async () => {
        set({ isLoading: true });
        try {
            const [employeesRaw, attendanceRaw] = await Promise.all([
                hrApi.getEmployees(),
                hrApi.getAttendance(),
            ]);
            const [payrollCycles, payoutLedger] = await Promise.all([
                hrApi.getPayrollCycles().catch(() => []),
                hrApi.getPayouts().catch(() => []),
            ]);
            const employees: Employee[] = employeesRaw.map((e: any) => ({
                id: e.id,
                userId: e.userId,
                nationalId: e.nationalId,
                joinDate: new Date(e.joinDate),
                salary: Number(e.salary || 0),
                salaryType: e.salaryType,
                emergencyContact: e.emergencyContact || '',
                activeShiftId: e.activeShiftId,
                bankAccount: e.bankAccount,
            }));
            const attendance: AttendanceRecord[] = attendanceRaw.map((a: any) => ({
                id: a.id,
                employeeId: a.employeeId,
                clockIn: new Date(a.clockIn),
                clockOut: a.clockOut ? new Date(a.clockOut) : undefined,
                totalHours: Number(a.totalHours || 0),
            }));
            set({ employees, attendance, payrollCycles, payoutLedger, isLoading: false });
        } catch (error: any) {
            // Dev-safe fallback until HR bootstrap is done
            const mockEmployees: Employee[] = [
                { id: 'E1', userId: 'U1', nationalId: '123456789', joinDate: new Date('2025-01-01'), salary: 12000, salaryType: 'MONTHLY', emergencyContact: '01011111111' },
                { id: 'E2', userId: 'U2', nationalId: '987654321', joinDate: new Date('2025-02-15'), salary: 65, salaryType: 'HOURLY', emergencyContact: '01122222222' },
            ];
            set({ employees: mockEmployees, isLoading: false, error: error.message });
        }
    },

    clockIn: async (employeeId) => {
        try {
            const saved = await hrApi.clockIn({ employeeId });
            const record: AttendanceRecord = {
                id: saved.id,
                employeeId: saved.employeeId,
                clockIn: new Date(saved.clockIn),
                totalHours: Number(saved.totalHours || 0),
            };
            set(state => ({ attendance: [record, ...state.attendance] }));
        } catch {
            const record: AttendanceRecord = {
                id: Math.random().toString(36).substring(2, 11),
                employeeId,
                clockIn: new Date(),
                totalHours: 0
            };
            set(state => ({ attendance: [record, ...state.attendance] }));
        }
    },

    clockOut: async (employeeId) => {
        try {
            const saved = await hrApi.clockOut({ employeeId });
            set(state => ({
                attendance: state.attendance.map(a =>
                    (a.employeeId === employeeId && !a.clockOut)
                        ? { ...a, clockOut: new Date(saved.clockOut), totalHours: Number(saved.totalHours || 0) }
                        : a
                )
            }));
        } catch {
            set(state => ({
                attendance: state.attendance.map(a =>
                    (a.employeeId === employeeId && !a.clockOut)
                        ? { ...a, clockOut: new Date(), totalHours: (new Date().getTime() - a.clockIn.getTime()) / (1000 * 60 * 60) }
                        : a
                )
            }));
        }
    },

    calculatePayroll: (employeeId, start, end) => {
        const { employees, attendance } = get();
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return 0;

        const records = attendance.filter(a =>
            a.employeeId === employeeId &&
            a.clockIn >= start &&
            a.clockIn <= end &&
            a.clockOut
        );

        if (employee.salaryType === 'HOURLY') {
            const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);
            return totalHours * employee.salary;
        } else {
            // Simple monthly logic
            const attendedDays = new Set(records.map(r => r.clockIn.toDateString())).size;
            const fullMonthDays = 30;
            return (employee.salary / fullMonthDays) * attendedDays;
        }
    },

    executePayrollCycle: async (startDate, endDate, branchId) => {
        await hrApi.executePayroll({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            branchId,
        });
        const [payrollCycles, payoutLedger] = await Promise.all([
            hrApi.getPayrollCycles(),
            hrApi.getPayouts(),
        ]);
        set({ payrollCycles, payoutLedger });
    },
}));
