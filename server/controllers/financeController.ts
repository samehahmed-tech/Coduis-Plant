import { Request, Response } from 'express';
import { financeEngine } from '../services/financeEngine';
import { financialStatements } from '../services/financialStatements';

export const getAccounts = async (_req: Request, res: Response) => {
    try {
        const accounts = await financeEngine.getAccounts();
        res.json(accounts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getJournal = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit || 100);
        const journal = await financeEngine.getJournal();
        res.json(journal.slice(0, Math.max(1, Math.min(1000, limit))));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createJournalEntry = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const created = await financeEngine.postDoubleEntry({
            description: body.description || 'Manual Journal',
            amount: Number(body.amount || 0),
            debitAccountCode: body.debitAccountCode,
            creditAccountCode: body.creditAccountCode,
            referenceId: body.referenceId,
            source: body.source || 'MANUAL',
            metadata: body.metadata,
            updatedBy: req.user?.id || 'system',
        });
        res.status(201).json(created);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTrialBalance = async (_req: Request, res: Response) => {
    try {
        const report = await financeEngine.trialBalance();
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getReconciliations = async (_req: Request, res: Response) => {
    try {
        const rows = await financeEngine.getReconciliations();
        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createReconciliation = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const created = await financeEngine.createReconciliation({
            accountCode: body.accountCode,
            statementDate: body.statementDate || new Date().toISOString(),
            statementBalance: Number(body.statementBalance || 0),
            notes: body.notes,
            updatedBy: req.user?.id || 'system',
        });
        res.status(201).json(created);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const resolveReconciliation = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id || '');
        if (!id) return res.status(400).json({ error: 'RECONCILIATION_ID_REQUIRED' });
        const body = req.body || {};
        const resolved = await financeEngine.resolveReconciliation({
            reconciliationId: id,
            adjustWithJournal: Boolean(body.adjustWithJournal),
            adjustmentAccountCode: body.adjustmentAccountCode,
            notes: body.notes,
            updatedBy: req.user?.id || 'system',
        });
        res.json(resolved);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getPeriodCloses = async (_req: Request, res: Response) => {
    try {
        const periods = await financeEngine.getPeriodCloses();
        res.json(periods);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const closePeriod = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const closed = await financeEngine.closePeriod({
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            updatedBy: req.user?.id || 'system',
        });
        res.status(201).json(closed);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// =============================================================================
// Financial Statements
// =============================================================================

export const getProfitAndLoss = async (req: Request, res: Response) => {
    try {
        const periodStart = String(req.query.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
        const periodEnd = String(req.query.end || new Date().toISOString().split('T')[0]);
        const report = await financialStatements.profitAndLoss(periodStart, periodEnd);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
    try {
        const asOfDate = req.query.date ? String(req.query.date) : undefined;
        const report = await financialStatements.balanceSheet(asOfDate);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCashFlowStatement = async (req: Request, res: Response) => {
    try {
        const periodStart = String(req.query.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
        const periodEnd = String(req.query.end || new Date().toISOString().split('T')[0]);
        const report = await financialStatements.cashFlowStatement(periodStart, periodEnd);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAccountsReceivable = async (_req: Request, res: Response) => {
    try {
        const report = await financialStatements.accountsReceivable();
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAccountsPayable = async (_req: Request, res: Response) => {
    try {
        const report = await financialStatements.accountsPayable();
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
