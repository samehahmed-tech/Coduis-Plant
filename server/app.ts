import express from 'express';
import path from 'path';
import cors from 'cors';
import { helmetMiddleware, generalRateLimit, authRateLimit, inputSanitizer, hideErrorDetails } from './middleware/security';
import logger from './utils/logger';
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
import aiRoutes from './routes/aiRoutes';
import callCenterSupervisorRoutes from './routes/callCenterSupervisorRoutes';
import printGatewayRoutes from './routes/printGatewayRoutes';
import printGatewayGatewayRoutes from './routes/printGatewayGatewayRoutes';
import whatsappWebhookRoutes from './routes/whatsappWebhookRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import inventoryIntelligenceRoutes from './routes/inventoryIntelligenceRoutes';
import refundRoutes from './routes/refundRoutes';
import hrExtendedRoutes from './routes/hrExtendedRoutes';
import { authenticateToken, requireRoles } from './middleware/auth';
import { isOriginAllowed } from './config/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { attachRequestId, requestLogger } from './middleware/requestContext';
import { errorContractMiddleware } from './middleware/errorContract';
import { errorTrackingMiddleware, getRecentErrors, getErrorStats } from './services/errorTrackingService';

const app = express();
app.set('trust proxy', 1);

// ── Security Middlewares ──
app.use(helmetMiddleware);
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
            return;
        }
        if (process.env.NODE_ENV !== 'production') {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(inputSanitizer);
app.use(generalRateLimit);
app.use(attachRequestId);
app.use(requestLogger);
app.use(errorContractMiddleware);

logger.info({ port: process.env.API_PORT || 3001, env: process.env.NODE_ENV || 'development' }, 'RestoFlow ERP server initializing');

// Public Routes (with auth-specific rate limit)
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/print-gateway/gateway', printGatewayGatewayRoutes);
app.use('/api/whatsapp', whatsappWebhookRoutes);

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
app.use('/api/reports', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'FINANCE', 'MANAGER'), reportRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/campaigns', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), campaignRoutes);
app.use('/api/call-center', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), callCenterSupervisorRoutes);
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
app.use('/api/ai', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), aiRoutes);
app.use('/api/ops', requireRoles('SUPER_ADMIN'), opsRoutes);
app.use('/api/print-gateway', printGatewayRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/inventory-intelligence', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), inventoryIntelligenceRoutes);
app.use('/api/refunds', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'CASHIER'), refundRoutes);
app.use('/api/hr-extended', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'FINANCE'), hrExtendedRoutes);

// Error tracking API (ops)
app.get('/api/ops/errors', requireRoles('SUPER_ADMIN'), (_req, res) => {
    res.json({ errors: getRecentErrors(), stats: getErrorStats() });
});

// 404 handler for undefined routes
app.use('/api/{*path}', notFoundHandler);

// ── Static Frontend (production) ──
if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y', immutable: true }));
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Production error detail hiding
app.use(hideErrorDetails);

// Error tracking middleware (captures before global handler)
app.use(errorTrackingMiddleware);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
