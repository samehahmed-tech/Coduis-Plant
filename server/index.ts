import app from './app';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const PORT = process.env.API_PORT || 3001;

// Global Pool setup for legacy components if needed, 
// though modular controllers use server/db/index.ts
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
});

app.listen(PORT, () => {
    console.log(`🚀 Restaurant ERP Backend - Production Modular Foundation - running on port ${PORT}`);
});
