import { create } from 'zustand';
import { Employee } from '../types';

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
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchEmployees: () => Promise<void>;
    clockIn: (employeeId: string) => Promise<void>;
    clockOut: (employeeId: string) => Promise<void>;
    calculatePayroll: (employeeId: string, startDate: Date, endDate: Date) => number;
}

export const useHRStore = create<HRState>((set, get) => ({
    employees: [],
    attendance: [],
    isLoading: false,
    error: null,

    fetchEmployees: async () => {
        set({ isLoading: true });
        // Simulation
        const mockEmployees: Employee[] = [
            { id: 'E1', userId: 'U1', nationalId: '123456789', joinDate: new Date('2025-01-01'), salary: 12000, salaryType: 'MONTHLY', emergencyContact: '01011111111' },
            { id: 'E2', userId: 'U2', nationalId: '987654321', joinDate: new Date('2025-02-15'), salary: 65, salaryType: 'HOURLY', emergencyContact: '01122222222' },
        ];
        set({ employees: mockEmployees, isLoading: false });
    },

    clockIn: async (employeeId) => {
        const record: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId,
            clockIn: new Date(),
            totalHours: 0
        };
        set(state => ({ attendance: [record, ...state.attendance] }));
    },

    clockOut: async (employeeId) => {
        set(state => ({
            attendance: state.attendance.map(a =>
                (a.employeeId === employeeId && !a.clockOut)
                    ? { ...a, clockOut: new Date(), totalHours: (new Date().getTime() - a.clockIn.getTime()) / (1000 * 60 * 60) }
                    : a
            )
        }));
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
    }
}));
