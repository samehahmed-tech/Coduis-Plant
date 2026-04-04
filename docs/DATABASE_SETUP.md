# 🗄️ Database Integration Plan - RestoFlow ERP
## SQLite (Local) + PostgreSQL (Cloud)

---

## 📋 Overview

| Environment | Database | Use Case |
|-------------|----------|----------|
| **Local/Offline** | SQLite | Single-branch POS, offline mode, development |
| **Production/Multi-branch** | PostgreSQL | Cloud deployment, multi-branch sync |

---

## 🔧 Step 1: Install Required Packages

### For Electron/Local Mode (SQLite):
```bash
npm install better-sqlite3 @types/better-sqlite3
npm install drizzle-orm drizzle-kit
```

### For Web/Cloud Mode (PostgreSQL):
```bash
npm install @neondatabase/serverless
# OR for traditional PostgreSQL
npm install pg @types/pg
```

### Full Installation Command:
```bash
npm install drizzle-orm drizzle-kit better-sqlite3 @types/better-sqlite3 pg @types/pg
```

---

## 🔧 Step 2: Configure PostgreSQL Server

### 2.1 Check PostgreSQL Status (Windows PowerShell):
```powershell
# Check if PostgreSQL service is running
Get-Service -Name "postgresql*"

# Start PostgreSQL service
Start-Service -Name "postgresql-x64-16"  # adjust version number

# Or via pg_ctl
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" status -D "C:\Program Files\PostgreSQL\16\data"
```

### 2.2 Create Database and User:
```sql
-- Connect to PostgreSQL (use psql or pgAdmin)
-- Default: psql -U postgres

-- Create database
CREATE DATABASE restoflow_erp;

-- Create user (change password!)
CREATE USER restoflow_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE restoflow_erp TO restoflow_user;

-- Connect to the database
\c restoflow_erp

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO restoflow_user;
```

### 2.3 Connection String:
```
# Local PostgreSQL
DATABASE_URL="postgresql://restoflow_user:your_secure_password@localhost:5432/restoflow_erp"

# Remote PostgreSQL (future)
DATABASE_URL="postgresql://restoflow_user:password@SERVER_IP:5432/restoflow_erp"
```

---

## 🔧 Step 3: Create Database Schema

Create file: `src/db/schema.ts`

```typescript
import { pgTable, serial, text, timestamp, boolean, integer, real, json } from 'drizzle-orm/pg-core';

// ==================== USERS & AUTH ====================
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  role: text('role').notNull(), // SUPER_ADMIN, BRANCH_MANAGER, CASHIER, etc.
  permissions: json('permissions').$type<string[]>().default([]),
  assignedBranchId: text('assigned_branch_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== BRANCHES ====================
export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  phone: text('phone'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==================== CUSTOMERS (CRM) ====================
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').unique().notNull(),
  email: text('email'),
  address: text('address'),
  area: text('area'),
  building: text('building'),
  floor: text('floor'),
  apartment: text('apartment'),
  landmark: text('landmark'),
  notes: text('notes'),
  visits: integer('visits').default(0),
  totalSpent: real('total_spent').default(0),
  loyaltyTier: text('loyalty_tier').default('Bronze'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== MENU ====================
export const menuCategories = pgTable('menu_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
});

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => menuCategories.id),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  price: real('price').notNull(),
  image: text('image'),
  isAvailable: boolean('is_available').default(true),
  preparationTime: integer('preparation_time'),
  isPopular: boolean('is_popular').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==================== ORDERS ====================
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // DINE_IN, TAKEAWAY, DELIVERY
  branchId: text('branch_id').references(() => branches.id),
  tableId: text('table_id'),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  deliveryAddress: text('delivery_address'),
  isCallCenterOrder: boolean('is_call_center_order').default(false),
  status: text('status').notNull(), // PENDING, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  subtotal: real('subtotal').notNull(),
  tax: real('tax').notNull(),
  total: real('total').notNull(),
  discount: real('discount').default(0),
  freeDelivery: boolean('free_delivery').default(false),
  isUrgent: boolean('is_urgent').default(false),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  kitchenNotes: text('kitchen_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id),
  menuItemId: text('menu_item_id').references(() => menuItems.id),
  name: text('name').notNull(),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  modifiers: json('modifiers'),
});

// ==================== INVENTORY ====================
export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  category: text('category'),
  quantity: real('quantity').default(0),
  threshold: real('threshold').default(0),
  costPrice: real('cost_price').default(0),
  supplierId: text('supplier_id'),
  warehouseId: text('warehouse_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==================== AUDIT LOGS ====================
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  userId: text('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  branchId: text('branch_id'),
  deviceId: text('device_id'),
  ipAddress: text('ip_address'),
  payload: json('payload'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 🔧 Step 4: Database Connection Config

Create file: `src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Database connection configuration
interface DBConfig {
  type: 'sqlite' | 'postgresql';
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
}

// Get config from environment or settings
const getDBConfig = (): DBConfig => {
  // This will later come from system settings
  return {
    type: 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'restoflow_erp',
    user: process.env.DB_USER || 'restoflow_user',
    password: process.env.DB_PASSWORD || 'your_password',
  };
};

// Create database connection
export const createDBConnection = () => {
  const config = getDBConfig();
  
  if (config.type === 'postgresql') {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });
    
    return drizzle(pool, { schema });
  }
  
  // SQLite fallback for local mode
  // TODO: Implement SQLite connection
  throw new Error('SQLite not implemented yet');
};

export const db = createDBConnection();
```

---

## 🔧 Step 5: Create .env File

Create file: `.env`

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restoflow_erp
DB_USER=restoflow_user
DB_PASSWORD=your_secure_password

# Full connection string (alternative)
DATABASE_URL=postgresql://restoflow_user:your_secure_password@localhost:5432/restoflow_erp
```

Add to `.gitignore`:
```
.env
.env.local
```

---

## 🔧 Step 6: Run Migrations

### Create Drizzle config file: `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Add scripts to package.json:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Run migrations:
```bash
npm run db:generate
npm run db:push
```

---

## 📋 Implementation Checklist

### Phase 1: Setup (Today)
- [ ] Install packages: `npm install drizzle-orm drizzle-kit pg @types/pg`
- [ ] Create PostgreSQL database and user
- [ ] Create `.env` file with credentials
- [ ] Create `src/db/schema.ts`
- [ ] Create `src/db/index.ts`
- [ ] Create `drizzle.config.ts`
- [ ] Run initial migration

### Phase 2: Integration
- [ ] Create database service layer (`src/services/database.ts`)
- [ ] Update stores to use database instead of Zustand persist
- [ ] Implement sync logic for offline-first architecture
- [ ] Add loading states and error handling

### Phase 3: Settings UI
- [ ] Add database settings page in Settings Hub
- [ ] Allow configuring database server IP/host
- [ ] Test connection button
- [ ] Switch between SQLite and PostgreSQL modes

---

## 🔗 Quick Commands Reference

```bash
# PostgreSQL - Connect via psql
psql -U restoflow_user -d restoflow_erp -h localhost

# Check connection
psql -U restoflow_user -d restoflow_erp -c "SELECT version();"

# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (GUI)
npm run db:studio
```

---

## 🎯 Next Steps

1. **Run this first:**
   ```bash
   npm install drizzle-orm drizzle-kit pg @types/pg dotenv
   ```

2. **Then setup PostgreSQL database using the SQL commands above**

3. **Create the files mentioned in this plan**

4. **Let me know when ready and I'll help implement the database service layer!**
