import { Router } from 'express';
import { hrExtendedService } from '../services/hrExtendedService';
import { Request, Response } from 'express';

const router = Router();

// Departments
router.get('/departments', async (_req: Request, res: Response) => {
    try { res.json(await hrExtendedService.getDepartments()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post('/departments', async (req: Request, res: Response) => {
    try { res.status(201).json(await hrExtendedService.upsertDepartment(req.body, req.user?.id)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Job Titles
router.get('/job-titles', async (_req: Request, res: Response) => {
    try { res.json(await hrExtendedService.getJobTitles()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post('/job-titles', async (req: Request, res: Response) => {
    try { res.status(201).json(await hrExtendedService.upsertJobTitle(req.body, req.user?.id)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Leave Types
router.get('/leave-types', async (_req: Request, res: Response) => {
    try { res.json(await hrExtendedService.getLeaveTypes()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Leave Requests
router.get('/leave-requests', async (req: Request, res: Response) => {
    try {
        res.json(await hrExtendedService.getLeaveRequests({
            employeeId: req.query.employeeId ? String(req.query.employeeId) : undefined,
            status: req.query.status ? String(req.query.status) : undefined,
        }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post('/leave-requests', async (req: Request, res: Response) => {
    try { res.status(201).json(await hrExtendedService.createLeaveRequest(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.put('/leave-requests/:id/approve', async (req: Request, res: Response) => {
    try { res.json(await hrExtendedService.approveLeaveRequest(String(req.params.id), req.user?.id || 'system')); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.put('/leave-requests/:id/reject', async (req: Request, res: Response) => {
    try { res.json(await hrExtendedService.rejectLeaveRequest(String(req.params.id), req.user?.id || 'system', req.body.reason || '')); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Leave Balance
router.get('/leave-balance/:employeeId', async (req: Request, res: Response) => {
    try { res.json(await hrExtendedService.getAllBalances(String(req.params.employeeId))); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Overtime
router.get('/overtime', async (req: Request, res: Response) => {
    try {
        res.json(await hrExtendedService.getOvertimeEntries({
            employeeId: req.query.employeeId ? String(req.query.employeeId) : undefined,
            status: req.query.status ? String(req.query.status) : undefined,
            month: req.query.month ? String(req.query.month) : undefined,
        }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post('/overtime', async (req: Request, res: Response) => {
    try { res.status(201).json(await hrExtendedService.recordOvertime(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.put('/overtime/:id/approve', async (req: Request, res: Response) => {
    try { res.json(await hrExtendedService.approveOvertime(String(req.params.id), req.user?.id || 'system')); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
