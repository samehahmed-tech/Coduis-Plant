import { Router } from 'express';
import * as hrController from '../controllers/hrController';

const router = Router();

router.get('/employees', hrController.getEmployees);
router.post('/employees', hrController.upsertEmployee);
router.get('/attendance', hrController.getAttendance);
router.post('/attendance/clock-in', hrController.clockIn);
router.post('/attendance/clock-out', hrController.clockOut);
router.get('/payroll/summary', hrController.payrollSummary);
router.get('/payroll/cycles', hrController.getPayrollCycles);
router.get('/payroll/payouts', hrController.getPayoutLedger);
router.post('/payroll/execute', hrController.executePayrollCycle);

export default router;
