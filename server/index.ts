// Coduis Zen - Backend API Server
// Express server for database operations

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Database connected successfully'))
    .catch((err) => console.error('❌ Database connection failed:', err.message));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'ok', timestamp: result.rows[0].now, database: 'connected' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================
// 👤 USERS API
// ============================================================================

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const { id, name, email, password_hash, role, permissions, assigned_branch_id, is_active } = req.body;
        const result = await pool.query(
            `INSERT INTO users (id, name, email, password_hash, role, permissions, assigned_branch_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
            [id, name, email, password_hash, role, JSON.stringify(permissions || []), assigned_branch_id, is_active ?? true]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { name, email, role, permissions, assigned_branch_id, is_active } = req.body;
        const result = await pool.query(
            `UPDATE users SET name = $1, email = $2, role = $3, permissions = $4, assigned_branch_id = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
            [name, email, role, JSON.stringify(permissions || []), assigned_branch_id, is_active, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🏪 BRANCHES API
// ============================================================================

app.get('/api/branches', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM branches ORDER BY name');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/branches', async (req, res) => {
    try {
        const { id, name, name_ar, location, address, phone, email, is_active, timezone, currency, tax_rate } = req.body;
        const result = await pool.query(
            `INSERT INTO branches (id, name, name_ar, location, address, phone, email, is_active, timezone, currency, tax_rate, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
            [id, name, name_ar, location, address, phone, email, is_active ?? true, timezone || 'Africa/Cairo', currency || 'EGP', tax_rate || 14]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/branches/:id', async (req, res) => {
    try {
        const { name, name_ar, location, address, phone, email, is_active, tax_rate } = req.body;
        const result = await pool.query(
            `UPDATE branches SET name = $1, name_ar = $2, location = $3, address = $4, phone = $5, email = $6, is_active = $7, tax_rate = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
            [name, name_ar, location, address, phone, email, is_active, tax_rate, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/branches/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM branches WHERE id = $1', [req.params.id]);
        res.json({ message: 'Branch deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 👥 CUSTOMERS API
// ============================================================================

app.get('/api/customers', async (req, res) => {
    try {
        const { search, phone } = req.query;
        let query = 'SELECT * FROM customers';
        const params: any[] = [];

        if (phone) {
            query += ' WHERE phone LIKE $1';
            params.push(`%${phone}%`);
        } else if (search) {
            query += ' WHERE name ILIKE $1 OR phone LIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/customers/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/customers/phone/:phone', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customers WHERE phone = $1', [req.params.phone]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { id, name, phone, email, address, area, building, floor, apartment, landmark, notes, source } = req.body;
        const result = await pool.query(
            `INSERT INTO customers (id, name, phone, email, address, area, building, floor, apartment, landmark, notes, source, visits, total_spent, loyalty_tier, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 0, 'Bronze', NOW(), NOW()) RETURNING *`,
            [id, name, phone, email, address, area, building, floor, apartment, landmark, notes, source || 'call_center']
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { name, phone, email, address, area, building, floor, apartment, landmark, notes, loyalty_tier, visits, total_spent } = req.body;
        const result = await pool.query(
            `UPDATE customers SET name = $1, phone = $2, email = $3, address = $4, area = $5, building = $6, floor = $7, apartment = $8, landmark = $9, notes = $10, loyalty_tier = $11, visits = $12, total_spent = $13, updated_at = NOW()
       WHERE id = $14 RETURNING *`,
            [name, phone, email, address, area, building, floor, apartment, landmark, notes, loyalty_tier, visits, total_spent, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
        res.json({ message: 'Customer deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🍽️ MENU CATEGORIES API
// ============================================================================

app.get('/api/menu/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_categories WHERE is_active = true ORDER BY sort_order, name');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/menu/categories', async (req, res) => {
    try {
        const { id, name, name_ar, description, icon, image, color, sort_order, is_active, menu_ids, target_order_types } = req.body;
        const result = await pool.query(
            `INSERT INTO menu_categories (id, name, name_ar, description, icon, image, color, sort_order, is_active, menu_ids, target_order_types, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
            [id, name, name_ar, description, icon, image, color, sort_order || 0, is_active ?? true, JSON.stringify(menu_ids || []), JSON.stringify(target_order_types || [])]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/menu/categories/:id', async (req, res) => {
    try {
        const { name, name_ar, description, icon, image, color, sort_order, is_active, menu_ids, target_order_types } = req.body;
        const result = await pool.query(
            `UPDATE menu_categories SET name = $1, name_ar = $2, description = $3, icon = $4, image = $5, color = $6, sort_order = $7, is_active = $8, menu_ids = $10, target_order_types = $11, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
            [name, name_ar, description, icon, image, color, sort_order, is_active, req.params.id, JSON.stringify(menu_ids || []), JSON.stringify(target_order_types || [])]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/menu/categories/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM menu_categories WHERE id = $1', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🍕 MENU ITEMS API
// ============================================================================

app.get('/api/menu/items', async (req, res) => {
    try {
        const { category_id } = req.query;
        let query = 'SELECT * FROM menu_items WHERE is_available = true';
        const params: any[] = [];

        if (category_id) {
            query += ' AND category_id = $1';
            params.push(category_id);
        }

        query += ' ORDER BY sort_order, name';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/menu/items/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/menu/items', async (req, res) => {
    try {
        const { id, category_id, name, name_ar, description, description_ar, price, cost, image, is_available, preparation_time, is_popular, is_featured, sort_order, recipe } = req.body;
        const result = await pool.query(
            `INSERT INTO menu_items (id, category_id, name, name_ar, description, description_ar, price, cost, image, is_available, preparation_time, is_popular, is_featured, sort_order, recipe, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) RETURNING *`,
            [id, category_id, name, name_ar, description, description_ar, price, cost || 0, image, is_available ?? true, preparation_time || 15, is_popular ?? false, is_featured ?? false, sort_order || 0, JSON.stringify(recipe || [])]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/menu/items/:id', async (req, res) => {
    try {
        const { category_id, name, name_ar, description, description_ar, price, cost, image, is_available, preparation_time, is_popular, is_featured, sort_order, recipe } = req.body;
        const result = await pool.query(
            `UPDATE menu_items SET category_id = $1, name = $2, name_ar = $3, description = $4, description_ar = $5, price = $6, cost = $7, image = $8, is_available = $9, preparation_time = $10, is_popular = $11, is_featured = $12, sort_order = $13, recipe = $15, updated_at = NOW()
       WHERE id = $14 RETURNING *`,
            [category_id, name, name_ar, description, description_ar, price, cost, image, is_available, preparation_time, is_popular, is_featured, sort_order, req.params.id, JSON.stringify(recipe || [])]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/menu/items/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
        res.json({ message: 'Item deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get full menu with categories and items
app.get('/api/menu/full', async (req, res) => {
    try {
        const categories = await pool.query('SELECT * FROM menu_categories WHERE is_active = true ORDER BY sort_order, name');
        const items = await pool.query('SELECT * FROM menu_items WHERE is_available = true ORDER BY sort_order, name');

        const menu = categories.rows.map(cat => ({
            ...cat,
            items: items.rows.filter(item => item.category_id === cat.id)
        }));

        res.json(menu);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 📋 ORDERS API
// ============================================================================

app.get('/api/orders', async (req, res) => {
    try {
        const { status, branch_id, type, date, limit = 100 } = req.query;
        let query = 'SELECT * FROM orders WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }
        if (branch_id) {
            query += ` AND branch_id = $${paramIndex++}`;
            params.push(branch_id);
        }
        if (type) {
            query += ` AND type = $${paramIndex++}`;
            params.push(type);
        }
        if (date) {
            query += ` AND DATE(created_at) = $${paramIndex++}`;
            params.push(date);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);

        res.json({ ...order.rows[0], items: items.rows });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            id, type, source, branch_id, table_id, customer_id, customer_name, customer_phone,
            delivery_address, is_call_center_order, call_center_agent_id, status,
            subtotal, discount, discount_type, discount_reason, tax, delivery_fee, service_charge, total,
            free_delivery, is_urgent, payment_method, notes, kitchen_notes, delivery_notes, items
        } = req.body;

        // Insert order
        const orderResult = await client.query(
            `INSERT INTO orders (
        id, type, source, branch_id, table_id, customer_id, customer_name, customer_phone,
        delivery_address, is_call_center_order, call_center_agent_id, status,
        subtotal, discount, discount_type, discount_reason, tax, delivery_fee, service_charge, total,
        free_delivery, is_urgent, payment_method, notes, kitchen_notes, delivery_notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW(), NOW())
      RETURNING *`,
            [id, type, source || 'pos', branch_id, table_id, customer_id, customer_name, customer_phone,
                delivery_address, is_call_center_order ?? false, call_center_agent_id, status || 'PENDING',
                subtotal, discount || 0, discount_type, discount_reason, tax, delivery_fee || 0, service_charge || 0, total,
                free_delivery ?? false, is_urgent ?? false, payment_method, notes, kitchen_notes, delivery_notes]
        );

        // Insert order items
        for (const item of items || []) {
            await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, name, name_ar, price, quantity, notes, modifiers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [id, item.menu_item_id || item.id, item.name, item.name_ar, item.price, item.quantity, item.notes, JSON.stringify(item.modifiers || item.selectedModifiers || [])]
            );
        }

        // Add status history
        await client.query(
            `INSERT INTO order_status_history (order_id, status, changed_by, created_at)
       VALUES ($1, $2, $3, NOW())`,
            [id, status || 'PENDING', call_center_agent_id]
        );

        // Deduct inventory based on recipes
        for (const item of items || []) {
            const menuItemId = item.menu_item_id || item.id;
            const menuItemResult = await client.query('SELECT recipe FROM menu_items WHERE id = $1', [menuItemId]);
            const recipe = menuItemResult.rows[0]?.recipe;

            if (recipe && Array.isArray(recipe)) {
                // Find a warehouse for this branch to deduct from (Kitchen preferred)
                const warehouseResult = await client.query(
                    "SELECT id FROM warehouses WHERE branch_id = $1 AND type IN ('KITCHEN', 'POINT_OF_SALE') ORDER BY type DESC LIMIT 1",
                    [branch_id]
                );
                const warehouseId = warehouseResult.rows[0]?.id;

                if (warehouseId) {
                    for (const ingredient of recipe) {
                        const deductionQty = ingredient.quantity * item.quantity;

                        // Deduct from stock
                        await client.query(
                            `UPDATE inventory_stock 
                             SET quantity = quantity - $1, last_audit_date = NOW() 
                             WHERE item_id = $2 AND warehouse_id = $3`,
                            [deductionQty, ingredient.itemId, warehouseId]
                        );

                        // Record movement
                        await client.query(
                            `INSERT INTO stock_movements (item_id, from_warehouse_id, quantity, type, reason, actor_id, reference_id, created_at)
                             VALUES ($1, $2, $3, 'SALE_CONSUMPTION', 'Automatic deduction from Order', $4, $5, NOW())`,
                            [ingredient.itemId, warehouseId, deductionQty, call_center_agent_id || 'system', id]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json(orderResult.rows[0]);
    } catch (error: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status, changed_by, notes } = req.body;

        const result = await pool.query(
            `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        // Add to status history
        await pool.query(
            `INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
            [req.params.id, status, changed_by, notes]
        );

        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM order_items WHERE order_id = $1', [req.params.id]);
        await pool.query('DELETE FROM order_status_history WHERE order_id = $1', [req.params.id]);
        await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
        res.json({ message: 'Order deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 📦 INVENTORY API
// ============================================================================

app.get('/api/inventory', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT i.*, 
             COALESCE(
                 (SELECT json_agg(json_build_object('warehouseId', s.warehouse_id, 'quantity', s.quantity))
                  FROM inventory_stock s WHERE s.item_id = i.id),
                 '[]'::json
             ) as warehouse_quantities
      FROM inventory_items i
      WHERE i.is_active = true
      ORDER BY i.name
    `);
        res.json(result.rows.map(row => ({
            ...row,
            warehouseQuantities: row.warehouse_quantities,
            costPrice: Number(row.cost_price),
            purchasePrice: Number(row.purchase_price),
            threshold: Number(row.threshold)
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const { id, name, name_ar, sku, barcode, unit, category, threshold, cost_price, purchase_price, supplier_id, is_audited, audit_frequency, is_composite, bom } = req.body;
        const result = await pool.query(
            `INSERT INTO inventory_items (
                id, name, name_ar, sku, barcode, unit, category, threshold, cost_price, purchase_price, 
                supplier_id, is_audited, audit_frequency, is_composite, bom, is_active, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, NOW(), NOW()) 
            RETURNING *`,
            [
                id, name, name_ar, sku, barcode, unit, category, threshold || 0, cost_price || 0, purchase_price || 0,
                supplier_id, is_audited ?? true, audit_frequency || 'DAILY', is_composite ?? false, JSON.stringify(bom || [])
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { name, name_ar, sku, barcode, unit, category, threshold, cost_price, purchase_price, supplier_id, is_audited, audit_frequency, is_composite, bom, is_active } = req.body;
        const result = await pool.query(
            `UPDATE inventory_items SET 
                name = $1, name_ar = $2, sku = $3, barcode = $4, unit = $5, category = $6, threshold = $7, 
                cost_price = $8, purchase_price = $9, supplier_id = $10, is_audited = $11, audit_frequency = $12, 
                is_composite = $13, bom = $14, is_active = $15, updated_at = NOW()
            WHERE id = $16 RETURNING *`,
            [
                name, name_ar, sku, barcode, unit, category, threshold, cost_price, purchase_price,
                supplier_id, is_audited, audit_frequency, is_composite, JSON.stringify(bom), is_active, req.params.id
            ]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🏠 WAREHOUSES API
// ============================================================================

app.get('/api/warehouses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM warehouses WHERE is_active = true ORDER BY name');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/warehouses', async (req, res) => {
    try {
        const { id, name, name_ar, branch_id, type, parent_id } = req.body;
        const result = await pool.query(
            `INSERT INTO warehouses (id, name, name_ar, branch_id, type, parent_id, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) RETURNING *`,
            [id, name, name_ar, branch_id, type, parent_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🔄 STOCK MANAGEMENT API
// ============================================================================

app.post('/api/inventory/stock/update', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { item_id, warehouse_id, quantity, type, reason, actor_id, reference_id } = req.body;

        // 1. Get current stock
        const currentStock = await client.query(
            'SELECT quantity FROM inventory_stock WHERE item_id = $1 AND warehouse_id = $2',
            [item_id, warehouse_id]
        );

        const oldQty = currentStock.rows[0]?.quantity || 0;

        // 2. Update stock
        await client.query(
            `INSERT INTO inventory_stock (item_id, warehouse_id, quantity, last_audit_date)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (item_id, warehouse_id) DO UPDATE SET quantity = $3, last_audit_date = NOW()`,
            [item_id, warehouse_id, quantity]
        );

        // 3. Record movement
        await client.query(
            `INSERT INTO stock_movements (item_id, to_warehouse_id, quantity, type, reason, actor_id, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [item_id, warehouse_id, quantity - oldQty, type || 'ADJUSTMENT', reason, actor_id, reference_id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Stock updated successfully' });
    } catch (error: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});


// ============================================================================
// ⚙️ SETTINGS API
// ============================================================================

app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings');
        const settings: Record<string, any> = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings/:key', async (req, res) => {
    try {
        const { value, category, updated_by } = req.body;
        const result = await pool.query(
            `INSERT INTO system_settings (key, value, category, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, category = $3, updated_by = $4, updated_at = NOW()
       RETURNING *`,
            [req.params.key, JSON.stringify(value), category, updated_by]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk update settings
app.put('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
                [key, JSON.stringify(value)]
            );
        }
        res.json({ message: 'Settings updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🔒 AUDIT LOGS API
// ============================================================================

app.get('/api/audit-logs', async (req, res) => {
    try {
        const { event_type, user_id, limit = 100 } = req.query;
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (event_type) {
            query += ` AND event_type = $${paramIndex++}`;
            params.push(event_type);
        }
        if (user_id) {
            query += ` AND user_id = $${paramIndex++}`;
            params.push(user_id);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/audit-logs', async (req, res) => {
    try {
        const { event_type, user_id, user_name, user_role, branch_id, device_id, ip_address, payload, before, after, reason } = req.body;
        const result = await pool.query(
            `INSERT INTO audit_logs (event_type, user_id, user_name, user_role, branch_id, device_id, ip_address, payload, before, after, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
            [event_type, user_id, user_name, user_role, branch_id, device_id, ip_address, JSON.stringify(payload), JSON.stringify(before), JSON.stringify(after), reason]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 🖼️ IMAGES API
// ============================================================================

app.post('/api/images', async (req, res) => {
    try {
        const { id, filename, data, contentType, type } = req.body;

        // Check if images table exists, create if not
        await pool.query(`
            CREATE TABLE IF NOT EXISTS images (
                id VARCHAR(64) PRIMARY KEY,
                filename VARCHAR(255),
                data TEXT NOT NULL,
                content_type VARCHAR(64),
                type VARCHAR(32),
                size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const size = data ? Math.round(data.length * 0.75) : 0; // Approximate base64 to bytes

        const result = await pool.query(
            `INSERT INTO images (id, filename, data, content_type, type, size, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (id) DO UPDATE SET data = $3, content_type = $4, size = $6
             RETURNING id, filename, content_type, type, size, created_at`,
            [id, filename, data, contentType, type || 'other', size]
        );

        res.status(201).json({
            ...result.rows[0],
            url: data // Return the base64 as URL for immediate use
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/images/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM images WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.json({ ...result.rows[0], url: result.rows[0].data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/images/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM images WHERE id = $1', [req.params.id]);
        res.json({ message: 'Image deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Coduis Zen API Server                                  ║
║   ────────────────────────────────────────────────────────  ║
║   Server running on: http://localhost:${PORT}                  ║
║   Health check: http://localhost:${PORT}/api/health            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
