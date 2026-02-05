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
import wastageRoutes from './routes/wastageRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import customerRoutes from './routes/customerRoutes';
import settingsRoutes from './routes/settingsRoutes';
import tableRoutes from './routes/tableRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import auditRoutes from './routes/auditRoutes';
import imageRoutes from './routes/imageRoutes';
import authRoutes from './routes/authRoutes';
import { authenticateToken, requireRoles } from './middleware/auth';

const app = express();

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Public Routes
app.use('/api/auth', authRoutes);

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
app.use('/api/wastage', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), wastageRoutes);
app.use('/api/suppliers', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), supplierRoutes);
app.use('/api/purchase-orders', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), purchaseOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER'), settingsRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/audit-logs', requireRoles('SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'), auditRoutes);
app.use('/api/images', imageRoutes);

// (health moved above)

export default app;
