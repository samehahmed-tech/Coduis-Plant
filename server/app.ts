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

const app = express();

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

export default app;
