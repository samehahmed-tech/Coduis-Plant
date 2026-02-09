import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import branchRoutes from './routes/branchRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import shiftRoutes from './routes/shiftRoutes';
import approvalRoutes from './routes/approvalRoutes';
import reportRoutes from './routes/reportRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import campaignRoutes from './routes/campaignRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import hrRoutes from './routes/hrRoutes';
import financeRoutes from './routes/financeRoutes';
import wastageRoutes from './routes/wastageRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import printerRoutes from './routes/printerRoutes';
import customerRoutes from './routes/customerRoutes';
import settingsRoutes from './routes/settingsRoutes';
import tableRoutes from './routes/tableRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import auditRoutes from './routes/auditRoutes';
import imageRoutes from './routes/imageRoutes';
import authRoutes from './routes/authRoutes';
import setupRoutes from './routes/setupRoutes';
import fiscalRoutes from './routes/fiscalRoutes';
import opsRoutes from './routes/opsRoutes';
import productionRoutes from './routes/productionRoutes';
import dayCloseRoutes from './routes/dayCloseRoutes';
import { authenticateToken, requireRoles } from './middleware/auth';
import { isOriginAllowed } from './config/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Protected Routes
app.use('/api', authenticateToken);

app.use('/api/users', requireRoles('SUPER_ADMIN'), userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/approvals', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), approvalRoutes);
app.use('/api/reports', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'FINANCE'), reportRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/campaigns', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), campaignRoutes);
app.use('/api/analytics', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'FINANCE', 'MANAGER'), analyticsRoutes);
app.use('/api/hr', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'FINANCE'), hrRoutes);
app.use('/api/finance', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'FINANCE'), financeRoutes);
app.use('/api/wastage', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), wastageRoutes);
app.use('/api/production', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), productionRoutes);
app.use('/api/suppliers', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), supplierRoutes);
app.use('/api/purchase-orders', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), purchaseOrderRoutes);
app.use('/api/printers', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), printerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER'), settingsRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/audit-logs', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), auditRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/fiscal', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'FINANCE'), fiscalRoutes);
app.use('/api/day-close', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'FINANCE'), dayCloseRoutes);
app.use('/api/ops', requireRoles('SUPER_ADMIN'), opsRoutes);

// 404 handler for undefined routes
app.use('/api/*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
